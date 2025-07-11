# 数据库关系图与流程

## 核心用户模块
- **users**: 系统核心用户表，存储用户基本信息
- **schools**: 学校信息表，与用户多对多关联
- **departments**: 学校部门表，隶属于schools表
- **followers**: 用户关注关系表，自引用users表
- **blocked_users**: 用户屏蔽关系表，自引用users表
- **user_preferences**: 用户偏好设置表，包含语言设置
- **user_wall_settings**: 用户墙面设置表，控制个人主页自定义选项
- **user_wall_posts**: 用户墙面帖子表，存储发布在用户个人主页的内容
- **user_mfa**: 用户多因素认证设置表

## 内容模块
- **boards**: 论坛板块表
- **board_categories**: 看板分类表，支持层级分类结构
- **board_category_mappings**: 看板和分类的关联表
- **board_followers**: 用户关注的看板表
- **posts**: 用户发帖表，关联到boards和users
- **comments**: 评论表，可关联到posts或父评论
- **post_media**: 帖子媒体内容表，关联到posts
- **votes**: 投票表，用于帖子和评论的点赞/踩
- **favorites**: 用户收藏帖子表
- **hashtags**: 话题标签表
- **post_hashtags**: 帖子与话题标签的关联表
- **reports**: 内容举报表，可关联到posts或comments
- **post_embeddings**: 帖子向量嵌入表，用于语义搜索
- **content_moderation**: 内容审核表，记录审核状态和结果

## 通知与消息
- **notifications**: 系统通知表，关联到users
- **messages**: 用户私信表，关联发送者和接收者

## 聊天系统
- **chat_rooms**: 聊天室表，支持一对一和群组聊天
- **chat_participants**: 聊天室参与者表
- **chat_messages**: 聊天消息表，支持多种消息类型

## 匿名功能
- **anonymous_avatars**: 匿名头像表
- **anonymous_avatar_assignments**: 用户匿名头像分配表

## 订阅与高级功能
- **subscriptions**: 用户订阅计划表
- **premium_features**: 高级功能表
- **user_premium_features**: 用户拥有的高级功能关联表

## 商店系统
- **store_products**: 商店产品表
- **store_orders**: 用户订单表

## 徽章系统
- **badges**: 徽章表
- **user_badges**: 用户获得的徽章关联表

## 活动系统
- **events**: 活动表
- **event_attendees**: 活动参与者表

## 广告与营销系统
- **advertisers**: 广告商表
- **admin_users**: 管理员用户表
- **promotion_requests**: 推广请求表
- **ad_campaigns**: 广告活动表
- **ad_performance**: 广告效果统计表
- **ads**: 广告内容表
- **ad_placements**: 广告投放位置表
- **promotion_rules**: 推广规则表
- **promotion_targets**: 推广目标表
- **ad_pixels**: 广告追踪像素表
- **ad_pixel_events**: 广告像素事件表
- **landing_pages**: 广告着陆页表
- **audience_segments**: 受众细分表
- **campaign_segments**: 活动受众关联表

## 兴趣话题系统
- **topics**: 话题表
- **user_topic_subscriptions**: 用户订阅话题关联表

## 社交匹配系统
- **daily_matches**: 日常匹配表，匹配用户之间的关系

## 影响者与试用活动
- **influencer_campaigns**: 影响者营销活动表
- **trial_campaigns**: 试用活动表
- **trial_participants**: 试用活动参与者表

## 系统监控
- **action_log**: 用户行为日志表，记录系统中的重要操作和变更

## 主要数据流程

1. **用户注册与身份验证流程**:
   - 用户注册信息存储在users表
   - 学校和部门信息关联到schools和departments表
   - 用户设置存储在user_preferences表
   - 用户个人墙面设置存储在user_wall_settings表
   - 多因素认证设置存储在user_mfa表
   - 支持多语言界面通过user_preferences的language字段

2. **社交网络流程**:
   - 用户可以通过followers表关注其他用户
   - 用户可以通过board_followers表关注感兴趣的看板
   - 可以通过blocked_users表屏蔽不想交流的用户
   - daily_matches表提供每日用户匹配功能
   - 用户可以在他人的墙上发布user_wall_posts，实现直接互动

3. **内容发布与互动流程**:
   - 用户在指定board发布post
   - 用户可以在自己或他人的墙上发布wall_post
   - 其他用户可以对post发表comment
   - 用户可以通过votes表对内容点赞/踩
   - 用户可以通过favorites表收藏内容
   - 内容可以通过hashtags和topics进行分类
   - 发布的内容自动生成search_vector用于全文搜索
   - 部分内容生成向量嵌入存储在post_embeddings表用于语义搜索

4. **聊天系统**:
   - 用户可以创建chat_rooms进行一对一或群组聊天
   - chat_participants记录聊天参与者，支持添加/移除成员
   - 聊天消息保存在chat_messages表，支持文本、图片、视频等多种类型
   - 用户可通过last_read_at字段跟踪未读消息

5. **匿名系统**:
   - 用户可以使用anonymous_avatars来保持匿名
   - anonymous_avatar_assignments记录用户与匿名头像的关联

6. **内容审核与管理**:
   - 所有发布的内容经过content_moderation表记录的审核流程
   - 支持文本、图片、视频等多种内容类型的审核
   - 被举报的内容记录在reports表中，等待管理员处理
   - action_log记录系统中的所有重要操作，便于审计和问题排查

7. **内容发现与推荐**:
   - 用户可以通过全文搜索查找内容（使用search_vector）
   - 用户可以通过向量搜索找到语义相关内容（使用post_embeddings）
   - 看板分类通过board_categories表组织，支持多级分类
   - 用户可以关注感兴趣的看板和话题，获得个性化推荐

8. **订阅与高级功能**:
   - 用户可以通过subscriptions表订阅高级服务
   - premium_features和user_premium_features控制用户可用的高级功能

9. **商店系统**:
   - store_products表定义可购买的产品
   - store_orders表记录用户购买记录

10. **活动系统**:
    - events表记录各类活动
    - event_attendees表记录用户参与情况

11. **广告系统**:
    - advertisers表记录广告商信息
    - ad_campaigns表管理广告活动
    - ad_performance表记录广告效果
    - promotion_targets和audience_segments表定义目标受众

12. **内容管理与举报**:
    - reports表记录用户举报的内容
    - admin_users表定义有权限处理举报的管理员
    - action_log记录系统中的所有重要操作，便于审计和问题排查

13. **用户墙面系统**:
    - 每个用户拥有一个可定制的个人墙面
    - user_wall_settings控制墙面的外观和权限设置
    - user_wall_posts存储发布在墙面上的内容
    - 用户可以设置墙面的可见性、评论权限和发帖权限