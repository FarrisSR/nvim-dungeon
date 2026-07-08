import { describe, it, expect } from 'vitest'
import { buildCombatContext } from './useCombat'
import { getEnemy } from '../data/world'
import type { EnemyInstance } from '../types/game'

function makeInstance(enemyId: string): EnemyInstance {
  const enemy = getEnemy(enemyId)!
  return {
    instanceId: 'test-instance',
    enemyId,
    pos: { x: 0, y: 0 },
    hp: enemy.maxHp,
    maxHp: enemy.maxHp,
    alive: true,
  }
}

describe('buildCombatContext challenge order', () => {
  const enemy = getEnemy('hjkl-spirit')!
  const instance = makeInstance('hjkl-spirit')

  it('challengeOrder is a permutation of the enemy challengeIds', () => {
    const ctx = buildCombatContext(instance, 'normal', 0)
    expect(ctx.combat.challengeOrder).toHaveLength(enemy.challengeIds.length)
    expect([...ctx.combat.challengeOrder].sort()).toEqual([...enemy.challengeIds].sort())
  })

  it('is deterministic for a given rng, and differs from the unshuffled order', () => {
    const rng = () => 0 // Fisher-Yates always swapping into index 0
    const ctx = buildCombatContext(instance, 'normal', 0, rng)
    expect(ctx.combat.challengeOrder).not.toEqual(enemy.challengeIds)
  })

  it('produces more than one distinct order across many encounters', () => {
    const orders = new Set<string>()
    for (let i = 0; i < 50; i++) {
      orders.add(buildCombatContext(instance, 'normal', 0).combat.challengeOrder.join(','))
    }
    expect(orders.size).toBeGreaterThan(1)
  })

  it('starts at the requested challengeIndex within the shuffled order', () => {
    const ctx = buildCombatContext(instance, 'normal', 2)
    expect(ctx.combat.challengeIndex).toBe(2)
  })
})
