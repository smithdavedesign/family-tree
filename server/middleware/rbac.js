const { supabase, supabaseAdmin } = require('./auth');

/**
 * Role-Based Access Control Middleware
 * Checks if user has required permission level for tree operations
 */

// Permission levels (in order of access)
const ROLES = {
    OWNER: 'owner',
    EDITOR: 'editor',
    VIEWER: 'viewer'
};

// Role hierarchy - higher roles include lower role permissions
const ROLE_HIERARCHY = {
    owner: 3,
    editor: 2,
    viewer: 1
};

/**
 * Check if user has required role for a tree
 * @param {string} requiredRole - Minimum required role (owner, editor, viewer)
 */
/**
 * Check if user has required role for a tree
 * @param {string} requiredRole - Minimum required role (owner, editor, viewer)
 * @param {object} options - Options for ID resolution
 * @param {string} options.lookupFromTable - Table to lookup tree_id from if id param is provided (e.g. 'persons', 'relationships')
 */
const requireTreeRole = (requiredRole, options = {}) => {
    return async (req, res, next) => {
        // Skip in mock mode
        if (process.env.USE_MOCK === 'true') {
            return next();
        }

        try {
            const userId = req.user?.id;
            let treeId = req.params.treeId || req.body?.tree_id;

            // If no explicit treeId, try to resolve from :id param
            if (!treeId && req.params.id) {
                if (options.lookupFromTable) {
                    // Resolve tree_id from the entity (person, relationship, etc.)
                    const { data, error } = await supabaseAdmin
                        .from(options.lookupFromTable)
                        .select('tree_id')
                        .eq('id', req.params.id)
                        .single();

                    if (error || !data) {
                        return res.status(404).json({ error: 'Entity not found' });
                    }
                    treeId = data.tree_id;
                } else {
                    // Default: :id is the treeId
                    treeId = req.params.id;
                }
            }

            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            if (!treeId) {
                return res.status(400).json({ error: 'Tree ID required' });
            }

            // Check user's role in this tree
            const { data: membership, error } = await supabaseAdmin
                .from('tree_members')
                .select('role')
                .eq('tree_id', treeId)
                .eq('user_id', userId)
                .single();

            if (error || !membership) {
                // Fallback: Check if user is the owner in 'trees' table
                // This handles cases where the owner wasn't added to tree_members (legacy/bug)
                const { data: tree, error: treeError } = await supabaseAdmin
                    .from('trees')
                    .select('owner_id')
                    .eq('id', treeId)
                    .single();

                if (!treeError && tree && tree.owner_id === userId) {
                    // User is owner.

                    // Auto-fix: Ensure user exists in public.users first
                    // This is required because tree_members references public.users
                    const { error: userError } = await supabaseAdmin
                        .from('users')
                        .upsert({
                            id: userId,
                            email: req.user.email,
                            // We can add other fields if available in req.user.user_metadata
                        }, { onConflict: 'id', ignoreDuplicates: true });

                    if (userError) {
                        console.error('Error ensuring user exists in public.users:', userError);
                    }

                    // Auto-fix: Add to tree_members
                    // We don't await this to avoid slowing down the request
                    supabaseAdmin.from('tree_members').insert({
                        tree_id: treeId,
                        user_id: userId,
                        role: ROLES.OWNER
                    }).then(({ error }) => {
                        if (error) console.error('Error auto-fixing tree membership:', error);
                    });

                    req.userRole = ROLES.OWNER;
                    req.treeId = treeId;
                    return next();
                }

                return res.status(403).json({
                    error: 'Access denied',
                    message: 'You do not have access to this tree'
                });
            }

            const userRole = membership.role;
            const requiredLevel = ROLE_HIERARCHY[requiredRole];
            const userLevel = ROLE_HIERARCHY[userRole];

            if (userLevel < requiredLevel) {
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    message: `This action requires ${requiredRole} role. You have ${userRole} role.`,
                    required: requiredRole,
                    current: userRole
                });
            }

            // Attach user's role to request for later use
            req.userRole = userRole;
            req.treeId = treeId;

            next();
        } catch (err) {
            console.error('RBAC error:', err);
            res.status(500).json({ error: 'Error checking permissions' });
        }
    };
};

/**
 * Check if user is tree owner
 */
const requireOwner = requireTreeRole(ROLES.OWNER);

/**
 * Check if user can edit (owner or editor)
 */
const requireEditor = requireTreeRole(ROLES.EDITOR);

/**
 * Check if user can view (any role)
 */
const requireViewer = requireTreeRole(ROLES.VIEWER);

// Person-specific middlewares
const requirePersonEditor = requireTreeRole(ROLES.EDITOR, { lookupFromTable: 'persons' });
const requirePersonViewer = requireTreeRole(ROLES.VIEWER, { lookupFromTable: 'persons' });

// Relationship-specific middlewares
const requireRelationshipEditor = requireTreeRole(ROLES.EDITOR, { lookupFromTable: 'relationships' });

// Photo-specific middlewares
const requirePhotoRole = (requiredRole) => {
    return async (req, res, next) => {
        if (process.env.USE_MOCK === 'true') return next();

        const photoId = req.params.id;
        if (!photoId) return res.status(400).json({ error: 'Photo ID required' });

        try {
            // Lookup tree_id via person
            const { data: photo, error } = await supabaseAdmin
                .from('photos')
                .select('person_id, persons!inner(tree_id)')
                .eq('id', photoId)
                .single();

            if (error || !photo || !photo.persons) {
                return res.status(404).json({ error: 'Photo not found' });
            }

            // Set treeId for the generic checker
            req.params.treeId = photo.persons.tree_id;

            // Delegate to generic checker
            return requireTreeRole(requiredRole)(req, res, next);
        } catch (err) {
            console.error('RBAC Photo lookup error:', err);
            return res.status(500).json({ error: 'Error checking permissions' });
        }
    };
};

