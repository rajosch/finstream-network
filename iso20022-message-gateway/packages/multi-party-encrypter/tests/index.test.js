const { encryptFile, decryptFile } = require('../src/index');
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

// Constants
const bankA = ethers.Wallet.createRandom();
const bankB = ethers.Wallet.createRandom();
const gateway = ethers.Wallet.createRandom();
const attacker = ethers.Wallet.createRandom();

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
        
        const output = await encryptFile(data, [bankA, bankB, gateway], null, 'ticketId');
    
    
        const outputPath = path.join(__dirname, '../../../../output', 'sample.json');
    
        try {
            fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
        } catch (err) {
            console.error(`Error writing binary file: ${err}`);
        }
    });    

    test('Should Decrypt Binary Files With Multiple Authorized Wallets', async () => {
        const sampleFilePath = path.join(__dirname, '../../../../output', 'sample.json');
        const data = JSON.parse(fs.readFileSync(sampleFilePath));

        const decryptedDataA = await decryptFile(data, bankA);
        const decryptedDataB = await decryptFile(data, bankB);
        const decryptedDataG = await decryptFile(data, gateway);


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

        // TODO add checks if the output files exist and if they are equal to sample.bin
    });

    test('Should Not Decrypt Binary Files With Attacker Wallet', async () => {
        const sampleFilePath = path.join(__dirname, '../../../../output', 'sample.json');
        const data = JSON.parse(fs.readFileSync(sampleFilePath));


        const outputFilePathAttacker = path.join(__dirname, '../../../../output', 'decryptionAttacker.bin');
        try {
            const decryptedDataAttacker = await decryptFile(data, attacker);
            console.log('Decryption with attacker succeeded.');
            fs.writeFileSync(outputFilePathAttacker, decryptedDataAttacker);
        } catch (error) {
            console.log('Decryption with attacker failed.');
        }

        // TODO add checks if the output file exists
    });
});
