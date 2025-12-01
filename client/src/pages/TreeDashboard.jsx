import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TreePine, Users, Calendar, Trash2 } from 'lucide-react';
import { supabase } from '../auth';
import LoadingSpinner from '../components/LoadingSpinner';
import { Button, useToast } from '../components/ui';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
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
    const [activeView, setActiveView] = useState('all');
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

            <div className="flex">
                <Sidebar activeView={activeView} onViewChange={setActiveView} />

                <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">
                                {activeView === 'all' && 'All Trees'}
                                {activeView === 'shared' && 'Shared with Me'}
                                {activeView === 'recent' && 'Recent Trees'}
                                {activeView === 'favorites' && 'Favorites'}
                                {activeView === 'archived' && 'Archived Trees'}
                            </h1>
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
                    {(activeView === 'all' || activeView === 'recent') && (
                        <>
                            {ownedTrees.length > 0 && (
                                <div className="mb-12">
                                    <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                        <TreePine className="w-5 h-5 text-teal-600" />
                                        My Trees
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {ownedTrees.map((tree) => (
                                            <div key={tree.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 overflow-hidden group">
                                                <div className="p-6">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform duration-200">
                                                            <TreePine className="w-6 h-6" />
                                                        </div>
                                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteTree(tree.id, tree.name);
                                                                }}
                                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Delete Tree"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-slate-900 mb-1">{tree.name}</h3>
                                                    <div className="flex items-center gap-4 text-sm text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            {new Date(tree.created_at).toLocaleDateString()}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Users className="w-4 h-4" />
                                                            Owner
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between items-center">
                                                    <span className="text-sm font-medium text-teal-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 cursor-pointer" onClick={() => navigate(`/tree/${tree.id}`)}>
                                                        View Tree <ChevronRight className="w-4 h-4" />
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {(activeView === 'all' || activeView === 'shared') && sharedTrees.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-600" />
                                Shared with Me
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {sharedTrees.map((tree) => (
                                    <div key={tree.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 overflow-hidden group">
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-200">
                                                    <Users className="w-6 h-6" />
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-1">{tree.name}</h3>
                                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {new Date(tree.created_at).toLocaleDateString()}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-4 h-4" />
                                                    {tree.role || 'Viewer'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between items-center">
                                            <span className="text-sm font-medium text-blue-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 cursor-pointer" onClick={() => navigate(`/tree/${tree.id}`)}>
                                                View Tree <ChevronRight className="w-4 h-4" />
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty States */}
                    {activeView === 'favorites' && (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                            <Star className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900">No favorites yet</h3>
                            <p className="text-slate-500 mt-1">Star your most important trees to see them here.</p>
                        </div>
                    )}

                    {activeView === 'archived' && (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                            <Archive className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900">No archived trees</h3>
                            <p className="text-slate-500 mt-1">Archived trees will appear here.</p>
                        </div>
                    )}
                </main>
            </div>

            {/* Create Tree Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-scaleIn">
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

            {/* Account Settings Modal */}
            {showSettings && (
                <AccountSettings
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                    user={user}
                />
            )}
        </div>
    );
};

export default TreeDashboard;
