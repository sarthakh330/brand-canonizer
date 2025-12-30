/**
 * Pipeline Orchestrator
 * Runs all 4 stages sequentially and manages execution flow
 */

import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { Logger } from '../utils/logger.js';
import { createBrandDirectories, getBrandPaths, saveJSON } from '../utils/file-utils.js';
import { validateExecutionTrace, validateMetadata } from '../utils/schema-validator.js';
import { captureWebsite } from './capture.js';
import { analyzeWithClaude } from './analyze.js';
import { synthesizeBrandSpec } from './synthesize.js';
import { evaluateBrandSpec } from './evaluate.js';
import { refineBrandSpec } from './refine.js';

/**
 * Extract complete brand identity from a website
 * @param {Object} options - Extraction options
 * @param {string} options.url - Website URL to extract
 * @param {Array<string>} options.adjectives - Optional brand adjectives
 * @param {Function} options.onProgress - Progress callback (stage, message)
 * @returns {Object} Extraction results
 */
export async function extractBrand(options) {
  const { url, adjectives = [], onProgress = null } = options;

  const logger = new Logger('Orchestrator');
  const overallStartTime = Date.now();

  logger.info(`Starting brand extraction for ${url}`);

  // Emit progress
  const emit = (stage, message) => {
    logger.info(`[${stage}] ${message}`);
    if (onProgress) {
      onProgress(stage, message);
    }
  };

  try {
    // Generate brand ID
    const brandName = extractBrandName(url);
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '_');
    const brandId = `${brandName}_${timestamp}_${uuidv4().slice(0, 8)}`;

    logger.info(`Brand ID: ${brandId}`);
    emit('setup', `Creating brand directories for ${brandId}`);

    // Create directory structure
    const brandDir = await createBrandDirectories(brandId, config.dataDir);
    const paths = getBrandPaths(brandId, config.dataDir);

    logger.success(`Brand directory created at ${brandDir}`);

    // Initialize execution trace
    const executionTrace = {
      version: '1.0.0',
      pipeline_version: config.pipelineVersion,
      brand_id: brandId,
      started_at: new Date().toISOString(),
      stages: []
    };

    // Stage 1: Capture
    emit('capture', 'Launching browser and capturing website...');
    const captureResult = await captureWebsite(url, paths, config);
    executionTrace.stages.push({
      name: 'capture',
      display_name: 'Capture',
      status: captureResult.status,
      start_time: new Date(overallStartTime).toISOString(),
      end_time: new Date(overallStartTime + captureResult.duration_ms).toISOString(),
      duration_ms: captureResult.duration_ms,
      artifacts: captureResult.artifacts,
      logs: captureResult.logs,
      errors: captureResult.errors
    });

    if (captureResult.status === 'failed') {
      throw new Error('Capture stage failed: ' + captureResult.errors[0]?.message);
    }

    emit('capture', `Captured ${captureResult.artifacts.length} artifacts`);

    // Stage 2: Analyze
    emit('analyze', 'Analyzing screenshots with Claude Vision API...');
    const analyzeResult = await analyzeWithClaude(
      captureResult.data,
      paths,
      config,
      adjectives
    );

    const analyzeStartTime = overallStartTime + captureResult.duration_ms;
    executionTrace.stages.push({
      name: 'analyze',
      display_name: 'Analyze',
      status: analyzeResult.status,
      start_time: new Date(analyzeStartTime).toISOString(),
      end_time: new Date(analyzeStartTime + analyzeResult.duration_ms).toISOString(),
      duration_ms: analyzeResult.duration_ms,
      artifacts: analyzeResult.artifacts,
      logs: analyzeResult.logs,
      errors: analyzeResult.errors,
      metrics: analyzeResult.metrics
    });

    if (analyzeResult.status === 'failed') {
      throw new Error('Analysis stage failed: ' + analyzeResult.errors[0]?.message);
    }

    emit('analyze', `Analysis complete (${analyzeResult.metrics.tokens_input + analyzeResult.metrics.tokens_output} tokens)`);

    // Stage 3: Synthesize
    emit('synthesize', 'Synthesizing brand specification...');
    const totalDurationSoFar = captureResult.duration_ms + analyzeResult.duration_ms;

    const synthesizeResult = await synthesizeBrandSpec(
      analyzeResult.data,
      {
        brand_id: brandId,
        brand_name: brandName,
        source_url: url,
        extracted_at: new Date().toISOString(),
        adjectives
      },
      paths,
      totalDurationSoFar
    );

    const synthesizeStartTime = analyzeStartTime + analyzeResult.duration_ms;
    executionTrace.stages.push({
      name: 'synthesize',
      display_name: 'Synthesize',
      status: synthesizeResult.status,
      start_time: new Date(synthesizeStartTime).toISOString(),
      end_time: new Date(synthesizeStartTime + synthesizeResult.duration_ms).toISOString(),
      duration_ms: synthesizeResult.duration_ms,
      artifacts: synthesizeResult.artifacts,
      logs: synthesizeResult.logs,
      errors: synthesizeResult.errors
    });

    if (synthesizeResult.status === 'failed') {
      throw new Error('Synthesis stage failed: ' + synthesizeResult.errors[0]?.message);
    }

    if (synthesizeResult.warnings && synthesizeResult.warnings.length > 0) {
      emit('synthesize', `Synthesis complete with ${synthesizeResult.warnings.length} warnings`);
    } else {
      emit('synthesize', 'Brand specification synthesized and validated');
    }

    // Stage 4: Evaluate
    emit('evaluate', 'Evaluating brand specification quality...');
    const evaluateResult = await evaluateBrandSpec(
      synthesizeResult.data,
      paths,
      config
    );

    const evaluateStartTime = synthesizeStartTime + synthesizeResult.duration_ms;
    executionTrace.stages.push({
      name: 'evaluate',
      display_name: 'Evaluate',
      status: evaluateResult.status,
      start_time: new Date(evaluateStartTime).toISOString(),
      end_time: new Date(evaluateStartTime + evaluateResult.duration_ms).toISOString(),
      duration_ms: evaluateResult.duration_ms,
      artifacts: evaluateResult.artifacts,
      logs: evaluateResult.logs,
      errors: evaluateResult.errors,
      metrics: evaluateResult.metrics
    });

    if (evaluateResult.status === 'failed') {
      throw new Error('Evaluation stage failed: ' + evaluateResult.errors[0]?.message);
    }

    emit('evaluate', `Evaluation complete - Overall score: ${evaluateResult.data.overall_score.toFixed(2)}/5.0`);

    // Stage 5: Refine (if score < 4.5)
    let refineResult;
    let finalBrandSpec = synthesizeResult.data;

    if (evaluateResult.data.overall_score < 4.5) {
      emit('refine', `Refining specification based on feedback (score: ${evaluateResult.data.overall_score.toFixed(2)})...`);

      refineResult = await refineBrandSpec(
        synthesizeResult.data,
        evaluateResult.data,
        paths,
        config
      );

      const refineStartTime = evaluateStartTime + evaluateResult.duration_ms;
      executionTrace.stages.push({
        name: 'refine',
        display_name: 'Refine',
        status: refineResult.status,
        start_time: new Date(refineStartTime).toISOString(),
        end_time: new Date(refineStartTime + refineResult.duration_ms).toISOString(),
        duration_ms: refineResult.duration_ms,
        artifacts: refineResult.artifacts,
        logs: refineResult.logs,
        errors: refineResult.errors,
        metrics: refineResult.metrics
      });

      if (refineResult.status === 'success') {
        finalBrandSpec = refineResult.data;
        emit('refine', `Refinement complete - Made ${refineResult.metrics.improvements_made} improvements`);
      } else if (refineResult.status === 'skipped') {
        emit('refine', 'Refinement skipped - score is excellent');
      } else {
        emit('refine', 'Refinement failed - using original specification');
      }
    } else {
      emit('refine', 'Refinement skipped - score is excellent (≥4.5)');
      // Add a skipped stage to execution trace
      const refineStartTime = evaluateStartTime + evaluateResult.duration_ms;
      executionTrace.stages.push({
        name: 'refine',
        display_name: 'Refine',
        status: 'skipped',
        start_time: new Date(refineStartTime).toISOString(),
        end_time: new Date(refineStartTime).toISOString(),
        duration_ms: 0,
        artifacts: [],
        logs: [],
        errors: [],
        metrics: {
          tokens_input: 0,
          tokens_output: 0,
          improvements_made: 0
        }
      });
    }

    // Finalize execution trace
    const totalDuration = Date.now() - overallStartTime;
    executionTrace.completed_at = new Date().toISOString();

    const totalTokens = (analyzeResult.metrics?.tokens_input || 0) +
                       (analyzeResult.metrics?.tokens_output || 0) +
                       (evaluateResult.metrics?.tokens_input || 0) +
                       (evaluateResult.metrics?.tokens_output || 0) +
                       (refineResult?.metrics?.tokens_input || 0) +
                       (refineResult?.metrics?.tokens_output || 0);

    // Estimate cost (rough estimates for Sonnet)
    // Input: ~$3 per million tokens, Output: ~$15 per million tokens
    const inputTokens = (analyzeResult.metrics?.tokens_input || 0) +
                        (evaluateResult.metrics?.tokens_input || 0) +
                        (refineResult?.metrics?.tokens_input || 0);
    const outputTokens = (analyzeResult.metrics?.tokens_output || 0) +
                         (evaluateResult.metrics?.tokens_output || 0) +
                         (refineResult?.metrics?.tokens_output || 0);
    const estimatedCost = (inputTokens / 1000000 * 3) + (outputTokens / 1000000 * 15);

    executionTrace.summary = {
      total_duration_ms: totalDuration,
      status: 'success',
      total_tokens: totalTokens,
      estimated_cost_usd: parseFloat(estimatedCost.toFixed(4)),
      warnings: [
        ...(synthesizeResult.warnings || [])
      ],
      errors: []
    };

    // Save execution trace
    emit('finalize', 'Saving execution trace...');
    await saveJSON(paths.executionTrace, executionTrace);

    // Validate execution trace
    const traceValidation = await validateExecutionTrace(executionTrace);
    if (!traceValidation.valid) {
      logger.warn('Execution trace validation failed');
    }

    // Create and save metadata
    const metadata = {
      brand_id: brandId,
      brand_name: brandName,
      source_url: url,
      extracted_at: executionTrace.started_at,
      version: 1,
      status: 'completed',
      evaluation_summary: {
        overall_score: evaluateResult.data.overall_score,
        quality_band: evaluateResult.data.quality_band,
        top_strengths: getTopDimensions(evaluateResult.data.dimensions, true),
        top_weaknesses: getTopDimensions(evaluateResult.data.dimensions, false)
      },
      preview: {
        dominant_colors: extractDominantColors(finalBrandSpec),
        primary_font: finalBrandSpec.design_tokens?.typography?.font_families?.primary?.name || 'Unknown',
        screenshot_thumbnail: 'captures/screenshots/hero.png'
      },
      execution_summary: {
        total_duration_ms: totalDuration,
        total_tokens: totalTokens,
        estimated_cost_usd: parseFloat(estimatedCost.toFixed(4))
      },
      adjectives,
      tags: generateTags(finalBrandSpec)
    };

    await saveJSON(paths.metadata, metadata);

    // Validate metadata
    const metadataValidation = await validateMetadata(metadata);
    if (!metadataValidation.valid) {
      logger.warn('Metadata validation failed');
    }

    emit('finalize', 'Brand extraction complete!');

    logger.success(`Brand extraction completed in ${totalDuration}ms`);
    logger.success(`Total cost: $${estimatedCost.toFixed(4)}`);
    logger.success(`Overall quality score: ${evaluateResult.data.overall_score.toFixed(2)}/5.0 (${evaluateResult.data.quality_band})`);

    return {
      success: true,
      brand_id: brandId,
      brand_name: brandName,
      brand_spec: finalBrandSpec, // Use refined spec if refinement was successful
      evaluation: evaluateResult.data,
      refinement: refineResult || null,
      execution_trace: executionTrace,
      metadata,
      paths: {
        brandDir,
        brandSpec: paths.reports.brandSpec,
        evaluation: paths.evaluations.evaluation,
        executionTrace: paths.executionTrace,
        metadata: paths.metadata
      }
    };

  } catch (error) {
    logger.error(`Brand extraction failed: ${error.message}`);
    logger.error(error.stack);

    emit('error', `Extraction failed: ${error.message}`);

    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Extract brand name from URL
 */
function extractBrandName(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    const name = hostname.split('.')[0];
    return name.replace(/[^a-zA-Z0-9]/g, '_');
  } catch (e) {
    return 'brand';
  }
}

