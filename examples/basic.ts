import { ReLog, CryptoManager, LogLevel } from '../src/index';
import path from 'path';

/**
 * Basic example of using ReLog
 */
async function main() {
  // Generate a secure encryption key
  const encryptionKey = CryptoManager.generateKey();

  // Initialize ReLog with configuration
  const logger = new ReLog({
    dataDir: path.join(__dirname, '../logs'),
    encryptionKey,
    maxEntries: 5000,
    compression: true,
    flushInterval: 5000,
  });

  console.log('ReLog initialized successfully');

  // Log messages at different levels
  await logger.debug('Application started', { version: '1.0.0' });
  await logger.info('User logged in', { userId: 'user123', ip: '192.168.1.1' });
  await logger.warn('High memory usage detected', { percentage: 85 });
  await logger.error('Database connection failed', { retries: 3 });

  // Flush logs to storage
  await logger.flush();

  // Query logs
  console.log('\n--- All INFO logs ---');
  const infoLogs = await logger.getLogsByLevel(LogLevel.INFO);
  console.log(`Found ${infoLogs.length} INFO logs`);
  infoLogs.forEach(log => {
    console.log(`[${new Date(log.timestamp).toISOString()}] ${log.message}`);
  });

  // Search logs
  console.log('\n--- Search results for "connection" ---');
  const searchResults = await logger.search('connection');
  searchResults.forEach(log => {
    console.log(`[${log.level}] ${log.message}`);
  });

  // Get statistics
  console.log('\n--- Logging Statistics ---');
  const stats = await logger.getStats();
  console.log(`Total entries: ${stats.totalEntries}`);
  console.log(`Database size: ${(stats.databaseSize / 1024).toFixed(2)} KB`);
  console.log(`Buffer size: ${stats.bufferSize}`);

  // Cleanup
  await logger.close();
  console.log('\nLogger closed successfully');
}

main().catch(console.error);
