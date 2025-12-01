import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { supabase } from '../auth';
import { Modal, Button, Input, useToast } from './ui';

const AddRelationshipModal = ({ isOpen, onClose, currentPerson, onSuccess }) => {
    const { toast } = useToast();
    const [step, setStep] = useState(1); // 1: Choose type, 2: Choose person
    const [relationshipType, setRelationshipType] = useState('');
    const [isParentRelationship, setIsParentRelationship] = useState(false);
    const [availablePersons, setAvailablePersons] = useState([]);
    const [filteredPersons, setFilteredPersons] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && step === 2) {
            fetchAvailablePersons();
        }
    }, [isOpen, step]);

    useEffect(() => {
        if (searchQuery) {
            const filtered = availablePersons.filter(p => {
                const fullName = `${p.first_name} ${p.last_name || ''}`.toLowerCase();
                return fullName.includes(searchQuery.toLowerCase());
            });
            setFilteredPersons(filtered);
        } else {
            setFilteredPersons(availablePersons);
        }
    }, [searchQuery, availablePersons]);

    const fetchAvailablePersons = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`/api/tree/${currentPerson.data.tree_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const { persons } = await response.json();
                // Filter out the current person
                const others = persons.filter(p => p.id !== currentPerson.id);
                setAvailablePersons(others);
                setFilteredPersons(others);
            }
        } catch (error) {
            console.error("Error fetching persons:", error);
            toast.error("Failed to load people");
        } finally {
            setLoading(false);
        }
    };

    const handleTypeSelect = (type, isParent = false) => {
        setRelationshipType(type);
        setIsParentRelationship(isParent);
        setStep(2);
    };

    const handlePersonSelect = async (selectedPerson) => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            // Determine person_1 and person_2 based on relationship type
            let person_1_id, person_2_id;

            if (relationshipType === 'spouse') {
                // For spouse, order doesn't matter
                person_1_id = currentPerson.id;
                person_2_id = selectedPerson.id;
            } else if (isParentRelationship) {
                // Selected person is the child, current person is the parent
                person_1_id = currentPerson.id;
                person_2_id = selectedPerson.id;
            } else {
                // Selected person is the parent, current person is the child
                person_1_id = selectedPerson.id;
                person_2_id = currentPerson.id;
            }

            const payload = {
                tree_id: currentPerson.data.tree_id,
                person_1_id,
                person_2_id,
                type: relationshipType
            };

            console.log("Creating relationship with payload:", payload);

            const response = await fetch('/api/relationship', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                toast.success("Relationship added successfully");
                onSuccess();
                handleClose();
            } else {
                toast.error("Failed to create relationship");
            }
        } catch (error) {
            console.error("Error creating relationship:", error);
            toast.error("Error creating relationship");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setRelationshipType('');
        setIsParentRelationship(false);
        setSearchQuery('');
        onClose();
    };

    const relationshipTypes = [
        { value: 'parent_child', label: 'Child', description: 'Add a child' },
        { value: 'parent_child', label: 'Parent', description: 'Add a parent', isParent: true },
        { value: 'spouse', label: 'Spouse/Partner', description: 'Add a spouse or partner' },
        { value: 'adoptive_parent_child', label: 'Adoptive Child', description: 'Add an adoptive child' },
        { value: 'adoptive_parent_child', label: 'Adoptive Parent', description: 'Add an adoptive parent', isParent: true },
        { value: 'step_parent_child', label: 'Step Child', description: 'Add a step child' },
        { value: 'step_parent_child', label: 'Step Parent', description: 'Add a step parent', isParent: true },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={step === 1 ? 'Add Relationship' : `Select ${relationshipType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`}
            size="md"
        >
            {step === 1 ? (
                <div className="space-y-3">
                    <p className="text-sm text-slate-600 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                        Choose the type of relationship to add for <strong className="text-blue-800">{currentPerson?.data?.label}</strong>
                    </p>
                    <div className="grid gap-2 max-h-[60vh] overflow-y-auto pr-1">
                        {relationshipTypes.map((type, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleTypeSelect(type.value, type.isParent)}
                                className="w-full text-left p-4 border border-slate-200 rounded-xl hover:bg-teal-50 hover:border-teal-200 transition-all group"
                            >
                                <div className="font-bold text-slate-700 group-hover:text-teal-800">{type.label}</div>
                                <div className="text-xs text-slate-500 group-hover:text-teal-600">{type.description}</div>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col h-full space-y-4">
                    <Input
                        leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                        placeholder="Search by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                        </div>
                    ) : filteredPersons.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <p className="text-slate-500 text-sm font-medium">
                                {searchQuery ? 'No matching persons found' : 'No other persons in this tree'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2 overflow-y-auto max-h-[400px] pr-1">
                            {filteredPersons.map((person) => (
                                <button
                                    key={person.id}
                                    onClick={() => handlePersonSelect(person)}
                                    className="w-full text-left p-3 border border-slate-100 rounded-xl hover:bg-teal-50 hover:border-teal-200 transition-all flex justify-between items-center group"
                                >
                                    <div>
                                        <div className="font-bold text-slate-700 group-hover:text-teal-900">{person.first_name} {person.last_name || ''}</div>
                                        {person.dob && (
                                            <div className="text-xs text-slate-500 group-hover:text-teal-700">
                                                Born: {new Date(person.dob).getFullYear()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-teal-200 group-hover:text-teal-700 transition-colors">
                                        <Plus className="w-5 h-5" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    <Button
                        variant="ghost"
                        fullWidth
                        onClick={() => setStep(1)}
                    >
                        ← Back to relationship types
                    </Button>
                </div>
            )}
        </Modal>
    );
};

export default AddRelationshipModal;
