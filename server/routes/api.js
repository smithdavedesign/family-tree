const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const treeController = require('../controllers/treeController');
const personController = require('../controllers/personController');
const relationshipController = require('../controllers/relationshipController');
const mediaController = require('../controllers/mediaController');

// Tree routes
router.get('/trees', requireAuth, treeController.getUserTrees);
router.get('/tree/:id', requireAuth, treeController.getTree);

// Person routes
router.post('/person', requireAuth, personController.createPerson);
router.put('/person/:id', requireAuth, personController.updatePerson);
router.delete('/person/:id', requireAuth, personController.deletePerson);
router.get('/person/:id/media', requireAuth, mediaController.getMediaForPerson);

// Relationship routes
router.post('/relationship', requireAuth, relationshipController.createRelationship);
router.delete('/relationship/:id', requireAuth, relationshipController.deleteRelationship);

// Media routes
router.post('/media', requireAuth, mediaController.addMedia);

module.exports = router;
