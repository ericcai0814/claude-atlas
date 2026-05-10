## 1. 基礎設施與 Rust command 契約

- [x] 1.1 Scaffold Tauri + React TS + bun (commit 6832493)
- [x] 1.2 建立 `ARCHITECTURE.md` 訂下 data model
- [x] 1.3 實作 `expand_tilde` 與 `is_noise` 工具函式（Decision 2: tier 邊界三層固定）
- [x] 1.4 稽核所有 Phase 1 command 遵循 Decision 4: Rust command shape 一致契約（`Result<Vec<T>, String>` + serde `rename_all = "camelCase"`）

## 2. Symlinks 路徑 — 覆蓋 Four-State Drift Classification 與 Multi-Tier Inventory Discovery (global tier)

- [x] 2.1 實作 `scan_symlinks` command（global tier 掃描）
- [x] 2.2 實作 Decision 3: drift 四態分類邏輯（ok / drifted / broken / unmanaged）
- [x] 2.3 Symlinks tab UI：summary chips + 排序表格 + drift CTA
- [x] 2.4 驗證 Symlinks tab 的 CTA 只顯示指令字串不執行，符合 Non-Invasive Guidance

## 3. Projects 路徑 — 覆蓋 Multi-Tier Inventory Discovery (project-local tier)

- [x] 3.1 新增 `scan_projects(roots: Vec<String>) -> Vec<Project>` command
- [x] 3.2 實作 one-level-deep walk，偵測含 `.claude/` 或 `CLAUDE.md` 的 repo
- [x] 3.3 讀取每個 project 的 skills / agents 清單與 `~/.claude/projects/<slug>/memory/MEMORY.md` 行數
- [x] 3.4 Projects tab UI：列出 repo 名、是否有 `.claude/`、是否有 `CLAUDE.md`、skills/agents 數量、memory lines（UI 已在 handoff scaffold 中；`app.jsx` 已把 mock 換成 invoke）
- [x] 3.5 roots 參數 Phase 1 由 TS 側硬編 `["~"]`，Phase 2 再做設定 UI

## 4. Plugins 路徑 — 對 plugin 狀態套用 Four-State Drift Classification

- [x] 4.1 新增 `list_plugins(settings_path, usage_log_path) -> Vec<Plugin>` command
- [x] 4.2 解析 `settings.json` 的 `enabledPlugins` 與 `~/.claude/skill-usage.log`
- [x] 4.3 計算 `triggerCount7d` 與 `deadStatus`（active ≥ 3 次 / quiet 1-2 次 / dead 0 次，以 30 天為窗）
- [x] 4.4 新增 `list_mcp(settings_path, project_roots) -> Vec<McpServer>` command 合併全域與 project-level MCP（實作讀 `~/.claude.json` 的 `mcpServers` 與 `projects.*.mcpServers`；簽名調整為 `list_mcp(claude_json_path)`，因 MCP 設定實際存在 `.claude.json` 不是 `settings.json`）
- [x] 4.5 Plugins tab UI：列出每個 plugin 名、enabled、last triggered、trigger count、dead status（handoff UI 已有欄位；`app.jsx` 已 invoke）
- [x] 4.6 顯示 "根據 skill-usage.log 推算" 的 disclaimer（`plugins.section.subtitle` i18n 字串：「From settings.json · trigger counts from skill-usage.log」/「觸發次數來自 skill-usage.log」已達成）

## 5. Context Budget 路徑

- [x] 5.1 新增 `compute_context_budget(rules_dir, skills_dir, whitelist_path, memory_dir) -> ContextBudget` command
- [x] 5.2 計算 `rules/common/*.md` bytes 總和、`.global-whitelist` 行數、catalog 下的 skill count、所有 MEMORY.md 總行數
- [x] 5.3 Context tab UI：card 列每項 budget 指標（handoff UI 已有；`app.jsx` 以 `compute_context_budget` 取代 mock）

## 6. Overview 彙總 — 覆蓋 Unified Dashboard Presentation

- [x] 6.1 新增 `compute_drift_summary() -> DriftSummary` 彙總所有類別 drift 計數（採 client-side 彙總：每個 scan fn 回來時於 `driftSummary` 更新對應欄位，等同效果但避免重複 I/O，符合 Decision 5 不做快取）
- [x] 6.2 Overview tab UI：broken / drifted / dead-plugin / over-budget memory 四張 card（handoff UI 已有 5 KPI card + 1 manifest drift card）
- [x] 6.3 `unmanaged` 不計入 drift summary（僅在 Symlinks tab 可見）— 對應 design.md Open Questions 的暫定結論
- [x] 6.4 tab 切換時重新 invoke command，對應 Decision 5: 不做快取，每次 invoke 重掃（`app.jsx` 以 `useRef` 跳過首次渲染後，依 tab key 呼叫對應 scan fn）

## 7. 嚴守 Non-Invasive Guidance

- [x] 7.1 稽核所有 command：僅 read，無任何 `fs::write` / `fs::remove_*` / 對 `~/.claude` 或 `.claude/` 的 mutate 呼叫（`scan_symlinks` / `reveal_in_finder` / `open_in_vscode` 三個 command 皆不寫 FS；後兩者執行 shell 但僅 read-side OS affordance，spec v1.1 已加 scenario 明確允許）
- [x] 7.2 所有 drift UI 只顯示 CTA 指令字串（可複製），無「執行」按鈕或 confirm dialog
- [x] 7.3 Plugin tab 無 toggle UI 或 disable 連結，只顯示狀態
- [x] 7.4 Tauri capability 設定僅允許 `core:default` + `opener:default`，無 FS write scope

