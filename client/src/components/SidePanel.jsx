import React, { useState, useEffect } from 'react';
import { X, Plus, Image as ImageIcon } from 'lucide-react';
import PhotoPicker from './PhotoPicker';
import { supabase } from '../auth';

const SidePanel = ({ person, onClose, onUpdate }) => {
    const [media, setMedia] = useState([]);
    const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);
    const [loadingMedia, setLoadingMedia] = useState(false);

    useEffect(() => {
        if (person) {
            fetchMedia();
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
                if (onUpdate) onUpdate(); // Refresh tree to show new profile photo if updated
            }
        } catch (error) {
            console.error("Error saving media:", error);
            alert("Failed to save photo");
        }
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
                        <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden mb-4 border-4 border-white shadow-lg">
                            {person.data.profile_photo_url ? (
                                <img src={person.data.profile_photo_url} alt={person.data.label} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
                            )}
                        </div>
                        <h3 className="text-xl font-bold">{person.data.label}</h3>
                        <p className="text-gray-500">{person.data.subline}</p>
                    </div>

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

                    {/* Placeholder for other details */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-uppercase text-gray-500 font-semibold mb-1">Bio</label>
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
                                {person.data.bio || "No biography available."}
                            </p>
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
