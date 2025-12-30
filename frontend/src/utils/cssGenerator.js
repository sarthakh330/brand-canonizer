/**
 * CSS Variables Generator
 * Converts design tokens to CSS custom properties
 */

export function generateCSSVariables(design_tokens) {
  if (!design_tokens) return '';

  const lines = [':root {'];

  // Colors
  if (design_tokens.colors) {
    lines.push('  /* Colors */');

    if (design_tokens.colors.primary) {
      lines.push(`  --color-primary: ${design_tokens.colors.primary.value};`);
    }
    if (design_tokens.colors.secondary) {
      lines.push(`  --color-secondary: ${design_tokens.colors.secondary.value};`);
    }
    if (design_tokens.colors.accent) {
      lines.push(`  --color-accent: ${design_tokens.colors.accent.value};`);
    }

    // Neutrals
    if (design_tokens.colors.neutrals) {
      Object.entries(design_tokens.colors.neutrals).forEach(([name, colorData]) => {
        if (typeof colorData === 'object' && colorData.value) {
          lines.push(`  --color-neutral-${name}: ${colorData.value};`);
        } else if (typeof colorData === 'object') {
          // Handle nested like gray.500
          Object.entries(colorData).forEach(([shade, shadeData]) => {
            if (shadeData.value) {
              lines.push(`  --color-${name}-${shade}: ${shadeData.value};`);
            }
          });
        }
      });
    }

    lines.push('');
  }

  // Typography
  if (design_tokens.typography) {
    lines.push('  /* Typography */');

    if (design_tokens.typography.font_families?.primary) {
      const primary = design_tokens.typography.font_families.primary;
      lines.push(`  --font-family-primary: '${primary.name}', ${primary.fallback || 'sans-serif'};`);
    }

    if (design_tokens.typography.scale) {
      Object.entries(design_tokens.typography.scale).forEach(([name, props]) => {
        if (props.font_size) {
          lines.push(`  --font-size-${name}: ${props.font_size};`);
        }
        if (props.line_height) {
          lines.push(`  --line-height-${name}: ${props.line_height};`);
        }
        if (props.font_weight) {
          lines.push(`  --font-weight-${name}: ${props.font_weight};`);
        }
      });
    }

    lines.push('');
  }

  // Spacing
  if (design_tokens.spacing?.scale) {
    lines.push('  /* Spacing */');
    design_tokens.spacing.scale.forEach((value, index) => {
      lines.push(`  --space-${index}: ${value}px;`);
    });
    lines.push('');
  }

  // Effects
  if (design_tokens.effects) {
    lines.push('  /* Effects */');

    if (design_tokens.effects.shadows) {
      design_tokens.effects.shadows.forEach((shadow) => {
        const name = shadow.name.replace(/_/g, '-');
        lines.push(`  --shadow-${name}: ${shadow.value};`);
      });
    }

    if (design_tokens.effects.border_radius) {
      Object.entries(design_tokens.effects.border_radius).forEach(([name, value]) => {
        lines.push(`  --radius-${name}: ${value};`);
      });
    }
  }

  lines.push('}');

  return lines.join('\n');
}

export function generateComponentCSS(component, design_tokens) {
  if (!component || !component.visual_properties) return '';

  const props = component.visual_properties;
  const className = component.name.toLowerCase().replace(/\s+/g, '-');

  const lines = [`.${className} {`];

  // Background
  if (props.background_color || props.background) {
    const bg = props.background_color || props.background;
    lines.push(`  background-color: ${bg};`);
  }

  // Text color
  if (props.text_color || props.color) {
    const color = props.text_color || props.color;
    lines.push(`  color: ${color};`);
  }

  // Border
  if (props.border) {
    lines.push(`  border: ${props.border};`);
  }

  // Border radius
  if (props.border_radius) {
    lines.push(`  border-radius: ${props.border_radius};`);
  }

  // Padding
  if (props.padding) {
    lines.push(`  padding: ${props.padding};`);
  }

  // Font
  if (props.font_size) {
    lines.push(`  font-size: ${props.font_size};`);
  }
  if (props.font_weight) {
    lines.push(`  font-weight: ${props.font_weight};`);
  }

  // Shadow
  if (props.shadow) {
    lines.push(`  box-shadow: ${props.shadow};`);
  }

  // Add transition for interactivity
  lines.push('  transition: all 0.2s ease;');
  lines.push('}');

  // Hover state if available
  if (component.states?.hover) {
    lines.push('');
    lines.push(`.${className}:hover {`);
    lines.push('  transform: translateY(-1px);');
    lines.push('  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);');
    lines.push('}');
  }

  // Disabled state
  if (component.states?.disabled) {
    lines.push('');
    lines.push(`.${className}:disabled {`);
    lines.push('  opacity: 0.5;');
    lines.push('  cursor: not-allowed;');
    lines.push('}');
  }

  return lines.join('\n');
}

export function generateComponentHTML(component) {
  if (!component) return '';

  const className = component.name.toLowerCase().replace(/\s+/g, '-');
  const tag = component.category === 'button' ? 'button' : 'div';
  const text = component.name;

  return `<${tag} class="${className}">\n  ${text}\n</${tag}>`;
}
