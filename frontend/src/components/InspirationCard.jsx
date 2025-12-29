/**
 * Inspiration Card Component
 * Displays design inspiration from Dribbble
 */

export default function InspirationCard({ inspiration }) {
  const { name, url, visual_style, use_cases, key_features, when_to_use, when_not_to_use } = inspiration;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Preview Image Placeholder */}
      <div className="h-48 bg-gradient-to-br from-purple-100 via-blue-50 to-pink-50 flex items-center justify-center">
        <div className="text-center p-6">
          <svg className="w-12 h-12 mx-auto mb-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          <p className="text-sm text-gray-600 font-medium">{name}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Name and Link */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{name}</h3>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-1"
          >
            View on Dribbble
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Visual Style Adjectives */}
        {visual_style?.adjectives && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Visual Style</h4>
            <div className="flex flex-wrap gap-2">
              {visual_style.adjectives.map((adj, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium"
                >
                  {adj}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* When to Use */}
        {when_to_use && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-1">When to Use</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{when_to_use}</p>
          </div>
        )}

        {/* Use Cases */}
        {use_cases && use_cases.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Perfect For</h4>
            <ul className="space-y-1">
              {use_cases.slice(0, 3).map((useCase, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>{useCase}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Key Features */}
        {key_features && key_features.length > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Key Features
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {key_features.slice(0, 4).map((feature, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
