/**
 * Stage 4: Evaluate
 * Uses Claude API to evaluate brand_spec quality using 6-dimension rubric
 */

import Anthropic from '@anthropic-ai/sdk';
import { Logger } from '../utils/logger.js';
import { saveJSON, getFileSize } from '../utils/file-utils.js';
import { validateEvaluation, formatValidationErrors } from '../utils/schema-validator.js';

/**
 * Evaluate brand spec quality using Claude API
 * @param {Object} brandSpec - The brand specification to evaluate
 * @param {Object} paths - Brand paths object
 * @param {Object} config - Configuration object
 * @returns {Object} Evaluation results
 */
export async function evaluateBrandSpec(brandSpec, paths, config) {
  const logger = new Logger('Evaluate');
  const startTime = Date.now();

  logger.info('Starting brand spec evaluation');

  const anthropic = new Anthropic({
    apiKey: config.anthropicApiKey
  });

  const artifacts = [];
  const errors = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  try {
    // Build evaluation prompt
    logger.info('Building evaluation prompt');
    const prompt = buildEvaluationPrompt(brandSpec);

    // Call Claude API
    logger.info('Sending evaluation request to Claude API');
    const message = await anthropic.messages.create({
      model: config.evaluationModel,
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    totalInputTokens = message.usage.input_tokens;
    totalOutputTokens = message.usage.output_tokens;

    logger.info(`Claude response received (${totalInputTokens} input tokens, ${totalOutputTokens} output tokens)`);

    // Extract JSON from response
    const responseText = message.content[0].text;
    const evaluationData = extractJSONFromResponse(responseText);

    // Build complete evaluation object
    const evaluation = {
      version: '1.0.0',
      rubric_version: '1.2.0',
      brand_id: brandSpec.metadata.brand_id,
      evaluated_at: new Date().toISOString(),
      overall_score: evaluationData.overall_score,
      quality_band: getQualityBand(evaluationData.overall_score),
      dimensions: evaluationData.dimensions,
      recommendations: evaluationData.recommendations,
      metadata: {
        evaluator: config.evaluationModel,
        evaluation_duration_ms: Date.now() - startTime,
        tokens_used: totalInputTokens + totalOutputTokens
      }
    };

    // Validate against schema
    logger.info('Validating evaluation against JSON schema');
    const validation = await validateEvaluation(evaluation);

    if (!validation.valid) {
      const errorMsg = formatValidationErrors(validation.errors);
      logger.warn(`Evaluation schema validation failed:\n${errorMsg}`);

      // Try to fix issues
      fixEvaluationIssues(evaluation, validation.errors, logger);

      const revalidation = await validateEvaluation(evaluation);
      if (!revalidation.valid) {
        logger.error('Could not fix all evaluation validation issues');
      } else {
        logger.success('Evaluation validation issues fixed');
      }
    } else {
      logger.success('Evaluation passes schema validation');
    }

    // Save evaluation.json
    const evaluationPath = paths.evaluations.evaluation;
    await saveJSON(evaluationPath, evaluation);

    artifacts.push({
      name: 'evaluation.json',
      path: 'evaluations/evaluation.json',
      size_bytes: await getFileSize(evaluationPath),
      type: 'json'
    });

    const duration = Date.now() - startTime;
    logger.success(`Evaluation completed in ${duration}ms`);

    return {
      status: 'success',
      duration_ms: duration,
      artifacts,
      logs: logger.getLogsForStage(),
      errors,
      metrics: {
        tokens_input: totalInputTokens,
        tokens_output: totalOutputTokens,
        model_used: config.evaluationModel,
        api_calls: 1
      },
      data: evaluation
    };

  } catch (error) {
    logger.error(`Evaluation failed: ${error.message}`);
    errors.push({
      code: 'EVALUATION_ERROR',
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
        model_used: config.evaluationModel,
        api_calls: 1
      }
    };
  }
}

/**
 * Build comprehensive evaluation prompt with rubric
 */
function buildEvaluationPrompt(brandSpec) {
  return `You are a brand design expert evaluating the quality of an AI-extracted brand specification.

**YOUR TASK:**
Evaluate the following brand specification using a 6-dimension rubric. Be thorough, fair, and actionable in your assessment.

**BRAND SPECIFICATION TO EVALUATE:**
${JSON.stringify(brandSpec, null, 2)}

**EVALUATION RUBRIC (6 Dimensions):**

1. **Brand Fidelity (40% weight)**
   - How accurately does the extraction capture the actual brand identity?
   - Are colors, typography, and visual elements faithful to the source?
   - Score 5: Perfect accuracy, all elements match source exactly
   - Score 4: Highly accurate with minor discrepancies
   - Score 3: Generally accurate but missing some key elements
   - Score 2: Multiple inaccuracies or misinterpretations
   - Score 1: Severely inaccurate or incomplete extraction

2. **Completeness (20% weight)**
   - Are all required tokens and components present?
   - Is the coverage comprehensive (8+ components, full color palette, etc.)?
   - Score 5: Fully complete, rich detail, exceeds requirements
   - Score 4: Complete with good detail
   - Score 3: Meets minimum requirements
   - Score 2: Missing some required elements
   - Score 1: Severely incomplete

3. **Parseability (15% weight)**
   - Does the output validate against the JSON schema?
   - Is the structure consistent and machine-readable?
   - Score 5: Perfect schema compliance, clean structure
   - Score 4: Valid with minor formatting issues
   - Score 3: Valid but could be better organized
   - Score 2: Schema validation errors present
   - Score 1: Severely malformed or invalid

4. **Actionability (15% weight)**
   - Are usage rules clear and specific?
   - Can an AI system (like Claude Code) apply these tokens confidently?
   - Score 5: Crystal clear guidelines, specific measurements, no ambiguity
   - Score 4: Clear guidelines with minor gaps
   - Score 3: Adequate but could be more specific
   - Score 2: Vague or incomplete guidelines
   - Score 1: Unusable or confusing guidelines

5. **Accessibility (5% weight)**
   - Are contrast issues identified?
   - Are accessibility concerns flagged?
   - Score 5: Comprehensive accessibility analysis
   - Score 4: Good accessibility coverage
   - Score 3: Basic accessibility checks
   - Score 2: Minimal accessibility consideration
   - Score 1: No accessibility analysis

6. **Insight Depth (5% weight)**
   - Does the spec explain WHY design choices work?
   - Are patterns and principles articulated?
   - Score 5: Deep insights into brand strategy and rationale
   - Score 4: Good insights with clear reasoning
   - Score 3: Some insights provided
   - Score 2: Minimal insights or reasoning
   - Score 1: No insights, purely descriptive

**YOUR RESPONSE (JSON):**
{
  "overall_score": 0.0,
  "dimensions": [
    {
      "name": "brand_fidelity",
      "display_name": "Brand Fidelity",
      "score": 0.0,
      "weight": 0.4,
      "justification": "2-3 sentence explanation of the score",
      "evidence": [
        {
          "type": "strength or weakness",
          "description": "specific example",
          "reference": "path in brand_spec (e.g., design_tokens.colors.primary.value)"
        }
      ],
      "sub_scores": {
        "color_accuracy": 0.0,
        "typography_accuracy": 0.0,
        "spacing_accuracy": 0.0,
        "component_accuracy": 0.0
      }
    },
    {
      "name": "completeness",
      "display_name": "Completeness",
      "score": 0.0,
      "weight": 0.2,
      "justification": "2-3 sentence explanation",
      "evidence": [
        {
          "type": "strength or weakness",
          "description": "specific example"
        }
      ]
    },
    {
      "name": "parseability",
      "display_name": "Parseability",
      "score": 0.0,
      "weight": 0.15,
      "justification": "2-3 sentence explanation",
      "evidence": []
    },
    {
      "name": "actionability",
      "display_name": "Actionability",
      "score": 0.0,
      "weight": 0.15,
      "justification": "2-3 sentence explanation",
      "evidence": []
    },
    {
      "name": "accessibility",
      "display_name": "Accessibility",
      "score": 0.0,
      "weight": 0.05,
      "justification": "2-3 sentence explanation",
      "evidence": []
    },
    {
      "name": "insight_depth",
      "display_name": "Insight Depth",
      "score": 0.0,
      "weight": 0.05,
      "justification": "2-3 sentence explanation",
      "evidence": []
    }
  ],
  "recommendations": [
    {
      "priority": "critical, high, medium, or low",
      "dimension": "which dimension this affects",
      "issue": "clear description of the problem",
      "suggestion": "actionable suggestion for improvement",
      "expected_impact": "what would improve if this is fixed"
    }
  ]
}

**IMPORTANT INSTRUCTIONS:**
1. Calculate overall_score as weighted average: sum(dimension.score * dimension.weight)
2. Be specific in justifications - reference actual values from the brand spec
3. Provide 3-6 actionable recommendations ordered by priority
4. Be fair but honest - this is for improvement, not marketing
5. Consider the brand context - what works for this specific brand?
6. Return ONLY valid JSON - no markdown, no additional text

Evaluate now:`;
}

/**
 * Extract JSON from Claude's response
 */
function extractJSONFromResponse(responseText) {
  try {
    return JSON.parse(responseText);
  } catch (e) {
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }

    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      return JSON.parse(responseText.substring(jsonStart, jsonEnd + 1));
    }

    throw new Error('Could not extract valid JSON from Claude evaluation response');
  }
}

