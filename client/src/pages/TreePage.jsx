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
import ViewModeSelector from '../components/ViewModeSelector';
import FanChart from '../components/visualizations/FanChart';
import DescendantChart from '../components/visualizations/DescendantChart';
import TimelineView from '../components/visualizations/EventChartView';
import { Share2, Settings } from 'lucide-react';
import { Button } from '../components/ui';
import { supabase } from '../auth';

const TreePage = () => {
    const { id } = useParams();
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [persons, setPersons] = useState([]);
    const [relationships, setRelationships] = useState([]);
    const [lifeEvents, setLifeEvents] = useState([]);
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

    // View mode state with localStorage persistence - default to 'standard'
    const [viewMode, setViewMode] = useState(() => {
        const saved = localStorage.getItem(`viewMode_${id}`);
        return saved || 'standard';
    });

    // Persist view mode changes
    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        localStorage.setItem(`viewMode_${id}`, mode);
    };

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

            const { persons: treePersons, relationships: treeRelationships, name, role } = await response.json();
            setPersons(treePersons);
            setRelationships(treeRelationships || []);
            setTreeName(name);
            setUserRole(role);

            // Fetch life events for timeline view
            try {
                const eventsResponse = await fetch(`/api/tree/${id}/events`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (eventsResponse.ok) {
                    const events = await eventsResponse.json();
                    setLifeEvents(events);
                }
            } catch (err) {
                console.error('Error loading life events:', err);
                setLifeEvents([]);
            }
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
                    <div className="flex items-center gap-2">
                        <TreeSwitcher currentTreeId={id} />
                        {selectedPerson && (
                            <>
                                <span className="text-slate-300">/</span>
                                <Breadcrumbs
                                    inline
                                    showHome={false}
                                    items={[
                                        { label: selectedPerson.data.label }
                                    ]}
                                />
                            </>
                        )}
                    </div>
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
                            onClick={() => window.location.href = `/tree/${id}/gallery`}
                            className="p-2"
                            title="View Photo Gallery"
                        >
                            <span className="text-xl">🖼️</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.location.href = `/tree/${id}/albums`}
                            className="p-2"
                            title="View Albums"
                        >
                            <span className="text-xl">📚</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.location.href = `/tree/${id}/timeline`}
                            className="p-2"
                            title="View Timeline"
                        >
                            <span className="text-xl">📅</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.location.href = `/tree/${id}/map`}
                            className="p-2"
                            title="View Map"
                        >
                            <span className="text-xl">🗺️</span>
                        </Button>
                    </>
                }
            />

            {/* View Mode Selector */}
            < div className="bg-white border-b border-slate-200">
                <div className="max-w-[1600px] mx-auto px-4 py-3">
                    <ViewModeSelector viewMode={viewMode} onChange={handleViewModeChange} />
                </div>
            </div>

            {/* Search Bar - Conditionally Rendered */}
            {
                isSearchOpen && (
                    <div className="absolute top-28 left-4 z-30 w-full max-w-md animate-slideIn">
                        <SearchBar
                            persons={persons}
                            onHighlight={setHighlightedNodes}
                            onClear={() => setHighlightedNodes([])}
                            onClose={() => setIsSearchOpen(false)}
                        />
                    </div>
                )
            }

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Tree Visualizer - Conditional Rendering based on ViewMode */}
                <div className="flex-1 relative">
                    {viewMode === 'standard' && (
                        <TreeVisualizer
                            treeId={id}
                            onNodeClick={handleNodeClick}
                            highlightedNodes={highlightedNodes}
                            key={refreshTrigger}
                            userRole={userRole}
                            onSearchToggle={() => setIsSearchOpen(!isSearchOpen)}
                            isSearchOpen={isSearchOpen}
                        />
                    )}
                    {viewMode === 'fan' && (
                        <FanChart
                            persons={persons}
                            relationships={relationships}
                            centerPersonId={selectedPerson?.data?.id || (persons[0]?.id)}
                            onPersonClick={handleNodeClick}
                        />
                    )}
                    {viewMode === 'descendant' && (
                        <DescendantChart
                            persons={persons}
                            relationships={relationships}
                            rootPersonId={selectedPerson?.data?.id || (persons[0]?.id)}
                            onNodeClick={handleNodeClick}
                        />
                    )}
                    {viewMode === 'timeline' && (
                        <TimelineView
                            persons={persons}
                            relationships={relationships}
                            lifeEvents={lifeEvents}
                            onEventClick={handleNodeClick}
                        />
                    )}
                </div>

                {/* ... (SidePanel) */}

                {/* Side Panel */}
                {selectedPerson && (
                    <div className="fixed md:relative inset-0 md:inset-auto md:w-96 md:border-l bg-white shadow-xl z-50 md:z-0 md:shrink-0 overflow-y-auto">
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
