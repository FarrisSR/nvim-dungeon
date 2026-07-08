import type { VimMode, ChallengeCategory } from '../types/game'

export const MODE_CATEGORIES: Record<VimMode, ChallengeCategory[]> = {
  normal:  ['movement', 'editing', 'macro', 'lsp', 'flash', 'textobjects', 'todo'],
  insert:  ['editing'],
  visual:  ['visual'],
  command: ['search', 'fzf', 'snacks', 'gitsigns', 'grugfar', 'neotree', 'session'],
}

const CATEGORY_TO_MODE: Record<ChallengeCategory, VimMode> = {
  movement:    'normal',
  editing:     'normal',
  search:      'command',
  visual:      'visual',
  macro:       'normal',
  lsp:         'normal',
  fzf:         'command',
  snacks:      'command',
  gitsigns:    'command',
  flash:       'normal',
  textobjects: 'normal',
  grugfar:     'command',
  neotree:     'command',
  session:     'command',
  todo:        'normal',
}

export function categoryToMode(category: ChallengeCategory): VimMode {
  return CATEGORY_TO_MODE[category]
}

export function modeName(mode: VimMode): string {
  switch (mode) {
    case 'normal':  return 'NORMAL'
    case 'insert':  return 'INSERT'
    case 'visual':  return 'VISUAL'
    case 'command': return 'COMMAND'
  }
}

export function modeColorClass(mode: VimMode): string {
  switch (mode) {
    case 'normal':  return 'bg-nvim-blue text-nvim-base'
    case 'insert':  return 'bg-nvim-green text-nvim-base'
    case 'visual':  return 'bg-nvim-mauve text-nvim-base'
    case 'command': return 'bg-nvim-peach text-nvim-base'
  }
}
