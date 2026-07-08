import type { RoguelikeState, Enemy, Challenge } from '../types/game'
import TileGrid from './TileGrid'
import StatusLine from './StatusLine'
import CommandLine from './CommandLine'
import MessageLog from './MessageLog'
import ChallengeOverlay from './ChallengeOverlay'
import TelescopeOverlay from './TelescopeOverlay'
import SpellBook from './SpellBook'

interface Props {
  state: RoguelikeState
  currentEnemy: Enemy | null
  currentChallenge: Challenge | null
  onCombatSubmit: (input: string) => void
  onCombatHint: () => void
  onCombatRetreat: () => void
  onTeleport: (roomId: string) => void
  onCloseScope: () => void
  onCloseSpellbook: () => void
}

export default function ExploringScreen({
  state, currentEnemy, currentChallenge,
  onCombatSubmit, onCombatHint, onCombatRetreat, onTeleport, onCloseScope, onCloseSpellbook,
}: Props) {
  const { dungeon, player, mode, combatContext, log, phase } = state

  if (!dungeon) return null

  const inCombat     = phase === 'combat'
  const inScope      = phase === 'telescope'
  const inSpellbook  = phase === 'spellbook'
  const inOverlay    = inCombat || inScope || inSpellbook

  return (
    <div className="min-h-screen bg-dungeon-dark flex flex-col items-center justify-center">
      <div className="pointer-events-none fixed inset-0 z-10 scanlines" />

      <div className="z-20 relative flex flex-col" style={{ userSelect: 'none' }}>
        {/* Tile grid */}
        <div className="relative">
          <TileGrid
            dungeon={dungeon}
            player={player}
            visualSelection={mode.visualSelection}
            blurred={inCombat}
          />

          {/* Combat overlay */}
          {inCombat && combatContext && currentEnemy && currentChallenge && (
            <ChallengeOverlay
              combatCtx={combatContext}
              enemy={currentEnemy}
              challenge={currentChallenge}
              player={player}
              onSubmit={onCombatSubmit}
              onHint={onCombatHint}
              onRetreat={onCombatRetreat}
            />
          )}

          {/* Telescope overlay */}
          {inScope && (
            <TelescopeOverlay
              dungeon={dungeon}
              player={player}
              onTeleport={onTeleport}
              onClose={onCloseScope}
            />
          )}

          {/* Spellbook overlay */}
          {inSpellbook && (
            <SpellBook player={player} onClose={onCloseSpellbook} />
          )}
        </div>

        {/* Bottom UI */}
        <MessageLog log={log} maxLines={4} />
        <CommandLine mode={mode} />
        <StatusLine player={player} mode={mode} />
      </div>

      {/* Mode quick-reference */}
      {!inOverlay && (
        <div className="z-20 fixed top-2 right-2 font-mono text-xs text-nvim-overlay0 bg-nvim-mantle/80 border border-nvim-surface0 rounded px-2 py-1 leading-relaxed">
          <div><span className="text-nvim-blue">NORMAL</span> hjkl=move  dd=attack  yy=ward  G=stair</div>
          <div><span className="text-nvim-green">i</span>=INSERT  <span className="text-nvim-mauve">v</span>=VISUAL  <span className="text-nvim-peach">:</span>=CMD  <span className="text-nvim-lavender">Spc+ff</span>=Telescope</div>
          <div><span className="text-nvim-yellow">K</span>=Spellbook ({player.knownSpells.length} spells)</div>
        </div>
      )}
    </div>
  )
}
