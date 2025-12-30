/**
 * Enhanced Component Card
 * Shows component with code examples, usage guidelines, and accessibility notes
 */

import CodeBlock from './CodeBlock';
import { generateComponentHTML, generateComponentCSS } from '../utils/cssGenerator';

export default function EnhancedComponentCard({ component, design_tokens }) {
  if (!component || !component.visual_properties || Object.keys(component.visual_properties).length === 0) {
    return null;
  }

  const { name, visual_properties, states, usage_rules, category, description } = component;
  const props = visual_properties || {};

  // Generate code
  const htmlCode = generateComponentHTML(component);
  const cssCode = generateComponentCSS(component, design_tokens);

  // Render visual preview based on category
  const renderPreview = () => {
    if (category === 'button' || name.toLowerCase().includes('button')) {
      return (
        <button
          className="px-6 py-3 rounded font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer"
          style={{
            backgroundColor: props.background_color || props.background || '#000',
            color: props.text_color || props.color || '#fff',
            border: props.border || 'none',
            borderRadius: props.border_radius || '8px',
            padding: props.padding,
            fontSize: props.font_size,
            fontWeight: props.font_weight,
            boxShadow: props.shadow
          }}
        >
          {name}
        </button>
      );
    }

    if (category === 'card' || name.toLowerCase().includes('card')) {
      return (
        <div
          className="transition-all duration-200 hover:shadow-xl"
          style={{
            backgroundColor: props.background_color || props.background || '#fff',
            border: props.border || '1px solid #e5e7eb',
            borderRadius: props.border_radius || '12px',
            padding: props.padding || '24px',
            boxShadow: props.shadow || '0 1px 3px rgba(0,0,0,0.1)',
            minWidth: '280px'
          }}
        >
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="font-semibold text-lg mb-2">{name}</div>
          <div className="text-sm text-gray-600 mb-4">Sample card content with description text</div>
          <button className="text-sm font-medium" style={{ color: props.text_color || '#000' }}>
            Learn More →
          </button>
        </div>
      );
    }

    // Generic component
    return (
      <div
        className="transition-all duration-200"
        style={{
          backgroundColor: props.background_color || props.background || '#f3f4f6',
          border: props.border || '1px solid #e5e7eb',
          borderRadius: props.border_radius || '8px',
          padding: props.padding || '20px',
          minWidth: '200px'
        }}
      >
        <div className="font-semibold">{name}</div>
        <div className="text-sm text-gray-600 mt-2">Component preview</div>
      </div>
    );
  };

  // Extract usage guidelines
  const usageGuidelines = typeof usage_rules === 'string'
    ? [usage_rules]
    : Array.isArray(usage_rules)
    ? usage_rules
    : [];

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-6 mb-6"
      data-component={name.toLowerCase().replace(/\s+/g, '-')}
      data-category={category}
    >
      {/* Header */}
      <div className="mb-4">
        <h4 className="text-xl font-bold text-gray-900 mb-1">{name}</h4>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </div>

      {/* Live Preview */}
      <div className="bg-gray-50 rounded-lg p-8 border border-gray-100 flex items-center justify-center min-h-[200px] mb-6">
        {renderPreview()}
      </div>

      {/* Code Blocks */}
      <div className="space-y-4">
        <CodeBlock code={htmlCode} language="html" title="HTML" />
        <CodeBlock code={cssCode} language="css" title="CSS" />
      </div>

      {/* Usage Guidelines */}
      {usageGuidelines.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Usage Guidelines
          </h5>
          <div className="space-y-2">
            {usageGuidelines.map((rule, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <span className="text-purple-500 mt-0.5">•</span>
                <span className="text-gray-700">{rule}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* States */}
      {states && Object.keys(states).length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Component States
          </h5>
          <div className="text-sm text-gray-600 space-y-1">
            {Object.entries(states).map(([state, description]) => (
              <div key={state} className="flex items-start gap-2">
                <span className="font-medium text-gray-900 capitalize">{state}:</span>
                <span>{description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Design Tokens Used */}
      {props && Object.keys(props).length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Visual Properties
          </h5>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(props).map(([key, value]) => (
              <div key={key} className="flex justify-between py-1.5 px-3 bg-gray-50 rounded">
                <span className="text-gray-600 font-medium">{key.replace(/_/g, ' ')}:</span>
                <span className="text-gray-900 font-mono">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
