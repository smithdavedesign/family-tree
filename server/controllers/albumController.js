const { supabase } = require('../middleware/auth');

/**
 * Album Controller
 * Handles CRUD operations for photo albums
 */

// Get all albums for a tree
const getTreeAlbums = async (req, res) => {
    try {
        const { treeId } = req.params;
        const { sort = 'created_at', order = 'desc' } = req.query;

        // Verify user has access to tree
        const { data: member } = await supabase
            .from('tree_members')
            .select('role')
            .eq('tree_id', treeId)
            .eq('user_id', req.user.id)
            .single();

        if (!member) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Fetch albums with photo count
        const { data: albums, error } = await supabase
            .from('albums')
            .select(`
                id,
                name,
                description,
                cover_photo_id,
                is_private,
                created_at,
                updated_at,
                cover_photo:photos!cover_photo_id(url),
                album_photos(count)
            `)
            .eq('tree_id', treeId)
            .order(sort, { ascending: order === 'asc' });

        if (error) throw error;

        // Format response
        const formatted = albums.map(album => ({
            id: album.id,
            name: album.name,
            description: album.description,
            cover_photo_url: album.cover_photo?.url || null,
            photo_count: album.album_photos[0]?.count || 0,
            is_private: album.is_private,
            created_at: album.created_at,
            updated_at: album.updated_at
        }));

        res.json(formatted);
    } catch (error) {
        console.error('Error fetching albums:', error);
        res.status(500).json({ error: 'Failed to fetch albums' });
    }
};

