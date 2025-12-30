/**
 * Stage 3: Synthesize
 * Converts brand_tokens into canonical brand_spec.json format with validation
 */

import { Logger } from '../utils/logger.js';
import { saveJSON, getFileSize } from '../utils/file-utils.js';
import { validateBrandSpec, formatValidationErrors } from '../utils/schema-validator.js';

/**
 * Synthesize brand tokens into canonical brand_spec
 * @param {Object} brandTokens - Brand tokens from analysis stage
 * @param {Object} metadata - Brand metadata (brand_id, url, etc.)
 * @param {Object} paths - Brand paths object
 * @param {number} totalDuration - Total extraction duration so far
 * @returns {Object} Synthesis results
 */
export async function synthesizeBrandSpec(brandTokens, metadata, paths, totalDuration) {
  const logger = new Logger('Synthesize');
  const startTime = Date.now();

  logger.info('Starting brand spec synthesis');

  const artifacts = [];
  const errors = [];
  const warnings = [];

  try {
    // Build brand_spec from brand_tokens
    logger.info('Converting brand tokens to brand spec format');

    const brandSpec = {
      version: '1.0.0',
      metadata: {
        brand_id: metadata.brand_id,
        brand_name: metadata.brand_name,
        source_url: metadata.source_url,
        extracted_at: metadata.extracted_at,
        extraction_duration_ms: totalDuration,
        adjectives: metadata.adjectives || [],
        pipeline_version: '1.0.0'
      },
      brand_essence: synthesizeBrandEssence(brandTokens),
      design_tokens: synthesizeDesignTokens(brandTokens, logger, warnings),
      components: synthesizeComponents(brandTokens, logger),
      patterns: synthesizePatterns(brandTokens, logger),
      accessibility: synthesizeAccessibility(brandTokens),
      notes: synthesizeNotes(brandTokens)
    };

    // Validate against schema
    logger.info('Validating brand spec against JSON schema');
    const validation = await validateBrandSpec(brandSpec);

    if (!validation.valid) {
      const errorMsg = formatValidationErrors(validation.errors);
      logger.warn(`Schema validation failed:\n${errorMsg}`);
      warnings.push(`Schema validation issues: ${validation.errors.length} errors found`);

      // Try to fix common validation issues
      logger.info('Attempting to fix validation issues');
      fixValidationIssues(brandSpec, validation.errors, logger);

      // Re-validate
      const revalidation = await validateBrandSpec(brandSpec);
      if (!revalidation.valid) {
        logger.error('Could not fix all validation issues');
        // Log but continue - we'll save it anyway for inspection
      } else {
        logger.success('Validation issues fixed');
      }
    } else {
      logger.success('Brand spec passes schema validation');
    }

    // Save brand_spec.json
    const brandSpecPath = paths.reports.brandSpec;
    await saveJSON(brandSpecPath, brandSpec);

    artifacts.push({
      name: 'brand_spec.json',
      path: 'reports/brand_spec.json',
      size_bytes: await getFileSize(brandSpecPath),
      type: 'json'
    });

    const duration = Date.now() - startTime;
    logger.success(`Synthesis completed in ${duration}ms`);

    return {
      status: warnings.length > 0 ? 'warning' : 'success',
      duration_ms: duration,
      artifacts,
      logs: logger.getLogsForStage(),
      errors,
      warnings,
      data: brandSpec
    };

  } catch (error) {
    logger.error(`Synthesis failed: ${error.message}`);
    errors.push({
      code: 'SYNTHESIS_ERROR',
      message: error.message,
      recoverable: false
    });

    return {
      status: 'failed',
      duration_ms: Date.now() - startTime,
      artifacts,
      logs: logger.getLogsForStage(),
      errors,
      warnings
    };
  }
}

/**
 * Synthesize brand essence
 */
