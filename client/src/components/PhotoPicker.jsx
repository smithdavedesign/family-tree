import React, { useState, useEffect } from 'react';
import { supabase } from '../auth';
import { sessionManager } from '../utils/sessionManager';
import { X, Image as ImageIcon, Loader } from 'lucide-react';

const PhotoPicker = ({ isOpen, onClose, onSelect }) => {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [nextPageToken, setNextPageToken] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setPhotos([]); // Reset photos when opening
            setNextPageToken(null);
            fetchPhotos();
        }
    }, [isOpen]);

    useEffect(() => {
        console.log("PhotoPicker error state changed:", error);
    }, [error]);

    const fetchPhotos = async (pageToken = null) => {
        setLoading(true);
        setError(null);
        try {
            // Try to refresh the session first to get a fresh token
            console.log("Attempting to refresh session for Google Photos...");
            const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();

            if (sessionError) {
                console.error("Session refresh error:", sessionError);
            }

            let providerToken = session?.provider_token;
            console.log("Provider token from refresh:", providerToken ? "Found" : "Missing");

            // If refresh didn't work, try getting current session
            if (!providerToken) {
                console.log("Falling back to current session...");
                const { data: { session: currentSession } } = await supabase.auth.getSession();
                providerToken = currentSession?.provider_token;
                console.log("Provider token from current session:", providerToken ? "Found" : "Missing");
            }

            // Fallback to session manager
            if (!providerToken) {
                console.log("Falling back to sessionManager...");
                const storedSession = sessionManager.getSession();
                providerToken = storedSession?.provider_token;
                console.log("Provider token from sessionManager:", providerToken ? "Found" : "Missing");
            }

            if (!providerToken) {
                console.error("No provider token found. User needs to re-auth.");
                setLoading(false);
                setError('REAUTH_NEEDED');
                console.log("Error state set to REAUTH_NEEDED");
                return;
            }

            let url = 'https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=20';
            if (pageToken) {
                url += `&pageToken=${pageToken}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${providerToken}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    setLoading(false);
                    setError('REAUTH_NEEDED');
                    return;
                }
                const errData = await response.json();
                throw new Error(errData.error?.message || 'Failed to fetch photos');
            }

            const data = await response.json();

            if (pageToken) {
                setPhotos(prev => [...prev, ...(data.mediaItems || [])]);
            } else {
                setPhotos(data.mediaItems || []);
            }

            setNextPageToken(data.nextPageToken || null);
        } catch (err) {
            console.error("Error fetching photos:", err);
            if (err.message === 'REAUTH_NEEDED') {
                setError('REAUTH_NEEDED');
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        if (nextPageToken) {
            fetchPhotos(nextPageToken);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-blue-600" />
                        Select from Google Photos
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {(() => {
                        console.log("PhotoPicker render state:", { loading, error, photosCount: photos.length });
                        return null;
                    })()}
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : error === 'REAUTH_NEEDED' ? (
                        (() => {
                            console.log("Rendering REAUTH_NEEDED UI");
                            return (
                                <div className="text-center p-8">
                                    <div className="mb-4">
                                        <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Google Photos Access Needed</h3>
                                        <p className="text-gray-600 mb-6">
                                            Your Google Photos access has expired or was not granted. Please sign in again to continue adding photos.
                                        </p>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            try {
                                                console.log("Re-authenticating with Google...");
                                                const { signInWithGoogle } = await import('../auth');
                                                await signInWithGoogle();
                                                // After redirect back, the modal will reopen and fetch photos
                                            } catch (err) {
                                                console.error("Re-auth error:", err);
                                                setError("Failed to re-authenticate. Please try again.");
                                            }
                                        }}
                                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                                    >
                                        Re-authenticate with Google Photos
                                    </button>
                                </div>
                            );
                        })()
                    ) : error ? (
                        <div className="text-center text-red-500 p-8">
                            <p>{error}</p>
                            <button onClick={fetchPhotos} className="mt-4 text-blue-600 underline">Try Again</button>
                        </div>
                    ) : photos.length === 0 ? (
                        <div className="text-center text-gray-500 p-8">
                            No photos found in your Google Photos library.
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                            {photos.map((photo) => (
                                <div
                                    key={photo.id}
                                    className="aspect-square relative group cursor-pointer overflow-hidden rounded-lg border hover:border-blue-500"
                                    onClick={() => onSelect(photo)}
                                >
                                    <img
                                        src={`${photo.baseUrl}=w300-h300-c`}
                                        alt={photo.filename}
                                        className="w-full h-full object-cover transition group-hover:scale-105"
                                        loading="lazy"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {nextPageToken && !loading && (
                        <div className="mt-4 flex justify-center">
                            <button
                                onClick={loadMore}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition"
                            >
                                Load More Photos
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PhotoPicker;
