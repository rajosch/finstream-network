const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

const { buildMerkleTree, createProof, calculateLeafHash } = require('../../iso20022-message-gateway/packages/merkle-tree-validator/src/index');

describe("Controller", function () {
    async function deployControllerFixture() {
        const [owner, user1, user2, otherAccount] = await ethers.getSigners();
        const MockCoin = await ethers.getContractFactory("MockCoin");
        const tokenA = await MockCoin.deploy("Token A", "TKNA");
        const tokenB = await MockCoin.deploy("Token B", "TKNB");

        const MsgTicket = await ethers.getContractFactory("MsgTicket");
        const msgTicket = await MsgTicket.deploy(owner);

        const Treasury = await ethers.getContractFactory("Treasury");
        const treasury = await Treasury.deploy(owner);

        const Controller = await ethers.getContractFactory("Controller");
        const controllerContract = await Controller.deploy(msgTicket, treasury, owner);

        // Mint sufficient tokens to add as liquidity to contract
        const amount = ethers.parseUnits("5000", 18);
        await tokenA.mint(owner, amount);
        await tokenB.mint(owner, amount);

        await tokenA.approve(treasury, ethers.parseUnits("3000", 18));
        await tokenB.approve(treasury, ethers.parseUnits("3000", 18));

        // // Transfer ownership of MsgTicket to Controller
        await msgTicket.transferOwnership(controllerContract);

        // // Transfer ownership of Treasury to Controller
        await treasury.transferOwnership(controllerContract);

        await controllerContract.addClient(user1);
        await controllerContract.addClient(user2);
        await controllerContract.addClient(owner);

        return { controllerContract, msgTicket, treasury, tokenA, tokenB, owner, user1, user2, otherAccount };
    }

    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            const { controllerContract, owner } = await loadFixture(deployControllerFixture);
            expect(await controllerContract.owner()).to.equal(owner.address);
        });
    });

    describe("Client Management", function () {
        it("Should allow the owner to add clients", async function () {
            const { controllerContract, otherAccount, owner } = await loadFixture(deployControllerFixture);
            await controllerContract.connect(owner).addClient(otherAccount.address);
            expect(await controllerContract.clients(otherAccount.address)).to.be.true;
        });

        it("Should allow the owner to remove clients", async function () {
            const { controllerContract, user1, owner } = await loadFixture(deployControllerFixture);
            await controllerContract.connect(owner).removeClient(user1.address);
            expect(await controllerContract.clients(user1.address)).to.be.false;
        });

        it("Should emit ClientAdded event when a client is added", async function () {
            const { controllerContract, otherAccount, owner } = await loadFixture(deployControllerFixture);
            await expect(controllerContract.connect(owner).addClient(otherAccount.address))
                .to.emit(controllerContract, "ClientAdded")
                .withArgs(otherAccount.address);
        });

        it("Should emit ClientRemoved event when a client is removed", async function () {
            const { controllerContract, user1, owner } = await loadFixture(deployControllerFixture);
            await expect(controllerContract.connect(owner).removeClient(user1.address))
                .to.emit(controllerContract, "ClientRemoved")
                .withArgs(user1.address);
        });
    });

    describe("Ticket Management", function () {
        it("Should allow registered clients to initiate a ticket", async function () {
            const { controllerContract, msgTicket, owner } = await loadFixture(deployControllerFixture);

            await controllerContract.initiateTicket();
            expect(await msgTicket.ownerOf(0)).to.equal(owner);
        });

        it("Should allow registered clients to update the Merkle root of a ticket", async function () {
            const { controllerContract, msgTicket } = await loadFixture(deployControllerFixture);

            await controllerContract.initiateTicket();
            const ticketId = 0;

            const values = [['message']];
            const leafEncoding = ['string'];
            const tree = buildMerkleTree(values, leafEncoding);
            const newLeaf = calculateLeafHash(tree, ['message']);

            await controllerContract.updateMerkleRoot(ticketId, [], newLeaf);
            expect(await msgTicket.merkleRoots(ticketId)).to.equal(tree.root);
        });

        it("Should revert if the sender is not the owner of the ticket", async function () {
            const { controllerContract, user2 } = await loadFixture(deployControllerFixture);

            await controllerContract.initiateTicket();
            const ticketId = 0;
            
            const values = [['message']];
            const leafEncoding = ['string'];
            const tree = buildMerkleTree(values, leafEncoding);
            const newLeaf = calculateLeafHash(tree, ['message']);

            await expect(
                controllerContract.connect(user2).updateMerkleRoot(ticketId, [], newLeaf)
            ).to.be.revertedWith("Sender is not the owner of the ticket");
        });
    });

    describe("Controller Transactions", function () {
        it("Should initiate a transaction", async function () {
            const { controllerContract, treasury, tokenA, tokenB, user1, user2 } = await loadFixture(deployControllerFixture);
            
            const priceFeedAddress = "0x1a81afB8146aeFfCFc5E50e8479e826E7D55b910";

            // Handle tokens
            await controllerContract.addSupportedToken(tokenA);
            await controllerContract.addSupportedToken(tokenB);
            await tokenA.mint(user1, ethers.parseUnits("2000", 18));
            await tokenA.connect(user1).approve(treasury, ethers.parseUnits("1000", 18));
            await controllerContract.addLiquidity(tokenA, ethers.parseUnits("2000", 18));
            await controllerContract.addLiquidity(tokenB, ethers.parseUnits("2000", 18));

            await controllerContract.setPriceFeed(tokenA, tokenB, priceFeedAddress);

            // Mint ticket
            await controllerContract.initiateTicket();

            // Handle merkle root
            const ticketId = 0;
            const values = [['message']];
            const leafEncoding = ['string'];
            const tree = buildMerkleTree(values, leafEncoding);
            await controllerContract.updateMerkleRoot(ticketId, [], tree.root);
            const proof = createProof(tree, ['message']);
            const leaf = calculateLeafHash(tree, ['message'])

            // Handle price conversion
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
            const latestRoundData = await priceFeed.latestRoundData();
            const exchangeRate = ethers.formatUnits(latestRoundData.answer, 8);

            const sentAmount = 500;
            const receivedAmount = sentAmount * exchangeRate;

            await controllerContract.connect(user1).initiateTransaction(user1, user2, tokenA, tokenB, ethers.parseUnits(sentAmount.toString(), 18), ticketId, leaf, proof);
            expect(await tokenB.balanceOf(user2)).to.equal(ethers.parseUnits(receivedAmount.toString(), 18));
        });

        it("Should revert if the sender is not a registered client", async function () {
            const { controllerContract, tokenA, tokenB, user2, otherAccount } = await loadFixture(deployControllerFixture);

            await controllerContract.initiateTicket();

            const ticketId = 0;
            const values = [['message']];
            const leafEncoding = ['string'];
            const tree = buildMerkleTree(values, leafEncoding);
            const newLeaf = calculateLeafHash(tree, ['message']);

            await controllerContract.updateMerkleRoot(ticketId, [], newLeaf);
            const proof = createProof(tree, ['message']);
            const leaf = calculateLeafHash(tree, ['message'])

            await expect(
                controllerContract.connect(otherAccount).initiateTransaction(otherAccount, user2, tokenA, tokenB, ethers.parseUnits("500", 18), ticketId, leaf, proof)
            ).to.be.revertedWith("Sender is not a registered client");
        });
    });

});
