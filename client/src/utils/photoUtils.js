/**
 * Photo Gallery Utility Functions
 * Handles grouping, sorting, and filtering of photos
 */

/**
 * Sorts photos based on date and order
 * @param {Array} photos - Array of photo objects
 * @param {string} order - 'desc' or 'asc'
 * @returns {Array} Sorted array
 */
export const sortPhotos = (photos, order = 'desc') => {
    return [...photos].sort((a, b) => {
        const dateA = new Date(a.taken_date || a.created_at);
        const dateB = new Date(b.taken_date || b.created_at);
        return order === 'desc' ? dateB - dateA : dateA - dateB;
    });
};

/**
 * Filters photos by person ID
 * @param {Array} photos - Array of photo objects
 * @param {string} personId - Person ID to filter by, or 'all'
 * @returns {Array} Filtered array
 */
export const filterPhotos = (photos, personId) => {
    if (!personId || personId === 'all') return photos;
    return photos.filter(p => p.person_id === personId);
};

/**
 * Groups photos by Person
 * @param {Array} photos - Array of photo objects
 * @returns {Array} Array of group objects
 */
export const groupPhotosByPerson = (photos) => {
    const groups = {};
    photos.forEach(photo => {
        const name = photo.person_name || 'Unknown';
        if (!groups[name]) {
            groups[name] = {
                id: photo.person_id,
                name: name,
                photo: photo.person_photo,
                dob: photo.person_dob,
                items: []
            };
        }
        groups[name].items.push(photo);
    });
    return Object.values(groups);
};

/**
 * Groups photos by Date (Month Year)
 * @param {Array} photos - Array of photo objects
 * @param {string} sortOrder - 'desc' or 'asc'
 * @returns {Array} Array of group objects
 */
export const groupPhotosByDate = (photos, sortOrder = 'desc') => {
    const groups = {};
    photos.forEach(photo => {
        const date = new Date(photo.taken_date || photo.created_at);
        const key = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

        // Create a sortable date key (YYYY-MM) for easier sorting of groups
        const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!groups[key]) {
            groups[key] = {
                title: key,
                date: date,
                sortKey: sortKey,
                items: []
            };
        }
        groups[key].items.push(photo);
    });

    return Object.values(groups).sort((a, b) =>
        sortOrder === 'desc' ? b.date - a.date : a.date - b.date
    );
};

/**
 * Extract unique persons from photos list
 * @param {Array} photos 
 * @returns {Array} Array of person objects {id, name}
 */
export const getUniquePersons = (photos) => {
    const unique = new Map();
    photos.forEach(p => {
        if (!unique.has(p.person_id)) {
            unique.set(p.person_id, { id: p.person_id, name: p.person_name });
        }
    });
    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
};
