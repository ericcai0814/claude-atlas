# claude-atlas

Read-only dashboard for visualizing and managing Claude Code configs across projects on this machine.

Answers four questions at a glance:
1. **Projects** — which repos have what `.claude/` config
2. **Symlinks** — `~/.claude` vs dotfiles source-of-truth drift
3. **Plugins / MCP** — which are enabled, which are actually being triggered
4. **Context** — always-on rule budget, memory bloat

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for data model and command contracts.

## Dev

```bash
bun install
bun run tauri dev
```

## Build

```bash
bun run tauri build
```

## Status

Phase 1 MVP — scaffolding. Symlinks tab is the first vertical slice.
