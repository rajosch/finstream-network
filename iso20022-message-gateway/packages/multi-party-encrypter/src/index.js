const { ethers } = require('ethers');
const { getRandomBytes } = require('ethereum-cryptography/random');
const { encrypt, decrypt } = require('ethereum-cryptography/aes');
const { pbkdf2 } = require('ethereum-cryptography/pbkdf2');
const fs = require('fs');


async function encryptFile(data, wallets, parent, ticketId) {
    const symmetricKey = await getRandomBytes(16);
    const iv = await getRandomBytes(16);

    // Encrypt the binary file with the symmetric key
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
        ticketId: ticketId, // ID of the ticket on the blockchain
        parent: parent // Used to recreate the Merkle proof. Null at the root
    };

    return output;
}

async function decryptFile(data, wallet){
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
    if (hexString.startsWith('0x')) {
      hexString = hexString.slice(2);
    }
  
    if (hexString.length % 2 !== 0) {
      throw new Error('Invalid hex string');
    }
  
    const byteArray = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
      byteArray[i / 2] = parseInt(hexString.substr(i, 2), 16);
    }
  
    return byteArray;
}

function toUint8Array(str) {
    return new Uint8Array(str.split(',').map(Number));
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

module.exports = {
    encryptFile,
    decryptFile,
};
