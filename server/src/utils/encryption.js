const crypto = require('crypto');

// Generate a secure 32-byte key from JWT_SECRET or ENCRYPTION_KEY using SHA-256
const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'fallback-secret-key-devprayag-dharamshala';
const KEY = crypto.createHash('sha256').update(secret).digest();
const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt a plaintext string
 * @param {string} text - The plain text to encrypt
 * @returns {string} The encrypted string prefixed with 'enc:'
 */
function encrypt(text) {
  if (!text) return text;
  
  // If it's already encrypted, don't encrypt again
  if (typeof text === 'string' && text.startsWith('enc:')) {
    return text;
  }

  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return formatted string: enc:iv_hex:ciphertext_hex
    return `enc:${iv.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.error('[Encryption] Failed to encrypt:', err.message);
    return text;
  }
}

/**
 * Decrypt an encrypted string
 * @param {string} encryptedText - The encrypted string format 'enc:iv:ciphertext'
 * @returns {string} The decrypted plaintext string, or the input if decryption fails
 */
function decrypt(encryptedText) {
  if (!encryptedText || typeof encryptedText !== 'string') return encryptedText;
  
  if (!encryptedText.startsWith('enc:')) {
    // Return raw text (backward compatibility for plaintext database records)
    return encryptedText;
  }

  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      return encryptedText;
    }

    const iv = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    // Safe fallback if decryption fails (e.g. key changed or malformed data)
    return encryptedText;
  }
}

module.exports = {
  encrypt,
  decrypt,
};
