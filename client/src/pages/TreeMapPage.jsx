import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet.heat';
import { supabase } from '../auth';
import Navbar from '../components/Navbar';
import Breadcrumbs from '../components/Breadcrumbs';
import AccountSettings from '../components/AccountSettings';
import { Button, Select } from '../components/ui';
import { Loader, MapPin, Filter, X, User, BookOpen, Layers, Flame } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './TreeMapPage.css'; // I'll create this for cluster styling

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const TreeMapPage = () => {
    const { treeId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [selectedPersonId, setSelectedPersonId] = useState('all');
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [viewMode, setViewMode] = useState('pins'); // 'pins' or 'heatmap'
    const [showSettings, setShowSettings] = useState(false);

    // Heatmap Layer Component
    const HeatmapLayer = ({ points }) => {
        const map = useMap();

        React.useEffect(() => {
            if (!points || points.length === 0) return;

            const heatPoints = points.map(p => [p.latitude, p.longitude, 1.0]); // Increased intensity
            const heatLayer = L.heatLayer(heatPoints, {
                radius: 30, // Slightly larger radius
                blur: 18,   // Adjusted blur
                maxZoom: 17,
                minOpacity: 0.2, // Added min opacity for better visibility
                gradient: {
                    0.4: '#3b82f6', // Bright Blue
                    0.6: '#10b981', // Emerald
                    0.7: '#f59e0b', // Amber
                    0.8: '#ef4444', // Red
                    1.0: '#7f1d1d'  // Dark Red for intense hotspots
                }
            }).addTo(map);

            return () => {
                map.removeLayer(heatLayer);
            };
        }, [map, points]);

        return null;
    };

    React.useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        fetchUser();
    }, []);

    // Fetch Tree Data (for name)
    const { data: treeData } = useQuery({
        queryKey: ['tree', treeId],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`/api/tree/${treeId}`, {
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch tree');
            return res.json();
        },
        enabled: !!treeId
    });

    // Fetch Map Data
    const { data: mapData, isLoading } = useQuery({
        queryKey: ['tree-map', treeId],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`/api/map/global-stats?treeId=${treeId}`, {
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch map data');
            return res.json();
        },
        enabled: !!treeId
    });

    // Filter locations
    const filteredLocations = useMemo(() => {
        console.log('MapData:', mapData);
        if (!mapData?.all_locations) return [];
        if (selectedPersonId === 'all') return mapData.all_locations;
        return mapData.all_locations.filter(loc => loc.personId === selectedPersonId);
    }, [mapData, selectedPersonId]);

    console.log('Filtered Locations:', filteredLocations);

    // Get unique people for filter dropdown
    const peopleList = useMemo(() => {
        if (!mapData?.all_locations) return [];
        const peopleMap = new Map();
        mapData.all_locations.forEach(loc => {
            if (loc.personId && loc.personName) {
                peopleMap.set(loc.personId, loc.personName);
            }
        });
        return Array.from(peopleMap.entries()).sort((a, b) => a[1].localeCompare(b[1]));
    }, [mapData]);

    // Calculate bounds
    const bounds = useMemo(() => {
        if (filteredLocations.length === 0) return null;
        const b = L.latLngBounds(filteredLocations.map(p => [p.latitude, p.longitude]));
        if (filteredLocations.length === 1) {
            b.extend([filteredLocations[0].latitude + 0.1, filteredLocations[0].longitude + 0.1]);
            b.extend([filteredLocations[0].latitude - 0.1, filteredLocations[0].longitude - 0.1]);
        }
        return b;
    }, [filteredLocations]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <Loader className="w-8 h-8 text-teal-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar user={user} onOpenSettings={() => setShowSettings(true)} />

            <Breadcrumbs
                items={[
                    { label: (treeData?.name || 'Tree').replace(/\s+tree$/i, ''), href: `/tree/${treeId}` },
                    { label: 'Map' }
                ]}
            />

            <main className="flex-1 relative">
                <div className="absolute inset-0 flex flex-col">
                    {/* Stats Header */}
                    <div className="bg-white border-b border-slate-200 z-10 shadow-sm shrink-0">
                        <div className="max-w-[1600px] mx-auto w-full px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
                            <div className="flex flex-wrap gap-x-5 md:gap-x-6 gap-y-2 md:gap-y-0">
                                <div className="flex flex-col min-w-[65px]">
                                    <span className="text-[10px] md:text-xs font-medium text-slate-500 uppercase whitespace-nowrap">Lives Lived</span>
                                    <span className="text-base md:text-lg font-bold text-orange-600">{mapData?.total_places_lived || 0}</span>
                                </div>
                                <div className="flex flex-col min-w-[65px]">
                                    <span className="text-[10px] md:text-xs font-medium text-slate-500 uppercase whitespace-nowrap">Life Events</span>
                                    <span className="text-base md:text-lg font-bold text-blue-600">{mapData?.total_events_mapped || 0}</span>
                                </div>
                                <div className="flex flex-col min-w-[65px]">
                                    <span className="text-[10px] md:text-xs font-medium text-slate-500 uppercase whitespace-nowrap">Stories</span>
                                    <span className="text-base md:text-lg font-bold text-purple-600">{mapData?.total_stories_mapped || 0}</span>
                                </div>
                                <div className="flex flex-col min-w-[65px]">
                                    <span className="text-[10px] md:text-xs font-medium text-slate-500 uppercase whitespace-nowrap">Photos</span>
                                    <span className="text-base md:text-lg font-bold text-teal-600">{mapData?.total_photos_mapped || 0}</span>
                                </div>
                                <div className="flex flex-col min-w-[65px]">
                                    <span className="text-[10px] md:text-xs font-medium text-slate-500 uppercase whitespace-nowrap">Countries</span>
                                    <span className="text-base md:text-lg font-bold text-slate-900">{mapData?.countries_count || 0}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-3 md:pt-0 border-t border-slate-100 md:border-0 justify-between md:justify-end">
                                {/* View Mode Toggle */}
                                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                                    <button
                                        onClick={() => setViewMode('pins')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'pins'
                                            ? 'bg-white text-teal-600 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        <MapPin className="w-3.5 h-3.5" />
                                        Pins
                                    </button>
                                    <button
                                        onClick={() => setViewMode('heatmap')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'heatmap'
                                            ? 'bg-white text-orange-600 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        <Flame className="w-3.5 h-3.5" />
                                        Heatmap
                                    </button>
                                </div>
                                <Select
                                    value={selectedPersonId}
                                    onChange={(value) => setSelectedPersonId(value)}
                                    options={[
                                        { value: 'all', label: 'All People' },
                                        ...peopleList.map(([id, name]) => ({ value: id, label: name }))
                                    ]}
                                    leftIcon={<Filter className="w-4 h-4" />}
                                    className="w-full sm:w-56"
                                    placeholder="Filter by Person"
                                />
                            </div>
                        </div>
                    </div>


                    {/* Map */}
                    <div className="flex-1 bg-slate-100 relative z-0 min-h-0">
                        {filteredLocations.length > 0 ? (
                            <MapContainer
                                key={treeId}
                                bounds={bounds}
                                style={{ height: '100%', width: '100%' }}
                                scrollWheelZoom={true}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />

                                {viewMode === 'heatmap' ? (
                                    <HeatmapLayer points={filteredLocations} />
                                ) : (
                                    <MarkerClusterGroup
                                        chunkedLoading
                                        maxClusterRadius={40}
                                        spiderfyOnMaxZoom={true}
                                        showCoverageOnHover={false}
                                    >
                                        {filteredLocations.map((loc, index) => {
                                            const isLived = loc.type === 'lived';
                                            const isStory = loc.type === 'story';
                                            const isEvent = loc.type === 'event';
                                            const isPhoto = loc.type === 'photo';

                                            let color = '#14b8a6'; // Default teal (photo)
                                            let fillColor = '#14b8a6';

                                            if (isLived) {
                                                color = '#ea580c'; // Orange
                                                fillColor = '#f97316';
                                            } else if (isStory) {
                                                color = '#9333ea'; // Purple
                                                fillColor = '#a855f7';
                                            } else if (isEvent) {
                                                color = '#2563eb'; // Blue
                                                fillColor = '#3b82f6';
                                            }

                                            return (
                                                <CircleMarker
                                                    key={`${loc.type}-${index}`}
                                                    center={[loc.latitude, loc.longitude]}
                                                    radius={isLived ? 8 : (isStory ? 7 : (isEvent ? 7 : 5))}
                                                    pathOptions={{
                                                        color: color,
                                                        fillColor: fillColor,
                                                        fillOpacity: 0.6,
                                                        weight: 2
                                                    }}
                                                >
                                                    <Popup>
                                                        <div className="text-sm min-w-[200px]">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                {loc.personImage ? (
                                                                    <img
                                                                        src={loc.personImage}
                                                                        alt={loc.personName}
                                                                        className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm"
                                                                    />
                                                                ) : (
                                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-slate-200 ${isStory ? 'bg-purple-50' : 'bg-slate-100'}`}>
                                                                        {isStory ? (
                                                                            <BookOpen className="w-5 h-5 text-purple-500" />
                                                                        ) : (
                                                                            <User className="w-5 h-5 text-slate-400" />
                                                                        )}
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <p className="font-bold text-slate-900 leading-tight">
                                                                        {isStory ? loc.storyTitle : loc.personName}
                                                                    </p>
                                                                    <p className="text-xs font-medium uppercase tracking-wider mt-0.5" style={{ color }}>
                                                                        {isLived ? 'Location' : (isStory ? 'Story Event' : (isEvent ? (loc.details?.eventType || 'Life Event') : 'Photo Location'))}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <p className="font-medium text-slate-800 mb-1">{loc.name}</p>

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
                                                                    {loc.details?.address && (
                                                                        <p className="mt-1 italic text-slate-500">{loc.details.address}</p>
                                                                    )}
                                                                </div>
                                                            ) : isStory ? (
                                                                <div className="text-xs text-slate-600">
                                                                    <p>
                                                                        {loc.date ? new Date(loc.date).toLocaleDateString() : (loc.details?.year || 'Unknown Date')}
                                                                    </p>
                                                                    <button
                                                                        onClick={() => navigate(`/story/${loc.storyId}`)}
                                                                        className="mt-2 text-xs text-purple-600 hover:underline font-medium"
                                                                    >
                                                                        Read Story
                                                                    </button>
                                                                </div>
                                                            ) : isEvent ? (
                                                                <div className="text-xs text-slate-600">
                                                                    <p className="font-semibold text-slate-900">{loc.details?.title}</p>
                                                                    {loc.date && (
                                                                        <p className="mt-0.5">{new Date(loc.date).toLocaleDateString()}</p>
                                                                    )}
                                                                    {loc.details?.description && (
                                                                        <p className="mt-1 text-slate-500 italic">{loc.details.description}</p>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="text-xs text-slate-500">
                                                                    <p className="mb-2">
                                                                        {loc.date ? new Date(loc.date).toLocaleDateString() : (loc.details?.year || 'Unknown Date')}
                                                                    </p>
                                                                    {loc.photoUrl && (
                                                                        <div
                                                                            className="relative group cursor-pointer overflow-hidden rounded-md border border-slate-200"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setSelectedPhoto({ url: loc.photoUrl, caption: loc.name });
                                                                            }}
                                                                        >
                                                                            <img
                                                                                src={loc.photoUrl}
                                                                                alt={loc.name}
                                                                                className="w-full h-32 object-cover transition-transform group-hover:scale-105"
                                                                            />
                                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                                                <div className="bg-black/50 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                    View Photo
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {!isStory && (
                                                                <button
                                                                    onClick={() => navigate(`/tree/${treeId}/person/${loc.personId}`)}
                                                                    className="mt-2 text-xs text-teal-600 hover:underline font-medium"
                                                                >
                                                                    View Profile
                                                                </button>
                                                            )}
                                                        </div>
                                                    </Popup>
                                                </CircleMarker>
                                            );
                                        })}
                                    </MarkerClusterGroup>
                                )}
                            </MapContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-500">
                                <div className="text-center">
                                    <MapPin className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                                    <p>No locations found for the selected filter.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {showSettings && (
                <AccountSettings
                    user={user}
                    onClose={() => setShowSettings(false)}
                    returnLabel="Map"
                />
            )}

            {selectedPhoto && (
                <div
                    className="fixed inset-x-0 bottom-0 top-16 z-[11000] bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white hover:text-gray-300"
                        onClick={() => setSelectedPhoto(null)}
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <img
                        src={selectedPhoto.url}
                        alt={selectedPhoto.caption}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                    {selectedPhoto.caption && (
                        <div className="absolute bottom-4 left-0 right-0 text-center text-white bg-black/50 p-2">
                            {selectedPhoto.caption}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TreeMapPage;
