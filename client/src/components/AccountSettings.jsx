import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, LogOut, User, TreeDeciduous, Edit2, Star, Archive, MoreVertical, Check, X } from 'lucide-react';
import { signOut, supabase } from '../auth';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Input, useToast } from './ui';

const AccountSettings = ({ user, onClose, returnLabel = '' }) => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');

    // Account State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);

    // Tree State
    const [trees, setTrees] = useState([]);
    const [loadingTrees, setLoadingTrees] = useState(false);
    const [editingTreeId, setEditingTreeId] = useState(null);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        if (activeTab === 'trees') {
            fetchTrees();
        }
    }, [activeTab]);

    const fetchTrees = async () => {
        setLoadingTrees(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const response = await fetch('/api/trees', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const allTrees = [...(data.ownedTrees || []), ...(data.sharedTrees || [])];
                // Sort by updated_at desc
                allTrees.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
                setTrees(allTrees);
            }
        } catch (error) {
            console.error('Error fetching trees:', error);
            toast.error('Failed to load trees');
        } finally {
            setLoadingTrees(false);
        }
    };

    const handleRenameTree = async (treeId) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const response = await fetch(`/api/tree/${treeId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: editName })
            });

            if (response.ok) {
                toast.success('Tree renamed');
                setEditingTreeId(null);
                fetchTrees();
            } else {
                toast.error('Failed to rename tree');
            }
        } catch (error) {
            toast.error('Failed to rename tree');
        }
    };

    const handleToggleFavorite = async (treeId, currentStatus) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const response = await fetch(`/api/tree/${treeId}/favorite`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ is_favorite: !currentStatus })
            });

            if (response.ok) {
                toast.success(currentStatus ? 'Removed from favorites' : 'Added to favorites');
                fetchTrees();
            }
        } catch (error) {
            toast.error('Failed to update favorite status');
        }
    };

    const handleToggleArchive = async (treeId, currentStatus) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const response = await fetch(`/api/tree/${treeId}/archive`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ is_archived: !currentStatus })
            });

            if (response.ok) {
                toast.success(currentStatus ? 'Unarchived tree' : 'Archived tree');
                fetchTrees();
            }
        } catch (error) {
            toast.error('Failed to update archive status');
        }
    };

    const handleDeleteTree = async (treeId, treeName) => {
        if (!window.confirm(`Are you sure you want to delete "${treeName}"? This action cannot be undone.`)) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const response = await fetch(`/api/tree/${treeId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                toast.success('Tree deleted');
                fetchTrees();
            } else {
                toast.error('Failed to delete tree');
            }
        } catch (error) {
            toast.error('Failed to delete tree');
        }
    };

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
            size="lg"
        >
            <div className="flex border-b border-slate-200 mb-6">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'profile'
                        ? 'border-teal-600 text-teal-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Profile
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('trees')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'trees'
                        ? 'border-teal-600 text-teal-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <TreeDeciduous className="w-4 h-4" />
                        My Trees
                    </div>
                </button>
            </div>

            {activeTab === 'profile' && (
                <div className="space-y-6 animate-fadeIn">
                    {/* User Info */}
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Account Information</h3>
                        <div className="space-y-2">
                            <p className="text-sm text-slate-600 flex items-center gap-3">
                                <span className="font-medium">Email:</span>
                                <span>{user?.email}</span>
                            </p>
                            <p className="text-sm text-slate-600 flex items-center gap-3">
                                <span className="font-medium">Provider:</span>
                                <span>Google</span>
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="secondary"
                        fullWidth
                        onClick={handleSignOut}
                        leftIcon={<LogOut className="w-4 h-4" />}
                    >
                        Sign Out
                    </Button>

                    {/* Link to Full Account Settings */}
                    <div className="border-t border-slate-200 pt-6">
                        <Button
                            variant="outline"
                            fullWidth
                            onClick={() => {
                                onClose();
                                navigate('/settings');
                            }}
                            leftIcon={<User className="w-4 h-4" />}
                        >
                            Open Full Account Settings
                        </Button>
                        <p className="text-xs text-slate-500 mt-2 text-center">
                            Access profile settings, integrations, and account management
                        </p>
                    </div>
                </div>
            )}

            {activeTab === 'trees' && (
                <div className="space-y-4 animate-fadeIn">
                    <div className="rounded-lg border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-700 font-medium">
                                <tr>
                                    <th className="p-3">Tree Name</th>
                                    <th className="p-3 w-32">Role</th>
                                    <th className="p-3 w-40 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loadingTrees ? (
                                    <tr>
                                        <td colSpan="3" className="p-8 text-center text-slate-500">
                                            Loading trees...
                                        </td>
                                    </tr>
                                ) : trees.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="p-8 text-center text-slate-500">
                                            No trees found.
                                        </td>
                                    </tr>
                                ) : (
                                    trees.map(tree => (
                                        <tr key={tree.id} className="hover:bg-slate-50">
                                            <td className="p-3">
                                                {editingTreeId === tree.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            value={editName}
                                                            onChange={e => setEditName(e.target.value)}
                                                            className="h-8 text-sm"
                                                            autoFocus
                                                        />
                                                        <button onClick={() => handleRenameTree(tree.id)} className="text-teal-600 hover:text-teal-700"><Check className="w-4 h-4" /></button>
                                                        <button onClick={() => setEditingTreeId(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className={tree.is_archived ? 'text-slate-400 line-through' : 'text-slate-900'}>{tree.name}</span>
                                                        {tree.is_favorite && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                                                        {tree.is_archived && <Archive className="w-3 h-3 text-slate-400" />}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-3 text-slate-500 capitalize">{tree.memberRole || 'Owner'}</td>
                                            <td className="p-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => handleToggleFavorite(tree.id, tree.is_favorite)}
                                                        className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${tree.is_favorite ? 'text-amber-400' : 'text-slate-400 hover:text-amber-500'}`}
                                                        title="Toggle Favorite"
                                                    >
                                                        <Star className={`w-4 h-4 ${tree.is_favorite ? 'fill-amber-400' : ''}`} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleArchive(tree.id, tree.is_archived)}
                                                        className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${tree.is_archived ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'}`}
                                                        title="Toggle Archive"
                                                    >
                                                        <Archive className="w-4 h-4" />
                                                    </button>
                                                    {(tree.memberRole === 'owner' || !tree.memberRole) && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingTreeId(tree.id);
                                                                    setEditName(tree.name);
                                                                }}
                                                                className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-teal-600 transition-colors"
                                                                title="Rename"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteTree(tree.id, tree.name)}
                                                                className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-red-600 transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default AccountSettings;
