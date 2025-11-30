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
                        refresh_token: 'mock-refresh-token',
                        expires_at: Date.now() + 3600000, // 1 hour from now
                        user: {
                            id: 'mock-user-id',
                            email: 'mock@example.com'
                        }
                    }
                }
            }
        },
        onAuthStateChange: (callback) => {
            console.log("Mock onAuthStateChange registered");
            // Return a subscription object with unsubscribe method
            return {
                data: {
                    subscription: {
                        unsubscribe: () => console.log("Mock auth listener unsubscribed")
                    }
                }
            };
        },
        refreshSession: async ({ refresh_token }) => {
            console.log("Mock refreshSession called");
            return {
                data: {
                    session: {
                        access_token: 'mock-token-refreshed',
                        refresh_token: 'mock-refresh-token',
                        expires_at: Date.now() + 3600000,
                        user: {
                            id: 'mock-user-id',
                            email: 'mock@example.com'
                        }
                    }
                },
                error: null
            };
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
