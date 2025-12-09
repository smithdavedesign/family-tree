import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Trash2, Plus, Lock, Image as ImageIcon, X } from 'lucide-react';
import { Button, Modal, useToast } from './ui';
import { supabase } from '../auth';
import PhotoLightbox from './PhotoLightbox';

const AlbumView = ({ albumId, onBack, userRole }) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
    const [editData, setEditData] = useState({ name: '', description: '', is_private: false });

    // Fetch album details
    const { data: album, isLoading } = useQuery({
        queryKey: ['album', albumId],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/album/${albumId}`, {
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch album');
            return response.json();
        },
        onSuccess: (data) => {
            setEditData({
                name: data.name,
                description: data.description || '',
                is_private: data.is_private
            });
        }
    });

    // Update album mutation
    const updateMutation = useMutation({
        mutationFn: async (updates) => {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/album/${albumId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(updates)
            });
            if (!response.ok) throw new Error('Failed to update album');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['album', albumId]);
            queryClient.invalidateQueries(['albums']);
            setIsEditModalOpen(false);
            toast.success('Album updated successfully');
        },
        onError: () => {
            toast.error('Failed to update album');
        }
    });

    // Delete album mutation
    const deleteMutation = useMutation({
        mutationFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/album/${albumId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });
            if (!response.ok) throw new Error('Failed to delete album');
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['albums']);
            toast.success('Album deleted successfully');
            onBack();
        },
        onError: () => {
            toast.error('Failed to delete album');
        }
    });

    // Remove photo mutation
    const removePhotoMutation = useMutation({
        mutationFn: async (photoId) => {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/album/${albumId}/photos/${photoId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });
            if (!response.ok) throw new Error('Failed to remove photo');
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['album', albumId]);
            toast.success('Photo removed from album');
        },
        onError: () => {
            toast.error('Failed to remove photo');
        }
    });

    const handleUpdate = () => {
        if (!editData.name.trim()) {
            toast.error('Album name is required');
            return;
        }
        updateMutation.mutate(editData);
    };

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete "${album?.name}"? Photos will not be deleted.`)) {
            deleteMutation.mutate();
        }
    };

    const handleRemovePhoto = (photoId) => {
        if (confirm('Remove this photo from the album?')) {
            removePhotoMutation.mutate(photoId);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    if (!album) {
        return (
            <div className="text-center py-20">
                <p className="text-slate-600">Album not found</p>
                <Button onClick={onBack} className="mt-4">Go Back</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBack}
                        className="mt-1"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-slate-900">{album.name}</h1>
                            {album.is_private && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-900 text-white rounded-lg text-xs font-medium">
                                    <Lock className="w-3 h-3" />
                                    Private
                                </span>
                            )}
                        </div>
                        {album.description && (
                            <p className="text-slate-600 max-w-2xl">{album.description}</p>
                        )}
                        <p className="text-sm text-slate-500 mt-2">
                            {album.photos.length} {album.photos.length === 1 ? 'photo' : 'photos'}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                {album.permissions?.canEdit && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditModalOpen(true)}
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Button>
                        {album.permissions?.canDelete && (
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={handleDelete}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Photos Grid */}
            {album.photos.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No photos yet</h3>
                    <p className="text-slate-500 mb-4">Add photos to this album from the gallery</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {album.photos.map((photo, index) => (
                        <div
                            key={photo.id}
                            className="group relative aspect-square bg-slate-100 rounded-lg overflow-hidden cursor-pointer"
                            onClick={() => setSelectedPhotoIndex(index)}
                        >
                            <img
                                src={photo.thumbnail_url || photo.url}
                                alt={photo.caption || ''}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                loading="lazy"
                            />

                            {/* Remove button */}
                            {album.permissions?.canEdit && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemovePhoto(photo.id);
                                    }}
                                    className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                                    title="Remove from album"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && (
                <Modal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    title="Edit Album"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Album Name *
                            </label>
                            <input
                                type="text"
                                value={editData.name}
                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                maxLength={255}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Description
                            </label>
                            <textarea
                                value={editData.description}
                                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                rows={3}
                                maxLength={2000}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="edit_is_private"
                                checked={editData.is_private}
                                onChange={(e) => setEditData({ ...editData, is_private: e.target.checked })}
                                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                            />
                            <label htmlFor="edit_is_private" className="text-sm text-slate-700 flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                Private album
                            </label>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setIsEditModalOpen(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpdate}
                                disabled={updateMutation.isPending}
                                className="flex-1"
                            >
                                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Lightbox */}
            {selectedPhotoIndex !== null && (
                <PhotoLightbox
                    photos={album.photos}
                    initialIndex={selectedPhotoIndex}
                    onClose={() => setSelectedPhotoIndex(null)}
                />
            )}
        </div>
    );
};

export default AlbumView;
