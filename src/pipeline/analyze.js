/**
 * Stage 2: Analyze
 * Uses Claude Vision API to analyze screenshots and extract brand tokens
 */

import Anthropic from '@anthropic-ai/sdk';
import { Logger } from '../utils/logger.js';
import { saveJSON, getFileSize } from '../utils/file-utils.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Analyze captured data using Claude Vision API
 * @param {Object} captureData - Data from capture stage
 * @param {Object} paths - Brand paths object
 * @param {Object} config - Configuration object
 * @param {Array} adjectives - User-provided brand adjectives
 * @returns {Object} Analysis results
 */
export async function analyzeWithClaude(captureData, paths, config, adjectives = []) {
  const logger = new Logger('Analyze');
  const startTime = Date.now();

  logger.info('Starting analysis with Claude Vision API');

  const anthropic = new Anthropic({
    apiKey: config.anthropicApiKey
  });

  const artifacts = [];
  const errors = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  try {
    // Load screenshots as base64
    logger.info('Loading screenshots');
    const screenshots = await loadScreenshots(paths);

    if (screenshots.length === 0) {
      throw new Error('No screenshots available for analysis');
    }

    logger.info(`Loaded ${screenshots.length} screenshots`);

    // Analyze with Claude Vision
    logger.info('Sending request to Claude Vision API');

    const prompt = buildAnalysisPrompt(captureData, adjectives);

    const message = await anthropic.messages.create({
      model: config.analyzeModel,
      max_tokens: config.analyzeMaxTokens,
      messages: [
        {
          role: 'user',
          content: [
            ...screenshots.map(screenshot => ({
              type: 'image',
              source: {
                type: 'base64',
                media_type: screenshot.mediaType,
                data: screenshot.data
              }
            })),
            {
              type: 'text',
              text: prompt
            }
          ]
        }
      ]
    });

    totalInputTokens = message.usage.input_tokens;
    totalOutputTokens = message.usage.output_tokens;

    logger.info(`Claude response received (${totalInputTokens} input tokens, ${totalOutputTokens} output tokens)`);

    // Extract JSON from response
    const responseText = message.content[0].text;
    const brandTokens = extractJSONFromResponse(responseText);

    // Add cross-reference with DOM/CSS data
    brandTokens.cross_reference = {
      dom_data: captureData.dom,
      css_data: captureData.styles
    };

    // Save brand_tokens.json
    const brandTokensPath = paths.analysis.brandTokens;
    await saveJSON(brandTokensPath, brandTokens);

    artifacts.push({
      name: 'brand_tokens.json',
      path: 'analysis/brand_tokens.json',
      size_bytes: await getFileSize(brandTokensPath),
      type: 'json'
    });

    const duration = Date.now() - startTime;
    logger.success(`Analysis completed in ${duration}ms`);

    return {
      status: 'success',
      duration_ms: duration,
      artifacts,
      logs: logger.getLogsForStage(),
      errors,
      metrics: {
        tokens_input: totalInputTokens,
        tokens_output: totalOutputTokens,
        model_used: config.analyzeModel,
        api_calls: 1
      },
      data: brandTokens
    };

  } catch (error) {
    logger.error(`Analysis failed: ${error.message}`);
    errors.push({
      code: 'ANALYSIS_ERROR',
      message: error.message,
      recoverable: false
    });

    return {
      status: 'failed',
      duration_ms: Date.now() - startTime,
      artifacts,
      logs: logger.getLogsForStage(),
      errors,
      metrics: {
        tokens_input: totalInputTokens,
        tokens_output: totalOutputTokens,
        model_used: config.analyzeModel,
        api_calls: 1
      }
    };
  }
}

/**
 * Load screenshots as base64
 */
async function loadScreenshots(paths) {
  const screenshots = [];
  const screenshotsDir = paths.captures.screenshots;

  try {
    const files = await fs.readdir(screenshotsDir);
    // Exclude full_page.png as it's too large for API (exceeds 8000px dimension limit)
    const pngFiles = files
      .filter(f => f.endsWith('.png') && f !== 'full_page.png')
      .sort();

    // Load up to 5 screenshots to avoid token limits
    for (const file of pngFiles.slice(0, 5)) {
      const filePath = path.join(screenshotsDir, file);
      const data = await fs.readFile(filePath);
      screenshots.push({
        name: file,
        mediaType: 'image/png',
        data: data.toString('base64')
      });
    }

    return screenshots;
  } catch (error) {
    console.error('Error loading screenshots:', error);
    return [];
  }
}

/**
 * Build comprehensive analysis prompt
 */
