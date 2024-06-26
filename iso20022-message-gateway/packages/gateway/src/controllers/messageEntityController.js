const messageEntityService = require('../services/messageEntityService');

exports.getAllMessageEntities = async (req, res) => {
  try {
    const messageEntities = await messageEntityService.getAllMessageEntities();
    res.send(messageEntities);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.createMessageEntity = async (req, res) => {
  try {
    const { messageId, entityId } = req.body;
    const id = await messageEntityService.createMessageEntity(messageId, entityId);
    res.status(201).send({ id });
  } catch (error) {
    console.error('Error creating message-entity:', error.message);
    res.status(500).send("Server Error");
  }
};
