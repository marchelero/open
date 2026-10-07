#!/usr/bin/env sh
# Thin launcher — all installer logic lives in init-opencode.js (single source of truth).
# Usage: ./init-opencode.sh --project-path /path/to/project
DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec node "$DIR/init-opencode.js" "$@"
