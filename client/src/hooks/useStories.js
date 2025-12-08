import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../auth';

export const useStories = (treeId, personId) => {
    const queryClient = useQueryClient();

    const fetchStories = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const params = new URLSearchParams();
        if (treeId) params.append('tree_id', treeId);
        if (personId) params.append('person_id', personId);

        const response = await fetch(`/api/stories?${params}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch stories');
        }

        return response.json();
    };

    const createStory = async (storyData) => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch('/api/stories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(storyData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Story creation failed:', response.status, errorText);
            throw new Error(`Failed to create story: ${errorText}`);
        }

        return response.json();
    };

    const updateStory = async ({ id, ...updates }) => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch(`/api/stories/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(updates)
        });

        if (!response.ok) {
            throw new Error('Failed to update story');
        }

        return response.json();
    };

    const deleteStory = async (id) => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch(`/api/stories/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Failed to delete story');
        }

        return response.json();
    };

    const { data: stories = [], isLoading, error } = useQuery({
        queryKey: ['stories', treeId, personId],
        queryFn: fetchStories,
        enabled: !!(treeId || personId),
    });

    const createMutation = useMutation({
        mutationFn: createStory,
        onSuccess: () => {
            queryClient.invalidateQueries(['stories']);
        },
    });

    const updateMutation = useMutation({
        mutationFn: updateStory,
        onSuccess: () => {
            queryClient.invalidateQueries(['stories']);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteStory,
        onSuccess: () => {
            queryClient.invalidateQueries(['stories']);
        },
    });

    return {
        stories,
        isLoading,
        error,
        createStory: createMutation.mutateAsync,
        updateStory: updateMutation.mutateAsync,
        deleteStory: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
};
