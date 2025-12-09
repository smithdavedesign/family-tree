import { useQuery } from '@tanstack/react-query';
import { supabase } from '../auth';

const fetchPhotoStories = async (photoId) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('Not authenticated');

    const apiUrl = import.meta.env.VITE_API_URL || '';
    const response = await fetch(`${apiUrl}/api/stories?photo_id=${photoId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch stories');
    }

    return response.json();
};

const fetchPhotoEvents = async (photoId) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('Not authenticated');

    const apiUrl = import.meta.env.VITE_API_URL || '';
    const response = await fetch(`${apiUrl}/api/photos/${photoId}/events`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch events');
    }

    return response.json();
};

export const usePhotoDetails = (photoId) => {
    const { data: stories, isLoading: storiesLoading } = useQuery({
        queryKey: ['photoStories', photoId],
        queryFn: () => fetchPhotoStories(photoId),
        enabled: !!photoId,
    });

    const { data: events, isLoading: eventsLoading } = useQuery({
        queryKey: ['photoEvents', photoId],
        queryFn: () => fetchPhotoEvents(photoId),
        enabled: !!photoId,
    });

    return {
        stories: stories || [],
        events: events || [],
        isLoading: storiesLoading || eventsLoading
    };
};
