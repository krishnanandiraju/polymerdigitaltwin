from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from models import (
    SnapshotResponse,
    TrendQuery,
    TrendResponse,
    AlertCreate,
    AlertAcknowledge,
    ReportConfig,
    CavityRisk,
)
from simulator import simulator
from digital_twin import digital_twin
from alert_engine import alert_engine
from config import settings


router = APIRouter(prefix="/api", tags=["api"])


@router.get("/snapshot", summary="Get current snapshot", response_model=SnapshotResponse)
async def get_snapshot():
    """Get current snapshot including tags, CTQs, alerts, and cavity risks"""
    try:
        print("[DEBUG] Getting snapshot from simulator...")
        snapshot = simulator.get_snapshot()
        print(f"[DEBUG] Snapshot received with {len(snapshot.get('tags', []))} tags")

        # Detect drifts
        print("[DEBUG] Detecting process drift...")
        drifts = digital_twin.detect_process_drift(snapshot["tags"])
        snapshot["drifts"] = drifts
        print(f"[DEBUG] Found {len(drifts)} drifts")

        # Calculate cavity risks
        print("[DEBUG] Calculating cavity risks...")
        cavity_risks = digital_twin.calculate_cavity_risks(snapshot["ctqs"])
        snapshot["cavity_risks"] = cavity_risks
        print(f"[DEBUG] Calculated {len(cavity_risks)} cavity risks")

        # Generate alerts
        print("[DEBUG] Generating alerts...")
        alerts = alert_engine.generate_alerts(snapshot)
        snapshot["alerts"] = alerts
        print(f"[DEBUG] Generated {len(alerts)} alerts")

        # Calculate scrap risk
        print("[DEBUG] Calculating scrap risk...")
        scrap_risk = digital_twin.predict_scrap_risk(snapshot["tags"])
        snapshot["scrap_risk"] = scrap_risk
        print(f"[DEBUG] Scrap risk: {scrap_risk}")

        # Convert CavityRisk objects to dicts for JSON serialization
        snapshot["cavity_risks"] = [
            {
                "cavity": cr.cavity,
                "risk_score": cr.risk_score,
                "rejected_count": cr.rejected_count,
                "defect_types": cr.defect_types
            } if hasattr(cr, 'cavity') else cr
            for cr in snapshot["cavity_risks"]
        ]

        print("[DEBUG] Snapshot complete!")
        return snapshot
    except Exception as e:
        import traceback
        print(f"[ERROR] Error in get_snapshot: {e}")
        traceback.print_exc()
        raise


@router.get("/trend/{tag_name}", summary="Get tag trend data")
async def get_trend(
    tag_name: str,
    start_time: datetime = Query(
        default_factory=lambda: datetime.now() - timedelta(hours=1),
        description="Start time (ISO format)"
    ),
    end_time: datetime = Query(
        default_factory=datetime.now,
        description="End time (ISO format)"
    )
):
    """Get trend data for a specific tag with control limits"""
    if tag_name not in simulator.tag_history:
        return {"error": f"Tag '{tag_name}' not found"}

    # Get tag history from simulator (in a real system, this would query a time-series DB)
    history = simulator.tag_history[tag_name]

    # Filter by time range
    filtered = [r for r in history if start_time <= r["timestamp"] <= end_time]

    if not filtered:
        return {"error": "No data in specified time range"}

    limits = digital_twin.control_limits.get(tag_name)
    if not limits:
        # Default limits if not configured
        values = [r["value"] for r in filtered]
        mean = sum(values) / len(values)
        std = (sum((x - mean) ** 2 for x in values) / len(values)) ** 0.5
        limits = {
            "setpoint": mean,
            "lower": mean - 3 * std,
            "upper": mean + 3 * std,
        }

    return {
        "tag_name": tag_name,
        "readings": [
            {
                "timestamp": r["timestamp"],
                "value": r["value"]
            }
            for r in filtered
        ],
        "limits": limits
    }


@router.get("/trend/multi", summary="Get multiple tag trends")
async def get_multi_trend(
    tag_names: str = Query(..., description="Comma-separated tag names"),
    start_time: datetime = Query(
        default_factory=lambda: datetime.now() - timedelta(hours=1),
        description="Start time (ISO format)"
    ),
    end_time: datetime = Query(
        default_factory=datetime.now,
        description="End time (ISO format)"
    )
):
    """Get trend data for multiple tags with control limits"""
    tags = tag_names.split(",")
    results = []

    for tag_name in tags:
        tag_name = tag_name.strip()
        if tag_name not in simulator.tag_history:
            continue

        history = simulator.tag_history[tag_name]
        filtered = [r for r in history if start_time <= r["timestamp"] <= end_time]

        if filtered:
            limits = digital_twin.control_limits.get(tag_name)
            if not limits:
                values = [r["value"] for r in filtered]
                mean = sum(values) / len(values)
                std = (sum((x - mean) ** 2 for x in values) / len(values)) ** 0.5
                limits = {
                    "setpoint": mean,
                    "lower": mean - 3 * std,
                    "upper": mean + 3 * std,
                }

            results.append({
                "tag_name": tag_name,
                "readings": [
                    {
                        "timestamp": r["timestamp"],
                        "value": r["value"]
                    }
                    for r in filtered
                ],
                "limits": limits
            })

    return {"tags": results}


@router.get("/alerts/active", summary="Get active alerts")
async def get_active_alerts():
    """Get all active alerts"""
    alerts = alert_engine.get_active_alerts()
    return {"alerts": alerts}


@router.get("/alerts/history", summary="Get alert history")
async def get_alert_history(
    start_time: datetime = Query(
        default_factory=lambda: datetime.now() - timedelta(hours=8),
        description="Start time (ISO format)"
    ),
    end_time: datetime = Query(
        default_factory=datetime.now,
        description="End time (ISO format)"
    )
):
    """Get alert history"""
    history = alert_engine.get_alert_history(start_time, end_time)
    return {"alerts": history}


@router.post("/alerts/acknowledge", summary="Acknowledge alert")
async def acknowledge_alert(request: AlertAcknowledge):
    """Acknowledge an alert"""
    success = alert_engine.acknowledge_alert(
        request.alert_id,
        request.acknowledged_by,
        request.acknowledged_note
    )
    if success:
        return {"success": True}
    else:
        return {"error": "Alert not found"}, 404


@router.get("/cavity/risks", summary="Get cavity risk scores")
async def get_cavity_risks():
    """Get cavity risk scores sorted by risk"""
    ctqs = simulator.generate_ctq_readings()
    risks = digital_twin.calculate_cavity_risks(ctqs)
    return {"risks": [r.dict() for r in risks]}


@router.get("/defects/breakdown", summary="Get defect breakdown")
async def get_defect_breakdown():
    """Get defect type breakdown"""
    # In a real system, this would query reject events
    return {
        "defects": [
            {"type": "SHORT_SHOT", "count": 15, "percentage": 30},
            {"type": "FLASH", "count": 12, "percentage": 24},
            {"type": "HAZE", "count": 10, "percentage": 20},
            {"type": "DIMENSIONAL", "count": 8, "percentage": 16},
            {"type": "FOREIGN_PARTICLE", "count": 5, "percentage": 10},
        ]
    }


@router.get("/line/info", summary="Get line information")
async def get_line_info():
    """Get line status and basic information"""
    return {
        "line_id": "MP-LINE-1",
        "name": "Main Production Line",
        "status": "RUNNING",
        "recipe": "PET-Preform-500ml",
        "uptime": 98.5,
        "downtime": 1.5
    }
