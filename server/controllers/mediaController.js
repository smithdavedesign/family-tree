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

// --- Photos (Phase H) ---

exports.addPhoto = async (req, res) => {
    const { person_id, url, caption, taken_date, location, is_primary } = req.body;

    try {
        // If setting as primary, unset others first
        if (is_primary) {
            await supabase
                .from('photos')
                .update({ is_primary: false })
                .eq('person_id', person_id);
        }

        const { data, error } = await supabase
            .from('photos')
            .insert([{ person_id, url, caption, taken_date, location, is_primary }])
            .select()
            .single();

        if (error) throw error;

        // If primary, also update person's profile_photo_url
        if (is_primary) {
            await supabase
                .from('persons')
                .update({ profile_photo_url: url })
                .eq('id', person_id);
        }

        res.status(201).json(data);
    } catch (error) {
        console.error('Error adding photo:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getPhotos = async (req, res) => {
    const { personId } = req.params;

    try {
        const { data, error } = await supabase
            .from('photos')
            .select('*')
            .eq('person_id', personId)
            .order('is_primary', { ascending: false }) // Primary first
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error fetching photos:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.updatePhoto = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        // If setting as primary, unset others first
        if (updates.is_primary) {
            // Get person_id for this photo
            const { data: photo } = await supabase
                .from('photos')
                .select('person_id, url')
                .eq('id', id)
                .single();

            if (photo) {
                await supabase
                    .from('photos')
                    .update({ is_primary: false })
                    .eq('person_id', photo.person_id);

                // Update person profile photo
                await supabase
                    .from('persons')
                    .update({ profile_photo_url: photo.url })
                    .eq('id', photo.person_id);
            }
        }

        const { data, error } = await supabase
            .from('photos')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error updating photo:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.deletePhoto = async (req, res) => {
    const { id } = req.params;

    try {
        const { error } = await supabase
            .from('photos')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting photo:', error);
        res.status(500).json({ error: error.message });
    }
};
