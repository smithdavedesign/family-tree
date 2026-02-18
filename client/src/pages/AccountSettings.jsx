import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../auth';
import { Button, useToast } from '../components/ui';
import Breadcrumbs from '../components/Breadcrumbs';
import Navbar from '../components/Navbar';
import { Loader2, CheckCircle2, XCircle, AlertCircle, CreditCard } from 'lucide-react';
import { useGoogleConnection } from '../hooks/useGoogleConnection';
import { useSubscription } from '../context/SubscriptionContext';
import { api } from '../auth';

const AccountSettings = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [publicProfile, setPublicProfile] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [updating, setUpdating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [couponCode, setCouponCode] = useState('');
    const [redeeming, setRedeeming] = useState(false);
    const [notificationPrefs, setNotificationPrefs] = useState(null);
    const [updatingPrefs, setUpdatingPrefs] = useState(false);
    const { toast } = useToast();

    // Get returnUrl from query params or state
    const queryParams = new URLSearchParams(location.search);
    const returnUrl = location.state?.returnUrl || queryParams.get('returnUrl') || '/trees';
    const returnLabel = location.state?.returnLabel || queryParams.get('returnLabel') || 'Back';

    const {
        isConnected,
        connection,
        isLoading: connectionLoading,
        error: connectionError,
        connect,
        disconnect
    } = useGoogleConnection();

    const { subscription, planTier, currentPlan, hasStripeAccount, loading: subLoading, refreshSubscription } = useSubscription() || {};

    const formatPlanName = (plan) => {
        if (!plan || plan === 'free' || plan === 'price_free') return 'Free';
        if (plan === 'price_pro_monthly') return 'Pro Monthly';
        if (plan === 'price_pro_yearly') return 'Pro Yearly';
        return 'Pro'; // Fallback
    };

    const handleManageSubscription = async () => {
        try {
            const { data } = await api.post('/subscription/portal');
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error('Failed to open billing portal:', error);
            const message = error.message || 'Failed to open billing portal';
            toast.error(message);
            // Refresh to sync UI with backend (e.g. if stale ID was cleared)
            refreshSubscription();
        }
    };

    const handleRedeemCode = async () => {
        if (!couponCode.trim()) return;
        setRedeeming(true);
        try {
            const { data } = await api.post('/subscription/redeem', { code: couponCode });
            toast.success(data.message);
            refreshSubscription();
            setCouponCode('');
        } catch (error) {
            console.error('Coupon redemption failed:', error);
            toast.error(error.response?.data?.error || 'Invalid or expired code');
        } finally {
            setRedeeming(false);
        }
    };

    useEffect(() => {
        // Check for Stripe success return
        const sessionId = queryParams.get('session_id');
        if (sessionId) {
            toast.success('Subscription updated successfully! Your tokens have been added.');
            // Refresh token balance
            refreshSubscription();
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/');
                return;
            }
            setUser(user);

            // Fetch public profile
            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile) {
                setPublicProfile(profile);
                setAvatarUrl(profile.avatar_url || '');
            }

            setLoading(false);
        };

        getUser();
        fetchNotificationPreferences();
    }, [navigate]);

    const fetchNotificationPreferences = async () => {
        try {
            const { data } = await api.get('/notifications/preferences');
            setNotificationPrefs(data);
        } catch (error) {
            console.error('Error fetching notification preferences:', error);
        }
    };

    const handleUpdateNotificationPrefs = async (updates) => {
        setUpdatingPrefs(true);
        try {
            const { data } = await api.put('/notifications/preferences', {
                ...notificationPrefs,
                ...updates
            });
            setNotificationPrefs(data);
            toast.success('Notification preferences updated');
        } catch (error) {
            console.error('Error updating notification preferences:', error);
            toast.error('Failed to update preferences');
        } finally {
            setUpdatingPrefs(false);
        }
    };

    const handleUpdateProfile = async () => {
        if (!avatarUrl.trim()) return;

        setUpdating(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch('/api/account', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ avatar_url: avatarUrl })
            });

            if (!response.ok) throw new Error('Failed to update profile');

            const updatedProfile = await response.json();
            setPublicProfile(updatedProfile);
            // toast.success('Profile updated successfully'); // If toast is available
            alert('Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm('Are you certain you want to delete your account? This action cannot be undone and all your data will be permanently lost.')) {
            return;
        }

        const confirmation = prompt('To confirm deletion, please type "DELETE" below:');
        if (confirmation !== 'DELETE') {
            return;
        }

        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch('/api/account', {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${session?.access_token}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete account');
            }

            await supabase.auth.signOut();
            toast.success('Account deleted successfully');
            navigate('/login');
        } catch (error) {
            console.error('Error deleting account:', error);
            toast.error(error.message || 'Error deleting account');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Navbar */}
            <Navbar user={user} onOpenSettings={null} />

            {/* Breadcrumbs */}
            <Breadcrumbs
                backItem={{ label: returnLabel, href: returnUrl }}
                items={[
                    { label: 'Settings' }
                ]}
            />

            <div className="max-w-4xl mx-auto px-4 pb-8 mt-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Account Settings</h1>
                    <p className="text-slate-600">Manage your account and integrations</p>
                </div>

                {/* Profile Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-6">Profile Settings</h2>
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        <div className="flex-shrink-0">
                            <div className="w-20 h-20 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <span className="text-2xl">?</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 w-full space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Profile Picture URL
                                </label>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="text"
                                        value={avatarUrl}
                                        onChange={(e) => setAvatarUrl(e.target.value)}
                                        placeholder="https://example.com/avatar.jpg"
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                    <Button
                                        onClick={handleUpdateProfile}
                                        disabled={updating || !avatarUrl.trim() || avatarUrl === publicProfile?.avatar_url}
                                        className="w-full sm:w-auto"
                                    >
                                        {updating ? 'Saving...' : 'Save'}
                                    </Button>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Enter a URL for your profile picture. This will be displayed next to your comments.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Information */}
                {/* ... */}
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

                {/* Subscription Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Subscription & Billing</h2>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-slate-900 capitalize">Current Plan: {planTier === 'price_free' ? 'Free' : (planTier === 'pro' ? 'Pro' : planTier)}</p>
                            <p className="text-sm text-slate-500">
                                {subscription?.status === 'active' ? 'Active subscription' : 'Free tier (limited access)'}
                            </p>
                        </div>
                        {planTier === 'pro' || planTier === 'price_pro_monthly' || planTier === 'price_pro_yearly' ? (
                            hasStripeAccount ? (
                                <Button onClick={handleManageSubscription} variant="outline" className="flex items-center gap-2">
                                    <CreditCard className="w-4 h-4" />
                                    Manage Subscription
                                </Button>
                            ) : (
                                <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 font-medium text-sm flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Pro Member
                                </div>
                            )
                        ) : (
                            <Button onClick={() => navigate('/pricing')} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
                                <CreditCard className="w-4 h-4" />
                                Upgrade to Pro
                            </Button>
                        )}
                    </div>

                    {/* Family Coupon Section */}
                    <div className="mt-8 pt-8 border-t border-slate-100">
                        <div className="flex items-center gap-2 mb-4">
                            <CheckCircle2 className="w-5 h-5 text-teal-600" />
                            <h3 className="text-lg font-semibold text-slate-900">Redeem Family Code</h3>
                        </div>
                        <p className="text-sm text-slate-600 mb-4">
                            Enter your secret family code to refill your AI token balance. This code is provided specifically for family members.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                    placeholder="Enter secret code"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm font-medium uppercase tracking-wider placeholder:normal-case"
                                />
                            </div>
                            <Button
                                onClick={handleRedeemCode}
                                disabled={redeeming || !couponCode.trim()}
                                className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200/50 transition-all active:scale-95"
                            >
                                {redeeming ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Redeeming...
                                    </>
                                ) : (
                                    'Redeem Code'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Email Notifications */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">📧 Email Notifications</h2>
                    <p className="text-sm text-slate-600 mb-6">
                        Choose which activities you want to receive email notifications about
                    </p>

                    {notificationPrefs ? (
                        <div className="space-y-4">
                            {/* Notification toggles */}
                            <div className="grid gap-4">
                                <NotificationToggle
                                    label="Comments"
                                    description="Get notified when someone comments on a story or photo"
                                    enabled={notificationPrefs.email_on_comment}
                                    onChange={(enabled) => handleUpdateNotificationPrefs({ email_on_comment: enabled })}
                                    disabled={updatingPrefs}
                                />
                                <NotificationToggle
                                    label="New Stories"
                                    description="Get notified when new stories are added to your trees"
                                    enabled={notificationPrefs.email_on_story}
                                    onChange={(enabled) => handleUpdateNotificationPrefs({ email_on_story: enabled })}
                                    disabled={updatingPrefs}
                                />
                                <NotificationToggle
                                    label="New Albums"
                                    description="Get notified when new photo albums are created"
                                    enabled={notificationPrefs.email_on_album}
                                    onChange={(enabled) => handleUpdateNotificationPrefs({ email_on_album: enabled })}
                                    disabled={updatingPrefs}
                                />
                                <NotificationToggle
                                    label="New People"
                                    description="Get notified when new family members are added"
                                    enabled={notificationPrefs.email_on_person}
                                    onChange={(enabled) => handleUpdateNotificationPrefs({ email_on_person: enabled })}
                                    disabled={updatingPrefs}
                                />
                                <NotificationToggle
                                    label="Tree Invitations"
                                    description="Get notified when you're invited to collaborate on a tree"
                                    enabled={notificationPrefs.email_on_invite}
                                    onChange={(enabled) => handleUpdateNotificationPrefs({ email_on_invite: enabled })}
                                    disabled={updatingPrefs}
                                />
                            </div>

                            {/* Digest frequency */}
                            <div className="pt-4 border-t border-slate-100">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Notification Frequency
                                </label>
                                <select
                                    value={notificationPrefs.digest_frequency || 'instant'}
                                    onChange={(e) => handleUpdateNotificationPrefs({ digest_frequency: e.target.value })}
                                    disabled={updatingPrefs}
                                    className="w-full max-w-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                                >
                                    <option value="instant">Instant (as they happen)</option>
                                    <option value="daily">Daily Digest</option>
                                    <option value="weekly">Weekly Digest</option>
                                    <option value="never">Never (turn off all emails)</option>
                                </select>
                                <p className="text-xs text-slate-500 mt-2">
                                    {notificationPrefs.digest_frequency === 'never'
                                        ? 'You will not receive any email notifications'
                                        : notificationPrefs.digest_frequency === 'instant'
                                            ? 'You\'ll receive emails immediately when activities occur'
                                            : `You'll receive a summary of activities ${notificationPrefs.digest_frequency === 'daily' ? 'once per day' : 'once per week'}`
                                    }
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-slate-600">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Loading preferences...</span>
                        </div>
                    )}
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
                                fullWidth
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
                                fullWidth
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
                        fullWidth
                        className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                        Delete Account
                    </Button>
                </div>
            </div>
        </div >
    );
};

// Helper component for notification toggles
const NotificationToggle = ({ label, description, enabled, onChange, disabled }) => {
    return (
        <div className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-teal-300 transition-colors">
            <div className="flex-1">
                <label className="block text-sm font-medium text-slate-900 mb-1">
                    {label}
                </label>
                <p className="text-xs text-slate-600">
                    {description}
                </p>
            </div>
            <button
                onClick={() => onChange(!enabled)}
                disabled={disabled}
                className={`
                    relative inline-flex h-6 w-11 items-center rounded-full
                    transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2
                    ${enabled ? 'bg-teal-600' : 'bg-slate-300'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
            >
                <span
                    className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${enabled ? 'translate-x-6' : 'translate-x-1'}
                    `}
                />
            </button>
        </div>
    );
};

export default AccountSettings;
