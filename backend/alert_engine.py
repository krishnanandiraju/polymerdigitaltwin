import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from models import AlertCreate, AlertStatus, AlertSeverity
from digital_twin import digital_twin
from simulator import simulator
from config import settings


class AlertEngine:
    def __init__(self):
        self.active_alerts: Dict[str, Dict] = {}
        self.alert_history: List[Dict] = []
        self.cooldown_period = settings.ALERT_COOLDOWN

    def _generate_alert_id(self, alert_type: str, entity_id: str) -> str:
        """Generate unique alert ID based on type and entity"""
        return f"{alert_type}-{entity_id}-{uuid.uuid4().hex[:8]}"

    def _is_cooldown_active(self, alert_type: str, entity_id: str) -> bool:
        """Check if cooldown period is active for alert type and entity"""
        for alert_id, alert in self.active_alerts.items():
            if alert["alert_type"] == alert_type and alert["entity_id"] == entity_id:
                if datetime.now() - alert["timestamp"] < self.cooldown_period:
                    return True
        return False

    def _deduplicate_alert(self, existing_alert: Dict, new_alert: Dict) -> Dict:
        """Update existing alert with new information instead of creating new"""
        existing_alert["last_updated"] = datetime.now()
        existing_alert["occurrences"] = existing_alert.get("occurrences", 1) + 1
        existing_alert["value"] = new_alert["value"]

        # Only increase severity if new severity is higher
        if new_alert["severity"] == AlertSeverity.CRITICAL and existing_alert["severity"] != AlertSeverity.CRITICAL:
            existing_alert["severity"] = AlertSeverity.CRITICAL
            existing_alert["acknowledged"] = False

        return existing_alert

    def _detect_tag_alerts(self, drifts: List[Dict]) -> List[Dict]:
        """Generate alerts from detected drifts"""
        alerts = []

        for drift in drifts:
            alert_type = f"DRIFT-{drift['tag']}"
            entity_id = "MP-LINE-1"  # Single line for MVP

            # Check cooldown
            if self._is_cooldown_active(alert_type, entity_id):
                continue

            # Check for existing active alert
            existing = None
            for alert_id, alert in self.active_alerts.items():
                if alert["alert_type"] == alert_type and alert["entity_id"] == entity_id:
                    existing = alert
                    break

            alert_data = {
                "alert_id": existing["alert_id"] if existing else self._generate_alert_id(alert_type, entity_id),
                "alert_type": alert_type,
                "severity": drift["severity"],
                "title": f"{drift['tag']} Drift",
                "description": f"{drift['tag']} {drift['direction']}: Current value {drift['value']:.2f} (EWMA: {drift['ewma']:.2f})",
                "entity_id": entity_id,
                "entity_type": "LINE",
                "action_hint": digital_twin.suggest_action([drift]),
                "value": drift["value"],
                "timestamp": datetime.now(),
                "acknowledged": False,
                "occurrences": 1,
                "limits": drift["limits"],
            }

            if existing:
                self.active_alerts[existing["alert_id"]] = self._deduplicate_alert(existing, alert_data)
                alerts.append(self.active_alerts[existing["alert_id"]])
            else:
                self.active_alerts[alert_data["alert_id"]] = alert_data
                alerts.append(alert_data)

        return alerts

    def _detect_cavity_alerts(self, cavity_risks: List[Dict]) -> List[Dict]:
        """Generate alerts from high-risk cavities"""
        alerts = []

        high_risk_cavities = [c for c in cavity_risks if c.risk_score > settings.CAVITY_RISK_THRESHOLD]

        for cavity in high_risk_cavities:
            alert_type = "CAVITY-RISK"
            entity_id = f"CAVITY-{cavity.cavity}"

            if self._is_cooldown_active(alert_type, entity_id):
                continue

            alert_data = {
                "alert_id": self._generate_alert_id(alert_type, entity_id),
                "alert_type": alert_type,
                "severity": AlertSeverity.WARN,
                "title": f"Cavity {cavity.cavity} Risk",
                "description": f"Cavity {cavity.cavity} has high risk score ({cavity.risk_score:.2f}) with {cavity.rejected_count} rejects",
                "entity_id": entity_id,
                "entity_type": "CAVITY",
                "action_hint": "Check cavity for wear, verify temperature uniformity, check for contamination",
                "cavity": cavity.cavity,
                "risk_score": cavity.risk_score,
                "timestamp": datetime.now(),
                "acknowledged": False,
                "occurrences": 1,
            }

            self.active_alerts[alert_data["alert_id"]] = alert_data
            alerts.append(alert_data)

        return alerts

    def _detect_scrap_alerts(self, scrap_percentage: float) -> List[Dict]:
        """Generate alerts for high scrap percentage"""
        alerts = []

        if scrap_percentage > 5.0:  # 5% scrap threshold
            alert_type = "SCRAP-HIGH"
            entity_id = "MP-LINE-1"

            if not self._is_cooldown_active(alert_type, entity_id):
                alert_data = {
                    "alert_id": self._generate_alert_id(alert_type, entity_id),
                    "alert_type": alert_type,
                    "severity": AlertSeverity.CRITICAL if scrap_percentage > 10 else AlertSeverity.WARN,
                    "title": f"High Scrap Rate ({scrap_percentage:.1f}%)",
                    "description": f"Current scrap rate {scrap_percentage:.1f}% exceeds target threshold",
                    "entity_id": entity_id,
                    "entity_type": "LINE",
                    "action_hint": "Check for process drift, inspect mould cavities, verify resin quality",
                    "scrap_percentage": scrap_percentage,
                    "timestamp": datetime.now(),
                    "acknowledged": False,
                    "occurrences": 1,
                }

                self.active_alerts[alert_data["alert_id"]] = alert_data
                alerts.append(alert_data)

        return alerts

    def _update_resolved_alerts(self, current_alert_ids: List[str]):
        """Mark alerts as resolved if they're no longer present in current readings"""
        resolved = []
        for alert_id, alert in list(self.active_alerts.items()):
            if alert_id not in current_alert_ids:
                alert["status"] = AlertStatus.RESOLVED
                alert["resolved_at"] = datetime.now()
                self.alert_history.append(alert)
                del self.active_alerts[alert_id]
                resolved.append(alert)
        return resolved

    def generate_alerts(self, snapshot: Dict) -> List[Dict]:
        """Main alert generation pipeline"""
        all_alerts = []

        # Detect tag drift alerts
        tag_alerts = self._detect_tag_alerts(snapshot.get("drifts", []))
        all_alerts.extend(tag_alerts)

        # Detect cavity risk alerts
        cavity_alerts = self._detect_cavity_alerts(snapshot.get("cavity_risks", []))
        all_alerts.extend(cavity_alerts)

        # Detect scrap rate alerts
        scrap_alerts = self._detect_scrap_alerts(snapshot.get("scrap_percentage", 0))
        all_alerts.extend(scrap_alerts)

        # Update resolved alerts
        self._update_resolved_alerts([a["alert_id"] for a in all_alerts])

        return all_alerts

    def acknowledge_alert(self, alert_id: str, user: str, note: Optional[str] = None) -> bool:
        """Acknowledge an active alert"""
        if alert_id in self.active_alerts:
            self.active_alerts[alert_id]["acknowledged"] = True
            self.active_alerts[alert_id]["acknowledged_by"] = user
            self.active_alerts[alert_id]["acknowledged_note"] = note
            self.active_alerts[alert_id]["acknowledged_at"] = datetime.now()
            return True

        # Check if it's in history (already resolved)
        for alert in self.alert_history:
            if alert["alert_id"] == alert_id and alert.get("status") == AlertStatus.RESOLVED:
                alert["acknowledged"] = True
                alert["acknowledged_by"] = user
                alert["acknowledged_note"] = note
                alert["acknowledged_at"] = datetime.now()
                return True

        return False

    def get_active_alerts(self) -> List[Dict]:
        """Get all active alerts"""
        return list(self.active_alerts.values())

    def get_alert_history(self, start_time: Optional[datetime] = None,
                          end_time: Optional[datetime] = None) -> List[Dict]:
        """Get alert history"""
        history = self.alert_history.copy()
        if start_time:
            history = [a for a in history if a["timestamp"] >= start_time]
        if end_time:
            history = [a for a in history if a["timestamp"] <= end_time]
        return history


alert_engine = AlertEngine()
