import React, { useState, useEffect } from 'react';
import { X, Plus, Image as ImageIcon } from 'lucide-react';
import PhotoPicker from './PhotoPicker';
import { supabase } from '../auth';

const SidePanel = ({ person, onClose, onUpdate }) => {
    const [media, setMedia] = useState([]);
    const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);
    const [loadingMedia, setLoadingMedia] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (person) {
            fetchMedia();
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
        setIsPhotoPickerOpen(false);

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
                if (!person.data.profile_photo_url) {
                    await handleSave({ profile_photo_url: googlePhoto.baseUrl });
                } else if (onUpdate) {
                    onUpdate();
                }
            }
        } catch (error) {
            console.error("Error saving media:", error);
            alert("Failed to save photo");
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
            } else {
                alert("Failed to save changes");
            }
        } catch (error) {
            console.error("Error updating person:", error);
            alert("Error saving changes");
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    if (!person) return null;

    return (
        <>
            <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-40 overflow-y-auto border-l">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Person Details</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                            <X className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>

                    <div className="flex flex-col items-center mb-8">
                        <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden mb-4 border-4 border-white shadow-lg relative group">
                            {person.data.profile_photo_url ? (
                                <img src={person.data.profile_photo_url} alt={person.data.label} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
                            )}
                            <button
                                onClick={() => setIsPhotoPickerOpen(true)}
                                className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white font-medium"
                            >
                                Change Photo
                            </button>
                        </div>

                        {!isEditing ? (
                            <>
                                <h3 className="text-xl font-bold">{person.data.label}</h3>
                                <p className="text-gray-500">{person.data.subline}</p>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="mt-2 text-sm text-blue-600 hover:underline"
                                >
                                    Edit Details
                                </button>
                            </>
                        ) : (
                            <div className="w-full space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500">First Name</label>
                                        <input
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            className="w-full p-2 border rounded text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500">Last Name</label>
                                        <input
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            className="w-full p-2 border rounded text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-2">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleSave()}
                                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {isEditing && (
                        <div className="mb-8 space-y-4 border-t pt-4">
                            <h4 className="font-semibold text-gray-700">Vital Statistics</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Birth Date</label>
                                    <input
                                        type="date"
                                        name="dob"
                                        value={formData.dob ? formData.dob.split('T')[0] : ''}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Death Date</label>
                                    <input
                                        type="date"
                                        name="dod"
                                        value={formData.dod ? formData.dod.split('T')[0] : ''}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Gender</label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded text-sm"
                                    >
                                        <option value="">Select...</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-semibold text-gray-700">Photos</h4>
                            <button
                                onClick={() => setIsPhotoPickerOpen(true)}
                                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                <Plus className="w-4 h-4" /> Add Photo
                            </button>
                        </div>

                        {loadingMedia ? (
                            <div className="text-center py-4 text-gray-500">Loading photos...</div>
                        ) : media.length === 0 ? (
                            <div className="bg-gray-50 rounded-lg p-8 text-center border border-dashed border-gray-300">
                                <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No photos attached yet</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {media.map((item) => (
                                    <div key={item.id} className="aspect-square rounded-lg overflow-hidden border">
                                        <img src={item.url} alt="Attached" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-uppercase text-gray-500 font-semibold mb-1">Bio</label>
                            {isEditing ? (
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full p-3 border rounded text-sm"
                                />
                            ) : (
                                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
                                    {person.data.bio || "No biography available."}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <PhotoPicker
                isOpen={isPhotoPickerOpen}
                onClose={() => setIsPhotoPickerOpen(false)}
                onSelect={handlePhotoSelect}
            />
        </>
    );
};

export default SidePanel;
