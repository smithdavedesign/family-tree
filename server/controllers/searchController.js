const { supabaseAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * Unified search endpoint
 * GET /api/search?q=...&treeId=...&type=...
 */
exports.search = async (req, res) => {
    const { q, treeId, type } = req.query;
    const userId = req.user.id;

    if (!q || q.trim().length < 2) {
        return res.json({
            results: [],
            meta: { count: 0 }
        });
    }

    const searchTerm = q.trim();
    const searchLower = searchTerm.toLowerCase();

    const cleanSearchTerm = searchTerm.replace(/\b(in|during|around|circa)?\s*(1[6-9]\d{2}|20\d{2})\b/i, '').trim() || searchTerm;

    try {
        // 0. Get Accessible Tree IDs for the user
        const { data: treeMemberships, error: treeError } = await supabaseAdmin
            .from('tree_members')
            .select('tree_id')
            .eq('user_id', userId);

        if (treeError) throw treeError;
        const accessibleTreeIds = treeMemberships.map(m => m.tree_id);

        if (accessibleTreeIds.length === 0) {
            return res.json({ results: [], meta: { count: 0 } });
        }

        let targetTreeIds = accessibleTreeIds;
        if (treeId) {
            if (accessibleTreeIds.includes(treeId)) {
                targetTreeIds = [treeId];
            } else {
                return res.json({ results: [], meta: { count: 0 } });
            }
        }

        const results = [];

        // 1. Search Persons
        if (!type || type === 'person') {
            let personQuery = supabaseAdmin
                .from('persons')
                .select('id, first_name, last_name, dob, dod, profile_photo_url, bio, tree_id')
                .or(`first_name.ilike.%${cleanSearchTerm}%,last_name.ilike.%${cleanSearchTerm}%,bio.ilike.%${cleanSearchTerm}%`)
                .in('tree_id', targetTreeIds)
                .limit(20);

            const { data: persons, error: pError } = await personQuery;
            if (pError) logger.error('Search: Person query error', pError);
            else {
                persons?.forEach(p => results.push({
                    id: p.id,
                    type: 'person',
                    title: `${p.first_name} ${p.last_name || ''}`.trim(),
                    subtitle: p.dob ? `Born ${new Date(p.dob).getFullYear()}` : 'Date unknown',
                    image: p.profile_photo_url,
                    description: p.bio?.substring(0, 100),
                    tree_id: p.tree_id,
                    metadata: { dob: p.dob, dod: p.dod }
                }));
            }
        }

        // 2. Search Stories
        if (!type || type === 'story') {
            let storyQuery = supabaseAdmin
                .from('stories')
                .select('id, title, tree_id, created_at, content')
                .or(`title.ilike.%${searchTerm}%`)
                .in('tree_id', targetTreeIds)
                .limit(10);

            const { data: stories, error: sError } = await storyQuery;
            if (sError) logger.error('Search: Story query error', sError);
            else {
                stories?.forEach(s => {
                    // content is jsonb, we just take title for highlight but can show snippet if it's text
                    // If content is rich text object, we might need more complex parsing
                    let snippet = '';
                    if (typeof s.content === 'string') {
                        snippet = s.content.substring(0, 100).replace(/<[^>]*>/g, '');
                    } else if (s.content && typeof s.content === 'object') {
                        // Assuming Tiptap JSON or similar, just title for now or simple stringify if needed
                        snippet = 'Click to read story';
                    }

                    results.push({
                        id: s.id,
                        type: 'story',
                        title: s.title,
                        subtitle: `Story • ${new Date(s.created_at).toLocaleDateString()}`,
                        description: snippet || 'No description available',
                        tree_id: s.tree_id
                    });
                });
            }
        }

        // 3. Search Albums
        if (!type || type === 'album') {
            let albumQuery = supabaseAdmin
                .from('albums')
                .select('id, name, description, tree_id')
                .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
                .in('tree_id', targetTreeIds)
                .limit(10);

            const { data: albums, error: aError } = await albumQuery;
            if (aError) logger.error('Search: Album query error', aError);
            else {
                albums?.forEach(a => results.push({
                    id: a.id,
                    type: 'album',
                    title: a.name,
                    subtitle: 'Photo Album',
                    description: a.description?.substring(0, 100),
                    tree_id: a.tree_id
                }));
            }
        }

        // 4. Search Locations
        if (!type || type === 'location') {
            let locQuery = supabaseAdmin
                .from('locations')
                .select('id, name, address')
                .or(`name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`)
                .limit(20);

            const { data: locations, error: lError } = await locQuery;
            if (lError) logger.error('Search: Location query error', lError);
            else if (locations?.length > 0) {
                const locIds = locations.map(l => l.id);

                const { data: linkedStories } = await supabaseAdmin
                    .from('story_locations')
                    .select('location_id, stories!inner(tree_id)')
                    .in('location_id', locIds)
                    .in('stories.tree_id', targetTreeIds);

                const { data: linkedPersons } = await supabaseAdmin
                    .from('person_locations')
                    .select('location_id, persons!inner(tree_id)')
                    .in('location_id', locIds)
                    .in('persons.tree_id', targetTreeIds);

                const validLocIds = new Set([
                    ...(linkedStories?.map(ls => ls.location_id) || []),
                    ...(linkedPersons?.map(lp => lp.location_id) || [])
                ]);

                locations.forEach(l => {
                    if (validLocIds.has(l.id)) {
                        const sLink = linkedStories?.find(ls => ls.location_id === l.id);
                        const pLink = linkedPersons?.find(lp => lp.location_id === l.id);
                        const tree_id = sLink?.stories?.tree_id || pLink?.persons?.tree_id;

                        results.push({
                            id: l.id,
                            type: 'location',
                            title: l.name,
                            subtitle: 'Location',
                            description: l.address,
                            tree_id: tree_id
                        });
                    }
                });
            }
        }

        // Sort results: Person matches first, then exact title matches
        results.sort((a, b) => {
            if (a.type === 'person' && b.type !== 'person') return -1;
            if (a.type !== 'person' && b.type === 'person') return 1;

            const aExact = a.title.toLowerCase() === searchLower;
            const bExact = b.title.toLowerCase() === searchLower;
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;

            return 0;
        });

        res.json({
            results: results.slice(0, 50),
            meta: {
                count: results.length,
                query: searchTerm,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Global search error', error, req);
        res.status(500).json({ error: 'Search failed' });
    }
};
