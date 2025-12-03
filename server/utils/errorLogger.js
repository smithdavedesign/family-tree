/**
 * Free Error Logging System - Backend
 * Logs errors to console and database
 * No external service costs
 */

class ErrorLogger {
    constructor() {
        this.environment = process.env.NODE_ENV || 'development';
    }

    /**
     * Log error
     */
    captureException(error, context = {}) {
        const errorData = {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            environment: this.environment,
            context,
        };

        console.error('Error captured:', errorData);

        // Could save to database here if needed
        // this.saveToDatabase('error', errorData);
    }

    /**
     * Log message
     */
    captureMessage(message, level = 'info', context = {}) {
        const logData = {
            message,
            level,
            timestamp: new Date().toISOString(),
            environment: this.environment,
            context,
        };

        console[level]('Message captured:', logData);
    }

    /**
     * Set user context
     */
    setUser(user) {
        this.user = user ? { id: user.id, email: user.email } : null;
    }

    /**
     * Save to database (optional)
     */
    async saveToDatabase(type, data) {
        // Could implement database logging here
        // For now, just console log
    }
}

const errorLogger = new ErrorLogger();

/**
 * Initialize error logging (no-op for free version)
 */
function initErrorLogging(app) {
    console.log('Error logging initialized (free version)');

    // Request handler middleware
    if (app) {
        app.use((req, res, next) => {
            // Add request context
            req.errorContext = {
                method: req.method,
                url: req.url,
                ip: req.ip,
            };
            next();
        });
    }
}

/**
 * Error handler middleware
 */
function errorHandler() {
    return (err, req, res, next) => {
        errorLogger.captureException(err, {
            ...req.errorContext,
            user: req.user,
        });
        next(err);
    };
}

module.exports = {
    initErrorLogging,
    errorHandler,
    captureException: (error, context) => errorLogger.captureException(error, context),
    captureMessage: (message, level, context) => errorLogger.captureMessage(message, level, context),
    setUser: (user) => errorLogger.setUser(user),
};
