/**
 * Report Viewer Page
 * Two tabs: Brand Identity (visual) and Diagnostics (technical)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBrandById, formatDate, formatDuration } from '../utils/api';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ColorSwatch from '../components/ColorSwatch';
import TypographyPreview from '../components/TypographyPreview';
import ComponentPreview from '../components/ComponentPreview';
import ScoreBadge from '../components/ScoreBadge';

export default function ReportViewer() {
  const { brandId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('identity'); // 'identity' or 'diagnostics'

  useEffect(() => {
    loadBrandData();
  }, [brandId]);

  const loadBrandData = async () => {
    try {
      setLoading(true);
      const result = await getBrandById(brandId);
      setData(result);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load brand data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-purple-600 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Loading brand data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Brand</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const { brand_spec, evaluation, execution_trace, metadata } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
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
                <h1 className="text-2xl font-bold text-gray-900">{metadata.brand_name}</h1>
                <p className="text-sm text-gray-600">{metadata.source_url}</p>
              </div>
            </div>
            <ScoreBadge
              score={evaluation.overall_score}
              qualityBand={evaluation.quality_band}
              size="lg"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('identity')}
              className={`px-6 py-3 font-semibold rounded-t-lg transition-colors ${
                activeTab === 'identity'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Brand Identity
            </button>
            <button
              onClick={() => setActiveTab('diagnostics')}
              className={`px-6 py-3 font-semibold rounded-t-lg transition-colors ${
                activeTab === 'diagnostics'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Diagnostics
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'identity' ? (
          <BrandIdentityTab brandSpec={brand_spec} metadata={metadata} />
        ) : (
          <DiagnosticsTab
            evaluation={evaluation}
            executionTrace={execution_trace}
            metadata={metadata}
            brandId={brandId}
          />
        )}
      </main>
    </div>
  );
}

/**
 * Brand Identity Tab - Beautiful Visual Report
 */
