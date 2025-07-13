-- Timestamp auto update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Timestamp triggers (on various tables)
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON boards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_votes_updated_at BEFORE UPDATE ON votes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_favorites_updated_at BEFORE UPDATE ON favorites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_followers_updated_at BEFORE UPDATE ON followers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_post_media_updated_at BEFORE UPDATE ON post_media FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hashtags_updated_at BEFORE UPDATE ON hashtags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_post_hashtags_updated_at BEFORE UPDATE ON post_hashtags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comment counter trigger
CREATE OR REPLACE FUNCTION update_post_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.post_id IS NOT NULL THEN
        UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' AND OLD.post_id IS NOT NULL THEN
        UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_post_comment_count AFTER INSERT OR DELETE ON comments FOR EACH ROW EXECUTE FUNCTION update_post_counters();

-- Vote counter trigger
CREATE OR REPLACE FUNCTION update_vote_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.post_id IS NOT NULL THEN
            IF NEW.vote_type = 'like' THEN
                UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
            ELSIF NEW.vote_type = 'dislike' THEN
                UPDATE posts SET dislike_count = dislike_count + 1 WHERE id = NEW.post_id;
            END IF;
        ELSIF NEW.comment_id IS NOT NULL THEN
            IF NEW.vote_type = 'like' THEN
                UPDATE comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
            ELSIF NEW.vote_type = 'dislike' THEN
                UPDATE comments SET dislike_count = dislike_count + 1 WHERE id = NEW.comment_id;
            END IF;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.post_id IS NOT NULL THEN
            IF OLD.vote_type = 'like' THEN
                UPDATE posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
            ELSIF OLD.vote_type = 'dislike' THEN
                UPDATE posts SET dislike_count = dislike_count - 1 WHERE id = OLD.post_id;
            END IF;
        ELSIF OLD.comment_id IS NOT NULL THEN
            IF OLD.vote_type = 'like' THEN
                UPDATE comments SET like_count = like_count - 1 WHERE id = OLD.comment_id;
            ELSIF OLD.vote_type = 'dislike' THEN
                UPDATE comments SET dislike_count = dislike_count - 1 WHERE id = OLD.comment_id;
            END IF;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vote_counts AFTER INSERT OR DELETE ON votes FOR EACH ROW EXECUTE FUNCTION update_vote_counters();

-- Hashtag usage count
CREATE OR REPLACE FUNCTION update_hashtag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE hashtags SET usage_count = usage_count + 1 WHERE id = NEW.hashtag_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE hashtags SET usage_count = usage_count - 1 WHERE id = OLD.hashtag_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hashtag_count AFTER INSERT OR DELETE ON post_hashtags FOR EACH ROW EXECUTE FUNCTION update_hashtag_usage_count();

-- Anonymous avatar assignment
CREATE OR REPLACE FUNCTION assign_anonymous_avatar()
RETURNS TRIGGER AS $$
DECLARE
    available_avatar_id UUID;
    is_premium_user BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM subscriptions 
        WHERE user_id = NEW.author_id 
        AND status = 'active' 
        AND end_at > NOW()
    ) INTO is_premium_user;

    IF NEW.is_anonymous = TRUE THEN
        IF is_premium_user THEN
            SELECT id INTO available_avatar_id FROM anonymous_avatars ORDER BY RANDOM() LIMIT 1;
        ELSE
            SELECT id INTO available_avatar_id FROM anonymous_avatars WHERE is_premium_only = FALSE ORDER BY RANDOM() LIMIT 1;
        END IF;

        INSERT INTO anonymous_avatar_assignments (
            user_id, target_type, target_id, avatar_id, assigned_at, created_by
        ) VALUES (
            NEW.author_id, TG_TABLE_NAME, NEW.id, available_avatar_id, NOW(), NEW.created_by
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assign_anonymous_avatar_to_post AFTER INSERT ON posts FOR EACH ROW WHEN (NEW.is_anonymous = TRUE) EXECUTE FUNCTION assign_anonymous_avatar();
CREATE TRIGGER assign_anonymous_avatar_to_comment AFTER INSERT ON comments FOR EACH ROW WHEN (NEW.is_anonymous = TRUE) EXECUTE FUNCTION assign_anonymous_avatar();

-- New user setup
CREATE OR REPLACE FUNCTION setup_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_preferences (user_id, created_by) VALUES (NEW.id, NEW.id);
    INSERT INTO user_wall_settings (user_id, created_by) VALUES (NEW.id, NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_user_insert AFTER INSERT ON users FOR EACH ROW EXECUTE FUNCTION setup_new_user();

-- Match accepted → create chat room
CREATE OR REPLACE FUNCTION create_match_chat_room()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.accepted_a = TRUE AND NEW.accepted_b = TRUE AND (OLD.accepted_a = FALSE OR OLD.accepted_b = FALSE) THEN
        INSERT INTO chat_rooms (name, room_type, match_id, created_by)
        VALUES ('Match Chat - ' || NOW()::date, 'match', NEW.id, NEW.created_by);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_chat_room_after_match_accepted AFTER UPDATE ON daily_matches FOR EACH ROW EXECUTE FUNCTION create_match_chat_room();

-- Add participants to match chat
CREATE OR REPLACE FUNCTION add_chat_participants()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.room_type = 'match' AND NEW.match_id IS NOT NULL THEN
        INSERT INTO chat_participants (chat_room_id, user_id, is_admin)
        SELECT NEW.id, user_a, TRUE FROM daily_matches WHERE id = NEW.match_id;
        INSERT INTO chat_participants (chat_room_id, user_id, is_admin)
        SELECT NEW.id, user_b, TRUE FROM daily_matches WHERE id = NEW.match_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER add_participants_after_chat_room_created AFTER INSERT ON chat_rooms FOR EACH ROW WHEN (NEW.room_type = 'match') EXECUTE FUNCTION add_chat_participants();

-- Chat message read status
CREATE OR REPLACE FUNCTION update_message_read_status()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_participants SET last_read_at = NOW() WHERE chat_room_id = NEW.chat_room_id AND user_id = NEW.sender_id;
    NEW.read_by = ARRAY[NEW.sender_id];
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_message_read_status BEFORE INSERT ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_message_read_status();

-- Auto create system notifications
CREATE OR REPLACE FUNCTION create_notification_on_vote()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.vote_type = 'like' THEN
    IF NEW.post_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, post_id, triggered_by, created_by)
      SELECT author_id, 'like', 'Your post has been liked', NEW.post_id, NEW.user_id, NEW.user_id
      FROM posts WHERE id = NEW.post_id;
    ELSIF NEW.comment_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, comment_id, triggered_by, created_by)
      SELECT author_id, 'like', 'Your comment has been liked', NEW.comment_id, NEW.user_id, NEW.user_id
      FROM comments WHERE id = NEW.comment_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_on_vote AFTER INSERT ON votes FOR EACH ROW EXECUTE FUNCTION create_notification_on_vote();

