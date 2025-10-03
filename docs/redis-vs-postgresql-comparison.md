# Redis vs PostgreSQL: Architecture Decision Analysis

**Date**: October 3, 2025
**Topic**: Why use Redis instead of PostgreSQL for locks, blacklists, and session transfers?

---

## Executive Summary

This document analyzes the architectural decision to use Redis alongside PostgreSQL for specific features in the BakeWind platform. While PostgreSQL could theoretically handle all these use cases, Redis provides significant performance, operational, and architectural benefits for specific patterns.

---

## Feature-by-Feature Comparison

### 1. Distributed Order Locking 🔒

#### PostgreSQL-Only Implementation

```sql
-- Acquire lock
BEGIN;
SELECT * FROM order_locks
WHERE order_id = $1
FOR UPDATE NOWAIT;

INSERT INTO order_locks (order_id, user_id, expires_at)
VALUES ($1, $2, NOW() + INTERVAL '5 minutes')
ON CONFLICT (order_id) DO UPDATE
SET user_id = $2, expires_at = NOW() + INTERVAL '5 minutes';
COMMIT;
```

**Pros**:
- ✅ Single database (simpler infrastructure)
- ✅ ACID transactions
- ✅ Persistent lock history
- ✅ No additional service dependencies
- ✅ Built-in relational queries

**Cons**:
- ❌ **Lock contention**: Row-level locks can cause deadlocks
- ❌ **No automatic expiration**: Requires cron job to clean expired locks
- ❌ **Slower**: Disk I/O for every lock check (~10-50ms)
- ❌ **Connection pool pressure**: Holds DB connections during lock duration
- ❌ **Scale limitations**: All instances compete for same DB rows
- ❌ **Manual cleanup**: Stale locks from crashed processes require background jobs

#### Redis Implementation

```typescript
// Acquire lock (atomic, non-blocking)
const locked = await redis.set(
  `order_lock:${orderId}`,
  JSON.stringify({ userId, sessionId }),
  'EX', 300,  // Auto-expires in 5 minutes
  'NX'        // Only set if not exists
);
```

**Pros**:
- ✅ **Atomic operations**: `SET NX EX` is single atomic command
- ✅ **Auto-expiration**: TTL automatically removes stale locks
- ✅ **Fast**: In-memory, typically <1ms response time
- ✅ **No deadlocks**: Single-threaded command execution
- ✅ **No cleanup needed**: Redis handles expiration
- ✅ **Scalable**: Minimal load on database
- ✅ **Non-blocking**: Instant failure if lock exists

**Cons**:
- ❌ Volatile (data lost if Redis crashes)
- ❌ Additional infrastructure component
- ❌ Network hop (Redis + PostgreSQL)

#### Current Hybrid Approach (Best of Both)

```typescript
// 1. Fast lock in Redis
const locked = await redis.set(lockKey, data, 'EX', 300, 'NX');

// 2. Persistent backup in PostgreSQL
await db.insert(orderLocks).values({...});
```

**Benefits**:
- ✅ Speed of Redis (primary lock mechanism)
- ✅ Durability of PostgreSQL (audit trail + recovery)
- ✅ Best of both worlds

---

### 2. JWT Token Blacklisting 🚫

#### PostgreSQL-Only Implementation

```sql
-- On logout
INSERT INTO blacklisted_tokens (token_hash, user_id, expires_at)
VALUES (SHA256($1), $2, $3);

-- On every authenticated request
SELECT EXISTS(
  SELECT 1 FROM blacklisted_tokens
  WHERE token_hash = SHA256($1)
  AND expires_at > NOW()
);
```

**Pros**:
- ✅ Persistent audit trail
- ✅ No Redis dependency
- ✅ Can query blacklist history

**Cons**:
- ❌ **Critical path impact**: Every auth request queries DB
- ❌ **Performance degradation**:
  - 1000 req/sec = 1000 DB queries/sec
  - 10,000 req/sec = 10,000 DB queries/sec
