# 推荐系统文档

## 系统架构概述

我们的推荐系统采用多阶段架构，由以下核心模块组成：

1. **用户兴趣向量生成（User Embedding）**：从用户行为数据中提取兴趣特征
2. **召回阶段（Recall）**：基于向量相似度快速筛选出潜在相关内容
3. **排序阶段（Ranking）**：对候选内容进行精确评分和排序
4. **统一推荐 API**：集成所有阶段的完整推荐流程
5. **定时任务系统**：维护和优化推荐系统性能

## 1. 用户兴趣向量生成

### 工作原理

用户兴趣向量（User Embedding）是对用户偏好的数字化表示，通过以下数据源生成：

- 用户与帖子的交互行为（浏览、点赞、评论等）
- 交互帖子的内容向量加权聚合

### 实现细节

- **数据收集**：所有用户行为记录在 `action_log` 表中
- **加权机制**：不同交互类型具有不同权重
  | 交互类型 | 权重 |
  |---------|------|
  | 浏览    | 1    |
  | 点赞    | 5    |
  | 评论    | 8    |
  | 收藏    | 7    |
  | 分享    | 10   |
- **向量生成**：通过加权平均计算用户兴趣向量
- **存储方式**：同时存储在数据库和 Redis 缓存中

### 关键函数

```javascript
// 生成用户兴趣向量
async function generateUserInterestEmbedding(userId, options = {})

// 批量处理用户向量
async function processBatchUserEmbeddings(userIds, options = {})
```

### 定时更新

通过 QStash 调度，每 2 小时更新一次活跃用户的兴趣向量：
```javascript
scheduleUserEmbeddingGeneration('0 */2 * * *');
```

## 2. 召回阶段（Recall）

### 工作原理

召回阶段负责从大量内容中（数万帖子）高效筛选出潜在相关的候选内容（约 1000 条），使用向量相似度搜索实现。

### 技术实现

我们利用 PostgreSQL 的 pgvector 扩展实现高效向量搜索：

```sql
-- 基于用户向量查找相似帖子的函数
CREATE OR REPLACE FUNCTION match_posts_to_user(
  user_embedding vector(384),  -- 用户兴趣向量
  match_limit int DEFAULT 1000, -- 返回结果数量上限
  exclude_posts uuid[] DEFAULT '{}'::uuid[] -- 排除的帖子
) 
RETURNS TABLE (post_id uuid, similarity float)
```

### 关键特性

1. **余弦相似度**：
   - pgvector 的 `<=>` 运算符测量向量间的余弦距离
   - 使用 `1 - distance` 转换为相似度（越高越相似）

2. **HNSW 索引**：
   - 分层可导航小世界图索引，显著提高搜索效率
   ```sql
   CREATE INDEX post_embeddings_vector_idx 
   ON post_embeddings 
   USING hnsw (embedding vector_cosine_ops)
   WITH (m = 16, ef_construction = 64);
   ```

3. **结果缓存**：
   - Redis 缓存召回结果，有效期为 2 小时
   - 可通过参数强制刷新

### API 使用

```
GET /api/recommend/recall
```

查询参数：
- `limit`：返回结果数量上限（默认: 1000）
- `refresh`：是否强制刷新（默认: false）
- `cache`：是否缓存结果（默认: true）
- `exclude`：排除的帖子 ID 列表（逗号分隔）

## 3. 排序阶段（Ranking）

### 工作原理

排序阶段对召回阶段提供的候选内容应用多因素评分系统，生成最终的推荐排序。

### 评分公式

```javascript
const rankingScore = 
  (similarityScore * similarityWeight) +
  (recencyScore * recencyWeight) +
  (engagementScore * engagementWeight);
```

### 排序因素

1. **相似度分数**（默认权重: 0.5）
   - 内容与用户兴趣的匹配程度，基于向量相似度
   - 直接使用召回阶段的相似度值

2. **时效性分数**（默认权重: 0.3）
   - 内容的新鲜度
   - 使用指数衰减公式，半衰期为 7 天
   ```javascript
   Math.exp(-Math.log(2) * daysSinceCreation / decayDays);
   ```

