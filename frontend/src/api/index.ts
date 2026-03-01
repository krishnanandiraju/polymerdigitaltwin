import { useState, useEffect, useCallback } from 'react';

// API configuration
const API_BASE = 'http://localhost:8000/api';
const WS_BASE = 'ws://localhost:8000/ws';


export interface TagReading {
    timestamp: string;
    tag_name: string;
    value: number;
    unit: string;
    machine_id: string;
}

export interface CTQReading {
    timestamp: string;
    cavity: number;
    weight: number;
    neck_dim: number;
    haze: number;
    lot_id: string;
}

export interface Alert {
    alert_id: string;
    severity: 'INFO' | 'WARN' | 'CRITICAL';
    status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
    title: string;
    description: string;
    entity_id: string;
    entity_type: string;
    action_hint: string;
    timestamp: string;
    acknowledged_at?: string;
    acknowledged_by?: string;
    acknowledged_note?: string;
}

export interface CavityRisk {
    cavity: number;
    risk_score: number;
    rejected_count: number;
    defect_types: string[];
}

export interface Defect {
    type: string;
    count: number;
    percentage: number;
}

export interface Snapshot {
    timestamp: string;
    line_status: string;
    production_rate: number;
    scrap_percentage: number;
    tags: TagReading[];
    ctqs: CTQReading[];
    alerts: Alert[];
    cavity_risks: CavityRisk[];
    scrap_risk: number;
}

export interface TrendData {
    tag_name: string;
    readings: { timestamp: string; value: number }[];
    limits: {
        setpoint: number;
        lower: number;
        upper: number;
    };
}


// Helper function to make HTTP requests
async function apiRequest(url: string, options: RequestInit = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}


// Snapshot APIs
export async function getCurrentSnapshot(): Promise<Snapshot> {
    return apiRequest(`${API_BASE}/snapshot`);
}


// Trend APIs
export async function getTagTrend(
    tagName: string,
    startTime: string,
    endTime: string
): Promise<TrendData> {
    const params = new URLSearchParams({
        start_time: startTime,
        end_time: endTime,
    });
    const response = await apiRequest(`${API_BASE}/trend/${tagName}?${params}`);
    return response;
}


export async function getMultiTrend(
    tagNames: string[],
    startTime: string,
    endTime: string
): Promise<TrendData[]> {
    const params = new URLSearchParams({
        tag_names: tagNames.join(','),
        start_time: startTime,
        end_time: endTime,
    });
    const response = await apiRequest(`${API_BASE}/trend/multi?${params}`);
    return response.tags;
}


// Alert APIs
export async function getActiveAlerts(): Promise<Alert[]> {
    const response = await apiRequest(`${API_BASE}/alerts/active`);
    return response.alerts;
}


export async function getAlertHistory(
    startTime: string,
    endTime: string
): Promise<Alert[]> {
    const params = new URLSearchParams({
        start_time: startTime,
        end_time: endTime,
    });
    const response = await apiRequest(`${API_BASE}/alerts/history?${params}`);
    return response.alerts;
}


export async function acknowledgeAlert(
    alertId: string,
    user: string,
    note?: string
): Promise<void> {
    await apiRequest(`${API_BASE}/alerts/acknowledge`, {
        method: 'POST',
        body: JSON.stringify({
            alert_id: alertId,
            acknowledged_by: user,
            acknowledged_note: note,
        }),
    });
}


// Cavity APIs
export async function getCavityRisks(): Promise<CavityRisk[]> {
    const response = await apiRequest(`${API_BASE}/cavity/risks`);
    return response.risks;
}


// Defect APIs
export async function getDefectBreakdown(): Promise<Defect[]> {
    const response = await apiRequest(`${API_BASE}/defects/breakdown`);
    return response.defects;
}


// Line info
export async function getLineInfo(): Promise<any> {
    return apiRequest(`${API_BASE}/line/info`);
}


// Reports
export async function getShiftReport(startTime: string, endTime: string): Promise<string> {
    const params = new URLSearchParams({
        start_time: startTime,
        end_time: endTime,
    });
    const response = await apiRequest(`${API_BASE}/reports/shift?${params}`);
    return response.html;
}


export async function getWeeklyReport(startTime: string, endTime: string): Promise<string> {
    const params = new URLSearchParams({
        start_time: startTime,
        end_time: endTime,
    });
    const response = await apiRequest(`${API_BASE}/reports/weekly?${params}`);
    return response.html;
}


// WebSocket hook
export function useWebSocket(onMessage: (data: any) => void) {
    useEffect(() => {
        let ws: WebSocket | null = null;
        let reconnectTimer: NodeJS.Timeout | null = null;
        let connectionAttempts = 0;
        const maxAttempts = 3;

        function connect() {
            if (connectionAttempts >= maxAttempts) {
                console.log('WebSocket: Max connection attempts reached, using REST API polling');
                return;
            }

            try {
                ws = new WebSocket(WS_BASE);

                ws.onopen = () => {
                    console.log('WebSocket connected');
                    connectionAttempts = 0; // Reset on successful connection
                };

                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        onMessage(data);
                    } catch (error) {
                        console.debug('Error parsing WebSocket message (using REST API)');
                    }
                };

                ws.onerror = () => {
                    // Silently fail and let REST API handle it
                    connectionAttempts++;
                    if (connectionAttempts < maxAttempts) {
                        scheduleReconnect();
                    }
                };

                ws.onclose = () => {
                    connectionAttempts++;
                    if (connectionAttempts < maxAttempts) {
                        scheduleReconnect();
                    }
                };
            } catch (error) {
                connectionAttempts++;
                if (connectionAttempts < maxAttempts) {
                    scheduleReconnect();
                }
            }
        }

        function scheduleReconnect() {
            if (reconnectTimer) clearTimeout(reconnectTimer);
            reconnectTimer = setTimeout(connect, 3000);
        }

        connect();

        return () => {
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
            }
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [onMessage]);
}
