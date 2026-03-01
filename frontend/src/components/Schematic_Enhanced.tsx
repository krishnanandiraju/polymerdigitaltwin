import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import TwinModal from './TwinModal';
import DryerDigitalTwin from './DryerDigitalTwin';
import InjectionMachineDigitalTwin from './InjectionMachineDigitalTwin';

function SchematicEnhanced() {
    const [materialFlow, setMaterialFlow] = useState(94);
    const [activeMachine, setActiveMachine] = useState<string>('injection');
    const [selectedMachine, setSelectedMachine] = useState<string | null>(null);

    useEffect(() => {
        // Simulate efficiency fluctuation
        const interval = setInterval(() => {
            setMaterialFlow(prev => Math.min(100, Math.max(85, prev + (Math.random() - 0.5) * 2)));
        }, 2000);

        // Cycle through active machines
        const machineInterval = setInterval(() => {
            const steps = ['dryer', 'hopper', 'injection', 'cooling', 'qc', 'packing'];
            const currentIndex = steps.indexOf(activeMachine);
            setActiveMachine(steps[(currentIndex + 1) % steps.length]);
        }, 4000);

        return () => {
            clearInterval(interval);
            clearInterval(machineInterval);
        };
    }, [activeMachine]);

    const handleMachineClick = (machineId: string) => {
        // Dryer and Injection have 3D twins
        if (machineId === 'dryer' || machineId === 'injection') {
            setSelectedMachine(machineId);
        }
    };

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
                    <h3 className="text-2xl font-bold text-white mb-1">🏭 Production Line Digital Twin</h3>
                    <p className="text-sm text-gray-400">Live monitoring • 48-cavity injection molding • Real-time updates</p>
                </div>
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                        <span className="text-sm text-green-400 font-bold">RUNNING</span>
                    </div>
                    <div className="text-right bg-dark-800/50 rounded-lg px-4 py-2 border border-primary-500/30">
                        <div className="text-3xl font-bold text-primary-500">{materialFlow.toFixed(1)}%</div>
                        <div className="text-xs text-gray-400">Line Efficiency</div>
                    </div>
                </div>
            </div>

            <div className="relative overflow-x-auto pb-8">
                {/* Material Flow Pipe */}
                <div className="absolute top-28 left-0 right-0 h-3 z-0">
                    <div className="relative w-full h-full bg-gradient-to-r from-dark-700 via-dark-600 to-dark-700 rounded-full overflow-hidden shadow-inner">
                        {/* Flowing material animation */}
                        <motion.div
                            className="absolute top-0 left-0 h-full w-32 bg-gradient-to-r from-transparent via-primary-500 to-transparent rounded-full opacity-70"
                            animate={{ left: ['-10%', '100%'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        />
                        <motion.div
                            className="absolute top-0 left-0 h-full w-24 bg-gradient-to-r from-transparent via-primary-400 to-transparent rounded-full opacity-50"
                            animate={{ left: ['-15%', '105%'] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', delay: 0.5 }}
                        />
                    </div>
                </div>

                {/* Process Steps */}
                <div className="min-w-max flex items-start justify-between space-x-6 px-4 relative z-10">
                    {processSteps.map((step, index) => (
                        <div
                            key={step.id}
                            className="flex flex-col items-center relative"
                            style={{ minWidth: '200px' }}
                        >
                            {/* Machine Unit */}
                            <motion.div
                                onClick={() => handleMachineClick(step.id)}
                                className={`
                                    relative w-36 h-36 rounded-3xl flex flex-col items-center justify-center
                                    bg-gradient-to-br from-dark-800 via-dark-900 to-black
                                    border-2 transition-all duration-500 cursor-pointer
                                    ${activeMachine === step.id
                                        ? 'border-primary-500 shadow-2xl shadow-primary-500/60 scale-110'
                                        : 'border-gray-700 hover:border-gray-600 hover:scale-105'
                                    }
                                    ${(step.id === 'dryer' || step.id === 'injection') ? 'ring-2 ring-yellow-500/30 hover:ring-yellow-500/60' : ''}
                                `}
                                whileHover={{ scale: activeMachine === step.id ? 1.12 : 1.08 }}
                                animate={activeMachine === step.id ? {
                                    boxShadow: [
                                        '0 0 30px rgba(59, 130, 246, 0.6)',
                                        '0 0 50px rgba(59, 130, 246, 0.9)',
                                        '0 0 30px rgba(59, 130, 246, 0.6)',
                                    ]
                                } : {}}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                {/* 3D Twin Badge (for dryer and injection) */}
                                {(step.id === 'dryer' || step.id === 'injection') && (
                                    <div className="absolute -top-2 -right-2 z-10">
                                        <motion.div
                                            className="bg-yellow-500 text-dark-900 text-xs font-bold px-2 py-1 rounded-full shadow-lg"
                                            animate={{ y: [-2, 2, -2] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            3D
                                        </motion.div>
                                    </div>
                                )}

                                {/* Machine Icon */}
                                <div className="text-6xl mb-1">{step.icon}</div>

                                {/* Status Indicator */}
                                <div className="absolute top-3 right-3">
                                    <motion.div
                                        className="w-4 h-4 bg-green-500 rounded-full shadow-lg shadow-green-500/50"
                                        animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                </div>

                                {/* Efficiency Badge */}
                                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-dark-900/80 backdrop-blur-sm px-3 py-1 rounded-full border border-primary-500/30">
                                    <span className="text-xs font-bold text-primary-400">{step.metrics.efficiency}%</span>
                                </div>

                                {/* Processing Animation Overlay */}
                                <AnimatePresence>
                                    {activeMachine === step.id && (
                                        <>
                                            <motion.div
                                                className="absolute inset-0 rounded-3xl bg-primary-500/10 border-2 border-primary-500/30"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: [0, 1, 0], scale: [0.8, 1.1, 1.2] }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                            />
                                            <motion.div
                                                className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-500/20 to-transparent"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: [0, 0.5, 0] }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            />
                                        </>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            {/* Machine Info Panel */}
                            <div className="mt-5 w-full bg-gradient-to-br from-dark-800/90 to-dark-900/90 backdrop-blur-sm rounded-xl p-4 border border-gray-700 shadow-xl">
                                <div className="text-center mb-3">
                                    <div className="text-sm font-bold text-white uppercase tracking-wide">{step.name}</div>
                                    <div className="text-xs text-gray-400 mt-1">{step.description}</div>
                                </div>

                                {/* Metrics */}
                                <div className="space-y-2 text-xs">
                                    {step.temp && (
                                        <div className="flex justify-between items-center bg-dark-900/50 rounded px-2 py-1.5">
                                            <span className="text-gray-400">Temperature:</span>
                                            <span className="text-primary-400 font-bold">{step.temp}</span>
                                        </div>
                                    )}
                                    {step.pressure && (
                                        <div className="flex justify-between items-center bg-dark-900/50 rounded px-2 py-1.5">
                                            <span className="text-gray-400">Pressure:</span>
                                            <span className="text-primary-400 font-bold">{step.pressure}</span>
                                        </div>
                                    )}
                                    {step.level && (
                                        <div className="flex justify-between items-center bg-dark-900/50 rounded px-2 py-1.5">
                                            <span className="text-gray-400">Level:</span>
                                            <span className="text-green-400 font-bold">{step.level}</span>
                                        </div>
                                    )}
                                    {step.flow && (
                                        <div className="flex justify-between items-center bg-dark-900/50 rounded px-2 py-1.5">
                                            <span className="text-gray-400">Flow Rate:</span>
                                            <span className="text-blue-400 font-bold">{step.flow}</span>
                                        </div>
                                    )}
                                    {step.pass && (
                                        <div className="flex justify-between items-center bg-dark-900/50 rounded px-2 py-1.5">
                                            <span className="text-gray-400">Pass Rate:</span>
                                            <span className="text-green-400 font-bold">{step.pass}</span>
                                        </div>
                                    )}
                                    {step.boxes && (
                                        <div className="flex justify-between items-center bg-dark-900/50 rounded px-2 py-1.5">
                                            <span className="text-gray-400">Boxes:</span>
                                            <span className="text-yellow-400 font-bold">{step.boxes}</span>
                                        </div>
                                    )}
                                    {step.metrics.runtime && (
                                        <div className="flex justify-between items-center bg-dark-900/50 rounded px-2 py-1.5">
                                            <span className="text-gray-400">Runtime:</span>
                                            <span className="text-gray-300 font-bold">{step.metrics.runtime}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Connector Arrow */}
                            {index < processSteps.length - 1 && (
                                <div className="absolute left-full top-[70px] transform translate-x-[-20px] z-20">
                                    <motion.svg
                                        className="w-16 h-16 text-primary-500 drop-shadow-lg"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        animate={{ x: [0, 8, 0], opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2.5}
                                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                                        />
                                    </motion.svg>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Production Stats Footer */}
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div
                    className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 rounded-xl p-5 border border-gray-700 hover:border-primary-500/50 transition-all duration-300"
                    whileHover={{ scale: 1.05, y: -5 }}
                >
                    <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Total Cycles Today</div>
                    <div className="text-3xl font-bold text-white">15,420</div>
                    <div className="text-xs text-green-400 mt-2 flex items-center">
                        <span className="mr-1">↑</span> 2.3% vs yesterday
                    </div>
                </motion.div>
                <motion.div
                    className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 rounded-xl p-5 border border-gray-700 hover:border-green-500/50 transition-all duration-300"
                    whileHover={{ scale: 1.05, y: -5 }}
                >
                    <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Line Uptime</div>
                    <div className="text-3xl font-bold text-green-400">98.5%</div>
                    <div className="text-xs text-gray-400 mt-2">Last 24 hours</div>
                </motion.div>
                <motion.div
                    className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 rounded-xl p-5 border border-gray-700 hover:border-primary-500/50 transition-all duration-300"
                    whileHover={{ scale: 1.05, y: -5 }}
                >
                    <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Avg Cycle Time</div>
                    <div className="text-3xl font-bold text-primary-400">22.3s</div>
                    <div className="text-xs text-gray-400 mt-2">Target: 22.0s</div>
                </motion.div>
                <motion.div
                    className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 rounded-xl p-5 border border-gray-700 hover:border-yellow-500/50 transition-all duration-300"
                    whileHover={{ scale: 1.05, y: -5 }}
                >
                    <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Material Usage</div>
                    <div className="text-3xl font-bold text-yellow-400">847 kg</div>
                    <div className="text-xs text-gray-400 mt-2">PET resin today</div>
                </motion.div>
            </div>

            {/* 3D Digital Twin Modal - Dryer */}
            <TwinModal
                isOpen={selectedMachine === 'dryer'}
                onClose={() => setSelectedMachine(null)}
                title="Resin Dryer - 3D Digital Twin"
            >
                <DryerDigitalTwin />
            </TwinModal>

            {/* 3D Digital Twin Modal - Injection Machine */}
            <TwinModal
                isOpen={selectedMachine === 'injection'}
                onClose={() => setSelectedMachine(null)}
                title="Injection Moulding Machine - 3D Digital Twin"
            >
                <InjectionMachineDigitalTwin />
            </TwinModal>
        </div>
    );
}

export default SchematicEnhanced;
