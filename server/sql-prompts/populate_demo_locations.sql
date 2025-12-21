-- Variable for the demo tree ID (replace with actual ID if known, or use subquery)
-- Assuming we are working with the first tree found for the user (or a specific demo tree)
DO $$
DECLARE
    v_tree_id UUID;
    v_person_id UUID;
    v_story_id UUID;
    v_photo_id UUID;
    
    -- Location IDs
    v_loc_ny UUID := uuid_generate_v4();
    v_loc_paris UUID := uuid_generate_v4();
    v_loc_london UUID := uuid_generate_v4();
    v_loc_sf UUID := uuid_generate_v4();
    v_loc_tokyo UUID := uuid_generate_v4();
    v_loc_rome UUID := uuid_generate_v4();
    v_loc_sydney UUID := uuid_generate_v4();
    v_loc_berlin UUID := uuid_generate_v4();
    
BEGIN
    -- Get a tree ID (grab the first one created, likely the demo tree)
    SELECT id INTO v_tree_id FROM trees LIMIT 1;
    
    IF v_tree_id IS NULL THEN
        RAISE NOTICE 'No tree found to populate.';
        RETURN;
    END IF;

    RAISE NOTICE 'Populating locations for Tree ID: %', v_tree_id;

    -- 1. Insert Locations into 'locations' table
    INSERT INTO locations (id, name, address, latitude, longitude, notes) VALUES
    (v_loc_ny, 'New York, USA', 'New York, NY, USA', 40.7128, -74.0060, 'The Big Apple'),
    (v_loc_paris, 'Paris, France', 'Paris, France', 48.8566, 2.3522, 'City of Lights'),
    (v_loc_london, 'London, UK', 'London, United Kingdom', 51.5074, -0.1278, 'Capital of England'),
    (v_loc_sf, 'San Francisco, USA', 'San Francisco, CA, USA', 37.7749, -122.4194, 'The Golden Gate City'),
    (v_loc_tokyo, 'Tokyo, Japan', 'Tokyo, Japan', 35.6762, 139.6503, 'Capital of Japan'),
    (v_loc_rome, 'Rome, Italy', 'Rome, Italy', 41.9028, 12.4964, 'The Eternal City'),
    (v_loc_sydney, 'Sydney, Australia', 'Sydney, NSW, Australia', -33.8688, 151.2093, 'Harbour City'),
    (v_loc_berlin, 'Berlin, Germany', 'Berlin, Germany', 52.5200, 13.4050, 'Capital of Germany')
    ON CONFLICT (id) DO NOTHING; -- Should not conflict as IDs are generated, but good practice

    -- 2. Update Persons (Vitals: POB, POD, Burial)
    -- Update ~70% of persons with location data
    
    -- New York for some
    UPDATE persons SET pob = 'New York, USA', place_of_death = 'New York, USA', burial_place = 'Trinity Church Cemetery, NY'
    WHERE tree_id = v_tree_id AND id IN (SELECT id FROM persons WHERE tree_id = v_tree_id LIMIT 3);
    
    -- London for others
    UPDATE persons SET pob = 'London, UK', place_of_death = 'London, UK', burial_place = 'Highgate Cemetery, London'
    WHERE tree_id = v_tree_id AND id IN (SELECT id FROM persons WHERE tree_id = v_tree_id OFFSET 3 LIMIT 3);

    -- Random mix for others
    UPDATE persons SET pob = 'Paris, France' WHERE tree_id = v_tree_id AND id IN (SELECT id FROM persons WHERE tree_id = v_tree_id OFFSET 6 LIMIT 2);
    UPDATE persons SET pob = 'San Francisco, USA' WHERE tree_id = v_tree_id AND id IN (SELECT id FROM persons WHERE tree_id = v_tree_id OFFSET 8 LIMIT 2);
    
    
    -- 3. Update Photos (Geo-tagging)
    -- Assign locations to existing photos randomly
    
    -- Photos in NY
    UPDATE photos SET location_name = 'New York, USA', latitude = 40.7128, longitude = -74.0060
    WHERE id IN (SELECT id FROM photos WHERE person_id IN (SELECT id FROM persons WHERE tree_id = v_tree_id) LIMIT 3);

    -- Photos in Paris
    UPDATE photos SET location_name = 'Paris, France', latitude = 48.8566, longitude = 2.3522
    WHERE id IN (SELECT id FROM photos WHERE person_id IN (SELECT id FROM persons WHERE tree_id = v_tree_id) OFFSET 3 LIMIT 3);

    -- Photos in Tokyo
    UPDATE photos SET location_name = 'Tokyo, Japan', latitude = 35.6762, longitude = 139.6503
    WHERE id IN (SELECT id FROM photos WHERE person_id IN (SELECT id FROM persons WHERE tree_id = v_tree_id) OFFSET 6 LIMIT 2);


    -- 4. Update Life Events (Location String matches Name)
    UPDATE life_events SET location = 'New York, USA' 
    WHERE person_id IN (SELECT id FROM persons WHERE tree_id = v_tree_id) AND title LIKE '%Birth%' OR title LIKE '%Born%';

    UPDATE life_events SET location = 'London, UK' 
    WHERE person_id IN (SELECT id FROM persons WHERE tree_id = v_tree_id) AND title LIKE '%Death%' OR title LIKE '%Died%';
    
    UPDATE life_events SET location = 'Paris, France' 
    WHERE person_id IN (SELECT id FROM persons WHERE tree_id = v_tree_id) AND title LIKE '%Marriage%';


    -- 5. Create 'Places Lived' (person_locations)
    -- Link key people to locations (NY, London, SF)
    
    FOR v_person_id IN SELECT id FROM persons WHERE tree_id = v_tree_id LIMIT 5 LOOP
        -- Add a 'Lived in NY' entry
        INSERT INTO person_locations (person_id, location_id, start_date, end_date, notes)
        VALUES (v_person_id, v_loc_ny, '1980-01-01', '1990-01-01', 'Lived in Manhattan')
        ON CONFLICT DO NOTHING;
        
        -- Add a 'Lived in London' entry
        INSERT INTO person_locations (person_id, location_id, start_date, end_date, notes)
        VALUES (v_person_id, v_loc_london, '1990-02-01', '2000-01-01', 'Moved for work')
        ON CONFLICT DO NOTHING;
    END LOOP;


    -- 6. Link Stories to Locations
    -- Link random stories to locations
    FOR v_story_id IN SELECT id FROM stories WHERE tree_id = v_tree_id LIMIT 5 LOOP
        INSERT INTO story_locations (story_id, location_id)
        VALUES (v_story_id, v_loc_paris)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR v_story_id IN SELECT id FROM stories WHERE tree_id = v_tree_id OFFSET 5 LIMIT 3 LOOP
        INSERT INTO story_locations (story_id, location_id)
        VALUES (v_story_id, v_loc_sf)
        ON CONFLICT DO NOTHING;
    END LOOP;

    RAISE NOTICE 'Demo locations populated successfully!';

END $$;
