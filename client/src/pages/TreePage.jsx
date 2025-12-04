import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import TreeVisualizer from '../components/TreeVisualizer';
import SidePanel from '../components/SidePanel';
import SearchBar from '../components/SearchBar';
import TreeSwitcher from '../components/TreeSwitcher';
import ShareModal from '../components/ShareModal';
import AccountSettings from '../components/AccountSettings';
import PhotoPicker from '../components/PhotoPicker';
import Breadcrumbs from '../components/Breadcrumbs';
import Navbar from '../components/Navbar';
import { Share2, Settings } from 'lucide-react';
import { Button } from '../components/ui';
import { supabase } from '../auth';

const TreePage = () => {
    const { id } = useParams();
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [persons, setPersons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [highlightedNodes, setHighlightedNodes] = useState([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [treeName, setTreeName] = useState('');
    const [userRole, setUserRole] = useState('viewer');
    const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);
    const [photoSelectHandler, setPhotoSelectHandler] = useState(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        loadTreeData();
        fetchUser();
    }, [id]);

    const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
    };

    const loadTreeData = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`/api/tree/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to load tree');

            const { persons: treePersons, name, role } = await response.json();
            setPersons(treePersons);
            setTreeName(name);
            setUserRole(role);
        } catch (error) {
            console.error('Error loading tree:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNodeClick = (event, node) => {
        setSelectedPerson(node);
    };

    const handleClosePanel = () => {
        setSelectedPerson(null);
    };

    const handleUpdate = () => {
        setRefreshTrigger((prev) => prev + 1);
        loadTreeData();
    };

    if (loading) return <div>Loading tree...</div>;

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-teal-50 to-blue-50">
            {/* Navbar */}
            <Navbar
                user={user}
                onOpenSettings={() => setShowSettings(true)}
                leftContent={
                    <TreeSwitcher currentTreeId={id} />
                }
                rightContent={
                    <>
                        {userRole === 'owner' && (
                            <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<Share2 className="w-4 h-4" />}
                                onClick={() => setIsShareModalOpen(true)}
                            >
                                <span className="hidden sm:inline">Share</span>
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.location.href = `/tree/${id}/timeline`}
                            className="p-2"
                            title="View Timeline"
                        >
                            <span className="text-xl">📅</span>
                        </Button>
                    </>
                }
            />

            {/* Breadcrumbs */}
            <Breadcrumbs
                items={[
                    {
                        label: treeName,
                        onClick: () => setSelectedPerson(null) // Close panel when clicking tree name
                    },
                    ...(selectedPerson ? [{ label: selectedPerson.data.label }] : [])
                ]}
            />

            {/* Search Bar - Conditionally Rendered */}
            {isSearchOpen && (
                <div className="absolute top-28 left-4 z-30 w-full max-w-md animate-slideIn">
                    <SearchBar
                        persons={persons}
                        onHighlight={setHighlightedNodes}
                        onClear={() => setHighlightedNodes([])}
                        onClose={() => setIsSearchOpen(false)}
                    />
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Tree Visualizer */}
                <div className="flex-1 relative">
                    <TreeVisualizer
                        treeId={id}
                        onNodeClick={handleNodeClick}
                        highlightedNodes={highlightedNodes}
                        key={refreshTrigger}
                        userRole={userRole}
                        onSearchToggle={() => setIsSearchOpen(!isSearchOpen)}
                        isSearchOpen={isSearchOpen}
                    />
                </div>

                {/* ... (SidePanel) */}

                {/* Side Panel */}
                {selectedPerson && (
                    <div className="fixed md:relative inset-0 md:inset-auto md:w-96 md:border-l bg-white shadow-xl z-50 md:shrink-0 overflow-y-auto">
                        <SidePanel
                            person={selectedPerson}
                            onClose={handleClosePanel}
                            onUpdate={handleUpdate}
                            onOpenPhotoPicker={(handler) => {
                                setPhotoSelectHandler(() => handler);
                                setIsPhotoPickerOpen(true);
                            }}
                            userRole={userRole}
                        />
                    </div>
                )}
            </div>

            {/* Modals */}
            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                treeId={id}
                treeName={treeName}
                currentUserRole={userRole}
            />

            <PhotoPicker
                isOpen={isPhotoPickerOpen}
                onClose={() => setIsPhotoPickerOpen(false)}
                onSelect={(photo) => {
                    if (photoSelectHandler) {
                        photoSelectHandler(photo);
                    }
                    setIsPhotoPickerOpen(false);
                }}
            />

            {showSettings && user && (
                <AccountSettings
                    user={user}
                    onClose={() => setShowSettings(false)}
                />
            )}
        </div>
    );
};

export default TreePage;
