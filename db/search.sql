-- Drop existing config if exists
DROP TEXT SEARCH CONFIGURATION IF EXISTS public.chinese_english;

-- Create full-text search configuration
-- Use Chinese and English configuration for mixed language search
CREATE TEXT SEARCH CONFIGURATION public.chinese_english (COPY = pg_catalog.simple);

-- Add full-text search fields to core tables
-- Posts search vector
ALTER TABLE posts ADD COLUMN search_vector tsvector;
CREATE INDEX idx_posts_search_vector ON posts USING gin(search_vector);

-- Create trigger function to update post search vector
CREATE OR REPLACE FUNCTION posts_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('public.chinese_english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('public.chinese_english', COALESCE(NEW.content, '')), 'B');
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_posts_search_vector_update
BEFORE INSERT OR UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION posts_search_vector_update();

-- Comments search vector
ALTER TABLE comments ADD COLUMN search_vector tsvector;
CREATE INDEX idx_comments_search_vector ON comments USING gin(search_vector);

-- Create trigger function to update comment search vector
CREATE OR REPLACE FUNCTION comments_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := to_tsvector('public.chinese_english', COALESCE(NEW.content, ''));
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_comments_search_vector_update
BEFORE INSERT OR UPDATE ON comments
FOR EACH ROW EXECUTE FUNCTION comments_search_vector_update();

-- Users search vector
ALTER TABLE users ADD COLUMN search_vector tsvector;
CREATE INDEX idx_users_search_vector ON users USING gin(search_vector);

-- Create trigger function to update user search vector
CREATE OR REPLACE FUNCTION users_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('public.chinese_english', COALESCE(NEW.username, '')), 'A') ||
        setweight(to_tsvector('public.chinese_english', COALESCE(NEW.email, '')), 'B');
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_users_search_vector_update
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION users_search_vector_update();

-- User profiles search vector
ALTER TABLE user_profiles ADD COLUMN search_vector tsvector;
CREATE INDEX idx_user_profiles_search_vector ON user_profiles USING gin(search_vector);

-- Create trigger function to update user profile search vector
CREATE OR REPLACE FUNCTION user_profiles_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('public.chinese_english', COALESCE(NEW.bio, '')), 'B') ||
        setweight(to_tsvector('public.chinese_english', COALESCE(NEW.university, '')), 'C') ||
        setweight(to_tsvector('public.chinese_english', COALESCE(NEW.favorite_country, '')), 'C') ||
        setweight(to_tsvector('public.chinese_english', COALESCE(NEW.favorite_quotes, '')), 'D') ||
        setweight(to_tsvector('public.chinese_english', COALESCE(NEW.interests, '')), 'B') ||
        setweight(to_tsvector('public.chinese_english', COALESCE(NEW.leisure_activities, '')), 'C');
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_user_profiles_search_vector_update
BEFORE INSERT OR UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION user_profiles_search_vector_update();

-- Boards search vector
ALTER TABLE boards ADD COLUMN search_vector tsvector;
CREATE INDEX idx_boards_search_vector ON boards USING gin(search_vector);

-- Create trigger function to update board search vector
CREATE OR REPLACE FUNCTION boards_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('public.chinese_english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('public.chinese_english', COALESCE(NEW.description, '')), 'B');
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_boards_search_vector_update
BEFORE INSERT OR UPDATE ON boards
FOR EACH ROW EXECUTE FUNCTION boards_search_vector_update();

-- Create unified search function
CREATE OR REPLACE FUNCTION search_all(query_text TEXT)
RETURNS TABLE (
    object_type TEXT,
    object_id UUID,
    title TEXT,
    snippet TEXT,
    created_at TIMESTAMPTZ,
    rank FLOAT
) AS $$
BEGIN
    -- Search posts
    RETURN QUERY
    SELECT 'post' AS object_type,
           p.id AS object_id,
           p.title,
           ts_headline('public.chinese_english', p.content, to_tsquery('public.chinese_english', query_text), 'MaxFragments=2,FragmentDelimiter=" ... "') AS snippet,
           p.created_at,
           ts_rank(p.search_vector, to_tsquery('public.chinese_english', query_text)) AS rank
    FROM posts p
    WHERE p.search_vector @@ to_tsquery('public.chinese_english', query_text)
      AND p.is_deleted = FALSE
    
    UNION ALL
    
    -- Search comments
    SELECT 'comment' AS object_type,
           c.id AS object_id,
           (SELECT p.title FROM posts p WHERE p.id = c.post_id) AS title,
           ts_headline('public.chinese_english', c.content, to_tsquery('public.chinese_english', query_text), 'MaxFragments=2,FragmentDelimiter=" ... "') AS snippet,
           c.created_at,
           ts_rank(c.search_vector, to_tsquery('public.chinese_english', query_text)) AS rank
    FROM comments c
    WHERE c.search_vector @@ to_tsquery('public.chinese_english', query_text)
      AND c.is_deleted = FALSE
    
    UNION ALL
    
    -- Search users
    SELECT 'user' AS object_type,
           u.id AS object_id,
           COALESCE(u.username) AS title,
           COALESCE(up.bio, '') AS snippet,
           u.created_at,
           ts_rank(u.search_vector, to_tsquery('public.chinese_english', query_text)) + 
           COALESCE(ts_rank(up.search_vector, to_tsquery('public.chinese_english', query_text)), 0) AS rank
    FROM users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    WHERE (u.search_vector @@ to_tsquery('public.chinese_english', query_text) OR
           up.search_vector @@ to_tsquery('public.chinese_english', query_text))
      AND u.is_active = TRUE
    
    UNION ALL
    
    -- Search boards
    SELECT 'board' AS object_type,
           b.id AS object_id,
           b.name AS title,
           COALESCE(b.description, '') AS snippet,
           b.created_at,
           ts_rank(b.search_vector, to_tsquery('public.chinese_english', query_text)) AS rank
    FROM boards b
    WHERE b.search_vector @@ to_tsquery('public.chinese_english', query_text)
      AND b.is_active = TRUE
    
    ORDER BY rank DESC, created_at DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;
