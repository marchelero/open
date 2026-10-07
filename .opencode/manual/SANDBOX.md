# Sandbox / logical confinement

This page documents the **logical confinement** layer that ships with the pack
(on top of the [policy engine](./POLICY-ENGINE.md)) and, honestly, what it does
**not** do. It also gives copy-paste recipes for running the pack inside a
**real** container, which is the only way to get a kernel boundary — the pack
does not provide one.

> Short version: the pack ships a **logical fence** (paths + best-effort
> network), not a sandbox. For real isolation, run the pack in a container
> (recipes below). No new dependency is added to the pack by any of this.

## 1. What ships in the pack

The optional `confinement` block in `.opencode/policy-rules.json`, evaluated by
`.opencode/plugins/hookify.js` on every `tool.execute.before`:

```json
"confinement": {
  "mode": "audit",
  "roots": ["."],
  "allow": [],
  "readTools": ["edit", "write", "read"],
  "denyNetwork": false
}
```

A JSON without the block behaves exactly as before the feature existed
(confinement disabled). Editing the file takes effect without a restart (the
engine reloads on modification time).

### Fields

| Field | Meaning |
|---|---|
| `mode` | `off` (disabled), `audit` (report only, never blocks), `enforce` (blocks). Shipped default: `audit`. |
| `roots` | Allowed base directories. `.` is the project cwd. A destination outside every root and every `allow` entry is a boundary hit. |
| `allow` | Extra allowed base directories (for example a build or temp directory outside the cwd). |
| `readTools` | Tools whose destination path is checked. Default `edit`, `write`, `read`. |
| `denyNetwork` | Opt-in, best-effort detection of egress commands (`curl`, `wget`, `scp`, `ssh`, `nc`, ...). Default `false`. |

## 2. What it decides

For `edit` / `write` / `read` in `readTools`, the declared destination is
resolved (relative or absolute) and checked against `roots` + `allow`:

- inside the fence -> allowed;
- outside the fence -> `deny` in `enforce`, or a `would deny` line in the audit
  log (never blocks) in `audit`.

`hookify` throws on a boundary hit in `enforce`, so the tool call does not run.
Every hit is written to `.opencode/logs/policy.log` with the rule id
(`confine-path-outside-root` or `confine-network-egress`) and a redacted target.

For `bash` the check is **best-effort**: non-flag tokens, parent segments
(`..`), `~`, and redirection targets are resolved and checked. A rename, a
subshell, an encoded payload, or a child process that computes its own path can
evade the token scan.

## 3. Modes in practice

```json
"confinement": { "mode": "off", ... }      // no boundary checks
"confinement": { "mode": "audit", ... }    // visible "would deny", never blocks
"confinement": { "mode": "enforce", ... }  // outside the fence -> blocked
```

Start in `audit`, read `.opencode/logs/policy.log` for a while, add the
legitimate extras to `allow`, then switch to `enforce`. Turning on `enforce`
with `roots: ["."]` can flag legitimate writes to temp, caches, or build
directories outside the project; add those to `allow` first.

## 4. Real isolation (opt-in, you run it)

The pack cannot ship a kernel sandbox with zero dependencies. If you need one,
run the whole pack inside your own runtime. These recipes add nothing to the
pack; they are your environment.

### Docker (read-only workspace, no network, non-root)

```bash
docker run --rm -it \
  --read-only \
  --tmpfs /tmp \
  --mount type=bind,source="$PWD",target=/work \
  --workdir /work \
  --network none \
  --user "$(id -u):$(id -g)" \
  --cap-drop ALL \
  --security-opt no-new-privileges \
  node:18 bash
```

Notes:
- `--network none` removes egress entirely (stronger than `denyNetwork`).
- `--read-only` plus an explicit writable mount keeps the rest of the system
  out of reach; drop `--read-only` only if the agent must write the workspace.
- `--user` runs as your UID instead of root.

### Podman (rootless)

```bash
podman run --rm -it --userns=keep-id \
  --read-only --tmpfs /tmp \
  -v "$PWD":/work:Z -w /work \
  --network none \
  --cap-drop ALL \
  docker.io/library/node:18 bash
```

### Windows Sandbox

Enable the built-in "Windows Sandbox" feature and map the project read-only
through a shared folder; it starts without network if you do not attach a
network adapter.

### Host tools (Linux)

`bubblewrap` or `firejail` can wrap a single command with a read-only bind of
the workspace and no network. These are host packages you install yourself;
the pack does not depend on them.

## 5. What this does NOT guarantee (NO garantiza)

- **No es una frontera de kernel.** There is no namespace, seccomp filter, or
  hypervisor. `hookify` sees the tool arguments (a string) before execution,
  not the real effect. A determined script can escape.
- **Node runs with your privileges.** The agent process has the same user
  rights as you; a write outside the fence that is not caught (for example by
  obfuscation) succeeds at OS level.
- **`denyNetwork` is best-effort**, matched by command name only. It has no
  firewall or syscall enforcement behind it and is trivially bypassed by a
  renamed binary or a language HTTP client. It is off by default for that
  reason, and it is **not** a network fence.
- **No dry-run real.** `audit` classifies and reports; it never simulates or
  executes the operation in a contained way.
- **No reemplaza** the content rules of the policy engine nor the secret-file
  guard; it complements them on a different axis (scope, not danger).
- **No previene** ofuscación, subshells, binarios renombrados ni rutas que el
  propio proceso hijo resuelva.

## 6. Verifying

```bash
node .opencode/bin/lib/policy-selftest.js   # fixtures: enforce deny / audit log / benign 0 deny
node .opencode/bin/eval-static.js           # E19 + E20 validate the JSON shape offline
```

The static case `E20` validates the `confinement` block shape without executing
the plugin or touching the network. The self-test exercises the decision engine
and a benign command suite that must produce zero denies.
