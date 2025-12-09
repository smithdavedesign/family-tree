import React, { useState, useMemo } from 'react';
import { Modal, Button } from './ui';
import { useTreePhotos } from '../hooks/useTreePhotos';
import { groupPhotosByDate } from '../utils/photoUtils';
import VirtualGallery from './VirtualGallery';
import { Loader, Search } from 'lucide-react';

const PhotoSelectorModal = ({ isOpen, onClose, treeId, onSelectPhotos, isAdding }) => {
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');

    const { data: photos = [], isLoading } = useTreePhotos(treeId);

    const filteredPhotos = useMemo(() => {
        if (!searchQuery.trim()) return photos;
        const query = searchQuery.toLowerCase();
        return photos.filter(p =>
            (p.caption && p.caption.toLowerCase().includes(query)) ||
            (p.location && p.location.toLowerCase().includes(query)) ||
            (p.person_name && p.person_name.toLowerCase().includes(query))
        );
    }, [photos, searchQuery]);

    const groupedPhotos = useMemo(() => {
        return groupPhotosByDate(filteredPhotos, 'desc');
    }, [filteredPhotos]);

    const handleToggleSelect = (photoId) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(photoId)) {
            newSet.delete(photoId);
        } else {
            newSet.add(photoId);
        }
        setSelectedIds(newSet);
    };

    const handleConfirm = () => {
        onSelectPhotos(Array.from(selectedIds));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Select Photos"
            maxWidth="4xl"
        >
            <div className="flex flex-col h-[70vh]">
                {/* Search Bar */}
                <div className="mb-4 relative">
                    <input
                        type="text"
                        placeholder="Search photos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                {/* Gallery */}
                <div className="flex-1 overflow-hidden bg-slate-50 rounded-lg border border-slate-200 relative">
                    {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader className="w-8 h-8 text-teal-600 animate-spin" />
                        </div>
                    ) : filteredPhotos.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                            No photos found
                        </div>
                    ) : (
                        <VirtualGallery
                            groups={groupedPhotos}
                            groupBy="date"
                            selectedIds={selectedIds}
                            onToggleSelect={handleToggleSelect}
                            onPhotoClick={(photo) => handleToggleSelect(photo.id)}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-4">
                    <div className="text-sm text-slate-600">
                        {selectedIds.size} selected
                    </div>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={selectedIds.size === 0 || isAdding}
                        >
                            {isAdding ? 'Adding...' : `Add ${selectedIds.size} Photos`}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default PhotoSelectorModal;
