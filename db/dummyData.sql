-- dummyData.sql
-- Sample data for the EduSocial database

-- Users
INSERT INTO users (id, email, username, avatar_url, password_hash, gender, is_verified, is_active, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'john@example.com', 'john_doe', 'https://randomuser.me/api/portraits/men/1.jpg', '$2a$10$GF5DojSLsWNqxCYbHz7PnO8a9t/D/75lMGXnMP2A33nqCiaE9T.8i', 'male', TRUE, TRUE, NOW()),
('22222222-2222-2222-2222-222222222222', 'jane@example.com', 'jane_smith', 'https://randomuser.me/api/portraits/women/2.jpg', '$2a$10$GF5DojSLsWNqxCYbHz7PnO8a9t/D/75lMGXnMP2A33nqCiaE9T.8i', 'female', TRUE, TRUE, NOW()),
('33333333-3333-3333-3333-333333333333', 'mike@example.com', 'mike_wilson', 'https://randomuser.me/api/portraits/men/3.jpg', '$2a$10$GF5DojSLsWNqxCYbHz7PnO8a9t/D/75lMGXnMP2A33nqCiaE9T.8i', 'male', TRUE, TRUE, NOW()),
('44444444-4444-4444-4444-444444444444', 'lisa@example.com', 'lisa_taylor', 'https://randomuser.me/api/portraits/women/4.jpg', '$2a$10$GF5DojSLsWNqxCYbHz7PnO8a9t/D/75lMGXnMP2A33nqCiaE9T.8i', 'female', TRUE, TRUE, NOW()),
('55555555-5555-5555-5555-555555555555', 'alex@example.com', 'alex_johnson', 'https://randomuser.me/api/portraits/men/5.jpg', '$2a$10$GF5DojSLsWNqxCYbHz7PnO8a9t/D/75lMGXnMP2A33nqCiaE9T.8i', 'male', TRUE, TRUE, NOW());

-- User profiles
INSERT INTO user_profiles (user_id, bio, birthday, relationship_status, interests, university, favorite_quotes, favorite_country, daily_active_time, study_abroad, leisure_activities) VALUES
('11111111-1111-1111-1111-111111111111', 'Computer Science student passionate about AI', '1995-05-15', 'single', 'programming, machine learning, hiking', 'MIT', 'The best way to predict the future is to invent it.', 'Japan', 'night', 'Yes, studied in Germany for a semester', 'gaming, reading, photography'),
('22222222-2222-2222-2222-222222222222', 'Psychology major with interest in UX design', '1997-03-22', 'in_relationship', 'psychology, design, art', 'Stanford', 'Be the change you wish to see in the world.', 'Italy', 'morning', 'Yes, exchange program in France', 'painting, yoga, cooking'),
('33333333-3333-3333-3333-333333333333', 'Engineering student working on robotics', '1996-11-08', 'single', 'robotics, electronics, football', 'CalTech', 'Innovation distinguishes between a leader and a follower.', 'Germany', 'evening', 'No', 'soccer, chess, electronics'),
('44444444-4444-4444-4444-444444444444', 'Journalism student and aspiring writer', '1998-07-17', 'single', 'writing, news, politics', 'Columbia', 'The pen is mightier than the sword.', 'France', 'afternoon', 'Yes, internship in UK', 'writing, reading, traveling'),
('55555555-5555-5555-5555-555555555555', 'Business major with focus on entrepreneurship', '1994-09-30', 'married', 'business, startups, finance', 'Harvard', 'Success is not final, failure is not fatal.', 'Singapore', 'morning', 'Yes, semester in Singapore', 'running, investing, networking');

-- Schools
INSERT INTO schools (id, name, code, domain, is_active) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Massachusetts Institute of Technology', 'MIT', 'mit.edu', TRUE),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Stanford University', 'STAN', 'stanford.edu', TRUE),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Harvard University', 'HARV', 'harvard.edu', TRUE),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'California Institute of Technology', 'CALT', 'caltech.edu', TRUE),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Columbia University', 'COLM', 'columbia.edu', TRUE);

