-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Function to match posts to user embedding using cosine distance
-- Returns the top N posts that match a user's interests
CREATE OR REPLACE FUNCTION match_posts_to_user(
  user_embedding vector(384), -- User interest embedding
  match_limit int DEFAULT 1000, -- Number of results to return
  exclude_posts uuid[] DEFAULT '{}'::uuid[] -- Posts to exclude
) 
RETURNS TABLE (
  post_id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pe.post_id,
    1 - (pe.embedding <=> user_embedding) AS similarity
  FROM 
    post_embeddings pe
  JOIN
    posts p ON pe.post_id = p.id
  WHERE
    p.is_deleted = false
    AND NOT pe.post_id = ANY(exclude_posts)
  ORDER BY 
    pe.embedding <=> user_embedding
  LIMIT match_limit;
END;
$$;

-- Function to match posts to any provided embedding using cosine distance
-- Used for finding similar posts to a given embedding
CREATE OR REPLACE FUNCTION match_posts_to_embedding(
  query_embedding vector(384), -- Query embedding
  match_limit int DEFAULT 100, -- Number of results to return
  exclude_posts uuid[] DEFAULT '{}'::uuid[] -- Posts to exclude
)
RETURNS TABLE (
  post_id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pe.post_id,
    1 - (pe.embedding <=> query_embedding) AS similarity
  FROM 
    post_embeddings pe
  JOIN
    posts p ON pe.post_id = p.id
  WHERE
    p.is_deleted = false
    AND NOT pe.post_id = ANY(exclude_posts)
  ORDER BY 
    pe.embedding <=> query_embedding
  LIMIT match_limit;
END;
$$;

-- Function to find posts with similar content to a topic vector
-- Used for topic-based recommendations
CREATE OR REPLACE FUNCTION match_posts_to_topic(
  topic_embedding vector(384), -- Topic embedding
  topic_weight float DEFAULT 0.8, -- Weight for topic relevance (0-1)
  recency_weight float DEFAULT 0.2, -- Weight for recency (0-1)
  min_date timestamp DEFAULT (NOW() - INTERVAL '30 days'), -- Minimum post date
  match_limit int DEFAULT 100 -- Number of results to return
)
RETURNS TABLE (
  post_id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Input validation
  IF topic_weight + recency_weight != 1.0 THEN
    RAISE EXCEPTION 'Weights must sum to 1.0, got %', topic_weight + recency_weight;
  END IF;
  
  RETURN QUERY
  WITH ranked_posts AS (
    SELECT 
      pe.post_id,
      1 - (pe.embedding <=> topic_embedding) AS topic_similarity,
      EXTRACT(EPOCH FROM (p.created_at - min_date)) / 
        EXTRACT(EPOCH FROM (NOW() - min_date)) AS recency_score
    FROM 
      post_embeddings pe
    JOIN
      posts p ON pe.post_id = p.id
    WHERE
      p.is_deleted = false
      AND p.created_at >= min_date
  )
  SELECT
    rp.post_id,
    (rp.topic_similarity * topic_weight) + (rp.recency_score * recency_weight) AS similarity
  FROM
    ranked_posts rp
  ORDER BY
    similarity DESC
  LIMIT match_limit;
END;
$$;

-- Create vector index using HNSW for more efficient vector searches
CREATE INDEX IF NOT EXISTS post_embeddings_vector_idx 
ON post_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Index to speed up lookups by post_id
CREATE INDEX IF NOT EXISTS post_embeddings_post_id_idx 
ON post_embeddings (post_id);

-- Query statistics on embedding counts
CREATE OR REPLACE FUNCTION embedding_stats()
RETURNS TABLE (
  total_post_embeddings bigint,
  total_user_embeddings bigint,
  avg_post_embedding_creation_days numeric,
  avg_user_embedding_creation_days numeric
)
LANGUAGE sql
AS $$
SELECT
  (SELECT COUNT(*) FROM post_embeddings) AS total_post_embeddings,
  (SELECT COUNT(*) FROM user_embeddings) AS total_user_embeddings,
  (SELECT EXTRACT(DAY FROM AVG(NOW() - p.created_at)) FROM post_embeddings pe JOIN posts p ON pe.post_id = p.id) AS avg_post_embedding_creation_days,
  (SELECT EXTRACT(DAY FROM AVG(NOW() - generated_at)) FROM user_embeddings) AS avg_user_embedding_creation_days;
$$; 