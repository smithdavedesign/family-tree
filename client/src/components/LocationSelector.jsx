import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../auth';
import { Search, Plus, X, MapPin } from 'lucide-react';
import { Button, Input } from './ui';
import LocationModal from './LocationModal';

const LocationSelector = ({ selectedLocations = [], onAdd, onRemove }) => {
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const queryClient = useQueryClient();

    // Fetch locations with search
    const { data: locations = [] } = useQuery({
        queryKey: ['locations', search],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const isProd = import.meta.env.PROD;

            // Fetch Google API key from backend (runtime config)
            let googleApiKey = null;
            if (isProd) {
                try {
                    const configRes = await fetch('/api/config');
                    const config = await configRes.json();
                    googleApiKey = config.googleApiKey;
                } catch (err) {
                    console.warn('Failed to fetch config:', err);
                }
            }

            // HYBRID STRATEGY:
            // Dev -> Local Nominatim (Docker)
            // Prod -> Google Maps API

            if (search && search.length > 2) {
                try {
                    if (isProd && googleApiKey) {
                        // GOOGLE MAPS IMPLEMENTATION
                        if (!window.google || !window.google.maps || !window.google.maps.places) {
                            // Load Google Maps Script dynamically if not present
                            if (!document.getElementById('google-maps-script')) {
                                const script = document.createElement('script');
                                script.id = 'google-maps-script';
                                script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places`;
                                script.async = true;
                                document.body.appendChild(script);
                                await new Promise(resolve => script.onload = resolve);
                            } else {
                                // Wait for existing script to be ready
                                await new Promise(resolve => setTimeout(resolve, 500));
                            }
                        }

                        // Use AutocompleteService
                        const service = new window.google.maps.places.AutocompleteService();
                        const predictions = await new Promise((resolve) => {
                            service.getPlacePredictions({ input: search }, (results, status) => {
                                if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                                    resolve(results);
                                } else {
                                    resolve([]);
                                }
                            });
                        });

                        // Get details for each prediction to get lat/lng (AutocompleteService doesn't return lat/lng)
                        // Note: ensuring we don't spam details API, usually users select one. 
                        // But here we need to display valid locations. 
                        // Optimization: For the dropdown we might just show text, and fetch details ON SELECT.
                        // However, existing UI expects latitude/longitude immediately?
                        // The existing UI *renders* results. 
                        // If we want to save costs, we should fetch lat/lng ONLY when user clicks "Add".
                        // But current `handleSelectLocation` adds it directly.
                        // Let's assume we map what we can. 

                        // Actually, to get lat/lng for ALL suggestions is expensive (1 request per item).
                        // BETTER APPROACH: Return predictions with a placeholder flag. 
                        // Then fetch details in handleSelectLocation.

                        return predictions.map(p => ({
                            id: `google-${p.place_id}`,
                            name: p.structured_formatting.main_text,
                            address: p.description,
                            latitude: 0, // Placeholder, fetch on select
                            longitude: 0, // Placeholder
                            is_google_prediction: true, // Flag to trigger details fetch
                            google_place_id: p.place_id,
                            is_new: true
                        }));

                    } else {
                        // NOMINATIM IMPLEMENTATION (DEV)
                        const nominatimRes = await fetch(`/nominatim/search?q=${encodeURIComponent(search)}&format=json&addressdetails=1&limit=5`);
                        if (nominatimRes.ok) {
                            const results = await nominatimRes.json();
                            return results.map(item => ({
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

            // Fallback: search existing backend locations
            const url = search
                ? `/api/locations?search=${encodeURIComponent(search)}`
                : '/api/locations';

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });

            if (!response.ok) return [];
            return response.json();
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
            // Fetch details for Google prediction to get lat/lng
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
                console.error('Failed to get place details:', err);
                // Fallback to original suggestion
            }
        }

        // If it's a new external suggestion, save it to our DB first to get a UUID
        if (selection.is_new) {
            createMutation.mutate({
                name: selection.name,
                address: selection.address,
                latitude: selection.latitude,
                longitude: selection.longitude
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
                                <p className="font-medium text-slate-900 truncate">{location.name}</p>
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
