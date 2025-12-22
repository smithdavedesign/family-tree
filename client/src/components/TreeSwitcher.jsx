import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, TreePine, Plus } from 'lucide-react';
import { supabase } from '../auth';

const TreeSwitcher = ({ currentTreeId }) => {
    const [trees, setTrees] = useState([]);
    const [currentTree, setCurrentTree] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTrees();

        // Close dropdown when clicking outside
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (trees.length > 0 && currentTreeId) {
            const tree = trees.find(t => t.id === currentTreeId);
            setCurrentTree(tree);
        }
    }, [trees, currentTreeId]);

    const fetchTrees = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch('/api/trees', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const treesData = await response.json();
                setTrees(treesData);
            }
        } catch (error) {
            console.error('Error fetching trees:', error);
        }
    };

    const handleSwitchTree = (treeId) => {
        setIsOpen(false);
        navigate(`/tree/${treeId}`);
    };

    const handleViewAllTrees = () => {
        setIsOpen(false);
        navigate('/trees');
    };

    if (!currentTree) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 pl-1.5 pr-3 py-2 h-10 bg-white border border-transparent hover:border-slate-300 rounded-lg transition"
            >
                <TreePine className="w-4 h-4 text-teal-600" />
                <span className="font-medium text-gray-700 max-w-[200px] truncate">
                    {currentTree.name.replace(/\s+tree$/i, '')}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    <div className="p-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase px-2 py-1 mb-1">
                            Your Trees ({trees.length})
                        </div>

                        {trees.map(tree => (
                            <button
                                key={tree.id}
                                onClick={() => handleSwitchTree(tree.id)}
                                className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition flex items-center gap-2 ${tree.id === currentTreeId ? 'bg-teal-50 text-teal-700' : 'text-gray-700'
                                    }`}
                            >
                                <TreePine className="w-4 h-4" />
                                <span className="flex-1 truncate">{tree.name.replace(/\s+tree$/i, '')}</span>
                                {tree.id === currentTreeId && (
                                    <span className="text-xs bg-teal-600 text-white px-2 py-0.5 rounded">Current</span>
                                )}
                            </button>
                        ))}

                        <div className="border-t my-2"></div>

                        <button
                            onClick={handleViewAllTrees}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition flex items-center gap-2 text-gray-700 font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            View All Trees
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TreeSwitcher;
