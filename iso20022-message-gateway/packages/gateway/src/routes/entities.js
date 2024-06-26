const express = require('express');
const router = express.Router();
const entityController = require('../controllers/entityController');

router.get('/', entityController.getAllEntities);
router.post('/', entityController.createEntity);

module.exports = router;
