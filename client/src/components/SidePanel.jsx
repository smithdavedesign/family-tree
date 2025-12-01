import React, { useState, useEffect } from 'react';
import { X, Plus, Image as ImageIcon } from 'lucide-react';
import MergeModal from './MergeModal';
import AddRelationshipModal from './AddRelationshipModal';
import { Button, Input, useToast } from './ui';
import { supabase } from '../auth';

const SidePanel = ({ person, onClose, onUpdate, onOpenPhotoPicker, userRole = 'viewer' }) => {
    const { toast } = useToast();
    const [media, setMedia] = useState([]);
    const [loadingMedia, setLoadingMedia] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [relationships, setRelationships] = useState([]);
    const [loadingRelationships, setLoadingRelationships] = useState(false);
    const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
    const [isAddRelationshipOpen, setIsAddRelationshipOpen] = useState(false);

    useEffect(() => {
        console.log("SidePanel received person:", person);
        if (person) {
            fetchMedia();
            fetchRelationships();
            // Initialize form data from person data
            // Note: person.data contains the visual label/subline, but we need the raw fields.
            // Ideally, the parent component should pass the full person object, or we fetch it here.
            // For now, we'll try to parse what we have or assume the parent passed raw data in 'data' too.
            // Let's assume person.data has the raw fields mixed in for now (we updated TreeVisualizer earlier).
            setFormData({
                first_name: person.data.first_name || person.data.label.split(' ')[0],
                last_name: person.data.last_name || person.data.label.split(' ').slice(1).join(' '),
                gender: person.data.gender || '',
                bio: person.data.bio || '',
                dob: person.data.dob || '',
                dod: person.data.dod || '',
                occupation: person.data.occupation || '',
                pob: person.data.pob || '',
            });
            setIsEditing(false);
        }
    }, [person]);

    const fetchMedia = async () => {
        setLoadingMedia(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`/api/person/${person.id}/media`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setMedia(data);
            }
        } catch (error) {
            console.error("Error fetching media:", error);
        } finally {
            setLoadingMedia(false);
        }
    };

    const handlePhotoSelect = async (googlePhoto) => {
        // Picker is closed by parent component

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            // Save to database
            const response = await fetch('/api/media', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    person_id: person.id,
                    url: googlePhoto.baseUrl,
                    type: 'image',
                    google_media_id: googlePhoto.id
                })
            });

            if (response.ok) {
                const newMedia = await response.json();
                setMedia([...media, newMedia]);

                // Also update the profile photo if it's the first one
                if (person && !person.data.profile_photo_url) {
                    await handleSave({ profile_photo_url: googlePhoto.baseUrl });
                } else if (onUpdate) {
                    onUpdate();
                }
            }
        } catch (error) {
            console.error("Error saving media:", error);
            toast.error("Failed to save photo");
        }
    };

    const handleSave = async (updates = null) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const payload = updates || formData;

            const response = await fetch(`/api/person/${person.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setIsEditing(false);
                if (onUpdate) onUpdate();
                toast.success("Changes saved successfully");
            } else {
                toast.error("Failed to save changes");
            }
        } catch (error) {
            console.error("Error updating person:", error);
            toast.error("Error saving changes");
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const fetchRelationships = async () => {
        setLoadingRelationships(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`/api/tree/${person.data.tree_id || 'tree-123'}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                const { relationships: allRels, persons } = await response.json();
                // Filter relationships where this person is involved
                const personRels = allRels.filter(r =>
                    r.person_1_id === person.id || r.person_2_id === person.id
                ).map(r => {
                    // Find the other person
                    const otherPersonId = r.person_1_id === person.id ? r.person_2_id : r.person_1_id;
                    const otherPerson = persons.find(p => p.id === otherPersonId);

                    return {
                        ...r,
                        otherPerson: otherPerson ? `${otherPerson.first_name} ${otherPerson.last_name || ''}` : 'Unknown',
                        direction: r.person_1_id === person.id ? 'from' : 'to'
                    };
                });
                setRelationships(personRels);
            }
        } catch (error) {
            console.error("Error fetching relationships:", error);
        } finally {
            setLoadingRelationships(false);
        }
    };

    const handleDeleteRelationship = async (relationshipId) => {
        if (!confirm('Are you sure you want to remove this relationship?')) {
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`/api/relationship/${relationshipId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                fetchRelationships();
                if (onUpdate) onUpdate();
                toast.success("Relationship removed");
            } else {
                toast.error("Failed to delete relationship");
            }
        } catch (error) {
            console.error("Error deleting relationship:", error);
            toast.error("Error deleting relationship");
        }
    };

    if (!person) return null;

    const canEdit = userRole === 'owner' || userRole === 'editor';

    return (
        <>
            <div className="h-full w-full bg-white flex flex-col">
                {/* Header */}
                <div className="p-4 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">Person Details</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8">
                    {/* Profile Section */}
                    <div className="flex flex-col items-center">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full bg-slate-100 overflow-hidden border-4 border-white shadow-xl ring-1 ring-slate-100">
                                {person.data.profile_photo_url ? (
                                    <img src={person.data.profile_photo_url} alt={person.data.label} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl text-slate-300">
                                        <ImageIcon className="w-12 h-12" />
                                    </div>
                                )}
                            </div>
                            {canEdit && (
                                <div className="absolute bottom-0 right-0">
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => onOpenPhotoPicker(handlePhotoSelect)}
                                        className="rounded-full w-8 h-8 p-0 flex items-center justify-center shadow-lg"
                                        title="Change Photo"
                                    >
                                        <ImageIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {!isEditing ? (
                            <div className="text-center mt-4 space-y-1">
                                <h3 className="text-2xl font-bold text-slate-800">{person.data.label}</h3>
                                <p className="text-slate-500 font-medium">{person.data.subline}</p>
                                {canEdit && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsEditing(true)}
                                        className="mt-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                                    >
                                        Edit Details
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="w-full mt-6 space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                {/* ... (Edit Form - same as before) ... */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Input
                                            label="First Name"
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            placeholder="First Name"
                                        />
                                    </div>
                                    <div>
                                        <Input
                                            label="Last Name"
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            placeholder="Last Name"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsEditing(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => handleSave()}
                                    >
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {isEditing && (
                        <div className="space-y-4 animate-fadeIn">
                            {/* ... (Vital Statistics Form - same as before) ... */}
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2">Vital Statistics</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Input
                                        type="date"
                                        label="Birth Date"
                                        name="dob"
                                        value={formData.dob ? formData.dob.split('T')[0] : ''}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <Input
                                        type="date"
                                        label="Death Date"
                                        name="dod"
                                        value={formData.dod ? formData.dod.split('T')[0] : ''}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <Input
                                        label="Gender"
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        as="select"
                                    >
                                        <option value="">Select...</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </Input>
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        label="Occupation"
                                        name="occupation"
                                        value={formData.occupation}
                                        onChange={handleChange}
                                        placeholder="e.g. Engineer"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        label="Place of Birth"
                                        name="pob"
                                        value={formData.pob}
                                        onChange={handleChange}
                                        placeholder="e.g. New York, USA"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {!isEditing && (
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2">Vital Statistics</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Birth Date</label>
                                    <div className="text-sm text-slate-800">{formData.dob ? new Date(formData.dob).toLocaleDateString() : '-'}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Death Date</label>
                                    <div className="text-sm text-slate-800">{formData.dod ? new Date(formData.dod).toLocaleDateString() : '-'}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Gender</label>
                                    <div className="text-sm text-slate-800">{formData.gender || '-'}</div>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Occupation</label>
                                    <div className="text-sm text-slate-800">{formData.occupation || '-'}</div>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Place of Birth</label>
                                    <div className="text-sm text-slate-800">{formData.pob || '-'}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Photos Section */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Photos</h4>
                            {canEdit && (
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    leftIcon={<Plus className="w-3 h-3" />}
                                    onClick={() => onOpenPhotoPicker(handlePhotoSelect)}
                                    className="text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100"
                                >
                                    Add Photo
                                </Button>
                            )}
                        </div>

                        {loadingMedia ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
                            </div>
                        ) : media.length === 0 ? (
                            <div className="bg-slate-50 rounded-xl p-6 text-center border-2 border-dashed border-slate-200">
                                <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">No photos attached yet</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {media.map((item) => (
                                    <div key={item.id} className="aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative">
                                        <img src={item.url} alt="Attached" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Relationships Section */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Relationships</h4>
                            {canEdit && (
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    leftIcon={<Plus className="w-3 h-3" />}
                                    onClick={() => setIsAddRelationshipOpen(true)}
                                    className="text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100"
                                >
                                    Add
                                </Button>
                            )}
                        </div>
                        {loadingRelationships ? (
                            <div className="flex justify-center py-4">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600"></div>
                            </div>
                        ) : relationships.length === 0 ? (
                            <div className="bg-slate-50 rounded-xl p-4 text-center border-2 border-dashed border-slate-200">
                                <p className="text-sm text-slate-500">No relationships found</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {relationships.map((rel) => {
                                    const typeLabel = rel.type === 'spouse' ? 'Spouse' :
                                        rel.type === 'adoptive_parent_child' ? 'Adoptive' :
                                            rel.type === 'step_parent_child' ? 'Step' :
                                                rel.direction === 'from' ? 'Parent of' : 'Child of';

                                    return (
                                        <div key={rel.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm hover:border-teal-200 transition-colors">
                                            <div className="flex-1">
                                                <div className="text-sm font-semibold text-slate-800">{rel.otherPerson}</div>
                                                <div className="text-xs text-slate-500 font-medium">{typeLabel}</div>
                                            </div>
                                            {canEdit && (
                                                <Button
                                                    variant="danger"
                                                    size="xs"
                                                    onClick={() => handleDeleteRelationship(rel.id)}
                                                    className="px-2 py-1"
                                                >
                                                    Remove
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Bio Section */}
                    <div>
                        <label className="block text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Biography</label>
                        {isEditing ? (
                            <Input
                                type="textarea"
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Write something about this person..."
                            />
                        ) : (
                            <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                                {person.data.bio || "No biography available."}
                            </div>
                        )}
                    </div>

                    {/* Danger Zone */}
                    {canEdit && (
                        <div className="pt-6 border-t border-slate-100">
                            <Button
                                variant="danger"
                                fullWidth
                                onClick={() => setIsMergeModalOpen(true)}
                                className="bg-white text-red-600 border border-red-200 hover:bg-red-50"
                            >
                                Merge Duplicate Person
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <MergeModal
                isOpen={isMergeModalOpen}
                onClose={() => setIsMergeModalOpen(false)}
                currentPerson={person}
                onMergeSuccess={() => {
                    setIsMergeModalOpen(false);
                    onClose(); // Close side panel as this person might be the one kept, but let's just close to refresh
                    if (onUpdate) onUpdate();
                }}
            />

            <AddRelationshipModal
                isOpen={isAddRelationshipOpen}
                onClose={() => setIsAddRelationshipOpen(false)}
                currentPerson={person}
                onSuccess={() => {
                    setIsAddRelationshipOpen(false);
                    fetchRelationships();
                    if (onUpdate) onUpdate();
                }}
            />
        </>
    );
};

export default SidePanel;
