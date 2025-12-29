/**
 * Logger utility
 * Provides structured logging with timestamps
 */

export class Logger {
  constructor(context = 'App') {
    this.context = context;
    this.logs = [];
  }

  _formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    return { timestamp, level, context: this.context, message };
  }

  _log(level, message, data = null) {
    const logEntry = this._formatMessage(level, message);
    if (data) {
      logEntry.data = data;
    }

    this.logs.push(logEntry);

    // Console output with colors
    const colors = {
      info: '\x1b[36m',    // Cyan
      warn: '\x1b[33m',    // Yellow
      error: '\x1b[31m',   // Red
      debug: '\x1b[90m',   // Gray
      success: '\x1b[32m'  // Green
    };

    const reset = '\x1b[0m';
    const color = colors[level] || '';

    const timestamp = new Date().toLocaleTimeString();
    console.log(
      `${color}[${timestamp}] [${this.context}] ${level.toUpperCase()}${reset}`,
      message,
      data ? JSON.stringify(data, null, 2) : ''
    );
  }

  info(message, data) {
    this._log('info', message, data);
  }

  warn(message, data) {
    this._log('warn', message, data);
  }

  error(message, data) {
    this._log('error', message, data);
  }

  debug(message, data) {
    this._log('debug', message, data);
  }

  success(message, data) {
    this._log('success', message, data);
  }

  getLogs() {
    return this.logs;
  }

  getLogsForStage() {
    // Convert logs to the format expected by execution_trace schema
    return this.logs.map(log => ({
      timestamp: log.timestamp,
      level: log.level === 'success' ? 'info' : log.level,
      message: log.message
    }));
  }
}