function synthesizeBrandEssence(tokens) {
  const essence = tokens.brand_essence || {};

  return {
    description: essence.description || 'Brand identity extracted from website',
    adjectives: Array.isArray(essence.adjectives) ? essence.adjectives : [],
    tone: essence.tone || 'professional',
    target_audience: essence.target_audience
  };
}

/**
 * Synthesize design tokens
 */
function synthesizeDesignTokens(tokens, logger, warnings) {
  return {
    colors: synthesizeColors(tokens.colors, logger, warnings),
    typography: synthesizeTypography(tokens.typography, logger, warnings),
    spacing: synthesizeSpacing(tokens.spacing, logger),
    effects: synthesizeEffects(tokens.effects, logger)
  };
}

/**
 * Synthesize colors with semantic mapping
 */
function synthesizeColors(colorsData, logger, warnings) {
  const colors = {
    primary: { value: '#000000', usage: 'Primary brand color' },
    secondary: { value: '#666666', usage: 'Secondary brand color' },
    neutrals: {
      white: { value: '#ffffff', usage: 'White background' },
      black: { value: '#000000', usage: 'Black text' },
      gray: {}
    }
  };

  if (!colorsData) {
    warnings.push('No color data available in brand tokens');
    return colors;
  }

  // Map semantic colors from tokens
  const semantic = colorsData.semantic_mapping || {};

  if (semantic.primary) {
    colors.primary = {
      value: semantic.primary,
      usage: 'Primary brand color used for CTAs, links, and brand accents'
    };
  } else if (colorsData.all_colors && colorsData.all_colors.length > 0) {
    // Try to infer primary from most used color
    const primaryCandidate = colorsData.all_colors.find(c => c.frequency === 'high');
    if (primaryCandidate) {
      colors.primary = {
        value: primaryCandidate.hex,
        usage: primaryCandidate.usage_context || 'Primary brand color'
      };
    }
  }

  if (semantic.secondary) {
    colors.secondary = {
      value: semantic.secondary,
      usage: 'Secondary brand color for supporting elements'
    };
  }

  if (semantic.accent) {
    colors.accent = {
      value: semantic.accent,
      usage: 'Accent color for highlights and emphasis'
    };
  }

  // Map neutral colors
  if (semantic.background) {
    colors.neutrals.white = {
      value: semantic.background,
      usage: 'Main background color'
    };
  }

  if (semantic.text_primary) {
    colors.neutrals.black = {
      value: semantic.text_primary,
      usage: 'Primary text color'
    };
  }

  // Generate gray scale from all colors
  if (colorsData.all_colors) {
    const grayColors = colorsData.all_colors
      .filter(c => c.name && (c.name.toLowerCase().includes('gray') || c.name.toLowerCase().includes('grey')))
      .slice(0, 9);

    grayColors.forEach((color, index) => {
      const step = (index + 1) * 100;
      colors.neutrals.gray[step] = {
        value: color.hex,
        usage: color.usage_context || `Gray ${step}`
      };
    });

    // If no grays, add at least one
    if (Object.keys(colors.neutrals.gray).length === 0 && semantic.text_secondary) {
      colors.neutrals.gray['500'] = {
        value: semantic.text_secondary,
        usage: 'Secondary text and borders'
      };
    }
  }

  // Add semantic colors if present
  if (colorsData.all_colors) {
    const successColor = colorsData.all_colors.find(c =>
      c.name && (c.name.toLowerCase().includes('success') || c.name.toLowerCase().includes('green'))
    );
    const errorColor = colorsData.all_colors.find(c =>
      c.name && (c.name.toLowerCase().includes('error') || c.name.toLowerCase().includes('red'))
    );
    const warningColor = colorsData.all_colors.find(c =>
      c.name && (c.name.toLowerCase().includes('warning') || c.name.toLowerCase().includes('yellow'))
    );

    if (successColor || errorColor || warningColor) {
      colors.semantic = {};
      if (successColor) colors.semantic.success = { value: successColor.hex, usage: 'Success states and positive actions' };
      if (errorColor) colors.semantic.error = { value: errorColor.hex, usage: 'Error states and destructive actions' };
      if (warningColor) colors.semantic.warning = { value: warningColor.hex, usage: 'Warning states and cautions' };
    }
  }

  return colors;
}

