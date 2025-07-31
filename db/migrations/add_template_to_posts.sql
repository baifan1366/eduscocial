-- Add template column to posts table
-- This column will store the template name or ID used for creating posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS template TEXT;

-- Create an index on the template field for better query performance when filtering by template
CREATE INDEX IF NOT EXISTS idx_posts_template ON posts(template); 