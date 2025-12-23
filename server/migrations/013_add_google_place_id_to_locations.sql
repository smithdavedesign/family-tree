-- Migration: Add google_place_id to locations
-- Used for caching Google Places API results to reduce production costs

ALTER TABLE locations ADD COLUMN IF NOT EXISTS google_place_id TEXT;

-- Create index for fast lookups by google_place_id
CREATE INDEX IF NOT EXISTS idx_locations_google_place_id ON locations(google_place_id) WHERE google_place_id IS NOT NULL;
