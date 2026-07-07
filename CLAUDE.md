# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

NvimDungeon: a game for learning Vim/Neovim motions and commands, framed as a browser roguelike where
combat encounters are Vim/Neovim command quizzes. You explore a procedurally generated dungeon with
`hjkl`, and fighting an enemy means typing the correct Vim command for a challenge prompt (in the right
mode, for a damage bonus) before it retaliates. Keep this teaching goal in mind when changing challenges,
hints, or lore text — accuracy of the Vim command being taught matters more than gameplay balance.

## Commands

Frontend (run from repo root):
- `npm run dev` — Vite dev server
- `npm run build` — `tsc -b` then `vite build`
- `npm run lint` — ESLint over the whole repo
- `npm run preview` — preview the production build

There is no test suite/framework configured in this repo.

Score API server (two parallel implementations of the same `/scores` endpoint — see below):
- `server/main.py` (FastAPI) is the one actually deployed, run via `server/nvim-dungeon-api.service`
  (systemd unit → `uvicorn main:app --host 127.0.0.1 --port 3002`, venv at `server/venv`). It reads/writes
  `scores.db` in the repo root.
- `server/index.js` (Express + better-sqlite3, `node index.js`, also port 3002) is an alternate/legacy
  implementation pointed at a different DB path (`/home/runo/nvim-dungeon-scores.db`, not the repo's
  `scores.db`). Don't assume it's what's running in prod — check the systemd unit if behavior seems out
  of sync between the two.

`vite.config.ts` sets `base: '/~runo/nvim_dungeon/'`, i.e. the app is deployed under a personal subpath on
a shared host, with the score API expected to be reverse-proxied at `/dungeon-api/` → `127.0.0.1:3002`
(see `src/lib/scores.ts`). That proxy is not configured in `vite.config.ts`, so `/dungeon-api` calls won't
resolve against a bare `npm run dev` unless something in front of it (e.g. nginx) provides it.

## Architecture

**State is one hook, one dispatch.** `src/hooks/useRoguelikeState.ts` owns the entire `RoguelikeState`
(phase, player, mode, dungeon, combat, log) in a single `useState` + `setState`-based reducer (`dispatch`,
handling a `GameAction` union defined in `useVimInput.ts`). There's no external state library. Read
`src/types/game.ts` first — it's the canonical shape of every piece of state and is small enough to hold
in your head while editing the reducer.

**Input is a raw modal keymap, not a game-engine input system.** `src/hooks/useVimInput.ts` attaches a
single `window` `keydown` listener and translates keys into `GameAction`s based on the current `GamePhase`
and `VimMode` (`normal` / `insert` / `visual` / `command`), mirroring real Vim: `hjkl` moves in normal
mode, `i`/`v`/`:` switch modes, chorded commands (`dd` attack, `yy` ward, `gg` warp-to-entry) accumulate in
a `keyBuffer` with a 300ms timeout, `<leader>f f` opens Telescope. Overlay phases (`telescope`,
`spellbook`) intercept keys before normal-mode handling. If you're adding a new keybinding, this file and
the `GameAction` union are where it starts.

**Game phases double as screens.** `App.tsx` switches on `game.phase`
(`title → name-entry → exploring/combat/telescope/spellbook → victory/defeat`). `combat`, `telescope`,
and `spellbook` are all rendered through the same `ExploringScreen` (as overlays on the tile grid), not
separate full-screen routes — so exploring state (player position, dungeon, FOV) stays live underneath
them.

**Dungeon generation and visibility are separate passes.** `src/lib/dungeonGen.ts` procedurally carves
rooms + L-shaped corridors + doors, places enemies and scroll items scaled by floor difficulty
(`levelForFloor`: novice/apprentice/adept/master), and puts the stairs in the last room generated.
`src/lib/fov.ts` is an independent recursive-shadowcasting FOV pass (permissive octant method) applied
separately, via `applyFOV`/`buildFloor` in `useRoguelikeState.ts`, any time the player's position changes —
it deep-copies the tile grid rather than mutating it in place.

**Combat maps challenge category → Vim mode → damage multiplier.** Each enemy (`src/data/world.ts`) has an
ordered list of `challengeIds` (`src/data/challenges.ts`) fought in sequence. `src/lib/modeMap.ts` defines
`CATEGORY_TO_MODE` (e.g. `visual` category challenges want `visual` mode, `search`/`telescope`/`snacks`
want `command` mode). `useCombat.ts#buildCombatContext` compares the player's current mode against that to
set `modeBonus` (1.25× if matching, 0.75× otherwise) before the player even answers. A correct answer
(matched against `challenge.command` or `aliases`) damages the enemy by `maxHp / numChallenges * modeBonus
* buffMultiplier`; a wrong answer damages the player by `enemy.damage` unless `player.blocked` (from the
`yy`/ward chord or a `ward` spell) absorbs it.

**Spells are scroll pickups gated by cast mode.** `src/data/spells.ts` defines scrolls found via
`dungeonGen`; `castSpell` in `useRoguelikeState.ts` matches the typed command against a known spell's
`castCommand` *and* `castMode`, so the same word can mean different things (or nothing) depending on
whether it's entered via `*` in normal mode, an insert-mode incantation (Enter in insert mode), or a
command-mode `:`-command. Effects (`heal`/`ward`/`buff`/`reveal`) are applied by `spell.effect.type` in
that same function.

**Content is data-driven.** `src/data/challenges.ts`, `src/data/world.ts` (enemies), and
`src/data/spells.ts` are plain data tables. Adding a new enemy, challenge, or spell is mostly editing
these files and wiring any new `ChallengeCategory` into `modeMap.ts`'s `CATEGORY_TO_MODE`.
