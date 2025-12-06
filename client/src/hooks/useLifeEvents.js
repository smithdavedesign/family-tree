import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../auth';

export const useLifeEvents = (personId) => {
    const queryClient = useQueryClient();

    const fetchEvents = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch(`/api/person/${personId}/events`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch life events');
        }

        return response.json();
    };

    const addEvent = async (eventData) => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch(`/api/person/${personId}/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(eventData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add life event');
        }

        return response.json();
    };

    const updateEvent = async ({ id, ...eventData }) => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch(`/api/events/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(eventData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update life event');
        }

        return response.json();
    };

    const deleteEvent = async (id) => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch(`/api/events/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete life event');
        }

        return response.json();
    };

    const { data: events = [], isLoading, error } = useQuery({
        queryKey: ['lifeEvents', personId],
        queryFn: fetchEvents,
        enabled: !!personId
    });

    const addMutation = useMutation({
        mutationFn: addEvent,
        onSuccess: () => {
            queryClient.invalidateQueries(['lifeEvents', personId]);
        }
    });

    const updateMutation = useMutation({
        mutationFn: updateEvent,
        onSuccess: () => {
            queryClient.invalidateQueries(['lifeEvents', personId]);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteEvent,
        onSuccess: () => {
            queryClient.invalidateQueries(['lifeEvents', personId]);
        }
    });

    return {
        events,
        isLoading,
        error,
        addEvent: addMutation.mutate,
        updateEvent: updateMutation.mutate,
        deleteEvent: deleteMutation.mutate,
        isAdding: addMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending
    };
};
