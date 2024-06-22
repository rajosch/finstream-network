import { ethers } from 'ethers';
import crypto from 'crypto';

// Encrypt data using AES-256-CBC
async function encrypt(data, key, iv) {
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted;   
}

// Decrypt data using AES-256-CBC
async function decrypt(encryptedData, key, iv) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted;
}

// Derive key from private key using PBKDF2
async function deriveKeyFromPrivateKey(privateKey, salt) {
    return crypto.pbkdf2Sync(Buffer.from(privateKey, 'hex'), salt, 100000, 32, 'sha256');
}

// Encrypt symmetric key using a derived key
async function encryptSymmetricKey(key, privateKey, getRandomBytes) {
    const salt = await getRandomBytes(16);
    const derivedKey = await deriveKeyFromPrivateKey(privateKey, salt);
    const iv = await getRandomBytes(16);
    const encryptedKey = await encrypt(key, derivedKey, iv);

    return {
        encryptedKey: encryptedKey.toString('hex'),
        iv: iv.toString('hex'),
        salt: salt.toString('hex')
    };
}

// Decrypt symmetric key using a derived key
async function decryptSymmetricKey(privateKey, data) {
    const wallet = new ethers.Wallet(privateKey);
    const walletData = data.find(obj => obj.publicKey === wallet.address);
    const derivedKey = await deriveKeyFromPrivateKey(privateKey, Buffer.from(walletData.salt, 'hex'));
    return decrypt(Buffer.from(walletData.encryptedKey, 'hex'), derivedKey, Buffer.from(walletData.iv, 'hex'));
}

export async function encryptFile(data, wallets, parent, ticketId, getRandomBytes) {
    const symmetricKey = await getRandomBytes(32);
    const iv = await getRandomBytes(16);

    // Encrypt the binary file with the symmetric key
    const encryptedData = await encrypt(data, symmetricKey, iv); 

    const walletEncryptions = [];

    // Encrypt symmetric key 
    for (const wallet of wallets) {
        const walletData = await encryptSymmetricKey(symmetricKey, wallet.privateKey, getRandomBytes);
        walletData.publicKey = new ethers.Wallet(wallet.privateKey).address;
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

export async function decryptFile(data, privateKey) {
    const symmetricKey = await decryptSymmetricKey(privateKey, data.symmetricKey);
    return decrypt(Buffer.from(data.encryptedData, 'hex'), symmetricKey, Buffer.from(data.iv, 'hex'));
}
