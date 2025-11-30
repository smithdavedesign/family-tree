const { supabase, supabaseAdmin } = require('../middleware/auth');
const { ROLES } = require('../middleware/rbac');
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
        const { role } = req.body;
        const userId = req.user.id;

        if (![ROLES.EDITOR, ROLES.VIEWER].includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be editor or viewer.' });
        }

        const token = generateToken();

        // Create invitation record
        const { data, error } = await supabaseAdmin
            .from('invitations')
            .insert([{
                tree_id: treeId,
                inviter_id: userId,
                role: role,
                token: token,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiry
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            message: 'Invitation created',
            invitation: data,
            link: `/invite/${token}`
        });

    } catch (error) {
        console.error('Error creating invitation:', error);
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
                trees (name, owner_id),
                users:inviter_id (email, user_metadata)
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
        console.error('Error fetching invitation:', error);
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

        // 1. Get invitation
        const { data: invitation, error: inviteError } = await supabaseAdmin
            .from('invitations')
            .select('*')
            .eq('token', token)
            .eq('is_active', true)
            .single();

        if (inviteError || !invitation) {
            return res.status(404).json({ error: 'Invitation not found or expired' });
        }

        // 2. Check if already a member
        const { data: existingMember } = await supabaseAdmin
            .from('tree_members')
            .select('*')
            .eq('tree_id', invitation.tree_id)
            .eq('user_id', userId)
            .single();

        if (existingMember) {
            return res.status(400).json({ error: 'You are already a member of this tree' });
        }

        // 3. Add to tree_members
        const { error: memberError } = await supabaseAdmin
            .from('tree_members')
            .insert([{
                tree_id: invitation.tree_id,
                user_id: userId,
                role: invitation.role
            }]);

        if (memberError) throw memberError;

        // 4. Mark invitation as used (optional: keep active for multiple uses? For now, let's keep it active)
        // If we wanted one-time use:
        // await supabaseAdmin.from('invitations').update({ is_active: false, used_at: new Date(), used_by: userId }).eq('id', invitation.id);

        res.json({ message: 'Invitation accepted', treeId: invitation.tree_id });

    } catch (error) {
        console.error('Error accepting invitation:', error);
        res.status(500).json({ error: 'Failed to accept invitation' });
    }
};

/**
 * List members of a tree
 */
exports.getTreeMembers = async (req, res) => {
    try {
        const { treeId } = req.params;

        const { data: members, error } = await supabaseAdmin
            .from('tree_members')
            .select(`
                role,
                created_at,
                users (id, email, user_metadata)
            `)
            .eq('tree_id', treeId);

        if (error) throw error;

        res.json({ members });

    } catch (error) {
        console.error('Error fetching members:', error);
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
        console.error('Error removing member:', error);
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
        console.error('Error updating member role:', error);
        res.status(500).json({ error: 'Failed to update member role' });
    }
};
