import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Plus, Loader } from 'lucide-react';
import { Button, useToast } from './ui';
import { supabase } from '../auth';

const AlbumSelector = ({ photoIds, treeId, onClose }) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedAlbums, setSelectedAlbums] = useState(new Set());
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newAlbumName, setNewAlbumName] = useState('');

    // Fetch existing albums
    const { data: albums = [], isLoading } = useQuery({
        queryKey: ['albums', treeId],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/tree/${treeId}/albums`, {
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch albums');
            return response.json();
        }
    });

    // Add photos to album mutation
    const addPhotosMutation = useMutation({
        mutationFn: async (albumId) => {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/album/${albumId}/photos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ photo_ids: photoIds })
            });
            if (!response.ok) throw new Error('Failed to add photos');
            return response.json();
        }
    });

    // Create album and add photos
    const createAlbumMutation = useMutation({
        mutationFn: async (name) => {
            const { data: { session } } = await supabase.auth.getSession();

            // Create album
            const createResponse = await fetch(`/api/tree/${treeId}/albums`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ name, description: '' })
            });
            if (!createResponse.ok) throw new Error('Failed to create album');
            const newAlbum = await createResponse.json();

            // Add photos
            const addResponse = await fetch(`/api/album/${newAlbum.id}/photos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ photo_ids: photoIds })
            });
            if (!addResponse.ok) throw new Error('Failed to add photos');

            return newAlbum;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['albums', treeId]);
            setIsCreatingNew(false);
            setNewAlbumName('');
            toast.success('Album created and photos added');
        },
        onError: () => {
            toast.error('Failed to create album');
        }
    });

    const toggleAlbum = (albumId) => {
        const newSet = new Set(selectedAlbums);
        if (newSet.has(albumId)) {
            newSet.delete(albumId);
        } else {
            newSet.add(albumId);
        }
        setSelectedAlbums(newSet);
    };

    const handleAddToAlbums = async () => {
        if (selectedAlbums.size === 0) {
            toast.error('Please select at least one album');
            return;
        }

        try {
            await Promise.all(
                Array.from(selectedAlbums).map(albumId =>
                    addPhotosMutation.mutateAsync(albumId)
                )
            );

            queryClient.invalidateQueries(['albums']);
            toast.success(`Added ${photoIds.length} ${photoIds.length === 1 ? 'photo' : 'photos'} to ${selectedAlbums.size} ${selectedAlbums.size === 1 ? 'album' : 'albums'}`);
            onClose();
        } catch (error) {
            toast.error('Failed to add photos to albums');
        }
    };

    const handleCreateNew = () => {
        if (!newAlbumName.trim()) {
            toast.error('Please enter an album name');
            return;
        }
        createAlbumMutation.mutate(newAlbumName);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <Loader className="w-6 h-6 text-teal-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    Add to Albums
                </h3>
                <p className="text-sm text-slate-600">
                    Select albums for {photoIds.length} {photoIds.length === 1 ? 'photo' : 'photos'}
                </p>
            </div>

            {/* Create New Album Section */}
            {!isCreatingNew ? (
                <button
                    onClick={() => setIsCreatingNew(true)}
                    className="w-full p-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-teal-400 hover:bg-teal-50 transition-colors flex items-center justify-center gap-2 text-slate-600 hover:text-teal-600"
                >
                    <Plus className="w-4 h-4" />
                    <span className="font-medium">Create New Album</span>
                </button>
            ) : (
                <div className="p-3 border-2 border-teal-300 bg-teal-50 rounded-lg space-y-2">
                    <input
                        type="text"
                        placeholder="Album name..."
                        value={newAlbumName}
                        onChange={(e) => setNewAlbumName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateNew();
                            if (e.key === 'Escape') {
                                setIsCreatingNew(false);
                                setNewAlbumName('');
                            }
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        autoFocus
                        maxLength={255}
                    />
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                setIsCreatingNew(false);
                                setNewAlbumName('');
                            }}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleCreateNew}
                            disabled={createAlbumMutation.isPending}
                            className="flex-1"
                        >
                            {createAlbumMutation.isPending ? 'Creating...' : 'Create & Add'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Existing Albums List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {albums.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">
                        No albums yet. Create one above.
                    </p>
                ) : (
                    albums.map((album) => (
                        <label
                            key={album.id}
                            className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-teal-300 hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                            <input
                                type="checkbox"
                                checked={selectedAlbums.has(album.id)}
                                onChange={() => toggleAlbum(album.id)}
                                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-slate-900 truncate">
                                    {album.name}
                                </div>
                                <div className="text-xs text-slate-500">
                                    {album.photo_count} {album.photo_count === 1 ? 'photo' : 'photos'}
                                </div>
                            </div>
                            {selectedAlbums.has(album.id) && (
                                <Check className="w-5 h-5 text-teal-600 flex-shrink-0" />
                            )}
                        </label>
                    ))
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
                <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleAddToAlbums}
                    disabled={selectedAlbums.size === 0 || addPhotosMutation.isPending}
                    className="flex-1"
                >
                    {addPhotosMutation.isPending ? 'Adding...' : `Add to ${selectedAlbums.size} ${selectedAlbums.size === 1 ? 'Album' : 'Albums'}`}
                </Button>
            </div>
        </div>
    );
};

export default AlbumSelector;
