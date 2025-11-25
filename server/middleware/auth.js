const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const requireAuth = async (req, res, next) => {
    // MOCK MODE BYPASS
    if (process.env.USE_MOCK === 'true') {
        const { MOCK_USER_ID } = require('../mockData');
        req.user = { id: MOCK_USER_ID, email: 'testuser@example.com' };
        return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('Auth error:', err);
        res.status(500).json({ error: 'Internal server error during auth' });
    }
};

module.exports = { requireAuth, supabase };
