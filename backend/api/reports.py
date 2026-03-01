from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Query
from jinja2 import Template
from models import ReportConfig, Alert
from simulator import simulator
from digital_twin import digital_twin
from alert_engine import alert_engine
from config import settings


router = APIRouter(prefix="/api/reports", tags=["reports"])


def generate_html_report(data: dict, report_type: str) -> str:
    """Generate HTML report using Jinja2 templates"""
    template = Template("""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{{ title }}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding: 20px;
                background-color: #2c3e50;
                color: white;
                border-radius: 8px;
            }
            .section {
                background-color: white;
                padding: 20px;
                margin-bottom: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .kpi-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-top: 20px;
            }
            .kpi-card {
                background-color: #ecf0f1;
                padding: 15px;
                border-radius: 6px;
                text-align: center;
            }
            .kpi-value {
                font-size: 24px;
                font-weight: bold;
                color: #27ae60;
            }
            .kpi-label {
                font-size: 14px;
                color: #7f8c8d;
                margin-top: 5px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
            }
            th, td {
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
            }
            th {
                background-color: #3498db;
                color: white;
            }
            tr:nth-child(even) {
                background-color: #f2f2f2;
            }
            .alert-severity-WARN {
                color: #f39c12;
            }
            .alert-severity-CRITICAL {
                color: #e74c3c;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding: 10px;
                color: #7f8c8d;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Manas Polymers {{ report_type | title }} Report</h1>
            <p>{{ data['period'] }}</p>
        </div>

        <div class="section">
            <h2>Key Performance Indicators</h2>
            <div class="kpi-grid">
                <div class="kpi-card">
                    <div class="kpi-value">{{ data['production_count'] }}</div>
                    <div class="kpi-label">Total Production</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-value">{{ data['scrap_count'] }}</div>
                    <div class="kpi-label">Total Scrap</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-value">{{ "%.1f"|format(data['scrap_percentage']) }}%</div>
                    <div class="kpi-label">Scrap Percentage</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-value">{{ data['uptime'] }}%</div>
                    <div class="kpi-label">Uptime</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Defect Analysis</h2>
            <table>
                <thead>
                    <tr>
                        <th>Defect Type</th>
                        <th>Count</th>
                        <th>Percentage</th>
                        <th>Top Cavities</th>
                    </tr>
                </thead>
                <tbody>
                    {% for defect in data['defect_breakdown'] %}
                    <tr>
                        <td>{{ defect['type'] }}</td>
                        <td>{{ defect['count'] }}</td>
                        <td>{{ "%.1f"|format(defect['percentage']) }}%</td>
                        <td>{{ defect['top_cavities'] }}</td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>High Risk Cavities</h2>
            <table>
                <thead>
                    <tr>
                        <th>Cavity</th>
                        <th>Risk Score</th>
                        <th>Rejected Count</th>
                        <th>Average Weight (g)</th>
                        <th>Average Neck Dim (mm)</th>
                    </tr>
                </thead>
                <tbody>
                    {% for cavity in data['cavity_risks'] %}
                    <tr>
                        <td>{{ cavity['cavity'] }}</td>
                        <td>{{ "%.3f"|format(cavity['risk_score']) }}</td>
                        <td>{{ cavity['rejected_count'] }}</td>
                        <td>{{ "%.3f"|format(cavity['avg_weight']) }}</td>
                        <td>{{ "%.3f"|format(cavity['avg_neck_dim']) }}</td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>Alert Summary</h2>
            <table>
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Severity</th>
                        <th>Description</th>
                        <th>Acknowledged</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {% for alert in data['alert_summary'] %}
                    <tr>
                        <td>{{ alert['timestamp'] }}</td>
                        <td class="alert-severity-{{ alert['severity'] }}">{{ alert['severity'] }}</td>
                        <td>{{ alert['description'] }}</td>
                        <td>{{ "✓" if alert['acknowledged'] else "✗" }}</td>
                        <td>{{ alert['action'] }}</td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>Process Stability</h2>
            <table>
                <thead>
                    <tr>
                        <th>Parameter</th>
                        <th>Average</th>
                        <th>Min</th>
                        <th>Max</th>
                        <th>Drift Detected</th>
                    </tr>
                </thead>
                <tbody>
                    {% for param in data['process_stats'] %}
                    <tr>
                        <td>{{ param['parameter'] }}</td>
                        <td>{{ "%.2f"|format(param['average']) }}</td>
                        <td>{{ "%.2f"|format(param['min']) }}</td>
                        <td>{{ "%.2f"|format(param['max']) }}</td>
                        <td>{{ "Yes" if param['drift'] else "No" }}</td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>Recommendations</h2>
            <ul>
                {% for rec in data['recommendations'] %}
                <li>{{ rec }}</li>
                {% endfor %}
            </ul>
        </div>

        <div class="footer">
            <p>Report generated on {{ data['generated_at'] }}</p>
            <p>Generated by Manas Polymers Digital Twin</p>
        </div>
    </body>
    </html>
    """)

    title = "Shift" if report_type == "shift" else "Weekly Trend"

    return template.render(
        title=title,
        report_type=report_type,
        data=data
    )


