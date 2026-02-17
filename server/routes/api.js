const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireOwner, requireEditor, requireViewer, requirePersonEditor, requirePersonViewer, requireRelationshipEditor, requirePhotoEditor, requirePhotoViewer, requirePersonEditorBody, requireDocumentEditor, requireDocumentViewer, requireEventEditor, requireTreeEditor, requireStoryEditor } = require('../middleware/rbac');
const { writeLimiter, accountDeletionLimiter } = require('../middleware/rateLimiter');
const { auditLog } = require('../middleware/auditLogger');
const { validate } = require('../middleware/validation');
const { checkTokens } = require('../middleware/usageLimiter');
const { personSchema, personUpdateSchema, treeSchema, relationshipSchema, invitationSchema, photoSchema, albumSchema, albumUpdateSchema, addPhotosToAlbumSchema, reorderPhotosSchema } = require('../validation/schemas');
const treeController = require('../controllers/treeController');
const personController = require('../controllers/personController');
const relationshipController = require('../controllers/relationshipController');
const mediaController = require('../controllers/mediaController');
const documentController = require('../controllers/documentController');
const accountController = require('../controllers/accountController');
const invitationController = require('../controllers/invitationController');
const lifeEventController = require('../controllers/lifeEventController');
const reminderController = require('../controllers/reminderController');
const storyController = require('../controllers/storyController');
const albumController = require('../controllers/albumController');
const mapController = require('../controllers/mapController');
const locationController = require('../controllers/locationController');
const commentController = require('../controllers/commentController');
const activityController = require('../controllers/activityController');
const searchController = require('../controllers/searchController');
const notificationController = require('../controllers/notificationController');
const upload = require('../middleware/upload');

// Tree routes
router.get('/trees', requireAuth, treeController.getUserTrees);
router.post('/trees', requireAuth, validate(treeSchema), writeLimiter, auditLog('CREATE', 'tree'), treeController.createTree);
router.get('/tree/:id', requireAuth, requireViewer, treeController.getTree);
router.delete('/tree/:id', requireAuth, requireOwner, writeLimiter, auditLog('DELETE', 'tree'), treeController.deleteTree);
router.put('/tree/:id', requireAuth, requireOwner, writeLimiter, auditLog('UPDATE', 'tree'), treeController.updateTree);
router.post('/tree/:id/favorite', requireAuth, writeLimiter, treeController.toggleFavorite);
router.post('/tree/:id/archive', requireAuth, writeLimiter, treeController.toggleArchive);

// Invitation & Member routes
router.post('/tree/:treeId/invite', requireAuth, requireEditor, validate(invitationSchema), writeLimiter, auditLog('CREATE', 'invitation'), invitationController.createInvitation);
router.get('/invite/:token', invitationController.getInvitation);
router.post('/invite/:token/accept', requireAuth, auditLog('UPDATE', 'membership'), invitationController.acceptInvitation);
router.get('/tree/:treeId/members', requireAuth, requireOwner, invitationController.getTreeMembers);
router.delete('/tree/:treeId/member/:userId', requireAuth, requireOwner, auditLog('DELETE', 'membership'), invitationController.removeMember);
router.put('/tree/:treeId/member/:userId', requireAuth, requireOwner, auditLog('UPDATE', 'membership'), invitationController.updateMemberRole);

// Person routes (require editor role to modify)
router.post('/person', requireAuth, requireEditor, validate(personSchema), writeLimiter, auditLog('CREATE', 'person'), personController.createPerson);
router.put('/person/:id', requireAuth, requirePersonEditor, validate(personUpdateSchema), writeLimiter, auditLog('UPDATE', 'person'), personController.updatePerson);
router.delete('/person/:id', requireAuth, requirePersonEditor, writeLimiter, auditLog('DELETE', 'person'), personController.deletePerson);
router.post('/person/merge', requireAuth, requireEditor, writeLimiter, auditLog('UPDATE', 'person'), personController.mergePersons);
router.get('/person/:id/media', requireAuth, requirePersonViewer, mediaController.getMediaForPerson);

