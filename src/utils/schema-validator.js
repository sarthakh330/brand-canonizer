/**
 * JSON Schema validator
 * Uses Ajv to validate data against JSON schemas
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Ajv with strict mode and all errors
const ajv = new Ajv({
  allErrors: true,
  strict: false,
  validateFormats: true
});
addFormats(ajv);

// Cache for loaded schemas
const schemaCache = {};

/**
 * Load a schema from the schemas directory
 */
async function loadSchema(schemaName) {
  if (schemaCache[schemaName]) {
    return schemaCache[schemaName];
  }

  const schemaPath = path.join(__dirname, '..', '..', 'schemas', `${schemaName}.schema.json`);
  const schemaContent = await fs.readFile(schemaPath, 'utf-8');
  const schema = JSON.parse(schemaContent);

  schemaCache[schemaName] = schema;
  return schema;
}

/**
 * Validate data against a schema
 */
export async function validateAgainstSchema(schemaName, data) {
  const schema = await loadSchema(schemaName);
  const validate = ajv.compile(schema);
  const valid = validate(data);

  return {
    valid,
    errors: validate.errors || []
  };
}

/**
 * Validate brand_spec.json
 */
export async function validateBrandSpec(brandSpec) {
  return validateAgainstSchema('brand_spec', brandSpec);
}

/**
 * Validate evaluation.json
 */
export async function validateEvaluation(evaluation) {
  return validateAgainstSchema('evaluation', evaluation);
}

/**
 * Validate execution_trace.json
 */
export async function validateExecutionTrace(trace) {
  return validateAgainstSchema('execution_trace', trace);
}

/**
 * Validate metadata.json
 */
export async function validateMetadata(metadata) {
  return validateAgainstSchema('metadata', metadata);
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors) {
  return errors.map(err => {
    const path = err.instancePath || 'root';
    return `${path}: ${err.message}`;
  }).join('\n');
}