/**
 * Get top 2 dimensions (strengths or weaknesses)
 */
function getTopDimensions(dimensions, getStrengths = true) {
  if (!dimensions || dimensions.length === 0) return [];

  const sorted = [...dimensions].sort((a, b) => {
    return getStrengths ? b.score - a.score : a.score - b.score;
  });

  return sorted.slice(0, 2).map(d => d.display_name);
}

/**
 * Extract dominant colors for preview
 */
function extractDominantColors(brandSpec) {
  const colors = [];

  try {
    const tokens = brandSpec.design_tokens?.colors;
    if (!tokens) return ['#000000', '#666666', '#ffffff'];

    if (tokens.primary?.value) colors.push(tokens.primary.value);
    if (tokens.secondary?.value) colors.push(tokens.secondary.value);
    if (tokens.accent?.value) colors.push(tokens.accent.value);

    // Add a neutral if we don't have 3 colors yet
    if (colors.length < 3 && tokens.neutrals?.gray) {
      const grayValues = Object.values(tokens.neutrals.gray);
      if (grayValues.length > 0 && grayValues[0].value) {
        colors.push(grayValues[0].value);
      }
    }

    // Ensure we have at least 3 colors
    while (colors.length < 3) {
      colors.push('#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
    }

    return colors.slice(0, 5);
  } catch (e) {
    return ['#000000', '#666666', '#ffffff'];
  }
}

/**
 * Generate tags based on brand spec
 */
function generateTags(brandSpec) {
  const tags = [];

  try {
    // Add tone as tag
    if (brandSpec.brand_essence?.tone) {
      tags.push(brandSpec.brand_essence.tone);
    }

    // Add some adjectives as tags
    if (brandSpec.brand_essence?.adjectives) {
      tags.push(...brandSpec.brand_essence.adjectives.slice(0, 3));
    }

    return tags;
  } catch (e) {
    return [];
  }
}

/**
 * Get pipeline status (for API endpoints)
 */
export function getPipelineStatus() {
  return {
    version: config.pipelineVersion,
    available: true,
    stages: ['capture', 'analyze', 'synthesize', 'evaluate', 'refine']
  };
}
