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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <MapPin className="w-6 h-6 text-teal-600" />
                    Places Lived / Visited
                    {locations.length > 0 && (
                        <span className="text-lg font-normal text-slate-500">({locations.length})</span>
                    )}
                </h2>
                {isEditor && (
                    <button
                        onClick={() => setShowSelector(true)}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors bg-slate-50 border border-slate-200"
                        title="Add Location"
                    >
                        <Plus className="w-5 h-5 text-teal-600" />
                    </button>
                )}
            </div>

            {/* Location List */}
            <div className="space-y-3">
                {locations.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No locations recorded.</p>
                        {isEditor && (
                            <button
                                onClick={() => setShowSelector(true)}
                                className="text-teal-600 hover:text-teal-700 text-sm font-medium mt-1"
                            >
                                Click here to add the first place
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {locations.map((location) => (
                            <div
                                key={location.id}
                                className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-teal-200 hover:bg-white hover:shadow-sm transition-all flex items-start justify-between gap-3 group"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="p-1.5 bg-teal-100 rounded-lg text-teal-600">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <h5 className="font-semibold text-slate-900 truncate">{location.name}</h5>
                                    </div>
                                    {location.address && (
                                        <p className="text-sm text-slate-500 mt-1 pl-9">{location.address}</p>
                                    )}
                                    {(location.start_date || location.end_date) && (
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 pl-9">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>
                                                {location.start_date && new Date(location.start_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                                                {location.start_date && location.end_date && ' - '}
                                                {location.end_date && new Date(location.end_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                    )}
                                    {location.notes && (
                                        <p className="text-sm text-slate-600 mt-2 pl-9 border-l-2 border-slate-200 italic">{location.notes}</p>
                                    )}
                                </div>
                                {isEditor && (
                                    <button
                                        onClick={() => removeMutation.mutate(location.id)}
                                        className="p-1.5 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                                        title="Remove"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
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
