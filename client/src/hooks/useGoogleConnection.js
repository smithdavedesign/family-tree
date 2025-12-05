import { useState, useEffect } from 'react';
import { supabase } from '../auth';

/**
 * Custom hook to manage Google OAuth connection state
 * Handles connection status, connect/disconnect actions, and token management
 */
export const useGoogleConnection = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [connection, setConnection] = useState(null);
    const [error, setError] = useState(null);

    /**
     * Get auth headers for API requests
     */
    const getAuthHeaders = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
            throw new Error('No active session');
        }
        return {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
        };
    };

    /**
     * Check current connection status
     */
    const checkConnection = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const headers = await getAuthHeaders();
            const response = await fetch('/api/google/status', {
                headers,
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch connection status');
            }

            const data = await response.json();

            setIsConnected(data.connected);
            setConnection(data.connected ? data : null);
        } catch (err) {
            console.error('Error checking Google connection:', err);
            setError(err.message);
            setIsConnected(false);
            setConnection(null);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Initiate Google OAuth connection
     * Redirects to /api/google/connect with auth token
     */
    const connect = async (returnUrlOverride) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                setError('Please sign in first');
                return;
            }

            // Determine return URL:
            // 1. Explicit override passed to function
            // 2. Stored in sessionStorage (legacy/picker support)
            // 3. Current full URL (to preserve query params like ?returnUrl=...)
            const returnUrl = returnUrlOverride ||
                sessionStorage.getItem('google_oauth_return_url') ||
                (window.location.pathname + window.location.search);

            // Include token and return URL as URL parameters for the redirect
            window.location.href = `/api/google/connect?token=${session.access_token}&return_url=${encodeURIComponent(returnUrl)}`;
        } catch (err) {
            console.error('Error connecting:', err);
            setError(err.message);
        }
    };

    /**
     * Disconnect Google account
     * Removes connection from database
     */
    const disconnect = async () => {
        try {
            setError(null);

            const headers = await getAuthHeaders();
            const response = await fetch('/api/google/disconnect', {
                method: 'POST',
                headers,
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to disconnect');
            }

            setIsConnected(false);
            setConnection(null);
        } catch (err) {
            console.error('Error disconnecting Google:', err);
            setError(err.message);
        }
    };

    /**
     * Get a valid access token (auto-refreshes if needed)
     * Used by pickers to fetch current token
     */
    const getToken = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch('/api/google/token', {
                headers,
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to get access token');
            }

            const data = await response.json();
            return data.access_token;
        } catch (err) {
            console.error('Error getting access token:', err);
            throw err;
        }
    };

    // Check connection on mount and when URL params change
    useEffect(() => {
        const checkAndClean = async () => {
            // First check if we have the success param
            const params = new URLSearchParams(window.location.search);
            const isConnectedRedirect = params.get('google_connected') === 'true';

            if (isConnectedRedirect) {
                // If we just came back from a successful connection, force a check immediately
                await checkConnection();

                // Then clean up the URL, but preserve other params (like returnUrl)
                const currentParams = new URLSearchParams(window.location.search);
                currentParams.delete('google_connected');
                const newSearch = currentParams.toString();
                const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '');
                window.history.replaceState({}, '', newUrl);

                // Clear the return URL from sessionStorage
                sessionStorage.removeItem('google_oauth_return_url');
            } else {
                // Normal load, just check status
                checkConnection();
            }
        };

        checkAndClean();
    }, []);

    return {
        isConnected,
        connection,
        isLoading,
        error,
        connect,
        disconnect,
        getToken,
        refresh: checkConnection
    };
};
