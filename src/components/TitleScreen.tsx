import { useState, useEffect } from 'react'
import { loadScores, type ScoreEntry } from '../lib/scores'

const taglines = [
  'hjkl your way to glory.',
  'No mouse. No mercy.',
  'The dungeon fears your keystrokes.',
  'Press Esc to survive.',
  'dd the darkness.',
  ':%s/fear/skill/g',
  'ciw the enemy\'s name.',
]

const ASCII = `
 _   _       _         ____
| \\ | |_   _(_)_ __ __|  _ \\ _   _ _ __   __ _  ___  ___  _ __
|  \\| \\ \\ / / | '_ \` _ \\ | | | | | | '_ \\ / _\` |/ _ \\/ _ \\| '_ \\
| |\\  |\\ V /| | | | | | | |_| | |_| | | | | (_| |  __/ (_) | | | |
|_| \\_| \\_/ |_|_| |_| |_|____/ \\__,_|_| |_|\\__, |\\___|\\___/|_| |_|
                                             |___/
`.trim()

interface Props {
  onStart: () => void
}

export default function TitleScreen({ onStart }: Props) {
  const [taglineIdx, setTaglineIdx] = useState(0)
  const [fade, setFade] = useState(true)
  const [scores, setScores] = useState<ScoreEntry[]>([])

  useEffect(() => {
    loadScores(5).then(setScores)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setTaglineIdx(i => (i + 1) % taglines.length)
        setFade(true)
      }, 400)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter' || e.key === ' ') onStart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onStart])

  return (
    <div className="min-h-screen bg-nvim-base flex flex-col items-center justify-center relative overflow-hidden">
      {/* CRT scanlines */}
      <div className="pointer-events-none absolute inset-0 z-10 scanlines" />

      <div className="z-20 flex flex-col items-center gap-8 px-4">
        {/* ASCII title */}
        <pre className="font-mono text-nvim-mauve text-xs sm:text-sm leading-tight animate-flicker select-none overflow-x-auto max-w-full">
          {ASCII}
        </pre>

        {/* Display heading */}
        <h1 className="font-display text-5xl sm:text-7xl text-nvim-lavender tracking-wide">
          NvimDungeon
        </h1>

        {/* Rotating tagline */}
        <p
          className="font-lore italic text-nvim-subtext1 text-xl transition-opacity duration-400"
          style={{ opacity: fade ? 1 : 0 }}
        >
          {taglines[taglineIdx]}
        </p>

        {/* CTA */}
        <button
          onClick={onStart}
          className="mt-4 font-mono text-nvim-base bg-nvim-mauve hover:bg-nvim-lavender px-8 py-3 rounded text-lg font-bold tracking-widest uppercase transition-colors duration-200 animate-pulse"
        >
          [ Press Enter to Begin ]
        </button>

        <p className="font-mono text-nvim-overlay0 text-sm">
          Keyboard required — no mouse support
        </p>

        {scores.length > 0 && (
          <div className="w-full max-w-sm border border-nvim-surface1 rounded-lg bg-nvim-mantle p-4 font-mono text-xs text-left">
            <p className="text-nvim-overlay1 uppercase tracking-widest text-xs mb-2">Top Scores</p>
            <table className="w-full">
              <thead>
                <tr className="text-nvim-overlay0">
                  <th className="text-left pb-1 w-5">#</th>
                  <th className="text-left pb-1">Name</th>
                  <th className="text-right pb-1">XP</th>
                  <th className="text-right pb-1">Floors</th>
                  <th className="text-right pb-1">End</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((s, i) => (
                  <tr key={i} className="text-nvim-subtext1">
                    <td className="pr-2 text-nvim-overlay0">{i + 1}</td>
                    <td className="pr-2">{s.name}</td>
                    <td className="text-right pr-2 text-nvim-yellow">{s.xp}</td>
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
      </div>
    </div>
  )
}
