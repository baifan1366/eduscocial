-- Add profile fields to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS relationship_status TEXT CHECK (relationship_status IN ('single', 'in_relationship', 'married', 'complicated', 'prefer_not_to_say'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS interests TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS favorite_quotes TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_active_time TEXT CHECK (daily_active_time IN ('morning', 'afternoon', 'evening', 'night', 'varies'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS study_abroad TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS leisure_activities TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_interests ON users USING gin(to_tsvector('english', interests));
CREATE INDEX IF NOT EXISTS idx_users_school ON users(school);
CREATE INDEX IF NOT EXISTS idx_users_birthday ON users(birthday);