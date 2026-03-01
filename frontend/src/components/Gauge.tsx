interface GaugeProps {
    value: number;
    max: number;
    color: 'red' | 'green' | 'blue' | 'yellow';
    size: 'small' | 'medium' | 'large';
}

function Gauge({ value, max, color, size }: GaugeProps) {
    const percentage = Math.min((value / max) * 100, 100);
    const radius = size === 'small' ? 20 : size === 'medium' ? 30 : 40;
    const strokeWidth = size === 'small' ? 4 : size === 'medium' ? 6 : 8;
    const diameter = radius * 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    const colorClasses = {
        red: 'text-red-500',
        green: 'text-green-500',
        blue: 'text-blue-500',
        yellow: 'text-yellow-500',
    };

    return (
        <div className="flex items-center justify-center">
            <svg
                width={diameter + strokeWidth}
                height={diameter + strokeWidth}
                className={colorClasses[color]}
            >
                {/* Background circle */}
                <circle
                    cx={radius + strokeWidth / 2}
                    cy={radius + strokeWidth / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeOpacity={0.3}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${radius + strokeWidth / 2} ${radius + strokeWidth / 2})`}
                />

                {/* Progress circle */}
                <circle
                    cx={radius + strokeWidth / 2}
                    cy={radius + strokeWidth / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeOpacity={1}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform={`rotate(-90 ${radius + strokeWidth / 2} ${radius + strokeWidth / 2})`}
                    style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                />
            </svg>
        </div>
    );
}

export default Gauge;
