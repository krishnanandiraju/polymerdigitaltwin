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

## 🚀 Codespaces Demo VM

Run the entire stack in a browser — zero local install required.

### 1. Create a Codespace

1. Push this repo to GitHub (if not already there).
2. Click **Code → Codespaces → Create codespace on main**.
3. Wait ~2 min for the container to build and `postCreateCommand` to install all deps.
   - Python packages from `backend/requirements.txt` are installed automatically.
   - Node packages from `frontend/package.json` are installed automatically.
4. The server is **not** started automatically — this keeps compute costs low.

### 2. Start the Demo

**Option A — VS Code Task (recommended)**

Press `Ctrl+Shift+P` → `Tasks: Run Task` → **Demo: Start**

**Option B — Terminal**
```bash
make demo
# or
bash scripts/demo/start.sh
```

Both commands start the FastAPI backend (`:8000`) and Vite frontend (`:5173`) as
background processes and print the forwarded URLs immediately.

### 3. Open the Dashboard

After starting, the **Ports panel** (bottom of VS Code) shows two forwarded ports.
Click the 🌐 globe icon next to port **5173** to open the dashboard in your browser.

| Service | Port | Forwarded URL |
|---------|------|---------------|
| Dashboard (Vite) | 5173 | `https://<codespace>-5173.app.github.dev` |
| API / Swagger | 8000 | `https://<codespace>-8000.app.github.dev/docs` |

### 4. Sharing the Demo (Port Visibility)

By default Codespaces ports are **Private** (only your account can open them).
To share with a client or colleague:

1. Open the **Ports** panel.
2. Right-click port `5173` → **Port Visibility → Public**.
3. Copy the URL and share it. Anyone with the link can view the dashboard.

> **Tip**: Keep the backend port (`8000`) private — it only needs to be accessible
> from inside the codespace (the Vite proxy handles it automatically).

### 5. Stop the Demo

```bash
make demo-stop
# or
bash scripts/demo/stop.sh
```

### 6. Check Status

```bash
make demo-status
# or
bash scripts/demo/status.sh
```

### 7. Stop the Codespace (avoid burning compute)

When you're done, **suspend** the codespace from GitHub to avoid unnecessary charges:

> **github.com → Your repo → Code → Codespaces → ⋯ → Stop codespace**

Codespaces automatically suspend after 30 min of inactivity by default.
All your files are preserved — just restart the codespace and run `make demo` again.

---

## Setup & Running (Local)

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
