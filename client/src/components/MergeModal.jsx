import React, { useState, useEffect } from 'react';
import { supabase } from '../auth';
import { Modal, Button, Input, useToast } from './ui';

const MergeModal = ({ isOpen, onClose, currentPerson, onMergeSuccess }) => {
    const { toast } = useToast();
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
            toast.error("Failed to load candidates");
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
                toast.success("Merge successful");
                onMergeSuccess();
                onClose();
            } else {
                toast.error("Failed to merge");
            }
        } catch (error) {
            console.error("Error merging:", error);
            toast.error("Error merging");
        } finally {
            setLoading(false);
        }
    };

    const filteredCandidates = candidates.filter(p =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Merge Person"
            size="md"
            footer={
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleMerge}
                        disabled={!selectedPerson || loading}
                        loading={loading}
                    >
                        Merge
                    </Button>
                </div>
            }
        >
            <div className="space-y-4">
                <p className="text-sm text-slate-600">
                    Select a person to merge <strong>into</strong> {currentPerson?.data?.first_name}.
                    The selected person will be deleted, and their relationships/photos will move to {currentPerson?.data?.first_name}.
                </p>

                <Input
                    placeholder="Search name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                />

                <div className="h-60 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1">
                    {filteredCandidates.length === 0 ? (
                        <div className="text-center text-slate-400 py-8 text-sm">No people found</div>
                    ) : (
                        filteredCandidates.map(p => (
                            <div
                                key={p.id}
                                onClick={() => setSelectedPerson(p)}
                                className={`p-3 cursor-pointer rounded-lg transition-colors flex justify-between items-center ${selectedPerson?.id === p.id
                                    ? 'bg-teal-50 border-teal-200 border ring-1 ring-teal-200'
                                    : 'hover:bg-slate-50 border border-transparent'
                                    }`}
                            >
                                <div>
                                    <div className="font-medium text-slate-800">{p.first_name} {p.last_name}</div>
                                    <div className="text-xs text-slate-500">
                                        {p.dob ? new Date(p.dob).getFullYear() : '?'} - {p.dod ? new Date(p.dod).getFullYear() : '?'}
                                    </div>
                                </div>
                                {selectedPerson?.id === p.id && (
                                    <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default MergeModal;
