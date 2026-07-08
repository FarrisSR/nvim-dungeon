import { useEffect, useRef, useState } from 'react'
import type { PlayerState } from '../types/game'
import { saveScore, type ScoreEntry } from '../lib/scores'

interface Props {
  player: PlayerState
  floorsCleared: number
  onRestart: () => void
}

const EPITAPHS = [
  'They never learned to exit Vim.',
  'Slain by a command they forgot.',
  'Insert Mode claimed another soul.',
  'The cursor stopped moving.',
  ':q! was not enough.',
  'dd was used on the wrong buffer.',
]

export default function DefeatScreen({ player, floorsCleared, onRestart }: Props) {
  const epitaph = EPITAPHS[Math.floor(Math.random() * EPITAPHS.length)]
  const saved = useRef(false)
  const [scores, setScores] = useState<ScoreEntry[]>([])

  useEffect(() => {
    if (saved.current) return
    saved.current = true
    saveScore({
      name: player.name,
      xp: player.xp,
      level: player.level,
      floorsCleared,
      outcome: 'defeat',
      date: new Date().toISOString(),
    }).then(updated => setScores(updated.slice(0, 10)))
  }, [])

  return (
    <div className="min-h-screen bg-nvim-base flex flex-col items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0 z-10 scanlines" />

      <div className="z-20 max-w-lg w-full text-center space-y-8">
        <h1 className="font-display text-6xl text-nvim-red animate-flicker">
          Defeated
        </h1>

        <div className="border border-nvim-surface1 rounded-lg bg-nvim-mantle p-6 font-mono text-sm space-y-2">
          <p className="text-nvim-overlay1 uppercase tracking-widest text-xs mb-3">Here lies</p>
          <p className="text-nvim-lavender text-xl">{player.name}</p>
          <p className="text-nvim-overlay0 italic font-lore text-base mt-2">{epitaph}</p>

          <hr className="border-nvim-surface1 my-4" />
          <div className="flex justify-between text-xs">
            <span className="text-nvim-overlay1">XP Earned</span>
            <span className="text-nvim-yellow">{player.xp}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-nvim-overlay1">Level</span>
            <span className="text-nvim-blue">{player.level}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-nvim-overlay1">Floors Cleared</span>
            <span className="text-nvim-mauve">{floorsCleared}</span>
          </div>
        </div>

        {scores.length > 0 && (
          <div className="border border-nvim-surface1 rounded-lg bg-nvim-mantle p-4 font-mono text-xs text-left">
            <p className="text-nvim-overlay1 uppercase tracking-widest text-xs mb-3">Hall of Fame</p>
            <table className="w-full">
              <thead>
                <tr className="text-nvim-overlay0">
                  <th className="text-left pb-1 w-6">#</th>
                  <th className="text-left pb-1">Name</th>
                  <th className="text-right pb-1">XP</th>
                  <th className="text-right pb-1">Lvl</th>
                  <th className="text-right pb-1">Floors</th>
                  <th className="text-right pb-1">End</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((s, i) => (
                  <tr key={i} className={s.name === player.name && s.xp === player.xp ? 'text-nvim-yellow' : 'text-nvim-subtext1'}>
                    <td className="pr-2 text-nvim-overlay0">{i + 1}</td>
                    <td className="pr-2 truncate max-w-[8rem]">{s.name}</td>
                    <td className="text-right pr-2 text-nvim-yellow">{s.xp}</td>
                    <td className="text-right pr-2 text-nvim-blue">{s.level}</td>
                    <td className="text-right pr-2 text-nvim-mauve">{s.floorsCleared}</td>
                    <td className={`text-right ${s.outcome === 'victory' ? 'text-nvim-green' : 'text-nvim-red'}`}>
                      {s.outcome === 'victory' ? 'WIN' : 'RIP'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          onClick={onRestart}
          className="font-mono bg-nvim-red hover:bg-nvim-maroon text-nvim-base font-bold px-8 py-3 rounded tracking-widest uppercase transition-colors duration-200"
        >
          [ Try Again ]
        </button>
      </div>
    </div>
  )
}
