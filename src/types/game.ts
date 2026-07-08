// ── Vim modes ──────────────────────────────────────────────────────────────
export type VimMode = 'normal' | 'insert' | 'visual' | 'command'

// ── Phases ─────────────────────────────────────────────────────────────────
export type GamePhase =
  | 'title'
  | 'name-entry'
  | 'exploring'
  | 'combat'
  | 'telescope'
  | 'spellbook'
  | 'victory'
  | 'defeat'

// ── Skill / category ───────────────────────────────────────────────────────
export type SkillLevel = 'novice' | 'apprentice' | 'adept' | 'master'

export type ChallengeCategory =
  | 'movement'
  | 'editing'
  | 'search'
  | 'visual'
  | 'macro'
  | 'lsp'
  | 'fzf'
  | 'snacks'
  | 'gitsigns'
  | 'flash'
  | 'textobjects'
  | 'grugfar'
  | 'neotree'
  | 'session'
  | 'todo'

// ── Challenge ──────────────────────────────────────────────────────────────
export interface Challenge {
  id: string
  command: string
  aliases?: string[]
  description: string
  hint: string
  hintFull: string
  lore: string
  category: ChallengeCategory
  xpReward: number
}

// ── Enemy archetype (static data) ──────────────────────────────────────────
export interface Enemy {
  id: string
  name: string
  emoji: string
  hp: number
  maxHp: number
  damage: number
  challengeIds: string[]
  deathLore: string
  level: SkillLevel
  color: string
}

// ── Tile world ─────────────────────────────────────────────────────────────
export type TileKind = 'wall' | 'floor' | 'corridor' | 'door' | 'stair-down'

export interface Vec2 {
  x: number
  y: number
}

export interface Tile {
  kind: TileKind
  visible: boolean   // inside current FOV
  explored: boolean  // seen at least once (rendered dim)
  roomId: string | null
}

export interface TileRoom {
  id: string
  x: number
  y: number
  w: number
  h: number
  center: Vec2
  enemyInstanceIds: string[]
  cleared: boolean
  visited: boolean
}

export interface EnemyInstance {
  instanceId: string
  enemyId: string
  pos: Vec2
  hp: number
  maxHp: number
  alive: boolean
}

export interface ScrollItem {
  id: string
  spellId: string
  pos: Vec2
  picked: boolean
}

export interface DungeonFloor {
  id: number
  width: number
  height: number
  tiles: Tile[][]         // [y][x]
  rooms: TileRoom[]
  enemyInstances: EnemyInstance[]
  items: ScrollItem[]
  stairPos: Vec2
  entryPos: Vec2
}

// ── Vim mode state ─────────────────────────────────────────────────────────
export interface ModeState {
  current: VimMode
  previous: VimMode | null
  commandBuffer: string    // chars accumulated after ':' in command mode
  keyBuffer: string        // chord accumulation: 'd', 'y', '<leader>', etc.
  visualAnchor: Vec2 | null
  visualSelection: Vec2[]
}

// ── Player ─────────────────────────────────────────────────────────────────
export interface ActiveBuff {
  spellId: string
  multiplier: number
  roundsLeft: number
}

export interface PlayerState {
  name: string
  hp: number
  maxHp: number
  xp: number
  level: number
  pos: Vec2
  floor: number
  blocked: boolean        // one-hit block from 'ward' incantation
  knownSpells: string[]   // spell IDs learned from scrolls
  activeBuffs: ActiveBuff[]
}

// ── Combat ─────────────────────────────────────────────────────────────────
export interface LogEntry {
  id: string
  type: 'damage' | 'correct' | 'wrong' | 'hint' | 'system' | 'move' | 'mode'
  text: string
}

export interface CombatState {
  enemyInstanceId: string
  enemyHp: number
  challengeOrder: string[]  // enemy.challengeIds shuffled once per encounter
  challengeIndex: number
  attempts: number
  hintLevel: 0 | 1 | 2
}

export interface CombatContext {
  combat: CombatState
  modeBonus: number        // 1.25 correct mode | 0.75 wrong mode
  correctMode: VimMode     // mode the challenge category wants
}

// ── Top-level game state ───────────────────────────────────────────────────
export interface RoguelikeState {
  phase: GamePhase
  player: PlayerState
  mode: ModeState
  dungeon: DungeonFloor | null
  combatContext: CombatContext | null
  log: LogEntry[]
  floorsCleared: number
}
