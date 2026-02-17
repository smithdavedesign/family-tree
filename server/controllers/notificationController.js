const { supabaseAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * Get user's notification preferences
 * GET /api/notifications/preferences
 */
exports.getPreferences = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabaseAdmin
            .from('notification_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            // If no preferences exist, create defaults
            if (error.code === 'PGRST116') {
                const { data: newPrefs, error: insertError } = await supabaseAdmin
                    .from('notification_preferences')
                    .insert({ user_id: userId })
                    .select()
                    .single();

                if (insertError) throw insertError;
                return res.json(newPrefs);
            }
            throw error;
        }

        res.json(data);
    } catch (error) {
        logger.error('Failed to fetch notification preferences', error, req);
        res.status(500).json({ error: 'Failed to fetch preferences' });
    }
};

/**
 * Update user's notification preferences
 * PUT /api/notifications/preferences
 */
exports.updatePreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            email_on_comment,
            email_on_story,
            email_on_album,
            email_on_person,
            email_on_invite,
            digest_frequency
        } = req.body;

        // Validate digest_frequency
        const validFrequencies = ['instant', 'daily', 'weekly', 'never'];
        if (digest_frequency && !validFrequencies.includes(digest_frequency)) {
            return res.status(400).json({ error: 'Invalid digest frequency' });
        }

        const { data, error } = await supabaseAdmin
            .from('notification_preferences')
            .upsert({
                user_id: userId,
                email_on_comment,
                email_on_story,
                email_on_album,
                email_on_person,
                email_on_invite,
                digest_frequency,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            })
            .select()
            .single();

        if (error) throw error;

        logger.info('Notification preferences updated', { userId });
        res.json(data);
    } catch (error) {
        logger.error('Failed to update notification preferences', error, req);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
};

/**
 * Get user's notification history
 * GET /api/notifications/history
 */
exports.getHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const { data, error, count } = await supabaseAdmin
            .from('notification_logs')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('sent_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.json({
            notifications: data,
            total: count,
            limit,
            offset
        });
    } catch (error) {
        logger.error('Failed to fetch notification history', error, req);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
};
