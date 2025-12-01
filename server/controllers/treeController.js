const { supabase, supabaseAdmin } = require('../middleware/auth');

exports.getTree = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // MOCK MODE
        if (process.env.USE_MOCK === 'true') {
            const { MOCK_TREES, MOCK_PERSONS, MOCK_RELATIONSHIPS } = require('../mockData');
            const tree = MOCK_TREES.find(t => t.id === id);

            if (!tree) return res.status(404).json({ error: 'Tree not found' });

            const persons = MOCK_PERSONS.filter(p => p.tree_id === id);
            const relationships = MOCK_RELATIONSHIPS.filter(r => r.tree_id === id);

            // Mock role (owner if matches owner_id, else viewer)
            const role = tree.owner_id === userId ? 'owner' : 'viewer';

            return res.json({
                tree,
                persons,
                relationships,
                name: tree.name,
                role
            });
        }

        // 1. Fetch Tree Details
        const { data: tree, error: treeError } = await supabase
            .from('trees')
            .select('*')
            .eq('id', id)
            .single();

        if (treeError) throw treeError;

        // 2. Fetch User's Role
        const { data: member } = await supabase
            .from('tree_members')
            .select('role')
            .eq('tree_id', id)
            .eq('user_id', userId)
            .single();

        const role = member ? member.role : (tree.owner_id === userId ? 'owner' : null);

        // 3. Fetch persons in the tree
        const { data: persons, error: personsError } = await supabase
            .from('persons')
            .select('*')
            .eq('tree_id', id);

        if (personsError) throw personsError;

        // 4. Fetch relationships in the tree
        const { data: relationships, error: relationshipsError } = await supabase
            .from('relationships')
            .select('*')
            .eq('tree_id', id);

        if (relationshipsError) throw relationshipsError;

        res.json({
            tree,
            persons,
            relationships,
            name: tree.name,
            role
        });
    } catch (error) {
        console.error('Error fetching tree:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getUserTrees = async (req, res) => {
    try {
        const userId = req.user.id;

        // MOCK MODE
        if (process.env.USE_MOCK === 'true') {
            const { MOCK_TREES } = require('../mockData');
            const ownedTrees = MOCK_TREES.filter(t => t.owner_id === userId);
            return res.json({ ownedTrees, sharedTrees: [] });
        }

        console.log('Fetching trees for user:', userId);

        // Fetch owned trees
        const { data: ownedTrees, error: ownError } = await supabase
            .from('trees')
            .select('*')
            .eq('owner_id', userId);

        if (ownError) {
            console.error('Error fetching owned trees:', ownError);
            throw ownError;
        }

        // Fetch shared trees (where user is a member but not owner)
        const { data: membershipData, error: memberError } = await supabaseAdmin
            .from('tree_members')
            .select(`
                role,
                trees (*)
            `)
            .eq('user_id', userId)
            .neq('role', 'owner'); // Exclude owned trees (they're already in ownedTrees)

        if (memberError) {
            console.error('Error fetching shared trees:', memberError);
            throw memberError;
        }

        // Extract the tree data from the membership objects
        const sharedTrees = membershipData
            ? membershipData.map(m => ({ ...m.trees, memberRole: m.role }))
            : [];

        console.log('Trees found - Owned:', ownedTrees?.length || 0, 'Shared:', sharedTrees?.length || 0);

        res.json({ ownedTrees: ownedTrees || [], sharedTrees });
    } catch (error) {
        console.error('Error fetching user trees:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.createTree = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Tree name is required' });
        }

        // MOCK MODE
        if (process.env.USE_MOCK === 'true') {
            const { MOCK_TREES } = require('../mockData');
            const newTree = {
                id: `mock-tree-${Date.now()}`,
                name,
                owner_id: userId,
                is_public: false,
                created_at: new Date().toISOString()
            };
            MOCK_TREES.push(newTree);
            return res.status(201).json(newTree);
        }

        // Ensure user exists in public.users before creating tree
        // This is required because trees.owner_id references public.users
        const { error: userError } = await supabaseAdmin
            .from('users')
            .upsert({
                id: userId,
                email: req.user.email,
            }, { onConflict: 'id', ignoreDuplicates: true });

        if (userError) {
            console.error('Error ensuring user exists in public.users:', userError);
            // We continue anyway, hoping it might work or fail with a clear error
        }

        // Create the tree (use admin client to bypass RLS)
        const { data: tree, error: treeError } = await supabaseAdmin
            .from('trees')
            .insert([{
                name,
                owner_id: userId,
                is_public: false
            }])
            .select()
            .single();

        if (treeError) throw treeError;

        // Add owner to tree_members
        const { error: memberError } = await supabaseAdmin
            .from('tree_members')
            .insert([{
                tree_id: tree.id,
                user_id: userId,
                role: 'owner'
            }]);

        if (memberError) {
            console.error('Error adding owner to tree_members:', memberError);
            // We should probably revert the tree creation or at least warn
            // For now, we'll log it. The RBAC fallback will handle access.
        }

        // Create a root person (the user themselves)
        const { data: rootPerson, error: personError } = await supabaseAdmin
            .from('persons')
            .insert([{
                tree_id: tree.id,
                first_name: 'Me',
                last_name: '',
                bio: 'This is you! Click to edit your details.'
            }])
            .select()
            .single();

        if (personError) {
            console.error('Error creating root person:', personError);
            // Tree is created, so we can still return success
        }

        res.status(201).json(tree);
    } catch (error) {
        console.error('Error creating tree:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteTree = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // MOCK MODE
        if (process.env.USE_MOCK === 'true') {
            const { MOCK_TREES } = require('../mockData');
            const index = MOCK_TREES.findIndex(t => t.id === id && t.owner_id === userId);
            if (index !== -1) {
                MOCK_TREES.splice(index, 1);
                return res.json({ message: 'Tree deleted successfully' });
            }
            return res.status(404).json({ error: 'Tree not found' });
        }

        // Verify ownership
        const { data: tree, error: fetchError } = await supabase
            .from('trees')
            .select('owner_id')
            .eq('id', id)
            .single();

        if (fetchError || !tree) {
            return res.status(404).json({ error: 'Tree not found' });
        }

        if (tree.owner_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Cascade delete using admin client
        // 1. Get all person IDs for this tree
        const { data: persons } = await supabaseAdmin
            .from('persons')
            .select('id')
            .eq('tree_id', id);

        // 2. Delete Media if there are persons
        if (persons && persons.length > 0) {
            const personIds = persons.map(p => p.id);
            await supabaseAdmin
                .from('media')
                .delete()
                .in('person_id', personIds);
        }

        // 3. Delete Relationships
        await supabaseAdmin
            .from('relationships')
            .delete()
            .eq('tree_id', id);

        // 4. Delete Persons
        await supabaseAdmin
            .from('persons')
            .delete()
            .eq('tree_id', id);

        // 5. Delete tree members
        await supabaseAdmin
            .from('tree_members')
            .delete()
            .eq('tree_id', id);

        // 6. Delete invitations
        await supabaseAdmin
            .from('invitations')
            .delete()
            .eq('tree_id', id);

        // 7. Delete Tree
        const { error: deleteError } = await supabaseAdmin
            .from('trees')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        res.json({ message: 'Tree deleted successfully' });
    } catch (error) {
        console.error('Error deleting tree:', error);
        res.status(500).json({ error: error.message });
    }
};
