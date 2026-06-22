---
description: "Show learned instincts (project + global) with confidence"
agent: build
---

# Instinct Status Command

Show instinct status from opencode-native instinct system: $ARGUMENTS

## Your Task

```bash
node .opencode/bin/instinct.js status $ARGUMENTS
```

## Behavior Notes

- Output includes both project-scoped (`.opencode/instincts/`) and global (`~/.config/opencode/instincts/`) instincts.
- Project instincts override global instincts when IDs conflict.
- Output is grouped by domain with confidence bars.
- Filter by `--scope project|global|all` and `--domain <name>` and `--min-confidence <0-1>`.
