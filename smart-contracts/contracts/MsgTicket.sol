// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MsgTicket
 * @dev MsgTicket is an ERC721 contract that represents unique sets of ISO20022 messages.
 * Each set of messages is represented by a Merkle Tree, with its root stored on-chain and mapped to the ID of the token.
 * The content of these messages is stored encrypted off-chain.
 */
contract MsgTicket is ERC721, Ownable {
    uint256 private _tokenIdCounter; 
    mapping(uint256 => bytes32) public merkleRoots; 

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

    constructor(address initialOwner) ERC721("MsgTicket", "MTKT") Ownable(initialOwner) {
        _tokenIdCounter = 0;
    }

    /**
     * @dev Function to mint a new MsgTicket token.
     * @param to The address to which the token will be minted.
     */
    function mintTicket(address to) public onlyOwner returns (uint256 tokenId) {
        tokenId = _tokenIdCounter; 
        _safeMint(to, tokenId); 

        emit TicketMinted(to, tokenId, block.number);

        _tokenIdCounter += 1; 
    }

    /**
    * @dev Function to update the Merkle root for a specific ticket.
    * @param tokenId The ID of the token whose Merkle root is to be updated.
    * @param newRoot The new Merkle tree root.
    */
    function updateMerkleRoot(uint256 tokenId, bytes32 newRoot) public onlyOwner {
        if (ownerOf(tokenId) == address(0)) {
            revert ERC721NonexistentToken(tokenId);
        }

        merkleRoots[tokenId] = newRoot;

        emit MerkleRootUpdated(tokenId, newRoot, block.number);
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
        bytes32 merkleRoot = merkleRoots[tokenId]; 
        return verify(proof, leaf, merkleRoot); 
    }
    
    /**
     * @dev Builds a Merkle tree from an array of leaves and returns the entire tree.
     * @param leaves The array of hashed leaves.
     * @return The entire Merkle tree.
     */
    function buildTree(bytes32[] memory leaves) public pure returns (bytes32[] memory) {
        require(leaves.length > 0, "Expected non-zero number of leaves");
        
        bytes32[] memory tree = new bytes32[](2 * leaves.length - 1);
        
        uint256 n = leaves.length;

        // Initialize leaves
        for (uint256 i = 0; i < n; i++) {
            tree[tree.length - 1 - i] = leaves[i];
        }
        
        // Build tree
        if(tree.length > 1) {
            for (uint256 i = tree.length - 1 - n; i > 0; i--) {
                uint256 leftIndex = leftChildIndex(i);
                uint256 rightIndex = rightChildIndex(i);

                if (leftIndex < tree.length && rightIndex < tree.length) {
                    tree[i] = hashPair(tree[leftIndex], tree[rightIndex]);
                } else {
                    break;
                }
            }
            
            tree[0] = hashPair(tree[1], tree[2]); // Root node computation
        }
        
        return tree;
    }

    /**
     * @dev Hashes a pair of bytes32 values using Keccak256.
     * @param a The first value to be hashed.
     * @param b The second value to be hashed.
     * @return The hash of the concatenated values.
     */
    function hashPair(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(a, b));
    }

    /**
     * @dev Returns the index of the left child of a node in the tree.
     * @param index The index of the node.
     * @return The index of the left child.
     */
    function leftChildIndex(uint256 index) internal pure returns (uint256) {
        return 2 * index + 1;
    }

    /**
     * @dev Returns the index of the right child of a node in the tree.
     * @param index The index of the node.
     * @return The index of the right child.
     */
    function rightChildIndex(uint256 index) internal pure returns (uint256) {
        return 2 * index + 2;
    }

    /**
     * @dev Computes the Merkle root from an array of leaves.
     * @param leaves The array of hashed leaves.
     * @return The Merkle root.
     */
    function getRoot(bytes32[] memory leaves) public pure returns (bytes32) {
        bytes32[] memory tree = buildTree(leaves);
        return tree[0];
    }

    /**
     * @dev Verifies if a leaf is part of a Merkle tree using a proof and the root.
     * @param proof The Merkle proof.
     * @param leaf The hash of the leaf to be verified.
     * @param root The root of the Merkle tree.
     * @return bool Returns true if the leaf is part of the tree, false otherwise.
     */
    function verify(
        bytes32[] memory proof,
        bytes32 leaf,
        bytes32 root
    ) public pure returns (bool) {
        bytes32 computedHash = leaf;
        uint256 proofIndex = 0;

        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[proofIndex++];

            if (computedHash <= proofElement) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }

        return computedHash == root;
    }
}
