import React from 'react';

const Avatar = ({ src, alt, fallback, size = 'md', className = '' }) => {
    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-16 h-16 text-lg',
    };

    return (
        <div
            className={`relative inline-flex items-center justify-center overflow-hidden rounded-full bg-slate-100 ${sizeClasses[size]} ${className}`}
        >
            {src ? (
                <img
                    src={src}
                    alt={alt}
                    className="h-full w-full object-cover"
                />
            ) : (
                <span className="font-medium text-slate-600">
                    {fallback || (alt ? alt[0].toUpperCase() : '?')}
                </span>
            )}
        </div>
    );
};

export default Avatar;