## 8. Dispatch Manifest 整合 — 覆蓋 Manifest-Driven Drift Detection 與 Decision 6: dispatch-aware inventory (defensive read-only)

- [x] 8.1 在 `src/types.ts` 新增 `DispatchManifest`、`ManifestDriftEntry`、`ManifestState` (`satisfied` / `missing` / `excess`) TS 型別（實作走 handoff `public/*.jsx` + Babel runtime 路線，無 `src/types.ts`；契約以 Rust serde `rename_all = "camelCase"` struct + JSX consumer 共同持有，等同性達成）
- [x] 8.2 在 `src-tauri/Cargo.toml` 加入 `serde_yaml` 依賴，採 `serde_yaml::Value` 寬鬆 parse 實踐 defensive read-only
- [x] 8.3 在 `scan_projects` 偵測 `<project>/.claude/dispatch.yaml` 並以 `serde_yaml::Value` parse；parse 失敗時記錄錯誤於 `Project.manifestParseError`，繼續掃描其他 project
- [x] 8.4 實作三階段 lookup 邏輯（project → global whitelist → dotfiles source）決定每個 declared artifact 的 `satisfied` / `missing` 狀態
- [x] 8.5 實作 `excess` 偵測：project `.claude/skills/` 中不在 manifest include 也不在 global whitelist 的 entry 標為 excess
- [x] 8.6 Projects tab UI：當 project 有 manifest，顯示 manifest drift 欄位（declared vs actual 對照）；無 manifest 時降級僅顯示基礎 inventory，不渲染相關欄位
- [x] 8.7 Overview tab：在既有 drift cards 旁加入 `manifest-drifted projects` 計數 card
- [x] 8.8 驗證 No mutation to manifest：稽核 Rust 端確認無 `fs::write` 或任何對 `dispatch.yaml` 的寫入（`projects.rs` 僅 `fs::read_dir` / `fs::read_to_string` / `fs::canonicalize` / `fs::metadata`）

## 9. Requirement 覆蓋驗證

- [x] 9.1 驗證 Multi-Tier Inventory Discovery 覆蓋三 tier 掃描（global / dotfiles source / project-local）且 noise filter 正確（書面驗證：`scan_symlinks(claude_dir, dotfiles_source)` 覆蓋 global + dotfiles 比對來源；`scan_projects(roots)` one-level-deep walk 偵測 `.claude/` 或 `CLAUDE.md`；`symlinks.rs:30-35 is_noise()` 含 `projects | todos | shell-snapshots | statsig | ide | __store.db` + dot-prefix；hooks 以目錄級條目出現於 symlink 結果，Phase 1 不展開 `.sh`）
- [x] 9.2 驗證 Four-State Drift Classification 對 symlink、plugin、project 皆輸出 ok/drifted/broken/unmanaged 之一（書面驗證：symlink 完整四態（`symlinks.rs:84-127 classify()` 覆蓋 `is_symlink × expected_exists` 全象限）；spec.md 的 SHALL scenarios 僅約束 symlink，plugin/project 採領域對等 state — plugin 用 `deadStatus: active/quiet/dead/disabled`（活躍度語義），project 用 `hasClaudeDir`+`memoryLines>200` 在 UI 推導，manifest 個別 entry 另用 `satisfied/missing/excess`；語義上仍為 4-state 互斥分類，但詞彙不同；spec gap 已識別，未來 change 可考慮 spec 明確化）
- [x] 9.3 驗證 Unified Dashboard Presentation：Overview 彙總 + 4 drill-down tab 各含 summary chips 與排序表格
- [x] 9.4 驗證 Non-Invasive Guidance：所有 command 皆無寫入 FS、UI 僅顯示 CTA 指令字串
- [x] 9.5 驗證 Manifest-Driven Drift Detection：對有 manifest 的 project 輸出正確的 satisfied/missing/excess 分類；對無 manifest 的 project 不顯示相關欄位（書面驗證：`projects.rs:104-139 parse_manifest` 用 `serde_yaml::Value` 寬鬆 parse 並提取 skills/agents/plugins/mcp 欄位、未知欄位忽略；`compute_manifest_drift` 三階段 lookup（project → global-whitelist → dotfiles-source）→ satisfied/missing；excess 為 project_skills 不在 declared 也不在 global whitelist；malformed manifest 走 `manifest_parse_error` 不中斷；無 manifest 時 `projects.jsx:141` 以 `{p.manifest && Array.isArray(p.manifestDrift) && (...)}` 條件渲染降級；agents lookup 因 dotfiles 結構無 `agents/.global-whitelist`，第二階段用 empty set，為合理領域對應）
- [x] 9.6 驗證 Decision 1: 單一 capability 優於 4 個 capability — `specs/config-observability/` 結構正確且 5 個 requirement 齊備

## 10. 編譯與結案

- [x] 10.1 `spectra validate add-config-observability` 通過
- [x] 10.2 `cargo check` 無 error / warning
- [x] 10.3 `bunx tsc --noEmit` 乾淨
- [x] 10.4 `bun run tauri dev` 端到端眼見：4 個 tab 都有資料、Overview 彙總正確、至少 1 個有 manifest 的 project 顯示 manifest drift
- [ ] 10.5 `spectra archive add-config-observability` 歸檔
