import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../auth';
import { MapPin, Plus, X, Calendar } from 'lucide-react';
import LocationSelector from './LocationSelector';
import { Button } from './ui';

const PersonLocations = ({ personId, isEditor }) => {
    const [showSelector, setShowSelector] = useState(false);
    const queryClient = useQueryClient();

    // Fetch person locations
    const { data: locations = [], isLoading } = useQuery({
        queryKey: ['person-locations', personId],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/person/${personId}/locations`, {
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });
            if (!response.ok) return [];
            return response.json();
        }
    });

    // Add location mutation
    const addMutation = useMutation({
        mutationFn: async ({ location_id, start_date, end_date, notes }) => {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/person/${personId}/locations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ location_id, start_date, end_date, notes })
            });
            if (!response.ok) throw new Error('Failed to add location');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['person-locations', personId]);
            setShowSelector(false);
        }
    });

    // Remove location mutation
    const removeMutation = useMutation({
        mutationFn: async (locationId) => {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/person/${personId}/location/${locationId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });
            if (!response.ok) throw new Error('Failed to remove location');
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['person-locations', personId]);
        }
    });

    const handleAddLocation = (location) => {
        addMutation.mutate({ location_id: location.id });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 h-6 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Places Lived / Visited
                </h4>
                {isEditor && (
                    <button
                        onClick={() => setShowSelector(true)}
                        className="p-1 hover:bg-slate-100 rounded transition-colors"
                        title="Add Location"
                    >
                        <Plus className="w-4 h-4 text-teal-600" />
                    </button>
                )}
            </div>

            {/* Location List */}
            <div className="space-y-2">
                {locations.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-sm">
                        No locations recorded. {isEditor && 'Click + to add one!'}
                    </div>
                ) : (
                    locations.map((location) => (
                        <div
                            key={location.id}
                            className="bg-slate-50 rounded-lg p-3 hover:bg-slate-100 transition-colors flex items-start justify-between gap-2"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                    <h5 className="font-medium text-slate-900 truncate">{location.name}</h5>
                                </div>
                                {location.address && (
                                    <p className="text-xs text-slate-500 mt-1 ml-6">{location.address}</p>
                                )}
                                {(location.start_date || location.end_date) && (
                                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1 ml-6">
                                        <Calendar className="w-3 h-3" />
                                        <span>
                                            {location.start_date && new Date(location.start_date).toLocaleDateString()}
                                            {location.start_date && location.end_date && ' - '}
                                            {location.end_date && new Date(location.end_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                                {location.notes && (
                                    <p className="text-xs text-slate-600 mt-1 ml-6">{location.notes}</p>
                                )}
                            </div>
                            {isEditor && (
                                <button
                                    onClick={() => removeMutation.mutate(location.id)}
                                    className="p-1 hover:bg-red-100 rounded text-red-600 flex-shrink-0"
                                    title="Remove"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Location Selector Modal */}
            {showSelector && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg">Add Location</h3>
                            <button onClick={() => setShowSelector(false)} className="p-1 hover:bg-slate-100 rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <LocationSelector
                            selectedLocations={[]}
                            onAdd={handleAddLocation}
                            onRemove={() => { }}
                        />
                        <div className="mt-4 flex justify-end">
                            <Button variant="outline" onClick={() => setShowSelector(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PersonLocations;
