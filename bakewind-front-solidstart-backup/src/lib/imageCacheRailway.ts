import crypto from 'crypto';

// Memory cache for development and fallback
class MemoryCache {
  private cache = new Map<string, { data: Buffer; timestamp: number }>();
  private readonly MAX_SIZE = 100 * 1024 * 1024; // 100MB in memory
  private readonly MAX_AGE = 30 * 60 * 1000; // 30 minutes

  get(key: string): Buffer | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.MAX_AGE) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: Buffer): void {
    // Clean expired entries
    this.cleanExpired();
    
    // Evict if needed
    this.evictIfNeeded(data.length);
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.MAX_AGE) {
        this.cache.delete(key);
      }
    }
  }

  private evictIfNeeded(newSize: number): void {
    const currentSize = this.getCurrentSize();
    if (currentSize + newSize <= this.MAX_SIZE) return;

    // Convert to array and sort by timestamp (oldest first)
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    // Remove oldest entries until we have space
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

// Redis cache for production (Railway with Redis addon)
class RedisCache {
  private client: any = null;

  constructor() {
    // Only initialize Redis in production with REDIS_URL
    if (process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
      try {
        // Dynamically import Redis (install with: npm install redis)
        const Redis = require('redis');
        this.client = Redis.createClient({
          url: process.env.REDIS_URL,
          socket: {
            connectTimeout: 5000,
          },
        });
        
        this.client.on('error', (err: Error) => {
          console.error('Redis error:', err);
          this.client = null;
        });
        
        this.client.connect().catch((err: Error) => {
          console.error('Redis connection failed:', err);
          this.client = null;
        });
      } catch (error) {
        console.warn('Redis not available, falling back to memory cache');
        this.client = null;
      }
    }
  }

  async get(key: string): Promise<Buffer | null> {
    if (!this.client) return null;

    try {
      const data = await this.client.getBuffer(key);
      return data;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, data: Buffer): Promise<void> {
    if (!this.client) return;

    try {
      // Set with 24 hour expiration
      await this.client.setEx(key, 24 * 60 * 60, data);
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async clear(): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.flushAll();
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }
}

export class RailwayImageCache {
  private static instance: RailwayImageCache;
  private memoryCache = new MemoryCache();
  private redisCache = new RedisCache();

  static getInstance(): RailwayImageCache {
    if (!RailwayImageCache.instance) {
      RailwayImageCache.instance = new RailwayImageCache();
    }
    return RailwayImageCache.instance;
  }

  private generateHash(key: string): string {
    return crypto.createHash('md5').update(key).digest('hex');
  }

  async get(key: string): Promise<Buffer | null> {
    const cacheKey = this.generateHash(key);

    // Try memory cache first (fastest)
    let data = this.memoryCache.get(cacheKey);
    if (data) return data;

    // Try Redis cache (production)
    data = await this.redisCache.get(cacheKey);
    if (data) {
      // Store in memory cache for faster subsequent access
      this.memoryCache.set(cacheKey, data);
      return data;
    }

    return null;
  }

  async set(key: string, value: Buffer): Promise<void> {
    const cacheKey = this.generateHash(key);

    // Store in both caches
    this.memoryCache.set(cacheKey, value);
    await this.redisCache.set(cacheKey, value);
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    await this.redisCache.clear();
  }
}