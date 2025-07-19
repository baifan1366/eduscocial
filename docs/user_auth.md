# 用户认证系统

## 密码存储方案

在EduSocial系统中，用户密码使用安全的哈希方式存储在数据库中。以下是关于密码存储的关键信息：

### 数据库结构

在`users`表中，密码以哈希形式存储在`password_hash`字段中：

```sql
CREATE TABLE users (
    ...
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    password_hash TEXT NOT NULL,  -- 存储哈希后的密码
    ...
);
```

### 哈希处理

密码通过`bcrypt`进行哈希处理，实现在`lib/auth/password.js`中：

```javascript
import bcrypt from 'bcrypt';

/**
 * 对密码进行哈希处理
 * 
 * @param {string} password - 明文密码
 * @returns {string} 哈希后的密码
 */
export async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * 比较密码与哈希值是否匹配
 * 
 * @param {string} password - 要检查的明文密码
 * @param {string} hash - 数据库中的哈希密码
 * @returns {Promise<boolean>} 密码是否匹配哈希值
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}
```

### 用户注册流程

1. 用户提交注册信息
2. 服务器接收邮箱、用户名和密码
3. 密码使用`hashPassword`函数进行哈希处理
4. 将哈希后的密码存储在`password_hash`字段中
5. 其他用户信息一同保存到数据库

### 用户登录流程

1. 用户提交登录凭证（邮箱和密码）
2. 通过邮箱查询用户记录
3. 使用`comparePassword`函数比较提交的密码与存储的哈希是否匹配
4. 如果匹配，则生成会话并允许用户登录

### 安全注意事项

- 永远不要存储明文密码
- 密码哈希使用适当的工作因子（salt rounds = 10）
- 在传输过程中确保使用HTTPS加密
- 定期审核密码安全策略 