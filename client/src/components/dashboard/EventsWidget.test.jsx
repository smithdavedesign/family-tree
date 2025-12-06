import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import EventsWidget from './EventsWidget';
import { useReminders } from '../../hooks/useReminders';

// Mock the hook
vi.mock('../../hooks/useReminders');

describe('EventsWidget', () => {
    it('renders loading state', () => {
        useReminders.mockReturnValue({
            reminders: [],
            isLoading: true
        });

        const { container } = render(<EventsWidget />);
        expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('renders empty state', () => {
        useReminders.mockReturnValue({
            reminders: [],
            isLoading: false
        });

        render(<EventsWidget />);
        expect(screen.getByText('No upcoming events found.')).toBeInTheDocument();
    });

    it('renders list of events', () => {
        const mockEvents = [
            {
                id: '1',
                type: 'birthday',
                title: "John's Birthday",
                date: new Date().toISOString(),
                years: 30
            },
            {
                id: '2',
                type: 'anniversary',
                title: "Jane & Doe Anniversary",
                date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
                years: 10
            }
        ];

        useReminders.mockReturnValue({
            reminders: mockEvents,
            isLoading: false
        });

        render(<EventsWidget />);

        expect(screen.getByText("John's Birthday")).toBeInTheDocument();
        expect(screen.getByText("Jane & Doe Anniversary")).toBeInTheDocument();
        expect(screen.getByText("30 years")).toBeInTheDocument();
        expect(screen.getByText("10 years")).toBeInTheDocument();
    });
});
