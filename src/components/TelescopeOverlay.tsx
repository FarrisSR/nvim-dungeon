import { useState } from 'react'
import type { DungeonFloor, PlayerState } from '../types/game'
import { getEnemy } from '../data/world'

interface Props {
  dungeon: DungeonFloor
  player: PlayerState
  onTeleport: (roomId: string) => void
  onClose: () => void
}

const LEVEL_COLORS: Record<string, string> = {
  novice:     '#89b4fa',
  apprentice: '#fab387',
  adept:      '#f38ba8',
  master:     '#cba6f7',
}

const CELL = 70
const PAD  = 40

export default function TelescopeOverlay({ dungeon, player, onTeleport, onClose }: Props) {
  const visited = dungeon.rooms.filter(r => r.visited)
  const [selected, setSelected] = useState<string | null>(
    visited.find(r => {
      const pos = player.pos
      return r.center.x === pos.x && r.center.y === pos.y
    })?.id ?? visited[0]?.id ?? null
  )

  if (visited.length === 0) {
    return (
      <div className="absolute inset-0 z-50 bg-nvim-crust/95 flex items-center justify-center">
        <div className="text-nvim-overlay1 font-mono text-sm">No visited rooms yet.</div>
      </div>
    )
  }

  // Normalise room positions to small grid coords for display
  const minX = Math.min(...visited.map(r => r.center.x))
  const minY = Math.min(...visited.map(r => r.center.y))
  const maxX = Math.max(...visited.map(r => r.center.x))
  const maxY = Math.max(...visited.map(r => r.center.y))
  const rangeX = maxX - minX || 1
  const rangeY = maxY - minY || 1

  function norm(v: number, min: number, range: number, slots: number) {
    return PAD + Math.round(((v - min) / range) * slots) * CELL
  }

  const cols = Math.max(3, Math.ceil(visited.length / 2))
  const svgW = PAD * 2 + cols * CELL
  const svgH = PAD * 2 + Math.ceil(visited.length / cols) * CELL + 60

  function cx(r: typeof visited[0]) { return norm(r.center.x, minX, rangeX, cols - 1) + PAD }
  function cy(r: typeof visited[0]) { return norm(r.center.y, minY, rangeY, Math.ceil(visited.length / cols) - 1) + PAD }

  return (
    <div className="absolute inset-0 z-50 bg-nvim-crust/95 flex flex-col items-center justify-start py-8 px-4">
      <div className="pointer-events-none absolute inset-0 scanlines" />

      <div className="z-10 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-3xl text-nvim-lavender">Telescope</h2>
          <div className="font-mono text-xs text-nvim-overlay1">
            hjkl to navigate · Enter to teleport · Esc to close
          </div>
        </div>

        <div className="border border-nvim-surface1 rounded-lg bg-nvim-mantle p-2 overflow-auto">
          <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
            {/* Connection lines between visited rooms that are close in dungeon order */}
            {visited.slice(1).map((room, i) => {
              const prev = visited[i]
              return (
                <line
                  key={`${prev.id}-${room.id}`}
                  x1={cx(prev)} y1={cy(prev)}
                  x2={cx(room)} y2={cy(room)}
                  stroke="#45475a" strokeWidth={1.5} strokeDasharray="4 3"
                />
              )
            })}

            {/* Room nodes */}
            {visited.map(room => {
              const enemy = dungeon.enemyInstances
                .find(e => room.enemyInstanceIds.includes(e.instanceId))
              const enemyData = enemy ? getEnemy(enemy.enemyId) : null
              const color = enemyData ? LEVEL_COLORS[enemyData.level] : '#6c7086'
              const isSelected = room.id === selected
              const isPlayer = room.center.x === player.pos.x && room.center.y === player.pos.y

              return (
                <g
                  key={room.id}
                  transform={`translate(${cx(room)},${cy(room)})`}
                  onClick={() => setSelected(room.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {isSelected && (
                    <circle r={22} fill={color} opacity={0.2} />
                  )}
                  <circle
                    r={18}
                    fill={room.cleared ? '#313244' : '#1e1e2e'}
                    stroke={isSelected ? '#b4befe' : isPlayer ? '#a6e3a1' : room.cleared ? '#a6e3a1' : color}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />
                  <text
                    textAnchor="middle" dominantBaseline="central"
                    fontSize={13} style={{ userSelect: 'none' }}
                  >
                    {isPlayer ? '@' : room.cleared ? '✓' : (enemyData?.emoji ?? '?')}
                  </text>
                  {enemyData && (
                    <text
                      y={28} textAnchor="middle"
                      fill={room.cleared ? '#a6adc8' : color}
                      fontSize={8}
                      fontFamily="JetBrains Mono, monospace"
                      style={{ userSelect: 'none' }}
                    >
                      {room.cleared ? 'cleared' : enemyData.name}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        {/* Teleport button */}
        {selected && selected !== visited.find(r => r.center.x === player.pos.x && r.center.y === player.pos.y)?.id && (
          <div className="mt-4 flex gap-3 font-mono text-sm">
            <button
              onClick={() => onTeleport(selected)}
              className="px-5 py-2 rounded bg-nvim-mauve hover:bg-nvim-lavender text-nvim-base font-bold transition-colors"
            >
              [ Teleport Here ]
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded border border-nvim-overlay1 text-nvim-overlay1 hover:border-nvim-red hover:text-nvim-red transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
        {(!selected || selected === visited.find(r => r.center.x === player.pos.x && r.center.y === player.pos.y)?.id) && (
          <div className="mt-4">
            <button
              onClick={onClose}
              className="font-mono px-5 py-2 rounded border border-nvim-overlay1 text-nvim-overlay1 hover:border-nvim-red hover:text-nvim-red transition-colors text-sm"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
