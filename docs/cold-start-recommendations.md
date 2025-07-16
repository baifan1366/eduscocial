# Cold-Start Recommendation System

本文档描述了EduSocial的冷启动推荐系统实现，该系统有助于新用户在首次访问时发现相关内容。

## 概述

冷启动问题是指为没有先前交互历史的新用户提供个性化推荐的挑战。我们的解决方案结合使用：

1. 对首次访问用户提供热门内容推荐
2. 为新用户提供兴趣选择对话框以表达偏好
3. 使用Redis缓存提高内容传递效率
4. 一旦用户兴趣确立，提供个性化推荐

## 实现组件

### 1. API路由

系统使用以下API路由进行推荐和兴趣管理：

- `/api/recommend/trending` - 获取热门帖子
- `/api/recommend/tags` - 获取热门标签
- `/api/recommend/topics` - 获取主题分类
- `/api/recommend/interests` - 保存用户兴趣
- `/api/recommend/home` - 获取主页帖子（根据用户ID个性化）
- `/api/recommend/check-new-user` - 检查用户是否为新用户

### 2. Redis工具函数

位于`lib/redis/redisUtils.js`，这些函数处理：

- 缓存热门/趋势帖子(`cacheHotPosts`, `getHotPosts`)
- 存储和检索趋势标签(`cacheTrendingTags`, `getTrendingTags`)
- 管理用户兴趣(`storeUserInterests`, `getUserInterests`)
- 检查用户是否是新用户(`isNewUser`)
- 缓存个性化推荐(`cachePersonalizedRecommendations`, `getPersonalizedRecommendations`)

### 3. 评分逻辑

位于`lib/recommend/scoring.js`，包含：

- `calculatePostScore`：基于用户兴趣计算帖子相关性
- `calculateDiversityScore`：确保推荐多样性
- `getRecommendationScore`：结合相关性和多样性的最终评分

### 4. 兴趣选择对话框

位于`components/onboarding/InterestSelectionDialog.jsx`，此组件：

- 为新用户呈现一个对话框选择兴趣
- 显示热门标签和主题分类
- 处理用户选择的保存

### 5. 主页实现

位于`app/[locale]/page.js`，此组件：

- 通过API检测新用户并显示兴趣选择对话框
- 获取并显示推荐帖子
- 在兴趣选择后刷新内容

## 数据库模式集成

该实现利用了我们模式中的多个表：

- `posts`：推荐内容的来源
- `hashtags`和`post_hashtags`：用于基于标签的推荐
- `topics`：按主题分类内容
- `user_interests`：存储用户偏好
- `users`：用户身份验证和识别

## Redis数据结构

系统使用以下Redis键：

- `hot_posts`：热门帖子的JSON字符串（TTL：1小时）
- `trending_tags`：热门标签的JSON字符串（TTL：6小时）
- `user:{userId}:interests`：用户兴趣的JSON字符串（持久）
- `user:{userId}:recommended_posts`：个性化推荐的JSON字符串（TTL：15分钟）
- `user:{userId}:session`：包含会话数据的哈希（TTL：24小时）

## 冷启动算法

1. 对于未认证用户：
   - 显示基于浏览量、点赞数和时间的热门帖子

2. 对于新认证用户：
   - 在首次登录时显示兴趣选择对话框
   - 初始显示热门帖子
   - 兴趣选择后，个性化推荐

3. 对于返回用户：
   - 检查Redis缓存中的个性化推荐
   - 如果未找到，则基于兴趣生成推荐
   - 缓存结果以供将来请求使用

## 性能考虑

- Redis缓存减少数据库负载
- 不同数据类型的分级缓存过期时间
- 后台作业可以为活跃用户预生成推荐
- 帖子评分算法平衡相关性和时效性

## 未来改进

- 实现协同过滤以获得更精确的推荐
- 使用帖子嵌入向量添加基于内容的过滤
- 纳入用户行为分析（点击模式、阅读时间）
- 对推荐算法进行A/B测试
- 定期重新训练推荐模型

## 前后端分离

- 所有推荐逻辑都在后端API路由中实现
- 前端组件通过API请求获取数据
- 服务器组件使用API路由获取初始数据
- 客户端组件处理用户交互和状态更新 