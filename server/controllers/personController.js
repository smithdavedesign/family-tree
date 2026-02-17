const { supabase } = require('../middleware/auth');
const logger = require('../utils/logger');

exports.createPerson = async (req, res) => {
    const {
        id, tree_id, first_name, last_name, dob, dod, pob, gender, bio, occupation,
        profile_photo_url, attributes,
        // New Phase H fields
        place_of_death, cause_of_death, burial_place, occupation_history, education
    } = req.body;

    // MOCK MODE
    if (process.env.USE_MOCK === 'true') {
        const { MOCK_PERSONS } = require('../mockData');
        const newPerson = {
            id: id || `mock-p-${Date.now()}`,
            tree_id, first_name, last_name, dob, dod, pob, gender, bio, occupation, profile_photo_url, attributes,
            place_of_death, cause_of_death, burial_place, occupation_history, education
        };
        MOCK_PERSONS.push(newPerson);
        return res.status(201).json(newPerson);
    }

    try {
        const payload = {
            tree_id, first_name, last_name, dob, dod, pob, gender, bio, occupation,
            profile_photo_url, attributes,
            place_of_death, cause_of_death, burial_place, occupation_history, education
        };
        if (id) {
            logger.info("createPerson called WITH ID:", { id }, req);
            payload.id = id;
        } else {
            logger.info("createPerson called WITHOUT ID", {}, req);
        }

        const { data, error } = await supabase
            .from('persons')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;

        // Trigger notification for tree members (async)
        setImmediate(async () => {
            try {
                const { data: members } = await supabaseAdmin
                    .from('tree_members')
                    .select('user_id')
                    .eq('tree_id', tree_id)
                    .neq('user_id', req.user.id);

                const { data: tree } = await supabaseAdmin
                    .from('trees')
                    .select('name')
                    .eq('id', tree_id)
                    .single();

                if (members && members.length > 0) {
                    const fullName = `${first_name} ${last_name || ''}`.trim();
                    const payload = {
                        treeId: tree_id,
                        treeName: tree?.name || 'Family Tree',
                        actorName: req.user.name || req.user.email,
                        itemTitle: fullName,
                        personId: data.id
                    };

                    for (const member of members) {
                        await emailService.queueNotification(member.user_id, 'person', payload);
                    }
                }
            } catch (notifError) {
                logger.error('Person notification failed', notifError);
            }
        });

        res.status(201).json(data);
    } catch (error) {
        logger.error('Error creating person:', error, req);
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
        // Sanitize date fields - convert empty strings to null
        const sanitizedUpdates = { ...updates };
        if (sanitizedUpdates.dob === '') sanitizedUpdates.dob = null;
        if (sanitizedUpdates.dod === '') sanitizedUpdates.dod = null;

        const { data, error } = await supabase
            .from('persons')
            .update(sanitizedUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        logger.error('Error updating person:', error, req);
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
        logger.error('Error deleting person:', error, req);
        res.status(500).json({ error: error.message });
    }
};

exports.mergePersons = async (req, res) => {
    const { keep_id, merge_id } = req.body;

    if (!keep_id || !merge_id) {
        return res.status(400).json({ error: 'Both keep_id and merge_id are required' });
    }

    try {
        // 1. Update relationships where merge_id is person_1
        const { error: rel1Error } = await supabase
            .from('relationships')
            .update({ person_1_id: keep_id })
            .eq('person_1_id', merge_id);
        if (rel1Error) throw rel1Error;

        // 2. Update relationships where merge_id is person_2
        const { error: rel2Error } = await supabase
            .from('relationships')
            .update({ person_2_id: keep_id })
            .eq('person_2_id', merge_id);
        if (rel2Error) throw rel2Error;

        // 3. Update media
        const { error: mediaError } = await supabase
            .from('media')
            .update({ person_id: keep_id })
            .eq('person_id', merge_id);
        if (mediaError) throw mediaError;

        // 4. Delete the merged person
        const { error: deleteError } = await supabase
            .from('persons')
            .delete()
            .eq('id', merge_id);
        if (deleteError) throw deleteError;

        res.json({ message: 'Merge successful' });
    } catch (error) {
        logger.error('Error merging persons:', error, req);
        res.status(500).json({ error: error.message });
    }
};
