import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Modal, Button } from './ui';

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
                .setOrigin(window.location.protocol + '//' + window.location.host)
                .setCallback((data) => {
                    if (data.action === window.google.picker.Action.PICKED) {
                        const photo = data.docs[0];
                        onSelect({
                            id: photo.id,
                            baseUrl: photo.url,
                            filename: photo.name,
                            mimeType: photo.mimeType
                        });
                    } else if (data.action === window.google.picker.Action.CANCEL) {
                        // User cancelled, no action needed
                    }
                })
                .build();

            // Close the modal before showing the picker to avoid z-index conflicts
            onClose();
            picker.setVisible(true);
        } catch (err) {
            console.error('Error opening picker:', err);
            setError('Failed to open photo picker: ' + err.message);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Select from Google Photos"
            size="md"
        >
            <div className="flex flex-col items-center p-4">
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
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ImageIcon className="w-8 h-8 text-blue-500" />
                        </div>
                        <p className="text-slate-600 mb-4">
                            Click below to open Google Photos and select a photo for this person.
                        </p>
                    </div>
                )}

                <Button
                    onClick={openPicker}
                    disabled={!pickerReady || !!error}
                    fullWidth
                    className="flex items-center justify-center gap-2"
                >
                    <ImageIcon className="w-5 h-5" />
                    {pickerReady ? 'Open Google Photos' : 'Loading...'}
                </Button>

                <p className="text-xs text-slate-500 mt-4 text-center">
                    You'll be able to browse and select photos from your Google Photos library.
                </p>
            </div>
        </Modal>
    );
};

export default PhotoPicker;
