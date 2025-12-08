-- ============================================================================
-- DEMO TREE ENRICHMENT PART 3: PHOTO MAP DATA
-- ============================================================================
-- This script adds dummy photos with geolocation data to test the Photo Map view.
-- It inserts into the 'photos' table, which supports metadata like lat/long.
-- ============================================================================

DO $$
DECLARE
    demo_tree_id UUID;
    
    -- Person IDs
    p_james UUID;
    p_mary UUID;
    p_robert UUID;
    p_patricia UUID;
    p_michael UUID;
    p_linda UUID;
    p_david UUID;
    p_barbara UUID;

BEGIN
    -- 1. Get Tree ID
    SELECT id INTO demo_tree_id FROM trees WHERE name = 'Demo Family Tree' LIMIT 1;
    
    IF demo_tree_id IS NULL THEN
        RAISE NOTICE 'Demo Family Tree not found. Please run seed script first.';
        RETURN;
    END IF;

    -- 2. Get Person IDs
    SELECT id INTO p_james FROM persons WHERE tree_id = demo_tree_id AND first_name = 'James' AND last_name = 'Smith' LIMIT 1;
    SELECT id INTO p_mary FROM persons WHERE tree_id = demo_tree_id AND first_name = 'Mary' AND last_name = 'Smith' LIMIT 1;
    SELECT id INTO p_robert FROM persons WHERE tree_id = demo_tree_id AND first_name = 'Robert' AND last_name = 'Smith' LIMIT 1;
    SELECT id INTO p_patricia FROM persons WHERE tree_id = demo_tree_id AND first_name = 'Patricia' AND last_name = 'Davis' LIMIT 1;
    SELECT id INTO p_michael FROM persons WHERE tree_id = demo_tree_id AND first_name = 'Michael' AND last_name = 'Smith' LIMIT 1;
    SELECT id INTO p_linda FROM persons WHERE tree_id = demo_tree_id AND first_name = 'Linda' AND last_name = 'Jones' LIMIT 1;
    SELECT id INTO p_david FROM persons WHERE tree_id = demo_tree_id AND first_name = 'David' AND last_name = 'Smith' LIMIT 1;
    SELECT id INTO p_barbara FROM persons WHERE tree_id = demo_tree_id AND first_name = 'Barbara' AND last_name = 'Smith' LIMIT 1;

    -- ========================================
    -- INSERT GEOTAGGED PHOTOS
    -- ========================================

    -- James Smith: New York City
    IF p_james IS NOT NULL THEN
        INSERT INTO photos (person_id, url, caption, taken_date, latitude, longitude, location_name, is_primary, created_at) VALUES
        (p_james, 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800', 'Visiting New York', '1955-06-15', 40.7128, -74.0060, 'New York, NY', false, NOW()),
        (p_james, 'https://images.unsplash.com/photo-1534270804882-6b5048b1c1fc?w=800', 'Brooklyn Bridge Walk', '1960-09-10', 40.7061, -73.9969, 'Brooklyn Bridge', false, NOW());
    END IF;

    -- Mary Smith: Central Park
    IF p_mary IS NOT NULL THEN
        INSERT INTO photos (person_id, url, caption, taken_date, latitude, longitude, location_name, is_primary, created_at) VALUES
        (p_mary, 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800', 'Sunday in the Park', '1958-05-20', 40.785091, -73.968285, 'Central Park, NY', false, NOW());
    END IF;

    -- Robert Smith: San Francisco
    IF p_robert IS NOT NULL THEN
        INSERT INTO photos (person_id, url, caption, taken_date, latitude, longitude, location_name, is_primary, created_at) VALUES
        (p_robert, 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800', 'Golden Gate Bridge', '1975-07-04', 37.8199, -122.4783, 'San Francisco, CA', false, NOW()),
        (p_robert, 'https://images.unsplash.com/photo-1521464302861-ce943915d1c3?w=800', 'Fisherman''s Wharf', '1978-08-15', 37.8080, -122.4177, 'Fisherman''s Wharf, SF', false, NOW());
    END IF;

    -- Patricia Davis: London
    IF p_patricia IS NOT NULL THEN
        INSERT INTO photos (person_id, url, caption, taken_date, latitude, longitude, location_name, is_primary, created_at) VALUES
        (p_patricia, 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800', 'London Trip', '1980-06-01', 51.5007, -0.1246, 'London, UK', false, NOW());
    END IF;

    -- Michael Smith: Paris
    IF p_michael IS NOT NULL THEN
        INSERT INTO photos (person_id, url, caption, taken_date, latitude, longitude, location_name, is_primary, created_at) VALUES
        (p_michael, 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800', 'Eiffel Tower', '1990-04-10', 48.8584, 2.2945, 'Paris, France', false, NOW());
    END IF;

    -- Linda Jones: Rome
    IF p_linda IS NOT NULL THEN
        INSERT INTO photos (person_id, url, caption, taken_date, latitude, longitude, location_name, is_primary, created_at) VALUES
        (p_linda, 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', 'Roman Holiday', '1995-09-20', 41.8902, 12.4922, 'Rome, Italy', false, NOW());
    END IF;

    -- David Smith: Chicago
    IF p_david IS NOT NULL THEN
        INSERT INTO photos (person_id, url, caption, taken_date, latitude, longitude, location_name, is_primary, created_at) VALUES
        (p_david, 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=800', 'Windy City', '2005-10-15', 41.8781, -87.6298, 'Chicago, IL', false, NOW());
    END IF;

    -- Barbara Smith: Seattle
    IF p_barbara IS NOT NULL THEN
        INSERT INTO photos (person_id, url, caption, taken_date, latitude, longitude, location_name, is_primary, created_at) VALUES
        (p_barbara, 'https://images.unsplash.com/photo-1502175353174-a7a70e73b362?w=800', 'Space Needle', '2010-07-22', 47.6205, -122.3493, 'Seattle, WA', false, NOW());
    END IF;

    RAISE NOTICE 'Enrichment Part 3 (Photo Map) Complete!';
END $$;
