import { ReLog, CryptoManager, LogLevel } from '../src/index';
import path from 'path';

/**
 * Advanced example with rewritable medium behavior
 */
async function main() {
  // Use a password-derived encryption key
  const logger = new ReLog({
    dataDir: path.join(__dirname, '../logs'),
    encryptionKey: 'my-secure-password-1234', // Will be derived using PBKDF2
    maxEntries: 1000, // Keep only 1000 most recent entries
    cleanupThreshold: 80, // Start cleanup when 80% full
    compression: true,
    flushInterval: 3000,
  });

  console.log('Rewritable logging example started');

  // Simulate continuous logging (like a rewritable DVD)
  console.log('Adding 1500 logs (only 1000 will be kept)...');
  
  for (let i = 0; i < 1500; i++) {
    await logger.info(`Log entry ${i}`, {
      iteration: i,
      timestamp: Date.now(),
      random: Math.random(),
    });

    // Flush every 100 entries
    if ((i + 1) % 100 === 0) {
      console.log(`  ${i + 1} logs added...`);
    }
  }

  await logger.flush();

  // Get statistics
  const stats = await logger.getStats();
  console.log(`\nFinal statistics:`);
  console.log(`  Total entries stored: ${stats.totalEntries}`);
  console.log(`  Max entries allowed: ${stats.maxEntries}`);
  console.log(`  Database size: ${(stats.databaseSize / 1024).toFixed(2)} KB`);

  // Query recent logs
  console.log(`\nRetrieving last 5 logs:`);
  const result = await logger.query({
    limit: 5,
    offset: 0,
  });

  result.entries.forEach((entry, idx) => {
    console.log(`  ${idx + 1}. [${entry.level}] ${entry.message}`);
  });

  // Test persistence - close and reopen
  console.log('\n--- Testing persistence ---');
  await logger.close();
  console.log('Logger closed');

  // Create new instance with same database
  const logger2 = new ReLog({
    dataDir: path.join(__dirname, '../logs'),
    encryptionKey: 'my-secure-password-1234',
    maxEntries: 1000,
    compression: true,
  });

  const stats2 = await logger2.getStats();
  console.log(`Reopened logger - entries found: ${stats2.totalEntries}`);

  // Verify data
  const recentLogs = await logger2.getLogs();
  console.log(`Latest log message: "${recentLogs[0].message}"`);

  await logger2.close();
  console.log('\nExample completed successfully');
}

main().catch(console.error);
