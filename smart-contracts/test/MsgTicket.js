const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

const { buildMerkleTree, createProof, calculateLeafHash } = require('../../iso20022-message-gateway/packages/merkle-tree-validator/src/index');

describe("MsgTicket", function () {
  async function deployMsgTicketFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const MsgTicket = await ethers.getContractFactory("MsgTicket");
    const msgTicket = await MsgTicket.deploy(owner.address);

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
    it("Should allow the owner to set the Merkle root", async function () {
      const { msgTicket, otherAccount } = await loadFixture(deployMsgTicketFixture);
      const tokenId = 0;

      const values = [['message']];
      const leafEncoding = ['string'];
      const tree = buildMerkleTree(values, leafEncoding);

      await msgTicket.mintTicket(otherAccount.address);
      await msgTicket.updateMerkleRoot(tokenId,tree.root);

      expect(await msgTicket.merkleRoots(tokenId)).to.equal(tree.root);
    });

    it("Should allow the owner to update the Merkle root", async function () {
      const { msgTicket, otherAccount } = await loadFixture(deployMsgTicketFixture);
      const tokenId = 0;
      const leafEncoding = ['string'];
      const values = [['message']];
    
      let tree = buildMerkleTree(values, leafEncoding);

      await msgTicket.mintTicket(otherAccount.address);

     await msgTicket.updateMerkleRoot(tokenId, tree.root);
    
      // Verify the initial Merkle root is set correctly
      expect(await msgTicket.merkleRoots(tokenId)).to.equal(tree.root);
    
      // Add a new leaf and update the Merkle root
      values.push(['newMessage-123']);
      tree = buildMerkleTree(values, leafEncoding);

      await msgTicket.updateMerkleRoot(tokenId, tree.root);

      // Verify the Merkle root after adding 'newMessage'
      expect(await msgTicket.merkleRoots(tokenId)).to.equal(tree.root);
    
      // Add another new leaf and update the Merkle root
      values.push(['12415jklöafweaklae']);
      tree = buildMerkleTree(values, leafEncoding);

      await msgTicket.updateMerkleRoot(tokenId, tree.root);

      // Verify the Merkle root after adding 'messageThree'
      expect(await msgTicket.merkleRoots(tokenId)).to.equal(tree.root);
    });

    it("Should emit MerkleRootUpdated event on Merkle root update", async function () {
      const { msgTicket, otherAccount } = await loadFixture(deployMsgTicketFixture);
      const tokenId = 0;

      await msgTicket.mintTicket(otherAccount.address);

      const values = [['message']];
      const leafEncoding = ['string'];
      const tree = buildMerkleTree(values, leafEncoding);

      await expect(msgTicket.updateMerkleRoot(tokenId, tree.root))
        .to.emit(msgTicket, "MerkleRootUpdated")
        .withArgs(tokenId, tree.root, await ethers.provider.getBlockNumber() + 1);


      expect(await msgTicket.merkleRoots(tokenId)).to.equal(tree.root);
      
    });
  });

  describe("Verification", function () {
    it("Should verify a correct leaf against the Merkle root", async function () {
      const { msgTicket, otherAccount } = await loadFixture(deployMsgTicketFixture);
      const tokenId = 0;

      const values = [['message']];
      const leafEncoding = ['string'];
      const tree = buildMerkleTree(values, leafEncoding);
      const proof = createProof(tree, ['message']);
      const leaf = calculateLeafHash(tree, ['message']);

      await msgTicket.mintTicket(otherAccount.address);
      await msgTicket.updateMerkleRoot(tokenId, tree.root);

      expect(await msgTicket.verifyMessage(tokenId, leaf, proof)).to.be.true;
    });

    it("Should not verify a false leaf against the Merkle root", async function () {
      const { msgTicket, otherAccount } = await loadFixture(deployMsgTicketFixture);
      const tokenId = 0;
      const leafEncoding = ['string'];


      const values = [['message']];
      const tree = buildMerkleTree(values, leafEncoding);
      const proof = createProof(tree, ['message']);

      await msgTicket.mintTicket(otherAccount.address);
      await msgTicket.updateMerkleRoot(tokenId, tree.root);

      const updatedValues = [...values, ['evil']];
      const updatedTree = buildMerkleTree(updatedValues, leafEncoding);
      const newLeaf = calculateLeafHash(updatedTree, ['evil']);
      const newProof = createProof(updatedTree, ['evil']);

      expect(await msgTicket.verifyMessage(tokenId, newLeaf, proof)).to.be.false;
      expect(await msgTicket.verifyMessage(tokenId, newLeaf, newProof)).to.be.false;
    });
  });
});
