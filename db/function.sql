-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON boards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_votes_updated_at BEFORE UPDATE ON votes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_favorites_updated_at BEFORE UPDATE ON favorites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_followers_updated_at BEFORE UPDATE ON followers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_media_updated_at BEFORE UPDATE ON post_media
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hashtags_updated_at BEFORE UPDATE ON hashtags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_hashtags_updated_at BEFORE UPDATE ON post_hashtags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for updating counters
CREATE OR REPLACE FUNCTION update_post_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.post_id IS NOT NULL THEN
            -- Update comment count
            UPDATE posts 
            SET comment_count = comment_count + 1 
            WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.post_id IS NOT NULL THEN
            -- Update comment count
            UPDATE posts 
            SET comment_count = comment_count - 1 
            WHERE id = OLD.post_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger for comment counting
CREATE TRIGGER update_post_comment_count 
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_post_counters();

-- Function for updating vote counters
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

-- Create trigger for vote counting
CREATE TRIGGER update_vote_counts 
    AFTER INSERT OR DELETE ON votes
    FOR EACH ROW EXECUTE FUNCTION update_vote_counters();

-- Function to update hashtag usage count
CREATE OR REPLACE FUNCTION update_hashtag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment hashtag usage count
        UPDATE hashtags
        SET usage_count = usage_count + 1
        WHERE id = NEW.hashtag_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement hashtag usage count
        UPDATE hashtags
        SET usage_count = usage_count - 1
        WHERE id = OLD.hashtag_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create hashtag usage count trigger
CREATE TRIGGER update_hashtag_count
    AFTER INSERT OR DELETE ON post_hashtags
    FOR EACH ROW EXECUTE FUNCTION update_hashtag_usage_count();

-- User wall post comment count update function
CREATE OR REPLACE FUNCTION update_user_wall_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment comment count
        UPDATE user_wall_posts
        SET comment_count = comment_count + 1
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement comment count
        UPDATE user_wall_posts
        SET comment_count = comment_count - 1
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically assign anonymous avatar
CREATE OR REPLACE FUNCTION assign_anonymous_avatar()
RETURNS TRIGGER AS $$
DECLARE
    available_avatar_id UUID;
    premium_only BOOLEAN;
    is_premium_user BOOLEAN;
BEGIN
    -- Check if user is a premium user
    SELECT EXISTS (
        SELECT 1 FROM subscriptions 
        WHERE user_id = NEW.author_id 
        AND status = 'active' 
        AND end_at > NOW()
    ) INTO is_premium_user;
    
    -- If post/comment is anonymous, assign avatar
    IF NEW.is_anonymous = TRUE THEN
        -- Select avatar based on user's premium status
        IF is_premium_user THEN
            -- Premium users can use any avatar
            SELECT id INTO available_avatar_id
            FROM anonymous_avatars
            ORDER BY RANDOM()
            LIMIT 1;
        ELSE
            -- Regular users can only use non-premium avatars
            SELECT id INTO available_avatar_id
            FROM anonymous_avatars
            WHERE is_premium_only = FALSE
            ORDER BY RANDOM()
            LIMIT 1;
        END IF;
        
        -- Insert anonymous avatar assignment record
        IF TG_TABLE_NAME = 'posts' THEN
            INSERT INTO anonymous_avatar_assignments (
                user_id, target_type, target_id, avatar_id, 
                assigned_at, created_by
            ) VALUES (
                NEW.author_id, 'post', NEW.id, available_avatar_id, 
                NOW(), NEW.created_by
            );
        ELSIF TG_TABLE_NAME = 'comments' THEN
            INSERT INTO anonymous_avatar_assignments (
                user_id, target_type, target_id, avatar_id, 
                assigned_at, created_by
            ) VALUES (
                NEW.author_id, 'comment', NEW.id, available_avatar_id, 
                NOW(), NEW.created_by
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for anonymous post
CREATE TRIGGER assign_anonymous_avatar_to_post
    AFTER INSERT ON posts
    FOR EACH ROW 
    WHEN (NEW.is_anonymous = TRUE)
    EXECUTE FUNCTION assign_anonymous_avatar();

-- Create trigger for anonymous comment
CREATE TRIGGER assign_anonymous_avatar_to_comment
    AFTER INSERT ON comments
    FOR EACH ROW 
    WHEN (NEW.is_anonymous = TRUE)
    EXECUTE FUNCTION assign_anonymous_avatar();

-- View count update function
CREATE OR REPLACE FUNCTION increment_post_view_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Increment post view count
    NEW.view_count = OLD.view_count + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create post view count update trigger
CREATE TRIGGER update_post_view_count
    BEFORE UPDATE ON posts
    FOR EACH ROW
    WHEN (NEW.view_count IS DISTINCT FROM OLD.view_count)
    EXECUTE FUNCTION increment_post_view_count();

-- Function to setup new user related records
CREATE OR REPLACE FUNCTION setup_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user preferences
    INSERT INTO user_preferences (user_id, created_by)
    VALUES (NEW.id, NEW.id);
    
    -- Create user wall settings
    INSERT INTO user_wall_settings (user_id, created_by)
    VALUES (NEW.id, NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new user setup trigger
CREATE TRIGGER after_user_insert
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION setup_new_user();

-- Function to update chat message read status
CREATE OR REPLACE FUNCTION update_message_read_status()
RETURNS TRIGGER AS $$
BEGIN
    -- When a new message is sent, update read status
    UPDATE chat_participants
    SET last_read_at = NOW()
    WHERE chat_room_id = NEW.chat_room_id
    AND user_id = NEW.sender_id;
    
    -- Add sender ID to read list
    NEW.read_by = ARRAY[NEW.sender_id];
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create message read status trigger
CREATE TRIGGER update_chat_message_read_status
    BEFORE INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_message_read_status();

-- Function to create chat room after match accepted
CREATE OR REPLACE FUNCTION create_match_chat_room()
RETURNS TRIGGER AS $$
BEGIN
    -- When both users accept the match, create a chat room
    IF NEW.accepted_a = TRUE AND NEW.accepted_b = TRUE AND 
       (OLD.accepted_a = FALSE OR OLD.accepted_b = FALSE) THEN
        -- Create match chat room
        INSERT INTO chat_rooms (name, room_type, match_id, created_by)
        VALUES (
            'Match Chat - ' || NOW()::date, 
            'match', 
            NEW.id, 
            NEW.created_by
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create match chat room trigger
CREATE TRIGGER create_chat_room_after_match_accepted
    AFTER UPDATE ON daily_matches
    FOR EACH ROW
    EXECUTE FUNCTION create_match_chat_room();

-- Function to add chat participants automatically
CREATE OR REPLACE FUNCTION add_chat_participants()
RETURNS TRIGGER AS $$
BEGIN
    -- If it's a match chat room, add both matched users
    IF NEW.room_type = 'match' AND NEW.match_id IS NOT NULL THEN
        -- Get both matched users
        INSERT INTO chat_participants (chat_room_id, user_id, is_admin)
        SELECT 
            NEW.id, 
            user_a,
            TRUE
        FROM daily_matches
        WHERE id = NEW.match_id;
        
        INSERT INTO chat_participants (chat_room_id, user_id, is_admin)
        SELECT 
            NEW.id, 
            user_b,
            TRUE
        FROM daily_matches
        WHERE id = NEW.match_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create add chat participants trigger
CREATE TRIGGER add_participants_after_chat_room_created
    AFTER INSERT ON chat_rooms
    FOR EACH ROW
    WHEN (NEW.room_type = 'match')
    EXECUTE FUNCTION add_chat_participants();