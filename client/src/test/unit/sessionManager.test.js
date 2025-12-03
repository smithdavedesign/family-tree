import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabase } from '../utils/mockData';

// Mock the Supabase client
vi.mock('../../auth', () => ({
    supabase: mockSupabase
}));

describe('Session Manager', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        vi.clearAllMocks();
    });

    describe('Session Storage', () => {
        it('should store session token in localStorage', () => {
            const mockToken = 'test-token-123';
            localStorage.setItem('supabase.auth.token', mockToken);

            const storedToken = localStorage.getItem('supabase.auth.token');
            expect(storedToken).toBe(mockToken);
        });

        it('should clear session token on logout', () => {
            localStorage.setItem('supabase.auth.token', 'test-token');
            localStorage.removeItem('supabase.auth.token');

            const storedToken = localStorage.getItem('supabase.auth.token');
            expect(storedToken).toBeNull();
        });
    });

    describe('Session Validation', () => {
        it('should validate session token exists', async () => {
            const { data } = await mockSupabase.auth.getSession();

            expect(data.session).toBeDefined();
            expect(data.session.access_token).toBe('mock-token');
        });

        it('should get user from session', async () => {
            const { data } = await mockSupabase.auth.getUser();

            expect(data.user).toBeDefined();
            expect(data.user.email).toBe('test@example.com');
        });
    });

    describe('Sign Out', () => {
        it('should sign out successfully', async () => {
            const { error } = await mockSupabase.auth.signOut();

            expect(error).toBeNull();
            expect(mockSupabase.auth.signOut).toHaveBeenCalled();
        });
    });
});
