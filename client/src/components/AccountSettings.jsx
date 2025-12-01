import React, { useState } from 'react';
import { Trash2, AlertTriangle, LogOut } from 'lucide-react';
import { signOut, supabase } from '../auth';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Input, useToast } from './ui';

const AccountSettings = ({ user, onClose }) => {
    const { toast } = useToast();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);
    const navigate = useNavigate();

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') {
            toast.error('Please type DELETE to confirm');
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
                toast.success('Account deleted successfully');
                await signOut();
                navigate('/');
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to delete account');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            toast.error('Failed to delete account');
        } finally {
            setDeleting(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Account Settings"
            size="md"
        >
            <div className="space-y-6">
                {/* User Info */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Account Information</h3>
                    <div className="space-y-2">
                        <p className="text-sm text-slate-600 flex justify-between">
                            <span className="font-medium">Email:</span>
                            <span>{user?.email}</span>
                        </p>
                        <p className="text-sm text-slate-600 flex justify-between">
                            <span className="font-medium">Provider:</span>
                            <span>Google</span>
                        </p>
                    </div>
                </div>

                {/* Sign Out */}
                <Button
                    variant="secondary"
                    fullWidth
                    onClick={handleSignOut}
                    leftIcon={<LogOut className="w-4 h-4" />}
                >
                    Sign Out
                </Button>

                {/* Delete Account Section */}
                <div className="border-t border-slate-200 pt-6">
                    <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Danger Zone
                    </h3>

                    {!showDeleteConfirm ? (
                        <Button
                            variant="danger"
                            fullWidth
                            onClick={() => setShowDeleteConfirm(true)}
                            leftIcon={<Trash2 className="w-4 h-4" />}
                            className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                        >
                            Delete Account
                        </Button>
                    ) : (
                        <div className="space-y-4 animate-fadeIn">
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <h4 className="font-bold text-red-800 mb-2 text-sm">⚠️ This action is permanent!</h4>
                                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                                    <li>All your family trees will be deleted</li>
                                    <li>All persons and relationships will be removed</li>
                                    <li>All uploaded photos will be deleted</li>
                                    <li>This action cannot be undone</li>
                                </ul>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Type <strong>DELETE</strong> to confirm:
                                </label>
                                <Input
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder="DELETE"
                                    className="border-red-300 focus:ring-red-500"
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setDeleteConfirmText('');
                                    }}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={handleDeleteAccount}
                                    disabled={deleteConfirmText !== 'DELETE' || deleting}
                                    loading={deleting}
                                    className="flex-1"
                                >
                                    Delete Forever
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default AccountSettings;
