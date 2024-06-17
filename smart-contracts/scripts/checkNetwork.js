async function main() {
    const network = await ethers.provider.getNetwork();
    console.log("Network:", network);
    console.log("Blocknumber:", await ethers.provider.getBlockNumber());

    const [deployer] = await ethers.getSigners();  

    console.log("Deployer address:", deployer.address);
    console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  