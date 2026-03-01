import { motion } from 'framer-motion';

function Schematic() {
    const processSteps = [
        {
            id: 'dryer',
            name: 'Dryer',
            icon: '🔥',
            description: 'Resin drying',
            temp: '170°C',
            status: 'active',
        },
        {
            id: 'hopper',
            name: 'Hopper',
            icon: '📦',
            description: 'Material handling',
            status: 'active',
        },
        {
            id: 'injection',
            name: 'Injection',
            icon: '⚡',
            description: 'Plasticizing & injection',
            temp: '275°C',
            status: 'active',
        },
        {
            id: 'cooling',
            name: 'Cooling',
            icon: '❄️',
            description: 'Mould cooling',
            temp: '35°C',
            status: 'active',
        },
        {
            id: 'qc',
            name: 'QC',
            icon: '✅',
            description: 'Quality check',
            status: 'pending',
        },
        {
            id: 'packing',
            name: 'Packing',
            icon: '📦',
            description: 'Final packing',
            status: 'pending',
        },
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
            },
        },
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 },
    };

    return (
        <motion.div
            className="overflow-x-auto"
            variants={container}
            initial="hidden"
            animate="show"
        >
            <div className="min-w-max flex items-center space-x-8 p-4">
                {processSteps.map((step, index) => (
                    <motion.div
                        key={step.id}
                        variants={item}
                        className={`
              flex flex-col items-center space-y-2 min-w-[120px]
              ${step.status === 'active' ? 'text-primary-500' : 'text-gray-600'}
              ${step.status === 'pending' ? 'opacity-50' : 'opacity-100'}
            `}
                    >
                        {/* Step card */}
                        <div className={`
              w-16 h-16 rounded-lg flex items-center justify-center
              bg-dark-900 border-2 ${step.status === 'active' ? 'border-primary-500' : 'border-gray-700'
                            }
              transition-all duration-300
              ${step.status === 'active' ? 'shadow-lg shadow-primary-500/50' : ''}
            `}>
                            <div className="text-2xl">{step.icon}</div>
                        </div>

                        {/* Step info */}
                        <div className="text-center">
                            <div className="text-sm font-semibold">{step.name}</div>
                            <div className="text-xs text-gray-400 mt-1">{step.description}</div>
                            {step.temp && (
                                <div className={`text-xs mt-1 ${step.status === 'active' ? 'text-primary-400' : 'text-gray-500'
                                    }`}>
                                    {step.temp}
                                </div>
                            )}
                        </div>

                        {/* Arrow connector (not for last item) */}
                        {index < processSteps.length - 1 && (
                            <motion.div
                                className="absolute left-full ml-4 top-1/2 transform -translate-y-1/2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                            >
                                <svg
                                    className="w-6 h-6 text-gray-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
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
