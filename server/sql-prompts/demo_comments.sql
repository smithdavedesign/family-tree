-- Demo Comments Script
-- Adds sample comments to the Demo Family Tree
-- Run this AFTER running demo_tree_seed.sql and demo_tree_enrichment.sql

DO $$
DECLARE
    demo_user_id UUID;
    demo_tree_id UUID;
    
    -- People IDs
    p_james UUID;
    p_mary UUID;
    p_john UUID;
    
    -- Story IDs
    s_pie_contest UUID;
    s_fishing_trip UUID;
    
    -- Photo IDs
    ph_james_1 UUID;
    ph_mary_1 UUID;
    
BEGIN
    -- 1. Get User ID
    SELECT id INTO demo_user_id
    FROM auth.users
    WHERE email = '1426davejobs@gmail.com'
    LIMIT 1;
    
    IF demo_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- 2. Get Tree ID
    SELECT id INTO demo_tree_id
    FROM trees
    WHERE owner_id = demo_user_id AND name = 'Demo Family Tree'
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF demo_tree_id IS NULL THEN
        RAISE EXCEPTION 'Demo Family Tree not found';
    END IF;
    
    RAISE NOTICE 'Adding comments to Tree ID: %', demo_tree_id;

    -- 3. Get People
    SELECT id INTO p_james FROM persons WHERE tree_id = demo_tree_id AND first_name = 'James' AND last_name = 'Smith' LIMIT 1;
    SELECT id INTO p_mary FROM persons WHERE tree_id = demo_tree_id AND first_name = 'Mary' AND last_name = 'Johnson' LIMIT 1;
    SELECT id INTO p_john FROM persons WHERE tree_id = demo_tree_id AND first_name = 'John' AND last_name = 'Smith' LIMIT 1;

    -- 4. Get Stories
    SELECT id INTO s_pie_contest FROM stories WHERE tree_id = demo_tree_id AND title = 'The Great County Fair Pie Contest of 1955' LIMIT 1;
    SELECT id INTO s_fishing_trip FROM stories WHERE tree_id = demo_tree_id AND title LIKE 'The One That Didn%' LIMIT 1;

    -- 5. Get Photos (Pick first photo for James and Mary)
    SELECT id INTO ph_james_1 FROM media WHERE person_id = p_james AND type = 'image' LIMIT 1;
    SELECT id INTO ph_mary_1 FROM media WHERE person_id = p_mary AND type = 'image' LIMIT 1;

    -- ========================================
    -- ADD COMMENTS
    -- ========================================

    -- Comments on Stories
    IF s_pie_contest IS NOT NULL THEN
        INSERT INTO comments (tree_id, user_id, resource_type, resource_id, content, created_at) VALUES
        (demo_tree_id, demo_user_id, 'story', s_pie_contest, 'I can still taste that apple pie! Best I ever had.', NOW() - INTERVAL '2 days'),
        (demo_tree_id, demo_user_id, 'story', s_pie_contest, 'Does anyone have the recipe written down somewhere?', NOW() - INTERVAL '1 day');
    END IF;

    IF s_fishing_trip IS NOT NULL THEN
        INSERT INTO comments (tree_id, user_id, resource_type, resource_id, content, created_at) VALUES
        (demo_tree_id, demo_user_id, 'story', s_fishing_trip, 'Look at the size of that fish! Uncle John looks so proud.', NOW() - INTERVAL '5 days');
    END IF;

    -- Comments on Photos
    IF ph_james_1 IS NOT NULL THEN
        INSERT INTO comments (tree_id, user_id, resource_type, resource_id, content, created_at) VALUES
        (demo_tree_id, demo_user_id, 'photo', ph_james_1, 'Grandpa looking sharp in his uniform.', NOW() - INTERVAL '1 week'),
        (demo_tree_id, demo_user_id, 'photo', ph_james_1, 'I think this was taken right before he deployed.', NOW() - INTERVAL '6 days');
    END IF;

    IF ph_mary_1 IS NOT NULL THEN
        INSERT INTO comments (tree_id, user_id, resource_type, resource_id, content, created_at) VALUES
        (demo_tree_id, demo_user_id, 'photo', ph_mary_1, 'Such a beautiful smile.', NOW() - INTERVAL '3 days');
    END IF;

    -- Comments on People (if we supported it, but schema supports it)
    -- Let's add one to James profile
    INSERT INTO comments (tree_id, user_id, resource_type, resource_id, content, created_at) VALUES
    (demo_tree_id, demo_user_id, 'person', p_james, 'We miss you everyday, Grandpa.', NOW() - INTERVAL '1 month');

    RAISE NOTICE 'Added comments successfully!';
END $$;
