import React, { useState } from 'react';
import PhotoPicker from '../components/PhotoPicker';

const PhotoPickerTest = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
                <h1 className="text-3xl font-bold mb-6">Photo Picker Test</h1>

                <button
                    onClick={() => {
                        console.log('Opening photo picker...');
                        setIsOpen(true);
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                    Open Photo Picker
                </button>

                <div className="mt-6">
                    <p className="text-sm text-gray-600">
                        isOpen state: <strong>{isOpen ? 'true' : 'false'}</strong>
                    </p>
                </div>

                {selectedPhoto && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h3 className="font-semibold text-green-900 mb-2">Selected Photo:</h3>
                        <p className="text-sm text-gray-700">ID: {selectedPhoto.id}</p>
                        <p className="text-sm text-gray-700">Filename: {selectedPhoto.filename}</p>
                        {selectedPhoto.baseUrl && (
                            <img src={selectedPhoto.baseUrl} alt="Selected" className="mt-4 max-w-xs rounded-lg" />
                        )}
                    </div>
                )}
            </div>

            <PhotoPicker
                isOpen={isOpen}
                onClose={() => {
                    console.log('Closing photo picker...');
                    setIsOpen(false);
                }}
                onSelect={(photo) => {
                    console.log('Photo selected:', photo);
                    setSelectedPhoto(photo);
                    setIsOpen(false);
                }}
            />
        </div>
    );
};

export default PhotoPickerTest;
