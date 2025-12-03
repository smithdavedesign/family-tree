import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry for error tracking
 * Only initialize in production or when explicitly enabled
 */
export function initSentry() {
    // Only initialize if DSN is provided and not in development
    const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
    const environment = import.meta.env.MODE;

    if (!sentryDsn) {
        console.log('Sentry DSN not configured, skipping initialization');
        return;
    }

    Sentry.init({
        dsn: sentryDsn,
        environment,
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
                maskAllText: true,
                blockAllMedia: true,
            }),
        ],

        // Performance Monitoring
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0,

        // Session Replay
        replaysSessionSampleRate: 0.1, // 10% of sessions
        replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

        // Filter out sensitive data
        beforeSend(event, hint) {
            // Remove sensitive data from breadcrumbs
            if (event.breadcrumbs) {
                event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
                    if (breadcrumb.data) {
                        // Remove tokens and passwords
                        delete breadcrumb.data.token;
                        delete breadcrumb.data.password;
                        delete breadcrumb.data.access_token;
                    }
                    return breadcrumb;
                });
            }

            // Remove sensitive headers
            if (event.request?.headers) {
                delete event.request.headers.Authorization;
                delete event.request.headers.Cookie;
            }

            return event;
        },

        // Ignore certain errors
        ignoreErrors: [
            // Browser extensions
            'top.GLOBALS',
            // Random plugins/extensions
            'originalCreateNotification',
            'canvas.contentDocument',
            'MyApp_RemoveAllHighlights',
            // Network errors
            'NetworkError',
            'Failed to fetch',
        ],
    });

    console.log(`Sentry initialized for ${environment} environment`);
}

/**
 * Manually capture an exception
 */
export function captureException(error, context = {}) {
    Sentry.captureException(error, {
        extra: context,
    });
}

/**
 * Manually capture a message
 */
export function captureMessage(message, level = 'info', context = {}) {
    Sentry.captureMessage(message, {
        level,
        extra: context,
    });
}

/**
 * Set user context for error tracking
 */
export function setUser(user) {
    if (user) {
        Sentry.setUser({
            id: user.id,
            email: user.email,
        });
    } else {
        Sentry.setUser(null);
    }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message, category = 'custom', data = {}) {
    Sentry.addBreadcrumb({
        message,
        category,
        data,
        level: 'info',
    });
}
