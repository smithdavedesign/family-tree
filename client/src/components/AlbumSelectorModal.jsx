import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, FolderPlus, Check } from 'lucide-react';
import { Modal, Button, useToast } from './ui';
import { supabase } from '../auth';

const AlbumSelectorModal = ({ isOpen, onClose, photoIds, treeId }) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedAlbumIds, setSelectedAlbumIds] = useState(new Set());
    const [isCreating, setIsCreating] = useState(false);
    const [newAlbumName, setNewAlbumName] = useState('');

    // Fetch albums
    const { data: albums = [], isLoading } = useQuery({
        queryKey: ['albums', treeId],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/tree/${treeId}/albums`, {
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch albums');
            return response.json();
        },
        enabled: !!treeId && isOpen
    });

    // Create album mutation
    const createAlbumMutation = useMutation({
        mutationFn: async (name) => {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/tree/${treeId}/albums`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ name })
            });
            if (!response.ok) throw new Error('Failed to create album');
            return response.json();
        },
        onSuccess: (newAlbum) => {
            queryClient.invalidateQueries(['albums', treeId]);
            setNewAlbumName('');
            setIsCreating(false);
            // Auto-select the new album
            setSelectedAlbumIds(prev => new Set(prev).add(newAlbum.id));
            toast.success('Album created');
        },
        onError: () => {
            toast.error('Failed to create album');
        }
    });

    // Add photos to albums mutation
    const addToAlbumsMutation = useMutation({
        mutationFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const promises = Array.from(selectedAlbumIds).map(albumId =>
                fetch(`/api/album/${albumId}/photos`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${session?.access_token}`
                    },
                    body: JSON.stringify({ photo_ids: photoIds })
                }).then(res => {
                    if (!res.ok) throw new Error(`Failed to add to album ${albumId}`);
                    return res.json();
                })
            );
            return Promise.all(promises);
        },
        onSuccess: () => {
            // Invalidate all affected albums
            selectedAlbumIds.forEach(albumId => {
                queryClient.invalidateQueries(['album', albumId]);
            });
            queryClient.invalidateQueries(['albums', treeId]);
            toast.success(`Photos added to ${selectedAlbumIds.size} album(s)`);
            onClose();
            setSelectedAlbumIds(new Set());
        },
        onError: () => {
            toast.error('Failed to add photos to some albums');
        }
    });

    const toggleAlbum = (albumId) => {
        const newSet = new Set(selectedAlbumIds);
        if (newSet.has(albumId)) {
            newSet.delete(albumId);
        } else {
            newSet.add(albumId);
        }
        setSelectedAlbumIds(newSet);
    };

    const handleCreateAlbum = (e) => {
        e.preventDefault();
        if (!newAlbumName.trim()) return;
        createAlbumMutation.mutate(newAlbumName);
    };

    const handleSubmit = () => {
        if (selectedAlbumIds.size === 0) return;
        addToAlbumsMutation.mutate();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Add ${photoIds.length} Photo${photoIds.length !== 1 ? 's' : ''} to Album`}
        >
            <div className="space-y-4">
                {/* Create New Album Toggle */}
                {!isCreating ? (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium text-sm w-full p-2 rounded-lg hover:bg-teal-50 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Create New Album
                    </button>
                ) : (
                    <form onSubmit={handleCreateAlbum} className="flex gap-2 p-2 bg-slate-50 rounded-lg">
                        <input
                            type="text"
                            value={newAlbumName}
                            onChange={(e) => setNewAlbumName(e.target.value)}
                            placeholder="Album name"
                            className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            autoFocus
                        />
                        <Button
                            type="submit"
                            size="sm"
                            disabled={createAlbumMutation.isPending || !newAlbumName.trim()}
                        >
                            Create
                        </Button>
                        <button
                            type="button"
                            onClick={() => setIsCreating(false)}
                            className="p-1.5 text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </form>
                )}

                {/* Albums List */}
                <div className="max-h-60 overflow-y-auto space-y-1 border-t border-slate-100 pt-2">
                    {isLoading ? (
                        <div className="text-center py-4 text-slate-500 text-sm">Loading albums...</div>
                    ) : albums.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <FolderPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No albums yet</p>
                        </div>
                    ) : (
                        albums.map(album => (
                            <label
                                key={album.id}
                                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedAlbumIds.has(album.id)
                                        ? 'bg-teal-50 border border-teal-100'
                                        : 'hover:bg-slate-50 border border-transparent'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedAlbumIds.has(album.id)}
                                        onChange={() => toggleAlbum(album.id)}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedAlbumIds.has(album.id)
                                            ? 'bg-teal-600 border-teal-600'
                                            : 'border-slate-300 bg-white'
                                        }`}>
                                        {selectedAlbumIds.has(album.id) && (
                                            <Check className="w-3 h-3 text-white" />
                                        )}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-medium ${selectedAlbumIds.has(album.id) ? 'text-teal-900' : 'text-slate-700'
                                            }`}>
                                            {album.name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {album.photo_count} photos
                                        </p>
                                    </div>
                                </div>
                            </label>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={selectedAlbumIds.size === 0 || addToAlbumsMutation.isPending}
                    >
                        {addToAlbumsMutation.isPending ? 'Adding...' : 'Add Photos'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default AlbumSelectorModal;
