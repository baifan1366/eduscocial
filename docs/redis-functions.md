# Redis Functions Documentation

This document describes the Redis utility functions implemented for the EduSocial application, which handle high-frequency operations using Redis for better performance.

## Post View Count Tracking

Redis is used to efficiently track post view counts without overloading the database with writes.

```js
import { incrementPostView } from 'lib/redisUtils';

// Increment view count for a post
const newViewCount = await incrementPostView('post-123');
```

- Uses Redis `INCR` command to atomically increment a counter
- Syncs with database only periodically (every 10 views) to reduce database load
- Key format: `post:{postId}:views`

## Like/Dislike Operation Buffering

Buffers like/dislike operations to reduce database writes through batch processing.

```js
import { bufferLikeOperation, processPendingLikeOperations } from 'lib/redisUtils';

// Record a like operation
await bufferLikeOperation('user-123', 'post-456', true);

// Process pending operations in batch (e.g., via a cron job)
const processedCount = await processPendingLikeOperations(100);
```

### How it works:

1. Stores user like/dislike operations in Redis with timestamps
2. Maintains sets of users who liked/disliked each post
3. Adds operations to a queue for batch processing
4. Provides a function to process pending operations in batches

### Key formats:
- User operation: `user:{userId}:liked:{postId}`
- Post likes/dislikes set: `post:{postId}:likes` or `post:{postId}:dislikes`
- Pending operations queue: `pending_like_operations`

## User Online/Offline Status Tracking

Tracks user online status in real-time using Redis.

```js
import { updateUserOnlineStatus, isUserOnline, getOnlineUsers } from 'lib/redisUtils';

// Update user status when they connect/disconnect
await updateUserOnlineStatus('user-123', true);  // Online
await updateUserOnlineStatus('user-123', false); // Offline

// Check if a specific user is online
const online = await isUserOnline('user-123');

// Get all online users
const onlineUsers = await getOnlineUsers();
```

### How it works:

1. Stores user online status with timestamps in a Redis hash
2. Considers users "online" if they've been active in the last 5 minutes
3. Provides functions to check individual user status and list all online users

### Key format:
- Online users hash: `online_users`

## User Session Management

Manages user sessions in Redis for quick access and real-time status updates.

```js
import { storeUserSession, getUserSession, removeUserSession } from 'lib/redisUtils';

// Store user session
await storeUserSession('user-123', { 
  email: 'user@university.edu',
  name: 'User Name',
  role: 'USER',
  loginTime: Date.now()
});

// Get user session
const session = await getUserSession('user-123');

// Remove user session (on logout)
await removeUserSession('user-123');
```

### How it works:

1. Stores session data in Redis with configurable TTL (default: 24 hours)
2. Updates online status whenever session is accessed or created
3. Removes session and updates online status on logout

### Key format:
- User session: `user:{userId}:session`

## OAuth Provider Token Management

Stores OAuth provider tokens securely in Redis with appropriate expiration times.

```js
import { storeProviderTokens, getProviderTokens } from 'lib/redisUtils';

// Store tokens from OAuth provider
await storeProviderTokens('user-123', 'google', {
  access_token: 'abc123',
  refresh_token: 'xyz789',
  expires_at: 1644271847, // Unix timestamp in seconds
  token_type: 'Bearer'
});

// Get tokens for a provider
const tokens = await getProviderTokens('user-123', 'google');
```

### How it works:

1. Stores provider tokens as Redis hashes
2. Sets appropriate expiration based on token expiry info
3. Allows quick access to tokens for API calls without database queries

### Key format:
- Provider tokens: `user:{userId}:tokens:{provider}`

## Implementation Notes

- All functions are optimized for high performance and low latency
- Redis is used as a buffer to reduce database load for high-frequency operations
- Batch processing is implemented where appropriate
- Time-based expiration is used for temporary data 