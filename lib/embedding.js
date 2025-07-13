import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Maximum retries for API calls
const MAX_RETRIES = 3;

/**
 * Generates an embedding vector for text content using OpenAI API
 * 
 * @param {string} text - The text to generate an embedding for
 * @param {string} model - OpenAI embedding model to use
 * @returns {Promise<number[]|null>} - Array of embedding values or null on error
 */
export async function generateEmbedding(text, model = 'text-embedding-ada-002') {
  if (!text || text.trim() === '') {
    console.error('Cannot generate embedding for empty text');
    return null;
  }
  
  // Normalize and truncate text to avoid token limits
  const normalizedText = normalizeText(text);
  
  // Retry logic for API resilience
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await openai.embeddings.create({
        model: model,
        input: normalizedText,
      });

      // Extract embedding from response
      if (response && 
          response.data && 
          response.data.length > 0 && 
          response.data[0].embedding) {
        return response.data[0].embedding;
      } else {
        console.error('Invalid embedding response structure:', response);
        return null;
      }
    } catch (error) {
      console.error(`Embedding generation attempt ${attempt} failed:`, error);
      
      // If it's the last attempt, give up
      if (attempt === MAX_RETRIES) {
        console.error('All embedding generation attempts failed');
        return null;
      }
      
      // Otherwise wait before retrying
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return null;
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
  // You could implement this using libraries like:
  // - TensorFlow.js with a pre-trained model
  // - sentence-transformers via Node.js bindings
  // - other local embedding libraries
  
  console.warn('Local embedding generation not implemented');
  
  // Return null to indicate that local embedding generation failed
  // This will allow the caller to handle the absence of embeddings
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
  
  // Truncate to OpenAI token limit (approx. 8K tokens for text-embedding-ada-002)
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