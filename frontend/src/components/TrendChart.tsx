import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getTagTrend } from '../api';

interface TrendChartProps {
    tagName: string;
}

function TrendChart({ tagName }: TrendChartProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chartConfig, setChartConfig] = useState({
        setpoint: 0,
        lower: 0,
        upper: 0,
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const now = new Date();
                const startTime = new Date(now.getTime() - 30 * 60 * 1000).toISOString(); // 30 minutes
                const endTime = now.toISOString();

                // Fetch with 5 second timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const response = await Promise.race([
                    getTagTrend(tagName, startTime, endTime),
                    new Promise((_, reject) => 
                        timeoutId && setTimeout(() => reject(new Error('Request timeout')), 5000)
                    )
                ]);
                
                clearTimeout(timeoutId);
                
                const chartData = (response as any).readings?.map((reading: any) => ({
                    time: new Date(reading.timestamp).toLocaleTimeString('en-IN', { hour12: false }),
                    value: reading.value,
                })) || [];
                setData(chartData);
                setChartConfig((response as any).limits || {});
            } catch (err) {
                console.debug('Trend chart load skipped');
                setError('');  // Don't show error, just skip
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval);
    }, [tagName]);

    if (loading) {
        return (
            <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                <span className="ml-2 text-gray-400">Loading trend data...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-64 flex items-center justify-center text-red-400">
                Error loading trend data: {error}
            </div>
        );
    }

    const tagNames = {
        melt_temp: 'Melt Temperature',
        mould_temp: 'Mould Temperature',
        injection_pressure: 'Injection Pressure',
        hold_pressure: 'Hold Pressure',
        cycle_time: 'Cycle Time',
    };

    return (
        <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                        dataKey="time"
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        tickMargin={5}
                    />
                    <YAxis
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        tickMargin={5}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1F2937',
                            borderColor: '#374151',
                            borderRadius: '0.5rem',
                            color: '#F9FAFB',
                        }}
                    />
                    <Legend
                        wrapperStyle={{ paddingTop: '10px' }}
                        iconType="circle"
                        formatter={(value) => <span style={{ color: '#9CA3AF', fontSize: '12px' }}>{value}</span>}
                    />
                    {/* Process variable line */}
                    <Line
                        type="monotone"
                        dataKey="value"
                        name={tagNames[tagName]}
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6, fill: '#3B82F6' }}
                    />
                    {/* Control limits */}
                    <Line
                        type="monotone"
                        dataKey={() => chartConfig.setpoint}
                        name="Setpoint"
                        stroke="#10B981"
                        strokeWidth={1}
                        strokeDasharray="5 5"
                        dot={false}
                    />
                    <Line
                        type="monotone"
                        dataKey={() => chartConfig.upper}
                        name="Upper Limit"
                        stroke="#F59E0B"
                        strokeWidth={1}
                        strokeDasharray="5 5"
                        dot={false}
                    />
                    <Line
                        type="monotone"
                        dataKey={() => chartConfig.lower}
                        name="Lower Limit"
                        stroke="#F59E0B"
                        strokeWidth={1}
                        strokeDasharray="5 5"
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export default TrendChart;
