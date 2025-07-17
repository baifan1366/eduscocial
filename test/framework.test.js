import { describe, it, expect } from 'vitest'

describe('Testing Framework Setup', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2)
  })

  it('should have access to testing utilities', () => {
    expect(expect).toBeDefined()
    expect(describe).toBeDefined()
    expect(it).toBeDefined()
  })

  it('should have jsdom environment', () => {
    expect(typeof window).toBe('object')
    expect(typeof document).toBe('object')
  })
})