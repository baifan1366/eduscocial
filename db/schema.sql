CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT,
  password TEXT NOT NULL,
  role TEXT CHECK (role IN ('superadmin')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id)
);

CREATE TABLE business_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT,
  password TEXT NOT NULL,
  role TEXT CHECK (role IN ('business')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id)
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    password_hash TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES admin_users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

<<<<<<< HEAD
-- User profiles table for extended profile information
=======
>>>>>>> 1a55df7143f50beea384adaa2a06cefc0144e2c3
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    birthday DATE,
    relationship_status TEXT CHECK (relationship_status IN ('single', 'in_relationship', 'married', 'complicated', 'prefer_not_to_say')),
    interests TEXT NOT NULL,
    university TEXT,
    favorite_quotes TEXT,
    favorite_country TEXT,
    daily_active_time TEXT CHECK (daily_active_time IN ('morning', 'afternoon', 'evening', 'night', 'varies')),
<<<<<<< HEAD
    study_abroad TEXT NOT NULL,
    leisure_activities TEXT NOT NULL,
=======
    study_abroad TEXT NULL,
    leisure_activities TEXT NULL,
>>>>>>> 1a55df7143f50beea384adaa2a06cefc0144e2c3
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    UNIQUE(user_id)
);

CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    domain TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES admin_users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    color TEXT,
    icon TEXT,
    visibility TEXT,
    anonymous BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    language TEXT DEFAULT 'zh-TW'
);

CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    post_type TEXT DEFAULT 'general' CHECK (post_type IN ('general', 'question', 'sharing', 'poll')),
    is_pinned BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    dislike_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_draft BOOLEAN DEFAULT FALSE,
    scheduled_publish_at TIMESTAMPTZ,
    language TEXT DEFAULT 'zh-TW',
    is_ad BOOLEAN DEFAULT FALSE,
    ad_metadata JSONB,
    ad_position INTEGER,
    ad_target_audience JSONB
);

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    school TEXT,
    department TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    like_count INTEGER DEFAULT 0,
    dislike_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    language TEXT DEFAULT 'zh-TW'
);

CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('like', 'dislike')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_post_vote UNIQUE (user_id, post_id),
    CONSTRAINT unique_user_comment_vote UNIQUE (user_id, comment_id),
    CONSTRAINT vote_target_check CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR
        (post_id IS NULL AND comment_id IS NOT NULL)
    )
);

CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_post_favorite UNIQUE (user_id, post_id)
);

CREATE TABLE followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_follower_following UNIQUE (follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'reply', 'follow', 'mention')),
    title TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    content TEXT,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    triggered_by UUID REFERENCES users(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT report_target_check CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR
        (post_id IS NULL AND comment_id IS NOT NULL)
    )
);

CREATE TABLE post_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'gif')),
    file_url TEXT NOT NULL,
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hashtags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE post_hashtags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    hashtag_id UUID REFERENCES hashtags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE anonymous_avatars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  avatar_url TEXT NOT NULL,
  description TEXT,
  is_premium_only BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE TABLE anonymous_avatars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  avatar_url TEXT NOT NULL,
  description TEXT,
  is_premium_only BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    attachments TEXT[],
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    is_anonymous BOOLEAN DEFAULT FALSE,
    anonymous_avatar_id UUID REFERENCES anonymous_avatars(id)
);

CREATE TABLE message_read_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

CREATE TABLE blocked_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    blocked_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    blocked_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    CONSTRAINT no_self_block CHECK (user_id != blocked_user_id),
    CONSTRAINT unique_blocked_user UNIQUE (user_id, blocked_user_id)
);

CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    settings JSONB,
    notification_settings JSONB,
    theme TEXT DEFAULT 'light',
    language TEXT DEFAULT 'zh-TW',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE TABLE daily_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_a UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  matched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  matched_date DATE,  -- manually filled by trigger
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  accepted_a BOOLEAN DEFAULT FALSE,
  accepted_b BOOLEAN DEFAULT FALSE,
  CHECK (user_a <> user_b),
  CHECK (user_a < user_b),
  UNIQUE(user_a, user_b, matched_date)
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK(plan IN ('monthly','yearly')),
  start_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_at TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN DEFAULT TRUE,
  status TEXT NOT NULL CHECK(status IN ('active','cancelled','expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
<<<<<<< HEAD
  created_by UUID REFERENCES users(id)
=======
  created_by UUID REFERENCES admin_users(id)
>>>>>>> 1a55df7143f50beea384adaa2a06cefc0144e2c3
);

CREATE TABLE store_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TWD',
  media_urls TEXT[],            
  metadata JSONB,               
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE store_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES store_products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TWD',
  order_metadata JSONB,
  status TEXT NOT NULL CHECK(status IN ('pending','paid','shipped','completed','cancelled')),
  ordered_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id)
);

