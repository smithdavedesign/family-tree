import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test/utils/testUtils';
import { vi } from 'vitest';
import LifeEventsList from './LifeEventsList';
import { useLifeEvents } from '../hooks/useLifeEvents';

// Mock the hook
vi.mock('../hooks/useLifeEvents');

describe('LifeEventsList', () => {
    const mockEvents = [
        {
            id: '1',
            event_type: 'education',
            title: 'High School',
            date: '2010-05-20',
            description: 'Graduated with honors'
        },
        {
            id: '2',
            event_type: 'work',
            title: 'Software Engineer',
            start_date: '2015-01-01',
            end_date: '2020-01-01',
            location: 'San Francisco'
        }
    ];

    const mockAddEvent = vi.fn();
    const mockUpdateEvent = vi.fn();
    const mockDeleteEvent = vi.fn();

    beforeEach(() => {
        useLifeEvents.mockReturnValue({
            events: mockEvents,
            isLoading: false,
            addEvent: mockAddEvent,
            updateEvent: mockUpdateEvent,
            deleteEvent: mockDeleteEvent,
            isAdding: false,
            isUpdating: false,
            isDeleting: false
        });
    });

    it('renders list of events', () => {
        render(<LifeEventsList personId="123" isEditor={false} />);

        expect(screen.getByText('High School')).toBeInTheDocument();
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
        expect(screen.getByText('education')).toBeInTheDocument();
        expect(screen.getByText('work')).toBeInTheDocument();
    });

    it('shows add button only for editors', () => {
        const { rerender } = render(<LifeEventsList personId="123" isEditor={false} />);
        expect(screen.queryByText('Add Life Event')).not.toBeInTheDocument();

        rerender(<LifeEventsList personId="123" isEditor={true} />);
        expect(screen.getByText('Add Life Event')).toBeInTheDocument();
    });

    it('opens form when add button is clicked', () => {
        render(<LifeEventsList personId="123" isEditor={true} />);

        fireEvent.click(screen.getByText('Add Life Event'));

        expect(screen.getByText('Add New Event')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('e.g., Graduated High School')).toBeInTheDocument();
    });

    it('calls addEvent when form is submitted', async () => {
        // Mock the hook to return empty events initially so we can see the form
        useLifeEvents.mockReturnValue({
            events: [],
            isLoading: false,
            addEvent: mockAddEvent,
            updateEvent: mockUpdateEvent,
            deleteEvent: mockDeleteEvent
        });

        render(<LifeEventsList personId="123" isEditor={true} />);

        fireEvent.click(screen.getByText('Add Life Event'));

        fireEvent.change(screen.getByPlaceholderText('e.g., Graduated High School'), {
            target: { value: 'New Event' }
        });

        fireEvent.click(screen.getByText('Add Event'));

        await waitFor(() => {
            expect(mockAddEvent).toHaveBeenCalledWith(expect.objectContaining({
                title: 'New Event'
            }));
        });
    });
});
