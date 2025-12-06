import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

// Fix for default Leaflet marker icons not showing in React
// We'll use a custom div icon instead for better styling
const createCustomIcon = (count) => {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div class="w-8 h-8 bg-teal-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs">${count > 1 ? count : ''}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

const PhotoMap = ({ photos }) => {
    // Filter photos with location data
    const locatedPhotos = useMemo(() => {
        return photos.filter(p => p.latitude && p.longitude);
    }, [photos]);

    // Simple clustering: Group photos that are very close to each other
    // For MVP, we'll just map them directly. If many are at exact same spot, we might want to jitter them slightly or use a real cluster library.
    // Let's just render markers for now.

    if (locatedPhotos.length === 0) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50 text-slate-500">
                <MapPin className="w-12 h-12 mb-2 text-slate-300" />
                <p>No photos with location data found.</p>
            </div>
        );
    }

    // Calculate bounds to fit all markers
    const bounds = L.latLngBounds(locatedPhotos.map(p => [p.latitude, p.longitude]));
    // Add some padding if only one point
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
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {locatedPhotos.map(photo => (
                    <Marker
                        key={photo.id}
                        position={[photo.latitude, photo.longitude]}
                        icon={createCustomIcon(1)}
                    >
                        <Popup>
                            <div className="w-48">
                                <div className="aspect-square w-full bg-slate-100 rounded-lg overflow-hidden mb-2">
                                    <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover" />
                                </div>
                                <p className="text-sm font-medium text-slate-900 line-clamp-2">{photo.caption || 'Untitled Photo'}</p>
                                <p className="text-xs text-slate-500 mt-1">{photo.location_name || `${photo.latitude.toFixed(4)}, ${photo.longitude.toFixed(4)}`}</p>
                                {photo.taken_date && (
                                    <p className="text-xs text-slate-400 mt-0.5">{new Date(photo.taken_date).toLocaleDateString()}</p>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default PhotoMap;