/**
 * Synthesize typography
 */
function synthesizeTypography(typographyData, logger, warnings) {
  const typography = {
    font_families: {
      primary: {
        name: 'Arial',
        fallback: 'sans-serif',
        usage: 'All text'
      }
    },
    scale: {},
    weights: [400, 600, 700],
    line_height_ratio: 1.5
  };

  if (!typographyData) {
    warnings.push('No typography data available in brand tokens');
    return typography;
  }

  // Map font families
  if (typographyData.font_families && typographyData.font_families.length > 0) {
    typographyData.font_families.forEach(font => {
      const role = font.role || 'primary';
      typography.font_families[role] = {
        name: font.name,
        fallback: font.fallback || 'sans-serif',
        usage: font.usage || `${role} font`,
        source: font.source
      };
    });
  }

  // Map font scale
  if (typographyData.font_scale && typographyData.font_scale.length > 0) {
    typographyData.font_scale.forEach(style => {
      const level = style.level;
      typography.scale[level] = {
        font_size: style.approximate_size,
        line_height: '1.2',
        font_weight: style.weight || 400,
        usage: style.usage || `${level} text`
      };
    });
  }

  // Ensure required scales exist
  const requiredScales = ['h1', 'h2', 'h3', 'body', 'small'];
  requiredScales.forEach(level => {
    if (!typography.scale[level]) {
      const defaults = {
        h1: { font_size: '48px', line_height: '1.2', font_weight: 700, usage: 'Page titles' },
        h2: { font_size: '36px', line_height: '1.3', font_weight: 600, usage: 'Section headings' },
        h3: { font_size: '24px', line_height: '1.4', font_weight: 600, usage: 'Subsection headings' },
        body: { font_size: '16px', line_height: '1.5', font_weight: 400, usage: 'Body text' },
        small: { font_size: '14px', line_height: '1.5', font_weight: 400, usage: 'Small text and captions' }
      };
      typography.scale[level] = defaults[level];
    }
  });

  // Extract unique weights
  const weights = new Set();
  Object.values(typography.scale).forEach(style => {
    weights.add(style.font_weight);
  });
  typography.weights = Array.from(weights).sort((a, b) => a - b);

  if (typographyData.line_height_ratio) {
    typography.line_height_ratio = typographyData.line_height_ratio;
  }

  return typography;
}

/**
 * Synthesize spacing
 */
function synthesizeSpacing(spacingData, logger) {
  const spacing = {
    base_unit: 8,
    scale: [4, 8, 12, 16, 24, 32, 48, 64, 96],
    density: 'comfortable'
  };

  if (!spacingData) {
    return spacing;
  }

  if (spacingData.estimated_base_unit) {
    spacing.base_unit = spacingData.estimated_base_unit;
  }

  if (spacingData.density) {
    spacing.density = spacingData.density;
  }

  // Add usage rules if available
  if (spacingData.padding_patterns || spacingData.margin_patterns) {
    spacing.usage_rules = {};

    if (spacingData.padding_patterns && spacingData.padding_patterns.length > 0) {
      spacing.usage_rules.component_padding = spacingData.padding_patterns[0];
    }

    if (spacingData.margin_patterns && spacingData.margin_patterns.length > 0) {
      spacing.usage_rules.section_margin = spacingData.margin_patterns[0];
    }
  }

  return spacing;
}

/**
 * Synthesize effects (shadows, borders, etc.)
 */
