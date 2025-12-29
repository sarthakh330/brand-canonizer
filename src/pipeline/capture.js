/**
 * Stage 1: Capture
 * Uses Playwright to capture screenshots, DOM structure, and computed CSS
 */

import { chromium } from 'playwright';
import { Logger } from '../utils/logger.js';
import { saveBinary, saveJSON, getFileSize } from '../utils/file-utils.js';
import path from 'path';

/**
 * Capture website screenshots, DOM, and styles
 * @param {string} url - Website URL to capture
 * @param {Object} paths - Brand paths object
 * @param {Object} config - Configuration object
 * @returns {Object} Capture results
 */
export async function captureWebsite(url, paths, config) {
  const logger = new Logger('Capture');
  const startTime = Date.now();

  logger.info(`Starting capture for ${url}`);

  let browser = null;
  const artifacts = [];
  const errors = [];

  try {
    // Launch browser
    logger.info('Launching browser');
    browser = await chromium.launch({
      headless: true
    });

    const context = await browser.newContext({
      viewport: config.captureViewport,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });

    const page = await context.newPage();

    // Set timeout
    page.setDefaultTimeout(config.captureTimeoutMs);

    // Navigate to URL with more lenient wait strategy
    logger.info(`Navigating to ${url}`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: config.captureTimeoutMs });
    } catch (error) {
      // Try again with even more lenient settings
      logger.warn(`Initial navigation failed, retrying with load event`);
      await page.goto(url, { waitUntil: 'load', timeout: config.captureTimeoutMs });
    }

    // Wait for page to be fully loaded and for any dynamic content
    logger.info('Waiting for page to stabilize');
    await page.waitForTimeout(3000);

    logger.info('Page loaded successfully');

    // Capture screenshots of different sections
    const screenshots = await captureScreenshots(page, paths, logger);
    artifacts.push(...screenshots);

    // Extract DOM structure
    logger.info('Extracting DOM structure');
    const domData = await extractDOM(page);
    const domPath = paths.captures.dom;
    await saveJSON(domPath, domData);
    artifacts.push({
      name: 'dom.json',
      path: 'captures/dom.json',
      size_bytes: await getFileSize(domPath),
      type: 'json'
    });
    logger.success('DOM structure extracted');

    // Extract computed CSS
    logger.info('Extracting computed CSS');
    const stylesData = await extractStyles(page);
    const stylesPath = paths.captures.styles;
    await saveJSON(stylesPath, stylesData);
    artifacts.push({
      name: 'styles.json',
      path: 'captures/styles.json',
      size_bytes: await getFileSize(stylesPath),
      type: 'json'
    });
    logger.success('Computed CSS extracted');

    await browser.close();
    browser = null;

    const duration = Date.now() - startTime;
    logger.success(`Capture completed in ${duration}ms`);

    return {
      status: 'success',
      duration_ms: duration,
      artifacts,
      logs: logger.getLogsForStage(),
      errors,
      data: {
        dom: domData,
        styles: stylesData,
        screenshots: screenshots.map(s => s.path)
      }
    };

  } catch (error) {
    logger.error(`Capture failed: ${error.message}`);
    errors.push({
      code: 'CAPTURE_ERROR',
      message: error.message,
      recoverable: false
    });

    if (browser) {
      await browser.close();
    }

    return {
      status: 'failed',
      duration_ms: Date.now() - startTime,
      artifacts,
      logs: logger.getLogsForStage(),
      errors
    };
  }
}

/**
 * Capture screenshots of different page sections
 */
async function captureScreenshots(page, paths, logger) {
  const screenshots = [];
  const screenshotsDir = paths.captures.screenshots;

  try {
    // 1. Hero section (above the fold)
    logger.info('Capturing hero section');
    const heroPath = path.join(screenshotsDir, 'hero.png');
    await page.screenshot({
      path: heroPath,
      fullPage: false
    });
    screenshots.push({
      name: 'hero.png',
      path: 'captures/screenshots/hero.png',
      size_bytes: await getFileSize(heroPath),
      type: 'screenshot'
    });

    // 2. Full page screenshot
    logger.info('Capturing full page');
    const fullPagePath = path.join(screenshotsDir, 'full_page.png');
    await page.screenshot({
      path: fullPagePath,
      fullPage: true
    });
    screenshots.push({
      name: 'full_page.png',
      path: 'captures/screenshots/full_page.png',
      size_bytes: await getFileSize(fullPagePath),
      type: 'screenshot'
    });

    // 3. Scroll through page and capture sections
    const viewportHeight = page.viewportSize().height;
    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    const numSections = Math.min(5, Math.ceil(pageHeight / viewportHeight));

    for (let i = 1; i < numSections; i++) {
      const scrollY = i * viewportHeight;
      logger.info(`Capturing section ${i + 1} of ${numSections}`);

      await page.evaluate((y) => window.scrollTo(0, y), scrollY);
      await page.waitForTimeout(500); // Wait for any animations

      const sectionPath = path.join(screenshotsDir, `section_${i}.png`);
      await page.screenshot({
        path: sectionPath,
        fullPage: false
      });
      screenshots.push({
        name: `section_${i}.png`,
        path: `captures/screenshots/section_${i}.png`,
        size_bytes: await getFileSize(sectionPath),
        type: 'screenshot'
      });
    }

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    logger.success(`Captured ${screenshots.length} screenshots`);
    return screenshots;

  } catch (error) {
    logger.error(`Screenshot capture error: ${error.message}`);
    return screenshots;
  }
}

