const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

const { buildMerkleTree, createProof, calculateLeafHash } = require('../../iso20022-message-gateway/packages/merkle-tree-validator/src/index');

describe("MsgTicket", function () {
  async function deployMsgTicketFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const MsgTicket = await ethers.getContractFactory("MsgTicket");
    const msgTicket = await MsgTicket.deploy(owner);

    return { msgTicket, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { msgTicket } = await loadFixture(deployMsgTicketFixture);

      expect(await msgTicket.name()).to.equal("MsgTicket");
      expect(await msgTicket.symbol()).to.equal("MTKT");
    });
  });

  describe("Minting", function () {
    it("Should allow the owner to mint tokens", async function () {
      const { msgTicket, otherAccount } = await loadFixture(deployMsgTicketFixture);
      const tokenId = 0;

      await msgTicket.mintTicket(otherAccount.address);

      expect(await msgTicket.ownerOf(tokenId)).to.equal(otherAccount.address);
      expect(await msgTicket.balanceOf(otherAccount.address)).to.equal(1);
    });

    it("Should emit TicketMinted event on mint", async function () {
      const { msgTicket, otherAccount } = await loadFixture(deployMsgTicketFixture);
      const tokenId = 0;

      await expect(msgTicket.mintTicket(otherAccount.address))
        .to.emit(msgTicket, "TicketMinted")
        .withArgs(otherAccount.address, tokenId, await ethers.provider.getBlockNumber() + 1);
    });
  });

  describe("Merkle Root Management", function () {
    it("Should allow the owner to update the Merkle root", async function () {
      const { msgTicket, otherAccount } = await loadFixture(deployMsgTicketFixture);
      const tokenId = 0;
      const merkleRoot = ethers.keccak256(ethers.toUtf8Bytes("merkleRoot"));

      await msgTicket.mintTicket(otherAccount.address);
      await msgTicket.updateMerkleRoot(tokenId, merkleRoot);

      expect(await msgTicket.verifyMessage(tokenId, ethers.keccak256(ethers.toUtf8Bytes("message")), [])).to.be.false;
    });

    it("Should emit MerkleRootUpdated event on Merkle root update", async function () {
      const { msgTicket, otherAccount } = await loadFixture(deployMsgTicketFixture);
      const tokenId = 0;
      const merkleRoot = ethers.keccak256(ethers.toUtf8Bytes("merkleRoot"));

      await msgTicket.mintTicket(otherAccount.address);
      await expect(msgTicket.updateMerkleRoot(tokenId, merkleRoot))
        .to.emit(msgTicket, "MerkleRootUpdated")
        .withArgs(tokenId, merkleRoot, await ethers.provider.getBlockNumber() + 1);
    });
  });

  describe("Verification", function () {
    it("Should verify a correct leafe against the Merkle root", async function () {
      const { msgTicket, otherAccount } = await loadFixture(deployMsgTicketFixture);
      const tokenId = 0;

      const values = [['message']];
      const leafEncoding = ['string'];

      const tree = buildMerkleTree(values, leafEncoding);

      const proof = createProof(tree, ['message']);

      const leaf = calculateLeafHash(tree, ['message'])

      await msgTicket.mintTicket(otherAccount);
      await msgTicket.updateMerkleRoot(tokenId, tree.root);

      expect(await msgTicket.verifyMessage(tokenId, leaf, proof)).to.be.true;
    });

    it("Should not verify a false leafe against the Merkle root", async function () {
      const { msgTicket, otherAccount } = await loadFixture(deployMsgTicketFixture);
      const tokenId = 0;

      const values = [['message']];
      const leafEncoding = ['string'];

      const tree = buildMerkleTree(values, leafEncoding);

      const proof = createProof(tree, ['message']);

      const leaf = ethers.keccak256(ethers.toUtf8Bytes("evil"));

      await msgTicket.mintTicket(otherAccount);
      await msgTicket.updateMerkleRoot(tokenId, tree.root);

      expect(await msgTicket.verifyMessage(tokenId, leaf, proof)).to.be.false;
    });
  });
});
