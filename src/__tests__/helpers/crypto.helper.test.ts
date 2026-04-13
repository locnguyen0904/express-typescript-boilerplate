import { decrypt, encrypt } from '@/helpers/crypto.helper';

describe('Crypto Helper', () => {
  const PLAIN_TEXT = 'my-secret-token-123';

  describe('encrypt', () => {
    it('should encrypt text and return it in the correct format', () => {
      const encrypted = encrypt(PLAIN_TEXT);

      // Format should be iv:encryptedText
      expect(encrypted).toMatch(/^[a-f0-9]{32}:[a-f0-9]+$/);
    });

    it('should return different results for the same input (due to random IV)', () => {
      const encrypted1 = encrypt(PLAIN_TEXT);
      const encrypted2 = encrypt(PLAIN_TEXT);

      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('decrypt', () => {
    it('should correctly decrypt an encrypted string', () => {
      const encrypted = encrypt(PLAIN_TEXT);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(PLAIN_TEXT);
    });

    it('should throw an error when decrypting invalid format', () => {
      // Missing colon
      expect(() => decrypt('invalidformat')).toThrow();

      // Invalid hex
      expect(() => decrypt('nothex:nothex')).toThrow();
    });

    it('should result in garbage text when decrypting with incorrect data (CTR mode does not throw)', () => {
      const fakeEncrypted = '0'.repeat(32) + ':' + 'a'.repeat(32);
      const decrypted = decrypt(fakeEncrypted);
      expect(decrypted).not.toBe(PLAIN_TEXT);
      expect(typeof decrypted).toBe('string');
    });
  });

  describe('Integration', () => {
    it('should handle special characters and long strings', () => {
      const longText = 'a'.repeat(1000) + '!@#$%^&*()_+ \n \t';
      const encrypted = encrypt(longText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(longText);
    });
  });
});
