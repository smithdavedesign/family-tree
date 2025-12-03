const { supabaseAdmin } = require('../middleware/auth');

exports.addDocument = async (req, res) => {
    const { person_id, url, title, type, source, external_id, description } = req.body;

    try {
        const { data, error } = await supabaseAdmin
            .from('documents')
            .insert([
                { person_id, url, title, type, source, external_id, description }
            ])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('Error adding document:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getDocuments = async (req, res) => {
    const { id: personId } = req.params;

    try {
        const { data, error } = await supabaseAdmin
            .from('documents')
            .select('*')
            .eq('person_id', personId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateDocument = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        const { data, error } = await supabaseAdmin
            .from('documents')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error updating document:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteDocument = async (req, res) => {
    const { id } = req.params;

    try {
        // First get the document to check source
        const { data: doc, error: fetchError } = await supabaseAdmin
            .from('documents')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        // If it's a local upload, try to delete from storage
        if (doc.source === 'upload' && doc.url) {
            try {
                // Extract path from URL
                // URL format: .../storage/v1/object/public/documents/person_id/filename
                const urlParts = doc.url.split('/documents/');
                if (urlParts.length > 1) {
                    const path = urlParts[1];
                    const { error: storageError } = await supabaseAdmin
                        .storage
                        .from('documents')
                        .remove([path]);

                    if (storageError) {
                        console.warn('Failed to delete file from storage:', storageError);
                    }
                }
            } catch (err) {
                console.warn('Error parsing URL for storage deletion:', err);
            }
        }

        // Delete from DB
        const { error } = await supabaseAdmin
            .from('documents')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ error: error.message });
    }
};
