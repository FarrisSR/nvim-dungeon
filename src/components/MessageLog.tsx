import { useEffect, useRef } from 'react'
import type { LogEntry } from '../types/game'

interface Props {
  log: LogEntry[]
  maxLines?: number
}

export default function MessageLog({ log, maxLines = 5 }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight })
  }, [log.length])

  const visible = log.slice(-maxLines * 2)

  return (
    <div
      ref={ref}
      className="font-mono text-xs bg-nvim-mantle border-t border-nvim-surface0 px-2 py-1 overflow-y-auto"
      style={{ maxHeight: `${maxLines * 1.5}rem` }}
    >
      {visible.map(entry => (
        <div
          key={entry.id}
          className={
            entry.type === 'correct' ? 'text-nvim-green' :
            entry.type === 'wrong'   ? 'text-nvim-red' :
            entry.type === 'hint'    ? 'text-nvim-yellow' :
            entry.type === 'damage'  ? 'text-nvim-maroon' :
            entry.type === 'mode'    ? 'text-nvim-overlay1 italic' :
            'text-nvim-subtext0'
          }
        >
          {entry.text}
        </div>
      ))}
    </div>
  )
}
