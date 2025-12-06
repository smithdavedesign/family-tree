const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireOwner, requireEditor, requireViewer, requirePersonEditor, requirePersonViewer, requireRelationshipEditor, requirePhotoEditor, requirePhotoViewer, requirePersonEditorBody, requireDocumentEditor, requireDocumentViewer, requireEventEditor } = require('../middleware/rbac');
const { writeLimiter, accountDeletionLimiter } = require('../middleware/rateLimiter');
const { auditLog } = require('../middleware/auditLogger');
const { validate } = require('../middleware/validation');
const { personSchema, personUpdateSchema, treeSchema, relationshipSchema, invitationSchema, photoSchema } = require('../validation/schemas');
const treeController = require('../controllers/treeController');
const personController = require('../controllers/personController');
const relationshipController = require('../controllers/relationshipController');
const mediaController = require('../controllers/mediaController');
const documentController = require('../controllers/documentController');
const accountController = require('../controllers/accountController');
const invitationController = require('../controllers/invitationController');
const lifeEventController = require('../controllers/lifeEventController');
const reminderController = require('../controllers/reminderController');

// Tree routes
router.get('/trees', requireAuth, treeController.getUserTrees);
router.post('/trees', requireAuth, validate(treeSchema), writeLimiter, auditLog('CREATE', 'tree'), treeController.createTree);
router.get('/tree/:id', requireAuth, requireViewer, treeController.getTree);
router.delete('/tree/:id', requireAuth, requireOwner, writeLimiter, auditLog('DELETE', 'tree'), treeController.deleteTree);

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
router.post('/media', requireAuth, requireEditor, writeLimiter, auditLog('CREATE', 'media'), mediaController.addMedia);

// Photo routes (Phase H)
router.post('/photos', requireAuth, requirePersonEditorBody, writeLimiter, auditLog('CREATE', 'photo'), mediaController.addPhoto);
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

// Reminder routes (Phase 2 Roadmap)
router.get('/reminders/upcoming', requireAuth, reminderController.getUpcomingEvents);

// Account routes
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

// Export routes
const exportRoutes = require('./export');
router.use('/export', exportRoutes);

// Test routes (for error logging and other testing)
const testRoutes = require('./test');
router.use('/test', testRoutes);

module.exports = router;
