import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TreePine, Users, Calendar, Trash2, ChevronRight, Star, Archive, Search, TreeDeciduous, Activity, Settings, LogOut, Menu, X, Bell } from 'lucide-react';
import { supabase } from '../auth';
import LoadingSpinner from '../components/LoadingSpinner';
import { Button, useToast } from '../components/ui';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import AccountSettings from '../components/AccountSettings';
import EventsWidget from '../components/dashboard/EventsWidget';

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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

    const allTrees = [...ownedTrees, ...sharedTrees];
    const filteredTrees = activeView === 'all' ? allTrees :
        activeView === 'owned' ? ownedTrees :
            activeView === 'shared' ? sharedTrees :
                []; // Add logic for recent, favorites, archived if needed

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar
                user={user}
                onOpenSettings={() => setShowSettings(true)}
                leftContent={
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label="Open menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                }
            />

            <div className="max-w-[1600px] mx-auto flex items-start">
                <Sidebar
                    activeView={activeView}
                    onViewChange={setActiveView}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    className="shrink-0 pl-4"
                />

                <main className="flex-1 min-w-0 py-8 pl-8 pr-4 animate-fadeIn">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">
                                {activeView === 'all' && 'All Trees'}
                                {activeView === 'owned' && 'My Trees'}
                                {activeView === 'shared' && 'Shared with Me'}
                                {activeView === 'recent' && 'Recent Trees'}
                                {activeView === 'favorites' && 'Favorites'}
                                {activeView === 'archived' && 'Archived Trees'}
                            </h1>
                            <p className="text-slate-600 mt-1">Manage and explore your family history</p>
                        </div>

                        {/* Create New Tree Button - Moved to inside the grid for consistency with snippet */}
                        {/* <Button
                            variant="primary"
                            leftIcon={<Plus className="w-5 h-5" />}
                            onClick={() => setShowCreateModal(true)}
                        >
                            Create New Tree
                        </Button> */}
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Trees */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-slate-800">Your Family Trees</h2>
                                <Button
                                    variant="primary"
                                    leftIcon={<Plus className="w-4 h-4" />}
                                    onClick={() => setShowCreateModal(true)}
                                >
                                    New Tree
                                </Button>
                            </div>

                            {/* Tree List */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredTrees.length > 0 ? (
                                    filteredTrees.map((tree) => (
                                        <div
                                            key={tree.id}
                                            onClick={() => navigate(`/tree/${tree.id}`)}
                                            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-teal-200 transition-all cursor-pointer group"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-3 bg-teal-50 rounded-lg group-hover:bg-teal-100 transition-colors">
                                                    <TreeDeciduous className="w-6 h-6 text-teal-600" />
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-teal-700 transition-colors">
                                                {tree.name}
                                            </h3>
                                            <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                                                {tree.description || 'No description'}
                                            </p>
                                            <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-50">
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    <span>{tree.member_count || 1} members</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span>Updated {new Date(tree.updated_at).toLocaleDateString()}</span>
                                                    <ChevronRight className="w-3 h-3" />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full bg-slate-50 rounded-xl p-8 text-center border-2 border-dashed border-slate-200">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                            <TreeDeciduous className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <h3 className="text-slate-900 font-medium mb-1">No trees yet</h3>
                                        <p className="text-slate-500 text-sm mb-4">Create your first family tree to get started</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowCreateModal(true)}
                                        >
                                            Create Tree
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Activity & Events */}
                        <div className="space-y-6">
                            {/* Events Widget */}
                            <EventsWidget />

                            {/* Activity Feed */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-teal-600" />
                                        Recent Activity
                                    </h3>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {/* Placeholder Activity Items */}
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="p-4 hover:bg-slate-50 transition-colors">
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">
                                                    JD
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-600">
                                                        <span className="font-semibold text-slate-900">John Doe</span> added a new photo to <span className="font-medium text-teal-600">Smith Family Tree</span>
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-1">2 hours ago</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

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
