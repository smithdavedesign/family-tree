const { describe, it, expect, beforeEach, vi } = require('vitest');
const request = require('supertest');

// Mock supabase client
const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    insert: vi.fn(() => mockSupabase),
    update: vi.fn(() => mockSupabase),
    delete: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    single: vi.fn(() => mockSupabase),
    order: vi.fn(() => mockSupabase)
};

vi.mock('../supabaseClient', () => ({
    supabase: mockSupabase
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
            json: vi.fn(),
            status: vi.fn(() => res)
        };
        vi.clearAllMocks();
    });

    describe('getTreeAlbums', () => {
        it('should return albums for a tree', async () => {
            req.params.treeId = 'test-tree-id';

            // Mock tree member check
            mockSupabase.single.mockResolvedValueOnce({
                data: { role: 'owner' },
                error: null
            });

            // Mock albums fetch
            mockSupabase.order.mockResolvedValueOnce({
                data: [
                    {
                        id: 'album-1',
                        name: 'Test Album',
                        description: 'Test Description',
                        cover_photo_id: null,
                        is_private: false,
                        created_at: '2024-01-01',
                        updated_at: '2024-01-01',
                        cover_photo: null,
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

        it('should return 403 if user does not have access', async () => {
            req.params.treeId = 'test-tree-id';

            mockSupabase.single.mockResolvedValueOnce({
                data: null,
                error: null
            });

            await albumController.getTreeAlbums(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' });
        });
    });

    describe('createAlbum', () => {
        it('should create an album with valid data', async () => {
            req.params.treeId = 'test-tree-id';
            req.body = {
                name: 'New Album',
                description: 'Album description',
                is_private: false
            };

            // Mock editor role check
            mockSupabase.single.mockResolvedValueOnce({
                data: { role: 'editor' },
                error: null
            });

            // Mock album creation
            mockSupabase.single.mockResolvedValueOnce({
                data: {
                    id: 'new-album-id',
                    tree_id: 'test-tree-id',
                    name: 'New Album',
                    description: 'Album description',
                    is_private: false,
                    created_by: 'test-user-id'
                },
                error: null
            });

            await albumController.createAlbum(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'new-album-id',
                    name: 'New Album'
                })
            );
        });

        it('should return 403 if user is not editor/owner', async () => {
            req.params.treeId = 'test-tree-id';
            req.body = { name: 'New Album' };

            mockSupabase.single.mockResolvedValueOnce({
                data: { role: 'viewer' },
                error: null
            });

            await albumController.createAlbum(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
        });
    });

    describe('deleteAlbum', () => {
        it('should delete album if user is owner', async () => {
            req.params.albumId = 'album-id';

            // Mock album fetch
            mockSupabase.single.mockResolvedValueOnce({
                data: { tree_id: 'test-tree-id', name: 'Test Album' },
                error: null
            });

            // Mock owner role check
            mockSupabase.single.mockResolvedValueOnce({
                data: { role: 'owner' },
                error: null
            });

            // Mock delete
            mockSupabase.eq.mockResolvedValueOnce({
                error: null
            });

            await albumController.deleteAlbum(req, res);

            expect(res.json).toHaveBeenCalledWith({ message: 'Album deleted successfully' });
        });

        it('should return 403 if user is not owner', async () => {
            req.params.albumId = 'album-id';

            mockSupabase.single.mockResolvedValueOnce({
                data: { tree_id: 'test-tree-id' },
                error: null
            });

            mockSupabase.single.mockResolvedValueOnce({
                data: { role: 'editor' },
                error: null
            });

            await albumController.deleteAlbum(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: 'Only owners can delete albums' });
        });
    });

    describe('addPhotosToAlbum', () => {
        it('should add photos to album', async () => {
            req.params.albumId = 'album-id';
            req.body = { photo_ids: ['photo-1', 'photo-2', 'photo-3'] };

            // Mock album fetch
            mockSupabase.single.mockResolvedValueOnce({
                data: { tree_id: 'test-tree-id' },
                error: null
            });

            // Mock editor role check
            mockSupabase.single.mockResolvedValueOnce({
                data: { role: 'editor' },
                error: null
            });

            // Mock max sort_order fetch
            mockSupabase.single.mockResolvedValueOnce({
                data: { sort_order: 5 },
                error: null
            });

            // Mock upsert
            mockSupabase.select.mockResolvedValueOnce({
                data: [{ id: '1' }, { id: '2' }, { id: '3' }],
                error: null
            });

            await albumController.addPhotosToAlbum(req, res);

            expect(res.json).toHaveBeenCalledWith({
                added: 3,
                message: 'Added 3 photos to album'
            });
        });

        it('should return 400 if photo_ids is invalid', async () => {
            req.params.albumId = 'album-id';
            req.body = { photo_ids: [] };

            await albumController.addPhotosToAlbum(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'photo_ids must be a non-empty array'
            });
        });
    });
});
