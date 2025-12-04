import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { supabase } from '../auth';
import { Modal, Button, Input, useToast } from './ui';

const AddRelationshipModal = ({ isOpen, onClose, currentPerson, onSuccess }) => {
    const { toast } = useToast();
    const [step, setStep] = useState(1); // 1: Choose type, 2: Choose person
    const [relationshipType, setRelationshipType] = useState('');
    const [isParentRelationship, setIsParentRelationship] = useState(false);
    const [newPersonData, setNewPersonData] = useState({
        first_name: '',
        last_name: '',
        gender: ''
    });

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
        await createRelationship(selectedPerson.id);
    };

    const createRelationship = async (otherPersonId) => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            // Determine person_1 and person_2 based on relationship type
            let person_1_id, person_2_id;

            if (relationshipType === 'spouse') {
                // For spouse, order doesn't matter
                person_1_id = currentPerson.id;
                person_2_id = otherPersonId;
            } else if (isParentRelationship) {
                // Selected person is the child, current person is the parent
                person_1_id = currentPerson.id;
                person_2_id = otherPersonId;
            } else {
                // Selected person is the parent, current person is the child
                person_1_id = otherPersonId;
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

    const handleCreateAndConnect = async () => {
        if (!newPersonData.first_name || !newPersonData.gender) {
            toast.error("First Name and Gender are required");
            return;
        }

        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            // 1. Create the new person
            const createResponse = await fetch('/api/person', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    tree_id: currentPerson.data.tree_id,
                    ...newPersonData
                })
            });

            if (!createResponse.ok) {
                throw new Error("Failed to create person");
            }

            const newPerson = await createResponse.json();

            // 2. Create the relationship
            await createRelationship(newPerson.id);

        } catch (error) {
            console.error("Error creating person and relationship:", error);
            toast.error("Failed to create person and connect");
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setRelationshipType('');
        setIsParentRelationship(false);
        setSearchQuery('');
        setNewPersonData({ first_name: '', last_name: '', gender: '' });
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

    const getTitle = () => {
        if (step === 1) return 'Add Relationship';
        if (step === 3) return 'Create New Person';
        return `Select ${relationshipType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={getTitle()}
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
            ) : step === 2 ? (
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
                        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center space-y-3">
                            <p className="text-slate-500 text-sm font-medium">
                                {searchQuery ? 'No matching persons found' : 'No other persons in this tree'}
                            </p>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                    // Pre-fill first name if search query looks like a name
                                    if (searchQuery) {
                                        const parts = searchQuery.split(' ');
                                        setNewPersonData(prev => ({
                                            ...prev,
                                            first_name: parts[0] || '',
                                            last_name: parts.slice(1).join(' ') || ''
                                        }));
                                    }
                                    setStep(3);
                                }}
                                leftIcon={<Plus className="w-4 h-4" />}
                            >
                                Create New Person
                            </Button>
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
                            <div className="pt-2 border-t border-slate-100 mt-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    fullWidth
                                    onClick={() => setStep(3)}
                                    leftIcon={<Plus className="w-4 h-4" />}
                                >
                                    Create New Person Instead
                                </Button>
                            </div>
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
            ) : (
                <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800 mb-4">
                        Creating a new person to be the <strong>{relationshipType.replace(/_/g, ' ')}</strong> of <strong>{currentPerson?.data?.label}</strong>.
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="First Name"
                            value={newPersonData.first_name}
                            onChange={(e) => setNewPersonData({ ...newPersonData, first_name: e.target.value })}
                            placeholder="e.g. John"
                            autoFocus
                        />
                        <Input
                            label="Last Name"
                            value={newPersonData.last_name}
                            onChange={(e) => setNewPersonData({ ...newPersonData, last_name: e.target.value })}
                            placeholder="e.g. Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                        <select
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            value={newPersonData.gender}
                            onChange={(e) => setNewPersonData({ ...newPersonData, gender: e.target.value })}
                        >
                            <option value="">Select Gender...</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            variant="ghost"
                            fullWidth
                            onClick={() => setStep(2)}
                        >
                            Back
                        </Button>
                        <Button
                            variant="primary"
                            fullWidth
                            onClick={handleCreateAndConnect}
                            disabled={loading || !newPersonData.first_name || !newPersonData.gender}
                        >
                            {loading ? 'Creating...' : 'Create & Connect'}
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default AddRelationshipModal;
