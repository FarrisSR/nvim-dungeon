import type { PlayerState } from '../types/game'
import { getSpell } from '../data/spells'

interface Props {
  player: PlayerState
  onClose: () => void
}

const MODE_BADGE: Record<string, string> = {
  insert:  'bg-nvim-green text-nvim-base',
  command: 'bg-nvim-peach text-nvim-base',
  normal:  'bg-nvim-blue text-nvim-base',
}

export default function SpellBook({ player, onClose }: Props) {
  const known = player.knownSpells.map(id => getSpell(id)).filter(Boolean)

  return (
    <div className="absolute inset-0 z-50 bg-nvim-crust/95 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-nvim-mantle border border-nvim-surface1 rounded-lg p-5 space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl text-nvim-yellow">Spellbook 📜</h2>
          <span className="font-mono text-xs text-nvim-overlay1">Esc to close</span>
        </div>

        {known.length === 0 ? (
          <p className="font-lore italic text-nvim-overlay1 text-sm">
            Your spellbook is empty. Find glowing <span className="text-nvim-yellow font-bold">?</span> scrolls in the dungeon.
          </p>
        ) : (
          <div className="space-y-3">
            {known.map(spell => spell && (
              <div key={spell.id} className="border border-nvim-surface0 rounded p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{spell.emoji}</span>
                  <span className="font-mono text-nvim-text font-bold text-sm">{spell.name}</span>
                  <span className={`ml-auto font-mono text-xs px-2 py-0.5 rounded ${MODE_BADGE[spell.castMode]}`}>
                    {spell.castMode.toUpperCase()}
                  </span>
                </div>
                <p className="font-mono text-nvim-subtext0 text-xs">{spell.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-nvim-overlay1 text-xs">Cast:</span>
                  <code className="font-mono text-nvim-yellow text-xs bg-nvim-surface0 px-2 py-0.5 rounded">
                    {spell.castMode === 'command' ? ':' : ''}{spell.castCommand}
                  </code>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full font-mono text-xs border border-nvim-surface1 text-nvim-overlay1 hover:border-nvim-mauve hover:text-nvim-mauve rounded py-1.5 transition-colors"
        >
          [ Close Spellbook ]
        </button>
      </div>
    </div>
  )
}
