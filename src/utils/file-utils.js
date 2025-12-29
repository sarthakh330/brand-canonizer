/**
 * File utilities
 * Handles filesystem operations for the pipeline
 */

import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

/**
 * Ensure a directory exists, creating it if necessary
 */
export async function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Save JSON data to a file
 */
export async function saveJSON(filePath, data) {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Read JSON data from a file
 */
export async function readJSON(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Save binary data (e.g., screenshots) to a file
 */
export async function saveBinary(filePath, data) {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  await fs.writeFile(filePath, data);
}

/**
 * Get file size in bytes
 */
export async function getFileSize(filePath) {
  const stats = await fs.stat(filePath);
  return stats.size;
}

/**
 * Check if a file exists
 */
export function fileExists(filePath) {
  return existsSync(filePath);
}

/**
 * Create brand directory structure
 */
export async function createBrandDirectories(brandId, baseDir) {
  const brandDir = path.join(baseDir, 'brands', brandId);

  const directories = [
    brandDir,
    path.join(brandDir, 'captures'),
    path.join(brandDir, 'captures', 'screenshots'),
    path.join(brandDir, 'analysis'),
    path.join(brandDir, 'reports'),
    path.join(brandDir, 'evaluations')
  ];

  for (const dir of directories) {
    await ensureDir(dir);
  }

  return brandDir;
}

/**
 * Get paths for brand artifacts
 */
export function getBrandPaths(brandId, baseDir) {
  const brandDir = path.join(baseDir, 'brands', brandId);

  return {
    brandDir,
    captures: {
      dir: path.join(brandDir, 'captures'),
      screenshots: path.join(brandDir, 'captures', 'screenshots'),
      dom: path.join(brandDir, 'captures', 'dom.json'),
      styles: path.join(brandDir, 'captures', 'styles.json')
    },
    analysis: {
      dir: path.join(brandDir, 'analysis'),
      brandTokens: path.join(brandDir, 'analysis', 'brand_tokens.json')
    },
    reports: {
      dir: path.join(brandDir, 'reports'),
      brandSpec: path.join(brandDir, 'reports', 'brand_spec.json')
    },
    evaluations: {
      dir: path.join(brandDir, 'evaluations'),
      evaluation: path.join(brandDir, 'evaluations', 'evaluation.json')
    },
    executionTrace: path.join(brandDir, 'execution_trace.json'),
    metadata: path.join(brandDir, 'metadata.json')
  };
}
