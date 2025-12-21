const { supabaseAdmin } = require('../middleware/auth');

// Helper to calculate distance between two points in km using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};

const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
};

exports.getNearbyPhotos = async (req, res) => {
    const { lat, lng, radius = 10, treeId } = req.query; // radius in km

    if (!lat || !lng) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    try {
        // Fetch all photos with location data for the given tree (or all if no treeId)
        // Note: For a production app with millions of photos, this should be a PostGIS query.
        // For this scale, fetching photos with location and filtering in memory is acceptable.

        let query = supabaseAdmin
            .from('photos')
            .select(`
                *,
                persons!inner (
                    id,
                    first_name,
                    last_name,
                    tree_id
                )
            `)
            .not('latitude', 'is', null)
            .not('longitude', 'is', null);

        if (treeId) {
            query = query.eq('persons.tree_id', treeId);
        }

        const { data, error } = await query;

        if (error) throw error;

        const centerLat = parseFloat(lat);
        const centerLng = parseFloat(lng);
        const radiusKm = parseFloat(radius);

        const nearbyPhotos = data.filter(photo => {
            const distance = calculateDistance(centerLat, centerLng, photo.latitude, photo.longitude);
            return distance <= radiusKm;
        }).map(photo => ({
            ...photo,
            distance_km: calculateDistance(centerLat, centerLng, photo.latitude, photo.longitude).toFixed(2),
            person_name: `${photo.persons.first_name} ${photo.persons.last_name || ''}`.trim()
        }));

        res.json(nearbyPhotos);
    } catch (error) {
        console.error('Error fetching nearby photos:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getPersonLocationStats = async (req, res) => {
    const { id: personId } = req.params;

    try {
        // 1. Fetch Photo Locations
        const { data: photoData, error: photoError } = await supabaseAdmin
            .from('photos')
            .select('latitude, longitude, location_name, taken_date, year')
            .eq('person_id', personId)
            .not('latitude', 'is', null);

        if (photoError) throw photoError;

        // 2. Fetch Person Locations (Places Lived)
        const { data: personLocData, error: personLocError } = await supabaseAdmin
            .from('person_locations')
            .select(`
                location_id,
                start_date,
                end_date,
                locations (
                    id,
                    name,
                    latitude,
                    longitude,
                    address
                )
            `)
            .eq('person_id', personId);

        if (personLocError) throw personLocError;

        // Combine data for the map
        // Map photo locations to a common format
        const photoLocations = photoData.map(p => ({
            type: 'photo',
            latitude: parseFloat(p.latitude),
            longitude: parseFloat(p.longitude),
            name: p.location_name,
            date: p.taken_date || (p.year ? `${p.year}-01-01` : null),
            details: { year: p.year }
        }));

        // Map person locations to a common format
        const livedLocations = personLocData
            .filter(pl => pl.locations && pl.locations.latitude && pl.locations.longitude)
            .map(pl => ({
                type: 'lived',
                latitude: parseFloat(pl.locations.latitude),
                longitude: parseFloat(pl.locations.longitude),
                name: pl.locations.name,
                date: pl.start_date,
                details: {
                    start: pl.start_date,
                    end: pl.end_date,
                    address: pl.locations.address
                }
            }));

        const allLocations = [...photoLocations, ...livedLocations];

        // Calculate stats
        const totalLocations = allLocations.length;
        const uniqueCities = new Set(allLocations.map(p => p.name).filter(Boolean)).size;

        // Find most visited place (simple frequency map of location_name)
        const locationCounts = {};
        allLocations.forEach(p => {
            if (p.name) {
                locationCounts[p.name] = (locationCounts[p.name] || 0) + 1;
            }
        });

        let mostVisited = null;
        let maxVisits = 0;
        Object.entries(locationCounts).forEach(([loc, count]) => {
            if (count > maxVisits) {
                maxVisits = count;
                mostVisited = loc;
            }
        });

        res.json({
            total_photos_with_location: photoLocations.length,
            total_places_lived: livedLocations.length,
            unique_locations: uniqueCities,
            most_visited_location: mostVisited,
            locations: allLocations // Return combined data
        });
    } catch (error) {
        console.error('Error fetching person location stats:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getGlobalTravelStats = async (req, res) => {
    const { treeId } = req.query;

    try {
        // 1. Fetch Photo Locations
        let photoQuery = supabaseAdmin
            .from('photos')
            .select(`
                latitude, 
                longitude, 
                location_name, 
                year,
                taken_date,
                persons!inner (
                    id,
                    first_name,
                    last_name,
                    tree_id,
                    profile_photo_url,
                    gender
                )
            `)
            .not('latitude', 'is', null);

        if (treeId) {
            photoQuery = photoQuery.eq('persons.tree_id', treeId);
        }

        const { data: photoData, error: photoError } = await photoQuery;
        if (photoError) throw photoError;

        // 2. Fetch Person Locations (Places Lived)
        let personLocQuery = supabaseAdmin
            .from('person_locations')
            .select(`
                start_date,
                end_date,
                locations!inner (
                    id,
                    name,
                    latitude,
                    longitude,
                    address
                ),
                persons!inner (
                    id,
                    first_name,
                    last_name,
                    tree_id,
                    profile_photo_url,
                    gender
                )
            `);

        if (treeId) {
            personLocQuery = personLocQuery.eq('persons.tree_id', treeId);
        }

        const { data: personLocData, error: personLocError } = await personLocQuery;
        if (personLocError) throw personLocError;

        // 3. Fetch Story Locations
        let storyLocQuery = supabaseAdmin
            .from('story_locations')
            .select(`
                locations!inner (
                    id,
                    name,
                    latitude,
                    longitude,
                    start_date,
                    address
                ),
                stories!inner (
                    id,
                    title,
                    content,
                    tree_id
                )
            `);

        if (treeId) {
            storyLocQuery = storyLocQuery.eq('stories.tree_id', treeId);
        }

        const { data: storyLocData, error: storyLocError } = await storyLocQuery;
        if (storyLocError) throw storyLocError;

        // Combine and Format Data
        const photoLocations = photoData.map(p => ({
            type: 'photo',
            latitude: parseFloat(p.latitude),
            longitude: parseFloat(p.longitude),
            name: p.location_name,
            date: p.taken_date || (p.year ? `${p.year}-01-01` : null),
            personId: p.persons.id,
            personName: `${p.persons.first_name} ${p.persons.last_name || ''}`.trim(),
            personImage: p.persons.profile_photo_url,
            personGender: p.persons.gender,
            details: { year: p.year || (p.taken_date ? new Date(p.taken_date).getFullYear() : null) }
        }));

        const livedLocations = personLocData
            .filter(pl => pl.locations && pl.locations.latitude && pl.locations.longitude)
            .map(pl => ({
                type: 'lived',
                latitude: parseFloat(pl.locations.latitude),
                longitude: parseFloat(pl.locations.longitude),
                name: pl.locations.name,
                date: pl.start_date,
                personId: pl.persons.id,
                personName: `${pl.persons.first_name} ${pl.persons.last_name || ''}`.trim(),
                personImage: pl.persons.profile_photo_url,
                personGender: pl.persons.gender,
                details: {
                    start: pl.start_date,
                    end: pl.end_date,
                    address: pl.locations.address
                }
            }));

        const storyLocations = storyLocData
            .filter(sl => sl.locations && sl.locations.latitude && sl.locations.longitude)
            .map(sl => ({
                type: 'story',
                latitude: parseFloat(sl.locations.latitude),
                longitude: parseFloat(sl.locations.longitude),
                name: sl.locations.name,
                date: sl.locations.start_date,
                storyId: sl.stories.id,
                storyTitle: sl.stories.title,
                details: {
                    content: sl.stories.content,
                    address: sl.locations.address,
                    year: sl.locations.start_date ? new Date(sl.locations.start_date).getFullYear() : null
                }
            }));

        const allLocations = [...photoLocations, ...livedLocations, ...storyLocations];

        // --- Existing Stats Calculation Logic (Updated to use allLocations where appropriate) ---

        // 1. Total locations visited
        const uniqueLocations = new Set(allLocations.map(p => p.name).filter(Boolean));

        // 2. Top Cities (using all locations)
        const cityCounts = {};
        allLocations.forEach(p => {
            if (p.name) {
                cityCounts[p.name] = (cityCounts[p.name] || 0) + 1;
            }
        });

        const topCities = Object.entries(cityCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([city, count]) => ({ city, count }));

        // 3. Most global family member
        const personLocationSets = {};
        allLocations.forEach(p => {
            if (!personLocationSets[p.personName]) {
                personLocationSets[p.personName] = new Set();
            }
            if (p.name) {
                personLocationSets[p.personName].add(p.name);
            }
        });

        let mostGlobalMember = { name: 'N/A', count: 0 };
        Object.entries(personLocationSets).forEach(([name, locations]) => {
            if (locations.size > mostGlobalMember.count) {
                mostGlobalMember = { name, count: locations.size };
            }
        });

        // 4. Photos per decade (Keep strictly for photos)
        const decadeCounts = {};
        photoData.forEach(p => {
            if (p.year) {
                const decade = Math.floor(p.year / 10) * 10;
                decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
            }
        });

        // 5. Countries covered
        const countries = new Set();
        allLocations.forEach(p => {
            if (p.name && p.name.includes(',')) {
                const parts = p.name.split(',');
                const country = parts[parts.length - 1].trim();
                countries.add(country);
            }
        });

        res.json({
            total_locations: uniqueLocations.size,
            top_cities: topCities,
            most_global_member: mostGlobalMember,
            photos_per_decade: decadeCounts,
            countries_count: countries.size,
            total_photos_mapped: photoLocations.length,
            total_places_lived: livedLocations.length,
            all_locations: allLocations // Return the full list for the map
        });

    } catch (error) {
        console.error('Error fetching global travel stats:', error);
        res.status(500).json({ error: error.message });
    }
};
