const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initErrorLogging, errorHandler } = require('./utils/errorLogger');
const logger = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');
const storageService = require('./services/storageService');
const {
    securityHeaders,
    sanitizeInput,
    csrfProtection,
    sqlInjectionPrevention
} = require('./middleware/security');

const app = express();
const port = process.env.PORT || 3000;

// Initialize error logging (must be before other middleware)
initErrorLogging(app);

// Trust proxy for rate limiting behind load balancers (Render/Vercel)
app.set('trust proxy', 1);

// Security middleware (must be early in the chain)
app.use(securityHeaders());
app.use(sanitizeInput);
app.use(sqlInjectionPrevention);
app.use(csrfProtection);

// Request logging middleware
app.use(requestLogger);

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:4173',
            'https://familytree-e.com',
            'https://www.familytree-e.com',
            process.env.CLIENT_URL,
            // Allow Vercel preview deployments
            /^https:\/\/family-tree-.*\.vercel\.app$/
        ];

        // Check if origin matches any allowed origin (string or regex)
        const isAllowed = allowedOrigins.some(allowed => {
            if (allowed instanceof RegExp) return allowed.test(origin);
            return allowed === origin;
        });

        if (isAllowed) {
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
// Webhook route must be before express.json() to handle raw body
const webhookController = require('./controllers/webhookController');
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), webhookController.handleStripeWebhook);

app.use(express.json({ limit: '50mb' }));

// Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Health check
app.get('/', (req, res) => {
    res.send('Family Tree API is running');
});

// Error handler (must be after routes)
app.use(errorHandler());

// General error handler
app.use((err, req, res, next) => {
    logger.error('Unhandled error', err, {
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        userId: req.user?.id,
    });

    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});

// Help debug immediate crashes
process.on('exit', (code) => {
    console.log(`Process exited with code: ${code}`);
    logger.info(`Process exited with code: ${code}`);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    logger.error('Unhandled Rejection', { reason });
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
    process.exit(1);
});

app.listen(port, () => {
    logger.info(`Server running on port ${port}`, {
        environment: process.env.NODE_ENV || 'development',
        port,
    });

    // Initialize storage buckets (non-blocking)
    storageService.initializeBucket('photos').then(() => {
        logger.info('Storage initialization complete');
    }).catch(err => {
        logger.error('Storage initialization failed', err);
    });

    // Keep event loop alive if something is acting weird
    setInterval(() => {
        logger.debug('Server heartbeat...');
    }, 60000);
});
