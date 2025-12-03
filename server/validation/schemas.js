const Joi = require('joi');

/**
 * Validation schemas for API requests
 */

// Person validation schema (for POST - creating new person)
const personSchema = Joi.object({
    tree_id: Joi.string().uuid().required(),
    first_name: Joi.string().min(1).max(100).required(),
    last_name: Joi.string().min(1).max(100).allow('', null),
    dob: Joi.date().iso().max('now').allow(null).messages({
        'date.max': 'Date of birth cannot be in the future'
    }),
    dod: Joi.date().iso().max('now').allow(null).messages({
        'date.max': 'Date of death cannot be in the future'
    }),
    gender: Joi.string().valid('Male', 'Female', 'Other', 'Unknown').allow(null),
    bio: Joi.string().max(5000).allow('', null),
    occupation: Joi.string().max(200).allow('', null),
    occupation_history: Joi.array().items(Joi.string().max(200)).max(20).allow(null),
    education: Joi.string().max(500).allow('', null),
    pob: Joi.string().max(200).allow('', null),
    place_of_death: Joi.string().max(200).allow('', null),
    cause_of_death: Joi.string().max(500).allow('', null),
    burial_place: Joi.string().max(200).allow('', null),
    profile_photo_url: Joi.string().uri().allow('', null),
}).custom((value, helpers) => {
    // Impossible date validation: death before birth
    if (value.dob && value.dod) {
        const birthDate = new Date(value.dob);
        const deathDate = new Date(value.dod);

        if (deathDate < birthDate) {
            return helpers.error('custom.impossibleDates', {
                message: 'Date of death cannot be before date of birth'
            });
        }

        // Check if person is too old (>150 years)
        const ageDiff = deathDate - birthDate;
        const ageInYears = ageDiff / (1000 * 60 * 60 * 24 * 365.25);
        if (ageInYears > 150) {
            return helpers.error('custom.unrealisticAge', {
                message: 'Age at death exceeds 150 years, please verify dates'
            });
        }
    }

    // Check if person is too old if still alive
    if (value.dob && !value.dod) {
        const birthDate = new Date(value.dob);
        const now = new Date();
        const ageDiff = now - birthDate;
        const ageInYears = ageDiff / (1000 * 60 * 60 * 24 * 365.25);

        if (ageInYears > 150) {
            return helpers.error('custom.unrealisticAge', {
                message: 'Person would be over 150 years old, please verify date of birth'
            });
        }
    }

    return value;
});

// Person update schema (for PUT - all fields optional)
const personUpdateSchema = Joi.object({
    tree_id: Joi.string().uuid(),
    first_name: Joi.string().min(1).max(100),
    last_name: Joi.string().min(1).max(100).allow('', null),
    dob: Joi.date().iso().max('now').allow(null),
    dod: Joi.date().iso().max('now').allow(null),
    gender: Joi.string().valid('Male', 'Female', 'Other', 'Unknown').allow(null),
    bio: Joi.string().max(5000).allow('', null),
    occupation: Joi.string().max(200).allow('', null),
    occupation_history: Joi.array().items(Joi.string().max(200)).max(20).allow(null),
    education: Joi.string().max(500).allow('', null),
    pob: Joi.string().max(200).allow('', null),
    place_of_death: Joi.string().max(200).allow('', null),
    cause_of_death: Joi.string().max(500).allow('', null),
    burial_place: Joi.string().max(200).allow('', null),
    profile_photo_url: Joi.string().uri().allow('', null),
}).min(1); // At least one field must be provided

// Tree validation schema
const treeSchema = Joi.object({
    name: Joi.string().min(1).max(200).required().messages({
        'string.empty': 'Tree name is required',
        'string.max': 'Tree name must be less than 200 characters'
    }),
    description: Joi.string().max(1000).allow('', null)
});

// Relationship validation schema
const relationshipSchema = Joi.object({
    tree_id: Joi.string().uuid().required(),
    person_1_id: Joi.string().uuid().required(),
    person_2_id: Joi.string().uuid().required(),
    type: Joi.string().valid(
        'parent_child',
        'spouse',
        'adoptive_parent_child',
        'sibling'
    ).required(),
    status: Joi.string().valid('current', 'divorced', 'widowed', 'separated').allow(null)
}).custom((value, helpers) => {
    // Prevent self-relationships
    if (value.person_1_id === value.person_2_id) {
        return helpers.error('custom.selfRelationship', {
            message: 'Cannot create relationship with self'
        });
    }
    return value;
});

// Invitation validation schema
const invitationSchema = Joi.object({
    tree_id: Joi.string().uuid().required(),
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address'
    }),
    role: Joi.string().valid('editor', 'viewer').required()
});

// Photo validation schema
const photoSchema = Joi.object({
    person_id: Joi.string().uuid().required(),
    url: Joi.string().uri().required(),
    caption: Joi.string().max(500).allow('', null),
    date_taken: Joi.date().iso().max('now').allow(null),
    is_primary: Joi.boolean().default(false)
});

module.exports = {
    personSchema,
    personUpdateSchema,
    treeSchema,
    relationshipSchema,
    invitationSchema,
    photoSchema
};
