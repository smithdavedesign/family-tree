import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../utils/testUtils';
import { fireEvent } from '@testing-library/react';
import TreeDashboard from '../../pages/TreeDashboard';

// Mock dependencies
vi.mock('../../auth', () => ({
    supabase: {
        auth: {
            getUser: vi.fn(),
            getSession: vi.fn(),
        },
    },
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
    Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

global.fetch = vi.fn();

describe('TreeDashboard', () => {
    const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
    };

    const mockOwnedTrees = [
        {
            id: 'tree-1',
            name: 'Smith Family Tree',
            created_at: '2024-01-01',
            person_count: 10,
            is_favorite: false,
            is_archived: false,
        },
        {
            id: 'tree-2',
            name: 'Johnson Family',
            created_at: '2024-01-15',
            person_count: 5,
            is_favorite: true,
            is_archived: false,
        },
    ];

    const mockSharedTrees = [
        {
            id: 'tree-3',
            name: 'Brown Family Tree',
            role: 'editor',
            person_count: 15,
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock successful auth
        const { supabase } = require('../../../auth');
        supabase.auth.getUser.mockResolvedValue({
            data: { user: mockUser },
        });
        supabase.auth.getSession.mockResolvedValue({
            data: { session: { access_token: 'mock-token' } },
        });

        // Mock successful fetch
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                ownedTrees: mockOwnedTrees,
                sharedTrees: mockSharedTrees,
            }),
        });
    });

    describe('Rendering', () => {
        it('should render loading spinner initially', () => {
            render(<TreeDashboard />);
            expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
        });

        it('should render tree dashboard after loading', async () => {
            render(<TreeDashboard />);

            await waitFor(() => {
                expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
            });
        });

        it('should display owned trees', async () => {
            render(<TreeDashboard />);

            await waitFor(() => {
                expect(screen.getByText('Smith Family Tree')).toBeInTheDocument();
                expect(screen.getByText('Johnson Family')).toBeInTheDocument();
            });
        });

        it('should display shared trees', async () => {
            render(<TreeDashboard />);

            await waitFor(() => {
                expect(screen.getByText('Brown Family Tree')).toBeInTheDocument();
            });
        });

        it('should display person count for trees', async () => {
            render(<TreeDashboard />);

            await waitFor(() => {
                expect(screen.getByText(/10 people/i)).toBeInTheDocument();
            });
        });
    });

    describe('User interactions', () => {
        it('should open create modal when create button clicked', async () => {
            render(<TreeDashboard />);

            await waitFor(() => {
                expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
            });

            const createButton = screen.getByText(/create new tree/i);
            fireEvent.click(createButton);

            expect(screen.getByPlaceholderText(/tree name/i)).toBeInTheDocument();
        });

        it('should handle tree creation with valid name', async () => {
            const mockNavigate = vi.fn();
            vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);

            render(<TreeDashboard />);

            await waitFor(() => {
                expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
            });

            // Open modal
            const createButton = screen.getByText(/create new tree/i);
            fireEvent.click(createButton);

            // Fill in tree name
            const input = screen.getByPlaceholderText(/tree name/i);
            fireEvent.change(input, { target: { value: 'New Family Tree' } });

            // Mock create tree response
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 'tree-new', name: 'New Family Tree' }),
            });

            // Submit form
            const submitButton = screen.getByText(/create/i);
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/tree/tree-new');
            });
        });

        it('should validate tree name is not empty', async () => {
            render(<TreeDashboard />);

            await waitFor(() => {
                expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
            });

            // Open modal
            const createButton = screen.getByText(/create new tree/i);
            fireEvent.click(createButton);

            // Try to submit without name
            const submitButton = screen.getByText(/create/i);
            fireEvent.click(submitButton);

            // Should show error (toast)
            await waitFor(() => {
                expect(global.fetch).not.toHaveBeenCalledWith('/api/trees', expect.objectContaining({
                    method: 'POST'
                }));
            });
        });
    });

    describe('View filters', () => {
        it('should filter to show only favorites', async () => {
            render(<TreeDashboard />);

            await waitFor(() => {
                expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
            });

            const favoritesButton = screen.getByText(/favorites/i);
            fireEvent.click(favoritesButton);

            await waitFor(() => {
                expect(screen.getByText('Johnson Family')).toBeInTheDocument();
                expect(screen.queryByText('Smith Family Tree')).not.toBeInTheDocument();
            });
        });

        it('should filter to show only archived trees', async () => {
            const mockArchivedTrees = [
                {
                    id: 'tree-4',
                    name: 'Archived Tree',
                    is_archived: true,
                    person_count: 3,
                },
            ];

            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    ownedTrees: mockArchivedTrees,
                    sharedTrees: [],
                }),
            });

            render(<TreeDashboard />);

            await waitFor(() => {
                expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
            });

            const archivedButton = screen.getByText(/archived/i);
            fireEvent.click(archivedButton);

            await waitFor(() => {
                expect(screen.getByText('Archived Tree')).toBeInTheDocument();
            });
        });
    });

    describe('Error handling', () => {
        it('should handle fetch error gracefully', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            render(<TreeDashboard />);

            await waitFor(() => {
                expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
            });

            // Should still render page without crashing
            expect(screen.getByText(/my family trees/i)).toBeInTheDocument();
        });

        it('should handle create tree API error', async () => {
            render(<TreeDashboard />);

            await waitFor(() => {
                expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
            });

            // Open modal
            const createButton = screen.getByText(/create new tree/i);
            fireEvent.click(createButton);

            // Fill in tree name
            const input = screen.getByPlaceholderText(/tree name/i);
            fireEvent.change(input, { target: { value: 'Failed Tree' } });

            // Mock failed response
            global.fetch.mockResolvedValueOnce({ ok: false });

            // Submit form
            const submitButton = screen.getByText(/create/i);
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText(/failed to create tree/i)).toBeInTheDocument();
            });
        });
    });

    describe('Accessibility', () => {
        it('should have accessible tree list', async () => {
            render(<TreeDashboard />);

            await waitFor(() => {
                expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
            });

            const treeLinks = screen.getAllByRole('link');
            expect(treeLinks.length).toBeGreaterThan(0);
        });

        it('should have accessible create button', async () => {
            render(<TreeDashboard />);

            await waitFor(() => {
                expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
            });

            const createButton = screen.getByRole('button', { name: /create/i });
            expect(createButton).toBeInTheDocument();
        });
    });
});
