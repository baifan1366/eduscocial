# User Embedding System

This document describes the user embedding system implemented in our platform, which generates user interest vectors based on user interactions with posts.

## Overview

The user embedding system analyzes user behavior (views, likes, comments, etc.) and converts these behaviors into a numerical representation of user interests. This representation is stored as a vector in the `user_embeddings` table and Redis for quick access.

## How It Works

### Data Collection

User interactions are continuously tracked in the `action_log` table. These include:

- Post views (`view_post`)
- Likes (`like_post`)
- Comments (`comment_post`)
- Bookmarks (`bookmark_post`) 
- Shares (`share_post`)

### Process Flow

1. **Action Logging**: User actions are recorded in real-time in the `action_log` table
2. **Batch Processing**: On a regular schedule (every 2 hours), the system:
   - Identifies users with recent activity
   - Retrieves their interactions from the action log
   - Fetches embeddings for posts they interacted with
   - Weights these embeddings based on interaction type
   - Aggregates them into a user embedding

3. **Storage**:
   - Primary storage: `user_embeddings` table in the database
   - Fast access cache: Redis (with 7-day expiration)

### Weighting System

Different interactions have different weights to reflect their importance:

| Interaction | Weight |
|-------------|--------|
| View        | 1      |
| Like        | 5      |
| Comment     | 8      |
| Bookmark    | 7      |
| Share       | 10     |

## Technical Implementation

### Core Functions

- `generateUserInterestEmbedding`: Generates embedding for a single user
- `processBatchUserEmbeddings`: Processes embeddings for multiple users
- `findUsersForEmbeddingUpdate`: Identifies which users need updates

### Scheduled Processing

The system uses QStash to schedule batch processing:

```javascript
// Schedule every 2 hours
await scheduleUserEmbeddingGeneration('0 */2 * * *');
```

## Data Storage

### Database Schema

User embeddings are stored in the `user_embeddings` table:

```sql
CREATE TABLE user_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  embedding vector(384), -- 384-dimensional embedding vector
  model_version TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(user_id)
);
```

### Redis Storage

For fast access, embeddings are also cached in Redis:

- Key pattern: `user:{userId}:embedding`
- Value: JSON-stringified embedding vector
- TTL: 7 days

## Using User Embeddings

### For Recommendations

User embeddings can be used for content recommendations by:

1. Calculating similarity between user embeddings and post embeddings
2. Finding posts with high similarity to a user's interests
3. Filtering and ranking these posts for personalized feeds

Example usage:

```javascript
import { calculateSimilarity } from '@/lib/embedding';

// Calculate similarity between user and post embedding
const similarity = calculateSimilarity(userEmbedding, postEmbedding);
// Higher similarity (closer to 1) means better match
```

### For User Similarity

You can also use embeddings to find similar users:

```javascript
// Find similarity between two users
const userSimilarity = calculateSimilarity(userEmbedding1, userEmbedding2);
```

## Testing

### Manual Testing

You can manually trigger the embedding generation for testing:

1. In development mode, use the GET endpoint:
   ```
   GET /api/actions/batch-process
   ```

2. Check the response for details about processed users.

### Monitoring

Monitor the system with:

- Log outputs from batch processing
- Checking the `user_embeddings` table for up-to-date entries
- Redis monitoring for cache hits/misses

## Edge Cases and Error Handling

- **New users**: Won't have embeddings until they have sufficient interactions
- **Inactive users**: Embeddings may become outdated but won't be regenerated
- **Error recovery**: Failed embedding generations won't affect other users

## Future Improvements

- Support for time decay (recent interactions are more important)
- Topic-specific embeddings for more nuanced interests
- A/B testing different weighting schemes
- Incorporating negative signals (dislikes, content hiding) 