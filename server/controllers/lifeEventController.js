const { supabaseAdmin } = require('../middleware/auth');
const Joi = require('joi');

// Validation schema
const eventSchema = Joi.object({
    event_type: Joi.string().required().max(50),
    title: Joi.string().required().max(255),
    date: Joi.string().isoDate().allow(null, ''),
    start_date: Joi.string().isoDate().allow(null, ''),
    end_date: Joi.string().isoDate().allow(null, ''),
    location: Joi.string().max(255).allow(null, ''),
    description: Joi.string().allow(null, ''),
    media_ids: Joi.array().items(Joi.string().uuid()).default([])
});

exports.getPersonEvents = async (req, res) => {
    const { id } = req.params;

    try {
        const { data: events, error } = await supabaseAdmin
            .from('life_events')
            .select('*')
            .eq('person_id', id)
            .order('date', { ascending: true })
            .order('start_date', { ascending: true });

        if (error) throw error;

        // Collect all media IDs
        const allMediaIds = events.reduce((acc, event) => {
            if (event.media_ids && Array.isArray(event.media_ids)) {
                return [...acc, ...event.media_ids];
            }
            return acc;
        }, []);

        if (allMediaIds.length > 0) {
            // Fetch photos
            const { data: photos, error: photosError } = await supabaseAdmin
                .from('photos')
                .select('*')
                .in('id', allMediaIds);

            if (photosError) throw photosError;

            // Map photos to events
            const photosMap = photos.reduce((acc, photo) => {
                acc[photo.id] = photo;
                return acc;
            }, {});

            events.forEach(event => {
                if (event.media_ids && Array.isArray(event.media_ids)) {
                    event.photos = event.media_ids.map(id => photosMap[id]).filter(Boolean);
                } else {
                    event.photos = [];
                }
            });
        } else {
            events.forEach(event => {
                event.photos = [];
            });
        }

        res.json(events);
    } catch (error) {
        console.error('Error fetching life events:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.addEvent = async (req, res) => {
    const { id } = req.params;
    console.log('Adding event for person:', id, 'Body:', req.body);

    const { error: validationError, value } = eventSchema.validate(req.body);

    if (validationError) {
        console.error('Validation error:', validationError.details[0].message);
        return res.status(400).json({ error: validationError.details[0].message });
    }

    // Sanitize empty strings to null for dates
    const payload = { ...value };
    if (payload.date === '') payload.date = null;
    if (payload.start_date === '') payload.start_date = null;
    if (payload.end_date === '') payload.end_date = null;

    try {
        const { data, error } = await supabaseAdmin
            .from('life_events')
            .insert([{ ...payload, person_id: id }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('Error adding life event:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateEvent = async (req, res) => {
    const { id } = req.params;
    const { error: validationError, value } = eventSchema.validate(req.body);

    if (validationError) {
        return res.status(400).json({ error: validationError.details[0].message });
    }

    try {
        // Sanitize empty strings to null for dates
        const payload = { ...value };
        if (payload.date === '') payload.date = null;
        if (payload.start_date === '') payload.start_date = null;
        if (payload.end_date === '') payload.end_date = null;

        const { data, error } = await supabaseAdmin
            .from('life_events')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json(data);
    } catch (error) {
        console.error('Error updating life event:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteEvent = async (req, res) => {
    const { id } = req.params;

    try {
        const { error } = await supabaseAdmin
            .from('life_events')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting life event:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getEventsForPhoto = async (req, res) => {
    const { id } = req.params; // photo_id

    try {
        // Find events where media_ids contains the photo ID
        const { data, error } = await supabaseAdmin
            .from('life_events')
            .select('*')
            .contains('media_ids', [id])
            .order('date', { ascending: true });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error fetching events for photo:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getTreeEvents = async (req, res) => {
    const { id } = req.params; // tree_id

    try {
        const { data, error } = await supabaseAdmin
            .from('life_events')
            .select('*, persons!inner(tree_id)')
            .eq('persons.tree_id', id)
            .order('date', { ascending: true });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error fetching tree events:', error);
        res.status(500).json({ error: error.message });
    }
};
