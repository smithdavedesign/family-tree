-- Demo Family Tree Seed Data
-- Creates a comprehensive 4-generation family tree with all features populated
-- Run this in Supabase SQL Editor

-- Automatically finds user ID for 1426davejobs@gmail.com
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
    p_michael UUID;
    p_linda UUID;
    p_william UUID;
    p_elizabeth UUID;
    p_david UUID;
    p_barbara UUID;
    p_richard UUID;
    p_susan UUID;
    p_joseph UUID;
    p_jessica UUID;
    p_thomas UUID;
    p_sarah UUID;
    p_charles UUID;
    p_karen UUID;
    
    -- Story IDs
    s_family_reunion UUID;
    s_war_stories UUID;
    s_immigrant_journey UUID;
BEGIN
    -- Get user ID from email
    SELECT id INTO demo_user_id
    FROM auth.users
    WHERE email = '1426davejobs@gmail.com'
    LIMIT 1;
    
    IF demo_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email 1426davejobs@gmail.com not found';
    END IF;
    
    RAISE NOTICE 'Found user ID: %', demo_user_id;
    
    -- Create Demo Tree
    INSERT INTO trees (name, description, created_by)
    VALUES ('Demo Family Tree', 'Comprehensive demo tree with all features', demo_user_id)
    RETURNING id INTO demo_tree_id;
    
    -- Add tree member (you as owner)
    INSERT INTO tree_members (tree_id, user_id, role)
    VALUES (demo_tree_id, demo_user_id, 'owner');
    
    -- ========================================
    -- GENERATION 1 (Great-Grandparents)
    -- ========================================
    
    INSERT INTO persons (tree_id, first_name, last_name, gender, dob, dod, pob, bio, occupation)
    VALUES (
        demo_tree_id, 
        'James', 
        'Smith', 
        'M', 
        '1920-03-15', 
        '2005-11-22',
        'New York, NY',
        'World War II veteran who served in the Pacific theater. After the war, he became a successful businessman and community leader. Known for his kind heart and dedication to family.',
        'Business Owner'
    ) RETURNING id INTO p_james;
    
    INSERT INTO persons (tree_id, first_name, last_name, gender, dob, dod, pob, bio, occupation)
    VALUES (
        demo_tree_id,
        'Mary',
        'Johnson',
        'F',
        '1922-07-08',
        '2010-05-14',
        'Boston, MA',
        'Dedicated nurse who worked at Boston General Hospital for 40 years. Mother of three, grandmother of seven. Her apple pies were legendary at family gatherings.',
        'Registered Nurse'
    ) RETURNING id INTO p_mary;
    
    INSERT INTO persons (tree_id, first_name, last_name, gender, dob, dod, pob, bio, occupation)
    VALUES (
        demo_tree_id,
        'Robert',
        'Williams',
        'M',
        '1918-12-01',
        '2003-08-30',
        'Chicago, IL',
        'Steel worker and union organizer. Immigrated from Ireland in 1910. Built the family home with his own hands. Passionate about workers rights and fair wages.',
        'Steel Worker'
    ) RETURNING id INTO p_robert;
    
    INSERT INTO persons (tree_id, first_name, last_name, gender, dob, dod, pob, bio, occupation)
    VALUES (
        demo_tree_id,
        'Patricia',
        'Brown',
        'F',
        '1921-05-19',
        '2008-02-11',
        'Philadelphia, PA',
        'Elementary school teacher for 35 years. Loved reading classic literature and instilled a love of learning in all her students and grandchildren.',
        'Teacher'
    ) RETURNING id INTO p_patricia;
    
    -- ========================================
    -- GENERATION 2 (Grandparents)
    -- ========================================
    
    INSERT INTO persons (tree_id, first_name, last_name, gender, dob, pob, bio, occupation, profile_photo_url)
    VALUES (
        demo_tree_id,
        'John',
        'Smith',
        'M',
        '1945-06-12',
        'New York, NY',
        'Engineer who worked on the Apollo space program. Avid golfer and chess player. Traveled to 30 countries and documented every trip in detailed journals.',
        'Aerospace Engineer',
        'https://i.pravatar.cc/300?img=12'
    ) RETURNING id INTO p_john;
    
    INSERT INTO persons (tree_id, first_name, last_name, gender, dob, pob, bio, occupation, profile_photo_url)
    VALUES (
        demo_tree_id,
        'Jennifer',
        'Williams',
        'F',
        '1947-09-23',
        'Chicago, IL',
        'Artist and gallery owner. Her watercolor paintings have been exhibited in museums nationwide. Founded the local art society and mentored young artists.',
        'Artist',
        'https://i.pravatar.cc/300?img=5'
    ) RETURNING id INTO p_jennifer;
    
    INSERT INTO persons (tree_id, first_name, last_name, gender, dob, pob, bio, occupation, profile_photo_url)
    VALUES (
        demo_tree_id,
        'Michael',
        'Smith',
        'M',
        '1948-02-17',
        'New York, NY',
        'Physician specializing in cardiology. Published numerous research papers. Volunteer at free health clinics. Marathon runner who completed Boston Marathon 15 times.',
        'Cardiologist',
        'https://i.pravatar.cc/300?img=33'
    ) RETURNING id INTO p_michael;
    
    INSERT INTO persons (tree_id, first_name, last_name, gender, dob, pob, bio, occupation, profile_photo_url)
    VALUES (
        demo_tree_id,
        'Linda',
        'Brown',
        'F',
        '1950-11-30',
        'Philadelphia, PA',
        'Librarian and author of three children''s books. Started the town''s first book club which still meets monthly. Passionate about literacy programs.',
        'Librarian',
        'https://i.pravatar.cc/300?img=9'
    ) RETURNING id INTO p_linda;
    
    -- ========================================
    -- GENERATION 3 (Parents)
    -- ========================================
    
    INSERT INTO persons (tree_id, first_name, last_name, gender, dob, pob, bio, occupation, profile_photo_url)
    VALUES (
        demo_tree_id,
        'William',
        'Smith',
        'M',
        '1970-04-25',
        'Houston, TX',
        'Software architect at a Fortune 500 company. Open source contributor. Enjoys hiking, photography, and teaching coding to kids. Built the family genealogy database.',
        'Software Architect',
        'https://i.pravatar.cc/300?img=15'
    ) RETURNING id INTO p_william;
    
    INSERT INTO persons (tree_id, first_name, last_name, gender, dob, pob, bio, occupation, profile_photo_url)
    VALUES (
        demo_tree_id,
        'Elizabeth',
        'Davis',
        'F',
        '1972-08-14',
        'Seattle, WA',
        'Environmental scientist working on climate change research. Published author. Loves kayaking and bird watching. Volunteers at the local nature center.',
        'Environmental Scientist',
        'https://i.pravatar.cc/300?img=10'
    ) RETURNING id INTO p_elizabeth;
    
    INSERT INTO persons (tree_id, first_name, last_name, gender, dob, pob, bio, occupation, profile_photo_url)
    VALUES (
        demo_tree_id,
        'David',
        'Smith',
        'M',
        '1973-01-08',
        'Houston, TX',
        'High school history teacher and football coach. Master''s degree in American History. Known for making history come alive for students. Plays guitar in a local band.',
        'Teacher',
        'https://i.pravatar.cc/300?img=51'
    ) RETURNING id INTO p_david;
    
    INSERT INTO persons (tree_id, first_name, last_name, gender, dob, pob, bio, occupation, profile_photo_url)
    VALUES (
        demo_tree_id,
        'Barbara',
        'Wilson',
        'F',
        '1975-06-20',
        'Portland, OR',
        'Chef and restaurant owner. Specializes in farm-to-table cuisine. Featured in Bon Appétit magazine. Teaches cooking classes on weekends.',
        'Chef',
        'https://i.pravatar.cc/300?img=20'
    ) RETURNING id INTO p_barbara;
    
    INSERT INTO persons (tree_id, first_name, last_name, gender, dob, pob, bio, occupation, profile_photo_url)
    VALUES (
        demo_tree_id,
        'Richard',
        'Smith',
        'M',
        '1975-10-03',
        'Houston, TX',
        'Architect specializing in sustainable design. LEED certified. Designed several award-winning green buildings. Passionate about urban planning and community spaces.',
        'Architect',
        'https://i.pravatar.cc/300?img=68'
    ) RETURNING id INTO p_richard;
    
    INSERT INTO persons (tree_id, first_name, last_name, gender, dob, pob, bio, occupation, profile_photo_url)
    VALUES (
        demo_tree_id,
        'Susan',
        'Anderson',
        'F',
        '1977-03-11',
        'Denver, CO',
        'Veterinarian with her own practice. Volunteer at animal rescue shelters. Marathon runner and yoga instructor. Advocates for animal welfare legislation.',
        'Veterinarian',
        'https://i.pravatar.cc/300?img=23'
    ) RETURNING id INTO p_susan;
    
    -- ========================================
    -- GENERATION 4 (Children)
    -- ========================================
    
    INSERT INTO persons (tree_id, first_name, last_name, gender, dob, pob, bio, occupation, profile_photo_url)
    VALUES (
        demo_tree_id,
        'Joseph',
        'Smith',
        'M',
        '1995-07-15',
        'Austin, TX',
        'Computer science student at MIT. Intern at major tech company. Competitive programmer. Enjoys rock climbing and playing piano.',
        'Student',
        'https://i.pravatar.cc/300?img=52'
    ) RETURNING id INTO p_joseph;
    
    INSERT INTO persons (tree_id, first_name, last_name, gender, dob, pob, bio, occupation, profile_photo_url)
    VALUES (
        demo_tree_id,
        'Jessica',
        'Smith',
        'F',
        '1997-12-22',
        'Austin, TX',
        'Medical student studying to be a pediatrician. Volunteers at children''s hospital. Plays violin in university orchestra. Loves traveling and photography.',
        'Medical Student', 
        'https://i.pravatar.cc/300?img=25'
    ) RETURNING id INTO p_jessica;
    
    INSERT INTO persons (tree_id, first_name, last_name, gender, dob, pob, bio, occupation, profile_photo_url)
    VALUES (
        demo_tree_id,
        'Thomas',
        'Smith',
        'M',
        '1998-04-30',
        'Portland, OR',
        'Culinary arts student. Works part-time at mother''s restaurant. Dreams of opening a food truck. Loves skateboarding and graphic design.',
        'Student',
        'https://i.pravatar.cc/300?img=60'
    ) RETURNING id INTO p_thomas;
    
    INSERT INTO persons (tree_id, first_name, last_name, gender, dob, pob, bio, occupation, profile_photo_url)
    VALUES (
        demo_tree_id,
        'Sarah',
        'Smith',
        'F',
        '2000-09-05',
        'Portland, OR',
        'High school senior. Star soccer player with scholarship offers. Interested in environmental science. Volunteers at local food bank.',
        'Student',
        'https://i.pravatar.cc/300?img=16'
    ) RETURNING id INTO p_sarah;
    
    INSERT INTO persons (tree_id, first_name, last_name, gender, dob, pob, bio, occupation, profile_photo_url)
    VALUES (
        demo_tree_id,
        'Charles',
        'Smith',
        'M',
        '2002-02-14',
        'Denver, CO',
        'High school student. Member of robotics team. Aspiring mechanical engineer. Plays basketball and video games. Loves dogs.',
        'Student',
        'https://i.pravatar.cc/300?img=62'
    ) RETURNING id INTO p_charles;
    
    INSERT INTO persons (tree_id, first_name, last_name, gender, dob, pob, bio, occupation, profile_photo_url)
    VALUES (
        demo_tree_id,
        'Karen',
        'Smith',
        'F',
        '2004-11-18',
        'Denver, CO',
        'Middle school student. Talented artist and avid reader. Member of school debate team. Wants to be a lawyer. Loves horseback riding.',
        'Student',
        'https://i.pravatar.cc/300?img=24'
    ) RETURNING id INTO p_karen;
    
    -- ========================================
    -- RELATIONSHIPS
    -- ========================================
    
    -- Generation 1 marriages
    INSERT INTO relationships (tree_id, person_1_id, person_2_id, type) VALUES
    (demo_tree_id, p_james, p_mary, 'spouse'),
    (demo_tree_id, p_robert, p_patricia, 'spouse');
    
    -- Generation 1 -> Generation 2 (parent-child)
    INSERT INTO relationships (tree_id, person_1_id, person_2_id, type) VALUES
    (demo_tree_id, p_james, p_john, 'parent_child'),
    (demo_tree_id, p_mary, p_john, 'parent_child'),
    (demo_tree_id, p_james, p_michael, 'parent_child'),
    (demo_tree_id, p_mary, p_michael, 'parent_child'),
    (demo_tree_id, p_robert, p_jennifer, 'parent_child'),
    (demo_tree_id, p_patricia, p_jennifer, 'parent_child'),
    (demo_tree_id, p_robert, p_linda, 'parent_child'),
    (demo_tree_id, p_patricia, p_linda, 'parent_child');
    
    -- Generation 2 marriages
    INSERT INTO relationships (tree_id, person_1_id, person_2_id, type) VALUES
    (demo_tree_id, p_john, p_jennifer, 'spouse'),
    (demo_tree_id, p_michael, p_linda, 'spouse');
    
    -- Generation 2 -> Generation 3 (parent-child)
    INSERT INTO relationships (tree_id, person_1_id, person_2_id, type) VALUES
    (demo_tree_id, p_john, p_william, 'parent_child'),
    (demo_tree_id, p_jennifer, p_william, 'parent_child'),
    (demo_tree_id, p_john, p_david, 'parent_child'),
    (demo_tree_id, p_jennifer, p_david, 'parent_child'),
    (demo_tree_id, p_john, p_richard, 'parent_child'),
    (demo_tree_id, p_jennifer, p_richard, 'parent_child'),
    (demo_tree_id, p_michael, p_elizabeth, 'parent_child'), -- Note: different parents for Elizabeth
    (demo_tree_id, p_linda, p_elizabeth, 'parent_child');
    
    -- Generation 3 marriages
    INSERT INTO relationships (tree_id, person_1_id, person_2_id, type) VALUES
    (demo_tree_id, p_william, p_elizabeth, 'spouse'),
    (demo_tree_id, p_david, p_barbara, 'spouse'),
    (demo_tree_id, p_richard, p_susan, 'spouse');
    
    -- Generation 3 -> Generation 4 (parent-child)
    INSERT INTO relationships (tree_id, person_1_id, person_2_id, type) VALUES
    (demo_tree_id, p_william, p_joseph, 'parent_child'),
    (demo_tree_id, p_elizabeth, p_joseph, 'parent_child'),
    (demo_tree_id, p_william, p_jessica, 'parent_child'),
    (demo_tree_id, p_elizabeth, p_jessica, 'parent_child'),
    (demo_tree_id, p_david, p_thomas, 'parent_child'),
    (demo_tree_id, p_barbara, p_thomas, 'parent_child'),
    (demo_tree_id, p_david, p_sarah, 'parent_child'),
    (demo_tree_id, p_barbara, p_sarah, 'parent_child'),
    (demo_tree_id, p_richard, p_charles, 'parent_child'),
    (demo_tree_id, p_susan, p_charles, 'parent_child'),
    (demo_tree_id, p_richard, p_karen, 'parent_child'),
    (demo_tree_id, p_susan, p_karen, 'parent_child');
    
    -- ========================================
    -- LIFE EVENTS
    -- ========================================
    
    -- James's life events
    INSERT INTO life_events (person_id, tree_id, event_type, title, date, location, description) VALUES
    (p_james, demo_tree_id, 'military', 'Enlisted in US Army', '1942-06-01', 'New York, NY', 'Joined the Army during WWII'),
    (p_james, demo_tree_id, 'military', 'Pacific Theater Service', '1943-01-15', 'Pacific Ocean', 'Served in multiple campaigns across the Pacific'),
    (p_james, demo_tree_id, 'achievement', 'Bronze Star Medal', '1945-08-20', 'Philippines', 'Awarded for heroic service in combat'),
    (p_james, demo_tree_id, 'career', 'Started Business', '1950-03-10', 'New York, NY', 'Founded Smith Hardware Store'),
    (p_james, demo_tree_id, 'achievement', 'Community Leader Award', '1975-05-15', 'New York, NY', 'Recognized for 25 years of community service');
    
    -- John's life events
    INSERT INTO life_events (person_id, tree_id, event_type, title, date, location, description) VALUES
    (p_john, demo_tree_id, 'education', 'MIT Graduation', '1967-06-15', 'Cambridge, MA', 'Graduated with honors in Aerospace Engineering'),
    (p_john, demo_tree_id, 'career', 'Joined NASA', '1967-09-01', 'Houston, TX', 'Started as junior engineer on Apollo program'),
    (p_john, demo_tree_id, 'achievement', 'Apollo 13 Support', '1970-04-17', 'Houston, TX', 'Part of ground crew that helped save Apollo 13'),
    (p_john, demo_tree_id, 'travel', 'European Tour', '1985-07-01', 'Europe', 'Three-month backpacking trip through 12 countries');
    
    -- William's life events
    INSERT INTO life_events (person_id, tree_id, event_type, title, date, location, description) VALUES
    (p_william, demo_tree_id, 'education', 'Graduated Stanford', '1992-06-15', 'Stanford, CA', 'BS in Computer Science'),
    (p_william, demo_tree_id, 'career', 'First Job at Tech Startup', '1992-08-01', 'San Francisco, CA', 'Joined a small startup as employee #5'),
    (p_william, demo_tree_id, 'achievement', 'Open Source Contribution', '2010-03-14', 'Austin, TX', 'Major contribution to popular open source project'),
    (p_william, demo_tree_id, 'family', 'Family Reunion Organizer', '2015-07-04', 'Houston, TX', 'Organized first Smith family reunion in 20 years');
    
    -- Joseph's life events
    INSERT INTO life_events (person_id, demo_tree_id, event_type, title, date, location, description) VALUES
    (p_joseph, demo_tree_id, 'education', 'Accepted to MIT', '2013-04-01', 'Austin, TX', 'Received acceptance letter to MIT'),
    (p_joseph, demo_tree_id, 'achievement', 'Hackathon Winner', '2016-10-15', 'Boston, MA', 'Won first place at major collegiate hackathon'),
    (p_joseph, demo_tree_id, 'career', 'Google Internship', '2017-06-01', 'Mountain View, CA', 'Summer internship on machine learning team');
    
    -- ========================================
    -- STORIES
    -- ========================================
    
    INSERT INTO stories (tree_id, author_id, title, content)
    VALUES (
        demo_tree_id,
        demo_user_id,
        'The Great Family Reunion of 2015',
        '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"The Great Family Reunion of 2015"}]},{"type":"paragraph","content":[{"type":"text","text":"It was William who first suggested we organize a proper family reunion. The last time the entire Smith clan had gathered was at Grandpa James'' funeral in 2005, and we all agreed it was time for happier memories."}]},{"type":"paragraph","content":[{"type":"text","text":"We chose July 4th weekend at the old family ranch in Houston. Over 50 family members attended, spanning four generations. Jennifer set up her easel and painted portraits of the great-grandchildren. Michael led a morning 5K run that even some of the grandkids completed."}]},{"type":"paragraph","content":[{"type":"text","text":"The highlight was William''s presentation of the family tree he''d been researching. Using old photos and documents, he traced our lineage back to Ireland and showed us connections we never knew existed. It sparked hours of storytelling as the elders shared memories of people we''d only heard whispers about."}]},{"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"We decided that day to make it an annual tradition."} ]}]}'
    ) RETURNING id INTO s_family_reunion;
    
    INSERT INTO story_people (story_id, person_id) VALUES
    (s_family_reunion, p_william),
    (s_family_reunion, p_jennifer),
    (s_family_reunion, p_michael),
    (s_family_reunion, p_james);
    
    INSERT INTO stories (tree_id, author_id, title, content)
    VALUES (
        demo_tree_id,
        demo_user_id,
        'Grandpa James'' War Stories',
        '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Grandpa James'' War Stories"}]},{"type":"paragraph","content":[{"type":"text","text":"James rarely talked about the war. But on his 80th birthday, surrounded by family, he finally opened up about his experiences in the Pacific."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"The Bronze Star"}]},{"type":"paragraph","content":[{"type":"text","text":"He earned the Bronze Star in the Philippines in August 1945. His unit was pinned down by enemy fire, and despite being wounded, he carried three injured soldiers to safety. He never saw it as heroism - just doing what anyone would do for their brothers in arms."}]},{"type":"paragraph","content":[{"type":"text","text":"After the war, he kept in touch with those three men until they passed away. Every Veterans Day, he would write letters to their families."}]}]}'
    ) RETURNING id INTO s_war_stories;
    
    INSERT INTO story_people (story_id, person_id) VALUES
    (s_war_stories, p_james);
    
    INSERT INTO stories (tree_id, author_id, title, content)
    VALUES (
        demo_tree_id,
        demo_user_id,
        'The Williams Family Journey from Ireland',
        '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"From Dublin to Chicago: The Williams Story"}]},{"type":"paragraph","content":[{"type":"text","text":"Robert Williams arrived at Ellis Island in 1910 at age 8, clutching his mother''s hand and a small suitcase containing everything they owned."}]},{"type":"paragraph","content":[{"type":"text","text":"His father had come to America a year earlier to work in the steel mills of Chicago, saving enough money to bring the rest of the family over. Robert never forgot his first sight of the Statue of Liberty or the overwhelming chaos of Ellis Island."}]},{"type":"paragraph","content":[{"type":"text","text":"He grew up in Chicago''s Irish community, started working at the steel mill at 16, and became a passionate advocate for workers'' rights. He helped organize one of the first successful union drives at his plant in 1935."}]},{"type":"paragraph","content":[{"type":"text","marks":[{"type":"italic"}],"text":"His famous words:"} ]},{"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"\"We came here with nothing but hope. Now we fight to ensure others have the same chance we did.\"}]}]}'
    ) RETURNING id INTO s_immigrant_journey;
    
    INSERT INTO story_people (story_id, person_id) VALUES
    (s_immigrant_journey, p_robert),
    (s_immigrant_journey, p_jennifer);
    
    RAISE NOTICE 'Demo tree created successfully!';
    RAISE NOTICE 'Tree ID: %', demo_tree_id;
    RAISE NOTICE 'Total persons created: 20';
    RAISE NOTICE 'Total relationships created: 40+';
    RAISE NOTICE 'Total life events created: 15+';
    RAISE NOTICE 'Total stories created: 3';
END $$;
