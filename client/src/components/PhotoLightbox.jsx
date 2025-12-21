import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../auth';
import { X, Calendar, MapPin, User, Info, ChevronLeft, ChevronRight, BookOpen, Flag, FolderPlus, Folder, MessageCircle, Edit, Save, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePhotoDetails } from '../hooks/usePhotoDetails';
import CommentSection from './comments/CommentSection';
import LocationSelector from './LocationSelector';
import { Input, Button } from './ui';

const PhotoLightbox = ({ photo, onClose, onNext, onPrev, hasNext, hasPrev, onAddToAlbum }) => {
    const { stories, events } = usePhotoDetails(photo?.id);
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [showMobileDetails, setShowMobileDetails] = useState(false);
    const [editData, setEditData] = useState({});

    useEffect(() => {
        if (photo) {
            setEditData({
                caption: photo.caption || '',
                date: photo.date ? new Date(photo.date).toISOString().split('T')[0] : '',
                location: photo.location_name || photo.location || '',
                latitude: photo.latitude || null,
                longitude: photo.longitude || null,
                location_name: photo.location_name || photo.location || ''
            });
            setIsEditing(false);

            // Disable background scrolling when lightbox is open
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = 'unset';
            };
        }
    }, [photo]);

    // Update Mutation
    const updateMutation = useMutation({
        mutationFn: async (updates) => {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/photos/${photo.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(updates)
            });

            if (!response.ok) throw new Error('Failed to update photo');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['photos']);
            queryClient.invalidateQueries(['tree-photos']);
            setIsEditing(false);
        }
    });

    // Fetch albums this photo is in
    const { data: photoAlbums } = useQuery({
        queryKey: ['photo-albums', photo?.id],
        queryFn: async () => {
            if (!photo?.id) return [];
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/photo/${photo.id}/albums`, {
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });
            if (!response.ok) return [];
            return response.json();
        },
        enabled: !!photo?.id
    });

    const handleSave = () => {
        updateMutation.mutate({
            caption: editData.caption,
            taken_date: editData.date || null,
            location_name: editData.location, // Use location string
            latitude: editData.latitude,
            longitude: editData.longitude
        });
    };

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isEditing) return; // Disable shortcuts while editing
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight' && onNext) onNext();
            if (e.key === 'ArrowLeft' && onPrev) onPrev();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose, onNext, onPrev, isEditing]);

    if (!photo) return null;

    return createPortal(
        <div
            className="fixed inset-x-0 bottom-0 top-16 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fadeIn group"
            onClick={onClose}
        >
            {/* Mobile Controls Overlay */}
            <div className="absolute top-4 right-4 flex items-center gap-3 md:hidden z-[110]">
                {/* Info Toggle */}
                <button
                    onClick={(e) => { e.stopPropagation(); setShowMobileDetails(!showMobileDetails); }}
                    className={`p-2.5 rounded-full transition-all shadow-lg backdrop-blur-md ${showMobileDetails ? 'bg-teal-600 text-white' : 'bg-black/40 text-white/90 hover:bg-black/60'}`}
                    aria-label="Toggle details"
                >
                    <Info className="w-7 h-7" />
                </button>
                {/* Close Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="p-2.5 bg-black/40 text-white/90 hover:bg-black/60 rounded-full transition-all shadow-lg backdrop-blur-md"
                    aria-label="Close lightbox"
                >
                    <X className="w-7 h-7" />
                </button>
            </div>


            <div
                className="flex flex-col md:flex-row w-full h-full max-w-[1700px] mx-auto overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Image Area */}
                <div className="flex-1 relative flex items-center justify-center p-4 bg-black/20 h-full min-h-0">
                    {/* Navigation Buttons inside Image Area to avoid sidebar overlap */}
                    {hasPrev && !isEditing && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onPrev(); }}
                            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 p-2 md:p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-50 group/nav"
                            aria-label="Previous photo"
                        >
                            <ChevronLeft className="w-8 h-8 md:w-10 md:h-10 transition-transform group-hover/nav:-translate-x-1" />
                        </button>
                    )}

                    {hasNext && !isEditing && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onNext(); }}
                            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 p-2 md:p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-50 group/nav"
                            aria-label="Next photo"
                        >
                            <ChevronRight className="w-8 h-8 md:w-10 md:h-10 transition-transform group-hover/nav:translate-x-1" />
                        </button>
                    )}

                    <img
                        src={photo.url}
                        alt={photo.caption || 'Family photo'}
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                    />
                </div>

                <div className={`
                    w-full md:w-[400px] lg:w-[450px] bg-white/10 backdrop-blur-md border-t md:border-t-0 md:border-l border-white/10 p-6 flex-col gap-6 text-white overflow-y-auto shrink-0 relative custom-scrollbar
                    ${showMobileDetails ? 'flex fixed inset-x-0 bottom-0 h-[60vh] z-[120] animate-slideUp' : 'hidden md:flex'}
                `}>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                {isEditing ? (
                                    <Input
                                        value={editData.caption}
                                        onChange={(e) => setEditData({ ...editData, caption: e.target.value })}
                                        placeholder="Add a caption..."
                                        className="bg-white/10 border-white/20 text-white placeholder-white/40 w-full"
                                    />
                                ) : (
                                    <h2 className="text-xl font-bold break-words pr-2 leading-tight">{photo.caption || 'Untitled Photo'}</h2>
                                )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {!isEditing ? (
                                    <>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
                                            title="Edit Photo"
                                        >
                                            <Edit className="w-5 h-5" />
                                        </button>
                                        {onAddToAlbum && (
                                            <button
                                                onClick={() => onAddToAlbum(photo.id)}
                                                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
                                                title="Add to Album"
                                            >
                                                <FolderPlus className="w-5 h-5" />
                                            </button>
                                        )}
                                        {/* Desktop Close Button - Perfectly aligned and safe from scrollbar */}
                                        <button
                                            onClick={onClose}
                                            className="hidden md:flex p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white border border-white/10 mr-1"
                                            title="Close"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleSave}
                                            className="p-2 bg-teal-600 hover:bg-teal-50 rounded-lg transition-colors text-white shadow-lg"
                                            title="Save Changes"
                                        >
                                            <Check className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white/80"
                                            title="Cancel"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
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
                        {/* Date Field */}
                        {isEditing ? (
                            <div>
                                <label className="block text-xs font-medium text-white/50 mb-1">Date Taken</label>
                                <Input
                                    type="date"
                                    value={editData.date}
                                    onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                                    className="bg-white/10 border-white/20 text-white"
                                />
                            </div>
                        ) : (
                            photo.date && (
                                <div className="flex items-center gap-3 text-white/80">
                                    <Calendar className="w-5 h-5 text-teal-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-white/50">Date Taken</p>
                                        <span>{new Date(photo.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    </div>
                                </div>
                            )
                        )}

                        {/* Location Field */}
                        {isEditing ? (
                            <div>
                                <label className="block text-xs font-medium text-white/50 mb-1">Location</label>
                                <div className="lightbox-location-selector">
                                    <LocationSelector
                                        selectedLocations={editData.location ? [{ id: 'current', name: editData.location }] : []}
                                        onAdd={(location) => {
                                            setEditData({
                                                ...editData,
                                                location: location.name,
                                                latitude: location.latitude,
                                                longitude: location.longitude
                                            });
                                        }}
                                        onRemove={() => {
                                            setEditData({
                                                ...editData,
                                                location: '',
                                                latitude: null,
                                                longitude: null
                                            });
                                        }}
                                    />
                                </div>
                            </div>
                        ) : (
                            (photo.location_name || photo.location) && (
                                <div className="flex items-center gap-3 text-white/80">
                                    <MapPin className="w-5 h-5 text-teal-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-white/50">Location</p>
                                        <span>{photo.location_name || photo.location}</span>
                                    </div>
                                </div>
                            )
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
                                                {story.locations && story.locations.length > 0 && (
                                                    <p className="text-xs text-teal-300 flex items-center gap-1 mt-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {story.locations.map(loc => loc.name).join(', ')}
                                                    </p>
                                                )}
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
                                            <p className="text-sm font-medium text-white">{event.event_type.replace('_', ' ')}</p>
                                            {event.event_date && (
                                                <p className="text-xs text-white/60">
                                                    {new Date(event.event_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </p>
                                            )}
                                            {event.location_name && (
                                                <p className="text-xs text-teal-300 flex items-center gap-1 mt-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {event.location_name}
                                                </p>
                                            )}
                                        </div>
                                    ))}</div>
                            </div>
                        )}

                        {/* Albums List */}
                        {photoAlbums && photoAlbums.length > 0 && (
                            <div className="space-y-2 pt-4 border-t border-white/10">
                                <div className="flex items-center gap-3 text-white/80 mb-1">
                                    <Folder className="w-5 h-5 text-teal-400 shrink-0" />
                                    <span className="font-medium">In Albums</span>
                                </div>
                                <div className="pl-8 flex flex-wrap gap-2">
                                    {photoAlbums.map(album => (
                                        <Link
                                            key={album.id}
                                            to={`/tree/${photo.tree_id}/album/${album.id}`}
                                            onClick={onClose}
                                            className="px-2 py-1 bg-white/10 rounded-md text-xs hover:bg-white/20 transition-colors text-white flex items-center gap-1"
                                        >
                                            {album.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Comments */}
                        <div className="space-y-2 pt-4 border-t border-white/10">
                            <div className="flex items-center gap-3 text-white/80 mb-1">
                                <MessageCircle className="w-5 h-5 text-teal-400 shrink-0" />
                                <span className="font-medium">Comments</span>
                            </div>
                            <div className="pl-8">
                                <div className="bg-white rounded-lg overflow-hidden h-96">
                                    <CommentSection
                                        resourceType="photo"
                                        resourceId={photo.id}
                                        treeId={photo.tree_id}
                                    />
                                </div>
                            </div>
                        </div>
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
            {/* Custom Styles for overlapping issues */}
            <style>{`
                .lightbox-location-selector button, 
                .lightbox-location-selector input {
                    background-color: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 255, 255, 0.2);
                    color: white;
                }
                .lightbox-location-selector input::placeholder {
                    color: rgba(255, 255, 255, 0.4);
                }
                .lightbox-location-selector button:hover {
                    background-color: rgba(255, 255, 255, 0.2);
                }
                .lightbox-location-selector .text-slate-900 {
                    color: white !important;
                }
                .lightbox-location-selector .text-slate-400 {
                    color: rgba(255, 255, 255, 0.5) !important;
                }
                .lightbox-location-selector .bg-white {
                    background-color: #334155 !important;
                    border-color: #475569 !important;
                }
                .lightbox-location-selector .hover\\:bg-slate-50:hover {
                    background-color: #475569 !important;
                }
             `}</style>
        </div>,
        document.body
    );
};

export default PhotoLightbox;
