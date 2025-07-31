'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MigrateClient() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const runMigration = async () => {
    setIsRunning(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/admin/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Migration failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="bg-[#132F4C] border-[#1E3A5F]">
        <CardHeader>
          <CardTitle className="text-white">Database Migration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300">
            This will add slug fields to existing posts and generate slugs based on post titles.
          </p>

          <Button 
            onClick={runMigration} 
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRunning ? 'Running Migration...' : 'Run Slug Migration'}
          </Button>

          {result && (
            <div className="bg-green-900/20 border border-green-500 rounded p-4">
              <h3 className="text-green-400 font-semibold mb-2">Migration Successful!</h3>
              <pre className="text-green-300 text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded p-4">
              <h3 className="text-red-400 font-semibold mb-2">Migration Failed</h3>
              <p className="text-red-300">{error}</p>
              {error.includes('Please add the slug column manually') && (
                <div className="mt-4">
                  <h4 className="text-red-400 font-semibold mb-2">Run this SQL in Supabase Dashboard:</h4>
                  <pre className="text-red-300 text-xs bg-red-900/10 p-2 rounded overflow-x-auto">
{`-- Add slug column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index on slug for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug) WHERE slug IS NOT NULL;

-- Function to generate slug from title
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
            regexp_replace(title, '[^\\\\w\\\\s-]', '', 'g'),
            '\\\\s+', '-', 'g'
        ),
        '-+', '-', 'g'
    ));
    
    base_slug := trim(base_slug, '-');
    base_slug := left(base_slug, 100);
    final_slug := base_slug;
    
    WHILE EXISTS (SELECT 1 FROM posts p WHERE p.slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Update existing posts to have slugs
UPDATE posts SET slug = generate_slug(title) WHERE slug IS NULL;

-- Make slug NOT NULL after populating existing records
ALTER TABLE posts ALTER COLUMN slug SET NOT NULL;`}
                  </pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
