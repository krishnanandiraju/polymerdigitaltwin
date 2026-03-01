import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface TrajectoryProps {
    lotId: string;
}

function Trajectory({ lotId }: TrajectoryProps) {
    const [currentStep, setCurrentStep] = useState(4);
    const [progress, setProgress] = useState(67);

    useEffect(() => {
        // Simulate progress
        const interval = setInterval(() => {
            setProgress(prev => Math.min(100, prev + 0.5));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const processSteps = [
        {
            id: 'dryer',
            name: 'Dryer',
            icon: '🔥',
            status: 'completed',
            time: '15:30',
            duration: '5min',
        },
        {
            id: 'hopper',
            name: 'Hopper',
            icon: '📦',
            status: 'completed',
            time: '15:35',
            duration: '2min',
        },
        {
            id: 'injection',
            name: 'Injection',
            icon: '⚡',
            status: 'completed',
            time: '15:37',
            duration: '8min',
        },
        {
            id: 'cooling',
            name: 'Cooling',
            icon: '❄️',
            status: 'completed',
            time: '15:45',
            duration: '5min',
        },
        {
            id: 'qc',
            name: 'QC',
            icon: '✅',
            status: 'active',
            time: '15:50',
            duration: '3min',
        },
        {
            id: 'packing',
            name: 'Packing',
            icon: '📦',
            status: 'pending',
            time: '15:53',
            duration: '4min',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Lot Info Header */}
            <div className="flex items-center justify-between p-4 bg-dark-900/50 rounded-lg border border-gray-700">
                <div>
                    <span className="text-xs text-gray-400">Lot ID:</span>
                    <div className="text-lg font-bold text-white font-mono">{lotId}</div>
                </div>
                <div className="flex items-center space-x-2">
                    <motion.div
                        className="w-3 h-3 bg-green-500 rounded-full"
                        animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-green-400 font-semibold">In Process</span>
                </div>
            </div>

            {/* Process Timeline */}
            <div className="relative">
                {/* Timeline Steps */}
                <div className="space-y-4">
                    {processSteps.map((step, index) => (
                        <motion.div
                            key={step.id}
                            className="flex items-center space-x-4"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            {/* Step Icon */}
                            <div className="relative flex-shrink-0">
                                <motion.div
                                    className={`
                                        w-14 h-14 rounded-xl flex items-center justify-center
                                        ${step.status === 'completed'
                                            ? 'bg-green-500/20 border-2 border-green-500'
                                            : step.status === 'active'
                                                ? 'bg-primary-500/20 border-2 border-primary-500'
                                                : 'bg-dark-800 border-2 border-gray-700'
                                        }
                                    `}
                                    animate={
                                        step.status === 'active'
                                            ? {
                                                boxShadow: [
                                                    '0 0 10px rgba(59, 130, 246, 0.5)',
                                                    '0 0 20px rgba(59, 130, 246, 0.8)',
                                                    '0 0 10px rgba(59, 130, 246, 0.5)',
                                                ],
                                            }
                                            : {}
                                    }
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    <div className="text-2xl">{step.icon}</div>
                                </motion.div>

                                {/* Connecting Line */}
                                {index < processSteps.length - 1 && (
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 h-4 bg-gray-700" />
                                )}

                                {/* Status Badge */}
                                {step.status === 'completed' && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                        <svg
                                            className="w-3 h-3 text-white"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Step Info */}
                            <div className="flex-1 bg-dark-800/50 rounded-lg p-3 border border-gray-700">
                                <div className="flex items-center justify-between mb-1">
                                    <span
                                        className={`text-sm font-bold ${step.status === 'completed'
                                                ? 'text-green-400'
                                                : step.status === 'active'
                                                    ? 'text-primary-400'
                                                    : 'text-gray-500'
                                            }`}
                                    >
                                        {step.name}
                                    </span>
                                    <span className="text-xs text-gray-400">{step.time}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">Duration: {step.duration}</span>
                                    <span
                                        className={`px-2 py-0.5 rounded-full ${step.status === 'completed'
                                                ? 'bg-green-500/20 text-green-400'
                                                : step.status === 'active'
                                                    ? 'bg-primary-500/20 text-primary-400'
                                                    : 'bg-gray-700 text-gray-500'
                                            }`}
                                    >
                                        {step.status === 'completed'
                                            ? 'Completed'
                                            : step.status === 'active'
                                                ? 'In Progress'
                                                : 'Pending'}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                    <span>Overall Progress</span>
                    <span className="font-bold text-primary-400">{progress.toFixed(0)}%</span>
                </div>
                <div className="relative h-3 bg-dark-800 rounded-full overflow-hidden border border-gray-700">
                    <motion.div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                    >
                        <motion.div
                            className="absolute top-0 right-0 h-full w-20 bg-gradient-to-r from-transparent to-white/30"
                            animate={{ x: [-100, 100] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    </motion.div>
                </div>
            </div>

            {/* Timeline Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-dark-800/50 rounded-lg p-3 border border-gray-700">
                    <div className="text-gray-400 mb-1">Start Time</div>
                    <div className="text-white font-bold">15:30:00</div>
                </div>
                <div className="bg-dark-800/50 rounded-lg p-3 border border-gray-700">
                    <div className="text-gray-400 mb-1">Current Time</div>
                    <div className="text-primary-400 font-bold">15:50:15</div>
                </div>
                <div className="bg-dark-800/50 rounded-lg p-3 border border-gray-700">
                    <div className="text-gray-400 mb-1">Est. Completion</div>
                    <div className="text-yellow-400 font-bold">16:00:00</div>
                </div>
                <div className="bg-dark-800/50 rounded-lg p-3 border border-gray-700">
                    <div className="text-gray-400 mb-1">Remaining</div>
                    <div className="text-green-400 font-bold">9m 45s</div>
                </div>
            </div>
        </div>
    );
}

export default Trajectory;
