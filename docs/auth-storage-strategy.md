# 身份验证状态存储策略

## 问题

在服务器端渲染（SSR）环境中，使用浏览器特有对象（如`window`和`localStorage`）会导致以下问题：

1. 服务器端不存在这些对象，导致报错
2. 客户端和服务器端渲染不一致
3. 水合（Hydration）错误
4. 安全隐患：本地存储容易受到XSS攻击

## 解决方案

我们采用了多层次的身份验证状态存储策略：

### 1. 使用Next-Auth会话

作为主要的身份验证存储机制，使用Next-Auth提供的会话管理：

- 会话状态保存在加密的cookie中
- 使用`useSession` hook获取用户信息
- 支持服务器端和客户端组件

```jsx
// 客户端组件
'use client';
import { useSession } from 'next-auth/react';

function Profile() {
  const { data: session } = useSession();
  return session?.user ? <p>Logged in as {session.user.name}</p> : <p>Not logged in</p>;
}
```

```jsx
// 服务器端组件
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export default async function ServerComponent() {
  const session = await getServerSession(authOptions);
  return session?.user ? <p>Logged in as {session.user.name}</p> : <p>Not logged in</p>;
}
```

### 2. 使用cookies-next作为备份

对于需要在客户端访问但又不希望依赖`window`对象的情况，使用`cookies-next`库：

```jsx
import { getCookie, setCookie, deleteCookie } from 'cookies-next';

// 存储用户信息
setCookie('adminUser', JSON.stringify(userData), {
  maxAge: 60 * 60 * 24 * 7, // 一周
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict'
});

// 读取用户信息
const adminCookie = getCookie('adminUser');
if (adminCookie) {
  const adminData = JSON.parse(adminCookie);
  // 使用数据...
}

// 删除用户信息
deleteCookie('adminUser', { path: '/' });
```

### 3. React状态与上下文

使用React状态和上下文API在应用内存中存储和共享用户信息：

```jsx
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const { data: session } = useSession();
  
  // 从会话中同步用户状态
  useEffect(() => {
    if (session?.user) {
      setUser(session.user);
    }
  }, [session]);
  
  // 提供上下文值
  const value = {
    user,
    isAuthenticated: !!user,
    // ...其他认证方法
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

## 最佳实践

1. **避免客户端检测**：不要使用`typeof window !== 'undefined'`这样的模式，会导致客户端与服务器端渲染不一致

2. **使用`'use client'`指令**：正确标记客户端组件

3. **优先使用Next-Auth会话**：作为主要身份验证状态源

4. **服务器端认证**：敏感操作应该在服务器端进行验证

5. **避免直接使用localStorage**：使用cookies代替localStorage，更安全且支持SSR

## 实现示例

### useAdminAuth.js

```jsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';

export function useAdminAuth() {
  const [user, setUser] = useState(null);
  const { data: session, status } = useSession();
  
  // 从会话或cookie获取用户状态
  useEffect(() => {
    if (session?.user) {
      setUser(session.user);
    } else {
      const adminCookie = getCookie('adminUser');
      if (adminCookie) {
        try {
          setUser(JSON.parse(adminCookie));
        } catch (e) {
          console.error('Failed to parse admin cookie:', e);
        }
      }
    }
  }, [session]);
  
  // 处理登出
  const logout = async () => {
    // 调用API端点
    await fetch('/api/admin/logout', { 
      method: 'POST',
      credentials: 'include'
    });
    
    // 清除cookie
    deleteCookie('adminUser', { path: '/' });
    
    // 清除状态
    setUser(null);
  };
  
  return {
    user,
    isAuthenticated: !!user,
    logout
  };
}
``` 