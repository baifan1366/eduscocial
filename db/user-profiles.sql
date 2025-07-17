-- User profiles table for extended profile information
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    birthday DATE,
    relationship_status TEXT CHECK (relationship_status IN ('single', 'in_relationship', 'married', 'complicated', 'prefer_not_to_say')),
    interests TEXT NOT NULL,
    university TEXT,
    favorite_quotes TEXT,
    favorite_country TEXT,
    daily_active_time TEXT CHECK (daily_active_time IN ('morning', 'afternoon', 'evening', 'night', 'varies')),
    study_abroad TEXT NOT NULL,
    leisure_activities TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    UNIQUE(user_id)
);

-- Index for faster lookups
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);