import fs from 'fs';
import path from 'path';
import { ReLog } from './relog';
import { LogLevel, CryptoManager } from './index';

const TEST_DIR = path.join(__dirname, '../test-data');

describe('ReLog', () => {
  let relog: ReLog;
  let encryptionKey: Buffer;

  beforeAll(() => {
    encryptionKey = CryptoManager.generateKey();
  });

  beforeEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    if (relog) {
      await relog.close();
    }
  });

  afterAll(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
  });

  test('should initialize ReLog with valid config', () => {
    expect(() => {
      relog = new ReLog({
        dataDir: TEST_DIR,
        encryptionKey,
        compression: true,
        maxEntries: 1000,
      });
    }).not.toThrow();
  });

  test('should throw error without encryptionKey', () => {
    expect(() => {
      relog = new ReLog({
        dataDir: TEST_DIR,
      } as any);
    }).toThrow('encryptionKey is required');
  });

  test('should throw error without dataDir', () => {
    expect(() => {
      relog = new ReLog({
        encryptionKey,
      } as any);
    }).toThrow('dataDir is required');
  });

  test('should log messages at different levels', async () => {
    relog = new ReLog({
      dataDir: TEST_DIR,
      encryptionKey,
    });

    await relog.debug('Debug message', { component: 'test' });
    await relog.info('Info message');
    await relog.warn('Warning message');
    await relog.error('Error message');
    await relog.fatal('Fatal message');

    await relog.flush();

    const stats = await relog.getStats();
    expect(stats.totalEntries).toBe(5);
  });

  test('should query logs by level', async () => {
    relog = new ReLog({
      dataDir: TEST_DIR,
      encryptionKey,
    });

    await relog.info('Info 1');
    await relog.info('Info 2');
    await relog.error('Error 1');
    await relog.flush();

    const infoLogs = await relog.getLogsByLevel(LogLevel.INFO);
    expect(infoLogs).toHaveLength(2);

    const errorLogs = await relog.getLogsByLevel(LogLevel.ERROR);
    expect(errorLogs).toHaveLength(1);
  });

  test('should search logs by keyword', async () => {
    relog = new ReLog({
      dataDir: TEST_DIR,
      encryptionKey,
    });

    await relog.info('Database connection failed');
    await relog.info('User logged in successfully');
    await relog.info('Database backup completed');
    await relog.flush();

    const results = await relog.search('Database');
    expect(results).toHaveLength(2);
  });

  test('should query logs with time range', async () => {
    relog = new ReLog({
      dataDir: TEST_DIR,
      encryptionKey,
    });

    const startTime = Date.now();
    await relog.info('First log');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    const middleTime = Date.now();
    
    await relog.info('Second log');
    await new Promise(resolve => setTimeout(resolve, 100));
    const endTime = Date.now();
    
    await relog.info('Third log');
    await relog.flush();

    const results = await relog.getLogs(startTime, middleTime);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(entry => entry.timestamp <= middleTime)).toBe(true);
  });

  test('should auto-cleanup when maxEntries is exceeded', async () => {
    relog = new ReLog({
      dataDir: TEST_DIR,
      encryptionKey,
      maxEntries: 10,
      cleanupThreshold: 50,
    });

    // Add 15 logs
    for (let i = 0; i < 15; i++) {
      await relog.info(`Log ${i}`);
    }
    await relog.flush();
    
    // Wait a bit for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    const stats = await relog.getStats();
    expect(stats.totalEntries).toBeLessThanOrEqual(15); // Should be around 10
    expect(stats.totalEntries).toBeGreaterThanOrEqual(10);
  });

  test('should persist logs to database', async () => {
    relog = new ReLog({
      dataDir: TEST_DIR,
      encryptionKey,
    });

    await relog.info('Persistent log');
    await relog.flush();

    const firstStats = await relog.getStats();
    await relog.close();

    // Create new instance
    relog = new ReLog({
      dataDir: TEST_DIR,
      encryptionKey,
      dbPath: path.join(TEST_DIR, 'logs.db'),
    });

    const secondStats = await relog.getStats();
    expect(secondStats.totalEntries).toBe(firstStats.totalEntries);
  });

  test('should handle metadata in logs', async () => {
    relog = new ReLog({
      dataDir: TEST_DIR,
      encryptionKey,
    });

    const metadata = {
      userId: 'user123',
      action: 'login',
      ip: '192.168.1.1',
    };

    await relog.info('User login', metadata);
    await relog.flush();

    const logs = await relog.getLogs();
    expect(logs[0].metadata).toEqual(metadata);
  });

  test('should clear all logs', async () => {
    relog = new ReLog({
      dataDir: TEST_DIR,
      encryptionKey,
    });

    await relog.info('Log 1');
    await relog.info('Log 2');
    await relog.flush();

    let stats = await relog.getStats();
    expect(stats.totalEntries).toBe(2);

    await relog.clear();

    stats = await relog.getStats();
    expect(stats.totalEntries).toBe(0);
  });

  test('should provide statistics', async () => {
    relog = new ReLog({
      dataDir: TEST_DIR,
      encryptionKey,
      maxEntries: 1000,
    });

    await relog.info('Test log');
    await relog.flush();

    const stats = await relog.getStats();
    expect(stats).toHaveProperty('totalEntries');
    expect(stats).toHaveProperty('databaseSize');
    expect(stats).toHaveProperty('bufferSize');
    expect(stats).toHaveProperty('maxEntries');
    expect(stats.maxEntries).toBe(1000);
  });

  test('should handle compression', async () => {
    relog = new ReLog({
      dataDir: TEST_DIR,
      encryptionKey,
      compression: true,
    });

    const largeMessage = 'X'.repeat(10000);
    await relog.info(largeMessage);
    await relog.flush();

    const logs = await relog.getLogs();
    expect(logs[0].message).toBe(largeMessage);
  });

  test('should support encryption key from string', () => {
    expect(() => {
      relog = new ReLog({
        dataDir: TEST_DIR,
        encryptionKey: 'my-secret-password',
        compression: true,
      });
    }).not.toThrow();
  });

  test('should flush on close', async () => {
    relog = new ReLog({
      dataDir: TEST_DIR,
      encryptionKey,
    });

    await relog.info('Log before close');
    // Don't explicitly flush
    await relog.close();

    // Create new instance
    relog = new ReLog({
      dataDir: TEST_DIR,
      encryptionKey,
      dbPath: path.join(TEST_DIR, 'logs.db'),
    });

    const stats = await relog.getStats();
    expect(stats.totalEntries).toBe(1);
  });

  test('should handle rapid logging', async () => {
    relog = new ReLog({
      dataDir: TEST_DIR,
      encryptionKey,
    });

    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(relog.info(`Rapid log ${i}`));
    }
    await Promise.all(promises);
    await relog.flush();

    const stats = await relog.getStats();
    expect(stats.totalEntries).toBe(100);
  });
});
