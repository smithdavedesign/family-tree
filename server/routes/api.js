const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { writeLimiter, accountDeletionLimiter } = require('../middleware/rateLimiter');
const { auditLog } = require('../middleware/auditLogger');
const treeController = require('../controllers/treeController');
const personController = require('../controllers/personController');
const relationshipController = require('../controllers/relationshipController');
const mediaController = require('../controllers/mediaController');
const accountController = require('../controllers/accountController');

// Tree routes
router.get('/trees', requireAuth, treeController.getUserTrees);
router.post('/trees', requireAuth, writeLimiter, auditLog('CREATE', 'tree'), treeController.createTree);
router.get('/tree/:id', requireAuth, treeController.getTree);
router.delete('/tree/:id', requireAuth, writeLimiter, auditLog('DELETE', 'tree'), treeController.deleteTree);

// Person routes
router.post('/person', requireAuth, writeLimiter, auditLog('CREATE', 'person'), personController.createPerson);
router.put('/person/:id', requireAuth, writeLimiter, auditLog('UPDATE', 'person'), personController.updatePerson);
router.delete('/person/:id', requireAuth, writeLimiter, auditLog('DELETE', 'person'), personController.deletePerson);
router.post('/person/merge', requireAuth, writeLimiter, auditLog('UPDATE', 'person'), personController.mergePersons);
router.get('/person/:id/media', requireAuth, mediaController.getMediaForPerson);

// Relationship routes
router.post('/relationship', requireAuth, writeLimiter, auditLog('CREATE', 'relationship'), relationshipController.createRelationship);
router.delete('/relationship/:id', requireAuth, writeLimiter, auditLog('DELETE', 'relationship'), relationshipController.deleteRelationship);

// Media routes
router.post('/media', requireAuth, writeLimiter, auditLog('CREATE', 'media'), mediaController.addMedia);

// Account routes
router.delete('/account', requireAuth, accountDeletionLimiter, auditLog('DELETE', 'account'), accountController.deleteAccount);

module.exports = router;

