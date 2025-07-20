-- USERS
INSERT INTO users (id, email, username, password_hash, gender, is_verified) VALUES
(uuid_generate_v4(), 'alice@example.com', 'alice', 'hashed_password1', 'female', TRUE),
(uuid_generate_v4(), 'bob@example.com', 'bob', 'hashed_password2', 'male', TRUE),
(uuid_generate_v4(), 'charlie@example.com', 'charlie', 'hashed_password3', 'other', FALSE);

-- USER PROFILES
INSERT INTO user_profiles (id, user_id, bio, interests) SELECT
uuid_generate_v4(), id, 'Hi I am Alice!', ARRAY['reading', 'travel'] FROM users WHERE username = 'alice';

INSERT INTO user_profiles (id, user_id, bio, interests) SELECT
uuid_generate_v4(), id, 'Bob here!', ARRAY['sports', 'gaming'] FROM users WHERE username = 'bob';

-- BOARDS
INSERT INTO boards (id, name, slug) VALUES
(uuid_generate_v4(), 'General', 'general'),
(uuid_generate_v4(), 'Announcements', 'announcements');

-- FOLLOWERS
INSERT INTO followers (id, follower_id, following_id) SELECT
uuid_generate_v4(), a.id, b.id FROM users a, users b WHERE a.username = 'bob' AND b.username = 'alice';

-- NOTIFICATIONS
INSERT INTO notifications (id, user_id, title, type, is_read) SELECT
uuid_generate_v4(), u.id, 'You have a new comment.', 'comment', FALSE FROM users u WHERE username = 'alice';