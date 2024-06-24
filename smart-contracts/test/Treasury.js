const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("Treasury", function () {
  async function deployTreasuryFixture() {
    const [owner, user, otherAccount] = await ethers.getSigners();

    const MockCoin = await ethers.getContractFactory("MockCoin");
    const tokenA = await MockCoin.deploy("Token A", "TKNA");
    const tokenB = await MockCoin.deploy("Token B", "TKNB");

    const Treasury = await ethers.getContractFactory("Treasury");
    const treasury = await Treasury.deploy(owner);

    // Mint sufficient tokens to add as liquidity to contract
    const amount = ethers.parseUnits("5000", 18);
    await tokenA.mint(owner.address, amount);
    await tokenB.mint(owner.address, amount);

    await tokenA.approve(treasury, ethers.parseUnits("1000", 18));
    await tokenB.approve(treasury, ethers.parseUnits("1000", 18));

    // Chainlink price feed contract address EUR/USD (Sepolia)
    const priceFeedAddress = "0x1a81afB8146aeFfCFc5E50e8479e826E7D55b910";


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
  
      const priceFeed = new ethers.Contract(priceFeedAddress, priceFeedAbi, ethers.provider);

    return { treasury, tokenA, tokenB, owner, user, otherAccount, priceFeedAddress, priceFeed };
  }

  describe("Chainlink Price Feed", function () {
    it("should fetch the latest price from Chainlink price feed", async function () {
      const { priceFeed } = await loadFixture(deployTreasuryFixture);
  
      // Query the latest price
      const latestRoundData = await priceFeed.latestRoundData();
      console.log("Latest round data:", latestRoundData);
      console.log("Price:", ethers.formatUnits(latestRoundData.answer, 8));
  
      expect(latestRoundData).to.not.be.undefined;
    }); 
  });

  describe("Managing Supported Tokens", function () {
    it("Should allow the owner to add supported tokens", async function () {
      const { treasury, tokenA } = await loadFixture(deployTreasuryFixture);

      await treasury.addSupportedToken(tokenA);
      expect(await treasury.supportedTokens(tokenA)).to.be.true;
    });

    it("Should allow the owner to remove supported tokens", async function () {
      const { treasury, tokenA } = await loadFixture(deployTreasuryFixture);

      await treasury.addSupportedToken(tokenA);
      await treasury.removeSupportedToken(tokenA);
      expect(await treasury.supportedTokens(tokenA)).to.be.false;
    });
  });

  describe("Liquidity Management", function () {
    it("Should allow the owner to add liquidity", async function () {
      const { treasury, tokenA, owner } = await loadFixture(deployTreasuryFixture);

      await treasury.addSupportedToken(tokenA);

      await tokenA.approve(treasury, ethers.parseUnits("1000", 18));
      await treasury.addLiquidity(tokenA, ethers.parseUnits("1000", 18), owner);

      expect(await tokenA.balanceOf(treasury)).to.equal(ethers.parseUnits("1000", 18));
      expect(await tokenA.balanceOf(owner.address)).to.equal(ethers.parseUnits("4000", 18));
    });

    it("Should allow the owner to remove liquidity", async function () {
      const { treasury, tokenB, owner } = await loadFixture(deployTreasuryFixture);

      await treasury.addSupportedToken(tokenB);

      await tokenB.approve(treasury, ethers.parseUnits("1000", 18));
      await treasury.addLiquidity(tokenB, ethers.parseUnits("1000", 18), owner);
      await treasury.removeLiquidity(tokenB, ethers.parseUnits("500", 18), owner);

      expect(await tokenB.balanceOf(treasury)).to.equal(ethers.parseUnits("500", 18));
      expect(await tokenB.balanceOf(owner.address)).to.equal(ethers.parseUnits("4500", 18));
    });
  });

  describe("Token Transfers", function () {
    it("Should allow the owner to transfer tokens on behalf of a client", async function () {
      const { treasury, tokenA, tokenB, user, otherAccount, priceFeedAddress, priceFeed, owner } = await loadFixture(deployTreasuryFixture);
  
      // Query the latest price
      const latestRoundData = await priceFeed.latestRoundData();

      const exchangeRate = ethers.formatUnits(latestRoundData.answer, 8);

      const amount = ethers.parseUnits("5000", 18);
      await tokenA.mint(user.address, amount);

      const sentAmount = 500;
      const receivedAmount = sentAmount * exchangeRate;

      await treasury.addSupportedToken(tokenA);
      await treasury.addLiquidity(tokenA, ethers.parseUnits("1000", 18), owner);
      await treasury.addSupportedToken(tokenB);
      await treasury.addLiquidity(tokenB, ethers.parseUnits("1000", 18), owner);

      // Set price feed
      await treasury.setPriceFeed(tokenA, tokenB, priceFeedAddress);

      await tokenA.connect(user).approve(treasury, ethers.parseUnits("1000", 18));
      await treasury.transferTokens(tokenA, tokenB, user, otherAccount, ethers.parseUnits(sentAmount.toString(), 18));

      expect(await tokenA.balanceOf(user.address)).to.equal(ethers.parseUnits("4500", 18));
      expect(await tokenB.balanceOf(otherAccount.address)).to.equal(ethers.parseUnits(receivedAmount.toString(), 18));
    });

    it("Should allow the owner to transfer tokens on behalf of a client (inverted price feed)", async function () {
      const { treasury, tokenA, tokenB, user, otherAccount, priceFeedAddress, priceFeed, owner } = await loadFixture(deployTreasuryFixture);
  
      // Query the latest price
      const latestRoundData = await priceFeed.latestRoundData();

      const exchangeRate = ethers.formatUnits(latestRoundData.answer, 8);

      const amount = ethers.parseUnits("5000", 18);
      await tokenB.mint(user.address, amount);

      const sentAmount = 500;
      const receivedAmount = sentAmount / exchangeRate;

      await treasury.addSupportedToken(tokenA);
      await treasury.addLiquidity(tokenA, ethers.parseUnits("1000", 18), owner);
      await treasury.addSupportedToken(tokenB);
      await treasury.addLiquidity(tokenB, ethers.parseUnits("1000", 18), owner);

      // Set price feed
      await treasury.setPriceFeed(tokenA, tokenB, priceFeedAddress);

      await tokenB.connect(user).approve(treasury, ethers.parseUnits("1000", 18));
      await treasury.transferTokens(tokenB, tokenA, user, otherAccount, ethers.parseUnits(sentAmount.toString(), 18));

      expect(await tokenB.balanceOf(user.address)).to.equal(ethers.parseUnits("4500", 18));
      expect(await tokenA.balanceOf(otherAccount.address)).to.equal(ethers.parseUnits(receivedAmount.toFixed(5).toString(), 18));
    });
  });
});
