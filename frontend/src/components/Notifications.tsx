import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Alert } from '../api';
import { acknowledgeAlert } from '../api';

interface NotificationsProps {
    alerts: Alert[];
}

function Notifications({ alerts }: NotificationsProps) {
    const [activeAlerts, setActiveAlerts] = useState<Alert[]>(alerts);
    const [acknowledging, setAcknowledging] = useState<string | null>(null);

    const handleAcknowledge = async (alertId: string) => {
        setAcknowledging(alertId);
        try {
            await acknowledgeAlert(alertId, 'Operator', 'Acknowledged');
            setActiveAlerts(prev =>
                prev.map(alert =>
                    alert.alert_id === alertId
                        ? { ...alert, acknowledged: true, acknowledged_by: 'Operator' }
                        : alert
                )
            );
        } catch (error) {
            console.error('Error acknowledging alert:', error);
        } finally {
            setAcknowledging(null);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'INFO':
                return 'bg-blue-600';
            case 'WARN':
                return 'bg-yellow-600';
            case 'CRITICAL':
                return 'bg-red-600';
            default:
                return 'bg-gray-600';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'INFO':
                return 'ℹ️';
            case 'WARN':
                return '⚠️';
            case 'CRITICAL':
                return '🚨';
            default:
                return 'ℹ️';
        }
    };

    const notificationVariants = {
        hidden: { opacity: 0, x: 300 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { type: 'spring', stiffness: 300, damping: 30 },
        },
        exit: {
            opacity: 0,
            x: 300,
            transition: { duration: 0.3 },
        },
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-sm w-full">
            <AnimatePresence>
                {activeAlerts
                    .filter(alert => !alert.acknowledged)
                    .slice(0, 3)
                    .map((alert) => (
                        <motion.div
                            key={alert.alert_id}
                            variants={notificationVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className={`
                p-4 rounded-lg shadow-lg border-l-4 ${getSeverityColor(alert.severity)}
                bg-dark-800 border-white/10
              `}
                        >
                            <div className="flex items-start space-x-3">
                                <div className="text-2xl flex-shrink-0">{getSeverityIcon(alert.severity)}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-semibold text-white truncate">
                                            {alert.title}
                                        </h4>
                                        <span className="text-xs text-gray-400 ml-2">
                                            {new Date(alert.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                                        {alert.description}
                                    </p>
                                    {alert.action_hint && (
                                        <p className="text-xs text-blue-300 mt-1">
                                            {alert.action_hint}
                                        </p>
                                    )}
                                    <div className="flex items-center mt-2 space-x-2">
                                        <button
                                            onClick={() => handleAcknowledge(alert.alert_id)}
                                            disabled={acknowledging === alert.alert_id}
                                            className={`
                        px-3 py-1 text-xs font-medium rounded transition-colors
                        ${acknowledging === alert.alert_id
                                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                                    : 'bg-primary-600 text-white hover:bg-primary-700'
                                                }
                      `}
                                        >
                                            {acknowledging === alert.alert_id ? 'Acknowledging...' : 'Acknowledge'}
                                        </button>
                                        {alert.acknowledged_by && (
                                            <span className="text-xs text-gray-400">
                                                By: {alert.acknowledged_by}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
            </AnimatePresence>

            {/* Green status toast when all alerts are acknowledged */}
            {activeAlerts.filter(alert => !alert.acknowledged).length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg shadow-lg bg-green-600 border-l-4 border-white/10"
                >
                    <div className="flex items-start space-x-3">
                        <div className="text-2xl">✅</div>
                        <div>
                            <h4 className="text-sm font-semibold text-white">All Clear</h4>
                            <p className="text-sm text-green-100 mt-1">
                                All process parameters within control limits
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

export default Notifications;
