/**
 * Log level enumeration
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Encrypted log data structure
 */
export interface EncryptedLogData {
  iv: string;
  encryptedData: string;
  algorithm: string;
  timestamp: number;
}

/**
 * ReLog configuration options
 */
export interface ReLogConfig {
  /** Directory to store log files */
  dataDir: string;

  /** Maximum number of log entries to keep */
  maxEntries: number;

  /** Maximum size per log file in bytes */
  maxFileSize: number;

  /** Encryption key (32 bytes for AES-256) */
  encryptionKey: Buffer | string;

  /** Enable compression */
  compression: boolean;

  /** Auto-cleanup threshold (percentage) */
  cleanupThreshold: number;

  /** Enable database persistence */
  useSQLite: boolean;

  /** Database file path */
  dbPath?: string;

  /** Flush interval in milliseconds */
  flushInterval: number;
}

/**
 * Query options for retrieving logs
 */
export interface QueryOptions {
  level?: LogLevel | LogLevel[];
  startTime?: number;
  endTime?: number;
  limit?: number;
  offset?: number;
  keyword?: string;
}

/**
 * Query result
 */
export interface QueryResult {
  entries: LogEntry[];
  total: number;
  hasMore: boolean;
}
