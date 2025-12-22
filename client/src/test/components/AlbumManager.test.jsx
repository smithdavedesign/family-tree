import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../utils/testUtils';
import AlbumManager from '../../components/AlbumManager';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock fetch
global.fetch = vi.fn();

// Mock supabase
vi.mock('../../auth', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(() => Promise.resolve({
                data: { session: { access_token: 'test-token' } }
            }))
        }
    }
}));

describe('AlbumManager Component', () => {
    let queryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false }
            }
        });
        vi.clearAllMocks();
    });

    const renderComponent = (props = {}) => {
        const defaultProps = {
            treeId: 'test-tree-id',
            userRole: 'editor',
            onAlbumClick: vi.fn(),
            ...props
        };

        return render(
            <QueryClientProvider client={queryClient}>
                <AlbumManager {...defaultProps} />
            </QueryClientProvider>
        );
    };

    it('should render album grid with albums', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ([
                {
                    id: 'album-1',
                    name: 'Test Album',
                    description: 'Test Description',
                    photo_count: 5,
                    cover_photo_url: null,
                    created_at: '2024-01-01'
                }
            ])
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Test Album')).toBeInTheDocument();
            expect(screen.getByText('Test Description')).toBeInTheDocument();
        });
    });

    it('should display create album button for editors', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        renderComponent({ userRole: 'editor' });

        await waitFor(() => {
            const buttons = screen.getAllByTestId('create-album-btn');
            expect(buttons.length).toBeGreaterThanOrEqual(1);
        });
    });

    it('should not display create album button for viewers', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        renderComponent({ userRole: 'viewer' });

        await waitFor(() => {
            expect(screen.queryByTestId('create-album-btn')).not.toBeInTheDocument();
        });
    });

    it('should open create modal when button clicked', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        renderComponent();

        await waitFor(() => {
            const buttons = screen.getAllByTestId('create-album-btn');
            expect(buttons.length).toBeGreaterThanOrEqual(1);
        });

        fireEvent.click(screen.getAllByTestId('create-album-btn')[0]);

        await waitFor(() => {
            expect(screen.getByText('Create New Album')).toBeInTheDocument();
            expect(screen.getByLabelText(/album name/i)).toBeInTheDocument();
        });
    });

    it('should filter albums by search term', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ([
                { id: '1', name: 'Wedding Photos', photo_count: 10, created_at: '2024-01-01' },
                { id: '2', name: 'Vacation 2023', photo_count: 20, created_at: '2024-01-01' }
            ])
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Wedding Photos')).toBeInTheDocument();
            expect(screen.getByText('Vacation 2023')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText('Search albums...');
        fireEvent.change(searchInput, { target: { value: 'Wedding' } });

        await waitFor(() => {
            expect(screen.getByText('Wedding Photos')).toBeInTheDocument();
            expect(screen.queryByText('Vacation 2023')).not.toBeInTheDocument();
        });
    });

    it('should call onAlbumClick when album card is clicked', async () => {
        const onAlbumClick = vi.fn();

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ([
                { id: 'album-1', name: 'Test Album', photo_count: 5, created_at: '2024-01-01' }
            ])
        });

        renderComponent({ onAlbumClick });

        await waitFor(() => {
            expect(screen.getByText('Test Album')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Test Album'));

        expect(onAlbumClick).toHaveBeenCalledWith('album-1');
    });

    it('should show empty state when no albums exist', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('No albums yet')).toBeInTheDocument();
            expect(screen.getByText(/create your first album/i)).toBeInTheDocument();
        });
    });
});
