/**
 * Inspirations Gallery Page
 * Design inspirations from Dribbble
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInspirations } from '../utils/api';
import InspirationCard from '../components/InspirationCard';

export default function Inspirations() {
  const navigate = useNavigate();
  const [inspirations, setInspirations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInspirations();
  }, []);

  const loadInspirations = async () => {
    try {
      setLoading(true);
      const data = await getInspirations();
      setInspirations(data.inspirations || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load inspirations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Design Inspirations</h1>
                <p className="text-gray-600 mt-1">
                  Curated design examples to inspire your brand identity reports
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin h-12 w-12 text-purple-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <svg className="w-12 h-12 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Inspirations</h2>
            <p className="text-red-700">{error}</p>
          </div>
        ) : (
          <>
            {/* Introduction */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                About These Inspirations
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                These design examples from Dribbble showcase different visual styles and
                approaches to brand identity. Each style has unique characteristics that work
                well for specific use cases and target audiences.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Use these inspirations to understand what makes great design work, and to
                inform both the quality of brand extractions and the presentation of reports.
              </p>
            </div>

            {/* Inspirations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {inspirations.map((inspiration) => (
                <InspirationCard key={inspiration.id} inspiration={inspiration} />
              ))}
            </div>

            {/* Design Principles Section */}
            <div className="mt-12 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Selection Framework
              </h2>
              <p className="text-gray-700 mb-6">
                When choosing a design style for your brand, consider these key questions:
              </p>

              <div className="space-y-4">
                <div className="bg-white rounded-lg p-6 border border-purple-100">
                  <h3 className="font-semibold text-lg text-purple-900 mb-2">
                    1. Who is your target audience?
                  </h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <strong>Developers/Techies:</strong> Vibrant tech style (bold, energetic)</li>
                    <li>• <strong>Enterprise Buyers:</strong> Professional trust or premium authority</li>
                    <li>• <strong>Creatives/Designers:</strong> Friendly creative style</li>
                    <li>• <strong>Finance/Legal:</strong> Premium authority (sophisticated, trustworthy)</li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg p-6 border border-purple-100">
                  <h3 className="font-semibold text-lg text-purple-900 mb-2">
                    2. What is your price point?
                  </h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <strong>Free or Low-tier:</strong> Vibrant tech or friendly creative</li>
                    <li>• <strong>Mid-tier ($50-500/mo):</strong> Professional trust style</li>
                    <li>• <strong>Premium ($500+/mo):</strong> Premium authority style</li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg p-6 border border-purple-100">
                  <h3 className="font-semibold text-lg text-purple-900 mb-2">
                    3. What emotion should users feel?
                  </h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <strong>Excitement & Innovation:</strong> Vibrant tech</li>
                    <li>• <strong>Trust & Efficiency:</strong> Professional trust</li>
                    <li>• <strong>Authority & Sophistication:</strong> Premium authority</li>
                    <li>• <strong>Warmth & Creativity:</strong> Friendly creative</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
