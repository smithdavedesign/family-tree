const { supabaseAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

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
        logger.error('Error fetching nearby photos:', error, req);
        res.status(500).json({ error: error.message });
    }
};

exports.getPersonLocationStats = async (req, res) => {
    const { id: personId } = req.params;

    try {
        // 1. Fetch Person Details (for vitals mapping)
        const { data: person, error: personError } = await supabaseAdmin
            .from('persons')
            .select('pob, place_of_death, burial_place, dob, dod')
            .eq('id', personId)
            .single();

        if (personError) throw personError;

        // 2. Fetch Photo Locations (Fetch ALL photos to find unmapped ones)
        const { data: photoData, error: photoError } = await supabaseAdmin
            .from('photos')
            .select('latitude, longitude, location_name, taken_date, year')
            .eq('person_id', personId);
        // .not('latitude', 'is', null); // Removed to include unmapped photos

        if (photoError) throw photoError;

        // 3. Fetch Person Locations (Places Lived)
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

        // 4. Fetch Life Events (New feature)
        const { data: eventData, error: eventError } = await supabaseAdmin
            .from('life_events')
            .select('*')
            .eq('person_id', personId);

        if (eventError) throw eventError;

        // 5. Fetch Story Locations
        const { data: storyPeopleData, error: storyError } = await supabaseAdmin
            .from('story_people')
            .select(`
                story_id,
                stories (
                    title,
                    story_locations (
                        locations (*)
                    )
                )
            `)
            .eq('person_id', personId);

        if (storyError) throw storyError;

        // 6. Fetch all known locations (MOVED UP - needed for photo processing)
        const { data: allKnownLocations } = await supabaseAdmin
            .from('locations')
            .select('*')
            .not('latitude', 'is', null);

        const knownLocationsMap = new Map(allKnownLocations?.map(l => [l.name.toLowerCase(), l]) || []);

        // --- Processing Data ---

        const mappedLocations = [];
        const unmappedLocations = new Set(); // Store unique names of unmapped locations

        // A. Process Photos
        photoData.forEach(p => {
            if (p.latitude && p.longitude) {
                mappedLocations.push({
                    type: 'photo',
                    latitude: parseFloat(p.latitude),
                    longitude: parseFloat(p.longitude),
                    name: p.location_name,
                    date: p.taken_date || (p.year ? `${p.year}-01-01` : null),
                    details: { year: p.year }
                });
            } else if (p.location_name) {
                // Try to find in known locations
                const lowerLoc = p.location_name.toLowerCase();
                if (knownLocationsMap.has(lowerLoc)) {
                    const loc = knownLocationsMap.get(lowerLoc);
                    mappedLocations.push({
                        type: 'photo',
                        latitude: parseFloat(loc.latitude),
                        longitude: parseFloat(loc.longitude),
                        name: p.location_name, // Keep original string
                        date: p.taken_date || (p.year ? `${p.year}-01-01` : null),
                        details: { year: p.year, mappedFrom: loc.name }
                    });
                } else {
                    unmappedLocations.add(p.location_name);
                }
            }
        });

        // B. Process Life Events & Vitals
        // Events
        eventData.forEach(event => {
            if (!event.location) return;

            const lowerLoc = event.location.toLowerCase();
            if (knownLocationsMap.has(lowerLoc)) {
                const loc = knownLocationsMap.get(lowerLoc);
                mappedLocations.push({
                    type: 'event',
                    latitude: parseFloat(loc.latitude),
                    longitude: parseFloat(loc.longitude),
                    name: loc.name,
                    date: event.date,
                    details: {
                        description: event.description,
                        locationName: event.location,
                        eventType: event.event_type
                    }
                });
            } else {
                unmappedLocations.add(event.location);
            }
        });

        // Vitals
        if (person) {
            // Helper for vitals
            const processVital = (locString, date, type, desc) => {
                if (!locString) return;
                const lowerLoc = locString.toLowerCase();
                if (knownLocationsMap.has(lowerLoc)) {
                    const loc = knownLocationsMap.get(lowerLoc);
                    mappedLocations.push({
                        type: 'event', // Treat vitals as events on the map
                        latitude: parseFloat(loc.latitude),
                        longitude: parseFloat(loc.longitude),
                        name: loc.name,
                        date: date,
                        details: {
                            description: desc,
                            locationName: locString,
                            eventType: type
                        }
                    });
                } else {
                    unmappedLocations.add(locString);
                }
            };

            processVital(person.pob, person.dob, 'birth', 'Birth Place');
            processVital(person.place_of_death, person.dod, 'death', `Death Place (${person.cause_of_death || 'Unknown cause'})`);
            processVital(person.burial_place, person.dod, 'burial', 'Burial Place');
        }

        // C. Process Places Lived (Person Locations)
        personLocData.forEach(pl => {
            if (pl.locations && pl.locations.latitude && pl.locations.longitude) {
                mappedLocations.push({
                    type: 'residence',
                    latitude: parseFloat(pl.locations.latitude),
                    longitude: parseFloat(pl.locations.longitude),
                    name: pl.locations.name,
                    date: pl.start_date,
                    details: {
                        endDate: pl.end_date,
                        notes: pl.notes,
                        locationName: pl.locations.name
                    }
                });
            } else if (pl.locations && pl.locations.name) {
                unmappedLocations.add(pl.locations.name);
            }
        });

        // D. Process Story Locations
        storyPeopleData.forEach(sp => {
            if (sp.stories && sp.stories.story_locations) {
                sp.stories.story_locations.forEach(sl => {
                    const loc = sl.locations;
                    if (loc && loc.latitude && loc.longitude) {
                        mappedLocations.push({
                            type: 'story',
                            latitude: parseFloat(loc.latitude),
                            longitude: parseFloat(loc.longitude),
                            name: loc.name,
                            date: null, // Stories might not have a single "event date" besides creation
                            details: {
                                storyTitle: sp.stories.title,
                                storyId: sp.story_id,
                                locationName: loc.name
                            }
                        });
                    }
                });
            }
        });


        // --- Calculate Stats ---
        const allLocations = mappedLocations; // Ensure backward compat with frontend variable name
        const totalLocations = allLocations.length;

        // Unique locations count = (Mapped Unique) + (Unmapped Unique)
        const mappedUniqueNames = new Set(allLocations.map(p => p.name).filter(Boolean));
        const totalUniqueCount = new Set([...mappedUniqueNames, ...unmappedLocations]).size;

        // Find most visited (only for mapped ones for now, or we could include unmapped frequency?)
        // Let's stick to mapped for "Most Visited" location on the map, but "Most Frequent" might textually be an unmapped one.
        // For simplicity, we'll keep the existing logic based on 'allLocations' (mapped ones).
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

        const stats = {
            total_photos_with_location: photoData.filter(p => p.latitude && p.longitude).length,
            total_places_lived: personLocData.length,
            total_life_events: eventData.filter(e => e.location || knownLocationsMap.has(e.location?.toLowerCase())).length,
            total_stories: mappedLocations.filter(loc => loc.type === 'story').length,
            unique_locations: totalUniqueCount,
            most_visited_location: mostVisited,
            locations: mappedLocations,
            unmapped_locations: Array.from(unmappedLocations)
        };

        res.json(stats);
    } catch (error) {
        logger.error('Error fetching person location stats:', error, req);
        res.status(500).json({ error: error.message });
    }
};

