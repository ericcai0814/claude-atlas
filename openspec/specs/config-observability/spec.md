# config-observability Specification

## Purpose

TBD - created by archiving change 'add-config-observability'. Update Purpose after archive.

## Requirements

### Requirement: Multi-Tier Inventory Discovery

The system SHALL enumerate Claude Code configuration artifacts across three tiers:

1. **Global tier**: files and directories directly under `~/.claude/`
2. **Dotfiles source tier**: files and directories directly under `~/dotfiles/claude/`
3. **Project-local tier**: `.claude/` directories within user-specified project roots (default: `~/`)

The inventory SHALL cover the following artifact categories: symlinked entries (under global tier), skills (`skills/*/SKILL.md`), agents (`agents/*.md`), hooks (`hooks/*.sh`), and memory files (`projects/*/memory/MEMORY.md`).

The inventory SHALL exclude runtime and auxiliary directories that are not user-managed, including `projects/`, `todos/`, `shell-snapshots/`, `statsig/`, `ide/`, and any dotfile-prefixed entries.

#### Scenario: Global tier is scanned

- **WHEN** the user invokes an inventory scan
- **THEN** the system enumerates all entries in `~/.claude/` excluding noise directories
- **AND** returns each entry with its absolute path and artifact category

#### Scenario: Dotfiles source tier is reachable

- **WHEN** `~/dotfiles/claude/` exists on the filesystem
- **THEN** the system enumerates its entries to establish the expected source-of-truth reference

#### Scenario: Project-local tier is discovered

- **WHEN** the user supplies a list of project roots
- **THEN** the system walks each root one level deep and records any directory containing a `.claude/` subdirectory or a `CLAUDE.md` file

#### Scenario: Noise directories are skipped

- **WHEN** scanning `~/.claude/`
- **THEN** entries named `projects`, `todos`, `shell-snapshots`, `statsig`, `ide`, or starting with `.` SHALL NOT appear in the inventory

#### Scenario: Hook .sh files are enumerated at file level

- **WHEN** the inventory scan encounters `~/.claude/hooks/` or `~/dotfiles/claude/hooks/`
- **THEN** each `.sh` file under those directories SHALL appear as a distinct inventory entry
- **AND** each entry SHALL carry the same fields as a symlink entry: link path, resolved target (or canonical path for regular files), expected source from the dotfiles tier, and a four-state drift classification

##### Example: hook file enumeration

- **GIVEN** `~/.claude/hooks/stop.sh` is a symlink resolving to `~/dotfiles/claude/hooks/stop.sh`
- **AND** `~/.claude/hooks/orphan.sh` is a regular file with no counterpart under `~/dotfiles/claude/hooks/`
- **WHEN** the inventory scan runs
- **THEN** `stop.sh` appears as one entry with state `ok`
- **AND** `orphan.sh` appears as one entry with state `unmanaged`


<!-- @trace
source: add-phase2-refinements
updated: 2026-05-11
code:
  - src-tauri/Cargo.toml
  - src-tauri/src/commands/plugins.rs
  - src-tauri/src/commands/hooks.rs
  - src-tauri/src/commands/symlinks.rs
  - src-tauri/src/lib.rs
  - src-tauri/src/commands/mod.rs
-->

---
### Requirement: Four-State Drift Classification

The system SHALL classify every discovered artifact into exactly one of four drift states:

- **`ok`**: the artifact is a symlink resolving to the expected dotfiles source, or a file whose content matches the expected source
- **`drifted`**: an expected source exists but the artifact does not match it (broken contract requiring remediation)
- **`broken`**: the artifact is a symlink whose target does not exist, or a reference whose expected source has disappeared
- **`unmanaged`**: the artifact exists locally but has no corresponding expected source (legitimate local-only state, not an error)

The system SHALL surface both the actual target (resolved canonical path) and the expected source (dotfiles path) for every classified artifact.

#### Scenario: Symlink matches expected source

- **WHEN** a symlinked entry resolves to the same canonical path as the expected dotfiles counterpart
- **THEN** the entry is classified `ok`

#### Scenario: Symlink resolves to unexpected target

- **WHEN** a symlinked entry resolves to a path other than the expected dotfiles counterpart
- **AND** an expected source exists
- **THEN** the entry is classified `drifted`

#### Scenario: Symlink target missing

