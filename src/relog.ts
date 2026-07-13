import path from 'path';
import fs from 'fs';
import { CryptoManager } from './crypto';
import { CompressionManager } from './compression';
import { StorageManager } from './storage';
import { LogEntry, LogLevel, ReLogConfig, QueryOptions, QueryResult } from './types';

const DEFAULT_CONFIG: Partial<ReLogConfig> = {
  maxEntries: 10000,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  compression: true,
  cleanupThreshold: 85,
  useSQLite: true,
  flushInterval: 5000,
};

/**
 * ReLog - Encrypted, Compressed, Rewritable Log System
 */
export class ReLog {
  private config: ReLogConfig;
  private crypto: CryptoManager;
  private compression: CompressionManager;
  private storage: StorageManager;
  private logBuffer: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private initialized: boolean = false;

  constructor(config: Partial<ReLogConfig>) {
    // Validate required config
    if (!config.encryptionKey) {
      throw new Error('encryptionKey is required in config');
    }
    if (!config.dataDir) {
      throw new Error('dataDir is required in config');
    }

    // Merge with defaults
    this.config = { ...DEFAULT_CONFIG, ...config } as ReLogConfig;

    // Initialize managers
    this.crypto = new CryptoManager(this.config.encryptionKey);
    this.compression = new CompressionManager();

    // Ensure data directory exists
    if (!fs.existsSync(this.config.dataDir)) {
      fs.mkdirSync(this.config.dataDir, { recursive: true });
    }

    // Initialize storage
    const dbPath = this.config.dbPath || path.join(this.config.dataDir, 'logs.db');
    this.storage = new StorageManager(dbPath);

    this.initialize();
  }

  /**
   * Initialize ReLog
   */
  private initialize(): void {
    // Start auto-flush timer
    this.flushTimer = setInterval(
      () => this.flush(),
      this.config.flushInterval
    );

    this.initialized = true;
  }

  /**
   * Log a message
   */
  async log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      metadata,
    };

    this.logBuffer.push(entry);

    // Check if we need to flush
    if (this.logBuffer.length >= 100) {
      await this.flush();
    }

    // Check if we need cleanup
    const count = await this.storage.count();
    if (count > this.config.maxEntries) {
      await this.performCleanup();
    }
  }

  /**
   * Log at DEBUG level
   */
  async debug(message: string, metadata?: Record<string, unknown>): Promise<void> {
    return this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Log at INFO level
   */
  async info(message: string, metadata?: Record<string, unknown>): Promise<void> {
    return this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Log at WARN level
   */
  async warn(message: string, metadata?: Record<string, unknown>): Promise<void> {
    return this.log(LogLevel.WARN, message, metadata);
  }

  /**
   * Log at ERROR level
   */
  async error(message: string, metadata?: Record<string, unknown>): Promise<void> {
    return this.log(LogLevel.ERROR, message, metadata);
  }

  /**
   * Log at FATAL level
   */
  async fatal(message: string, metadata?: Record<string, unknown>): Promise<void> {
    return this.log(LogLevel.FATAL, message, metadata);
  }

  /**
   * Flush buffered logs to storage
   */
  async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const buffer = [...this.logBuffer];
    this.logBuffer = [];

    for (const entry of buffer) {
      try {
        const entryJson = JSON.stringify(entry);

        // Encrypt
        const encrypted = this.crypto.encrypt(entryJson);

        // Optionally compress
        let dataToStore = JSON.stringify(encrypted);
        if (this.config.compression) {
          const compressed = await this.compression.compress(dataToStore);
          dataToStore = compressed.toString('base64');
        }

        // Store
        await this.storage.insert(entry, dataToStore, encrypted.iv);
      } catch (error) {
        console.error('Error flushing log entry:', error);
      }
    }
  }

  /**
   * Perform cleanup of old logs (rewritable medium behavior)
   */
  private async performCleanup(): Promise<void> {
    const count = await this.storage.count();
    const toDelete = Math.ceil((count - this.config.maxEntries) * (this.config.cleanupThreshold / 100));

    if (toDelete > 0) {
      const deleted = await this.storage.deleteOldLogs(toDelete);
      console.log(`[ReLog] Cleaned up ${deleted} old log entries`);

      // Optimize database
      await this.storage.vacuum();
    }
  }

  /**
   * Query logs
   */
  async query(options: QueryOptions = {}): Promise<QueryResult> {
    // Flush pending logs first
    await this.flush();

    return this.storage.query(options);
  }

  /**
   * Get all logs since a specific timestamp
   */
  async getLogs(startTime?: number, endTime?: number): Promise<LogEntry[]> {
    const result = await this.query({
      startTime,
      endTime,
      limit: this.config.maxEntries,
    });
    return result.entries;
  }

  /**
   * Get logs by level
   */
  async getLogsByLevel(level: LogLevel): Promise<LogEntry[]> {
    const result = await this.query({ level });
    return result.entries;
  }

  /**
   * Search logs by keyword
   */
  async search(keyword: string): Promise<LogEntry[]> {
    const result = await this.query({ keyword });
    return result.entries;
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    databaseSize: number;
    bufferSize: number;
    maxEntries: number;
  }> {
    const totalEntries = await this.storage.count();

    return {
      totalEntries,
      databaseSize: this.storage.getDatabaseSize(),
      bufferSize: this.logBuffer.length,
      maxEntries: this.config.maxEntries,
    };
  }

  /**
   * Clear all logs
   */
  async clear(): Promise<void> {
    this.logBuffer = [];
    await this.storage.clear();
  }

  /**
   * Close ReLog
   */
  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    // Final flush
    await this.flush();

    // Close storage
    await this.storage.close();

    this.initialized = false;
  }

  /**
   * Rotate logs (clear old ones)
   */
  async rotate(): Promise<void> {
    await this.flush();
    await this.performCleanup();
  }
}
