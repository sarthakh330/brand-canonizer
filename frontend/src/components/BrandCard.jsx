/**
 * Brand Card Component
 * Displays a brand extraction in the gallery
 */

import { useNavigate } from 'react-router-dom';
import { formatDate, getQualityBadgeColor } from '../utils/api';
import ScoreBadge from './ScoreBadge';

export default function BrandCard({ brand }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/brand/${brand.brand_id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_-2px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-pointer border border-gray-100 overflow-hidden group"
    >
      {/* Color Swatches Header */}
      <div className="flex h-20">
        {brand.preview?.dominant_colors?.slice(0, 5).map((color, index) => (
          <div
            key={index}
            className="flex-1 transition-all group-hover:h-24"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Brand Name */}
        <h3 className="text-xl font-bold text-[#1f1f1f] mb-2 truncate tracking-tight">
          {brand.brand_name}
        </h3>

        {/* URL */}
        <p className="text-sm text-gray-500 mb-4 truncate">
          {brand.source_url}
        </p>

        {/* Score and Date */}
        <div className="flex items-center justify-between mb-4">
          <ScoreBadge
            score={brand.evaluation_summary?.overall_score}
            qualityBand={brand.evaluation_summary?.quality_band}
          />
          <span className="text-xs text-gray-400 font-medium">
            {formatDate(brand.extracted_at)}
          </span>
        </div>

        {/* Adjectives Tags */}
        {brand.adjectives && brand.adjectives.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {brand.adjectives.slice(0, 3).map((adj, index) => (
              <span
                key={index}
                className="px-3 py-1.5 text-xs font-semibold bg-[#e9d5c4]/30 text-gray-800 rounded-lg"
              >
                {adj}
              </span>
            ))}
            {brand.adjectives.length > 3 && (
              <span className="px-3 py-1.5 text-xs font-semibold bg-[#f4f2ef] text-gray-600 rounded-lg">
                +{brand.adjectives.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Top Strengths */}
        {brand.evaluation_summary?.top_strengths && brand.evaluation_summary.top_strengths.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Top Strengths</p>
            <p className="text-xs text-gray-700 font-medium leading-relaxed">
              {brand.evaluation_summary.top_strengths.join(' • ')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
