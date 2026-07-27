#!/usr/bin/env node
/**
 * scaffold-new-project.js - create docs/ structure + PROJECT.md + README.md
 *
 * Use when copying the opencode pack to a new project and you want a
 * pre-wired docs/ tree. Safe to run on existing projects (refuses to
 * overwrite files unless --force is passed).
 *
 * Usage:
 *   node .opencode/bin/scaffold-new-project.js
 *   node .opencode/bin/scaffold-new-project.js --name "my-app"
 *   node .opencode/bin/scaffold-new-project.js --force
 *   node .opencode/bin/scaffold-new-project.js --dry-run
 *   node .opencode/bin/scaffold-new-project.js --help
 *
 * Zero deps, CommonJS, Windows + POSIX.
 */

const fs = require('fs');
const path = require('path');

const CWD = process.cwd();
const ARGS = process.argv.slice(2);
const HELP = ARGS.includes('--help') || ARGS.includes('-h');
const DRY_RUN = ARGS.includes('--dry-run');
const FORCE = ARGS.includes('--force');

function arg(name, def) {
  const i = ARGS.indexOf(name);
  if (i === -1) return def;
  return ARGS[i + 1];
}

const NAME = arg('--name', path.basename(CWD));

if (HELP) {
  console.log(`Usage: node .opencode/bin/scaffold-new-project.js [--name NAME] [--force] [--dry-run]

Creates the project docs/ tree:
  docs/PROJECT.md       (placeholder; run refresh-project.js to populate)
  docs/README.md        (index pointing at PROJECT.md + subdirs)
  docs/prds/            (PRD storage)
  docs/plans/           (implementation plans)
  docs/reports/         (agent run reports)
  docs/audits/          (audit reports)
  docs/sessions/        (session snapshots)
  docs/state/           (CLI recovery state)
  docs/instincts/       (learned heuristics)

Options:
  --name NAME    Project name (default: basename of CWD)
  --force        Overwrite existing files
  --dry-run      Show what would be created, don't write
  --help         This help
`);
  process.exit(0);
}

const DIRS = [
  'docs',
  'docs/prds',
  'docs/plans',
  'docs/reports',
  'docs/audits',
  'docs/sessions',
  'docs/state',
  'docs/instincts',
];

const PROJECT_MD = `# Project Context

> Auto-refreshed by \`node .opencode/bin/refresh-project.js\`.
> Edit \`## Non-Negotiables\`, \`## Architecture Notes\`, \`## Open Questions\` manually — they are preserved across refreshes.

## Identity
- **Name**: ${NAME}
- **Type**: (web app | API | CLI | library | ...)
- **Description**: (one-line)

## Stack
- **Language**: ?
- **Framework**: ?
- **Runtime / Build**: ?
- **Package manager**: ?

## Tooling
- **Test runner**: ?
- **Linter / Formatter**: ?
- **CI**: ?
- **Container**: ?

## Directory Layout
- \`src/\`: application code
- \`tests/\`: test suites
- \`docs/\`: project documentation (this file lives here)

## Conventions
free-form — describe your naming, branching, PR review process

## Non-Negotiables
<!-- Things that MUST stay true. refresh-project.js preserves this section verbatim. -->

## Architecture Notes
<!-- ADRs, rationale, key decisions. Preserved across refreshes. -->

## Open Questions
<!-- Things to resolve later. Preserved across refreshes. -->
`;

const DOCS_README = `# Project Docs

Project documentation for **${NAME}**. Single location, easy to move with the project.

| Doc | What |
|-----|------|
| [PROJECT.md](./PROJECT.md) | Stack, conventions, identity. Auto-refreshed by \`project-init.js\`. |
| [.opencode/AGENTS_INDEX.md](../.opencode/AGENTS_INDEX.md) | Auto-generated catalog of all opencode agents (lives in pack) |
| [prds/](./prds/) | Product Requirements Docs |
| [plans/](./plans/) | Implementation plans |
| [reports/](./reports/) | Agent run reports (orchestrate, verify, code-review) |
| [audits/](./audits/) | Audit reports (PRD↔report cross-check) |
| [sessions/](./sessions/) | Session memory snapshots |
| [state/](./state/) | CLI recovery state (per command) |
| [instincts/](./instincts/) | Learned heuristics (promotable to skills) |

## Conventions

- PRDs: \`docs/prds/{YYYY-MM-DD_HHMM}-{slug}.prd.md\`
- Plans: \`docs/plans/{YYYY-MM-DD_HHMM}-{slug}.plan.md\`
- Reports: \`docs/reports/{YYYY-MM-DD_HHMM}-{slug}.report.md\`
- Audits: \`docs/audits/{YYYY-MM-DD_HHMM}-{slug}.audit.md\`
- Sessions: \`docs/sessions/{YYYY-MM-DD}-{slug}.md\` + \`LATEST.md\`
- Instincts: \`docs/instincts/{YYYY-MM-DD}-{slug}.instinct.json\`
`;

function exists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}

function main() {
  const ops = [];
  for (const d of DIRS) {
    ops.push({ kind: 'dir', path: path.join(CWD, d) });
  }
  ops.push({ kind: 'file', path: path.join(CWD, 'docs', 'PROJECT.md'), content: PROJECT_MD });
  ops.push({ kind: 'file', path: path.join(CWD, 'docs', 'README.md'), content: DOCS_README });

  let created = 0, skipped = 0, wouldCreate = 0;

  for (const op of ops) {
    if (op.kind === 'dir') {
      if (exists(op.path)) {
        process.stdout.write(`exists:  ${path.relative(CWD, op.path)}\n`);
        continue;
      }
      if (DRY_RUN) {
        process.stdout.write(`would create: ${path.relative(CWD, op.path)}/\n`);
        wouldCreate++;
      } else {
        fs.mkdirSync(op.path, { recursive: true });
        process.stdout.write(`created: ${path.relative(CWD, op.path)}/\n`);
        created++;
      }
    } else {
      if (exists(op.path) && !FORCE) {
        process.stdout.write(`exists:  ${path.relative(CWD, op.path)} (use --force to overwrite)\n`);
        skipped++;
        continue;
      }
      if (DRY_RUN) {
        process.stdout.write(`would create: ${path.relative(CWD, op.path)} (${op.content.split('\n').length} lines)\n`);
        wouldCreate++;
      } else {
        fs.writeFileSync(op.path, op.content, 'utf8');
        process.stdout.write(`created: ${path.relative(CWD, op.path)} (${op.content.split('\n').length} lines)\n`);
        created++;
      }
    }
  }

  process.stdout.write(`\nSummary: ${created} created, ${skipped} skipped, ${wouldCreate} dry-run\n`);
  if (!DRY_RUN && created > 0) {
    process.stdout.write(`\nNext: run \`node .opencode/bin/refresh-project.js\` to populate PROJECT.md from your real stack.\n`);
  }
}

main();
