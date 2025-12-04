-- Google Connections Table for Dual OAuth Architecture
-- This table stores Google API tokens separately from Supabase authentication
-- Users explicitly connect their Google account to use Drive/Photos APIs

CREATE TABLE IF NOT EXISTS google_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  scopes TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE google_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own connections

-- SELECT: Users can view their own connections
CREATE POLICY "Users can view their own Google connections"
  ON google_connections FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can create their own connections
CREATE POLICY "Users can insert their own Google connections"
  ON google_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own connections (for token refresh)
CREATE POLICY "Users can update their own Google connections"
  ON google_connections FOR UPDATE
  USING (auth.uid() = user_id);

-- DELETE: Users can delete their own connections (disconnect)
CREATE POLICY "Users can delete their own Google connections"
  ON google_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_google_connections_user_id ON google_connections(user_id);
CREATE INDEX idx_google_connections_expires_at ON google_connections(expires_at);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_google_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
CREATE TRIGGER trigger_update_google_connections_updated_at
  BEFORE UPDATE ON google_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_google_connections_updated_at();

-- Comments for documentation
COMMENT ON TABLE google_connections IS 'Stores Google OAuth tokens for API access (Drive, Photos) separately from Supabase authentication';
COMMENT ON COLUMN google_connections.user_id IS 'References auth.users - the Supabase user who owns this connection';
COMMENT ON COLUMN google_connections.access_token IS 'Google OAuth access token for API calls';
COMMENT ON COLUMN google_connections.refresh_token IS 'Google OAuth refresh token for obtaining new access tokens';
COMMENT ON COLUMN google_connections.expires_at IS 'When the access_token expires (typically 1 hour from creation)';
COMMENT ON COLUMN google_connections.scopes IS 'Array of granted OAuth scopes (e.g., drive.file, photoslibrary.readonly)';
