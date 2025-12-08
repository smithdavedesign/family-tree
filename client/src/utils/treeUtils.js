/**
 * Tree data manipulation utilities for visualization components
 */

/**
 * Build ancestor tree from a starting person
 * @param {string} personId - ID of the person to find ancestors for
 * @param {Array} persons - All persons in the tree
 * @param {Array} relationships - All relationships
 * @param {number} maxDepth - Maximum generations to traverse (default 5)
 * @returns {Object} Hierarchical ancestor tree structure
 */
export const buildAncestorTree = (personId, persons, relationships, maxDepth = 5) => {
    const person = persons.find(p => p.id === personId);
    if (!person) return null;

    const getParents = (childId) => {
        return relationships
            .filter(r => r.person_2_id === childId && r.type === 'parent_child')
            .map(r => persons.find(p => p.id === r.person_1_id))
            .filter(Boolean);
    };

    const buildTree = (currentPerson, depth = 0) => {
        if (!currentPerson || depth >= maxDepth) {
            return { ...currentPerson, parents: [] };
        }

        const parents = getParents(currentPerson.id);
        return {
            ...currentPerson,
            parents: parents.map(parent => buildTree(parent, depth + 1)),
            generation: depth
        };
    };

    return buildTree(person);
};

/**
 * Build descendant tree from a starting person
 * @param {string} personId - ID of the person to find descendants for
 * @param {Array} persons - All persons in the tree
 * @param {Array} relationships - All relationships
 * @param {number} maxDepth - Maximum generations to traverse (default 5)
 * @returns {Object} Hierarchical descendant tree structure
 */
export const buildDescendantTree = (personId, persons, relationships, maxDepth = 5) => {
    const person = persons.find(p => p.id === personId);
    if (!person) return null;

    const getChildren = (parentId) => {
        return relationships
            .filter(r => r.person_1_id === parentId && r.type === 'parent_child')
            .map(r => persons.find(p => p.id === r.person_2_id))
            .filter(Boolean);
    };

    const buildTree = (currentPerson, depth = 0) => {
        if (!currentPerson || depth >= maxDepth) {
            return { ...currentPerson, children: [] };
        }

        const children = getChildren(currentPerson.id);
        return {
            ...currentPerson,
            children: children.map(child => buildTree(child, depth + 1)),
            generation: depth
        };
    };

    return buildTree(person);
};

/**
 * Get all descendants as a flat array (for React Flow filtering)
 * @param {string} personId - ID of the person
 * @param {Array} persons - All persons
 * @param {Array} relationships - All relationships
 * @returns {Array} Array of person IDs that are descendants
 */
export const getDescendantIds = (personId, persons, relationships) => {
    const descendantIds = new Set([personId]);
    const queue = [personId];

    while (queue.length > 0) {
        const currentId = queue.shift();
        const children = relationships
            .filter(r => r.person_1_id === currentId && r.type === 'parent_child')
            .map(r => r.person_2_id);

        children.forEach(childId => {
            if (!descendantIds.has(childId)) {
                descendantIds.add(childId);
                queue.push(childId);
            }
        });
    }

    return Array.from(descendantIds);
};

/**
 * Aggregate all events for timeline view
 * @param {Array} persons - All persons
 * @param {Array} relationships - All relationships
 * @param {Array} lifeEvents - All life events
 * @returns {Array} Array of timeline events sorted by date
 */
export const aggregateTimeline = (persons, relationships, lifeEvents = []) => {
    const events = [];

    // Add birth events
    persons.forEach(person => {
        if (person.dob) {
            events.push({
                id: `birth-${person.id}`,
                type: 'birth',
                date: new Date(person.dob),
                timestamp: new Date(person.dob).getTime(),
                person,
                label: `${person.first_name} ${person.last_name || ''} born`
            });
        }
    });

    // Add death events
    persons.forEach(person => {
        if (person.dod) {
            events.push({
                id: `death-${person.id}`,
                type: 'death',
                date: new Date(person.dod),
                timestamp: new Date(person.dod).getTime(),
                person,
                label: `${person.first_name} ${person.last_name || ''} died`
            });
        }
    });

    // Add marriage events (from relationships with spouse type)
    // Note: marriage_date column doesn't exist yet, skip for now
    // relationships
    //     .filter(r => r.type === 'spouse' && r.marriage_date)
    //     .forEach(rel => {
    //         const p1 = persons.find(p => p.id === rel.person_1_id);
    //         const p2 = persons.find(p => p.id === rel.person_2_id);
    //         if (p1 && p2) {
    //             events.push({
    //                 id: `marriage-${rel.id}`,
    //                 type: 'marriage',
    //                 date: new Date(rel.marriage_date),
    //                 timestamp: new Date(rel.marriage_date).getTime(),
    //                 persons: [p1, p2],
    //                 label: `${p1.first_name} & ${p2.first_name} married`
    //             });
    //         }
    //     });

    // Add life events
    lifeEvents.forEach(event => {
        if (event.date) {
            const person = persons.find(p => p.id === event.person_id);
            if (person) {
                events.push({
                    id: `event-${event.id}`,
                    type: 'life_event',
                    subtype: event.event_type,
                    date: new Date(event.date),
                    timestamp: new Date(event.date).getTime(),
                    person,
                    label: `${person.first_name}: ${event.title}`,
                    description: event.description
                });
            }
        }
    });

    // Sort by date (oldest first)
    return events.sort((a, b) => a.timestamp - b.timestamp);
};

/**
 * Transform timeline events for Recharts format
 * @param {Array} events - Timeline events from aggregateTimeline
 * @param {Array} persons - All persons (for y-axis indexing)
 * @returns {Array} Events in Recharts format
 */
export const transformForRecharts = (events, persons) => {
    // Create a person index map for y-axis positioning
    const personIndexMap = new Map();
    let index = 0;
    persons.forEach(person => {
        personIndexMap.set(person.id, index++);
    });

    return events.map(event => ({
        x: event.timestamp,
        y: event.person ? personIndexMap.get(event.person.id) || 0 : 0,
        type: event.type,
        label: event.label,
        person: event.person,
        persons: event.persons, // for marriages
        ...event
    }));
};
