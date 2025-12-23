/**
 * Controller for handling client-side logs
 */
const logger = require('../utils/logger');
exports.createLog = async (req, res) => {
    try {
        const { type, data } = req.body;
        const timestamp = new Date().toISOString();

        // Format log message
        const logPrefix = `[CLIENT-${type?.toUpperCase() || 'LOG'}]`;

        if (type === 'error' || type === 'unhandled') {
            logger.error(`${logPrefix} ${data?.message || 'Unknown error'}`, {
                url: data?.url,
                user: data?.user?.email,
                stack: data?.stack,
                source: 'client'
            }, req);
        } else {
            logger.info(`${logPrefix} ${data?.message || 'Log received'}`, {
                url: data?.url,
                user: data?.user?.email,
                source: 'client'
            }, req);
        }

        // In a real app, you might save this to a database or monitoring service (Sentry, Datadog etc)
        // For now, valid JSON response is enough

        res.status(200).json({ received: true });
    } catch (error) {
        logger.error('Error processing client log:', error, req);
        res.status(500).json({ error: 'Failed to process log' });
    }
};
