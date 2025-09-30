import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';

// Memory cache for ultra-fast access
class MemoryCache {
  private cache = new Map<string, { data: Buffer; timestamp: number }>();
  private readonly MAX_SIZE = 50 * 1024 * 1024; // 50MB in memory
  private readonly MAX_AGE = 30 * 60 * 1000; // 30 minutes

  get(key: string): Buffer | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.MAX_AGE) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: Buffer): void {
    this.evictIfNeeded(data.length);
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private evictIfNeeded(newSize: number): void {
    const currentSize = this.getCurrentSize();
    if (currentSize + newSize <= this.MAX_SIZE) return;

    // Remove oldest entries
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    let freedSize = 0;
    for (const [key, entry] of entries) {
      this.cache.delete(key);
      freedSize += entry.data.length;
      if (freedSize >= newSize) break;
    }
  }

  private getCurrentSize(): number {
    let size = 0;
    for (const entry of this.cache.values()) {
      size += entry.data.length;
    }
    return size;
  }

  clear(): void {
    this.cache.clear();
  }
}

export class HybridCache {
  private static instance: HybridCache;
  private memoryCache = new MemoryCache();
  private cacheDir: string;
  private filesystemEnabled = true;

  constructor() {
    // Use /tmp on Railway, .cache locally
    this.cacheDir = process.env.RAILWAY_ENVIRONMENT 
      ? join('/tmp', 'image-cache')
      : join(process.cwd(), '.cache', 'images');

    // Try to create cache directory
    try {
      if (!existsSync(this.cacheDir)) {
        mkdirSync(this.cacheDir, { recursive: true });
      }
    } catch (error) {
      console.warn('Filesystem cache disabled, using memory-only:', error);
      this.filesystemEnabled = false;
    }
  }

  static getInstance(): HybridCache {
    if (!HybridCache.instance) {
      HybridCache.instance = new HybridCache();
    }
    return HybridCache.instance;
  }

  private generateHash(key: string): string {
    return crypto.createHash('md5').update(key).digest('hex');
  }

  private getFilePath(key: string): string {
    const hash = this.generateHash(key);
    return join(this.cacheDir, `${hash}.img`);
  }

  async get(key: string): Promise<Buffer | null> {
    // Try memory cache first (fastest)
    let data = this.memoryCache.get(key);
    if (data) return data;

    // Try filesystem cache
    if (this.filesystemEnabled) {
      try {
        const filePath = this.getFilePath(key);
        if (existsSync(filePath)) {
          const stats = statSync(filePath);
          const maxAge = process.env.RAILWAY_ENVIRONMENT ? 2 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
          
          if (Date.now() - stats.mtimeMs < maxAge) {
            data = readFileSync(filePath);
            // Store in memory for faster next access
            this.memoryCache.set(key, data);
            return data;
          } else {
            // File expired, delete it
            unlinkSync(filePath);
          }
        }
      } catch (error) {
        // Filesystem error, continue without it
      }
    }

    return null;
  }

  async set(key: string, value: Buffer): Promise<void> {
    // Always store in memory
    this.memoryCache.set(key, value);

    // Try to store in filesystem
    if (this.filesystemEnabled) {
      try {
        const filePath = this.getFilePath(key);
        writeFileSync(filePath, value);
      } catch (error) {
        // Filesystem write failed, disable it for this session
        console.warn('Filesystem cache write failed, disabling:', error);
        this.filesystemEnabled = false;
      }
    }
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    
    if (this.filesystemEnabled) {
      try {
        // Clear filesystem cache (best effort)
        const files = require('fs').readdirSync(this.cacheDir);
        for (const file of files) {
          try {
            unlinkSync(join(this.cacheDir, file));
          } catch (error) {
            // Ignore individual file errors
          }
        }
      } catch (error) {
        // Ignore directory read errors
      }
    }
  }
}