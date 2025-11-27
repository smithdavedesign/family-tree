import { createClient } from '@supabase/supabase-js';
import { mockSupabase } from './mockSupabase';
import { sessionManager } from './utils/sessionManager';

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

// Initialize the client (Use the same URL/Key as backend, it's safe to expose Anon Key)
const supabase = useMock ? mockSupabase : createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Set up auth state change listener
if (!useMock) {
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            sessionManager.saveSession(session);
        } else if (event === 'SIGNED_OUT') {
            sessionManager.clearSession();
        }
    });
}

// 1. The Login Function
export const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            // Crucial: This forces Google to give us a "Refresh Token" 
            // so we can access photos even when the user isn't looking.
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
            // Request access to their photos (read-only)
            scopes: 'https://www.googleapis.com/auth/photoslibrary.readonly',
        },
    });

    if (error) console.error('Error logging in:', error);
    return data;
};

// 2. The Logout Function
export const signOut = async () => {
    await supabase.auth.signOut();
    sessionManager.clearSession();
};

// 3. Get Current User
export const getCurrentUser = async () => {
    // Try to get from session manager first
    const storedSession = sessionManager.getSession();
    if (storedSession && storedSession.user) {
        return storedSession.user;
    }

    // Fallback to Supabase
    const { data: { user } } = await supabase.auth.getUser();
    return user;
};

// 4. Restore Session on App Load
export const restoreSession = async () => {
    const storedSession = sessionManager.loadSession();
    if (storedSession) {
        // Verify session is still valid with Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
            // Session invalid, try to refresh
            if (storedSession.refresh_token) {
                return await sessionManager.refreshSession(storedSession.refresh_token);
            }
            sessionManager.clearSession();
            return null;
        }
        return session;
    }
    return null;
};

export { supabase };