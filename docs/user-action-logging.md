# User Action Logging System

## Overview

The user action logging system is designed to track user behaviors and actions throughout the application with minimal performance impact on user experience. It uses a buffered approach where actions are first written to Redis and then asynchronously batched into the database.

## Architecture

1. **Redis Buffer Queue**: User actions are first written to a Redis List
2. **QStash Worker**: A scheduled worker runs every 5 seconds to process buffered actions
3. **Batch Database Writes**: Actions are inserted into the database in batches of 100

## Benefits

- **Performance**: User requests return immediately without waiting for database writes
- **Reliability**: Failed database writes are re-queued in Redis
- **Scalability**: The system can handle high volumes of user actions
- **Efficiency**: Batched database writes reduce database load

## How to Use

### Tracking User Actions

```js
import { trackUserAction } from '@/lib/utils';

// Simple action tracking
await trackUserAction(user.id, 'view_post', {
  targetTable: 'posts',
  targetId: postId
});

// Tracking with additional metadata
await trackUserAction(user.id, 'like_post', {
  targetTable: 'posts',
  targetId: postId,
  metadata: {
    referrer: 'home_feed',
    deviceType: 'mobile'
  }
});

// Tracking changes (before/after)
await trackUserAction(user.id, 'update_profile', {
  targetTable: 'user_profiles',
  targetId: profileId,
  oldData: oldProfileData,
  newData: newProfileData
});
```

### Database Schema

The system uses the existing `action_log` table:

```sql
CREATE TABLE action_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,            
  target_table TEXT,             
  target_id UUID,                 
  old_data JSONB,                 
  new_data JSONB,                
  metadata JSONB,               
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Common Action Types

- **View Actions**: `view_post`, `view_profile`, `view_board`
- **Engagement Actions**: `like_post`, `comment_post`, `share_post`
- **Account Actions**: `login`, `logout`, `update_profile`, `change_password`
- **Content Actions**: `create_post`, `edit_post`, `delete_post`, `upload_media`
- **Social Actions**: `follow_user`, `unfollow_user`, `block_user`
- **Moderation Actions**: `content_moderated`, `post_flagged`, `post_removed`, `content_approved`

## Implementation Details

### 1. Buffer to Redis

Actions are buffered to Redis using `bufferUserAction` in `lib/redis/redisUtils.js`:

```js
await redis.lpush('pending_user_actions', JSON.stringify(actionData));
```

### 2. Process with QStash

QStash triggers the processing endpoint every 5 seconds:

```js
// in lib/qstash.js
await qstashClient.schedules.create({
  destination: `${baseUrl}/api/actions/batch-process`,
  interval: `5s`,
});
```

### 3. Batch Database Writes

Actions are batched and written to the database:

```js
// in processPendingUserActions function
const { error } = await supabase
  .from('action_log')
  .insert(actions);
```

## Monitoring and Maintenance

- Initialization endpoint: `GET /api/init`
- Batch processing logs provide counts of processed actions
- Redis list `pending_user_actions` contains the backlog of actions

## Error Handling

- Failed database writes are re-queued in Redis
- Redis write failures are logged but don't disrupt the user experience
- QStash validation ensures only authorized systems can trigger batch processing 

## Content Moderation Logging

The system includes specialized logging for content moderation activities.

### Moderation Audit Log Schema

```sql
CREATE TABLE moderation_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL,         -- 'post', 'comment', 'media'
  content_id UUID NOT NULL,           -- ID of the content
  moderation_type TEXT NOT NULL,      -- 'text', 'video', 'image', 'audio'
  model_name TEXT NOT NULL,           -- Name of moderation model/service used
  result_status TEXT NOT NULL,        -- 'flagged', 'safe', 'manual_review'
  flagged_categories JSONB,           -- Categories flagged by moderation
  confidence_scores JSONB,            -- Confidence scores for each category
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Content Moderation Flow

1. **Queueing**: When content is created or updated, moderation jobs are queued via QStash
   ```js
   await queueContentModeration(postId, content, title, userId, media);
   ```

2. **Asynchronous Processing**: Moderation happens asynchronously after content creation
   ```js
   // Moderation endpoints are triggered via QStash
   // /api/audit/text/route.js - For text moderation
   // /api/audit/video/route.js - For video moderation
   ```

3. **API Integration**: External moderation services are called
   ```js
   // Text moderation
   const response = await fetch('https://text-moderation-server.onrender.com/text-moderate', {...});
   
   // Video moderation
   const response = await fetch('https://video-moderation-server.onrender.com/video-moderation', {...});
   ```

4. **Logging Results**: Results are logged to moderation_audit_log
   ```js
   await logModerationAudit(
     'post', 
     postId, 
     'text', 
     moderationResult.model,
     moderationResult.isFlagged ? 'flagged' : 'safe',
     moderationResult.categories,
     moderationResult.scores
   );
   ```

5. **Content Action**: Based on moderation results, content may be flagged or removed
   ```js
   if (moderationResult.isFlagged) {
     await takeDownPost(postId, userId, moderationResult.reason);
   }
   ```

### Monitoring Moderation

- Dashboard for admins available at `/admin/dashboard`
- Flagged content review queue at `/admin/review`
- Moderation statistics tracked in `post_visibility_log` table 

## Post Draft System

### Overview

The post draft system allows users to save and retrieve draft posts. The system automatically saves drafts while users are typing and provides a manual save option.

### API Endpoints

#### GET `/api/posts/draft`

Retrieves the latest draft post for the authenticated user based on type.

**Query Parameters:**
- `type` (optional): The type of post to retrieve drafts for (default: 'article')

**Response:**
- Status 200: Returns the latest draft post
- Status 404: No draft found
- Status 401: Unauthorized

#### POST `/api/posts/draft`

Saves a draft post for the authenticated user.

**Request Body:**
```json
{
  "title": "Draft post title",
  "content": "Draft post content",
  "type": "article",
  "template": "学习讨论"
}
```

**Response:**
- Status 200: Draft saved successfully
- Status 401: Unauthorized

### Client Implementation

The system implements:
1. Auto-save functionality that saves drafts at regular intervals
2. Manual save via the "Save Draft" button
3. Automatic loading of the most recent draft when opening the post editor
4. Visual indicator showing when drafts were last saved

### Benefits

- Prevents loss of user content in case of browser crashes or connectivity issues
- Allows users to continue working on posts across multiple sessions
- Provides a better user experience with auto-save functionality 