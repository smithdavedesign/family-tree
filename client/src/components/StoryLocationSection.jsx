import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus, X, Edit } from 'lucide-react';
import { supabase } from '../auth';
import LocationSelector from './LocationSelector';
import { Button } from './ui';

const StoryLocationSection = ({ story, canEdit }) => {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [selectedLocations, setSelectedLocations] = useState([]);

    // Add location mutation
    const addLocationMutation = useMutation({
        mutationFn: async (locationId) => {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/story/${story.id}/locations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ location_id: locationId })
            });

            if (!response.ok) throw new Error('Failed to add location');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['story', story.id]);
            setSelectedLocations([]);
        }
    });

    // Remove location mutation
    const removeLocationMutation = useMutation({
        mutationFn: async (locationId) => {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/story/${story.id}/locations/${locationId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });

            if (!response.ok) throw new Error('Failed to remove location');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['story', story.id]);
        }
    });

    const handleAddLocation = (location) => {
        if (location.is_new) {
            // New location created via LocationSelector
            // It will be in the locations table, we just need to link it
            addLocationMutation.mutate(location.id);
        } else {
            // Existing location selected
            addLocationMutation.mutate(location.id);
        }
    };

    const handleRemoveLocation = (locationId) => {
        if (window.confirm('Remove this location from the story?')) {
            removeLocationMutation.mutate(locationId);
        }
    };

    const locations = story.locations || [];

    if (!canEdit && locations.length === 0) {
        return null; // Don't show section if no locations and can't edit
    }

    return (
        <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-teal-600" />
                    {locations.length > 0 ? 'Story Locations' : 'Add Location'}
                </h3>
                {canEdit && !isEditing && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="gap-2"
                    >
                        <Edit className="w-4 h-4" />
                        Edit Locations
                    </Button>
                )}
            </div>

            {/* Display existing locations */}
            {locations.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {locations.map(location => (
                        <div
                            key={location.id}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg text-sm"
                        >
                            <MapPin className="w-4 h-4 text-teal-600" />
                            <div className="flex flex-col">
                                <span className="font-medium text-teal-900">{location.name}</span>
                                {location.address && (
                                    <span className="text-xs text-teal-700">{location.address}</span>
                                )}
                            </div>
                            {canEdit && isEditing && (
                                <button
                                    onClick={() => handleRemoveLocation(location.id)}
                                    className="ml-1 p-0.5 hover:bg-teal-100 rounded transition-colors"
                                    disabled={removeLocationMutation.isLoading}
                                >
                                    <X className="w-4 h-4 text-teal-600" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Edit mode: Add new locations */}
            {isEditing && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                    <LocationSelector
                        selectedLocations={selectedLocations}
                        onAdd={handleAddLocation}
                        onRemove={(id) => setSelectedLocations(prev => prev.filter(l => l.id !== id))}
                    />
                    <div className="flex gap-2 justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditing(false)}
                        >
                            Done
                        </Button>
                    </div>
                </div>
            )}
        </section>
    );
};

export default StoryLocationSection;
