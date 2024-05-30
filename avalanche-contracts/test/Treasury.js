const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("Treasury", function () {
  async function deployTreasuryFixture() {
    const [admin, manager, controller, user, otherAccount] = await ethers.getSigners();

    const MockCoin = await ethers.getContractFactory("MockCoin");
    const tokenA = await MockCoin.deploy("Token A", "TKNA");
    const tokenB = await MockCoin.deploy("Token B", "TKNB");

    const Treasury = await ethers.getContractFactory("Treasury");
    const treasury = await Treasury.deploy();

    await treasury.grantRole(await treasury.MANAGER_ROLE(), manager.address);
    await treasury.grantRole(await treasury.CONTROLLER_ROLE(), controller.address);

    // Mint sufficient tokens to add as liquidity to contract
    const amount = ethers.parseUnits("1000", 18);
    await tokenA.connect(manager).mint(manager.address, amount);
    // Ensure the manager approves the Treasury contract to spend their tokens
    await tokenA.connect(manager).approve(treasury, ethers.parseUnits("1000", 18));

    return { treasury, tokenA, tokenB, admin, manager, controller, user, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the correct admin role", async function () {
      const { treasury, admin } = await loadFixture(deployTreasuryFixture);

      expect(await treasury.hasRole(await treasury.DEFAULT_ADMIN_ROLE(), admin.address)).to.be.true;
    });

    it("Should grant the manager role", async function () {
      const { treasury, manager } = await loadFixture(deployTreasuryFixture);

      expect(await treasury.hasRole(await treasury.MANAGER_ROLE(), manager.address)).to.be.true;
    });

    it("Should grant the controller role", async function () {
      const { treasury, controller } = await loadFixture(deployTreasuryFixture);

      expect(await treasury.hasRole(await treasury.CONTROLLER_ROLE(), controller.address)).to.be.true;
    });
  });

  describe("Managing Supported Tokens", function () {
    it("Should allow the manager to add supported tokens", async function () {
      const { treasury, tokenA, manager } = await loadFixture(deployTreasuryFixture);

      await treasury.connect(manager).addSupportedToken(tokenA);
      expect(await treasury.supportedTokens(tokenA)).to.be.true;
    });

    it("Should allow the manager to remove supported tokens", async function () {
      const { treasury, tokenA, manager } = await loadFixture(deployTreasuryFixture);

      await treasury.connect(manager).addSupportedToken(tokenA);
      await treasury.connect(manager).removeSupportedToken(tokenA);
      expect(await treasury.supportedTokens(tokenA)).to.be.false;
    });
  });

  describe("Liquidity Management", function () {
    it("Should allow the manager to add liquidity", async function () {
      const { treasury, tokenA, manager, admin } = await loadFixture(deployTreasuryFixture);

      await treasury.connect(manager).addSupportedToken(tokenA);

      await tokenA.connect(admin).approve(treasury, ethers.parseUnits("1000", 18));
      await treasury.connect(manager).addLiquidity(tokenA, ethers.parseUnits("1000", 18));

      expect(await tokenA.balanceOf(treasury)).to.equal(ethers.parseUnits("1000", 18));
    });

    it("Should allow the manager to remove liquidity", async function () {
      const { treasury, tokenA, manager, admin } = await loadFixture(deployTreasuryFixture);

      await treasury.connect(manager).addSupportedToken(tokenA);

      await tokenA.connect(admin).approve(treasury, ethers.parseUnits("1000", 18));
      await treasury.connect(manager).addLiquidity(tokenA, ethers.parseUnits("1000", 18));
      await treasury.connect(manager).removeLiquidity(tokenA, ethers.parseUnits("500", 18));

      expect(await tokenA.balanceOf(treasury)).to.equal(ethers.parseUnits("500", 18));
      expect(await tokenA.balanceOf(manager.address)).to.equal(ethers.parseUnits("500", 18));
    });
  });

  describe("Token Transfers", function () {
    it("Should allow the controller to transfer tokens on behalf of a client", async function () {
      const { treasury, tokenA, controller, user, otherAccount, manager } = await loadFixture(deployTreasuryFixture);

      await treasury.connect(manager).addSupportedToken(tokenA);
      await treasury.connect(manager).addLiquidity(tokenA, ethers.parseUnits("1000", 18));

      await tokenA.connect(user).approve(treasury, ethers.parseUnits("1000", 18));
      await treasury.connect(controller).transferTokens(tokenA, user.address, otherAccount.address, ethers.parseUnits("500", 18), user.address);

      expect(await tokenA.balanceOf(otherAccount.address)).to.equal(ethers.parseUnits("500", 18));
    });

    it("Should revert if the token is not supported", async function () {
      const { treasury, tokenA, controller, user, otherAccount } = await loadFixture(deployTreasuryFixture);

      await expect(
        treasury.connect(controller).transferTokens(tokenA, user.address, otherAccount.address, ethers.parseUnits("500", 18), user.address)
      ).to.be.revertedWith("Token not supported");
    });
  });

  describe("Exchanging Tokens", function () {
    it("Should allow the controller to exchange tokens on behalf of a client", async function () {
      const { treasury, tokenA, tokenB, controller, user, otherAccount, manager } = await loadFixture(deployTreasuryFixture);

      await treasury.connect(manager).addSupportedToken(tokenA);
      await tokenA.connect(user).approve(treasury, ethers.parseUnits("1000", 18));
      await treasury.connect(controller).exchangeTokens(tokenA, tokenA, ethers.parseUnits("500", 18), ethers.parseUnits("100", 18), user.address);

      // Assuming 1 tokenA = 0.2 tokenB for this test
      expect(await tokenB.balanceOf(otherAccount.address)).to.equal(ethers.parseUnits("100", 18));
    });

    it("Should revert if the token is not supported", async function () {
      const { treasury, tokenA, tokenB, controller, user } = await loadFixture(deployTreasuryFixture);

      await expect(
        treasury.connect(controller).exchangeTokens(tokenA, tokenA, ethers.parseUnits("500", 18), ethers.parseUnits("100", 18), user.address)
      ).to.be.revertedWith("From token not supported");
    });
  });

  describe("Repaying Borrowed Tokens", function () {
    it("Should allow the controller to repay borrowed tokens on behalf of a client", async function () {
      const { treasury, tokenA, controller, user, manager } = await loadFixture(deployTreasuryFixture);

      await treasury.connect(manager).addSupportedToken(tokenA);
      await treasury.setMaxLiquidityPerUser(user.address, tokenA, ethers.parseUnits("1000", 18));
      await treasury.connect(controller).transferTokens(tokenA, treasury, user.address, ethers.parseUnits("500", 18), user.address);

      await tokenA.connect(user).approve(treasury, ethers.parseUnits("500", 18));
      await treasury.connect(controller).repayBorrowedTokens(tokenA, ethers.parseUnits("500", 18), user.address);

      expect(await treasury.borrowedAmounts(user.address, tokenA)).to.equal(0);
    });
  });
});
