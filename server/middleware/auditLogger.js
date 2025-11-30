const { supabaseAdmin } = require('./auth');

/**
 * Audit logger middleware
 * Logs important actions to the audit_logs table
 */
const auditLog = (action, resourceType) => {
    return async (req, res, next) => {
        // Skip in mock mode
        if (process.env.USE_MOCK === 'true') {
            return next();
        }

        const originalSend = res.send;

        res.send = function (data) {
            // Only log successful operations (2xx status codes)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                logAudit(req, action, resourceType, res.statusCode);
            }
            originalSend.call(this, data);
        };

        next();
    };
};

async function logAudit(req, action, resourceType, statusCode) {
    try {
        const userId = req.user?.id;
        const resourceId = req.params.id || req.body?.id || null;

        const logEntry = {
            user_id: userId,
            action: action, // 'CREATE', 'UPDATE', 'DELETE', 'VIEW'
            resource_type: resourceType, // 'person', 'tree', 'relationship', 'account'
            resource_id: resourceId,
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.get('user-agent'),
            status_code: statusCode,
            metadata: {
                method: req.method,
                path: req.path,
                body: sanitizeBody(req.body)
            }
        };

        await supabaseAdmin
            .from('audit_logs')
            .insert([logEntry]);

    } catch (error) {
        // Don't fail the request if audit logging fails
        console.error('Audit logging error:', error);
    }
}

// Remove sensitive data from body before logging
function sanitizeBody(body) {
    if (!body) return null;

    const sanitized = { ...body };

    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.access_token;
    delete sanitized.refresh_token;

    return sanitized;
}

module.exports = { auditLog };