3. **参与度分数**（默认权重: 0.2）
   - 根据互动指标测量内容质量
   - 考虑点赞、评论和浏览，不同权重
   ```javascript
   // 评论权重是点赞的 3 倍
   const engagementRatio = (likes + (comments * 3)) / views;
   // 对病毒式内容进行对数变换
   Math.min(1, Math.log(engagementRatio + 1) / Math.log(10));
   ```

4. **多样性提升**（可选）
   - 防止同质内容（如同一板块）过度主导结果
   - 对已有多个帖子的板块施加惩罚
   ```javascript
   // 多样性惩罚因子
   const diversityFactor = Math.max(0.5, 1 - (boardCount * 0.1));
   ```

5. **个性化调整**（自动）
   - 根据用户特定的互动历史进一步调整排序
   - 提升类似于已点赞/收藏内容的帖子
   - 降低类似于已不喜欢内容的帖子

### API 使用

```
GET /api/recommend/ranked
```

查询参数：
- `limit`：每页帖子数量（默认: 20）
- `page`：分页页码（默认: 1）
- `refresh`：强制刷新（默认: false）
- `similarity_weight`：相似度因素权重（可选）
- `recency_weight`：时效性因素权重（可选）
- `engagement_weight`：参与度因素权重（可选）
- `diversity`：启用多样性提升（默认: true）
- `exclude`：排除的帖子 ID 列表（逗号分隔）

## 4. 统一推荐 API

统一推荐 API 将召回和排序阶段组合为单一、易用的端点，为用户提供个性化内容源。

### 实现细节

此 API 处理完整的推荐流程：
1. 用户认证和识别
2. 召回阶段的向量相似度搜索
3. 多因素评分排序
4. 分页和过滤
5. 多级智能缓存
6. 分析数据跟踪

### API 使用

```
GET /api/recommend/feed
```

查询参数：
- `limit`：每页帖子数量（默认: 20）
- `page`：分页页码（默认: 1）
- `refresh`：强制刷新（默认: false）
- `skip_cache`：完全跳过缓存（默认: false）
- `board`：按特定板块过滤（可选）
- `similarity_weight`：相似度因素权重（可选）
- `recency_weight`：时效性因素权重（可选）
- `engagement_weight`：参与度因素权重（可选）
- `diversity`：启用多样性提升（默认: true）
- `exclude`：排除的帖子 ID 列表（逗号分隔）

### React 集成

使用 `useRecommendationFeed` Hook 轻松集成到前端：

```jsx
import useRecommendationFeed from '@/hooks/useRecommendationFeed';

function Feed() {
  const {
    posts,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useRecommendationFeed({
    limit: 10,
    board: 'general'  // 可选板块过滤
  });

  // 组件实现...
}
```

该 Hook 提供：
- 自动分页与无限滚动
- 跨页面的帖子去重
- 缓存和后台刷新
- 简单的刷新和手动控制方法

## 5. 后台定时任务

我们使用 QStash 调度多种后台任务，以维护和优化推荐系统：

### 用户兴趣向量更新

- **频率**：每 2 小时
- **任务**：聚合用户行为日志，更新用户兴趣向量
- **实现**：`scheduleUserEmbeddingGeneration('0 */2 * * *')`
- **目标**：保持用户兴趣表示的时效性

### 推荐结果缓存预热

- **频率**：每小时
- **任务**：为活跃用户预计算推荐结果并缓存
- **实现**：`scheduleRecommendationCacheWarming('0 * * * *')`
- **目标**：减少高流量期间的计算负载，提高响应速度

### 排序模型训练

- **频率**：每天（凌晨 3 点）
- **任务**：基于最新用户数据重新训练排序模型
- **实现**：`scheduleRankingModelTraining('0 3 * * *')`
- **目标**：确保排序模型与用户行为保持同步

### 冷启动内容刷新

