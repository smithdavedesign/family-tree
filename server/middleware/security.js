const helmet = require('helmet');

/**
 * Security Middleware
 * Implements security headers, XSS prevention, and other security best practices
 */

/**
 * Configure security headers using Helmet
 * Protects against common web vulnerabilities
 */
function securityHeaders() {
    return helmet({
        // Content Security Policy
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                imgSrc: ["'self'", "data:", "https:", "blob:"],
                scriptSrc: ["'self'"],
                connectSrc: ["'self'", "https://*.supabase.co"],
                frameSrc: ["'none'"],
                objectSrc: ["'none'"],
            },
        },
        // Prevent clickjacking
        frameguard: {
            action: 'deny'
        },
        // Hide X-Powered-By header
        hidePoweredBy: true,
        // Strict Transport Security (HTTPS only)
        hsts: {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true
        },
        // Prevent MIME type sniffing
        noSniff: true,
        // XSS Protection
        xssFilter: true,
        // Referrer Policy
        referrerPolicy: {
            policy: 'strict-origin-when-cross-origin'
        }
    });
}

/**
 * Sanitize input to prevent XSS attacks
 * Note: This is a basic sanitizer. For production, consider using a library like DOMPurify
 */
function sanitizeInput(req, res, next) {
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    if (req.params) {
        req.params = sanitizeObject(req.params);
    }
    next();
}

/**
 * Recursively sanitize an object
 */
function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
}

/**
 * Sanitize a string to prevent XSS
 */
function sanitizeString(value) {
    if (typeof value !== 'string') {
        return value;
    }

    // Remove potentially dangerous characters
    return value
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * CSRF Protection Middleware
 * Validates origin and referer headers
 */
function csrfProtection(req, res, next) {
    // Skip CSRF for GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    const origin = req.get('origin');
    const referer = req.get('referer');
    const allowedOrigins = [
        process.env.CLIENT_URL || 'http://localhost:5173',
        'https://family-tree-blue-kappa.vercel.app'
    ];

    // Check if origin is allowed
    if (origin && !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
        return res.status(403).json({ error: 'CSRF validation failed' });
    }

    // Check referer as fallback
    if (!origin && referer && !allowedOrigins.some(allowed => referer.startsWith(allowed))) {
        return res.status(403).json({ error: 'CSRF validation failed' });
    }

    next();
}

/**
 * SQL Injection Prevention
 * Note: We use Supabase which has built-in SQL injection prevention
 * This middleware adds an extra layer of validation
 */
function sqlInjectionPrevention(req, res, next) {
    const suspiciousPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
        /(--|;|\/\*|\*\/|xp_|sp_)/gi,
        /(\bOR\b.*=.*)/gi,
        /(\bAND\b.*=.*)/gi,
    ];

    const checkValue = (value) => {
        if (typeof value === 'string') {
            for (const pattern of suspiciousPatterns) {
                if (pattern.test(value)) {
                    return true;
                }
            }
        }
        return false;
    };

    const checkObject = (obj) => {
        for (const value of Object.values(obj)) {
            if (typeof value === 'object' && value !== null) {
                if (checkObject(value)) return true;
            } else if (checkValue(value)) {
                return true;
            }
        }
        return false;
    };

    // Check body, query, and params
    if (
        (req.body && checkObject(req.body)) ||
        (req.query && checkObject(req.query)) ||
        (req.params && checkObject(req.params))
    ) {
        return res.status(400).json({ error: 'Invalid input detected' });
    }

    next();
}

module.exports = {
    securityHeaders,
    sanitizeInput,
    csrfProtection,
    sqlInjectionPrevention
};
