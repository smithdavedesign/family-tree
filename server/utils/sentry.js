const Sentry = require('@sentry/node');

/**
 * Initialize Sentry for backend error tracking
 */
function initSentry(app) {
    const sentryDsn = process.env.SENTRY_DSN;
    const environment = process.env.NODE_ENV || 'development';

    if (!sentryDsn) {
        console.log('Sentry DSN not configured, skipping initialization');
        return;
    }

    Sentry.init({
        dsn: sentryDsn,
        environment,

        // Performance Monitoring
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0,

        // Filter out sensitive data
        beforeSend(event, hint) {
            // Remove sensitive data from request
            if (event.request) {
                // Remove authorization headers
                if (event.request.headers) {
                    delete event.request.headers.authorization;
                    delete event.request.headers.cookie;
                }

                // Remove sensitive query params
                if (event.request.query_string) {
                    event.request.query_string = event.request.query_string
                        .replace(/token=[^&]*/g, 'token=REDACTED')
                        .replace(/password=[^&]*/g, 'password=REDACTED');
                }
            }

            // Remove sensitive data from extra
            if (event.extra) {
                delete event.extra.token;
                delete event.extra.password;
                delete event.extra.access_token;
            }

            return event;
        },

        // Ignore certain errors
        ignoreErrors: [
            'ECONNRESET',
            'EPIPE',
            'ETIMEDOUT',
        ],
    });

    // Request handler must be the first middleware
    if (app) {
        app.use(Sentry.Handlers.requestHandler());
        app.use(Sentry.Handlers.tracingHandler());
    }

    console.log(`Sentry initialized for ${environment} environment`);
}

/**
 * Error handler middleware (must be added after routes)
 */
function sentryErrorHandler() {
    return Sentry.Handlers.errorHandler({
        shouldHandleError(error) {
            // Capture all errors with status code >= 500
            return error.status >= 500;
        },
    });
}

/**
 * Manually capture an exception
 */
function captureException(error, context = {}) {
    Sentry.captureException(error, {
        extra: context,
    });
}

/**
 * Manually capture a message
 */
function captureMessage(message, level = 'info', context = {}) {
    Sentry.captureMessage(message, {
        level,
        extra: context,
    });
}

/**
 * Set user context for error tracking
 */
function setUser(user) {
    if (user) {
        Sentry.setUser({
            id: user.id,
            email: user.email,
        });
    } else {
        Sentry.setUser(null);
    }
}

module.exports = {
    initSentry,
    sentryErrorHandler,
    captureException,
    captureMessage,
    setUser,
};
