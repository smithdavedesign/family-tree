import React, { useState } from 'react';
import { useTreePhotos } from '../hooks/useTreePhotos';
import { Check, Search } from 'lucide-react';

const PhotoSelector = ({ treeId, selectedIds = [], onSelectionChange }) => {
    const { data: photos, isLoading } = useTreePhotos(treeId);
    const [searchTerm, setSearchTerm] = useState('');

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    const filteredPhotos = photos?.filter(photo => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            photo.caption?.toLowerCase().includes(term) ||
            photo.location_name?.toLowerCase().includes(term) ||
            photo.person_name?.toLowerCase().includes(term)
        );
    }) || [];

    const toggleSelection = (photoId) => {
        const newSelection = selectedIds.includes(photoId)
            ? selectedIds.filter(id => id !== photoId)
            : [...selectedIds, photoId];
        onSelectionChange(newSelection);
    };

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search photos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[400px] overflow-y-auto p-1">
                {filteredPhotos.map(photo => {
                    const isSelected = selectedIds.includes(photo.id);
                    return (
                        <div
                            key={photo.id}
                            onClick={() => toggleSelection(photo.id)}
                            className={`
                                relative aspect-square rounded-lg overflow-hidden cursor-pointer group border-2 transition-all
                                ${isSelected ? 'border-teal-500 ring-2 ring-teal-500 ring-offset-1' : 'border-transparent hover:border-slate-300'}
                            `}
                        >
                            <img
                                src={photo.url}
                                alt={photo.caption}
                                className="w-full h-full object-cover"
                            />

                            {/* Selection Overlay */}
                            <div className={`
                                absolute inset-0 bg-black/20 transition-opacity flex items-center justify-center
                                ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                            `}>
                                {isSelected && (
                                    <div className="bg-teal-500 text-white p-1 rounded-full">
                                        <Check className="w-4 h-4" />
                                    </div>
                                )}
                            </div>

                            {/* Caption Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-white text-xs truncate">{photo.caption || 'Untitled'}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="text-xs text-slate-500 text-right">
                {selectedIds.length} photo{selectedIds.length !== 1 ? 's' : ''} selected
            </div>
        </div>
    );
};

export default PhotoSelector;
