interface KPICardProps {
    title: string;
    value: string;
    trend: string;
    color: 'red' | 'green' | 'blue' | 'yellow';
    icon: string;
}

function KPICard({ title, value, trend, color, icon }: KPICardProps) {
    const colorClasses = {
        red: 'text-red-400',
        green: 'text-green-400',
        blue: 'text-blue-400',
        yellow: 'text-yellow-400',
    };

    const trendColor = trend.startsWith('↑') ? 'text-red-400' : 'text-green-400';

    return (
        <div className="bg-dark-800 rounded-lg p-6 panel-shadow glass fade-in">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-400">{title}</h3>
                <div className={`text-2xl ${colorClasses[color]}`}>{icon}</div>
            </div>
            <div className="space-y-2">
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className={`text-sm font-medium ${trendColor}`}>{trend}</div>
            </div>
        </div>
    );
}

export default KPICard;
