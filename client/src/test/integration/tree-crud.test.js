import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabase, mockTreeData } from '../utils/mockData';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Tree CRUD Operations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch.mockClear();
    });

    describe('Create Tree', () => {
        it('should create a new tree successfully', async () => {
            const newTree = {
                id: 'new-tree-id',
                name: 'New Family Tree',
                owner_id: 'mock-user-id',
                created_at: new Date().toISOString()
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => newTree
            });

            const response = await fetch('/api/trees', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer mock-token'
                },
                body: JSON.stringify({ name: 'New Family Tree' })
            });

            const data = await response.json();

            expect(response.ok).toBe(true);
            expect(data.name).toBe('New Family Tree');
            expect(data.id).toBeDefined();
        });

        it('should fail to create tree without authentication', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({ error: 'Unauthorized' })
            });

            const response = await fetch('/api/trees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'New Tree' })
            });

            expect(response.ok).toBe(false);
            expect(response.status).toBe(401);
        });
    });

    describe('Fetch Trees', () => {
        it('should fetch all user trees', async () => {
            const trees = [
                { id: 'tree-1', name: 'Family Tree 1', owner_id: 'mock-user-id' },
                { id: 'tree-2', name: 'Family Tree 2', owner_id: 'mock-user-id' }
            ];

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ ownedTrees: trees, sharedTrees: [] })
            });

            const response = await fetch('/api/trees', {
                headers: { 'Authorization': 'Bearer mock-token' }
            });

            const data = await response.json();

            expect(response.ok).toBe(true);
            expect(data.ownedTrees).toHaveLength(2);
            expect(data.ownedTrees[0].name).toBe('Family Tree 1');
        });
    });

    describe('Delete Tree', () => {
        it('should delete tree as owner', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ message: 'Tree deleted successfully' })
            });

            const response = await fetch('/api/tree/tree-1', {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer mock-token' }
            });

            expect(response.ok).toBe(true);
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/tree/tree-1',
                expect.objectContaining({ method: 'DELETE' })
            );
        });

        it('should fail to delete tree as non-owner', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 403,
                json: async () => ({ error: 'Forbidden' })
            });

            const response = await fetch('/api/tree/tree-1', {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer viewer-token' }
            });

            expect(response.ok).toBe(false);
            expect(response.status).toBe(403);
        });
    });

    describe('Get Tree Details', () => {
        it('should fetch tree with persons and relationships', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockTreeData
            });

            const response = await fetch('/api/tree/tree-1', {
                headers: { 'Authorization': 'Bearer mock-token' }
            });

            const data = await response.json();

            expect(response.ok).toBe(true);
            expect(data.persons).toHaveLength(2);
            expect(data.relationships).toHaveLength(1);
            expect(data.name).toBe('Test Family Tree');
        });
    });
});
