#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
target_dir="/home/runo/public_html/nvim_dungeon"

if [[ ! -d "$repo_root/dist" ]]; then
  echo "Ingen dist/ funnet — kjør 'npm run build' (eller 'make build') først." >&2
  exit 1
fi

mkdir -p "$target_dir"

rsync \
  --archive \
  --delete \
  "$repo_root/dist/" \
  "$target_dir/"

echo "Deployet til $target_dir"
