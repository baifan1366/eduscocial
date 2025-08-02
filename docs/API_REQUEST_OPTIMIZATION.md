# API请求优化文档

## 问题描述

在应用启动时，发现大量重复的API请求，特别是对 `/api/posts/[id]/hot-comments` 端点的请求。这导致：

1. 服务器负载过高
2. 数据库查询过多
3. 用户体验变差（加载时间长）
4. 资源浪费

## 原因分析

1. **多个组件同时使用相同的hooks**：
   - `FacebookStylePostsList` 和 `PostsList` 都使用 `useEnhancedPosts`
   - 每个组件都会独立发起请求

2. **缺乏请求批处理**：
   - 每个帖子的热门评论都是单独请求
   - 15个帖子 = 15个并发请求

3. **没有请求去重机制**：
   - 相同的请求可能被多次发起
   - 缺乏缓存机制

## 解决方案

### 1. 批量API端点

创建了 `/api/posts/batch-hot-comments` 端点：
- 一次请求获取多个帖子的热门评论
- 减少数据库查询次数
- 支持缓存机制

### 2. 请求去重系统

实现了 `RequestDeduplicator` 类：
- 防止重复请求
- 内存缓存机制
- 自动清理过期缓存

### 3. Hook优化

优化了 `useHotComments` 和 `useCachedCounts`：
- 使用批量API
- 集成请求去重
- 分批处理大量请求

### 4. 性能监控

添加了开发环境下的请求监控组件：
- 实时查看缓存状态
- 监控请求数量
- 手动清理缓存

## 优化效果

### 之前：
```
15个帖子 = 15个并发请求到 /api/posts/[id]/hot-comments
每个请求都查询数据库
没有缓存机制
```

### 之后：
```
15个帖子 = 1个批量请求到 /api/posts/batch-hot-comments
单次数据库查询获取所有数据
30分钟缓存TTL
请求去重防止重复调用
```

## 使用方法

### 1. 批量获取热门评论

```javascript
import { getHotCommentsBatch } from '@/lib/utils/requestDeduplication';

const data = await getHotCommentsBatch(['post-id-1', 'post-id-2']);
```

### 2. 批量获取缓存计数

```javascript
import { getCachedCountsBatch } from '@/lib/utils/requestDeduplication';

const data = await getCachedCountsBatch(['post-id-1', 'post-id-2']);
```

### 3. 监控请求状态

在开发环境中，页面右下角会显示"📊 Requests"按钮，点击可查看：
- 缓存大小
- 待处理请求数
- 缓存的键值
- 清理缓存功能

## 配置参数

### 缓存时间
- 热门评论：60秒
- 缓存计数：30秒
- 请求去重：30秒

### 批处理限制
- 最大批量大小：50个帖子
- 分批处理大小：5个帖子（已移除，现在使用单次批量请求）

## 监控和调试

### 开发环境
- 使用 `RequestMonitor` 组件监控请求状态
- 控制台日志显示请求详情
- 可手动清理缓存进行测试

### 生产环境
- 自动缓存清理（5分钟间隔）
- 错误处理和降级机制
- 性能指标收集

## 注意事项

1. **缓存一致性**：缓存数据可能不是最新的，适合对实时性要求不高的数据
2. **内存使用**：请求去重会占用一定内存，但会自动清理
3. **错误处理**：批量请求失败时会降级到单个请求
4. **开发调试**：监控组件仅在开发环境显示

## 当前Redis使用情况

✅ **已使用Redis缓存**：
- 热门评论缓存 (30分钟TTL)
- 帖子浏览量计数
- 热门帖子缓存 (1小时TTL)
- 推荐系统缓存
- 用户会话数据

## 双重缓存架构

```
浏览器 → 客户端内存缓存 → 批量API → Redis缓存 → 数据库
         (30-60秒)              (30分钟)
```

## 未来优化方向

1. **统一缓存策略**：将客户端内存缓存也迁移到Redis
2. **WebSocket实时更新**：对于需要实时性的数据
3. **GraphQL**：更灵活的数据查询
4. **Service Worker**：离线缓存支持
5. **缓存预热**：在低峰期预加载热门内容