// Relationship routes (require editor role)
router.post('/relationship', requireAuth, requireEditor, validate(relationshipSchema), writeLimiter, auditLog('CREATE', 'relationship'), relationshipController.createRelationship);
router.delete('/relationship/:id', requireAuth, requireRelationshipEditor, writeLimiter, auditLog('DELETE', 'relationship'), relationshipController.deleteRelationship);

// Media routes (require editor role to add)
router.post('/media', requireAuth, requirePersonEditorBody, writeLimiter, auditLog('CREATE', 'media'), mediaController.addMedia);

// Photo routes (Phase H)
router.post('/photos', requireAuth, upload.single('photo'), requirePersonEditorBody, writeLimiter, auditLog('CREATE', 'photo'), mediaController.addPhoto);
router.get('/person/:id/photos', requireAuth, requirePersonViewer, mediaController.getPhotos);
router.put('/photos/:id', requireAuth, requirePhotoEditor, writeLimiter, auditLog('UPDATE', 'photo'), mediaController.updatePhoto);
router.delete('/photos/:id', requireAuth, requirePhotoEditor, writeLimiter, auditLog('DELETE', 'photo'), mediaController.deletePhoto);
router.get('/tree/:id/photos', (req, res, next) => {
    console.log('GET /tree/:id/photos hit', req.params.id);
    next();
}, requireAuth, requireViewer, mediaController.getTreePhotos);

// Document routes (Phase H)
router.post('/documents', requireAuth, requirePersonEditorBody, writeLimiter, auditLog('CREATE', 'document'), documentController.addDocument);
router.get('/person/:id/documents', requireAuth, requirePersonViewer, documentController.getDocuments);
router.put('/documents/:id', requireAuth, requireDocumentEditor, writeLimiter, auditLog('UPDATE', 'document'), documentController.updateDocument);
router.delete('/documents/:id', requireAuth, requireDocumentEditor, writeLimiter, auditLog('DELETE', 'document'), documentController.deleteDocument);

// Life Event routes (Phase 1 Roadmap)
router.post('/person/:id/events', requireAuth, requirePersonEditor, writeLimiter, auditLog('CREATE', 'life_event'), lifeEventController.addEvent);
router.get('/person/:id/events', requireAuth, requirePersonViewer, lifeEventController.getPersonEvents);
router.put('/events/:id', requireAuth, requireEventEditor, writeLimiter, auditLog('UPDATE', 'life_event'), lifeEventController.updateEvent);
router.delete('/events/:id', requireAuth, requireEventEditor, writeLimiter, auditLog('DELETE', 'life_event'), lifeEventController.deleteEvent);
router.get('/photos/:id/events', requireAuth, requirePhotoViewer, lifeEventController.getEventsForPhoto);
router.get('/tree/:id/events', requireAuth, requireViewer, lifeEventController.getTreeEvents);

// Reminder routes (Phase 2 Roadmap)
router.get('/reminders/upcoming', requireAuth, reminderController.getUpcomingEvents);

// Story routes
router.get('/stories', requireAuth, storyController.getStories);
router.get('/story/:id', requireAuth, storyController.getStory);
// Premium feature: Cost 10 tokens to generate/create a story
router.post('/story', requireAuth, requireTreeEditor, checkTokens(10), writeLimiter, auditLog('CREATE', 'story'), storyController.createStory);
router.put('/story/:id', requireAuth, requireStoryEditor, writeLimiter, auditLog('UPDATE', 'story'), storyController.updateStory);
router.delete('/story/:id', requireAuth, requireStoryEditor, writeLimiter, auditLog('DELETE', 'story'), storyController.deleteStory);

// Album routes
router.get('/tree/:treeId/albums', requireAuth, requireViewer, albumController.getTreeAlbums);
router.post('/tree/:treeId/albums', requireAuth, requireTreeEditor, validate(albumSchema), writeLimiter, auditLog('CREATE', 'album'), albumController.createAlbum);
router.get('/album/:albumId', requireAuth, albumController.getAlbum);
router.put('/album/:albumId', requireAuth, validate(albumUpdateSchema), writeLimiter, auditLog('UPDATE', 'album'), albumController.updateAlbum);
router.delete('/album/:albumId', requireAuth, writeLimiter, auditLog('DELETE', 'album'), albumController.deleteAlbum);
router.post('/album/:albumId/photos', requireAuth, validate(addPhotosToAlbumSchema), writeLimiter, albumController.addPhotosToAlbum);
router.delete('/album/:albumId/photos/:photoId', requireAuth, writeLimiter, albumController.removePhotoFromAlbum);
router.put('/album/:albumId/photos/reorder', requireAuth, validate(reorderPhotosSchema), writeLimiter, albumController.reorderAlbumPhotos);
router.get('/person/:personId/albums', requireAuth, albumController.getPersonAlbums);
router.get('/photo/:photoId/albums', requireAuth, albumController.getPhotoAlbums);

