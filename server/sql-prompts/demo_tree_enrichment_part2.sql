-- ============================================================================
-- DEMO TREE ENRICHMENT PART 2
-- ============================================================================
-- This script adds missing details for the remaining family members:
-- Gen 1: Patricia
-- Gen 2: Michael, Linda
-- Gen 3: David, Barbara, Richard, Susan
-- Gen 4: Jessica, Thomas, Sarah, Charles, Karen
-- ============================================================================

DO $$
DECLARE
    demo_tree_id UUID;
    demo_user_id UUID;
    
    -- Person IDs
    p_patricia UUID;
    p_michael UUID;
    p_linda UUID;
    p_david UUID;
    p_barbara UUID;
    p_richard UUID;
    p_susan UUID;
    p_jessica UUID;
    p_thomas UUID;
    p_sarah UUID;
    p_charles UUID;
    p_karen UUID;

BEGIN
    -- 1. Get Tree ID
    SELECT id INTO demo_tree_id FROM trees WHERE name = 'Demo Family Tree' LIMIT 1;
    
    IF demo_tree_id IS NULL THEN
        RAISE NOTICE 'Demo Family Tree not found. Please run seed script first.';
        RETURN;
    END IF;

    -- 2. Get Owner ID (for authoring)
    SELECT owner_id INTO demo_user_id FROM trees WHERE id = demo_tree_id;

    -- 3. Get Person IDs
    SELECT id INTO p_patricia FROM persons WHERE tree_id = demo_tree_id AND first_name = 'Patricia' AND last_name = 'Davis' LIMIT 1;
    SELECT id INTO p_michael FROM persons WHERE tree_id = demo_tree_id AND first_name = 'Michael' AND last_name = 'Smith' LIMIT 1;
    SELECT id INTO p_linda FROM persons WHERE tree_id = demo_tree_id AND first_name = 'Linda' AND last_name = 'Jones' LIMIT 1;
    SELECT id INTO p_david FROM persons WHERE tree_id = demo_tree_id AND first_name = 'David' AND last_name = 'Smith' LIMIT 1;
    SELECT id INTO p_barbara FROM persons WHERE tree_id = demo_tree_id AND first_name = 'Barbara' AND last_name = 'Smith' LIMIT 1;
    SELECT id INTO p_richard FROM persons WHERE tree_id = demo_tree_id AND first_name = 'Richard' AND last_name = 'Wilson' LIMIT 1;
    SELECT id INTO p_susan FROM persons WHERE tree_id = demo_tree_id AND first_name = 'Susan' AND last_name = 'Wilson' LIMIT 1;
    SELECT id INTO p_jessica FROM persons WHERE tree_id = demo_tree_id AND first_name = 'Jessica' AND last_name = 'Smith' LIMIT 1;
    SELECT id INTO p_thomas FROM persons WHERE tree_id = demo_tree_id AND first_name = 'Thomas' AND last_name = 'Smith' LIMIT 1;
    SELECT id INTO p_sarah FROM persons WHERE tree_id = demo_tree_id AND first_name = 'Sarah' AND last_name = 'Wilson' LIMIT 1;
    SELECT id INTO p_charles FROM persons WHERE tree_id = demo_tree_id AND first_name = 'Charles' AND last_name = 'Wilson' LIMIT 1;
    SELECT id INTO p_karen FROM persons WHERE tree_id = demo_tree_id AND first_name = 'Karen' AND last_name = 'Wilson' LIMIT 1;

    -- ========================================
    -- GEN 1: PATRICIA DAVIS (Teacher)
    -- ========================================
    IF p_patricia IS NOT NULL THEN
        -- Update Profile Photo
        UPDATE persons SET profile_photo_url = 'https://i.pravatar.cc/300?img=5' WHERE id = p_patricia;
        
        -- Update Details
        UPDATE persons SET 
            education = '["Masters in Education, Columbia University"]',
            occupation_history = '["High School Teacher (30 years)", "Principal"]'
        WHERE id = p_patricia;

        -- Life Events
        INSERT INTO life_events (person_id, event_type, title, date, location, description) VALUES
        (p_patricia, 'education', 'Masters Degree', '1945-06-15', 'New York, NY', 'Earned Masters in Education from Columbia University'),
        (p_patricia, 'work', 'Started Teaching', '1945-09-01', 'Brooklyn, NY', 'Began career as a High School English teacher'),
        (p_patricia, 'award', 'Teacher of the Year', '1965-05-20', 'Brooklyn, NY', 'Recognized for 20 years of excellence in education');

        -- Media
        INSERT INTO media (person_id, url, type, created_at) VALUES
        (p_patricia, 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800', 'image', NOW());

        -- Documents
        INSERT INTO documents (person_id, title, type, url, source, description, created_at) VALUES
        (p_patricia, 'Teaching Certificate', 'pdf', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'upload', 'NYS Teaching License', NOW());
    END IF;

    -- ========================================
    -- GEN 2: MICHAEL SMITH (Cardiologist)
    -- ========================================
    IF p_michael IS NOT NULL THEN
        UPDATE persons SET 
            education = '["MD, Johns Hopkins University", "Residency, Mayo Clinic"]',
            occupation_history = '["Chief of Cardiology, Mt. Sinai", "Cardiologist"]'
        WHERE id = p_michael;

        INSERT INTO life_events (person_id, event_type, title, date, location, description) VALUES
        (p_michael, 'education', 'Medical School Graduation', '1975-05-25', 'Baltimore, MD', 'Graduated with honors from Johns Hopkins'),
        (p_michael, 'work', 'Chief of Cardiology', '1995-01-01', 'New York, NY', 'Promoted to Chief of Cardiology at Mt. Sinai Hospital');

        INSERT INTO media (person_id, url, type, created_at) VALUES
        (p_michael, 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800', 'image', NOW()); -- Doctor photo
        
        INSERT INTO documents (person_id, title, type, url, source, description, created_at) VALUES
        (p_michael, 'Medical License', 'pdf', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'upload', 'State Medical Board License', NOW());
    END IF;

    -- ========================================
    -- GEN 2: LINDA JONES (Librarian)
    -- ========================================
    IF p_linda IS NOT NULL THEN
        UPDATE persons SET 
            education = '["Masters in Library Science"]',
            occupation_history = '["Head Librarian, Boston Public Library"]'
        WHERE id = p_linda;

        INSERT INTO life_events (person_id, event_type, title, date, location, description) VALUES
        (p_linda, 'education', 'MLS Degree', '1978-06-10', 'Boston, MA', 'Completed Masters in Library Science'),
        (p_linda, 'work', 'Library Director', '2000-03-15', 'Boston, MA', 'Appointed as Director of City Libraries');

        INSERT INTO media (person_id, url, type, created_at) VALUES
        (p_linda, 'https://images.unsplash.com/photo-1524222717473-730000096953?w=800', 'image', NOW()); -- Library setting
    END IF;

    -- ========================================
    -- GEN 3: DAVID SMITH (Teacher)
    -- ========================================
    IF p_david IS NOT NULL THEN
        UPDATE persons SET 
            education = '["BA History, Yale University"]',
            occupation_history = '["History Teacher", "Soccer Coach"]'
        WHERE id = p_david;

        INSERT INTO life_events (person_id, event_type, title, date, location, description) VALUES
        (p_david, 'education', 'College Graduation', '2002-05-20', 'New Haven, CT', 'BA in History'),
        (p_david, 'work', 'First Teaching Job', '2002-09-01', 'Chicago, IL', 'Started teaching high school history');

        INSERT INTO media (person_id, url, type, created_at) VALUES
        (p_david, 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800', 'image', NOW()); -- Classroom
    END IF;

    -- ========================================
    -- GEN 3: BARBARA SMITH (Chef)
    -- ========================================
    IF p_barbara IS NOT NULL THEN
        UPDATE persons SET 
            education = '["Culinary Institute of America"]',
            occupation_history = '["Executive Chef", "Restaurant Owner"]'
        WHERE id = p_barbara;

        INSERT INTO life_events (person_id, event_type, title, date, location, description) VALUES
        (p_barbara, 'education', 'Culinary School', '2005-04-15', 'Hyde Park, NY', 'Graduated from CIA'),
        (p_barbara, 'work', 'Opened "The Table"', '2015-06-01', 'San Francisco, CA', 'Opened her first restaurant');

        INSERT INTO media (person_id, url, type, created_at) VALUES
        (p_barbara, 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=800', 'image', NOW()); -- Chef
    END IF;

    -- ========================================
    -- GEN 3: RICHARD WILSON (Architect)
    -- ========================================
    IF p_richard IS NOT NULL THEN
        UPDATE persons SET 
            education = '["M.Arch, MIT"]',
            occupation_history = '["Senior Architect", "Urban Planner"]'
        WHERE id = p_richard;

        INSERT INTO life_events (person_id, event_type, title, date, location, description) VALUES
        (p_richard, 'education', 'Architecture Degree', '2004-06-01', 'Cambridge, MA', 'Master of Architecture'),
        (p_richard, 'award', 'Design Excellence', '2018-11-10', 'Chicago, IL', 'Award for Sustainable Building Design');

        INSERT INTO media (person_id, url, type, created_at) VALUES
        (p_richard, 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800', 'image', NOW()); -- Architecture
    END IF;

    -- ========================================
    -- GEN 3: SUSAN WILSON (Veterinarian)
    -- ========================================
    IF p_susan IS NOT NULL THEN
        UPDATE persons SET 
            education = '["DVM, Cornell University"]',
            occupation_history = '["Veterinarian", "Animal Shelter Director"]'
        WHERE id = p_susan;

        INSERT INTO life_events (person_id, event_type, title, date, location, description) VALUES
        (p_susan, 'education', 'Vet School', '2006-05-20', 'Ithaca, NY', 'Doctor of Veterinary Medicine'),
        (p_susan, 'work', 'Opened Clinic', '2010-08-01', 'Seattle, WA', 'Started private practice');

        INSERT INTO media (person_id, url, type, created_at) VALUES
        (p_susan, 'https://images.unsplash.com/photo-1553688738-a278b9f063e0?w=800', 'image', NOW()); -- Vet
    END IF;

    -- ========================================
    -- GEN 4: JESSICA SMITH (Med Student)
    -- ========================================
    IF p_jessica IS NOT NULL THEN
        UPDATE persons SET 
            education = '["BS Biology, Stanford", "Medical Student"]',
            occupation_history = '["Research Assistant"]'
        WHERE id = p_jessica;

        INSERT INTO life_events (person_id, event_type, title, date, location, description) VALUES
        (p_jessica, 'education', 'Started Med School', '2022-08-20', 'Boston, MA', 'Following in her grandfather''s footsteps'),
        (p_jessica, 'work', 'Lab Research', '2020-06-01', 'Palo Alto, CA', 'Summer research internship');

        INSERT INTO media (person_id, url, type, created_at) VALUES
        (p_jessica, 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800', 'image', NOW()); -- Lab
    END IF;

    -- ========================================
    -- GEN 4: THOMAS SMITH (Culinary Student)
    -- ========================================
    IF p_thomas IS NOT NULL THEN
        UPDATE persons SET 
            education = '["Culinary Student"]',
            occupation_history = '["Line Cook"]'
        WHERE id = p_thomas;

        INSERT INTO life_events (person_id, event_type, title, date, location, description) VALUES
        (p_thomas, 'work', 'Summer Job', '2023-06-01', 'San Francisco, CA', 'Working at Aunt Barbara''s restaurant');
    END IF;

    -- ========================================
    -- GEN 4: SARAH WILSON (HS Student)
    -- ========================================
    IF p_sarah IS NOT NULL THEN
        UPDATE persons SET 
            education = '["High School Student"]',
            occupation_history = '["Camp Counselor"]'
        WHERE id = p_sarah;

        INSERT INTO life_events (person_id, event_type, title, date, location, description) VALUES
        (p_sarah, 'award', 'Science Fair Winner', '2023-04-15', 'Seattle, WA', 'First place in regional science fair');
    END IF;

    -- ========================================
    -- GEN 4: CHARLES WILSON (HS Student)
    -- ========================================
    IF p_charles IS NOT NULL THEN
        UPDATE persons SET 
            education = '["High School Student"]',
            occupation_history = '["Lifeguard"]'
        WHERE id = p_charles;

        INSERT INTO life_events (person_id, event_type, title, date, location, description) VALUES
        (p_charles, 'work', 'Summer Job', '2023-06-15', 'Seattle, WA', 'Community pool lifeguard');
    END IF;

    -- ========================================
    -- GEN 4: KAREN WILSON (Middle School)
    -- ========================================
    IF p_karen IS NOT NULL THEN
        UPDATE persons SET 
            education = '["Middle School Student"]'
        WHERE id = p_karen;

        INSERT INTO life_events (person_id, event_type, title, date, location, description) VALUES
        (p_karen, 'award', 'Spelling Bee Champion', '2023-03-10', 'Seattle, WA', 'School spelling bee winner');
    END IF;

    RAISE NOTICE 'Enrichment Part 2 Complete!';
END $$;
