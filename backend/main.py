import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from config import settings
from models import Base, engine
from api.endpoints import router as api_router
from api.reports import router as reports_router
from websocket import websocket_endpoint, manager
from simulator import simulator


# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Manas Polymers Digital Twin API",
    description="API for PET Preforms Injection Moulding Digital Twin and Reporting Wall",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Start background tasks on app startup"""
    # Don't start broadcast on startup - let it start when clients connect
    import sys
    import traceback
    print("=" * 80)
    print("Digital Twin server started")
    print(f"Python version: {sys.version}")
    print(f"Stack trace:")
    traceback.print_stack()
    print("=" * 80)


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on app shutdown"""
    import sys
    import traceback
    print("=" * 80)
    print("SHUTDOWN EVENT TRIGGERED!")
    print("Stack trace:")
    traceback.print_stack()
    print("=" * 80)
    if manager.broadcast_task:
        manager.broadcast_task.cancel()
    print("Digital Twin server stopped")


# Include API routers
app.include_router(api_router)
app.include_router(reports_router)


@app.get("/", summary="Health check")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": simulator.current_time,
        "simulation_mode": "DEMO" if settings.DEMO_MODE_ENABLED else "PRODUCTION",
        "drift_introduced": simulator.drift_introduced
    }


@app.websocket("/ws")
async def websocket_route(websocket: WebSocket):
    """WebSocket endpoint for real-time data streaming"""
    await websocket_endpoint(websocket)


@app.get("/health", summary="Health check with detailed info")
async def detailed_health_check():
    """Detailed health check endpoint"""
    snapshot = simulator.get_snapshot()
    active_alerts = manager.active_connections

    return {
        "status": "healthy",
        "timestamp": simulator.current_time,
        "simulation_mode": "DEMO" if settings.DEMO_MODE_ENABLED else "PRODUCTION",
        "drift_introduced": simulator.drift_introduced,
        "connected_clients": len(active_alerts),
        "line_status": snapshot["line_status"],
        "scrap_percentage": snapshot["scrap_percentage"]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.API_PORT,
        reload=True,
        log_level="info"
    )
