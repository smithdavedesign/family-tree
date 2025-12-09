import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../auth';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Loader } from 'lucide-react';

const PersonHeatmap = ({ personId }) => {
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

    if (isLoading) {
        return (
            <div className="h-96 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200">
                <Loader className="w-8 h-8 text-teal-600 animate-spin" />
            </div>
        );
    }

    if (!stats || stats.locations.length === 0) {
        return (
            <div className="h-96 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                <MapPin className="w-12 h-12 mb-2 text-slate-300" />
                <p>No location data available for this person.</p>
            </div>
        );
    }

    // Calculate bounds
    const bounds = L.latLngBounds(stats.locations.map(p => [p.latitude, p.longitude]));
    if (stats.locations.length === 1) {
        bounds.extend([stats.locations[0].latitude + 0.1, stats.locations[0].longitude + 0.1]);
        bounds.extend([stats.locations[0].latitude - 0.1, stats.locations[0].longitude - 0.1]);
    }

    return (
        <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Locations</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.unique_locations}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Mapped Photos</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.total_photos_with_location}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Most Visited</p>
                    <p className="text-lg font-bold text-slate-900 truncate" title={stats.most_visited_location}>
                        {stats.most_visited_location || 'N/A'}
                    </p>
                </div>
            </div>

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

                    {/* Render points as semi-transparent circles to simulate heatmap density */}
                    {stats.locations.map((loc, index) => (
                        <CircleMarker
                            key={index}
                            center={[loc.latitude, loc.longitude]}
                            radius={8}
                            fillColor="#14b8a6" // teal-500
                            color="#0d9488" // teal-600
                            weight={2}
                            opacity={0.8}
                            fillOpacity={0.5}
                        >
                            <Popup>
                                <div className="text-sm">
                                    <p className="font-semibold">{loc.location_name}</p>
                                    <p className="text-xs text-slate-500">{new Date(loc.taken_date).toLocaleDateString()}</p>
                                </div>
                            </Popup>
                        </CircleMarker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
};

export default PersonHeatmap;
