import { useState, useRef, useEffect } from 'react'
import type { Enemy, Challenge, PlayerState, ChallengeCategory, CombatContext } from '../types/game'
import { modeName, modeColorClass } from '../lib/modeMap'

const CATEGORY_COLORS: Record<ChallengeCategory, string> = {
  movement:    'text-nvim-blue',
  editing:     'text-nvim-peach',
  search:      'text-nvim-yellow',
  visual:      'text-nvim-green',
  macro:       'text-nvim-teal',
  lsp:         'text-nvim-red',
  fzf:         'text-nvim-lavender',
  snacks:      'text-nvim-mauve',
  gitsigns:    'text-nvim-green',
  flash:       'text-nvim-yellow',
  textobjects: 'text-nvim-pink',
  grugfar:     'text-nvim-rosewater',
  neotree:     'text-nvim-teal',
  session:     'text-nvim-sky',
  todo:        'text-nvim-flamingo',
}

const CATEGORY_LABELS: Record<ChallengeCategory, string> = {
  movement:    'Movement',
  editing:     'Editing',
  search:      'Search',
  visual:      'Visual Mode',
  macro:       'Macros',
  lsp:         'LSP',
  fzf:         'Fzf-lua',
  snacks:      'Snacks.nvim',
  gitsigns:    'Gitsigns',
  flash:       'Flash.nvim',
  textobjects: 'Text Objects',
  grugfar:     'Grug-far',
  neotree:     'Neo-tree',
  session:     'Persistence',
  todo:        'Todo Comments',
}

interface Props {
  combatCtx: CombatContext
  enemy: Enemy
  challenge: Challenge
  player: PlayerState
  onSubmit: (input: string) => void
  onHint: () => void
  onRetreat: () => void
}

