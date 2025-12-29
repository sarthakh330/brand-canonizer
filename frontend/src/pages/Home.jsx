/**
 * Home Page - Redesigned to match reference aesthetic
 * Warm, professional design with Plus Jakarta Sans
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllBrands, startExtraction } from '../utils/api';
import BrandCard from '../components/BrandCard';

export default function Home() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [adjectives, setAdjectives] = useState([]);
  const [adjectiveInput, setAdjectiveInput] = useState('');
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [error, setError] = useState(null);

  // Load existing brands
  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      setLoadingBrands(true);
      const data = await getAllBrands();
      setBrands(data);
    } catch (err) {
      console.error('Error loading brands:', err);
    } finally {
      setLoadingBrands(false);
    }
  };

  // Handle adjective input
  const handleAdjectiveKeyDown = (e) => {
    if (e.key === 'Enter' && adjectiveInput.trim()) {
      e.preventDefault();
      if (!adjectives.includes(adjectiveInput.trim())) {
        setAdjectives([...adjectives, adjectiveInput.trim()]);
      }
      setAdjectiveInput('');
    }
  };

  const removeAdjective = (index) => {
    setAdjectives(adjectives.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch (e) {
      setError('Please enter a valid URL (e.g., https://stripe.com)');
      return;
    }

    setLoading(true);

    try {
      const result = await startExtraction(url, adjectives);
      // Navigate to processing page
      navigate(`/processing/${result.session_id}`);
    } catch (err) {
      console.error('Extraction error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to start extraction');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfdfc]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#fdfdfc]/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1f1f1f] text-white rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <h2 className="text-[#1f1f1f] text-xl font-bold tracking-tight">Brand Canonizer</h2>
          </div>
          <button
            onClick={() => navigate('/inspirations')}
            className="px-6 py-2.5 bg-[#1f1f1f] hover:bg-black text-white rounded-full font-semibold text-sm shadow-lg shadow-black/10 hover:shadow-black/20 hover:-translate-y-0.5 transition-all duration-200"
          >
            Design Inspirations
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col justify-center items-center px-4 py-12 lg:py-24 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div
            className="absolute -top-[10%] left-[10%] w-[40vw] h-[40vw] bg-[#e9d5c4]/20 rounded-full blur-[120px] mix-blend-multiply opacity-60"
            style={{ animation: 'pulse 8s ease-in-out infinite' }}
          />
          <div className="absolute top-[20%] right-[5%] w-[35vw] h-[35vw] bg-gray-200 rounded-full blur-[100px] mix-blend-multiply opacity-50" />
        </div>

        <div className="w-full max-w-[900px] flex flex-col items-center z-10">
          {/* Hero Text */}
          <div className="text-center mb-12">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e9d5c4]/20 border border-[#e9d5c4]/30 text-xs font-semibold uppercase tracking-wider text-gray-800 mb-6">
              <span className="w-2 h-2 rounded-full bg-orange-400"></span>
              AI-Powered Design Analysis
            </div>

            {/* Headline */}
            <h1 className="text-[#1f1f1f] tracking-tight text-5xl md:text-6xl lg:text-[72px] font-extrabold leading-[1.05] mb-8">
              Turn your website into a{' '}
              <br className="hidden md:block" />
              <span className="relative inline-block">
                <span className="relative z-10">brand system.</span>
                <svg
                  className="absolute w-full h-3 -bottom-1 left-0 text-[#e9d5c4]/60"
                  preserveAspectRatio="none"
                  viewBox="0 0 100 10"
                >
                  <path
                    d="M0 5 Q 50 10 100 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                  />
                </svg>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-gray-500 text-lg md:text-xl font-medium leading-relaxed max-w-[640px] mx-auto">
              Our design agent analyzes your digital footprint to generate professional-grade identity reports, extracting typography, palettes, and voice automatically.
            </p>
          </div>

          {/* Input Form */}
          <div className="w-full max-w-[680px] bg-white rounded-3xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] p-3 border border-gray-100">
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-2">
              {/* URL Input */}
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="paste website url here..."
                  className="block w-full pl-12 pr-4 py-5 rounded-2xl bg-[#f4f2ef] border border-transparent focus:bg-white focus:border-gray-200 text-lg text-[#1f1f1f] placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all duration-300"
                  disabled={loading}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="bg-[#1f1f1f] hover:bg-black text-white text-base font-bold py-5 px-8 rounded-2xl shadow-lg shadow-black/10 hover:shadow-black/20 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Report</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Error Message */}
            {error && (
              <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 mt-12 opacity-80">
            <div className="flex items-center gap-2.5 px-4 py-2 bg-white/50 rounded-full border border-gray-100 shadow-sm">
              <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-gray-600">Smart Palettes</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2 bg-white/50 rounded-full border border-gray-100 shadow-sm">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-gray-600">Typography Extraction</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2 bg-white/50 rounded-full border border-gray-100 shadow-sm">
              <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-gray-600">Voice Analysis</span>
            </div>
          </div>
        </div>
      </main>

      {/* Past Extractions Section */}
      {brands.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-[#1f1f1f] mb-8 tracking-tight">Past Extractions</h2>

          {loadingBrands ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-[#1f1f1f]" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {brands.map((brand) => (
                <BrandCard key={brand.brand_id} brand={brand} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-gray-400 border-t border-gray-100 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2024 Brand Canonizer</p>
          <div className="flex gap-6">
            <a className="hover:text-gray-600 transition-colors" href="#">Privacy</a>
            <a className="hover:text-gray-600 transition-colors" href="#">Terms</a>
            <a className="hover:text-gray-600 transition-colors" href="#">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
