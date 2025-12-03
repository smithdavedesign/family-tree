/**
 * Free Error Logging System
 * Logs errors to console and optionally to database
 * No external service costs
 */

class ErrorLogger {
    constructor() {
        this.environment = import.meta.env.MODE || 'development';
    }

    /**
     * Log error to console and database
     */
    captureException(error, context = {}) {
        const errorData = {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            environment: this.environment,
            context,
            userAgent: navigator.userAgent,
            url: window.location.href,
        };

        // Always log to console
        console.error('Error captured:', errorData);

        // In production, could send to your own API endpoint
        if (this.environment === 'production') {
            this.sendToBackend('error', errorData);
        }
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
            url: window.location.href,
        };

        console[level]('Message captured:', logData);

        if (this.environment === 'production') {
            this.sendToBackend('message', logData);
        }
    }

    /**
     * Set user context
     */
    setUser(user) {
        this.user = user ? { id: user.id, email: user.email } : null;
        console.log('User context set:', this.user);
    }

    /**
     * Add breadcrumb
     */
    addBreadcrumb(message, category = 'custom', data = {}) {
        const breadcrumb = {
            message,
            category,
            data,
            timestamp: new Date().toISOString(),
        };
        console.log('Breadcrumb:', breadcrumb);
    }

    /**
     * Send to backend API (optional)
     */
    async sendToBackend(type, data) {
        try {
            await fetch('/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    data: {
                        ...data,
                        user: this.user,
                    },
                }),
            });
        } catch (err) {
            console.error('Failed to send log to backend:', err);
        }
    }
}

// Create singleton instance
const errorLogger = new ErrorLogger();

/**
 * Initialize error logging (no-op for free version)
 */
export function initErrorLogging() {
    console.log('Error logging initialized (free version)');

    // Set up global error handler
    window.addEventListener('error', (event) => {
        errorLogger.captureException(event.error || new Error(event.message), {
            type: 'unhandled',
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
        });
    });

    // Set up unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
        errorLogger.captureException(
            event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
            { type: 'unhandled_promise' }
        );
    });
}

export const captureException = (error, context) => errorLogger.captureException(error, context);
export const captureMessage = (message, level, context) => errorLogger.captureMessage(message, level, context);
export const setUser = (user) => errorLogger.setUser(user);
export const addBreadcrumb = (message, category, data) => errorLogger.addBreadcrumb(message, category, data);
