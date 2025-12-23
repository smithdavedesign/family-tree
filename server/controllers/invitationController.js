const { supabase, supabaseAdmin } = require('../middleware/auth');
const { ROLES } = require('../middleware/rbac');
const logger = require('../utils/logger');
const crypto = require('crypto');

// Generate a random 8-character token
const generateToken = () => {
    return crypto.randomBytes(4).toString('hex');
};

/**
 * Create an invitation link for a tree
 */
exports.createInvitation = async (req, res) => {
    try {
        const { treeId } = req.params;
        const { role, email } = req.body; // Accept email
        const userId = req.user.id;

        if (![ROLES.EDITOR, ROLES.VIEWER].includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be editor or viewer.' });
        }

        const token = generateToken();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiry

        // Create invitation record
        const { data: invitation, error } = await supabaseAdmin
            .from('invitations')
            .insert([{
                tree_id: treeId,
                inviter_id: userId,
                role: role,
                token: token,
                email: email || null, // Store email if provided
                expires_at: expiresAt
            }])
            .select()
            .single();

        if (error) throw error;

        // If email provided, send invite via Supabase Auth
        if (email) {
            // Check if user exists (by trying to get user by email, or just blindly inviting)
            // Ideally we use admin.inviteUserByEmail for new users or signInWithOtp for existing.
            // But we don't know if they exist easily without admin rights to list users (which we have).

            // Strategy: Try to invite as new user. If it fails saying user exists, send magic link.
            // Actually, cleaner is to just generate the link here and send our own email? 
            // BUT the plan says "Use Supabase Auth to send the invite emails".

            // However, Supabase's inviteUserByEmail sends a signup confirmation link.
            // We want them to land on OUR accept page.
            // redirect_to should be set to our accept page.

            const redirectTo = `${process.env.CLIENT_URL || 'http://localhost:5173'}/invite/${token}`;

            // Try to invite as new user
            const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
                redirectTo: redirectTo
            });

            if (inviteError) {
                // If user already exists, Supabase might return an error or just send a magic link?
                // inviteUserByEmail usually returns error if user is registered.
                if (inviteError.message?.includes('already has been registered') || inviteError.status === 422) {
                    logger.info(`User ${email} exists, sending magic link instead.`, { email }, req);
                    // Send magic link (SignInWithOtp)
                    const { error: otpError } = await supabaseAdmin.auth.signInWithOtp({
                        email: email,
                        options: {
                            emailRedirectTo: redirectTo
                        }
                    });
                    if (otpError) {
                        logger.error('Error sending magic link for invite:', otpError, req);
                        // Don't fail the whole request, return warning?
                    } else {
                        logger.info('Magic link sent successfully via signInWithOtp', { email }, req);
                    }
                } else {
                    logger.error('Error inviting user:', inviteError, req);
                    // Proceed but log error
                }
            }
        }

        res.status(201).json({
            message: 'Invitation created',
            invitation: invitation,
            link: `/invite/${token}`
        });

    } catch (error) {
        logger.error('Error creating invitation:', error, req);
        res.status(500).json({ error: 'Failed to create invitation' });
    }
};

/**
 * Get invitation details by token (public endpoint)
 */
exports.getInvitation = async (req, res) => {
    try {
        const { token } = req.params;

        const { data: invitation, error } = await supabaseAdmin
            .from('invitations')
            .select(`
                *,
                trees (name, owner_id)
            `)
            .eq('token', token)
            .eq('is_active', true)
            .single();

        if (error || !invitation) {
            return res.status(404).json({ error: 'Invitation not found or expired' });
        }

        // Check expiry
        if (new Date(invitation.expires_at) < new Date()) {
            return res.status(410).json({ error: 'Invitation expired' });
        }

        res.json({ invitation });

    } catch (error) {
        logger.error('Error fetching invitation:', error, req);
        res.status(500).json({ error: 'Failed to fetch invitation' });
    }
};

/**
 * Accept an invitation
 */
