You are my senior full-stack + industrial data engineer working with me inside VS Code. We are building an MVP “Digital Twin + Reporting Wall” for Manas Polymers (PET preforms injection moulding), inspired by the attached dairy digital-pipeline video’s style: a single “Factory Data Monitoring” wall with multiple panels (gauge cards, trend chart, numeric temperature card, a route/trajectory panel, and a green status notification), plus a simplified process schematic at the bottom.



Before coding, ask me ONLY the minimum scoping questions needed (max 10) and then proceed with sensible defaults if I don’t answer. Put the questions as a checklist at the top of your response, then immediately continue with implementation.



SCOPING QUESTIONS (ask these first):

1\) Is this MVP using LIVE PLC/SCADA data now, or simulated data first? (simulated is OK)

2\) What is the target stack? Choose defaults if unclear: Backend Python FastAPI + WebSocket, Frontend React (Vite) + TypeScript.

3\) How many injection moulding machines/lines in scope for MVP (default 1 line)?

4\) How many cavities per mould (default 48)? Do we have cavity-wise rejection tags or only line-level rejects?

5\) What CTQs are we tracking first? (default: preform weight, neck finish dimension, haze/clarity proxy, short shot/flash reject rate)

6\) What process tags are available? (default: melt temp, mould temp, injection pressure, holding pressure/time, cycle time, screw speed, cooling time, dryer dew point, chiller temp)

7\) Alert delivery: only in-app notifications for MVP, or email/WhatsApp too? (default in-app)

8\) Do we need a “logistics/trajectory” panel like the video? (default yes: show “material lot movement” mock route OR “WIP batch path” inside plant)

9\) Do we need user roles (operator/QA/manager) now? (default: single admin)

10\) Preferred OS + run mode (Windows local dev)? (default local dev)



GOAL:

Build a working MVP with:

\- A “Factory Data Monitoring” wall dashboard (like the video layout) showing:

&nbsp; A) Left: “Quality \& Output” panel (rejects by defect type + cavity hot-spots)

&nbsp; B) Left: “Process Stability” gauge panel (cycle-time stability, temperature stability, pressure stability)

&nbsp; C) Center: Trend chart (e.g., “Melt temp/Injection pressure/Cycle time over time” with acceptable band)

&nbsp; D) Center-right: “Mould/Storage Temperature” numeric card (e.g., mould temp zone average)

&nbsp; E) Right: “Trajectory” panel (either a simple map-like route or plant-floor path for batches/lots)

&nbsp; F) Bottom: Simplified process schematic (icons/blocks: Dryer → Hopper → Injection → Cooling → QC → Packing)

&nbsp; G) Green notification toast area (“Today’s reject rate: X% within target”, “Cavity 17 drift warning”, etc.)

\- A reporting framework:

&nbsp; - Daily shift report (PDF/HTML export): scrap %, top defects, cavity drift list, downtime events, recipe changes, alerts acknowledged, recommended actions

&nbsp; - Weekly trend report: CTQ stability, scrap savings estimate, repeated cavities/defects, maintenance flags

\- A “Digital Twin core” that is practical: hybrid rules + statistical drift + anomaly detection (no heavy physics solver required for MVP).

\- Architecture that can later plug into PLC/SCADA (OPC-UA/Modbus/MQTT), but for MVP we simulate data realistically.



NON-NEGOTIABLE: Keep the codebase clean, runnable, and demo-ready with realistic simulated data.



DELIVERABLES YOU MUST PRODUCE (in your response):

1\) Repo structure (folders/files) + exact commands to run locally.

2\) Backend (FastAPI) with:

&nbsp;  - Data simulator generating time-series for tags + cavity-wise reject events

&nbsp;  - WebSocket streaming live metrics

&nbsp;  - REST endpoints for: current snapshot, history query, alerts list, acknowledge alert, generate report

&nbsp;  - A simple rules engine + drift detection:

&nbsp;    - EWMA/CUSUM style drift on CTQs (weight, cycle time, mould temp)

&nbsp;    - Cavity-wise fingerprint scoring (which cavities consistently deviate)

&nbsp;    - Alert severity levels (INFO/WARN/CRITICAL) with cooldown and dedupe

3\) Frontend (React+TS) with:

&nbsp;  - Dashboard wall layout closely matching the dairy video vibe:

&nbsp;    - dark theme, panel cards, gauges, trend chart, “trajectory” widget, bottom schematic strip

&nbsp;  - Components:

&nbsp;    - KPI cards

&nbsp;    - Gauge widget

&nbsp;    - Trend chart (use a lightweight chart lib; default Recharts)

&nbsp;    - Cavity heatmap grid

&nbsp;    - Alerts/notifications panel with green status toast

