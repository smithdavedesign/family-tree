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
        let query = supabaseAdmin
            .from('photos')
            .select(`
                latitude, 
                longitude, 
                location_name, 
                year,
                persons!inner (
                    id,
                    first_name,
                    last_name,
                    tree_id
                )
            `)
            .not('latitude', 'is', null);

        if (treeId) {
            query = query.eq('persons.tree_id', treeId);
        }

        const { data, error } = await query;

        if (error) throw error;

        // 1. Total locations visited (unique lat/lng pairs approx or unique names)
        const uniqueLocations = new Set(data.map(p => p.location_name).filter(Boolean));

        // 2. Top photographed cities
        const cityCounts = {};
        data.forEach(p => {
            if (p.location_name) {
                // Simple heuristic: assume location_name is "City, Country" or just "City"
                // For better accuracy, we'd parse this, but for now use full string
                cityCounts[p.location_name] = (cityCounts[p.location_name] || 0) + 1;
            }
        });

        const topCities = Object.entries(cityCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([city, count]) => ({ city, count }));

        // 3. Most global family member (most unique locations)
        const personLocations = {};
        data.forEach(p => {
            const personName = `${p.persons.first_name} ${p.persons.last_name || ''}`.trim();
            if (!personLocations[personName]) {
                personLocations[personName] = new Set();
            }
            if (p.location_name) {
                personLocations[personName].add(p.location_name);
            }
        });

        let mostGlobalMember = { name: 'N/A', count: 0 };
        Object.entries(personLocations).forEach(([name, locations]) => {
            if (locations.size > mostGlobalMember.count) {
                mostGlobalMember = { name, count: locations.size };
            }
        });

        // 4. Photos per decade
        const decadeCounts = {};
        data.forEach(p => {
            if (p.year) {
                const decade = Math.floor(p.year / 10) * 10;
                decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
            }
        });

        // 5. Countries covered (Naive extraction from location_name)
        // Assuming location_name format "City, Country"
        const countries = new Set();
        data.forEach(p => {
            if (p.location_name && p.location_name.includes(',')) {
                const parts = p.location_name.split(',');
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
            total_photos_mapped: data.length
        });

    } catch (error) {
        console.error('Error fetching global travel stats:', error);
        res.status(500).json({ error: error.message });
    }
};
