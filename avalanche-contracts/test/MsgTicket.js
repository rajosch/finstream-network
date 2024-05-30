const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("MsgTicket", function () {
  async function deployMsgTicketFixture() {
    const [owner, controller, otherAccount] = await ethers.getSigners();

    const MsgTicket = await ethers.getContractFactory("MsgTicket");
    const msgTicket = await MsgTicket.deploy();

    await msgTicket.grantRole(await msgTicket.CONTROLLER_ROLE(), controller.address);

    return { msgTicket, owner, controller, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { msgTicket } = await loadFixture(deployMsgTicketFixture);

      expect(await msgTicket.name()).to.equal("MsgTicket");
      expect(await msgTicket.symbol()).to.equal("MTKT");
    });

    it("Should grant the default admin role to the deployer", async function () {
      const { msgTicket, owner } = await loadFixture(deployMsgTicketFixture);

      expect(await msgTicket.hasRole(await msgTicket.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
    });

    it("Should grant the controller role to the deployer", async function () {
      const { msgTicket, owner } = await loadFixture(deployMsgTicketFixture);

      expect(await msgTicket.hasRole(await msgTicket.CONTROLLER_ROLE(), owner.address)).to.be.true;
    });
  });

  describe("Minting", function () {
    it("Should allow the controller to mint tokens", async function () {
      const { msgTicket, controller, otherAccount } = await loadFixture(deployMsgTicketFixture);
      const tokenId = 0;

      await msgTicket.connect(controller).mintTicket(otherAccount.address);

      expect(await msgTicket.ownerOf(tokenId)).to.equal(otherAccount.address);
      expect(await msgTicket.balanceOf(otherAccount.address)).to.equal(1);
    });

    it("Should emit TicketMinted event on mint", async function () {
      const { msgTicket, controller, otherAccount } = await loadFixture(deployMsgTicketFixture);
      const tokenId = 0;

      await expect(msgTicket.connect(controller).mintTicket(otherAccount.address))
        .to.emit(msgTicket, "TicketMinted")
        .withArgs(otherAccount.address, tokenId, await ethers.provider.getBlockNumber() + 1);
    });

    // it("Should not allow non-controllers to mint tokens", async function () {
    //   const { msgTicket, otherAccount } = await loadFixture(deployMsgTicketFixture);

    //   await expect(msgTicket.connect(otherAccount).mintTicket(otherAccount.address)).to.be.revertedWith(
    //     `AccessControlUnauthorizedAccount("${otherAccount.address.toLowerCase()}", "${(await msgTicket.CONTROLLER_ROLE()).toLowerCase()}")`);
    // });
  });

  describe("Merkle Root Management", function () {
    it("Should allow the controller to update the Merkle root", async function () {
      const { msgTicket, controller, otherAccount } = await loadFixture(deployMsgTicketFixture);
      const tokenId = 0;
      const merkleRoot = ethers.keccak256(ethers.toUtf8Bytes("merkleRoot"));

      await msgTicket.connect(controller).mintTicket(otherAccount.address);
      await msgTicket.connect(controller).updateMerkleRoot(tokenId, merkleRoot);

      expect(await msgTicket.verifyMessage(tokenId, ethers.keccak256(ethers.toUtf8Bytes("message")), [])).to.be.false;
    });

    it("Should emit MerkleRootUpdated event on Merkle root update", async function () {
      const { msgTicket, controller, otherAccount } = await loadFixture(deployMsgTicketFixture);
      const tokenId = 0;
      const merkleRoot = ethers.keccak256(ethers.toUtf8Bytes("merkleRoot"));

      await msgTicket.connect(controller).mintTicket(otherAccount.address);
      await expect(msgTicket.connect(controller).updateMerkleRoot(tokenId, merkleRoot))
        .to.emit(msgTicket, "MerkleRootUpdated")
        .withArgs(tokenId, merkleRoot, await ethers.provider.getBlockNumber() + 1);
    });

    // it("Should not allow non-controllers to update the Merkle root", async function () {
    //     const { msgTicket, otherAccount } = await loadFixture(deployMsgTicketFixture);
    //     const tokenId = 0;
    //     const merkleRoot = ethers.keccak256(ethers.toUtf8Bytes("merkleRoot"));

    //     await msgTicket.connect(otherAccount).mintTicket(otherAccount.address);
        
    //     const expectedError = `AccessControlUnauthorizedAccount("${otherAccount.address.toLowerCase()}", "${controllerRole.toLowerCase()}")`;
        
    //     try {
    //         await msgTicket.connect(otherAccount).updateMerkleRoot(tokenId, merkleRoot);
    //         expect.fail("Expected transaction to be reverted");
    //     } catch (error) {
    //         console.log("Caught error:", error.message);
    //         expect(error.message).to.include(expectedAddress);
    //         expect(error.message).to.include(expectedRole);
    //     }
    //     // await expect(msgTicket.connect(otherAccount).updateMerkleRoot(tokenId, merkleRoot)).to.be.revertedWith(
    //     //     `AccessControlUnauthorizedAccount("${otherAccount.address.toLowerCase()}", "${(await msgTicket.CONTROLLER_ROLE()).toLowerCase()}")`
    //     // );
    // });
  });

  describe("Verification", function () {
    it("Should verify a message against the Merkle root", async function () {
      const { msgTicket, controller, otherAccount } = await loadFixture(deployMsgTicketFixture);
      const tokenId = 0;
      const merkleRoot = ethers.keccak256(ethers.toUtf8Bytes("merkleRoot"));
      const message = ethers.keccak256(ethers.toUtf8Bytes("message"));
      const proof = [];

      await msgTicket.connect(controller).mintTicket(otherAccount.address);
      await msgTicket.connect(controller).updateMerkleRoot(tokenId, merkleRoot);

      expect(await msgTicket.verifyMessage(tokenId, message, proof)).to.be.false;
    });
  });
});
