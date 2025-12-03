import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockTreeData } from '../utils/mockData';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Person CRUD Operations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch.mockClear();
    });

    describe('Create Person', () => {
        it('should create a new person successfully', async () => {
            const newPerson = {
                id: 'person-3',
                tree_id: 'tree-1',
                first_name: 'Alice',
                last_name: 'Smith',
                dob: '1990-03-20',
                gender: 'Female',
                bio: 'New person',
                occupation: 'Teacher'
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => newPerson
            });

            const response = await fetch('/api/person', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer mock-token'
                },
                body: JSON.stringify(newPerson)
            });

            const data = await response.json();

            expect(response.ok).toBe(true);
            expect(data.first_name).toBe('Alice');
            expect(data.id).toBeDefined();
        });

        it('should require editor or owner role to create person', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 403,
                json: async () => ({ error: 'Insufficient permissions' })
            });

            const response = await fetch('/api/person', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer viewer-token'
                },
                body: JSON.stringify({ first_name: 'Test' })
            });

            expect(response.ok).toBe(false);
            expect(response.status).toBe(403);
        });
    });

    describe('Update Person', () => {
        it('should update person details', async () => {
            const updatedPerson = {
                ...mockTreeData.persons[0],
                occupation: 'Senior Engineer'
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => updatedPerson
            });

            const response = await fetch('/api/person/person-1', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer mock-token'
                },
                body: JSON.stringify({ occupation: 'Senior Engineer' })
            });

            const data = await response.json();

            expect(response.ok).toBe(true);
            expect(data.occupation).toBe('Senior Engineer');
        });

        it('should validate date fields', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({ error: 'Invalid date format' })
            });

            const response = await fetch('/api/person/person-1', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer mock-token'
                },
                body: JSON.stringify({ dob: 'invalid-date' })
            });

            expect(response.ok).toBe(false);
            expect(response.status).toBe(400);
        });
    });

    describe('Delete Person', () => {
        it('should delete person successfully', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ message: 'Person deleted successfully' })
            });

            const response = await fetch('/api/person/person-1', {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer mock-token' }
            });

            expect(response.ok).toBe(true);
        });

        it('should cascade delete relationships', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    message: 'Person deleted successfully',
                    deletedRelationships: 2
                })
            });

            const response = await fetch('/api/person/person-1', {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer mock-token' }
            });

            const data = await response.json();

            expect(response.ok).toBe(true);
            expect(data.deletedRelationships).toBeGreaterThan(0);
        });
    });

    describe('Merge Persons', () => {
        it('should merge duplicate persons', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    message: 'Persons merged successfully',
                    mergedId: 'person-1',
                    deletedId: 'person-duplicate'
                })
            });

            const response = await fetch('/api/person/merge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer mock-token'
                },
                body: JSON.stringify({
                    keepId: 'person-1',
                    mergeId: 'person-duplicate'
                })
            });

            const data = await response.json();

            expect(response.ok).toBe(true);
            expect(data.mergedId).toBe('person-1');
        });
    });
});
