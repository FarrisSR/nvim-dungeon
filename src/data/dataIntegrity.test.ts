import { describe, it, expect } from 'vitest'
import { challenges, getChallenge } from './challenges'
import { enemies } from './world'
import { categoryToMode } from '../lib/modeMap'

describe('challenge data', () => {
  it('has no duplicate challenge ids', () => {
    const ids = challenges.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every challenge category maps to a vim mode', () => {
    for (const c of challenges) {
      expect(() => categoryToMode(c.category)).not.toThrow()
      expect(categoryToMode(c.category)).toBeDefined()
    }
  })
})

describe('enemy data', () => {
  it('has no duplicate enemy ids', () => {
    const ids = enemies.map(e => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every enemy has at least one challenge', () => {
    for (const e of enemies) {
      expect(e.challengeIds.length).toBeGreaterThan(0)
    }
  })

  it('every enemy.challengeIds entry resolves to a real challenge', () => {
    for (const e of enemies) {
      for (const id of e.challengeIds) {
        expect(getChallenge(id), `${e.id} references missing challenge "${id}"`).toBeDefined()
      }
    }
  })
})
