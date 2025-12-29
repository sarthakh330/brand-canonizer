/**
 * Color Swatch Component
 * Displays a color with hex code and metadata
 */

export default function ColorSwatch({ color, name, role, showDetails = true }) {
  const hexValue = color?.value || color;
  const colorName = name || color?.name || '';
  const colorRole = role || color?.role || '';

  // Calculate if text should be white or black based on background
  const getContrastColor = (hexColor) => {
    if (!hexColor) return '#000000';
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  const textColor = getContrastColor(hexValue);

  return (
    <div className="flex flex-col">
      {/* Color Block */}
      <div
        className="rounded-lg h-24 w-full shadow-md border border-gray-200 flex items-end justify-center pb-2 transition-transform hover:scale-105"
        style={{ backgroundColor: hexValue }}
      >
        {showDetails && (
          <span
            className="text-xs font-mono font-semibold px-2 py-1 rounded backdrop-blur-sm"
            style={{
              color: textColor,
              backgroundColor: textColor === '#FFFFFF' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'
            }}
          >
            {hexValue}
          </span>
        )}
      </div>

      {/* Labels */}
      {showDetails && (colorName || colorRole) && (
        <div className="mt-2 space-y-0.5">
          {colorName && (
            <p className="text-sm font-medium text-gray-900">{colorName}</p>
          )}
          {colorRole && (
            <p className="text-xs text-gray-500">{colorRole}</p>
          )}
        </div>
      )}
    </div>
  );
}
