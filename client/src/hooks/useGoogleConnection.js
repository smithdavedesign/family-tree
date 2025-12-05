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
    const connect = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                setError('Please sign in first');
                return;
            }
            // Get return URL from sessionStorage or default to /settings
            const returnUrl = sessionStorage.getItem('google_oauth_return_url') || '/settings';
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
        checkConnection();

        // Listen for connection success from redirect
        const params = new URLSearchParams(window.location.search);
        if (params.get('google_connected') === 'true') {
            // Remove param from URL
            window.history.replaceState({}, '', window.location.pathname);
            // Clear the return URL from sessionStorage
            sessionStorage.removeItem('google_oauth_return_url');
            checkConnection();
        }
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
