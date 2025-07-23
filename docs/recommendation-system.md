# Recommendation System

This document describes the multi-stage recommendation system implemented in our platform.

## System Architecture

Our recommendation system is built on a multi-stage architecture:

1. **User Embedding Generation**: Create user interest vectors from behavior data
2. **Recall Phase**: Efficiently retrieve candidate posts using vector similarity
3. **Ranking Phase**: Score and sort candidates for final presentation
4. **Unified Feed API**: Complete recommendation pipeline for frontend consumption

## 1. User Embedding Generation

User embeddings are vectors that represent user interests, generated from:

- User interactions (views, likes, comments, etc.)
- Weighted aggregation of post embeddings

For detailed information on user embedding generation, see [User Embedding System](./user-embedding-system.md).

## 2. Recall Phase

The recall phase is responsible for efficiently retrieving a subset of potentially relevant posts (typically 1000) from a much larger corpus (tens of thousands or more).

### Implementation

We leverage PostgreSQL's pgvector extension for efficient vector similarity search:

```sql
-- Function to match posts to user embedding using cosine distance
CREATE OR REPLACE FUNCTION match_posts_to_user(
  user_embedding vector(384),  -- User interest embedding
  match_limit int DEFAULT 1000, -- Number of results to return
  exclude_posts uuid[] DEFAULT '{}'::uuid[] -- Posts to exclude
) 
RETURNS TABLE (post_id uuid, similarity float)
```

### Key Features

1. **Cosine Similarity**: 
   - The `<=>` operator in pgvector measures cosine distance between embeddings
   - We use `1 - distance` to convert to similarity (higher is better)

2. **HNSW Index**:
   - Hierarchical Navigable Small World graph index for efficient similarity search
   - Dramatically improves query performance compared to exact search

   ```sql
   CREATE INDEX post_embeddings_vector_idx 
   ON post_embeddings 
   USING hnsw (embedding vector_cosine_ops)
   WITH (m = 16, ef_construction = 64);
   ```

3. **Caching**:
   - Recall results are cached in Redis for 2 hours to improve performance
   - Can be force refreshed with query parameters

### API Usage

```
GET /api/recommend/recall
```

Query parameters:
- `limit`: Maximum number of posts to return (default: 1000)
- `refresh`: Force refresh results (default: false)
- `cache`: Whether to cache results (default: true)
- `exclude`: Comma-separated list of post IDs to exclude

Response format:
```json
{
  "posts": [
    { "post_id": "uuid1", "similarity": 0.87 },
    { "post_id": "uuid2", "similarity": 0.82 },
    ...
  ],
  "total": 1000,
  "fromCache": false
}
```

## 3. Ranking Phase

The ranking phase takes the candidate posts from the recall phase and applies a multi-factor scoring system to sort them for presentation to users.

### Implementation

We use a rule-based ranking system that combines several factors:

```javascript
const rankingScore = 
  (similarityScore * similarityWeight) +
  (recencyScore * recencyWeight) +
  (engagementScore * engagementWeight);
```

### Ranking Factors

1. **Similarity Score** (default weight: 0.5)
   - How closely the post matches the user's interests, from vector similarity
   - Directly uses the similarity value from the recall phase

2. **Recency Score** (default weight: 0.3)
   - How fresh the content is
   - Uses exponential decay formula with 7-day half-life
   ```javascript
   Math.exp(-Math.log(2) * daysSinceCreation / decayDays);
   ```

3. **Engagement Score** (default weight: 0.2)
   - Measures popularity and quality based on interaction metrics
   - Considers likes, comments, and views with different weights
   ```javascript
   // Comments weighted 3x more than likes
   const engagementRatio = (likes + (comments * 3)) / views;
   // Log transformation for viral content
   Math.min(1, Math.log(engagementRatio + 1) / Math.log(10));
   ```

4. **Diversity Boosting** (optional)
   - Prevents too many similar posts (e.g., from the same board) from dominating
   - Applies a penalty to posts from boards that already have multiple posts in results
   ```javascript
   // Diversity penalty factor
   const diversityFactor = Math.max(0.5, 1 - (boardCount * 0.1));
   ```

5. **Personalization** (automatic)
   - Further adjusts rankings based on user's specific interaction history
   - Boosts content similar to liked/bookmarked posts
   - Penalizes content similar to disliked posts

### API Usage

```
GET /api/recommend/ranked
```

