import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import TreeVisualizer from '../components/TreeVisualizer';
import SidePanel from '../components/SidePanel';
import SearchBar from '../components/SearchBar';
import TreeSwitcher from '../components/TreeSwitcher';
import ShareModal from '../components/ShareModal';
import AccountSettings from '../components/AccountSettings';
import PhotoPicker from '../components/PhotoPicker';
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
            const response = await fetch(`/api/tree/${id}`, {
                credentials: 'include',
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
        <div className="flex flex-col h-screen relative overflow-hidden">
            <header className="bg-white shadow p-4 z-10 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-teal-800 hidden md:block">Roots & Branches</h1>
                    <TreeSwitcher currentTreeId={id} />
                </div>
                <div className="flex items-center gap-2">
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
                        onClick={() => setShowSettings(true)}
                        className="p-2"
                    >
                        <Settings className="w-5 h-5" />
                    </Button>
                </div>
            </header>

            {/* Share Modal */}
            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                treeId={id}
                treeName={treeName}
                currentUserRole={userRole}
            />
            <SearchBar
                persons={persons}
                onHighlight={setHighlightedNodes}
                onClear={() => setHighlightedNodes([])}
            />
            <div className="flex-grow relative overflow-hidden">
                <TreeVisualizer
                    treeId={id}
                    onNodeClick={handleNodeClick}
                    highlightedNodes={highlightedNodes}
                    key={refreshTrigger}
                    userRole={userRole}
                />
            </div>

            {selectedPerson && (
                <div className="w-full md:w-96 border-l bg-white shadow-xl z-20 h-full shrink-0 transition-all duration-300">
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


            {
                showSettings && user && (
                    <AccountSettings
                        user={user}
                        onClose={() => setShowSettings(false)}
                    />
                )
            }
        </div >
    );
};

export default TreePage;
