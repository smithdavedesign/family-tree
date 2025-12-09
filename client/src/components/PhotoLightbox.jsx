import React, { useEffect } from 'react';
import { X, Calendar, MapPin, User, Info, ChevronLeft, ChevronRight, BookOpen, Flag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePhotoDetails } from '../hooks/usePhotoDetails';

const PhotoLightbox = ({ photo, onClose, onNext, onPrev, hasNext, hasPrev }) => {
    const { stories, events } = usePhotoDetails(photo?.id);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight' && onNext) onNext();
            if (e.key === 'ArrowLeft' && onPrev) onPrev();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose, onNext, onPrev]);

    if (!photo) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fadeIn group">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-50"
                aria-label="Close lightbox"
            >
                <X className="w-8 h-8" />
            </button>

            {/* Navigation Buttons */}
            {hasPrev && (
                <button
                    onClick={(e) => { e.stopPropagation(); onPrev(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-50 hidden md:block"
                    aria-label="Previous photo"
                >
                    <ChevronLeft className="w-8 h-8" />
                </button>
            )}

            {hasNext && (
                <button
                    onClick={(e) => { e.stopPropagation(); onNext(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-50 hidden md:block"
                    aria-label="Next photo"
                >
                    <ChevronRight className="w-8 h-8" />
                </button>
            )}

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

                    {/* Associated Person (Primary) */}
                    {photo.person && (
                        <Link
                            to={`/tree/${photo.tree_id}/person/${photo.person.id}`}
                            className="flex items-center gap-3 pb-4 border-b border-white/10 hover:bg-white/5 rounded-lg p-2 -m-2 transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 flex-shrink-0 ring-2 ring-transparent group-hover:ring-white/30 transition-all">
                                {photo.person.photo_url ? (
                                    <img src={photo.person.photo_url} alt={photo.person.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-full h-full p-2 text-white/50" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-white/50">Photo of</p>
                                <p className="font-semibold text-white group-hover:text-teal-300 transition-colors">{photo.person.name}</p>
                            </div>
                        </Link>
                    )}

                    <div className="space-y-4">
                        {photo.date && (
                            <div className="flex items-center gap-3 text-white/80">
                                <Calendar className="w-5 h-5 text-teal-400 shrink-0" />
                                <div>
                                    <p className="text-xs text-white/50">Date Taken</p>
                                    <span>{new Date(photo.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                            </div>
                        )}

                        {photo.location && (
                            <div className="flex items-center gap-3 text-white/80">
                                <MapPin className="w-5 h-5 text-teal-400 shrink-0" />
                                <div>
                                    <p className="text-xs text-white/50">Location</p>
                                    <span>{photo.location}</span>
                                </div>
                            </div>
                        )}

                        {/* Tagged People (Secondary) */}
                        {photo.people && photo.people.length > 0 && (
                            <div className="space-y-2 pt-2">
                                <div className="flex items-center gap-3 text-white/80 mb-1">
                                    <User className="w-5 h-5 text-teal-400 shrink-0" />
                                    <span className="font-medium">Tagged People</span>
                                </div>
                                <div className="flex flex-wrap gap-2 pl-8">
                                    {photo.people.map((person, idx) => (
                                        <span key={idx} className="px-2 py-1 bg-white/10 rounded-md text-xs hover:bg-white/20 transition-colors cursor-default flex items-center gap-1">
                                            {person.photo_url && (
                                                <img src={person.photo_url} alt="" className="w-4 h-4 rounded-full object-cover" />
                                            )}
                                            {person.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Related Stories */}
                        {stories && stories.length > 0 && (
                            <div className="space-y-2 pt-4 border-t border-white/10">
                                <div className="flex items-center gap-3 text-white/80 mb-1">
                                    <BookOpen className="w-5 h-5 text-teal-400 shrink-0" />
                                    <span className="font-medium">Related Stories</span>
                                </div>
                                <div className="pl-8 space-y-2">
                                    {stories.map(story => {
                                        // Extract preview text from story content (first paragraph)
                                        let preview = 'No content';
                                        if (story.content && typeof story.content === 'object' && story.content.content) {
                                            const firstParagraph = story.content.content.find(node => node.type === 'paragraph');
                                            if (firstParagraph && firstParagraph.content) {
                                                preview = firstParagraph.content.map(c => c.text || '').join('');
                                            }
                                        }

                                        return (
                                            <Link
                                                key={story.id}
                                                to={`/story/${story.id}`}
                                                className="block p-2 bg-white/10 rounded-md hover:bg-white/20 transition-colors"
                                            >
                                                <p className="text-sm font-medium text-white">{story.title}</p>
                                                <p className="text-xs text-white/60 truncate">{preview}</p>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Related Events */}
                        {events && events.length > 0 && (
                            <div className="space-y-2 pt-4 border-t border-white/10">
                                <div className="flex items-center gap-3 text-white/80 mb-1">
                                    <Flag className="w-5 h-5 text-teal-400 shrink-0" />
                                    <span className="font-medium">Related Events</span>
                                </div>
                                <div className="pl-8 space-y-2">
                                    {events.map(event => (
                                        <div key={event.id} className="p-2 bg-white/10 rounded-md">
                                            <p className="text-sm font-medium text-white">{event.title}</p>
                                            <p className="text-xs text-white/60">
                                                {new Date(event.date || event.start_date).toLocaleDateString()}
                                            </p>
                                        </div>
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
