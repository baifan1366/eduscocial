import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required Supabase environment variables')
}

async function fetchWithRetry(url, options, maxRetries = 3) {
  let lastError;
  const urlString = url.toString();
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      // Special handling for 300-level responses
      if (response.status >= 300 && response.status < 400) {
        const errorText = await response.text().catch(() => 'No error text available');
        console.error(`⚠️ REDIRECT ERROR (${response.status}) for URL:`, {
          url: urlString,
          method: options.method || 'GET',
          headers: options.headers,
          redirectLocation: response.headers.get('location'),
          errorText: errorText.substring(0, 500) // Limit text length
        });
      }
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error text available');
        console.error(`HTTP Error: ${response.status}`, {
          url: urlString,
          method: options.method || 'GET',
          errorText: errorText.substring(0, 500) // Limit text length
        });
        throw new Error(`HTTP error! status: ${response.status}`, { cause: errorText });
      }
      return response;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed for URL ${urlString}:`, error);
      lastError = error;
      if (i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

// Create Supabase client instance for browser usage
const createBrowserClient = () => {
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      fetch: async (url, options) => {
        // Skip retry for specific endpoints
        const skipRetry = typeof url === 'string' && (
          url.includes('embedding-server') ||
          url.includes('huggingface') ||
          url.includes('redis') ||
          url.includes('upstash.io')
        );
        
        if (skipRetry) {
          return fetch(url, options);
        }
        
        try {
          return await fetchWithRetry(url, options);
        } catch (err) {
          console.error('Supabase request error (Retried):', err);
          throw err;
        }
      }
    }
  });
};

// Create Supabase client instance for server usage with no persistent session
const createServerClient = () => {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false, // Don't persist session on server
      autoRefreshToken: false, // Don't auto refresh token on server
      detectSessionInUrl: false // Don't detect session in URL on server
    },
    global: {
      fetch: async (url, options) => {
        // Skip retry for specific endpoints
        const skipRetry = typeof url === 'string' && (
          url.includes('embedding-server') ||
          url.includes('huggingface') ||
          url.includes('redis') ||
          url.includes('upstash.io')
        );
        
        if (skipRetry) {
          return fetch(url, options);
        }
        
        try {
          return await fetchWithRetry(url, options);
        } catch (err) {
          console.error('Supabase server request error (Retried):', err);
          throw err;
        }
      }
    }
  });
};

// Default export for backward compatibility
export const supabase = typeof window === 'undefined' 
  ? createServerClient() 
  : createBrowserClient();

// Named exports for specific usage
export const createBrowserSupabaseClient = createBrowserClient;
export const createServerSupabaseClient = createServerClient;
