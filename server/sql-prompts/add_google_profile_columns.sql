-- Add columns for storing Google user profile info
ALTER TABLE google_connections 
ADD COLUMN IF NOT EXISTS google_email TEXT,
ADD COLUMN IF NOT EXISTS google_name TEXT,
ADD COLUMN IF NOT EXISTS google_picture TEXT;

COMMENT ON COLUMN google_connections.google_email IS 'Email address of the connected Google account';
COMMENT ON COLUMN google_connections.google_name IS 'Display name of the connected Google account';
COMMENT ON COLUMN google_connections.google_picture IS 'Profile picture URL of the connected Google account';