- ❌ **Table bloat**: Millions of rows accumulate
- ❌ **Manual cleanup required**: Vacuum job to delete expired tokens
- ❌ **Index maintenance overhead**: B-tree rebalancing on every insert
- ❌ **Connection pool exhaustion**: High concurrent auth requests
- ❌ **Disk I/O bottleneck**: Can't scale beyond disk limits

#### Redis Implementation

```typescript
// On logout
await redis.setex(
  `blacklist:token:${token}`,
  ttl,  // Remaining token lifetime
  userId
);

// On every authenticated request (fast!)
const isBlacklisted = await redis.exists(
  `blacklist:token:${token}`
);
```

**Pros**:
- ✅ **Extreme speed**: <1ms lookups (vs 10-50ms in PostgreSQL)
- ✅ **Auto-expiration**: No manual cleanup needed
- ✅ **Memory efficient**: Only active tokens in memory
- ✅ **No bloat**: Expired entries automatically removed
- ✅ **Scales horizontally**: Add more Redis nodes
- ✅ **No connection pool issues**: Separate from DB pool

**Cons**:
- ❌ No audit trail of historical blacklists
- ❌ Lost on Redis restart (acceptable - tokens expire anyway)

#### Performance Comparison

| Metric | PostgreSQL | Redis |
|--------|-----------|-------|
| Lookup time | 10-50ms | <1ms |
| 1,000 req/sec | 1,000 DB queries | 1,000 Redis ops (negligible) |
| 10,000 req/sec | DB overload 🔥 | Handles easily ✅ |
| Cleanup | Manual cron job | Automatic TTL |
| Scalability | Vertical (bigger DB) | Horizontal (more nodes) |

**Verdict**: Redis is **50-100x faster** for this use case

---

### 3. Cross-App Session Transfer 🔄

#### PostgreSQL-Only Implementation

```sql
-- Create transfer session
INSERT INTO transfer_sessions (session_id, tokens, expires_at)
VALUES ($1, $2, NOW() + INTERVAL '60 seconds');

-- Claim session
BEGIN;
SELECT tokens FROM transfer_sessions
WHERE session_id = $1 AND expires_at > NOW()
FOR UPDATE;

DELETE FROM transfer_sessions WHERE session_id = $1;
COMMIT;
```

**Pros**:
- ✅ Persistent session record
- ✅ Transaction safety
- ✅ Audit trail of transfers

**Cons**:
- ❌ **Complexity**: Requires transaction for atomic get-and-delete
- ❌ **Cleanup overhead**: Cron job to delete expired sessions
- ❌ **Table bloat**: Short-lived records accumulate
- ❌ **Slower**: Multiple DB round trips
- ❌ **Connection held**: Transaction locks row
- ❌ **Vacuum pressure**: Frequent inserts/deletes

#### Redis Implementation

```typescript
// Create transfer session
await redis.setex(
  `auth:transfer:${sessionId}`,
  60,  // Auto-expires in 60 seconds
  JSON.stringify(tokens)
);

// Claim session (atomic get-and-delete)
const tokens = await redis.getdel(`auth:transfer:${sessionId}`);
```

**Pros**:
- ✅ **Perfect fit**: Ephemeral data with TTL
- ✅ **Auto-cleanup**: No cron jobs needed
- ✅ **Atomic**: `GETDEL` is single operation (Redis 6.2+)
- ✅ **Zero bloat**: Expired sessions vanish automatically
- ✅ **Fast**: Sub-millisecond operations

**Cons**:
- ❌ No permanent record (but not needed for temporary sessions)

**Verdict**: Redis is **architecturally superior** for ephemeral data

---

## General Comparison Matrix

### Performance Characteristics

