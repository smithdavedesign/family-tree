import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui';
import { supabase } from '../auth';

/**
 * Page shown after registration
 * Tells user to check email for verification link
 */
const VerifyEmail = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email || '';
    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState(false);

    const handleResend = async () => {
        if (!email) return;

        try {
            setResending(true);
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email,
            });

            if (error) throw error;

            setResent(true);
            setTimeout(() => setResent(false), 5000); // Clear message after 5s
        } catch (err) {
            console.error('Error resending email:', err);
            alert('Failed to resend verification email. Please try again.');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-purple-50 px-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                    {/* Mail Icon */}
                    <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Mail className="w-10 h-10 text-teal-600" />
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">
                        Check Your Email
                    </h1>

                    {/* Message */}
                    <p className="text-slate-600 mb-4">
                        We've sent a verification link to:
                    </p>
                    <p className="text-teal-600 font-semibold mb-6">
                        {email}
                    </p>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                        <p className="text-sm text-blue-900 font-medium mb-2">Next steps:</p>
                        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                            <li>Check your inbox (and spam folder)</li>
                            <li>Click the verification link in the email</li>
                            <li>You'll be redirected back to complete setup</li>
                        </ol>
                    </div>

                    {/* Resend Button */}
                    {resent ? (
                        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                            ✓ Verification email sent! Check your inbox.
                        </div>
                    ) : (
                        <p className="text-sm text-slate-600 mb-6">
                            Didn't receive the email?{' '}
                            <button
                                onClick={handleResend}
                                disabled={resending || !email}
                                className="text-teal-600 hover:underline font-medium disabled:opacity-50"
                            >
                                {resending ? 'Sending...' : 'Resend verification email'}
                            </button>
                        </p>
                    )}

                    {/* Back to Sign In */}
                    <Button
                        onClick={() => navigate('/login')}
                        variant="outline"
                        fullWidth
                        className="flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Sign In
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
