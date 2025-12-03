import { vi } from 'vitest';

/**
 * Mock Supabase client for testing
 */
export const mockSupabase = {
    auth: {
        getSession: vi.fn(() => Promise.resolve({
            data: {
                session: {
                    access_token: 'mock-token',
                    user: {
                        id: 'mock-user-id',
                        email: 'test@example.com'
                    }
                }
            },
            error: null
        })),
        getUser: vi.fn(() => Promise.resolve({
            data: {
                user: {
                    id: 'mock-user-id',
                    email: 'test@example.com',
                    user_metadata: {
                        avatar_url: 'https://example.com/avatar.jpg'
                    }
                }
            },
            error: null
        })),
        signOut: vi.fn(() => Promise.resolve({ error: null })),
        signInWithOAuth: vi.fn(() => Promise.resolve({ error: null })),
    },
};

/**
 * Mock tree data for testing
 */
export const mockTreeData = {
    id: 'tree-1',
    name: 'Test Family Tree',
    owner_id: 'mock-user-id',
    created_at: '2024-01-01T00:00:00Z',
    persons: [
        {
            id: 'person-1',
            tree_id: 'tree-1',
            first_name: 'John',
            last_name: 'Doe',
            dob: '1980-01-01',
            dod: null,
            gender: 'Male',
            bio: 'Test person',
            occupation: 'Engineer',
            pob: 'New York',
            profile_photo_url: null
        },
        {
            id: 'person-2',
            tree_id: 'tree-1',
            first_name: 'Jane',
            last_name: 'Doe',
            dob: '1982-05-15',
            dod: null,
            gender: 'Female',
            bio: 'Test person 2',
            occupation: 'Doctor',
            pob: 'Boston',
            profile_photo_url: null
        }
    ],
    relationships: [
        {
            id: 'rel-1',
            tree_id: 'tree-1',
            person_1_id: 'person-1',
            person_2_id: 'person-2',
            type: 'spouse'
        }
    ]
};
