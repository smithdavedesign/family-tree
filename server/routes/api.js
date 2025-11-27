const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const treeController = require('../controllers/treeController');
const personController = require('../controllers/personController');
const relationshipController = require('../controllers/relationshipController');
const mediaController = require('../controllers/mediaController');
const accountController = require('../controllers/accountController');

// Tree routes
router.get('/trees', requireAuth, treeController.getUserTrees);
router.post('/trees', requireAuth, treeController.createTree);
router.get('/tree/:id', requireAuth, treeController.getTree);
router.delete('/tree/:id', requireAuth, treeController.deleteTree);

// Person routes
router.post('/person', requireAuth, personController.createPerson);
router.put('/person/:id', requireAuth, personController.updatePerson);
router.delete('/person/:id', requireAuth, personController.deletePerson);
router.post('/person/merge', requireAuth, personController.mergePersons);
router.get('/person/:id/media', requireAuth, mediaController.getMediaForPerson);

// Relationship routes
router.post('/relationship', requireAuth, relationshipController.createRelationship);
router.delete('/relationship/:id', requireAuth, relationshipController.deleteRelationship);

// Media routes
router.post('/media', requireAuth, mediaController.addMedia);

// Account routes
router.delete('/account', requireAuth, accountController.deleteAccount);

module.exports = router;
