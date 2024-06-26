const messageService = require('../services/messageService');

exports.getAllMessages = async (req, res) => {
  try {
    const messages = await messageService.getAllMessages();
    res.send(messages);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.getMessagesByTicketId = async (req, res) => {
  const ticketId = req.params.ticketId;
  try {
    const messages = await messageService.getMessagesByTicketId(ticketId);
    res.send(messages);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.createMessage = async (req, res) => {
  const { messageType, messageArgs, ticketId, parent, entityIds } = req.body;

  try {
    const result = await messageService.createMessage(messageType, messageArgs, ticketId, parent, entityIds);
    res.status(201).send(result);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).send('Server error');
  }
};

exports.updateMessageVerifiedState = async (req, res) => {
  try {
    const messageId = req.params.id;
    const { newState } = req.body;
    await messageService.updateMessageVerifiedState(messageId, newState);
    res.status(200).send('State updated successfully');
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.buildMerkleTree = async (req, res) => {
  try {
    const ticketId = req.params.ticketId;
    const merkleTree = await messageService.buildMerkleTree(ticketId);
    res.send({ data: merkleTree, message: 'Merkle tree built.' });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.verifyMessage = async (req, res) => {
  try {
    const { ticketId, messageHash } = req.params;
    const result = await messageService.verifyMessage(ticketId, messageHash);
    res.send(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.getProof = async (req, res) => {
  try {
    const { ticketId, messageHash } = req.params;
    const proof = await messageService.getProof(ticketId, messageHash);
    res.send({ data: proof, message: 'Proof successfully created' });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.getMessagesForEntity = async (req, res) => {
  const { entityName } = req.params;

  try {
    const messages = await messageService.getMessagesForEntity(entityName);
    res.send(messages);
  } catch (error) {
    res.status(500).send(error.message);
  }
};