/**
 * Get quality band based on overall score
 */
function getQualityBand(score) {
  if (score >= 4.5) return 'excellent';
  if (score >= 3.5) return 'good';
  if (score >= 2.5) return 'acceptable';
  return 'poor';
}

/**
 * Fix evaluation validation issues
 */
function fixEvaluationIssues(evaluation, errors, logger) {
  errors.forEach(error => {
    const path = error.instancePath;

    // Ensure all 6 dimensions are present
    if (path === '/dimensions' && error.keyword === 'minItems') {
      const requiredDimensions = [
        { name: 'brand_fidelity', display_name: 'Brand Fidelity', weight: 0.4 },
        { name: 'completeness', display_name: 'Completeness', weight: 0.2 },
        { name: 'parseability', display_name: 'Parseability', weight: 0.15 },
        { name: 'actionability', display_name: 'Actionability', weight: 0.15 },
        { name: 'accessibility', display_name: 'Accessibility', weight: 0.05 },
        { name: 'insight_depth', display_name: 'Insight Depth', weight: 0.05 }
      ];

      evaluation.dimensions = evaluation.dimensions || [];

      requiredDimensions.forEach(dim => {
        if (!evaluation.dimensions.find(d => d.name === dim.name)) {
          evaluation.dimensions.push({
            name: dim.name,
            display_name: dim.display_name,
            score: 3.0,
            weight: dim.weight,
            justification: 'Dimension not evaluated'
          });
        }
      });

      logger.info('Added missing dimensions to evaluation');
    }

    // Recalculate overall score if missing
    if (!evaluation.overall_score && evaluation.dimensions) {
      evaluation.overall_score = evaluation.dimensions.reduce((sum, dim) => {
        return sum + (dim.score * dim.weight);
      }, 0);
      logger.info(`Calculated overall score: ${evaluation.overall_score}`);
    }
  });
}
