import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

function Schematic() {
    const [materialFlow, setMaterialFlow] = useState(0);
    const [activeMachine, setActiveMachine] = useState<string | null>(null);

    useEffect(() => {
        // Continuous material flow animation
        const interval = setInterval(() => {
            setMaterialFlow(prev => (prev + 1) % 100);
        }, 50);

        // Cycle through active machines
        const machineInterval = setInterval(() => {
            const steps = ['dryer', 'hopper', 'injection', 'cooling', 'qc', 'packing'];
            setActiveMachine(steps[Math.floor(Math.random() * steps.length)]);
        }, 3000);

        return () => {
            clearInterval(interval);
            clearInterval(machineInterval);
        };
    }, []);

    const processSteps = [
        {
            id: 'dryer',
            name: 'Dryer',
            icon: '🔥',
            description: 'Resin drying',
            temp: '170°C',
            pressure: '2.5 bar',
            status: 'active',
            metrics: { efficiency: 98, runtime: '142h' },
        },
        {
            id: 'hopper',
            name: 'Hopper',
            icon: '📦',
            description: 'Material handling',
            temp: '65°C',
            level: '78%',
            status: 'active',
            metrics: { efficiency: 100, runtime: '142h' },
        },
        {
            id: 'injection',
            name: 'Injection',
            icon: '⚡',
            description: 'Plasticizing & injection',
            temp: '275°C',
            pressure: '120 bar',
            status: 'active',
            metrics: { efficiency: 94, runtime: '140h', cycles: 15420 },
        },
        {
            id: 'cooling',
            name: 'Cooling',
            icon: '❄️',
            description: 'Mould cooling',
            temp: '35°C',
            flow: '18 L/min',
            status: 'active',
            metrics: { efficiency: 96, runtime: '142h' },
        },
        {
            id: 'qc',
            name: 'QC',
            icon: '✅',
            description: 'Quality check',
            pass: '97.2%',
            status: 'active',
            metrics: { efficiency: 100, inspected: 1450 },
        },
        {
            id: 'packing',
            name: 'Packing',
            icon: '📦',
            description: 'Final packing',
            boxes: '142',
            status: 'active',
            metrics: { efficiency: 98, packed: 1410 },
        },
    ];

    return (
        <div className="relative">
            {/* Production Line Title */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold text-white mb-1">Production Line Digital Twin</h3>
                    <p className="text-sm text-gray-400">Live monitoring • 48-cavity injection molding</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-green-400 font-semibold">RUNNING</span>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-primary-500">{materialFlow}%</div>
                        <div className="text-xs text-gray-400">Line Efficiency</div>
                    </div>
                </div>
            </div>

            <div className="relative overflow-x-auto pb-8">
                {/* Material Flow Pipe */}
                <div className="absolute top-28 left-0 right-0 h-2 ">
                    <div className="relative w-full h-full bg-dark-700 rounded-full overflow-hidden">
                        <motion.div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-500/30 via-primary-500 to-primary-500/30 rounded-full"
                            style={{ width: '20%' }}
                            animate={{ left: ['-20%', '100%'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        />
                    </div>
                </div>

                {/* Process Steps */}
                <div className="min-w-max flex items-start justify-between space-x-4 px-4 relative">
                    {processSteps.map((step, index) => (
                        <div
                            key={step.id}
                            className="flex flex-col items-center relative"
                            style={{ minWidth: '180px' }}
                        >
                            {/* Machine Unit */}
                            <motion.div
                                className={`
                                    relative w-32 h-32 rounded-2xl flex items-center justify-center
                                    bg-gradient-to-br from-dark-800 to-dark-900
                                    border-2 transition-all duration-300 cursor-pointer
                                    ${activeMachine === step.id
                                        ? 'border-primary-500 shadow-2xl shadow-primary-500/50 scale-105'
                                        : 'border-gray-700 hover:border-gray-600'
                                    }
                                `}
                                whileHover={{ scale: 1.05 }}
                                animate={activeMachine === step.id ? {
                                    boxShadow: [
                                        '0 0 20px rgba(59, 130, 246, 0.5)',
                                        '0 0 40px rgba(59, 130, 246, 0.8)',
                                        '0 0 20px rgba(59, 130, 246, 0.5)',
                                    ]
                                } : {}}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                {/* Machine Icon */}
                                <div className="text-5xl mb-2">{step.icon}</div>

                                {/* Status Indicator */}
                                <div className="absolute top-2 right-2">
                                    <motion.div
                                        className="w-3 h-3 bg-green-500 rounded-full"
                                        animate={{ opacity: [1, 0.3, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                </div>

                                {/* Processing Animation Overlay */}
                                <AnimatePresence>
                                    {activeMachine === step.id && (
                                        <motion.div
                                            className="absolute inset-0 rounded-2xl bg-primary-500/10"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: [0, 1, 0] }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        />
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            {/* Machine Info Panel */}
                            <div className="mt-4 w-full bg-dark-800/80 backdrop-blur-sm rounded-lg p-3 border border-gray-700">
                                <div className="text-center mb-2">
                                    <div className="text-sm font-bold text-white">{step.name}</div>
                                    <div className="text-xs text-gray-400">{step.description}</div>
                                </div>

                                {/* Metrics */}
                                <div className="space-y-1 text-xs">
                                    {step.temp && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Temp:</span>
                                            <span className="text-primary-400 font-semibold">{step.temp}</span>
                                        </div>
                                    )}
                                    {step.pressure && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Pressure:</span>
                                            <span className="text-primary-400 font-semibold">{step.pressure}</span>
                                        </div>
                                    )}
                                    {step.level && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Level:</span>
                                            <span className="text-green-400 font-semibold">{step.level}</span>
                                        </div>
                                    )}
                                    {step.flow && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Flow:</span>
                                            <span className="text-blue-400 font-semibold">{step.flow}</span>
                                        </div>
                                    )}
                                    {step.pass && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Pass Rate:</span>
                                            <span className="text-green-400 font-semibold">{step.pass}</span>
                                        </div>
                                    )}
                                    {step.boxes && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Boxes:</span>
                                            <span className="text-yellow-400 font-semibold">{step.boxes}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-1 border-t border-gray-700">
                                        <span className="text-gray-400">Efficiency:</span>
                                        <span className={`font-bold ${step.metrics.efficiency >= 95 ? 'text-green-400' : 'text-yellow-400'}`}>
                                            {step.metrics.efficiency}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Connector Arrow */}
                            {index < processSteps.length - 1 && (
                                <div className="absolute left-full top-16 -ml-2 transform -translate-x-1/2">
                                    <motion.svg
                                        className="w-12 h-12 text-primary-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        animate={{ x: [0, 5, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    >
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                                    />
                                </svg>
                            </motion.div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Status indicators */}
            <div className="mt-4 flex items-center justify-center space-x-6 text-xs text-gray-400">
                <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    <span>Active</span>
                </div>
                <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                    <span>Pending</span>
                </div>
                <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
                    <span>Completed</span>
                </div>
            </div>
        </motion.div>
    );
}

export default Schematic;
