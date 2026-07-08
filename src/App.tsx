import { useRoguelikeState } from './hooks/useRoguelikeState'
import TitleScreen from './components/TitleScreen'
import NameEntry from './components/NameEntry'
import ExploringScreen from './components/ExploringScreen'
import VictoryScreen from './components/VictoryScreen'
import DefeatScreen from './components/DefeatScreen'

export default function App() {
  const game = useRoguelikeState()

  switch (game.phase) {
    case 'title':
      return <TitleScreen onStart={() => game.setPhase('name-entry')} />

    case 'name-entry':
      return <NameEntry onConfirm={game.startGame} />

    case 'exploring':
    case 'combat':
    case 'telescope':
    case 'spellbook':
      return (
        <ExploringScreen
          state={{
            phase: game.phase,
            player: game.player,
            mode: game.mode,
            dungeon: game.dungeon,
            combatContext: game.combatContext,
            log: game.log,
            floorsCleared: game.floorsCleared,
          }}
          currentEnemy={game.currentEnemy ?? null}
          currentChallenge={game.currentChallenge}
          onCombatSubmit={game.handleCombatSubmit}
          onCombatHint={game.handleCombatHint}
          onCombatRetreat={game.handleCombatRetreat}
          onTeleport={game.handleTeleportToRoom}
          onCloseScope={() => game.dispatch({ type: 'close-telescope' })}
          onCloseSpellbook={() => game.dispatch({ type: 'close-spellbook' })}
        />
      )

    case 'victory':
      return (
        <VictoryScreen
          player={game.player}
          floorsCleared={game.floorsCleared}
          onRestart={game.restart}
        />
      )

    case 'defeat':
      return (
        <DefeatScreen
          player={game.player}
          floorsCleared={game.floorsCleared}
          onRestart={game.restart}
        />
      )

    default:
      return null
  }
}
