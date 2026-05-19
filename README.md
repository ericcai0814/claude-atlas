# claude-atlas

Read-only Tauri desktop dashboard for cross-tier Claude Code config observability.
Surfaces drift between `~/.claude/`, `~/dotfiles/claude/`, and per-project
`.claude/` — never mutates.

**Status**: v0.1.0 — Phase 1 shipped ([release notes](https://github.com/ericcai0814/claude-atlas/releases/tag/v0.1.0)).

## How this was built

claude-atlas is built with a spec-driven workflow: I designed the feature specs and architecture in [`openspec/`](./openspec/), generated the Rust/Tauri implementation via Claude Code, and reviewed/integrated each iteration before shipping.

Full disclosure: I do not hand-write Rust or Tauri. This project ships because spec quality — not framework familiarity — drives the implementation. The Rust code is downstream of the specs, not the other way around.

### What I authored vs what AI implemented

| Authored by me | Implemented via Claude Code |
|---|---|
| `openspec/specs/config-observability/spec.md` — domain spec | All Rust code under `src-tauri/` |
| `openspec/changes/archive/2026-05-10-add-config-observability/` — Phase 1 design | Tauri integration & IPC plumbing |
| `ARCHITECTURE.md` — data model & Rust command contracts | React/TypeScript frontend |
| Four-state drift classification (`ok` / `drifted` / `broken` / `unmanaged`) | File walkers & manifest parsers |
| Dashboard tab layout & non-invasive guidance principles | `.github/workflows/ci.yml` |
| Phase 1 release scope & integration review | Test fixtures |

If you are interested in the spec → implementation flow, the openspec files are the source of truth — start there, not in the Rust code.

## Capabilities

1. **Multi-Tier Inventory Discovery** — enumerates skills / agents / hooks / memory across global, dotfiles, and project tiers
2. **Four-State Drift Classification** — every artifact tagged `ok` / `drifted` / `broken` / `unmanaged`
3. **Unified Dashboard Presentation** — Overview summary + Symlinks / Projects / Plugins / Context drill-down tabs
4. **Non-Invasive Guidance** — drift surfaces copy-paste shell CTAs (e.g. `cd ~/dotfiles && just restore`); the dashboard never writes to any Claude config path
5. **Manifest-Driven Drift Detection** — parses `<project>/.claude/dispatch.yaml`; flags `missing` / `excess` artifacts against the declared manifest

Specs: [`openspec/specs/config-observability/spec.md`](./openspec/specs/config-observability/spec.md).
Phase 1 design: [`openspec/changes/archive/2026-05-10-add-config-observability/`](./openspec/changes/archive/2026-05-10-add-config-observability/).
Data model & Rust command contracts: [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Screenshot

_TODO — capture from macOS build._

## Dev

```bash
bun install
bun run tauri dev
```

## Build

```bash
bun run tauri build
```

CI (`ubuntu-latest`) runs `bunx tsc --noEmit` + `cargo test` + `cargo check` on every PR — see [`.github/workflows/ci.yml`](./.github/workflows/ci.yml).
