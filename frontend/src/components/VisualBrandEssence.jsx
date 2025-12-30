/**
 * VisualBrandEssence Component
 * Mood board style presentation with screenshots and brand adjectives overlaid
 * Shows brand personality visually, not just as text
 */

import { useState } from 'react';
import { API_BASE_URL } from '../utils/api';

export default function VisualBrandEssence({ brandEssence, brandId, brandName }) {
  const adjectives = brandEssence?.adjectives || [];
  const description = brandEssence?.description;
  const tone = brandEssence?.tone;

  // Use different screenshots for each adjective to create visual variety
  const screenshotIds = ['hero', 'section_1', 'section_2', 'section_3'];

  return (
    <section className="bg-white rounded-3xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-gray-100 p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[#1f1f1f] mb-3 tracking-tight">Brand Essence</h2>
        <p className="text-gray-600 leading-relaxed max-w-3xl">
          {description || `${brandName}'s visual identity and personality expressed through design and content.`}
        </p>
        {tone && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-xl">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <span className="text-sm font-semibold text-purple-900">Tone: {tone}</span>
          </div>
        )}
      </div>

      {/* Visual Mood Board Grid */}
      {adjectives.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {adjectives.slice(0, 4).map((adjective, index) => (
            <AdjectiveCard
              key={index}
              adjective={adjective}
              screenshotId={screenshotIds[index % screenshotIds.length]}
              brandId={brandId}
              index={index}
            />
          ))}
        </div>
      )}

      {/* Additional adjectives as badges (if more than 4) */}
      {adjectives.length > 4 && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
            Additional Qualities
          </h3>
          <div className="flex flex-wrap gap-2">
            {adjectives.slice(4).map((adj, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-[#e9d5c4]/30 text-gray-800 rounded-xl font-semibold text-base"
              >
                {adj}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * Individual adjective card with screenshot background
 */
function AdjectiveCard({ adjective, screenshotId, brandId, index }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const imageUrl = `${API_BASE_URL}/data/brands/${brandId}/captures/screenshots/${screenshotId}.png`;

  // Gradient colors for overlays (cycles through different color schemes)
  const gradients = [
    'from-purple-900/80 via-purple-800/60 to-purple-700/40',
    'from-blue-900/80 via-blue-800/60 to-blue-700/40',
    'from-indigo-900/80 via-indigo-800/60 to-indigo-700/40',
    'from-slate-900/80 via-slate-800/60 to-slate-700/40',
  ];

  const gradient = gradients[index % gradients.length];

  return (
    <div className="group relative h-48 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      {!imageError ? (
        <>
          {/* Screenshot Background */}
          <div className="absolute inset-0">
            <img
              src={imageUrl}
              alt={`${adjective} mood`}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(false);
              }}
            />

            {/* Loading shimmer */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
            )}
          </div>

          {/* Gradient Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} backdrop-blur-[2px]`} />

          {/* Adjective Text */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <h3 className="text-3xl md:text-4xl font-bold text-white text-center drop-shadow-2xl tracking-tight">
              {adjective}
            </h3>
          </div>

          {/* Decorative corner accent */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-bl-full" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-tr-full" />
        </>
      ) : (
        // Fallback with gradient background
        <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <h3 className="text-3xl md:text-4xl font-bold text-white text-center px-4 tracking-tight">
            {adjective}
          </h3>
        </div>
      )}
    </div>
  );
}
