import { format } from 'date-fns';

/**
 * Normalizes raw person and relationship data into a flat list of timeline events.
 * 
 * @param {Array} persons - List of person objects from the DB
 * @param {Array} relationships - List of relationship objects from the DB
 * @returns {Array} Sorted list of TimelineEvent objects
 */
export const normalizeTimelineEvents = (persons = [], relationships = []) => {
    const events = [];

    persons.forEach(person => {
        const personName = `${person.first_name} ${person.last_name || ''}`.trim();

        // Birth Event
        if (person.dob) {
            events.push({
                id: `birth-${person.id}`,
                personId: person.id,
                date: new Date(person.dob),
                type: 'birth',
                label: 'Born',
                description: person.pob || '',
                personName,
                metadata: { ...person }
            });
        }

        // Death Event
        if (person.dod) {
            events.push({
                id: `death-${person.id}`,
                personId: person.id,
                date: new Date(person.dod),
                type: 'death',
                label: 'Died',
                description: '', // Could add place of death if available
                personName,
                metadata: { ...person }
            });
        }

        // Occupation Events (if we had a date, for now just static or skip)
        // We could parse attributes if they have dates, but keeping it simple for now.
    });

    relationships.forEach(rel => {
        // Marriage Event
        if (rel.type === 'spouse') {
            // We need to find the names of the people involved
            const p1 = persons.find(p => p.id === rel.person_1_id);
            const p2 = persons.find(p => p.id === rel.person_2_id);

            if (p1 && p2) {
                // If the relationship has a start date (not currently in schema, but good to handle if added)
                // For now, we don't have a date for marriage in the schema, so we might skip it 
                // OR we could infer it if we had children dates, but that's complex.
                // Let's check if the relationship object has a 'start_date' or similar if we added it.
                // The current schema doesn't seem to have a date for relationships.
                // So we will skip generating marriage events for the timeline unless we have a date.

                if (rel.start_date) {
                    events.push({
                        id: `marriage-${rel.id}`,
                        personId: rel.person_1_id, // Associate with both? Or create two events?
                        date: new Date(rel.start_date),
                        type: 'marriage',
                        label: 'Married',
                        description: `to ${p2.first_name} ${p2.last_name || ''}`,
                        personName: `${p1.first_name} ${p1.last_name || ''}`,
                        metadata: { spouseId: p2.id, spouseName: `${p2.first_name} ${p2.last_name || ''}` }
                    });
                }
            }
        }
    });

    // Sort by date ascending
    return events.sort((a, b) => a.date - b.date);
};

/**
 * Groups events by year for the timeline visualization.
 * 
 * @param {Array} events - Sorted list of TimelineEvent objects
 * @returns {Object} Map of year -> events[]
 */
export const groupEventsByYear = (events) => {
    const groups = {};
    events.forEach(event => {
        const year = event.date.getFullYear();
        if (!groups[year]) {
            groups[year] = [];
        }
        groups[year].push(event);
    });
    return groups;
};

/**
 * Calculates the range of years to display.
 * 
 * @param {Array} events 
 * @returns {Object} { minYear, maxYear }
 */
export const getTimelineRange = (events) => {
    if (!events.length) return { minYear: new Date().getFullYear() - 100, maxYear: new Date().getFullYear() };

    const years = events.map(e => e.date.getFullYear());
    return {
        minYear: Math.min(...years) - 5, // Add some buffer
        maxYear: Math.max(...years) + 5
    };
};
