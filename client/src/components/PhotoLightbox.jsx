import React, { useEffect } from 'react';
import { X, Calendar, MapPin, User, Info } from 'lucide-react';

const PhotoLightbox = ({ photo, onClose }) => {
    // Close on escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!photo) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fadeIn">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-50"
                aria-label="Close lightbox"
            >
                <X className="w-8 h-8" />
            </button>

            <div className="flex flex-col md:flex-row w-full h-full max-w-[1600px] mx-auto overflow-hidden">
                {/* Image Area */}
                <div className="flex-1 relative flex items-center justify-center p-4 bg-black/20 h-full min-h-0">
                    <img
                        src={photo.url}
                        alt={photo.caption || 'Family photo'}
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                    />
                </div>

                {/* Info Sidebar (Desktop) / Bottom Sheet (Mobile) */}
                <div className="w-full md:w-80 lg:w-96 bg-white/10 backdrop-blur-md border-t md:border-t-0 md:border-l border-white/10 p-6 flex flex-col gap-6 text-white overflow-y-auto shrink-0">
                    <div>
                        <h2 className="text-xl font-bold mb-2">{photo.caption || 'Untitled Photo'}</h2>
                        {photo.description && (
                            <p className="text-white/70 text-sm leading-relaxed">{photo.description}</p>
                        )}
                    </div>

                    <div className="space-y-4">
                        {photo.date && (
                            <div className="flex items-center gap-3 text-white/80">
                                <Calendar className="w-5 h-5 text-teal-400" />
                                <span>{new Date(photo.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                        )}

                        {photo.location && (
                            <div className="flex items-center gap-3 text-white/80">
                                <MapPin className="w-5 h-5 text-teal-400" />
                                <span>{photo.location}</span>
                            </div>
                        )}

                        {/* Tagged People (Mock data structure for now if not available) */}
                        {photo.people && photo.people.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 text-white/80 mb-1">
                                    <User className="w-5 h-5 text-teal-400" />
                                    <span className="font-medium">Tagged People</span>
                                </div>
                                <div className="flex flex-wrap gap-2 pl-8">
                                    {photo.people.map((person, idx) => (
                                        <span key={idx} className="px-2 py-1 bg-white/10 rounded-md text-xs hover:bg-white/20 transition-colors cursor-default">
                                            {person.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Metadata (Optional) */}
                    <div className="mt-auto pt-6 border-t border-white/10 text-xs text-white/40 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <Info className="w-3 h-3" />
                            <span>Added {new Date(photo.created_at || Date.now()).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PhotoLightbox;
