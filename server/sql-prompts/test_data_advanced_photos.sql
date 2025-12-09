-- Test Data for Advanced Photo Features
-- Populates photos and links them to stories and events for the Demo Family Tree
-- Run this AFTER running demo_tree_seed.sql

DO $$
DECLARE
    v_tree_id UUID;
    v_james_id UUID;
    v_william_id UUID;
    v_john_id UUID;
    
    -- Photo IDs
    v_photo_reunion UUID;
    v_photo_james_war UUID;
    v_photo_john_grad UUID;
    
    -- Story IDs
    v_story_reunion UUID;
    v_story_war UUID;
    
    -- Event IDs
    v_event_james_enlist UUID;
    v_event_john_grad UUID;

BEGIN
    -- 1. Find the Demo Tree and People
    SELECT id INTO v_tree_id FROM trees WHERE name = 'Demo Family Tree' LIMIT 1;
    
    IF v_tree_id IS NULL THEN
        RAISE NOTICE 'Demo Family Tree not found. Please run demo_tree_seed.sql first.';
        RETURN;
    END IF;

    SELECT id INTO v_james_id FROM persons WHERE tree_id = v_tree_id AND first_name = 'James' AND last_name = 'Smith' LIMIT 1;
    SELECT id INTO v_william_id FROM persons WHERE tree_id = v_tree_id AND first_name = 'William' AND last_name = 'Smith' LIMIT 1;
    SELECT id INTO v_john_id FROM persons WHERE tree_id = v_tree_id AND first_name = 'John' AND last_name = 'Smith' LIMIT 1;

    -- 2. Insert Test Photos
    
    -- Photo 1: Family Reunion (for William)
    INSERT INTO photos (person_id, url, caption, taken_date, location_name, is_primary)
    VALUES (
        v_william_id,
        'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&auto=format&fit=crop&q=60',
        'Smith Family Reunion 2015 Group Photo',
        '2015-07-04',
        'Houston, TX',
        false
    ) RETURNING id INTO v_photo_reunion;

    -- Photo 2: James in Uniform (for James)
    INSERT INTO photos (person_id, url, caption, taken_date, location_name, is_primary)
    VALUES (
        v_james_id,
        'https://images.unsplash.com/photo-1579912437766-79b7b0524a6e?w=800&auto=format&fit=crop&q=60',
        'James in Uniform - 1942',
        '1942-06-15',
        'New York, NY',
        false
    ) RETURNING id INTO v_photo_james_war;

    -- Photo 3: John Graduation (for John)
    INSERT INTO photos (person_id, url, caption, taken_date, location_name, is_primary)
    VALUES (
        v_john_id,
        'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=60',
        'MIT Graduation Day',
        '1967-06-15',
        'Cambridge, MA',
        false
    ) RETURNING id INTO v_photo_john_grad;

    -- 3. Link Photos to Stories
    
    -- Link Reunion Photo to Reunion Story
    SELECT id INTO v_story_reunion FROM stories WHERE tree_id = v_tree_id AND title = 'The Great Family Reunion of 2015' LIMIT 1;
    
    IF v_story_reunion IS NOT NULL THEN
        INSERT INTO story_photos (story_id, photo_id) VALUES (v_story_reunion, v_photo_reunion)
        ON CONFLICT DO NOTHING;
        RAISE NOTICE 'Linked photo to Reunion story';
    END IF;

    -- Link War Photo to War Story
    SELECT id INTO v_story_war FROM stories WHERE tree_id = v_tree_id AND title = 'Grandpa James'' War Stories' LIMIT 1;
    
    IF v_story_war IS NOT NULL THEN
        INSERT INTO story_photos (story_id, photo_id) VALUES (v_story_war, v_photo_james_war)
        ON CONFLICT DO NOTHING;
        RAISE NOTICE 'Linked photo to War story';
    END IF;

    -- 4. Link Photos to Life Events
    
    -- Link War Photo to James' Enlistment Event
    SELECT id INTO v_event_james_enlist FROM life_events WHERE person_id = v_james_id AND title = 'Enlisted in US Army' LIMIT 1;
    
    IF v_event_james_enlist IS NOT NULL THEN
        UPDATE life_events 
        SET media_ids = array_append(COALESCE(media_ids, '{}'), v_photo_james_war)
        WHERE id = v_event_james_enlist AND NOT (media_ids @> ARRAY[v_photo_james_war]);
        RAISE NOTICE 'Linked photo to James enlistment event';
    END IF;

    -- Link Graduation Photo to John's Graduation Event
    SELECT id INTO v_event_john_grad FROM life_events WHERE person_id = v_john_id AND title = 'MIT Graduation' LIMIT 1;
    
    IF v_event_john_grad IS NOT NULL THEN
        UPDATE life_events 
        SET media_ids = array_append(COALESCE(media_ids, '{}'), v_photo_john_grad)
        WHERE id = v_event_john_grad AND NOT (media_ids @> ARRAY[v_photo_john_grad]);
        RAISE NOTICE 'Linked photo to John graduation event';
    END IF;

    RAISE NOTICE 'Test data setup complete!';
END $$;
