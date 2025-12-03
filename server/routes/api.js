const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireOwner, requireEditor, requireViewer, requirePersonEditor, requirePersonViewer, requireRelationshipEditor, requirePhotoEditor, requirePhotoViewer, requirePersonEditorBody } = require('../middleware/rbac');
const { writeLimiter, accountDeletionLimiter } = require('../middleware/rateLimiter');
const { auditLog } = require('../middleware/auditLogger');
const treeController = require('../controllers/treeController');
const personController = require('../controllers/personController');
const relationshipController = require('../controllers/relationshipController');
const mediaController = require('../controllers/mediaController');
const accountController = require('../controllers/accountController');
const invitationController = require('../controllers/invitationController');

// Tree routes
router.get('/trees', requireAuth, treeController.getUserTrees);
router.post('/trees', requireAuth, writeLimiter, auditLog('CREATE', 'tree'), treeController.createTree);
router.get('/tree/:id', requireAuth, requireViewer, treeController.getTree);
router.delete('/tree/:id', requireAuth, requireOwner, writeLimiter, auditLog('DELETE', 'tree'), treeController.deleteTree);

// Invitation & Member routes
router.post('/tree/:treeId/invite', requireAuth, requireEditor, writeLimiter, auditLog('CREATE', 'invitation'), invitationController.createInvitation);
router.get('/invite/:token', invitationController.getInvitation); // Public endpoint (no auth required to view invite details)
router.post('/invite/:token/accept', requireAuth, auditLog('UPDATE', 'membership'), invitationController.acceptInvitation);
router.get('/tree/:treeId/members', requireAuth, requireOwner, invitationController.getTreeMembers);
router.delete('/tree/:treeId/member/:userId', requireAuth, requireOwner, auditLog('DELETE', 'membership'), invitationController.removeMember);
router.put('/tree/:treeId/member/:userId', requireAuth, requireOwner, auditLog('UPDATE', 'membership'), invitationController.updateMemberRole);

// Person routes (require editor role to modify)
router.post('/person', requireAuth, requireEditor, writeLimiter, auditLog('CREATE', 'person'), personController.createPerson);
router.put('/person/:id', requireAuth, requirePersonEditor, writeLimiter, auditLog('UPDATE', 'person'), personController.updatePerson);
router.delete('/person/:id', requireAuth, requirePersonEditor, writeLimiter, auditLog('DELETE', 'person'), personController.deletePerson);
router.post('/person/merge', requireAuth, requireEditor, writeLimiter, auditLog('UPDATE', 'person'), personController.mergePersons);
router.get('/person/:id/media', requireAuth, requirePersonViewer, mediaController.getMediaForPerson);

// Relationship routes (require editor role)
router.post('/relationship', requireAuth, requireEditor, writeLimiter, auditLog('CREATE', 'relationship'), relationshipController.createRelationship);
router.delete('/relationship/:id', requireAuth, requireRelationshipEditor, writeLimiter, auditLog('DELETE', 'relationship'), relationshipController.deleteRelationship);

// Media routes (require editor role to add)
router.post('/media', requireAuth, requireEditor, writeLimiter, auditLog('CREATE', 'media'), mediaController.addMedia);

// Photo routes (Phase H)
router.post('/photos', requireAuth, requirePersonEditorBody, writeLimiter, auditLog('CREATE', 'photo'), mediaController.addPhoto);
router.get('/person/:id/photos', requireAuth, requirePersonViewer, mediaController.getPhotos);
router.put('/photos/:id', requireAuth, requirePhotoEditor, writeLimiter, auditLog('UPDATE', 'photo'), mediaController.updatePhoto);
router.delete('/photos/:id', requireAuth, requirePhotoEditor, writeLimiter, auditLog('DELETE', 'photo'), mediaController.deletePhoto);

// Account routes
router.delete('/account', requireAuth, accountDeletionLimiter, auditLog('DELETE', 'account'), accountController.deleteAccount);

// Test routes (for Sentry and other testing)
const testRoutes = require('./test');
router.use('/test', testRoutes);

module.exports = router;
