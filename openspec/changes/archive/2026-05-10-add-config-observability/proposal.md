## Why

Claude Code 配置散落在 `~/.claude`、`~/dotfiles/claude`、與各 project 的 `.claude/` 三個層級，管理者缺乏跨來源的單一視圖。即使已有 `just diff` / `just restore` / `claude-skill` 等 CLI，使用者仍會**忘記 symlink 飄移**，也難以看見 plugin 是否實際被觸發、memory/rule 是否佔用過多 context budget。一個跨層級、read-only 的視覺化 dashboard 能在 drift 發生時主動 surface 而不是等下一次 commit 才發現。

Dotfiles 從「bootstrap 工具」漂移成「Claude 配置主倉庫（94% commits、54MB / 4,645 檔）」的現況下，單憑 symlink 管理已不夠。使用者希望 `dotfiles/claude` 升級為 **per-project dispatch 管理中樞**，由宣告性 manifest (`<project>/.claude/dispatch.yaml`) 定義每個 project 應該繼承哪個 profile、啟用哪些 skill / agent / plugin / mcp。本 change 在其範圍內（read-only observation）納入 manifest 感知：atlas 需要能讀取 dispatch.yaml、與實際 `.claude/` 對照、surface manifest drift。manifest 的寫入 / apply 工具本身（`dispatch-apply.sh`、profile 系統）屬於 dotfiles repo 的獨立 change，不在 atlas 本 change 範圍。

## What Changes

- 新增 `config-observability` capability，作為 claude-atlas 應用的 Phase 1 骨幹
- 定義跨 tier（global、dotfiles source、project-local）的 inventory 掃描契約
- 定義 symlink / plugin / memory 三類 artifact 的 drift 分類規則（ok / drifted / broken / unmanaged）
- 定義 Overview 彙總 view 與 4 個 drill-down view（Symlinks / Projects / Plugins / Context）的責任分工
- 明確訂下 Phase 1 **不執行任何 mutation**，遠端補救動作皆以 CLI command CTA 呈現
- 實作 `scan_symlinks` Rust command 作為 vertical slice（已於 commit d0ba226 落地），其餘 3 個 command (`scan_projects`, `list_plugins`, `compute_context_budget`) 以 scaffold 暫留，分階段補齊
- **新增：Projects tab 支援 dispatch.yaml manifest 讀取** — 若 project 有 `.claude/dispatch.yaml`，掃描時 parse 並與實際 `.claude/` 比對，surface manifest-level drift（skill / agent / plugin 宣告 vs 實際存在）。parse 結果以額外欄位回傳給前端渲染。
- **新增：Overview 納入 manifest-drift 彙總** — drift summary cards 增加「manifest-drifted projects」計數

## Non-Goals

- **不做 config mutation**：不執行 `just restore`、不 toggle plugin、不編輯 memory 檔（Phase 2 議題）
- **不做 dispatch apply**：本 change 只讀 dispatch.yaml、不寫；manifest apply 工具 (`dispatch-apply.sh`、profile 繼承、plugin per-project override 邏輯) 屬於 dotfiles repo 獨立 change，非本範圍
- **不做跨機器同步**：只掃本機 `~/`，不透過 GitHub API 抓 remote dotfiles 或 plugin marketplace metadata
- **不做 AI 驅動的 audit**：角色區分清楚 — `/evolve` 做建議、atlas 做靜態視覺化
- **不替代既有 CLI**：`claude-skill add`、`just restore` 等保留為唯一的 mutation 入口
- **不加 telemetry**：local-only，無網路請求（Phase 1）
- **不定義 dispatch.yaml v1 schema**：schema 由 dotfiles 側的 change（`add-dispatch-hub` 或類似）擁有；atlas 僅消費它

## Capabilities

### New Capabilities

- `config-observability`: 跨 tier 掃描 Claude config、分類 drift 狀態、呈現彙總與 drill-down view、讀取 dispatch.yaml 並 surface manifest drift，並以 CTA 引導使用者執行既有 CLI 補救指令

### Modified Capabilities

(none)

## External Dependencies（非本 change 範圍但有相依）

- **dispatch.yaml v1 schema**：由 dotfiles 側 change 擁有。atlas 以 defensive parsing 策略實作 — schema 不存在時 Projects tab 優雅降級，不顯示 manifest drift 欄位。
- **`~/claude-config` repo 拆分**：dotfiles 決策 1（路線 C）的執行屬 dotfiles 獨立 change。atlas 的 scan_projects 以 `roots: Vec<String>` 參數支援未來來源多元化，不 hardcode 路徑。
- **`dispatch-apply.sh` 工具**：不屬本 change；atlas Phase 2 若未來加入「一鍵觸發 apply」按鈕，需寫獨立新 change（屆時會**破壞本 change 的 Non-Invasive Guidance requirement**，需 MODIFIED delta 替換）。

## Impact

- **Affected specs**: `openspec/specs/config-observability/spec.md`（新增）
- **Affected code**:
  - `src-tauri/src/commands/symlinks.rs`（已實作）
  - `src-tauri/src/commands/{projects,plugins,context}.rs`（待補）
  - `src-tauri/src/lib.rs`（註冊 command）
  - `src/tabs/*.tsx`（Symlinks 已實作；Overview / Projects / Plugins / Context 為 scaffold）
  - `src/types.ts`（Phase 1 data model，含新增 `DispatchManifest` / `ManifestDrift` 型別）
- **Dependencies**: 依賴既有檔案系統結構（`~/.claude`、`~/dotfiles/claude`、`~/.claude/skill-usage.log`）— 若這些路徑 schema 變更則需同步更新 command 實作
- **External specs 相依**：dotfiles 側 `add-dispatch-hub`（未建立）的 `dispatch.yaml` v1 schema；atlas 讀法採 defensive、降級可用
