// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./MsgTicket.sol";
import "./Treasury.sol";

/**
 * @title Controller
 * @dev Controller contract to manage the network of businesses/banks and facilitate transactions
 */
contract Controller is Ownable {
    MsgTicket private msgTicket;
    Treasury private treasury;

    mapping(address => bool) public clients;

    /**
     * @dev Emitted when a client is added to the network.
     * @param client The address of the client.
     */
    event ClientAdded(address indexed client);

    /**
     * @dev Emitted when a client is removed from the network.
     * @param client The address of the client.
     */
    event ClientRemoved(address indexed client);

    /**
     * @dev Emitted when the MsgTicket contract address is updated.
     * @param oldAddress The old address of the MsgTicket contract.
     * @param newAddress The new address of the MsgTicket contract.
     */
    event MsgTicketUpdated(address indexed oldAddress, address indexed newAddress);

    /**
     * @dev Emitted when the Treasury contract address is updated.
     * @param oldAddress The old address of the Treasury contract.
     * @param newAddress The new address of the Treasury contract.
     */
    event TreasuryUpdated(address indexed oldAddress, address indexed newAddress);


    constructor(address _msgTicket, address _treasury, address initialOwner) Ownable(initialOwner) {
        msgTicket = MsgTicket(_msgTicket);
        treasury = Treasury(_treasury);
    }

    /**
     * @dev Function to update the MsgTicket contract address.
     * @param newAddress The new address of the MsgTicket contract.
     */
    function updateMsgTicket(address newAddress) public onlyOwner {
        address oldAddress = address(msgTicket);
        msgTicket = MsgTicket(newAddress);
        emit MsgTicketUpdated(oldAddress, newAddress);
    }

    /**
     * @dev Function to update the Treasury contract address.
     * @param newAddress The new address of the Treasury contract.
     */
    function updateTreasury(address newAddress) public onlyOwner {
        address oldAddress = address(treasury);
        treasury = Treasury(newAddress);
        emit TreasuryUpdated(oldAddress, newAddress);
    }

    /**
     * @dev Function to add a client to the network.
     * @param client The address of the client to be added.
     */
    function addClient(address client) public onlyOwner {
        clients[client] = true;
        emit ClientAdded(client);
    }

    /**
     * @dev Function to remove a client from the network.
     * @param client The address of the client to be removed.
     */
    function removeClient(address client) public onlyOwner {
        clients[client] = false;
        emit ClientRemoved(client);
    }

    /**
        * @dev Function to initiate a transaction.
        * @param from The address initiating the transaction.
        * @param to The address receiving the transaction.
        * @param fromToken The address of the token being transferred from sender to the Treasury.
        * @param toToken The address of the token being transferred from the Treasury to the receiver.
        * @param amount The amount of tokens being transferred.
        * @param ticketId The ID of the MsgTicket associated with the transaction.
        * @param merkleProof The Merkle proof validating the message inclusion.
    */
    function initiateTransaction(
        address from,
        address to,
        address fromToken,
        address toToken,
        uint256 amount,
        uint256 ticketId,
        bytes32[] memory merkleProof
    ) public {
        require(clients[from], "Sender is not a registered client");
        require(clients[to], "Receiver is not a registered client");

        // Verify the message associated with the transaction using MsgTicket
        bytes32 leaf = keccak256(abi.encodePacked(from, to, fromToken, amount));
        bool isValid = msgTicket.verifyMessage(ticketId, leaf, merkleProof);
        require(isValid, "Invalid transaction message");

        // Transfer tokens using the Treasury contract
        treasury.transferTokens(fromToken, toToken, from, to, amount);
    }

    /**
     * @dev Function to initiate a ticket set.
     */
    function initiateTicket() public returns (uint256 ticketId) {
        require(clients[msg.sender], "Sender is not a registered client");
        ticketId = msgTicket.mintTicket(msg.sender);
    }

    /**
        * @dev Function to update the Merkle tree of a ticket.
        * @param ticketId The ID of the ticket.
        * @param merkleRoot The new Merkle root to be associated with the ticket.
    */
    function updateMerkleRoot(uint256 ticketId, bytes32 merkleRoot) public {
        require(clients[msg.sender], "Sender is not a registered client");
        require(msg.sender == msgTicket.ownerOf(ticketId), "Sender is not the owner of the ticket");
        msgTicket.updateMerkleRoot(ticketId, merkleRoot);
    }
}
