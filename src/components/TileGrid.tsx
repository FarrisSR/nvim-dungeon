import { useMemo } from 'react'
import type { DungeonFloor, PlayerState, Vec2, EnemyInstance, ScrollItem } from '../types/game'
import { getEnemy } from '../data/world'

const VIEWPORT_W = 40
const VIEWPORT_H = 22

interface Props {
  dungeon: DungeonFloor
  player: PlayerState
  visualSelection: Vec2[]
  blurred?: boolean
}

function tileGlyph(
  dungeon: DungeonFloor,
  x: number,
  y: number,
  player: PlayerState,
  enemies: EnemyInstance[],
  items: ScrollItem[],
  visualSelection: Vec2[],
): { char: string; cls: string } {
  if (x === player.pos.x && y === player.pos.y) {
    return { char: '@', cls: 'text-nvim-lavender font-bold' }
  }

  const enemy = enemies.find(e => e.alive && e.pos.x === x && e.pos.y === y)
  const scroll = items.find(i => !i.picked && i.pos.x === x && i.pos.y === y)
  const tile = dungeon.tiles[y]?.[x]

  if (!tile) return { char: ' ', cls: '' }

  const inSel = visualSelection.some(p => p.x === x && p.y === y)

  if (!tile.visible && !tile.explored) {
    return { char: ' ', cls: 'bg-nvim-crust' }
  }

  const dim = !tile.visible // explored but not in FOV

  if (scroll && tile.visible) {
    return { char: '?', cls: `text-nvim-yellow font-bold${inSel ? ' bg-nvim-surface1' : ''}` }
  }

  if (enemy) {
    const data = getEnemy(enemy.enemyId)
    const base = dim ? 'text-nvim-surface2' : (data?.color ?? 'text-nvim-red')
    return { char: data?.emoji ?? 'E', cls: `${base}${inSel ? ' bg-nvim-surface1' : ''}` }
  }

  if (inSel) {
    return tileCharDim(tile.kind, dim, true)
  }

  return tileCharDim(tile.kind, dim, false)
}

function tileCharDim(
  kind: string,
  dim: boolean,
  selected: boolean,
): { char: string; cls: string } {
  const sel = selected ? ' bg-nvim-surface1' : ''
  switch (kind) {
    case 'wall':       return { char: '#', cls: (dim ? 'text-nvim-surface1' : 'text-nvim-overlay1') + sel }
    case 'floor':      return { char: '.', cls: (dim ? 'text-nvim-surface0' : 'text-nvim-surface2') + sel }
    case 'corridor':   return { char: '·', cls: (dim ? 'text-nvim-surface0' : 'text-nvim-surface2') + sel }
    case 'door':       return { char: '+', cls: (dim ? 'text-nvim-surface2' : 'text-nvim-yellow') + sel }
    case 'stair-down': return { char: '>', cls: (dim ? 'text-nvim-surface2' : 'text-nvim-green') + sel }
    default:           return { char: ' ', cls: '' }
  }
}

export default function TileGrid({ dungeon, player, visualSelection, blurred }: Props) {
  const cells = useMemo(() => {
    const offsetX = player.pos.x - Math.floor(VIEWPORT_W / 2)
    const offsetY = player.pos.y - Math.floor(VIEWPORT_H / 2)
    const result: { key: string; char: string; cls: string }[] = []

    for (let vy = 0; vy < VIEWPORT_H; vy++) {
      for (let vx = 0; vx < VIEWPORT_W; vx++) {
        const wx = offsetX + vx
        const wy = offsetY + vy
        const inBounds = wx >= 0 && wx < dungeon.width && wy >= 0 && wy < dungeon.height
        if (!inBounds) {
          result.push({ key: `${vx},${vy}`, char: ' ', cls: 'bg-nvim-crust' })
        } else {
          const { char, cls } = tileGlyph(dungeon, wx, wy, player, dungeon.enemyInstances, dungeon.items, visualSelection)
          result.push({ key: `${vx},${vy}`, char, cls })
        }
      }
    }
    return result
  }, [dungeon, player.pos, visualSelection])

  return (
    <div
      className={`font-mono text-base leading-none select-none transition-all duration-200 ${blurred ? 'blur-sm brightness-50' : ''}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${VIEWPORT_W}, 1ch)`,
        gridTemplateRows: `repeat(${VIEWPORT_H}, 1.4em)`,
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '16px',
        lineHeight: '1.4em',
        backgroundColor: '#0d0d14',
      }}
    >
      {cells.map(cell => (
        <span
          key={cell.key}
          className={cell.cls}
          style={{ display: 'inline-block', width: '1ch', textAlign: 'center' }}
        >
          {cell.char}
        </span>
      ))}
    </div>
  )
}
