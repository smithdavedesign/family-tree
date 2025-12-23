const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initErrorLogging, errorHandler } = require('./utils/errorLogger');
const logger = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');
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
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
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

app.listen(port, () => {
    logger.info(`Server running on port ${port}`, {
        environment: process.env.NODE_ENV || 'development',
        port,
    });
});
