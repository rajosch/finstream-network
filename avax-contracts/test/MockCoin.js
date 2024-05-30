const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("MockCoin", function () {
  async function deployMockCoinFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const MockCoin = await ethers.getContractFactory("MockCoin");
    const mockCoin = await MockCoin.deploy('USD Stable Coin', 'USDC');

    return { mockCoin, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { mockCoin } = await loadFixture(deployMockCoinFixture);

      expect(await mockCoin.name()).to.equal("USD Stable Coin");
      expect(await mockCoin.symbol()).to.equal("USDC");
    });
  });

  describe("Minting", function () {
    it("Should allow anyone to mint tokens", async function () {
      const { mockCoin, otherAccount } = await loadFixture(deployMockCoinFixture);
      const amount = ethers.parseUnits("1000", 18);

      await mockCoin.mint(otherAccount.address, amount);
      expect(await mockCoin.balanceOf(otherAccount.address)).to.equal(amount);
    });
  });

  describe("Burning", function () {
    it("Should allow anyone to burn tokens", async function () {
      const { mockCoin, otherAccount } = await loadFixture(deployMockCoinFixture);
      const mintAmount = ethers.parseUnits("1000", 18);
      const burnAmount = ethers.parseUnits("500", 18);

      await mockCoin.mint(otherAccount.address, mintAmount);
      await mockCoin.burn(otherAccount.address, burnAmount);

      const remainingBalance = mintAmount - burnAmount;
      expect(await mockCoin.balanceOf(otherAccount.address)).to.equal(remainingBalance);
    });
  });

  describe("Transfers", function () {
    it("Should allow transfers between accounts", async function () {
      const { mockCoin, owner, otherAccount } = await loadFixture(deployMockCoinFixture);
      const amount = ethers.parseUnits("1000", 18);

      await mockCoin.mint(owner.address, amount);
      await mockCoin.transfer(otherAccount.address, amount);

      expect(await mockCoin.balanceOf(otherAccount.address)).to.equal(amount);
      expect(await mockCoin.balanceOf(owner.address)).to.equal(0);
    });
  });
});