// Comment routes
router.get('/comments/:resourceType/:resourceId', requireAuth, commentController.getComments);
router.post('/comments', requireAuth, writeLimiter, auditLog('CREATE', 'comment'), commentController.addComment);
router.delete('/comments/:commentId', requireAuth, writeLimiter, auditLog('DELETE', 'comment'), commentController.deleteComment);

// Activity routes
router.get('/activity/recent', requireAuth, activityController.getRecentActivity);

// Account routes
router.put('/account', requireAuth, writeLimiter, auditLog('UPDATE', 'account'), accountController.updateAccount);
router.delete('/account', requireAuth, accountDeletionLimiter, auditLog('DELETE', 'account'), accountController.deleteAccount);

// Config route (Runtime configuration)
router.get('/config', (req, res) => {
    res.json({
        googleClientId: process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID,
        googleApiKey: process.env.GOOGLE_API_KEY || process.env.VITE_GOOGLE_API_KEY
    });
});

// Google OAuth routes
const googleOAuthRoutes = require('./googleOAuth');
router.use('/google', googleOAuthRoutes);

// Map routes (Phase P)
router.get('/map/nearby', requireAuth, mapController.getNearbyPhotos);
router.get('/person/:id/map-stats', requireAuth, mapController.getPersonLocationStats);
router.get('/map/global-stats', requireAuth, mapController.getGlobalTravelStats);

// Location routes (Phase Q)
router.post('/locations', requireAuth, writeLimiter, locationController.createLocation);
router.get('/locations', requireAuth, locationController.getLocations);
router.get('/location/:id', requireAuth, locationController.getLocation);
router.put('/location/:id', requireAuth, writeLimiter, locationController.updateLocation);
router.delete('/location/:id', requireAuth, writeLimiter, locationController.deleteLocation);
router.get('/location/:id/details', requireAuth, locationController.getLocationDetails);

// Story-Location linking
router.post('/story/:storyId/locations', requireAuth, requireStoryEditor, writeLimiter, locationController.addStoryLocation);
router.delete('/story/:storyId/location/:locationId', requireAuth, requireStoryEditor, writeLimiter, locationController.removeStoryLocation);
router.get('/story/:storyId/locations', requireAuth, locationController.getStoryLocations);

// Person-Location linking
router.post('/person/:personId/locations', requireAuth, writeLimiter, locationController.addPersonLocation);
router.delete('/person/:personId/location/:locationId', requireAuth, writeLimiter, locationController.removePersonLocation);
router.get('/person/:personId/locations', requireAuth, locationController.getPersonLocations);

// Event-Location linking (Phase 2)
router.post('/event/:eventId/locations', requireAuth, requireEventEditor, writeLimiter, locationController.addEventLocation);
router.delete('/event/:eventId/location/:locationId', requireAuth, requireEventEditor, writeLimiter, locationController.removeEventLocation);

// Global Search
router.get('/search', requireAuth, searchController.search);

// Log routes
const logController = require('../controllers/logController');
router.post('/logs', writeLimiter, logController.createLog);

// Export routes
const exportRoutes = require('./export');
router.use('/export', exportRoutes);

// Test routes (for error logging and other testing)
const testRoutes = require('./testRoutes');
router.use('/test', testRoutes);

// Subscription routes
const subscriptionRoutes = require('./subscriptionRoutes');
router.use('/', subscriptionRoutes);

// Global search
router.get('/search', requireAuth, searchController.search);

// Notification preferences
router.get('/notifications/preferences', requireAuth, notificationController.getPreferences);
router.put('/notifications/preferences', requireAuth, notificationController.updatePreferences);
router.get('/notifications/history', requireAuth, notificationController.getHistory);

module.exports = router;
