/**
 * Structured Logger for Backend
 * 
 * Provides consistent, structured logging with:
 * - Log levels (DEBUG, INFO, WARN, ERROR)
 * - Context enrichment (userId, requestId, etc.)
 * - Environment-aware formatting
 * - Colorized console output for development
 */

const chalk = require('chalk');

// Log levels
const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
};

// Color mapping for console output
const LEVEL_COLORS = {
    DEBUG: chalk.gray,
    INFO: chalk.blue,
    WARN: chalk.yellow,
    ERROR: chalk.red,
};

class Logger {
    constructor() {
        this.environment = process.env.NODE_ENV || 'development';
        this.minLevel = process.env.LOG_LEVEL ?
            LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] :
            LOG_LEVELS.DEBUG;
    }

    /**
     * Format log entry as JSON or human-readable
     */
    formatLog(level, message, context = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            environment: this.environment,
            ...context,
        };

        // In production, output JSON for log aggregation
        if (this.environment === 'production') {
            return JSON.stringify(logEntry);
        }

        // In development, human-readable with colors
        const colorFn = LEVEL_COLORS[level] || chalk.white;
        const timestamp = chalk.gray(logEntry.timestamp);
        const levelStr = colorFn(`[${level}]`);
        const contextStr = Object.keys(context).length > 0 ?
            chalk.gray(JSON.stringify(context)) : '';

        return `${timestamp} ${levelStr} ${message} ${contextStr}`;
    }

    /**
     * Log at DEBUG level
     */
    debug(message, context = {}) {
        if (LOG_LEVELS.DEBUG < this.minLevel) return;
        console.log(this.formatLog('DEBUG', message, context));
    }

    /**
     * Log at INFO level
     */
    info(message, context = {}) {
        if (LOG_LEVELS.INFO < this.minLevel) return;
        console.log(this.formatLog('INFO', message, context));
    }

    /**
     * Log at WARN level
     */
    warn(message, context = {}) {
        if (LOG_LEVELS.WARN < this.minLevel) return;
        console.warn(this.formatLog('WARN', message, context));
    }

    /**
     * Log at ERROR level
     */
    error(message, error, context = {}) {
        if (LOG_LEVELS.ERROR < this.minLevel) return;

        const errorContext = {
            ...context,
            error: error instanceof Error ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
            } : error,
        };

        console.error(this.formatLog('ERROR', message, errorContext));
    }

    /**
     * Create child logger with persistent context
     */
    child(context = {}) {
        const childLogger = Object.create(this);
        childLogger.persistentContext = { ...this.persistentContext, ...context };

        // Override methods to include persistent context
        ['debug', 'info', 'warn', 'error'].forEach(method => {
            const originalMethod = this[method].bind(this);
            childLogger[method] = function (message, contextOrError, additionalContext) {
                const mergedContext = { ...childLogger.persistentContext };

                if (method === 'error') {
                    Object.assign(mergedContext, additionalContext || {});
                    return originalMethod(message, contextOrError, mergedContext);
                } else {
                    Object.assign(mergedContext, contextOrError || {});
                    return originalMethod(message, mergedContext);
                }
            };
        });

        return childLogger;
    }

    /**
     * Log HTTP request
     */
    logRequest(req, res, duration) {
        const { method, originalUrl, ip, headers } = req;

        this.info('HTTP Request', {
            method,
            url: originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip,
            userAgent: headers['user-agent'],
            userId: req.user?.id,
            requestId: req.id,
        });
    }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;
