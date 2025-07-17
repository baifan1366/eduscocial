# Supabase 客户端重构文档

## 重构概述

本次重构的主要目标是将直接在前端组件中调用 Supabase 的代码移动到后端 API 路由中，以提高应用程序的安全性和可维护性。

### 为什么要进行这种重构？

1. **安全性提升**：将 Supabase 调用移至后端可以防止在客户端暴露敏感凭据和业务逻辑
2. **集中化错误处理**：通过 API 路由统一处理错误情况
3. **代码解耦**：将数据访问逻辑与 UI 组件分离，遵循关注点分离原则
4. **更一致的数据流**：使用 React Query 实现更标准化的数据获取和缓存机制

## 重构内容

### 新增 API 路由

1. `app/api/settings/school-info/route.js`
   - 处理学校信息和验证文件上传
   - 接受 POST 请求，验证文件格式和大小
   - 使用 supabase 存储 API 上传文件

2. `app/api/boards/route.js`
   - 获取面板列表
   - 支持过滤、排序和分页参数
   - 使用 createServerSupabaseClient 确保服务端渲染时正确处理会话

### 新增 React Query Hooks

1. `hooks/useGetBoards.js`
   - 获取面板列表的钩子，支持过滤和排序
   - 使用 React Query 提供缓存和重新获取功能

2. `hooks/useUploadSchoolInfo.js`
   - 处理学校信息上传的钩子
   - 将文件转换为 base64 格式后发送到 API
   - 使用 React Query 的 useMutation 钩子处理变更操作

### 修改的组件

1. `components/settings/SchoolInfoUploadDialog.jsx`
   - 移除直接的 supabase 存储调用
   - 使用 useUploadSchoolInfo 钩子处理文件上传

2. `components/settings/GeneralSettings.jsx`
   - 移除直接的 supabase 查询调用
   - 使用 useGetBoards 钩子获取面板数据

## 好处与影响

1. **提高安全性**：
   - Supabase 凭证现在仅在后端使用
   - 业务逻辑更加隐藏，不在前端暴露

2. **代码质量提升**：
   - 关注点分离
   - 重用性更强的逻辑
   - 减少重复代码

3. **性能优化**：
   - React Query 提供高效的缓存机制
   - 减少不必要的重复请求

4. **开发体验提升**：
   - 更清晰的数据流
   - 更易于测试的组件
   - 更容易扩展和维护

## 后续建议

1. **继续这种重构模式**：
   - 逐步将所有直接的 Supabase 调用迁移到 API 层
   - 为每种数据操作创建专用的 React Query 钩子

2. **添加错误处理中间件**：
   - 创建标准化的 API 错误处理机制
   - 实现统一的错误响应格式

3. **优化 API 响应格式**：
   - 确保所有 API 响应遵循一致的格式
   - 添加元数据如分页信息和请求 ID

4. **添加缓存策略**：
   - 为适当的 API 路由添加缓存标头
   - 优化 React Query 的缓存配置 