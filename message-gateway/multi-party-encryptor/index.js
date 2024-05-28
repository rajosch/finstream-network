const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const { getRandomBytes } = require('ethereum-cryptography/random');
const { encrypt, decrypt } = require('ethereum-cryptography/aes');
const { pbkdf2 } = require('ethereum-cryptography/pbkdf2.js');

// Generate Wallets
const bankA = ethers.Wallet.createRandom();
const bankB = ethers.Wallet.createRandom();
const gateway = ethers.Wallet.createRandom();
const attacker = ethers.Wallet.createRandom();

// Sample binary file path
const sampleFilePath = path.join(__dirname, '../files/binary/sample.bin');
const encryptedFilePath = path.join(__dirname, '../output/sample.json');

// Encryption function
async function encryptFile(filePath, wallets, parent) {
    // Generate symmetric key
    const symmetricKey = await getRandomBytes(16);
    // Generate Initilization Vector
    const iv = await getRandomBytes(16);

    // Encrypt the binary file with the symmetric key
    const data = fs.readFileSync(filePath);
    const encryptedData = await encrypt(data, symmetricKey, iv); 

    const walletEncryptions = [];

    // Encrypt symmetric key 
    for(let index in wallets) {
        const wallet = wallets[index];
        const walletData = await encryptSymmetricKey(symmetricKey, wallet.privateKey); 
        walletData.publicKey = wallet.publicKey;
        walletEncryptions.push(walletData);
    }

    // Hash message for merkle proof
    const messageHash = ethers.keccak256(data);

    // Save the encrypted data and keys
    const output = {
        encryptedData: encryptedData.toString('hex'),
        symmetricKey: walletEncryptions,
        iv: iv.toString('hex'),
        messageHash: messageHash,
        ticketId: 'exampleId', // ID of the ticket on the blockchain
        parent: parent // Used to recreate the Merkle proof. Null at the root
    };
    fs.writeFileSync(encryptedFilePath, JSON.stringify(output, null, 2));

    console.log('File encrypted and saved to', encryptedFilePath);
}

async function decryptFile(encryptedFilePath, wallet){
    const data = JSON.parse(fs.readFileSync(encryptedFilePath));
    const symmetricKey = await decryptSymmetricKey(wallet, data.symmetricKey)
    return decrypt(toUint8Array(data.encryptedData), symmetricKey, toUint8Array(data.iv));
}

async function decryptSymmetricKey(wallet, data) {
    const walletData = data.find(obj => obj.publicKey === wallet.publicKey);
    const symmetricKey = await deriveKeyFromPrivateKey(wallet.privateKey, toUint8Array(walletData.salt));
        return decrypt(toUint8Array(walletData.encryptedKey), symmetricKey, toUint8Array(walletData.iv));
}


// Helper functions
function hexToUint8Array(hexString) {
    // Remove any '0x' prefix
    if (hexString.startsWith('0x')) {
      hexString = hexString.slice(2);
    }
  
    // Ensure the string length is even
    if (hexString.length % 2 !== 0) {
      throw new Error('Invalid hex string');
    }
  
    // Create a Uint8Array from the hex string
    const byteArray = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
      byteArray[i / 2] = parseInt(hexString.substr(i, 2), 16);
    }
  
    return byteArray;
}

function toUint8Array(str) {
    return new Uint8Array(str.split(',').map(Number));
}  

function saveDecryptedData(decryptedData, outputFilePath) {
  try {
    fs.writeFileSync(outputFilePath, decryptedData);
    console.log('Decrypted data saved to', outputFilePath);
  } catch (error) {
    console.error('Error saving decrypted data:', error);
  }
}

async function deriveKeyFromPrivateKey(privateKey, salt) {
    return pbkdf2(hexToUint8Array(privateKey), salt, 100000, 16, 'sha256');
}

async function encryptSymmetricKey(key, privateKey) {
    const salt = await getRandomBytes(16);
    const symmetricKey = await deriveKeyFromPrivateKey(privateKey, salt);
    const iv = await getRandomBytes(16);
    const encryptedKey = await encrypt(key, symmetricKey, iv);

    return {
        encryptedKey: encryptedKey.toString('hex'),
        iv: iv.toString('hex'),
        salt: salt.toString('hex')
    };
}

(async () => {
    // Encrypt the sample file
    try {
        await encryptFile(sampleFilePath, [bankA, bankB, gateway], null);
    } catch (error) {
        console.error('Encryption failed:', error);
    }

    try {
        const decryptedDataBankA = await decryptFile(encryptedFilePath, bankA);
        const outputFilePathA = path.resolve(__dirname, '../output/decrypted_bankA.bin');
        console.log('Decryption with bankA succeeded.');
        saveDecryptedData(decryptedDataBankA, outputFilePathA);

        const decryptedDataBankB = await decryptFile(encryptedFilePath, bankB);
        const outputFilePathB = path.resolve(__dirname, '../output/decrypted_bankB.bin');
        console.log('Decryption with bankA succeeded.');
        saveDecryptedData(decryptedDataBankB, outputFilePathB);

        const decryptedDataGateway= await decryptFile(encryptedFilePath, gateway);
        const outputFilePathG = path.resolve(__dirname, '../output/decrypted_gateway.bin');
        console.log('Decryption with bankA succeeded.');
        saveDecryptedData(decryptedDataGateway, outputFilePathG);

        try {
            const decryptedDataAttacker = await decryptFile(encryptedFilePath, attacker);
            console.log('Decryption with attacker succeeded.');
            fs.writeFileSync(path.join(__dirname, '../output/decrypted_attacker.bin'), decryptedDataAttacker);
        } catch (error) {
            console.log('Decryption with attacker failed.');
        }
    } catch (error) {
        console.error('Decryption failed:', error);
    }
})();
