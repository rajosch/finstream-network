// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title MsgTicket
 * @dev MsgTicket is an ERC721 contract that represents unique sets of ISO20022 messages.
 * Each set of messages is represented by a Merkle Tree, with its root stored on-chain and mapped to the ID of the token.
 * The content of these messages is stored encrypted off-chain.
 * The tokens are soulbound and cannot be transferred.
 */
contract MsgTicket is ERC721, AccessControl {
    uint256 private _tokenIdCounter; 
    mapping(uint256 => bytes32) private _merkleRoots; 

    bytes32 public constant CONTROLLER_ROLE = keccak256("CONTROLLER_ROLE");

    /**
     * @dev Emitted when a new MsgTicket token is minted.
     * @param to The address to which the token is minted.
     * @param tokenId The ID of the token minted.
     * @param blockNumber The block number when the token was minted.
     */
    event TicketMinted(address indexed to, uint256 indexed tokenId, uint256 blockNumber);

    /**
     * @dev Emitted when the Merkle root for a ticket is updated.
     * @param tokenId The ID of the token whose Merkle root is updated.
     * @param merkleRoot The new Merkle root associated with the token.
     * @param blockNumber The block number when the Merkle root was updated.
     */
    event MerkleRootUpdated(uint256 indexed tokenId, bytes32 indexed merkleRoot, uint256 blockNumber);

    constructor() ERC721("MsgTicket", "MTKT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CONTROLLER_ROLE, msg.sender);
    }

    /**
     * @dev Function to mint a new MsgTicket token.
     * @param to The address to which the token will be minted.
     */
    function mintTicket(address to) public onlyRole(CONTROLLER_ROLE) returns (uint256 tokenId) {
        tokenId = _tokenIdCounter; 
        _tokenIdCounter += 1; 
        _safeMint(to, tokenId); 

        emit TicketMinted(to, tokenId, block.number);
    }

    /**
     * @dev Function to update the Merkle root for a specific ticket.
     * @param tokenId The ID of the token whose Merkle root is to be updated.
     * @param merkleRoot The new Merkle root to be associated with the token.
     */
    function updateMerkleRoot(uint256 tokenId, bytes32 merkleRoot) public onlyRole(CONTROLLER_ROLE) {
        if(ownerOf(tokenId) == address(0)) {
            revert ERC721NonexistentToken(tokenId);
        }
        _merkleRoots[tokenId] = merkleRoot; 

        emit MerkleRootUpdated(tokenId, merkleRoot, block.number);
    }

    /**
     * @dev Function to verify a message against the Merkle root of a specific ticket.
     * @param tokenId The ID of the token whose Merkle root is to be used for verification.
     * @param leaf The hash of the message to be verified.
     * @param proof The Merkle proof to be used for verification.
     * @return bool Returns true if the message is part of the Merkle tree, false otherwise.
     */
    function verifyMessage(uint256 tokenId, bytes32 leaf, bytes32[] memory proof) public view returns (bool) {
        if(ownerOf(tokenId) == address(0)) {
            revert ERC721NonexistentToken(tokenId);
        }
        bytes32 merkleRoot = _merkleRoots[tokenId]; 
        return _verify(leaf, proof, merkleRoot); 
    }

    /**
     * @dev Internal function to verify a Merkle proof.
     * @param leaf The hash of the message to be verified.
     * @param proof The Merkle proof to be used for verification.
     * @param root The Merkle root to be used for verification.
     * @return bool Returns true if the message is part of the Merkle tree, false otherwise.
     */
    function _verify(bytes32 leaf, bytes32[] memory proof, bytes32 root) internal pure returns (bool) {
        bytes32 computedHash = leaf;

        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];

            if (computedHash < proofElement) {
                // Hash(current computed hash + current proof element)
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                // Hash(current proof element + current computed hash)
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }

        return computedHash == root;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, AccessControl) returns (bool) {
        return ERC721.supportsInterface(interfaceId) || AccessControl.supportsInterface(interfaceId);
    }

    // TODO Should be Soulbound
}