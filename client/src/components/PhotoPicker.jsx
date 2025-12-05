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

    const openPicker = async () => {
        try {
            // Fetch config from backend (Runtime Configuration)
            const configResponse = await fetch('/api/config');
            if (!configResponse.ok) throw new Error('Failed to load configuration');

            const config = await configResponse.json();
            const clientId = config.googleClientId;
            const apiKey = config.googleApiKey;

            if (!clientId || !apiKey) {
                setError('Google configuration is missing from backend.');
                return;
            }

            // Get Supabase session for auth
            const storedSession = JSON.parse(localStorage.getItem('roots_branches_session') || '{}');
            const supabaseToken = storedSession.access_token;

            if (!supabaseToken) {
                setError('Please sign in first');
                return;
            }

            // Fetch Google connection token with auth header
            const tokenResponse = await fetch('/api/google/token', {
                headers: {
                    'Authorization': `Bearer ${supabaseToken}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!tokenResponse.ok) {
                if (tokenResponse.status === 404) {
                    setError('not_connected'); // Special flag for UI to show connect button
                    return;
                }
                throw new Error('Failed to get access token');
            }

            const { access_token } = await tokenResponse.json();

            if (!access_token) {
                setError('not_connected');
                return;
            }

            const picker = new window.google.picker.PickerBuilder()
                .addView(window.google.picker.ViewId.PHOTOS)
                .setOAuthToken(access_token)
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

            // Show the picker first
            picker.setVisible(true);

            // TEMPORARILY DISABLED FOR DEBUGGING - Don't close modal yet
            // setTimeout(() => onClose(), 100);
            console.log('Picker should be visible now. Check for iframe in DOM.');
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
            <div className="flex flex-col items-center p-6">
                {/* Coming Soon Banner */}
                <div className="w-full mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg">
                            <ImageIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-base font-bold text-blue-900 mb-2">
                                🚀 Coming Soon: Google Photos Integration
                            </h3>
                            <p className="text-sm text-blue-800 mb-3">
                                We're currently awaiting Google's verification to enable direct access to your Google Photos library.
                            </p>
                            <div className="bg-white/60 rounded-lg p-3 mb-3">
                                <p className="text-xs font-medium text-blue-900 mb-2">What you can do now:</p>
                                <ul className="text-xs text-blue-800 space-y-1.5">
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 mt-0.5">✓</span>
                                        <span>Upload photos directly from your device</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 mt-0.5">✓</span>
                                        <span>Save photos to Google Drive and select them via Documents</span>
                                    </li>
                                </ul>
                            </div>
                            <p className="text-xs text-blue-700">
                                <strong>Expected availability:</strong> 2-4 weeks after verification approval
                            </p>
                        </div>
                    </div>
                </div>

                {/* Disabled Button */}
                <Button
                    disabled
                    fullWidth
                    className="flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
                >
                    <ImageIcon className="w-5 h-5" />
                    Google Photos (Pending Verification)
                </Button>

                <p className="text-xs text-slate-500 mt-4 text-center">
                    Thank you for your patience as we work to bring you this feature!
                </p>
            </div>
        </Modal>
    );
};

export default PhotoPicker;
