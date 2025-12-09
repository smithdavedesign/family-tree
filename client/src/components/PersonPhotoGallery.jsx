import React, { useState } from 'react';
import { Image as ImageIcon, Play } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../auth';
import PhotoLightbox from './PhotoLightbox';

const fetchPersonPhotos = async (personId) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(`/api/person/${personId}/photos`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to fetch photos');
    return response.json();
};

const PersonPhotoGallery = ({ personId }) => {
    const [lightboxIndex, setLightboxIndex] = useState(null);

    const { data: photos = [], isLoading } = useQuery({
        queryKey: ['personPhotos', personId],
        queryFn: () => fetchPersonPhotos(personId),
    });

    // Group photos by year
    const photosByYear = photos.reduce((acc, photo) => {
        if (!photo.taken_date) {
            if (!acc['Unknown']) acc['Unknown'] = [];
            acc['Unknown'].push(photo);
            return acc;
        }

        const year = new Date(photo.taken_date).getFullYear();
        if (!acc[year]) acc[year] = [];
        acc[year].push(photo);
        return acc;
    }, {});

    const years = Object.keys(photosByYear).sort((a, b) => {
        if (a === 'Unknown') return 1;
        if (b === 'Unknown') return -1;
        return b - a; // Newest first
    });

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                    <ImageIcon className="w-6 h-6 text-teal-600" />
                    Photos
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="aspect-square bg-slate-100 rounded-lg animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <ImageIcon className="w-6 h-6 text-teal-600" />
                        Photos
                        <span className="text-lg font-normal text-slate-500">({photos.length})</span>
                    </h2>
                </div>

                {photos.length === 0 ? (
                    <div className="text-center py-12">
                        <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">No photos yet</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {years.map(year => (
                            <div key={year}>
                                <h3 className="text-lg font-semibold text-slate-700 mb-4 sticky top-0 bg-white/95 backdrop-blur-sm py-2 z-10">
                                    {year}
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {photosByYear[year].map((photo, index) => (
                                        <button
                                            key={photo.id}
                                            onClick={() => setLightboxIndex(photos.indexOf(photo))}
                                            className="group relative aspect-square bg-slate-100 rounded-xl overflow-hidden hover:ring-4 hover:ring-teal-500/50 transition-all"
                                        >
                                            <img
                                                src={photo.url}
                                                alt={photo.caption || ''}
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                            />

                                            {/* Overlay on hover */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                                    {photo.caption && (
                                                        <p className="text-white text-sm font-medium line-clamp-2">
                                                            {photo.caption}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Video indicator */}
                                            {photo.type === 'video' && (
                                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full p-2">
                                                    <Play className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Photo Lightbox */}
            {lightboxIndex !== null && photos[lightboxIndex] && (
                <PhotoLightbox
                    photo={photos[lightboxIndex]}
                    onClose={() => setLightboxIndex(null)}
                    onNext={() => setLightboxIndex(prev => prev + 1)}
                    onPrev={() => setLightboxIndex(prev => prev - 1)}
                    hasNext={lightboxIndex < photos.length - 1}
                    hasPrev={lightboxIndex > 0}
                />
            )}
        </>
    );
};

export default PersonPhotoGallery;
