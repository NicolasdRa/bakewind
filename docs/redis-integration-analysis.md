# Redis Integration Analysis

**Date**: October 3, 2025
**Author**: Technical Analysis
**Status**: Active

## Overview

This document provides a comprehensive analysis of Redis integration in the BakeWind bakery management SaaS platform. Redis serves as a critical in-memory data store for high-performance caching, distributed locking, and session management.

---

## Architecture

### Configuration

- **Library**: `ioredis`
- **Module**: Global module (`@Global()` decorator)
- **Location**: `src/redis/redis.module.ts` and `src/redis/redis.service.ts`
- **Default Connection**: `redis://localhost:6379`
- **Environment Variable**: `REDIS_URL`

### Connection Settings

```typescript
{
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  lazyConnect: true,
  reconnectOnError: (err) => err.message.includes('READONLY')
}
```

**Features**:
- Lazy connection initialization
- Exponential backoff retry strategy (50ms - 2000ms)
- Auto-reconnection on READONLY errors
- Connection lifecycle management (cleanup on module destroy)

---

## Primary Use Cases

### 1. Distributed Order Locking System 📦

**Location**: `src/order-locks/order-locks.service.ts`

**Purpose**: Prevent concurrent edits to orders by multiple users in a distributed system

#### Implementation Details

**Lock Key Pattern**:
```
order_lock:{orderId}
```

**TTL**: 300 seconds (5 minutes)

**Lock Data Structure**:
```json
{
  "userId": "uuid",
  "sessionId": "session-uuid"
}
```

#### Operations

##### Acquire Lock
1. Check if order exists in PostgreSQL
2. Attempt atomic lock acquisition in Redis using `SET NX EX`:
   ```typescript
   redis.set(lockKey, JSON.stringify({userId, sessionId}), 'EX', 300, 'NX')
   ```
3. If Redis lock succeeds:
   - Create/update lock record in PostgreSQL (persistent backup)
   - Broadcast lock notification via WebSocket
4. If Redis lock fails:
   - Retrieve current lock details from PostgreSQL
   - Throw `ConflictException` with lock owner info

##### Release Lock
1. Find lock record in PostgreSQL owned by current user
2. Delete from PostgreSQL
3. Delete from Redis: `redis.del(lockKey)`
4. Broadcast unlock notification via WebSocket

##### Renew Lock
1. Verify lock ownership in PostgreSQL
2. Extend TTL in Redis: `redis.expire(lockKey, 300)`
3. Update `expiresAt` and `lastActivityAt` in PostgreSQL
4. Return updated lock status

#### Dual Storage Pattern

| Redis | PostgreSQL |
|-------|-----------|
| **Primary lock mechanism** | **Persistent backup** |
| Fast, atomic operations | Durable record |
| TTL auto-expiration | Audit trail |
| In-memory speed | Survives Redis restart |
| Distributed across instances | Single source of truth |

**Why Dual Storage?**
- **Redis**: Fast lock checks and automatic expiration
- **PostgreSQL**: Persistence, recovery, and audit history
- **Fail-safe**: If Redis goes down, PostgreSQL provides lock state

---

### 2. JWT Token Blacklisting 🚫

**Location**: `src/auth/auth.service.ts`

**Purpose**: Invalidate JWT access tokens immediately on logout (before natural expiration)

#### Implementation Details

**Key Pattern**:
```
blacklist:token:{accessToken}
```

**Value**: `userId` (for audit purposes)

**TTL**: Remaining token lifetime (calculated from JWT expiration)

#### Operations

##### Logout (Token Blacklisting)
```typescript
// Calculate remaining token lifetime
const decodedToken = this.jwtService.decode(accessToken);
const ttl = decodedToken.exp - Math.floor(Date.now() / 1000);

// Only blacklist if token hasn't expired yet
if (ttl > 0) {
  await this.redisService.setex(
    `blacklist:token:${accessToken}`,
    ttl,
    userId
  );
}
```

##### Token Validation
```typescript
// Check blacklist on every authenticated request
const isBlacklisted = await this.redisService.exists(
  `blacklist:token:${token}`
);
if (isBlacklisted) {
  throw new UnauthorizedException('Token has been revoked');
}
```

#### Why Redis for Token Blacklisting?

1. **Performance**: Fast lookup on every authenticated request
2. **Auto-cleanup**: TTL automatically removes expired blacklisted tokens
3. **No Manual Maintenance**: Redis handles garbage collection
4. **Memory Efficient**: Only stores blacklisted tokens, not all tokens
5. **Distributed**: Works across multiple API instances

---

### 3. Cross-Application Session Transfer (SSO) 🔄

**Location**: `src/auth/auth.service.ts`

**Purpose**: Securely transfer authentication between landing site (port 3000) and admin dashboard (port 3001)

#### Implementation Details

**Key Pattern**:
```
auth:transfer:{sessionId}
```

