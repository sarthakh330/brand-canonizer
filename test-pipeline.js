/**
 * Test script for the complete brand extraction pipeline
 */

import { extractBrand } from './src/pipeline/orchestrator.js';

console.log('='.repeat(80));
console.log('Brand Canonizer - Pipeline Test');
console.log('='.repeat(80));
console.log();

const startTime = Date.now();

extractBrand({
  url: 'https://stripe.com',
  adjectives: ['professional', 'trustworthy'],
  onProgress: (stage, message) => {
    console.log(`[${stage.toUpperCase()}] ${message}`);
  }
})
  .then(result => {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log();
    console.log('='.repeat(80));
    if (result.success) {
      console.log('SUCCESS! Brand extraction completed.');
      console.log('='.repeat(80));
      console.log();
      console.log('Results:');
      console.log(`  Brand ID: ${result.brand_id}`);
      console.log(`  Brand Name: ${result.brand_name}`);
      console.log(`  Duration: ${duration}s`);
      console.log(`  Quality Score: ${result.evaluation.overall_score.toFixed(2)}/5.0 (${result.evaluation.quality_band})`);
      console.log(`  Total Tokens: ${result.execution_trace.summary.total_tokens}`);
      console.log(`  Estimated Cost: $${result.execution_trace.summary.estimated_cost_usd.toFixed(4)}`);
      console.log();
      console.log('Files saved:');
      console.log(`  Brand Spec: ${result.paths.brandSpec}`);
      console.log(`  Evaluation: ${result.paths.evaluation}`);
      console.log(`  Execution Trace: ${result.paths.executionTrace}`);
      console.log(`  Metadata: ${result.paths.metadata}`);
      console.log();
      console.log('Evaluation Dimensions:');
      result.evaluation.dimensions.forEach(dim => {
        console.log(`  ${dim.display_name}: ${dim.score.toFixed(1)}/5.0 (weight: ${(dim.weight * 100).toFixed(0)}%)`);
      });
      console.log();
      console.log('Top Recommendations:');
      result.evaluation.recommendations.slice(0, 3).forEach((rec, i) => {
        console.log(`  ${i + 1}. [${rec.priority.toUpperCase()}] ${rec.issue}`);
        console.log(`     → ${rec.suggestion}`);
      });
      console.log();
    } else {
      console.log('FAILED! Brand extraction failed.');
      console.log('='.repeat(80));
      console.log();
      console.log('Error:', result.error);
      if (result.stack) {
        console.log();
        console.log('Stack trace:');
        console.log(result.stack);
      }
    }
    console.log('='.repeat(80));
  })
  .catch(error => {
    console.error();
    console.error('='.repeat(80));
    console.error('FATAL ERROR');
    console.error('='.repeat(80));
    console.error();
    console.error(error);
    console.error();
    console.error('Stack trace:');
    console.error(error.stack);
    process.exit(1);
  });
