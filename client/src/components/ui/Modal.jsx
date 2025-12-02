import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const Modal = ({
    isOpen,
    onClose,
    title,
    size = 'md',
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEsc = true,
    children,
    footer,
    className = '',
}) => {
    const modalRef = useRef(null);
    const previousActiveElement = useRef(null);

    // Size styles
    const sizeStyles = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
        full: 'max-w-full mx-4',
    };

    // Handle ESC key
    useEffect(() => {
        if (!isOpen || !closeOnEsc) return;

        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen, closeOnEsc, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem'
            }}
        >
            {/* Backdrop */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(15, 23, 42, 0.5)', // slate-900/50
                    backdropFilter: 'blur(4px)'
                }}
                onClick={closeOnOverlayClick ? onClose : undefined}
                aria-hidden="true"
            />

            {/* Modal */}
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                tabIndex={-1}
                className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizeStyles[size]} max-h-[90vh] flex flex-col ${className}`}
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="flex items-center justify-between p-6 border-b border-slate-200 shrink-0">
                        {title && (
                            <h2
                                id="modal-title"
                                className="text-xl font-semibold text-slate-900"
                            >
                                {title}
                            </h2>
                        )}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="ml-auto p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                aria-label="Close modal"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="p-6 border-t border-slate-200 bg-slate-50 shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default Modal;