/**
 * Extract DOM structure
 */
async function extractDOM(page) {
  return await page.evaluate(() => {
    const result = {
      title: document.title,
      meta: {},
      headings: [],
      links: [],
      images: [],
      structure: {}
    };

    // Extract meta tags
    const metaTags = document.querySelectorAll('meta');
    metaTags.forEach(meta => {
      const name = meta.getAttribute('name') || meta.getAttribute('property');
      const content = meta.getAttribute('content');
      if (name && content) {
        result.meta[name] = content;
      }
    });

    // Extract headings
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
      result.headings.push({
        tag: heading.tagName.toLowerCase(),
        text: heading.textContent.trim().substring(0, 200),
        classes: Array.from(heading.classList)
      });
    });

    // Extract links (sample)
    const links = document.querySelectorAll('a');
    Array.from(links).slice(0, 50).forEach(link => {
      result.links.push({
        text: link.textContent.trim().substring(0, 100),
        href: link.href,
        classes: Array.from(link.classList)
      });
    });

    // Extract images (sample)
    const images = document.querySelectorAll('img');
    Array.from(images).slice(0, 20).forEach(img => {
      result.images.push({
        src: img.src,
        alt: img.alt,
        classes: Array.from(img.classList)
      });
    });

    // Extract basic structure
    const body = document.body;
    const sections = body.querySelectorAll('section, article, main, header, footer');
    result.structure.sections = sections.length;
    result.structure.buttons = body.querySelectorAll('button, [role="button"], a.btn, a.button').length;
    result.structure.inputs = body.querySelectorAll('input, textarea, select').length;
    result.structure.cards = body.querySelectorAll('[class*="card"]').length;

    return result;
  });
}

/**
 * Extract computed CSS from key elements
 */
async function extractStyles(page) {
  return await page.evaluate(() => {
    const result = {
      colors: new Set(),
      fonts: new Set(),
      fontSizes: new Set(),
      fontWeights: new Set(),
      spacing: new Set(),
      borderRadius: new Set(),
      shadows: new Set()
    };

    // Helper to extract color values
    const extractColor = (color) => {
      if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') return null;

      // Convert rgb/rgba to hex
      if (color.startsWith('rgb')) {
        const match = color.match(/\d+/g);
        if (match && match.length >= 3) {
          const r = parseInt(match[0]);
          const g = parseInt(match[1]);
          const b = parseInt(match[2]);
          return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
        }
      }
      return color;
    };

    // Get all visible elements
    const elements = document.querySelectorAll('body, body *');

    Array.from(elements).slice(0, 1000).forEach(el => {
      const styles = window.getComputedStyle(el);

      // Skip hidden elements
      if (styles.display === 'none' || styles.visibility === 'hidden') return;

      // Colors
      const color = extractColor(styles.color);
      const bgColor = extractColor(styles.backgroundColor);
      if (color) result.colors.add(color);
      if (bgColor) result.colors.add(bgColor);

      // Fonts
      const fontFamily = styles.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
      if (fontFamily) result.fonts.add(fontFamily);

      // Font sizes
      const fontSize = styles.fontSize;
      if (fontSize && fontSize !== '0px') result.fontSizes.add(fontSize);

      // Font weights
      const fontWeight = styles.fontWeight;
      if (fontWeight) result.fontWeights.add(fontWeight);

      // Spacing (padding, margin)
      const padding = styles.padding;
      const margin = styles.margin;
      if (padding && padding !== '0px') result.spacing.add(padding);
      if (margin && margin !== '0px') result.spacing.add(margin);

      // Border radius
      const borderRadius = styles.borderRadius;
      if (borderRadius && borderRadius !== '0px') result.borderRadius.add(borderRadius);

      // Box shadows
      const boxShadow = styles.boxShadow;
      if (boxShadow && boxShadow !== 'none') result.shadows.add(boxShadow);
    });

    // Convert Sets to Arrays and sort
    return {
      colors: Array.from(result.colors).sort(),
      fonts: Array.from(result.fonts),
      fontSizes: Array.from(result.fontSizes).sort((a, b) => {
        return parseFloat(a) - parseFloat(b);
      }),
      fontWeights: Array.from(result.fontWeights).sort((a, b) => parseInt(a) - parseInt(b)),
      spacing: Array.from(result.spacing).slice(0, 50),
      borderRadius: Array.from(result.borderRadius).slice(0, 20),
      shadows: Array.from(result.shadows).slice(0, 20)
    };
  });
}
