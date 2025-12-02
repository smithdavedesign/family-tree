import { useState, useEffect } from 'react';
import { supabase } from '../../../auth';
import { normalizeTimelineEvents } from '../utils/timelineUtils';

const useTimelineData = (treeId) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [persons, setPersons] = useState([]); // Keep raw persons if needed for filters

    useEffect(() => {
        const fetchData = async () => {
            if (!treeId) return;

            setLoading(true);
            setError(null);

            try {
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;

                if (!token) throw new Error('No auth token found');

                const response = await fetch(`/api/tree/${treeId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    if (response.status === 403) throw new Error('Access denied. You do not have permission to view this timeline.');
                    if (response.status === 404) throw new Error('Tree not found.');
                    throw new Error('Failed to fetch tree data');
                }

                const { persons, relationships } = await response.json();

                setPersons(persons);
                const normalizedEvents = normalizeTimelineEvents(persons, relationships);
                setEvents(normalizedEvents);

            } catch (err) {
                console.error("Error fetching timeline data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [treeId]);

    return { events, persons, loading, error };
};

export default useTimelineData;
