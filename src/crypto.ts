import crypto from 'crypto';
import { EncryptedLogData } from './types';

/**
 * Cryptographic utility class for encryption and decryption
 */
export class CryptoManager {
  private key: Buffer;
  private algorithm = 'aes-256-cbc';

  constructor(encryptionKey: Buffer | string) {
    if (typeof encryptionKey === 'string') {
      // Derive key from string using PBKDF2
      this.key = crypto.pbkdf2Sync(encryptionKey, 'salt', 100000, 32, 'sha256');
    } else {
      // Ensure key is exactly 32 bytes for AES-256
      if (encryptionKey.length !== 32) {
        this.key = crypto
          .createHash('sha256')
          .update(encryptionKey)
          .digest();
      } else {
        this.key = encryptionKey;
      }
    }
  }

  /**
   * Encrypt data
   */
  encrypt(data: string): EncryptedLogData {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      iv: iv.toString('hex'),
      encryptedData: encrypted,
      algorithm: this.algorithm,
      timestamp: Date.now(),
    };
  }

  /**
   * Decrypt data
   */
  decrypt(encryptedData: EncryptedLogData): string {
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const decipher = crypto.createDecipheriv(
      encryptedData.algorithm,
      this.key,
      iv
    );

    let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generate a secure key
   */
  static generateKey(): Buffer {
    return crypto.randomBytes(32);
  }

  /**
   * Generate HMAC for integrity verification
   */
  generateHMAC(data: string): string {
    return crypto
      .createHmac('sha256', this.key)
      .update(data)
      .digest('hex');
  }

  /**
   * Verify HMAC
   */
  verifyHMAC(data: string, hmac: string): boolean {
    const computed = this.generateHMAC(data);
    return crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(hmac)
    );
  }
}
