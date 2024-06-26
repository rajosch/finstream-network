const entityService = require('../services/entityService');

exports.getAllEntities = async (req, res) => {
  try {
    const entities = await entityService.getAllEntities();
    res.send(entities);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.createEntity = async (req, res) => {
  try {
    const { name, address, privateKey, currency } = req.body;
    const entityId = await entityService.createEntity(name, address, privateKey, currency);
    res.status(201).send({ entityId });
  } catch (error) {
    console.error('Error creating entity:', error.message);
    res.status(500).send("Server Error");
  }
};
