import { describe, it, expect } from 'vitest';
import { groupPhotosByDate, groupPhotosByPerson, sortPhotos } from './photoUtils';

describe('photoUtils', () => {
    const mockPhotos = [
        {
            id: 1,
            taken_date: '2023-12-25',
            person_id: 'p1',
            person_name: 'Alice',
            url: 'url1'
        },
        {
            id: 2,
            taken_date: '2023-12-24', // Earlier in same month
            person_id: 'p2',
            person_name: 'Bob',
            url: 'url2'
        },
        {
            id: 3,
            taken_date: '2024-01-01', // Different month/year
            person_id: 'p1',
            person_name: 'Alice',
            url: 'url3'
        },
        {
            id: 4,
            created_at: '2023-12-20', // Fallback to created_at
            person_id: 'p3',
            person_name: 'Charlie',
            url: 'url4'
        }
    ];

    describe('groupPhotosByDate', () => {
        it('groups photos by month and year', () => {
            const groups = groupPhotosByDate(mockPhotos);

            // Should have 2 groups: December 2023 and January 2024
            expect(groups).toHaveLength(2);

            // Sort order is desc by default (Newest first)
            expect(groups[0].title).toBe('January 2024');
            expect(groups[1].title).toBe('December 2023');

            expect(groups[0].items).toHaveLength(1); // id 3
            expect(groups[1].items).toHaveLength(3); // id 1, 2, 4
        });

        it('sorts items within groups by date desc', () => {
            const groups = groupPhotosByDate(mockPhotos);
            const decGroup = groups.find(g => g.title === 'December 2023');

            // 25th, 24th, 20th
            expect(decGroup.items[0].id).toBe(1);
            expect(decGroup.items[1].id).toBe(2);
            expect(decGroup.items[2].id).toBe(4);
        });
    });

    describe('groupPhotosByPerson', () => {
        it('groups photos by person name', () => {
            const groups = groupPhotosByPerson(mockPhotos);

            expect(groups).toHaveLength(3); // Alice, Bob, Charlie

            const aliceGroup = groups.find(g => g.name === 'Alice');
            expect(aliceGroup.items).toHaveLength(2);
        });
    });

    describe('sortPhotos', () => {
        it('sorts photos descending by default', () => {
            const sorted = sortPhotos(mockPhotos);
            expect(sorted[0].id).toBe(3); // 2024-01-01
            expect(sorted[3].id).toBe(4); // 2023-12-20
        });
    });
});