const requirePhotoEditor = requirePhotoRole(ROLES.EDITOR);
const requirePhotoViewer = requirePhotoRole(ROLES.VIEWER);

// Middleware for creating a photo (checks person_id in body)
const requirePersonEditorBody = async (req, res, next) => {
    if (process.env.USE_MOCK === 'true') return next();

    const personId = req.body.person_id;
    if (!personId) return res.status(400).json({ error: 'Person ID required' });

    try {
        const { data: person, error } = await supabaseAdmin
            .from('persons')
            .select('tree_id')
            .eq('id', personId)
            .single();

        if (error || !person) {
            return res.status(404).json({ error: 'Person not found' });
        }

        req.params.treeId = person.tree_id;
        return requireTreeRole(ROLES.EDITOR)(req, res, next);
    } catch (err) {
        console.error('RBAC Person Body lookup error:', err);
        return res.status(500).json({ error: 'Error checking permissions' });
    }
};

/**
 * Helper function to check if user owns a tree (for use in controllers)
 */
async function isTreeOwner(userId, treeId) {
    const { data, error } = await supabaseAdmin
        .from('tree_members')
        .select('role')
        .eq('tree_id', treeId)
        .eq('user_id', userId)
        .single();

    return !error && data?.role === ROLES.OWNER;
}

/**
 * Helper function to get user's role in a tree
 */
async function getUserTreeRole(userId, treeId) {
    const { data, error } = await supabaseAdmin
        .from('tree_members')
        .select('role')
        .eq('tree_id', treeId)
        .eq('user_id', userId)
        .single();

    return error ? null : data?.role;
}

// Document-specific middlewares
const requireDocumentRole = (requiredRole) => {
    return async (req, res, next) => {
        if (process.env.USE_MOCK === 'true') return next();

        const documentId = req.params.id;
        if (!documentId) return res.status(400).json({ error: 'Document ID required' });

        try {
            // Lookup tree_id via person
            const { data: doc, error } = await supabaseAdmin
                .from('documents')
                .select('person_id, persons!inner(tree_id)')
                .eq('id', documentId)
                .single();

            if (error || !doc || !doc.persons) {
                return res.status(404).json({ error: 'Document not found' });
            }

            // Set treeId for the generic checker
            req.params.treeId = doc.persons.tree_id;

            // Delegate to generic checker
            return requireTreeRole(requiredRole)(req, res, next);
        } catch (err) {
            console.error('RBAC Document lookup error:', err);
            return res.status(500).json({ error: 'Error checking permissions' });
        }
    };
};

const requireDocumentEditor = requireDocumentRole(ROLES.EDITOR);
const requireDocumentViewer = requireDocumentRole(ROLES.VIEWER);

// Life Event-specific middlewares
const requireEventRole = (requiredRole) => {
    return async (req, res, next) => {
        if (process.env.USE_MOCK === 'true') return next();

        const eventId = req.params.id;
        if (!eventId) return res.status(400).json({ error: 'Event ID required' });

        try {
            // Lookup tree_id via person
            const { data: event, error } = await supabaseAdmin
                .from('life_events')
                .select('person_id, persons!inner(tree_id)')
                .eq('id', eventId)
                .single();

            if (error || !event || !event.persons) {
                return res.status(404).json({ error: 'Event not found' });
            }

            // Set treeId for the generic checker
            req.params.treeId = event.persons.tree_id;

            // Delegate to generic checker
            return requireTreeRole(requiredRole)(req, res, next);
        } catch (err) {
            console.error('RBAC Event lookup error:', err);
            return res.status(500).json({ error: 'Error checking permissions' });
        }
    };
};

const requireEventEditor = requireEventRole(ROLES.EDITOR);

// Story-specific middlewares
const requireStoryRole = (requiredRole) => {
    return async (req, res, next) => {
        if (process.env.USE_MOCK === 'true') return next();

        const storyId = req.params.id;
        if (!storyId) return res.status(400).json({ error: 'Story ID required' });

        try {
            // Lookup tree_id from story
            const { data: story, error } = await supabaseAdmin
                .from('stories')
                .select('tree_id')
                .eq('id', storyId)
                .single();

            if (error || !story) {
                return res.status(404).json({ error: 'Story not found' });
            }

            // Set treeId for the generic checker
            req.params.treeId = story.tree_id;

            // Delegate to generic checker
            return requireTreeRole(requiredRole)(req, res, next);
        } catch (err) {
            console.error('RBAC Story lookup error:', err);
            return res.status(500).json({ error: 'Error checking permissions' });
        }
    };
};

const requireStoryEditor = requireStoryRole(ROLES.EDITOR);
const requireTreeEditor = requireTreeRole(ROLES.EDITOR);

module.exports = {
    requireOwner,
    requireEditor,
    requireViewer,
    requirePersonEditor,
    requirePersonViewer,
    requireRelationshipEditor,
    requirePhotoEditor,
    requirePhotoViewer,
    requirePersonEditorBody,
    requireDocumentEditor,
    requireDocumentViewer,
    requireEventEditor,
    requireStoryEditor,
    requireTreeEditor,
    requireTreeRole,
    isTreeOwner,
    getUserTreeRole,
    ROLES
};
