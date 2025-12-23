import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../utils/testUtils';
import { fireEvent } from '@testing-library/react';
import TreeDashboard from '../../pages/TreeDashboard';

// Define mocks using vi.hoisted
const { mockGetUser, mockGetSession } = vi.hoisted(() => {
    return {
        mockGetUser: vi.fn(),
        mockGetSession: vi.fn(),
    };
});

// Mock dependencies
vi.mock('../../auth', () => ({
    supabase: {
        auth: {
            getUser: mockGetUser,
            getSession: mockGetSession,
        },
    },
}));

vi.mock('../../components/GlobalTravelDashboard', () => ({
    default: () => <div data-testid="global-travel-dashboard">Global Travel Dashboard</div>
}));

vi.mock('../../components/dashboard/EventsWidget', () => ({
    default: () => <div data-testid="events-widget">Events Widget</div>
}));

vi.mock('../../components/onboarding/WelcomeWizard', () => ({
    default: () => <div data-testid="welcome-wizard">Welcome Wizard</div>
}));

vi.mock('../../components/Sidebar', () => ({
    default: ({ onViewChange }) => (
        <div data-testid="sidebar">
            <button onClick={() => onViewChange('favorites')}>Favorites</button>
            <button onClick={() => onViewChange('archived')}>Archived</button>
        </div>
    )
}));

vi.mock('../../components/Navbar', () => ({
    default: ({ onOpenSettings }) => (
        <div data-testid="navbar">
            <button onClick={onOpenSettings}>Settings</button>
        </div>
    )
}));

vi.mock('../../components/AccountSettings', () => ({
    default: ({ isOpen, onClose }) => isOpen ? (
        <div data-testid="account-settings">
            Account Settings <button onClick={onClose}>Close</button>
        </div>
    ) : null
}));

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useNavigate: () => vi.fn(),
    };
});

// Mock fetch globally
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
            created_at: '2024-02-01',
            role: 'editor',
            person_count: 15,
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup auth mocks
        mockGetUser.mockResolvedValue({
            data: { user: mockUser },
        });
        mockGetSession.mockResolvedValue({
            data: { session: { access_token: 'mock-token' } },
        });

        // Setup default fetch mock
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
            render(<TreeDashboard user={mockUser} />);
            expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
        });

        it('should render tree dashboard after loading', async () => {
            render(<TreeDashboard user={mockUser} />);
            expect(await screen.findByText(/Smith Family Tree/i)).toBeInTheDocument();
        });

        it('should display owned trees', async () => {
            render(<TreeDashboard user={mockUser} />);
            expect(await screen.findByText(/Smith Family Tree/i)).toBeInTheDocument();
            expect(await screen.findByText(/Johnson Family/i)).toBeInTheDocument();
        });

        it('should display shared trees', async () => {
            render(<TreeDashboard user={mockUser} />);
            expect(await screen.findByText(/Brown Family Tree/i)).toBeInTheDocument();
        });

        it('should display person count for trees', async () => {
            render(<TreeDashboard user={mockUser} />);
            expect(await screen.findByText(/10 members/i)).toBeInTheDocument();
        });

        it('should render child widgets', async () => {
            render(<TreeDashboard user={mockUser} />);
            expect(await screen.findByTestId('global-travel-dashboard')).toBeInTheDocument();
            expect(await screen.findByTestId('events-widget')).toBeInTheDocument();
        });
    });

    describe('User interactions', () => {
        it('should open create modal when create button clicked', async () => {
            render(<TreeDashboard user={mockUser} />);

            // Wait for load
            await waitFor(() => expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument());

            const createButton = screen.getByText(/New Tree/i);
            fireEvent.click(createButton);

            expect(await screen.findByPlaceholderText(/e.g., Smith Family Tree/i)).toBeInTheDocument();
        });

        it('should handle tree creation with valid name', async () => {
            render(<TreeDashboard user={mockUser} />);
            await waitFor(() => expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument());

            const createButton = screen.getByText(/New Tree/i);
            fireEvent.click(createButton);

            const input = await screen.findByPlaceholderText(/e.g., Smith Family Tree/i);
            fireEvent.change(input, { target: { value: 'New Family Tree' } });

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 'tree-new', name: 'New Family Tree' }),
            });

            const submitButton = screen.getByText(/Create Tree/i);
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith('/api/trees', expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ name: 'New Family Tree' })
                }));
            });
        });

        it('should validate tree name is not empty', async () => {
            render(<TreeDashboard user={mockUser} />);
            await waitFor(() => expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument());

            const createButton = screen.getByText(/New Tree/i);
            fireEvent.click(createButton);

            const submitButton = await screen.findByText(/Create Tree/i);
            fireEvent.click(submitButton);

            global.fetch.mockClear();
            await waitFor(() => expect(global.fetch).not.toHaveBeenCalled());
        });

        it('should open settings modal', async () => {
            render(<TreeDashboard user={mockUser} />);
            await waitFor(() => expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument());

            const settingsButton = screen.getByText(/Settings/i);
            fireEvent.click(settingsButton);

            expect(await screen.findByTestId('account-settings')).toBeInTheDocument();
        });
    });

    describe('View filters', () => {
        it('should filter to show only favorites', async () => {
            render(<TreeDashboard user={mockUser} />);

            // Wait for initial load
            expect(await screen.findByText(/Smith Family Tree/i)).toBeInTheDocument();

            const favoritesButton = screen.getByText(/Favorites/i);
            fireEvent.click(favoritesButton);

            // Expect Johnson (favorite) to be there, Smith (not favorite) to leave
            expect(await screen.findByText(/Johnson Family/i)).toBeInTheDocument();
            await waitFor(() => {
                expect(screen.queryByText(/Smith Family Tree/i)).not.toBeInTheDocument();
            });
        });

        it('should filter to show only archived trees', async () => {
            const mockArchivedTrees = [
                {
                    id: 'tree-4',
                    name: 'Archived Tree',
                    created_at: '2024-01-20',
                    is_archived: true,
                    person_count: 3,
                },
            ];

            // Override fetch for this test
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    ownedTrees: mockArchivedTrees,
                    sharedTrees: [],
                }),
            });

            render(<TreeDashboard user={mockUser} />);

            // wait for loading to finish - note that initially it might not show anything if filtering 'all' hides archived
            await waitFor(() => expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument());

            const archivedButton = screen.getByText(/Archived/i);
            fireEvent.click(archivedButton);

            expect(await screen.findByText(/Archived Tree/i)).toBeInTheDocument();
        });
    });

    describe('Error handling', () => {
        it('should handle fetch error gracefully', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            render(<TreeDashboard user={mockUser} />);

            await waitFor(() => expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument());

            expect(screen.getByTestId('welcome-wizard')).toBeInTheDocument();
        });

        it('should handle create tree API error', async () => {
            render(<TreeDashboard user={mockUser} />);
            await waitFor(() => expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument());

            const createButton = screen.getByText(/New Tree/i);
            fireEvent.click(createButton);

            const input = await screen.findByPlaceholderText(/e.g., Smith Family Tree/i);
            fireEvent.change(input, { target: { value: 'Failed Tree' } });

            global.fetch.mockClear();
            global.fetch.mockResolvedValueOnce({ ok: false });

            const submitButton = screen.getByText(/Create Tree/i);
            fireEvent.click(submitButton);

            await waitFor(() => {
                // Modal should still be open (button visible)
                expect(screen.getByText(/Create Tree/i)).toBeInTheDocument();
            });
        });
    });
});
