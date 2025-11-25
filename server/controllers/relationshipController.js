const { supabase } = require('../middleware/auth');

exports.createRelationship = async (req, res) => {
    const { tree_id, person_1_id, person_2_id, type } = req.body;

    // MOCK MODE
    if (process.env.USE_MOCK === 'true') {
        const { MOCK_RELATIONSHIPS } = require('../mockData');
        const newRel = {
            id: `mock-r-${Date.now()}`,
            tree_id, person_1_id, person_2_id, type
        };
        MOCK_RELATIONSHIPS.push(newRel);
        return res.status(201).json(newRel);
    }

    try {
        const { data, error } = await supabase
            .from('relationships')
            .insert([
                { tree_id, person_1_id, person_2_id, type }
            ])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating relationship:', error);
        res.status(500).json({ error: error.message });
    }
};
