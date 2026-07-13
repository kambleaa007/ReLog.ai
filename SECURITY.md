# Security Policy for ReLog

## Overview

ReLog is designed with security as a core feature. This document outlines the security measures implemented and best practices for using the library securely.

## Encryption

### Algorithm
- **Cipher**: AES-256-CBC (Advanced Encryption Standard, 256-bit key, Cipher Block Chaining mode)
- **Mode**: CBC mode with random initialization vectors (IV)
- **Key Derivation**: PBKDF2 with 100,000 iterations for password-based keys

### Key Management

#### Generating Secure Keys
```typescript
import { CryptoManager } from 'relog-lib';

// Generate a cryptographically secure random key
const encryptionKey = CryptoManager.generateKey();
```

#### Key Storage Best Practices
- **Never hardcode keys** in source code
- Store keys in environment variables:
  ```typescript
  const encryptionKey = Buffer.from(process.env.RELOG_ENCRYPTION_KEY!, 'hex');
  ```
- Use a secrets management system (HashiCorp Vault, AWS Secrets Manager, etc.)
- Restrict file permissions on key files:
  ```bash
  chmod 600 /path/to/key
  ```

#### Key Rotation
For applications handling sensitive data, implement key rotation:
```typescript
// Create logger with new key
const newLogger = new ReLog({
  dataDir: './logs-new',
  encryptionKey: newEncryptionKey,
});

// Export logs from old logger (decrypted)
const oldLogs = await oldLogger.getLogs();

// Re-encrypt with new logger
for (const log of oldLogs) {
  await newLogger.log(log.level, log.message, log.metadata);
}

await newLogger.close();
```

## Data Integrity

### HMAC Verification
ReLog includes HMAC-SHA256 verification for integrity checks:
```typescript
// Automatically verified on decryption
const logs = await logger.getLogs();
// Only returns successfully verified logs
```

### Tamper Detection
- Any modification to encrypted data will be detected
- Corrupted logs are skipped during retrieval
- HMAC mismatches are logged (if logging system is configured)

## File Security

### Storage Permissions
Ensure ReLog data directory has appropriate permissions:
```bash
# Owner read/write only
chmod 700 ./logs

# Database file
chmod 600 ./logs/logs.jsonl
chmod 600 ./logs/logs.meta
```

### Disk Encryption
For servers handling sensitive data, enable full disk encryption:
- Linux: LUKS, dm-crypt
- Windows: BitLocker
- macOS: FileVault

## Application Security

### Log Sensitivity
When logging, be aware of what information you include:
```typescript
// ✓ Good - Log is meaningful but secure
await logger.info('User authentication failed', { 
  userId: 'user123',
  timestamp: Date.now()
});

// ✗ Bad - Contains passwords
await logger.info('Login attempt', { 
  username: 'user@example.com',
  password: 'secret123' // NEVER do this
});

// ✗ Bad - Contains tokens
await logger.error('API request failed', {
  authToken: 'Bearer eyJhbGciOiJIUzI1NiIs...' // NEVER do this
});
```

### Metadata Security
Metadata is also encrypted but should be treated as sensitive:
```typescript
// ✓ Good - Non-sensitive metadata
await logger.info('Request processed', {
  duration: 123,
  statusCode: 200
});

// ✗ Bad - Sensitive metadata
await logger.info('Request processed', {
  requestBody: userSensitiveData,
  internalSystemId: 'secret-123'
});
```

## Production Deployment

### Environment Variables
```bash
# .env.production (not version controlled)
RELOG_ENCRYPTION_KEY=<64-character hex string>
RELOG_DATA_DIR=/var/log/app/relog
```

### Process Isolation
- Run application with minimal required permissions
- Use process manager (PM2, systemd) to manage restarts
- Monitor and log security events

### Backup and Recovery
- Encrypt log backups with additional keys
- Store backups separately from primary logs
- Test recovery procedures regularly
- Consider geographic distribution for disaster recovery

## Vulnerability Reporting

If you discover a security vulnerability in ReLog, please follow these steps:

1. **Do NOT** open a public GitHub issue
2. Email security details to: [security contact]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

4. Allow time for a fix before public disclosure

## Compliance

### GDPR Compliance
ReLog supports data deletion requirements:
```typescript
// Delete all logs (right to be forgotten)
await logger.clear();

// Delete logs older than 30 days
const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
const recent = await logger.query({
  startTime: thirtyDaysAgo
});
```

### HIPAA Compliance
For healthcare applications:
- Use environment-based encryption keys
- Enable audit logging
- Implement log rotation
- Use encrypted transport (HTTPS/TLS)
- Document encryption procedures

### PCI-DSS Compliance
For payment card data:
- Never log card numbers or CVV
- Use AES-256 encryption (✓ ReLog does this)
- Implement key management procedures
- Maintain audit trails
- Perform regular security assessments

## Known Limitations

1. **Memory**: Large queries load results into memory. For very large datasets (>100,000 entries), implement pagination.

2. **Performance**: Encryption has computational overhead. For extremely high-throughput logging, consider:
   - Increasing `flushInterval` to batch writes
   - Using compression to reduce I/O
   - Running on dedicated hardware

3. **File System Security**: The underlying file system must be secure. Network file systems should use encryption in transit (NFS with TLS, encrypted SMB).

## Security Checklist

- [ ] Never hardcode encryption keys
- [ ] Store keys in environment variables or secrets manager
- [ ] Restrict file permissions on log directories
- [ ] Enable disk encryption on production servers
- [ ] Don't log sensitive data (passwords, tokens, PII)
- [ ] Implement key rotation procedures
- [ ] Test log retrieval and recovery procedures
- [ ] Monitor for unauthorized access
- [ ] Keep Node.js and dependencies up to date
- [ ] Use HTTPS/TLS for log transport if applicable

## Security Updates

ReLog will issue security updates when vulnerabilities are discovered. Versions are maintained as follows:

- **1.x.x**: Current stable branch with security patches
- **2.x.x**: Future major version with enhanced security features

Subscribe to release notifications to stay informed of security updates.

---

For more information on cryptography and security best practices:
- [NIST Cryptographic Standards](https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines/)
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
