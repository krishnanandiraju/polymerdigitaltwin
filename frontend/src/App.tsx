import { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import { Snapshot } from "./api";

function App() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchSnapshot() {
      try {
        const response = await fetch("/api/snapshot");
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }
        const data: Snapshot = await response.json();
        if (!cancelled) {
          setSnapshot(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to connect to backend",
          );
          setLoading(false);
        }
      }
    }

    fetchSnapshot();

    // Refresh every 10 seconds
    const interval = setInterval(fetchSnapshot, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-200">
            Loading Dashboard...
          </h2>
          <p className="text-gray-400 mt-2">
            Connecting to Manas Polymers Digital Twin
          </p>
          <p className="text-gray-500 text-xs mt-4">
            Check browser console (F12) for logs
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center max-w-md bg-dark-800 p-8 rounded-lg border border-red-500">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-200 mb-2">
            Connection Error
          </h2>
          <p className="text-red-400 mb-4 font-mono text-sm">{error}</p>
          <div className="space-y-2 text-sm text-gray-500 mb-4">
            <p>
              • Backend via <span className="text-yellow-400">/api</span> proxy
            </p>
            <p>• Backend port 8000 available?</p>
            <p>• Firewall blocking?</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return snapshot ? <Dashboard snapshot={snapshot} /> : null;
}

export default App;
