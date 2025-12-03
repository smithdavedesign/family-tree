import { z } from 'zod';

/**
 * Frontend validation schemas using Zod
 */

// Person validation schema
export const personSchema = z.object({
    first_name: z.string().min(1, 'First name is required').max(100),
    last_name: z.string().max(100).optional().nullable(),
    dob: z.string().datetime().optional().nullable().refine(
        (date) => !date || new Date(date) <= new Date(),
        'Date of birth cannot be in the future'
    ),
    dod: z.string().datetime().optional().nullable().refine(
        (date) => !date || new Date(date) <= new Date(),
        'Date of death cannot be in the future'
    ),
    gender: z.enum(['Male', 'Female', 'Other', 'Unknown']).optional().nullable(),
    bio: z.string().max(5000).optional().nullable(),
    occupation: z.string().max(200).optional().nullable(),
    education: z.string().max(500).optional().nullable(),
    pob: z.string().max(200).optional().nullable(),
    place_of_death: z.string().max(200).optional().nullable(),
    cause_of_death: z.string().max(500).optional().nullable(),
    burial_place: z.string().max(200).optional().nullable(),
}).refine(
    (data) => {
        // Impossible date validation
        if (data.dob && data.dod) {
            const birthDate = new Date(data.dob);
            const deathDate = new Date(data.dod);
            return deathDate >= birthDate;
        }
        return true;
    },
    {
        message: 'Date of death cannot be before date of birth',
        path: ['dod']
    }
).refine(
    (data) => {
        // Age validation (max 150 years)
        if (data.dob && data.dod) {
            const birthDate = new Date(data.dob);
            const deathDate = new Date(data.dod);
            const ageInYears = (deathDate - birthDate) / (1000 * 60 * 60 * 24 * 365.25);
            return ageInYears <= 150;
        }
        return true;
    },
    {
        message: 'Age at death exceeds 150 years, please verify dates',
        path: ['dod']
    }
);

// Tree validation schema
export const treeSchema = z.object({
    name: z.string().min(1, 'Tree name is required').max(200),
    description: z.string().max(1000).optional().nullable()
});

// Relationship validation schema
export const relationshipSchema = z.object({
    person_1_id: z.string().uuid(),
    person_2_id: z.string().uuid(),
    type: z.enum(['parent_child', 'spouse', 'adoptive_parent_child', 'sibling']),
    status: z.enum(['current', 'divorced', 'widowed', 'separated']).optional().nullable()
}).refine(
    (data) => data.person_1_id !== data.person_2_id,
    {
        message: 'Cannot create relationship with self',
        path: ['person_2_id']
    }
);

// Invitation validation schema
export const invitationSchema = z.object({
    email: z.string().email('Please provide a valid email address'),
    role: z.enum(['editor', 'viewer'])
});

/**
 * Helper function to validate data and return errors
 */
export function validateData(schema, data) {
    try {
        const validated = schema.parse(data);
        return { success: true, data: validated, errors: null };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));
            return { success: false, data: null, errors };
        }
        return { success: false, data: null, errors: [{ field: 'unknown', message: 'Validation failed' }] };
    }
}