export default function ChallengeOverlay({
  combatCtx, enemy, challenge, player, onSubmit, onHint, onRetreat,
}: Props) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const prevIndexRef = useRef(combatCtx.combat.challengeIndex)
  const prevAttemptsRef = useRef(combatCtx.combat.attempts)
  const [shake, setShake] = useState(false)

  useEffect(() => { inputRef.current?.focus() }, [challenge.id])

  useEffect(() => {
    if (combatCtx.combat.challengeIndex !== prevIndexRef.current) {
      setInput('')
      prevIndexRef.current = combatCtx.combat.challengeIndex
    }
  }, [combatCtx.combat.challengeIndex])

  useEffect(() => {
    if (combatCtx.combat.attempts !== prevAttemptsRef.current) {
      prevAttemptsRef.current = combatCtx.combat.attempts
      setShake(true)
      setInput('')
      const t = setTimeout(() => setShake(false), 400)
      return () => clearTimeout(t)
    }
  }, [combatCtx.combat.attempts])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return
    onSubmit(trimmed)
  }

  const hpPct = (player.hp / player.maxHp) * 100
  const enemyHpPct = (combatCtx.combat.enemyHp / enemy.maxHp) * 100
  const progress = combatCtx.combat.challengeIndex / enemy.challengeIds.length
  const correctMode = combatCtx.correctMode
  const modeBonus = combatCtx.modeBonus
  const bonusClass = modeBonus >= 1 ? 'text-nvim-green' : 'text-nvim-red'

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-nvim-mantle border border-nvim-surface1 rounded-lg shadow-2xl space-y-3 p-5 animate-fadeIn">

        {/* Mode bonus hint */}
        <div className={`font-mono text-xs px-3 py-1.5 rounded border ${modeBonus >= 1 ? 'border-nvim-green bg-nvim-surface0' : 'border-nvim-red bg-nvim-surface0'}`}>
          <span className={bonusClass}>
            {modeBonus >= 1
              ? `✓ ${modeName(correctMode)} mode — damage ×${modeBonus}`
              : `✗ Wants [${modeName(correctMode).toUpperCase()}] mode — damage ×${modeBonus}`
            }
          </span>
          <span className="text-nvim-overlay1 ml-2">
            (current: <span className={`font-bold ${modeColorClass(correctMode).split(' ')[0].replace('bg-', 'text-')}`}>{modeName(combatCtx.correctMode)}</span>)
          </span>
        </div>

        {/* HP bars */}
        <div className="grid grid-cols-2 gap-3 font-mono text-xs">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-nvim-lavender">{player.name}</span>
              <span className="text-nvim-green">{player.hp}/{player.maxHp}</span>
            </div>
            <div className="h-1.5 bg-nvim-surface0 rounded-full overflow-hidden">
              <div className="h-full bg-nvim-green rounded-full transition-all duration-500" style={{ width: `${hpPct}%` }} />
            </div>
          </div>
          <div className="space-y-1 text-right">
            <div className="flex justify-between">
              <span className="text-nvim-red">{combatCtx.combat.enemyHp}/{enemy.maxHp}</span>
              <span className={`font-bold ${enemy.color}`}>{enemy.emoji} {enemy.name}</span>
            </div>
            <div className="h-1.5 bg-nvim-surface0 rounded-full overflow-hidden">
              <div className="h-full bg-nvim-red rounded-full transition-all duration-500" style={{ width: `${enemyHpPct}%` }} />
            </div>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between font-mono text-xs text-nvim-overlay1 mb-0.5">
            <span>Challenge {combatCtx.combat.challengeIndex + 1}/{enemy.challengeIds.length}</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-1 bg-nvim-surface0 rounded-full overflow-hidden">
            <div className="h-full bg-nvim-mauve rounded-full transition-all duration-500" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>

        {/* Challenge card */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className={`font-mono text-xs uppercase tracking-widest ${CATEGORY_COLORS[challenge.category]}`}>
              {CATEGORY_LABELS[challenge.category]}
            </span>
            <span className="font-mono text-xs text-nvim-yellow">+{challenge.xpReward} XP</span>
          </div>
          <p className="font-lore italic text-nvim-subtext1 text-sm leading-relaxed">{challenge.lore}</p>
          <div className="bg-nvim-crust border border-nvim-surface0 rounded px-3 py-2">
            <p className="font-mono text-nvim-text text-sm">{challenge.description}</p>
          </div>
          {combatCtx.combat.hintLevel >= 1 && (
            <div className="font-mono text-xs text-nvim-yellow bg-nvim-surface0 rounded px-3 py-1.5 animate-fadeIn">
              Hint: {challenge.hint}
            </div>
          )}
          {combatCtx.combat.hintLevel >= 2 && (
            <div className="font-mono text-xs text-nvim-peach bg-nvim-surface0 rounded px-3 py-1.5 animate-fadeIn">
              Spoiler: {challenge.hintFull}
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit}>
          <div className={`flex items-center gap-2 bg-nvim-crust border border-nvim-surface1 rounded px-3 py-2 ${shake ? 'animate-shake' : ''}`}>
            <span className="text-nvim-green font-mono">❯</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="type your command..."
              className="flex-1 bg-transparent font-mono text-nvim-text placeholder-nvim-overlay0 outline-none text-sm"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </div>
        </form>

        {/* Actions */}
        <div className="flex gap-2 font-mono text-xs">
          <button
            onClick={onHint}
            disabled={combatCtx.combat.hintLevel >= 2}
            className="px-3 py-1 rounded border border-nvim-yellow text-nvim-yellow hover:bg-nvim-yellow hover:text-nvim-base disabled:opacity-30 transition-colors"
          >
            {combatCtx.combat.hintLevel === 0 ? 'Hint' : combatCtx.combat.hintLevel === 1 ? 'Full Hint' : 'No hints'}
          </button>
          <button
            onClick={onRetreat}
            className="px-3 py-1 rounded border border-nvim-overlay1 text-nvim-overlay1 hover:border-nvim-red hover:text-nvim-red transition-colors"
          >
            Retreat
          </button>
        </div>
      </div>
    </div>
  )
}
