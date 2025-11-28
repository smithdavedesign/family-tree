import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TreeVisualizer from '../components/TreeVisualizer';
import SidePanel from '../components/SidePanel';
import SearchBar from '../components/SearchBar';
import AccountSettings from '../components/AccountSettings';
import TreeSwitcher from '../components/TreeSwitcher';
import { supabase, getCurrentUser } from '../auth';
import { Settings } from 'lucide-react';

const TreePage = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [highlightedNodes, setHighlightedNodes] = useState([]);
    const [persons, setPersons] = useState([]);
    const [showSettings, setShowSettings] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const getTree = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;

                const response = await fetch(`/api/tree/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.ok) {
                    const { persons: treePersons } = await response.json();
                    setPersons(treePersons);
                }
            } catch (error) {
                console.error("Error fetching tree:", error);
            } finally {
                setLoading(false);
            }
        };

        const loadUser = async () => {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
        };

        getTree();
        loadUser();
    }, [id]);

    const handleNodeClick = (event, node) => {
        setSelectedPerson(node);
    };

    const handleClosePanel = () => {
        setSelectedPerson(null);
    };

    const handleUpdate = () => {
        // Force tree refresh to show new photo
        setRefreshTrigger(prev => prev + 1);
    };

    if (loading) return <div>Loading tree...</div>;

    return (
        <div className="flex flex-col h-screen relative overflow-hidden">
            <header className="bg-white shadow p-4 z-10 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-teal-800 hidden md:block">Roots & Branches</h1>
                    <TreeSwitcher currentTreeId={id} />
                </div>
                <button
                    onClick={() => setShowSettings(true)}
                    className="p-2 hover:bg-gray-100 rounded-full transition"
                    title="Account Settings"
                >
                    <Settings className="w-5 h-5 text-gray-600" />
                </button>
            </header>
            <SearchBar
                persons={persons}
                onHighlight={setHighlightedNodes}
                onClear={() => setHighlightedNodes([])}
            />
            <div className="flex-1 flex relative overflow-hidden w-full h-full">
                <div className="flex-1 relative h-full w-full bg-gray-50">
                    <TreeVisualizer
                        treeId={id}
                        onNodeClick={handleNodeClick}
                        highlightedNodes={highlightedNodes}
                        key={refreshTrigger}
                    />
                </div>

                {selectedPerson && (
                    <div className="w-full md:w-96 border-l bg-white shadow-xl z-20 h-full shrink-0 transition-all duration-300">
                        <SidePanel
                            person={selectedPerson}
                            onClose={handleClosePanel}
                            onUpdate={handleUpdate}
                        />
                    </div>
                )}
            </div>

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
