const { supabaseAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * Get recent activity for trees the user has access to
 */
async function getRecentActivity(req, res) {
    try {
        const userId = req.user.id;

        // Get all trees the user has access to (owned + shared)
        const { data: accessibleTrees, error: treesError } = await supabaseAdmin
            .from('tree_members')
            .select('tree_id')
            .eq('user_id', userId);

        if (treesError) {
            logger.error('Failed to fetch accessible trees', treesError, {}, req);
            return res.status(500).json({ error: 'Failed to fetch activity' });
        }

        const treeIds = accessibleTrees.map(t => t.tree_id);

        if (treeIds.length === 0) {
            return res.json([]);
        }

        // Fetch recent audit logs
        const { data: activities, error: activitiesError } = await supabaseAdmin
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100); // Fetch more than needed for filtering

        if (activitiesError) {
            logger.error('Failed to fetch activities', activitiesError, {}, req);
            return res.status(500).json({ error: 'Failed to fetch activity' });
        }

        // Get user data separately
        const userIds = [...new Set(activities.map(a => a.user_id).filter(Boolean))];
        const { data: users } = await supabaseAdmin
            .from('users')
            .select('id, email, avatar_url')
            .in('id', userIds);

        const userMap = {};
        users?.forEach(u => {
            userMap[u.id] = u;
        });

        // Enrich activities with tree and resource details
        const enrichedActivities = await Promise.all(
            activities.map(async (activity) => {
                let treeName = null;
                let treeId = null;
                let resourceName = null;

                // Extract tree_id from details or resource
                if (activity.resource_type === 'tree') {
                    treeId = activity.resource_id;
                } else if (activity.details?.body?.tree_id) {
                    treeId = activity.details.body.tree_id;
                }

                // Fetch resource details based on type
                try {
                    if (activity.resource_type === 'person' && activity.resource_id) {
                        const { data: person } = await supabaseAdmin
                            .from('persons')
                            .select('first_name, last_name, tree_id')
                            .eq('id', activity.resource_id)
                            .maybeSingle();

                        if (person) {
                            resourceName = `${person.first_name} ${person.last_name}`.trim();
                            if (!treeId) treeId = person.tree_id;
                        }
                    } else if (activity.resource_type === 'story' && activity.resource_id) {
                        const { data: story } = await supabaseAdmin
                            .from('stories')
                            .select('title, tree_id')
                            .eq('id', activity.resource_id)
                            .maybeSingle();

                        if (story) {
                            resourceName = story.title;
                            if (!treeId) treeId = story.tree_id;
                        }
                    } else if (activity.resource_type === 'photo' && activity.resource_id) {
                        const { data: photo } = await supabaseAdmin
                            .from('photos')
                            .select('caption, tree_id')
                            .eq('id', activity.resource_id)
                            .maybeSingle();

                        if (photo) {
                            resourceName = photo.caption || 'a photo';
                            if (!treeId) treeId = photo.tree_id;
                        }
                    } else if (activity.resource_type === 'life_event' && activity.resource_id) {
                        const { data: event } = await supabaseAdmin
                            .from('life_events')
                            .select('event_type, person_id')
                            .eq('id', activity.resource_id)
                            .maybeSingle();

                        if (event) {
                            resourceName = event.event_type;
                            // Get tree_id from person
                            if (event.person_id) {
                                const { data: person } = await supabaseAdmin
                                    .from('persons')
                                    .select('tree_id, first_name, last_name')
                                    .eq('id', event.person_id)
                                    .maybeSingle();
                                if (person) {
                                    treeId = person.tree_id;
                                    resourceName = `${event.event_type} for ${person.first_name} ${person.last_name}`;
                                }
                            }
                        }
                    } else if (activity.resource_type === 'album' && activity.resource_id) {
                        const { data: album } = await supabaseAdmin
                            .from('albums')
                            .select('title, tree_id')
                            .eq('id', activity.resource_id)
                            .maybeSingle();

                        if (album) {
                            resourceName = album.title;
                            if (!treeId) treeId = album.tree_id;
                        }
                    } else if (activity.resource_type === 'relationship' && activity.resource_id) {
                        const { data: rel } = await supabaseAdmin
                            .from('relationships')
                            .select('type, tree_id')
                            .eq('id', activity.resource_id)
                            .maybeSingle();

                        if (rel) {
                            resourceName = `${rel.type} relationship`;
                            if (!treeId) treeId = rel.tree_id;
                        }
                    } else if (activity.resource_type === 'comment') {
                        resourceName = 'a comment';
                        // Try to get tree from details
                        if (activity.details?.body?.tree_id) {
                            treeId = activity.details.body.tree_id;
                        }
                    }
                } catch (err) {
                    // Resource might have been deleted, continue with what we have
                    logger.debug('Could not enrich activity resource', { activityId: activity.id, error: err.message });
                }

                // Fetch tree name if we have tree_id
                if (treeId) {
                    const { data: tree } = await supabaseAdmin
                        .from('trees')
                        .select('name')
                        .eq('id', treeId)
                        .maybeSingle();
                    treeName = tree?.name;
                }


                // Get user info
                const user = userMap[activity.user_id];

                // Generate human-readable description
                const description = generateDescription(
                    activity.action,
                    activity.resource_type,
                    resourceName,
                    treeName
                );

                return {
                    id: activity.id,
                    action: activity.action,
                    resource_type: activity.resource_type,
                    user_name: user?.email?.split('@')[0] || 'Someone',
                    user_email: user?.email,
                    user_avatar: user?.avatar_url,
                    tree_name: treeName,
                    tree_id: treeId,
                    resource_name: resourceName,
                    created_at: activity.created_at,
                    description
                };
            })
        );

        // Filter to only include activities from accessible trees
        const filteredActivities = enrichedActivities
            .filter(a => {
                const hasTree = a.tree_id && treeIds.includes(a.tree_id);
                if (!hasTree) {
                    logger.debug('Activity filtered out', {
                        resourceType: a.resource_type,
                        action: a.action,
                        treeId: a.tree_id,
                        accessibleTrees: treeIds
                    });
                }
                return hasTree;
            })
            .slice(0, 20); // Limit to 20 most recent

        logger.info('Recent activity fetched', {
            req,
            count: filteredActivities.length,
            totalActivities: enrichedActivities.length
        });

        res.json(filteredActivities);
    } catch (error) {
        logger.error('Error fetching recent activity', error, {}, req);
        res.status(500).json({ error: 'Failed to fetch activity' });
    }
}

