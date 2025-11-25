import { createClient } from '@supabase/supabase-js';
import { mockSupabase } from './mockSupabase';

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

// Initialize the client (Use the same URL/Key as backend, it's safe to expose Anon Key)
const supabase = useMock ? mockSupabase : createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

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
};

// 3. Get Current User
export const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
};

export { supabase };