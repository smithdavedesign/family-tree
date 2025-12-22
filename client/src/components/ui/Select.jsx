import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Standardized Select component for a premium look and feel.
 * Supports icons, custom styling, and is accessibility-friendly.
 */
const Select = ({
    value,
    onChange,
    options = [],
    placeholder = 'Select an option',
    label,
    error,
    disabled = false,
    className = '',
    fullWidth = false,
    leftIcon,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    const handleToggle = () => {
        if (!disabled) setIsOpen(!isOpen);
    };

    const handleSelect = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div
            ref={containerRef}
            className={`relative flex flex-col gap-1.5 ${fullWidth ? 'w-full' : 'w-64'} ${className}`}
        >
            {label && (
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
                    {label}
                </label>
            )}

            <div className="relative">
                <button
                    type="button"
                    onClick={handleToggle}
                    disabled={disabled}
                    className={`
                        flex items-center justify-between w-full px-4 py-2.5 
                        bg-white border-2 rounded-xl text-left transition-all duration-200
                        ${disabled
                            ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                            : 'border-slate-200 text-slate-700 hover:border-primary-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-50'}
                        ${error ? 'border-error-500 focus:ring-error-50' : ''}
                        ${isOpen ? 'border-primary-500 ring-4 ring-primary-50 shadow-sm' : ''}
                    `}
                >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                        {leftIcon && <span className="text-slate-400 shrink-0">{leftIcon}</span>}
                        {selectedOption?.icon && (
                            <span className="text-primary-600 shrink-0">
                                {React.cloneElement(selectedOption.icon, { size: 18 })}
                            </span>
                        )}
                        <span className="truncate text-sm font-medium">
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-scaleIn origin-top">
                        <div className="max-h-60 overflow-y-auto py-1.5 px-1.5">
                            {options.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-slate-400 italic text-center">
                                    No options available
                                </div>
                            ) : (
                                options.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handleSelect(option.value)}
                                        className={`
                                            flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-left transition-colors
                                            ${option.value === value
                                                ? 'bg-primary-50 text-primary-700'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                                        `}
                                    >
                                        <div className="flex items-center gap-2.5 overflow-hidden font-medium text-sm">
                                            {option.icon && (
                                                <span className={`${option.value === value ? 'text-primary-600' : 'text-slate-400'}`}>
                                                    {React.cloneElement(option.icon, { size: 18 })}
                                                </span>
                                            )}
                                            <span className="truncate">{option.label}</span>
                                        </div>
                                        {option.value === value && (
                                            <Check className="w-4 h-4 text-primary-600 shrink-0" />
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <span className="text-xs font-medium text-error-600 ml-1">
                    {error}
                </span>
            )}
        </div>
    );
};

export default Select;
