import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../auth';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Loader, AlertCircle, X } from 'lucide-react';
import HeatmapLayer from './HeatmapLayer';
import LocationSelector from './LocationSelector';

const PersonHeatmap = ({ personId }) => {
    const queryClient = useQueryClient();
    const [resolvingLocation, setResolvingLocation] = useState(null); // The string name being resolved
    const [showResolveModal, setShowResolveModal] = useState(false);

    const { data: stats, isLoading } = useQuery({
        queryKey: ['person-map-stats', personId],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/person/${personId}/map-stats`, {
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch map stats');
            return response.json();
        }
    });

    const createLocationMutation = useMutation({
        mutationFn: async (locationData) => {
            // We want to create a location entry for the *unmapped string* using the *selected coordinates*
            // This effectively "maps" the string "Grandma's House" to the coordinates of "123 Main St"
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch('/api/locations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    name: resolvingLocation, // Use the original string name to ensure matching
                    latitude: locationData.latitude,
                    longitude: locationData.longitude,
                    address: locationData.address || locationData.name // Store the real address as well
                })
            });

            if (!response.ok) throw new Error('Failed to save location');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['person-map-stats', personId]);
            setShowResolveModal(false);
            setResolvingLocation(null);
        }
    });

    if (isLoading) {
        return (
            <div className="h-96 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200">
                <Loader className="w-8 h-8 text-teal-600 animate-spin" />
            </div>
        );
    }

    if (!stats || stats.locations.length === 0 && (!stats.unmapped_locations || stats.unmapped_locations.length === 0)) {
        return (
            <div className="h-96 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                <MapPin className="w-12 h-12 mb-2 text-slate-300" />
                <p>No location data available for this person.</p>
            </div>
        );
    }

    // Calculate bounds
    let bounds = null;
    if (stats.locations.length > 0) {
        bounds = L.latLngBounds(stats.locations.map(p => [p.latitude, p.longitude]));
        if (stats.locations.length === 1) {
            bounds.extend([stats.locations[0].latitude + 0.1, stats.locations[0].longitude + 0.1]);
            bounds.extend([stats.locations[0].latitude - 0.1, stats.locations[0].longitude - 0.1]);
        }
    } else {
        // Default bounds if only unmapped locations exist
        bounds = L.latLngBounds([[0, 0], [0, 0]]);
    }

    // Prepare heatmap points
    const heatPoints = stats.locations.map(loc => [loc.latitude, loc.longitude, 1.0]);

    return (
        <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Locations</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.unique_locations}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Places Lived</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.total_places_lived || 0}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Life Events</p>
                    <p className="text-2xl font-bold text-violet-600">{stats.total_life_events || 0}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Mapped Photos</p>
                    <p className="text-2xl font-bold text-teal-600">{stats.total_photos_with_location}</p>
                </div>
            </div>

            {/* Unmapped Locations Alert */}
            {stats.unmapped_locations && stats.unmapped_locations.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-amber-500 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-semibold text-amber-900">
                                {stats.unmapped_locations.length} Locations Not Mapped
                            </h4>
                            <p className="text-sm text-amber-700 mt-1 mb-2">
                                The following locations have no GPS coordinates. Click on a location tag to map it.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {stats.unmapped_locations.map((loc, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setResolvingLocation(loc);
                                            setShowResolveModal(true);
                                        }}
                                        className="inline-flex items-center px-2 py-1 rounded-md bg-white border border-amber-200 text-xs text-amber-800 font-medium hover:bg-amber-100 hover:border-amber-300 transition-colors cursor-pointer"
                                        title="Click to map this location"
                                    >
                                        {loc} <AlertCircle className="w-3 h-3 ml-1.5 opacity-50" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Map */}
            <div className="h-[500px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
                <MapContainer
                    bounds={bounds}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <HeatmapLayer points={heatPoints} />

                    {/* Render points */}
                    {stats.locations.map((loc, index) => {
                        const isLived = loc.type === 'lived';
                        const isEvent = loc.type === 'event';

                        let color, fillColor, label;
                        if (isLived) {
                            color = '#ea580c'; // orange
                            fillColor = '#f97316';
                            label = 'Location';
                        } else if (isEvent) {
                            color = '#7c3aed'; // violet
                            fillColor = '#8b5cf6';
                            label = loc.details?.eventType || 'Life Event';
                        } else {
                            color = '#14b8a6'; // teal
                            fillColor = '#2dd4bf';
                            label = 'Photo Location';
                        }

                        return (
                            <CircleMarker
                                key={index}
                                center={[loc.latitude, loc.longitude]}
                                radius={isLived ? 10 : (isEvent ? 8 : 6)}
                                pathOptions={{
                                    color: color,
                                    fillColor: fillColor,
                                    fillOpacity: 0.6,
                                    weight: 2
                                }}
                            >
                                <Popup>
                                    <div className="text-sm">
                                        <p className="font-semibold text-slate-900">{loc.name}</p>
                                        <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color }}>
                                            {label}
                                        </p>

                                        {isLived ? (
                                            <div className="text-xs text-slate-600">
                                                {(loc.details?.start || loc.details?.end) ? (
                                                    <p>
                                                        {loc.details?.start ? new Date(loc.details.start).getFullYear() : '?'}
                                                        {' - '}
                                                        {loc.details?.is_current ? 'Present' : (loc.details?.end ? new Date(loc.details.end).getFullYear() : '?')}
                                                    </p>
                                                ) : (
                                                    <p className="italic text-slate-400">No date recorded</p>
                                                )}
                                            </div>
                                        ) : isEvent ? (
                                            <div className="text-xs text-slate-600">
                                                <p>{loc.date ? new Date(loc.date).toLocaleDateString() : 'Unknown Date'}</p>
                                                {loc.details?.description && (
                                                    <p className="mt-1 italic text-slate-500 line-clamp-2">{loc.details.description}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-slate-600">
                                                <p>{loc.date ? new Date(loc.date).toLocaleDateString() : (loc.details?.year || 'Unknown Date')}</p>
                                                {loc.details?.mappedFrom && (
                                                    <p className="mt-1 text-xs text-slate-400">Mapped via: {loc.details.mappedFrom}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </Popup>
                            </CircleMarker>
                        );
                    })}
                </MapContainer>
            </div>

            {/* Resolve Location Modal */}
            {showResolveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-teal-600" />
                                Map Location
                            </h3>
                            <button onClick={() => setShowResolveModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-6 bg-amber-50 border border-amber-100 rounded-lg p-3">
                                <p className="text-sm text-amber-800">
                                    You are mapping the location <span className="font-bold">"{resolvingLocation}"</span> to a real geographic location.
                                    Looking for existing photos and events with this name will use the coordinates you select.
                                </p>
                            </div>

                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Search for matching location
                            </label>
                            <div className="relative z-10">
                                <LocationSelector
                                    selectedLocations={[]}
                                    onAdd={(location) => {
                                        createLocationMutation.mutate(location);
                                    }}
                                    placeholder={`Search for coordinates for "${resolvingLocation}"...`}
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                Search for a city, address, or landmark to assign coordinates.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PersonHeatmap;