function BrandIdentityTab({ brandSpec, metadata }) {
  const { brand_essence, design_tokens, components, patterns } = brandSpec;

  return (
    <div className="space-y-8">
      {/* Overview Section */}
      <section className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Brand Essence</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Description
            </h3>
            <p className="text-gray-800 leading-relaxed">{brand_essence?.description}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Tone
            </h3>
            <p className="text-2xl font-bold text-purple-600">{brand_essence?.tone}</p>
          </div>
        </div>

        {brand_essence?.adjectives && brand_essence.adjectives.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
              Brand Adjectives
            </h3>
            <div className="flex flex-wrap gap-2">
              {brand_essence.adjectives.map((adj, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-lg font-medium text-lg"
                >
                  {adj}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Colors Section */}
      {design_tokens?.colors && (
        <section className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Colors</h2>

          <div className="space-y-8">
            {/* Primary Color */}
            {design_tokens.colors.primary && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Primary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ColorSwatch color={design_tokens.colors.primary} name="Primary" />
                </div>
                {design_tokens.colors.primary.usage && (
                  <p className="mt-3 text-sm text-gray-600">{design_tokens.colors.primary.usage}</p>
                )}
              </div>
            )}

            {/* Secondary Color */}
            {design_tokens.colors.secondary && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Secondary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ColorSwatch color={design_tokens.colors.secondary} name="Secondary" />
                </div>
              </div>
            )}

            {/* Accent Color */}
            {design_tokens.colors.accent && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Accent</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ColorSwatch color={design_tokens.colors.accent} name="Accent" />
                </div>
              </div>
            )}

            {/* Neutrals */}
            {design_tokens.colors.neutrals && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Neutrals</h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {Object.entries(design_tokens.colors.neutrals.gray || {}).map(([key, color]) => (
                    <ColorSwatch key={key} color={color} name={key} />
                  ))}
                </div>
              </div>
            )}

            {/* Semantic Colors */}
            {design_tokens.colors.semantic && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Semantic</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(design_tokens.colors.semantic).map(([key, color]) => (
                    <ColorSwatch key={key} color={color} name={key} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Typography Section */}
      {design_tokens?.typography && (
        <section className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Typography</h2>

          {/* Font Families */}
          {design_tokens.typography.font_families && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Font Families</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(design_tokens.typography.font_families).map(([key, font]) => (
                  <div key={key} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">{key}</p>
                    <p className="text-xl font-semibold text-gray-900">{font.name}</p>
                    {font.fallback && (
                      <p className="text-xs text-gray-500 mt-1">Fallback: {font.fallback}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Type Scale */}
          {design_tokens.typography.scale && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Type Scale</h3>
              <TypographyPreview
                scale={design_tokens.typography.scale}
                fontFamily={design_tokens.typography.font_families?.primary?.name}
              />
            </div>
          )}
        </section>
      )}

      {/* Spacing Section */}
      {design_tokens?.spacing && (
        <section className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Spacing</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {design_tokens.spacing.base_unit && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Base Unit
                </h3>
                <p className="text-4xl font-bold text-purple-600">
                  {design_tokens.spacing.base_unit}
                </p>
              </div>
            )}

            {design_tokens.spacing.density && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Density
                </h3>
                <p className="text-2xl font-bold text-gray-800 capitalize">
                  {design_tokens.spacing.density}
                </p>
              </div>
            )}
          </div>

          {/* Spacing Scale Visualization */}
          {design_tokens.spacing.scale && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Spacing Scale</h3>
              <div className="space-y-3">
                {Object.entries(design_tokens.spacing.scale).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-4">
                    <span className="text-sm font-mono text-gray-600 w-20">{key}</span>
                    <div
                      className="bg-purple-200 h-8 rounded"
                      style={{ width: value }}
                    />
                    <span className="text-sm text-gray-500">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {design_tokens.spacing.usage_rules && (
            <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-100">
              <h4 className="text-sm font-semibold text-purple-900 mb-2">Usage Rules</h4>
              <ul className="text-sm text-purple-800 space-y-1">
                {design_tokens.spacing.usage_rules.map((rule, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Components Section */}
      {components && components.length > 0 && (
        <section className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Components</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {components.map((component, index) => (
              <ComponentPreview key={index} component={component} />
            ))}
          </div>
        </section>
      )}

      {/* Patterns Section */}
      {patterns && Object.keys(patterns).length > 0 && (
        <section className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Patterns</h2>
          <div className="space-y-6">
            {Object.entries(patterns).map(([key, pattern]) => (
              <div key={key} className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-3 capitalize">
                  {key.replace('_', ' ')}
                </h3>
                <p className="text-gray-700 leading-relaxed">{pattern.description || pattern}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * Diagnostics Tab - Technical Details
 */
function DiagnosticsTab({ evaluation, executionTrace, metadata, brandId }) {
  return (
    <div className="space-y-8">
      {/* Evaluation Scores */}
      <section className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Evaluation Scores</h2>

        {/* Overall Score */}
        <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">Overall Quality</h3>
              <p className="text-sm text-gray-600">
                Rubric Version: {evaluation.rubric_version || 'N/A'}
              </p>
            </div>
            <ScoreBadge
              score={evaluation.overall_score}
              qualityBand={evaluation.quality_band}
              size="lg"
            />
          </div>
        </div>

        {/* Dimension Scores */}
        <div className="space-y-4">
          {evaluation.dimensions?.map((dimension, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {dimension.display_name}
                  </h4>
                  <p className="text-sm text-gray-600">{dimension.id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-3xl font-bold text-purple-600">
                      {dimension.score}
                    </div>
                    <div className="text-xs text-gray-500">/ 5.0</div>
                  </div>
                  <div className="w-16 h-16">
                    <svg viewBox="0 0 36 36" className="transform -rotate-90">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#9333ea"
                        strokeWidth="3"
                        strokeDasharray={`${(dimension.score / 5) * 100}, 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <h5 className="text-sm font-semibold text-gray-700 mb-1">Justification</h5>
                  <p className="text-sm text-gray-600">{dimension.justification}</p>
                </div>

                {dimension.evidence && dimension.evidence.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-1">Evidence</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {dimension.evidence.map((item, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-purple-400 mr-2">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recommendations */}
      {evaluation.recommendations && evaluation.recommendations.length > 0 && (
        <section className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Recommendations</h2>
          <div className="space-y-4">
            {evaluation.recommendations.map((rec, index) => (
              <div
                key={index}
                className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {rec.dimension || 'General'}
                    </h4>
                    <p className="text-sm text-gray-700">{rec.suggestion || rec}</p>
                    {rec.priority && (
                      <span className="inline-block mt-2 px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs font-semibold uppercase">
                        {rec.priority}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Execution Timeline */}
      <section className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Execution Timeline</h2>

        <div className="space-y-4">
          {executionTrace.stages?.map((stage, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                stage.status === 'success' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {stage.status === 'success' ? (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {stage.display_name}
                  </h4>
                  <span className="text-sm text-gray-500">
                    {formatDuration(stage.duration_ms)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{
                      width: `${(stage.duration_ms / executionTrace.summary.total_duration_ms) * 100}%`
                    }}
                  />
                </div>
                {stage.metrics && (
                  <p className="text-xs text-gray-500 mt-2">
                    Tokens: {stage.metrics.tokens_input + stage.metrics.tokens_output}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatDuration(executionTrace.summary.total_duration_ms)}
            </div>
            <div className="text-xs text-gray-600">Total Duration</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {executionTrace.summary.total_tokens?.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600">Total Tokens</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              ${executionTrace.summary.estimated_cost_usd?.toFixed(4)}
            </div>
            <div className="text-xs text-gray-600">Estimated Cost</div>
          </div>
        </div>
      </section>

      {/* Downloadable Artifacts */}
      <section className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Artifacts</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <a
            href={`http://localhost:3000/data/brands/${brandId}/reports/brand_spec.json`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <h4 className="font-semibold text-gray-900">brand_spec.json</h4>
                <p className="text-sm text-gray-600">Machine-readable brand specification</p>
              </div>
            </div>
          </a>

          <a
            href={`http://localhost:3000/data/brands/${brandId}/evaluations/evaluation.json`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div>
                <h4 className="font-semibold text-gray-900">evaluation.json</h4>
                <p className="text-sm text-gray-600">Quality evaluation report</p>
              </div>
            </div>
          </a>

          <a
            href={`http://localhost:3000/data/brands/${brandId}/execution_trace.json`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <div>
                <h4 className="font-semibold text-gray-900">execution_trace.json</h4>
                <p className="text-sm text-gray-600">Pipeline execution details</p>
              </div>
            </div>
          </a>

          <a
            href={`http://localhost:3000/data/brands/${brandId}/metadata.json`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-semibold text-gray-900">metadata.json</h4>
                <p className="text-sm text-gray-600">Brand extraction metadata</p>
              </div>
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}