| Aspect | PostgreSQL | Redis |
|--------|-----------|-------|
| **Data Location** | Disk (with cache) | Memory (100% in-RAM) |
| **Read Latency** | 5-50ms (cache hit) | <1ms |
| **Write Latency** | 5-50ms (WAL + disk) | <1ms |
| **Throughput** | 10K-50K ops/sec | 100K-1M ops/sec |
| **TTL Support** | Manual (triggers/cron) | Native, automatic |
| **Atomic Ops** | Transactions (complex) | Built-in commands |
| **Scalability** | Vertical (limited) | Horizontal (unlimited) |

### Operational Characteristics

| Aspect | PostgreSQL | Redis |
|--------|-----------|-------|
| **Data Durability** | Fully persistent | Optional (RDB/AOF) |
| **Backup/Recovery** | Full ACID guarantees | Best-effort |
| **Query Complexity** | SQL (joins, aggregates) | Key-value (simple) |
| **Schema** | Rigid structure | Schemaless |
| **Maintenance** | Vacuum, reindex, analyze | Minimal |
| **Memory Usage** | Shared buffers + OS cache | All data in RAM |

---

## When to Use PostgreSQL vs Redis

### Use PostgreSQL When:

1. **Data must survive crashes** ✅
   - Financial transactions
   - User accounts
   - Order history
   - Audit logs

2. **Complex queries needed** ✅
   - Joins across tables
   - Aggregations (SUM, AVG, COUNT)
   - Full-text search
   - Reporting and analytics

3. **ACID guarantees required** ✅
   - Banking operations
   - Inventory updates
   - Critical business logic

4. **Relational integrity matters** ✅
   - Foreign keys
   - Referential constraints
   - Data normalization

### Use Redis When:

1. **Speed is critical** 🚀
   - Real-time leaderboards
   - Rate limiting
   - Authentication checks
   - API response caching

2. **Temporary data (TTL)** ⏰
   - Session tokens
   - OTP codes
   - Cache entries
   - Temporary locks

3. **High throughput required** 📈
   - 100K+ ops/sec
   - Pub/Sub messaging
   - Real-time analytics
   - Metrics counters

4. **Atomic operations needed** ⚛️
   - Distributed locks
   - Counters (INCR/DECR)
   - Conditional sets (NX, XX)
   - Sorted sets (leaderboards)

---

## Cost-Benefit Analysis

### Infrastructure Costs

#### PostgreSQL-Only Approach

```
✅ Pros:
- One database to manage
- Single backup strategy
- Simpler monitoring
- Lower infrastructure cost

❌ Cons:
- Must scale DB vertically for speed
- Need larger instance for high throughput
- More expensive DB instance overall
```

**Estimated Monthly Cost** (AWS):
- Large RDS instance (db.r6g.2xlarge): ~$600/month
- Total: **$600/month**

#### Redis + PostgreSQL Approach

```
✅ Pros:
- Each service optimized for its use case
- PostgreSQL can be smaller
- Redis handles speed-critical operations
- Better resource utilization

❌ Cons:
- Two services to manage
- Separate monitoring
- More complexity
```

**Estimated Monthly Cost** (AWS):
- Medium RDS instance (db.r6g.large): ~$250/month
- ElastiCache Redis (cache.r6g.large): ~$175/month
- Total: **$425/month**

**Savings**: ~$175/month (~29%) + better performance

### Development & Maintenance Costs

#### PostgreSQL-Only

```
❌ Additional Development:
- Manual TTL cleanup cron jobs
- Lock timeout handling
- Stale data cleanup scripts
- Vacuum tuning
- Index optimization for high-write tables

Estimated: 20-30 hours initial + 5 hours/month maintenance
```

#### Redis + PostgreSQL

```
✅ Simpler Development:
- TTL is automatic
- Locks self-expire
- No cleanup scripts needed
- Minimal maintenance

Estimated: 5 hours initial setup + 1 hour/month monitoring
```

**Developer Time Saved**: ~15-25 hours initially, ~4 hours/month ongoing

---

## Real-World Scenarios

