import { useState, useEffect } from 'react';
import KPICard from '../components/KPICard';
import Gauge from '../components/Gauge';
import TrendChart from '../components/TrendChart';
import CavityHeatmap from '../components/CavityHeatmap';
import Trajectory from '../components/Trajectory';
import Schematic from '../components/Schematic_Enhanced';
import Notifications from '../components/Notifications';
import { Snapshot } from '../api';
import { getShiftReport } from '../api';

interface DashboardProps {
    snapshot: Snapshot;
}

function Dashboard({ snapshot }: DashboardProps) {
    console.log('Dashboard rendered with snapshot:', {
        timestamp: snapshot.timestamp,
        production_rate: snapshot.production_rate,
        tags_count: snapshot.tags?.length,
        alerts_count: snapshot.alerts?.length,
        cavity_risks_count: snapshot.cavity_risks?.length,
    });
    const [selectedTag, setSelectedTag] = useState('melt_temp');
    const [reportHTML, setReportHTML] = useState<string | null>(null);
    const [loadingReport, setLoadingReport] = useState(false);

    const tags = [
        'melt_temp',
        'mould_temp',
        'injection_pressure',
        'hold_pressure',
        'cycle_time',
    ];

    const tagNames = {
        melt_temp: 'Melt Temperature',
        mould_temp: 'Mould Temperature',
        injection_pressure: 'Injection Pressure',
        hold_pressure: 'Hold Pressure',
        cycle_time: 'Cycle Time',
        production_rate: 'Production Rate',
        scrap_percentage: 'Scrap %',
    };

    // Download shift report
    const handleDownloadReport = async () => {
        setLoadingReport(true);
        try {
            const now = new Date();
            const startTime = new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString();
            const endTime = now.toISOString();

            const html = await getShiftReport(startTime, endTime);
            setReportHTML(html);

            // Create and download the report
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `manas-polymers-shift-report-${now.toISOString().split('T')[0]}.html`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading report:', error);
        } finally {
            setLoadingReport(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-900 text-gray-200">
            {/* Header */}
            <header className="border-b border-gray-700 bg-dark-800/80 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold">MP</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">
                                    Factory Data Monitoring — Manas Polymers
                                </h1>
                                <p className="text-sm text-gray-400">
                                    {snapshot.timestamp} • PET Preforms Injection Moulding
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleDownloadReport}
                                disabled={loadingReport}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                            >
                                <span>{loadingReport ? 'Downloading...' : 'Download Shift Report'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-6">
                {/* Top KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <KPICard
                        title="Production Rate"
                        value={`${snapshot.production_rate} pph`}
                        trend="↑ 2.5%"
                        color="green"
                        icon="⚡"
                    />
                    <KPICard
                        title="Scrap Percentage"
                        value={`${snapshot.scrap_percentage}%`}
                        trend={`${snapshot.scrap_percentage > 5 ? '↑ High' : '↓ Normal'}`}
                        color={snapshot.scrap_percentage > 5 ? 'red' : 'green'}
                        icon="🚫"
                    />
                    <KPICard
                        title="Cycle Time"
                        value={
                            snapshot.tags.find(t => t.tag_name === 'cycle_time')?.value.toFixed(2) + 's' || 'N/A'
                        }
                        trend="Stable"
                        color="blue"
                        icon="⏱️"
                    />
                    <KPICard
                        title="Scrap Risk"
                        value={`${Math.round(snapshot.scrap_risk * 100)}%`}
                        trend={snapshot.scrap_risk > 0.3 ? 'High' : 'Low'}
                        color={snapshot.scrap_risk > 0.3 ? 'red' : 'green'}
                        icon="⚠️"
                    />
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Quality & Output */}
                        <div className="bg-dark-800 rounded-lg p-6 panel-shadow glass">
                            <h3 className="text-lg font-semibold text-white mb-4">
                                Quality & Output
                            </h3>

                            {/* Defect Chart */}
                            <div className="mb-6">
                                <h4 className="text-sm font-medium text-gray-400 mb-2">Defect Types</h4>
                                {/* TODO: Implement defect chart */}
                                <div className="h-48 bg-dark-900/50 rounded-lg flex items-center justify-center">
                                    <span className="text-gray-500">Chart placeholder</span>
                                </div>
                            </div>

                            {/* Process Stability Gauges */}
                            <h4 className="text-sm font-medium text-gray-400 mb-3">
                                Process Stability
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm text-gray-400">Temp Stability</span>
                                        <span className="text-sm text-green-400">98%</span>
                                    </div>
                                    <Gauge value={98} max={100} color="green" size="small" />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm text-gray-400">Pressure Stability</span>
                                        <span className="text-sm text-yellow-400">87%</span>
                                    </div>
                                    <Gauge value={87} max={100} color="yellow" size="small" />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm text-gray-400">Cycle Stability</span>
                                        <span className="text-sm text-blue-400">95%</span>
                                    </div>
                                    <Gauge value={95} max={100} color="blue" size="small" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Center Column */}
                    <div className="space-y-6">
                        {/* Trend Chart */}
                        <div className="bg-dark-800 rounded-lg p-6 panel-shadow glass">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white">
                                    Trend Chart
                                </h3>
                                <select
                                    value={selectedTag}
                                    onChange={(e) => setSelectedTag(e.target.value)}
                                    className="bg-dark-900 border border-gray-700 rounded-lg px-3 py-1 text-sm text-gray-300"
                                >
                                    {tags.map(tag => (
                                        <option key={tag} value={tag}>
                                            {tagNames[tag]}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <TrendChart tagName={selectedTag} />
                        </div>

                        {/* Mould Temperature */}
                        <div className="bg-dark-800 rounded-lg p-6 panel-shadow glass">
                            <h3 className="text-lg font-semibold text-white mb-4">
                                Mould Temperature
                            </h3>
                            <div className="flex items-center justify-between">
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-primary-500">
                                        {snapshot.tags.find(t => t.tag_name === 'mould_temp')?.value.toFixed(1)}°C
                                    </div>
                                    <div className="text-sm text-gray-400 mt-1">
                                        Setpoint: 35.0°C
                                    </div>
                                </div>
                                <div className="h-24 bg-dark-900/50 rounded-lg flex items-center justify-center">
                                    <span className="text-gray-500">Sparkline</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Lot Trajectory */}
                        <div className="bg-dark-800 rounded-lg p-6 panel-shadow glass">
                            <h3 className="text-lg font-semibold text-white mb-4">
                                Lot Trajectory
                            </h3>
                            <Trajectory lotId="MP-20241221-1530" />
                        </div>

                        {/* Cavity Heatmap */}
                        <div className="bg-dark-800 rounded-lg p-6 panel-shadow glass">
                            <h3 className="text-lg font-semibold text-white mb-4">
                                Cavity Risk Heatmap
                            </h3>
                            <CavityHeatmap risks={snapshot.cavity_risks} />
                        </div>
                    </div>
                </div>

                {/* Process Schematic (Bottom Strip) */}
                <div className="mt-8 bg-dark-800 rounded-lg p-6 panel-shadow glass">
                    <h3 className="text-lg font-semibold text-white mb-4">
                        Process Schematic
                    </h3>
                    <Schematic />
                </div>
            </main>

            {/* Notifications */}
            <Notifications alerts={snapshot.alerts} />
        </div>
    );
}

export default Dashboard;
