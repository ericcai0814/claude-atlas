# Architecture

> Single source of truth for data shape & command contracts. Kept short on purpose —
> UX should inform requirements, not the other way round.

## Goal

A Tauri read-only dashboard that answers four questions across all Claude Code configs on this machine:

1. **Which projects have what Claude config?** (scan ~/dotfiles + `~/*/` repos for `.claude/`, CLAUDE.md)
2. **Which symlinks are out of sync?** (`~/.claude/*` target vs dotfiles source)
3. **Which plugins / MCP servers are actually being used?** (settings.json × skill-usage.log)
4. **Which memory / context artifacts are bloating?** (MEMORY.md line counts, always-on rule size)

Phase 1 = read-only. Phase 2 = mutation (toggle plugin, run `just restore`, edit memory).

## MVP Vertical Slice

Build **Symlinks tab** end-to-end first. It exercises every layer (Rust FS, Tauri command,
React state, drift alert UX) and solves the most painful known problem ("有腳本但會忘記跑").
Other tabs scaffold only.

## Data Model (TypeScript)

```ts
// Cross-project inventory
interface Project {
  path: string;             // absolute path to repo root
  name: string;             // basename
  hasClaudeDir: boolean;    // .claude/ exists
  hasClaudeMd: boolean;     // CLAUDE.md exists
  skills: string[];         // .claude/skills/*/SKILL.md basenames
  agents: string[];         // .claude/agents/*.md
  memoryLines: number | null; // ~/.claude/projects/<slug>/memory/MEMORY.md line count
}

// Symlink state
interface SymlinkEntry {
  linkPath: string;         // e.g. ~/.claude/settings.json
  target: string | null;    // resolved target absolute path, null if broken
  expectedSource: string | null; // where dotfiles says it should point
  state: 'ok' | 'broken' | 'drifted' | 'unmanaged';
}

// Plugin / MCP
interface Plugin {
  name: string;             // e.g. "mgrep@Mixedbread-Grep"
  enabled: boolean;         // from settings.json enabledPlugins
  lastTriggeredAt: string | null; // ISO, from skill-usage.log
  triggerCount7d: number;   // trigger count in last 7 days
  deadStatus: 'active' | 'quiet' | 'dead'; // ≥3 / 1-2 / 0 triggers in 30d
}

interface McpServer {
  name: string;
  scope: 'global' | 'project';
  projectPath?: string;
  enabled: boolean;
}

// Context budget
interface ContextBudget {
  alwaysOnRuleBytes: number; // sum of rules/common/*.md bytes
  globalSkillCount: number;  // skills in .global-whitelist (Tier 1)
  catalogSkillCount: number; // skills in catalog
  memoryTotalLines: number;  // all MEMORY.md across projects
}

// Drift alert summary (Overview tab)
interface DriftSummary {
  symlinkBroken: number;
  symlinkDrifted: number;
  pluginsDead: number;
  memoryOverBudget: number; // > 200 lines
}
```

## Rust Commands (Tauri invoke signatures)

```rust
// MVP: implement scan_symlinks first (vertical slice)
scan_projects(roots: Vec<String>) -> Vec<Project>
scan_symlinks(claude_dir: String, dotfiles_source: String) -> Vec<SymlinkEntry>
list_plugins(settings_path: String, usage_log_path: String) -> Vec<Plugin>
list_mcp(settings_path: String, project_roots: Vec<String>) -> Vec<McpServer>
compute_context_budget(rules_dir: String, skills_dir: String, whitelist_path: String, memory_dir: String) -> ContextBudget
compute_drift_summary() -> DriftSummary  // composes the others
```

**Error handling**: each command returns `Result<T, String>`. String errors flow to React and render as a toast; no silent fallbacks.

**Caching**: none in Phase 1. Commands re-scan on each invoke. If > 200ms perf issue surfaces, add Rust-side `Mutex<Option<T>>` cache with invalidation hook.

## Directory Layout

```
claude-atlas/
├── ARCHITECTURE.md          # this file
├── README.md                # user-facing
├── src/                     # React app
│   ├── App.tsx              # tab container
│   ├── tabs/
│   │   ├── Overview.tsx     # drift summary cards
│   │   ├── Symlinks.tsx     # MVP vertical slice
│   │   ├── Projects.tsx     # scaffold
│   │   ├── Plugins.tsx      # scaffold
│   │   └── Context.tsx      # scaffold
│   └── types.ts             # mirrors Rust structs
└── src-tauri/
    └── src/
        ├── lib.rs
        └── commands/
            ├── mod.rs
            ├── symlinks.rs  # MVP
            ├── projects.rs
            ├── plugins.rs
            ├── mcp.rs
            └── context.rs
```

## Out of Scope (explicit)

- **No CLI binary**. This is a GUI; terminal workflows stay with `claude-skill` / `just`.
- **No mutation in Phase 1**. Drift shown but buttons copy CLI commands, not execute them.
- **No telemetry / analytics**. Local only, no network except optional GitHub API for plugin marketplace lookup (Phase 2+).
- **No open-source yet**. Personal tool; if patterns generalize, extract later.

## Non-Goals Also Worth Stating

- **Not a config editor.** Editing SKILL.md etc. stays in VS Code. Dashboard surfaces state.
- **Not a replacement for `/evolve`.** Evolve does AI-driven audit recommendations; atlas is static visibility.
