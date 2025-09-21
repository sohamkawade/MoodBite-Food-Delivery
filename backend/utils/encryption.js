const crypto = require('crypto');

// Encryption key - in production, this should be stored in environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here!'; // 32 characters
const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt sensitive data
 * @param {string} text - The text to encrypt
 * @returns {string} - Encrypted text with IV
 */
const encrypt = (text) => {
  if (!text) return text;
  
  try {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt sensitive data
 * @param {string} encryptedText - The encrypted text with IV
 * @returns {string} - Decrypted text
 */
const decrypt = (encryptedText) => {
  if (!encryptedText) return encryptedText;
  
  try {
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedData = textParts.join(':');
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    // If decryption fails, return the original text (might be unencrypted legacy data)
    return encryptedText;
  }
};

/**
 * Encrypt bank details object
 * @param {Object} bankDetails - Bank details object
 * @returns {Object} - Bank details with encrypted sensitive fields
 */
const encryptBankDetails = (bankDetails) => {
  if (!bankDetails) return bankDetails;
  
  const encrypted = { ...bankDetails };
  
  // Encrypt sensitive fields
  if (bankDetails.accountNumber) {
    encrypted.accountNumber = encrypt(bankDetails.accountNumber);
  }
  if (bankDetails.ifscCode) {
    encrypted.ifscCode = encrypt(bankDetails.ifscCode);
  }
  if (bankDetails.accountHolderName) {
    encrypted.accountHolderName = encrypt(bankDetails.accountHolderName);
  }
  if (bankDetails.bankName) {
    encrypted.bankName = encrypt(bankDetails.bankName);
  }
  
  return encrypted;
};

/**
 * Decrypt bank details object
 * @param {Object} bankDetails - Bank details object with encrypted fields
 * @returns {Object} - Bank details with decrypted fields
 */
const decryptBankDetails = (bankDetails) => {
  if (!bankDetails) return bankDetails;
  
  const decrypted = { ...bankDetails };
  
  // Decrypt sensitive fields
  if (bankDetails.accountNumber) {
    decrypted.accountNumber = decrypt(bankDetails.accountNumber);
  }
  if (bankDetails.ifscCode) {
    decrypted.ifscCode = decrypt(bankDetails.ifscCode);
  }
  if (bankDetails.accountHolderName) {
    decrypted.accountHolderName = decrypt(bankDetails.accountHolderName);
  }
  if (bankDetails.bankName) {
    decrypted.bankName = decrypt(bankDetails.bankName);
  }
  
  return decrypted;
};

module.exports = {
  encrypt,
  decrypt,
  encryptBankDetails,
  decryptBankDetails
};
