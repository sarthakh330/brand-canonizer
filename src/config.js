/**
 * Configuration loader
 * Loads environment variables and exports configuration object
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from project root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

export const config = {
  // API Configuration
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,

  // Server Configuration
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Data Storage
  dataDir: process.env.DATA_DIR || './data',

  // Capture Configuration
  captureTimeoutMs: parseInt(process.env.CAPTURE_TIMEOUT_MS || '30000', 10),
  captureViewport: {
    width: 1920,
    height: 1080
  },

  // Analysis Configuration
  analyzeModel: process.env.ANALYZE_MODEL || 'claude-3-5-haiku-20241022',
  analyzeMaxTokens: parseInt(process.env.ANALYZE_MAX_TOKENS || '8000', 10),

  // Evaluation Configuration
  evaluationModel: process.env.EVALUATION_MODEL || 'claude-3-5-haiku-20241022',

  // Pipeline Configuration
  pipelineVersion: '1.0.0',

  // Debug
  debug: process.env.DEBUG === 'true'
};

// Validate required configuration
if (!config.anthropicApiKey) {
  throw new Error('ANTHROPIC_API_KEY environment variable is required');
}
