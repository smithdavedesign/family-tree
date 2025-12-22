import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, User, Users, TreePine, Check } from 'lucide-react';
import { Button, Input, Select, useToast } from '../ui';
import { supabase } from '../../auth';
import { sessionManager } from '../../utils/sessionManager';

const WelcomeWizard = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        treeName: '',
        firstName: '',
        lastName: '',
        gender: '',
        birthDate: '',
        fatherFirstName: '',
        fatherLastName: '',
        motherFirstName: '',
        motherLastName: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNext = () => {
        if (step === 2 && !formData.treeName.trim()) {
            toast.error('Please name your tree');
            return;
        }
        if (step === 3 && (!formData.firstName.trim() || !formData.lastName.trim())) {
            toast.error('Please enter your name');
            return;
        }
        setStep(prev => prev + 1);
    };

    const handleFinish = async () => {
        setIsSubmitting(true);
        try {
            // Robust token retrieval
            let session = (await supabase.auth.getSession()).data.session;

            if (!session) {
                console.log('Supabase session null, trying sessionManager...');
                session = sessionManager.getSession();
            }

            if (!session) {
                console.log('sessionManager session null, trying getUser fallback...');
                const { data } = await supabase.auth.getUser();
                if (data?.user) {
                    // getUser worked, but we might still not have an access_token in the same way getSession provides it if it's stale
                    // In this case, refresh if possible
                    session = (await supabase.auth.getSession()).data.session;
                }
            }

            const token = session?.access_token;
            if (!token) {
                throw new Error('No authentication token found. Please try logging in again.');
            }

            const apiFetch = async (url, options) => {
                const response = await fetch(url, {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        ...(options.headers || {})
                    }
                });

                if (!response.ok) {
                    let errorData;
                    try {
                        errorData = await response.json();
                    } catch (e) {
                        errorData = { message: 'Unknown error' };
                    }

                    const error = new Error(errorData.error || errorData.message || `API error: ${response.status}`);
                    error.status = response.status;
                    error.data = errorData;
                    throw error;
                }
                return response.json();
            };

            // 1. Create Tree
            const tree = await apiFetch('/api/trees', {
                method: 'POST',
                body: JSON.stringify({ name: formData.treeName })
            });

            // 2. Create Self (Root Person)
            const self = await apiFetch('/api/person', {
                method: 'POST',
                body: JSON.stringify({
                    tree_id: tree.id,
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    gender: formData.gender || 'Unknown',
                    dob: formData.birthDate || null
                })
            });

            // 3. Create Father (Optional)
            let fatherId = null;
            if (formData.fatherFirstName.trim()) {
                const father = await apiFetch('/api/person', {
                    method: 'POST',
                    body: JSON.stringify({
                        tree_id: tree.id,
                        first_name: formData.fatherFirstName,
                        last_name: formData.fatherLastName || formData.lastName,
                        gender: 'Male'
                    })
                });
                fatherId = father.id;

                // Link Father
                await apiFetch('/api/relationship', {
                    method: 'POST',
                    body: JSON.stringify({
                        tree_id: tree.id,
                        person_1_id: father.id,
                        person_2_id: self.id,
                        type: 'parent_child'
                    })
                });
            }

            // 4. Create Mother (Optional)
            if (formData.motherFirstName.trim()) {
                const mother = await apiFetch('/api/person', {
                    method: 'POST',
                    body: JSON.stringify({
                        tree_id: tree.id,
                        first_name: formData.motherFirstName,
                        last_name: formData.motherLastName,
                        gender: 'Female'
                    })
                });

                // Link Mother
                await apiFetch('/api/relationship', {
                    method: 'POST',
                    body: JSON.stringify({
                        tree_id: tree.id,
                        person_1_id: mother.id,
                        person_2_id: self.id,
                        type: 'parent_child'
                    })
                });

                // Link Parents as Spouses (if both exist)
                if (fatherId) {
                    await apiFetch('/api/relationship', {
                        method: 'POST',
                        body: JSON.stringify({
                            tree_id: tree.id,
                            person_1_id: fatherId,
                            person_2_id: mother.id,
                            type: 'spouse'
                        })
                    });
                }
            }

            toast.success('Tree created successfully!');
            queryClient.invalidateQueries(['trees']);
            if (onComplete) onComplete();
            navigate(`/tree/${tree.id}`);

        } catch (error) {
            console.error('Wizard Error details:', {
                message: error.message,
                status: error.status,
                data: error.data
            });

            if (error.status === 401) {
                toast.error('Session expired. Please log in again.');
            } else {
                toast.error(error.message || 'Something went wrong. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 relative">
            {/* Progress Bar */}
            <div className="h-2 bg-slate-100 rounded-t-xl overflow-hidden">
                <div
                    className="h-full bg-teal-500 transition-all duration-500 ease-out"
                    style={{ width: `${(step / 5) * 100}%` }}
                />
            </div>

            <div className="p-8">
                {/* Step 1: Welcome */}
                {step === 1 && (
                    <div className="text-center py-8">
                        <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <TreePine className="w-10 h-10 text-teal-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-4">Welcome to Roots & Branches</h2>
                        <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
                            Let's start your journey by creating your first family tree. It only takes a minute!
                        </p>
                        <Button size="lg" onClick={handleNext} className="px-8">
                            Get Started <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </div>
                )}

                {/* Step 2: Tree Name */}
                {step === 2 && (
                    <div className="max-w-md mx-auto">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">Name your Family Tree</h2>
                        <div className="space-y-4">
                            <div>
                                <Input
                                    label="Tree Name"
                                    name="treeName"
                                    value={formData.treeName}
                                    onChange={handleChange}
                                    placeholder="e.g. The Smith Family"
                                    autoFocus
                                />
                            </div>
                            <Button onClick={handleNext} disabled={!formData.treeName.trim()} className="w-full mt-4">
                                Next Step
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: About You */}
                {step === 3 && (
                    <div className="max-w-md mx-auto">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">Tell us about yourself</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="First Name"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                />
                                <Input
                                    label="Last Name"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Select
                                    label="Gender"
                                    value={formData.gender}
                                    onChange={(val) => setFormData(prev => ({ ...prev, gender: val }))}
                                    options={[
                                        { value: 'Male', label: 'Male' },
                                        { value: 'Female', label: 'Female' },
                                        { value: 'Other', label: 'Other' }
                                    ]}
                                    placeholder="Select..."
                                    fullWidth
                                />
                                <Input
                                    label="Birth Date"
                                    type="date"
                                    name="birthDate"
                                    value={formData.birthDate}
                                    onChange={handleChange}
                                />
                            </div>

                            <Button onClick={handleNext} disabled={!formData.firstName.trim() || !formData.lastName.trim()} className="w-full mt-4">
                                Next Step
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 4: Parents */}
                {step === 4 && (
                    <div className="max-w-md mx-auto">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Add your parents</h2>
                        <p className="text-slate-500 mb-6 text-sm">Optional - you can add them later.</p>

                        <div className="space-y-6">
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <h3 className="font-medium text-slate-700 mb-3 flex items-center"><User className="w-4 h-4 mr-2" /> Father</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        name="fatherFirstName"
                                        value={formData.fatherFirstName}
                                        onChange={handleChange}
                                        placeholder="First Name"
                                    />
                                    <Input
                                        name="fatherLastName"
                                        value={formData.fatherLastName}
                                        onChange={handleChange}
                                        placeholder="Last Name"
                                    />
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <h3 className="font-medium text-slate-700 mb-3 flex items-center"><User className="w-4 h-4 mr-2" /> Mother</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        name="motherFirstName"
                                        value={formData.motherFirstName}
                                        onChange={handleChange}
                                        placeholder="First Name"
                                    />
                                    <Input
                                        name="motherLastName"
                                        value={formData.motherLastName}
                                        onChange={handleChange}
                                        placeholder="Maiden Name"
                                    />
                                </div>
                            </div>

                            <Button onClick={handleNext} className="w-full">
                                Next Step
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 5: Finish */}
                {step === 5 && (
                    <div className="text-center py-8">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Check className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-4">You're all set!</h2>
                        <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
                            We're creating your tree "{formData.treeName}" with the details you provided.
                        </p>
                        <Button
                            size="lg"
                            onClick={handleFinish}
                            disabled={isSubmitting}
                            className="px-8 bg-green-600 hover:bg-green-700"
                        >
                            {isSubmitting ? 'Creating Tree...' : 'Go to My Tree'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WelcomeWizard;
