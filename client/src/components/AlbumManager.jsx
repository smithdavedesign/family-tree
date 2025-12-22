import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Calendar, Image as ImageIcon, Lock } from 'lucide-react';
import { Button, Input, Modal, useToast } from './ui';
import { supabase } from '../auth';

const AlbumManager = ({ treeId, userRole, onAlbumClick }) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newAlbum, setNewAlbum] = useState({ name: '', description: '', is_private: false });

    const canEdit = ['owner', 'editor'].includes(userRole);

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
        }
    });

    // Create album mutation
    const createMutation = useMutation({
        mutationFn: async (albumData) => {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/tree/${treeId}/albums`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(albumData)
            });
            if (!response.ok) throw new Error('Failed to create album');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['albums', treeId]);
            setIsCreateModalOpen(false);
            setNewAlbum({ name: '', description: '', is_private: false });
            toast.success('Album created successfully');
        },
        onError: () => {
            toast.error('Failed to create album');
        }
    });

    const handleCreate = () => {
        if (!newAlbum.name.trim()) {
            toast.error('Album name is required');
            return;
        }
        createMutation.mutate(newAlbum);
    };

    // Filter albums by search
    const filteredAlbums = albums.filter(album =>
        album.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Photo Albums</h2>
                    <p className="text-slate-600 mt-1">{albums.length} {albums.length === 1 ? 'album' : 'albums'}</p>
                </div>
                {canEdit && (
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="gap-2"
                        data-testid="create-album-btn"
                    >
                        <Plus className="w-4 h-4" />
                        Create Album
                    </Button>
                )}
            </div>

            {/* Search */}
            <Input
                type="text"
                placeholder="Search albums..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search />}
                className="!rounded-full shadow-sm"
                showClear
            />

            {/* Albums Grid */}
            {filteredAlbums.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">
                        {searchTerm ? 'No albums found' : 'No albums yet'}
                    </h3>
                    <p className="text-slate-500 mb-4">
                        {searchTerm ? 'Try a different search term' : 'Create your first album to organize photos'}
                    </p>
                    {canEdit && !searchTerm && (
                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            data-testid="create-album-btn"
                        >
                            Create Album
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredAlbums.map((album) => (
                        <AlbumCard
                            key={album.id}
                            album={album}
                            onClick={() => onAlbumClick(album.id)}
                        />
                    ))}
                </div>
            )}

            {/* Create Album Modal */}
            {isCreateModalOpen && (
                <Modal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    title="Create New Album"
                >
                    <div className="space-y-4">
                        <div>
                            <Input
                                label="Album Name"
                                type="text"
                                placeholder="e.g., Summer Vacation 1985"
                                value={newAlbum.name}
                                onChange={(e) => setNewAlbum({ ...newAlbum, name: e.target.value })}
                                maxLength={255}
                                required
                            />
                        </div>

                        <div>
                            <Input
                                label="Description"
                                type="textarea"
                                placeholder="Add a description for this album..."
                                value={newAlbum.description}
                                onChange={(e) => setNewAlbum({ ...newAlbum, description: e.target.value })}
                                rows={3}
                                maxLength={2000}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_private"
                                checked={newAlbum.is_private}
                                onChange={(e) => setNewAlbum({ ...newAlbum, is_private: e.target.checked })}
                                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                            />
                            <label htmlFor="is_private" className="text-sm text-slate-700 flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                Private album (only visible to tree owner)
                            </label>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreate}
                                disabled={createMutation.isPending}
                                className="flex-1"
                            >
                                {createMutation.isPending ? 'Creating...' : 'Create Album'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

// Album Card Component
const AlbumCard = ({ album, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-teal-300 hover:shadow-lg transition-all duration-200 text-left"
        >
            {/* Cover Photo or Placeholder */}
            <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
                {album.cover_photo_url ? (
                    <img
                        src={album.cover_photo_url}
                        alt={album.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-slate-300" />
                    </div>
                )}

                {/* Photo Count Badge */}
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" />
                    {album.photo_count}
                </div>

                {/* Private Badge */}
                {album.is_private && (
                    <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Private
                    </div>
                )}
            </div>

            {/* Album Info */}
            <div className="p-4">
                <h3 className="font-semibold text-slate-900 group-hover:text-teal-600 transition-colors line-clamp-1 mb-1">
                    {album.name}
                </h3>
                {album.description && (
                    <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                        {album.description}
                    </p>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3 h-3" />
                    {new Date(album.created_at).toLocaleDateString()}
                </div>
            </div>
        </button>
    );
};

export default AlbumManager;
