import React from 'react';
import { Check, X } from 'lucide-react';

/**
 * Display password strength requirements with visual indicators
 */
const PasswordRequirements = ({ password }) => {
    const requirements = [
        { id: 'minLength', label: '8+ characters', test: password.length >= 8 },
        { id: 'hasUppercase', label: 'Uppercase letter (A-Z)', test: /[A-Z]/.test(password) },
        { id: 'hasLowercase', label: 'Lowercase letter (a-z)', test: /[a-z]/.test(password) },
        { id: 'hasNumber', label: 'Number (0-9)', test: /\d/.test(password) },
        { id: 'hasSpecial', label: 'Special character (!@#$%...)', test: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password) },
    ];

    return (
        <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Password requirements:</p>
            <ul className="space-y-1.5">
                {requirements.map(({ id, label, test }) => (
                    <li key={id} className="flex items-center gap-2 text-sm">
                        {test ? (
                            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        ) : (
                            <X className="w-4 h-4 text-slate-300 flex-shrink-0" />
                        )}
                        <span className={test ? 'text-green-700' : 'text-slate-600'}>
                            {label}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default PasswordRequirements;
