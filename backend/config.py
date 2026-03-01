from pydantic_settings import BaseSettings
from typing import List, Dict, Any
from datetime import timedelta


class Settings(BaseSettings):
    API_PORT: int = 8000
    WEBSOCKET_PORT: int = 8000
    DATABASE_URL: str = "sqlite:///./manas_polymers.db"
    SIMULATION_SPEED: float = 1.0
    DEMO_MODE_ENABLED: bool = True
    DEMO_DRIFT_START_MINUTES: int = 2

    # Process parameters (PET preforms injection moulding defaults)
    NUM_CAVITIES: int = 48
    CYCLE_TIME_SEC: float = 10.0
    PRODUCTION_RATE: int = 360  # parts per hour

    # Tag normal ranges (mean, std_dev)
    TEMP_MEAN: float = 275.0  # °C
    TEMP_STD: float = 3.0
    MOULD_TEMP_MEAN: float = 35.0
    MOULD_TEMP_STD: float = 2.0
    INJECTION_PRESSURE_MEAN: float = 1200.0  # bar
    INJECTION_PRESSURE_STD: float = 80.0
    HOLD_PRESSURE_MEAN: float = 800.0
    HOLD_PRESSURE_STD: float = 60.0
    HOLD_TIME_MEAN: float = 2.5  # seconds
    HOLD_TIME_STD: float = 0.3
    SCREW_SPEED_MEAN: float = 80.0  # rpm
    SCREW_SPEED_STD: float = 5.0
    COOLING_TIME_MEAN: float = 6.0  # seconds
    COOLING_TIME_STD: float = 0.5
    DRYER_DEWPOINT_MEAN: float = -40.0  # °C
    DRYER_DEWPOINT_STD: float = 2.0
    CHILLER_TEMP_MEAN: float = 15.0
    CHILLER_TEMP_STD: float = 1.0

    # CTQ normal ranges (mean, std_dev)
    WEIGHT_MEAN: float = 22.5  # grams
    WEIGHT_STD: float = 0.3
    NECK_DIM_MEAN: float = 28.0  # mm
    NECK_DIM_STD: float = 0.1
    HAZE_MEAN: float = 5.0  # %
    HAZE_STD: float = 0.5

    # Reject rates
    BASE_REJECT_RATE: float = 0.02  # 2%
    DRIFT_REJECT_INCREASE: float = 0.05  # +5% during drift

    # Alert config
    ALERT_COOLDOWN: timedelta = timedelta(minutes=1)
    EWMA_WINDOW: int = 50
    CONTROL_LIMIT_SIGMA: int = 3
    CAVITY_RISK_THRESHOLD: float = 0.8

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

# Process steps for trajectory widget
PROCESS_STEPS: List[Dict[str, Any]] = [
    {"id": "dryer", "name": "Dryer", "x": 50, "y": 50, "status": "active"},
    {"id": "hopper", "name": "Hopper", "x": 150, "y": 50, "status": "active"},
    {"id": "injection", "name": "Injection", "x": 300, "y": 50, "status": "active"},
    {"id": "cooling", "name": "Cooling", "x": 450, "y": 50, "status": "active"},
    {"id": "qc", "name": "QC", "x": 600, "y": 50, "status": "active"},
    {"id": "packing", "name": "Packing", "x": 750, "y": 50, "status": "pending"},
]