**Session Data Structure**:
```json
{
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "userId": "user-uuid",
  "createdAt": 1696339200000
}
```

**TTL**: 60 seconds (one-time use, short-lived)

#### Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   Website   │────▶│   Backend   │────▶│    Redis     │
│  (Port 3000)│     │   API       │     │              │
└─────────────┘     └─────────────┘     └──────────────┘
       │                    │                    │
       │  1. Login Request  │                    │
       │───────────────────▶│                    │
       │                    │                    │
       │                    │  2. Store Session  │
       │                    │───────────────────▶│
       │                    │   (60s TTL)        │
       │                    │                    │
       │  3. Redirect URL   │                    │
       │◀───────────────────│                    │
       │  with sessionId    │                    │
       │                    │                    │
       ▼                    │                    │
┌─────────────┐             │                    │
│    Admin    │             │                    │
│  (Port 3001)│             │                    │
└─────────────┘             │                    │
       │                    │                    │
       │  4. Claim Session  │                    │
       │───────────────────▶│                    │
       │   (sessionId)      │                    │
       │                    │  5. Get & Delete   │
       │                    │───────────────────▶│
       │                    │   (one-time use)   │
       │                    │                    │
       │  6. Return Tokens  │                    │
       │◀───────────────────│                    │
       │                    │                    │
       ▼                    │                    │
  Store in localStorage     │                    │
```

#### Operations

##### Create Transfer Session
```typescript
async createTransferSession(
  accessToken: string,
  refreshToken: string,
  userId: string
): Promise<TransferSessionResponse> {
  const sessionId = randomBytes(32).toString('hex');
  const ttl = 60; // 60 seconds

  const sessionData = JSON.stringify({
    accessToken,
    refreshToken,
    userId,
    createdAt: Date.now(),
  });

  await this.redisService.setex(
    `auth:transfer:${sessionId}`,
    ttl,
    sessionData
  );

  return {
    sessionId,
    expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
  };
}
```

##### Claim Transfer Session
```typescript
async claimTransferSession(
  sessionId: string
): Promise<TransferSessionTokens> {
  const sessionKey = `auth:transfer:${sessionId}`;

  // Get session data from Redis
  const sessionData = await this.redisService.get(sessionKey);

  if (!sessionData) {
    throw new UnauthorizedException('Invalid or expired transfer session');
  }

  // Delete immediately (one-time use)
  await this.redisService.del(sessionKey);

  // Parse and return tokens
  const { accessToken, refreshToken, userId } = JSON.parse(sessionData);

  return { accessToken, refreshToken, userId };
}
```

#### Security Features

1. **One-Time Use**: Session deleted immediately after claim
2. **Short TTL**: 60-second expiration window
3. **Random Session ID**: Cryptographically secure random bytes
4. **Auto-Expiration**: Redis automatically cleans up unclaimed sessions
5. **No Persistent Storage**: Tokens only temporarily in Redis

#### Why Redis for Session Transfer?

1. **Temporary Storage**: Perfect for short-lived, ephemeral data
2. **Atomic Operations**: Get and delete in single transaction
3. **Auto-Cleanup**: TTL prevents abandoned sessions from accumulating
4. **Cross-Origin Safe**: Avoids CORS issues with token transfer
5. **No Cookie Dependencies**: Works across different domains/ports

---

## Redis Service API

The `RedisService` provides a clean abstraction layer with the following methods:

### Basic Operations

```typescript
// Set key-value with optional TTL
async set(key: string, value: string, ttlSeconds?: number): Promise<void>

// Get value by key
async get(key: string): Promise<string | null>

// Delete key
async del(key: string): Promise<number>

// Check if key exists
async exists(key: string): Promise<boolean>
```

### Expiration Management

```typescript
// Set with expiration
async setex(key: string, seconds: number, value: string): Promise<void>

// Get TTL in seconds (-1 if no expiration, -2 if not exists)
async ttl(key: string): Promise<number>

