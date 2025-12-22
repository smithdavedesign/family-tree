import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../utils/testUtils';
import AlbumSelectorModal from '../../components/AlbumSelectorModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

global.fetch = vi.fn();

vi.mock('../../auth', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(() => Promise.resolve({
                data: { session: { access_token: 'test-token' } }
            }))
        }
    }
}));

describe('AlbumSelector Component', () => {
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
            photoIds: ['photo-1', 'photo-2'],
            treeId: 'test-tree-id',
            onClose: vi.fn(),
            isOpen: true,
            ...props
        };

        return render(
            <QueryClientProvider client={queryClient}>
                <AlbumSelectorModal {...defaultProps} />
            </QueryClientProvider>
        );
    };

    it('should render album list', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ([
                { id: 'album-1', name: 'Test Album', photo_count: 5 },
                { id: 'album-2', name: 'Another Album', photo_count: 10 }
            ])
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Test Album')).toBeInTheDocument();
            expect(screen.getByText('Another Album')).toBeInTheDocument();
        });
    });

    it('should allow multi-select of albums', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ([
                { id: 'album-1', name: 'Album 1', photo_count: 5 },
                { id: 'album-2', name: 'Album 2', photo_count: 10 }
            ])
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Album 1')).toBeInTheDocument();
        });

        const checkboxes = screen.getAllByRole('checkbox');
        fireEvent.click(checkboxes[0]);
        fireEvent.click(checkboxes[1]);

        // Check that button text updates
        await waitFor(() => {
            expect(screen.getByText(/Add Photos/i)).toBeInTheDocument();
            expect(screen.getByText(/Add 2 Photo/i)).toBeInTheDocument();
        });
    });

    it('should show create new album form', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Create New Album')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Create New Album'));

        await waitFor(() => {
            expect(screen.getByPlaceholderText('Album name')).toBeInTheDocument();
        });
    });

    it('should create new album and add photos', async () => {
        // Mock albums fetch
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Create New Album')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Create New Album'));

        const input = await screen.findByPlaceholderText('Album name');
        fireEvent.change(input, { target: { value: 'New Test Album' } });

        // Mock create album API call
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'new-album-id', name: 'New Test Album' })
        });

        fireEvent.click(screen.getByText('Create'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/albums'),
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('New Test Album')
                })
            );
        });

        // Mock add photos API call
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ added: 2 })
        });

        // Click Add Photos
        const addBtn = screen.getByRole('button', { name: /Add Photos/i });
        expect(addBtn).not.toBeDisabled();
        fireEvent.click(addBtn);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/photos'),
                expect.objectContaining({
                    method: 'POST'
                })
            );
        });
    });

    it('should show empty state when no albums exist', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('No albums yet')).toBeInTheDocument();
        });
    });
});
