const axios = require('axios');

const createApiClient = (port = 3000) => {
    return axios.create({
      baseURL: `http://localhost:${port}`,
    });
};


const addContract = async (contractData, port = 3000) => {
    try {
      const apiClient = createApiClient(port);
      const response = await apiClient.post('/contracts', contractData);
      return response.data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
};

async function main() {
    const [deployer, bankUSA, bankEU] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer)));
    console.log("BankUSA address:", bankUSA.address);
    console.log("BankUSA balance:", ethers.formatEther(await ethers.provider.getBalance(bankUSA)));
    console.log("BankEU address:", bankEU.address);
    console.log("BankEU balance:", ethers.formatEther(await ethers.provider.getBalance(bankEU)));

    const MockCoin = await ethers.getContractFactory("MockCoin");
    const usdc = await MockCoin.deploy("USD Coin", "USDC");
    console.log("USDC deployed to:", usdc.target);

    await addContract({name: 'USDC', address: usdc.target});
  
    const eurc = await MockCoin.deploy("EUR Coin", "EURC");
    console.log("EURC deployed to:", eurc.target);
    
    await addContract({name: 'EURC', address: eurc.target});

    const MsgTicket = await ethers.getContractFactory("MsgTicket");
    const msgTicket = await MsgTicket.deploy(deployer);
    console.log("MsgTicket deployed to:", msgTicket.target);
    
    await addContract({name: 'MsgTicket', address: msgTicket.target});
  
    const Treasury = await ethers.getContractFactory("Treasury");
    const treasury = await Treasury.deploy(deployer);
    console.log("Treasury deployed to:", treasury.target);
    
    await addContract({name: 'Treasury', address: treasury.target});
  
    const Controller = await ethers.getContractFactory("Controller");
    const controllerContract = await Controller.deploy(msgTicket, treasury, deployer);
    console.log("Controller deployed to:", controllerContract.target);
    
    await addContract({name: 'Controller', address: controllerContract.target});
  
    // Mint sufficient tokens to add as liquidity to contract
    const amount = ethers.parseUnits("1000000", 18);
    await usdc.mint(deployer, amount);
    await eurc.mint(deployer, amount);
    console.log("Minted tokens to deployer");
  
    await usdc.mint(bankUSA, amount);
    await eurc.mint(bankUSA, amount);
    console.log("Minted tokens to bankUSA");
  
    await usdc.mint(bankEU, amount);
    await eurc.mint(bankEU, amount);
    console.log("Minted tokens to bankEU");
  
    console.log("Deployer USDC balance:", ethers.formatUnits(await usdc.balanceOf(deployer), 18));
    console.log("Deployer EURC balance:", ethers.formatUnits(await eurc.balanceOf(deployer), 18));
    console.log("BankUSA USDC balance:", ethers.formatUnits(await usdc.balanceOf(bankUSA), 18));
    console.log("BankUSA EURC balance:", ethers.formatUnits(await eurc.balanceOf(bankUSA), 18));
    console.log("BankEU USDC balance:", ethers.formatUnits(await usdc.balanceOf(bankEU), 18));
    console.log("BankEU EURC balance:", ethers.formatUnits(await eurc.balanceOf(bankEU), 18));
  
    await usdc.approve(treasury, ethers.parseUnits("100000", 18));
    await eurc.approve(treasury, ethers.parseUnits("100000", 18));
    console.log("Approved tokens to treasury");
  
    // Transfer ownership of MsgTicket to Controller
    await msgTicket.transferOwnership(controllerContract);
    console.log("Transferred ownership of MsgTicket to Controller");

    // Transfer ownership of Treasury to Controller
    await treasury.transferOwnership(controllerContract);
    console.log("Transferred ownership of Treasury to Controller");
  
    await controllerContract.addClient(bankUSA);
    await controllerContract.addClient(bankEU);
    console.log("Added bankUSA and bankEU as clients to Controller");
  
    const priceFeedAddress = "0x1a81afB8146aeFfCFc5E50e8479e826E7D55b910"; // USD/EUR
  
    await controllerContract.setPriceFeed(usdc, eurc, priceFeedAddress);
    console.log("Set price feed for USDC and EURC");
  
    console.log("Setup completed");
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
