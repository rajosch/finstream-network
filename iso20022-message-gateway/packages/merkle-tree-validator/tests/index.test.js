import {
    buildMerkleTree,
    createProof,
    verifyProof,
    serializeTree,
    deserializeTree,
    validateTree,
    calculateLeafHash,
  } from '../src/index';
  
  describe('Merkle Tree Tests', () => {
    const values = [['value1'], ['value2'], ['value3']];
    const leafEncoding = ['string'];
    let tree;
  
    beforeAll(() => {
      // Build the Merkle tree
      tree = buildMerkleTree(values, leafEncoding);
    });
  
    test('should build the Merkle tree and get the root', () => {
      expect(tree.root).toBeDefined();
      console.log('Merkle Root:', tree.root);
    });
  
    test('should generate a proof for value1', () => {
      const proof = createProof(tree, ['value1']);
      expect(proof).toBeInstanceOf(Array);
      expect(proof.length).toBeGreaterThan(0);
      console.log('Proof for value1:', proof);
    });
  
    test('should verify the proof for value1', () => {
      const proof = createProof(tree, ['value1']);
      const isValid = verifyProof(tree.root, leafEncoding, ['value1'], proof);
      expect(isValid).toBe(true);
      console.log('Proof is valid:', isValid);
    });
  
    test('should not verify an invalid proof for value1', () => {
      const proof = createProof(tree, ['value1']);
      const invalidProof = proof.slice(1); // Remove one element from the proof to make it invalid
      const isInvalidProofValid = verifyProof(tree.root, leafEncoding, ['value1'], invalidProof);
      expect(isInvalidProofValid).toBe(false);
      console.log('Invalid proof is valid:', isInvalidProofValid);
    });
  
    test('should serialize and deserialize the tree correctly', () => {
      const serializedTree = serializeTree(tree);
      const deserializedTree = deserializeTree(serializedTree);
      expect(tree.root).toEqual(deserializedTree.root);
      console.log('Serialized Tree:', serializedTree);
    });
  
    test('should validate the tree', () => {
      expect(validateTree(tree)).toBe(true);
      console.log('Tree is valid');
    });
  
    test('should calculate the leaf hash correctly', () => {
      const hash = calculateLeafHash(tree, ['value1']);
      expect(hash).toBeDefined();
      console.log('Leaf Hash for value1:', hash);
    });
  });
  