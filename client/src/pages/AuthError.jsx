import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, RefreshCw, LogIn } from 'lucide-react';
import { signInWithGoogle } from '../auth';

const AuthError = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const reason = searchParams.get('reason') || 'unknown';

    const errorMessages = {
        session_expired: {
            title: 'Session Expired',
            message: 'Your session has expired. Please sign in again to continue.',
            icon: <AlertCircle className="w-16 h-16 text-yellow-500" />
        },
        token_invalid: {
            title: 'Invalid Token',
            message: 'Your authentication token is invalid. Please sign in again.',
            icon: <AlertCircle className="w-16 h-16 text-red-500" />
        },
        oauth_revoked: {
            title: 'Access Revoked',
            message: 'Your Google account access has been revoked. Please sign in again to restore access.',
            icon: <AlertCircle className="w-16 h-16 text-red-500" />
        },
        unauthorized: {
            title: 'Unauthorized',
            message: 'You are not authorized to access this resource. Please sign in.',
            icon: <AlertCircle className="w-16 h-16 text-red-500" />
        },
        unknown: {
            title: 'Authentication Error',
            message: 'An unexpected authentication error occurred. Please try signing in again.',
            icon: <AlertCircle className="w-16 h-16 text-gray-500" />
        }
    };

    const error = errorMessages[reason] || errorMessages.unknown;

    const handleSignIn = async () => {
        await signInWithGoogle();
    };

    const handleGoHome = () => {
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
                <div className="flex flex-col items-center text-center">
                    {error.icon}

                    <h1 className="text-2xl font-bold text-gray-800 mt-6 mb-2">
                        {error.title}
                    </h1>

                    <p className="text-gray-600 mb-8">
                        {error.message}
                    </p>

                    <div className="flex flex-col gap-3 w-full">
                        <button
                            onClick={handleSignIn}
                            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-teal-600 text-white rounded-lg shadow hover:bg-teal-700 transition font-semibold"
                        >
                            <LogIn className="w-5 h-5" />
                            Sign In with Google
                        </button>

                        <button
                            onClick={handleGoHome}
                            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Go to Home
                        </button>
                    </div>

                    {reason === 'session_expired' && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-800">
                                <strong>Tip:</strong> Your sessions are automatically saved and will stay active for 7 days.
                                You can close your browser and come back anytime!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthError;
