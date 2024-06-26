const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

router.get('/', messageController.getAllMessages);
router.get('/:ticketId', messageController.getMessagesByTicketId);
router.post('/', messageController.createMessage);
router.put('/:id/verified', messageController.updateMessageVerifiedState);
router.get('/:ticketId/build-merkle-tree', messageController.buildMerkleTree);
router.get('/:ticketId/:messageHash/verify', messageController.verifyMessage);
router.get('/:ticketId/:messageHash/proof', messageController.getProof);
router.get('/entity/:entityName', messageController.getMessagesForEntity);

module.exports = router;
