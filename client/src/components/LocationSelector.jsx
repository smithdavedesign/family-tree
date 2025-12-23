import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../auth';
import { Search, Plus, X, MapPin } from 'lucide-react';
import { Button, Input } from './ui';
import LocationModal from './LocationModal';

const LocationSelector = ({ selectedLocations = [], onAdd, onRemove }) => {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const queryClient = useQueryClient();

    // Debounce search input
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Google Session Token logic
    const [sessionToken, setSessionToken] = useState(null);

    const getSessionToken = () => {
        if (!sessionToken && window.google && window.google.maps && window.google.maps.places) {
            const token = new window.google.maps.places.AutocompleteSessionToken();
            setSessionToken(token);
            return token;
        }
        return sessionToken;
    };

    // Fetch locations with search
    const { data: locations = [] } = useQuery({
        queryKey: ['locations', debouncedSearch],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const search = debouncedSearch;
            const isProd = import.meta.env.PROD;

            // Fetch Google API key from backend (runtime config)
            let googleApiKey = null;
            try {
                const configRes = await fetch('/api/config');
                const config = await configRes.json();
                googleApiKey = config.googleApiKey;
            } catch (err) {
                console.warn('Failed to fetch config:', err);
            }

            // 1. Fetch from our DB (Always check local first)
            const localUrl = search
                ? `/api/locations?search=${encodeURIComponent(search)}`
                : '/api/locations';

            let localResults = [];
            try {
                const response = await fetch(localUrl, {
                    headers: { Authorization: `Bearer ${session?.access_token}` }
                });
                if (response.ok) localResults = await response.json();
            } catch (err) {
                console.warn('Local search failed:', err);
            }

            // 2. Fetch from External API (Google/Nominatim)
            let externalResults = [];
            if (search && search.length > 2) {
                try {
                    if (googleApiKey) {
                        // GOOGLE MAPS IMPLEMENTATION
                        if (!window.google || !window.google.maps || !window.google.maps.places) {
                            if (!document.getElementById('google-maps-script')) {
                                const script = document.createElement('script');
                                script.id = 'google-maps-script';
                                script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places`;
                                script.async = true;
                                document.body.appendChild(script);
                                await new Promise(resolve => script.onload = resolve);
                            } else {
                                await new Promise(resolve => setTimeout(resolve, 500));
                            }
                        }

                        const service = new window.google.maps.places.AutocompleteService();
                        const token = getSessionToken();

                        const predictions = await new Promise((resolve) => {
                            service.getPlacePredictions({
                                input: search,
                                sessionToken: token
                            }, (results, status) => {
                                if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                                    resolve(results);
                                } else {
                                    resolve([]);
                                }
                            });
                        });

                        externalResults = predictions.map(p => ({
                            id: `google-${p.place_id}`,
                            name: p.structured_formatting.main_text,
                            address: p.description,
                            latitude: 0,
                            longitude: 0,
                            is_google_prediction: true,
                            google_place_id: p.place_id,
                            is_new: true
                        }));

                    } else {
                        // NOMINATIM IMPLEMENTATION (DEV)
                        const nominatimRes = await fetch(`/nominatim/search?q=${encodeURIComponent(search)}&format=json&addressdetails=1&limit=5`);
                        if (nominatimRes.ok) {
                            const results = await nominatimRes.json();
                            externalResults = results.map(item => ({
                                id: `nom-${item.place_id}`,
                                name: item.display_name.split(',')[0],
                                address: item.display_name,
                                latitude: parseFloat(item.lat),
                                longitude: parseFloat(item.lon),
                                is_new: true
                            }));
                        }
                    }
                } catch (err) {
                    console.warn('External geocoding failed:', err);
                }
            }

            // Combine and prioritize local results
            const combined = [...localResults];

            // Add external results if they don't already exist locally by name/address
            externalResults.forEach(ext => {
                const exists = localResults.some(loc =>
                    loc.google_place_id === ext.google_place_id ||
                    (loc.name === ext.name && loc.address === ext.address)
                );
                if (!exists) combined.push(ext);
            });

            return combined;
        }
    });

    // Create location mutation
    const createMutation = useMutation({
        mutationFn: async (newLocation) => {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch('/api/locations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(newLocation)
            });

            if (!response.ok) throw new Error('Failed to create location');
            return response.json();
        },
        onSuccess: (newLocation) => {
            queryClient.invalidateQueries(['locations']);
            onAdd(newLocation);
            setShowModal(false);
        }
    });

    const handleSaveLocation = (locationData) => {
        createMutation.mutate(locationData);
    };

    const handleSelectLocation = async (location) => {
        let selection = location;

        if (location.is_google_prediction && window.google && window.google.maps) {
            // HYBRID CACHE STRATEGY: 
            // 1. Check our database for this Google Place ID first (FREE)
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const cacheRes = await fetch(`/api/locations?google_place_id=${location.google_place_id}`, {
                    headers: { Authorization: `Bearer ${session?.access_token}` }
                });

                if (cacheRes.ok) {
                    const cacheHits = await cacheRes.json();
                    if (cacheHits && cacheHits.length > 0) {
                        // Found in cache! Use this instead of calling Google Details API
                        console.log('✅ Location found in local cache! Skipping Google Places API call.', cacheHits[0]);
                        selection = {
                            ...cacheHits[0],
                            is_new: false, // Already in DB
                            cached: true
                        };
                    }
                }
            } catch (err) {
                console.warn('Cache lookup failed, falling back to Google API:', err);
            }

            // 2. If not in cache, fetch details for Google prediction to get lat/lng (PAID)
            if (selection.is_google_prediction) {
                try {
                    const service = new window.google.maps.places.PlacesService(document.createElement('div'));

                    const details = await new Promise((resolve, reject) => {
                        service.getDetails({
                            placeId: location.google_place_id,
                            fields: ['geometry', 'formatted_address', 'name']
                        }, (place, status) => {
                            if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
                                resolve(place);
                            } else {
                                reject(status);
                            }
                        });
                    });

                    if (details.geometry && details.geometry.location) {
                        selection = {
                            ...location,
                            name: details.name || location.name,
                            address: details.formatted_address || location.address,
                            latitude: details.geometry.location.lat(),
                            longitude: details.geometry.location.lng(),
                            is_google_prediction: false // Resolved
                        };
                    }
                } catch (err) {
                    console.error('Failed to get place details from Google API:', err);
                }
            }

            // After a successful selection (and details fetch), refresh the session token for the NEXT search
            setSessionToken(new window.google.maps.places.AutocompleteSessionToken());
        }

        // If it's a new external suggestion (or a newly resolved Google prediction), save it to our DB first to get a UUID
        if (selection.is_new) {
            createMutation.mutate({
                name: selection.name,
                address: selection.address,
                latitude: selection.latitude,
                longitude: selection.longitude,
                google_place_id: selection.google_place_id // Store for future caching!
            });
        } else if (!selectedLocations.find(l => l.id === selection.id)) {
            onAdd(selection);
        }

        setSearch('');
    };

    // Filter out already selected locations
    const availableLocations = locations.filter(
        loc => !selectedLocations.find(sl => sl.id === loc.id)
    );

    return (
        <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
                <Input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search locations..."
                    leftIcon={<Search />}
                    className="!rounded-full shadow-sm"
                    showClear
                />
            </div>

            {/* Search Results */}
            {search && availableLocations.length > 0 && (
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg bg-white shadow-sm">
                    {availableLocations.map(location => (
                        <button
                            key={location.id}
                            onClick={() => handleSelectLocation(location)}
                            className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 transition-colors"
                        >
                            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-900 truncate">
                                    {location.name}
                                    {location.google_place_id && !location.is_google_prediction && (
                                        <span className="ml-2 text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Cached</span>
                                    )}
                                </p>
                                {location.address && (
                                    <p className="text-xs text-slate-500 truncate">{location.address}</p>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Add New Location Button */}
            <Button
                variant="outline"
                size="sm"
                onClick={() => setShowModal(true)}
                className="w-full gap-2"
            >
                <Plus className="w-4 h-4" />
                Add New Location
            </Button>

            {/* Selected Locations (Chips) */}
            {selectedLocations.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedLocations.map(location => (
                        <div
                            key={location.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full border border-teal-200"
                        >
                            <MapPin className="w-3 h-3" />
                            <span className="text-sm font-medium">{location.name}</span>
                            <button
                                onClick={() => onRemove(location.id)}
                                className="ml-1 hover:bg-teal-100 rounded-full p-0.5 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Location Modal */}
            <LocationModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSaveLocation}
            />
        </div>
    );
};

export default LocationSelector;
