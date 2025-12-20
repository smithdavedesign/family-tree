import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../auth';
import { Search, Plus, X, MapPin } from 'lucide-react';
import { Button } from './ui';
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

    const handleSelectLocation = (location) => {
        if (!selectedLocations.find(l => l.id === location.id)) {
            onAdd(location);
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search locations..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
