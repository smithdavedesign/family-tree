-- SQL Seed Script for Family Tree App
-- Run this in Supabase SQL Editor to populate test data
-- IMPORTANT: Replace 'YOUR_USER_ID_HERE' with your actual User ID from Supabase Authentication > Users

-- 1. Define the User ID (You must replace this!)
-- We use a temporary table to store the variable because Supabase SQL Editor doesn't support \set
create temp table seed_config as select '8699336c-6321-49c9-83e2-af700e3d764b'::uuid as user_id;

-- 2. Ensure User Profile Exists
insert into public.users (id, email, google_id, avatar_url)
select 
  user_id, 
  'testuser@example.com', 
  'test-google-id', 
  'https://via.placeholder.com/150'
from seed_config
on conflict (id) do nothing;

-- 3. Create a Tree
with new_tree as (
  insert into public.trees (name, owner_id, is_public)
  select 
    'The Skywalker Family', 
    user_id, 
    true
  from seed_config
  returning id
),
-- 4. Create Persons
new_persons as (
  insert into public.persons (tree_id, first_name, last_name, gender, bio, dob)
  select 
    (select id from new_tree), first_name, last_name, gender, bio, dob::date
  from (values 
    ('Anakin', 'Skywalker', 'Male', 'The Chosen One', '1941-01-01'),
    ('Padmé', 'Amidala', 'Female', 'Queen of Naboo', '1946-01-01'),
    ('Luke', 'Skywalker', 'Male', 'Jedi Knight', '1919-01-01'),
    ('Leia', 'Organa', 'Female', 'General', '1919-01-01')
  ) as data(first_name, last_name, gender, bio, dob)
  returning id, first_name, tree_id
)
-- 5. Create Relationships
insert into public.relationships (tree_id, person_1_id, person_2_id, type)
select 
  p1.tree_id,
  p1.id as person_1_id,
  p2.id as person_2_id,
  case 
    when p1.first_name = 'Anakin' and p2.first_name = 'Padmé' then 'spouse'
    when p1.first_name = 'Anakin' and p2.first_name = 'Luke' then 'parent_child'
    when p1.first_name = 'Padmé' and p2.first_name = 'Luke' then 'parent_child'
    when p1.first_name = 'Anakin' and p2.first_name = 'Leia' then 'parent_child'
    when p1.first_name = 'Padmé' and p2.first_name = 'Leia' then 'parent_child'
  end as type
from new_persons p1, new_persons p2
where 
  (p1.first_name = 'Anakin' and p2.first_name = 'Padmé') OR
  (p1.first_name = 'Anakin' and p2.first_name = 'Luke') OR
  (p1.first_name = 'Padmé' and p2.first_name = 'Luke') OR
  (p1.first_name = 'Anakin' and p2.first_name = 'Leia') OR
  (p1.first_name = 'Padmé' and p2.first_name = 'Leia');

-- Clean up
drop table seed_config;
