import { motion } from 'framer-motion';
import { CavityRisk } from '../api';

interface CavityHeatmapProps {
    risks: CavityRisk[];
}

function CavityHeatmap({ risks }: CavityHeatmapProps) {
    // Create a 6x8 grid for 48 cavities
    const gridSize = { rows: 6, cols: 8 };
    const cavities = Array.from({ length: 48 }, (_, i) => i + 1);

    const getCavityRisk = (cavity: number): CavityRisk | undefined => {
        return risks.find(r => r.cavity === cavity);
    };

    const getRiskColor = (riskScore: number): string => {
        if (riskScore > 0.8) return 'bg-red-500';
        if (riskScore > 0.6) return 'bg-orange-500';
        if (riskScore > 0.4) return 'bg-yellow-500';
        if (riskScore > 0.2) return 'bg-green-500';
        return 'bg-blue-500';
    };

    return (
        <div className="grid grid-cols-8 gap-1">
            {cavities.map((cavity) => {
                const risk = getCavityRisk(cavity);
                const riskScore = risk?.risk_score || 0;

                return (
                    <motion.div
                        key={cavity}
                        className={`
              aspect-square rounded-lg flex items-center justify-center
              text-xs font-medium text-white cursor-pointer
              transition-colors duration-300 hover:opacity-80
              ${getRiskColor(riskScore)}
            `}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: cavity * 0.01 }}
                        whileHover={{ scale: 1.1 }}
                    >
                        <div className="text-center">
                            <div className="text-xs font-bold">{cavity}</div>
                            {risk?.rejected_count > 0 && (
                                <div className="text-[8px] opacity-90">
                                    {risk.rejected_count}x
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

export default CavityHeatmap;
