import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const SALT = 'monkey-mori-salt-2026'; // Fixed salt for key derivation

/**
 * Encrypts a string using AES-256-CBC
 */
export function encrypt(text: string, secret: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.scryptSync(secret, SALT, 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  // Return IV:EncryptedData
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a string using AES-256-CBC
 */
export function decrypt(encryptedText: string, secret: string): string {
  const parts = encryptedText.split(':');
  if (parts.length !== 2) throw new Error('Invalid encrypted text format');
  
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedData = parts[1];
  const key = crypto.scryptSync(secret, SALT, 32);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
