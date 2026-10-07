# Policy engine (runtime tool-call guard)

The pack enforces tool-call safety with **declarative rules** instead of a
hardcoded list in JavaScript. The rules live in a versioned JSON file and are
evaluated by the local plugin `.opencode/plugins/hookify.js` on every
`tool.execute.before` event.

## Files

| File | Role |
|---|---|
| `.opencode/policy-rules.json` | The data: `version`, `mode`, and `rules[]`. Edit this to change behaviour. |
| `.opencode/plugins/hookify.js` | The runtime: `secretBlocker` + policy evaluation + `permission.ask`. Auto-loaded, zero install. |
| `.opencode/bin/lib/policy-engine.js` | Pure evaluator (load, match, rank, redact, log). Not a CLI. |
| `.opencode/bin/lib/policy-selftest.js` | Offline fixture runner (`deny` blocks, `warn` does not, benign = 0 deny). |
| `.opencode/logs/policy.log` | Audit trail (gitignored): timestamp, severity, rule id, tool, redacted target. |

## Severities

| Severity | Runtime effect |
|---|---|
| `deny` | `throw` in `tool.execute.before`: the call does not run. Reserved for catastrophic and irreversible operations. |
| `warn` | `console.warn` plus an audit line. Never blocks. |
| `ask` | Registers a confirmation request and lets the native `permission.ask` hook set `status: "ask"`. If that event does not fire for the call, it **degrades to `warn`** — never a silent block. |

The default is conservative: only `rm -rf /`, `rm -rf ~`, raw-device wipes,
`mkfs`, `dd` to `/dev`, fork bombs, `DROP DATABASE`/`SCHEMA`, and
`git push --force` are `deny`. Migrations, commits, tests, and `DROP TABLE`
inside a migration stay non-blocking.

## Editing a rule

Open `.opencode/policy-rules.json`, change a `severity`, edit a `match`
regular expression, or set `mode`, then save. The engine caches by file
modification time, so the next tool call picks up the change without a restart.

Rule fields:

- `id` — stable unique slug (`^[a-z0-9][a-z0-9-]*$`), shown in errors and logs.
- `severity` — one of `warn`, `ask`, `deny`.
- `match` — a regular expression tested against the command (`bash`) or the
  file path (`edit`, `write`).
- `tool` — `"bash"` or `["edit","write"]` (a string or an array of strings).
- `message` — human explanation surfaced on warn/deny.
- `flags` — optional regex flags (for example `"i"` for SQL keywords).
- `ignore` — optional list of regexes; a match skips the rule.

`mode` values:

- `enforce` — apply severities as written.
- `warn-only` — downgrade every `deny` to `warn` (panic button).
- `off` — disable the declarative engine (the retained secret guard still runs).

## Verifying

Run the offline fixtures (no runtime, no network):

```bash
node .opencode/bin/lib/policy-selftest.js
```

It asserts that a `deny` rule throws, a `warn` rule does not, the `ask`
channel degrades safely, and the benign suite produces zero denies. The static
regression case `E19` in `evals/cases/static.json` validates the JSON shape
separately:

```bash
node .opencode/bin/eval-static.js
```

## Safety notes

- The audit log truncates targets to 500 bytes and redacts values that look
  like `--token`, `KEY=`, `password`, or `Authorization: Bearer` before writing.
- The engine never uses the network and never reads credentials.
- The secret-file guard (`secretBlocker`) is retained and independent of this
  file, so a bad JSON edit cannot silently disable secret protection.
