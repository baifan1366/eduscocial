# 自定义嵌入API文档

## 概述

本项目使用自定义的嵌入API服务来生成文本的向量嵌入表示。这些嵌入可用于语义搜索、内容推荐、文本聚类等功能。

API服务地址: `https://embedding-server-jxsa.onrender.com`

## API端点

### 单文本嵌入

**端点**: `/embed`

**方法**: `POST`

**请求格式**:
```json
{
  "input": "要嵌入的文本"
}
```

**响应格式**:
```json
{
  "embedding": [0.123, -0.456, ...],  // 384维向量
  "model": "intfloat/e5-small",
  "dim": 384
}
```

### 批量文本嵌入

**端点**: `/embed/batch`

**方法**: `POST`

**请求格式**:
```json
{
  "inputs": ["文本1", "文本2", ...]
}
```

**响应格式**:
```json
{
  "embeddings": [
    [0.123, -0.456, ...],  // 文本1的向量
    [0.789, -0.321, ...],  // 文本2的向量
    ...
  ],
  "count": 2,  // 嵌入的数量
  "model": "intfloat/e5-small", 
  "dim": 384
}
```

## 使用方法

在项目中，我们通过`lib/embedding.js`提供了方便的函数来使用这些API：

```javascript
import { generateEmbedding, generateBatchEmbeddings, calculateSimilarity } from './lib/embedding.js';

// 生成单个文本嵌入
const embedding = await generateEmbedding("这是一段示例文本");

// 批量生成嵌入
const texts = ["文本1", "文本2", "文本3"];
const embeddings = await generateBatchEmbeddings(texts);

// 计算两个嵌入之间的相似度
const similarity = calculateSimilarity(embeddings[0], embeddings[1]);
console.log(`相似度: ${similarity}`); // 0到1之间，越高表示越相似
```

## 技术细节

- 模型: intfloat/e5-small
- 嵌入维度: 384
- 响应时间: 通常在3-7秒之间，取决于服务器负载
- 最大文本长度: 建议不超过32,000个字符以获得最佳性能

## 错误处理

当API调用失败时，`generateEmbedding`和`generateBatchEmbeddings`函数会返回`null`。在使用这些函数时，应始终检查返回值是否为null：

```javascript
const embedding = await generateEmbedding("示例文本");
if (embedding) {
  // 处理嵌入
} else {
  // 处理错误情况
}
``` 