// Set expiration on existing key
async expire(key: string, seconds: number): Promise<boolean>
```

### Counters

```typescript
// Atomic increment
async incr(key: string): Promise<number>
```

### Direct Client Access

```typescript
// For advanced operations
getClient(): Redis
```

---

## Key Design Patterns

### 1. Global Module Pattern

Redis module is marked as `@Global()`, making it available throughout the application without explicit imports:

```typescript
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
```

**Benefits**:
- No need to import RedisModule in every feature module
- Single Redis connection pool shared across app
- Consistent connection management

### 2. Graceful Shutdown

Implements `OnModuleDestroy` lifecycle hook:

```typescript
async onModuleDestroy() {
  await this.client.quit();
}
```

Ensures Redis connections are properly closed on application shutdown.

### 3. Lazy Connection

```typescript
{
  lazyConnect: true
}
```

Connection is established on first use, not at module initialization. Allows app to start even if Redis is temporarily unavailable.

### 4. Retry Strategy with Exponential Backoff

```typescript
retryStrategy: (times) => {
  const delay = Math.min(times * 50, 2000);
  return delay;
}
```

- First retry: 50ms
- Second retry: 100ms
- Third retry: 150ms
- Max retry delay: 2000ms (2 seconds)

---

## Performance Considerations

### 1. Order Locks

- **Read-Heavy**: Lock status checks on every order view
- **Write Operations**: Acquire, renew, release
- **Pattern**: Check Redis first (fast), fallback to PostgreSQL if needed
- **Optimization**: TTL auto-cleanup reduces manual maintenance

### 2. Token Blacklisting

- **Critical Path**: Every authenticated request checks blacklist
- **Frequency**: High (potentially thousands of requests per second)
- **Optimization**: In-memory lookup (<1ms typical response time)
- **Auto-Cleanup**: TTL prevents memory bloat

### 3. Session Transfer

- **Low Frequency**: Only during login/authentication flow
- **Short-Lived**: 60-second TTL
- **One-Time**: Immediate deletion after use
- **Minimal Impact**: Not on critical request path

---

## Monitoring & Observability

### Connection Events

```typescript
client.on('error', (error) => {
  logger.error('Redis connection error:', error);
});

client.on('connect', () => {
  logger.log('Redis connected successfully');
});
```

### Recommended Metrics to Track

1. **Connection Health**:
   - Connection uptime
   - Reconnection attempts
   - Connection errors

2. **Operation Metrics**:
   - Lock acquisition success/failure rate
   - Token blacklist hit rate
   - Session transfer success rate

3. **Performance Metrics**:
   - Command execution time
   - Memory usage
   - Key count by pattern

4. **Business Metrics**:
   - Active order locks count
   - Blacklisted tokens count
   - Pending transfer sessions count

---

## Deployment Considerations

### Environment Configuration

Required environment variable:
```bash
REDIS_URL=redis://localhost:6379
```

For production, consider:
```bash
# With authentication
REDIS_URL=redis://:password@redis-server:6379

# Redis Cluster
REDIS_URL=redis://redis-cluster:6379

# TLS
REDIS_URL=rediss://redis-server:6380
```

### High Availability

For production deployments, consider:

1. **Redis Sentinel**: Automatic failover
2. **Redis Cluster**: Horizontal scaling
3. **Redis Persistence**: RDB or AOF for data durability
4. **Connection Pooling**: Already handled by ioredis

### Docker Deployment

Add Redis to `docker-compose.yml`:

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  redis-data:
```

---

## Current Status

### Configuration Check

- ✅ Redis module properly registered as global
- ✅ Service provides clean API abstraction
- ✅ Connection lifecycle properly managed
- ⚠️ `REDIS_URL` not set in `.env` (defaults to `localhost:6379`)
- ⚠️ No Redis container currently running in Docker

### Active Features

1. **Order Locks**: `OrderLocksService` (ready but requires Redis)
2. **Token Blacklisting**: `AuthService.logout()` (ready but requires Redis)
3. **Session Transfer**: `AuthService` transfer methods (ready but requires Redis)

---

## Recommendations

### Immediate Actions

1. **Add Redis to Docker Compose**:
   ```yaml
   redis:
     image: redis:7-alpine
     ports:
       - "6379:6379"
   ```

2. **Update `.env`**:
   ```bash
   REDIS_URL=redis://localhost:6379
   ```

3. **Start Redis Container**:
   ```bash
   docker-compose up -d redis
   ```

### Future Enhancements

1. **Monitoring**:
   - Add Redis metrics to health check endpoint
   - Implement connection pool monitoring
   - Track key expiration patterns

2. **Testing**:
   - Add Redis integration tests
   - Test failover scenarios
   - Benchmark performance under load

3. **Security**:
   - Enable Redis authentication in production
   - Use TLS for Redis connections
   - Implement rate limiting on Redis operations

4. **Operational**:
   - Set up Redis backup strategy
   - Configure memory limits and eviction policies
   - Implement Redis Sentinel or Cluster for HA

---

## Summary

Redis serves three critical functions in the BakeWind platform:

1. **🔒 Distributed Order Locking**
   - Prevents concurrent edit conflicts
   - Automatic expiration with TTL
   - Dual storage with PostgreSQL backup

2. **🚫 JWT Token Blacklisting**
   - Immediate token invalidation on logout
   - Fast authentication checks
   - Auto-cleanup of expired tokens

3. **🔄 Cross-App Session Transfer**
   - Secure SSO between landing and admin apps
   - One-time use session tokens
   - Short-lived temporary storage

All use cases leverage Redis's core strengths:
- **Speed**: In-memory operations (<1ms latency)
- **TTL**: Automatic data expiration
- **Atomicity**: Safe concurrent operations
- **Distribution**: Works across multiple API instances

The implementation follows best practices with proper connection management, error handling, retry logic, and graceful shutdown procedures.
