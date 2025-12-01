import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

const Lightbox = ({ isOpen, onClose, imageUrl, altText }) => {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen || !imageUrl) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                aria-label="Close lightbox"
            >
                <X className="w-6 h-6" />
            </button>

            <div
                className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center"
                onClick={e => e.stopPropagation()}
            >
                <img
                    src={imageUrl}
                    alt={altText || "Full size photo"}
                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                />
                {altText && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-center text-white bg-black/50 backdrop-blur-md rounded-b-lg transform translate-y-full">
                        {altText}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default Lightbox;
