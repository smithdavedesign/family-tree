const { describe, it, expect, beforeEach } = require('@jest/globals');

// Helper to create a fluent mock chain
const createChain = () => {
    const chain = {};
    chain.from = jest.fn(() => chain);
    chain.select = jest.fn(() => chain);
    chain.insert = jest.fn(() => chain);
    chain.update = jest.fn(() => chain);
    chain.delete = jest.fn(() => chain);
    chain.upsert = jest.fn(() => chain);
    chain.eq = jest.fn(() => chain);
    chain.single = jest.fn(() => chain);
    chain.order = jest.fn(() => chain);
    chain.limit = jest.fn(() => chain);
    return chain;
};

const mockSupabaseAdmin = createChain();

jest.mock('../middleware/auth', () => ({
    supabaseAdmin: mockSupabaseAdmin
}));

jest.mock('../utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
}));

const albumController = require('../controllers/albumController');

describe('Album Controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            user: { id: 'test-user-id' },
            params: {},
            query: {},
            body: {}
        };
        res = {
            json: jest.fn(),
            status: jest.fn(() => res)
        };
        jest.clearAllMocks();
    });

    describe('getTreeAlbums', () => {
        it('should return albums for a tree', async () => {
            req.params.treeId = 'test-tree-id';

            // Mock chains for concurrent or subsequent calls
            const memberChain = createChain();
            const albumsChain = createChain();

            mockSupabaseAdmin.from.mockImplementation((table) => {
                if (table === 'tree_members') return memberChain;
                if (table === 'albums') return albumsChain;
                return createChain();
            });

            memberChain.single.mockResolvedValueOnce({
                data: { role: 'owner' },
                error: null
            });

            albumsChain.order.mockResolvedValueOnce({
                data: [
                    {
                        id: 'album-1',
                        name: 'Test Album',
                        album_photos: [{ count: 5 }]
                    }
                ],
                error: null
            });

            await albumController.getTreeAlbums(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: 'album-1',
                        name: 'Test Album',
                        photo_count: 5
                    })
                ])
            );
        });
    });

    describe('createAlbum', () => {
        it('should create an album with valid data', async () => {
            req.params.treeId = 'test-tree-id';
            req.body = { name: 'New Album' };

            const memberChain = createChain();
            const albumChain = createChain();

            mockSupabaseAdmin.from.mockImplementation((table) => {
                if (table === 'tree_members') return memberChain;
                if (table === 'albums') return albumChain;
                return createChain();
            });

            memberChain.single.mockResolvedValueOnce({
                data: { role: 'editor' },
                error: null
            });

            albumChain.single.mockResolvedValueOnce({
                data: { id: 'new-album-id', name: 'New Album' },
                error: null
            });

            await albumController.createAlbum(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'new-album-id' })
            );
        });
    });

    describe('deleteAlbum', () => {
        it('should delete album if user is owner', async () => {
            req.params.albumId = 'album-id';

            const albumFetchChain = createChain();
            const memberChain = createChain();
            const deleteChain = createChain();

            mockSupabaseAdmin.from.mockImplementation((table) => {
                if (table === 'albums') return albumFetchChain; // Reuse for fetch and delete if needed
                if (table === 'tree_members') return memberChain;
                return createChain();
            });

            // 1. Fetch album
            albumFetchChain.single.mockResolvedValueOnce({
                data: { tree_id: 'test-tree-id' },
                error: null
            });

            // 2. Check perm
            memberChain.single.mockResolvedValueOnce({
                data: { role: 'owner' },
                error: null
            });

            // 3. Delete
            // Redirect from('albums') to deleteChain for the delete call
            mockSupabaseAdmin.from.mockImplementationOnce(() => albumFetchChain) // fetch
                .mockImplementationOnce(() => memberChain)    // perm
                .mockImplementationOnce(() => deleteChain);   // delete

            deleteChain.eq.mockResolvedValueOnce({ error: null });

            await albumController.deleteAlbum(req, res);

            expect(res.json).toHaveBeenCalledWith({ message: 'Album deleted successfully' });
        });
    });
});
