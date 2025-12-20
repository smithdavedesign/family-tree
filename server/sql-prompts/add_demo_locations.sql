-- Sample Locations for Demo Tree
-- Run this in your Supabase SQL editor to add sample location data

-- First, let's create some sample locations
INSERT INTO locations (id, name, address, latitude, longitude, start_date, end_date, notes)
VALUES 
    -- Cities
    ('550e8400-e29b-41d4-a716-446655440001', 'New York City', 'Manhattan, New York, NY', 40.7128, -74.0060, NULL, NULL, 'The Big Apple'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Paris, France', 'Île-de-France, France', 48.8566, 2.3522, NULL, NULL, 'City of Light'),
    ('550e8400-e29b-41d4-a716-446655440003', 'London, England', 'Greater London, UK', 51.5074, -0.1278, NULL, NULL, 'Historic capital'),
    ('550e8400-e29b-41d4-a716-446655440004', 'Tokyo, Japan', 'Kanto Region, Japan', 35.6762, 139.6503, NULL, NULL, 'Modern metropolis'),
    ('550e8400-e29b-41d4-a716-446655440005', 'San Francisco, CA', 'California, USA', 37.7749, -122.4194, NULL, NULL, 'Golden Gate City'),
    
    -- Specific landmarks
    ('550e8400-e29b-41d4-a716-446655440006', 'Eiffel Tower', 'Champ de Mars, Paris', 48.8584, 2.2945, NULL, NULL, 'Iconic French monument'),
    ('550e8400-e29b-41d4-a716-446655440007', 'Central Park', 'Manhattan, New York', 40.7851, -73.9683, NULL, NULL, 'Urban oasis'),
    ('550e8400-e29b-41d4-a716-446655440008', 'Golden Gate Bridge', 'San Francisco, CA', 37.8199, -122.4783, NULL, NULL, 'Suspension bridge'),
    
    -- Historical places
    ('550e8400-e29b-41d4-a716-446655440009', 'Ellis Island', 'New York Harbor', 40.6995, -74.0396, NULL, NULL, 'Immigration gateway'),
    ('550e8400-e29b-41d4-a716-446655440010', 'Brooklyn, NY', 'Brooklyn, New York', 40.6782, -73.9442, NULL, NULL, 'Historic borough')
ON CONFLICT (id) DO NOTHING;

-- Link locations to existing stories
INSERT INTO story_locations (story_id, location_id)
SELECT 
    s.id as story_id,
    '550e8400-e29b-41d4-a716-446655440001' as location_id
FROM (
    SELECT id FROM stories 
    WHERE title ILIKE '%family%' OR title ILIKE '%reunion%'
    LIMIT 1
) s
ON CONFLICT DO NOTHING;

INSERT INTO story_locations (story_id, location_id)
SELECT 
    s.id as story_id,
    '550e8400-e29b-41d4-a716-446655440002' as location_id
FROM (
    SELECT id FROM stories 
    WHERE title ILIKE '%trip%' OR title ILIKE '%vacation%'
    LIMIT 1
) s
ON CONFLICT DO NOTHING;

-- Link locations to people (Places Lived/Visited)
INSERT INTO person_locations (person_id, location_id, start_date, end_date, notes)
SELECT 
    p.id as person_id,
    '550e8400-e29b-41d4-a716-446655440001' as location_id,
    '1950-01-01'::date as start_date,
    '1970-12-31'::date as end_date,
    'Lived in NYC for 20 years'
FROM (SELECT id FROM persons LIMIT 1) p
ON CONFLICT DO NOTHING;

INSERT INTO person_locations (person_id, location_id, start_date, end_date, notes)
SELECT 
    p.id as person_id,
    '550e8400-e29b-41d4-a716-446655440005' as location_id,
    '1975-01-01'::date as start_date,
    NULL as end_date,
    'Moved to San Francisco'
FROM (SELECT id FROM persons LIMIT 1) p
ON CONFLICT DO NOTHING;

-- Verify the data
SELECT 
    'Locations Created' as status,
    COUNT(*) as count
FROM locations;

SELECT 
    'Story-Location Links' as status,
    COUNT(*) as count
FROM story_locations;

SELECT 
    'Person-Location Links' as status,
    COUNT(*) as count
FROM person_locations;
