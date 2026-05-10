## Why

Phase 1 收尾後 verify 報告與後續 review 找到兩個 implementation 與 spec 不符的 gap：

1. **Hooks file-level inventory missing**：spec R1 (Multi-Tier Inventory Discovery) 列 hooks `.sh` 為應 enumerate 的 artifact category，但目前 scan 沒有 file-level entries。前一輪 `/spectra-verify` 把這列為已知 W1。
2. **Plugins 排序未對齊 spec**：spec R3 (Unified Dashboard Presentation, "Tab displays sortable artifact table") 要求 drill-down tab「sorted by drift severity」。Symlinks tab 已於 commit `c9738e7` 對齊，但 `src-tauri/src/commands/plugins.rs` 仍按 plugin name 字母排，沒對齊 dead severity 順序。

兩項都不改變 spec requirement 文字，純粹是 implementation 對齊既有規格。在 Phase 2 進一步擴充前先清掉 Phase 1 已知 gap，避免後續 verify 報告繼續累積 W 等級的 known gap。

## What Changes

- **新增 hooks file-level inventory**：擴充掃描，每個 `~/.claude/hooks/*.sh` 與 `~/dotfiles/claude/hooks/*.sh` 成為一個 inventory entry，套用既有 four-state drift classification（ok / drifted / broken / unmanaged）
- **plugins 預設排序改為 severity-aware**：`list_plugins` 結尾 `sort_by` 從 name-only 改成 `dead → quiet → active → disabled`、相同 status 內以 plugin name tiebreak。仿照 `src-tauri/src/commands/symlinks.rs` 的 `severity_rank` + `then_with` pattern（commit `c9738e7` 範式）
- **新增 cargo unit tests**：plugins severity ordering / tiebreak、hooks four-state classification 各加 test 覆蓋
- **不改 requirement 文字**：本 change 不修改 R1 / R3 的 SHALL/MUST 描述。但會新增可驗證的 scenarios 把實作 contract 形式化（屬 spec 的 MODIFIED Requirements，requirement 描述沿用、僅補 scenario）

## Non-Goals

- **不做 manifest apply preview**（原 Phase 2 議題 D#1）：Projects tab 對 manifest `missing` 條目顯示 dry-run 預覽，依賴 dotfiles 端 `dispatch-apply.sh`。dotfiles 尚未實作該工具，現在打包進來會卡住本 change ship。等 dotfiles 端 cross-repo 工具落地後另開 `add-manifest-apply-preview` change
- **不改 UI sort header 行為**：plugins severity sort 是 backend 預設順序對齊 spec；前端若有 column header 點擊排序，行為不在範圍
- **不擴大 hooks 掃描範圍到 project tier**：本 change 只掃 global tier (`~/.claude/hooks/`) 與 dotfiles source tier (`~/dotfiles/claude/hooks/`)。project-local hooks 屬獨立議題
- **不改變 four-state drift classification 規則**：直接套用 R2 既有分類，不新增 hooks-專屬 state

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `config-observability`: 新增 scenarios 把 hooks file-level enumeration 與 plugins severity sort 形式化為可驗證的測試案例（R1 增 hook scenario、R3 增 plugins severity sort scenario）。Requirement 描述文字不變

## Impact

- Affected specs: `openspec/specs/config-observability/spec.md`（MODIFIED — R1 + R3 各加一個 scenario，requirement 描述不變）
- Affected code:
  - New:
    - `src-tauri/src/commands/hooks.rs` — hooks file-level scan command
  - Modified:
    - `src-tauri/src/commands/plugins.rs` — severity sort + cargo tests
    - `src-tauri/src/commands/mod.rs` — 註冊 hooks module
    - `src-tauri/src/lib.rs` — 註冊 scan_hooks tauri command
- Dependencies: 既有檔案系統結構（`~/.claude/hooks/`、`~/dotfiles/claude/hooks/`）。若這些路徑改變則 hooks 掃描需同步更新
