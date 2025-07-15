# 管理员登录功能实现指南

## 概述
本文档提供了实现管理员登录功能的详细步骤，包括前端页面、后端处理、Redis会话管理以及数据库交互。

## 实现步骤

### 1. 数据库设计
数据库已包含管理员用户表，定义如下：
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id),
  role TEXT CHECK (role IN ('support','ads_manager','superadmin')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);
```

### 2. 前端实现
在`/app/[locale]/admin/login/page.js`中实现管理员登录页面:

- 创建登录表单，包括用户名/邮箱和密码字段
- 添加表单验证
- 实现提交处理函数，将登录请求发送到API端点
- 登录成功后重定向到管理后台首页
- 添加错误处理和用户反馈

### 3. 后端API实现
创建管理员登录的API端点:

- 在`/app/api/admin/login/route.js`中实现POST处理函数
- 验证请求的用户凭据
- 查询数据库验证用户是否为管理员
- 检查用户角色权限
- 生成并返回JWT令牌或会话ID
- 使用Redis存储会话信息

### 4. Redis会话管理
在`lib/redis/adminLogin.js`中实现会话管理功能:

- 实现创建会话函数，存储管理员用户ID、角色和登录时间
- 设置会话过期时间
- 实现会话验证函数
- 实现会话刷新和注销功能

### 5. 中间件实现
创建保护管理员路由的中间件:

- 在`middleware.js`中添加路径匹配规则，拦截所有`/admin/*`请求
- 验证请求中的会话令牌
- 检查用户权限
- 对无效会话进行重定向到登录页面

### 6. 安全注意事项
- 实现登录尝试限制，防止暴力破解
- 使用HTTPS确保通信安全
- 对密码实施加密存储
- 实现双因素认证（可选）
- 记录所有管理员操作日志

### 7. 测试计划
- 单元测试：测试Redis功能和API端点
- 集成测试：测试前端与API的交互
- 端到端测试：完整测试登录流程
- 安全测试：尝试未授权访问管理员页面

## 登录流程
1. 用户访问管理员登录页面
2. 输入凭据并提交表单
3. 前端将请求发送到API端点
4. 后端验证凭据并检查管理员权限
5. 验证成功后创建会话并返回令牌
6. 前端存储令牌并重定向到管理后台
7. 后续请求中包含令牌以验证身份

## 部署检查清单
- 确保数据库索引已优化
- 配置Redis持久化
- 设置适当的会话过期时间
- 配置日志记录
- 实施速率限制
