import zlib from 'zlib';
import { promisify } from 'util';

/**
 * Compression utility class
 */
export class CompressionManager {
  private gzip = promisify(zlib.gzip);
  private gunzip = promisify(zlib.gunzip);

  /**
   * Compress data
   */
  async compress(data: string): Promise<Buffer> {
    return this.gzip(Buffer.from(data, 'utf8'), { level: 9 });
  }

  /**
   * Decompress data
   */
  async decompress(buffer: Buffer): Promise<string> {
    const decompressed = await this.gunzip(buffer);
    return decompressed.toString('utf8');
  }

  /**
   * Get compression ratio
   */
  getCompressionRatio(originalSize: number, compressedSize: number): number {
    if (originalSize === 0) return 0;
    return ((1 - compressedSize / originalSize) * 100).toFixed(2) as unknown as number;
  }
}
