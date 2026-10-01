import crypto from 'crypto';
import { config } from '../config/env.js';

// Standard AES-256-GCM authenticated encryption
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Recommended 96 bits for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Ensures key is strictly 32 bytes for aes-256-gcm
 */
function getEncryptionKey(): Buffer {
  const key = config.encryptionKey;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not defined.');
  }
  // If provided as a 64-char hex string, convert from hex; otherwise sha256 hash it to 32 bytes
  if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
    return Buffer.from(key, 'hex');
  }
  return crypto.createHash('sha256').update(key).digest();
}

/**
 * Encrypt plaintext string using AES-256-GCM.
 * Returns format: "ivHex:authTagHex:encryptedHex"
 */
export function encryptCredential(plainText: string): string {
  if (!plainText) return '';
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt string encrypted with encryptCredential.
 * Expects format: "ivHex:authTagHex:encryptedHex"
 */
export function decryptCredential(cipherText: string): string {
  if (!cipherText) return '';
  const parts = cipherText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted credential format. Expected iv:authTag:content.');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
