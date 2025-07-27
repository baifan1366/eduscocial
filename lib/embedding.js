// Embedding server URL
const EMBEDDING_SERVER_URL = "https://embedding-server-jxsa.onrender.com";

// 设置超时时间（毫秒）
const DEFAULT_API_TIMEOUT = 30000; // 30秒超时
const BACKGROUND_API_TIMEOUT = 120000; // 120秒超时，用于后台处理

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
 * @param {Object} options - Options for embedding generation
 * @param {boolean} options.isBackground - Whether this is a background process (uses longer timeout)
 * @param {number} options.timeout - Custom timeout in milliseconds (overrides isBackground)
 * @param {boolean} options.retryOnError - Whether to retry on error
 * @param {number} options.maxRetries - Maximum number of retries (default: 2)
 * @returns {Promise<number[]|null>} - Array of embedding values or null on error
 */
export async function generateEmbedding(text, options = {}) {
  // Determine timeout based on options
  const { 
    isBackground = false, 
    timeout = null,
    retryOnError = true,
    maxRetries = 2
  } = options;
  
  const effectiveTimeout = timeout || (isBackground ? BACKGROUND_API_TIMEOUT : DEFAULT_API_TIMEOUT);
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      console.log(`Generating embedding with timeout: ${effectiveTimeout}ms ${isBackground ? '(background mode)' : ''}${retries > 0 ? ` (retry ${retries})` : ''}`);
      
      if (!text || typeof text !== 'string') {
        console.error('Invalid text for embedding generation', { textType: typeof text });
        return null;
      }
      
      // Truncate text if too long (max 10,000 characters to be safe)
      const truncatedText = text.substring(0, 10000);
      
      const res = await fetchWithTimeout(
        `${EMBEDDING_SERVER_URL}/embed`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: truncatedText,
          }),
        },
        effectiveTimeout
      );
  
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Embedding error:', errorText);
        
        if (retryOnError && retries < maxRetries) {
          retries++;
          // Exponential backoff: wait longer between retries
          await new Promise(r => setTimeout(r, 1000 * (2 ** retries)));
          continue;
        }
        
        return null;
      }
  
      const data = await res.json();
      // API返回的是 { embedding: [...], model: "...", dim: ... } 格式
      return data?.embedding || null;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      
      if (retryOnError && retries < maxRetries) {
        retries++;
        // Exponential backoff: wait longer between retries
        await new Promise(r => setTimeout(r, 1000 * (2 ** retries)));
        continue;
      }
      
      return null;
    }
  }
  
  return null; // If we get here, all retries failed
}

/**
 * Generates embeddings for multiple texts in a batch using custom embedding server API
 * 
 * @param {string[]} texts - Array of texts to generate embeddings for
 * @param {Object} options - Options for embedding generation
 * @param {boolean} options.isBackground - Whether this is a background process (uses longer timeout)
 * @param {number} options.timeout - Custom timeout in milliseconds (overrides isBackground)
 * @returns {Promise<number[][]|null>} - Array of embedding arrays or null on error
 */
export async function generateBatchEmbeddings(texts, options = {}) {
  // Determine timeout based on options
  const { isBackground = false, timeout = null } = options;
  const effectiveTimeout = timeout || (isBackground ? BACKGROUND_API_TIMEOUT : DEFAULT_API_TIMEOUT);
  
  try {
    console.log(`Generating batch embeddings with timeout: ${effectiveTimeout}ms ${isBackground ? '(background mode)' : ''}`);
    
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
      effectiveTimeout
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