# Cold-Start Recommendation System

This document describes the cold-start recommendation system implementation for EduSocial, which helps new users discover relevant content on their first visit.

## Overview

The cold-start problem refers to the challenge of providing personalized recommendations to new users who have no prior interaction history with the platform. Our solution uses a combination of:

1. Trending content recommendations for first-time users
2. Interest selection dialog for new users to express preferences
3. Redis caching for efficient content delivery
4. Personalized recommendations once user interests are established

## Implementation Components

### 1. Redis Utility Functions

Located in `lib/redis/redisUtils.js`, these functions handle:

- Caching hot/trending posts (`cacheHotPosts`, `getHotPosts`)
- Storing and retrieving trending tags (`cacheTrendingTags`, `getTrendingTags`)
- Managing user interests (`storeUserInterests`, `getUserInterests`)
- Checking if a user is new (`isNewUser`)
- Caching personalized recommendations (`cachePersonalizedRecommendations`, `getPersonalizedRecommendations`)

### 2. Recommendation Logic

Located in `lib/recommend/coldStart.js`, these functions provide:

- `getTrendingPosts`: Fetches popular posts for new users
- `getTrendingTags`: Retrieves popular tags for the interest selection dialog
- `getTopicCategories`: Gets topic categories for the interest selection dialog
- `saveUserInterests`: Persists user interests to both database and Redis
- `getPersonalizedPosts`: Generates recommendations based on user interests
- `getHomePagePosts`: Entry point that decides between trending and personalized content

### 3. Interest Selection Dialog

Located in `components/onboarding/InterestSelectionDialog.jsx`, this component:

- Presents a dialog for new users to select interests
- Shows trending tags and topic categories
- Handles saving user selections

### 4. Home Page Implementation

Located in `app/[locale]/page.js`, this component:

- Detects new users and shows the interest selection dialog
- Fetches and displays recommended posts
- Refreshes content after interest selection

## Database Schema Integration

The implementation leverages several tables from our schema:

- `posts`: Source of content for recommendations
- `hashtags` and `post_hashtags`: For tag-based recommendations
- `topics`: For categorizing content by topic
- `user_interests`: For storing user preferences
- `users`: For user identification and authentication

## Redis Data Structure

The system uses the following Redis keys:

- `hot_posts`: JSON string of trending posts (TTL: 1 hour)
- `trending_tags`: JSON string of popular tags (TTL: 6 hours)
- `user:{userId}:interests`: JSON string of user interests (persistent)
- `user:{userId}:recommended_posts`: JSON string of personalized recommendations (TTL: 15 minutes)
- `user:{userId}:session`: Hash containing session data (TTL: 24 hours)

## Cold-Start Algorithm

1. For unauthenticated users:
   - Show trending posts based on view count, likes, and recency

2. For new authenticated users:
   - Show interest selection dialog on first login
   - Initially show trending posts
   - After interest selection, personalize recommendations

3. For returning users:
   - Check Redis cache for personalized recommendations
   - If not found, generate recommendations based on interests
   - Cache results for future requests

## Performance Considerations

- Redis caching reduces database load
- Staggered cache expiration times for different data types
- Background jobs can pre-generate recommendations for active users
- Post scoring algorithm balances relevance and recency

## Future Improvements

- Implement collaborative filtering for more refined recommendations
- Add content-based filtering using post embeddings
- Incorporate user behavior analysis (click patterns, read time)
- A/B testing for recommendation algorithms
- Periodic retraining of recommendation models

## API Routes

For future API implementation:

- `GET /api/recommendations` - Get personalized recommendations
- `POST /api/interests` - Save user interests
- `GET /api/trending` - Get trending content 