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
    const { personId } = req.params;

    try {
        const { data, error } = await supabaseAdmin
            .from('life_events')
            .select('*')
            .eq('person_id', personId)
            .order('date', { ascending: true })
            .order('start_date', { ascending: true });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error fetching life events:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.addEvent = async (req, res) => {
    const { personId } = req.params;
    const { error: validationError, value } = eventSchema.validate(req.body);

    if (validationError) {
        return res.status(400).json({ error: validationError.details[0].message });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('life_events')
            .insert([{ ...value, person_id: personId }])
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
        const { data, error } = await supabaseAdmin
            .from('life_events')
            .update(value)
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
