import React from 'react';

const LoadingSpinner = ({ size = 'md', message = 'Loading...' }) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16'
    };

    return (
        <div className="flex flex-col items-center justify-center p-8">
            <div className={`${sizeClasses[size]} border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin`}></div>
            {message && <p className="mt-4 text-gray-600 text-sm">{message}</p>}
        </div>
    );
};

export default LoadingSpinner;
