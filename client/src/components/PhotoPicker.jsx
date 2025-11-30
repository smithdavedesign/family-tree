import React, { useEffect, useState } from 'react';
import { X, Image as ImageIcon, AlertCircle } from 'lucide-react';

const PhotoPicker = ({ isOpen, onClose, onSelect }) => {
    const [pickerReady, setPickerReady] = useState(false);
    const [error, setError] = useState(null);

    console.log('PhotoPicker render - isOpen:', isOpen);

    useEffect(() => {
        if (!isOpen) return;

        // Check if gapi is already loaded
        if (window.gapi?.client?.picker) {
            setPickerReady(true);
            return;
        }

        // Load the Google API script
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.async = true;
        script.defer = true;

        script.onload = () => {
            window.gapi.load('picker', {
                callback: () => {
                    console.log('Google Picker API loaded successfully');
                    setPickerReady(true);
                },
                onerror: (err) => {
                    console.error('Error loading picker:', err);
                    setError('Failed to load Google Picker');
                }
            });
        };

        script.onerror = () => {
            setError('Failed to load Google API script');
        };

        if (!document.querySelector('script[src="https://apis.google.com/js/api.js"]')) {
            document.body.appendChild(script);
        }
    }, [isOpen]);

    const openPicker = () => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

        if (!clientId || !apiKey) {
            setError('Google configuration is missing. Please check your environment variables.');
            return;
        }

        // Get access token from localStorage
        const storedSession = JSON.parse(localStorage.getItem('roots_branches_session') || '{}');
        const accessToken = storedSession.provider_token;

        if (!accessToken) {
            setError('Please sign in with Google first to access your photos.');
            return;
        }

        try {
            const picker = new window.google.picker.PickerBuilder()
                .addView(window.google.picker.ViewId.PHOTOS)
                .setOAuthToken(accessToken)
                .setDeveloperKey(apiKey)
                .setCallback((data) => {
                    if (data.action === window.google.picker.Action.PICKED) {
                        const photo = data.docs[0];
                        onSelect({
                            id: photo.id,
                            baseUrl: photo.url,
                            filename: photo.name,
                            mimeType: photo.mimeType
                        });
                        onClose();
                    } else if (data.action === window.google.picker.Action.CANCEL) {
                        onClose();
                    }
                })
                .build();

            picker.setVisible(true);
        } catch (err) {
            console.error('Error opening picker:', err);
            setError('Failed to open photo picker: ' + err.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-red-500 flex items-center justify-center z-[9999]" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8 flex flex-col items-center border-8 border-blue-500" onClick={(e) => e.stopPropagation()}>
                <div className="w-full flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-blue-600" />
                        Select from Google Photos
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {error ? (
                    <div className="w-full mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-red-900">Error</p>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center mb-6">
                        <ImageIcon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">
                            Click below to open Google Photos and select a photo for this person.
                        </p>
                    </div>
                )}

                <button
                    onClick={openPicker}
                    disabled={!pickerReady || !!error}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                >
                    <ImageIcon className="w-5 h-5" />
                    {pickerReady ? 'Open Google Photos' : 'Loading...'}
                </button>

                <p className="text-sm text-gray-500 mt-4 text-center">
                    You'll be able to browse and select photos from your Google Photos library.
                </p>
            </div>
        </div>
    );
};

export default PhotoPicker;