### Scenario 1: High Traffic Dashboard

**Load**: 10,000 concurrent users, 50,000 requests/second

#### PostgreSQL-Only:
```
❌ Issues:
- 50K token blacklist checks/sec = database meltdown
- Connection pool exhaustion (max ~200-500 connections)
- Lock table contention
- Disk I/O bottleneck
- Response time degradation: 50ms → 500ms → timeouts

Solution: Massive vertical scaling ($2000+/month DB instance)
```

#### With Redis:
```
✅ Handles easily:
- Token checks: <1ms, negligible load
- Order locks: instant, no DB pressure
- Sessions: ephemeral, auto-cleanup
- PostgreSQL: only for persistence (light load)

Solution: Standard instances (~$425/month total)
```

### Scenario 2: Order Lock Storm

**Event**: 100 users try to edit same order simultaneously

#### PostgreSQL-Only:
```
❌ Problems:
1. 100 transactions compete for row lock
2. FOR UPDATE NOWAIT: 99 fail immediately (good)
   OR
   FOR UPDATE: 99 wait in queue (bad - timeout cascade)
3. High transaction overhead
4. Potential deadlocks if multiple orders involved
5. Cleanup needed if lock holder crashes

Result: 99 frustrated users, slow response (50-100ms)
```

#### With Redis:
```
✅ Clean handling:
1. First SET NX succeeds instantly (<1ms)
2. Other 99 fail instantly (<1ms each)
3. No deadlocks possible (atomic operation)
4. Auto-cleanup on crash (TTL expires)
5. PostgreSQL backup prevents data loss

Result: Fast failure, clear error messages (<5ms total)
```

### Scenario 3: Security - Immediate Token Revocation

**Requirement**: Revoke user token within 1 second of suspicious activity

#### PostgreSQL-Only:
```
❌ Challenges:
- Insert to blacklist: 10-20ms
- Next request token check: 10-20ms (if indexed)
- Under load: 50-200ms (table contention)
- Total: Up to 200ms delay

Risk: 200ms window where compromised token still works
Could serve 20+ malicious requests in that window
```

#### With Redis:
```
✅ Immediate:
- Insert to blacklist: <1ms
- Next request check: <1ms
- Under any load: <2ms (isolated from DB)

Risk: <2ms window (max 1-2 malicious requests)
99% faster revocation
```

---

## Hybrid Architecture Benefits

The current implementation uses **both** PostgreSQL and Redis strategically:

### Layer 1: Redis (Speed Layer)
```
🚀 Fast, volatile operations:
- Lock acquisition/release
- Token blacklist checks
- Session transfers
- Real-time operations
```

### Layer 2: PostgreSQL (Persistence Layer)
```
💾 Durable, persistent data:
- Lock audit trail
- User accounts
- Order history
- Business records
```

### Why This Works

1. **Best of Both Worlds**:
   - Speed where needed (Redis)
   - Durability where required (PostgreSQL)

2. **Fail-Safe Architecture**:
   ```
   Redis crashes → PostgreSQL has lock records (can rebuild)
   PostgreSQL slow → Redis still fast (degrades gracefully)
   ```

3. **Separation of Concerns**:
   - Redis: Ephemeral, speed-critical data
   - PostgreSQL: Permanent, business-critical data

4. **Independent Scaling**:
   - Scale Redis for throughput
   - Scale PostgreSQL for storage

---

## Migration Path: What If We Removed Redis?

### Impact Analysis

#### Immediate Performance Loss:

```
Order Locks:
- Current: <1ms acquisition
- Without Redis: 10-50ms acquisition
- Impact: 10-50x slower, potential timeout cascade

Token Blacklist:
- Current: <1ms check (critical path)
- Without Redis: 10-50ms check
- Impact: 10-50x slower on EVERY authenticated request
         At 10K req/sec = 100-500 seconds of DB time/sec (impossible)

Session Transfer:
- Current: <1ms get+delete
- Without Redis: 20-100ms transaction
- Impact: Slower UX, more DB load, manual cleanup needed
```

