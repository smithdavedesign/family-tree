-- Demo Tree Enrichment Script
-- Adds photos, stories, life events, and documents to the existing Demo Family Tree
-- Run this AFTER running demo_tree_seed.sql

DO $$
DECLARE
    demo_user_id UUID;
    demo_tree_id UUID;
    
    -- People IDs
    p_james UUID;
    p_mary UUID;
    p_robert UUID;
    p_patricia UUID;
    p_john UUID;
    p_jennifer UUID;
    p_william UUID;
    p_elizabeth UUID;
    p_joseph UUID;
    p_jessica UUID;
    
    -- Story IDs
    s_pie_contest UUID;
    s_fishing_trip UUID;
    s_secret_recipe UUID;
    
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
        RAISE EXCEPTION 'Demo Family Tree not found. Please run the seed script first.';
    END IF;
    
    RAISE NOTICE 'Enriching Tree ID: %', demo_tree_id;

    -- 3. Get Person IDs
    SELECT id INTO p_james FROM persons WHERE tree_id = demo_tree_id AND first_name = 'James' AND last_name = 'Smith' LIMIT 1;
    SELECT id INTO p_mary FROM persons WHERE tree_id = demo_tree_id AND first_name = 'Mary' AND last_name = 'Johnson' LIMIT 1;
    SELECT id INTO p_robert FROM persons WHERE tree_id = demo_tree_id AND first_name = 'Robert' AND last_name = 'Williams' LIMIT 1;
    SELECT id INTO p_patricia FROM persons WHERE tree_id = demo_tree_id AND first_name = 'Patricia' AND last_name = 'Brown' LIMIT 1;
    SELECT id INTO p_john FROM persons WHERE tree_id = demo_tree_id AND first_name = 'John' AND last_name = 'Smith' LIMIT 1;
    SELECT id INTO p_jennifer FROM persons WHERE tree_id = demo_tree_id AND first_name = 'Jennifer' AND last_name = 'Williams' LIMIT 1;
    SELECT id INTO p_william FROM persons WHERE tree_id = demo_tree_id AND first_name = 'William' AND last_name = 'Smith' LIMIT 1;
    SELECT id INTO p_elizabeth FROM persons WHERE tree_id = demo_tree_id AND first_name = 'Elizabeth' AND last_name = 'Davis' LIMIT 1;
    SELECT id INTO p_joseph FROM persons WHERE tree_id = demo_tree_id AND first_name = 'Joseph' AND last_name = 'Smith' LIMIT 1;
    SELECT id INTO p_jessica FROM persons WHERE tree_id = demo_tree_id AND first_name = 'Jessica' AND last_name = 'Smith' LIMIT 1;

    -- ========================================
    -- UPDATE PROFILE PHOTOS (Gen 1)
    -- ========================================
    
    UPDATE persons SET profile_photo_url = 'https://i.pravatar.cc/300?img=11' WHERE id = p_james;
    UPDATE persons SET profile_photo_url = 'https://i.pravatar.cc/300?img=5' WHERE id = p_mary;
    UPDATE persons SET profile_photo_url = 'https://i.pravatar.cc/300?img=13' WHERE id = p_robert;
    UPDATE persons SET profile_photo_url = 'https://i.pravatar.cc/300?img=24' WHERE id = p_patricia;
    
    RAISE NOTICE 'Updated profile photos for Generation 1';

    -- ========================================
    -- ADD MORE STORIES
    -- ========================================
    
    -- Story 1: The Great Pie Contest
    INSERT INTO stories (tree_id, author_id, title, content)
    VALUES (
        demo_tree_id,
        demo_user_id,
        'The Great County Fair Pie Contest of 1955',
        '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"The Great County Fair Pie Contest of 1955"}]},{"type":"paragraph","content":[{"type":"text","text":"It was a sweltering July day, but Mary was cool as a cucumber. She had been perfecting her apple pie recipe for months, using a secret blend of spices she swore she''d take to her grave."}]},{"type":"paragraph","content":[{"type":"text","text":"Her biggest rival, Mrs. Higgins, had won three years in a row. But this year, Mary had a secret weapon: apples from James''s new orchard."}]},{"type":"paragraph","content":[{"type":"text","text":"When the judges took their first bite, silence fell over the tent. Then, a collective sigh of happiness. Mary didn''t just win; she set a record score that still stands today."}]},{"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"The Blue Ribbon still hangs in our kitchen."}]}]}'
    ) RETURNING id INTO s_pie_contest;
    
    INSERT INTO story_people (story_id, person_id) VALUES (s_pie_contest, p_mary), (s_pie_contest, p_james);

    -- Story 2: The Fishing Trip
    INSERT INTO stories (tree_id, author_id, title, content)
    VALUES (
        demo_tree_id,
        demo_user_id,
        'The One That Didn''t Get Away',
        '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"The One That Didn''t Get Away"}]},{"type":"paragraph","content":[{"type":"text","text":"John and William went fishing every summer at Lake George. Usually, they came back with nothing but mosquito bites and empty coolers."}]},{"type":"paragraph","content":[{"type":"text","text":"But in the summer of ''85, something miraculous happened. William, only 15 at the time, hooked something massive. It took both of them 20 minutes to reel it in."}]},{"type":"paragraph","content":[{"type":"text","text":"It was a 12-pound bass! They were so excited they almost tipped the canoe over. They took a photo that ended up in the local newspaper under the headline ''Local Boy Catches Lake Monster''."}]}]}'
    ) RETURNING id INTO s_fishing_trip;
    
    INSERT INTO story_people (story_id, person_id) VALUES (s_fishing_trip, p_john), (s_fishing_trip, p_william);

    -- ========================================
    -- ADD DETAILED LIFE EVENTS
    -- ========================================

    -- James (Gen 1)
    INSERT INTO life_events (person_id, event_type, title, date, location, description) VALUES
    (p_james, 'education', 'High School Diploma', '1938-06-15', 'New York, NY', 'Graduated top of his class'),
    (p_james, 'residence', 'Bought First Home', '1948-05-01', 'Queens, NY', 'Purchased a small brownstone for the growing family');

    -- Mary (Gen 1)
    INSERT INTO life_events (person_id, event_type, title, date, location, description) VALUES
    (p_mary, 'education', 'Nursing School', '1943-05-20', 'Boston, MA', 'Completed nursing certification during the war'),
    (p_mary, 'work', 'Head Nurse', '1960-01-15', 'Boston General', 'Promoted to Head Nurse of the pediatric ward');

    -- Robert (Gen 1)
    INSERT INTO life_events (person_id, event_type, title, date, location, description) VALUES
    (p_robert, 'work', 'Union Representative', '1945-09-01', 'Chicago, IL', 'Elected as union rep for the steel workers'),
    (p_robert, 'residence', 'Built Family Cabin', '1955-07-01', 'Lake Michigan', 'Built a summer cabin by hand with his brothers');

    -- John (Gen 2)
    INSERT INTO life_events (person_id, event_type, title, date, location, description) VALUES
    (p_john, 'education', 'PhD in Engineering', '1970-06-01', 'MIT', 'Doctoral thesis on propulsion systems'),
    (p_john, 'work', 'NASA Senior Engineer', '1980-01-01', 'Houston, TX', 'Promoted to lead the shuttle engine design team');

    -- Jennifer (Gen 2)
    INSERT INTO life_events (person_id, event_type, title, date, location, description) VALUES
    (p_jennifer, 'education', 'Art School in Paris', '1968-09-01', 'Paris, France', 'Studied impressionism for two years'),
    (p_jennifer, 'work', 'Gallery Opening', '1975-04-10', 'Chicago, IL', 'Opened "The Williams Gallery" downtown');

    -- William (Gen 3)
    INSERT INTO life_events (person_id, event_type, title, date, location, description) VALUES
    (p_william, 'work', 'CTO Promotion', '2005-03-15', 'San Francisco, CA', 'Became Chief Technology Officer at TechCorp'),
    (p_william, 'travel', 'Sabbatical in Japan', '2010-04-01', 'Kyoto, Japan', 'Spent 3 months learning woodworking');

    -- Elizabeth (Gen 3)
    INSERT INTO life_events (person_id, event_type, title, date, location, description) VALUES
    (p_elizabeth, 'education', 'Masters in Ecology', '1996-05-20', 'University of Washington', 'Specialized in marine ecosystems'),
    (p_elizabeth, 'work', 'Published Book', '2008-11-12', 'Seattle, WA', 'Released "Saving Our Shores", a bestseller');

    -- Joseph (Gen 4)
    INSERT INTO life_events (person_id, event_type, title, date, location, description) VALUES
    (p_joseph, 'education', 'High School Valedictorian', '2013-06-01', 'Austin, TX', 'Gave the commencement speech'),
    (p_joseph, 'work', 'Startup Founder', '2018-01-15', 'San Francisco, CA', 'Founded an AI healthcare startup');
    
    RAISE NOTICE 'Added detailed life events';

    -- ========================================
    -- ADD DUMMY MEDIA
    -- ========================================
    
    -- Insert dummy photos linked to people
    INSERT INTO media (person_id, url, type, created_at) VALUES
    (p_james, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800', 'image', NOW()),
    (p_james, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800', 'image', NOW()),
    (p_mary, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800', 'image', NOW()),
    (p_john, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', 'image', NOW()),
    (p_jennifer, 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800', 'image', NOW()),
    (p_william, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800', 'image', NOW());

    RAISE NOTICE 'Added dummy media files';

    -- ========================================
    -- ADD DUMMY DOCUMENTS
    -- ========================================
    
    -- Insert dummy documents
    INSERT INTO documents (person_id, title, type, url, source, description, created_at) VALUES
    (p_james, 'Military Service Record', 'pdf', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'upload', 'Official discharge papers from WWII', NOW()),
    (p_mary, 'Nursing Certificate', 'image', 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800', 'upload', 'Certificate of Registered Nursing', NOW()),
    (p_robert, 'Union Membership Card', 'image', 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=800', 'upload', 'Local 405 Steelworkers Union Card', NOW()),
    (p_john, 'Apollo 13 Commendation', 'pdf', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'upload', 'Letter of thanks from NASA Administrator', NOW()),
    (p_william, 'Patent US-884210', 'pdf', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'upload', 'Patent for distributed database system', NOW());

    RAISE NOTICE 'Added dummy documents';
    
    RAISE NOTICE 'Enrichment complete!';
END $$;
