import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    onClick,
    children,
    className = '',
    type = 'button',
    ...props
}) => {
    // Base styles
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    // Variant styles
    const variantStyles = {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500 shadow-sm hover:shadow-md active:scale-95',
        secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 focus-visible:ring-secondary-500 shadow-sm hover:shadow-md active:scale-95',
        outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus-visible:ring-primary-500 active:scale-95',
        ghost: 'text-primary-600 hover:bg-primary-50 focus-visible:ring-primary-500',
        danger: 'bg-error-600 text-white hover:bg-error-700 focus-visible:ring-error-500 shadow-sm hover:shadow-md active:scale-95',
    };

    // Size styles
    const sizeStyles = {
        xs: 'px-2.5 py-1.5 text-xs gap-1',
        sm: 'px-3 py-2 text-sm gap-1.5',
        md: 'px-4 py-2.5 text-sm gap-2',
        lg: 'px-5 py-3 text-base gap-2',
        xl: 'px-6 py-3.5 text-base gap-2.5',
    };

    // Combine classes
    const buttonClasses = [
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? 'w-full' : '',
        className,
    ].filter(Boolean).join(' ');

    // Icon size based on button size
    const iconSize = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
        xl: 'w-5 h-5',
    };

    return (
        <button
            type={type}
            className={buttonClasses}
            onClick={onClick}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <Loader2 className={`${iconSize[size]} animate-spin`} />
            ) : leftIcon ? (
                <span className={iconSize[size]}>{leftIcon}</span>
            ) : null}

            {children}

            {!loading && rightIcon && (
                <span className={iconSize[size]}>{rightIcon}</span>
            )}
        </button>
    );
};

export default Button;
