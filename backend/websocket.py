import json
import asyncio
from datetime import datetime
from typing import List
from fastapi import WebSocket, WebSocketDisconnect
from simulator import simulator
from digital_twin import digital_twin
from alert_engine import alert_engine


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.broadcast_task = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"Client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        print(f"Client disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        if not self.active_connections:
            return

        serialized = json.dumps(message, default=str)

        for connection in self.active_connections.copy():
            try:
                await connection.send_text(serialized)
            except Exception as e:
                print(f"Error sending message to client: {e}")
                self.disconnect(connection)

    async def start_broadcast(self, interval: int = 5):
        """Start periodic broadcast of snapshots"""
        while True:
            try:
                await self.send_snapshot()
                await asyncio.sleep(interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                import traceback
                print(f"Broadcast error: {e}")
                traceback.print_exc()
                await asyncio.sleep(1)

    async def send_snapshot(self):
        """Generate and broadcast snapshot"""
        try:
            snapshot = simulator.get_snapshot()

            # Detect drifts
            drifts = digital_twin.detect_process_drift(snapshot["tags"])
            snapshot["drifts"] = drifts

            # Calculate cavity risks
            cavity_risks = digital_twin.calculate_cavity_risks(snapshot["ctqs"])
            snapshot["cavity_risks"] = cavity_risks

            # Generate alerts
            alerts = alert_engine.generate_alerts(snapshot)
            snapshot["alerts"] = alerts

            # Calculate scrap risk
            scrap_risk = digital_twin.predict_scrap_risk(snapshot["tags"])
            snapshot["scrap_risk"] = scrap_risk

            # Update simulator time for next iteration
            simulator.update_time()

            await self.broadcast(snapshot)

        except Exception as e:
            import traceback
            print(f"Error generating snapshot: {e}")
            traceback.print_exc()


manager = ConnectionManager()


async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)

    try:
        # Send initial snapshot
        snapshot = simulator.get_snapshot()
        await websocket.send_json(snapshot, default=str)

        while True:
            data = await websocket.receive_text()
            # Handle client messages if needed (e.g., subscription changes)
            print(f"Received message: {data}")

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)
