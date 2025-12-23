const { supabaseAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

exports.createStory = async (req, res) => {
    const { tree_id, title, content, person_ids = [], photo_ids = [] } = req.body;

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

        // Link photos to the story
        if (photo_ids.length > 0) {
            const storyPhotoInserts = photo_ids.map((photo_id, index) => ({
                story_id: story.id,
                photo_id,
                order: index
            }));

            const { error: photoLinkError } = await supabaseAdmin
                .from('story_photos')
                .insert(storyPhotoInserts);

            if (photoLinkError) throw photoLinkError;
        }

        res.status(201).json(story);
    } catch (error) {
        logger.error('Error creating story:', error, req);
        res.status(500).json({ error: error.message });
    }
};

exports.getStories = async (req, res) => {
    const { tree_id, person_id, photo_id } = req.query;

    try {
        let query = supabaseAdmin
            .from('stories')
            .select(`
                *,
                story_locations (
                    locations (
                        id,
                        name,
                        address,
                        latitude,
                        longitude
                    )
                )
            `);

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

        if (photo_id) {
            // Get stories linked to this photo
            const { data: storyIds, error: linkError } = await supabaseAdmin
                .from('story_photos')
                .select('story_id')
                .eq('photo_id', photo_id);

            if (linkError) throw linkError;

            const ids = storyIds.map(sp => sp.story_id);
            query = query.in('id', ids);
        }

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;

        // Transform the data to flatten locations
        const storiesWithLocations = data.map(story => ({
            ...story,
            locations: story.story_locations?.map(sl => sl.locations).filter(Boolean) || []
        }));

        // Remove the story_locations join field
        storiesWithLocations.forEach(story => delete story.story_locations);

        res.json(storiesWithLocations);
    } catch (error) {
        logger.error('Error fetching stories:', error, req);
        res.status(500).json({ error: error.message });
    }
};

exports.getStory = async (req, res) => {
    const { id } = req.params;

    try {
        const { data: story, error: storyError } = await supabaseAdmin
            .from('stories')
            .select('*, trees(name)')
            .eq('id', id)
            .single();

        if (storyError) throw storyError;

        // Flatten tree name
        if (story.trees) {
            story.tree_name = story.trees.name;
            delete story.trees;
        }

        // Get linked people
        const { data: people, error: peopleError } = await supabaseAdmin
            .from('story_people')
            .select('person_id, persons(id, first_name, last_name, profile_photo_url)')
            .eq('story_id', id);

        if (peopleError) throw peopleError;

        story.linked_people = people.map(p => p.persons);

        // Get linked photos
        const { data: photos, error: photosError } = await supabaseAdmin
            .from('story_photos')
            .select('photo_id, photos(*)')
            .eq('story_id', id)
            .order('order', { ascending: true });

        if (photosError) throw photosError;

        story.linked_photos = photos.map(p => p.photos);

        // Get linked locations
        const { data: locationLinks, error: locationsError } = await supabaseAdmin
            .from('story_locations')
            .select('location_id, locations(*)')
            .eq('story_id', id);

        if (locationsError) throw locationsError;

        story.locations = locationLinks?.map(l => l.locations).filter(Boolean) || [];

        res.json(story);
    } catch (error) {
        logger.error('Error fetching story:', error, req);
        res.status(500).json({ error: error.message });
    }
};

exports.updateStory = async (req, res) => {
    const { id } = req.params;
    const { title, content, person_ids, photo_ids } = req.body;

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

        // Update linked photos if provided
        if (photo_ids !== undefined) {
            // Delete existing links
            await supabaseAdmin
                .from('story_photos')
                .delete()
                .eq('story_id', id);

            // Insert new links
            if (photo_ids.length > 0) {
                const storyPhotoInserts = photo_ids.map((photo_id, index) => ({
                    story_id: id,
                    photo_id,
                    order: index
                }));

                const { error: photoLinkError } = await supabaseAdmin
                    .from('story_photos')
                    .insert(storyPhotoInserts);

                if (photoLinkError) throw photoLinkError;
            }
        }

        res.json(story);
    } catch (error) {
        logger.error('Error updating story:', error, req);
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
        logger.error('Error deleting story:', error, req);
        res.status(500).json({ error: error.message });
    }
};
