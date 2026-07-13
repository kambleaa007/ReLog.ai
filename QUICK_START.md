# ReLog - Quick Start Guide

Get up and running with ReLog in 5 minutes.

## Installation

```bash
npm install relog-lib
```

## Basic Usage

### 1. Create and Configure Logger

```typescript
import { ReLog, CryptoManager } from 'relog-lib';

// Generate encryption key (or use environment variable)
const encryptionKey = CryptoManager.generateKey();

// Initialize logger
const logger = new ReLog({
  dataDir: './logs',
  encryptionKey,
  maxEntries: 10000,
  compression: true,
});
```

### 2. Log Messages

```typescript
// Log at different levels
await logger.debug('Debug message', { data: 'value' });
await logger.info('Application started');
await logger.warn('Warning message');
await logger.error('Error message');
await logger.fatal('Critical error');

// Automatically flushed to storage
```

### 3. Query Logs

```typescript
// Get all logs
const allLogs = await logger.getLogs();

// Get logs by level
const errors = await logger.getLogsByLevel(LogLevel.ERROR);

// Search logs
const results = await logger.search('database');

// Query with filters
const result = await logger.query({
  level: LogLevel.ERROR,
  startTime: Date.now() - 3600000, // Last hour
  limit: 50,
});
```

### 4. Cleanup

```typescript
// Close when done
await logger.close();
```

## Complete Example

```typescript
import { ReLog, CryptoManager, LogLevel } from 'relog-lib';

async function main() {
  // Setup
  const logger = new ReLog({
    dataDir: './logs',
    encryptionKey: CryptoManager.generateKey(),
  });

  // Log
  await logger.info('User logged in', { userId: 'user123' });
  await logger.warn('High CPU usage');
  await logger.error('Database timeout');

  // Query
  const errors = await logger.getLogsByLevel(LogLevel.ERROR);
  console.log(`Found ${errors.length} errors`);

  // Stats
  const stats = await logger.getStats();
  console.log(`Stored ${stats.totalEntries} entries`);

  // Cleanup
  await logger.close();
}

main().catch(console.error);
```

## Environment-Based Configuration

### Secure Key Storage

```typescript
// .env file (never commit!)
RELOG_ENCRYPTION_KEY=your_32_byte_hex_key_here

// In code
import dotenv from 'dotenv';
dotenv.config();

const logger = new ReLog({
  dataDir: './logs',
  encryptionKey: Buffer.from(process.env.RELOG_ENCRYPTION_KEY!, 'hex'),
});
```

### Or Use Password-Based Key

```typescript
const logger = new ReLog({
  dataDir: './logs',
  encryptionKey: process.env.RELOG_PASSWORD!, // Automatically derived
});
```

## Configuration Options

```typescript
const logger = new ReLog({
  // Required
  dataDir: './logs',                    // Where to store logs
  encryptionKey: encryptionKey,         // 32-byte key or password string

  // Optional
  maxEntries: 10000,                    // Max logs to keep (default: 10,000)
  maxFileSize: 10 * 1024 * 1024,        // Max file size in bytes
  compression: true,                    // Enable compression (default: true)
  cleanupThreshold: 85,                 // Cleanup trigger % (default: 85)
  flushInterval: 5000,                  // Auto-flush interval ms (default: 5000)
  useSQLite: false,                     // Use file storage (default: true)
  dbPath: './logs/custom.db',           // Custom database path
});
```

## Common Tasks

### Log With Context

```typescript
await logger.info('API request processed', {
  method: 'POST',
  path: '/api/users',
  statusCode: 201,
  duration: 150,
});
```

### Query Recent Errors

```typescript
const oneHourAgo = Date.now() - (60 * 60 * 1000);
const errors = await logger.query({
  level: LogLevel.ERROR,
  startTime: oneHourAgo,
  limit: 50,
});

errors.entries.forEach(entry => {
  console.log(`[${entry.level}] ${entry.message}`);
});
```

### Monitor Log Storage

