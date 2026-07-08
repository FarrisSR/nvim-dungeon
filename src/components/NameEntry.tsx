import { useState, useRef, useEffect } from 'react'
import { loadLastName, saveLastName } from '../lib/scores'

interface Props {
  onConfirm: (name: string) => void
}

const CLASSES = ['Vimancer', 'KeystrokeKnight', 'ModalMonk', 'BufferBard']
const ORIGINS = ['The Insert Realm', 'Normal Mode', 'Ex Command Keep', 'Visual Highlands']

export default function NameEntry({ onConfirm }: Props) {
  const [name, setName] = useState(() => loadLastName())
  const [charClass] = useState(() => CLASSES[Math.floor(Math.random() * CLASSES.length)])
  const [origin] = useState(() => ORIGINS[Math.floor(Math.random() * ORIGINS.length)])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed.length === 0) return
    saveLastName(trimmed)
    onConfirm(trimmed)
  }

  return (
    <div className="min-h-screen bg-nvim-base flex items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0 z-10 scanlines" />

      <div className="z-20 w-full max-w-lg">
        <h2 className="font-display text-4xl text-nvim-lavender mb-8 text-center">
          Create Your Character
        </h2>

        <div className="border border-nvim-surface1 rounded-lg bg-nvim-mantle p-6 space-y-6 font-mono text-sm">
          {/* Mock character sheet */}
          <div className="space-y-2 text-nvim-subtext1">
            <div className="flex justify-between">
              <span className="text-nvim-overlay1">CLASS</span>
              <span className="text-nvim-yellow">{charClass}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-nvim-overlay1">ORIGIN</span>
              <span className="text-nvim-peach">{origin}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-nvim-overlay1">HP</span>
              <span className="text-nvim-green">100 / 100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-nvim-overlay1">LEVEL</span>
              <span className="text-nvim-blue">1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-nvim-overlay1">WEAPON</span>
              <span className="text-nvim-mauve">Vim Motions</span>
            </div>
          </div>

          <hr className="border-nvim-surface1" />

          {/* Name input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-nvim-overlay1 block mb-2">ENTER YOUR NAME</span>
              <div className="flex items-center gap-2">
                <span className="text-nvim-green">$</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={24}
                  placeholder="Adventurer"
                  className="flex-1 bg-transparent border-b border-nvim-surface2 focus:border-nvim-lavender outline-none text-nvim-text placeholder-nvim-overlay0 pb-1 transition-colors duration-200"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={name.trim().length === 0}
              className="w-full font-mono bg-nvim-mauve hover:bg-nvim-lavender disabled:bg-nvim-surface1 disabled:text-nvim-overlay0 text-nvim-base font-bold py-2 rounded transition-colors duration-200 tracking-widest uppercase"
            >
              [ Enter Dungeon ]
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
