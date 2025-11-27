// Mock Supabase Client for testing/development without backend
export const mockSupabase = {
    auth: {
        signInWithOAuth: async () => {
            console.log("Mock SignInWithOAuth called");
            return { data: { url: 'http://localhost:5173' }, error: null };
        },
        signOut: async () => {
            console.log("Mock SignOut called");
            return { error: null };
        },
        getUser: async () => {
            console.log("Mock getUser called");
            return {
                data: {
                    user: {
                        id: 'mock-user-id',
                        email: 'mock@example.com',
                        user_metadata: {
                            full_name: 'Mock User',
                            avatar_url: 'https://via.placeholder.com/150'
                        }
                    }
                },
                error: null
            };
        },
        getSession: async () => {
            return {
                data: {
                    session: {
                        access_token: 'mock-token',
                        user: {
                            id: 'mock-user-id',
                            email: 'mock@example.com'
                        }
                    }
                }
            }
        }
    },
    from: (table) => {
        return {
            select: () => ({ data: [], error: null }),
            insert: () => ({ data: [], error: null }),
            update: () => ({ data: [], error: null }),
            delete: () => ({ data: [], error: null }),
            eq: function () { return this; },
            single: function () { return { data: {}, error: null }; }
        };
    }
};
