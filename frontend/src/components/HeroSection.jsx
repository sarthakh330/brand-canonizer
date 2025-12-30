/**
 * HeroSection Component
 * Full-width hero section with actual website screenshot
 * Shows the brand's visual impact immediately
 */

import { useState } from 'react';
import { API_BASE_URL } from '../utils/api';

export default function HeroSection({ brandName, sourceUrl, brandId, tagline }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Build screenshot URL with backend base URL
  const heroImageUrl = `${API_BASE_URL}/data/brands/${brandId}/captures/screenshots/hero.png`;

  const cleanUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    } catch (e) {
      return url;
    }
  };

  return (
    <section className="relative w-full -mx-6 mb-12 overflow-hidden">
      {/* Hero Image Container */}
      <div className="relative w-full h-[500px] bg-gradient-to-br from-gray-50 to-gray-100">
        {!imageError ? (
          <>
            <img
              src={heroImageUrl}
              alt={`${brandName} website hero`}
              className={`w-full h-full object-cover object-top transition-opacity duration-500 ${
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
          </>
        ) : (
          // Fallback if image fails to load
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-400 text-sm">Screenshot not available</p>
            </div>
          </div>
        )}

        {/* Dark overlay gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Brand Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-3 tracking-tight drop-shadow-lg">
              {brandName}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 font-medium mb-2 drop-shadow-md">
              {cleanUrl(sourceUrl)}
            </p>
            {tagline && (
              <p className="text-lg text-white/80 italic drop-shadow-md">
                "{tagline}"
              </p>
            )}
          </div>
        </div>

        {/* "View Full Screenshot" button */}
        {!imageError && (
          <a
            href={heroImageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-6 right-6 px-4 py-2 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2 group"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
            View Full Screenshot
          </a>
        )}
      </div>

      {/* Subtle shadow to lift the hero from content below */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#fdfdfc] to-transparent" />
    </section>
  );
}
