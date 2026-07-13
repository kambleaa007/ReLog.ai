import fs from 'fs';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { LogEntry, QueryOptions, QueryResult } from './types';

interface StoredLogEntry {
  id: number;
  timestamp: number;
  level: string;
  message: string;
  metadata?: string;
  encrypted_data: string;
  iv: string;
  created_at: string;
}

/**
 * File-based storage manager (JSONL format for portability)
 * No native dependencies required
 */
export class StorageManager {
  private logFilePath: string;
  private indexFilePath: string;
  private nextId: number = 1;
  private entries: Map<number, StoredLogEntry> = new Map();

  constructor(dbPath: string) {
    const dir = path.dirname(dbPath);
    
    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.logFilePath = dbPath.replace('.db', '.jsonl');
    this.indexFilePath = dbPath.replace('.db', '.index');
    
    this.loadFromDisk();
  }

  /**
   * Load logs from disk
   */
  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.logFilePath)) {
        const content = fs.readFileSync(this.logFilePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        
        this.entries.clear();
        let maxId = 0;

        for (const line of lines) {
          try {
            const entry = JSON.parse(line) as StoredLogEntry;
            this.entries.set(entry.id, entry);
            maxId = Math.max(maxId, entry.id);
          } catch {
            // Skip malformed lines
          }
        }

        this.nextId = maxId + 1;
      }
    } catch (error) {
      console.warn('Error loading logs from disk:', error);
    }
  }

  /**
   * Write logs to disk (atomically)
   */
  private async writeToDisk(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const tempPath = this.logFilePath + '.tmp';
        const writeStream = createWriteStream(tempPath, { encoding: 'utf-8' });

        const sortedEntries = Array.from(this.entries.values())
          .sort((a, b) => a.id - b.id);

        for (const entry of sortedEntries) {
          writeStream.write(JSON.stringify(entry) + '\n');
        }

        writeStream.end(() => {
          // Atomic rename
          try {
            if (fs.existsSync(this.logFilePath)) {
              fs.unlinkSync(this.logFilePath);
            }
            fs.renameSync(tempPath, this.logFilePath);
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        writeStream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Insert a log entry
   */
  async insert(entry: LogEntry, encryptedData: string, iv: string): Promise<number> {
    const id = this.nextId++;
    
    const storedEntry: StoredLogEntry = {
      id,
      timestamp: entry.timestamp,
      level: entry.level,
      message: entry.message,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : undefined,
      encrypted_data: encryptedData,
      iv,
      created_at: new Date().toISOString(),
    };

    this.entries.set(id, storedEntry);
    await this.writeToDisk();

    return id;
  }

  /**
   * Query logs with optional filters
   */
  async query(options: QueryOptions): Promise<QueryResult> {
    let results = Array.from(this.entries.values());

    // Filter by level
    if (options.level) {
      const levels = Array.isArray(options.level) ? options.level : [options.level];
      results = results.filter(entry => levels.includes(entry.level as any));
    }

    // Filter by time range
    if (options.startTime) {
      results = results.filter(entry => entry.timestamp >= options.startTime!);
    }

    if (options.endTime) {
      results = results.filter(entry => entry.timestamp <= options.endTime!);
    }

    // Filter by keyword
    if (options.keyword) {
      const keyword = options.keyword.toLowerCase();
      results = results.filter(entry =>
        entry.message.toLowerCase().includes(keyword) ||
        (entry.metadata && entry.metadata.toLowerCase().includes(keyword))
      );
    }

    const total = results.length;

    // Sort by timestamp descending
    results.sort((a, b) => b.timestamp - a.timestamp);

    // Pagination
    const offset = options.offset || 0;
    const limit = options.limit || 100;
    const paged = results.slice(offset, offset + limit);

    // Convert to LogEntry format
    const entries: LogEntry[] = paged.map(entry => ({
      timestamp: entry.timestamp,
      level: entry.level as any,
      message: entry.message,
      metadata: entry.metadata ? JSON.parse(entry.metadata) : undefined,
    }));

    return {
      entries,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get total log count
   */
  async count(): Promise<number> {
    return this.entries.size;
  }

  /**
   * Delete old logs (for rewritable medium behavior)
   */
  async deleteOldLogs(limit: number): Promise<number> {
    const sortedEntries = Array.from(this.entries.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, limit);

    let deleted = 0;
    for (const [id] of sortedEntries) {
      this.entries.delete(id);
      deleted++;
    }

    if (deleted > 0) {
      await this.writeToDisk();
    }

    return deleted;
  }

  /**
   * Clear all logs
   */
  async clear(): Promise<void> {
    this.entries.clear();
    this.nextId = 1;
    
    try {
      if (fs.existsSync(this.logFilePath)) {
        fs.unlinkSync(this.logFilePath);
      }
    } catch {
      // Ignore errors
    }
  }

  /**
   * Set metadata
   */
  async setMetadata(key: string, value: string): Promise<void> {
    // Metadata stored in separate JSON file
    const metaPath = this.logFilePath.replace('.jsonl', '.meta');
    let metadata: Record<string, string> = {};

    try {
      if (fs.existsSync(metaPath)) {
        const content = fs.readFileSync(metaPath, 'utf-8');
        metadata = JSON.parse(content);
      }
    } catch {
      // Start fresh if metadata is corrupted
    }

    metadata[key] = value;
    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf-8');
  }

  /**
   * Get metadata
   */
  async getMetadata(key: string): Promise<string | null> {
    const metaPath = this.logFilePath.replace('.jsonl', '.meta');

    try {
      if (fs.existsSync(metaPath)) {
        const content = fs.readFileSync(metaPath, 'utf-8');
        const metadata = JSON.parse(content) as Record<string, string>;
        return metadata[key] || null;
      }
    } catch {
      // Return null if metadata doesn't exist
    }

    return null;
  }

  /**
   * Vacuum database (optimize storage)
   */
  async vacuum(): Promise<void> {
    // Rewrite file to remove any gaps
    await this.writeToDisk();
  }

  /**
   * Close storage (cleanup)
   */
  async close(): Promise<void> {
    // No resources to close for file-based storage
    // Ensure data is written
    if (this.entries.size > 0) {
      await this.writeToDisk();
    }
  }

  /**
   * Get storage file size in bytes
   */
  getDatabaseSize(): number {
    try {
      const stats = fs.statSync(this.logFilePath);
      return stats.size;
    } catch {
      return 0;
    }
  }
}
