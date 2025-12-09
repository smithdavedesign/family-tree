import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Layers, Navigation } from 'lucide-react';
import MapPopup from './MapPopup';
import { supabase } from '../auth';

// Fix for default Leaflet marker icons
const createCustomIcon = (count) => {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div class="w-8 h-8 bg-teal-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs">${count > 1 ? count : ''}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

const RecenterMap = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) {
            map.flyTo([lat, lng], 13);
        }
    }, [lat, lng, map]);
    return null;
};

const MapGallery = ({ photos, onPhotoClick }) => {
    const [nearbyPhotos, setNearbyPhotos] = useState([]);
    const [center, setCenter] = useState(null);

    // Filter photos with location data
    const locatedPhotos = useMemo(() => {
        // Combine original photos and nearby photos, removing duplicates
        const allPhotos = [...photos, ...nearbyPhotos];
        const uniquePhotos = Array.from(new Set(allPhotos.map(p => p.id)))
            .map(id => allPhotos.find(p => p.id === id));

        return uniquePhotos.filter(p => p.latitude && p.longitude);
    }, [photos, nearbyPhotos]);

    const handleFindNearby = async (photo) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/map/nearby?lat=${photo.latitude}&lng=${photo.longitude}&radius=20`, {
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setNearbyPhotos(data);
                setCenter({ lat: photo.latitude, lng: photo.longitude });
            }
        } catch (error) {
            console.error('Error fetching nearby photos:', error);
        }
    };

    if (locatedPhotos.length === 0) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50 text-slate-500">
                <MapPin className="w-12 h-12 mb-2 text-slate-300" />
                <p>No photos with location data found.</p>
            </div>
        );
    }

    // Calculate bounds
    const bounds = L.latLngBounds(locatedPhotos.map(p => [p.latitude, p.longitude]));
    if (locatedPhotos.length === 1) {
        bounds.extend([locatedPhotos[0].latitude + 0.1, locatedPhotos[0].longitude + 0.1]);
        bounds.extend([locatedPhotos[0].latitude - 0.1, locatedPhotos[0].longitude - 0.1]);
    }

    return (
        <div className="h-full w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
            <MapContainer
                bounds={bounds}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <LayersControl position="topright">
                    <LayersControl.BaseLayer checked name="Street Map">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Satellite (Esri)">
                        <TileLayer
                            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Topographic">
                        <TileLayer
                            attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
                            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                        />
                    </LayersControl.BaseLayer>
                </LayersControl>

                {center && <RecenterMap lat={center.lat} lng={center.lng} />}

                <MarkerClusterGroup
                    chunkedLoading
                    iconCreateFunction={(cluster) => {
                        return L.divIcon({
                            html: `<div class="w-10 h-10 bg-teal-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-bold">${cluster.getChildCount()}</div>`,
                            className: 'custom-cluster-marker',
                            iconSize: L.point(40, 40)
                        });
                    }}
                >
                    {locatedPhotos.map(photo => (
                        <Marker
                            key={photo.id}
                            position={[photo.latitude, photo.longitude]}
                            icon={createCustomIcon(1)}
                        >
                            <Popup minWidth={250} maxWidth={300}>
                                <MapPopup
                                    photo={photo}
                                    onFindNearby={handleFindNearby}
                                    onOpenLightbox={onPhotoClick}
                                />
                            </Popup>
                        </Marker>
                    ))}
                </MarkerClusterGroup>
            </MapContainer>

            {/* Legend / Info Overlay */}
            <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur p-2 rounded-lg shadow-md text-xs text-slate-600">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-teal-600 rounded-full"></div>
                    <span>Photos</span>
                </div>
                {nearbyPhotos.length > 0 && (
                    <div className="mt-1 font-medium text-teal-700">
                        Found {nearbyPhotos.length} nearby photos
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapGallery;
