import { useState, useCallback, useRef } from 'react'
import type {
  RoguelikeState, GamePhase, VimMode, Vec2, EnemyInstance,
  LogEntry, ModeState, DungeonFloor, ActiveBuff,
} from '../types/game'
import { generateFloor } from '../lib/dungeonGen'
import { computeFOV } from '../lib/fov'
import { buildCombatContext, useCombat } from './useCombat'
import { useVimInput } from './useVimInput'
import type { GameAction } from './useVimInput'
import { getEnemy } from '../data/world'
import { getChallenge } from '../data/challenges'
import { getSpell, spells } from '../data/spells'
import type { Spell } from '../data/spells'

function uid() { return Math.random().toString(36).slice(2, 9) }

const FOV_RADIUS = 8
const STARTING_HP = 100
const VIEWPORT_W = 40
const VIEWPORT_H = 22
const MAX_FLOORS = 5

function sysLog(text: string): LogEntry {
  return { id: uid(), type: 'system', text }
}

function modeLog(text: string): LogEntry {
  return { id: uid(), type: 'mode', text }
}

function initMode(): ModeState {
  return {
    current: 'normal',
    previous: null,
    commandBuffer: '',
    keyBuffer: '',
    visualAnchor: null,
    visualSelection: [],
  }
}

function applyFOV(dungeon: DungeonFloor, pos: Vec2): DungeonFloor {
  // Deep-copy tiles to avoid mutating state directly
  const tiles = dungeon.tiles.map(row => row.map(t => ({ ...t })))
  computeFOV(tiles, pos, FOV_RADIUS)
  // Mark rooms as visited if their center is now visible
  const rooms = dungeon.rooms.map(room => {
    if (!room.visited) {
      const t = tiles[room.center.y]?.[room.center.x]
      if (t?.visible) return { ...room, visited: true }
    }
    return room
  })
  return { ...dungeon, tiles, rooms }
}

function buildFloor(floorNum: number, playerPos?: Vec2): DungeonFloor {
  const floor = generateFloor(floorNum)
  const pos = playerPos ?? floor.entryPos
  return applyFOV(floor, pos)
}

function getEnemyAt(dungeon: DungeonFloor, pos: Vec2): EnemyInstance | null {
  return dungeon.enemyInstances.find(
    e => e.alive && e.pos.x === pos.x && e.pos.y === pos.y
  ) ?? null
}

function isWalkable(dungeon: DungeonFloor, pos: Vec2): boolean {
  const tile = dungeon.tiles[pos.y]?.[pos.x]
  if (!tile) return false
  return tile.kind !== 'wall'
}

interface CastResult {
  found: boolean
  player: import('../types/game').PlayerState
  dungeon?: DungeonFloor
  msg: string
}

function castSpell(
  input: string,
  mode: import('../types/game').VimMode,
  player: import('../types/game').PlayerState,
  dungeon: DungeonFloor | null,
): CastResult {
  const spell = spells.find(
    (sp: Spell) =>
      sp.castMode === mode &&
      sp.castCommand.toLowerCase() === input.toLowerCase() &&
      player.knownSpells.includes(sp.id)
  )

  if (!spell) {
    return { found: false, player, msg: `Unknown incantation "${input}". Nothing happens.` }
  }

  let newPlayer = { ...player }
  let newDungeon: DungeonFloor | undefined
  let msg = ''

  switch (spell.effect.type) {
    case 'heal': {
      const restored = Math.min(player.maxHp, player.hp + spell.effect.amount) - player.hp
      newPlayer = { ...player, hp: player.hp + restored }
      msg = `${spell.emoji} ${spell.name}: restored ${restored} HP.`
      break
    }
    case 'ward': {
      newPlayer = { ...player, blocked: true }
      msg = `${spell.emoji} ${spell.name}: next hit blocked.`
      break
    }
    case 'buff': {
      const buff: ActiveBuff = {
        spellId: spell.id,
        multiplier: spell.effect.multiplier,
        roundsLeft: spell.effect.rounds,
      }
      newPlayer = { ...player, activeBuffs: [...player.activeBuffs, buff] }
      msg = `${spell.emoji} ${spell.name}: ×${spell.effect.multiplier} damage for ${spell.effect.rounds} challenge(s).`
      break
    }
    case 'reveal': {
      if (dungeon) {
        const revealed = {
          ...dungeon,
          tiles: dungeon.tiles.map(row => row.map(t => ({ ...t, explored: true, visible: true }))),
          rooms: dungeon.rooms.map(r => ({ ...r, visited: true })),
        }
        newDungeon = revealed
      }
      msg = `${spell.emoji} ${spell.name}: the entire floor is revealed!`
      break
    }
  }

  return { found: true, player: newPlayer, dungeon: newDungeon, msg }
}

