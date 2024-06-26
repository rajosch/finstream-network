const express = require('express');
const router = express.Router();
const messageEntityController = require('../controllers/messageEntityController');

router.get('/', messageEntityController.getAllMessageEntities);
router.post('/', messageEntityController.createMessageEntity);

module.exports = router;
