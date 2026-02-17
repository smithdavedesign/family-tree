const { Resend } = require('resend');
const logger = require('../utils/logger');
const { supabaseAdmin } = require('../middleware/auth');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Email Service using Resend
 * Industry-standard email delivery with React Email templating
 */

/**
 * Check if user has opted in for a specific notification type
 */
async function checkNotificationPreference(userId, eventType) {
    try {
        const { data, error } = await supabaseAdmin
            .from('notification_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            // If no preferences exist, create default (all enabled)
            if (error.code === 'PGRST116') {
                await supabaseAdmin
                    .from('notification_preferences')
                    .insert({ user_id: userId });
                return true; // Default to enabled
            }
            throw error;
        }

        // Check the specific preference
        const prefKey = `email_on_${eventType}`;
        return data[prefKey] !== false && data.digest_frequency !== 'never';
    } catch (error) {
        logger.error('Error checking notification preference', error);
        return false; // Default to not sending if error
    }
}

/**
 * Log notification to audit trail
 */
async function logNotification(userId, eventType, treeId, subject, status, errorMessage = null) {
    try {
        await supabaseAdmin
            .from('notification_logs')
            .insert({
                user_id: userId,
                event_type: eventType,
                tree_id: treeId,
                email_subject: subject,
                email_status: status,
                error_message: errorMessage
            });
    } catch (error) {
        logger.error('Error logging notification', error);
    }
}

/**
 * Send a notification email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML content (from React Email)
 * @param {string} userId - User ID for logging
 * @param {string} eventType - Type of event
 * @param {string} treeId - Associated tree ID
 */
async function sendEmail(to, subject, html, userId, eventType, treeId) {
    try {
        const { data, error } = await resend.emails.send({
            from: process.env.NOTIFICATION_FROM_EMAIL || 'notifications@familytree-e.com',
            to,
            subject,
            html,
            headers: {
                'X-Entity-Ref-ID': `${eventType}-${Date.now()}`,
            }
        });

        if (error) {
            logger.error('Resend email error', error);
            await logNotification(userId, eventType, treeId, subject, 'failed', error.message);
            return { success: false, error };
        }

        logger.info('Email sent successfully', { to, subject, messageId: data.id });
        await logNotification(userId, eventType, treeId, subject, 'sent');
        return { success: true, data };
    } catch (error) {
        logger.error('Email service error', error);
        await logNotification(userId, eventType, treeId, subject, 'failed', error.message);
        return { success: false, error };
    }
}

/**
 * Queue a notification (checks preferences first)
 * @param {string} userId - User to notify
 * @param {string} eventType - Type of event (comment, story, album, person, invite)
 * @param {object} payload - Event data
 */
async function queueNotification(userId, eventType, payload) {
    try {
        // Check if user wants this notification
        const shouldSend = await checkNotificationPreference(userId, eventType);
        if (!shouldSend) {
            logger.debug('Notification skipped due to user preference', { userId, eventType });
            return { success: false, reason: 'user_preference' };
        }

        // Get user email
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('email')
            .eq('id', userId)
            .single();

        if (userError || !user?.email) {
            logger.error('User not found for notification', { userId, error: userError });
            return { success: false, reason: 'user_not_found' };
        }

        // Generate email content based on event type
        const { subject, html } = await generateEmailContent(eventType, payload, user);

        // Send the email
        return await sendEmail(
            user.email,
            subject,
            html,
            userId,
            eventType,
            payload.treeId
        );
    } catch (error) {
        logger.error('Error queueing notification', error);
        return { success: false, error };
    }
}

/**
 * Generate email content based on event type
 * TODO: Replace with React Email templates
 */
async function generateEmailContent(eventType, payload, user) {
    const { actorName, itemTitle, treeId, treeName } = payload;

    // Use email as fallback for greeting
    const userName = user.email?.split('@')[0] || 'there';

    const templates = {
        comment: {
            subject: `${actorName} commented on "${itemTitle}"`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>New Comment</h2>
                    <p>Hi ${userName},</p>
                    <p><strong>${actorName}</strong> left a comment on <strong>${itemTitle}</strong> in the ${treeName} family tree.</p>
                    <a href="${process.env.CLIENT_URL}/tree/${treeId}" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">View Comment</a>
                    <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;">
                    <p style="color: #64748b; font-size: 12px;">
                        Don't want these emails? <a href="${process.env.CLIENT_URL}/settings">Manage your notification preferences</a>
                    </p>
                </div>
            `
        },
        story: {
            subject: `New story added: "${itemTitle}"`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>New Story</h2>
                    <p>Hi ${userName},</p>
                    <p><strong>${actorName}</strong> added a new story to the ${treeName} family tree:</p>
                    <h3 style="color: #0ea5e9;">${itemTitle}</h3>
                    <a href="${process.env.CLIENT_URL}/story/${payload.storyId}" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">Read Story</a>
                    <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;">
                    <p style="color: #64748b; font-size: 12px;">
                        Don't want these emails? <a href="${process.env.CLIENT_URL}/settings">Manage your notification preferences</a>
                    </p>
                </div>
            `
        },
        album: {
            subject: `New photo album: "${itemTitle}"`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>New Photo Album</h2>
                    <p>Hi ${userName},</p>
                    <p><strong>${actorName}</strong> created a new photo album in the ${treeName} family tree:</p>
                    <h3 style="color: #0ea5e9;">${itemTitle}</h3>
                    <a href="${process.env.CLIENT_URL}/album/${payload.albumId}" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">View Album</a>
                    <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;">
                    <p style="color: #64748b; font-size: 12px;">
                        Don't want these emails? <a href="${process.env.CLIENT_URL}/settings">Manage your notification preferences</a>
                    </p>
                </div>
            `
        },
        person: {
            subject: `New person added: ${itemTitle}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>New Family Member</h2>
                    <p>Hi ${userName},</p>
                    <p><strong>${actorName}</strong> added <strong>${itemTitle}</strong> to the ${treeName} family tree.</p>
                    <a href="${process.env.CLIENT_URL}/tree/${treeId}?personId=${payload.personId}" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">View Profile</a>
                    <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;">
                    <p style="color: #64748b; font-size: 12px;">
                        Don't want these emails? <a href="${process.env.CLIENT_URL}/settings">Manage your notification preferences</a>
                    </p>
                </div>
            `
        },
        invite: {
            subject: `You've been invited to collaborate on ${treeName}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Tree Collaboration Invite</h2>
                    <p>Hi ${userName},</p>
                    <p><strong>${actorName}</strong> has invited you to collaborate on the <strong>${treeName}</strong> family tree.</p>
                    <a href="${process.env.CLIENT_URL}/invite/${payload.inviteToken}" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">Accept Invitation</a>
                    <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;">
                    <p style="color: #64748b; font-size: 12px;">
                        This invitation is personal to you. Please don't forward it.
                    </p>
                </div>
            `
        }
    };

    return templates[eventType] || templates.comment;
}

module.exports = {
    sendEmail,
    queueNotification,
    checkNotificationPreference,
    logNotification
};
