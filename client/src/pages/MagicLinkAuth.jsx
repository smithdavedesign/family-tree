import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../auth';
import { useNavigate } from 'react-router-dom';

const MagicLinkAuth = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const [showRegisterButton, setShowRegisterButton] = useState(false);
    const [mode, setMode] = useState('signin'); // 'signin' or 'reset'
    const navigate = useNavigate();

    const handleMagicLink = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setShowRegisterButton(false);

        try {
            if (mode === 'signin') {
                // Send magic link for sign in
                const { error } = await supabase.auth.signInWithOtp({
                    email: email,
                    options: {
                        emailRedirectTo: `${window.location.origin}/trees`,
                        shouldCreateUser: false // STRICT MODE: Prevent auto-registration
                    }
                });

                if (error) throw error;
            } else {
                // Send password reset email
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`
                });

                if (error) throw error;
            }

            setSent(true);
        } catch (err) {
            console.error('Magic link error:', err);

            // Handle "Signups not allowed" error specifically
            if (err.message?.includes('Signups not allowed') || err.message?.includes('User not found')) {
                setError('No account found with this email. Please create an account first.');
                setShowRegisterButton(true);
            } else {
                setError(err.message || 'Failed to send email');
            }
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Check Your Email</h2>
                    <p className="text-gray-600 mb-6">
                        We've sent a {mode === 'signin' ? 'magic link' : 'password reset link'} to:
                    </p>
                    <p className="text-teal-600 font-semibold mb-6">{email}</p>
                    <p className="text-sm text-gray-500 mb-6">
                        Click the link in the email to {mode === 'signin' ? 'sign in' : 'reset your password'}.
                        The link will expire in 1 hour.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-teal-600" />
                </div>

                <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
                    {mode === 'signin' ? 'Sign In with Email' : 'Reset Password'}
                </h2>
                <p className="text-gray-600 text-center mb-6">
                    {mode === 'signin'
                        ? "We'll send you a magic link to sign in without a password"
                        : "We'll send you a link to reset your password"}
                </p>

                <form onSubmit={handleMagicLink} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            <p>{error}</p>
                            {showRegisterButton && (
                                <button
                                    onClick={() => navigate('/register')}
                                    className="mt-2 text-sm font-semibold text-teal-700 hover:text-teal-800 underline"
                                >
                                    Create an account now &rarr;
                                </button>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !email}
                        className="w-full px-6 py-3 bg-teal-600 text-white rounded-lg shadow hover:bg-teal-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Sending...' : mode === 'signin' ? 'Send Magic Link' : 'Send Reset Link'}
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t text-center">
                    <button
                        onClick={() => setMode(mode === 'signin' ? 'reset' : 'signin')}
                        className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                    >
                        {mode === 'signin' ? 'Forgot password?' : 'Back to sign in'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MagicLinkAuth;