```typescript
const stats = await logger.getStats();

console.log(`Entries stored: ${stats.totalEntries}`);
console.log(`Database size: ${(stats.databaseSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`Buffer waiting: ${stats.bufferSize}`);
```

### Export Logs

```typescript
const allLogs = await logger.getLogs();

// Convert to JSON
const json = JSON.stringify(allLogs, null, 2);

// Or to CSV
const csv = allLogs.map(log => 
  `${new Date(log.timestamp).toISOString()},${log.level},${log.message}`
).join('\n');
```

### Rotate Old Logs

```typescript
// Manually cleanup old logs
await logger.rotate();

// Or clear everything
await logger.clear();
```

## Best Practices

### ✅ Do's
```typescript
// ✓ Use environment variables for keys
const key = process.env.RELOG_KEY!;

// ✓ Log important events with context
await logger.info('Payment processed', { orderId, amount });

// ✓ Use appropriate log levels
await logger.error('Database connection failed', { retries: 3 });

// ✓ Flush before application exit
process.on('SIGTERM', async () => {
  await logger.flush();
  await logger.close();
});
```

### ❌ Don'ts
```typescript
// ✗ Don't hardcode encryption keys
const key = 'my-secret-key'; // BAD!

// ✗ Don't log sensitive data
await logger.info('User login', { password: userPassword }); // BAD!

// ✗ Don't ignore errors
await logger.close(); // What if this fails?

// ✗ Don't create multiple instances with same database
const logger1 = new ReLog({ dataDir: './logs', ... });
const logger2 = new ReLog({ dataDir: './logs', ... }); // Conflict!
```

## TypeScript Types

```typescript
import { 
  ReLog,                 // Main class
  LogLevel,              // Enum for log levels
  LogEntry,              // Log entry interface
  ReLogConfig,           // Configuration interface
  QueryOptions,          // Query filter interface
  QueryResult,           // Query result interface
} from 'relog-lib';

// Usage
const entry: LogEntry = {
  timestamp: Date.now(),
  level: LogLevel.INFO,
  message: 'Something happened',
  metadata: { userId: '123' },
};
```

## Error Handling

```typescript
try {
  await logger.info('Processing started');
  
  // Do work...
  
  await logger.flush();
} catch (error) {
  console.error('Logging failed:', error);
  // Application can continue, but logs may not be saved
}

try {
  await logger.close();
} catch (error) {
  console.error('Failed to close logger:', error);
  // Ensure cleanup happens
}
```

## Integration Examples

### Express.js

```typescript
import express from 'express';
import { ReLog, CryptoManager, LogLevel } from 'relog-lib';

const app = express();
const logger = new ReLog({
  dataDir: './logs',
  encryptionKey: CryptoManager.generateKey(),
});

app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
  });
  next();
});

app.get('/api/logs', async (req, res) => {
  const logs = await logger.getLogs();
  res.json(logs);
});
```

### Nest.js

```typescript
import { Injectable } from '@nestjs/common';
import { ReLog, CryptoManager } from 'relog-lib';

@Injectable()
export class LoggerService {
  private logger: ReLog;

  constructor() {
    this.logger = new ReLog({
      dataDir: './logs',
      encryptionKey: process.env.ENCRYPTION_KEY!,
    });
  }

  async log(message: string, metadata?: any) {
    await this.logger.info(message, metadata);
  }

  async onApplicationShutdown() {
    await this.logger.close();
  }
}
```

## Performance Tips

### For High-Volume Logging
```typescript
const logger = new ReLog({
  dataDir: './logs',
  encryptionKey,
  flushInterval: 10000,  // Flush every 10 seconds (batch writes)
  compression: true,      // Save space
  maxEntries: 100000,     // Larger capacity
});
```

### For Interactive Applications
```typescript
const logger = new ReLog({
  dataDir: './logs',
  encryptionKey,
  flushInterval: 2000,    // Flush more often (low latency)
  compression: true,
  maxEntries: 10000,      // Keep recent logs
});
```

## Troubleshooting

### Issue: "ENOENT: no such file or directory"
```typescript
// Solution: Ensure directory exists
import fs from 'fs';
const dir = './logs';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const logger = new ReLog({ dataDir: dir, encryptionKey });
```

### Issue: "High memory usage"
```typescript
// Solution: Increase flush frequency and enable compression
const logger = new ReLog({
  dataDir: './logs',
  encryptionKey,
  flushInterval: 1000,     // Flush every second
  compression: true,       // Reduce disk I/O
});
```

### Issue: "Logs not persisting"
```typescript
// Solution: Ensure flush is called
await logger.flush();  // Manual flush
// OR
await logger.close();  // Flush on close
```

## Next Steps

1. **Read the [README.md](./README.md)** for complete API documentation
2. **Check [SECURITY.md](./SECURITY.md)** for security best practices
3. **Review [examples/](./examples/)** for more examples
4. **Check [NPM_PUBLISH_GUIDE.md](./NPM_PUBLISH_GUIDE.md)** if publishing your own fork

## Support

- 📖 Full documentation: [README.md](./README.md)
- 🔒 Security guide: [SECURITY.md](./SECURITY.md)
- 🤝 Contributing: [CONTRIBUTING.md](./CONTRIBUTING.md)
- 🐛 GitHub Issues: Report bugs or request features

---

**Happy logging! 🚀**
