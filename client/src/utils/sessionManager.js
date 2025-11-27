// Session Manager - Handles persistent login and token refresh
import { supabase } from '../auth';

const SESSION_KEY = 'roots_branches_session';
const TOKEN_REFRESH_THRESHOLD = 30 * 60 * 1000; // 30 minutes in ms

class SessionManager {
    constructor() {
        this.session = null;
        this.refreshTimer = null;
    }

    // Save session to localStorage
    saveSession(session) {
        if (session) {
            localStorage.setItem(SESSION_KEY, JSON.stringify({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                expires_at: session.expires_at,
                user: session.user
            }));
            this.session = session;
            this.scheduleRefresh(session);
        }
    }

    // Load session from localStorage
    loadSession() {
        try {
            const stored = localStorage.getItem(SESSION_KEY);
            if (stored) {
                const session = JSON.parse(stored);
                // Check if session is expired
                if (session.expires_at && session.expires_at * 1000 > Date.now()) {
                    this.session = session;
                    this.scheduleRefresh(session);
                    return session;
                } else {
                    // Session expired, try to refresh
                    this.refreshSession(session.refresh_token);
                }
            }
        } catch (error) {
            console.error('Error loading session:', error);
            this.clearSession();
        }
        return null;
    }

    // Clear session from localStorage
    clearSession() {
        localStorage.removeItem(SESSION_KEY);
        this.session = null;
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    // Schedule automatic token refresh
    scheduleRefresh(session) {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }

        if (!session.expires_at) return;

        const expiresAt = session.expires_at * 1000;
        const now = Date.now();
        const timeUntilExpiry = expiresAt - now;
        const refreshTime = timeUntilExpiry - TOKEN_REFRESH_THRESHOLD;

        if (refreshTime > 0) {
            this.refreshTimer = setTimeout(() => {
                this.refreshSession(session.refresh_token);
            }, refreshTime);
        } else {
            // Token is about to expire or already expired, refresh immediately
            this.refreshSession(session.refresh_token);
        }
    }

    // Refresh the session token
    async refreshSession(refreshToken) {
        try {
            const { data, error } = await supabase.auth.refreshSession({
                refresh_token: refreshToken
            });

            if (error) throw error;

            if (data.session) {
                this.saveSession(data.session);
                console.log('Session refreshed successfully');
                return data.session;
            }
        } catch (error) {
            console.error('Error refreshing session:', error);
            this.clearSession();
            // Redirect to login or show error
            window.location.href = '/auth-error?reason=session_expired';
            return null;
        }
    }

    // Get current session
    getSession() {
        return this.session;
    }

    // Check if user is authenticated
    isAuthenticated() {
        const session = this.loadSession();
        return session !== null;
    }
}

// Export singleton instance
export const sessionManager = new SessionManager();
