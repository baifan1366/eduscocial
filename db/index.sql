-- POSTS
CREATE INDEX idx_posts_board_id ON posts(board_id);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_like_count ON posts(like_count DESC);
CREATE INDEX idx_posts_view_count ON posts(view_count DESC);
CREATE INDEX idx_posts_is_deleted ON posts(is_deleted);

-- COMMENTS
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);
CREATE INDEX idx_comments_is_deleted ON comments(is_deleted);

-- VOTES
CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_votes_post_id ON votes(post_id);
CREATE INDEX idx_votes_comment_id ON votes(comment_id);
CREATE INDEX idx_votes_vote_type ON votes(vote_type);

-- NOTIFICATIONS
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_type ON notifications(type);

-- USERS & PROFILES
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- HASHTAGS & POST_HASHTAGS
CREATE INDEX idx_hashtags_name ON hashtags(name);
CREATE INDEX idx_hashtags_usage_count ON hashtags(usage_count DESC);
CREATE INDEX idx_post_hashtags_post_id ON post_hashtags(post_id);
CREATE INDEX idx_post_hashtags_hashtag_id ON post_hashtags(hashtag_id);

-- FAVORITES
CREATE INDEX idx_favorites_user_id_created_at ON favorites(user_id, created_at);

-- FOLLOWERS
CREATE INDEX idx_followers_follower_id ON followers(follower_id);
CREATE INDEX idx_followers_following_id ON followers(following_id);

-- REPORTS
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_post_id ON reports(post_id);
CREATE INDEX idx_reports_comment_id ON reports(comment_id);

-- MODERATION
CREATE INDEX idx_content_moderation_content_id ON content_moderation(content_id);
CREATE INDEX idx_content_moderation_status ON content_moderation(status);

-- MATCHING
CREATE INDEX idx_daily_matches_user_a ON daily_matches(user_a);
CREATE INDEX idx_daily_matches_user_b ON daily_matches(user_b);
CREATE INDEX idx_daily_matches_matched_at ON daily_matches(matched_at);

-- CHAT
CREATE INDEX idx_chat_rooms_match_id ON chat_rooms(match_id);
CREATE INDEX idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX idx_chat_messages_chat_room_id ON chat_messages(chat_room_id);
CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_sent_at ON chat_messages(sent_at);

-- BOARDS
CREATE INDEX idx_boards_name ON boards(name);
CREATE INDEX idx_boards_slug ON boards(slug);
CREATE INDEX idx_board_followers_board_id ON board_followers(board_id);
CREATE INDEX idx_board_followers_user_id ON board_followers(user_id);

-- FILES
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_file_type ON files(file_type);
CREATE INDEX idx_files_created_at ON files(created_at);

-- MESSAGES
CREATE INDEX idx_message_read_status_user ON message_read_status(user_id, is_read);
CREATE INDEX idx_messages_sender_receiver ON messages(sender_id, receiver_id);

-- USER PREFERENCES
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- USER INTERESTS
CREATE INDEX idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX idx_user_interests_weight ON user_interests(user_id, weight DESC);

-- ADMINS / BUSINESS USERS / MFA
CREATE INDEX idx_admin_mfa_admin_user_id ON admin_mfa(admin_user_id);
CREATE INDEX idx_business_mfa_business_user_id ON business_mfa(business_user_id);

-- AD SYSTEM
CREATE INDEX idx_ad_campaigns_start_at ON ad_campaigns(start_at);
CREATE INDEX idx_ad_campaigns_end_at ON ad_campaigns(end_at);
CREATE INDEX idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX idx_ad_performance_campaign_id_date ON ad_performance(campaign_id, date);
CREATE INDEX idx_ad_placements_ad_id ON ad_placements(ad_id);

-- SUBSCRIPTIONS
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- EVENTS
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_event_attendees_event_id_user_id ON event_attendees(event_id, user_id);

-- BADGES
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);

-- TOPICS
CREATE INDEX idx_user_topic_subscriptions_user_id ON user_topic_subscriptions(user_id);
CREATE INDEX idx_user_topic_subscriptions_topic_id ON user_topic_subscriptions(topic_id);

-- EMBEDDINGS
CREATE INDEX idx_post_embeddings_post_id ON post_embeddings(post_id);

-- WALL
CREATE INDEX idx_user_wall_settings_user_id ON user_wall_settings(user_id);
CREATE INDEX idx_user_wall_posts_wall_owner_id ON user_wall_posts(wall_owner_id);

-- PROVIDERS
CREATE INDEX idx_user_providers_user_id ON user_providers(user_id);

-- CONTENT VERSIONING
CREATE INDEX idx_content_versions ON content_versions(content_type, content_id);

-- SESSIONS
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_admin_sessions_admin_user_id ON admin_sessions(admin_user_id);
CREATE INDEX idx_business_sessions_business_user_id ON business_sessions(business_user_id);

-- ACTION LOGS
CREATE INDEX idx_action_log_user_id ON action_log(user_id);
CREATE INDEX idx_admin_action_log_admin_user_id ON admin_action_log(admin_user_id);
CREATE INDEX idx_business_action_log_business_user_id ON business_action_log(business_user_id);

-- AUDIENCE
CREATE INDEX idx_campaign_segments_campaign_id ON campaign_segments(campaign_id);
CREATE INDEX idx_campaign_segments_segment_id ON campaign_segments(segment_id);

-- WALL SETTINGS
CREATE INDEX idx_user_wall_posts_author_id ON user_wall_posts(author_id);

-- TRIAL CAMPAIGNS
CREATE INDEX idx_trial_participants_campaign_id ON trial_participants(campaign_id);
CREATE INDEX idx_trial_participants_user_id ON trial_participants(user_id);

-- REPORT HISTORY
CREATE INDEX idx_user_report_history_reporter_id ON user_report_history(reporter_id);
CREATE INDEX idx_user_report_history_content_id ON user_report_history(content_id);