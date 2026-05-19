## 1. Hooks file-level inventory（Multi-Tier Inventory Discovery）

- [x] [P] 1.1 新增失敗的 cargo unit test 覆蓋 R1 新加的 "Hook .sh files are enumerated at file level" scenario — fixture 包含 4 種 state（`ok` / `drifted` / `broken` / `unmanaged`）各至少 1 個 hook `.sh` case，斷言每個 entry 帶有 link_path / target / expected_source / state 欄位；驗證：`cd src-tauri && cargo test scan_hooks` 顯示測試失敗（紅燈，stub function 回傳 empty Vec 或 unimplemented）
- [x] 1.2 在 `src-tauri/src/commands/hooks.rs` 實作 `scan_hooks(claude_hooks_dir: String, dotfiles_hooks_dir: String) -> Result<Vec<HookEntry>, String>` 命令，對每個 `.sh` 檔套用既有 four-state drift 規則（symlink 解析後比對 expected_source）；驗證：1.1 的 cargo test 全綠
- [x] 1.3 在 `src-tauri/src/commands/mod.rs` 加 `pub mod hooks;`、在 `src-tauri/src/lib.rs` 的 `tauri::generate_handler!` 註冊 `commands::hooks::scan_hooks`；驗證：`cd src-tauri && cargo check` exit code 0、`grep scan_hooks src-tauri/src/lib.rs` 顯示已註冊

## 2. Plugins severity sort（Unified Dashboard Presentation）

- [x] [P] 2.1 新增失敗的 cargo unit test 覆蓋 R3 新加的 "Plugins tab applies dead-status severity sort" scenario — fixture 至少包含 `dead` / `quiet` / `active` / `disabled` 各 1 個 plugin、外加同 `dead` group 內 alpha/zebra 兩個 entry，斷言回傳順序為 `dead(alpha) → dead(zebra) → quiet → active → disabled`；驗證：`cd src-tauri && cargo test list_plugins` 顯示測試失敗（紅燈，現有 name-only sort 不滿足 severity 順序）
- [x] 2.2 在 `src-tauri/src/commands/plugins.rs` 新增 `severity_rank(dead_status: &str) -> u8` helper（`dead`=0、`quiet`=1、`active`=2、`disabled`=3），把結尾 `plugins.sort_by(|a, b| a.name.cmp(&b.name))` 改成 `severity_rank` 為主鍵 + plugin name `then_with` tiebreak（仿照 `src-tauri/src/commands/symlinks.rs` 既有的 `severity_rank` + `then_with` pattern）；驗證：2.1 的 cargo test 全綠

## 3. Regression verification

- [x] 3.1 跑 full `cd src-tauri && cargo test` 與 `cd src-tauri && cargo check`，確保既有 symlinks / projects / plugins / context module 測試與 Phase 1 commit `c9738e7` 引入的 symlinks severity ordering test 全部維持綠燈；驗證：兩個指令 exit code 0、test 報告無 FAILED line
- [x] 3.2 跑 `spectra verify add-phase2-refinements`，確認 R1 + R3 的新 scenarios 被歸類為 satisfied；驗證：spectra verify 報告對 "Multi-Tier Inventory Discovery" 與 "Unified Dashboard Presentation" 兩 requirement 不再標出原本的 W1 hooks file-level / plugins severity sort gap