-- Content Moderation Trigger on New Post/Comment
CREATE OR REPLACE FUNCTION trigger_content_moderation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO content_moderation (content_type, content_id, moderation_type, status, created_at, created_by)
  VALUES (
    TG_TABLE_NAME,
    NEW.id,
    'text',
    'pending',
    NOW(),
    NEW.created_by
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER moderate_post_content AFTER INSERT ON posts FOR EACH ROW EXECUTE FUNCTION trigger_content_moderation();
CREATE TRIGGER moderate_comment_content AFTER INSERT ON comments FOR EACH ROW EXECUTE FUNCTION trigger_content_moderation();

-- Track Order/Subscription Status
CREATE OR REPLACE FUNCTION track_order_status()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO action_log (user_id, action, target_table, target_id, old_data, new_data, occurred_at)
  VALUES (NEW.user_id, 'order_status_change', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_store_order_change AFTER UPDATE ON store_orders FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status) EXECUTE FUNCTION track_order_status();

CREATE TRIGGER audit_subscription_change AFTER UPDATE ON subscriptions FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status) EXECUTE FUNCTION track_order_status();

-- Action Logging for All Changes
CREATE OR REPLACE FUNCTION generic_action_logger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO action_log (user_id, action, target_table, target_id, old_data, new_data, occurred_at)
  VALUES (NEW.created_by, TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_post_changes AFTER INSERT OR UPDATE OR DELETE ON posts FOR EACH ROW EXECUTE FUNCTION generic_action_logger();

-- Set matched date
CREATE OR REPLACE FUNCTION set_matched_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.matched_date := date_trunc('day', NEW.matched_at)::DATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_matched_date
BEFORE INSERT OR UPDATE ON daily_matches
FOR EACH ROW
EXECUTE FUNCTION set_matched_date();

-- Function to trigger cache invalidation
CREATE OR REPLACE FUNCTION trigger_cache_invalidation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO cache_invalidation_queue (object_type, object_id, operation)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to relevant tables
CREATE TRIGGER cache_invalidation_posts AFTER INSERT OR UPDATE OR DELETE ON posts FOR EACH ROW EXECUTE FUNCTION trigger_cache_invalidation();
CREATE TRIGGER cache_invalidation_comments AFTER INSERT OR UPDATE OR DELETE ON comments FOR EACH ROW EXECUTE FUNCTION trigger_cache_invalidation();
CREATE TRIGGER cache_invalidation_boards AFTER INSERT OR UPDATE OR DELETE ON boards FOR EACH ROW EXECUTE FUNCTION trigger_cache_invalidation();

-- Content Versioning Trigger
CREATE OR REPLACE FUNCTION track_content_versions()
RETURNS TRIGGER AS $$
DECLARE
    next_version INTEGER;
BEGIN
    -- Get the next version number
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version 
    FROM content_versions 
    WHERE content_type = TG_TABLE_NAME AND content_id = NEW.id;
    
    -- Insert the new version
    INSERT INTO content_versions (
        content_type, content_id, version_number, content, edited_by, edited_at
    ) VALUES (
        TG_TABLE_NAME, NEW.id, next_version, 
        CASE WHEN TG_TABLE_NAME = 'posts' THEN NEW.content ELSE NEW.content END,
        NEW.created_by, NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_post_versions AFTER UPDATE OF content ON posts FOR EACH ROW EXECUTE FUNCTION track_content_versions();
CREATE TRIGGER track_comment_versions AFTER UPDATE OF content ON comments FOR EACH ROW EXECUTE FUNCTION track_content_versions();

-- Anonymous message handling
CREATE OR REPLACE FUNCTION assign_message_anonymous_avatar()
RETURNS TRIGGER AS $$
DECLARE
    available_avatar_id UUID;
    is_premium_user BOOLEAN;
BEGIN
    IF NEW.is_anonymous = TRUE THEN
        -- Check if premium user
        SELECT EXISTS (
            SELECT 1 FROM subscriptions 
            WHERE user_id = NEW.sender_id 
            AND status = 'active' 
            AND end_at > NOW()
        ) INTO is_premium_user;
        
        -- Select avatar
        IF is_premium_user THEN
            SELECT id INTO available_avatar_id FROM anonymous_avatars ORDER BY RANDOM() LIMIT 1;
        ELSE
            SELECT id INTO available_avatar_id FROM anonymous_avatars WHERE is_premium_only = FALSE ORDER BY RANDOM() LIMIT 1;
        END IF;
        
        -- Assign avatar to message
        NEW.anonymous_avatar_id = available_avatar_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assign_anonymous_avatar_to_message 
BEFORE INSERT ON messages 
FOR EACH ROW WHEN (NEW.is_anonymous = TRUE) 
EXECUTE FUNCTION assign_message_anonymous_avatar();

-- Function to get recommended posts for a user
CREATE OR REPLACE FUNCTION get_recommended_posts(
  p_user_id UUID,
  p_tag_ids UUID[],
  p_topic_ids UUID[],
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  author_id UUID,
  board_id UUID,
  created_at TIMESTAMPTZ,
  view_count INTEGER,
  like_count INTEGER,
  comment_count INTEGER,
  is_anonymous BOOLEAN,
  tags UUID[],
  similarity REAL
) AS $$
BEGIN
  -- Return posts that match user's interests (tags/topics)
  -- and have embeddings available for similarity calculation
  RETURN QUERY
  WITH user_posts AS (
    -- Get posts the user has already interacted with (to exclude)
    SELECT DISTINCT post_id 
    FROM (
      SELECT post_id FROM votes WHERE user_id = p_user_id
      UNION
      SELECT post_id FROM favorites WHERE user_id = p_user_id
      UNION
      SELECT post_id FROM comments WHERE author_id = p_user_id
    ) as interactions
  ),
  tag_posts AS (
    -- Posts that match user's tag interests
    SELECT DISTINCT ph.post_id 
    FROM post_hashtags ph
    WHERE ph.hashtag_id = ANY(p_tag_ids)
  )
  SELECT 
    p.id,
    p.title,
    p.content,
    p.author_id,
    p.board_id,
    p.created_at,
    p.view_count,
    p.like_count,
    p.comment_count,
    p.is_anonymous,
    ARRAY_AGG(DISTINCT ph.hashtag_id) AS tags,
    0.0 AS similarity  -- Placeholder for vector similarity
  FROM posts p
  LEFT JOIN post_hashtags ph ON p.id = ph.post_id
  LEFT JOIN post_embeddings pe ON p.id = pe.post_id
  WHERE 
    -- Must have an embedding
    pe.embedding IS NOT NULL
    -- Not the user's own posts
    AND p.author_id <> p_user_id
    -- Not posts the user has already interacted with
    AND p.id NOT IN (SELECT post_id FROM user_posts)
    -- Not deleted or draft posts
    AND p.is_deleted = FALSE
    AND p.is_draft = FALSE
    -- Match user's interests
    AND (
      p.id IN (SELECT post_id FROM tag_posts)
      OR p.board_id IN (
        -- Boards the user follows
        SELECT board_id FROM board_followers WHERE user_id = p_user_id
      )
    )
  GROUP BY 
    p.id, p.title, p.content, p.author_id, p.board_id, 
    p.created_at, p.view_count, p.like_count, p.comment_count,
    p.is_anonymous
  ORDER BY 
    p.created_at DESC,  -- Recency bias
    p.like_count DESC   -- Quality bias
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to apply decay to all user interests
-- This helps ensure older interests gradually fade
CREATE OR REPLACE FUNCTION apply_interest_decay(
  p_decay_factor FLOAT DEFAULT 0.98
)
RETURNS VOID AS $$
BEGIN
  -- Apply decay factor to all weights
  -- Ensure they don't go below minimum threshold
  UPDATE user_interests
  SET 
    weight = GREATEST(0.05, weight * p_decay_factor),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to increment usage count for hashtags
CREATE OR REPLACE FUNCTION increment_hashtag_usage(tag_ids UUID[])
RETURNS VOID AS $$
BEGIN
  UPDATE hashtags
  SET 
    usage_count = usage_count + 1,
    updated_at = NOW()
  WHERE id = ANY(tag_ids);
END;
$$ LANGUAGE plpgsql;