- **WHEN** a symlinked entry cannot be canonicalized because the target path does not exist
- **THEN** the entry is classified `broken`

#### Scenario: Local file without expected source

- **WHEN** a non-symlink file exists under `~/.claude/` and no same-named file exists under `~/dotfiles/claude/`
- **THEN** the entry is classified `unmanaged`

#### Scenario: Non-symlink where symlink is expected

- **WHEN** a non-symlink file exists under `~/.claude/` and a same-named file exists under `~/dotfiles/claude/`
- **THEN** the entry is classified `drifted`


<!-- @trace
source: add-config-observability
updated: 2026-05-10
code:
  - .spectra.yaml
  - CLAUDE.md
-->

---
### Requirement: Unified Dashboard Presentation

The system SHALL provide a dashboard UI composed of one Overview view and four drill-down tabs: Symlinks, Projects, Plugins, and Context.

The Overview view SHALL aggregate drift counts across all artifact categories and display summary cards indicating broken, drifted, and dead-plugin quantities.

Each drill-down tab SHALL surface a summary chip row showing counts per drift state, followed by a sortable table listing every artifact with its drift state badge, actual target, and expected source.

The dashboard SHALL re-scan its data source when the user switches to a tab and SHALL NOT maintain a persistent cache across invocations.

#### Scenario: Overview aggregates drift counts

- **WHEN** the user opens the Overview tab
- **THEN** the system displays cards showing the total count of `broken`, `drifted`, and dead-plugin entries aggregated across all tabs

#### Scenario: Tab displays sortable artifact table

- **WHEN** the user opens any drill-down tab
- **THEN** the system displays summary chips per drift state
- **AND** a table with one row per artifact, sorted by drift severity with `broken` and `drifted` rows appearing before `ok` rows

#### Scenario: Tab rescans on activation

- **WHEN** the user switches away from a tab and then returns to it
- **THEN** the system re-invokes its underlying scan command and renders fresh data

#### Scenario: Plugins tab applies dead-status severity sort

- **WHEN** the system returns the plugin list for the Plugins tab
- **THEN** entries SHALL appear in dead-status severity order: `dead` first, then `quiet`, then `active`, then `disabled`
- **AND** entries within the same dead-status group SHALL appear in alphabetical order by plugin name

##### Example: plugins severity ordering

| dead_status | plugin name | sort position |
| ----------- | ----------- | ------------- |
| dead        | alpha       | 1             |
| dead        | zebra       | 2             |
| quiet       | beta        | 3             |
| active      | gamma       | 4             |
| disabled    | delta       | 5             |


<!-- @trace
source: add-phase2-refinements
updated: 2026-05-11
code:
  - src-tauri/Cargo.toml
  - src-tauri/src/commands/plugins.rs
  - src-tauri/src/commands/hooks.rs
  - src-tauri/src/commands/symlinks.rs
  - src-tauri/src/lib.rs
  - src-tauri/src/commands/mod.rs
-->

---
### Requirement: Non-Invasive Guidance

The system SHALL NOT mutate Claude Code configuration. Specifically, the system SHALL NOT write to, modify, or delete any file under `~/.claude/`, `~/dotfiles/claude/`, any project-local `.claude/` directory, any `settings.json`, or any `dispatch.yaml`, and SHALL NOT toggle plugin or MCP server enablement.

When drift is detected, the system SHALL display a Call-To-Action block containing the exact shell command the user can copy and run to remediate the drift (for example `cd ~/dotfiles && just restore`).

The system SHALL NOT execute shell commands that mutate Claude Code configuration on behalf of the user. Remediation commands are copied to the clipboard; the user executes them externally.

**Permitted read-side OS affordances.** The system MAY invoke shell commands that are strictly non-mutating to Claude Code configuration, for the sole purpose of helping the user navigate or inspect observed state. Permitted examples: reveal a file in the OS file manager (`open -R` on macOS, `xdg-open` on Linux, `explorer /select,` on Windows) and open a file in an external editor (for example launching VS Code via the `code` CLI or `open -a`). These affordances MUST NOT write to Claude Code configuration paths.

#### Scenario: Drift produces CTA only

- **WHEN** the Symlinks tab detects at least one `broken` or `drifted` entry
- **THEN** the system renders a CTA block containing the literal command string `cd ~/dotfiles && just restore`
- **AND** does not execute the command

