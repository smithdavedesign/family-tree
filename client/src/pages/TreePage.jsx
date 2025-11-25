import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TreeVisualizer from '../components/TreeVisualizer';
import SidePanel from '../components/SidePanel';
import { supabase } from '../auth';

const TreePage = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        const getTree = async () => {
            // For now, we just verify we can fetch the tree metadata or just pass the ID
            // In a real app, we might check permissions here first
            setLoading(false);
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
            <div className="flex-grow relative">
                <TreeVisualizer treeId={id} onNodeClick={handleNodeClick} key={refreshTrigger} />

                {selectedPerson && (
                    <SidePanel
                        person={selectedPerson}
                        onClose={handleClosePanel}
                        onUpdate={handleUpdate}
                    />
                )}
            </div>
        </div>
    );
};

export default TreePage;
