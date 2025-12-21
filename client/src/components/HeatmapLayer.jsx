import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

const HeatmapLayer = ({ points, options }) => {
    const map = useMap();

    useEffect(() => {
        if (!L.heatLayer) return;

        // Points format: [lat, lng, intensity]
        const heat = L.heatLayer(points, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            gradient: {
                0.4: 'blue',
                0.6: 'cyan',
                0.7: 'lime',
                0.8: 'yellow',
                1.0: 'red'
            },
            ...options
        }).addTo(map);

        return () => {
            map.removeLayer(heat);
        };
    }, [map, points, options]);

    return null;
};

export default HeatmapLayer;