#### Scenario: No mutation endpoint exposed

- **WHEN** the dashboard is running
- **THEN** the Tauri backend SHALL NOT register any command that writes to `~/.claude/`, `~/dotfiles/claude/`, or any `.claude/` directory

#### Scenario: Plugin state is read-only

- **WHEN** the Plugins tab displays plugin enablement state
- **THEN** the system renders status indicators only and SHALL NOT provide toggle controls or any affordance that mutates `settings.json`

#### Scenario: Reveal in file manager is permitted

- **WHEN** the user activates a "Reveal" control on an observed artifact (symlink, project root, etc.)
- **THEN** the system MAY invoke an OS file manager command (for example `open -R <path>`) to highlight the target
- **AND** this invocation SHALL NOT write to any Claude Code configuration path

#### Scenario: Open in external editor is permitted

- **WHEN** the user activates an "Open in editor" control on a project or file
- **THEN** the system MAY launch an external editor (for example `code <path>` or `open -a "Visual Studio Code" <path>`)
- **AND** this invocation SHALL NOT write to any Claude Code configuration path


<!-- @trace
source: add-config-observability
updated: 2026-05-10
code:
  - .spectra.yaml
  - CLAUDE.md
-->

---
### Requirement: Manifest-Driven Drift Detection

The system SHALL detect and surface drift between a project's declared dispatch manifest and its actual `.claude/` contents.

When a `<project>/.claude/dispatch.yaml` file exists, the system SHALL parse it defensively using schema-agnostic YAML parsing, SHALL extract the fields relevant to dashboard rendering (`skills.include`, `skills.exclude`, `agents`, `plugins.include`, `plugins.exclude`, `mcp.servers`), and SHALL preserve unknown fields without erroring.

The system SHALL classify each declared artifact into one of three manifest states:

- **`satisfied`**: the declared artifact resolves against the project's own `.claude/`, or against the global whitelist tier, or against the dotfiles source tier
- **`missing`**: the declared artifact cannot be resolved in any tier
- **`excess`**: an artifact exists in the project's `.claude/` that is neither declared nor in the global whitelist

The system SHALL NOT author, modify, or delete `dispatch.yaml` files. The manifest is consumed read-only.

When a project has no `dispatch.yaml`, the system SHALL render the project without manifest-related columns and MUST NOT treat manifest absence as a drift state.

#### Scenario: Project with manifest is parsed

- **WHEN** a project root contains `.claude/dispatch.yaml` with well-formed YAML
- **THEN** the system parses it and records the declared skills, agents, plugins, and mcp servers on the project entry

#### Scenario: Declared skill resolves in global tier

- **WHEN** a dispatch manifest declares `skills.include: [git-workflow]`
- **AND** `git-workflow` is not present in the project's local `.claude/skills/`
- **AND** `git-workflow` appears in `~/dotfiles/claude/skills/.global-whitelist`
- **THEN** the system classifies the declared skill as `satisfied`

#### Scenario: Declared skill missing in all tiers

- **WHEN** a dispatch manifest declares a skill that exists in none of project-local, global whitelist, or dotfiles source tiers
- **THEN** the system classifies the declared skill as `missing`
- **AND** surfaces it on the Projects tab as a manifest drift entry

#### Scenario: Excess skill present in project without declaration

- **WHEN** a project's `.claude/skills/` contains a skill that is neither in the dispatch manifest's `skills.include` nor in the global whitelist
- **THEN** the system classifies the skill as `excess`

#### Scenario: Malformed manifest degrades gracefully

- **WHEN** a `dispatch.yaml` fails YAML parsing or contains only unknown fields
- **THEN** the system records the parse error on the project entry
- **AND** continues scanning other projects without aborting

#### Scenario: Manifest drift contributes to Overview summary

- **WHEN** one or more projects have `missing` manifest entries
- **THEN** the Overview tab displays a count of projects with manifest drift alongside the existing drift summary cards

#### Scenario: No mutation to manifest

- **WHEN** the dashboard is running
- **THEN** the Tauri backend SHALL NOT register any command that writes to `dispatch.yaml` files in any project

<!-- @trace
source: add-config-observability
updated: 2026-05-10
code:
  - .spectra.yaml
  - CLAUDE.md
-->