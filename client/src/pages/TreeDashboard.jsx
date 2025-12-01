import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TreePine, Users, Calendar, Trash2 } from 'lucide-react';
import { supabase } from '../auth';
import LoadingSpinner from '../components/LoadingSpinner';
import { Button, useToast } from '../components/ui';
import Navbar from '../components/Navbar';
import AccountSettings from '../components/AccountSettings';

const TreeDashboard = (props) => {
    const [user, setUser] = useState(props.user || null);
    const [ownedTrees, setOwnedTrees] = useState([]);
    const [sharedTrees, setSharedTrees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newTreeName, setNewTreeName] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        if (!user) {
            fetchUser();
        }
        fetchTrees();
    }, []);

    const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
    };

    const fetchTrees = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch('/api/trees', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                // Handle both old format (array) and new format (object with ownedTrees/sharedTrees)
                if (Array.isArray(data)) {
                    setOwnedTrees(data);
                    setSharedTrees([]);
                } else {
                    setOwnedTrees(data.ownedTrees || []);
                    setSharedTrees(data.sharedTrees || []);
                }
            }
        } catch (error) {
            console.error('Error fetching trees:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTree = async () => {
        if (!newTreeName.trim()) {
            toast.error('Please enter a tree name');
            return;
        }

        setCreating(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch('/api/trees', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: newTreeName })
            });

            if (response.ok) {
                const newTree = await response.json();
                toast.success('Tree created successfully!');
                navigate(`/tree/${newTree.id}`);
            } else {
                toast.error('Failed to create tree');
            }
        } catch (error) {
            console.error('Error creating tree:', error);
            toast.error('Failed to create tree');
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteTree = async (treeId, treeName) => {
        if (!window.confirm(`Are you sure you want to delete "${treeName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`/api/tree/${treeId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                toast.success('Tree deleted successfully');
                fetchTrees();
            } else {
                toast.error('Failed to delete tree');
            }
        } catch (error) {
            console.error('Error deleting tree:', error);
            toast.error('Failed to delete tree');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center">
                <LoadingSpinner size="lg" message="Loading your trees..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar
                user={user}
                onOpenSettings={() => setShowSettings(true)}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">My Family Trees</h1>
                        <p className="text-slate-600 mt-1">Manage and explore your family history</p>
                    </div>

                    {/* Create New Tree Button */}
                    <Button
                        variant="primary"
                        leftIcon={<Plus className="w-5 h-5" />}
                        onClick={() => setShowCreateModal(true)}
                    >
                        Create New Tree
                    </Button>
                </div>

                {/* Trees Grid */}
                {ownedTrees.length === 0 && sharedTrees.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-lg shadow">
                        <TreePine className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No trees yet</h3>
                        <p className="text-gray-500 mb-6">Create your first family tree to get started</p>
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => setShowCreateModal(true)}
                        >
                            Create Your First Tree
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* My Trees Section */}
                        {ownedTrees.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <TreePine className="w-6 h-6 text-teal-600" />
                                    My Trees
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {ownedTrees.map(tree => (
                                        <div
                                            key={tree.id}
                                            className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 cursor-pointer group"
                                            onClick={() => navigate(`/tree/${tree.id}`)}
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-3 bg-teal-100 rounded-lg">
                                                        <TreePine className="w-6 h-6 text-teal-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-800 group-hover:text-teal-600 transition">
                                                            {tree.name}
                                                        </h3>
                                                        <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full font-medium">Owner</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteTree(tree.id, tree.name);
                                                    }}
                                                    className="p-2 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                                                    title="Delete tree"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </button>
                                            </div>

                                            <div className="space-y-2 text-sm text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>Created {new Date(tree.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-4 border-t">
                                                <button className="text-teal-600 font-semibold hover:text-teal-700 transition">
                                                    Open Tree →
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Shared Trees Section */}
                        {sharedTrees.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Users className="w-6 h-6 text-blue-600" />
                                    Shared With Me
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {sharedTrees.map(tree => (
                                        <div
                                            key={tree.id}
                                            className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 cursor-pointer group"
                                            onClick={() => navigate(`/tree/${tree.id}`)}
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-3 bg-blue-100 rounded-lg">
                                                        <Users className="w-6 h-6 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition">
                                                            {tree.name}
                                                        </h3>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${tree.memberRole === 'editor'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {tree.memberRole}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2 text-sm text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>Created {new Date(tree.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-4 border-t">
                                                <button className="text-blue-600 font-semibold hover:text-blue-700 transition">
                                                    Open Tree →
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Create Tree Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Create New Tree</h2>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tree Name
                                </label>
                                <input
                                    type="text"
                                    value={newTreeName}
                                    onChange={(e) => setNewTreeName(e.target.value)}
                                    placeholder="e.g., Smith Family Tree"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    autoFocus
                                    onKeyPress={(e) => e.key === 'Enter' && handleCreateTree()}
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="ghost"
                                    fullWidth
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setNewTreeName('');
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    fullWidth
                                    onClick={handleCreateTree}
                                    disabled={creating || !newTreeName.trim()}
                                    loading={creating}
                                >
                                    Create Tree
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TreeDashboard;
