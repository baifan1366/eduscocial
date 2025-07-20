
# Dcard-like App Database Documentation

## 🧑‍🎓 Users 模块

### 1. 用户核心信息
| Table | 描述 |
|-------|------|
| `users` | 主用户表，记录基本信息（如 email, username, password, 性别等） |
| `user_profiles` | 用户扩展资料（如兴趣、大学、喜好、作息等）|
| `user_preferences` | 用户偏好设置（语言、通知等） |
| `user_providers` | OAuth 登录信息，如 Google / GitHub |
| `user_sessions` | 用户登录 session 与设备信息 |

### 2. 用户行为与互动
| Table | 描述 |
|-------|------|
| `posts` | 用户发布的文章 |
| `comments` | 用户对文章的评论（支持楼中楼） |
| `votes` | 对文章或评论的点赞 / 点踩 |
| `favorites` | 收藏的文章 |
| `followers` | 用户之间的关注关系 |
| `user_interests` | 用户偏好的标签或主题，用于推荐系统 |
| `user_topic_subscriptions` | 用户订阅的话题 |
| `daily_matches` | 每日配对功能 |
| `messages` | 用户之间的私信 |
| `message_read_status` | 消息的已读状态 |
| `blocked_users` | 拉黑用户列表 |
| `user_wall_posts` | 用户个人墙的贴文 |
| `user_wall_settings` | 墙设定：隐私、样式等 |
| `user_badges` | 用户获得的徽章 |
| `user_mfa` | 多重认证（App/SMS/Email）配置 |
| `user_report_history` | 用户提交的举报记录 |

## 🛡️ Admin 模块

### 1. 管理员账号与权限
| Table | 描述 |
|-------|------|
| `admin_users` | 管理员信息（来源于 users）|
| `admin_sessions` | 管理员 session 数据 |
| `action_log` | 管理员在系统中的行为日志 |
| `content_moderation` | 管理员审核内容（贴文/评论/媒体） |

### 2. 举报与审查
| Table | 描述 |
|-------|------|
| `reports` | 用户举报内容（评论 / 帖文） |
| `content_versions` | 帖文 / 评论的历史版本 |
| `content_moderation` | AI 或人工的内容审核流程与结果 |

## 🏢 Business 模块

### 1. 商业用户账号与登录
| Table | 描述 |
|-------|------|
| `business_users` | 广告主账号信息（非 users）|
| `business_sessions` | 商业用户的 session |

### 2. 广告与行销系统
| Table | 描述 |
|-------|------|
| `promotion_requests` | 商业用户提交的推广请求 |
| `ad_campaigns` | 广告投放主表（关联 request） |
| `ad_performance` | 广告投放绩效（曝光、点击、花费）|
| `ad_placements` | 指定广告在哪些区域投放 |
| `promotion_rules` | 推广活动的触发规则（如门槛/时间）|
| `promotion_targets` | 推广对象（用户段、看板等）|
| `ads` | 广告内容表 |
| `influencer_campaigns` | 影响者合作计划 |
| `trial_campaigns` | 商品试用活动 |
| `trial_participants` | 用户参与试用的记录 |

## 🌐 Public 模块（平台通用/系统内容）

### 1. 社群内容与结构
| Table | 描述 |
|-------|------|
| `boards` | 看板设定（名称、分类、是否匿名）|
| `board_categories` | 看板类别（有 parent_id 支持多层）|
| `board_category_mappings` | 看板与类别的映射表 |
| `board_followers` | 用户关注的看板 |
| `topics` | 话题主题（类似兴趣领域）|
| `hashtags` | 标签（#关键词）|
| `post_hashtags` | 帖文与标签的映射 |
| `post_media` | 帖子附加的媒体文件 |
| `anonymous_avatars` | 匿名发言所用头像 |
| `anonymous_avatar_assignments` | 匿名头像分配记录 |

### 2. 商店与商品系统
| Table | 描述 |
|-------|------|
| `store_products` | 商品列表 |
| `store_orders` | 商品订单 |

### 3. 广告追踪与分析
| Table | 描述 |
|-------|------|
| `ad_pixels` | 嵌入式 pixel 脚本 |
| `ad_pixel_events` | 用户触发的 pixel 事件 |
| `landing_pages` | 广告专属落地页 |
| `audience_segments` | 广告受众群体 |
| `campaign_segments` | 广告与受众映射表 |

### 4. 即时通讯 & 活动
| Table | 描述 |
|-------|------|
| `chat_rooms` | 群组/配对聊天室 |
| `chat_participants` | 聊天室成员 |
| `chat_messages` | 聊天记录 |
| `events` | 用户发起的活动 |
| `event_attendees` | 参与者名单 |

## 🔗 关联逻辑总结

| 实体 | 影响范围 |
|------|----------|
| `users.id` | 几乎是所有互动型表（如 posts, comments, votes, messages, notifications, reports）核心外键 |
| `admin_users.user_id` | 从 users 表衍生，用于区分权限与操作能力 |
| `business_users` | 独立表，与广告投放系统（如 ads, promotion_requests）强相关 |
| 匿名机制 | `anonymous_avatars` + `anonymous_avatar_assignments` 应用于 post/comment/message 的匿名化处理 |
