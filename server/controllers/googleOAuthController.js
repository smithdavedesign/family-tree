const { google } = require('googleapis');
const { supabase, supabaseAdmin } = require('../middleware/auth');

// Initialize OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:5173/api/google/callback' // Dev server with proxy
);

// Required scopes for Drive, Photos, and User Info
const SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/photoslibrary.readonly',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
];

/**
 * Initiate Google OAuth connection
 * Generates OAuth URL and redirects user to Google consent screen
 */
exports.initiateConnection = async (req, res) => {
    try {
        // Get user from token in query parameter (sent by frontend redirect)
        const token = req.query.token;
        const returnUrl = req.query.return_url || '/settings';

        if (!token) {
            return res.status(401).json({ error: 'No auth token provided' });
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Encode state with user ID and return URL
        const state = Buffer.from(JSON.stringify({
            userId: user.id,
            returnUrl
        })).toString('base64');

        // Generate OAuth URL with custom scopes
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline', // Request refresh token
            scope: SCOPES,
            state, // Pass encoded state for security and return navigation
            prompt: 'consent' // Force consent screen to get refresh token
        });

        res.redirect(authUrl);
    } catch (error) {
        console.error('Error initiating Google connection:', error);
        res.status(500).json({ error: 'Failed to initiate Google connection' });
    }
};

/**
 * Handle OAuth callback from Google
 * Exchange authorization code for tokens and store in database
 */
exports.handleCallback = async (req, res) => {
    try {
        const { code, state } = req.query;

        if (!code || !state) {
            return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/settings?error=missing_params`);
        }

        // Decode state to get user ID and return URL
        let userId, returnUrl;
        try {
            const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
            userId = decoded.userId;
            returnUrl = decoded.returnUrl || '/settings';
        } catch (err) {
            // Fallback for old state format (just user ID)
            userId = state;
            returnUrl = '/settings';
        }

        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Fetch user profile info
        const oauth2 = google.oauth2({
            auth: oauth2Client,
            version: 'v2'
        });

        const { data: userProfile } = await oauth2.userinfo.get();

        // Calculate expiration time
        const expiresAt = new Date(tokens.expiry_date);

        // Store connection in database
        const { error } = await supabaseAdmin
            .from('google_connections')
            .upsert({
                user_id: userId,
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expires_at: expiresAt.toISOString(),
                scopes: tokens.scope.split(' '),
                google_email: userProfile.email,
                google_name: userProfile.name,
                google_picture: userProfile.picture
            }, {
                onConflict: 'user_id'
            });

        if (error) {
            console.error('Error storing Google connection:', error);
            const separator = returnUrl.includes('?') ? '&' : '?';
            return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}${returnUrl}${separator}error=storage_failed`);
        }

        // Redirect back to where they came from with success message
        const separator = returnUrl.includes('?') ? '&' : '?';
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}${returnUrl}${separator}google_connected=true`);
    } catch (error) {
        console.error('Error handling Google callback:', error);
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/settings?error=callback_failed`);
    }
};

/**
 * Get connection status for current user
 * Returns connection details if exists, null otherwise
 */
exports.getConnectionStatus = async (req, res) => {
    try {
        // Prevent caching
        res.set('Cache-Control', 'no-store');
        const userId = req.user.id;

        // Use supabaseAdmin to bypass RLS since we've already authenticated the user via middleware
        // The standard 'supabase' client is anonymous and won't pass RLS checks
        const { data, error } = await supabaseAdmin
            .from('google_connections')
            .select('id, expires_at, scopes, created_at, google_email, google_name, google_picture')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error fetching connection status:', error);
            return res.status(500).json({ error: 'Failed to fetch connection status' });
        }

        if (!data) {
            return res.json({ connected: false });
        }

        // Check if token is expired
        const isExpired = new Date(data.expires_at) < new Date();

        res.json({
            connected: true,
            expires_at: data.expires_at,
            scopes: data.scopes,
            created_at: data.created_at,
            google_email: data.google_email,
            google_name: data.google_name,
            google_picture: data.google_picture,
            needs_refresh: isExpired
        });
    } catch (error) {
        console.error('Error in getConnectionStatus:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Refresh access token using refresh token
 * Automatically called when token is expired
 */
exports.refreshToken = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get current connection
        const { data: connection, error: fetchError } = await supabaseAdmin
            .from('google_connections')
            .select('refresh_token')
            .eq('user_id', userId)
            .single();

        if (fetchError || !connection || !connection.refresh_token) {
            return res.status(404).json({ error: 'No connection found or refresh token missing' });
        }

        // Set refresh token and get new access token
        oauth2Client.setCredentials({
            refresh_token: connection.refresh_token
        });

        const { credentials } = await oauth2Client.refreshAccessToken();
        const expiresAt = new Date(credentials.expiry_date);

        // Update connection with new access token
        const { error: updateError } = await supabaseAdmin
            .from('google_connections')
            .update({
                access_token: credentials.access_token,
                expires_at: expiresAt.toISOString()
            })
            .eq('user_id', userId);

        if (updateError) {
            console.error('Error updating refreshed token:', updateError);
            return res.status(500).json({ error: 'Failed to update token' });
        }

        res.json({
            success: true,
            expires_at: expiresAt.toISOString()
        });
    } catch (error) {
        console.error('Error refreshing token:', error);
        res.status(500).json({ error: 'Failed to refresh token' });
    }
};

/**
 * Disconnect Google account
 * Deletes connection from database
 */
exports.disconnect = async (req, res) => {
    try {
        const userId = req.user.id;

        const { error } = await supabaseAdmin
            .from('google_connections')
            .delete()
            .eq('user_id', userId);

        if (error) {
            console.error('Error disconnecting Google account:', error);
            return res.status(500).json({ error: 'Failed to disconnect' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error in disconnect:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get valid access token for current user
 * Automatically refreshes if expired
 * Used internally by pickers
 */
exports.getValidToken = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get connection
        const { data: connection, error } = await supabaseAdmin
            .from('google_connections')
            .select('access_token, refresh_token, expires_at')
            .eq('user_id', userId)
            .single();

        if (error || !connection) {
            return res.status(404).json({ error: 'No Google connection found' });
        }

        // Check if token is expired
        const isExpired = new Date(connection.expires_at) < new Date();

        if (!isExpired) {
            return res.json({ access_token: connection.access_token });
        }

        // Token is expired, refresh it
        if (!connection.refresh_token) {
            return res.status(401).json({ error: 'Token expired and no refresh token available' });
        }

        oauth2Client.setCredentials({
            refresh_token: connection.refresh_token
        });

        const { credentials } = await oauth2Client.refreshAccessToken();
        const expiresAt = new Date(credentials.expiry_date);

        // Update connection
        await supabaseAdmin
            .from('google_connections')
            .update({
                access_token: credentials.access_token,
                expires_at: expiresAt.toISOString()
            })
            .eq('user_id', userId);

        res.json({ access_token: credentials.access_token });
    } catch (error) {
        console.error('Error getting valid token:', error);
        res.status(500).json({ error: 'Failed to get valid token' });
    }
};
