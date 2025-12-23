import { createClient } from '@supabase/supabase-js';
import { mockSupabase } from './mockSupabase.js';
import { sessionManager } from './utils/sessionManager.js';

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

// Initialize the client (Use the same URL/Key as backend, it's safe to expose Anon Key)
const supabase = useMock ? mockSupabase : createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Set up auth state change listener
if (!useMock) {
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, 'Has provider_token:', !!session?.provider_token);

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            // CRITICAL: Capture provider_token immediately - it's only available here!
            if (session?.provider_token) {
                console.log('Capturing provider_token from auth callback');
            }
            sessionManager.saveSession(session);
        } else if (event === 'SIGNED_OUT') {
            sessionManager.clearSession();
        }
    });
}

// 1. The Login Function - Updated for Google Photos Picker API
export const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/trees`,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
            scopes: 'https://www.googleapis.com/auth/drive.file',
            // TEMPORARILY DISABLED - Google Photos requires verification (returns 403)
            // scopes: 'https://www.googleapis.com/auth/photoslibrary.readonly https://www.googleapis.com/auth/drive.file',
        },
    });

    if (error) {
        console.error('Error logging in:', error);
        return null;
    }

    supabase.auth.getSession().then(({ data }) => {
        console.log("Token scopes:", data.session?.provider_token);
    });
    console.log('Google sign-in successful:', data);
    return data;
};


// 2. The Logout Function
export const signOut = async () => {
    await supabase.auth.signOut();
    sessionManager.clearSession();
};

// Email/Password Signup
export const signUpWithPassword = async (email, password, fullName = '') => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
            data: {
                full_name: fullName,
                onboarding_completed: false,
            }
        }
    });

    if (error) {
        console.error('Error signing up:', error);
        throw error;
    }

    return data;
};

// Email/Password Sign In
export const signInWithPassword = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error('Error signing in:', error);
        throw error;
    }

    // Save session
    if (data.session) {
        sessionManager.saveSession(data.session);
    }

    return data;
};

// Get Current Session
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