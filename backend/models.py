from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from config import settings


# Database setup
engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class AlertSeverity(str, Enum):
    INFO = "INFO"
    WARN = "WARN"
    CRITICAL = "CRITICAL"


class AlertStatus(str, Enum):
    ACTIVE = "ACTIVE"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"


class DefectType(str, Enum):
    SHORT_SHOT = "SHORT_SHOT"
    FLASH = "FLASH"
    HAZE = "HAZE"
    FOREIGN_PARTICLE = "FOREIGN_PARTICLE"
    DIMENSIONAL = "DIMENSIONAL"
    OTHER = "OTHER"


class ProcessStep(str, Enum):
    DRYER = "DRYER"
    HOPPER = "HOPPER"
    INJECTION = "INJECTION"
    COOLING = "COOLING"
    QC = "QC"
    PACKING = "PACKING"


class Machine(Base):
    __tablename__ = "machines"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    line_id = Column(String, index=True)
    status = Column(String, default="RUNNING")
    uptime = Column(Float, default=0.0)
    downtime = Column(Float, default=0.0)


class Mould(Base):
    __tablename__ = "moulds"
    id = Column(String, primary_key=True, index=True)
    machine_id = Column(String, ForeignKey("machines.id"))
    num_cavities = Column(Integer, default=48)
    active = Column(Boolean, default=True)


class Recipe(Base):
    __tablename__ = "recipes"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    machine_id = Column(String, ForeignKey("machines.id"))
    setpoints = Column(String)  # JSON string
    active = Column(Boolean, default=True)


class ProductionLot(Base):
    __tablename__ = "production_lots"
    id = Column(String, primary_key=True, index=True)
    lot_number = Column(String, index=True)
    resin_type = Column(String, default="PET")
    target_quantity = Column(Integer)
    actual_quantity = Column(Integer, default=0)
    scrap_quantity = Column(Integer, default=0)
    start_time = Column(DateTime)
    end_time = Column(DateTime, nullable=True)
    current_step = Column(String, default="DRYER")


class Alert(Base):
    __tablename__ = "alerts"
    id = Column(String, primary_key=True, index=True)
    severity = Column(String, default=AlertSeverity.WARN)
    status = Column(String, default=AlertStatus.ACTIVE)
    title = Column(String)
    description = Column(String)
    entity_id = Column(String)
    entity_type = Column(String)
    action_hint = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    acknowledged_at = Column(DateTime, nullable=True)
    acknowledged_by = Column(String, nullable=True)
    acknowledged_note = Column(String, nullable=True)
    resolved_at = Column(DateTime, nullable=True)


class RejectEvent(Base):
    __tablename__ = "reject_events"
    id = Column(String, primary_key=True, index=True)
    lot_id = Column(String, ForeignKey("production_lots.id"))
    cavity = Column(Integer)
    defect_type = Column(String)
    weight = Column(Float, nullable=True)
    neck_dim = Column(Float, nullable=True)
    haze = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)


# Pydantic Models for API


class TagReading(BaseModel):
    timestamp: datetime
    tag_name: str
    value: float
    unit: str
    machine_id: str = "MP-LINE-1"


class CTQReading(BaseModel):
    timestamp: datetime
    cavity: int
    weight: float
    neck_dim: float
    haze: float
    lot_id: str


class SnapshotResponse(BaseModel):
    timestamp: datetime
    line_status: str
    production_rate: float
    scrap_percentage: float
    tags: List[TagReading]
    ctqs: List[CTQReading]
    alerts: List[Dict[str, Any]]
    cavity_risks: List[Dict[str, Any]]


class TrendQuery(BaseModel):
    tag_names: List[str]
    start_time: datetime
    end_time: datetime


class TrendResponse(BaseModel):
    tag_name: str
    readings: List[TagReading]
    setpoint: float
    lower_limit: float
    upper_limit: float


class AlertCreate(BaseModel):
    severity: AlertSeverity
    title: str
    description: str
    entity_id: str
    entity_type: str
    action_hint: str


class AlertAcknowledge(BaseModel):
    alert_id: str
    acknowledged_by: str
    acknowledged_note: Optional[str]


class ReportConfig(BaseModel):
    start_time: datetime
    end_time: datetime
    report_type: str = "shift"


class CavityRisk(BaseModel):
    cavity: int
    risk_score: float
    rejected_count: int
    defect_types: List[str]


class LotTrajectory(BaseModel):
    lot_id: str
    current_step: str
    step_history: List[Dict[str, Any]]
