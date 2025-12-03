import React, { useState, useEffect } from 'react';
import { FileText, Upload, HardDrive, AlertCircle, Loader2, Check } from 'lucide-react';
import { Modal, Button, Input, toast } from './ui';
import { supabase } from '../auth';

const DocumentPicker = ({ isOpen, onClose, onSelect }) => {
    const [activeTab, setActiveTab] = useState('drive'); // 'drive' or 'upload'
    const [pickerReady, setPickerReady] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [localFile, setLocalFile] = useState(null);
    const [localTitle, setLocalTitle] = useState('');
    const [error, setError] = useState(null);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setLocalFile(null);
            setLocalTitle('');
            setError(null);
            setUploading(false);
        }
    }, [isOpen]);

    // Load Google Picker API
    useEffect(() => {
        if (!isOpen) return;

        if (window.gapi?.client?.picker) {
            setPickerReady(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.async = true;
        script.defer = true;

        script.onload = () => {
            window.gapi.load('picker', {
                callback: () => {
                    console.log('Google Picker API loaded');
                    setPickerReady(true);
                },
                onerror: (err) => {
                    console.error('Error loading picker:', err);
                    setError('Failed to load Google Picker');
                }
            });
        };

        if (!document.querySelector('script[src="https://apis.google.com/js/api.js"]')) {
            document.body.appendChild(script);
        }
    }, [isOpen]);

    const openDrivePicker = () => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

        if (!clientId || !apiKey) {
            setError('Google configuration missing');
            return;
        }

        const storedSession = JSON.parse(localStorage.getItem('roots_branches_session') || '{}');
        const accessToken = storedSession.provider_token;

        if (!accessToken) {
            setError('Please sign in with Google first');
            return;
        }

        try {
            const picker = new window.google.picker.PickerBuilder()
                .addView(window.google.picker.ViewId.DOCS)
                .setOAuthToken(accessToken)
                .setDeveloperKey(apiKey)
                .setOrigin(window.location.protocol + '//' + window.location.host)
                .setCallback((data) => {
                    if (data.action === window.google.picker.Action.PICKED) {
                        const doc = data.docs[0];
                        onSelect({
                            url: doc.url,
                            title: doc.name,
                            type: doc.mimeType,
                            source: 'google_drive',
                            external_id: doc.id,
                            description: doc.description || ''
                        });
                    }
                })
                .build();

            // Show the picker first
            picker.setVisible(true);

            // Then close the modal after a brief delay to ensure picker is rendered
            setTimeout(() => onClose(), 100);
        } catch (err) {
            console.error('Error opening picker:', err);
            setError('Failed to open picker: ' + err.message);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLocalFile(file);
            setLocalTitle(file.name.split('.')[0]); // Default title from filename
        }
    };

    const handleLocalUpload = async () => {
        if (!localFile) return;
        setUploading(true);
        setError(null);

        try {
            // 1. Upload to Supabase Storage
            // Use a folder structure: {userId}/{timestamp}-{filename} to avoid collisions
            // Actually, we might not have userId easily accessible here without context, 
            // but we can use a random ID or just timestamp.
            const filename = `${Date.now()}-${localFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

            const { data, error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filename, localFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(filename);

            onSelect({
                url: publicUrl,
                title: localTitle || localFile.name,
                type: localFile.type,
                source: 'upload',
                description: ''
            });
            onClose();
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add Document"
            size="md"
        >
            <div className="p-4">
                {/* Tabs */}
                <div className="flex border-b border-slate-200 mb-6">
                    <button
                        className={`flex-1 pb-3 text-sm font-medium transition-colors ${activeTab === 'drive'
                            ? 'text-teal-600 border-b-2 border-teal-600'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                        onClick={() => setActiveTab('drive')}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <HardDrive className="w-4 h-4" />
                            Google Drive
                        </div>
                    </button>
                    <button
                        className={`flex-1 pb-3 text-sm font-medium transition-colors ${activeTab === 'upload'
                            ? 'text-teal-600 border-b-2 border-teal-600'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                        onClick={() => setActiveTab('upload')}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Upload className="w-4 h-4" />
                            Upload File
                        </div>
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {activeTab === 'drive' ? (
                    <div className="text-center py-4">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <HardDrive className="w-8 h-8 text-blue-500" />
                        </div>
                        <p className="text-slate-600 mb-6">
                            Select a document from your Google Drive.
                        </p>
                        <Button
                            onClick={openDrivePicker}
                            disabled={!pickerReady}
                            fullWidth
                            className="flex items-center justify-center gap-2"
                        >
                            {pickerReady ? 'Open Google Drive' : 'Loading...'}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors relative">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex flex-col items-center">
                                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                <p className="text-sm font-medium text-slate-700">
                                    {localFile ? localFile.name : 'Click to select a file'}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    PDF, Word, Images (max 10MB)
                                </p>
                            </div>
                        </div>

                        {localFile && (
                            <Input
                                label="Document Title"
                                value={localTitle}
                                onChange={(e) => setLocalTitle(e.target.value)}
                                placeholder="e.g. Birth Certificate"
                            />
                        )}

                        <div className="flex justify-end pt-2">
                            <Button
                                onClick={handleLocalUpload}
                                disabled={!localFile || uploading}
                                variant="primary"
                                className="w-full"
                            >
                                {uploading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Uploading...
                                    </div>
                                ) : (
                                    'Upload Document'
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default DocumentPicker;
