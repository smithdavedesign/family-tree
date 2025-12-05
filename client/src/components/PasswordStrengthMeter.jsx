import React from 'react';
import { calculatePasswordStrength } from '../utils/passwordValidation';

/**
 * Visual password strength meter
 */
const PasswordStrengthMeter = ({ password }) => {
    if (!password) return null;

    const { score, label, color } = calculatePasswordStrength(password);

    const colorClasses = {
        red: 'bg-red-500',
        orange: 'bg-orange-500',
        yellow: 'bg-yellow-500',
        green: 'bg-green-500',
        gray: 'bg-slate-300',
    };

    const textColorClasses = {
        red: 'text-red-700',
        orange: 'text-orange-700',
        yellow: 'text-yellow-700',
        green: 'text-green-700',
        gray: 'text-slate-600',
    };

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Password strength:</span>
                <span className={`text-sm font-semibold ${textColorClasses[color]}`}>
                    {label}
                </span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                    className={`h-full ${colorClasses[color]} transition-all duration-300`}
                    style={{ width: `${score}%` }}
                />
            </div>
        </div>
    );
};

export default PasswordStrengthMeter;
