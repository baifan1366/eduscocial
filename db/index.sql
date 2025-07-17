CREATE INDEX idx_posts_board_id ON posts(board_id);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_like_count ON posts(like_count DESC);
CREATE INDEX idx_posts_view_count ON posts(view_count DESC);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_votes_post_id ON votes(post_id);
CREATE INDEX idx_votes_comment_id ON votes(comment_id);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE read = FALSE;
CREATE INDEX idx_notifications_type ON notifications(type);

CREATE INDEX idx_hashtags_name ON hashtags(name);
CREATE INDEX idx_hashtags_usage_count ON hashtags(usage_count DESC);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_school ON users(school);
CREATE INDEX idx_users_department ON users(department);

CREATE INDEX idx_schools_name ON schools(name);
CREATE INDEX idx_departments_school_id ON departments(school_id);
CREATE INDEX idx_departments_name ON departments(name);

CREATE INDEX idx_daily_matches_user_a ON daily_matches(user_a);
CREATE INDEX idx_daily_matches_user_b ON daily_matches(user_b);
CREATE INDEX idx_daily_matches_matched_at ON daily_matches(matched_at);

CREATE INDEX idx_chat_rooms_match_id ON chat_rooms(match_id);
CREATE INDEX idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX idx_chat_messages_chat_room_id ON chat_messages(chat_room_id);
CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_sent_at ON chat_messages(sent_at);

CREATE INDEX idx_ad_campaigns_start_at ON ad_campaigns(start_at);
CREATE INDEX idx_ad_campaigns_end_at ON ad_campaigns(end_at);
CREATE INDEX idx_ad_campaigns_status ON ad_campaigns(status);

CREATE INDEX idx_followers_follower_id ON followers(follower_id);
CREATE INDEX idx_followers_following_id ON followers(following_id);

CREATE INDEX idx_boards_name ON boards(name);
CREATE INDEX idx_boards_slug ON boards(slug);
CREATE INDEX idx_board_followers_board_id ON board_followers(board_id);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_content_moderation_content_id ON content_moderation(content_id);
CREATE INDEX idx_content_moderation_status ON content_moderation(status);

CREATE INDEX idx_post_hashtags_hashtag_id ON post_hashtags(hashtag_id);
CREATE INDEX idx_favorites_user_id_created_at ON favorites(user_id, created_at);
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);


CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_file_type ON files(file_type);


CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_file_type ON files(file_type);
CREATE INDEX idx_files_created_at ON files(created_at);

CREATE INDEX idx_message_read_status_user ON message_read_status(user_id, is_read);

CREATE INDEX idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX idx_user_interests_weight ON user_interests(user_id, weight DESC);

CREATE INDEX idx_cache_queue_processed ON cache_invalidation_queue(processed, created_at);

CREATE INDEX idx_content_versions ON content_versions(content_type, content_id);


CREATE INDEX idx_redis_token_structure_key_pattern ON redis_token_structure(key_pattern);
CREATE INDEX idx_redis_token_structure_description ON redis_token_structure(description);
CREATE INDEX idx_redis_token_structure_example ON redis_token_structure(example);
CREATE INDEX idx_redis_token_structure_ttl_seconds ON redis_token_structure(ttl_seconds);
CREATE INDEX idx_redis_token_structure_notes ON redis_token_structure(notes);