-- Departments
INSERT INTO departments (id, school_id, name, code) VALUES
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Computer Science', 'CS'),
('gggggggg-gggg-gggg-gggg-gggggggggggg', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Psychology', 'PSY'),
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Engineering', 'ENG'),
('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Journalism', 'JOUR'),
('jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Business Administration', 'BUS');

-- Boards
INSERT INTO boards (id, name, slug, description, color, icon, visibility, anonymous, is_active) VALUES
('kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk', 'General Discussion', 'general', 'A place to discuss anything related to education', '#4285F4', 'chat-dots', 'public', TRUE, TRUE),
('llllllll-llll-llll-llll-llllllllllll', 'Study Abroad', 'study-abroad', 'Discuss experiences and opportunities for studying in other countries', '#DB4437', 'airplane', 'public', TRUE, TRUE),
('mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmm', 'Computer Science', 'computer-science', 'Discuss CS coursework, projects, and career opportunities', '#0F9D58', 'laptop-code', 'public', FALSE, TRUE),
('nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnnn', 'Student Life', 'student-life', 'Share experiences about campus living, activities, and events', '#F4B400', 'people-group', 'public', TRUE, TRUE),
('oooooooo-oooo-oooo-oooo-oooooooooooo', 'Career Advice', 'career-advice', 'Get tips on internships, jobs, and career development', '#4A148C', 'briefcase', 'public', FALSE, TRUE);

-- Posts
INSERT INTO posts (id, board_id, author_id, title, content, is_anonymous, gender, school, department, post_type, view_count, like_count, comment_count) VALUES
('pppppppp-pppp-pppp-pppp-pppppppppppp', 'kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk', '11111111-1111-1111-1111-111111111111', 'Welcome to EduSocial!', 'Hi everyone! Excited to be part of this community. Let''s share knowledge and help each other grow!', FALSE, 'male', 'Massachusetts Institute of Technology', 'Computer Science', 'general', 120, 15, 3),
('qqqqqqqq-qqqq-qqqq-qqqq-qqqqqqqqqqqq', 'llllllll-llll-llll-llll-llllllllllll', '22222222-2222-2222-2222-222222222222', 'My experience studying in France', 'I spent a semester in Paris and it was amazing! The culture, the food, and the academic environment were all incredible. I''d highly recommend it to anyone considering studying abroad.', FALSE, 'female', 'Stanford University', 'Psychology', 'sharing', 87, 21, 5),
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr', 'mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmm', '33333333-3333-3333-3333-333333333333', 'Tips for Algorithms course?', 'I''m struggling with my algorithms course. Any tips on how to approach the problem sets? Especially dynamic programming concepts?', TRUE, 'male', 'California Institute of Technology', 'Engineering', 'question', 65, 8, 7),
('ssssssss-ssss-ssss-ssss-ssssssssssss', 'nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnnn', '44444444-4444-4444-4444-444444444444', 'Best clubs to join on campus', 'What are some of the best student organizations to join for networking and making friends? I''m particularly interested in writing and journalism groups.', FALSE, 'female', 'Columbia University', 'Journalism', 'question', 92, 12, 8),
('tttttttt-tttt-tttt-tttt-tttttttttttt', 'oooooooo-oooo-oooo-oooo-oooooooooooo', '55555555-5555-5555-5555-555555555555', 'Internship opportunities for Business students', 'I''m looking for summer internship opportunities in the finance sector. Any recommendations for companies that have good programs for undergrads?', FALSE, 'male', 'Harvard University', 'Business Administration', 'question', 110, 14, 6);

-- Comments
INSERT INTO comments (id, post_id, author_id, content, is_anonymous, gender, school, department, like_count) VALUES
('uuuuuuuu-uuuu-uuuu-uuuu-uuuuuuuuuuuu', 'pppppppp-pppp-pppp-pppp-pppppppppppp', '22222222-2222-2222-2222-222222222222', 'Thanks for the warm welcome! Looking forward to connecting with everyone here.', FALSE, 'female', 'Stanford University', 'Psychology', 5),
('vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvvvvvv', 'pppppppp-pppp-pppp-pppp-pppppppppppp', '33333333-3333-3333-3333-333333333333', 'Great to be here! Hope we can all learn from each other.', FALSE, 'male', 'California Institute of Technology', 'Engineering', 3),
('wwwwwwww-wwww-wwww-wwww-wwwwwwwwwwww', 'qqqqqqqq-qqqq-qqqq-qqqq-qqqqqqqqqqqq', '11111111-1111-1111-1111-111111111111', 'That sounds amazing! Did you find the language barrier difficult to overcome?', FALSE, 'male', 'Massachusetts Institute of Technology', 'Computer Science', 4),
('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr', '55555555-5555-5555-5555-555555555555', 'Try breaking down the problems into smaller parts. Also, the book "Introduction to Algorithms" by CLRS really helped me.', FALSE, 'male', 'Harvard University', 'Business Administration', 6),
('yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy', 'ssssssss-ssss-ssss-ssss-ssssssssssss', '22222222-2222-2222-2222-222222222222', 'The student newspaper is always a great place to start for journalism majors! I also recommend joining debate club for developing critical thinking skills.', FALSE, 'female', 'Stanford University', 'Psychology', 7);

-- Votes (Likes)
INSERT INTO votes (id, user_id, post_id, comment_id, vote_type) VALUES
('zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz', '22222222-2222-2222-2222-222222222222', 'pppppppp-pppp-pppp-pppp-pppppppppppp', NULL, 'like'),
('aaaaaaaa-0000-0000-0000-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'pppppppp-pppp-pppp-pppp-pppppppppppp', NULL, 'like'),
('bbbbbbbb-0000-0000-0000-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', 'qqqqqqqq-qqqq-qqqq-qqqq-qqqqqqqqqqqq', NULL, 'like'),
('cccccccc-0000-0000-0000-cccccccccccc', '55555555-5555-5555-5555-555555555555', 'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr', NULL, 'like'),
('dddddddd-0000-0000-0000-dddddddddddd', '11111111-1111-1111-1111-111111111111', NULL, 'uuuuuuuu-uuuu-uuuu-uuuu-uuuuuuuuuuuu', 'like');

-- Favorites
INSERT INTO favorites (id, user_id, post_id) VALUES
('eeeeeeee-0000-0000-0000-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'qqqqqqqq-qqqq-qqqq-qqqq-qqqqqqqqqqqq'),
('ffffffff-0000-0000-0000-fffffffffffff', '22222222-2222-2222-2222-222222222222', 'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr'),
('gggggggg-0000-0000-0000-gggggggggggg', '33333333-3333-3333-3333-333333333333', 'ssssssss-ssss-ssss-ssss-ssssssssssss');

-- Followers
INSERT INTO followers (id, follower_id, following_id) VALUES
('hhhhhhhh-0000-0000-0000-hhhhhhhhhhhh', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'),
('iiiiiiii-0000-0000-0000-iiiiiiiiiiii', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333'),
('jjjjjjjj-0000-0000-0000-jjjjjjjjjjjj', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444'),
('kkkkkkkk-0000-0000-0000-kkkkkkkkkkkk', '44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555'),
('llllllll-0000-0000-0000-llllllllllll', '55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111');

-- Notifications
INSERT INTO notifications (id, user_id, type, title, content, triggered_by, is_read) VALUES
('mmmmmmmm-0000-0000-0000-mmmmmmmmmmmm', '11111111-1111-1111-1111-111111111111', 'like', 'New like on your post', 'Jane Smith liked your post "Welcome to EduSocial!"', '22222222-2222-2222-2222-222222222222', FALSE),
('nnnnnnnn-0000-0000-0000-nnnnnnnnnnnn', '22222222-2222-2222-2222-222222222222', 'comment', 'New comment on your post', 'John Doe commented on your post "My experience studying in France"', '11111111-1111-1111-1111-111111111111', TRUE),
('oooooooo-0000-0000-0000-oooooooooooo', '33333333-3333-3333-3333-333333333333', 'reply', 'New reply to your comment', 'Alex Johnson replied to your comment', '55555555-5555-5555-5555-555555555555', FALSE),
('pppppppp-0000-0000-0000-pppppppppppp', '44444444-4444-4444-4444-444444444444', 'follow', 'New follower', 'Mike Wilson started following you', '33333333-3333-3333-3333-333333333333', FALSE);

-- Hashtags
INSERT INTO hashtags (id, name, usage_count) VALUES
('qqqqqqqq-0000-0000-0000-qqqqqqqqqqqq', 'education', 25),
('rrrrrrrr-0000-0000-0000-rrrrrrrrrrrr', 'studyabroad', 18),
('ssssssss-0000-0000-0000-ssssssssssss', 'computerscience', 32),
('tttttttt-0000-0000-0000-tttttttttttt', 'studentlife', 47),
('uuuuuuuu-0000-0000-0000-uuuuuuuuuuuu', 'careeradvice', 21);

-- Post hashtags
INSERT INTO post_hashtags (id, post_id, hashtag_id) VALUES
('vvvvvvvv-0000-0000-0000-vvvvvvvvvvvv', 'pppppppp-pppp-pppp-pppp-pppppppppppp', 'qqqqqqqq-0000-0000-0000-qqqqqqqqqqqq'),
('wwwwwwww-0000-0000-0000-wwwwwwwwwwww', 'qqqqqqqq-qqqq-qqqq-qqqq-qqqqqqqqqqqq', 'rrrrrrrr-0000-0000-0000-rrrrrrrrrrrr'),
('xxxxxxxx-0000-0000-0000-xxxxxxxxxxxx', 'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr', 'ssssssss-0000-0000-0000-ssssssssssss'),
('yyyyyyyy-0000-0000-0000-yyyyyyyyyyyy', 'ssssssss-ssss-ssss-ssss-ssssssssssss', 'tttttttt-0000-0000-0000-tttttttttttt'),
('zzzzzzzz-0000-0000-0000-zzzzzzzzzzzz', 'tttttttt-tttt-tttt-tttt-tttttttttttt', 'uuuuuuuu-0000-0000-0000-uuuuuuuuuuuu');

-- Topics
INSERT INTO topics (id, name, description) VALUES
('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'Study Tips', 'Effective study methods and productivity tips'),
('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Campus Life', 'Everything related to living and socializing on campus'),
('cccccccc-1111-1111-1111-cccccccccccc', 'Technology', 'Latest tech trends and discussions'),
('dddddddd-1111-1111-1111-dddddddddddd', 'Career Development', 'Tips for professional growth and job hunting'),
('eeeeeeee-1111-1111-1111-eeeeeeeeeeee', 'Research Opportunities', 'Information about research projects and collaborations');

-- User topic subscriptions
INSERT INTO user_topic_subscriptions (id, user_id, topic_id) VALUES
('ffffffff-1111-1111-1111-ffffffffffff', '11111111-1111-1111-1111-111111111111', 'cccccccc-1111-1111-1111-cccccccccccc'),
('gggggggg-1111-1111-1111-gggggggggggg', '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb'),
('hhhhhhhh-1111-1111-1111-hhhhhhhhhhhh', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa'),
('iiiiiiii-1111-1111-1111-iiiiiiiiiiii', '44444444-4444-4444-4444-444444444444', 'dddddddd-1111-1111-1111-dddddddddddd'),
('jjjjjjjj-1111-1111-1111-jjjjjjjjjjjj', '55555555-5555-5555-5555-555555555555', 'eeeeeeee-1111-1111-1111-eeeeeeeeeeee');

-- User interests
INSERT INTO user_interests (id, user_id, topic_id, weight) VALUES
('kkkkkkkk-1111-1111-1111-kkkkkkkkkkkk', '11111111-1111-1111-1111-111111111111', 'cccccccc-1111-1111-1111-cccccccccccc', 0.9),
('llllllll-1111-1111-1111-llllllllllll', '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 0.8),
('mmmmmmmm-1111-1111-1111-mmmmmmmmmmmm', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 0.7),
('nnnnnnnn-1111-1111-1111-nnnnnnnnnnnn', '44444444-4444-4444-4444-444444444444', 'dddddddd-1111-1111-1111-dddddddddddd', 0.85),
('oooooooo-1111-1111-1111-oooooooooooo', '55555555-5555-5555-5555-555555555555', 'eeeeeeee-1111-1111-1111-eeeeeeeeeeee', 0.75);

INSERT INTO user_interests (id, user_id, tag_id, weight) VALUES
('pppppppp-1111-1111-1111-pppppppppppp', '11111111-1111-1111-1111-111111111111', 'ssssssss-0000-0000-0000-ssssssssssss', 0.95),
('qqqqqqqq-1111-1111-1111-qqqqqqqqqqqq', '22222222-2222-2222-2222-222222222222', 'rrrrrrrr-0000-0000-0000-rrrrrrrrrrrr', 0.9),
('rrrrrrrr-1111-1111-1111-rrrrrrrrrrrr', '33333333-3333-3333-3333-333333333333', 'qqqqqqqq-0000-0000-0000-qqqqqqqqqqqq', 0.85),
('ssssssss-1111-1111-1111-ssssssssssss', '44444444-4444-4444-4444-444444444444', 'tttttttt-0000-0000-0000-tttttttttttt', 0.8),
('tttttttt-1111-1111-1111-tttttttttttt', '55555555-5555-5555-5555-555555555555', 'uuuuuuuu-0000-0000-0000-uuuuuuuuuuuu', 0.9);

-- Admin users
INSERT INTO admin_users (id, user_id, role) VALUES
('uuuuuuuu-1111-1111-1111-uuuuuuuuuuuu', '11111111-1111-1111-1111-111111111111', 'superadmin');

-- User preferences
INSERT INTO user_preferences (id, user_id, settings, language) VALUES
('vvvvvvvv-1111-1111-1111-vvvvvvvvvvvv', '11111111-1111-1111-1111-111111111111', '{"notifications": true, "darkMode": true, "emailDigest": "weekly"}', 'en-US'),
('wwwwwwww-1111-1111-1111-wwwwwwwwwwww', '22222222-2222-2222-2222-222222222222', '{"notifications": true, "darkMode": false, "emailDigest": "daily"}', 'en-US'),
('xxxxxxxx-1111-1111-1111-xxxxxxxxxxxx', '33333333-3333-3333-3333-333333333333', '{"notifications": false, "darkMode": true, "emailDigest": "never"}', 'en-US'),
('yyyyyyyy-1111-1111-1111-yyyyyyyyyyyy', '44444444-4444-4444-4444-444444444444', '{"notifications": true, "darkMode": false, "emailDigest": "weekly"}', 'en-US'),
('zzzzzzzz-1111-1111-1111-zzzzzzzzzzzz', '55555555-5555-5555-5555-555555555555', '{"notifications": true, "darkMode": true, "emailDigest": "daily"}', 'en-US');

-- Badges
INSERT INTO badges (id, name, description, icon_url) VALUES
('aaaaaaaa-2222-2222-2222-aaaaaaaaaaaa', 'Early Adopter', 'Joined during the beta phase', '/badges/early-adopter.png'),
('bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', 'Helpful Member', 'Provided valuable answers to 10+ questions', '/badges/helpful.png'),
('cccccccc-2222-2222-2222-cccccccccccc', 'Content Creator', 'Created 20+ quality posts', '/badges/creator.png');

-- User badges
INSERT INTO user_badges (id, user_id, badge_id) VALUES
('dddddddd-2222-2222-2222-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-2222-2222-2222-aaaaaaaaaaaa'),
('eeeeeeee-2222-2222-2222-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb'),
('ffffffff-2222-2222-2222-fffffffffffff', '33333333-3333-3333-3333-333333333333', 'cccccccc-2222-2222-2222-cccccccccccc');

-- Board followers
INSERT INTO board_followers (id, user_id, board_id) VALUES
('gggggggg-2222-2222-2222-gggggggggggg', '11111111-1111-1111-1111-111111111111', 'mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmm'),
('hhhhhhhh-2222-2222-2222-hhhhhhhhhhhh', '22222222-2222-2222-2222-222222222222', 'llllllll-llll-llll-llll-llllllllllll'),
('iiiiiiii-2222-2222-2222-iiiiiiiiiiii', '33333333-3333-3333-3333-333333333333', 'kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk'),
('jjjjjjjj-2222-2222-2222-jjjjjjjjjjjj', '44444444-4444-4444-4444-444444444444', 'nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnnn'),
('kkkkkkkk-2222-2222-2222-kkkkkkkkkkkk', '55555555-5555-5555-5555-555555555555', 'oooooooo-oooo-oooo-oooo-oooooooooooo');

-- Post media (images for posts)
INSERT INTO post_media (id, post_id, media_type, file_url, file_size, width, height) VALUES
('llllllll-2222-2222-2222-llllllllllll', 'qqqqqqqq-qqqq-qqqq-qqqq-qqqqqqqqqqqq', 'image', 'https://example.com/images/paris1.jpg', 2048000, 1200, 800),
('mmmmmmmm-2222-2222-2222-mmmmmmmmmmmm', 'qqqqqqqq-qqqq-qqqq-qqqq-qqqqqqqqqqqq', 'image', 'https://example.com/images/paris2.jpg', 1536000, 1024, 768),
('nnnnnnnn-2222-2222-2222-nnnnnnnnnnnn', 'ssssssss-ssss-ssss-ssss-ssssssssssss', 'image', 'https://example.com/images/campus.jpg', 1843200, 1280, 720);

-- Chat rooms (group chats)
INSERT INTO chat_rooms (id, name, room_type, is_active) VALUES
('oooooooo-2222-2222-2222-oooooooooooo', 'Computer Science Study Group', 'group', TRUE),
('pppppppp-2222-2222-2222-pppppppppppp', 'Study Abroad Alumni', 'group', TRUE),
('qqqqqqqq-2222-2222-2222-qqqqqqqqqqqq', NULL, 'direct', TRUE);

-- Chat participants
INSERT INTO chat_participants (id, chat_room_id, user_id, is_admin) VALUES
('rrrrrrrr-2222-2222-2222-rrrrrrrrrrrr', 'oooooooo-2222-2222-2222-oooooooooooo', '11111111-1111-1111-1111-111111111111', TRUE),
('ssssssss-2222-2222-2222-ssssssssssss', 'oooooooo-2222-2222-2222-oooooooooooo', '33333333-3333-3333-3333-333333333333', FALSE),
('tttttttt-2222-2222-2222-tttttttttttt', 'pppppppp-2222-2222-2222-pppppppppppp', '22222222-2222-2222-2222-222222222222', TRUE),
('uuuuuuuu-2222-2222-2222-uuuuuuuuuuuu', 'pppppppp-2222-2222-2222-pppppppppppp', '44444444-4444-4444-4444-444444444444', FALSE),
('vvvvvvvv-2222-2222-2222-vvvvvvvvvvvv', 'qqqqqqqq-2222-2222-2222-qqqqqqqqqqqq', '11111111-1111-1111-1111-111111111111', FALSE),
('wwwwwwww-2222-2222-2222-wwwwwwwwwwww', 'qqqqqqqq-2222-2222-2222-qqqqqqqqqqqq', '22222222-2222-2222-2222-222222222222', FALSE);

-- Chat messages
INSERT INTO chat_messages (id, chat_room_id, sender_id, message_type, content) VALUES
('xxxxxxxx-2222-2222-2222-xxxxxxxxxxxx', 'oooooooo-2222-2222-2222-oooooooooooo', '11111111-1111-1111-1111-111111111111', 'text', 'Hello everyone! Welcome to our CS study group.'),
('yyyyyyyy-2222-2222-2222-yyyyyyyyyyyy', 'oooooooo-2222-2222-2222-oooooooooooo', '33333333-3333-3333-3333-333333333333', 'text', 'Thanks for creating this group! When is our first study session?'),
('zzzzzzzz-2222-2222-2222-zzzzzzzzzzzz', 'pppppppp-2222-2222-2222-pppppppppppp', '22222222-2222-2222-2222-222222222222', 'text', 'Hi all! Let''s share our favorite memories from studying abroad.'),
('aaaaaaaa-3333-3333-3333-aaaaaaaaaaaa', 'qqqqqqqq-2222-2222-2222-qqqqqqqqqqqq', '11111111-1111-1111-1111-111111111111', 'text', 'Hey Jane, how are your classes going this semester?'); 