import type { ModeState } from '../types/game'

interface Props {
  mode: ModeState
}

export default function CommandLine({ mode }: Props) {
  if (mode.current === 'command') {
    return (
      <div className="font-mono text-sm bg-nvim-mantle border-t border-nvim-surface0 px-2 py-0.5 flex items-center gap-1">
        <span className="text-nvim-text">:{mode.commandBuffer}</span>
        <span className="text-nvim-text animate-pulse">█</span>
      </div>
    )
  }

  if (mode.current === 'insert') {
    return (
      <div className="font-mono text-sm bg-nvim-mantle border-t border-nvim-surface0 px-2 py-0.5 flex items-center gap-1">
        <span className="text-nvim-overlay1">incant:</span>
        <span className="text-nvim-green">{mode.commandBuffer}</span>
        <span className="text-nvim-green animate-pulse">█</span>
      </div>
    )
  }

  return null
}
