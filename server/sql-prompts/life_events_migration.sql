-- Create life_events table
CREATE TABLE IF NOT EXISTS life_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'education', 'work', 'residence', 'military', 'award', 'other'
    title VARCHAR(255) NOT NULL,
    date DATE, -- Specific date if known
    start_date DATE, -- For ranges
    end_date DATE, -- For ranges
    location VARCHAR(255),
    description TEXT,
    media_ids JSONB DEFAULT '[]'::jsonb, -- Array of photo IDs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE life_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view events for trees they have access to (viewer, editor, owner)
CREATE POLICY "Users can view life_events for accessible trees" ON life_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM persons p
            JOIN tree_members tm ON p.tree_id = tm.tree_id
            WHERE p.id = life_events.person_id
            AND tm.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM persons p
            JOIN trees t ON p.tree_id = t.id
            WHERE p.id = life_events.person_id
            AND t.owner_id = auth.uid()
        )
    );

-- Policy: Users can insert events for trees they can edit (editor, owner)
CREATE POLICY "Users can insert life_events for editable trees" ON life_events
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM persons p
            JOIN tree_members tm ON p.tree_id = tm.tree_id
            WHERE p.id = life_events.person_id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('owner', 'editor')
        )
        OR
        EXISTS (
            SELECT 1 FROM persons p
            JOIN trees t ON p.tree_id = t.id
            WHERE p.id = life_events.person_id
            AND t.owner_id = auth.uid()
        )
    );

-- Policy: Users can update events for trees they can edit
CREATE POLICY "Users can update life_events for editable trees" ON life_events
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM persons p
            JOIN tree_members tm ON p.tree_id = tm.tree_id
            WHERE p.id = life_events.person_id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('owner', 'editor')
        )
        OR
        EXISTS (
            SELECT 1 FROM persons p
            JOIN trees t ON p.tree_id = t.id
            WHERE p.id = life_events.person_id
            AND t.owner_id = auth.uid()
        )
    );

-- Policy: Users can delete events for trees they can edit
CREATE POLICY "Users can delete life_events for editable trees" ON life_events
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM persons p
            JOIN tree_members tm ON p.tree_id = tm.tree_id
            WHERE p.id = life_events.person_id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('owner', 'editor')
        )
        OR
        EXISTS (
            SELECT 1 FROM persons p
            JOIN trees t ON p.tree_id = t.id
            WHERE p.id = life_events.person_id
            AND t.owner_id = auth.uid()
        )
    );

-- Create index for faster lookups
CREATE INDEX idx_life_events_person_id ON life_events(person_id);
CREATE INDEX idx_life_events_date ON life_events(date);
CREATE INDEX idx_life_events_start_date ON life_events(start_date);
