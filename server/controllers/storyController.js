const { supabaseAdmin } = require('../middleware/auth');

exports.createStory = async (req, res) => {
    const { tree_id, title, content, person_ids = [] } = req.body;

    try {
        // Create the story
        const { data: story, error: storyError } = await supabaseAdmin
            .from('stories')
            .insert([{
                tree_id,
                author_id: req.user.id,
                title,
                content
            }])
            .select()
            .single();

        if (storyError) throw storyError;

        // Link people to the story
        if (person_ids.length > 0) {
            const storyPeopleInserts = person_ids.map(person_id => ({
                story_id: story.id,
                person_id
            }));

            const { error: linkError } = await supabaseAdmin
                .from('story_people')
                .insert(storyPeopleInserts);

            if (linkError) throw linkError;
        }

        res.status(201).json(story);
    } catch (error) {
        console.error('Error creating story:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getStories = async (req, res) => {
    const { tree_id, person_id } = req.query;

    try {
        let query = supabaseAdmin
            .from('stories')
            .select('*');

        if (tree_id) {
            query = query.eq('tree_id', tree_id);
        }

        if (person_id) {
            // Get stories linked to this person
            const { data: storyIds, error: linkError } = await supabaseAdmin
                .from('story_people')
                .select('story_id')
                .eq('person_id', person_id);

            if (linkError) throw linkError;

            const ids = storyIds.map(sp => sp.story_id);
            query = query.in('id', ids);
        }

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error fetching stories:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getStory = async (req, res) => {
    const { id } = req.params;

    try {
        const { data: story, error: storyError } = await supabaseAdmin
            .from('stories')
            .select('*')
            .eq('id', id)
            .single();

        if (storyError) throw storyError;

        // Get linked people
        const { data: people, error: peopleError } = await supabaseAdmin
            .from('story_people')
            .select('person_id, persons(id, first_name, last_name)')
            .eq('story_id', id);

        if (peopleError) throw peopleError;

        story.linked_people = people.map(p => p.persons);

        res.json(story);
    } catch (error) {
        console.error('Error fetching story:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateStory = async (req, res) => {
    const { id } = req.params;
    const { title, content, person_ids } = req.body;

    try {
        // Update story
        const updates = { updated_at: new Date().toISOString() };
        if (title !== undefined) updates.title = title;
        if (content !== undefined) updates.content = content;

        const { data: story, error: updateError } = await supabaseAdmin
            .from('stories')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        // Update linked people if provided
        if (person_ids !== undefined) {
            // Delete existing links
            await supabaseAdmin
                .from('story_people')
                .delete()
                .eq('story_id', id);

            // Insert new links
            if (person_ids.length > 0) {
                const storyPeopleInserts = person_ids.map(person_id => ({
                    story_id: id,
                    person_id
                }));

                const { error: linkError } = await supabaseAdmin
                    .from('story_people')
                    .insert(storyPeopleInserts);

                if (linkError) throw linkError;
            }
        }

        res.json(story);
    } catch (error) {
        console.error('Error updating story:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteStory = async (req, res) => {
    const { id } = req.params;

    try {
        const { error } = await supabaseAdmin
            .from('stories')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Story deleted successfully' });
    } catch (error) {
        console.error('Error deleting story:', error);
        res.status(500).json({ error: error.message });
    }
};