def generate_shift_report_data(start_time: datetime, end_time: datetime) -> dict:
    """Generate shift report data from simulator and alert engine"""
    # In a real system, this would query the database
    # For MVP, we generate realistic simulation data
    duration = (end_time - start_time).total_seconds() / 3600

    production_count = int(simulator.PRODUCTION_RATE * duration)
    scrap_count = int(production_count * (simulator.BASE_REJECT_RATE + (0.03 if simulator.drift_introduced else 0)))
    scrap_percentage = (scrap_count / production_count) * 100 if production_count > 0 else 0

    # Mock defect breakdown
    defect_breakdown = [
        {
            "type": "Short Shot",
            "count": int(scrap_count * 0.4),
            "percentage": 40,
            "top_cavities": "17, 23, 31"
        },
        {
            "type": "Flash",
            "count": int(scrap_count * 0.25),
            "percentage": 25,
            "top_cavities": "8, 14, 42"
        },
        {
            "type": "Haze",
            "count": int(scrap_count * 0.2),
            "percentage": 20,
            "top_cavities": "5, 9, 28"
        },
        {
            "type": "Dimensional",
            "count": int(scrap_count * 0.1),
            "percentage": 10,
            "top_cavities": "12, 35"
        },
        {
            "type": "Other",
            "count": int(scrap_count * 0.05),
            "percentage": 5,
            "top_cavities": "Random"
        }
    ]

    # Mock cavity risks
    cavity_risks = []
    for cavity in range(1, settings.NUM_CAVITIES + 1):
        avg_weight = settings.WEIGHT_MEAN + (0.5 if cavity in [17, 23, 31] else 0)
        avg_neck_dim = settings.NECK_DIM_MEAN + (0.2 if cavity in [8, 14, 42] else 0)
        risk_score = 0.6 + (0.3 if cavity in [17, 23, 31] else 0)
        cavity_risks.append({
            "cavity": cavity,
            "risk_score": risk_score,
            "rejected_count": int(risk_score * 10),
            "avg_weight": avg_weight,
            "avg_neck_dim": avg_neck_dim
        })
    cavity_risks = sorted(cavity_risks, key=lambda x: x["risk_score"], reverse=True)[:10]

    # Get alert summary
    alert_summary = []
    alerts = alert_engine.get_alert_history(start_time, end_time)
    for alert in alerts[:20]:
        alert_summary.append({
            "timestamp": alert["timestamp"].strftime("%H:%M:%S"),
            "severity": alert["severity"],
            "description": alert["description"],
            "acknowledged": alert.get("acknowledged", False),
            "action": alert.get("action_hint", "Check process parameters")
        })

    # Process stats
    process_stats = [
        {
            "parameter": "Melt Temperature (°C)",
            "average": 275.2,
            "min": 268.5,
            "max": 282.1,
            "drift": simulator.current_tags["melt_temp"] > settings.TEMP_MEAN + 2 * settings.TEMP_STD
        },
        {
            "parameter": "Mould Temperature (°C)",
            "average": 35.1 if not simulator.drift_introduced else 40.2,
            "min": 32.8,
            "max": 37.9 if not simulator.drift_introduced else 43.5,
            "drift": simulator.current_tags["mould_temp"] > settings.MOULD_TEMP_MEAN + 2 * settings.MOULD_TEMP_STD
        },
        {
            "parameter": "Injection Pressure (bar)",
            "average": 1215.3,
            "min": 1185.2,
            "max": 1245.1,
            "drift": False
        },
        {
            "parameter": "Cycle Time (s)",
            "average": 10.1 if not simulator.drift_introduced else 11.5,
            "min": 9.8,
            "max": 10.5 if not simulator.drift_introduced else 12.2,
            "drift": simulator.current_tags["cycle_time"] > settings.CYCLE_TIME_SEC + 1.0
        }
    ]

    # Recommendations
    recommendations = [
        "Inspect cavity 17 for wear and replace if necessary",
        "Check mould temperature zone calibration",
        "Verify cooling water flow to injection zone",
        "Perform mould cleaning during next scheduled downtime",
        "Review resin drying process parameters"
    ]

    return {
        "period": f"{start_time.strftime('%Y-%m-%d %H:%M')} - {end_time.strftime('%Y-%m-%d %H:%M')}",
        "production_count": production_count,
        "scrap_count": scrap_count,
        "scrap_percentage": scrap_percentage,
        "uptime": 98.5,
        "defect_breakdown": defect_breakdown,
        "cavity_risks": cavity_risks,
        "alert_summary": alert_summary,
        "process_stats": process_stats,
        "recommendations": recommendations,
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }


@router.get("/shift", summary="Generate shift report", description="Generate HTML shift report")
async def get_shift_report(
    start_time: datetime = Query(
        default_factory=lambda: datetime.now() - timedelta(hours=8),
        description="Report start time (ISO format)"
    ),
    end_time: datetime = Query(
        default_factory=datetime.now,
        description="Report end time (ISO format)"
    )
):
    data = generate_shift_report_data(start_time, end_time)
    html = generate_html_report(data, "shift")
    return {"html": html}


@router.get("/weekly", summary="Generate weekly report", description="Generate HTML weekly report")
async def get_weekly_report(
    start_time: datetime = Query(
        default_factory=lambda: datetime.now() - timedelta(days=7),
        description="Report start time (ISO format)"
    ),
    end_time: datetime = Query(
        default_factory=datetime.now,
        description="Report end time (ISO format)"
    )
):
    data = generate_shift_report_data(start_time, end_time)
    data["period"] = f"{start_time.strftime('%Y-%m-%d')} - {end_time.strftime('%Y-%m-%d')}"
    data["uptime"] = 97.8
    html = generate_html_report(data, "weekly")
    return {"html": html}
