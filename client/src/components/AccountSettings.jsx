import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, LogOut } from 'lucide-react';
import { signOut, supabase } from '../auth';
import { useNavigate } from 'react-router-dom';

const AccountSettings = ({ user, onClose }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);
    const navigate = useNavigate();

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') {
            window.addToast?.('Please type DELETE to confirm', 'error');
            return;
        }

        setDeleting(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch('/api/account', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                window.addToast?.('Account deleted successfully', 'success');
                await signOut();
                navigate('/');
            } else {
                const error = await response.json();
                window.addToast?.(error.error || 'Failed to delete account', 'error');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            window.addToast?.('Failed to delete account', 'error');
        } finally {
            setDeleting(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Account Settings</h2>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        {/* User Info */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Account Information</h3>
                            <p className="text-sm text-gray-600">
                                <strong>Email:</strong> {user?.email}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                                <strong>Provider:</strong> Google
                            </p>
                        </div>

                        {/* Sign Out */}
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold mb-4"
                        >
                            <LogOut className="w-5 h-5" />
                            Sign Out
                        </button>

                        {/* Delete Account Section */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-red-600 mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                Danger Zone
                            </h3>

                            {!showDeleteConfirm ? (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-semibold border border-red-200"
                                >
                                    <Trash2 className="w-5 h-5" />
                                    Delete Account
                                </button>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <h4 className="font-semibold text-red-800 mb-2">⚠️ This action is permanent!</h4>
                                        <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                                            <li>All your family trees will be deleted</li>
                                            <li>All persons and relationships will be removed</li>
                                            <li>All uploaded photos will be deleted</li>
                                            <li>This action cannot be undone</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Type <strong>DELETE</strong> to confirm:
                                        </label>
                                        <input
                                            type="text"
                                            value={deleteConfirmText}
                                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                                            placeholder="DELETE"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setShowDeleteConfirm(false);
                                                setDeleteConfirmText('');
                                            }}
                                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleDeleteAccount}
                                            disabled={deleteConfirmText !== 'DELETE' || deleting}
                                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {deleting ? 'Deleting...' : 'Delete Forever'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AccountSettings;
