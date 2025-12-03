const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initSentry, sentryErrorHandler } = require('./utils/sentry');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Sentry (must be before other middleware)
initSentry(app);

// Trust proxy for rate limiting behind load balancers (Render/Vercel)
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Health check
app.get('/', (req, res) => {
    res.send('Family Tree API is running');
});

// Sentry error handler (must be after routes)
app.use(sentryErrorHandler());

// General error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
