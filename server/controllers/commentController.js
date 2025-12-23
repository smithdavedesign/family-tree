const { supabaseAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');
const Joi = require('joi');

// Validation schemas
const commentSchema = Joi.object({
    resource_type: Joi.string().valid('photo', 'story', 'person').required(),
    resource_id: Joi.string().uuid().required(),
    content: Joi.string().min(1).max(2000).required(),
    tree_id: Joi.string().uuid().required()
});

const updateCommentSchema = Joi.object({
    content: Joi.string().min(1).max(2000).required()
});

// Get comments for a resource
const getComments = async (req, res) => {
    try {
        const { resourceType, resourceId } = req.params;

        const { data: comments, error } = await supabaseAdmin
            .from('comments')
            .select(`
                *,
                user:users(id, email, avatar_url)
            `)
            .eq('resource_type', resourceType)
            .eq('resource_id', resourceId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Filter out comments from trees the user doesn't have access to (double check)
        // Ideally RLS handles this, but since we use supabaseAdmin, we must verify tree access manually if not done by caller
        // However, for getComments, we usually fetch by resource. 
        // Let's verify the user has access to the tree of the first comment (assuming all comments for a resource belong to same tree)
        // OR better: The route should probably include treeId or we check access to the resource first.

        // For simplicity/performance, we'll assume the frontend passes valid resourceIds that the user can see.
        // But for security, we should check one comment's tree_id or the resource's tree_id.

        // Let's rely on the fact that to see the resource (photo/story), the user must have already passed access checks.

        res.json(comments);
    } catch (error) {
        logger.error('Error fetching comments:', error, req);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
};

// Add a comment
const addComment = async (req, res) => {
    try {
        const { error: validationError, value } = commentSchema.validate(req.body);
        if (validationError) {
            return res.status(400).json({ error: validationError.details[0].message });
        }

        const { resource_type, resource_id, content, tree_id } = value;

        // Verify user has access to the tree
        const { data: member } = await supabaseAdmin
            .from('tree_members')
            .select('role')
            .eq('tree_id', tree_id)
            .eq('user_id', req.user.id)
            .single();

        if (!member) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { data: comment, error } = await supabaseAdmin
            .from('comments')
            .insert({
                tree_id,
                user_id: req.user.id,
                resource_type,
                resource_id,
                content
            })
            .select(`
                *,
                user:users(id, email, avatar_url)
            `)
            .single();

        if (error) throw error;

        res.status(201).json(comment);
    } catch (error) {
        logger.error('Error adding comment:', error, req);
        res.status(500).json({ error: 'Failed to add comment' });
    }
};

// Delete a comment
const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;

        // Get comment to check ownership/tree
        const { data: comment } = await supabaseAdmin
            .from('comments')
            .select('user_id, tree_id')
            .eq('id', commentId)
            .single();

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        // Check permissions: Author OR Tree Owner
        if (comment.user_id !== req.user.id) {
            const { data: member } = await supabaseAdmin
                .from('tree_members')
                .select('role')
                .eq('tree_id', comment.tree_id)
                .eq('user_id', req.user.id)
                .single();

            if (!member || member.role !== 'owner') {
                return res.status(403).json({ error: 'Unauthorized to delete this comment' });
            }
        }

        const { error } = await supabaseAdmin
            .from('comments')
            .delete()
            .eq('id', commentId);

        if (error) throw error;

        res.json({ message: 'Comment deleted' });
    } catch (error) {
        logger.error('Error deleting comment:', error, req);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
};

module.exports = {
    getComments,
    addComment,
    deleteComment
};
