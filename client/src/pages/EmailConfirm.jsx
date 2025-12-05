import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Mail } from 'lucide-react';
import { Button } from '../components/ui';

/**
 * Email verification landing page after clicking link from email
 */
const EmailConfirm = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Check if URL has verification params
        const params = new URLSearchParams(location.search);
        const type = params.get('type');

        if (type === 'signup' || type === 'recovery') {
            // Supabase automatically handles token verification
            // After a short delay, redirect to trees dashboard
            const timer = setTimeout(() => {
                navigate('/trees');
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [location, navigate]);

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
                        Email Verified!
                    </h1>

                    {/* Message */}
                    <p className="text-slate-600 mb-6">
                        Your email has been successfully confirmed. Setting up your account...
                    </p>

                    {/* Loading indicator */}
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                        <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                        <span>Redirecting to your dashboard</span>
                    </div>

                    {/* Manual Continue */}
                    <div className="mt-8">
                        <Button
                            onClick={() => navigate('/trees')}
                            fullWidth
                            className="bg-teal-600 hover:bg-teal-700"
                        >
                            Continue to Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailConfirm;
