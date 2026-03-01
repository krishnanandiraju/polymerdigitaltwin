import { motion } from 'framer-motion';

interface TrajectoryProps {
    lotId: string;
}

function Trajectory({ lotId }: TrajectoryProps) {
    const processSteps = [
        { id: 'dryer', name: 'Dryer', icon: '🔥', status: 'active' },
        { id: 'hopper', name: 'Hopper', icon: '📦', status: 'active' },
        { id: 'injection', name: 'Injection', icon: '⚡', status: 'active' },
        { id: 'cooling', name: 'Cooling', icon: '❄️', status: 'active' },
        { id: 'qc', name: 'QC', icon: '✅', status: 'active' },
        { id: 'packing', name: 'Packing', icon: '📦', status: 'pending' },
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
        <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-400">
                <span>Lot ID: {lotId}</span>
                <span className="text-green-400">✓ In Process</span>
            </div>

            <motion.div
                className="flex items-center justify-between"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {processSteps.map((step, index) => (
                    <motion.div
                        key={step.id}
                        variants={item}
                        className={`
              flex flex-col items-center space-y-2
              ${step.status === 'active' ? 'text-primary-500' : 'text-gray-600'}
              ${step.status === 'pending' ? 'opacity-50' : 'opacity-100'}
            `}
                    >
                        {/* Status indicator */}
                        <div className={`
              w-4 h-4 rounded-full ${step.status === 'active' ? 'bg-primary-500' :
                                step.status === 'pending' ? 'bg-gray-600' : 'bg-gray-500'
                            }
            `} />

                        {/* Step icon */}
                        <div className="text-2xl">{step.icon}</div>

                        {/* Step name */}
                        <div className="text-xs font-medium">{step.name}</div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Progress line */}
            <div className="relative">
                <div className="absolute top-2 left-0 right-0 h-1 bg-gray-700 rounded-full"></div>
                <div
                    className="absolute top-2 left-0 h-1 bg-primary-500 rounded-full"
                    style={{
                        width: '83%', // Percentage through the process (5 out of 6 steps)
                        transition: 'width 1s ease-out',
                    }}
                ></div>
            </div>

            {/* Timeline */}
            <div className="text-xs text-gray-400 space-y-1">
                <div className="flex justify-between">
                    <span>Start: 15:30</span>
                    <span>Current: 15:42</span>
                </div>
                <div className="flex justify-between">
                    <span>Next step: QC at 15:45</span>
                    <span>Est. finish: 16:00</span>
                </div>
            </div>
        </div>
    );
}

export default Trajectory;
