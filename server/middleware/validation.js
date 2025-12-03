/**
 * Validation middleware factory
 * Returns a middleware function that validates request body against a Joi schema
 */
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false, // Return all errors, not just the first one
            stripUnknown: true // Remove unknown fields
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            // Log validation errors for debugging
            console.error('Validation failed:', {
                endpoint: req.path,
                method: req.method,
                body: req.body,
                errors
            });

            return res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
        }

        // Replace body with validated value (with defaults applied)
        req.body = value;
        next();
    };
};

module.exports = { validate };
