/**
 * Controller for handling client-side logs
 */
exports.createLog = async (req, res) => {
    try {
        const { type, data } = req.body;
        const timestamp = new Date().toISOString();

        // Format log message
        const logPrefix = `[CLIENT-${type?.toUpperCase() || 'LOG'}]`;

        if (type === 'error' || type === 'unhandled') {
            console.error(`${logPrefix} ${data?.message || 'Unknown error'}`, {
                url: data?.url,
                user: data?.user?.email,
                stack: data?.stack
            });
        } else {
            console.log(`${logPrefix} ${data?.message || 'Log received'}`, {
                url: data?.url,
                user: data?.user?.email
            });
        }

        // In a real app, you might save this to a database or monitoring service (Sentry, Datadog etc)
        // For now, valid JSON response is enough

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Error processing client log:', error);
        res.status(500).json({ error: 'Failed to process log' });
    }
};
