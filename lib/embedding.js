// Embedding server URL
const EMBEDDING_SERVER_URL = "https://embedding-server-jxsa.onrender.com";

// 设置超时时间（毫秒）
const API_TIMEOUT = 10000; // 10秒超时

/**
 * 使用AbortController实现带超时的fetch
 * @param {string} url API URL
 * @param {Object} options fetch选项
 * @param {number} timeout 超时时间（毫秒）
 * @returns {Promise} fetch响应
 */
async function fetchWithTimeout(url, options, timeout) {
  const controller = new AbortController();
  const { signal } = controller;
  
  // 创建超时Promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      controller.abort();
      reject(new Error(`Request timed out after ${timeout}ms`));
    }, timeout);
  });

  try {
    // 竞争fetch和超时
    return await Promise.race([
      fetch(url, { ...options, signal }),
      timeoutPromise
    ]);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Generates an embedding vector for text content using custom embedding server API
 * 
 * @param {string} text - The text to generate an embedding for
 * @returns {Promise<number[]|null>} - Array of embedding values or null on error
 */
export async function generateEmbedding(text) {
  try {
    const res = await fetchWithTimeout(
      `${EMBEDDING_SERVER_URL}/embed`, 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: text,
        }),
      },
      API_TIMEOUT
    );

    if (!res.ok) {
      console.error('Embedding error:', await res.text());
      return null;
    }

    const data = await res.json();
    // API返回的是 { embedding: [...], model: "...", dim: ... } 格式
    return data?.embedding || null;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    return null;
  }
}

/**
 * Generates embeddings for multiple texts in a batch using custom embedding server API
 * 
 * @param {string[]} texts - Array of texts to generate embeddings for
 * @returns {Promise<number[][]|null>} - Array of embedding arrays or null on error
 */
export async function generateBatchEmbeddings(texts) {
  try {
    const res = await fetchWithTimeout(
      `${EMBEDDING_SERVER_URL}/embed/batch`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: texts,
        }),
      },
      API_TIMEOUT
    );

    if (!res.ok) {
      console.error('Batch embedding error:', await res.text());
      return null;
    }

    const data = await res.json();
    // API返回的是 { embeddings: [...], count: ..., model: "...", dim: ... } 格式
    return data?.embeddings || null;
  } catch (error) {
    console.error('Failed to generate batch embeddings:', error);
    return null;
  }
}

/**
 * Generates an embedding using a local model as fallback
 * Useful as a fallback option or for development without OpenAI costs
 * 
 * @param {string} text - The text to generate an embedding for
 * @returns {Promise<number[]|null>} - Array of embedding values or null on error
 */
export async function generateLocalEmbedding(text) {
  // This is a placeholder for a local embedding solution
  console.warn('Local embedding generation not implemented');
  return null;
}

/**
 * Normalize text for embedding generation
 * 
 * @param {string} text - Raw text input
 * @returns {string} - Normalized text ready for embedding
 */
function normalizeText(text) {
  if (!text) return '';
  
  // Truncate to limit (approx. 8K tokens)
  // Since ~4 chars ≈ 1 token, limiting to 32K chars is a safe approximation
  const MAX_CHARS = 32000;
  let processed = text.trim();
  
  if (processed.length > MAX_CHARS) {
    processed = processed.substring(0, MAX_CHARS);
  }
  
  // Additional normalization if needed (lowercase, remove extra whitespace, etc.)
  processed = processed.replace(/\s+/g, ' ');
  
  return processed;
}

/**
 * Calculates the cosine similarity between two embedding vectors
 * Useful for comparing embeddings directly
 * 
 * @param {number[]} embedding1 - First embedding vector
 * @param {number[]} embedding2 - Second embedding vector
 * @returns {number} - Cosine similarity (-1 to 1, higher is more similar)
 */
export function calculateSimilarity(embedding1, embedding2) {
  if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    magnitude1 += Math.pow(embedding1[i], 2);
    magnitude2 += Math.pow(embedding2[i], 2);
  }
  
  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);
  
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }
  
  return dotProduct / (magnitude1 * magnitude2);
} 