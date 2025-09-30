import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';

// Use /tmp for Railway (ephemeral but works), fallback to .cache for local
const CACHE_DIR = process.env.RAILWAY_ENVIRONMENT 
  ? join('/tmp', 'image-cache')
  : join(process.cwd(), '.cache', 'images');

// More conservative limits for Railway's ephemeral storage
const MAX_CACHE_SIZE = process.env.RAILWAY_ENVIRONMENT 
  ? 100 * 1024 * 1024  // 100MB on Railway
  : 500 * 1024 * 1024; // 500MB locally

const MAX_AGE = process.env.RAILWAY_ENVIRONMENT
  ? 2 * 60 * 60 * 1000  // 2 hours on Railway (due to restarts)
  : 7 * 24 * 60 * 60 * 1000; // 7 days locally

// Ensure cache directory exists with error handling
try {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
} catch (error) {
  console.warn('Cache directory creation failed, cache will be disabled:', error);
}

export class ImageCache {
  private static instance: ImageCache;
  
  static getInstance(): ImageCache {
    if (!ImageCache.instance) {
      ImageCache.instance = new ImageCache();
    }
    return ImageCache.instance;
  }
  
  private generateHash(key: string): string {
    return crypto.createHash('md5').update(key).digest('hex');
  }
  
  private getCachePath(key: string): string {
    const hash = this.generateHash(key);
    const subdir = hash.substring(0, 2);
    const dir = join(CACHE_DIR, subdir);
    
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    return join(dir, `${hash}.cache`);
  }
  
  async get(key: string): Promise<Buffer | null> {
    const cachePath = this.getCachePath(key);
    
    if (!existsSync(cachePath)) {
      return null;
    }
    
    try {
      const stats = statSync(cachePath);
      const age = Date.now() - stats.mtimeMs;
      
      // Check if cache is expired
      if (age > MAX_AGE) {
        unlinkSync(cachePath);
        return null;
      }
      
      return readFileSync(cachePath);
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }
  
  async set(key: string, value: Buffer): Promise<void> {
    const cachePath = this.getCachePath(key);
    
    try {
      // Check cache size before writing
      await this.evictIfNeeded(value.length);
      
      writeFileSync(cachePath, value);
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }
  
  private async evictIfNeeded(newSize: number): Promise<void> {
    const currentSize = this.getCacheSize();
    
    if (currentSize + newSize <= MAX_CACHE_SIZE) {
      return;
    }
    
    // Get all cache files with their stats
    const files: Array<{ path: string; stats: any }> = [];
    
    const subdirs = readdirSync(CACHE_DIR);
    for (const subdir of subdirs) {
      const subdirPath = join(CACHE_DIR, subdir);
      if (!statSync(subdirPath).isDirectory()) continue;
      
      const cacheFiles = readdirSync(subdirPath);
      for (const file of cacheFiles) {
        const filePath = join(subdirPath, file);
        try {
          const stats = statSync(filePath);
          files.push({ path: filePath, stats });
        } catch (error) {
          // File might have been deleted
        }
      }
    }
    
    // Sort by last access time (oldest first)
    files.sort((a, b) => a.stats.atimeMs - b.stats.atimeMs);
    
    // Remove oldest files until we have enough space
    let freedSpace = 0;
    const targetSpace = newSize + (MAX_CACHE_SIZE * 0.1); // Free 10% extra
    
    for (const file of files) {
      if (freedSpace >= targetSpace) break;
      
      try {
        unlinkSync(file.path);
        freedSpace += file.stats.size;
      } catch (error) {
        // File might have been deleted
      }
    }
  }
  
  private getCacheSize(): number {
    let totalSize = 0;
    
    try {
      const subdirs = readdirSync(CACHE_DIR);
      for (const subdir of subdirs) {
        const subdirPath = join(CACHE_DIR, subdir);
        if (!statSync(subdirPath).isDirectory()) continue;
        
        const files = readdirSync(subdirPath);
        for (const file of files) {
          try {
            const stats = statSync(join(subdirPath, file));
            totalSize += stats.size;
          } catch (error) {
            // File might have been deleted
          }
        }
      }
    } catch (error) {
      console.error('Cache size calculation error:', error);
    }
    
    return totalSize;
  }
  
  async clear(): Promise<void> {
    try {
      const subdirs = readdirSync(CACHE_DIR);
      for (const subdir of subdirs) {
        const subdirPath = join(CACHE_DIR, subdir);
        if (!statSync(subdirPath).isDirectory()) continue;
        
        const files = readdirSync(subdirPath);
        for (const file of files) {
          try {
            unlinkSync(join(subdirPath, file));
          } catch (error) {
            // File might have been deleted
          }
        }
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
}