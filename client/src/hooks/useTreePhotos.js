import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../auth';

const fetchTreePhotos = async (treeId) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('Not authenticated');

    const apiUrl = import.meta.env.VITE_API_URL || '';
    const response = await fetch(`${apiUrl}/api/tree/${treeId}/photos`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch photos');
    }

    return response.json();
};

export const useTreePhotos = (treeId) => {
    return useQuery({
        queryKey: ['treePhotos', treeId],
        queryFn: () => fetchTreePhotos(treeId),
        enabled: !!treeId,
    });
};

export const useTreeDetails = (treeId) => {
    return useQuery({
        queryKey: ['tree', treeId],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new Error('Not authenticated');

            const apiUrl = import.meta.env.VITE_API_URL || '';
            const response = await fetch(`${apiUrl}/api/tree/${treeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 403) throw new Error('You do not have permission to view this tree.');
                if (response.status === 404) throw new Error('Tree not found.');
                throw new Error('Failed to load tree details');
            }

            return response.json();
        },
        enabled: !!treeId,
    });
};