// Create new album
const createAlbum = async (req, res) => {
    try {
        const { treeId } = req.params;
        const { name, description, cover_photo_id, is_private } = req.body;

        // Verify user has editor/owner role
        const { data: member } = await supabase
            .from('tree_members')
            .select('role')
            .eq('tree_id', treeId)
            .eq('user_id', req.user.id)
            .single();

        if (!member || !['owner', 'editor'].includes(member.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        // Create album
        const { data: album, error } = await supabase
            .from('albums')
            .insert({
                tree_id: treeId,
                name,
                description,
                cover_photo_id,
                is_private: is_private || false,
                created_by: req.user.id
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(album);
    } catch (error) {
        console.error('Error creating album:', error);
        res.status(500).json({ error: 'Failed to create album' });
    }
};

// Get album details with photos
const getAlbum = async (req, res) => {
    try {
        const { albumId } = req.params;

        // Fetch album with photos
        const { data: album, error } = await supabase
            .from('albums')
            .select(`
                *,
                tree:trees(id, name),
                album_photos(
                    id,
                    sort_order,
                    photo:photos(
                        id,
                        url,
                        thumbnail_url,
                        caption,
                        taken_date,
                        location,
                        person:persons(id, first_name, last_name)
                    )
                )
            `)
            .eq('id', albumId)
            .single();

        if (error) throw error;
        if (!album) {
            return res.status(404).json({ error: 'Album not found' });
        }

        // Check user access
        const { data: member } = await supabase
            .from('tree_members')
            .select('role')
            .eq('tree_id', album.tree_id)
            .eq('user_id', req.user.id)
            .single();

        if (!member) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Sort photos by sort_order
        const photos = album.album_photos
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(ap => ap.photo);

        const response = {
            id: album.id,
            name: album.name,
            description: album.description,
            cover_photo_id: album.cover_photo_id,
            is_private: album.is_private,
            tree: album.tree,
            photos,
            permissions: {
                canEdit: ['owner', 'editor'].includes(member.role),
                canDelete: member.role === 'owner'
            },
            created_at: album.created_at,
            updated_at: album.updated_at
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching album:', error);
        res.status(500).json({ error: 'Failed to fetch album' });
    }
};

// Update album
const updateAlbum = async (req, res) => {
    try {
        const { albumId } = req.params;
        const { name, description, cover_photo_id, is_private } = req.body;

        // Get album to check tree_id
        const { data: album } = await supabase
            .from('albums')
            .select('tree_id')
            .eq('id', albumId)
            .single();

        if (!album) {
            return res.status(404).json({ error: 'Album not found' });
        }

        // Verify permissions
        const { data: member } = await supabase
            .from('tree_members')
            .select('role')
            .eq('tree_id', album.tree_id)
            .eq('user_id', req.user.id)
            .single();

        if (!member || !['owner', 'editor'].includes(member.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        // Update album
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (cover_photo_id !== undefined) updates.cover_photo_id = cover_photo_id;
        if (is_private !== undefined) updates.is_private = is_private;

        const { data: updated, error } = await supabase
            .from('albums')
            .update(updates)
            .eq('id', albumId)
            .select()
            .single();

        if (error) throw error;

        res.json(updated);
    } catch (error) {
        console.error('Error updating album:', error);
        res.status(500).json({ error: 'Failed to update album' });
    }
};

// Delete album
const deleteAlbum = async (req, res) => {
    try {
        const { albumId } = req.params;

        // Get album to check tree_id
        const { data: album } = await supabase
            .from('albums')
            .select('tree_id, name')
            .eq('id', albumId)
            .single();

        if (!album) {
            return res.status(404).json({ error: 'Album not found' });
        }

        // Verify owner permission
        const { data: member } = await supabase
            .from('tree_members')
            .select('role')
            .eq('tree_id', album.tree_id)
            .eq('user_id', req.user.id)
            .single();

        if (!member || member.role !== 'owner') {
            return res.status(403).json({ error: 'Only owners can delete albums' });
        }

        // Delete album (cascade will remove album_photos)
        const { error } = await supabase
            .from('albums')
            .delete()
            .eq('id', albumId);

        if (error) throw error;

        res.json({ message: 'Album deleted successfully' });
    } catch (error) {
        console.error('Error deleting album:', error);
        res.status(500).json({ error: 'Failed to delete album' });
    }
};

// Add photos to album
const addPhotosToAlbum = async (req, res) => {
    try {
        const { albumId } = req.params;
        const { photo_ids } = req.body;

        if (!Array.isArray(photo_ids) || photo_ids.length === 0) {
            return res.status(400).json({ error: 'photo_ids must be a non-empty array' });
        }

        // Get album to check tree_id
        const { data: album } = await supabase
            .from('albums')
            .select('tree_id')
            .eq('id', albumId)
            .single();

        if (!album) {
            return res.status(404).json({ error: 'Album not found' });
        }

        // Verify permissions
        const { data: member } = await supabase
            .from('tree_members')
            .select('role')
            .eq('tree_id', album.tree_id)
            .eq('user_id', req.user.id)
            .single();

        if (!member || !['owner', 'editor'].includes(member.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        // Get max sort_order
        const { data: maxOrder } = await supabase
            .from('album_photos')
            .select('sort_order')
            .eq('album_id', albumId)
            .order('sort_order', { ascending: false })
            .limit(1)
            .single();

        let nextOrder = (maxOrder?.sort_order || 0) + 1;

        // Insert photos (ignore duplicates)
        const inserts = photo_ids.map(photo_id => ({
            album_id: albumId,
            photo_id,
            sort_order: nextOrder++,
            added_by: req.user.id
        }));

        const { data, error } = await supabase
            .from('album_photos')
            .upsert(inserts, { onConflict: 'album_id,photo_id', ignoreDuplicates: true })
            .select();

        if (error) throw error;

        res.json({ added: data.length, message: `Added ${data.length} photos to album` });
    } catch (error) {
        console.error('Error adding photos to album:', error);
        res.status(500).json({ error: 'Failed to add photos' });
    }
};

// Remove photo from album
const removePhotoFromAlbum = async (req, res) => {
    try {
        const { albumId, photoId } = req.params;

        // Get album to check tree_id
        const { data: album } = await supabase
            .from('albums')
            .select('tree_id')
            .eq('id', albumId)
            .single();

        if (!album) {
            return res.status(404).json({ error: 'Album not found' });
        }

        // Verify permissions
        const { data: member } = await supabase
            .from('tree_members')
            .select('role')
            .eq('tree_id', album.tree_id)
            .eq('user_id', req.user.id)
            .single();

        if (!member || !['owner', 'editor'].includes(member.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        // Remove photo
        const { error } = await supabase
            .from('album_photos')
            .delete()
            .eq('album_id', albumId)
            .eq('photo_id', photoId);

        if (error) throw error;

        res.json({ message: 'Photo removed from album' });
    } catch (error) {
        console.error('Error removing photo from album:', error);
        res.status(500).json({ error: 'Failed to remove photo' });
    }
};

// Reorder photos in album
const reorderAlbumPhotos = async (req, res) => {
    try {
        const { albumId } = req.params;
        const { photo_orders } = req.body;

        if (!Array.isArray(photo_orders)) {
            return res.status(400).json({ error: 'photo_orders must be an array' });
        }

        // Get album to check tree_id
        const { data: album } = await supabase
            .from('albums')
            .select('tree_id')
            .eq('id', albumId)
            .single();

        if (!album) {
            return res.status(404).json({ error: 'Album not found' });
        }

        // Verify permissions
        const { data: member } = await supabase
            .from('tree_members')
            .select('role')
            .eq('tree_id', album.tree_id)
            .eq('user_id', req.user.id)
            .single();

        if (!member || !['owner', 'editor'].includes(member.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        // Update sort orders
        const updates = photo_orders.map(({ photo_id, sort_order }) =>
            supabase
                .from('album_photos')
                .update({ sort_order })
                .eq('album_id', albumId)
                .eq('photo_id', photo_id)
        );

        await Promise.all(updates);

        res.json({ message: 'Photo order updated' });
    } catch (error) {
        console.error('Error reordering photos:', error);
        res.status(500).json({ error: 'Failed to reorder photos' });
    }
};

// Get albums containing a person's photos
const getPersonAlbums = async (req, res) => {
    try {
        const { personId } = req.params;

        const { data: albums, error } = await supabase
            .from('albums')
            .select(`
                id,
                name,
                album_photos!inner(
                    photo:photos!inner(person_id)
                )
            `)
            .eq('album_photos.photo.person_id', personId);

        if (error) throw error;

        // Group by album and count photos
        const albumMap = new Map();
        albums.forEach(album => {
            if (!albumMap.has(album.id)) {
                albumMap.set(album.id, {
                    album_id: album.id,
                    album_name: album.name,
                    photo_count: 0
                });
            }
            albumMap.get(album.id).photo_count++;
        });

        res.json(Array.from(albumMap.values()));
    } catch (error) {
        console.error('Error fetching person albums:', error);
        res.status(500).json({ error: 'Failed to fetch person albums' });
    }
};

module.exports = {
    getTreeAlbums,
    createAlbum,
    getAlbum,
    updateAlbum,
    deleteAlbum,
    addPhotosToAlbum,
    removePhotoFromAlbum,
    reorderAlbumPhotos,
    getPersonAlbums
};
