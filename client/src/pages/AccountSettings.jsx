import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../auth';
import { Button } from '../components/ui';
import Breadcrumbs from '../components/Breadcrumbs';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useGoogleConnection } from '../hooks/useGoogleConnection';

const AccountSettings = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { isConnected, connection, isLoading: connectionLoading, error: connectionError, connect, disconnect } = useGoogleConnection();

    // Get return URL from state (if navigated via link) or query param
    const returnUrl = location.state?.returnUrl || new URLSearchParams(location.search).get('returnUrl') || '/trees';

    // Ensure the returnUrl is in the query params so it persists if we reload or redirect
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (!params.get('returnUrl') && returnUrl !== '/trees') {
            params.set('returnUrl', returnUrl);
            navigate(`${location.pathname}?${params.toString()}`, { replace: true });
        }
    }, [location.search, returnUrl, navigate, location.pathname]);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/');
                return;
            }
            setUser(user);
            setLoading(false);
        };

        getUser();
    }, [navigate]);

    const handleDeleteAccount = async () => {
        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch('/api/account', {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                await supabase.auth.signOut();
                navigate('/');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Navbar */}
            <div className="bg-white shadow-sm border-b border-slate-200 px-4 py-3 mb-8">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(returnUrl)}>
                        <span className="text-2xl">🌳</span>
                        <span className="font-bold text-xl text-slate-800">Roots & Branches</span>
                    </div>
                    <Button
                        onClick={() => navigate(returnUrl)}
                        variant="ghost"
                        size="sm"
                    >
                        {returnUrl === '/trees' ? 'Back to Dashboard' : 'Back to Tree'}
                    </Button>
                </div>
            </div>

            {/* Breadcrumbs */}
            <Breadcrumbs
                items={[
                    { label: 'My Trees', href: '/trees' },
                    ...(returnUrl !== '/trees' ? [{ label: 'Tree', href: returnUrl }] : []),
                    { label: 'Account Settings' }
                ]}
            />

            <div className="max-w-4xl mx-auto px-4 pb-8 mt-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Account Settings</h1>
                    <p className="text-slate-600">Manage your account and integrations</p>
                </div>

                {/* Account Information */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Account Information</h2>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm font-medium text-slate-700">Email</label>
                            <p className="text-slate-900">{user?.email}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700">User ID</label>
                            <p className="text-xs text-slate-500 font-mono">{user?.id}</p>
                        </div>
                    </div>
                </div>

                {/* Google Integrations */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">Google Integrations</h2>
                    <p className="text-sm text-slate-600 mb-6">
                        Connect your Google account to use Document and Photo pickers
                    </p>

                    {connectionLoading ? (
                        <div className="flex items-center gap-2 text-slate-600">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Loading connection status...</span>
                        </div>
                    ) : isConnected ? (
                        <div className="space-y-4">
                            {/* Connected State */}
                            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-medium text-green-900">Connected to Google</p>

                                    {/* Google Account Info */}
                                    {(connection?.google_email || connection?.google_name) && (
                                        <div className="flex items-center gap-3 mt-3 bg-white/50 p-2 rounded-md border border-green-100">
                                            {connection.google_picture ? (
                                                <img
                                                    src={connection.google_picture}
                                                    alt="Google Profile"
                                                    className="w-8 h-8 rounded-full border border-slate-200"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs">
                                                    {(connection.google_name?.[0] || connection.google_email?.[0] || 'G').toUpperCase()}
                                                </div>
                                            )}
                                            <div className="overflow-hidden">
                                                {connection.google_name && (
                                                    <p className="text-sm font-medium text-slate-900 truncate">{connection.google_name}</p>
                                                )}
                                                {connection.google_email && (
                                                    <p className="text-xs text-slate-600 truncate">{connection.google_email}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-sm text-green-700 mt-2">
                                        You can now use Google Drive and Photos pickers
                                    </p>
                                </div>
                            </div>

                            {/* Connection Details */}
                            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                                <div>
                                    <label className="text-xs font-medium text-slate-700 uppercase">Scopes</label>
                                    <div className="mt-1 flex flex-wrap gap-2">
                                        {connection?.scopes?.map((scope) => (
                                            <span
                                                key={scope}
                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                            >
                                                {scope.replace('https://www.googleapis.com/auth/', '')}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-700 uppercase">Connected</label>
                                    <p className="text-sm text-slate-600 mt-1">
                                        {new Date(connection?.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Disconnect Button */}
                            <Button
                                onClick={disconnect}
                                variant="outline"
                                className="w-full"
                            >
                                Disconnect Google Account
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Disconnected State */}
                            <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-medium text-slate-900">Not Connected</p>
                                    <p className="text-sm text-slate-600 mt-1">
                                        Connect your Google account to access Drive and Photos from within the app
                                    </p>
                                </div>
                            </div>

                            {connectionError && (
                                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-700">{connectionError}</p>
                                </div>
                            )}

                            {/* Connect Button */}
                            <Button
                                onClick={() => {
                                    // Construct the full return URL for the OAuth callback
                                    // We explicitly build this to ensure the returnUrl param is included
                                    // even if the current window.location hasn't updated yet
                                    const params = new URLSearchParams();
                                    if (returnUrl !== '/trees') {
                                        params.set('returnUrl', returnUrl);
                                    }
                                    const connectUrl = `${location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
                                    connect(connectUrl);
                                }}
                                className="w-full"
                            >
                                🔗 Connect Google Drive & Photos
                            </Button>
                        </div>
                    )}
                </div>

                {/* Danger Zone */}
                <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
                    <h2 className="text-xl font-semibold text-red-900 mb-2">Danger Zone</h2>
                    <p className="text-sm text-slate-600 mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button
                        onClick={handleDeleteAccount}
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                        Delete Account
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AccountSettings;
