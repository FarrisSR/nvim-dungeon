import { useEffect, useRef } from 'react'
import type { GamePhase, VimMode } from '../types/game'

export type GameAction =
  | { type: 'move'; dx: number; dy: number }
  | { type: 'set-mode'; mode: VimMode }
  | { type: 'key-buffer'; key: string }
  | { type: 'clear-key-buffer' }
  | { type: 'chord-dd' }        // dd → attack
  | { type: 'chord-yy' }        // yy → block
  | { type: 'chord-gg' }        // gg → warp to entry
  | { type: 'move-to-stair' }   // G
  | { type: 'open-telescope' }  // <leader>ff
  | { type: 'close-telescope' }
  | { type: 'open-spellbook' }  // K → hover docs = spellbook
  | { type: 'close-spellbook' }
  | { type: 'insert-submit'; text: string }   // Enter in insert mode
  | { type: 'command-submit'; cmd: string }   // Enter in command mode
  | { type: 'command-backspace' }
  | { type: 'command-char'; char: string }
  | { type: 'visual-extend'; dx: number; dy: number }
  | { type: 'visual-attack' }
  | { type: 'insert-char'; char: string }
  | { type: 'insert-backspace' }
  | { type: 'telescope-move'; dx: number; dy: number }
  | { type: 'telescope-select' }
  | { type: 'normal-spell'; command: string }

const CHORD_TIMEOUT = 300

interface Options {
  phase: GamePhase
  mode: VimMode
  keyBuffer: string
  onAction: (action: GameAction) => void
}

