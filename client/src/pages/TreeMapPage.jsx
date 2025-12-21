import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { supabase } from '../auth';
import Navbar from '../components/Navbar';
import Breadcrumbs from '../components/Breadcrumbs';
import { Loader, MapPin, Filter, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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
    const [showFilters, setShowFilters] = useState(false);

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
        if (!mapData?.all_locations) return [];
        if (selectedPersonId === 'all') return mapData.all_locations;
        return mapData.all_locations.filter(loc => loc.personId === selectedPersonId);
    }, [mapData, selectedPersonId]);

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
            <Navbar user={user} onOpenSettings={() => { }} />

            <Breadcrumbs
                items={[
                    { label: treeData?.name || 'Tree', href: `/tree/${treeId}` },
                    { label: 'Map' }
                ]}
            />

            <main className="flex-1 flex flex-col h-[calc(100vh-120px)] relative">
                {/* Stats Header */}
                <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-10 shadow-sm">
                    <div className="flex gap-6 overflow-x-auto no-scrollbar">
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-slate-500 uppercase">Locations</span>
                            <span className="text-lg font-bold text-slate-900">{mapData?.total_locations || 0}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-slate-500 uppercase">Locations</span>
                            <span className="text-lg font-bold text-orange-600">{mapData?.total_places_lived || 0}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-slate-500 uppercase">Photo Spots</span>
                            <span className="text-lg font-bold text-teal-600">{mapData?.total_photos_mapped || 0}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-slate-500 uppercase">Countries</span>
                            <span className="text-lg font-bold text-slate-900">{mapData?.countries_count || 0}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${showFilters || selectedPersonId !== 'all'
                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                            }`}
                    >
                        <Filter className="w-4 h-4" />
                        Filter
                        {selectedPersonId !== 'all' && <span className="ml-1 flex h-2 w-2 rounded-full bg-teal-600" />}
                    </button>
                </div>

                {/* Filter Sidebar (Overlay) */}
                {showFilters && (
                    <div className="absolute top-[73px] right-4 w-72 bg-white rounded-lg shadow-xl border border-slate-200 z-[1000] max-h-[calc(100%-90px)] flex flex-col">
                        <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-lg">
                            <h3 className="font-semibold text-slate-900">Filter by Person</h3>
                            <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-2 space-y-1">
                            <button
                                onClick={() => setSelectedPersonId('all')}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedPersonId === 'all'
                                    ? 'bg-teal-50 text-teal-700 font-medium'
                                    : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                All People
                            </button>
                            {peopleList.map(([id, name]) => (
                                <button
                                    key={id}
                                    onClick={() => setSelectedPersonId(id)}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedPersonId === id
                                        ? 'bg-teal-50 text-teal-700 font-medium'
                                        : 'text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Map */}
                <div className="flex-1 bg-slate-100 relative z-0">
                    {filteredLocations.length > 0 ? (
                        <MapContainer
                            bounds={bounds}
                            style={{ height: '100%', width: '100%' }}
                            scrollWheelZoom={true}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {filteredLocations.map((loc, index) => {
                                const isLived = loc.type === 'lived';
                                const color = isLived ? '#ea580c' : '#14b8a6';
                                const fillColor = isLived ? '#f97316' : '#14b8a6';

                                return (
                                    <CircleMarker
                                        key={`${loc.type}-${index}`}
                                        center={[loc.latitude, loc.longitude]}
                                        radius={isLived ? 8 : 5}
                                        pathOptions={{
                                            color: color,
                                            fillColor: fillColor,
                                            fillOpacity: 0.6,
                                            weight: 2
                                        }}
                                    >
                                        <Popup>
                                            <div className="text-sm min-w-[200px]">
                                                <p className="font-bold text-slate-900 mb-1">{loc.personName}</p>
                                                <p className="font-medium text-slate-800">{loc.name}</p>
                                                <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color }}>
                                                    {isLived ? 'Location' : 'Photo Location'}
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
                                                        {loc.details?.address && (
                                                            <p className="mt-1 italic text-slate-500">{loc.details.address}</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-slate-500">
                                                        {loc.date ? new Date(loc.date).toLocaleDateString() : (loc.details?.year || 'Unknown Date')}
                                                    </p>
                                                )}
                                                <button
                                                    onClick={() => navigate(`/tree/${treeId}/person/${loc.personId}`)}
                                                    className="mt-2 text-xs text-teal-600 hover:underline font-medium"
                                                >
                                                    View Profile
                                                </button>
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                );
                            })}
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
            </main>
        </div>
    );
};

export default TreeMapPage;
