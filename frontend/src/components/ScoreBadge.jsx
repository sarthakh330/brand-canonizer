/**
 * Score Badge Component
 * Displays evaluation score with quality band
 */

import { getQualityBadgeColor } from '../utils/api';

export default function ScoreBadge({ score, qualityBand, size = 'md' }) {
  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-1.5 text-sm',
    lg: 'px-5 py-2 text-base'
  };

  if (score === undefined || score === null) {
    return null;
  }

  // Use warm accent color for scores
  const getScoreColor = () => {
    if (score >= 4.5) return 'bg-[#e9d5c4]/40 text-[#1f1f1f] border-[#e9d5c4]';
    if (score >= 4.0) return 'bg-[#e9d5c4]/30 text-[#1f1f1f] border-[#e9d5c4]/60';
    if (score >= 3.5) return 'bg-[#f4f2ef] text-gray-700 border-gray-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border ${sizeClasses[size]} font-bold ${getScoreColor()}`}>
      <span className="text-lg">{score.toFixed(1)}</span>
      <span className="text-xs font-medium opacity-70">/5.0</span>
      {qualityBand && size !== 'sm' && (
        <span className="ml-1 opacity-80 capitalize text-xs font-semibold">• {qualityBand}</span>
      )}
    </div>
  );
}
