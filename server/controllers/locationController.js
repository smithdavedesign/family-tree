const { supabaseAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

// Create a new location
exports.createLocation = async (req, res) => {
    const { name, address, latitude, longitude, start_date, end_date, notes } = req.body;

    logger.info('Creating location with data:', { body: req.body }, req);

    try {
        const { data, error } = await supabaseAdmin
            .from('locations')
            .insert([{
                name,
                address,
                latitude,
                longitude,
                start_date,
                end_date,
                notes
            }])
            .select()
            .single();

        if (error) {
            logger.error('Supabase error creating location:', error, req);
            throw error;
        }

        res.status(201).json(data);
    } catch (error) {
        logger.error('Error creating location:', error, req);
        res.status(500).json({ error: error.message });
    }
};

// Get all locations (with optional search)
exports.getLocations = async (req, res) => {
    const { search } = req.query;

    try {
        let query = supabaseAdmin
            .from('locations')
            .select('*')
            .order('name');

        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json(data);
    } catch (error) {
        logger.error('Error fetching locations:', error, req);
        res.status(500).json({ error: error.message });
    }
};

// Get single location by ID
exports.getLocation = async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabaseAdmin
            .from('locations')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        logger.error('Error fetching location:', error, req);
        res.status(500).json({ error: error.message });
    }
};

// Update location
exports.updateLocation = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        const { data, error } = await supabaseAdmin
            .from('locations')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        logger.error('Error updating location:', error, req);
        res.status(500).json({ error: error.message });
    }
};

// Delete location
exports.deleteLocation = async (req, res) => {
    const { id } = req.params;

    try {
        const { error } = await supabaseAdmin
            .from('locations')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.status(204).send();
    } catch (error) {
        logger.error('Error deleting location:', error, req);
        res.status(500).json({ error: error.message });
    }
};

// Get location details (photos, stories, people)
exports.getLocationDetails = async (req, res) => {
    const { id } = req.params;

    try {
        // Get location
        const { data: location, error: locError } = await supabaseAdmin
            .from('locations')
            .select('*')
            .eq('id', id)
            .single();

        if (locError) throw locError;

        // Get photos at this location (approximate match by coordinates)
        const photos = [];
        if (location.latitude && location.longitude) {
            const { data: photoData } = await supabaseAdmin
                .from('photos')
                .select(`
                    *,
                    persons!inner (
                        id,
                        first_name,
                        last_name,
                        tree_id
                    )
                `)
                .gte('latitude', location.latitude - 0.001)
                .lte('latitude', location.latitude + 0.001)
                .gte('longitude', location.longitude - 0.001)
                .lte('longitude', location.longitude + 0.001);

            if (photoData) photos.push(...photoData);
        }

        // Get linked stories
        const { data: storyLinks } = await supabaseAdmin
            .from('story_locations')
            .select(`
                story_id,
                stories!inner (
                    id,
                    title,
                    tree_id
                )
            `)
            .eq('location_id', id);

        const stories = storyLinks?.map(sl => sl.stories) || [];

        // Get linked people
        const { data: personLinks } = await supabaseAdmin
            .from('person_locations')
            .select(`
                person_id,
                start_date,
                end_date,
                persons!inner (
                    id,
                    first_name,
                    last_name,
                    tree_id
                )
            `)
            .eq('location_id', id);

        const people = personLinks?.map(pl => ({
            ...pl.persons,
            start_date: pl.start_date,
            end_date: pl.end_date
        })) || [];

        res.json({
            location,
            photos,
            stories,
            people
        });
    } catch (error) {
        logger.error('Error fetching location details:', error, req);
        res.status(500).json({ error: error.message });
    }
};

