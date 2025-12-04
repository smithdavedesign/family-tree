import { useState, useEffect } from 'react';

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
     * Check current connection status
     */
    const checkConnection = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch('/api/google/status', {
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
     * Redirects to /api/google/connect
     */
    const connect = () => {
        window.location.href = '/api/google/connect';
    };

    /**
     * Disconnect Google account
     * Removes connection from database
     */
    const disconnect = async () => {
        try {
            setError(null);

            const response = await fetch('/api/google/disconnect', {
                method: 'POST',
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
            const response = await fetch('/api/google/token', {
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
        if (params.get('connected') === 'true') {
            // Remove param from URL
            window.history.replaceState({}, '', window.location.pathname);
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