exports.getGlobalTravelStats = async (req, res) => {
    const { treeId } = req.query;
    const userId = req.user.id;

    try {
        let targetTreeIds = [];

        if (treeId) {
            // Verify access to specific tree
            const { data: member } = await supabaseAdmin
                .from('tree_members')
                .select('tree_id')
                .eq('tree_id', treeId)
                .eq('user_id', userId)
                .single();

            // Also check ownership if not a member (though owner should be member)
            // Or if tree is public (not implemented yet, assuming private for now)
            if (member) {
                targetTreeIds = [treeId];
            } else {
                return res.status(403).json({ error: 'Unauthorized access to tree' });
            }
        } else {
            // Fetch all trees user has access to
            const { data: members } = await supabaseAdmin
                .from('tree_members')
                .select('tree_id')
                .eq('user_id', userId);

            if (members && members.length > 0) {
                targetTreeIds = members.map(m => m.tree_id);
            }
        }

        if (targetTreeIds.length === 0) {
            return res.json({
                total_locations: 0,
                countries_count: 0,
                total_photos_mapped: 0,
                total_places_lived: 0,
                total_stories_mapped: 0,
                total_events_mapped: 0,
                all_locations: []
            });
        }

        // 1. Fetch all people in the target trees
        const { data: persons, error: personsError } = await supabaseAdmin
            .from('persons')
            .select('*')
            .in('tree_id', targetTreeIds);

        if (personsError) throw personsError;

        const personMap = new Map(persons.map(p => [p.id, p]));
        const personIds = persons.map(p => p.id);

        // 2. Fetch all known locations (for vitals string matching)
        const { data: allLocationsRef } = await supabaseAdmin
            .from('locations')
            .select('*')
            .not('latitude', 'is', null);

        const locationNameMap = new Map(allLocationsRef?.map(l => [l.name.toLowerCase(), l]) || []);

        // 3. Fetch Photo Locations
        // We can fetch by person_id directly now
        let photoData = [];
        if (personIds.length > 0) {
            const { data: pd, error: photoError } = await supabaseAdmin
                .from('photos')
                .select('*')
                .in('person_id', personIds)
                .not('latitude', 'is', null);

            if (photoError) throw photoError;
            photoData = pd;
        }

        // 4. Fetch Person Locations (Places Lived)
        let personLocData = [];
        if (personIds.length > 0) {
            const { data: pld, error: personLocError } = await supabaseAdmin
                .from('person_locations')
                .select(`
                    *,
                    locations!inner (*)
                `)
                .in('person_id', personIds);

            if (personLocError) throw personLocError;
            personLocData = pld;
        }

        // 5. Fetch Story Locations
        // Stories belong to trees, so we fetch stories for targetTreeIds
        const { data: storyLocData, error: storyLocError } = await supabaseAdmin
            .from('story_locations')
            .select(`
                locations!inner (*),
                stories!inner (
                    id, 
                    title,
                    tree_id,
                    story_people (person_id)
                )
            `)
            .in('stories.tree_id', targetTreeIds);

        if (storyLocError) throw storyLocError;

        // 6. Fetch Life Event Locations
        // Fetch via known personIds to be safe/efficient
        let eventLocData = [];
        if (personIds.length > 0) {
            const { data: eld, error: eventLocError } = await supabaseAdmin
                .from('life_event_locations')
                .select(`
                    locations!inner (*),
                    life_events!inner (
                        id, 
                        title, 
                        event_type, 
                        date, 
                        description, 
                        person_id
                    )
                `)
                .in('life_events.person_id', personIds);

            if (eventLocError) throw eventLocError;
            eventLocData = eld;
        }

        // --- Formatting and Aggregation ---

        const formattedLocations = [];

        // A. Photos
        photoData.forEach(p => {
            const person = personMap.get(p.person_id);
            if (person) {
                formattedLocations.push({
                    type: 'photo',
                    latitude: parseFloat(p.latitude),
                    longitude: parseFloat(p.longitude),
                    name: p.location_name,
                    date: p.taken_date || (p.year ? `${p.year}-01-01` : null),
                    personId: person.id,
                    personName: `${person.first_name} ${person.last_name || ''}`.trim(),
                    personImage: person.profile_photo_url,
                    photoUrl: p.url,
                    details: { year: p.year, title: p.description }
                });
            }
        });

        // B. Places Lived
        personLocData.forEach(pl => {
            if (pl.locations?.latitude && pl.locations?.longitude) {
                const person = personMap.get(pl.person_id);
                if (person) {
                    formattedLocations.push({
                        type: 'lived',
                        latitude: parseFloat(pl.locations.latitude),
                        longitude: parseFloat(pl.locations.longitude),
                        name: pl.locations.name,
                        date: pl.start_date,
                        personId: person.id,
                        personName: `${person.first_name} ${person.last_name || ''}`.trim(),
                        personImage: person.profile_photo_url,
                        details: {
                            start: pl.start_date,
                            end: pl.end_date,
                            address: pl.locations.address
                        }
                    });
                }
            }
        });

        // C. Story Locations
        storyLocData.forEach(sl => {
            if (sl.locations?.latitude && sl.locations?.longitude) {
                const associatedPersonIds = sl.stories.story_people?.map(sp => sp.person_id) || [];

                // If no people linked, add as generic tree location
                if (associatedPersonIds.length === 0) {
                    formattedLocations.push({
                        type: 'story',
                        latitude: parseFloat(sl.locations.latitude),
                        longitude: parseFloat(sl.locations.longitude),
                        name: sl.locations.name,
                        date: null,
                        storyId: sl.stories.id,
                        storyTitle: sl.stories.title,
                        personId: 'tree',
                        details: { address: sl.locations.address }
                    });
                } else {
                    // Duplicate for each person (so filtering by person works)
                    associatedPersonIds.forEach(pid => {
                        const person = personMap.get(pid);
                        formattedLocations.push({
                            type: 'story',
                            latitude: parseFloat(sl.locations.latitude),
                            longitude: parseFloat(sl.locations.longitude),
                            name: sl.locations.name,
                            date: null,
                            storyId: sl.stories.id,
                            storyTitle: sl.stories.title,
                            personId: pid,
                            personName: person ? `${person.first_name} ${person.last_name || ''}`.trim() : null,
                            personImage: person?.profile_photo_url,
                            details: { address: sl.locations.address }
                        });
                    });
                }
            }
        });

        // D. Life Events
        eventLocData?.forEach(el => {
            if (el.locations?.latitude && el.locations?.longitude) {
                const person = personMap.get(el.life_events.person_id);
                if (person) {
                    formattedLocations.push({
                        type: 'event',
                        latitude: parseFloat(el.locations.latitude),
                        longitude: parseFloat(el.locations.longitude),
                        name: el.locations.name,
                        date: el.life_events.date,
                        personId: el.life_events.person_id,
                        personName: `${person.first_name} ${person.last_name || ''}`.trim(),
                        personImage: person.profile_photo_url,
                        details: {
                            title: el.life_events.title,
                            eventType: el.life_events.event_type,
                            description: el.life_events.description
                        }
                    });
                }
            }
        });

        // E. Vitals (POB, Burial, etc. as Events)
        persons.forEach(p => {
            const processVital = (locString, date, type, title) => {
                if (!locString) return;
                const lowerLoc = locString.toLowerCase();
                const loc = locationNameMap.get(lowerLoc);
                if (loc) {
                    formattedLocations.push({
                        type: 'event',
                        latitude: parseFloat(loc.latitude),
                        longitude: parseFloat(loc.longitude),
                        name: loc.name,
                        date: date,
                        personId: p.id,
                        personName: `${p.first_name} ${p.last_name || ''}`.trim(),
                        personImage: p.profile_photo_url,
                        details: {
                            title: title,
                            eventType: type,
                            description: `${title} for ${p.first_name}`
                        }
                    });
                }
            };

            processVital(p.pob, p.dob, 'birth', 'Birth Place');
            processVital(p.place_of_death, p.dod, 'death', 'Death Place');
            processVital(p.burial_place, p.dod, 'burial', 'Burial Place');
        });

        // --- Calculate Stats ---
        const uniqueLocationNames = new Set(formattedLocations.map(l => l.name));
        const countries = new Set();
        formattedLocations.forEach(p => {
            if (p.name && p.name.includes(',')) {
                const parts = p.name.split(',');
                const country = parts[parts.length - 1].trim();
                countries.add(country);
            }
        });

        // Calculate Top Cities
        const cityCounts = {};
        formattedLocations.forEach(l => {
            if (l.name) {
                const city = l.name.split(',')[0].trim(); // Simple city extraction
                // Or keep full name? Let's use full name for accuracy
                // cityCounts[l.name] = (cityCounts[l.name] || 0) + 1;

                // User snippet showed "City" and "Photos", so stick to that logic?
                // Let's count occurrences of location names
                cityCounts[l.name] = (cityCounts[l.name] || 0) + 1;
            }
        });

        const topCities = Object.entries(cityCounts)
            .map(([city, count]) => ({ city, count }))
            .sort((a, b) => b.count - a.count);

        // Calculate Most Global Member
        const memberStats = {};
        formattedLocations.forEach(l => {
            if (l.personId && l.personId !== 'tree') {
                if (!memberStats[l.personId]) {
                    memberStats[l.personId] = {
                        name: l.personName,
                        locations: new Set()
                    };
                }
                memberStats[l.personId].locations.add(l.name);
            }
        });

        let mostGlobalMember = { name: '', count: 0 };
        Object.values(memberStats).forEach(stat => {
            if (stat.locations.size > mostGlobalMember.count) {
                mostGlobalMember = { name: stat.name, count: stat.locations.size };
            }
        });

        res.json({
            total_locations: uniqueLocationNames.size,
            countries_count: countries.size,
            total_photos_mapped: formattedLocations.filter(l => l.type === 'photo').length,
            total_places_lived: formattedLocations.filter(l => l.type === 'lived').length,
            total_stories_mapped: new Set(formattedLocations.filter(l => l.type === 'story').map(l => l.storyId)).size,
            total_events_mapped: formattedLocations.filter(l => l.type === 'event').length,
            all_locations: formattedLocations,
            top_cities: topCities,
            most_global_member: mostGlobalMember
        });

    } catch (error) {
        logger.error('Error fetching global travel stats:', error, req);
        res.status(500).json({ error: error.message });
    }
};
