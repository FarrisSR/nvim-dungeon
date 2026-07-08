export type SpellEffect =
  | { type: 'heal'; amount: number }
  | { type: 'ward' }
  | { type: 'buff'; multiplier: number; rounds: number }
  | { type: 'reveal' }

export type CastMode = 'insert' | 'command' | 'normal'

export interface Spell {
  id: string
  name: string
  emoji: string
  effect: SpellEffect
  castMode: CastMode
  castCommand: string   // exact string the player types
  description: string   // short effect description
  lore: string          // flavour text on the scroll
}

export const spells: Spell[] = [
  {
    id: 'minor-heal',
    name: 'Minor Healing',
    emoji: '🩹',
    effect: { type: 'heal', amount: 25 },
    castMode: 'insert',
    castCommand: 'heal',
    description: 'Restore 25 HP',
    lore: 'The parchment glows with a soft green light. Type "heal" in INSERT mode.',
  },
  {
    id: 'major-heal',
    name: 'Major Healing',
    emoji: '💊',
    effect: { type: 'heal', amount: 50 },
    castMode: 'command',
    castCommand: 's/wound/health/',
    description: 'Restore 50 HP',
    lore: 'A substitution of suffering. Use :s/wound/health/ in COMMAND mode.',
  },
  {
    id: 'ward',
    name: 'Ward',
    emoji: '🛡️',
    effect: { type: 'ward' },
    castMode: 'insert',
    castCommand: 'ward',
    description: 'Block the next hit',
    lore: 'A protective rune. Type "ward" in INSERT mode.',
  },
  {
    id: 'iron-ward',
    name: 'Iron Ward',
    emoji: '⚔️',
    effect: { type: 'ward' },
    castMode: 'normal',
    castCommand: 'yy',
    description: 'Block the next hit (yank your defences)',
    lore: 'Yank your resilience into a register. Type "yy" in NORMAL mode.',
  },
  {
    id: 'battle-fury',
    name: 'Battle Fury',
    emoji: '🔥',
    effect: { type: 'buff', multiplier: 1.5, rounds: 3 },
    castMode: 'insert',
    castCommand: 'buff',
    description: 'Next 3 challenges: ×1.5 damage',
    lore: 'Raw fury inscribed in ink. Type "buff" in INSERT mode.',
  },
  {
    id: 'force-command',
    name: 'Force Command',
    emoji: '💥',
    effect: { type: 'buff', multiplier: 2.0, rounds: 1 },
    castMode: 'command',
    castCommand: 'norm dd',
    description: 'Next challenge: ×2.0 damage',
    lore: 'Execute with force. Use :norm dd in COMMAND mode.',
  },
  {
    id: 'reveal',
    name: 'Cartographer\'s Eye',
    emoji: '🗺️',
    effect: { type: 'reveal' },
    castMode: 'command',
    castCommand: '%s/dark/light/g',
    description: 'Reveal the entire floor',
    lore: 'Replace darkness with light. Use :%s/dark/light/g in COMMAND mode.',
  },
  {
    id: 'reveal-search',
    name: 'Far Sight',
    emoji: '🔭',
    effect: { type: 'reveal' },
    castMode: 'normal',
    castCommand: '*',
    description: 'Reveal the entire floor',
    lore: 'Search for what is hidden. Press * in NORMAL mode.',
  },
  {
    id: 'purify',
    name: 'Purify',
    emoji: '✨',
    effect: { type: 'heal', amount: 15 },
    castMode: 'insert',
    castCommand: 'purify',
    description: 'Restore 15 HP and clear debuffs',
    lore: 'Cleanse the corruption. Type "purify" in INSERT mode.',
  },
]

export function getSpell(id: string): Spell | undefined {
  return spells.find(s => s.id === id)
}

// Pick a random subset of spells for floor loot
export function randomSpellsForFloor(_floorNumber: number, count: number): Spell[] {
  const pool = [...spells]
  const result: Spell[] = []
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    result.push(pool.splice(idx, 1)[0])
  }
  return result
}
