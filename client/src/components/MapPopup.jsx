import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../auth';
import { MapPin, Calendar, User, BookOpen, Image as ImageIcon, ExternalLink, Navigation } from 'lucide-react';
import { Button } from './ui';

const MapPopup = ({ photo, onFindNearby, onOpenLightbox }) => {
    const [showNearby, setShowNearby] = useState(false);

    // Fetch albums this photo belongs to
    const { data: albums = [] } = useQuery({
        queryKey: ['photo-albums', photo.id],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/photo/${photo.id}/albums`, {
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });
            if (!response.ok) return [];
            return response.json();
        },
        enabled: !!photo.id
    });

    // Fetch nearby photos count (optional, or just trigger action)
    // For now, we'll just have a button to "Find Nearby" which triggers the parent action

    return (
        <div className="w-64">
            {/* Photo Header */}
            <div className="aspect-video w-full bg-slate-100 rounded-lg overflow-hidden mb-3 relative group">
                <img
                    src={photo.url}
                    alt={photo.caption}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>

            {/* Content */}
            <div className="space-y-3">
                {/* Caption & Date */}
                <div>
                    <h3 className="font-semibold text-slate-900 line-clamp-2 leading-tight">
                        {photo.caption || 'Untitled Photo'}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        {photo.date && (
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(photo.date).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{photo.location || 'Unknown Location'}</span>
                    </div>
                </div>

                {/* Person Attribution */}
                {photo.person && (
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                            {photo.person.photo_url ? (
                                <img src={photo.person.photo_url} alt={photo.person.name} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-full h-full p-1.5 text-slate-400" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-900 truncate">{photo.person.name}</p>
                            <Link
                                to={`/tree/${photo.tree_id}/person/${photo.person.id}`}
                                className="text-[10px] text-teal-600 hover:underline flex items-center gap-0.5"
                            >
                                View Profile <ExternalLink className="w-2 h-2" />
                            </Link>
                        </div>
                    </div>
                )}

                {/* Albums/Stories Links */}
                {albums.length > 0 && (
                    <div className="space-y-1">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Appears In</p>
                        <div className="flex flex-wrap gap-1">
                            {albums.slice(0, 2).map(album => (
                                <Link
                                    key={album.id}
                                    to={`/tree/${photo.tree_id}/album/${album.id}`}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-teal-50 text-teal-700 rounded text-xs hover:bg-teal-100 transition-colors"
                                >
                                    <BookOpen className="w-3 h-3" />
                                    <span className="truncate max-w-[100px]">{album.name}</span>
                                </Link>
                            ))}
                            {albums.length > 2 && (
                                <span className="text-xs text-slate-400 px-1">+{albums.length - 2} more</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                    {onOpenLightbox && (
                        <Button
                            size="xs"
                            variant="primary"
                            className="w-full gap-1"
                            onClick={() => onOpenLightbox(photo)}
                        >
                            <ImageIcon className="w-3 h-3" />
                            View Full Image
                        </Button>
                    )}
                    <Button
                        size="xs"
                        variant="outline"
                        className="w-full gap-1"
                        onClick={() => onFindNearby(photo)}
                    >
                        <Navigation className="w-3 h-3" />
                        Nearby Photos
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default MapPopup;
