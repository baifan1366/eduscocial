-- Add content_moderation table
CREATE TABLE IF NOT EXISTS content_moderation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL CHECK (content_type IN ('posts', 'comments', 'media')),
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

-- Create index on content_type and content_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_content_moderation_content ON content_moderation(content_type, content_id);

-- Create index on status for filtering moderation queues
CREATE INDEX IF NOT EXISTS idx_content_moderation_status ON content_moderation(status);

-- Add a comment explaining the table
COMMENT ON TABLE content_moderation IS 'Stores moderation status and results for user-generated content'; 