CREATE TABLE anonymous_avatar_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK(target_type IN ('post','comment')),
  target_id UUID NOT NULL,
  avatar_id UUID NOT NULL REFERENCES anonymous_avatars(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(user_id, target_type, target_id)
);

CREATE TABLE promotion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_user_id UUID NOT NULL REFERENCES business_users(id) ON DELETE CASCADE,
  requested_by_email TEXT NOT NULL,
  message TEXT NOT NULL,
  attachments TEXT[],            
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_response TEXT,
  responded_by UUID REFERENCES admin_users(id),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES business_users(id)
);

CREATE TABLE ad_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID UNIQUE NOT NULL REFERENCES promotion_requests(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,         
  media_urls TEXT[],             
  targeting JSONB NOT NULL,      
  bid_type TEXT NOT NULL CHECK(bid_type IN ('CPM','CPC')),
  bid_amount_cents INTEGER NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled','running','paused','completed','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES business_users(id)
);

CREATE TABLE ad_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend_cents BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES business_users(id),
  UNIQUE(campaign_id, date)
);

CREATE TABLE ads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_user_id UUID NOT NULL REFERENCES business_users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES business_users(id)
);

CREATE TABLE ad_placements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  placement_type TEXT NOT NULL CHECK(placement_type IN ('front_page', 'search', 'board_sidebar', 'newsletter')),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  bid_amount_cents INTEGER,
  status TEXT NOT NULL CHECK(status IN ('active', 'paused', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES business_users(id)
);

CREATE TABLE promotion_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK(rule_type IN ('quantity_threshold','time_based','mix_and_match')),
  parameters JSONB NOT NULL,  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES business_users(id)
);

CREATE TABLE promotion_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promotion_rule_id UUID NOT NULL REFERENCES promotion_rules(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK(target_type IN ('board','user_segment','product_category')),
  target_ids UUID[] NOT NULL,  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES business_users(id)
);

CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id)
);

CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id),
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(user_id, badge_id)
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  event_time TIMESTAMPTZ NOT NULL,
  max_attendees INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE TABLE event_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  rsvp_status TEXT NOT NULL CHECK(rsvp_status IN ('going','maybe','not_going')),
  responded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(event_id, user_id)
);

CREATE TABLE ad_pixels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  pixel_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id)
);

CREATE TABLE ad_pixel_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_pixel_id UUID NOT NULL REFERENCES ad_pixels(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, 
  event_data JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id)
);

CREATE TABLE landing_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_campaign_id UUID NOT NULL REFERENCES ad_campaigns(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  call_to_action TEXT,
  url_slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id)
);

CREATE TABLE audience_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  criteria JSONB NOT NULL, 
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id)
);

CREATE TABLE campaign_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_campaign_id UUID NOT NULL REFERENCES ad_campaigns(id),
  audience_segment_id UUID NOT NULL REFERENCES audience_segments(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id)
);

CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id)
);

CREATE TABLE user_topic_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(user_id, topic_id)
);

CREATE TABLE influencer_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_user_id UUID NOT NULL REFERENCES business_users(id),
  user_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  content TEXT,
  media_urls TEXT[],
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT CHECK(status IN ('planned','running','completed','cancelled')) DEFAULT 'planned',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES business_users(id)
);

CREATE TABLE trial_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_user_id UUID NOT NULL REFERENCES business_users(id),
  title TEXT NOT NULL,
  description TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  criteria JSONB,            
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES business_users(id)
);

CREATE TABLE trial_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trial_campaign_id UUID NOT NULL REFERENCES trial_campaigns(id),
  user_id UUID NOT NULL REFERENCES users(id),
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK(status IN ('applied','selected','completed','dismissed')) DEFAULT 'applied',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES business_users(id),
  UNIQUE(trial_campaign_id, user_id)
);