#### Operational Overhead:

```
New Cron Jobs Needed:
1. Expired lock cleanup (every 1 min)
2. Expired token cleanup (every 5 min)
3. Old session cleanup (every 1 min)
4. Stale lock detection (every 5 min)

Database Maintenance:
- Frequent VACUUM on high-churn tables
- Index maintenance for bloated tables
- Connection pool tuning
- Query optimization
```

#### Code Complexity:

```typescript
// Current (with Redis) - Simple
await redis.setex(key, ttl, value);

// Without Redis - Complex
await db.transaction(async (tx) => {
  await tx.insert(...);
  // Schedule cleanup job
  await scheduleCleanup(key, ttl);
  // Handle expiration manually
  // Monitor table bloat
  // ...
});
```

---

## Recommendations

### Current Architecture: ✅ Keep Redis

**Rationale**:
1. **Performance**: 10-100x faster for critical paths
2. **Cost-Effective**: Saves money vs. vertical PostgreSQL scaling
3. **Operational**: Auto-cleanup reduces maintenance
4. **Proven Pattern**: Industry standard for these use cases

### When to Reconsider:

Only remove Redis if:
- [ ] Traffic is extremely low (<100 req/min)
- [ ] Cost constraints are severe (can't afford $175/month)
- [ ] Infrastructure simplicity is paramount
- [ ] Performance SLAs are relaxed (>100ms acceptable)

**Even then**: Redis adds so much value for minimal cost that removal is rarely justified.

### Best Practice: Polyglot Persistence

```
Use the right tool for the right job:

🚀 Redis:
   - Caching
   - Session storage
   - Rate limiting
   - Distributed locks
   - Real-time leaderboards
   - Pub/Sub messaging

💾 PostgreSQL:
   - Business data
   - User accounts
   - Transactions
   - Reports
   - Audit logs
   - Relational queries

📊 Other specialized stores (as needed):
   - Elasticsearch: Full-text search
   - MongoDB: Flexible schemas
   - TimescaleDB: Time-series data
   - S3: File storage
```

---

## Conclusion

### Why Redis + PostgreSQL is Superior

| Requirement | PostgreSQL-Only | Redis + PostgreSQL |
|------------|----------------|-------------------|
| **Speed** | 10-50ms | <1ms | ✅ Winner |
| **Durability** | ✅ | ✅ (hybrid) | ✅ Tie |
| **Auto-cleanup** | ❌ Manual | ✅ Automatic | ✅ Winner |
| **Scalability** | Vertical | Horizontal | ✅ Winner |
| **Cost** | $600/mo | $425/mo | ✅ Winner |
| **Maintenance** | High | Low | ✅ Winner |
| **Complexity** | Lower | Slightly higher | ⚠️ Trade-off |

### Final Verdict

**Redis + PostgreSQL hybrid architecture is the correct choice because**:

1. ✅ **Performance**: 10-100x faster for critical operations
2. ✅ **Cost**: Actually cheaper than vertically scaling PostgreSQL
3. ✅ **Reliability**: Each service optimized for its strength
4. ✅ **Scalability**: Independent horizontal scaling
5. ✅ **Developer Experience**: Less code, fewer bugs, auto-cleanup
6. ✅ **Industry Standard**: Proven pattern used by major platforms

**The slight increase in infrastructure complexity is vastly outweighed by the performance, cost, and operational benefits.**

---

## References

- [Redis Use Cases](https://redis.io/docs/manual/patterns/)
- [PostgreSQL vs Redis Performance](https://stackoverflow.com/questions/10558465/)
- [Distributed Locks with Redis](https://redis.io/docs/manual/patterns/distributed-locks/)
- [Database Polyglot Persistence](https://martinfowler.com/bliki/PolyglotPersistence.html)
