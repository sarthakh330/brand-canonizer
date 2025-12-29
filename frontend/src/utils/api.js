/**
 * API Client for Brand Canonizer Backend
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Start brand extraction
 * @param {string} url - Website URL
 * @param {string[]} adjectives - Optional brand adjectives
 * @returns {Promise<{session_id: string, status: string}>}
 */
export async function startExtraction(url, adjectives = []) {
  const response = await api.post('/api/extract', { url, adjectives });
  return response.data;
}

/**
 * Get all brands
 * @returns {Promise<Array>}
 */
export async function getAllBrands() {
  const response = await api.get('/api/brands');
  return response.data;
}

/**
 * Get brand by ID
 * @param {string} brandId
 * @returns {Promise<Object>}
 */
export async function getBrandById(brandId) {
  const response = await api.get(`/api/brands/${brandId}`);
  return response.data;
}

/**
 * Get design inspirations
 * @returns {Promise<Object>}
 */
export async function getInspirations() {
  const response = await api.get('/api/inspirations');
  return response.data;
}

/**
 * Get API status
 * @returns {Promise<Object>}
 */
export async function getApiStatus() {
  const response = await api.get('/api/status');
  return response.data;
}

/**
 * Create SSE connection for extraction progress
 * @param {string} sessionId
 * @param {Function} onProgress - Callback for progress events
 * @returns {EventSource}
 */
export function createProgressStream(sessionId, onProgress) {
  const eventSource = new EventSource(`${API_BASE_URL}/api/brands/${sessionId}/status`);

  eventSource.onmessage = (event) => {
    try {
      // Validate that event.data is not empty
      if (!event.data || event.data.trim() === '') {
        console.warn('[SSE] Received empty data');
        return;
      }

      const data = JSON.parse(event.data);

      // Validate data structure
      if (!data.stage || !data.message) {
        console.error('[SSE] Invalid data structure:', data);
        return;
      }

      console.log('[SSE] Progress update:', data.stage, '-', data.progress_percent + '%');
      onProgress(data);

      // Close connection on complete/error
      if (data.stage === 'complete' || data.stage === 'error') {
        console.log('[SSE] Extraction finished:', data.stage);
        setTimeout(() => {
          eventSource.close();
        }, 1000);
      }
    } catch (error) {
      console.error('[SSE] Error parsing data:', error, 'Raw data:', event.data);
      // Don't close connection on parse error, wait for next event
    }
  };

  eventSource.onerror = (error) => {
    console.error('[SSE] Connection error:', error);
    console.log('[SSE] ReadyState:', eventSource.readyState);
    eventSource.close();
  };

  eventSource.onopen = () => {
    console.log('[SSE] Connection opened for session:', sessionId);
  };

  return eventSource;
}

/**
 * Format quality band with color
 */
export function getQualityBadgeColor(qualityBand) {
  const colors = {
    'Excellent': 'bg-green-100 text-green-800 border-green-300',
    'Good': 'bg-blue-100 text-blue-800 border-blue-300',
    'Acceptable': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'Poor': 'bg-red-100 text-red-800 border-red-300',
    'Unusable': 'bg-gray-100 text-gray-800 border-gray-300'
  };
  return colors[qualityBand] || colors['Acceptable'];
}

/**
 * Format date
 */
export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format duration
 */
export function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export default api;
