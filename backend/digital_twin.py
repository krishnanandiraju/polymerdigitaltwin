import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from models import AlertCreate, AlertSeverity, CavityRisk, DefectType
from simulator import simulator
from config import settings


class DigitalTwinEngine:
    def __init__(self):
        self.ewma_history: Dict[str, List[Dict]] = {
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
            "weight": [],
            "neck_dim": [],
            "haze": [],
        }

        self.cavity_score_history: Dict[int, List[Dict]] = {
            cavity: [] for cavity in range(1, settings.NUM_CAVITIES + 1)
        }

        # Control limits (setpoints ± 3σ)
        self.control_limits: Dict[str, Dict[str, float]] = {
            "melt_temp": {
                "setpoint": settings.TEMP_MEAN,
                "lower": settings.TEMP_MEAN - 3 * settings.TEMP_STD,
                "upper": settings.TEMP_MEAN + 3 * settings.TEMP_STD,
            },
            "mould_temp": {
                "setpoint": settings.MOULD_TEMP_MEAN,
                "lower": settings.MOULD_TEMP_MEAN - 3 * settings.MOULD_TEMP_STD,
                "upper": settings.MOULD_TEMP_MEAN + 3 * settings.MOULD_TEMP_STD,
            },
            "injection_pressure": {
                "setpoint": settings.INJECTION_PRESSURE_MEAN,
                "lower": settings.INJECTION_PRESSURE_MEAN - 3 * settings.INJECTION_PRESSURE_STD,
                "upper": settings.INJECTION_PRESSURE_MEAN + 3 * settings.INJECTION_PRESSURE_STD,
            },
            "hold_pressure": {
                "setpoint": settings.HOLD_PRESSURE_MEAN,
                "lower": settings.HOLD_PRESSURE_MEAN - 3 * settings.HOLD_PRESSURE_STD,
                "upper": settings.HOLD_PRESSURE_MEAN + 3 * settings.HOLD_PRESSURE_STD,
            },
            "hold_time": {
                "setpoint": settings.HOLD_TIME_MEAN,
                "lower": settings.HOLD_TIME_MEAN - 3 * settings.HOLD_TIME_STD,
                "upper": settings.HOLD_TIME_MEAN + 3 * settings.HOLD_TIME_STD,
            },
            "cycle_time": {
                "setpoint": settings.CYCLE_TIME_SEC,
                "lower": settings.CYCLE_TIME_SEC - 3 * 0.5,
                "upper": settings.CYCLE_TIME_SEC + 3 * 0.5,
            },
            "screw_speed": {
                "setpoint": settings.SCREW_SPEED_MEAN,
                "lower": settings.SCREW_SPEED_MEAN - 3 * settings.SCREW_SPEED_STD,
                "upper": settings.SCREW_SPEED_MEAN + 3 * settings.SCREW_SPEED_STD,
            },
            "cooling_time": {
                "setpoint": settings.COOLING_TIME_MEAN,
                "lower": settings.COOLING_TIME_MEAN - 3 * settings.COOLING_TIME_STD,
                "upper": settings.COOLING_TIME_MEAN + 3 * settings.COOLING_TIME_STD,
            },
            "dryer_dewpoint": {
                "setpoint": settings.DRYER_DEWPOINT_MEAN,
                "lower": settings.DRYER_DEWPOINT_MEAN - 3 * settings.DRYER_DEWPOINT_STD,
                "upper": settings.DRYER_DEWPOINT_MEAN + 3 * settings.DRYER_DEWPOINT_STD,
            },
            "chiller_temp": {
                "setpoint": settings.CHILLER_TEMP_MEAN,
                "lower": settings.CHILLER_TEMP_MEAN - 3 * settings.CHILLER_TEMP_STD,
                "upper": settings.CHILLER_TEMP_MEAN + 3 * settings.CHILLER_TEMP_STD,
            },
            "weight": {
                "setpoint": settings.WEIGHT_MEAN,
                "lower": settings.WEIGHT_MEAN - 3 * settings.WEIGHT_STD,
                "upper": settings.WEIGHT_MEAN + 3 * settings.WEIGHT_STD,
            },
            "neck_dim": {
                "setpoint": settings.NECK_DIM_MEAN,
                "lower": settings.NECK_DIM_MEAN - 3 * settings.NECK_DIM_STD,
                "upper": settings.NECK_DIM_MEAN + 3 * settings.NECK_DIM_STD,
            },
            "haze": {
                "setpoint": settings.HAZE_MEAN,
                "lower": settings.HAZE_MEAN - 3 * settings.HAZE_STD,
                "upper": settings.HAZE_MEAN + 3 * settings.HAZE_STD,
            },
        }

    def _calculate_ewma(self, tag_name: str, value: float, timestamp: datetime, smoothing: float = 0.2) -> Dict:
        """Calculate Exponentially Weighted Moving Average"""
        history = self.ewma_history[tag_name]

        if not history:
            ewma = value
            ewma_std = 0
        else:
            prev_ewma = history[-1]["ewma"]
            ewma = smoothing * value + (1 - smoothing) * prev_ewma
            # Calculate standard deviation of recent readings
            recent_values = [h["value"] for h in history[-min(20, len(history)):]] + [value]
            ewma_std = np.std(recent_values)

        ewma_data = {
            "timestamp": timestamp,
            "value": value,
            "ewma": round(ewma, 3),
            "ewma_std": round(ewma_std, 3),
        }

        history.append(ewma_data)
        if len(history) > settings.EWMA_WINDOW:
            history.pop(0)

        return ewma_data

    def _detect_ctq_drift(self, tag_name: str, value: float, timestamp: datetime) -> Optional[Dict]:
        """Detect CTQ drift using EWMA and control limits"""
        limits = self.control_limits[tag_name]
        ewma_data = self._calculate_ewma(tag_name, value, timestamp)

        # Check if EWMA crosses control limits
        if ewma_data["ewma"] < limits["lower"] or ewma_data["ewma"] > limits["upper"]:
            direction = "LOW" if ewma_data["ewma"] < limits["lower"] else "HIGH"
            deviation = abs((ewma_data["ewma"] - limits["setpoint"]) / limits["setpoint"] * 100)
            severity = AlertSeverity.CRITICAL if deviation > 10 else AlertSeverity.WARN

            return {
                "tag": tag_name,
                "value": value,
                "ewma": ewma_data["ewma"],
                "direction": direction,
                "deviation": deviation,
                "severity": severity,
                "limits": limits,
            }

        return None

    def _calculate_cavity_risk(self, cavity: int, ctq_reading: Dict) -> float:
        """Calculate risk score for a specific cavity"""
        weight = ctq_reading["weight"]
        neck_dim = ctq_reading["neck_dim"]
        haze = ctq_reading["haze"]

        # Calculate z-scores for each CTQ
        weight_z = (weight - settings.WEIGHT_MEAN) / settings.WEIGHT_STD
        neck_z = (neck_dim - settings.NECK_DIM_MEAN) / settings.NECK_DIM_STD
        haze_z = (haze - settings.HAZE_MEAN) / settings.HAZE_STD

        # Weight each CTQ contribution (weight is most important for scrap)
        risk_score = (
            (abs(weight_z) * 0.4) +
            (abs(neck_z) * 0.3) +
            (abs(haze_z) * 0.2) +
            (abs(haze_z * weight_z) * 0.1)  # Interaction term for haze and weight
        )

        return min(risk_score, 1.0)

    def calculate_cavity_risks(self, ctq_readings: List[Dict]) -> List[CavityRisk]:
        """Calculate risk scores for all cavities"""
        risks = []

        for reading in ctq_readings:
            cavity = reading["cavity"]
            risk_score = self._calculate_cavity_risk(cavity, reading)

            # Update cavity history
            self.cavity_score_history[cavity].append({
                "timestamp": reading["timestamp"],
                "risk_score": risk_score,
                "weight": reading["weight"],
                "neck_dim": reading["neck_dim"],
                "haze": reading["haze"],
            })

            if len(self.cavity_score_history[cavity]) > 100:
                self.cavity_score_history[cavity].pop(0)

            # Get recent rejected count and defect types from history
            rejected_count = sum(1 for h in self.cavity_score_history[cavity] if h["risk_score"] > 0.8)
            defect_types = []
            # TODO: Track defect types per cavity

            risks.append(CavityRisk(
                cavity=cavity,
                risk_score=round(risk_score, 3),
                rejected_count=rejected_count,
                defect_types=defect_types,
            ))

        # Sort by risk score descending
        return sorted(risks, key=lambda x: x.risk_score, reverse=True)

    def detect_process_drift(self, tag_readings: List[Dict]) -> List[Dict]:
        """Detect process tag drift using EWMA and control limits"""
        drifts = []

        for reading in tag_readings:
            tag_name = reading["tag_name"]
            value = reading["value"]
            timestamp = reading["timestamp"]

            drift = self._detect_ctq_drift(tag_name, value, timestamp)
            if drift:
                drifts.append(drift)

        return drifts

    def predict_scrap_risk(self, tag_readings: List[Dict]) -> float:
        """Predict scrap risk score (0-1) based on current tag values"""
        risk_score = 0.0

        readings_dict = {r["tag_name"]: r["value"] for r in tag_readings}

        # Temperature drift risk
        if "melt_temp" in readings_dict:
            temp_z = (readings_dict["melt_temp"] - settings.TEMP_MEAN) / settings.TEMP_STD
            risk_score += abs(temp_z) * 0.25

        # Pressure variation risk
        if "injection_pressure" in readings_dict:
            pressure_z = (readings_dict["injection_pressure"] - settings.INJECTION_PRESSURE_MEAN) / settings.INJECTION_PRESSURE_STD
            risk_score += abs(pressure_z) * 0.2

        # Cycle time variation risk
        if "cycle_time" in readings_dict:
            cycle_z = (readings_dict["cycle_time"] - settings.CYCLE_TIME_SEC) / 0.5
            risk_score += abs(cycle_z) * 0.15

        # Dryer dew point (moisture) risk
        if "dryer_dewpoint" in readings_dict:
            dew_z = (readings_dict["dryer_dewpoint"] - settings.DRYER_DEWPOINT_MEAN) / settings.DRYER_DEWPOINT_STD
            risk_score += abs(dew_z) * 0.15

        # Mould temperature risk
        if "mould_temp" in readings_dict:
            mould_z = (readings_dict["mould_temp"] - settings.MOULD_TEMP_MEAN) / settings.MOULD_TEMP_STD
            risk_score += abs(mould_z) * 0.15

        # Normalize to 0-1 range
        return min(risk_score / 3.0, 1.0)

    def suggest_action(self, drifts: List[Dict]) -> str:
        """Suggest operator actions based on detected drifts"""
        if not drifts:
            return "All process parameters within control limits. Continue monitoring."

        # Analyze most severe drift
        most_severe = sorted(drifts, key=lambda x: x["severity"] == AlertSeverity.CRITICAL, reverse=True)[0]

        tag_map = {
            "melt_temp": "Melt Temperature",
            "mould_temp": "Mould Temperature",
            "injection_pressure": "Injection Pressure",
            "cycle_time": "Cycle Time",
            "weight": "Preform Weight",
            "neck_dim": "Neck Dimension",
            "haze": "Haze",
        }

        direction = most_severe["direction"].lower()

        suggestions = {
            "melt_temp": {
                "low": "Melt temp low: Check heater zones, verify thermocouple calibration, adjust barrel temperature profile.",
                "high": "Melt temp high: Reduce barrel temperature, check cooling fan operation, adjust screw speed.",
            },
            "mould_temp": {
                "low": "Mould temp low: Increase temperature controller setpoint, check water flow to mould zones.",
                "high": "Mould temp high: Decrease temperature controller setpoint, check cooling water pressure and temperature.",
            },
            "injection_pressure": {
                "low": "Injection pressure low: Check hydraulic system pressure, verify pressure transducer, adjust injection profile.",
                "high": "Injection pressure high: Check for clogged nozzle or sprue, verify mould alignment, adjust injection profile.",
            },
            "cycle_time": {
                "low": "Cycle time short: Check cooling time, verify mould open/close speed settings.",
                "high": "Cycle time long: Check cooling water flow, verify mould cooling channels, check for mechanical issues.",
            },
            "weight": {
                "low": "Weight low: Increase injection volume, adjust hold pressure profile.",
                "high": "Weight high: Decrease injection volume, verify cavity pressure control.",
            },
            "neck_dim": {
                "low": "Neck dimension low: Adjust injection pressure profile, verify mould temperature uniformity.",
                "high": "Neck dimension high: Adjust mould temperature, check injection speed profile.",
            },
            "haze": {
                "low": "Haze low: Check for contamination, verify resin drying conditions.",
                "high": "Haze high: Check dryer dew point, verify melt temperature uniformity, check for moisture in resin.",
            },
        }

        tag = most_severe["tag"]
        if tag in suggestions and direction in suggestions[tag]:
            return suggestions[tag][direction]

        return f"{tag_map.get(tag, tag)} drifting {direction}: Please check process parameters immediately."


digital_twin = DigitalTwinEngine()
