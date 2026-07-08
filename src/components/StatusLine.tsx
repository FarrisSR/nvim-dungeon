import type { PlayerState, ModeState } from '../types/game'
import { modeName, modeColorClass } from '../lib/modeMap'
import { getSpell } from '../data/spells'

interface Props {
  player: PlayerState
  mode: ModeState
}

export default function StatusLine({ player, mode }: Props) {
  const hpPct = (player.hp / player.maxHp) * 100
  const hpColor = hpPct > 50 ? 'bg-nvim-green' : hpPct > 25 ? 'bg-nvim-yellow' : 'bg-nvim-red'

  return (
    <div className="flex items-center gap-0 font-mono text-xs bg-nvim-mantle border-t border-nvim-surface0 select-none">
      {/* Mode pill */}
      <span className={`px-3 py-1 font-bold tracking-widest ${modeColorClass(mode.current)}`}>
        {modeName(mode.current)}
      </span>

      {/* Separator */}
      <span className="text-nvim-surface2 px-1">│</span>

      {/* Player name + floor */}
      <span className="text-nvim-lavender px-2">{player.name}</span>
      <span className="text-nvim-overlay1">Floor {player.floor}</span>

      {/* Separator */}
      <span className="text-nvim-surface2 px-1 mx-1">│</span>

      {/* HP bar */}
      <span className="text-nvim-overlay1 mr-1">HP</span>
      <div className="w-20 h-2 bg-nvim-surface0 rounded-sm overflow-hidden mr-1">
        <div
          className={`h-full rounded-sm transition-all duration-300 ${hpColor}`}
          style={{ width: `${hpPct}%` }}
        />
      </div>
      <span className={hpPct > 50 ? 'text-nvim-green' : hpPct > 25 ? 'text-nvim-yellow' : 'text-nvim-red'}>
        {player.hp}/{player.maxHp}
      </span>

      {/* Separator */}
      <span className="text-nvim-surface2 px-1 mx-1">│</span>

      {/* XP / Level */}
      <span className="text-nvim-yellow">XP {player.xp}</span>
      <span className="text-nvim-surface2 px-1">·</span>
      <span className="text-nvim-blue">LV {player.level}</span>

      {/* Active buffs */}
      {player.activeBuffs.length > 0 && (
        <>
          <span className="text-nvim-surface2 px-1 mx-1">│</span>
          {player.activeBuffs.map(b => (
            <span key={b.spellId} className="text-nvim-peach mr-1">
              🔥×{b.multiplier}({b.roundsLeft})
            </span>
          ))}
        </>
      )}

      {/* Known spells count */}
      {player.knownSpells.length > 0 && (
        <>
          <span className="text-nvim-surface2 px-1 mx-1">│</span>
          <span className="text-nvim-yellow" title={player.knownSpells.map(id => getSpell(id)?.name).join(', ')}>
            📜 {player.knownSpells.length}
          </span>
        </>
      )}

      {/* Key buffer / ward — right side */}
      <span className="flex-1" />
      {player.blocked && (
        <span className="mr-2 text-nvim-teal font-bold">WARD</span>
      )}
      {mode.keyBuffer && mode.keyBuffer !== '' && (
        <span className="text-nvim-overlay2 pr-2">{mode.keyBuffer}</span>
      )}
    </div>
  )
}
