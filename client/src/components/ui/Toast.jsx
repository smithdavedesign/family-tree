import React, { createContext, useContext, useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

// Toast Context
const ToastContext = createContext();

// Toast Provider Component
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = (message, options = {}) => {
        const id = Date.now() + Math.random();
        const toast = {
            id,
            message,
            variant: options.variant || 'info',
            duration: options.duration || 3000,
            position: options.position || 'top-right',
            action: options.action,
        };

        setToasts((prev) => [...prev, toast]);

        // Auto-dismiss
        if (toast.duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, toast.duration);
        }

        return id;
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    const toast = {
        success: (message, options) => addToast(message, { ...options, variant: 'success' }),
        error: (message, options) => addToast(message, { ...options, variant: 'error' }),
        warning: (message, options) => addToast(message, { ...options, variant: 'warning' }),
        info: (message, options) => addToast(message, { ...options, variant: 'info' }),
    };

    return (
        <ToastContext.Provider value={{ toast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

// Hook to use toast
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

// Toast Container Component
const ToastContainer = ({ toasts, removeToast }) => {
    // Group toasts by position
    const positions = {
        'top-left': [],
        'top-center': [],
        'top-right': [],
        'bottom-left': [],
        'bottom-center': [],
        'bottom-right': [],
    };

    toasts.forEach((toast) => {
        positions[toast.position].push(toast);
    });

    const positionStyles = {
        'top-left': 'top-20 left-4',
        'top-center': 'top-20 left-1/2 -translate-x-1/2',
        'top-right': 'top-20 right-4',
        'bottom-left': 'bottom-4 left-4',
        'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
        'bottom-right': 'bottom-4 right-4',
    };

    return (
        <>
            {Object.entries(positions).map(([position, positionToasts]) => (
                positionToasts.length > 0 && (
                    <div
                        key={position}
                        className={`fixed z-[11000] flex flex-col gap-2 ${positionStyles[position]}`}
                    >
                        {positionToasts.map((toast) => (
                            <Toast
                                key={toast.id}
                                toast={toast}
                                onClose={() => removeToast(toast.id)}
                            />
                        ))}
                    </div>
                )
            ))}
        </>
    );
};

// Individual Toast Component
const Toast = ({ toast, onClose }) => {
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        if (toast.duration <= 0) return;

        const interval = setInterval(() => {
            setProgress((prev) => {
                const newProgress = prev - (100 / (toast.duration / 100));
                return newProgress < 0 ? 0 : newProgress;
            });
        }, 100);

        return () => clearInterval(interval);
    }, [toast.duration]);

    // Variant styles
    const variantStyles = {
        success: {
            bg: 'bg-success-50',
            border: 'border-l-4 border-success-500',
            text: 'text-success-900',
            icon: CheckCircle,
            iconColor: 'text-success-500',
            progressBg: 'bg-success-500',
        },
        error: {
            bg: 'bg-error-50',
            border: 'border-l-4 border-error-500',
            text: 'text-error-900',
            icon: AlertCircle,
            iconColor: 'text-error-500',
            progressBg: 'bg-error-500',
        },
        warning: {
            bg: 'bg-warning-50',
            border: 'border-l-4 border-warning-500',
            text: 'text-warning-900',
            icon: AlertTriangle,
            iconColor: 'text-warning-500',
            progressBg: 'bg-warning-500',
        },
        info: {
            bg: 'bg-info-50',
            border: 'border-l-4 border-info-500',
            text: 'text-info-900',
            icon: Info,
            iconColor: 'text-info-500',
            progressBg: 'bg-info-500',
        },
    };

    const style = variantStyles[toast.variant];
    const Icon = style.icon;

    return (
        <div
            className={`${style.bg} ${style.border} ${style.text} rounded-lg shadow-lg p-4 min-w-[300px] max-w-md animate-slideIn`}
            role="alert"
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                <Icon className={`w-5 h-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{toast.message}</p>

                    {/* Action Button */}
                    {toast.action && (
                        <button
                            onClick={toast.action.onClick}
                            className="mt-2 text-sm font-semibold hover:underline"
                        >
                            {toast.action.label}
                        </button>
                    )}
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Progress Bar */}
            {toast.duration > 0 && (
                <div className="mt-2 h-1 bg-black/10 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${style.progressBg} transition-all duration-100 ease-linear`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    );
};

// Standalone toast function for use without context
export const toast = {
    success: (message, options) => {
        console.warn('Toast called without ToastProvider. Wrap your app with <ToastProvider>');
        console.log('Success:', message);
    },
    error: (message, options) => {
        console.warn('Toast called without ToastProvider. Wrap your app with <ToastProvider>');
        console.error('Error:', message);
    },
    warning: (message, options) => {
        console.warn('Toast called without ToastProvider. Wrap your app with <ToastProvider>');
        console.warn('Warning:', message);
    },
    info: (message, options) => {
        console.warn('Toast called without ToastProvider. Wrap your app with <ToastProvider>');
        console.info('Info:', message);
    },
};

export default Toast;
