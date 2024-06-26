const contractService = require('../services/contractService');

exports.getAllContracts = async (req, res) => {
  try {
    const contracts = await contractService.getAllContracts();
    res.send(contracts);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.createContract = async (req, res) => {
  try {
    const { name, address } = req.body;
    const contractId = await contractService.createContract(name, address);
    res.status(201).send({ contractId });
  } catch (error) {
    console.error('Error creating contract:', error.message);
    res.status(500).send("Server Error");
  }
};
