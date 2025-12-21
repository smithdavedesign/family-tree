const { supabaseAdmin } = require('../middleware/auth');

exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;

        console.log(`Deleting account for user: ${userId}`);

        // 1. Delete all media associated with user's persons
        const { error: mediaError } = await supabaseAdmin
            .from('media')
            .delete()
            .in('person_id',
                supabaseAdmin
                    .from('persons')
                    .select('id')
                    .in('tree_id',
                        supabaseAdmin
                            .from('trees')
                            .select('id')
                            .eq('owner_id', userId)
                    )
            );

        if (mediaError) console.error('Error deleting media:', mediaError);

        // 2. Delete all relationships in user's trees
        const { error: relError } = await supabaseAdmin
            .from('relationships')
            .delete()
            .in('tree_id',
                supabaseAdmin
                    .from('trees')
                    .select('id')
                    .eq('owner_id', userId)
            );

        if (relError) console.error('Error deleting relationships:', relError);

        // 3. Delete all persons in user's trees
        const { error: personsError } = await supabaseAdmin
        // First, get all tree IDs owned by the user
        const { data: ownedTrees, error: fetchTreesError } = await supabaseAdmin
            .from('trees')
            .select('id')
            .eq('owner_id', userId);

        if (fetchTreesError) {
            console.error('Error fetching user trees:', fetchTreesError);
            throw fetchTreesError;
        }

        const treeIds = ownedTrees.map(tree => tree.id);

        if (treeIds.length > 0) {
            // Get all person IDs associated with these trees
            const { data: personsInTrees, error: fetchPersonsError } = await supabaseAdmin
                .from('persons')
                .select('id')
                .in('tree_id', treeIds);

            if (fetchPersonsError) {
                console.error('Error fetching persons in user trees:', fetchPersonsError);
                throw fetchPersonsError;
            }

            const personIds = personsInTrees.map(person => person.id);

            // 1. Delete all media associated with user's persons
            if (personIds.length > 0) {
                const { error: mediaError } = await supabaseAdmin
                    .from('media')
                    .delete()
                    .in('person_id', personIds);

                if (mediaError) console.error('Error deleting media:', mediaError);
            }

            // 2. Delete all relationships in user's trees
            const { error: relError } = await supabaseAdmin
                .from('relationships')
                .delete()
                .in('tree_id', treeIds);

            if (relError) console.error('Error deleting relationships:', relError);

            // 3. Delete all persons in user's trees
            const { error: personsError } = await supabaseAdmin
                .from('persons')
                .delete()
                .in('tree_id', treeIds);

            if (personsError) console.error('Error deleting persons:', personsError);

            // 4. Delete all trees owned by user
            const { error: treesError } = await supabaseAdmin
                .from('trees')
                .delete()
                .in('id', treeIds); // Use .in('id', treeIds) for deleting trees

            if (treesError) console.error('Error deleting trees:', treesError);
        }


        // 5. Delete user from auth.users (this will cascade to public.users if it exists)
        const { error: userError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (userError) {
            console.error('Error deleting user from auth:', userError);
            throw userError;
        }

        console.log(`Account deleted successfully for user: ${userId}`);

        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ error: error.message || 'Failed to delete account' });
    }
};

exports.updateAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { avatar_url } = req.body;

        if (!avatar_url) {
            return res.status(400).json({ error: 'Avatar URL is required' });
        }

        const { data, error } = await supabaseAdmin
            .from('users')
            .update({ avatar_url })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error updating account:', error);
        res.status(500).json({ error: 'Failed to update account' });
    }
};
