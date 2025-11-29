const { supabase, supabaseAdmin } = require('../middleware/auth');

exports.getTree = async (req, res) => {
    try {
        const { id } = req.params;

        // MOCK MODE
        if (process.env.USE_MOCK === 'true') {
            const { MOCK_TREES, MOCK_PERSONS, MOCK_RELATIONSHIPS } = require('../mockData');
            const tree = MOCK_TREES.find(t => t.id === id);

            if (!tree) return res.status(404).json({ error: 'Tree not found' });

            const persons = MOCK_PERSONS.filter(p => p.tree_id === id);
            const relationships = MOCK_RELATIONSHIPS.filter(r => r.tree_id === id);

            return res.json({ tree, persons, relationships });
        }

        // 1. Fetch Tree Details
        const { data: tree, error: treeError } = await supabase
            .from('trees')
            .select('*')
            .eq('id', id)
            .single();

        if (treeError) throw treeError;

        // Fetch persons in the tree
        const { data: persons, error: personsError } = await supabase
            .from('persons')
            .select('*')
            .eq('tree_id', id);

        if (personsError) throw personsError;

        // Fetch relationships in the tree
        const { data: relationships, error: relationshipsError } = await supabase
            .from('relationships')
            .select('*')
            .eq('tree_id', id);

        if (relationshipsError) throw relationshipsError;

        res.json({
            tree,
            persons,
            relationships
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
            const trees = MOCK_TREES.filter(t => t.owner_id === userId);
            return res.json(trees);
        }

        console.log('Fetching trees for user:', userId);
        const { data: trees, error } = await supabase
            .from('trees')
            .select('*')
            .eq('owner_id', userId);

        if (error) {
            console.error('Supabase query error:', error);
            throw error;
        }

        console.log('Trees found:', trees ? trees.length : 0);
        res.json(trees);
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
        // 1. Delete Media
        await supabaseAdmin
            .from('media')
            .delete()
            .in('person_id',
                supabaseAdmin.from('persons').select('id').eq('tree_id', id)
            );

        // 2. Delete Relationships
        await supabaseAdmin
            .from('relationships')
            .delete()
            .eq('tree_id', id);

        // 3. Delete Persons
        await supabaseAdmin
            .from('persons')
            .delete()
            .eq('tree_id', id);

        // 4. Delete Tree
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
