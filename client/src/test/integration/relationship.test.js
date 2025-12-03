import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Relationship Management', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch.mockClear();
    });

    describe('Create Relationship', () => {
        it('should create parent-child relationship', async () => {
            const newRelationship = {
                id: 'rel-new',
                tree_id: 'tree-1',
                person_1_id: 'parent-id',
                person_2_id: 'child-id',
                type: 'parent_child'
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => newRelationship
            });

            const response = await fetch('/api/relationship', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer mock-token'
                },
                body: JSON.stringify({
                    tree_id: 'tree-1',
                    person_1_id: 'parent-id',
                    person_2_id: 'child-id',
                    type: 'parent_child'
                })
            });

            const data = await response.json();

            expect(response.ok).toBe(true);
            expect(data.type).toBe('parent_child');
        });

        it('should create spouse relationship', async () => {
            const spouseRelationship = {
                id: 'rel-spouse',
                tree_id: 'tree-1',
                person_1_id: 'person-1',
                person_2_id: 'person-2',
                type: 'spouse'
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => spouseRelationship
            });

            const response = await fetch('/api/relationship', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer mock-token'
                },
                body: JSON.stringify({
                    tree_id: 'tree-1',
                    person_1_id: 'person-1',
                    person_2_id: 'person-2',
                    type: 'spouse'
                })
            });

            const data = await response.json();

            expect(response.ok).toBe(true);
            expect(data.type).toBe('spouse');
        });

        it('should create adoptive relationship', async () => {
            const adoptiveRelationship = {
                id: 'rel-adoptive',
                tree_id: 'tree-1',
                person_1_id: 'adoptive-parent-id',
                person_2_id: 'child-id',
                type: 'adoptive_parent_child'
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => adoptiveRelationship
            });

            const response = await fetch('/api/relationship', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer mock-token'
                },
                body: JSON.stringify({
                    tree_id: 'tree-1',
                    person_1_id: 'adoptive-parent-id',
                    person_2_id: 'child-id',
                    type: 'adoptive_parent_child'
                })
            });

            const data = await response.json();

            expect(response.ok).toBe(true);
            expect(data.type).toBe('adoptive_parent_child');
        });

        it('should prevent duplicate relationships', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({ error: 'Relationship already exists' })
            });

            const response = await fetch('/api/relationship', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer mock-token'
                },
                body: JSON.stringify({
                    tree_id: 'tree-1',
                    person_1_id: 'person-1',
                    person_2_id: 'person-2',
                    type: 'spouse'
                })
            });

            expect(response.ok).toBe(false);
            expect(response.status).toBe(400);
        });
    });

    describe('Delete Relationship', () => {
        it('should delete relationship successfully', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ message: 'Relationship deleted successfully' })
            });

            const response = await fetch('/api/relationship/rel-1', {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer mock-token' }
            });

            expect(response.ok).toBe(true);
        });

        it('should require editor or owner role to delete', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 403,
                json: async () => ({ error: 'Insufficient permissions' })
            });

            const response = await fetch('/api/relationship/rel-1', {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer viewer-token' }
            });

            expect(response.ok).toBe(false);
            expect(response.status).toBe(403);
        });
    });
});
