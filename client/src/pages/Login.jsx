import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { signInWithPassword, signInWithGoogle } from '../auth';

const Login = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('password'); // 'password' or 'magic-link'
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setError('');
    };

    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.email || !formData.password) {
            setError('Please enter your email and password');
            return;
        }

        try {
            setLoading(true);
            await signInWithPassword(formData.email, formData.password);

            // Redirect to trees dashboard (onboarding not built yet)
            navigate('/trees');
        } catch (err) {
            console.error('Login error:', err);

            if (err.message?.includes('Invalid login credentials')) {
                setError('Email or password is incorrect');
            } else if (err.message?.includes('Email not confirmed')) {
                setError('Please verify your email before signing in');
            } else {
                setError(err.message || 'Failed to sign in. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleMagicLink = async (e) => {
        e.preventDefault();
        // Redirect to existing magic link page
        navigate('/magic-link');
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            await signInWithGoogle();
        } catch (err) {
            console.error('Google login error:', err);
            setError('Failed to sign in with Google. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-purple-50 px-4">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-teal-600 mb-2">Roots & Branches</h1>
                    <p className="text-slate-600">Welcome back</p>
                </div>

                {/* Login Form */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 mb-6">
                        <button
                            onClick={() => setActiveTab('password')}
                            className={`flex-1 pb-3 text-sm font-medium transition-colors ${activeTab === 'password'
                                ? 'text-teal-600 border-b-2 border-teal-600'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Email & Password
                        </button>
                        <button
                            onClick={() => setActiveTab('magic-link')}
                            className={`flex-1 pb-3 text-sm font-medium transition-colors ${activeTab === 'magic-link'
                                ? 'text-teal-600 border-b-2 border-teal-600'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Magic Link
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Email/Password Tab */}
                    {activeTab === 'password' && (
                        <form onSubmit={handlePasswordLogin} className="space-y-4">
                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="you@example.com"
                                        className="pl-10"
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                                        Password
                                    </label>
                                    <Link
                                        to="/forgot-password"
                                        className="text-sm text-teal-600 hover:underline"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="pl-10 pr-10"
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me */}
                            <div className="flex items-center gap-2">
                                <input
                                    id="rememberMe"
                                    name="rememberMe"
                                    type="checkbox"
                                    checked={formData.rememberMe}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                                />
                                <label htmlFor="rememberMe" className="text-sm text-slate-600">
                                    Remember me for 30 days
                                </label>
                            </div>

                            {/* Submit */}
                            <Button
                                type="submit"
                                fullWidth
                                disabled={loading}
                                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Signing in...
                                    </span>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>
                    )}

                    {/* Magic Link Tab */}
                    {activeTab === 'magic-link' && (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-600 mb-4">
                                We'll send you a magic link to sign in without a password.
                            </p>
                            <Button
                                onClick={handleMagicLink}
                                fullWidth
                                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3"
                            >
                                📧 Continue with Magic Link
                            </Button>
                        </div>
                    )}

                    {/* Divider */}
                    <div className="my-6 flex items-center gap-4">
                        <div className="flex-1 border-t border-slate-200" />
                        <span className="text-sm text-slate-500">or</span>
                        <div className="flex-1 border-t border-slate-200" />
                    </div>

                    {/* Google Sign In */}
                    <Button
                        onClick={handleGoogleLogin}
                        fullWidth
                        variant="outline"
                        disabled={loading}
                        className="border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign in with Google
                    </Button>

                    {/* Register Link */}
                    <p className="mt-6 text-center text-sm text-slate-600">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-semibold text-teal-600 hover:underline">
                            Create one
                        </Link>
                    </p>
                </div>

                {/* Footer Links */}
                <div className="mt-8 text-center text-sm text-slate-500 space-x-4">
                    <Link to="/privacy" className="hover:text-teal-600">Privacy</Link>
                    <span>•</span>
                    <Link to="/terms" className="hover:text-teal-600">Terms</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