Query parameters:
- `limit`: Posts per page (default: 20)
- `page`: Page number for pagination (default: 1)
- `refresh`: Force refresh (default: false)
- `similarity_weight`: Weight for similarity factor (optional)
- `recency_weight`: Weight for recency factor (optional)
- `engagement_weight`: Weight for engagement factor (optional)
- `diversity`: Enable diversity boosting (default: true)
- `exclude`: Comma-separated list of post IDs to exclude

Response format:
```json
{
  "posts": [
    {
      "id": "uuid1",
      "title": "Post Title",
      "content": "Post content...",
      "ranking_score": 0.85,
      "ranking_factors": {
        "similarity": 0.87,
        "recency": 0.92,
        "engagement": 0.73
      }
    },
    // More posts...
  ],
  "page": 1,
  "limit": 20,
  "total": 1000,
  "hasMore": true,
  "rankingParams": {
    "similarityWeight": 0.5,
    "recencyWeight": 0.3,
    "engagementWeight": 0.2,
    "applyDiversity": true
  }
}
```

### User Preference Customization

Users can customize ranking parameters through their preferences:

```json
{
  "settings": {
    "ranking": {
      "similarityWeight": 0.4,
      "recencyWeight": 0.4,
      "engagementWeight": 0.2,
      "applyDiversity": true
    }
  }
}
```

## 4. Unified Feed API

The unified feed API combines both recall and ranking phases into a single, easy-to-use endpoint that powers the main content feed for users.

### Implementation

This API handles the complete pipeline:

1. Authentication and user identification
2. Recall phase with vector similarity search
3. Ranking with multi-factor scoring
4. Pagination and filtering
5. Smart caching at multiple levels
6. Analytics tracking

### API Usage

```
GET /api/recommend/feed
```

Query parameters:
- `limit`: Posts per page (default: 20)
- `page`: Page number for pagination (default: 1)
- `refresh`: Force refresh (default: false)
- `skip_cache`: Bypass cache completely (default: false)
- `board`: Filter by specific board ID (optional)
- `similarity_weight`: Weight for similarity factor (optional)
- `recency_weight`: Weight for recency factor (optional)
- `engagement_weight`: Weight for engagement factor (optional)
- `diversity`: Enable diversity boosting (default: true)
- `exclude`: Comma-separated list of post IDs to exclude

Response format:
```json
{
  "posts": [
    {
      "id": "uuid1",
      "title": "Post Title",
      "content": "Post content...",
      "author_id": "user123",
      "board_id": "board456",
      "created_at": "2023-06-15T10:30:00Z",
      "like_count": 42,
      "comment_count": 7,
      "view_count": 350,
      "ranking_score": 0.85,
      "ranking_factors": {
        "similarity": 0.87,
        "recency": 0.92,
        "engagement": 0.73
      }
    },
    // More posts...
  ],
  "page": 1,
  "limit": 20,
  "total": 1000,
  "hasMore": true,
  "fromCache": false,
  "rankingParams": {
    "similarityWeight": 0.5,
    "recencyWeight": 0.3,
    "engagementWeight": 0.2,
    "applyDiversity": true
  }
}
```

### React Integration

For easy frontend integration, use the `useRecommendationFeed` hook:

```jsx
import useRecommendationFeed from '@/hooks/useRecommendationFeed';

function Feed() {
  const {
    posts,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useRecommendationFeed({
    limit: 10,
    board: 'general'  // Optional board filter
  });

  if (isLoading) return <Loading />;
  if (isError) return <Error />;

  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
      
      {hasNextPage && (
        <button 
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Loading more...' : 'Load more'}
        </button>
      )}
    </div>
  );
}
```

The hook provides:
- Automatic pagination with infinite scrolling
- Post deduplication across pages
- Caching and background refetching
- Simple refresh and manual control methods

## Performance Considerations

### Vector Search Optimization

- HNSW index parameters (`m=16, ef_construction=64`) balance search speed and recall quality
- PostgreSQL function-based queries to minimize data transfer
- Strategic caching of results to reduce database load

### Ranking Efficiency

- Multi-level caching strategy:
  - Cache recall results (2 hours)
  - Cache ranked results (30 minutes)
  - Cache feed results (20 minutes)
- Batch fetching of post metadata
- Optimized scoring calculations

### Scaling Considerations

As the system scales:

1. Consider upgrading to specialized vector database solutions (e.g., Pinecone, Milvus) for larger datasets
2. Implement background pre-computation of common searches
3. Add more advanced filtering in the database layer to reduce post-processing

## Testing and Evaluation

To evaluate recommendation quality:

1. Measure relevance of recalled posts (using separate test set)
2. Compare with random or chronological baselines
3. Monitor user engagement metrics with recommended content
4. A/B test different ranking weights and algorithms 