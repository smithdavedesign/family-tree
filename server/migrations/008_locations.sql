-- Migration: Phase Q - Location-Story Enhancements
-- Creates locations table and linking tables for stories and people

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create story_locations join table
CREATE TABLE IF NOT EXISTS story_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, location_id)
);

-- Create person_locations join table
CREATE TABLE IF NOT EXISTS person_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(person_id, location_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_locations_coords ON locations(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_story_locations_story ON story_locations(story_id);
CREATE INDEX IF NOT EXISTS idx_story_locations_location ON story_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_person_locations_person ON person_locations(person_id);
CREATE INDEX IF NOT EXISTS idx_person_locations_location ON person_locations(location_id);

-- Enable RLS on new tables
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_locations ENABLE ROW LEVEL SECURITY;

-- RLS policies for locations (accessible if user has access to any linked entity)
CREATE POLICY "Users can view locations they have access to"
ON locations FOR SELECT
USING (
  -- Allow if location is linked to a photo in a tree the user can view
  EXISTS (
    SELECT 1 FROM photos p
    INNER JOIN persons ON persons.id = p.person_id
    INNER JOIN tree_members tm ON tm.tree_id = persons.tree_id
    WHERE p.latitude = locations.latitude 
      AND p.longitude = locations.longitude
      AND tm.user_id = auth.uid()
  )
  OR
  -- Allow if location is linked to a story in a tree the user can view
  EXISTS (
    SELECT 1 FROM story_locations sl
    INNER JOIN stories ON stories.id = sl.story_id
    INNER JOIN tree_members tm ON tm.tree_id = stories.tree_id
    WHERE sl.location_id = locations.id
      AND tm.user_id = auth.uid()
  )
  OR
  -- Allow if location is linked to a person in a tree the user can view
  EXISTS (
    SELECT 1 FROM person_locations pl
    INNER JOIN persons ON persons.id = pl.person_id
    INNER JOIN tree_members tm ON tm.tree_id = persons.tree_id
    WHERE pl.location_id = locations.id
      AND tm.user_id = auth.uid()
  )
);

CREATE POLICY "Editors can insert locations"
ON locations FOR INSERT
WITH CHECK (true); -- Will be restricted by story/person policies

CREATE POLICY "Editors can update locations"
ON locations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM story_locations sl
    INNER JOIN stories ON stories.id = sl.story_id
    INNER JOIN tree_members tm ON tm.tree_id = stories.tree_id
    WHERE sl.location_id = locations.id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'editor')
  )
  OR
  EXISTS (
    SELECT 1 FROM person_locations pl
    INNER JOIN persons ON persons.id = pl.person_id
    INNER JOIN tree_members tm ON tm.tree_id = persons.tree_id
    WHERE pl.location_id = locations.id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'editor')
  )
);

CREATE POLICY "Editors can delete locations"
ON locations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM story_locations sl
    INNER JOIN stories ON stories.id = sl.story_id
    INNER JOIN tree_members tm ON tm.tree_id = stories.tree_id
    WHERE sl.location_id = locations.id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'editor')
  )
  OR
  EXISTS (
    SELECT 1 FROM person_locations pl
    INNER JOIN persons ON persons.id = pl.person_id
    INNER JOIN tree_members tm ON tm.tree_id = persons.tree_id
    WHERE pl.location_id = locations.id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'editor')
  )
);

-- RLS policies for story_locations
CREATE POLICY "Users can view story locations"
ON story_locations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stories
    INNER JOIN tree_members tm ON tm.tree_id = stories.tree_id
    WHERE stories.id = story_locations.story_id
      AND tm.user_id = auth.uid()
  )
);

CREATE POLICY "Editors can manage story locations"
ON story_locations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM stories
    INNER JOIN tree_members tm ON tm.tree_id = stories.tree_id
    WHERE stories.id = story_locations.story_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'editor')
  )
);

-- RLS policies for person_locations
CREATE POLICY "Users can view person locations"
ON person_locations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM persons
    INNER JOIN tree_members tm ON tm.tree_id = persons.tree_id
    WHERE persons.id = person_locations.person_id
      AND tm.user_id = auth.uid()
  )
);

CREATE POLICY "Editors can manage person locations"
ON person_locations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM persons
    INNER JOIN tree_members tm ON tm.tree_id = persons.tree_id
    WHERE persons.id = person_locations.person_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'editor')
  )
);
