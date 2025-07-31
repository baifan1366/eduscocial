-- Add slug column to posts table
-- This migration adds a slug field for SEO-friendly URLs

-- Add slug column
ALTER TABLE posts ADD COLUMN slug TEXT;

-- Create unique index on slug for fast lookups
CREATE UNIQUE INDEX idx_posts_slug ON posts(slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_board_id ON posts(board_id);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_posts_status ON posts(status);
-- Create function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
DECLARE
    slug TEXT;
    counter INTEGER := 0;
    base_slug TEXT;
    final_slug TEXT;
BEGIN
    -- Convert title to lowercase and replace spaces/special chars with hyphens
    base_slug := lower(regexp_replace(
        regexp_replace(
            regexp_replace(title, '[^\w\s-]', '', 'g'),  -- Remove special chars except word chars, spaces, hyphens
            '\s+', '-', 'g'                              -- Replace spaces with hyphens
        ),
        '-+', '-', 'g'                                   -- Replace multiple hyphens with single hyphen
    ));
    
    -- Remove leading/trailing hyphens
    base_slug := trim(base_slug, '-');
    
    -- Limit length to 100 characters
    base_slug := left(base_slug, 100);
    
    -- Ensure uniqueness by adding counter if needed
    final_slug := base_slug;
    
    -- ✅ FIX: Add table alias to disambiguate "slug"
    WHILE EXISTS (SELECT 1 FROM posts p WHERE p.slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;


-- Update existing posts to have slugs
UPDATE posts 
SET slug = generate_slug(title) 
WHERE slug IS NULL;

-- Make slug NOT NULL after populating existing records
ALTER TABLE posts ALTER COLUMN slug SET NOT NULL;

-- Add comment
COMMENT ON COLUMN posts.slug IS 'URL-friendly slug generated from post title for SEO-friendly URLs';
