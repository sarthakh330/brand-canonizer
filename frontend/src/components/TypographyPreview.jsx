/**
 * Typography Preview Component
 * Shows typography scale with live preview
 */

export default function TypographyPreview({ scale, fontFamily }) {
  if (!scale) return null;

  const previewText = {
    h1: 'The Quick Brown Fox',
    h2: 'Jumps Over the Lazy Dog',
    h3: 'Typography Specimen',
    h4: 'Design System Typography',
    body: 'This is body text showing the regular paragraph style used throughout the interface. It should be readable and comfortable for extended reading.',
    small: 'Small text for captions and metadata'
  };

  return (
    <div className="space-y-6">
      {Object.entries(scale).map(([level, styles]) => (
        <div key={level} className="border-b border-gray-100 pb-4 last:border-0">
          {/* Label */}
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {level}
            </span>
            <span className="text-xs text-gray-500 font-mono">
              {styles.size} • {styles.weight} • {styles.line_height}
            </span>
          </div>

          {/* Preview */}
          <p
            style={{
              fontFamily: fontFamily || 'inherit',
              fontSize: styles.size,
              fontWeight: styles.weight,
              lineHeight: styles.line_height,
              letterSpacing: styles.letter_spacing
            }}
            className="text-gray-900"
          >
            {previewText[level] || 'Sample Text'}
          </p>
        </div>
      ))}
    </div>
  );
}
