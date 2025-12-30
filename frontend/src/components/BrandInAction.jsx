/**
 * BrandInAction Component
 * Visual journey through the website with section screenshots
 * Shows the brand as a visual story, like a portfolio case study
 */

import { useState } from 'react';
import { API_BASE_URL } from '../utils/api';

export default function BrandInAction({ brandId, brandName }) {
  // Available screenshots from capture
  const screenshots = [
    { id: 'full_page', name: 'Full Page', caption: 'Complete website overview' },
    { id: 'hero', name: 'Hero Section', caption: 'First impression and primary message' },
    { id: 'section_1', name: 'Section 1', caption: 'Key content area' },
    { id: 'section_2', name: 'Section 2', caption: 'Supporting information' },
    { id: 'section_3', name: 'Section 3', caption: 'Additional features or content' },
    { id: 'section_4', name: 'Section 4', caption: 'Footer or closing section' },
  ];

  return (
    <section className="bg-white rounded-3xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-gray-100 p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[#1f1f1f] mb-3 tracking-tight">Brand in Action</h2>
        <p className="text-gray-600 leading-relaxed">
          Visual journey through {brandName}'s website showing the brand experience in context
        </p>
      </div>

      <div className="space-y-12">
        {screenshots.map((screenshot, index) => (
          <ScreenshotCard
            key={screenshot.id}
            screenshot={screenshot}
            brandId={brandId}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * Individual screenshot card with lazy loading and error handling
 */
function ScreenshotCard({ screenshot, brandId, index }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const imageUrl = `${API_BASE_URL}/data/brands/${brandId}/captures/screenshots/${screenshot.id}.png`;

  return (
    <div className="group">
      {/* Screenshot Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-[#1f1f1f] mb-1">
            {screenshot.name}
          </h3>
          <p className="text-sm text-gray-500">{screenshot.caption}</p>
        </div>
        <span className="text-sm font-mono text-gray-400 px-3 py-1 bg-gray-50 rounded-full">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* Screenshot Image */}
      <div
        className={`relative w-full rounded-2xl overflow-hidden border-2 border-gray-100 transition-all duration-300 cursor-pointer ${
          isExpanded ? 'ring-4 ring-purple-200' : 'hover:border-gray-200 hover:shadow-lg'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {!imageError ? (
          <>
            <div className={`relative ${isExpanded ? 'h-auto' : 'h-96'}`}>
              <img
                src={imageUrl}
                alt={`${screenshot.name} screenshot`}
                className={`w-full ${isExpanded ? 'h-auto' : 'h-96'} object-cover object-top transition-all duration-500 ${
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

              {/* Gradient overlay when not expanded */}
              {!isExpanded && imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30 pointer-events-none" />
              )}
            </div>

            {/* Expand/Collapse indicator */}
            <div className="absolute bottom-4 right-4 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-700 flex items-center gap-2 shadow-lg group-hover:bg-white transition-all">
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {isExpanded ? 'Collapse' : 'Expand'}
            </div>

            {/* View full size link */}
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-lg transition-all shadow-md opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </>
        ) : (
          // Fallback if image fails to load
          <div className="w-full h-48 flex items-center justify-center bg-gray-50 rounded-xl">
            <div className="text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-400 text-sm">Screenshot not available</p>
            </div>
          </div>
        )}
      </div>

      {/* Divider between screenshots (except last one) */}
      {index < 5 && (
        <div className="mt-12 border-t border-gray-100" />
      )}
    </div>
  );
}
