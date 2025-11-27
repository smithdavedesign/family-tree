import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { supabase } from '../auth';

const AddRelationshipModal = ({ isOpen, onClose, currentPerson, onSuccess }) => {
    const [step, setStep] = useState(1); // 1: Choose type, 2: Choose person
    const [relationshipType, setRelationshipType] = useState('');
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
        } finally {
            setLoading(false);
        }
    };

    const handleTypeSelect = (type) => {
        setRelationshipType(type);
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
            } else if (relationshipType.includes('parent')) {
                // Current person is the parent
                person_1_id = currentPerson.id;
                person_2_id = selectedPerson.id;
            } else if (relationshipType.includes('child')) {
                // Current person is the child
                person_1_id = selectedPerson.id;
                person_2_id = currentPerson.id;
            }

            const response = await fetch('/api/relationship', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    tree_id: currentPerson.data.tree_id,
                    person_1_id,
                    person_2_id,
                    type: relationshipType
                })
            });

            if (response.ok) {
                onSuccess();
                handleClose();
            } else {
                alert("Failed to create relationship");
            }
        } catch (error) {
            console.error("Error creating relationship:", error);
            alert("Error creating relationship");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setRelationshipType('');
        setSearchQuery('');
        onClose();
    };

    if (!isOpen) return null;

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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-semibold">
                        {step === 1 ? 'Add Relationship' : `Select ${relationshipType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`}
                    </h2>
                    <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {step === 1 ? (
                        <div className="space-y-2">
                            <p className="text-sm text-gray-600 mb-4">
                                Choose the type of relationship to add for <strong>{currentPerson.data.label}</strong>
                            </p>
                            {relationshipTypes.map((type, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleTypeSelect(type.isParent ? type.value + '_parent' : type.value)}
                                    className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 hover:border-blue-500 transition"
                                >
                                    <div className="font-medium">{type.label}</div>
                                    <div className="text-sm text-gray-500">{type.description}</div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div>
                            <div className="mb-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {loading ? (
                                <div className="text-center py-8 text-gray-500">Loading...</div>
                            ) : filteredPersons.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    {searchQuery ? 'No matching persons found' : 'No other persons in this tree'}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredPersons.map((person) => (
                                        <button
                                            key={person.id}
                                            onClick={() => handlePersonSelect(person)}
                                            className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 hover:border-blue-500 transition"
                                        >
                                            <div className="font-medium">{person.first_name} {person.last_name || ''}</div>
                                            {person.dob && (
                                                <div className="text-sm text-gray-500">
                                                    Born: {new Date(person.dob).getFullYear()}
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={() => setStep(1)}
                                className="mt-4 w-full py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
                            >
                                ← Back to relationship types
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddRelationshipModal;
