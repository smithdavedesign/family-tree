-- Add email column to invitations table
ALTER TABLE invitations
ADD COLUMN IF NOT EXISTS email TEXT;

-- Index for faster lookups by email
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
