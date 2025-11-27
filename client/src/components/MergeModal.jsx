import React, { useState, useEffect } from 'react';
import { supabase } from '../auth';

const MergeModal = ({ isOpen, onClose, currentPerson, onMergeSuccess }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [candidates, setCandidates] = useState([]);
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchCandidates();
            setSearchTerm('');
            setSelectedPerson(null);
        }
    }, [isOpen]);

    const fetchCandidates = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`/api/tree/${currentPerson.data.tree_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const { persons } = await response.json();
                // Filter out current person
                setCandidates(persons.filter(p => p.id !== currentPerson.id));
            }
        } catch (error) {
            console.error("Error fetching candidates:", error);
        }
    };

    const handleMerge = async () => {
        if (!selectedPerson) return;

        if (!confirm(`Are you sure you want to merge ${selectedPerson.first_name} INTO ${currentPerson.data.first_name}? ${selectedPerson.first_name} will be deleted.`)) {
            return;
        }

        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch('/api/person/merge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    keep_id: currentPerson.id,
                    merge_id: selectedPerson.id
                })
            });

            if (response.ok) {
                onMergeSuccess();
                onClose();
            } else {
                alert("Failed to merge");
            }
        } catch (error) {
            console.error("Error merging:", error);
            alert("Error merging");
        } finally {
            setLoading(false);
        }
    };

    const filteredCandidates = candidates.filter(p =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] flex flex-col">
                <h2 className="text-xl font-bold mb-4">Merge Person</h2>
                <p className="text-sm text-gray-600 mb-4">
                    Select a person to merge <strong>into</strong> {currentPerson.data.first_name}.
                    The selected person will be deleted, and their relationships/photos will move to {currentPerson.data.first_name}.
                </p>

                <input
                    type="text"
                    placeholder="Search name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 border rounded mb-2"
                />

                <div className="flex-1 overflow-y-auto border rounded p-2 mb-4">
                    {filteredCandidates.map(p => (
                        <div
                            key={p.id}
                            onClick={() => setSelectedPerson(p)}
                            className={`p-2 cursor-pointer rounded hover:bg-gray-100 ${selectedPerson?.id === p.id ? 'bg-blue-50 border-blue-200 border' : ''}`}
                        >
                            <div className="font-medium">{p.first_name} {p.last_name}</div>
                            <div className="text-xs text-gray-500">
                                {p.dob ? new Date(p.dob).getFullYear() : '?'} - {p.dod ? new Date(p.dod).getFullYear() : '?'}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
                        Cancel
                    </button>
                    <button
                        onClick={handleMerge}
                        disabled={!selectedPerson || loading}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                        {loading ? 'Merging...' : 'Merge'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MergeModal;
