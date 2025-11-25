const { supabase } = require('../middleware/auth');

exports.addMedia = async (req, res) => {
    const { person_id, url, type, google_media_id } = req.body;

    // MOCK MODE
    if (process.env.USE_MOCK === 'true') {
        const { MOCK_MEDIA, MOCK_PERSONS } = require('../mockData');
        const newMedia = {
            id: `mock-m-${Date.now()}`,
            person_id, url, type, google_media_id,
            created_at: new Date().toISOString()
        };
        MOCK_MEDIA.push(newMedia);

        // Update person profile photo if empty
        const person = MOCK_PERSONS.find(p => p.id === person_id);
        if (person && !person.profile_photo_url) {
            person.profile_photo_url = url;
        }

        return res.status(201).json(newMedia);
    }

    try {
        const { data, error } = await supabase
            .from('media')
            .insert([
                { person_id, url, type, google_media_id }
            ])
            .select()
            .single();

        if (error) throw error;

        // Also update the person's profile photo if they don't have one
        const { data: person } = await supabase
            .from('persons')
            .select('profile_photo_url')
            .eq('id', person_id)
            .single();

        if (person && !person.profile_photo_url) {
            await supabase
                .from('persons')
                .update({ profile_photo_url: url })
                .eq('id', person_id);
        }

        res.status(201).json(data);
    } catch (error) {
        console.error('Error adding media:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getMediaForPerson = async (req, res) => {
    const { id } = req.params;

    // MOCK MODE
    if (process.env.USE_MOCK === 'true') {
        const { MOCK_MEDIA } = require('../mockData');
        const media = MOCK_MEDIA.filter(m => m.person_id === id);
        return res.json(media);
    }

    try {
        const { data, error } = await supabase
            .from('media')
            .select('*')
            .eq('person_id', id);

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error fetching media:', error);
        res.status(500).json({ error: error.message });
    }
};