function synthesizeEffects(effectsData, logger) {
  const effects = {};

  if (!effectsData) {
    return effects;
  }

  // Map shadows
  if (effectsData.shadows && effectsData.shadows.length > 0) {
    effects.shadows = effectsData.shadows.map(shadow => ({
      name: shadow.name,
      value: shadow.value,
      usage: shadow.usage || 'Shadow effect'
    }));
  }

  // Map border radius
  if (effectsData.border_radius_scale && effectsData.border_radius_scale.length > 0) {
    effects.border_radius = {};
    const names = ['sm', 'md', 'lg', 'xl'];
    effectsData.border_radius_scale.slice(0, 4).forEach((value, index) => {
      effects.border_radius[names[index] || `r${index}`] = value;
    });
  }

  return effects;
}

/**
 * Synthesize components
 */
function synthesizeComponents(tokens, logger) {
  if (!tokens.components || tokens.components.length === 0) {
    logger.warn('No components found in brand tokens');
    return [];
  }

  return tokens.components.map(comp => ({
    name: comp.name,
    category: comp.category || 'other',
    description: comp.description || '',
    visual_properties: comp.visual_properties || {},
    states: comp.states_observed || {},
    usage_rules: comp.usage_notes || '',
    example_html: comp.example_html || `<div class="${comp.name.toLowerCase().replace(/\s+/g, '-')}">${comp.name}</div>`
  }));
}

/**
 * Synthesize patterns
 */
function synthesizePatterns(tokens, logger) {
  if (!tokens.layout_patterns || tokens.layout_patterns.length === 0) {
    logger.warn('No layout patterns found in brand tokens');
    return [];
  }

  return tokens.layout_patterns.map(pattern => ({
    name: pattern.name,
    description: pattern.description || '',
    structure: pattern.description || '',
    usage: pattern.layout_type || 'General layout',
    components_used: pattern.components_used || [],
    layout_properties: {
      max_width: pattern.max_width,
      alignment: pattern.layout_type === 'centered' ? 'center' : 'left'
    }
  }));
}

/**
 * Synthesize accessibility information
 */
function synthesizeAccessibility(tokens) {
  const accessibility = {};

  if (tokens.accessibility_observations) {
    const obs = tokens.accessibility_observations;

    if (obs.contrast_issues && obs.contrast_issues.length > 0) {
      accessibility.contrast_issues = obs.contrast_issues.map(issue => ({
        foreground: issue.split('/')[0] || issue,
        background: issue.split('/')[1] || '#ffffff',
        severity: 'AA-fail'
      }));
    }

    if (obs.focus_indicators) {
      accessibility.focus_indicators = obs.focus_indicators === 'yes';
    }

    if (obs.touch_targets) {
      accessibility.min_touch_target = obs.touch_targets === 'yes' ? '44px x 44px' : 'Below 44px';
    }
  }

  return accessibility;
}

/**
 * Synthesize notes
 */
function synthesizeNotes(tokens) {
  const notes = {};

  if (tokens.notes) {
    if (tokens.notes.strengths) {
      notes.strengths = tokens.notes.strengths;
    }
    if (tokens.notes.distinctive_elements) {
      notes.opportunities = tokens.notes.distinctive_elements;
    }
    if (tokens.notes.edge_cases) {
      notes.edge_cases = tokens.notes.edge_cases;
    }
  }

  return notes;
}

/**
 * Fix common validation issues
 */
function fixValidationIssues(brandSpec, errors, logger) {
  errors.forEach(error => {
    const path = error.instancePath;

    // Fix missing required component properties
    if (path.includes('/components/') && error.keyword === 'required') {
      const match = path.match(/\/components\/(\d+)/);
      if (match) {
        const index = parseInt(match[1]);
        const component = brandSpec.components[index];

        if (!component.visual_properties) {
          component.visual_properties = {};
        }
        if (!component.category) {
          component.category = 'other';
        }
        if (!component.description) {
          component.description = component.name || 'Component';
        }

        logger.info(`Fixed component ${index}: ${component.name}`);
      }
    }

    // Note: Removed automatic placeholder generation
    // Real components should come from actual website extraction
  });
}
