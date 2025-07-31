
# 🌊 React Hydration Rules & Troubleshooting Guide  
# 🌊 React Hydration（注水）规则与问题排查指南

> A bilingual guide (English + 中文) for preventing and fixing React hydration issues.
> 本文提供 React 注水（Hydration）规则与常见错误的中英文说明，帮助你预防并解决相关问题。

---

## 🔍 What is Hydration?  
## 🔍 什么是 Hydration（注水）？

**Hydration** is the process where React connects server-rendered HTML with client-side JavaScript.  
**Hydration（注水）** 是 React 将服务器渲染（SSR）生成的 HTML 与客户端 JavaScript 绑定的过程。

This process requires the DOM output to match between server and client exactly.  
此过程要求服务器端和客户端渲染的 DOM 输出必须**完全一致**。

---

## ✅ Hydration Rules  
## ✅ Hydration（注水）规则

### 1. Server and Client Render Must Match  
### 1. 服务器与客户端渲染必须一致

Do **not** render dynamic values like time or random numbers directly during SSR.  
切勿在 SSR 时直接渲染像时间或随机数这类动态内容。

**Bad ❌ 错误示例：**
```tsx
<div>{Date.now()}</div>
```

**Good ✅ 正确示例：**
```tsx
const [now, setNow] = useState(null);

useEffect(() => {
  setNow(Date.now());
}, []);

return <div>{now}</div>;
```

---

### 2. Avoid `window`, `document`, `localStorage` in SSR  
### 2. 避免在 SSR 中使用 `window`、`document`、`localStorage`

These objects only exist in the browser. Using them during SSR will crash the page.  
这些对象仅存在于浏览器，SSR 渲染时使用会导致错误。

**Solution 解法：** 使用 `useEffect` 或动态导入（如 Next.js 的 `dynamic`）。

```tsx
useEffect(() => {
  const theme = localStorage.getItem('theme');
}, []);
```

---

### 3. Delay Client-Only Content  
### 3. 延迟客户端渲染的内容

Use a `hasMounted` flag to skip mismatched rendering during SSR.  
使用 `hasMounted` 标志位可避免注水期间出现 DOM 不一致。

```tsx
const [hasMounted, setHasMounted] = useState(false);

useEffect(() => {
  setHasMounted(true);
}, []);

if (!hasMounted) return null;
```

---

### 4. Initial State Must Be Stable  
### 4. 初始状态必须稳定一致

Avoid random, date-based, or user-specific values as initial state.  
避免将随机数、日期或用户数据作为初始状态。

**Bad ❌**
```tsx
const [id, setId] = useState(() => Math.random());
```

**Good ✅**
```tsx
const [id, setId] = useState(null);
useEffect(() => {
  setId(Math.random());
}, []);
```

---

### 5. Avoid Conditional Rendering Based on Environment  
### 5. 避免基于环境的条件渲染

Don't use logic like `typeof window !== 'undefined'` during SSR rendering.  
不要在 SSR 渲染时直接用环境判断进行内容渲染。

---

### 6. Use `suppressHydrationWarning` When Necessary  
### 6. 必要时使用 `suppressHydrationWarning`

If you *must* show mismatched content (e.g., a date), suppress the warning explicitly.  
如果**必须**显示不一致的内容（如日期），可显式关闭注水警告。

```tsx
<div suppressHydrationWarning>{clientOnlyValue}</div>
```

---

## 🧼 Hydration Fix Checklist  
## 🧼 注水错误修复清单

- [ ] No random values in SSR?  
  SSR 阶段避免随机值？
- [ ] Only use `window` or `document` inside `useEffect`?  
  是否仅在 `useEffect` 中使用浏览器 API？
- [ ] Used `hasMounted` guard for client-only logic?  
  是否使用了 `hasMounted` 控制客户端渲染逻辑？
- [ ] Used `suppressHydrationWarning` for dynamic text?  
  是否对动态文本使用了 `suppressHydrationWarning`？
- [ ] Used `dynamic(() => ..., { ssr: false })` for client-only components?  
  对仅客户端渲染的组件使用了 `dynamic` 吗？

---

## 🧠 Pro Tips  
## 🧠 实用建议

- ✅ Use **React DevTools** to debug component trees  
  使用 React DevTools 调试组件结构
- ✅ Use **React.StrictMode** to catch hydration problems early  
  开启 `React.StrictMode` 可提前发现潜在注水问题
- ✅ In **Next.js**, use `use client` and `dynamic()` for client logic  
  在 Next.js 中，客户端组件使用 `use client` + `dynamic()`。

---

## 🧰 Next.js Specific: Handling Hydration  
## 🧰 Next.js 专用：处理注水问题

- Wrap client-only UI (e.g., charts, editors) with:
```tsx
'use client';

import dynamic from 'next/dynamic';
const Editor = dynamic(() => import('./Editor'), { ssr: false });
```

- Avoid `layout.tsx` hydration mismatches by keeping it static  
  避免在 `layout.tsx` 中引入动态渲染逻辑

---

## 🧾 References  
## 🧾 参考文档

- [React hydrateRoot Documentation (EN)](https://react.dev/reference/react-dom/client/hydrateRoot)
- [Next.js Hydration Error Guide (EN)](https://nextjs.org/docs/messages/react-hydration-error)
- [React SSR Best Practices 中文](https://react.docschina.org/docs/react-dom-server.html)

---

## 📌 Summary  
## 📌 总结

Hydration errors can be frustrating — but they are almost always caused by **non-matching renders** between server and client.

注水错误令人头痛，但几乎总是由于**服务器和客户端渲染不一致**导致。

✅ Stick to deterministic rendering.  
✅ 遵守确定性渲染原则  
✅ Avoid dynamic values during SSR.  
✅ 避免在 SSR 时使用动态值  
✅ Use `useEffect` and `dynamic()` wisely.  
✅ 明智使用 `useEffect` 与 `dynamic()`

---

*Keep your app smooth — keep your hydration clean.*  
*保持 App 流畅，先把注水问题搞清楚。*
