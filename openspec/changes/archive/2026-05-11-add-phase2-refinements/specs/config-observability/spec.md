## MODIFIED Requirements

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
