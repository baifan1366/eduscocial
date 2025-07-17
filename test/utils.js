import { render } from '@testing-library/react'
import { vi } from 'vitest'

// Custom render function that includes common providers
export function renderWithProviders(ui, options = {}) {
  return render(ui, {
    // Add any global providers here if needed
    ...options,
  })
}

// Mock Supabase client
export const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
        maybeSingle: vi.fn(),
      })),
      join: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(),
    })),
  })),
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  },
}

// Mock NextAuth session
export const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  },
  expires: '2024-12-31',
}

// Helper to create mock API request/response
export function createMockRequest(method = 'GET', body = null, headers = {}) {
  return {
    method,
    json: vi.fn().mockResolvedValue(body),
    headers: new Headers(headers),
  }
}

export function createMockResponse() {
  const response = {
    status: 200,
    headers: new Headers(),
    json: vi.fn(),
  }
  
  return {
    Response: class MockResponse {
      constructor(body, init = {}) {
        this.body = body
        this.status = init.status || 200
        this.headers = new Headers(init.headers || {})
      }
      
      async json() {
        return typeof this.body === 'string' ? JSON.parse(this.body) : this.body
      }
    },
    ...response,
  }
}