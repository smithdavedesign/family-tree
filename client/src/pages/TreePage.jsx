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
import { Share2, Settings, Image, Book, Calendar as CalendarIcon, Map as MapIcon, Menu, X as CloseIcon } from 'lucide-react';
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
    const [isEditMode, setIsEditMode] = useState(false);
    const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
    const [isZenMode, setIsZenMode] = useState(false);
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

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
        setIsSidePanelOpen(true);
    };

    const handleClosePanel = () => {
        setIsSidePanelOpen(false);
    };

    const handleRefocus = (personId) => {
        const person = persons.find(p => p.id === personId);
        if (person) {
            setSelectedPerson({
                id: person.id,
                data: {
                    ...person,
                    label: `${person.first_name} ${person.last_name || ''}`
                }
            });
        }
    };

    const handleUpdate = () => {
        setRefreshTrigger((prev) => prev + 1);
        loadTreeData();
    };

    if (loading) return <div>Loading tree...</div>;

    return (
        <div className="h-screen w-screen bg-slate-50 overflow-hidden relative">
            {/* Background Tree Layer */}
            <div className="absolute inset-0 z-0">
                {/* Main Content Area */}
                <div className="h-full w-full relative">
                    {/* Main Visualization Area */}
                    <div className="h-full w-full relative">
                        {viewMode === 'standard' && (
                            <div className="absolute inset-0">
                                <TreeVisualizer
                                    treeId={id}
                                    onNodeClick={handleNodeClick}
                                    highlightedNodes={highlightedNodes}
                                    key={refreshTrigger}
                                    userRole={userRole}
                                    isEditMode={isEditMode}
                                    onEditModeToggle={() => setIsEditMode(!isEditMode)}
                                    isZenMode={isZenMode}
                                    onInteraction={(active) => setIsZenMode(active)}
                                    onSearchToggle={() => setIsSearchOpen(!isSearchOpen)}
                                    isSearchOpen={isSearchOpen}
                                />
                            </div>
                        )}
                        <div className={`h-full w-full transition-all duration-700 ${isZenMode ? 'pt-0' : 'pt-[140px]'}`}>
                            {viewMode === 'fan' && (
                                <div className="h-full w-full">
                                    <FanChart
                                        persons={persons}
                                        relationships={relationships}
                                        centerPersonId={selectedPerson?.data?.id || (persons[0]?.id)}
                                        onPersonClick={handleNodeClick}
                                        onRefocus={handleRefocus}
                                        isZenMode={isZenMode}
                                    />
                                </div>
                            )}
                            {viewMode === 'descendant' && (
                                <div className="h-full w-full">
                                    <DescendantChart
                                        persons={persons}
                                        relationships={relationships}
                                        rootPersonId={selectedPerson?.data?.id || (persons[0]?.id)}
                                        onNodeClick={handleNodeClick}
                                        onRefocus={handleRefocus}
                                        isZenMode={isZenMode}
                                    />
                                </div>
                            )}
                            {viewMode === 'timeline' && (
                                <div className="h-full w-full">
                                    <TimelineView
                                        persons={persons}
                                        relationships={relationships}
                                        lifeEvents={lifeEvents}
                                        onEventClick={handleNodeClick}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* UI Overlays Layer */}
            <div className="relative z-10 pointer-events-none h-full flex flex-col">
                {/* Navbar Wrapper */}
                <div className={`transition-all duration-700 pointer-events-auto ${isZenMode ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'}`}>
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
                            <div className="flex items-center gap-2 sm:gap-4">
                                {/* Edit Mode Toggle (Only for owners/editors) - Moved to Tree Toolbar */}
                                <div className="h-6 w-px bg-slate-200 mx-1 hidden lg:block" />

                                {/* Desktop Icons */}
                                <div className="hidden lg:flex items-center gap-2">
                                    {userRole === 'owner' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            leftIcon={<Share2 className="w-4 h-4" />}
                                            onClick={() => setIsShareModalOpen(true)}
                                        >
                                            Share
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="sm" onClick={() => window.location.href = `/tree/${id}/gallery`} className="p-2" title="Gallery"><span className="text-xl">🖼️</span></Button>
                                    <Button variant="ghost" size="sm" onClick={() => window.location.href = `/tree/${id}/albums`} className="p-2" title="Albums"><span className="text-xl">📚</span></Button>
                                    <Button variant="ghost" size="sm" onClick={() => window.location.href = `/tree/${id}/timeline`} className="p-2" title="Timeline"><span className="text-xl">📅</span></Button>
                                    <Button variant="ghost" size="sm" onClick={() => window.location.href = `/tree/${id}/map`} className="p-2" title="Map"><span className="text-xl">🗺️</span></Button>
                                </div>

                                {/* Mobile Menu Toggle (Icons) */}
                                <div className="lg:hidden">
                                    <button
                                        onClick={() => setIsNavMenuOpen(true)}
                                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                                    >
                                        <Menu className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        }
                    />
                </div>

                {/* View Mode Selector - Fades in Zen Mode */}
                <div className={`bg-white/80 backdrop-blur-md border-b border-slate-200 transition-all duration-700 pointer-events-auto ${isZenMode ? 'opacity-0 -translate-y-full shadow-none' : 'opacity-100 translate-y-0 shadow-sm'}`}>
                    <div className="max-w-[1600px] mx-auto px-4 py-3">
                        <ViewModeSelector viewMode={viewMode} onChange={handleViewModeChange} />
                    </div>
                </div>

                {/* Main Interaction Area (Between top UI and bottom UI) */}
                <div className="flex-1 flex overflow-hidden relative">
                    {/* Search Bar - Conditionally Rendered */}
                    {isSearchOpen && (
                        <div className="absolute top-4 left-4 z-30 w-full max-w-md animate-slideIn pointer-events-auto">
                            <SearchBar
                                persons={persons}
                                onHighlight={setHighlightedNodes}
                                onClear={() => setHighlightedNodes([])}
                                onClose={() => setIsSearchOpen(false)}
                            />
                        </div>
                    )}

                    {/* Spacer for the Tree (to allow center clicking) */}
                    <div className="flex-1" />

                    {/* Side Panel */}
                    {isSidePanelOpen && selectedPerson && (
                        <div className="fixed md:relative inset-0 md:inset-auto md:w-96 md:border-l bg-white shadow-xl z-[10002] md:z-0 md:shrink-0 overflow-y-auto pointer-events-auto">
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
            </div>

            {/* Modals */}
            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                treeId={id}
                treeName={treeName}
                currentUserRole={userRole}
            />

            {/* Mobile Navigation Drawer */}
            {
                isNavMenuOpen && (
                    <div className="fixed inset-0 z-[10002] lg:hidden">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsNavMenuOpen(false)} />
                        <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl shadow-2xl p-6 animate-slideUp">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-900">Tree Navigation</h3>
                                <button onClick={() => setIsNavMenuOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                                    <CloseIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => window.location.href = `/tree/${id}/gallery`}
                                    className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-teal-50 hover:border-teal-200 transition-all"
                                >
                                    <div className="p-3 bg-white rounded-xl shadow-sm"><Image className="w-6 h-6 text-teal-600" /></div>
                                    <span className="text-sm font-semibold text-slate-700">Gallery</span>
                                </button>
                                <button
                                    onClick={() => window.location.href = `/tree/${id}/albums`}
                                    className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-teal-50 hover:border-teal-200 transition-all"
                                >
                                    <div className="p-3 bg-white rounded-xl shadow-sm"><Book className="w-6 h-6 text-teal-600" /></div>
                                    <span className="text-sm font-semibold text-slate-700">Albums</span>
                                </button>
                                <button
                                    onClick={() => window.location.href = `/tree/${id}/timeline`}
                                    className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-teal-50 hover:border-teal-200 transition-all"
                                >
                                    <div className="p-3 bg-white rounded-xl shadow-sm"><CalendarIcon className="w-6 h-6 text-teal-600" /></div>
                                    <span className="text-sm font-semibold text-slate-700">Timeline</span>
                                </button>
                                <button
                                    onClick={() => window.location.href = `/tree/${id}/map`}
                                    className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-teal-50 hover:border-teal-200 transition-all"
                                >
                                    <div className="p-3 bg-white rounded-xl shadow-sm"><MapIcon className="w-6 h-6 text-teal-600" /></div>
                                    <span className="text-sm font-semibold text-slate-700">Map</span>
                                </button>
                                {userRole === 'owner' && (
                                    <button
                                        onClick={() => { setIsNavMenuOpen(false); setIsShareModalOpen(true); }}
                                        className="flex flex-col items-center gap-2 p-4 bg-teal-600 rounded-2xl shadow-lg shadow-teal-200 col-span-2 mt-2 transition-all active:scale-95"
                                    >
                                        <div className="flex items-center gap-2 text-white">
                                            <Share2 className="w-5 h-5" />
                                            <span className="font-bold">Share Tree</span>
                                        </div>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

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
