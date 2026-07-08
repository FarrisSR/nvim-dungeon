export interface ScoreEntry {
  name: string
  xp: number
  level: number
  floorsCleared: number
  outcome: 'victory' | 'defeat'
  date: string // ISO
}

const API = '/dungeon-api/scores'
const NAME_KEY = 'nvim-dungeon-last-name'

export async function loadScores(limit = 20): Promise<ScoreEntry[]> {
  try {
    const r = await fetch(`${API}?limit=${limit}`)
    if (!r.ok) return []
    return r.json()
  } catch {
    return []
  }
}

export async function saveScore(entry: ScoreEntry): Promise<ScoreEntry[]> {
  try {
    const r = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    })
    if (!r.ok) return []
    return r.json()
  } catch {
    return []
  }
}

export function loadLastName(): string {
  return localStorage.getItem(NAME_KEY) ?? ''
}

export function saveLastName(name: string): void {
  localStorage.setItem(NAME_KEY, name)
}