CREATE TABLE action_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,            
  target_table TEXT,             
  target_id UUID,                 
  old_data JSONB,                 
  new_data JSONB,                
  metadata JSONB,               
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admin_action_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,            
  target_table TEXT,             
  target_id UUID,                 
  old_data JSONB,                 
  new_data JSONB,                
  metadata JSONB,               
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE business_action_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_user_id UUID REFERENCES business_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,            
  target_table TEXT,             
  target_id UUID,                 
  old_data JSONB,                 
  new_data JSONB,                
  metadata JSONB,               
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_wall_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  privacy_level TEXT NOT NULL DEFAULT 'friends' CHECK (privacy_level IN ('public', 'friends', 'private')),
  allow_comments BOOLEAN DEFAULT TRUE,
  allow_posts BOOLEAN DEFAULT TRUE,
  theme_color TEXT,
  background_image_url TEXT,
  custom_css TEXT,
  pinned_post_id UUID,
  featured_posts UUID[],
  hidden_posts UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(user_id)
);

CREATE TABLE user_wall_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wall_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[],
  visibility TEXT NOT NULL DEFAULT 'standard' CHECK (visibility IN ('standard', 'featured', 'pinned', 'hidden')),
  is_deleted BOOLEAN DEFAULT FALSE,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE TABLE user_mfa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mfa_type TEXT NOT NULL CHECK (mfa_type IN ('app', 'sms', 'email')),
  secret TEXT,
  backup_codes TEXT[],
  is_enabled BOOLEAN DEFAULT FALSE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(user_id, mfa_type)
);

CREATE TABLE admin_mfa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  mfa_type TEXT NOT NULL CHECK (mfa_type IN ('app', 'sms', 'email')),
  secret TEXT,
  backup_codes TEXT[],
  is_enabled BOOLEAN DEFAULT FALSE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id),
  UNIQUE(admin_user_id, mfa_type)
);

CREATE TABLE business_mfa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_user_id UUID NOT NULL REFERENCES business_users(id) ON DELETE CASCADE,
  mfa_type TEXT NOT NULL CHECK (mfa_type IN ('app', 'sms', 'email')),
  secret TEXT,
  backup_codes TEXT[],
  is_enabled BOOLEAN DEFAULT FALSE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES business_users(id),
  UNIQUE(business_user_id, mfa_type)
);

CREATE TABLE board_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  parent_id UUID REFERENCES board_categories(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id)
);

CREATE TABLE board_category_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES board_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(board_id, category_id)
);

CREATE TABLE board_followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  followed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(user_id, board_id)
);

CREATE TABLE post_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  embedding vector(384),
  model_version TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE content_moderation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'media')),
  content_id UUID NOT NULL,
  moderation_type TEXT NOT NULL CHECK (moderation_type IN ('text', 'image', 'video', 'audio')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  rejection_reason TEXT,
  flagged_categories TEXT[],
  confidence_scores JSONB,
  moderator_id UUID REFERENCES users(id),
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  room_type TEXT NOT NULL CHECK (room_type IN ('direct', 'group', 'match')),
  is_active BOOLEAN DEFAULT TRUE,
  match_id UUID REFERENCES daily_matches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE TABLE chat_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  is_admin BOOLEAN DEFAULT FALSE,
  last_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chat_room_id, user_id)
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'file', 'system')),
  content TEXT,
  attachments TEXT[],
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  read_by UUID[],
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES hashtags(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    weight FLOAT DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    CONSTRAINT tag_or_topic_required CHECK (
        (tag_id IS NOT NULL AND topic_id IS NULL) OR
        (tag_id IS NULL AND topic_id IS NOT NULL)
    ),
    UNIQUE(user_id, tag_id, topic_id)
);

CREATE TABLE content_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment')),
    content_id UUID NOT NULL,
    version_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(content_type, content_id, version_number)
);

CREATE TABLE user_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_name TEXT NOT NULL, -- 'google', 'github', etc.
    provider_user_id TEXT NOT NULL, -- The ID from the provider
    provider_email TEXT,
    profile_data JSONB, -- Store profile information from provider
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    UNIQUE(provider_name, provider_user_id)
);

CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    content_hash TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    device_info JSONB,
    location TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE admin_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    device_info JSONB,
    location TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE business_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_user_id UUID NOT NULL REFERENCES business_users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    device_info JSONB,
    location TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_report_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment')),
    content_id UUID NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);