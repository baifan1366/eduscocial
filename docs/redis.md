# Redis Configuration

This document describes the Redis configuration used in the EduSocial application.

## Overview

The application uses Upstash Redis, a serverless Redis service, for caching and other data storage needs that require high performance and low latency access.

## Configuration File

The Redis client is configured in `lib/redis.js`.

```js
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export default redis
```

## Environment Variables

The Redis client requires the following environment variables to be set:

- `UPSTASH_REDIS_REST_URL`: The REST URL for your Upstash Redis instance
- `UPSTASH_REDIS_REST_TOKEN`: The authentication token for your Upstash Redis instance

## Usage Examples

### Setting a value
```js
import redis from 'lib/redis'

await redis.set('key', 'value')
```

### Getting a value
```js
import redis from 'lib/redis'

const value = await redis.get('key')
```

### Setting a value with expiration (TTL)
```js
import redis from 'lib/redis'

// Set a value that expires in 3600 seconds (1 hour)
await redis.set('key', 'value', { ex: 3600 })
```

### Working with hashes
```js
import redis from 'lib/redis'

// Set hash fields
await redis.hset('user:1', {
  name: 'John',
  email: 'john@example.com'
})

// Get a single hash field
const name = await redis.hget('user:1', 'name')

// Get all hash fields
const userData = await redis.hgetall('user:1')
``` 