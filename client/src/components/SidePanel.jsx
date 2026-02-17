import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { X, Plus, Image as ImageIcon, Edit, User, Calendar, MapPin, Briefcase, GraduationCap, Heart, Users, FileText, Upload, Check, Camera, Phone, Mail, Home, BookOpen, ExternalLink } from 'lucide-react';
import MergeModal from './MergeModal';
import AddRelationshipModal from './AddRelationshipModal';
import { Button, Input, Select, useToast, Modal } from './ui';
import LocationSelector from './LocationSelector';
import PhotoGallery from './PhotoGallery';
import DocumentGallery from './DocumentGallery';
import LifeEventsList from './LifeEventsList';
import StoryList from './StoryList';
import { supabase } from '../auth';

const SidePanel = ({ person, onClose, onUpdate, onOpenPhotoPicker, userRole = 'viewer' }) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [media, setMedia] = useState([]);
    const [loadingMedia, setLoadingMedia] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [relationships, setRelationships] = useState([]);
    const [loadingRelationships, setLoadingRelationships] = useState(false);
    const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
    const [isAddRelationshipOpen, setIsAddRelationshipOpen] = useState(false);
    const [showPhotoSourceModal, setShowPhotoSourceModal] = useState(false);
    const [pendingRefreshGallery, setPendingRefreshGallery] = useState(null);
    const [isUploadingProfilePhoto, setIsUploadingProfilePhoto] = useState(false);
    const [profilePhotoUrl, setProfilePhotoUrl] = useState(person?.data?.profile_photo_url);
    const [galleryRefreshTrigger, setGalleryRefreshTrigger] = useState(0);

    useEffect(() => {
        if (person) {
            fetchMedia();
            fetchRelationships();
            setProfilePhotoUrl(person.data.profile_photo_url);

            // Helper to handle either raw array or JSON string from server
            const getArrayValue = (val) => {
                if (!val) return [];
                if (Array.isArray(val)) return val;
                if (typeof val === 'string' && val.startsWith('[') && val.endsWith(']')) {
                    try {
                        const parsed = JSON.parse(val);
                        if (Array.isArray(parsed)) return parsed;
                    } catch (e) { }
                }
                if (typeof val === 'string') return val.split('\n').filter(Boolean);
                return [];
            };

            setFormData({
                first_name: person.data.first_name || person.data.label.split(' ')[0],
                last_name: person.data.last_name || person.data.label.split(' ').slice(1).join(' '),
                gender: person.data.gender || '',
                bio: person.data.bio || '',
                dob: person.data.dob || '',
                dod: person.data.dod || '',
                occupation: person.data.occupation || '',
                pob: person.data.pob || '',
                place_of_death: person.data.place_of_death || '',
                cause_of_death: person.data.cause_of_death || '',
                burial_place: person.data.burial_place || '',
                occupation_history: getArrayValue(person.data.occupation_history),
                education: getArrayValue(person.data.education),
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

            // Check for non-success status codes
            if (!response.ok) {
                console.error(`Media fetch failed with status: ${response.status}`);
                setMedia([]);
                return;
            }

            // Check the Content-Type header before attempting to parse as JSON
            const contentType = response.headers.get("content-type");

            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                setMedia(data);
            } else {
                // Handle unexpected content type (e.g., HTML error page)
                console.error("Error: Expected JSON, received unexpected content type:", contentType);
                const text = await response.text();
                console.error("Unexpected response content start:", text.substring(0, 100));
                setMedia([]);
            }
        } catch (error) {
            console.error("Error fetching media:", error);
            setMedia([]);
        } finally {
            setLoadingMedia(false);
        }
    };

    const handleGalleryPhotoAdd = (refreshGallery) => {
        // Show modal to choose between Google Photos and Local File
        setIsUploadingProfilePhoto(false);
        setPendingRefreshGallery(() => refreshGallery);
        setShowPhotoSourceModal(true);
    };

    const handleProfilePhotoClick = () => {
        // Show modal to choose between Google Photos and Local File for profile picture
        setIsUploadingProfilePhoto(true);
        setPendingRefreshGallery(null);
        setShowPhotoSourceModal(true);
    };

    const handleGooglePhotosUpload = () => {
        setShowPhotoSourceModal(false);
        const refreshGallery = pendingRefreshGallery;
        const isProfile = isUploadingProfilePhoto;

        onOpenPhotoPicker(async (googlePhoto) => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;

                const response = await fetch('/api/photos', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        person_id: person.id,
                        url: googlePhoto.baseUrl,
                        google_media_id: googlePhoto.id,
                        taken_date: googlePhoto.mediaMetadata?.creationTime,
                        is_primary: isProfile // Mark as primary if it's a profile photo
                    })
                });

                if (response.ok) {
                    const newPhoto = await response.json();

                    // Optimistically update cache instead of full tree refresh
                    queryClient.setQueryData(['photos', person.id], (old) =>
                        old ? [...old, newPhoto] : [newPhoto]
                    );

                    // If uploading profile photo, also update the profile_photo_url
                    if (isProfile) {
                        await handleSave({ profile_photo_url: googlePhoto.baseUrl });
                        setProfilePhotoUrl(googlePhoto.baseUrl); // Update local state immediately
                        setGalleryRefreshTrigger(prev => prev + 1); // Trigger gallery refresh

                        // Invalidate person query to update profile photo in tree
                        queryClient.invalidateQueries(['person', person.id]);
                        toast.success("Profile picture updated");
                    } else {
                        toast.success("Photo added to gallery");
                        if (refreshGallery) refreshGallery();
                    }

                    // Targeted invalidation instead of full tree refresh
                    queryClient.invalidateQueries(['photos', person.id]);
                } else {
                    toast.error("Failed to add photo");
                }
            } catch (error) {
                console.error("Error adding gallery photo:", error);
                toast.error("Error adding photo");
            }
        });
    };

    const handleLocalFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Check file type
        if (!file.type.startsWith('image/')) {
            toast.error("Please select an image file");
            return;
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be smaller than 5MB");
            return;
        }

        setShowPhotoSourceModal(false);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const formData = new FormData();
            formData.append('person_id', person.id);
            formData.append('photo', file);
            formData.append('caption', file.name);
            formData.append('is_primary', isUploadingProfilePhoto);

            const response = await fetch('/api/photos', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const newPhoto = await response.json();

                // Optimistically update cache instead of full tree refresh
                queryClient.setQueryData(['photos', person.id], (old) =>
                    old ? [...old, newPhoto] : [newPhoto]
                );

                // If uploading profile photo, also update local state
                if (isUploadingProfilePhoto) {
                    setProfilePhotoUrl(newPhoto.url); // Use the new storage URL
                    setGalleryRefreshTrigger(prev => prev + 1); // Trigger gallery refresh

                    // Invalidate person query to update profile photo in tree
                    queryClient.invalidateQueries(['person', person.id]);
                    toast.success("Profile picture updated");
                } else {
                    toast.success("Photo added to gallery");
                    if (pendingRefreshGallery) pendingRefreshGallery();
                }

                // Targeted invalidation instead of full tree refresh
                queryClient.invalidateQueries(['photos', person.id]);
            } else if (response.status === 413) {
                toast.error("File is too large for the server");
            } else {
                toast.error("Failed to upload photo");
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            toast.error("Error adding photo");
        } finally {
            setShowPhotoSourceModal(false);
        }
    };

    const handlePhotoSelect = async (googlePhoto) => {
        // Picker is closed by parent component

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            // Save to database (Legacy/Profile Photo flow)
            // We still use this for the main "Add Photo" button in the header if it exists,
            // or we can migrate that button to use the gallery flow too?
            // The header button usually sets the profile photo.
            // Let's keep this as is for now, but maybe update it to also add to 'photos' table?
            // For now, let's keep the legacy 'media' table usage for the header button 
            // to avoid breaking existing profile photo logic until we fully migrate.

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

            const dataToSave = updates || { ...formData };

            // Ensure array fields are formatted correctly if they came from textareas
            if (!updates) {
                if (typeof dataToSave.occupation_history === 'string') {
                    dataToSave.occupation_history = dataToSave.occupation_history.split('\n').map(s => s.trim()).filter(Boolean);
                }
                if (typeof dataToSave.education === 'string') {
                    dataToSave.education = dataToSave.education.split('\n').map(s => s.trim()).filter(Boolean);
                }
            }

            const response = await fetch(`/api/person/${person.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(dataToSave)
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

    const renderList = (data) => {
        if (!data) return null;
        let items = [];
        if (Array.isArray(data)) {
            items = data;
        } else if (typeof data === 'string') {
            if (data.startsWith('[') && data.endsWith(']')) {
                try {
                    const parsed = JSON.parse(data);
                    items = Array.isArray(parsed) ? parsed : [parsed];
                } catch (e) {
                    items = data.split('\n').filter(Boolean);
                }
            } else {
                items = data.split('\n').filter(Boolean);
            }
        }

        if (items.length === 0) return null;

        return (
            <ul className="list-disc list-inside space-y-1">
                {items.map((item, idx) => (
                    <li key={idx}>{item}</li>
                ))}
            </ul>
        );
    };

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
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                    {/* Profile Section */}
                    <div className="flex flex-col items-center">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Profile Picture</label>
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full bg-slate-100 overflow-hidden border-4 border-white shadow-xl ring-1 ring-slate-100">
                                {profilePhotoUrl ? (
                                    <img src={profilePhotoUrl} alt={person.data.label} className="w-full h-full object-cover" />
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
                                        onClick={handleProfilePhotoClick}
                                        className="rounded-full w-8 h-8 p-0 flex items-center justify-center shadow-lg"
                                        title="Update Profile Picture"
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
                                <div className="flex gap-2 justify-center mt-3">
                                    <Link
                                        to={`/tree/${person.data.tree_id}/person/${person.id}`}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        View Full Profile
                                    </Link>
                                    {canEdit && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsEditing(true)}
                                            className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                                        >
                                            Edit Details
                                        </Button>
                                    )}
                                </div>
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
                        <div className="space-y-6">
                            {/* Vital Statistics */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2 mb-4">Vital Statistics</h4>
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
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Place of Birth</label>
                                        <LocationSelector
                                            selectedLocations={formData.pob ? [{ id: 'current', name: formData.pob }] : []}
                                            onAdd={(loc) => setFormData(prev => ({ ...prev, pob: loc.name }))}
                                            onRemove={() => setFormData(prev => ({ ...prev, pob: '' }))}
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
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Place of Death</label>
                                        <LocationSelector
                                            selectedLocations={formData.place_of_death ? [{ id: 'current', name: formData.place_of_death }] : []}
                                            onAdd={(loc) => setFormData(prev => ({ ...prev, place_of_death: loc.name }))}
                                            onRemove={() => setFormData(prev => ({ ...prev, place_of_death: '' }))}
                                        />
                                    </div>

                                    <div>
                                        <Input
                                            label="Cause of Death"
                                            name="cause_of_death"
                                            value={formData.cause_of_death}
                                            onChange={handleChange}
                                            placeholder="e.g. Natural Causes"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Burial Place</label>
                                        <LocationSelector
                                            selectedLocations={formData.burial_place ? [{ id: 'current', name: formData.burial_place }] : []}
                                            onAdd={(loc) => setFormData(prev => ({ ...prev, burial_place: loc.name }))}
                                            onRemove={() => setFormData(prev => ({ ...prev, burial_place: '' }))}
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <Select
                                            label="Gender"
                                            value={formData.gender}
                                            onChange={(val) => setFormData(prev => ({ ...prev, gender: val }))}
                                            options={[
                                                { value: 'Male', label: 'Male' },
                                                { value: 'Female', label: 'Female' },
                                                { value: 'Other', label: 'Other' }
                                            ]}
                                            fullWidth
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Life & Work */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2 mb-4">Life & Work</h4>
                                <div className="space-y-4">
                                    <Input
                                        label="Primary Occupation"
                                        name="occupation"
                                        value={formData.occupation}
                                        onChange={handleChange}
                                        placeholder="e.g. Engineer"
                                    />

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Occupation History</label>
                                        <textarea
                                            name="occupation_history"
                                            value={Array.isArray(formData.occupation_history) ? formData.occupation_history.join('\n') : formData.occupation_history}
                                            onChange={handleChange}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                                            placeholder="Enter one job per line..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Education</label>
                                        <textarea
                                            name="education"
                                            value={Array.isArray(formData.education) ? formData.education.join('\n') : formData.education}
                                            onChange={handleChange}
                                            rows={2}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                                            placeholder="Enter one school/degree per line..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Biography */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2 mb-4">Biography</h4>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    rows={6}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                                    placeholder="Write a biography..."
                                />
                            </div>
                        </div>
                    )}

                    {!isEditing && (
                        <div className="space-y-6">
                            {/* Vital Statistics */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2 mb-4">Vital Statistics</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Birth</label>
                                        <div className="text-sm text-slate-800 font-medium">{formData.dob ? new Date(formData.dob).toLocaleDateString() : '-'}</div>
                                        <div className="text-xs text-slate-500">{formData.pob}</div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Death</label>
                                        <div className="text-sm text-slate-800 font-medium">{formData.dod ? new Date(formData.dod).toLocaleDateString() : '-'}</div>
                                        <div className="text-xs text-slate-500">{formData.place_of_death}</div>
                                    </div>

                                    {(formData.cause_of_death || formData.burial_place) && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cause of Death</label>
                                                <div className="text-sm text-slate-800">{formData.cause_of_death || '-'}</div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Burial</label>
                                                <div className="text-sm text-slate-800">{formData.burial_place || '-'}</div>
                                            </div>
                                        </>
                                    )}

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Gender</label>
                                        <div className="text-sm text-slate-800">{formData.gender || '-'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Life & Work */}
                            {(formData.occupation || formData.occupation_history || formData.education) && (
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2 mb-4">Life & Work</h4>
                                    <div className="space-y-4">
                                        {formData.occupation && (
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Primary Occupation</label>
                                                <div className="text-sm text-slate-800">{formData.occupation}</div>
                                            </div>
                                        )}
                                        {formData.occupation_history && (
                                            <div className="mb-4">
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Work History</label>
                                                <div className="text-sm text-slate-800 whitespace-pre-wrap">
                                                    {renderList(formData.occupation_history) || <div>{formData.occupation_history}</div>}
                                                </div>
                                            </div>
                                        )}
                                        {formData.education && (
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Education</label>
                                                <div className="text-sm text-slate-800 whitespace-pre-wrap">
                                                    {renderList(formData.education) || <div>{formData.education}</div>}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Biography */}
                            {formData.bio && (
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2 mb-4">Biography</h4>
                                    <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                                        {formData.bio}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Photos Section */}
                    <div>
                        {/* Legacy Media Section (Hidden or kept for backward compat?) 
                            Let's replace the old media list with the new PhotoGallery component 
                            but keep the header "Add Photo" button logic if it was doing something specific.
                            Actually, let's just render PhotoGallery here.
                        */}
                        <PhotoGallery
                            personId={person.id}
                            onAddPhoto={handleGalleryPhotoAdd}
                            canEdit={canEdit}
                            refreshTrigger={galleryRefreshTrigger}
                            onProfileUpdate={(newUrl) => {
                                setProfilePhotoUrl(newUrl);
                                if (onUpdate) onUpdate();
                            }}
                        />

                        <div className="border-t border-slate-100 my-6"></div>

                        <DocumentGallery
                            personId={person.id}
                            canEdit={canEdit}
                        />
                    </div>

                    {/* Relationships Section */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Relationships</h4>
                            {canEdit && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    leftIcon={<Plus className="w-4 h-4" />}
                                    onClick={() => setIsAddRelationshipOpen(true)}
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
                                    // Format relationship type label
                                    const relType = rel.type?.toLowerCase() || '';
                                    let typeLabel = rel.type?.replace('_', ' ') || 'Related to';

                                    // Special handling for common types
                                    if (relType === 'spouse') {
                                        typeLabel = 'Spouse';
                                    } else if (relType === 'partner') {
                                        typeLabel = 'Partner';
                                    } else if (relType === 'sibling') {
                                        typeLabel = 'Sibling';
                                    } else if (relType.includes('parent') && relType.includes('child')) {
                                        // Determine if this person is parent or child
                                        typeLabel = rel.direction === 'from' ? 'Parent of' : 'Child of';
                                    }

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

                    {/* Timeline Section */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2 mb-4">Timeline</h4>
                        <LifeEventsList personId={person.id} treeId={person.data.tree_id} isEditor={canEdit} />
                    </div>

                    {/* Stories Section */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2 mb-4">Stories</h4>
                        <StoryList personId={person.id} treeId={person.data.tree_id} isEditor={canEdit} />
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

            {/* Photo Source Selection Modal */}
            <Modal
                isOpen={showPhotoSourceModal}
                onClose={() => setShowPhotoSourceModal(false)}
                title="Add Photo"
                size="sm"
            >
                <p className="text-sm text-slate-600 mb-6">Choose a photo source:</p>

                <div className="space-y-3">
                    <Button
                        variant="outline"
                        fullWidth
                        leftIcon={<ImageIcon className="w-5 h-5" />}
                        onClick={() => document.getElementById('local-file-input').click()}
                        className="justify-start text-left"
                    >
                        <div>
                            <div className="font-semibold">Upload from Device</div>
                            <div className="text-xs text-slate-500">Choose a photo from your computer</div>
                        </div>
                    </Button>

                    <Button
                        variant="outline"
                        fullWidth
                        leftIcon={<ImageIcon className="w-5 h-5" />}
                        onClick={handleGooglePhotosUpload}
                        className="justify-start text-left"
                    >
                        <div>
                            <div className="font-semibold">Google Photos</div>
                            <div className="text-xs text-slate-500">Import from Google Photos</div>
                        </div>
                    </Button>
                </div>

                <div className="mt-6">
                    <Button
                        variant="ghost"
                        fullWidth
                        onClick={() => setShowPhotoSourceModal(false)}
                    >
                        Cancel
                    </Button>
                </div>
            </Modal>

            {/* Hidden file input for local uploads */}
            <input
                id="local-file-input"
                type="file"
                accept="image/*"
                onChange={handleLocalFileUpload}
                style={{ display: 'none' }}
            />
        </>
    );
};

export default SidePanel;