/**
 * Generate human-readable description for activity
 */
function generateDescription(action, resourceType, resourceName, treeName) {
    const resource = resourceName || `a ${resourceType}`;
    const tree = treeName ? ` in ${treeName}` : '';

    switch (action) {
        case 'CREATE':
            if (resourceType === 'person') return `added ${resource}${tree}`;
            if (resourceType === 'story') return `created story "${resource}"${tree}`;
            if (resourceType === 'photo') return `uploaded ${resource}${tree}`;
            if (resourceType === 'tree') return `created tree "${resource}"`;
            if (resourceType === 'life_event') return `added ${resource}${tree}`;
            if (resourceType === 'album') return `created album "${resource}"${tree}`;
            if (resourceType === 'relationship') return `added ${resource}${tree}`;
            if (resourceType === 'comment') return `posted ${resource}${tree}`;
            return `created ${resource}${tree}`;

        case 'UPDATE':
            if (resourceType === 'person') return `updated ${resource}${tree}`;
            if (resourceType === 'story') return `edited story "${resource}"${tree}`;
            if (resourceType === 'tree') return `updated tree "${resource}"`;
            if (resourceType === 'life_event') return `updated ${resource}${tree}`;
            if (resourceType === 'album') return `updated album "${resource}"${tree}`;
            return `updated ${resource}${tree}`;

        case 'DELETE':
            if (resourceType === 'person') return `removed ${resource}${tree}`;
            if (resourceType === 'story') return `deleted story "${resource}"${tree}`;
            if (resourceType === 'relationship') return `removed ${resource}${tree}`;
            if (resourceType === 'comment') return `deleted ${resource}${tree}`;
            return `deleted ${resource}${tree}`;

        default:
            return `${action.toLowerCase()} ${resource}${tree}`;
    }
}

module.exports = {
    getRecentActivity
};