function buildAnalysisPrompt(captureData, adjectives) {
  const adjectivesText = adjectives.length > 0
    ? `\n\nUser-provided brand adjectives: ${adjectives.join(', ')}`
    : '';

  return `You are a brand design expert analyzing website screenshots to extract a comprehensive brand identity specification.

${adjectivesText}

I'm showing you ${captureData.screenshots ? captureData.screenshots.length : 'multiple'} screenshots of a website. Analyze these screenshots to extract the complete brand identity.

**YOUR TASK:**
Extract the brand's visual identity into structured JSON format. Be thorough and specific.

**REQUIRED OUTPUT (JSON):**

{
  "brand_essence": {
    "description": "2-3 sentence summary of the brand identity and visual style",
    "adjectives": ["5-8 adjectives that capture the brand personality"],
    "tone": "one of: formal, professional, conversational, casual, playful, technical, friendly"
  },

  "colors": {
    "all_colors": [
      {
        "hex": "#RRGGBB",
        "name": "descriptive name (e.g., 'Deep Purple', 'Navy Blue')",
        "usage_context": "where you see this color used (e.g., 'primary CTAs', 'backgrounds', 'text')",
        "frequency": "how often it appears: high, medium, low"
      }
    ],
    "semantic_mapping": {
      "primary": "#hex color for primary brand color",
      "secondary": "#hex color for secondary brand color",
      "accent": "#hex color for accent/highlight color (if present)",
      "background": "#hex for main background",
      "text_primary": "#hex for main text color",
      "text_secondary": "#hex for secondary text color"
    }
  },

  "typography": {
    "font_families": [
      {
        "name": "Font Family Name",
        "role": "primary, secondary, or monospace",
        "usage": "where this font is used",
        "fallback": "fallback font stack if visible"
      }
    ],
    "font_scale": [
      {
        "level": "h1, h2, h3, h4, body, small, caption",
        "approximate_size": "estimated font size (e.g., '48px', '32px', '16px')",
        "weight": "font weight (300, 400, 500, 600, 700, etc.)",
        "usage": "where this style is used"
      }
    ],
    "line_height_ratio": "estimated line-height ratio (e.g., 1.5)",
    "letter_spacing": "any notable letter-spacing patterns"
  },

  "spacing": {
    "estimated_base_unit": "estimated base spacing unit (4, 8, or 10 pixels)",
    "density": "overall spacing density: compact, comfortable, or spacious",
    "padding_patterns": ["observed padding patterns, e.g., '16px on buttons', '32px section padding'"],
    "margin_patterns": ["observed margin patterns, e.g., '64px between sections', '24px between elements'"]
  },

  "components": [
    {
      "name": "Component Name (e.g., 'Primary Button', 'Input Field', 'Card')",
      "category": "button, input, card, navigation, modal, badge, avatar, icon, table, form, or other",
      "description": "what this component is and does",
      "visual_properties": {
        "background_color": "#hex",
        "text_color": "#hex",
        "border": "e.g., 'none' or '1px solid #hex'",
        "border_radius": "e.g., '6px'",
        "padding": "e.g., '12px 24px'",
        "font_size": "e.g., '16px'",
        "font_weight": 600,
        "shadow": "box-shadow value if present"
      },
      "states_observed": {
        "hover": "any hover state changes observed",
        "active": "any active state changes observed"
      },
      "usage_notes": "when and how this component is used"
    }
  ],

  "effects": {
    "shadows": [
      {
        "name": "sm, md, lg, or descriptive name",
        "value": "CSS box-shadow value",
        "usage": "where this shadow is used"
      }
    ],
    "border_radius_scale": ["observed border radius values, e.g., '4px', '8px', '12px'"],
    "animations": ["any notable animations or transitions observed"]
  },

  "layout_patterns": [
    {
      "name": "Pattern name (e.g., 'Hero Section', 'Feature Grid', 'Navigation Bar')",
      "description": "structural description",
      "layout_type": "e.g., 'centered', 'full-width', 'grid', 'flexbox'",
      "max_width": "observed max-width if applicable",
      "components_used": ["list of components used in this pattern"]
    }
  ],

  "accessibility_observations": {
    "contrast_issues": ["any low-contrast color combinations you notice"],
    "focus_indicators": "are focus indicators visible? (yes/no/unclear)",
    "touch_targets": "do buttons/links appear to meet minimum touch target size? (yes/no/unclear)"
  },

  "notes": {
    "strengths": ["what the brand does well visually"],
    "distinctive_elements": ["unique or distinctive visual elements"],
    "edge_cases": ["any edge cases or exceptions noticed"]
  }
}

**IMPORTANT INSTRUCTIONS:**
1. Be specific and thorough - extract at least 8-12 components
2. Include ALL colors you see, then map the most important ones to semantic roles
3. Provide actual hex values, not color names
4. Give specific measurements when possible (even if approximate)
5. Cross-reference what you see in multiple screenshots
6. Return ONLY valid JSON - no markdown formatting, no additional text
7. If you're unsure about exact values, make your best estimate but note it in the component's usage_notes

Return the JSON now:`;
}

/**
 * Extract JSON from Claude's response
 */
function extractJSONFromResponse(responseText) {
  try {
    // Try to parse directly first
    return JSON.parse(responseText);
  } catch (e) {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }

    // Try to find JSON object in text
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      return JSON.parse(responseText.substring(jsonStart, jsonEnd + 1));
    }

    throw new Error('Could not extract valid JSON from Claude response');
  }
}
