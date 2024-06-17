// scripts/check-fork.js

async function main() {
    const network = await ethers.provider.getNetwork();
    console.log("Network:", network);
  
    const latestBlock = await ethers.provider.getBlockNumber();
    console.log("Latest block number:", latestBlock);
  
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));
  
    // Chainlink price feed contract address (Sepolia)
    const priceFeedAddress = "0x1a81afB8146aeFfCFc5E50e8479e826E7D55b910";
    
    // Check if the contract exists
    const code = await ethers.provider.getCode(priceFeedAddress);
    if (code === '0x') {
      console.error("No contract found at address", priceFeedAddress);
      return;
    }
  
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
    const priceFeed = new ethers.Contract(priceFeedAddress, priceFeedAbi, ethers.provider);
  
    // Query the latest price
    try {
      const latestRoundData = await priceFeed.latestRoundData();
      console.log("Latest round data:", latestRoundData);
      console.log("Price:", ethers.formatUnits(latestRoundData.answer, 8));
    } catch (error) {
      console.error("Error calling latestRoundData:", error);
    }
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  