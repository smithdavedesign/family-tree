import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Star, Image as ImageIcon } from 'lucide-react';
import { Button, useToast } from './ui';
import { supabase } from '../auth';

const PhotoGallery = ({ personId, onAddPhoto, canEdit }) => {
    const { toast } = useToast();
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (personId) {
            fetchPhotos();
        }
    }, [personId]);

    const fetchPhotos = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`/api/person/${personId}/photos`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setPhotos(data);
            }
        } catch (error) {
            console.error("Error fetching photos:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (photoId) => {
        if (!confirm('Are you sure you want to delete this photo?')) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`/api/photos/${photoId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                setPhotos(photos.filter(p => p.id !== photoId));
                toast.success("Photo deleted");
            } else {
                toast.error("Failed to delete photo");
            }
        } catch (error) {
            console.error("Error deleting photo:", error);
            toast.error("Error deleting photo");
        }
    };

    const handleSetPrimary = async (photo) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`/api/photos/${photo.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ is_primary: true })
            });

            if (response.ok) {
                // Update local state
                setPhotos(photos.map(p => ({
                    ...p,
                    is_primary: p.id === photo.id
                })));
                toast.success("Set as primary photo");
            } else {
                toast.error("Failed to update photo");
            }
        } catch (error) {
            console.error("Error updating photo:", error);
            toast.error("Error updating photo");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Photo Gallery</h4>
                {canEdit && (
                    <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Plus className="w-4 h-4" />}
                        onClick={() => onAddPhoto(fetchPhotos)}
                    >
                        Add Photo
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="text-center py-4 text-slate-500 text-sm">Loading photos...</div>
            ) : photos.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No photos yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    {photos.map(photo => (
                        <div key={photo.id} className="group relative aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                            {/* Lazy load images for better performance */}
                            <img
                                src={photo.url}
                                alt={photo.caption || "Family photo"}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                decoding="async"
                            />

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex flex-col justify-between p-2 opacity-0 group-hover:opacity-100">
                                <div className="flex justify-end">
                                    {canEdit && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
                                            className="p-1.5 bg-white/90 rounded-full text-red-600 hover:bg-red-50 transition-colors shadow-sm"
                                            title="Delete photo"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                <div className="flex justify-between items-end">
                                    {canEdit && !photo.is_primary && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleSetPrimary(photo); }}
                                            className="px-2 py-1 bg-white/90 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
                                        >
                                            Make Primary
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Primary Badge */}
                            {photo.is_primary && (
                                <div className="absolute top-2 left-2 bg-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-current" />
                                    Primary
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PhotoGallery;
