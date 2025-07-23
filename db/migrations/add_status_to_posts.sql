-- Add status column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add check constraint for status values
ALTER TABLE posts ADD CONSTRAINT status_check CHECK (status IN ('pending', 'published', 'rejected'));

-- Update existing posts to have a status based on is_draft
-- If is_draft is true, status should be 'pending'
-- If is_draft is false, status should be 'published'
UPDATE posts SET status = CASE WHEN is_draft = TRUE THEN 'pending' ELSE 'published' END WHERE status IS NULL;

-- Create an index on the status field for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status); 