/**
 * Style Showcase
 * Comprehensive visual style guide showing live examples using extracted design tokens
 */

import EnhancedComponentCard from './EnhancedComponentCard';
import CodeBlock from './CodeBlock';
import { generateCSSVariables } from '../utils/cssGenerator';

export default function StyleShowcase({ brandSpec }) {
  if (!brandSpec) return null;

  const { design_tokens, components, patterns, brand_essence } = brandSpec;
  const colors = design_tokens?.colors || {};
  const typography = design_tokens?.typography || {};
  const spacing = design_tokens?.spacing || {};
  const effects = design_tokens?.effects || {};

  // Get real components (filter out placeholders)
  const realComponents = (components || []).filter(
    c => c.visual_properties && Object.keys(c.visual_properties).length > 0
  );

  // Generate CSS variables
  const cssVariables = generateCSSVariables(design_tokens);

  return (
    <div className="space-y-12">
      {/* Brand Essence */}
      {brand_essence && (
        <section>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Brand Essence</h3>
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-8 border border-gray-200">
            <p className="text-lg text-gray-700 mb-4">{brand_essence.description}</p>
            <div className="flex flex-wrap gap-2">
              {brand_essence.adjectives?.map((adj, i) => (
                <span
                  key={i}
                  className="px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700 border border-gray-200"
                >
                  {adj}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Color Palette */}
      {colors && Object.keys(colors).length > 0 && (
        <section>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Color Palette</h3>

          {/* Primary Colors */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Primary Colors</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {colors.primary && (
                <ColorShowcaseItem
                  color={colors.primary.value}
                  name="Primary"
                  usage={colors.primary.usage}
                />
              )}
              {colors.secondary && (
                <ColorShowcaseItem
                  color={colors.secondary.value}
                  name="Secondary"
                  usage={colors.secondary.usage}
                />
              )}
              {colors.accent && (
                <ColorShowcaseItem
                  color={colors.accent.value}
                  name="Accent"
                  usage={colors.accent.usage}
                />
              )}
            </div>
          </div>

          {/* Neutral Colors */}
          {colors.neutrals && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Neutrals</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(colors.neutrals).map(([name, colorData]) => {
                  if (typeof colorData === 'object' && colorData.value) {
                    return (
                      <ColorShowcaseItem
                        key={name}
                        color={colorData.value}
                        name={name}
                        usage={colorData.usage}
                        compact
                      />
                    );
                  } else if (typeof colorData === 'object') {
                    // Handle nested colors like gray.500
                    return Object.entries(colorData).map(([shade, shadeData]) => (
                      <ColorShowcaseItem
                        key={`${name}-${shade}`}
                        color={shadeData.value}
                        name={`${name} ${shade}`}
                        usage={shadeData.usage}
                        compact
                      />
                    ));
                  }
                  return null;
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Typography Scale */}
      {typography.scale && (
        <section>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Typography</h3>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {Object.entries(typography.scale).map(([name, props], i) => (
              <div
                key={name}
                className={`p-6 ${i !== 0 ? 'border-t border-gray-100' : ''}`}
              >
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-600 uppercase">{name}</span>
                  <span className="text-xs text-gray-400 font-mono">
                    {props.font_size} / {props.line_height} / {props.font_weight}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: props.font_size,
                    lineHeight: props.line_height,
                    fontWeight: props.font_weight,
                    fontFamily: typography.font_families?.primary?.name || 'sans-serif'
                  }}
                >
                  The quick brown fox jumps over the lazy dog
                </div>
                {props.usage && (
                  <p className="text-xs text-gray-500 mt-2">{props.usage}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Spacing Scale */}
      {spacing.scale && spacing.scale.length > 0 && (
        <section>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Spacing Scale</h3>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="space-y-3">
              {spacing.scale.map((value, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-sm font-mono text-gray-600 w-12">{value}px</span>
                  <div
                    className="h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded"
                    style={{ width: `${value}px` }}
                  ></div>
                </div>
              ))}
            </div>
            {spacing.usage_rules && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h5 className="text-sm font-semibold text-gray-700 mb-2">Usage Guidelines</h5>
                <div className="text-sm text-gray-600 space-y-1">
                  {Object.entries(spacing.usage_rules).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium">{key.replace(/_/g, ' ')}:</span> {value}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Component Library */}
      {realComponents.length > 0 && (
        <section>
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Component Library</h3>
            <p className="text-gray-600">
              Copy-paste ready components with HTML, CSS, and usage guidelines
            </p>
          </div>
          <div className="space-y-6">
            {realComponents.map((component, i) => (
              <EnhancedComponentCard
                key={i}
                component={component}
                design_tokens={design_tokens}
              />
            ))}
          </div>
        </section>
      )}

      {/* CSS Variables Reference */}
      {cssVariables && (
        <section>
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Design Tokens (CSS Variables)</h3>
            <p className="text-gray-600">
              Complete set of CSS custom properties generated from extracted design tokens
            </p>
          </div>
          <CodeBlock code={cssVariables} language="css" title="CSS Variables - Copy to use in your project" />
        </section>
      )}

      {/* Patterns */}
      {patterns && patterns.length > 0 && (
        <section>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">UI Patterns</h3>
          <div className="space-y-6">
            {patterns.map((pattern, i) => (
              <PatternShowcaseItem
                key={i}
                pattern={pattern}
                components={realComponents}
                colors={colors}
              />
            ))}
          </div>
        </section>
      )}

      {/* Effects */}
      {effects && (effects.shadows || effects.border_radius) && (
        <section>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Effects</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Shadows */}
            {effects.shadows && effects.shadows.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Shadows</h4>
                <div className="space-y-4">
                  {effects.shadows.map((shadow, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{shadow.name}</span>
                        <span className="text-xs text-gray-400 font-mono">{shadow.value}</span>
                      </div>
                      <div
                        className="w-full h-20 bg-white rounded-lg"
                        style={{ boxShadow: shadow.value }}
                      ></div>
                      {shadow.usage && (
                        <p className="text-xs text-gray-500 mt-2">{shadow.usage}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Border Radius */}
            {effects.border_radius && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Border Radius</h4>
                <div className="space-y-4">
                  {Object.entries(effects.border_radius).map(([name, value]) => (
                    <div key={name}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{name}</span>
                        <span className="text-xs text-gray-400 font-mono">{value}</span>
                      </div>
                      <div
                        className="w-full h-20 bg-gradient-to-br from-purple-400 to-pink-400"
                        style={{ borderRadius: value }}
                      ></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

// Color Showcase Item
function ColorShowcaseItem({ color, name, usage, compact = false }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div
        className={compact ? "h-20" : "h-32"}
        style={{ backgroundColor: color }}
      ></div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-gray-900">{name}</span>
          <span className="text-xs font-mono text-gray-500">{color}</span>
        </div>
        {usage && !compact && (
          <p className="text-xs text-gray-600 mt-2">{usage}</p>
        )}
      </div>
    </div>
  );
}

// Component Showcase Item
function ComponentShowcaseItem({ component }) {
  const { name, visual_properties, states, usage_rules } = component;
  const props = visual_properties || {};

  const renderComponent = () => {
    // Button
    if (component.category === 'button' || name.toLowerCase().includes('button')) {
      return (
        <button
          className="transition-all duration-200 hover:scale-105 cursor-pointer"
          style={{
            backgroundColor: props.background_color || props.background || '#000',
            color: props.text_color || props.color || '#fff',
            border: props.border || 'none',
            borderRadius: props.border_radius || '8px',
            padding: props.padding || '12px 24px',
            fontSize: props.font_size || '16px',
            fontWeight: props.font_weight || 600,
            boxShadow: props.shadow || 'none'
          }}
        >
          {name}
        </button>
      );
    }

    // Card
    if (component.category === 'card' || name.toLowerCase().includes('card')) {
      return (
        <div
          className="transition-all duration-200 hover:shadow-lg"
          style={{
            backgroundColor: props.background_color || props.background || '#fff',
            border: props.border || '1px solid #e5e7eb',
            borderRadius: props.border_radius || '12px',
            padding: props.padding || '24px',
            boxShadow: props.shadow || '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <div className="font-semibold mb-2">{name}</div>
          <div className="text-sm text-gray-600">Sample card content</div>
        </div>
      );
    }

    // Generic
    return (
      <div
        className="transition-all duration-200"
        style={{
          backgroundColor: props.background_color || props.background || '#f3f4f6',
          border: props.border || '1px solid #e5e7eb',
          borderRadius: props.border_radius || '8px',
          padding: props.padding || '16px',
          fontSize: props.font_size,
          color: props.text_color || props.color
        }}
      >
        {name}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 p-8 flex items-center justify-center min-h-[180px]">
        {renderComponent()}
      </div>
      <div className="p-4 border-t border-gray-100">
        <h4 className="font-semibold text-gray-900 mb-2">{name}</h4>
        {usage_rules && (
          <p className="text-xs text-gray-600 mb-3">{usage_rules}</p>
        )}
        {states && Object.keys(states).length > 0 && (
          <div className="text-xs text-gray-500">
            <span className="font-medium">States:</span> {Object.keys(states).join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}

// Pattern Showcase Item
function PatternShowcaseItem({ pattern, components, colors }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-2">{pattern.name}</h4>
        <p className="text-sm text-gray-600">{pattern.description}</p>
      </div>

      {/* Visual Example */}
      {pattern.usage === 'grid' && (
        <div
          className="bg-gray-50 rounded-lg p-6"
          style={{
            maxWidth: pattern.layout_properties?.max_width || '100%'
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => {
              // Find card component
              const cardComponent = components.find(c =>
                pattern.components_used?.includes(c.name)
              );

              if (cardComponent) {
                const props = cardComponent.visual_properties || {};
                return (
                  <div
                    key={i}
                    className="transition-all duration-200 hover:shadow-lg"
                    style={{
                      backgroundColor: props.background_color || '#fff',
                      border: props.border || '1px solid #e5e7eb',
                      borderRadius: props.border_radius || '12px',
                      padding: props.padding || '16px',
                      boxShadow: props.shadow || '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div className="h-24 bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}

      {/* Components Used */}
      {pattern.components_used && pattern.components_used.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <span className="text-xs font-semibold text-gray-600 uppercase">Components:</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {pattern.components_used.map((comp, i) => (
              <span key={i} className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-700">
                {comp}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
