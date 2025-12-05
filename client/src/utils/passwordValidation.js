/**
 * Password validation utilities
 */

export const PASSWORD_REQUIREMENTS = {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: true,
};

export const validatePasswordRequirements = (password) => {
    const requirements = {
        minLength: password.length >= PASSWORD_REQUIREMENTS.minLength,
        maxLength: password.length <= PASSWORD_REQUIREMENTS.maxLength,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSpecial: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
    };

    const allMet = Object.values(requirements).every(Boolean);

    return { requirements, allMet };
};

export const calculatePasswordStrength = (password) => {
    if (!password) return { score: 0, label: 'None', color: 'gray' };

    let score = 0;
    const { requirements } = validatePasswordRequirements(password);

    // Length scoring
    if (requirements.minLength) score += 20;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // Character variety scoring
    if (requirements.hasUppercase) score += 15;
    if (requirements.hasLowercase) score += 15;
    if (requirements.hasNumber) score += 15;
    if (requirements.hasSpecial) score += 15;

    // Determine label and color
    if (score < 40) return { score, label: 'Weak', color: 'red' };
    if (score < 60) return { score, label: 'Fair', color: 'orange' };
    if (score < 80) return { score, label: 'Good', color: 'yellow' };
    return { score, label: 'Strong', color: 'green' };
};
