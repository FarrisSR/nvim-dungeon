import { useCallback } from 'react'
import type {
  CombatContext, CombatState, PlayerState, EnemyInstance, LogEntry, VimMode,
} from '../types/game'
import { getChallenge } from '../data/challenges'
import { getEnemy } from '../data/world'
import { categoryToMode } from '../lib/modeMap'
import { shuffle } from '../lib/shuffle'

function uid() { return Math.random().toString(36).slice(2, 9) }

function xpToLevel(xp: number): number {
  if (xp < 100)  return 1
  if (xp < 250)  return 2
  if (xp < 500)  return 3
  if (xp < 800)  return 4
  if (xp < 1200) return 5
  return 6
}

export type CombatResult =
  | { type: 'continue'; combat: CombatState; player: PlayerState; logs: LogEntry[] }
  | { type: 'enemy-dead'; player: PlayerState; logs: LogEntry[] }
  | { type: 'player-dead'; logs: LogEntry[] }

export function buildCombatContext(
  instance: EnemyInstance,
  currentMode: VimMode,
  challengeIndex = 0,
  rng: () => number = Math.random,
): CombatContext {
  const enemy = getEnemy(instance.enemyId)!
  const challengeOrder = shuffle(enemy.challengeIds, rng)
  const challengeId = challengeOrder[challengeIndex % challengeOrder.length]
  const challenge = getChallenge(challengeId)!
  const correctMode = categoryToMode(challenge.category)
  const modeBonus = currentMode === correctMode ? 1.25 : 0.75
  return {
    combat: {
      enemyInstanceId: instance.instanceId,
      enemyHp: instance.hp,
      challengeOrder,
      challengeIndex,
      attempts: 0,
      hintLevel: 0,
    },
    modeBonus,
    correctMode,
  }
}

export function useCombat() {
  const submitAnswer = useCallback((
    input: string,
    ctx: CombatContext,
    player: PlayerState,
    instance: EnemyInstance,
  ): CombatResult => {
    const enemy = getEnemy(instance.enemyId)!
    const challengeId = ctx.combat.challengeOrder[ctx.combat.challengeIndex]
    const challenge = getChallenge(challengeId)!

    const normalised = input.trim().toLowerCase()
    const correct =
      normalised === challenge.command.toLowerCase() ||
      (challenge.aliases ?? []).some(a => normalised === a.toLowerCase())

    const logs: LogEntry[] = []

    if (correct) {
      // Apply active buff multiplier (use the first buff, decrement rounds)
      const activeBuff = player.activeBuffs[0] ?? null
      const buffMultiplier = activeBuff ? activeBuff.multiplier : 1.0
      const newBuffs = activeBuff
        ? player.activeBuffs
            .map((b, i) => i === 0 ? { ...b, roundsLeft: b.roundsLeft - 1 } : b)
            .filter(b => b.roundsLeft > 0)
        : player.activeBuffs

      const dmgToEnemy = Math.ceil(
        (instance.maxHp / enemy.challengeIds.length) * ctx.modeBonus * buffMultiplier
      )
      const newEnemyHp = Math.max(0, ctx.combat.enemyHp - dmgToEnemy)
      const retaliation = Math.ceil(enemy.damage * 0.3)
      const newPlayerHp = Math.max(0, player.hp - retaliation)
      const newXp = player.xp + challenge.xpReward

      logs.push({
        id: uid(), type: 'correct',
        text: `✓ "${challenge.command}" — ${challenge.description} (+${challenge.xpReward} XP)${activeBuff ? ` 🔥×${activeBuff.multiplier}` : ''}`,
      })
      if (retaliation > 0) {
        logs.push({ id: uid(), type: 'damage', text: `${enemy.name} retaliates for ${retaliation} damage.` })
      }

      if (newPlayerHp <= 0) {
        return { type: 'player-dead', logs }
      }

      const nextIndex = ctx.combat.challengeIndex + 1
      const enemyDefeated = nextIndex >= ctx.combat.challengeOrder.length || newEnemyHp <= 0

      if (enemyDefeated) {
        logs.push({ id: uid(), type: 'system', text: `${enemy.name} defeated! ${enemy.deathLore}` })
        return {
          type: 'enemy-dead',
          player: { ...player, hp: newPlayerHp, xp: newXp, level: xpToLevel(newXp), activeBuffs: newBuffs },
          logs,
        }
      }

      return {
        type: 'continue',
        player: { ...player, hp: newPlayerHp, xp: newXp, level: xpToLevel(newXp), activeBuffs: newBuffs },
        combat: {
          ...ctx.combat,
          enemyHp: newEnemyHp,
          challengeIndex: nextIndex,
          attempts: 0,
          hintLevel: 0,
        },
        logs,
      }
    } else {
      const dmg = player.blocked ? 0 : enemy.damage
      const newPlayerHp = Math.max(0, player.hp - dmg)
      logs.push({
        id: uid(), type: 'wrong',
        text: player.blocked
          ? `Wrong — but your ward absorbs the blow! (${enemy.name} deals 0 damage)`
          : `✗ Wrong. ${enemy.name} strikes for ${dmg} damage.`,
      })
      if (newPlayerHp <= 0) {
        return { type: 'player-dead', logs }
      }
      return {
        type: 'continue',
        player: { ...player, hp: newPlayerHp, blocked: false },
        combat: { ...ctx.combat, attempts: ctx.combat.attempts + 1 },
        logs,
      }
    }
  }, [])

  const showHint = useCallback((
    ctx: CombatContext,
  ): { newContext: CombatContext; log: LogEntry } | null => {
    if (ctx.combat.hintLevel >= 2) return null
    const challenge = getChallenge(ctx.combat.challengeOrder[ctx.combat.challengeIndex])!
    const newLevel = (ctx.combat.hintLevel + 1) as 1 | 2
    const text = newLevel === 1 ? challenge.hint : challenge.hintFull
    return {
      newContext: { ...ctx, combat: { ...ctx.combat, hintLevel: newLevel } },
      log: { id: uid(), type: 'hint', text: `Hint: ${text}` },
    }
  }, [])

  return { submitAnswer, showHint }
}
