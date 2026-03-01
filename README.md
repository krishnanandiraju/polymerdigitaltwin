# Manas Polymers Digital Twin + Reporting Wall

## Overview
Digital Twin + Reporting Wall for PET Preforms Injection Moulding at Manas Polymers.
A single "Factory Data Monitoring" wall with multiple panels: gauge cards, trend chart, temperature card, trajectory panel, green status notification, plus a process schematic at the bottom.

## SCOPING QUESTIONS & ANSWERS

1. **Live or simulated data?** → Simulated (realistic PET preform injection moulding data)
2. **Stack?** → Python FastAPI + WebSocket backend, React (Vite) + TypeScript frontend
3. **How many lines?** → 1 injection moulding line
4. **Cavities per mould?** → 48 cavities, cavity-wise rejection tags available
5. **CTQs?** → preform weight, neck finish dimension, haze/clarity proxy, short shot/flash reject rate
6. **Process tags?** → melt_temp, mould_temp, injection_pressure, hold_pressure, hold_time, cycle_time, screw_speed, cooling_time, dryer_dewpoint, chiller_temp
7. **Alerts?** → In-app only for MVP
8. **Trajectory panel?** → Yes — mock "WIP batch path" through plant process steps
9. **User roles?** → Single admin for MVP
10. **OS/run mode?** → Windows local dev

## Project Structure

```
manasPolymers/
├── backend/
│   ├── main.py                 # FastAPI entry point
│   ├── requirements.txt        # Python dependencies
│   ├── config.py               # Configuration
│   ├── models.py               # Pydantic and SQLAlchemy models
│   ├── simulator.py            # Data generator
│   ├── digital_twin.py         # Core twin: drift detection, cavity fingerprinting
│   ├── alert_engine.py         # Alert generation/dedupe/cooldown
│   ├── websocket.py            # Real-time WebSocket streaming
│   ├── api/
│   │   ├── endpoints.py        # REST endpoints
│   │   └── reports.py          # Report generation
│   └── db/
│       └── database.py         # SQLite setup
├── frontend/
│   ├── package.json            # npm dependencies
│   ├── tsconfig.json           # TypeScript config
│   ├── vite.config.ts          # Vite configuration
│   ├── src/
│   │   ├── main.tsx            # React entry point
│   │   ├── App.tsx             # Main app component
│   │   ├── theme.ts            # Dark theme configuration
│   │   ├── api/
│   │   │   ├── index.ts        # API client
│   │   │   └── websocket.ts    # WebSocket client
│   │   ├── components/
│   │   │   ├── KPICard.tsx     # KPI cards
│   │   │   ├── Gauge.tsx       # Gauge widgets
│   │   │   ├── TrendChart.tsx  # Trend chart
│   │   │   ├── CavityHeatmap.tsx # Cavity heatmap
│   │   │   ├── Trajectory.tsx  # Trajectory widget
│   │   │   ├── Schematic.tsx   # Process schematic
│   │   │   └── Notifications.tsx # Alerts panel
│   │   └── pages/
│   │       └── Dashboard.tsx   # Main dashboard wall
│   └── index.html              # HTML template
└── README.md                   # Project documentation
```

## Setup & Running

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run backend server
uvicorn main:app --reload
```

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

### Access Application

- Backend API: http://localhost:8000
- Frontend Dashboard: http://localhost:5173
- API Documentation: http://localhost:8000/docs

## Features

### Digital Twin Core

- **Entities**: Line, Machine, Mould (48 cavities), Recipe, Batch/Lot
- **Inputs**: melt_temp, mould_temp, injection_pressure, hold_pressure, hold_time, cycle_time, screw_speed, cooling_time, dryer_dewpoint, chiller_temp
- **CTQs**: preform weight, neck finish dimension, haze/clarity, defect type
- **Methods**:
  - EWMA for tag/CTQ control limits
  - CUSUM/rolling z-score for drift detection
  - Cavity fingerprint: rolling deviation scoring
  - Defect taxonomy rules (short_shot, flash, haze)
  - Alert dedupe/cooldown logic

### Dashboard Wall Layout

**Left Column**:
- Quality & Output: Scrap %, defects histogram, cavity hot spots
- Process Stability: 3 gauges (cycle stability, temp stability, pressure stability)

**Center**:
- Trend chart with acceptable band

**Center-Right**:
- Mould Temperature: Numeric card + mini sparkline

**Right**:
- Lot / WIP Trajectory: Mock batch path through process steps

**Bottom Strip**:
- Process schematic: Dryer → Hopper → Injection → Cooling → QC → Packing

**Notifications**:
- Green toast for "All within spec"
- Orange/red for warnings/critical with action hints

### Reporting

- **Daily Shift Report (HTML)**: Production count, scrap %, defects, cavity risk, stability, alerts
- **Weekly Trend Report (HTML)**: Scrap trend, stability trend, repeat offenders
- Export via "Download Shift Report" button

### Demo Mode

The simulator includes a demo scenario:
1. First 2 minutes: Normal operation
2. After 2 minutes: Mould temp zone drift introduces alerts + cavity hotspots

## Configuration

Environment variables can be configured in `backend/.env`:

```env
API_PORT=8000
WEBSOCKET_PORT=8000
DATABASE_URL=sqlite:///./manas_polymers.db
SIMULATION_SPEED=1.0  # 1x = real time
DEMO_MODE_ENABLED=True
```

## Tech Stack

### Backend
- Python 3.9+
- FastAPI
- WebSocket
- SQLite3 (with SQLAlchemy ORM)
- Pandas (data processing)
- Jinja2 (report templates)
- Uvicorn (ASGI server)

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Recharts (charts)
- Framer Motion (animations)
- Tailwind CSS (styling)

## Future Enhancements

- OPC-UA/Modbus/MQTT integration for real PLC/SCADA data
- Email/WhatsApp alert delivery
- User role management
- Physics-based digital twin simulation
- Batch tracking/lineage
- Predictive maintenance

## License

MIT
