import { useQuery } from '@tanstack/react-query';
import { supabase } from '../auth';

export const useReminders = () => {
    const fetchReminders = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch('/api/reminders/upcoming', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch reminders');
        }

        return response.json();
    };

    const { data: reminders = [], isLoading, error } = useQuery({
        queryKey: ['reminders'],
        queryFn: fetchReminders,
        staleTime: 1000 * 60 * 60, // Cache for 1 hour
    });

    return {
        reminders,
        isLoading,
        error
    };
};
