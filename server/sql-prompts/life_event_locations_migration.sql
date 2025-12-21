-- Create life_event_locations join table
-- This links life events to the normalized locations table

CREATE TABLE IF NOT EXISTS life_event_locations (
    event_id UUID REFERENCES life_events(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (event_id, location_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_life_event_locations_event_id ON life_event_locations(event_id);
CREATE INDEX IF NOT EXISTS idx_life_event_locations_location_id ON life_event_locations(location_id);

-- Enable RLS
ALTER TABLE life_event_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for life_event_locations
-- Users can view event locations if they can view the event (i.e., they're in the tree)
CREATE POLICY "Users can view event locations in their trees"
    ON life_event_locations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM life_events le
            JOIN persons p ON le.person_id = p.id
            JOIN tree_members tm ON p.tree_id = tm.tree_id
            WHERE le.id = life_event_locations.event_id
            AND tm.user_id = auth.uid()
        )
    );

-- Users can insert event locations if they're an editor/owner of the tree
CREATE POLICY "Editors can add event locations"
    ON life_event_locations
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM life_events le
            JOIN persons p ON le.person_id = p.id
            JOIN tree_members tm ON p.tree_id = tm.tree_id
            WHERE le.id = life_event_locations.event_id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('owner', 'editor')
        )
    );

-- Users can delete event locations if they're an editor/owner
CREATE POLICY "Editors can remove event locations"
    ON life_event_locations
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM life_events le
            JOIN persons p ON le.person_id = p.id
            JOIN tree_members tm ON p.tree_id = tm.tree_id
            WHERE le.id = life_event_locations.event_id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('owner', 'editor')
        )
    );

-- Note: Keep the existing 'location' text field in life_events for backward compatibility
-- Events can have either:
-- 1. A location string (old way) - will be resolved via knownLocationsMap
-- 2. Linked locations (new way) - direct joins to locations table
-- 3. Both (migration period)
