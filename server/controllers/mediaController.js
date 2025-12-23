const { supabaseAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

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
        const { data, error } = await supabaseAdmin
            .from('media')
            .insert([
                { person_id, url, type, google_media_id }
            ])
            .select()
            .single();

        if (error) throw error;

        // Also update the person's profile photo if they don't have one
        const { data: person } = await supabaseAdmin
            .from('persons')
            .select('profile_photo_url')
            .eq('id', person_id)
            .single();

        if (person && !person.profile_photo_url) {
            await supabaseAdmin
                .from('persons')
                .update({ profile_photo_url: url })
                .eq('id', person_id);
        }

        res.status(201).json(data);
    } catch (error) {
        logger.error('Error adding media:', error, req);
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
        const { data, error } = await supabaseAdmin
            .from('media')
            .select('*')
            .eq('person_id', id);

        if (error) throw error;

        res.json(data);
    } catch (error) {
        logger.error('Error fetching media:', error, req);
        res.status(500).json({ error: error.message });
    }
};

// --- Photos (Phase H) ---

exports.addPhoto = async (req, res) => {
    const { person_id, url, caption, taken_date, is_primary, google_media_id, width, height, orientation, latitude, longitude, location_name } = req.body;

    try {
        let shouldBePrimary = is_primary;

        // Calculate derived date fields
        let year = null;
        let month_year = null;

        if (taken_date) {
            const date = new Date(taken_date);
            if (!isNaN(date.getTime())) {
                year = date.getFullYear();
                month_year = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }
        }

        // If not explicitly set as primary, check if person has a profile photo
        if (!shouldBePrimary) {
            const { data: person } = await supabaseAdmin
                .from('persons')
                .select('profile_photo_url')
                .eq('id', person_id)
                .single();

            if (person && !person.profile_photo_url) {
                shouldBePrimary = true;
            }
        }

        // If setting as primary, unset others first
        if (shouldBePrimary) {
            await supabaseAdmin
                .from('photos')
                .update({ is_primary: false })
                .eq('person_id', person_id);
        }

        const { data, error } = await supabaseAdmin
            .from('photos')
            .insert([{
                person_id,
                url,
                caption,
                taken_date,
                is_primary: shouldBePrimary,
                google_media_id,
                width,
                height,
                orientation,
                year,
                month_year,
                latitude,
                longitude,
                location_name
            }])
            .select()
            .single();

        if (error) throw error;

        // If primary, also update person's profile_photo_url
        if (shouldBePrimary) {
            await supabaseAdmin
                .from('persons')
                .update({ profile_photo_url: url })
                .eq('id', person_id);
        }

        res.status(201).json(data);
    } catch (error) {
        logger.error('Error adding photo:', error, req);
        res.status(500).json({ error: error.message });
    }
};

exports.getPhotos = async (req, res) => {
    const { id: personId } = req.params;

    try {
        const { data, error } = await supabaseAdmin
            .from('photos')
            .select('*, persons!inner(tree_id)')
            .eq('person_id', personId)
            .order('is_primary', { ascending: false }) // Primary first
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Map to include tree_id at top level
        const photos = data.map(photo => ({
            ...photo,
            tree_id: photo.persons?.tree_id,
            persons: undefined // Remove nested object
        }));

        res.json(photos);
    } catch (error) {
        logger.error('Error fetching photos:', error, req);
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
            const { data: photo } = await supabaseAdmin
                .from('photos')
                .select('person_id, url')
                .eq('id', id)
                .single();

            if (photo) {
                await supabaseAdmin
                    .from('photos')
                    .update({ is_primary: false })
                    .eq('person_id', photo.person_id);

                // Update person profile photo
                await supabaseAdmin
                    .from('persons')
                    .update({ profile_photo_url: photo.url })
                    .eq('id', photo.person_id);
            }
        }

        const { data, error } = await supabaseAdmin
            .from('photos')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        logger.error('Error updating photo:', error, req);
        res.status(500).json({ error: error.message });
    }
};

exports.deletePhoto = async (req, res) => {
    const { id } = req.params;

    try {
        const { error } = await supabaseAdmin
            .from('photos')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.status(204).send();
    } catch (error) {
        logger.error('Error deleting photo:', error, req);
        res.status(500).json({ error: error.message });
    }
};

exports.getTreePhotos = async (req, res) => {
    const { id: treeId } = req.params;

    try {
        // Fetch all photos for persons in this tree
        // Join with persons table to get person details
        const { data, error } = await supabaseAdmin
            .from('photos')
            .select(`
                *,
                persons!inner (
                    id,
                    first_name,
                    last_name,
                    profile_photo_url,
                    dob
                )
            `)
            .eq('persons.tree_id', treeId)
            .order('taken_date', { ascending: false, nullsFirst: false });

        if (error) throw error;

        // Flatten the structure slightly for easier frontend consumption
        const photos = data.map(photo => ({
            ...photo,
            // Flatten person data for easier access
            person_id: photo.persons.id,
            person_name: `${photo.persons.first_name} ${photo.persons.last_name || ''}`.trim(),
            person_photo_url: photo.persons.profile_photo_url,
            person_dob: photo.persons.dob,
            tree_id: treeId, // Add tree_id for navigation

            // New fields for PhotoLightbox
            date: photo.taken_date,
            location: photo.location_name,
            person: {
                id: photo.persons.id,
                name: `${photo.persons.first_name} ${photo.persons.last_name || ''}`.trim(),
                photo_url: photo.persons.profile_photo_url
            }
        }));

        res.json(photos);
    } catch (error) {
        logger.error('Error fetching tree photos:', error, req);
        res.status(500).json({ error: error.message });
    }
};
