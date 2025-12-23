const { supabaseAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * Storage Service
 * Handles uploading files to Supabase Storage buckets
 */

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
