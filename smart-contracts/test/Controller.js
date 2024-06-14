const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("Controller", function () {
    async function deployControllerFixture() {
        const [owner, manager, controller, user1, user2, otherAccount] = await ethers.getSigners();

        const MockCoin = await ethers.getContractFactory("MockCoin");
        const tokenA = await MockCoin.deploy("Token A", "TKNA");
        const tokenB = await MockCoin.deploy("Token B", "TKNB");

        const MsgTicket = await ethers.getContractFactory("MsgTicket");
        const msgTicket = await MsgTicket.deploy();

        const Treasury = await ethers.getContractFactory("Treasury");
        const treasury = await Treasury.deploy();

        const Controller = await ethers.getContractFactory("Controller");
        const controllerContract = await Controller.deploy(msgTicket, treasury, owner.address);

        await msgTicket.grantRole(await msgTicket.CONTROLLER_ROLE(), controller.address);
        await treasury.grantRole(await treasury.MANAGER_ROLE(), manager.address);
        await treasury.grantRole(await treasury.CONTROLLER_ROLE(), controller.address);

        await controllerContract.addClient(user1.address);
        await controllerContract.addClient(user2.address);

        return { controllerContract, msgTicket, treasury, tokenA, tokenB, owner, manager, controller, user1, user2, otherAccount };
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

    describe("Transactions", function () {
        it("Should initiate a transaction", async function () {
            const { controllerContract, msgTicket, treasury, tokenA, user1, user2, controller } = await loadFixture(deployControllerFixture);

            await tokenA.connect(user1).approve(treasury, ethers.parseUnits("1000", 18));
            await treasury.connect(controller).addLiquidity(tokenA, ethers.parseUnits("1000", 18));
            await msgTicket.connect(controller).mintTicket(user1.address);

            const ticketId = 0;
            const leaf = ethers.keccak256(ethers.toUtf8Bytes(["address", "address", "address", "uint256"], [user1.address, user2.address, tokenA, ethers.parseUnits("500", 18)]));
            const proof = [];

            await controllerContract.connect(user1).initiateTransaction(user1.address, user2.address, tokenA, ethers.parseUnits("500", 18), ticketId, proof);
            expect(await tokenA.balanceOf(user2.address)).to.equal(ethers.parseUnits("500", 18));
        });

        it("Should revert if the sender is not a registered client", async function () {
            const { controllerContract, msgTicket, tokenA, user1, user2, otherAccount } = await loadFixture(deployControllerFixture);

            const ticketId = 0;
            const leaf = ethers.keccak256(ethers.toUtf8Bytes(["address", "address", "address", "uint256"], [otherAccount.address, user2.address, tokenA, ethers.parseUnits("500", 18)]));
            const proof = [];

            await expect(
                controllerContract.connect(otherAccount).initiateTransaction(otherAccount.address, user2.address, tokenA, ethers.parseUnits("500", 18), ticketId, proof)
            ).to.be.revertedWith("Sender is not a registered client");
        });
    });

    describe("Ticket Management", function () {
        it("Should allow registered clients to initiate a ticket", async function () {
            const { controllerContract, msgTicket, user1 } = await loadFixture(deployControllerFixture);

            const ticketId = await controllerContract.connect(user1).initiateTicket();
            expect(await msgTicket.ownerOf(ticketId)).to.equal(user1.address);
        });

        it("Should allow registered clients to update the Merkle root of a ticket", async function () {
            const { controllerContract, msgTicket, user1, controller } = await loadFixture(deployControllerFixture);

            await msgTicket.connect(controller).mintTicket(user1.address);
            const ticketId = 0;
            const newMerkleRoot = ethers.keccak256(ethers.toUtf8Bytes("newMerkleRoot"));

            await controllerContract.connect(user1).updateMerkleRoot(ticketId, newMerkleRoot);
            expect(await msgTicket.getMerkleRoot(ticketId)).to.equal(newMerkleRoot);
        });

        it("Should revert if the sender is not the owner of the ticket", async function () {
            const { controllerContract, msgTicket, user1, user2, controller } = await loadFixture(deployControllerFixture);

            await msgTicket.connect(controller).mintTicket(user1.address);
            const ticketId = 0;
            const newMerkleRoot = ethers.keccak256(ethers.toUtf8Bytes("newMerkleRoot"));

            await expect(
                controllerContract.connect(user2).updateMerkleRoot(ticketId, newMerkleRoot)
            ).to.be.revertedWith("Sender is not the owner of the ticket");
        });
    });
});