&nbsp;    - Acknowledgement workflow (click alert → acknowledge → adds note)

4\) Reporting:

&nbsp;  - Backend generates a daily shift report (HTML first, PDF optional) with tables + charts data (server-side render is fine)

&nbsp;  - Frontend provides “Download Shift Report” button

5\) Seed data and assumptions documented in README:

&nbsp;  - CTQs, tag names, normal ranges, defect taxonomy, and how alerts trigger.



TECHNICAL SPEC (MVP DIGITAL TWIN + DASHBOARD/ALERTS):



A) Digital Twin Core (hybrid, plant-friendly)

\- Entities:

&nbsp; - Line (InjectionLine)

&nbsp; - Machine (Machine)

&nbsp; - Mould (Mould) with cavities \[1..N]

&nbsp; - Recipe (RecipeSetpoints)

&nbsp; - Batch/Lot (ResinLot / ProductionLot)

&nbsp; - CTQ measurements (CTQ: weight\_g, neck\_mm, haze\_index, defect\_type)

&nbsp; - Events: reject\_event, recipe\_change, downtime\_start/stop, maintenance\_flag

\- Inputs (tags/time-series):

&nbsp; - melt\_temp\_c, mould\_temp\_c (zones optional), injection\_pressure\_bar, hold\_pressure\_bar, hold\_time\_s, screw\_speed\_rpm, cycle\_time\_s, cooling\_time\_s, dryer\_dewpoint\_c, chiller\_temp\_c

\- Outputs:

&nbsp; - Predicted scrap risk score (0–1)

&nbsp; - Drift warnings (CTQ/process)

&nbsp; - Recommended operator action (text suggestions):

&nbsp;   ex: “Cycle time drifting high: check cooling water flow; verify chiller setpoint”

\- Methods (MVP algorithms):

&nbsp; - EWMA for each key tag/CTQ with control limits

&nbsp; - CUSUM/rolling z-score for drift

&nbsp; - Cavity fingerprint: rolling deviation score per cavity; mark top 5 cavities at risk

&nbsp; - Defect taxonomy rules:

&nbsp;   short\_shot correlates with low injection pressure + short hold time + low melt temp

&nbsp;   flash correlates with high injection pressure + mould temp too high

&nbsp;   haze correlates with moisture (dryer dew point) + melt temp instability

&nbsp; - Alert dedupe: if same alert type+entity triggers within cooldown, update existing alert instead of creating new.



B) Dashboard/Reporting Framework (inspired by dairy video)

\- Layout:

&nbsp; - Header: “Factory Data Monitoring — Manas Polymers (PET Preforms)”

&nbsp; - Left column:

&nbsp;   - “Quality \& Output” (scrap %, defects histogram, cavity hot spots)

&nbsp;   - “Process Stability” (3 gauges: cycle stability, temp stability, pressure stability)

&nbsp; - Center:

&nbsp;   - Trend chart with acceptable band (setpoint window)

&nbsp; - Center-right:

&nbsp;   - “Mould Temperature” numeric card (+ mini sparkline)

&nbsp; - Right:

&nbsp;   - “Lot / WIP Trajectory” (mock route/path of current lot through process steps)

&nbsp; - Bottom strip:

&nbsp;   - Simple schematic: Dryer → Hopper → Injection → Cooling → QC → Packing

&nbsp; - Notification area:

&nbsp;   - Green toast for “All within spec”

&nbsp;   - Orange/red for warnings/critical; include action hint + acknowledge button

\- Reports:

&nbsp; - Shift report:

&nbsp;   - Period, production count, scrap %, defects top 5, cavity top 10 risk, tag stability summary, alerts summary, recommended actions

&nbsp; - Weekly:

&nbsp;   - Scrap trend, stability trend, repeat offenders (cavities/defects), downtime, maintenance predictions



IMPLEMENTATION INSTRUCTIONS:

\- Generate ALL code: backend + frontend + README.

\- Use environment variables for configuration; defaults ok.

\- Use TypeScript in frontend.

\- Use a simple data store:

&nbsp; - MVP default: SQLite (for events/alerts) + in-memory time-series ring buffer

\- No cloud deployment required; local dev only.

\- Provide exact VS Code tasks (optional) for running both servers.

\- Make sure there is at least one “Demo Mode” seed scenario:

&nbsp; - Normal operation for 2 minutes, then introduce a drift in mould temp zone and observe alerts + cavity hotspot appear.



OUTPUT FORMAT:

\- First: the 10 questions checklist.

\- Then: “Plan” (short).

\- Then: full repo tree + code blocks per file.

\- Then: run instructions + demo steps.

\- Do not include marketing language; this is a build prompt.



Start now.

