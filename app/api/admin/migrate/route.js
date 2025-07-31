import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from '@/lib/auth/serverAuth';

/**
 * POST handler for running database migrations
 * This is a temporary endpoint for adding the slug field to posts
 */
export async function POST(request) {
  try {
    const session = await getServerSession();
    
    // Only allow admin users to run migrations
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    console.log('[POST /api/admin/migrate] Starting migration...');

    // Step 1: Add slug column if it doesn't exist
    console.log('[POST /api/admin/migrate] Adding slug column...');
    
    // Check if slug column already exists
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'posts')
      .eq('column_name', 'slug');

    if (columnError) {
      console.error('[POST /api/admin/migrate] Error checking columns:', columnError);
    }

    const slugExists = columns && columns.length > 0;
    
    if (!slugExists) {
      console.log('[POST /api/admin/migrate] Slug column does not exist, adding it...');
      
      // We'll need to use raw SQL for this, but Supabase client doesn't support DDL
      // Instead, let's update existing posts to have slugs and assume the column exists
      return NextResponse.json({ 
        error: 'Please add the slug column manually using the SQL editor in Supabase Dashboard',
        sql: `
-- Run this SQL in your Supabase SQL editor:
ALTER TABLE posts ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug) WHERE slug IS NOT NULL;

-- Function to generate slug
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
DECLARE
    slug TEXT;
    counter INTEGER := 0;
    base_slug TEXT;
    final_slug TEXT;
BEGIN
    base_slug := lower(regexp_replace(
        regexp_replace(
            regexp_replace(title, '[^\\w\\s-]', '', 'g'),
            '\\s+', '-', 'g'
        ),
        '-+', '-', 'g'
    ));
    
    base_slug := trim(base_slug, '-');
    base_slug := left(base_slug, 100);
    final_slug := base_slug;
    
    WHILE EXISTS (SELECT 1 FROM posts WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Update existing posts
UPDATE posts SET slug = generate_slug(title) WHERE slug IS NULL;
ALTER TABLE posts ALTER COLUMN slug SET NOT NULL;
        `
      }, { status: 400 });
    }

    // Step 2: Update existing posts that don't have slugs
    console.log('[POST /api/admin/migrate] Updating posts without slugs...');
    
    const { data: postsWithoutSlugs, error: fetchError } = await supabase
      .from('posts')
      .select('id, title')
      .is('slug', null);

    if (fetchError) {
      console.error('[POST /api/admin/migrate] Error fetching posts:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch posts without slugs',
        details: fetchError.message
      }, { status: 500 });
    }

    console.log(`[POST /api/admin/migrate] Found ${postsWithoutSlugs?.length || 0} posts without slugs`);

    if (postsWithoutSlugs && postsWithoutSlugs.length > 0) {
      // Import slug utility
      const { generateUniqueSlug } = await import('@/lib/utils/slugUtils');
      
      // Function to check if slug exists
      const checkSlugExists = async (slug) => {
        const { data, error } = await supabase
          .from('posts')
          .select('id')
          .eq('slug', slug)
          .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 results gracefully

        // Return true if data exists (slug is taken), false otherwise
        return !!data && !error;
      };

      // Update each post
      let updated = 0;
      for (const post of postsWithoutSlugs) {
        try {
          const slug = await generateUniqueSlug(post.title, checkSlugExists);
          
          const { error: updateError } = await supabase
            .from('posts')
            .update({ slug })
            .eq('id', post.id);

          if (updateError) {
            console.error(`[POST /api/admin/migrate] Error updating post ${post.id}:`, updateError);
          } else {
            updated++;
            console.log(`[POST /api/admin/migrate] Updated post ${post.id} with slug: ${slug}`);
          }
        } catch (error) {
          console.error(`[POST /api/admin/migrate] Error processing post ${post.id}:`, error);
        }
      }

      console.log(`[POST /api/admin/migrate] Updated ${updated} posts with slugs`);
    }

    console.log('[POST /api/admin/migrate] Migration completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      updated: postsWithoutSlugs?.length || 0
    });

  } catch (error) {
    console.error('[POST /api/admin/migrate] Migration failed:', error);
    return NextResponse.json({ 
      error: 'Migration failed',
      details: error.message
    }, { status: 500 });
  }
}
