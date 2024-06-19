require("@nomicfoundation/hardhat-toolbox");

require('dotenv').config();

module.exports = {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      forking: {
        // url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`
        url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
      }
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY]
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY]
    },
    fuji: {
      url: `https://api.avax-test.network/ext/bc/C/rpc`,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};