# Post Slug Migration Guide

This guide explains how to add slug functionality to your posts table for SEO-friendly URLs.

## What This Does

- Adds a `slug` column to the `posts` table
- Creates URL-friendly slugs from post titles (e.g., "My Great Post" → "my-great-post")
- Updates existing posts to have slugs
- Enables URLs like `/home/my-great-post` instead of `/home/uuid-string`

## Manual Database Migration

Since we cannot run DDL commands through the Supabase client, you need to run this SQL manually in your Supabase Dashboard:

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Create a new query

### Step 2: Run the Migration SQL

Copy and paste this SQL into the editor and run it:

```sql
-- Add slug column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index on slug for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug) WHERE slug IS NOT NULL;

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
    
    WHILE EXISTS (SELECT 1 FROM posts WHERE slug = final_slug) LOOP
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
```

### Step 3: Verify Migration

Run this query to verify the migration worked:

```sql
SELECT id, title, slug, created_at 
FROM posts 
ORDER BY created_at DESC 
LIMIT 5;
```

You should see that all posts now have slug values.

## What's Already Implemented

The following code changes have already been made:

1. **Slug Generation Utilities** (`lib/utils/slugUtils.js`)
   - Functions to generate and validate slugs
   - Handles uniqueness and special characters

2. **API Updates**
   - Post creation now generates slugs automatically
   - New endpoint `/api/posts/[id]` supports both ID and slug lookups
   - Post updates regenerate slugs if title changes

3. **Frontend Updates**
   - PostsList component now links to slug URLs
   - Post detail page accepts both IDs and slugs
   - Backward compatibility maintained

## Testing

After running the migration:

1. Create a new post - it should automatically get a slug
2. Visit `/home/your-post-slug` - it should work
3. Old UUID URLs should still work for backward compatibility

## Rollback (if needed)

If you need to rollback the migration:

```sql
-- Remove the slug column
ALTER TABLE posts DROP COLUMN IF EXISTS slug;

-- Drop the function
DROP FUNCTION IF EXISTS generate_slug(TEXT);
```

## Notes

- Existing posts will get slugs based on their titles
- Duplicate titles will get numbered suffixes (e.g., "post", "post-2", "post-3")
- The migration is safe and maintains backward compatibility
- URLs with UUIDs will continue to work alongside slug URLs
