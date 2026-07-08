import { describe, it, expect } from 'vitest'
import { shuffle } from './shuffle'

describe('shuffle', () => {
  it('returns a permutation containing exactly the same elements', () => {
    const input = ['a', 'b', 'c', 'd', 'e']
    const result = shuffle(input)
    expect(result).toHaveLength(input.length)
    expect([...result].sort()).toEqual([...input].sort())
  })

  it('does not mutate the input array', () => {
    const input = ['a', 'b', 'c']
    const copy = [...input]
    shuffle(input)
    expect(input).toEqual(copy)
  })

  it('is deterministic for a given rng', () => {
    const rng = () => 0 // Fisher-Yates always swapping into index 0
    const result = shuffle(['a', 'b', 'c', 'd'], rng)
    expect(result).toEqual(['b', 'c', 'd', 'a'])
  })

  it('produces more than one distinct ordering across many runs', () => {
    const input = ['a', 'b', 'c', 'd', 'e', 'f']
    const orderings = new Set<string>()
    for (let i = 0; i < 50; i++) {
      orderings.add(shuffle(input).join(','))
    }
    expect(orderings.size).toBeGreaterThan(1)
  })
})
