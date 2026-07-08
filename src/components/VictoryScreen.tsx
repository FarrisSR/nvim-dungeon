import { useEffect, useRef, useState } from 'react'
import type { PlayerState } from '../types/game'
import { saveScore, type ScoreEntry } from '../lib/scores'

interface Props {
  player: PlayerState
  floorsCleared: number
  onRestart: () => void
}

export default function VictoryScreen({ player, floorsCleared, onRestart }: Props) {
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
      outcome: 'victory',
      date: new Date().toISOString(),
    }).then(updated => setScores(updated.slice(0, 10)))
  }, [])

  return (
    <div className="min-h-screen bg-nvim-base flex flex-col items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0 z-10 scanlines" />

      <div className="z-20 max-w-lg w-full text-center space-y-8">
        <h1 className="font-display text-6xl text-nvim-yellow animate-flicker">
          Victory!
        </h1>

        <p className="font-lore italic text-nvim-subtext1 text-lg leading-relaxed">
          The dungeon falls silent. {player.name} emerges victorious,
          their keystrokes etched into legend. The Snack Daemon is no more.
        </p>

        <div className="border border-nvim-surface1 rounded-lg bg-nvim-mantle p-6 font-mono text-sm space-y-3 text-left">
          <p className="text-nvim-overlay1 uppercase tracking-widest text-xs mb-4">Final Stats</p>
          <div className="flex justify-between">
            <span className="text-nvim-overlay1">Adventurer</span>
            <span className="text-nvim-lavender">{player.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-nvim-overlay1">HP Remaining</span>
            <span className="text-nvim-green">{player.hp} / {player.maxHp}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-nvim-overlay1">Total XP</span>
            <span className="text-nvim-yellow">{player.xp}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-nvim-overlay1">Level Reached</span>
            <span className="text-nvim-blue">{player.level}</span>
          </div>
          <div className="flex justify-between">
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
          className="font-mono bg-nvim-yellow hover:bg-nvim-peach text-nvim-base font-bold px-8 py-3 rounded tracking-widest uppercase transition-colors duration-200"
        >
          [ Play Again ]
        </button>
      </div>
    </div>
  )
}
