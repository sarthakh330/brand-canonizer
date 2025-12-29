/**
 * Brand Canonizer API Server
 * Express server with SSE support for real-time brand extraction
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { extractBrand, getPipelineStatus } from './pipeline/orchestrator.js';
import { config } from './config.js';
import { Logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const logger = new Logger('Server');

// Middleware
app.use(cors());
app.use(express.json());

// Active extraction sessions (for SSE)
const activeSessions = new Map();

/**
 * POST /api/extract
 * Start brand extraction from URL
 */
app.post('/api/extract', async (req, res) => {
  try {
    const { url, adjectives = [] } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    logger.info(`Starting extraction for ${url}`);

    // Generate session ID for this extraction
    const sessionId = Date.now().toString();
    const sessionData = {
      status: 'processing',
      progress: 0,
      stage: 'setup',
      message: 'Initializing extraction...',
      events: [],
      result: null
    };
    activeSessions.set(sessionId, sessionData);

    // Start extraction in background
    extractBrand({
      url,
      adjectives,
      onProgress: (stage, message) => {
        const session = activeSessions.get(sessionId);
        if (session) {
          // Calculate progress percentage based on stage
          const stageProgress = {
            setup: 5,
            capture: 25,
            analyze: 50,
            synthesize: 75,
            evaluate: 90,
            finalize: 100,
            error: 0
          };

          session.stage = stage;
          session.message = message;
          session.progress = stageProgress[stage] || session.progress;

          // Store event for SSE clients
          const event = {
            stage,
            message,
            progress_percent: session.progress,
            timestamp: new Date().toISOString()
          };
          session.events.push(event);

          logger.info(`[${sessionId}] ${stage}: ${message} (${session.progress}%)`);
        }
      }
    })
      .then((result) => {
        const session = activeSessions.get(sessionId);
        if (session) {
          session.status = result.success ? 'completed' : 'failed';
          session.progress = 100;
          session.result = result;

          const finalEvent = {
            stage: 'complete',
            message: result.success
              ? `Extraction complete! Brand ID: ${result.brand_id}`
              : `Extraction failed: ${result.error}`,
            progress_percent: 100,
            timestamp: new Date().toISOString(),
            brand_id: result.brand_id
          };
          session.events.push(finalEvent);

          logger.success(`[${sessionId}] Extraction ${session.status}`);

          // Keep session for 5 minutes then clean up
          setTimeout(() => {
            activeSessions.delete(sessionId);
            logger.info(`[${sessionId}] Session cleaned up`);
          }, 5 * 60 * 1000);
        }
      })
      .catch((error) => {
        const session = activeSessions.get(sessionId);
        if (session) {
          session.status = 'failed';
          session.error = error.message;

          const errorEvent = {
            stage: 'error',
            message: `Error: ${error.message}`,
            progress_percent: session.progress,
            timestamp: new Date().toISOString()
          };
          session.events.push(errorEvent);

          logger.error(`[${sessionId}] Extraction error: ${error.message}`);
        }
      });

    // Return session ID immediately
    res.json({
      session_id: sessionId,
      status: 'processing',
      message: 'Extraction started'
    });

  } catch (error) {
    logger.error(`API Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/brands
 * List all brand extractions
 */
app.get('/api/brands', async (req, res) => {
  try {
    const brandsDir = path.join(config.dataDir, 'brands');

    // Check if brands directory exists
    try {
      await fs.access(brandsDir);
    } catch (e) {
      return res.json([]);
    }

    const brandDirs = await fs.readdir(brandsDir);
    const brands = [];

    for (const brandDir of brandDirs) {
      const metadataPath = path.join(brandsDir, brandDir, 'metadata.json');

      try {
        const metadataContent = await fs.readFile(metadataPath, 'utf-8');
        const metadata = JSON.parse(metadataContent);
        brands.push(metadata);
      } catch (e) {
        logger.warn(`Could not read metadata for ${brandDir}: ${e.message}`);
      }
    }

    // Sort by extracted_at descending (newest first)
    brands.sort((a, b) => new Date(b.extracted_at) - new Date(a.extracted_at));

    res.json(brands);

  } catch (error) {
    logger.error(`Error listing brands: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/brands/:id
 * Get complete brand data by ID
 */
app.get('/api/brands/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const brandDir = path.join(config.dataDir, 'brands', id);

    // Check if brand exists
    try {
      await fs.access(brandDir);
    } catch (e) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    // Read all JSON files
    const brandSpecPath = path.join(brandDir, 'reports', 'brand_spec.json');
    const evaluationPath = path.join(brandDir, 'evaluations', 'evaluation.json');
    const executionTracePath = path.join(brandDir, 'execution_trace.json');
    const metadataPath = path.join(brandDir, 'metadata.json');

    const [brandSpec, evaluation, executionTrace, metadata] = await Promise.all([
      fs.readFile(brandSpecPath, 'utf-8').then(JSON.parse),
      fs.readFile(evaluationPath, 'utf-8').then(JSON.parse),
      fs.readFile(executionTracePath, 'utf-8').then(JSON.parse),
      fs.readFile(metadataPath, 'utf-8').then(JSON.parse)
    ]);

    res.json({
      brand_spec: brandSpec,
      evaluation,
      execution_trace: executionTrace,
      metadata
    });

  } catch (error) {
    logger.error(`Error getting brand ${req.params.id}: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/brands/:id/status (SSE)
 * Server-Sent Events endpoint for real-time progress
 */
app.get('/api/brands/:id/status', (req, res) => {
  const { id } = req.params;

  logger.info(`SSE connection opened for session ${id}`);

  // Set up SSE headers with no buffering
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders(); // CRITICAL: Flush headers immediately

  // Check if session exists
  const session = activeSessions.get(id);
  if (!session) {
    res.write(`data: ${JSON.stringify({
      stage: 'error',
      message: 'Session not found',
      progress_percent: 0
    })}\n\n`);
    if (res.flush) res.flush(); // Flush the error data
    res.end();
    return;
  }

  // Send all existing events
  let eventIndex = 0;
  session.events.forEach(event => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
    if (res.flush) res.flush(); // CRITICAL: Flush after each write
    eventIndex++;
  });

  // Poll for new events
  const pollInterval = setInterval(() => {
    const currentSession = activeSessions.get(id);
    if (!currentSession) {
      clearInterval(pollInterval);
      res.end();
      return;
    }

    // Send any new events
    while (eventIndex < currentSession.events.length) {
      const event = currentSession.events[eventIndex];
      res.write(`data: ${JSON.stringify(event)}\n\n`);
      if (res.flush) res.flush(); // CRITICAL: Flush after each write
      eventIndex++;
    }

    // Close connection if complete or failed
    if (currentSession.status === 'completed' || currentSession.status === 'failed') {
      clearInterval(pollInterval);
      // Keep connection open for a bit to ensure client receives final message
      setTimeout(() => {
        res.end();
        logger.info(`SSE connection closed for session ${id}`);
      }, 2000); // Increased from 1000ms to 2000ms
    }
  }, 500); // Poll every 500ms

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(pollInterval);
    logger.info(`SSE client disconnected for session ${id}`);
  });
});

/**
 * GET /api/inspirations
 * Get design inspirations
 */
app.get('/api/inspirations', async (req, res) => {
  try {
    const inspirationsPath = path.join(config.dataDir, 'knowledge', 'inspirations.json');
    const content = await fs.readFile(inspirationsPath, 'utf-8');
    const inspirations = JSON.parse(content);

    res.json(inspirations);

  } catch (error) {
    logger.error(`Error getting inspirations: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/status
 * Health check and pipeline status
 */
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    pipeline: getPipelineStatus(),
    active_sessions: activeSessions.size
  });
});

/**
 * Serve static files (screenshots, etc.)
 */
app.use('/data', express.static(path.join(config.dataDir)));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.success(`Brand Canonizer API server running on http://localhost:${PORT}`);
  logger.info(`Frontend dev server should run on http://localhost:5173`);
  logger.info(`Data directory: ${config.dataDir}`);
});
