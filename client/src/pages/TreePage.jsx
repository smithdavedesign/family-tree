import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TreeVisualizer from '../components/TreeVisualizer';
import SidePanel from '../components/SidePanel';
import SearchBar from '../components/SearchBar';
import { supabase } from '../auth';

const TreePage = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [highlightedNodes, setHighlightedNodes] = useState([]);
    const [persons, setPersons] = useState([]);

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
        getTree();
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
                <h1 className="text-xl font-bold text-teal-800">Roots & Branches</h1>
                <div className="text-sm text-gray-500">Tree ID: {id}</div>
            </header>
            <SearchBar
                persons={persons}
                onHighlight={setHighlightedNodes}
                onClear={() => setHighlightedNodes([])}
            />
            <div className="flex-grow relative">
                <TreeVisualizer
                    treeId={id}
                    onNodeClick={handleNodeClick}
                    highlightedNodes={highlightedNodes}
                    key={refreshTrigger}
                />
            </div>

            {selectedPerson && (
                <SidePanel
                    person={selectedPerson}
                    onClose={handleClosePanel}
                    onUpdate={handleUpdate}
                />
            )}
        </div>
    );
};

export default TreePage;
