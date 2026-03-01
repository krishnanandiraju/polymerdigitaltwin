import { useState, useEffect, useRef } from 'react';
import Dashboard from './pages/Dashboard';
import { useWebSocket } from './api';
import { Snapshot } from './api';

function App() {
    const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const webSocketRef = useRef<WebSocket | null>(null);

    // Handle WebSocket messages
    const handleWebSocketMessage = (data: any) => {
        setSnapshot(data);
        setLoading(false);
        setError(null);
    };

    // Initialize WebSocket
    useWebSocket(handleWebSocketMessage);

    // Fallback to API if WebSocket fails
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/snapshot');
                if (!response.ok) {
                    throw new Error(`API request failed: ${response.status}`);
                }
                const data = await response.json();
                setSnapshot(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };

        // Fetch initial data only if no snapshot from WebSocket after 2 seconds
        const timeout = setTimeout(fetchInitialData, 2000);

        return () => clearTimeout(timeout);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-200">Loading Dashboard...</h2>
                    <p className="text-gray-400 mt-2">Connecting to Manas Polymers Digital Twin</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-dark-900 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="text-red-500 text-4xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-gray-200 mb-2">Connection Error</h2>
                    <p className="text-gray-400 mb-4">{error}</p>
                    <div className="space-y-2 text-sm text-gray-500">
                        <p>• Make sure the backend server is running on http://localhost:8000</p>
                        <p>• Check if port 8000 is available</p>
                        <p>• Verify no firewall is blocking the connection</p>
                    </div>
                </div>
            </div>
        );
    }

    return <Dashboard snapshot={snapshot} />;
}

export default App;
