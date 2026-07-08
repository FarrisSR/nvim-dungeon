import type { DungeonFloor, Tile, TileKind, TileRoom, EnemyInstance, Vec2, ScrollItem } from '../types/game'
import { enemies } from '../data/world'
import { randomSpellsForFloor } from '../data/spells'
import type { SkillLevel } from '../types/game'

const W = 80
const H = 50

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

function makeTile(kind: TileKind): Tile {
  return { kind, visible: false, explored: false, roomId: null }
}

function emptyGrid(): Tile[][] {
  return Array.from({ length: H }, () =>
    Array.from({ length: W }, () => makeTile('wall'))
  )
}

function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
  buffer = 1
): boolean {
  return (
    ax - buffer < bx + bw &&
    ax + aw + buffer > bx &&
    ay - buffer < by + bh &&
    ay + ah + buffer > by
  )
}

function carveRoom(tiles: Tile[][], room: TileRoom) {
  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) {
      tiles[y][x] = { kind: 'floor', visible: false, explored: false, roomId: room.id }
    }
  }
}

function carveCorridor(tiles: Tile[][], from: Vec2, to: Vec2) {
  // Horizontal then vertical L-corridor
  const x1 = Math.min(from.x, to.x)
  const x2 = Math.max(from.x, to.x)
  for (let x = x1; x <= x2; x++) {
    if (tiles[from.y][x].kind === 'wall') {
      tiles[from.y][x] = { kind: 'corridor', visible: false, explored: false, roomId: null }
    }
  }
  const y1 = Math.min(from.y, to.y)
  const y2 = Math.max(from.y, to.y)
  for (let y = y1; y <= y2; y++) {
    if (tiles[y][to.x].kind === 'wall') {
      tiles[y][to.x] = { kind: 'corridor', visible: false, explored: false, roomId: null }
    }
  }
}

function placeDoors(tiles: Tile[][], rooms: TileRoom[]) {
  for (const room of rooms) {
    // Check perimeter tiles for corridor adjacency
    for (let x = room.x; x < room.x + room.w; x++) {
      for (const y of [room.y - 1, room.y + room.h]) {
        if (y >= 0 && y < H && tiles[y][x].kind === 'corridor') {
          tiles[y][x] = { kind: 'door', visible: false, explored: false, roomId: null }
        }
      }
    }
    for (let y = room.y; y < room.y + room.h; y++) {
      for (const x of [room.x - 1, room.x + room.w]) {
        if (x >= 0 && x < W && tiles[y][x].kind === 'corridor') {
          tiles[y][x] = { kind: 'door', visible: false, explored: false, roomId: null }
        }
      }
    }
  }
}

function levelForFloor(floor: number): SkillLevel {
  if (floor <= 1) return 'novice'
  if (floor <= 2) return 'apprentice'
  if (floor <= 3) return 'adept'
  return 'master'
}

function pickEnemiesForRoom(floor: number, count: number): string[] {
  const level = levelForFloor(floor)
  const pool = enemies.filter(e => e.level === level)
  if (pool.length === 0) return enemies.slice(0, count).map(e => e.id)
  const result: string[] = []
  for (let i = 0; i < count; i++) {
    result.push(pool[Math.floor(Math.random() * pool.length)].id)
  }
  return result
}

function randomFloorTile(tiles: Tile[][], room: TileRoom, exclude: Vec2[]): Vec2 | null {
  const candidates: Vec2[] = []
  for (let y = room.y + 1; y < room.y + room.h - 1; y++) {
    for (let x = room.x + 1; x < room.x + room.w - 1; x++) {
      const blocked = exclude.some(p => p.x === x && p.y === y)
      if (!blocked && tiles[y][x].kind === 'floor') {
        candidates.push({ x, y })
      }
    }
  }
  if (candidates.length === 0) return null
  return candidates[Math.floor(Math.random() * candidates.length)]
}

export function generateFloor(floorNumber: number): DungeonFloor {
  const tiles = emptyGrid()
  const rooms: TileRoom[] = []
  const targetRooms = Math.min(5 + floorNumber, 12)

  // Room placement
  for (let attempt = 0; attempt < 300 && rooms.length < targetRooms; attempt++) {
    const rw = 5 + Math.floor(Math.random() * 10)  // 5–14
    const rh = 4 + Math.floor(Math.random() * 6)   // 4–9
    const rx = 1 + Math.floor(Math.random() * (W - rw - 2))
    const ry = 1 + Math.floor(Math.random() * (H - rh - 2))

    const overlaps = rooms.some(r =>
      rectsOverlap(rx, ry, rw, rh, r.x, r.y, r.w, r.h, 1)
    )
    if (overlaps) continue

    const id = `room-${uid()}`
    const room: TileRoom = {
      id,
      x: rx, y: ry, w: rw, h: rh,
      center: { x: Math.floor(rx + rw / 2), y: Math.floor(ry + rh / 2) },
      enemyInstanceIds: [],
      cleared: false,
      visited: false,
    }
    carveRoom(tiles, room)
    rooms.push(room)
  }

  // Connect rooms with L-corridors
  for (let i = 1; i < rooms.length; i++) {
    carveCorridor(tiles, rooms[i - 1].center, rooms[i].center)
  }

  placeDoors(tiles, rooms)

  // Place stair in last room
  const lastRoom = rooms[rooms.length - 1]
  tiles[lastRoom.center.y][lastRoom.center.x] = {
    kind: 'stair-down', visible: false, explored: false, roomId: lastRoom.id,
  }

  // Place enemies
  const enemyInstances: EnemyInstance[] = []
  for (let i = 1; i < rooms.length; i++) {   // skip spawn room
    const room = rooms[i]
    if (room.id === lastRoom.id) continue    // skip stair room enemies for now
    const count = 1 + Math.floor(Math.random() * 2)
    const enemyIds = pickEnemiesForRoom(floorNumber, count)
    const occupied: Vec2[] = []

    for (const enemyId of enemyIds) {
      const enemy = enemies.find(e => e.id === enemyId)
      if (!enemy) continue
      const pos = randomFloorTile(tiles, room, [room.center, ...occupied])
      if (!pos) continue
      const inst: EnemyInstance = {
        instanceId: uid(),
        enemyId,
        pos,
        hp: enemy.maxHp,
        maxHp: enemy.maxHp,
        alive: true,
      }
      enemyInstances.push(inst)
      room.enemyInstanceIds.push(inst.instanceId)
      occupied.push(pos)
    }
  }

  // Place scroll items (1-2 per floor, in random rooms)
  const scrollCount = 1 + Math.floor(Math.random() * 2)
  const floorSpells = randomSpellsForFloor(floorNumber, scrollCount)
  const items: ScrollItem[] = []
  const occupiedByItems: Vec2[] = []

  for (const spell of floorSpells) {
    // Pick a room that isn't the first or last
    const eligibleRooms = rooms.slice(1, -1)
    if (eligibleRooms.length === 0) break
    const room = eligibleRooms[Math.floor(Math.random() * eligibleRooms.length)]
    const allOccupied = [
      room.center,
      ...enemyInstances.filter(e => e.pos).map(e => e.pos),
      ...occupiedByItems,
    ]
    const pos = randomFloorTile(tiles, room, allOccupied)
    if (!pos) continue
    items.push({ id: uid(), spellId: spell.id, pos, picked: false })
    occupiedByItems.push(pos)
  }

  return {
    id: floorNumber,
    width: W,
    height: H,
    tiles,
    rooms,
    enemyInstances,
    items,
    stairPos: lastRoom.center,
    entryPos: rooms[0].center,
  }
}