function computeVisualSelection(anchor: Vec2, cursor: Vec2): Vec2[] {
  const cells: Vec2[] = []
  const x1 = Math.min(anchor.x, cursor.x)
  const x2 = Math.max(anchor.x, cursor.x)
  const y1 = Math.min(anchor.y, cursor.y)
  const y2 = Math.max(anchor.y, cursor.y)
  for (let y = y1; y <= y2; y++)
    for (let x = x1; x <= x2; x++)
      cells.push({ x, y })
  return cells
}

export const VIEWPORT_W_EXPORT = VIEWPORT_W
export const VIEWPORT_H_EXPORT = VIEWPORT_H

export function useRoguelikeState() {
  const initialFloor = buildFloor(1)

  const [state, setState] = useState<RoguelikeState>({
    phase: 'title',
    player: {
      name: '',
      hp: STARTING_HP,
      maxHp: STARTING_HP,
      xp: 0,
      level: 1,
      pos: initialFloor.entryPos,
      floor: 1,
      blocked: false,
      knownSpells: [],
      activeBuffs: [],
    },
    mode: initMode(),
    dungeon: null,
    combatContext: null,
    log: [],
    floorsCleared: 0,
  })

  const { submitAnswer, showHint } = useCombat()

  // Keep a ref to the latest state for use inside useVimInput callbacks
  const stateRef = useRef(state)
  stateRef.current = state

  const dispatch = useCallback((action: GameAction) => {
    setState(prev => {
      const s = prev
      const { player, mode, dungeon, log } = s

      function addLog(...entries: LogEntry[]): LogEntry[] {
        return [...log, ...entries].slice(-80)
      }

      // ── Mode transitions ─────────────────────────────────────────────────
      if (action.type === 'set-mode') {
        const next: VimMode = action.mode
        let anchor = mode.visualAnchor
        let sel = mode.visualSelection
        if (next === 'visual') {
          anchor = { ...player.pos }
          sel = [{ ...player.pos }]
        }
        if (next !== 'visual') {
          anchor = null
          sel = []
        }
        const modeLabels: Record<VimMode, string> = {
          normal: '-- NORMAL --', insert: '-- INSERT --',
          visual: '-- VISUAL --', command: '',
        }
        const logEntry = modeLog(modeLabels[next] || `-- ${next.toUpperCase()} --`)
        return {
          ...s,
          mode: {
            ...mode,
            current: next,
            previous: mode.current,
            commandBuffer: '',
            keyBuffer: '',
            visualAnchor: anchor,
            visualSelection: sel,
          },
          log: addLog(logEntry),
        }
      }

      if (action.type === 'key-buffer') {
        return { ...s, mode: { ...mode, keyBuffer: mode.keyBuffer + action.key } }
      }
      if (action.type === 'clear-key-buffer') {
        return { ...s, mode: { ...mode, keyBuffer: '' } }
      }

      // ── Movement ─────────────────────────────────────────────────────────
      if (action.type === 'move' && dungeon) {
        const next: Vec2 = { x: player.pos.x + action.dx, y: player.pos.y + action.dy }
        const enemy = getEnemyAt(dungeon, next)

        if (enemy) {
          // Bump into enemy → start combat
          const ctx = buildCombatContext(enemy, mode.current, 0)
          const enemyData = getEnemy(enemy.enemyId)!
          const bonusMsg = ctx.modeBonus > 1
            ? `Correct mode! Damage ×${ctx.modeBonus}`
            : `Wrong mode! Wants [${ctx.correctMode.toUpperCase()}]. Damage ×${ctx.modeBonus}`
          return {
            ...s,
            phase: 'combat',
            combatContext: ctx,
            log: addLog(
              sysLog(`You face ${enemyData.name}! ${enemyData.emoji}`),
              sysLog(bonusMsg),
            ),
          }
        }

        if (!isWalkable(dungeon, next)) return s

        // Check stairs
        const tile = dungeon.tiles[next.y]?.[next.x]
        if (tile?.kind === 'stair-down') {
          const newFloorsCleared = s.floorsCleared + 1
          if (player.floor >= MAX_FLOORS) {
            return {
              ...s,
              phase: 'victory',
              floorsCleared: newFloorsCleared,
              log: addLog(sysLog('You escape the dungeon! Victory!')),
            }
          }
          const newFloorNum = player.floor + 1
          const newFloor = buildFloor(newFloorNum)
          return {
            ...s,
            player: { ...player, pos: newFloor.entryPos, floor: newFloorNum, activeBuffs: [] },
            dungeon: newFloor,
            floorsCleared: newFloorsCleared,
            log: addLog(sysLog(`You descend to floor ${newFloorNum} of ${MAX_FLOORS}...`)),
          }
        }

        // Check scroll pickup
        const scroll = dungeon.items.find(i => !i.picked && i.pos.x === next.x && i.pos.y === next.y)
        if (scroll) {
          const spell = getSpell(scroll.spellId)
          const newItems = dungeon.items.map(i => i.id === scroll.id ? { ...i, picked: true } : i)
          const alreadyKnown = player.knownSpells.includes(scroll.spellId)
          const newSpells = alreadyKnown ? player.knownSpells : [...player.knownSpells, scroll.spellId]
          const newDungeon = applyFOV({ ...dungeon, items: newItems }, next)
          return {
            ...s,
            player: { ...player, pos: next, knownSpells: newSpells },
            dungeon: newDungeon,
            log: addLog(
              sysLog(`📜 Found: ${spell?.name ?? 'Unknown Scroll'} — ${spell?.lore ?? ''}`),
            ),
          }
        }

        const newDungeon = applyFOV(dungeon, next)
        return { ...s, player: { ...player, pos: next }, dungeon: newDungeon }
      }

      // ── Chord actions ─────────────────────────────────────────────────────
      if (action.type === 'chord-dd' && dungeon) {
        // Attack adjacent enemy (first found)
        const dirs = [{dx:-1,dy:0},{dx:1,dy:0},{dx:0,dy:-1},{dx:0,dy:1}]
        const target = dirs.map(d => getEnemyAt(dungeon, {x: player.pos.x+d.dx, y: player.pos.y+d.dy}))
          .find(Boolean)
        if (target) {
          const ctx = buildCombatContext(target, mode.current, 0)
          const enemyData = getEnemy(target.enemyId)!
          return {
            ...s,
            phase: 'combat',
            combatContext: ctx,
            log: addLog(sysLog(`You attack ${enemyData.name}! ${enemyData.emoji}`)),
          }
        }
        return { ...s, log: addLog(sysLog('No adjacent enemy to attack.')) }
      }

      if (action.type === 'chord-yy') {
        return {
          ...s,
          player: { ...player, blocked: true },
          log: addLog(sysLog('You ready a ward. Next hit is blocked.')),
        }
      }

      if (action.type === 'chord-gg' && dungeon) {
        const newDungeon = applyFOV(dungeon, dungeon.entryPos)
        return {
          ...s,
          player: { ...player, pos: dungeon.entryPos },
          dungeon: newDungeon,
          log: addLog(sysLog('You warp to the floor entry.')),
        }
      }

      if (action.type === 'move-to-stair' && dungeon) {
        const newDungeon = applyFOV(dungeon, dungeon.stairPos)
        return {
          ...s,
          player: { ...player, pos: dungeon.stairPos },
          dungeon: newDungeon,
          log: addLog(sysLog('You warp to the stairs.')),
        }
      }

      // ── Normal-mode spells (e.g. *) ──────────────────────────────────────
      if (action.type === 'normal-spell') {
        const result = castSpell(action.command, 'normal', player, dungeon)
        if (result.found) {
          return {
            ...s,
            player: result.player,
            dungeon: result.dungeon ?? dungeon,
            log: addLog(sysLog(result.msg)),
          }
        }
        return { ...s, log: addLog(sysLog(`No spell for "${action.command}" in NORMAL mode.`)) }
      }

      // ── Telescope ─────────────────────────────────────────────────────────
      if (action.type === 'open-telescope') {
        return { ...s, phase: 'telescope' }
      }
      if (action.type === 'close-telescope') {
        return { ...s, phase: 'exploring' }
      }

      if (action.type === 'open-spellbook') {
        return { ...s, phase: 'spellbook' }
      }
      if (action.type === 'close-spellbook') {
        return { ...s, phase: 'exploring' }
      }
      if (action.type === 'telescope-select' && dungeon) {
        // Fast-travel: handled in TelescopeOverlay; here just close
        return { ...s, phase: 'exploring' }
      }

      // ── Visual mode ───────────────────────────────────────────────────────
      if (action.type === 'visual-extend') {
        const newPos: Vec2 = {
          x: player.pos.x + action.dx,
          y: player.pos.y + action.dy,
        }
        if (!dungeon || !isWalkable(dungeon, newPos)) return s
        const anchor = mode.visualAnchor ?? player.pos
        const sel = computeVisualSelection(anchor, newPos)
        return {
          ...s,
          player: { ...player, pos: newPos },
          mode: { ...mode, visualSelection: sel },
        }
      }

      if (action.type === 'visual-attack' && dungeon) {
        const sel = mode.visualSelection
        const hits = dungeon.enemyInstances.filter(
          e => e.alive && sel.some(p => p.x === e.pos.x && p.y === e.pos.y)
        )
        if (hits.length === 0) {
          return {
            ...s,
            mode: { ...mode, current: 'normal', visualAnchor: null, visualSelection: [] },
            log: addLog(sysLog('No enemies in selection.')),
          }
        }
        // Pick first hit enemy and start combat
        const target = hits[0]
        const ctx = buildCombatContext(target, 'visual', 0)
        const enemyData = getEnemy(target.enemyId)!
        return {
          ...s,
          phase: 'combat',
          combatContext: ctx,
          mode: { ...mode, current: 'normal', visualAnchor: null, visualSelection: [] },
          log: addLog(sysLog(`Visual AoE! You engage ${enemyData.name}!`)),
        }
      }

      // ── Insert incantations ───────────────────────────────────────────────
      if (action.type === 'insert-char') {
        return { ...s, mode: { ...mode, commandBuffer: mode.commandBuffer + action.char } }
      }
      if (action.type === 'insert-backspace') {
        return { ...s, mode: { ...mode, commandBuffer: mode.commandBuffer.slice(0, -1) } }
      }
      if (action.type === 'insert-submit') {
        const text = mode.commandBuffer.trim().toLowerCase()
        const result = castSpell(text, 'insert', player, dungeon)
        return {
          ...s,
          player: result.player,
          dungeon: result.dungeon ?? dungeon,
          mode: { ...mode, current: 'normal', previous: 'insert', commandBuffer: '' },
          log: addLog(sysLog(result.msg)),
        }
      }

      // ── Command mode ──────────────────────────────────────────────────────
      if (action.type === 'command-char') {
        return { ...s, mode: { ...mode, commandBuffer: mode.commandBuffer + action.char } }
      }
      if (action.type === 'command-backspace') {
        const buf = mode.commandBuffer.slice(0, -1)
        if (buf === '') {
          return { ...s, mode: { ...mode, current: 'normal', commandBuffer: '' } }
        }
        return { ...s, mode: { ...mode, commandBuffer: buf } }
      }
      if (action.type === 'command-submit') {
        const cmd = mode.commandBuffer.trim()
        let result = { ...s, mode: { ...mode, current: 'normal' as VimMode, commandBuffer: '' } }
        if (cmd === 'q') {
          result.log = addLog(sysLog(':q — use :q! to quit to title.'))
        } else if (cmd === 'q!') {
          result = { ...result, phase: 'title' as GamePhase }
        } else if (cmd === 'w') {
          result.log = addLog(sysLog(':w — progress saved. (localStorage not yet wired)'))
        } else {
          // Try as a known spell command (command mode)
          const spellResult = castSpell(cmd, 'command', player, dungeon)
          if (spellResult.found) {
            result.player = spellResult.player
            if (spellResult.dungeon) result.dungeon = spellResult.dungeon
            result.log = addLog(sysLog(spellResult.msg))
          } else {
            result.log = addLog(sysLog(`E492: Not an editor command: ${cmd}`))
          }
        }
        return result
      }

      return s
    })
  }, [])

  // ── Combat action handlers ────────────────────────────────────────────────
  const handleCombatSubmit = useCallback((input: string) => {
    setState(prev => {
      const { combatContext, player, dungeon, log } = prev
      if (!combatContext || !dungeon) return prev

      const instance = dungeon.enemyInstances.find(
        e => e.instanceId === combatContext.combat.enemyInstanceId
      )
      if (!instance) return prev

      function addLog(...entries: LogEntry[]) {
        return [...log, ...entries].slice(-80)
      }

      const result = submitAnswer(input, combatContext, player, instance)

      if (result.type === 'player-dead') {
        return {
          ...prev,
          phase: 'defeat',
          player: { ...player, hp: 0 },
          combatContext: null,
          log: addLog(...result.logs),
        }
      }

      if (result.type === 'enemy-dead') {
        const newInstances = dungeon.enemyInstances.map(e =>
          e.instanceId === instance.instanceId ? { ...e, alive: false } : e
        )
        // Check if room is cleared
        const room = dungeon.rooms.find(r => r.enemyInstanceIds.includes(instance.instanceId))
        const newRooms = dungeon.rooms.map(r => {
          if (r.id === room?.id) {
            const allDead = r.enemyInstanceIds.every(
              id => newInstances.find(e => e.instanceId === id)?.alive === false
            )
            return allDead ? { ...r, cleared: true } : r
          }
          return r
        })
        const newDungeon = { ...dungeon, enemyInstances: newInstances, rooms: newRooms }
        const refovDungeon = applyFOV(newDungeon, result.player.pos)
        return {
          ...prev,
          phase: 'exploring',
          player: result.player,
          dungeon: refovDungeon,
          combatContext: null,
          log: addLog(...result.logs),
        }
      }

      // continue
      const newCtx = { ...combatContext, combat: result.combat }
      return {
        ...prev,
        player: result.player,
        combatContext: newCtx,
        log: addLog(...result.logs),
      }
    })
  }, [submitAnswer])

  const handleCombatHint = useCallback(() => {
    setState(prev => {
      const { combatContext } = prev
      if (!combatContext) return prev
      const result = showHint(combatContext)
      if (!result) return prev
      return {
        ...prev,
        combatContext: result.newContext,
        log: [...prev.log, result.log].slice(-80),
      }
    })
  }, [showHint])

  const handleCombatRetreat = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'exploring',
      combatContext: null,
      log: [...prev.log, sysLog('You retreat!')].slice(-80),
    }))
  }, [])

  const handleTeleportToRoom = useCallback((roomId: string) => {
    setState(prev => {
      const { dungeon } = prev
      if (!dungeon) return prev
      const room = dungeon.rooms.find(r => r.id === roomId)
      if (!room || !room.visited) return prev
      const newDungeon = applyFOV(dungeon, room.center)
      return {
        ...prev,
        phase: 'exploring',
        player: { ...prev.player, pos: room.center },
        dungeon: newDungeon,
        log: [...prev.log, sysLog(`Teleported to ${room.id}.`)].slice(-80),
      }
    })
  }, [])

  // ── Phase setters ─────────────────────────────────────────────────────────
  const startGame = useCallback((name: string) => {
    const floor = buildFloor(1)
    setState(prev => ({
      ...prev,
      phase: 'exploring',
      player: {
        name,
        hp: STARTING_HP,
        maxHp: STARTING_HP,
        xp: 0,
        level: 1,
        pos: floor.entryPos,
        floor: 1,
        blocked: false,
      knownSpells: [],
      activeBuffs: [],
      },
      mode: initMode(),
      dungeon: floor,
      combatContext: null,
      log: [sysLog(`Welcome, ${name}. The dungeon awaits.`)],
      floorsCleared: 0,
    }))
  }, [])

  const setPhase = useCallback((phase: GamePhase) => {
    setState(prev => ({ ...prev, phase }))
  }, [])

  const restart = useCallback(() => {
    const floor = buildFloor(1)
    setState({
      phase: 'title',
      player: {
        name: '',
        hp: STARTING_HP,
        maxHp: STARTING_HP,
        xp: 0,
        level: 1,
        pos: floor.entryPos,
        floor: 1,
        blocked: false,
      knownSpells: [],
      activeBuffs: [],
      },
      mode: initMode(),
      dungeon: null,
      combatContext: null,
      log: [],
      floorsCleared: 0,
    })
  }, [])

  // ── Wire input ────────────────────────────────────────────────────────────
  useVimInput({
    phase: state.phase,
    mode: state.mode.current,
    keyBuffer: state.mode.keyBuffer,
    onAction: dispatch,
  })

  // Derived combat values
  const currentInstance = state.combatContext && state.dungeon
    ? state.dungeon.enemyInstances.find(
        e => e.instanceId === state.combatContext!.combat.enemyInstanceId
      ) ?? null
    : null

  const currentEnemy = currentInstance ? getEnemy(currentInstance.enemyId) : null

  const currentChallenge = (() => {
    if (!currentEnemy || !state.combatContext) return null
    const { challengeOrder, challengeIndex } = state.combatContext.combat
    return getChallenge(challengeOrder[challengeIndex]) ?? null
  })()

  return {
    ...state,
    currentInstance,
    currentEnemy,
    currentChallenge,
    // Actions
    setPhase,
    startGame,
    restart,
    dispatch,
    handleCombatSubmit,
    handleCombatHint,
    handleCombatRetreat,
    handleTeleportToRoom,
  }
}
