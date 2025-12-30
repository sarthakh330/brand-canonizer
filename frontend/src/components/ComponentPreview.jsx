/**
 * Component Preview
 * Visual preview of design system components
 */

export default function ComponentPreview({ component }) {
  if (!component) return null;

  const { name, visual_properties, usage_rules, example_html } = component;
  const properties = visual_properties || {};

  // Helper to render visual preview based on component type
  const renderVisualPreview = () => {
    const props = properties || {};

    // Button preview
    if (name.toLowerCase().includes('button')) {
      return (
        <div className="flex gap-3 flex-wrap">
          <div
            className="px-6 py-3 rounded font-semibold transition-transform hover:scale-105 cursor-pointer"
            style={{
              backgroundColor: props.background_color || props.background || '#000',
              color: props.text_color || props.color || '#fff',
              border: props.border || 'none',
              borderRadius: props.border_radius || '0.5rem',
              padding: props.padding || undefined,
              fontSize: props.font_size || undefined,
              fontWeight: props.font_weight || undefined,
              boxShadow: props.shadow || undefined
            }}
          >
            Primary Button
          </div>
        </div>
      );
    }

    // Input preview
    if (name.toLowerCase().includes('input')) {
      return (
        <div
          className="px-4 py-3 rounded w-full max-w-sm"
          style={{
            backgroundColor: props.background_color || props.background || '#fff',
            border: props.border || '1px solid #d1d5db',
            borderRadius: props.border_radius || '0.5rem',
            padding: props.padding || undefined,
            fontSize: props.font_size || undefined
          }}
        >
          <span style={{ color: props.text_color || props.color || '#6b7280' }}>
            Placeholder text
          </span>
        </div>
      );
    }

    // Card preview
    if (name.toLowerCase().includes('card')) {
      return (
        <div
          className="p-6 rounded-lg w-full max-w-sm"
          style={{
            backgroundColor: props.background_color || props.background || '#fff',
            border: props.border || '1px solid #e5e7eb',
            borderRadius: props.border_radius || '0.75rem',
            boxShadow: props.shadow || '0 1px 3px rgba(0,0,0,0.1)',
            padding: props.padding || undefined
          }}
        >
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-3 bg-gray-100 rounded w-full mb-2"></div>
          <div className="h-3 bg-gray-100 rounded w-5/6"></div>
        </div>
      );
    }

    // Badge/Tag preview
    if (name.toLowerCase().includes('badge') || name.toLowerCase().includes('tag')) {
      return (
        <div
          className="inline-block px-3 py-1 rounded-full text-sm font-medium"
          style={{
            backgroundColor: props.background_color || props.background || '#e0e7ff',
            color: props.text_color || props.color || '#3730a3',
            border: props.border || 'none'
          }}
        >
          Badge
        </div>
      );
    }

    // Alert/Banner preview
    if (name.toLowerCase().includes('alert') || name.toLowerCase().includes('banner')) {
      return (
        <div
          className="p-4 rounded-lg w-full"
          style={{
            backgroundColor: props.background_color || props.background || '#fef3c7',
            border: props.border || '1px solid #fbbf24',
            borderRadius: props.border_radius || '0.5rem'
          }}
        >
          <div
            className="font-semibold text-sm"
            style={{ color: props.text_color || props.color || '#78350f' }}
          >
            Alert Message
          </div>
        </div>
      );
    }

    // Generic component preview
    return (
      <div
        className="p-6 rounded-lg"
        style={{
          backgroundColor: props.background_color || props.background || '#f3f4f6',
          border: props.border || '1px solid #e5e7eb',
          borderRadius: props.border_radius || '0.5rem'
        }}
      >
        <div className="text-center text-gray-600 text-sm">
          {name} Component
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      {/* Component Name */}
      <h4 className="text-lg font-semibold text-gray-900">{name}</h4>

      {/* Visual Preview */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
        {renderVisualPreview()}
      </div>

      {/* Properties */}
      {properties && Object.keys(properties).length > 0 && (
        <div>
          <h5 className="text-sm font-semibold text-gray-700 mb-2">Properties</h5>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(properties).map(([key, value]) => (
              <div key={key} className="flex justify-between py-1 px-2 bg-gray-50 rounded">
                <span className="text-gray-600 font-medium">{key}:</span>
                <span className="text-gray-900 font-mono text-xs">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Rules */}
      {usage_rules && (
        <div>
          <h5 className="text-sm font-semibold text-gray-700 mb-2">Usage Rules</h5>
          <div className="text-sm text-gray-600">
            {Array.isArray(usage_rules) ? (
              <ul className="space-y-1">
                {usage_rules.map((rule, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-purple-500 mr-2">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <span>{usage_rules}</span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
