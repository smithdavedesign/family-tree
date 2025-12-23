const { supabaseAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * Storage Service
 * Handles uploading files to Supabase Storage buckets
 */

/**
 * Ensure a bucket exists and is configured for public access
 * @param {string} bucket - Bucket name
 */
exports.initializeBucket = async (bucket) => {
    try {
        const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
        if (listError) throw listError;

        const exists = buckets.some(b => b.name === bucket);

        if (!exists) {
            logger.info(`Creating missing Supabase Storage bucket: ${bucket}`);
            const { error: createError } = await supabaseAdmin.storage.createBucket(bucket, {
                public: true,
                allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/png', 'image/gif'],
                fileSizeLimit: 5 * 1024 * 1024 // 5MB
            });
            if (createError) throw createError;
        }
    } catch (error) {
        logger.error(`Failed to initialize bucket ${bucket}:`, error);
        // Don't throw, let the upload attempt fail naturally if it's a transient issue
    }
};

/**
 * Upload a buffer to a Supabase Storage bucket
 * @param {string} bucket - Bucket name
 * @param {string} path - File path in bucket
 * @param {Buffer} buffer - File buffer
 * @param {string} contentType - Mime type
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
exports.uploadFile = async (bucket, path, buffer, contentType) => {
    try {
        // Ensure bucket exists (or at least try to upload)
        const { data, error } = await supabaseAdmin.storage
            .from(bucket)
            .upload(path, buffer, {
                contentType,
                upsert: true
            });

        if (error) {
            logger.error('Supabase Storage upload error:', error);
            throw error;
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from(bucket)
            .getPublicUrl(path);

        return publicUrl;
    } catch (error) {
        logger.error('Error in storageService.uploadFile:', error);
        throw error;
    }
};

/**
 * Delete a file from Supabase Storage
 * @param {string} bucket - Bucket name
 * @param {string} path - File path in bucket
 */
exports.deleteFile = async (bucket, path) => {
    try {
        const { error } = await supabaseAdmin.storage
            .from(bucket)
            .remove([path]);

        if (error) {
            logger.error('Supabase Storage delete error:', error);
            throw error;
        }
    } catch (error) {
        logger.error('Error in storageService.deleteFile:', error);
        throw error;
    }
};
