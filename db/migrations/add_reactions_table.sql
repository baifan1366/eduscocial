-- Add reactions table for emoji reactions on posts and comments
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL, -- Store emoji unicode or name (e.g., '👍', '❤️', '😂', etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Ensure user can only have one reaction per post/comment with same emoji
  CONSTRAINT unique_user_post_emoji UNIQUE (user_id, post_id, emoji),
  CONSTRAINT unique_user_comment_emoji UNIQUE (user_id, comment_id, emoji),
  
  -- Ensure reaction is either for post or comment, not both
  CONSTRAINT reaction_target_check CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_comment_id ON reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_emoji ON reactions(emoji);

-- Add reaction counts to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS reaction_counts JSONB DEFAULT '{}';

-- Add reaction counts to comments table  
ALTER TABLE comments ADD COLUMN IF NOT EXISTS reaction_counts JSONB DEFAULT '{}';

-- Create function to update reaction counts
CREATE OR REPLACE FUNCTION update_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update post reaction counts
    IF NEW.post_id IS NOT NULL THEN
      UPDATE posts 
      SET reaction_counts = COALESCE(reaction_counts, '{}'::jsonb) || 
          jsonb_build_object(
            NEW.emoji, 
            COALESCE((reaction_counts->NEW.emoji)::int, 0) + 1
          )
      WHERE id = NEW.post_id;
    END IF;
    
    -- Update comment reaction counts
    IF NEW.comment_id IS NOT NULL THEN
      UPDATE comments 
      SET reaction_counts = COALESCE(reaction_counts, '{}'::jsonb) || 
          jsonb_build_object(
            NEW.emoji, 
            COALESCE((reaction_counts->NEW.emoji)::int, 0) + 1
          )
      WHERE id = NEW.comment_id;
    END IF;
    
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    -- Update post reaction counts
    IF OLD.post_id IS NOT NULL THEN
      UPDATE posts 
      SET reaction_counts = CASE 
        WHEN (reaction_counts->OLD.emoji)::int <= 1 THEN 
          reaction_counts - OLD.emoji
        ELSE 
          reaction_counts || jsonb_build_object(
            OLD.emoji, 
            (reaction_counts->OLD.emoji)::int - 1
          )
      END
      WHERE id = OLD.post_id;
    END IF;
    
    -- Update comment reaction counts
    IF OLD.comment_id IS NOT NULL THEN
      UPDATE comments 
      SET reaction_counts = CASE 
        WHEN (reaction_counts->OLD.emoji)::int <= 1 THEN 
          reaction_counts - OLD.emoji
        ELSE 
          reaction_counts || jsonb_build_object(
            OLD.emoji, 
            (reaction_counts->OLD.emoji)::int - 1
          )
      END
      WHERE id = OLD.comment_id;
    END IF;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update reaction counts
DROP TRIGGER IF EXISTS trigger_update_reaction_counts ON reactions;
CREATE TRIGGER trigger_update_reaction_counts
  AFTER INSERT OR DELETE ON reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_reaction_counts();
