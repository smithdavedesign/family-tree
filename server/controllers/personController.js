const { supabase } = require('../middleware/auth');

exports.createPerson = async (req, res) => {
    const { tree_id, first_name, last_name, dob, dod, pob, gender, bio, occupation, profile_photo_url, attributes } = req.body;

    // MOCK MODE
    if (process.env.USE_MOCK === 'true') {
        const { MOCK_PERSONS } = require('../mockData');
        const newPerson = {
            id: `mock-p-${Date.now()}`,
            tree_id, first_name, last_name, dob, dod, pob, gender, bio, occupation, profile_photo_url, attributes
        };
        MOCK_PERSONS.push(newPerson);
        return res.status(201).json(newPerson);
    }

    try {
        const { data, error } = await supabase
            .from('persons')
            .insert([
                { tree_id, first_name, last_name, dob, dod, pob, gender, bio, occupation, profile_photo_url, attributes }
            ])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating person:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.updatePerson = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // MOCK MODE
    if (process.env.USE_MOCK === 'true') {
        const { MOCK_PERSONS } = require('../mockData');
        const index = MOCK_PERSONS.findIndex(p => p.id === id);
        if (index !== -1) {
            MOCK_PERSONS[index] = { ...MOCK_PERSONS[index], ...updates };
            return res.json(MOCK_PERSONS[index]);
        }
        return res.status(404).json({ error: 'Person not found' });
    }

    try {
        const { data, error } = await supabase
            .from('persons')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error updating person:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.deletePerson = async (req, res) => {
    const { id } = req.params;

    // MOCK MODE
    if (process.env.USE_MOCK === 'true') {
        const { MOCK_PERSONS } = require('../mockData');
        const index = MOCK_PERSONS.findIndex(p => p.id === id);
        if (index !== -1) {
            MOCK_PERSONS.splice(index, 1);
            return res.status(204).send();
        }
        return res.status(404).json({ error: 'Person not found' });
    }

    try {
        const { error } = await supabase
            .from('persons')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting person:', error);
        res.status(500).json({ error: error.message });
    }
};
