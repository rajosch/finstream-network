import { ethers } from "ethers";
import store from "~/store";
import controllerAbi from "../assets/abi/controller.json";

const LOCAL_NODE_URL = "http://localhost:8545";

async function initializeWallets() {
  await store.queryData();

  if (!store.entities.value || !store.contracts.value) {
    console.error("Entities or contracts data is not available");
    return;
  }

  const usBankEntity = store.entities.value.find(obj => obj.name === 'Bank USA');
  const euBankEntity = store.entities.value.find(obj => obj.name === 'Bank EU');

  if (!usBankEntity || !euBankEntity) {
    console.error("Bank entities not found");
    return;
  }

  const provider = new ethers.JsonRpcProvider(LOCAL_NODE_URL); 
  const usWallet = new ethers.Wallet(usBankEntity.privateKey, provider);
  const euWallet = new ethers.Wallet(euBankEntity.privateKey, provider);

  return { usWallet, euWallet };
}

function setTokens(currency) {
    return {
      fromToken: currency.localeCompare('$') === 0 ? store.contracts.value.find(obj => obj.name === 'USDC').address :  store.contracts.value.find(obj => obj.name === 'EURC').address,
      toToken: currency.localeCompare('€') === 0 ? store.contracts.value.find(obj => obj.name === 'USDC').address :  store.contracts.value.find(obj => obj.name === 'EURC').address
    }
}

export const mintTicket = async (bankName) => {
  const { usWallet, euWallet } = await initializeWallets();
  const bank = bankName.localeCompare('Bank USA') === 0 ? usWallet : euWallet;
  const controllerAddress = store.contracts.value.find(obj => obj.name === 'Controller').address;
  const controller = new ethers.Contract(controllerAddress, controllerAbi, bank);

  const ticketIdSimulated = await controller.initiateTicket.staticCall();
  const tx = await controller.initiateTicket();

  // Wait for the transaction to be mined
  await tx.wait();

  return ticketIdSimulated.toString();
}

export const updateMerkleRoot = async (bankName, ticketId, root) => {
  const { usWallet, euWallet } = await initializeWallets();
  const bank = bankName.localeCompare('Bank USA') === 0 ? usWallet : euWallet;
  const controllerAddress = store.contracts.value.find(obj => obj.name === 'Controller').address;
  const controller = new ethers.Contract(controllerAddress, controllerAbi, bank);
  try {
    await controller.updateMerkleRoot(ticketId, root);
  } catch (error) {
    console.error('Error updating merkle root:', error);
  }
}

export const getExchangeRate = async () => {
  // Chainlink price feed contract ABI
  const priceFeedAbi = [
    {
      "constant": true,
      "inputs": [],
      "name": "latestRoundData",
      "outputs": [
        { "name": "roundId", "type": "uint80" },
        { "name": "answer", "type": "int256" },
        { "name": "startedAt", "type": "uint256" },
        { "name": "updatedAt", "type": "uint256" },
        { "name": "answeredInRound", "type": "uint80" }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }
  ];

  // Create a contract instance
  const provider = new ethers.JsonRpcProvider(LOCAL_NODE_URL); 
  const priceFeed = new ethers.Contract("0x1a81afB8146aeFfCFc5E50e8479e826E7D55b910", priceFeedAbi, provider);

  // Query the latest price
  const latestRoundData = await priceFeed.latestRoundData();
  return ethers.formatUnits(latestRoundData.answer, 8);
}

export const transferFunds = async (debtor, debtorAgent, creditorAgent, amount, ticketId, leaf, proof) => {
  const { usWallet, euWallet } = await initializeWallets();
  const { fromToken, toToken } = setTokens(debtor.currency);
  const bank = debtor.name.localeCompare('Bank USA') === 0 ? usWallet : euWallet;
  const controllerAddress = store.contracts.value.find(obj => obj.name === 'Controller').address;
  const controller = new ethers.Contract(controllerAddress, controllerAbi, bank);

  await controller.initiateTransaction(debtorAgent, creditorAgent, fromToken, toToken, ethers.parseUnits(amount.toString(), 18), ticketId, leaf, proof);
}
