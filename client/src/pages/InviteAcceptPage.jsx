import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../auth';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const InviteAcceptPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('Verifying invitation...');
    const [inviteDetails, setInviteDetails] = useState(null);

    useEffect(() => {
        verifyAndAccept();
    }, [token]);

    const verifyAndAccept = async () => {
        try {
            // 1. Check authentication
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                // Redirect to login with return URL
                // We'll store the invite token in localStorage to handle after login
                localStorage.setItem('pendingInviteToken', token);
                navigate(`/?redirect=/invite/${token}`);
                return;
            }

            // 2. Fetch invitation details first (public endpoint)
            const detailsResponse = await fetch(`/api/invite/${token}`);
            if (!detailsResponse.ok) {
                const err = await detailsResponse.json();
                throw new Error(err.error || 'Invalid invitation');
            }

            const { invitation } = await detailsResponse.json();
            setInviteDetails(invitation);

            // 3. Accept invitation
            const acceptResponse = await fetch(`/api/invite/${token}/accept`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            });

            if (!acceptResponse.ok) {
                const err = await acceptResponse.json();
                // Handle "already a member" as a success case visually but with different message
                if (err.error === 'You are already a member of this tree') {
                    setStatus('success');
                    setMessage('You are already a member of this tree!');
                    // Use the invitation's tree_id since we couldn't get it from the response
                    setTimeout(() => navigate(`/tree/${invitation.tree_id}`), 2500);
                    return;
                }
                throw new Error(err.error || 'Failed to accept invitation');
            }

            const data = await acceptResponse.json();
            setStatus('success');
            setMessage('Invitation accepted successfully!');

            // Redirect to tree after delay (increased to ensure DB write completes)
            setTimeout(() => navigate(`/tree/${data.treeId}`), 2500);

        } catch (error) {
            console.error("Invite error:", error);
            setStatus('error');
            setMessage(error.message);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <Loader className="w-12 h-12 text-teal-600 animate-spin mb-4" />
                        <h2 className="text-xl font-semibold text-gray-800">Processing Invitation</h2>
                        <p className="text-gray-600 mt-2">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Welcome Aboard!</h2>
                        <p className="text-gray-600 mt-2">{message}</p>
                        {inviteDetails && (
                            <p className="text-sm text-gray-500 mt-4">
                                Joining tree: <strong>{inviteDetails.trees?.name}</strong>
                            </p>
                        )}
                        <p className="text-sm text-gray-400 mt-6">Redirecting you to the tree...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <XCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Invitation Failed</h2>
                        <p className="text-red-600 mt-2">{message}</p>
                        <button
                            onClick={() => navigate('/')}
                            className="mt-6 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                        >
                            Go Home
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InviteAcceptPage;
