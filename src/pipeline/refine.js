/**
 * Stage 5: Refine
 * Uses evaluation feedback to improve the brand specification
 */

import Anthropic from '@anthropic-ai/sdk';
import { Logger } from '../utils/logger.js';
import { saveJSON, getFileSize } from '../utils/file-utils.js';
import { validateBrandSpec, formatValidationErrors } from '../utils/schema-validator.js';

/**
 * Refine brand spec based on evaluation feedback
 * @param {Object} brandSpec - The brand specification to refine
 * @param {Object} evaluation - The evaluation with feedback
 * @param {Object} paths - Brand paths object
 * @param {Object} config - Configuration object
 * @returns {Object} Refinement results
 */
export async function refineBrandSpec(brandSpec, evaluation, paths, config) {
  const logger = new Logger('Refine');
  const startTime = Date.now();

  logger.info('Starting brand specification refinement');

  // Check if refinement is needed
  if (evaluation.overall_score >= 4.5) {
    logger.info(`Score ${evaluation.overall_score.toFixed(2)} is excellent - skipping refinement`);
    return {
      status: 'skipped',
      duration_ms: Date.now() - startTime,
      artifacts: [],
      logs: logger.getLogsForStage(),
      errors: [],
      metrics: {
        tokens_input: 0,
        tokens_output: 0,
        model_used: config.evaluationModel,
        api_calls: 0,
        improvements_made: 0
      },
      data: brandSpec // Return original spec unchanged
    };
  }

  const anthropic = new Anthropic({
    apiKey: config.anthropicApiKey
  });

  const artifacts = [];
  const errors = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  try {
    // Build refinement prompt
    logger.info('Building refinement prompt with evaluation feedback');
    const prompt = buildRefinementPrompt(brandSpec, evaluation);

    // Call Claude API
    logger.info('Sending refinement request to Claude API');
    const message = await anthropic.messages.create({
      model: config.synthesisModel, // Use same model as synthesis
      max_tokens: 16000,
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
    const refinedSpec = extractJSONFromResponse(responseText);

    // Validate refined spec
    logger.info('Validating refined specification against JSON schema');
    const validation = await validateBrandSpec(refinedSpec);

    if (!validation.valid) {
      const errorMsg = formatValidationErrors(validation.errors);
      logger.warn(`Refined spec validation failed:\n${errorMsg}`);

      // If validation fails, return original spec
      logger.info('Returning original specification due to validation failure');
      return {
        status: 'failed',
        duration_ms: Date.now() - startTime,
        artifacts: [],
        logs: logger.getLogsForStage(),
        errors: [{
          code: 'VALIDATION_FAILED',
          message: 'Refined specification failed validation',
          recoverable: true
        }],
        metrics: {
          tokens_input: totalInputTokens,
          tokens_output: totalOutputTokens,
          model_used: config.synthesisModel,
          api_calls: 1,
          improvements_made: 0
        },
        data: brandSpec // Return original on failure
      };
    }

    logger.success('Refined specification passes schema validation');

    // Count improvements made
    const improvementsMade = countImprovements(brandSpec, refinedSpec);
    logger.info(`Made ${improvementsMade} improvements to specification`);

    // Save refined brand_spec.json (overwrites original)
    const brandSpecPath = paths.reports.brandSpec;
    await saveJSON(brandSpecPath, refinedSpec);

    artifacts.push({
      name: 'brand_spec.json (refined)',
      path: 'reports/brand_spec.json',
      size_bytes: await getFileSize(brandSpecPath),
      type: 'json'
    });

    const duration = Date.now() - startTime;
    logger.success(`Refinement completed in ${duration}ms with ${improvementsMade} improvements`);

    return {
      status: 'success',
      duration_ms: duration,
      artifacts,
      logs: logger.getLogsForStage(),
      errors,
      metrics: {
        tokens_input: totalInputTokens,
        tokens_output: totalOutputTokens,
        model_used: config.synthesisModel,
        api_calls: 1,
        improvements_made: improvementsMade
      },
      data: refinedSpec
    };

  } catch (error) {
    logger.error(`Refinement failed: ${error.message}`);
    errors.push({
      code: 'REFINEMENT_ERROR',
      message: error.message,
      recoverable: true
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
        model_used: config.synthesisModel,
        api_calls: 1,
        improvements_made: 0
      },
      data: brandSpec // Return original on error
    };
  }
}

/**
 * Build refinement prompt with evaluation feedback
 */
function buildRefinementPrompt(brandSpec, evaluation) {
  // Extract high and critical priority recommendations
  const criticalIssues = evaluation.recommendations.filter(r =>
    r.priority === 'critical' || r.priority === 'high'
  );

  // Build focused feedback summary
  const feedbackSummary = criticalIssues.map(rec =>
    `- **${rec.dimension}** (${rec.priority}): ${rec.issue}\n  → ${rec.suggestion}`
  ).join('\n\n');

  return `You are refining an AI-generated brand specification based on evaluation feedback.

**CURRENT BRAND SPECIFICATION:**
${JSON.stringify(brandSpec, null, 2)}

**EVALUATION RESULTS:**
Overall Score: ${evaluation.overall_score.toFixed(2)}/5.0 (${evaluation.quality_band})

**DIMENSION SCORES:**
${evaluation.dimensions.map(d =>
  `- ${d.display_name}: ${d.score.toFixed(1)}/5.0 - ${d.justification}`
).join('\n')}

**CRITICAL IMPROVEMENTS NEEDED:**
${feedbackSummary}

**YOUR TASK:**
Improve the brand specification by addressing the critical and high-priority feedback above.

**REFINEMENT GUIDELINES:**
1. **Focus on Extraction Accuracy**: Fix any hallucinations or omissions identified
2. **Maintain Fidelity**: Do NOT change correctly extracted values
3. **Enhance Completeness**: Add missing details if identified in feedback
4. **Improve Clarity**: Make usage rules more specific and actionable
5. **Preserve Structure**: Keep the same JSON schema structure

**IMPORTANT:**
- Only change things that the evaluation identified as problems
- Do NOT "improve" the source brand's design choices (like changing colors)
- Do NOT add features that weren't in the original extraction
- Focus on making the REPORT better, not redesigning the brand

**OUTPUT FORMAT:**
Return the complete refined brand specification as valid JSON.
Do NOT include markdown code blocks or any text outside the JSON.

Refine the specification now:`;
}

/**
 * Extract JSON from Claude's response
 */
function extractJSONFromResponse(responseText) {
  try {
    return JSON.parse(responseText);
  } catch (e) {
    // Try to extract from markdown code block
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }

    // Try to find JSON boundaries
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      return JSON.parse(responseText.substring(jsonStart, jsonEnd + 1));
    }

    throw new Error('Could not extract valid JSON from Claude refinement response');
  }
}

/**
 * Count improvements made between original and refined spec
 */
function countImprovements(original, refined) {
  let improvements = 0;

  // Check if components improved
  const origComponentCount = original.components?.length || 0;
  const refinedComponentCount = refined.components?.length || 0;
  if (refinedComponentCount > origComponentCount) {
    improvements += (refinedComponentCount - origComponentCount);
  }

  // Check if color palette improved
  const origColorCount = Object.keys(original.design_tokens?.colors || {}).length;
  const refinedColorCount = Object.keys(refined.design_tokens?.colors || {}).length;
  if (refinedColorCount > origColorCount) {
    improvements++;
  }

  // Check if usage rules improved
  const origUsageRules = JSON.stringify(original).match(/"usage_rules":/g)?.length || 0;
  const refinedUsageRules = JSON.stringify(refined).match(/"usage_rules":/g)?.length || 0;
  if (refinedUsageRules > origUsageRules) {
    improvements++;
  }

  // Check if accessibility improved
  const origAccessibility = JSON.stringify(original.accessibility || {}).length;
  const refinedAccessibility = JSON.stringify(refined.accessibility || {}).length;
  if (refinedAccessibility > origAccessibility + 100) { // At least 100 chars more
    improvements++;
  }

  return improvements;
}
