const axios = require('axios');
const { ethers } = require('hardhat');

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
    console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));
    console.log("BankUSA address:", bankUSA.address);
    console.log("BankUSA balance:", ethers.formatEther(await ethers.provider.getBalance(bankUSA.address)));
    console.log("BankEU address:", bankEU.address);
    console.log("BankEU balance:", ethers.formatEther(await ethers.provider.getBalance(bankEU.address)));

    const MockCoin = await ethers.getContractFactory("MockCoin");

    const maxFeePerGas = ethers.parseUnits("50000", "gwei");
    const maxPriorityFeePerGas = ethers.parseUnits("1000", "gwei"); 

    const usdc = await MockCoin.deploy("USD Coin", "USDC", { maxFeePerGas, maxPriorityFeePerGas });
    console.log("USDC deployed to:", usdc.target);

    await addContract({ name: 'USDC', address: usdc.target });

    const eurc = await MockCoin.deploy("EUR Coin", "EURC", { maxFeePerGas, maxPriorityFeePerGas });
    console.log("EURC deployed to:", eurc.target);

    await addContract({ name: 'EURC', address: eurc.target });

    const MsgTicket = await ethers.getContractFactory("MsgTicket");
    const msgTicket = await MsgTicket.deploy(deployer.address, { maxFeePerGas, maxPriorityFeePerGas });
    console.log("MsgTicket deployed to:", msgTicket.target);

    await addContract({ name: 'MsgTicket', address: msgTicket.target });

    const Treasury = await ethers.getContractFactory("Treasury");
    const treasury = await Treasury.deploy(deployer.address, { maxFeePerGas, maxPriorityFeePerGas });
    console.log("Treasury deployed to:", treasury.target);

    await addContract({ name: 'Treasury', address: treasury.target });

    const Controller = await ethers.getContractFactory("Controller");
    const controllerContract = await Controller.deploy(msgTicket, treasury, deployer.address, { maxFeePerGas, maxPriorityFeePerGas });
    console.log("Controller deployed to:", controllerContract.target);

    await addContract({ name: 'Controller', address: controllerContract.target });

    const amount = ethers.parseUnits("1000000", 18);
    await usdc.mint(deployer.address, amount);
    await eurc.mint(deployer.address, amount);
    console.log("Minted tokens to deployer");

    await usdc.mint(bankUSA.address, amount);
    await eurc.mint(bankUSA.address, amount);
    console.log("Minted tokens to bankUSA");

    await usdc.mint(bankEU.address, amount);
    await eurc.mint(bankEU.address, amount);
    console.log("Minted tokens to bankEU");

    console.log("Deployer USDC balance:", ethers.formatUnits(await usdc.balanceOf(deployer.address), 18));
    console.log("Deployer EURC balance:", ethers.formatUnits(await eurc.balanceOf(deployer.address), 18));
    console.log("BankUSA USDC balance:", ethers.formatUnits(await usdc.balanceOf(bankUSA.address), 18));
    console.log("BankUSA EURC balance:", ethers.formatUnits(await eurc.balanceOf(bankUSA.address), 18));
    console.log("BankEU USDC balance:", ethers.formatUnits(await usdc.balanceOf(bankEU.address), 18));
    console.log("BankEU EURC balance:", ethers.formatUnits(await eurc.balanceOf(bankEU.address), 18));

    await msgTicket.transferOwnership(controllerContract);
    console.log("Transferred ownership of MsgTicket to Controller");

    await treasury.transferOwnership(controllerContract);
    console.log("Transferred ownership of Treasury to Controller");

    await controllerContract.addClient(bankUSA.address);
    await controllerContract.addClient(bankEU.address);
    console.log("Added bankUSA and bankEU as clients to Controller");

    await controllerContract.addSupportedToken(usdc);
    await controllerContract.addSupportedToken(eurc);
    console.log("Added USDC and EURC as supported tokens to the Treasury");


    await usdc.approve(treasury, ethers.parseUnits("1000000", 18));
    await eurc.approve(treasury, ethers.parseUnits("1000000", 18));

    await usdc.connect(bankUSA).approve(treasury, ethers.parseUnits("1000000", 18));
    await eurc.connect(bankEU).approve(treasury, ethers.parseUnits("1000000", 18));
    
    console.log("Approved tokens to treasury");

    await controllerContract.addLiquidity(usdc, ethers.parseUnits("1000000", 18));
    await controllerContract.addLiquidity(eurc, ethers.parseUnits("1000000", 18));
    console.log("Added USDC and EURC liquidity to the Treasury");

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
