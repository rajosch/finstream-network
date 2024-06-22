const { encryptFile, decryptFile } = require('../src/index');
const fs = require('fs');
const path = require('path');
const ethers = require('ethers');
const { promisify } = require('util');
const crypto = require('crypto');

// Constants
const bankA = ethers.Wallet.createRandom();
const bankB = ethers.Wallet.createRandom();
const gateway = ethers.Wallet.createRandom();
const attacker = ethers.Wallet.createRandom();

// Generate random bytes
const getRandomBytes = promisify(crypto.randomBytes);

describe('Multi Party Encrypter Library', () => {
    beforeAll(() => {
        const directoryPath = path.join(__dirname, '../../../../output');

        try {
            fs.mkdirSync(directoryPath, { recursive: true });
            console.log('Directory created successfully.');
        } catch (err) {
            console.error('Error creating directory:', err);
        }
    });

    afterAll(() => {});

    test('Should Encrypt Binary File With Multiple Wallets', async () => {
        const sampleFilePath = path.join(__dirname, '../../../../files/binary', 'sample.bin');

        const data = fs.readFileSync(sampleFilePath);
        
        const output = await encryptFile(data, [
            { privateKey: bankA.privateKey, publicKey: bankA.address },
            { privateKey: bankB.privateKey, publicKey: bankB.address },
            { privateKey: gateway.privateKey, publicKey: gateway.address }
        ], null, 'ticketId', getRandomBytes);
    
        const outputPath = path.join(__dirname, '../../../../output', 'sample.json');
    
        try {
            fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
        } catch (err) {
            console.error(`Error writing binary file: ${err}`);
        }
    });

    test('Should Decrypt Binary Files With Multiple Authorized Wallets', async () => {
        const sampleFilePath = path.join(__dirname, '../../../../output', 'sample.json');
        const sampleBinaryFilePath = path.join(__dirname, '../../../../output', 'sample.bin');
        const data = JSON.parse(fs.readFileSync(sampleFilePath));
    
        const decryptedDataA = await decryptFile(data, bankA.privateKey);
        const decryptedDataB = await decryptFile(data, bankB.privateKey);
        const decryptedDataG = await decryptFile(data, gateway.privateKey);
    
        const outputFilePathA = path.join(__dirname, '../../../../output', 'decryptionA.bin');
        const outputFilePathB = path.join(__dirname, '../../../../output', 'decryptionB.bin');
        const outputFilePathG = path.join(__dirname, '../../../../output', 'decryptionG.bin');
        try {
            fs.writeFileSync(outputFilePathA, decryptedDataA);
            fs.writeFileSync(outputFilePathB, decryptedDataB);
            fs.writeFileSync(outputFilePathG, decryptedDataG);
        } catch (err) {
            console.error(`Error writing binary file: ${err}`);
        }
    
        // Check if the output files exist and if they are equal to sample.bin
        const sampleBinaryData = fs.readFileSync(sampleBinaryFilePath);
        const outputBinaryDataA = fs.readFileSync(outputFilePathA);
        const outputBinaryDataB = fs.readFileSync(outputFilePathB);
        const outputBinaryDataG = fs.readFileSync(outputFilePathG);
    
        expect(fs.existsSync(outputFilePathA)).toBe(true);
        expect(fs.existsSync(outputFilePathB)).toBe(true);
        expect(fs.existsSync(outputFilePathG)).toBe(true);
    
        expect(Buffer.compare(sampleBinaryData, outputBinaryDataA)).toBe(0);
        expect(Buffer.compare(sampleBinaryData, outputBinaryDataB)).toBe(0);
        expect(Buffer.compare(sampleBinaryData, outputBinaryDataG)).toBe(0);
    });

    test('Should Not Decrypt Binary Files With Attacker Wallet', async () => {
        const sampleFilePath = path.join(__dirname, '../../../../output', 'sample.json');
        const data = JSON.parse(fs.readFileSync(sampleFilePath));
    
        const outputFilePathAttacker = path.join(__dirname, '../../../../output', 'decryptionAttacker.bin');
        let decryptionSucceeded = false;
    
        try {
            const decryptedDataAttacker = await decryptFile(data, attacker.privateKey);
            console.log('Decryption with attacker succeeded.');
            fs.writeFileSync(outputFilePathAttacker, decryptedDataAttacker);
            decryptionSucceeded = true;
        } catch (error) {
            console.log('Decryption with attacker failed.');
        }
    
        // Check if the output file does not exist
        expect(fs.existsSync(outputFilePathAttacker)).toBe(false);
        expect(decryptionSucceeded).toBe(false);
    });
});
