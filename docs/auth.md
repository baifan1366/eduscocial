# Authentication Documentation

This document describes the authentication system implemented in the EduSocial application.

## Overview

The authentication system in EduSocial is built using NextAuth.js and enhanced with Redis for session management and online status tracking. It provides:

- Email/password authentication
- OAuth authentication with various providers (Google, etc.)
- Session management with Redis
- Online status tracking
- Provider token storage for OAuth

## Authentication Methods

### Email/Password Authentication

Traditional email and password-based authentication:

```js
import { loginUser } from '@/lib/auth';

// Login user
const { user, session } = await loginUser({
  email: 'student@university.edu',
  password: 'securepassword'
});
```

### OAuth Authentication

OAuth-based authentication with various providers:

- Google
- (Other providers can be added)

## User Session Management

User sessions are managed in Redis for real-time access and improved performance.

### How it works:

1. When a user logs in (either with credentials or OAuth), their session data is stored in Redis
2. The session data includes user information and authentication details
3. Sessions have a configurable TTL (default: 24 hours)
4. User online status is updated with each session action
5. On logout, the session is removed from Redis

### Key Redis functions:

```js
import { storeUserSession, getUserSession, removeUserSession } from '@/lib/redis/redisUtils';

// Store a user session
await storeUserSession(userId, sessionData);

// Get an existing session
const session = await getUserSession(userId);

// Remove a session on logout
await removeUserSession(userId);
```

## Online Status Tracking

User online status is tracked in real-time using Redis:

```js
import { updateUserOnlineStatus, isUserOnline, getOnlineUsers } from '@/lib/redis/redisUtils';

// Update status
await updateUserOnlineStatus(userId, true); // Online
await updateUserOnlineStatus(userId, false); // Offline

// Check if a user is online
const online = await isUserOnline(userId);

// Get all online users
const onlineUsers = await getOnlineUsers();
```

## OAuth Token Management

OAuth tokens are securely stored in Redis with appropriate expiration times:

```js
import { storeProviderTokens, getProviderTokens } from '@/lib/redis/redisUtils';

// Store tokens
await storeProviderTokens(userId, 'google', {
  access_token: 'abc123',
  refresh_token: 'xyz789',
  expires_at: 1644271847,
  token_type: 'Bearer'
});

// Get tokens
const tokens = await getProviderTokens(userId, 'google');
```

## Authentication Flow

### Login Flow:

1. User submits credentials (email/password) or authenticates with OAuth
2. User is authenticated against the database
3. If successful:
   - User session is stored in Redis
   - Online status is updated to "online"
   - For OAuth, provider tokens are stored in Redis
   - User info is returned to client
4. If unsuccessful, an error is returned

### Logout Flow:

1. User requests to logout
2. User session is removed from Redis
3. Online status is updated to "offline"
4. Success response is sent to client

## Educational Email Requirement

EduSocial restricts registration to users with educational email addresses:

```js
import { isEducationalEmail } from '@/lib/auth';

// Check if email is from an educational institution
const isEdu = isEducationalEmail('student@university.edu'); // true
const isNotEdu = isEducationalEmail('user@gmail.com'); // false
```

The system checks for common educational domains like `.edu`, `.ac.`, and keywords like "university", "school", etc.

## 密码处理

### Bcrypt 密码哈希

系统使用 bcrypt 库进行密码哈希和验证。这是一种行业标准的加密哈希函数，专门为密码存储设计。

#### 特点

- 集成了盐（salt）功能，每次生成的哈希都不同
- 可配置的工作因子（work factor），默认设置为10
- 防止彩虹表攻击
- 自动包含版本、工作因子和盐信息

#### API

```js
// 哈希密码
const hashedPassword = await hashPassword(plainTextPassword);

// 验证密码
const isMatch = await comparePassword(plainTextPassword, hashedPassword);
```

#### 密码验证规则

所有用户密码必须符合以下条件：

1. 最少8个字符
2. 至少包含一个数字
3. 至少包含一个大写字母
4. 至少包含一个小写字母
5. 至少包含一个特殊字符

## API Routes

### Login:
```
POST /api/auth/login
Body: { email, password }
```

### Logout:
```
POST /api/auth/logout
```

### Register:
```
POST /api/auth/register
Body: { name, email, password }
```

### NextAuth Routes:
```
GET/POST /api/auth/[...nextauth]
```

## Security Considerations

- Passwords are hashed using bcrypt
- Sessions are stored with TTL to prevent stale sessions
- OAuth tokens have appropriate expiration
- Only educational emails are allowed
- JWT tokens are secured with a secret key 