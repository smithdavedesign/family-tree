-- Demo Albums with Photos
-- Creates sample albums and populates them with photos for testing
-- Run after demo_tree_enrichment_part4.sql

-- Get the demo tree ID
DO $$
DECLARE
    v_tree_id UUID;
    v_user_id UUID;
    v_album_family UUID;
    v_album_wedding UUID;
    v_album_military UUID;
    v_album_childhood UUID;
    v_album_grandparents UUID;
BEGIN
    -- Get the demo tree (assuming it's the first tree)
    SELECT id INTO v_tree_id FROM trees LIMIT 1;
    
    -- Get the tree owner
    SELECT user_id INTO v_user_id 
    FROM tree_members 
    WHERE tree_id = v_tree_id AND role = 'owner' 
    LIMIT 1;

    -- Create Album 1: Family Gatherings
    INSERT INTO albums (tree_id, name, description, is_private, created_by)
    VALUES (
        v_tree_id,
        'Family Gatherings',
        'Special moments from family reunions, holidays, and celebrations over the years',
        false,
        v_user_id
    )
    RETURNING id INTO v_album_family;

    -- Create Album 2: Wedding Memories
    INSERT INTO albums (tree_id, name, description, is_private, created_by)
    VALUES (
        v_tree_id,
        'Wedding Memories',
        'Beautiful wedding photos from family members throughout the generations',
        false,
        v_user_id
    )
    RETURNING id INTO v_album_wedding;

    -- Create Album 3: Military Service
    INSERT INTO albums (tree_id, name, description, is_private, created_by)
    VALUES (
        v_tree_id,
        'Military Service',
        'Honoring our family members who served in the armed forces',
        false,
        v_user_id
    )
    RETURNING id INTO v_album_military;

    -- Create Album 4: Childhood Years
    INSERT INTO albums (tree_id, name, description, is_private, created_by)
    VALUES (
        v_tree_id,
        'Childhood Years',
        'Sweet memories from the early years of family members',
        false,
        v_user_id
    )
    RETURNING id INTO v_album_childhood;

    -- Create Album 5: Grandparents Legacy (Private)
    INSERT INTO albums (tree_id, name, description, is_private, created_by)
    VALUES (
        v_tree_id,
        'Grandparents Legacy',
        'Special collection of photos honoring our grandparents',
        true,
        v_user_id
    )
    RETURNING id INTO v_album_grandparents;

    -- Add photos to albums
    -- Note: This assumes photos already exist from previous enrichment scripts
    -- We'll add them based on date ranges and themes
    
    -- Family Gatherings: Add photos from various years (10 photos)
    INSERT INTO album_photos (album_id, photo_id, sort_order, added_by)
    SELECT 
        v_album_family,
        id,
        ROW_NUMBER() OVER (ORDER BY taken_date),
        v_user_id
    FROM photos
    WHERE tree_id = v_tree_id
    AND taken_date IS NOT NULL
    ORDER BY RANDOM()
    LIMIT 10;

    -- Wedding Memories: Add photos likely from weddings (8 photos)
    INSERT INTO album_photos (album_id, photo_id, sort_order, added_by)
    SELECT 
        v_album_wedding,
        id,
        ROW_NUMBER() OVER (ORDER BY taken_date),
        v_user_id
    FROM photos
    WHERE tree_id = v_tree_id
    AND (caption ILIKE '%wedding%' OR caption ILIKE '%married%' OR EXTRACT(MONTH FROM taken_date) IN (6, 7, 8, 9))
    ORDER BY RANDOM()
    LIMIT 8;

    -- Military Service: Add photos from 1940s-1950s (6 photos)
    INSERT INTO album_photos (album_id, photo_id, sort_order, added_by)
    SELECT 
        v_album_military,
        id,
        ROW_NUMBER() OVER (ORDER BY taken_date),
        v_user_id
    FROM photos
    WHERE tree_id = v_tree_id
    AND EXTRACT(YEAR FROM taken_date) BETWEEN 1940 AND 1960
    ORDER BY RANDOM()
    LIMIT 6;

    -- Childhood Years: Add older photos (12 photos)
    INSERT INTO album_photos (album_id, photo_id, sort_order, added_by)
    SELECT 
        v_album_childhood,
        id,
        ROW_NUMBER() OVER (ORDER BY taken_date),
        v_user_id
    FROM photos
    WHERE tree_id = v_tree_id
    AND EXTRACT(YEAR FROM taken_date) < 1970
    ORDER BY RANDOM()
    LIMIT 12;

    -- Grandparents Legacy: Add oldest photos (15 photos)
    INSERT INTO album_photos (album_id, photo_id, sort_order, added_by)
    SELECT 
        v_album_grandparents,
        id,
        ROW_NUMBER() OVER (ORDER BY taken_date),
        v_user_id
    FROM photos
    WHERE tree_id = v_tree_id
    AND EXTRACT(YEAR FROM taken_date) < 1950
    ORDER BY RANDOM()
    LIMIT 15;

    -- Set cover photos for albums (use first photo in each)
    UPDATE albums SET cover_photo_id = (
        SELECT photo_id FROM album_photos 
        WHERE album_id = v_album_family AND sort_order = 1
    ) WHERE id = v_album_family;

    UPDATE albums SET cover_photo_id = (
        SELECT photo_id FROM album_photos 
        WHERE album_id = v_album_wedding AND sort_order = 1
    ) WHERE id = v_album_wedding;

    UPDATE albums SET cover_photo_id = (
        SELECT photo_id FROM album_photos 
        WHERE album_id = v_album_military AND sort_order = 1
    ) WHERE id = v_album_military;

    UPDATE albums SET cover_photo_id = (
        SELECT photo_id FROM album_photos 
        WHERE album_id = v_album_childhood AND sort_order = 1
    ) WHERE id = v_album_childhood;

    UPDATE albums SET cover_photo_id = (
        SELECT photo_id FROM album_photos 
        WHERE album_id = v_album_grandparents AND sort_order = 1
    ) WHERE id = v_album_grandparents;

    RAISE NOTICE 'Created 5 albums with photos:';
    RAISE NOTICE '  - Family Gatherings: % photos', (SELECT COUNT(*) FROM album_photos WHERE album_id = v_album_family);
    RAISE NOTICE '  - Wedding Memories: % photos', (SELECT COUNT(*) FROM album_photos WHERE album_id = v_album_wedding);
    RAISE NOTICE '  - Military Service: % photos', (SELECT COUNT(*) FROM album_photos WHERE album_id = v_album_military);
    RAISE NOTICE '  - Childhood Years: % photos', (SELECT COUNT(*) FROM album_photos WHERE album_id = v_album_childhood);
    RAISE NOTICE '  - Grandparents Legacy (Private): % photos', (SELECT COUNT(*) FROM album_photos WHERE album_id = v_album_grandparents);
    
END $$;

-- Verify albums created
SELECT 
    a.name,
    a.description,
    a.is_private,
    COUNT(ap.id) as photo_count,
    a.created_at
FROM albums a
LEFT JOIN album_photos ap ON a.id = ap.album_id
GROUP BY a.id, a.name, a.description, a.is_private, a.created_at
ORDER BY a.created_at;
