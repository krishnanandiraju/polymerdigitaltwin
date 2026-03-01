import random
import time
import threading
from datetime import datetime, timedelta
from typing import List, Dict, Any
import numpy as np
from models import TagReading, CTQReading, DefectType
from config import settings


class DataSimulator:
    def __init__(self):
        self.current_time = datetime.now()
        self.start_time = self.current_time
        self.running = False
        self.demo_mode = settings.DEMO_MODE_ENABLED
        self.drift_start_time = self.start_time + timedelta(
            minutes=settings.DEMO_DRIFT_START_MINUTES
        )
        self.drift_introduced = False
        self.current_lot = self._generate_lot_number()

        # Mould cavity base offsets (random but consistent deviations)
        self.cavity_offsets = {
            i: {
                "weight": random.normalvariate(0, settings.WEIGHT_STD * 0.3),
                "neck_dim": random.normalvariate(0, settings.NECK_DIM_STD * 0.3),
                "haze": random.normalvariate(0, settings.HAZE_STD * 0.3),
            }
            for i in range(1, settings.NUM_CAVITIES + 1)
        }

        # Time-series history buffers
        self.tag_history: Dict[str, List[Dict]] = {
            "melt_temp": [],
            "mould_temp": [],
            "injection_pressure": [],
            "hold_pressure": [],
            "hold_time": [],
            "cycle_time": [],
            "screw_speed": [],
            "cooling_time": [],
            "dryer_dewpoint": [],
            "chiller_temp": [],
        }

        self.ctq_history: List[Dict] = []

        # Current tag values
        self.current_tags = {
            "melt_temp": settings.TEMP_MEAN,
            "mould_temp": settings.MOULD_TEMP_MEAN,
            "injection_pressure": settings.INJECTION_PRESSURE_MEAN,
            "hold_pressure": settings.HOLD_PRESSURE_MEAN,
            "hold_time": settings.HOLD_TIME_MEAN,
            "cycle_time": settings.CYCLE_TIME_SEC,
            "screw_speed": settings.SCREW_SPEED_MEAN,
            "cooling_time": settings.COOLING_TIME_MEAN,
            "dryer_dewpoint": settings.DRYER_DEWPOINT_MEAN,
            "chiller_temp": settings.CHILLER_TEMP_MEAN,
        }

    def _generate_lot_number(self) -> str:
        return f"MP-{datetime.now().strftime('%Y%m%d-%H%M%S')}"

    def _apply_drift(self):
        """Apply drift to process tags for demo scenario"""
        if not self.drift_introduced and self.current_time >= self.drift_start_time:
            self.drift_introduced = True
            print(f"[DEMO] Drift introduced at {self.current_time}")
            # Increase mould temp by 5°C (significant drift)
            self.current_tags["mould_temp"] += 5.0
            # Increase injection pressure variation
            self.current_tags["injection_pressure"] += 100.0
            # Slight cycle time increase
            self.current_tags["cycle_time"] += 1.5

    def generate_tag_readings(self) -> List[TagReading]:
        """Generate realistic tag readings with noise and drift"""
        readings = []

        for tag_name, base_value in self.current_tags.items():
            # Add random noise
            std_dev = getattr(settings, f"{tag_name.upper().replace(' ', '_')}_STD", 0.1)
            noise = random.normalvariate(0, std_dev * 0.3)
            value = base_value + noise

            # Add seasonal variation (small periodic fluctuation)
            period = 60  # seconds
            seasonal = 0.1 * std_dev * np.sin(2 * np.pi * self.current_time.timestamp() / period)
            value += seasonal

            # Apply demo drift
            self._apply_drift()

            reading = TagReading(
                timestamp=self.current_time,
                tag_name=tag_name,
                value=round(value, 2),
                unit="°C" if "temp" in tag_name else "bar" if "pressure" in tag_name else "rpm"
                if "speed" in tag_name else "s",
            )

            readings.append(reading)

            # Update history buffer (keep last 1000 readings)
            self.tag_history[tag_name].append({
                "timestamp": self.current_time,
                "value": value,
            })
            if len(self.tag_history[tag_name]) > 1000:
                self.tag_history[tag_name].pop(0)

        return readings

    def generate_ctq_readings(self) -> List[CTQReading]:
        """Generate cavity-wise CTQ readings with defects based on process tags"""
        readings = []

        for cavity in range(1, settings.NUM_CAVITIES + 1):
            # Get base CTQ values with cavity offsets
            weight = settings.WEIGHT_MEAN + self.cavity_offsets[cavity]["weight"]
            neck_dim = settings.NECK_DIM_MEAN + self.cavity_offsets[cavity]["neck_dim"]
            haze = settings.HAZE_MEAN + self.cavity_offsets[cavity]["haze"]

            # Add process tag influence on CTQs
            # Higher melt temp increases haze
            haze += (self.current_tags["melt_temp"] - settings.TEMP_MEAN) * 0.2

            # Higher injection pressure increases weight slightly
            weight += (self.current_tags["injection_pressure"] - settings.INJECTION_PRESSURE_MEAN) * 0.001

            # Higher mould temp affects dimensional stability (neck dimension)
            neck_dim += (self.current_tags["mould_temp"] - settings.MOULD_TEMP_MEAN) * 0.05

            # Add noise
            weight += random.normalvariate(0, settings.WEIGHT_STD * 0.3)
            neck_dim += random.normalvariate(0, settings.NECK_DIM_STD * 0.3)
            haze += random.normalvariate(0, settings.HAZE_STD * 0.3)

            reading = CTQReading(
                timestamp=self.current_time,
                cavity=cavity,
                weight=round(weight, 3),
                neck_dim=round(neck_dim, 3),
                haze=round(haze, 2),
                lot_id=self.current_lot,
            )

            readings.append(reading)

        return readings

    def generate_reject_events(self, ctq_readings: List[CTQReading]) -> List[Dict]:
        """Generate reject events based on CTQ thresholds and process conditions"""
        rejects = []

        base_reject_rate = settings.BASE_REJECT_RATE
        if self.drift_introduced:
            base_reject_rate += settings.DRIFT_REJECT_INCREASE

        for reading in ctq_readings:
            if random.random() < base_reject_rate:
                defect = self._determine_defect_type(reading)
                rejects.append({
                    "timestamp": self.current_time,
                    "cavity": reading.cavity,
                    "defect_type": defect,
                    "weight": reading.weight,
                    "neck_dim": reading.neck_dim,
                    "haze": reading.haze,
                    "lot_id": reading.lot_id,
                })

        return rejects

    def _determine_defect_type(self, reading: CTQReading) -> str:
        """Determine defect type based on process conditions"""
        # Short shot correlates with low injection pressure + short hold time + low melt temp
        if (self.current_tags["injection_pressure"] < settings.INJECTION_PRESSURE_MEAN - settings.INJECTION_PRESSURE_STD and
                self.current_tags["hold_time"] < settings.HOLD_TIME_MEAN - settings.HOLD_TIME_STD and
                self.current_tags["melt_temp"] < settings.TEMP_MEAN - settings.TEMP_STD):
            return DefectType.SHORT_SHOT

        # Flash correlates with high injection pressure + mould temp too high
        if (self.current_tags["injection_pressure"] > settings.INJECTION_PRESSURE_MEAN + settings.INJECTION_PRESSURE_STD and
                self.current_tags["mould_temp"] > settings.MOULD_TEMP_MEAN + settings.MOULD_TEMP_STD):
            return DefectType.FLASH

        # Haze correlates with moisture (dryer dew point) + melt temp instability
        if (self.current_tags["dryer_dewpoint"] > settings.DRYER_DEWPOINT_MEAN + settings.DRYER_DEWPOINT_STD and
                reading.haze > settings.HAZE_MEAN + 2 * settings.HAZE_STD):
            return DefectType.HAZE

        # Dimensional defects if neck dimension is out of spec
        if (reading.neck_dim < settings.NECK_DIM_MEAN - 2 * settings.NECK_DIM_STD or
                reading.neck_dim > settings.NECK_DIM_MEAN + 2 * settings.NECK_DIM_STD):
            return DefectType.DIMENSIONAL

        # Random other defects
        return random.choice([DefectType.FOREIGN_PARTICLE, DefectType.OTHER])

    def get_snapshot(self) -> Dict[str, Any]:
        """Get full snapshot including tags, CTQs, rejects, and lot info"""
        tag_readings = self.generate_tag_readings()
        ctq_readings = self.generate_ctq_readings()
        rejects = self.generate_reject_events(ctq_readings)

        # Calculate production rate and scrap percentage
        production_rate = settings.PRODUCTION_RATE
        scrap_percentage = len(rejects) / len(ctq_readings) * 100 if ctq_readings else 0

        # Apply cycle time slowdown during drift
        if self.drift_introduced:
            production_rate *= 0.9

        return {
            "timestamp": self.current_time,
            "line_status": "RUNNING" if self.current_time - self.start_time < timedelta(hours=8) else "IDLE",
            "production_rate": round(production_rate, 1),
            "scrap_percentage": round(scrap_percentage, 2),
            "tags": [r.dict() for r in tag_readings],
            "ctqs": [r.dict() for r in ctq_readings],
            "rejects": rejects,
            "lot_info": {
                "lot_number": self.current_lot,
                "start_time": self.start_time,
                "production_count": len(ctq_readings) * int((self.current_time - self.start_time).total_seconds() / settings.CYCLE_TIME_SEC),
                "scrap_count": len(rejects),
            },
        }

    def update_time(self, delta: float = None):
        """Update simulation time"""
        if delta is None:
            delta = settings.CYCLE_TIME_SEC / settings.SIMULATION_SPEED
        self.current_time += timedelta(seconds=delta)


# Global instance
simulator = DataSimulator()