- **频率**：每 6 小时
- **任务**：更新热门内容、趋势话题和新帖子缓存
- **实现**：`scheduleColdStartContentRefresh('0 */6 * * *')`
- **目标**：为新用户提供高质量的非个性化推荐

## 6. 冷启动处理

系统为没有足够交互历史的新用户提供特殊处理：

### 冷启动内容类型

1. **每日热门**：过去 24 小时内最受欢迎的帖子
2. **每周热门**：过去 7 天内最受欢迎的帖子
3. **全部热门**：所有时间内最受欢迎的帖子
4. **趋势话题**：当前热门的话题和标签
5. **最新帖子**：最近发布的内容

### API 使用

```
GET /api/recommend/cold-start/refresh?type=daily&limit=20
```

查询参数：
- `type`：内容类型（`daily`, `weekly`, `alltime`, `topics`, `new`）
- `limit`：返回结果数量

### 新内容推广

系统还会将新发布的帖子推荐给活跃用户，以生成初始互动数据：
- 新帖子被加入到活跃用户的推荐结果中
- 通过时效性权重给予新内容适当的提升

## 7. 性能优化

### 向量搜索优化

- HNSW 索引参数（`m=16, ef_construction=64`）平衡搜索速度和召回质量
- 基于 PostgreSQL 函数的查询减少数据传输
- 策略性结果缓存减少数据库负载

### 排序效率

- 多级缓存策略：
  - 缓存召回结果（2 小时）
  - 缓存排序结果（30 分钟）
  - 缓存推荐源结果（20 分钟）
- 批量获取帖子元数据
- 优化评分计算

### 扩展性考虑

随着系统规模增长：
1. 考虑升级到专用向量数据库解决方案（如 Pinecone、Milvus）以处理更大数据集
2. 实现常见搜索的后台预计算
3. 在数据库层添加更高级的过滤器以减少后处理

## 8. 启动和监控

### 初始化所有推荐系统任务：

```
GET /api/init?type=recommendation
```

该接口将启动所有推荐相关的定时任务，并返回详细状态。

### 手动触发任务：

- 更新用户向量：`POST /api/actions/batch-process`
- 缓存预热：`POST /api/recommend/cache/warm`
- 冷启动内容刷新：`POST /api/recommend/cold-start/refresh`

### 监控指标：

- 向量生成成功率
- 缓存命中率
- 推荐请求响应时间
- 用户参与度指标

## 9. 使用示例

### 前端获取推荐内容

```jsx
// 使用统一推荐源 API 的 React 组件
import React from 'react';
import useRecommendationFeed from '@/hooks/useRecommendationFeed';
import PostCard from '@/components/post/PostCard';

export default function RecommendedContent() {
  const { 
    posts, 
    isLoading, 
    fetchNextPage,
    hasNextPage 
  } = useRecommendationFeed({ limit: 10 });
  
  if (isLoading) return <div>加载中...</div>;
  
  return (
    <div>
      <h2>为您推荐</h2>
      <div className="post-grid">
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      
      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>
          加载更多
        </button>
      )}
    </div>
  );
}
```

### 为新用户获取冷启动内容

```jsx
// 冷启动内容组件
import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/api';
import PostCard from '@/components/post/PostCard';

export default function ColdStartContent() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchColdStartContent() {
      try {
        const response = await fetchWithAuth('/api/recommend/cold-start/refresh?type=daily&limit=10');
        const data = await response.json();
        setPosts(data.items || []);
      } catch (error) {
        console.error('获取热门内容失败:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchColdStartContent();
  }, []);
  
  if (loading) return <div>加载中...</div>;
  
  return (
    <div>
      <h2>热门内容</h2>
      <div className="post-grid">
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
```

## 总结

我们的推荐系统结合了向量相似度搜索、多因素排序和定时后台任务，为用户提供高度个性化的内容体验。系统设计兼顾性能和可扩展性，通过智能缓存策略和批处理减少计算负载，同时为冷启动场景提供了完善的解决方案。

推荐系统是不断发展的，通过 A/B 测试不同的权重组合和算法变体，可以持续优化用户体验和参与度指标。 