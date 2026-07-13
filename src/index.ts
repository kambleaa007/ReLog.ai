/**
 * ReLog - Encrypted, Compressed, Rewritable Log System
 * A production-ready logging library for Node.js with encryption, compression, and automatic cleanup
 */

export { ReLog } from './relog';
export { CryptoManager } from './crypto';
export { CompressionManager } from './compression';
export { StorageManager } from './storage';
export {
  LogLevel,
  LogEntry,
  EncryptedLogData,
  ReLogConfig,
  QueryOptions,
  QueryResult,
} from './types';

// Version
export const VERSION = '1.0.0';
