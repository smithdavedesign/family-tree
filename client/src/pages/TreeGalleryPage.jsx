
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Breadcrumbs from '../components/Breadcrumbs';
import { supabase } from '../auth';
import { Loader, Image as ImageIcon, Filter, Calendar, User, FolderPlus, X } from 'lucide-react';
import { useTreePhotos, useTreeDetails } from '../hooks/useTreePhotos';
import { groupPhotosByDate, groupPhotosByPerson, filterPhotos, getUniquePersons } from '../utils/photoUtils';
import VirtualGallery from '../components/VirtualGallery';
import AccountSettings from '../components/AccountSettings';
import PhotoLightbox from '../components/PhotoLightbox';
import AlbumSelectorModal from '../components/AlbumSelectorModal';
import { Button, useToast } from '../components/ui';

const TreeGalleryPage = () => {
    const { id: treeId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [user, setUser] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    // Selection State
    const [selectedPhotoIds, setSelectedPhotoIds] = useState(new Set());
    const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
    const [albumModalPhotoIds, setAlbumModalPhotoIds] = useState([]);

    // Fetch Data using React Query
    const { data: photos = [], isLoading: photosLoading, error: photosError } = useTreePhotos(treeId);
    const { data: treeData, isLoading: treeLoading } = useTreeDetails(treeId);

    // View State
    const [groupBy, setGroupBy] = useState('date'); // 'date' | 'person'
    const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'
    const [filterPerson, setFilterPerson] = useState('all');

    // Load User (Legacy auth check, can be improved)
    React.useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    }, []);

    // Memoized Data Processing
    const filteredPhotos = useMemo(() => {
        return filterPhotos(photos, filterPerson);
    }, [photos, filterPerson]);

    const groupedPhotos = useMemo(() => {
        if (groupBy === 'person') {
            return groupPhotosByPerson(filteredPhotos);
        } else {
            return groupPhotosByDate(filteredPhotos, sortOrder);
        }
    }, [filteredPhotos, groupBy, sortOrder]);

    const persons = useMemo(() => getUniquePersons(photos), [photos]);

    const isLoading = photosLoading || treeLoading;
    const error = photosError;

    const handlePhotoClick = (photo) => {
        // If in selection mode (at least one selected), clicking toggles selection
        if (selectedPhotoIds.size > 0) {
            handleToggleSelect(photo.id);
        } else {
            setSelectedPhoto(photo);
        }
    };

    const handleToggleSelect = (photoId) => {
        const newSet = new Set(selectedPhotoIds);
        if (newSet.has(photoId)) {
            newSet.delete(photoId);
        } else {
            newSet.add(photoId);
        }
        setSelectedPhotoIds(newSet);
    };

    const handleAddToAlbum = (photoId) => {
        setAlbumModalPhotoIds([photoId]);
        setIsAlbumModalOpen(true);
    };

    const handleBulkAddToAlbum = () => {
        if (selectedPhotoIds.size === 0) return;
        setAlbumModalPhotoIds(Array.from(selectedPhotoIds));
        setIsAlbumModalOpen(true);
    };

    const clearSelection = () => {
        setSelectedPhotoIds(new Set());
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader className="w-8 h-8 text-teal-600 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
                    <p className="text-slate-600 mb-4">{error.message}</p>
                    <button
                        onClick={() => navigate('/trees')}
                        className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const treeName = treeData?.name || 'Tree';

    return (
        <div className="min-h-screen bg-slate-50 h-screen flex flex-col">
            <Navbar
                user={user}
                onOpenSettings={() => setShowSettings(true)}
                leftContent={
                    <Breadcrumbs
                        inline
                        showHome={false}
                        items={[
                            { label: treeName, href: `/tree/${treeId}` },
                            { label: 'Photo Gallery' }
                        ]}
                    />
                }
            />

            {/* Header / Controls */}
            <div className="bg-white border-b border-slate-200 shadow-sm flex-shrink-0 z-20">
                <div className="w-full px-4 py-3 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <ImageIcon className="w-6 h-6 text-teal-600" />
                            Photo Gallery
                        </h1>
                        <span className="text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            {filteredPhotos.length} items
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Bulk Actions */}
                        {selectedPhotoIds.size > 0 && (
                            <div className="flex items-center gap-2 mr-4 animate-in fade-in slide-in-from-top-2">
                                <span className="text-sm font-medium text-slate-700">
                                    {selectedPhotoIds.size} selected
                                </span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleBulkAddToAlbum}
                                    className="flex items-center gap-2"
                                >
                                    <FolderPlus className="w-4 h-4" />
                                    Add to Album
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={clearSelection}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        )}

                        {/* Group By Toggle */}
                        <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                            <button
                                onClick={() => setGroupBy('date')}
                                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${groupBy === 'date' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <Calendar className="w-4 h-4" />
                                Date
                            </button>
                            <button
                                onClick={() => setGroupBy('person')}
                                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${groupBy === 'person' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <User className="w-4 h-4" />
                                Person
                            </button>
                        </div>

                        {/* Person Filter */}
                        <div className="relative">
                            <select
                                value={filterPerson}
                                onChange={(e) => setFilterPerson(e.target.value)}
                                className="pl-9 pr-8 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 appearance-none cursor-pointer hover:bg-slate-50"
                            >
                                <option value="all">All People</option>
                                {persons.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Gallery Grid (Virtualized) */}
            <div className="flex-1 overflow-hidden">
                <div className="w-full px-4 h-full">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                        </div>
                    ) : (
                        groupedPhotos.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ImageIcon className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900">No photos found</h3>
                                <p className="text-slate-500 mt-1">Try adjusting your filters or upload some photos to your tree.</p>
                            </div>
                        ) : (
                            <VirtualGallery
                                groups={groupedPhotos}
                                groupBy={groupBy}
                                onPhotoClick={handlePhotoClick}
                                selectedIds={selectedPhotoIds}
                                onToggleSelect={handleToggleSelect}
                                onAddToAlbum={handleAddToAlbum}
                            />
                        )
                    )}
                </div>
            </div>

            {/* Lightbox */}
            {selectedPhoto && (
                <PhotoLightbox
                    photo={selectedPhoto}
                    onClose={() => setSelectedPhoto(null)}
                    onNext={() => {
                        const currentIndex = filteredPhotos.findIndex(p => p.id === selectedPhoto.id);
                        if (currentIndex < filteredPhotos.length - 1) {
                            setSelectedPhoto(filteredPhotos[currentIndex + 1]);
                        }
                    }}
                    onPrev={() => {
                        const currentIndex = filteredPhotos.findIndex(p => p.id === selectedPhoto.id);
                        if (currentIndex > 0) {
                            setSelectedPhoto(filteredPhotos[currentIndex - 1]);
                        }
                    }}
                    hasNext={filteredPhotos.findIndex(p => p.id === selectedPhoto.id) < filteredPhotos.length - 1}
                    hasPrev={filteredPhotos.findIndex(p => p.id === selectedPhoto.id) > 0}
                    onAddToAlbum={() => handleAddToAlbum(selectedPhoto.id)}
                />
            )}

            {/* Album Selector Modal */}
            {isAlbumModalOpen && (
                <AlbumSelectorModal
                    isOpen={isAlbumModalOpen}
                    onClose={() => {
                        setIsAlbumModalOpen(false);
                        setAlbumModalPhotoIds([]);
                        // Optionally clear selection after adding
                        if (selectedPhotoIds.size > 0) {
                            clearSelection();
                        }
                    }}
                    photoIds={albumModalPhotoIds}
                    treeId={treeId}
                />
            )}

            {/* Account Settings Modal */}
            {showSettings && (
                <AccountSettings
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                    user={user}
                />
            )}
        </div>
    );
};

export default TreeGalleryPage;
