import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

/**
 * Builds a Merkle tree from the given values and leaf encoding.
 * @param {Array} values - The array of values to include in the Merkle tree.
 * @param {Array} leafEncoding - The encoding format for the leaves.
 * @returns {StandardMerkleTree} - The constructed Merkle tree.
 */
export function buildMerkleTree(values, leafEncoding) {
  return StandardMerkleTree.of(values, leafEncoding);
}

/**
 * Creates a proof for a given leaf in the Merkle tree.
 * @param {StandardMerkleTree} tree - The Merkle tree.
 * @param {Array} leaf - The leaf value for which to create the proof.
 * @returns {Array} - The proof for the given leaf.
 */
function createProof(tree, leaf) {
  return tree.getProof(leaf);
}

/**
 * Verifies a proof for a given leaf in the Merkle tree.
 * @param {String} root - The root hash of the Merkle tree.
 * @param {Array} leafEncoding - The encoding format for the leaves.
 * @param {Array} leaf - The leaf value to verify.
 * @param {Array} proof - The proof for the given leaf.
 * @returns {Boolean} - True if the proof is valid, false otherwise.
 */
function verifyProof(root, leafEncoding, leaf, proof) {
  return StandardMerkleTree.verify(root, leafEncoding, leaf, proof);
}

/**
 * Serializes the Merkle tree to a JSON string.
 * @param {StandardMerkleTree} tree - The Merkle tree.
 * @returns {String} - The JSON string representation of the tree.
 */
function serializeTree(tree) {
  return JSON.stringify(tree.dump());
}

/**
 * Deserializes a JSON string to a Merkle tree.
 * @param {String} json - The JSON string representation of the tree.
 * @returns {StandardMerkleTree} - The deserialized Merkle tree.
 */
function deserializeTree(json) {
  const data = JSON.parse(json);
  return StandardMerkleTree.load(data);
}

/**
 * Validates the integrity of the Merkle tree.
 * @param {StandardMerkleTree} tree - The Merkle tree.
 * @returns {Boolean} - True if the tree is valid, false otherwise.
 */
function validateTree(tree) {
  tree.validate();
  return true;
}

/**
 * Calculates the hash of a leaf value.
 * @param {StandardMerkleTree} tree - The Merkle tree.
 * @param {Array} leaf - The leaf value to verify.
 * @returns {String} - The hash of the leaf value.
 */
function calculateLeafHash(tree, leaf) {
    return tree.leafHash(leaf);
}