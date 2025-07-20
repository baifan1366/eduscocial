-- 自动更新时间戳函数
-- 功能：在任何表更新时自动更新updated_at字段为当前时间
-- 应用：所有需要追踪更新时间的表
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 时间戳触发器（应用于多个表）
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
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
CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 评论计数器触发器
-- 功能：在添加或删除评论时自动更新帖子的评论计数
-- 应用：posts和comments表之间的关系维护
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

-- 投票计数器触发器
-- 功能：在添加或删除点赞/踩时自动更新帖子或评论的赞/踩计数
-- 应用：维护posts和comments表中的like_count和dislike_count
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

-- 标签使用计数
-- 功能：在帖子添加或删除标签时自动更新标签使用次数
-- 应用：维护hashtags表中的usage_count
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

-- 匿名头像分配
-- 功能：为匿名帖子或评论分配匿名头像，根据用户是否是高级用户提供不同范围的头像
-- 应用：维护匿名发帖和评论的头像显示
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

-- 新用户设置
-- 功能：在创建新用户时自动创建相关的用户偏好和墙设置记录
-- 应用：确保用户配置数据完整性
CREATE OR REPLACE FUNCTION setup_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_preferences (user_id, created_by) VALUES (NEW.id, NEW.id);
    INSERT INTO user_wall_settings (user_id, created_by) VALUES (NEW.id, NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_user_insert AFTER INSERT ON users FOR EACH ROW EXECUTE FUNCTION setup_new_user();

-- 匹配接受后创建聊天室
-- 功能：当两名用户都接受匹配后自动创建聊天室
-- 应用：daily_matches和chat_rooms表之间的关系维护
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

-- 添加聊天参与者
-- 功能：在创建匹配聊天室后自动添加相关用户作为参与者
-- 应用：chat_rooms和chat_participants表之间的关系维护
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

-- 聊天消息读取状态
-- 功能：在发送消息时自动更新发送者的最后阅读时间并初始化已读用户数组
-- 应用：维护chat_messages和chat_participants表中的阅读状态
CREATE OR REPLACE FUNCTION update_message_read_status()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_participants SET last_read_at = NOW() WHERE chat_room_id = NEW.chat_room_id AND user_id = NEW.sender_id;
    NEW.read_by = ARRAY[NEW.sender_id];
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_message_read_status BEFORE INSERT ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_message_read_status();

-- 自动创建系统通知
-- 功能：在用户点赞帖子或评论时自动创建通知
-- 应用：votes和notifications表之间的关系维护
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

-- 内容审核触发器（新帖子/评论）
-- 功能：在创建新帖子或评论时自动创建内容审核记录
-- 应用：实现内容自动审核流程
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

-- 跟踪订单/订阅状态
-- 功能：在订单或订阅状态变更时记录到action_log表
-- 应用：用于审计和跟踪关键业务状态变更
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

-- 所有变更的行为记录
-- 功能：记录关键表的所有变更操作
-- 应用：提供系统审计和变更历史
CREATE OR REPLACE FUNCTION generic_action_logger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO action_log (user_id, action, target_table, target_id, old_data, new_data, occurred_at)
  VALUES (NEW.created_by, TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_post_changes AFTER INSERT OR UPDATE OR DELETE ON posts FOR EACH ROW EXECUTE FUNCTION generic_action_logger();

-- 设置匹配日期
-- 功能：自动从匹配时间中设置匹配日期字段
-- 应用：日期分组和查询优化
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

-- 内容版本跟踪触发器
-- 功能：在内容更新时创建内容版本历史记录
-- 应用：维护帖子和评论的内容历史
CREATE OR REPLACE FUNCTION track_content_versions()
RETURNS TRIGGER AS $$
DECLARE
    next_version INTEGER;
BEGIN
    -- 获取下一个版本号
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version 
    FROM content_versions 
    WHERE content_type = TG_TABLE_NAME AND content_id = NEW.id;
    
    -- 插入新版本
    INSERT INTO content_versions (
        content_type, content_id, version_number, content, created_by, created_at, updated_at
    ) VALUES (
        TG_TABLE_NAME, NEW.id, next_version, 
        CASE WHEN TG_TABLE_NAME = 'posts' THEN NEW.content ELSE NEW.content END,
        NEW.created_by, NOW(), NOW()    
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_post_versions AFTER UPDATE OF content ON posts FOR EACH ROW EXECUTE FUNCTION track_content_versions();
CREATE TRIGGER track_comment_versions AFTER UPDATE OF content ON comments FOR EACH ROW EXECUTE FUNCTION track_content_versions();

-- 匿名消息处理
-- 功能：为匿名消息分配匿名头像
-- 应用：维护匿名消息的用户隐私
CREATE OR REPLACE FUNCTION assign_message_anonymous_avatar()
RETURNS TRIGGER AS $$
DECLARE
    available_avatar_id UUID;
    is_premium_user BOOLEAN;
BEGIN
    -- 检查是否为消息表触发
    IF TG_TABLE_NAME = 'messages' AND NEW.is_anonymous = TRUE THEN
        -- 检查是否为高级用户
        SELECT EXISTS (
            SELECT 1 FROM subscriptions 
            WHERE user_id = NEW.sender_id 
            AND status = 'active' 
            AND end_at > NOW()
        ) INTO is_premium_user;
        
        -- 选择头像
        IF is_premium_user THEN
            SELECT id INTO available_avatar_id FROM anonymous_avatars ORDER BY RANDOM() LIMIT 1;
        ELSE
            SELECT id INTO available_avatar_id FROM anonymous_avatars WHERE is_premium_only = FALSE ORDER BY RANDOM() LIMIT 1;
        END IF;
        
        -- 为消息分配头像
        NEW.anonymous_avatar_id = available_avatar_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assign_anonymous_avatar_to_message 
BEFORE INSERT ON messages 
FOR EACH ROW
EXECUTE FUNCTION assign_message_anonymous_avatar();

-- 更新通知更新时间
-- 功能：在通知更新时自动更新updated_at字段
-- 应用：保持通知数据时间戳的准确性
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建updated_at更新触发器
DROP TRIGGER IF EXISTS trigger_notifications_updated_at ON notifications;
CREATE TRIGGER trigger_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- 获取未读通知计数函数
-- 功能：获取指定用户未读通知数量
-- 应用：用户通知计数显示
CREATE OR REPLACE FUNCTION get_unread_notifications_count(target_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM notifications
        WHERE user_id = target_user_id AND is_read = FALSE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 新增：按日期检索帖子计数函数
-- 功能：获取指定日期范围内的帖子数量
-- 应用：系统统计和分析
CREATE OR REPLACE FUNCTION get_posts_count_by_date_range(start_date DATE, end_date DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM posts
        WHERE created_at::DATE BETWEEN start_date AND end_date
    );
END;
$$ LANGUAGE plpgsql;

-- 新增：用户活跃度跟踪
-- 功能：在用户登录、发帖、评论等活动时更新最后活跃时间
-- 应用：用户活跃度分析
CREATE OR REPLACE FUNCTION update_user_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users SET last_login_at = NOW() WHERE id = NEW.created_by;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_post_activity AFTER INSERT ON posts FOR EACH ROW EXECUTE FUNCTION update_user_activity();
CREATE TRIGGER track_comment_activity AFTER INSERT ON comments FOR EACH ROW EXECUTE FUNCTION update_user_activity();