import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { supabase } from '../auth';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email) {
            setError('Please enter your email address');
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            setSent(true);
        } catch (err) {
            console.error('Password reset error:', err);
            // Don't reveal if email exists for security
            setSent(true); // Show success anyway
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-purple-50 px-4">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        {/* Success Icon */}
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">
                            Check Your Email
                        </h1>

                        {/* Message */}
                        <p className="text-slate-600 mb-4">
                            If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
                        </p>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                            <p className="text-sm text-blue-900 font-medium mb-2">Next steps:</p>
                            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                                <li>Check your email inbox (and spam folder)</li>
                                <li>Click the password reset link</li>
                                <li>Create a new password</li>
                            </ol>
                        </div>

                        {/* Back to Login */}
                        <Button
                            onClick={() => window.location.href = '/login'}
                            fullWidth
                            className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Sign In
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-purple-50 px-4">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-teal-600 mb-2">Roots & Branches</h1>
                    <p className="text-slate-600">Reset your password</p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Mail className="w-6 h-6 text-teal-600" />
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 text-center mb-2">
                        Forgot your password?
                    </h2>
                    <p className="text-sm text-slate-600 text-center mb-6">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="pl-10"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            fullWidth
                            disabled={loading}
                            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3"
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </Button>
                    </form>

                    {/* Back to Login */}
                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 text-sm text-teal-600 hover:underline"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
