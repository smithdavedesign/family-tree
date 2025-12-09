import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

const AlbumBadge = ({ albumName, count, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="inline-flex items-center gap-1.5 px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-medium transition-colors"
            title={`${count} ${count === 1 ? 'photo' : 'photos'} in this album`}
        >
            <ImageIcon className="w-3 h-3" />
            <span className="truncate max-w-[120px]">{albumName}</span>
            {count > 1 && (
                <span className="text-teal-600">({count})</span>
            )}
        </button>
    );
};

export default AlbumBadge;
