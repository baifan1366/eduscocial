# Content Moderation System

## Overview

The content moderation system is designed to automatically review and filter user-generated content for compliance with platform guidelines. It supports moderation of different content types (posts, comments, media) and uses a combination of automated AI checks and human review.

## Database Schema

The system is built around the `content_moderation` table:

```sql
CREATE TABLE content_moderation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'media')),
  content_id UUID NOT NULL,
  moderation_type TEXT NOT NULL CHECK (moderation_type IN ('text', 'image', 'video', 'audio')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  rejection_reason TEXT,
  flagged_categories TEXT[],
  confidence_scores JSONB,
  moderator_id UUID REFERENCES users(id),
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);
```

### Key Fields

- **content_type**: Specifies what type of content is being moderated ('post', 'comment', 'media')
- **content_id**: The UUID reference to the specific content being moderated
- **moderation_type**: The type of moderation being performed ('text', 'image', 'video', 'audio')
- **status**: Current moderation status ('pending', 'approved', 'rejected', 'flagged')
- **flagged_categories**: Array of specific policy violations detected (e.g., ['hate_speech', 'violence'])
- **confidence_scores**: JSON object containing confidence scores from AI moderation tools
- **moderator_id**: Reference to human moderator who reviewed the content (if applicable)

## Moderation Flow

1. **Content Creation**: When new content is created, it starts in 'pending' state
2. **Automated Review**: Content is automatically reviewed by AI moderation tools
3. **Initial Decision**:
   - Safe content → Automatically approved
   - Clearly violating content → Automatically rejected
   - Borderline content → Flagged for human review
4. **Human Review** (if needed): Human moderators review flagged content and make final decisions
5. **Logging**: All moderation actions are recorded in the `moderation_audit_log` table

## API Integration

### Moderation API Endpoints

- `POST /api/audit/text/moderate`: Moderates text content
- `POST /api/audit/video/moderate`: Moderates video content

### Moderation Response Format

```json
{
  "id": "content-uuid",
  "isFlagged": true|false,
  "status": "pending|approved|rejected|flagged",
  "categories": ["hate_speech", "violence", ...],
  "scores": {
    "hate_speech": 0.12,
    "violence": 0.03,
    ...
  }
}
```

## Implementation Guide

### Creating a Moderation Record

```javascript
// Example code
const { data, error } = await supabase
  .from('content_moderation')
  .insert({
    content_type: 'post',
    content_id: postId,
    moderation_type: 'text',
    status: 'pending',
    created_by: userId
  });
```

### Updating Moderation Status

```javascript
const { data, error } = await supabase
  .from('content_moderation')
  .update({
    status: 'approved',
    moderator_id: moderatorId,
    moderated_at: new Date().toISOString()
  })
  .eq('content_id', contentId)
  .eq('content_type', contentType);
```

## Best Practices

1. Always create moderation records for all user-generated content
2. Set appropriate default visibility based on user trust levels
3. Implement appropriate feedback mechanisms for false positives
4. Regularly audit moderation decisions for consistency and fairness
5. Use the `moderation_audit_log` to track all automated and human decisions 