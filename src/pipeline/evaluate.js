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
  return `You are evaluating the quality of an AI-generated brand specification report.

**CRITICAL: WHAT YOU ARE EVALUATING**
You are NOT evaluating whether the source brand's design is good or bad.
You ARE evaluating how well this REPORT captures and presents what exists on the source website.

Your job is to assess:
1. **Extraction Accuracy**: Did we correctly capture what's visible on the source?
2. **Report Quality**: Is this report clear, well-organized, and useful?
3. **Artifact Usability**: Can downstream AI systems use this specification confidently?

**BRAND SPECIFICATION REPORT TO EVALUATE:**
${JSON.stringify(brandSpec, null, 2)}

**EVALUATION RUBRIC (6 Dimensions):**

1. **Extraction Fidelity (40% weight)**
   - How accurately did we capture what's actually on the source website?
   - Did we correctly extract the colors, typography, and visual elements that are present?
   - Are there hallucinations (things we made up that aren't on the source)?
   - Are there omissions (obvious elements we missed)?

   IMPORTANT: Do NOT penalize if the source brand uses unusual colors or design choices.
   Only evaluate whether we ACCURATELY captured what's there.

   - Score 5: Perfect extraction - all visible elements captured accurately, no hallucinations
   - Score 4: Highly accurate with 1-2 minor omissions or slight color value variations
   - Score 3: Generally accurate but missed some visible elements or has minor hallucinations
   - Score 2: Multiple significant extraction errors, omissions, or hallucinations
   - Score 1: Severely inaccurate - major elements wrong or fabricated

2. **Report Completeness (20% weight)**
   - Did we extract all the visible design elements from the source?
   - Is the report rich with details found on the actual website?
   - Did we thoroughly document what was available?

   IMPORTANT: Do NOT penalize if the source website itself is minimal.
   Only evaluate whether we captured what's available on the source.

   - Score 5: Comprehensive extraction of all visible elements with rich detail
   - Score 4: Good coverage, minor details may be missing
   - Score 3: Adequate coverage of major elements, some details missing
   - Score 2: Missing several visible elements from source
   - Score 1: Severely incomplete - major elements not documented

3. **Report Structure (15% weight)**
   - Is the report well-organized and machine-readable?
   - Does it validate against the JSON schema?
   - Is the structure consistent and logical?

   - Score 5: Perfect schema compliance, excellent organization, clean structure
   - Score 4: Valid with good organization, minor formatting improvements possible
   - Score 3: Valid but organization could be better
   - Score 2: Schema validation errors or poor structure
   - Score 1: Severely malformed or invalid

4. **Usage Clarity (15% weight)**
   - Are the documented design tokens clear and specific enough to use?
   - Can an AI system (like Claude Code) apply these tokens without ambiguity?
   - Do usage rules provide concrete guidance?

   - Score 5: Crystal clear - specific measurements, no ambiguity, ready to use
   - Score 4: Clear with minor gaps that could be inferred
   - Score 3: Adequate but could be more specific
   - Score 2: Vague or incomplete - hard to apply confidently
   - Score 1: Unusable or confusing

5. **Accessibility Analysis (5% weight)**
   - Did we identify and document accessibility characteristics of the source?
   - Are contrast ratios calculated accurately?
   - Are accessibility concerns properly flagged?

   - Score 5: Comprehensive accessibility analysis with accurate calculations
   - Score 4: Good accessibility coverage
   - Score 3: Basic accessibility checks performed
   - Score 2: Minimal accessibility analysis
   - Score 1: No accessibility analysis

6. **Strategic Insight (5% weight)**
   - Does the report provide helpful context about the brand's design approach?
   - Are patterns and principles documented?
   - Does it explain the design system's logic?

   - Score 5: Deep insights with clear articulation of design rationale
   - Score 4: Good insights with reasoning
   - Score 3: Some useful context provided
   - Score 2: Minimal insights
   - Score 1: No insights, purely descriptive

**YOUR RESPONSE (JSON):**
{
  "overall_score": 0.0,
  "dimensions": [
    {
      "name": "brand_fidelity",
      "display_name": "Extraction Fidelity",
      "score": 0.0,
      "weight": 0.4,
      "justification": "2-3 sentence explanation focusing on extraction accuracy, not source design quality",
      "evidence": [
        {
          "type": "strength or weakness",
          "description": "specific example of extraction accuracy/inaccuracy",
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
      "display_name": "Report Completeness",
      "score": 0.0,
      "weight": 0.2,
      "justification": "2-3 sentence explanation about what we captured vs what's visible on source",
      "evidence": [
        {
          "type": "strength or weakness",
          "description": "specific example of what we captured or missed"
        }
      ]
    },
    {
      "name": "parseability",
      "display_name": "Report Structure",
      "score": 0.0,
      "weight": 0.15,
      "justification": "2-3 sentence explanation about report organization",
      "evidence": []
    },
    {
      "name": "actionability",
      "display_name": "Usage Clarity",
      "score": 0.0,
      "weight": 0.15,
      "justification": "2-3 sentence explanation about clarity and usability",
      "evidence": []
    },
    {
      "name": "accessibility",
      "display_name": "Accessibility Analysis",
      "score": 0.0,
      "weight": 0.05,
      "justification": "2-3 sentence explanation about accessibility documentation quality",
      "evidence": []
    },
    {
      "name": "insight_depth",
      "display_name": "Strategic Insight",
      "score": 0.0,
      "weight": 0.05,
      "justification": "2-3 sentence explanation about insights provided",
      "evidence": []
    }
  ],
  "recommendations": [
    {
      "priority": "critical, high, medium, or low",
      "dimension": "which dimension this affects",
      "issue": "clear description of the REPORT problem (not source brand problem)",
      "suggestion": "actionable suggestion to improve the REPORT",
      "expected_impact": "how this would improve report quality"
    }
  ]
}

**IMPORTANT INSTRUCTIONS:**
1. Calculate overall_score as weighted average: sum(dimension.score * dimension.weight)
2. Be specific in justifications - reference actual values from the brand spec
3. Provide 3-6 actionable recommendations ordered by priority
4. Focus on improving the REPORT/EXTRACTION, not critiquing the source brand's design choices
5. All recommendations should be about things WE can fix in our extraction/presentation
6. Return ONLY valid JSON - no markdown, no additional text

Evaluate the report now:`;
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