// Add location to story
exports.addStoryLocation = async (req, res) => {
    const { storyId } = req.params;
    const { location_id } = req.body;

    try {
        const { data, error } = await supabaseAdmin
            .from('story_locations')
            .insert([{ story_id: storyId, location_id }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        logger.error('Error adding story location:', error, req);
        res.status(500).json({ error: error.message });
    }
};

// Remove location from story
exports.removeStoryLocation = async (req, res) => {
    const { storyId, locationId } = req.params;

    try {
        const { error } = await supabaseAdmin
            .from('story_locations')
            .delete()
            .eq('story_id', storyId)
            .eq('location_id', locationId);

        if (error) throw error;

        res.status(204).send();
    } catch (error) {
        logger.error('Error removing story location:', error, req);
        res.status(500).json({ error: error.message });
    }
};

// Get story locations
exports.getStoryLocations = async (req, res) => {
    const { storyId } = req.params;

    try {
        const { data, error } = await supabaseAdmin
            .from('story_locations')
            .select(`
                *,
                locations (*)
            `)
            .eq('story_id', storyId);

        if (error) throw error;

        res.json(data.map(sl => sl.locations));
    } catch (error) {
        logger.error('Error fetching story locations:', error, req);
        res.status(500).json({ error: error.message });
    }
};

// Add location to person
exports.addPersonLocation = async (req, res) => {
    const { personId } = req.params;
    const { location_id, start_date, end_date, notes } = req.body;

    logger.info('Adding location to person:', { personId, location_id, start_date, end_date, notes }, req);

    try {
        const { data, error } = await supabaseAdmin
            .from('person_locations')
            .insert([{
                person_id: personId,
                location_id,
                start_date,
                end_date,
                notes
            }])
            .select()
            .single();

        if (error) {
            logger.error('Supabase error adding person location:', error, req);
            throw error;
        }

        logger.info('Successfully linked location to person', {}, req);
        res.status(201).json(data);
    } catch (error) {
        logger.error('Error adding person location:', error, req);
        res.status(500).json({ error: error.message });
    }
};

// Remove location from person
exports.removePersonLocation = async (req, res) => {
    const { personId, locationId } = req.params;

    try {
        const { error } = await supabaseAdmin
            .from('person_locations')
            .delete()
            .eq('person_id', personId)
            .eq('location_id', locationId);

        if (error) throw error;

        res.status(204).send();
    } catch (error) {
        logger.error('Error removing person location:', error, req);
        res.status(500).json({ error: error.message });
    }
};

// Get person locations
exports.getPersonLocations = async (req, res) => {
    const { personId } = req.params;

    logger.info('Fetching locations for person:', { personId }, req);

    try {
        const { data, error } = await supabaseAdmin
            .from('person_locations')
            .select(`
                *,
                locations (*)
            `)
            .eq('person_id', personId)
            .order('start_date', { ascending: false, nullsFirst: false });

        if (error) {
            logger.error('Supabase error fetching person locations:', error, req);
            throw error;
        }

        logger.info('Found person locations:', { count: data?.length || 0 }, req);

        res.json(data.map(pl => ({
            ...pl.locations,
            start_date: pl.start_date,
            end_date: pl.end_date,
            notes: pl.notes
        })));
    } catch (error) {
        logger.error('Error fetching person locations:', error, req);
        res.status(500).json({ error: error.message });
    }
};

// Add location to life event
exports.addEventLocation = async (req, res) => {
    const { eventId } = req.params;
    const { location_id } = req.body;

    try {
        const { data, error } = await supabaseAdmin
            .from('life_event_locations')
            .insert([{ event_id: eventId, location_id }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        logger.error('Error adding event location:', error, req);
        res.status(500).json({ error: error.message });
    }
};

// Remove location from life event
exports.removeEventLocation = async (req, res) => {
    const { eventId, locationId } = req.params;

    try {
        const { error } = await supabaseAdmin
            .from('life_event_locations')
            .delete()
            .eq('event_id', eventId)
            .eq('location_id', locationId);

        if (error) throw error;
        res.status(204).send();
    } catch (error) {
        logger.error('Error removing event location:', error, req);
        res.status(500).json({ error: error.message });
    }
};
