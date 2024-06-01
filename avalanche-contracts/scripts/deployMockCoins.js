const { ethers } = require("hardhat");

async function main() {
    const provider = new ethers.JsonRpcProvider('https://api.avax-test.network/ext/bc/C/rpc');
    const blockNumber = await provider.getBlockNumber();
    
    console.log("Connected to Avalanche Fuji Testnet");
    console.log("Current block number:", blockNumber);
    const [deployer] = await ethers.getSigners();
    const balance = await provider.getBalance(deployer);
    console.log("Account balance:", balance.toString());
    console.log("Account address:", deployer.address);
  
    const USDC = await ethers.getContractFactory("MockCoin");
    const usdcContract = await USDC.deploy("USD Coin", "USDC");

    const EURC = await ethers.getContractFactory("MockCoin");
    const eurcContract = await EURC.deploy("EUR Coin", "EURC");
  
    console.log("Contract deployed to address:", usdcContract.address);
    console.log("Contract deployed to address:", eurcContract.address);

    const euBank = "0xe725c3F6534563483D3a0Ede818868ceBB1a8c80";
    const usBank = "0xFB78AF53Fc9BD34f9E078aCb912e8103F08C4819";
    const amount = ethers.parseUnits("1000000000", 18); 


    // Mint the tokens
    let tx = await usdcContract.mint(usBank, amount);
    await tx.wait();

    tx = await eurcContract.mint(euBank, amount);
    await tx.wait();


}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});