export function useVimInput({ phase, mode, keyBuffer, onAction }: Options) {
  const chordTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaderRef = useRef(false)

  // Keep stable refs so the single event listener always sees latest values
  const onActionRef = useRef(onAction)
  const phaseRef = useRef(phase)
  const modeRef = useRef(mode)
  const keyBufferRef = useRef(keyBuffer)
  onActionRef.current = onAction
  phaseRef.current = phase
  modeRef.current = mode
  keyBufferRef.current = keyBuffer

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const action = onActionRef.current
      const phase = phaseRef.current
      const mode = modeRef.current
      const keyBuffer = keyBufferRef.current

      const active = phase === 'exploring' || phase === 'telescope' || phase === 'spellbook'
      if (!active) return

      const target = e.target as HTMLElement
      // Let input elements capture their own keys (combat overlay)
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      const key = e.key

      // ── SPELLBOOK overlay ─────────────────────────────────────────────────
      if (phase === 'spellbook') {
        e.preventDefault()
        if (key === 'Escape' || key === 'q' || key === 'K') { action({ type: 'close-spellbook' }); return }
        return
      }

      // ── TELESCOPE mode ────────────────────────────────────────────────────
      if (phase === 'telescope') {
        e.preventDefault()
        if (key === 'Escape' || key === 'q') { action({ type: 'close-telescope' }); return }
        if (key === 'h') { action({ type: 'telescope-move', dx: -1, dy: 0 }); return }
        if (key === 'j') { action({ type: 'telescope-move', dx: 0, dy: 1 }); return }
        if (key === 'k') { action({ type: 'telescope-move', dx: 0, dy: -1 }); return }
        if (key === 'l') { action({ type: 'telescope-move', dx: 1, dy: 0 }); return }
        if (key === 'Enter') { action({ type: 'telescope-select' }); return }
        return
      }

      // ── NORMAL mode ───────────────────────────────────────────────────────
      if (mode === 'normal') {
        if (['h','j','k','l','ArrowLeft','ArrowDown','ArrowUp','ArrowRight'].includes(key)) {
          e.preventDefault()
          clearChordTimer()
          action({ type: 'clear-key-buffer' })
          leaderRef.current = false
          const DIRS: Record<string, [number, number]> = {
            h: [-1, 0], ArrowLeft: [-1, 0],
            j: [0, 1],  ArrowDown: [0, 1],
            k: [0, -1], ArrowUp: [0, -1],
            l: [1, 0],  ArrowRight: [1, 0],
          }
          const [dx, dy] = DIRS[key]
          action({ type: 'move', dx, dy })
          return
        }

        if (key === 'i') { e.preventDefault(); action({ type: 'set-mode', mode: 'insert' }); return }
        if (key === 'v') { e.preventDefault(); action({ type: 'set-mode', mode: 'visual' }); return }
        if (key === ':') { e.preventDefault(); action({ type: 'set-mode', mode: 'command' }); return }

        if (key === 'Escape') {
          e.preventDefault()
          clearChordTimer()
          action({ type: 'clear-key-buffer' })
          leaderRef.current = false
          return
        }

        if (key === 'G') {
          e.preventDefault()
          action({ type: 'move-to-stair' })
          return
        }

        // Leader key (Space)
        if (key === ' ') {
          e.preventDefault()
          leaderRef.current = true
          action({ type: 'key-buffer', key: '<leader>' })
          startChordTimer(() => {
            leaderRef.current = false
            action({ type: 'clear-key-buffer' })
          })
          return
        }

        // <leader>ff = Telescope
        if (leaderRef.current && keyBuffer.startsWith('<leader>') && key === 'f') {
          e.preventDefault()
          if (keyBuffer === '<leader>f') {
            clearChordTimer()
            leaderRef.current = false
            action({ type: 'clear-key-buffer' })
            action({ type: 'open-telescope' })
          } else {
            action({ type: 'key-buffer', key: 'f' })
            startChordTimer(() => {
              leaderRef.current = false
              action({ type: 'clear-key-buffer' })
            })
          }
          return
        }

        // * = normal-mode spell (e.g. Far Sight reveal)
        if (key === '*') {
          e.preventDefault()
          action({ type: 'normal-spell', command: '*' })
          return
        }

        // K = open spellbook (hover docs in Neovim)
        if (key === 'K') {
          e.preventDefault()
          action({ type: 'open-spellbook' })
          return
        }

        // Chords: dd, yy, gg
        if (key === 'd' || key === 'y' || key === 'g') {
          e.preventDefault()
          if (keyBuffer === key) {
            clearChordTimer()
            action({ type: 'clear-key-buffer' })
            if (key === 'd') action({ type: 'chord-dd' })
            if (key === 'y') action({ type: 'chord-yy' })
            if (key === 'g') action({ type: 'chord-gg' })
          } else {
            action({ type: 'clear-key-buffer' })
            action({ type: 'key-buffer', key })
            startChordTimer(() => action({ type: 'clear-key-buffer' }))
          }
          return
        }
      }

      // ── INSERT mode ───────────────────────────────────────────────────────
      if (mode === 'insert') {
        if (key === 'Escape' || (key === '[' && e.ctrlKey)) {
          e.preventDefault()
          action({ type: 'set-mode', mode: 'normal' })
          return
        }
        if (key === 'Enter') {
          e.preventDefault()
          action({ type: 'insert-submit', text: '' }) // text from state
          return
        }
        if (key === 'Backspace') {
          e.preventDefault()
          action({ type: 'insert-backspace' })
          return
        }
        if (key.length === 1) {
          e.preventDefault()
          action({ type: 'insert-char', char: key })
          return
        }
      }

      // ── VISUAL mode ───────────────────────────────────────────────────────
      if (mode === 'visual') {
        if (key === 'Escape') {
          e.preventDefault()
          action({ type: 'set-mode', mode: 'normal' })
          return
        }
        if (['h','j','k','l'].includes(key)) {
          e.preventDefault()
          const DIRS: Record<string, [number, number]> = {
            h: [-1, 0], j: [0, 1], k: [0, -1], l: [1, 0],
          }
          const [dx, dy] = DIRS[key]
          action({ type: 'visual-extend', dx, dy })
          return
        }
        if (key === 'd' || key === 'Enter') {
          e.preventDefault()
          action({ type: 'visual-attack' })
          return
        }
      }

      // ── COMMAND mode ──────────────────────────────────────────────────────
      if (mode === 'command') {
        e.preventDefault()
        if (key === 'Escape') {
          action({ type: 'set-mode', mode: 'normal' })
          return
        }
        if (key === 'Enter') {
          action({ type: 'command-submit', cmd: '' }) // cmd from state
          return
        }
        if (key === 'Backspace') {
          action({ type: 'command-backspace' })
          return
        }
        if (key.length === 1) {
          action({ type: 'command-char', char: key })
          return
        }
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  function startChordTimer(cb: () => void) {
    clearChordTimer()
    chordTimer.current = setTimeout(cb, CHORD_TIMEOUT)
  }
  function clearChordTimer() {
    if (chordTimer.current !== null) {
      clearTimeout(chordTimer.current)
      chordTimer.current = null
    }
  }
}
