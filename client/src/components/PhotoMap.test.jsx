import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import PhotoMap from './PhotoMap';

// Mock react-leaflet components
vi.mock('react-leaflet', () => ({
    MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
    TileLayer: () => <div data-testid="tile-layer" />,
    Marker: ({ children }) => <div data-testid="marker">{children}</div>,
    Popup: ({ children }) => <div data-testid="popup">{children}</div>,
}));

describe('PhotoMap', () => {
    it('renders empty state when no photos have location', () => {
        const photos = [
            { id: 1, url: 'test.jpg' }, // No lat/long
            { id: 2, url: 'test2.jpg', latitude: null, longitude: null }
        ];

        render(<PhotoMap photos={photos} />);
        expect(screen.getByText('No photos with location data found.')).toBeInTheDocument();
    });

    it('renders map with markers for located photos', () => {
        const photos = [
            { id: 1, url: 'test.jpg', latitude: 40.7128, longitude: -74.0060, caption: 'NYC' },
            { id: 2, url: 'test2.jpg', latitude: 34.0522, longitude: -118.2437, caption: 'LA' },
            { id: 3, url: 'test3.jpg' } // Should be ignored
        ];

        render(<PhotoMap photos={photos} />);

        expect(screen.getByTestId('map-container')).toBeInTheDocument();
        expect(screen.getAllByTestId('marker')).toHaveLength(2);
    });
});