exports.acceptInvitation = async (req, res) => {
    try {
        const { token } = req.params;
        const userId = req.user.id;

        logger.info('Accept invitation called', { token, userId }, req);

        // 1. Get invitation
        const { data: invitation, error: inviteError } = await supabaseAdmin
            .from('invitations')
            .select('*')
            .eq('token', token)
            .eq('is_active', true)
            .single();

        logger.info('Invitation lookup result:', { invitation: !!invitation, inviteError: !!inviteError }, req);

        if (inviteError || !invitation) {
            logger.warn('Returning 404 - invitation not found', {}, req);
            return res.status(404).json({ error: 'Invitation not found or expired' });
        }

        // 2. Check if already a member
        const { data: existingMember } = await supabaseAdmin
            .from('tree_members')
            .select('*')
            .eq('tree_id', invitation.tree_id)
            .eq('user_id', userId)
            .single();

        logger.info('Existing member check:', { existingMember: !!existingMember }, req);

        if (existingMember) {
            logger.warn('Returning 400 - already a member', {}, req);
            return res.status(400).json({ error: 'You are already a member of this tree' });
        }

        // 3. Ensure user exists in public.users before adding to tree_members
        const { error: userError } = await supabaseAdmin
            .from('users')
            .upsert({
                id: userId,
                email: req.user.email,
            }, { onConflict: 'id', ignoreDuplicates: true });

        if (userError) {
            logger.error('Error ensuring user exists in public.users:', userError, req);
            return res.status(500).json({ error: 'Failed to process invitation' });
        }

        // 4. Add to tree_members
        const { error: memberError } = await supabaseAdmin
            .from('tree_members')
            .insert([{
                tree_id: invitation.tree_id,
                user_id: userId,
                role: invitation.role
            }]);

        if (memberError) throw memberError;

        // Small delay to ensure database propagation (especially for distributed DBs)
        await new Promise(resolve => setTimeout(resolve, 100));

        // 4. Mark invitation as used (optional: keep active for multiple uses? For now, let's keep it active)
        // If we wanted one-time use:
        // await supabaseAdmin.from('invitations').update({ is_active: false, used_at: new Date(), used_by: userId }).eq('id', invitation.id);

        res.json({ message: 'Invitation accepted', treeId: invitation.tree_id });

    } catch (error) {
        logger.error('Error accepting invitation:', error, req);
        res.status(500).json({ error: 'Failed to accept invitation' });
    }
};

/**
 * List members of a tree
 */
exports.getTreeMembers = async (req, res) => {
    try {
        const { treeId } = req.params;

        logger.info('Fetching members for tree:', { treeId }, req);

        const { data: members, error } = await supabaseAdmin
            .from('tree_members')
            .select(`
                role,
                users (id, email)
            `)
            .eq('tree_id', treeId);

        logger.info('Members query result:', { count: members?.length || 0, error: !!error }, req);

        if (error) {
            logger.error('Error fetching members:', error, req);
            throw error;
        }

        res.json({ members });

    } catch (error) {
        logger.error('Error fetching members:', error, req);
        res.status(500).json({ error: 'Failed to fetch members' });
    }
};

/**
 * Remove a member from a tree
 */
exports.removeMember = async (req, res) => {
    try {
        const { treeId, userId } = req.params;

        // Prevent removing self (owner leaving tree logic is different)
        if (userId === req.user.id) {
            return res.status(400).json({ error: 'Cannot remove yourself. Use leave endpoint.' });
        }

        const { error } = await supabaseAdmin
            .from('tree_members')
            .delete()
            .eq('tree_id', treeId)
            .eq('user_id', userId);

        if (error) throw error;

        res.json({ message: 'Member removed' });

    } catch (error) {
        logger.error('Error removing member:', error, req);
        res.status(500).json({ error: 'Failed to remove member' });
    }
};

/**
 * Update member role
 */
exports.updateMemberRole = async (req, res) => {
    try {
        const { treeId, userId } = req.params;
        const { role } = req.body;

        if (![ROLES.EDITOR, ROLES.VIEWER].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const { error } = await supabaseAdmin
            .from('tree_members')
            .update({ role })
            .eq('tree_id', treeId)
            .eq('user_id', userId);

        if (error) throw error;

        res.json({ message: 'Member role updated' });

    } catch (error) {
        logger.error('Error updating member role:', error, req);
        res.status(500).json({ error: 'Failed to update member role' });
    }
};
