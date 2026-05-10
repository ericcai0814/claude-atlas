# claude-atlas

Read-only Tauri desktop dashboard for cross-tier Claude Code config observability.
Surfaces drift between `~/.claude/`, `~/dotfiles/claude/`, and per-project
`.claude/` — never mutates.

**Status**: v0.1.0 — Phase 1 shipped ([release notes](https://github.com/ericcai0814/claude-atlas/releases/tag/v0.1.0)).

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
