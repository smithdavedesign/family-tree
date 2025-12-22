import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';

const Input = ({
    label,
    placeholder,
    type = 'text',
    variant = 'default',
    error,
    helperText,
    leftIcon,
    rightIcon,
    showClear = false,
    maxLength,
    showCounter = false,
    disabled = false,
    required = false,
    value,
    onChange,
    className = '',
    id,
    name,
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;
    const isTextarea = type === 'textarea';
    const isSelect = props.as === 'select' || type === 'select';
    const isPassword = type === 'password';
    const actualType = isPassword ? (showPassword ? 'text' : 'password') : type;

    // Base styles
    const baseStyles = 'w-full transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

    // Variant styles
    const variantStyles = {
        default: 'border border-slate-300 rounded-lg px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-200',
        filled: 'bg-slate-100 border border-transparent rounded-lg px-3 py-2 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200',
        flushed: 'border-b-2 border-slate-300 px-0 py-2 rounded-none focus:border-primary-500',
    };

    // Error/success styles
    const stateStyles = error
        ? 'border-error-500 focus:border-error-500 focus:ring-error-200'
        : '';

    // Combine classes
    const inputClasses = [
        baseStyles,
        variantStyles[variant],
        stateStyles,
        leftIcon ? '!pl-16' : '',
        (rightIcon || showClear || isPassword || showCounter) ? '!pr-16' : '',
        className,
    ].filter(Boolean).join(' ');

    const handleClear = () => {
        if (onChange) {
            onChange({ target: { value: '', name } });
        }
    };

    let InputElement = 'input';
    if (isTextarea) InputElement = 'textarea';
    if (isSelect) InputElement = 'select';

    return (
        <div className="w-full">
            {/* Label */}
            {label && (
                <label
                    htmlFor={inputId}
                    className={`block text-sm font-medium mb-1.5 transition-colors ${error ? 'text-error-600' : 'text-slate-700'
                        } ${required ? "after:content-['*'] after:ml-0.5 after:text-error-500" : ''}`}
                >
                    {label}
                </label>
            )}

            {/* Input Container */}
            <div className="relative">
                {/* Left Icon */}
                {leftIcon && (
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 flex items-center justify-center pointer-events-none">
                        {React.cloneElement(leftIcon, { className: `w-5 h-5 ${leftIcon.props.className || ''}` })}
                    </div>
                )}

                {/* Input/Textarea/Select */}
                <InputElement
                    id={inputId}
                    name={name}
                    type={!isSelect && !isTextarea ? actualType : undefined}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    maxLength={maxLength}
                    className={inputClasses}
                    rows={isTextarea ? 4 : undefined}
                    {...props}
                >
                    {isSelect ? props.children : null}
                </InputElement>

                {/* Right Icons/Actions */}
                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {/* Character Counter */}
                    {showCounter && maxLength && (
                        <span className="text-xs text-slate-400">
                            {value?.length || 0}/{maxLength}
                        </span>
                    )}

                    {/* Clear Button */}
                    {showClear && value && !disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                            tabIndex={-1}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}

                    {/* Password Toggle */}
                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                            ) : (
                                <Eye className="w-4 h-4" />
                            )}
                        </button>
                    )}

                    {/* Right Icon */}
                    {rightIcon && !showClear && !isPassword && (
                        <div className="text-slate-400">{rightIcon}</div>
                    )}
                </div>
            </div>

            {/* Helper Text / Error Message */}
            {(helperText || error) && (
                <p
                    className={`mt-1.5 text-sm ${error ? 'text-error-600' : 'text-slate-500'
                        }`}
                >
                    {error || helperText}
                </p>
            )}
        </div>
    );
};

export default Input;
