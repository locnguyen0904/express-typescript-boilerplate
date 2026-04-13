import crypto from 'crypto';

import { config } from '@/config';

const ALGORITHM = 'aes-256-ctr';
const IV_LENGTH = 16;

function getCipherKey(): Buffer {
  return crypto.scryptSync(config.jwt.secret, 'salt', 32);
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getCipherKey(), iv);
  const encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(encrypted: string): string {
  const [ivHex, encryptedText] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getCipherKey(), iv);
  return decipher.update(encryptedText, 'hex', 'utf8') + decipher.final('utf8');
}
