# QStash 配置指南

本指南将帮助你配置QStash以实现定期更新用户嵌入的功能。

## 问题诊断

根据检查结果，你的QStash配置存在以下问题：

❌ **QSTASH_TOKEN 未设置** - 这是最关键的问题
❌ **QSTASH_CURRENT_SIGNING_KEY 未设置**
❌ **QSTASH_NEXT_SIGNING_KEY 未设置**
⚠️ **NEXT_PUBLIC_APP_URL 未设置**

## 解决步骤

### 1. 获取QStash凭据

1. 登录到 [Upstash Console](https://console.upstash.com/)
2. 进入 **QStash** 部分
3. 复制以下信息：
   - **QStash Token** (用于API调用)
   - **Current Signing Key** (用于验证webhook)
   - **Next Signing Key** (用于密钥轮换)

### 2. 设置环境变量

在你的 `.env.local` 文件中添加以下变量：

```bash
# QStash Configuration
QSTASH_TOKEN=your_qstash_token_here
QSTASH_CURRENT_SIGNING_KEY=your_current_signing_key_here
QSTASH_NEXT_SIGNING_KEY=your_next_signing_key_here

# App URL (重要：QStash需要这个URL来发送webhook)
NEXT_PUBLIC_APP_URL=https://your-app-domain.com

# 如果是本地开发，可以使用ngrok
# NEXT_PUBLIC_APP_URL=https://your-ngrok-url.ngrok.io
```

### 3. 本地开发配置

如果你在本地开发，需要使用ngrok来暴露本地服务器：

```bash
# 安装ngrok
npm install -g ngrok

# 启动你的Next.js应用
npm run dev

# 在另一个终端中启动ngrok
ngrok http 3000

# 复制ngrok提供的HTTPS URL到NEXT_PUBLIC_APP_URL
```

### 4. 初始化QStash任务

配置完环境变量后，重启应用并调用初始化API：

```bash
# 重启应用
npm run dev

# 调用初始化API (在浏览器中访问或使用curl)
curl http://localhost:3000/api/init
```

### 5. 验证配置

运行配置检查脚本：

```bash
node scripts/check-qstash-config.js
```

应该看到类似这样的输出：
```
✅ QStash client initialized successfully
✅ Found X existing schedule(s)
```

## 预期的定时任务

配置成功后，系统将创建以下定时任务：

### 1. 用户嵌入更新
- **频率**: 每2小时 (`0 */2 * * *`)
- **端点**: `/api/actions/batch-process`
- **功能**: 处理用户行为日志，更新用户兴趣嵌入

### 2. 用户行为处理
- **频率**: 每5秒 (`*/5 * * * * *`)
- **端点**: `/api/actions/batch-process`
- **功能**: 处理Redis中的pending_user_actions

### 3. 推荐缓存预热
- **频率**: 每小时 (`0 * * * *`)
- **端点**: `/api/recommend/cache/warm`
- **功能**: 为活跃用户预计算推荐结果

### 4. 冷启动内容刷新
- **频率**: 每6小时 (`0 */6 * * *`)
- **端点**: `/api/recommend/cold-start/refresh`
- **功能**: 更新热门内容和趋势话题

## 故障排除

### 问题1: QStash Dashboard显示没有任务

**原因**: 环境变量未正确设置或未调用初始化API

**解决方案**:
1. 检查所有环境变量是否正确设置
2. 重启应用
3. 调用 `/api/init` 端点

### 问题2: Webhook调用失败

**原因**: NEXT_PUBLIC_APP_URL不可访问

**解决方案**:
1. 确保URL是公网可访问的
2. 本地开发使用ngrok
3. 检查防火墙设置

### 问题3: 签名验证失败

**原因**: 签名密钥不匹配

**解决方案**:
1. 重新从Upstash Console复制最新的签名密钥
2. 确保QSTASH_CURRENT_SIGNING_KEY和QSTASH_NEXT_SIGNING_KEY都已设置

## 监控和调试

### 查看QStash日志

1. 在Upstash Console的QStash部分查看消息历史
2. 检查webhook调用的状态和响应

### 查看应用日志

```bash
# 查看用户嵌入更新日志
grep "user embedding" logs/app.log

# 查看QStash相关日志
grep "QStash" logs/app.log
```

### 手动触发任务

```bash
# 手动触发用户嵌入更新
curl -X POST http://localhost:3000/api/actions/batch-process \
  -H "Content-Type: application/json" \
  -d '{"action": "process_user_embeddings"}'

# 手动触发用户行为处理
curl -X POST http://localhost:3000/api/actions/batch-process \
  -H "Content-Type: application/json" \
  -d '{"action": "process_user_actions"}'
```

## 生产环境部署

### Vercel部署

在Vercel项目设置中添加环境变量：

1. 进入Vercel项目设置
2. 选择 "Environment Variables"
3. 添加所有QStash相关的环境变量
4. 重新部署应用

### 其他平台

确保在部署平台的环境变量配置中添加所有必需的QStash变量。

## 验证用户嵌入更新

配置完成后，你可以通过以下方式验证用户嵌入是否正在更新：

1. **检查Redis**: 查看`pending_user_actions`列表是否被定期清空
2. **检查数据库**: 查看`user_embeddings`表的`updated_at`字段
3. **查看日志**: 搜索"user embedding"相关的日志消息

```sql
-- 检查最近更新的用户嵌入
SELECT user_id, updated_at 
FROM user_embeddings 
ORDER BY updated_at DESC 
LIMIT 10;
```

配置完成后，你的推荐系统将能够定期从用户行为中学习并更新用户兴趣嵌入，从而提供更准确的个性化推荐。
