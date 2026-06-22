#!/usr/bin/env bash
# setup.sh - Install opencode starter pack into a target project.
#
# Usage:
#   ./setup.sh <path>           Install (interactive)
#   ./setup.sh .                Install in current dir
#   ./setup.sh <path> --dry-run Preview only, no changes
#   ./setup.sh <path> --force   No prompts, overwrite AGENTS.md
#
# What it copies:
#   - opencode.json        (required)
#   - instructions/         (required, rules)
#   - .opencode/            (required, agents + skills + junctions)
#   - .agents/skills/       (optional, user-installed skills like caveman)
#   - AGENTS.md             (optional, prompts if target already has one)
#
# What it skips:
#   - STARTER.md            (describes this repo, not your project)
#   - .git/                 (never copy git history)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ $# -lt 1 ]; then
    echo "Usage: $0 <target-dir> [--dry-run] [--force]"
    exit 1
fi

TARGET="$1"
shift

DRY_RUN=false
FORCE=false
while [ $# -gt 0 ]; do
    case "$1" in
        --dry-run) DRY_RUN=true ;;
        --force) FORCE=true ;;
        *) echo "Unknown arg: $1" >&2; exit 1 ;;
    esac
    shift
done

if [ ! -d "$TARGET" ]; then
    echo "Error: target '$TARGET' is not a directory" >&2
    exit 1
fi
TARGET="$(cd "$TARGET" && pwd)"

echo ""
echo "opencode starter installer"
echo "  source: $SCRIPT_DIR"
echo "  target: $TARGET"
echo ""

ITEMS=("opencode.json" "instructions" ".opencode")
OPTIONAL=()
[ -d "$SCRIPT_DIR/.agents/skills" ] && OPTIONAL+=(".agents/skills")

# AGENTS.md handling
SOURCE_AGENTS="$SCRIPT_DIR/AGENTS.md"
TARGET_AGENTS="$TARGET/AGENTS.md"
AGENTS_ACTION=""

if [ -f "$SOURCE_AGENTS" ]; then
    if [ -f "$TARGET_AGENTS" ]; then
        if [ "$FORCE" = true ]; then
            AGENTS_ACTION="overwrite"
        else
            echo "AGENTS.md already exists in target." >&2
            read -rp "  [O]verwrite / [S]kip / [M]erge  [S]: " choice
            case "${choice:-S}" in
                O|o) AGENTS_ACTION="overwrite" ;;
                M|m) AGENTS_ACTION="merge" ;;
                *)   AGENTS_ACTION="skip" ;;
            esac
        fi
    else
        AGENTS_ACTION="copy"
    fi
fi

# Plan
echo "Plan:"
for i in "${ITEMS[@]}"; do echo "  COPY $i"; done
for i in "${OPTIONAL[@]}"; do echo "  COPY $i  (optional, user skills)"; done
if [ -n "$AGENTS_ACTION" ]; then
    echo "  AGENTS.md: $AGENTS_ACTION"
else
    echo "  AGENTS.md: skip (no source)"
fi
echo "  SKIP STARTER.md  (only applies to this repo)"
echo ""

if [ "$DRY_RUN" = true ]; then
    echo "[DRY-RUN] nothing changed. re-run without --dry-run to apply."
    exit 0
fi

if [ "$FORCE" = false ]; then
    read -rp "Proceed? [Y/n]: " confirm
    if [ -n "$confirm" ] && [ "${confirm^^}" != "Y" ]; then
        echo "Cancelled"
        exit 0
    fi
fi

# Execute. Use cp -a to preserve junctions and attributes
count=0
for i in "${ITEMS[@]}"; do
    src="$SCRIPT_DIR/$i"
    dst="$TARGET/$i"
    if [ -e "$src" ]; then
        rm -rf "$dst" 2>/dev/null || true
        cp -a "$src" "$dst"
        echo "  + $i"
        count=$((count + 1))
    else
        echo "  ! $i not found in source"
    fi
done

for i in "${OPTIONAL[@]}"; do
    src="$SCRIPT_DIR/$i"
    dst="$TARGET/$i"
    if [ -d "$src" ]; then
        # Ensure parent directory exists (cp -a doesn't create parents)
        mkdir -p "$(dirname "$dst")"
        rm -rf "$dst" 2>/dev/null || true
        cp -a "$src" "$dst"
        echo "  + $i"
        count=$((count + 1))
    fi
done

case "$AGENTS_ACTION" in
    copy|overwrite)
        cp "$SOURCE_AGENTS" "$TARGET_AGENTS"
        echo "  + AGENTS.md ($AGENTS_ACTION)"
        count=$((count + 1))
        ;;
    merge)
        {
            echo ""
            echo "# === opencode starter (merged) ==="
            echo ""
            cat "$SOURCE_AGENTS"
        } >> "$TARGET_AGENTS"
        echo "  + AGENTS.md (merged at end)"
        count=$((count + 1))
        ;;
    skip)
        echo "  . AGENTS.md (skipped, target already has one)"
        ;;
esac

echo ""
echo "Done. $count item(s) copied."

# Create backwards-compat symlinks in target (opencode 1.17.x scans both singular and plural)
# cp -a resolves symlinks in source, so we need to:
# 1. Remove any duplicate regular dir that was copied
# 2. Create proper symlinks
TARGET_OPENCODE="$TARGET/.opencode"
if [ -d "$TARGET_OPENCODE" ]; then
    for pair in "agent:agents" "skill:skills"; do
        link_name="${pair%:*}"
        target_name="${pair#*:}"
        link_path="$TARGET_OPENCODE/$link_name"
        target_path="$TARGET_OPENCODE/$target_name"

        if [ -d "$target_path" ]; then
            # Remove any existing entry (regular dir or symlink) - we want a fresh symlink
            if [ -e "$link_path" ] || [ -L "$link_path" ]; then
                rm -rf "$link_path" 2>/dev/null || rm "$link_path" 2>/dev/null || true
            fi
            # Create symlink with relative target (so project is portable)
            if [ ! -e "$link_path" ]; then
                if ln -s "$target_name" "$link_path" 2>/dev/null; then
                    echo "  + .opencode/$link_name  (symlink -> $target_name, for opencode 1.17.x)"
                else
                    echo "  ! .opencode/$link_name symlink failed (may need admin/WSL on Windows)"
                fi
            fi
        fi
    done
fi

echo ""
echo "Next:"
echo "  cd '$TARGET'"
echo "  opencode ."
echo ""
echo "To revert: delete opencode.json, instructions/, .opencode/, .agents/skills/, AGENTS.md from target."
