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
     * Extract relevant context from request object
     */
    extractReqContext(req) {
        if (!req || typeof req !== 'object') return {};

        // If it's not likely a request object, return as is
        if (!req.method && !req.headers) return req;

        return {
            requestId: req.id,
            method: req.method,
            url: req.originalUrl || req.url,
            userId: req.user?.id,
            ip: req.ip,
        };
    }

    /**
     * Format log entry as JSON or human-readable
     */
    formatLog(level, message, context = {}) {
        // If context is a request object, extract context from it
        let enrichedContext = context;
        if (context && typeof context === 'object' && (context.method || context.headers)) {
            enrichedContext = this.extractReqContext(context);
        }

        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            environment: this.environment,
            ...enrichedContext,
        };

        // In production, output JSON for log aggregation
        if (this.environment === 'production') {
            return JSON.stringify(logEntry);
        }

        // In development, human-readable with colors
        const colorFn = LEVEL_COLORS[level] || chalk.white;
        const timestamp = chalk.gray(logEntry.timestamp);
        const levelStr = colorFn(`[${level}]`);

        // HTTP Request Formatting
        let httpContextInfo = '';
        const restContext = { ...enrichedContext };

        if (enrichedContext.method && enrichedContext.statusCode) {
            const methodColor = {
                GET: chalk.blue,
                POST: chalk.green,
                PUT: chalk.yellow,
                DELETE: chalk.red,
                PATCH: chalk.magenta,
                OPTIONS: chalk.gray
            }[enrichedContext.method.toUpperCase()] || chalk.white;

            const statusColor =
                enrichedContext.statusCode >= 500 ? chalk.red :
                    enrichedContext.statusCode >= 400 ? chalk.yellow :
                        enrichedContext.statusCode >= 300 ? chalk.cyan :
                            enrichedContext.statusCode >= 200 ? chalk.green : chalk.white;

            const method = methodColor(enrichedContext.method);
            const url = enrichedContext.url;
            const status = statusColor(enrichedContext.statusCode);
            const duration = enrichedContext.duration ? chalk.gray(enrichedContext.duration) : '';

            httpContextInfo = `${method} ${url} ${status} ${duration}`;

            // Remove handled fields from restContext so they don't duplicate
            delete restContext.method;
            delete restContext.url;
            delete restContext.statusCode;
            delete restContext.duration;
        }


        // Safely stringify context, handling circular references
        const getCircularReplacer = () => {
            const seen = new WeakSet();
            return (key, value) => {
                if (typeof value === 'object' && value !== null) {
                    if (seen.has(value)) {
                        return '[Circular]';
                    }
                    seen.add(value);
                }
                return value;
            };
        };

        const contextStr = Object.keys(restContext).length > 0 ?
            chalk.gray(JSON.stringify(restContext, getCircularReplacer())) : '';

        return `${timestamp} ${levelStr} ${message} ${httpContextInfo} ${contextStr}`;
    }

    /**
     * Log at DEBUG level
     */
    debug(message, context = {}, req) {
        if (LOG_LEVELS.DEBUG < this.minLevel) return;
        const finalContext = { ...context, ...(req ? this.extractReqContext(req) : {}) };
        console.log(this.formatLog('DEBUG', message, finalContext));
    }

    /**
     * Log at INFO level
     */
    info(message, context = {}, req) {
        if (LOG_LEVELS.INFO < this.minLevel) return;
        const finalContext = { ...context, ...(req ? this.extractReqContext(req) : {}) };
        console.log(this.formatLog('INFO', message, finalContext));
    }

    /**
     * Log at WARN level
     */
    warn(message, context = {}, req) {
        if (LOG_LEVELS.WARN < this.minLevel) return;
        const finalContext = { ...context, ...(req ? this.extractReqContext(req) : {}) };
        console.warn(this.formatLog('WARN', message, finalContext));
    }

    /**
     * Log at ERROR level
     */
    error(message, error, context = {}, req) {
        if (LOG_LEVELS.ERROR < this.minLevel) return;

        // If 3rd arg is req, shift it
        let finalReq = req;
        let finalContext = context;
        if (context && context.headers) {
            finalReq = context;
            finalContext = {};
        }

        const errorContext = {
            ...finalContext,
            ...(finalReq ? this.extractReqContext(finalReq) : {}),
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
