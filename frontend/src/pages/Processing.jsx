/**
 * Processing Page
 * Real-time progress display with SSE
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createProgressStream } from '../utils/api';

export default function Processing() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('setup');
  const [brandId, setBrandId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Create SSE connection
    const eventSource = createProgressStream(sessionId, (event) => {
      setEvents((prev) => [...prev, event]);
      setProgress(event.progress_percent);
      setCurrentStage(event.stage);

      // Store brand ID if present
      if (event.brand_id) {
        setBrandId(event.brand_id);
      }

      // Handle completion
      if (event.stage === 'complete' && event.brand_id) {
        // Auto-redirect after 2 seconds
        setTimeout(() => {
          navigate(`/brand/${event.brand_id}`);
        }, 2000);
      }

      // Handle error
      if (event.stage === 'error') {
        setError(event.message);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [sessionId, navigate]);

  const getStageIcon = (stage) => {
    const iconMap = {
      setup: 'cog',
      capture: 'camera',
      analyze: 'search',
      synthesize: 'sparkles',
      evaluate: 'chart',
      finalize: 'check',
      complete: 'check-circle',
      error: 'x-circle'
    };
    return iconMap[stage] || 'clock';
  };

  const renderStageIcon = (stage, className = "w-6 h-6") => {
    const iconType = getStageIcon(stage);

    const icons = {
      'cog': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      'camera': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      'search': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
      'sparkles': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
      'chart': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      'check': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
      'check-circle': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      'x-circle': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      'clock': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    };

    return icons[iconType] || icons['clock'];
  };

  const getStageDisplay = (stage) => {
    const displays = {
      setup: 'Setup',
      capture: 'Capture',
      analyze: 'Analyze',
      synthesize: 'Synthesize',
      evaluate: 'Evaluate',
      finalize: 'Finalize',
      complete: 'Complete',
      error: 'Error'
    };
    return displays[stage] || stage;
  };

  const stages = ['setup', 'capture', 'analyze', 'synthesize', 'evaluate', 'finalize'];
  const currentStageIndex = stages.indexOf(currentStage);

  return (
    <div className="min-h-screen bg-[#fdfdfc]">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-[#1f1f1f] tracking-tight">Brand Extraction in Progress</h1>
          <p className="text-gray-600 mt-1 font-medium">Session ID: {sessionId}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Progress Bar */}
        <div className="bg-white rounded-3xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-gray-100 p-8 mb-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-700 tracking-wide">
                {getStageDisplay(currentStage)}
              </span>
              <span className="text-sm font-bold text-[#1f1f1f]">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-[#f4f2ef] rounded-full h-3 overflow-hidden">
              <div
                className="bg-[#1f1f1f] h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stage Indicators */}
          <div className="flex items-center justify-between">
            {stages.map((stage, index) => (
              <div
                key={stage}
                className={`flex flex-col items-center ${
                  index <= currentStageIndex ? 'opacity-100' : 'opacity-30'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                    index < currentStageIndex
                      ? 'bg-[#e9d5c4]/40 border-2 border-[#e9d5c4] text-[#1f1f1f]'
                      : index === currentStageIndex
                      ? 'bg-[#1f1f1f] border-2 border-[#1f1f1f] text-white animate-pulse'
                      : 'bg-[#f4f2ef] border-2 border-gray-300 text-gray-400'
                  }`}
                >
                  {renderStageIcon(stage, "w-6 h-6")}
                </div>
                <span className="text-xs font-medium text-gray-600 text-center">
                  {getStageDisplay(stage)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Build Log */}
        <div className="bg-gray-900 rounded-3xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)] border border-gray-700 p-6 font-mono text-sm overflow-hidden">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700">
            <span className="text-[#e9d5c4] font-semibold">Build Log</span>
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.length === 0 ? (
              <div className="text-gray-500 animate-pulse">Waiting for events...</div>
            ) : (
              events.map((event, index) => {
                const time = new Date(event.timestamp).toLocaleTimeString('en-US', {
                  hour12: false,
                  minute: '2-digit',
                  second: '2-digit'
                });

                return (
                  <div key={index} className="group">
                    <div className="flex items-start gap-3">
                      <span className="text-gray-500">[{time}]</span>
                      <span className={`${
                        event.stage === 'error'
                          ? 'text-red-400'
                          : event.stage === 'complete'
                          ? 'text-green-400'
                          : 'text-[#e9d5c4]'
                      }`}>
                        {renderStageIcon(event.stage, "w-5 h-5")}
                      </span>
                      <div className="flex-1">
                        <span
                          className={`${
                            event.stage === 'error'
                              ? 'text-red-400'
                              : event.stage === 'complete'
                              ? 'text-green-400'
                              : 'text-gray-300'
                          }`}
                        >
                          {event.message}
                        </span>
                      </div>
                      <span className="text-[#e9d5c4] text-xs">
                        {event.progress_percent}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            {/* Auto-scroll anchor */}
            <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-3xl p-6">
            <div className="flex items-start gap-3">
              <svg className="w-8 h-8 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-1">
                  Extraction Failed
                </h3>
                <p className="text-red-700">{error}</p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-4 px-6 py-3 bg-red-600 text-white rounded-2xl font-semibold hover:bg-red-700 transition-all duration-200 shadow-lg shadow-red-600/20"
                >
                  Return to Home
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {brandId && currentStage === 'complete' && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-3xl p-6">
            <div className="flex items-start gap-3">
              <svg className="w-8 h-8 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-green-900 mb-1">
                  Extraction Complete
                </h3>
                <p className="text-green-700 mb-3">
                  Brand ID: {brandId}
                </p>
                <p className="text-green-600 text-sm mb-4">
                  Redirecting to report...
                </p>
                <button
                  onClick={() => navigate(`/brand/${brandId}`)}
                  className="px-6 py-3 bg-[#1f1f1f] hover:bg-black text-white rounded-2xl font-semibold transition-all duration-200 shadow-lg shadow-black/10 hover:shadow-black/20 hover:-translate-y-0.5"
                >
                  View Report Now
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
