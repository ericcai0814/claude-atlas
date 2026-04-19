## Context

claude-atlas 是 Tauri + React TS + bun 的桌面應用，目標是給 Eric 一個跨 tier 的 Claude Code 配置 dashboard。現有工作流是 CLI 導向（`just diff`、`just restore`、`claude-skill`、`/evolve`），痛點在於：

- **飄移盲區**：symlink 斷掉或 dotfiles 改過沒 restore，直到下一次 commit 才發現
- **活死不明**：30+ plugin 中哪些真的會觸發，哪些開了沒用，沒有量化視圖
- **跨 project 盲點**：使用者在 `~/dotfiles`、`~/vibe-vibe`、`~/financial-services` 等不同 repo 用過不同 skill / agent 配置，無總覽

Phase 1 MVP 僅 read-only dashboard；UX 需求已在 scan_symlinks vertical slice (commit d0ba226) 驗證完。本設計文件記錄 command 介面契約、tier 邊界、drift 分類語義，供後續 3 個 command 補齊時遵循。

## Goals / Non-Goals

**Goals:**

- 單一 capability (`config-observability`) 承載 4 個 artifact 觀察面向
- 所有 Rust command 回傳 `Result<Vec<T>, String>`，錯誤透過 React toast 顯示，無 silent fallback
- 每個 artifact 類型明確分類 `ok / drifted / broken / unmanaged` 四種 drift 狀態
- Phase 1 全 read-only，UI 的 CTA 僅**顯示** CLI 指令，不執行
- data model 在 TS 與 Rust 兩側 camelCase 對齊（serde `rename_all = "camelCase"`）

**Non-Goals:**

- 不做 config mutation，無「一鍵 restore」按鈕
- 不做跨機器同步，不呼叫 GitHub API 或 plugin marketplace
- 不做 AI 驅動 audit — 這是 `/evolve` 的責任
- 不做自動 watch／持續背景掃描 — 使用者手動觸發 scan，或切 tab 時 refresh
- 不做 i18n — 介面固定英文，零星 CTA 文案可含中文

## Decisions

### Decision 1: 單一 capability 優於 4 個 capability

**Choice:** Phase 1 建立一個 `config-observability` capability，含 4 個 SHALL requirement（Inventory / Drift / Dashboard / Non-Invasive）。

**Alternatives considered:**

- **4 個 capability 各對應一個 tab**：Symlinks / Projects / Plugins / Context 各自成 capability。
  - Rejected：tabs 是 UI decomposition 不是 capability 本質；Overview tab 無處安放；4 個 capability 在 Phase 1 規模下過度拆分
- **2 個 capability（inventory + sync）**：把 symlinks 獨立。
  - Rejected：Phase 1 尚無 mutation，inventory 與 sync 的語義差別 UI 感受不到；若 Phase 2 自然浮現再 refactor

**Rationale:** YAGNI。單一 capability 中 4 個 requirement 的結構允許未來用 change proposal 抽出某個 requirement 升級為獨立 capability，成本低於反向合併。

### Decision 2: tier 邊界三層固定

**Choice:** Inventory 掃描限定三 tier：

1. **Global**：`~/.claude/` — 全域配置
2. **Dotfiles source**：`~/dotfiles/claude/` — source of truth
3. **Project-local**：`~/<repo>/.claude/` — 個別 project 覆寫

**Alternatives considered:**

- **只掃 global + dotfiles**：省事但失去 project 覆寫視圖。Rejected —「跨 project 盲點」是三大痛點之一。
- **擴至 plugin marketplace remote**：抓 GitHub / official plugin repo metadata。Rejected — Phase 1 無網路請求原則。

**Rationale:** 三 tier 覆蓋使用者實際觸碰的所有層次；command signature 用 `roots: Vec<String>` 參數支援未來擴展但預設僅三層。

### Decision 3: drift 四態分類

**Choice:** 每個 artifact 標記為 `ok | drifted | broken | unmanaged` 之一：

| State | 語義 |
|-------|------|
| `ok` | 實際狀態與期待來源一致 |
| `drifted` | 有期待來源但實際狀態不符（需手動 restore） |
| `broken` | symlink 斷掉、expected source 消失 |
| `unmanaged` | 本地特有、無對應 source — 可能是 local override，不是錯誤 |

**Alternatives considered:**

- **三態（ok / drift / broken）**：把 unmanaged 併入 drifted。Rejected — 使用者需區分「我刻意留在本地的」vs「忘了 restore 的」。
- **嚴重度分級（critical / warning / info）**：借用 `/evolve` 風格。Rejected — drift 本身無嚴重度，mutation 意圖才有。

**Rationale:** 四態對應明確動作：ok = 無事、drifted = 執行 `just restore`、broken = 查 dotfiles source 為何消失、unmanaged = 決定是否納入管理。

### Decision 4: Rust command shape 一致契約

**Choice:** 六個 Phase 1 command 共用格式：

```rust
#[tauri::command]
pub fn <verb>_<noun>(/* path args */) -> Result<Vec<T>, String>
```

所有 struct 用 `#[serde(rename_all = "camelCase")]` 對齊 TS。錯誤以 `String` 冒出 React 後 toast；不包裝自訂 error enum（Phase 1 不需要區分 error kind）。

**Alternatives considered:**

- **自訂 `AtlasError` enum**：區分 IO / Parse / Logic error。Rejected — Phase 1 使用者唯一行動是看錯誤訊息，enum 只增加 Rust 側樣板。
- **async commands**：Tauri 支援 async。Rejected — FS 讀取在本地 < 100ms，sync 夠用；若 > 200ms 再改。

**Rationale:** 統一 shape 讓 4 個 tab 的 React hook pattern 完全相同，降低認知負擔。Performance 超預期時以 profile 驗證後再做優化。

### Decision 5: 不做快取，每次 invoke 重掃

**Choice:** Rust 側無 state，每次 command invoke 都重新讀 FS。

**Alternatives considered:**

- **`Mutex<Option<SnapshotCache>>`**：首次 invoke 建立、之後直接回。Rejected — 需要 invalidation 策略（監聽 FS 變動？tab 切換 dirty？），成本高於收益；配置檔變動頻率低。
- **持久化 SQLite**：長期追蹤 plugin 觸發趨勢。Rejected — skill-usage.log 已是 append-only source；atlas 角色是 viewer 不是 database。

**Rationale:** 無狀態最簡單、最可測；當單次 scan > 200ms 再加快取。

### Decision 6: dispatch-aware inventory (defensive read-only)

**Choice:** Projects tab 的 `scan_projects` 若發現 `<project>/.claude/dispatch.yaml` 存在，parse 該檔後在 `Project` struct 附加 `manifest: Option<DispatchManifest>` 與 `manifestDrift: Option<Vec<ManifestDriftEntry>>`。manifest 不存在時兩欄位皆為 `None`，UI 降級僅顯示基礎 inventory。

Atlas **不擁有** `dispatch.yaml` v1 schema — schema 由 dotfiles 側（`add-dispatch-hub` 或後續 change）擁有。Atlas 的 Rust 端以 `serde_yaml::Value` 寬鬆 parse，只驗證與 atlas 渲染相關的欄位存在：`skills.include`、`agents`、`plugins.include` 等。未知欄位保留為 `Value` 忽略；schema 演進不破壞 atlas。

**Alternatives considered:**

- **強 schema binding**：在 Rust 端定義嚴格的 `DispatchManifest` struct。Rejected — schema 不屬 atlas，綁強了等 dotfiles 改 schema atlas 就 broken。
- **不讀 manifest，只顯示實際 inventory**：atlas 維持純 file-system observer。Rejected — 使用者最需要看到的就是「宣告 vs 實際」的差距（declared: eric-writing-style / actual: 無此 symlink）。

**Rationale:** defensive parsing 保持 atlas 對 schema 演進的韌性；manifest drift 是 atlas 能提供而 CLI 做不到的核心價值（跨 project 同時看 declared-vs-actual）。

## Risks / Trade-offs

- **Risk: symlink expected source 推論錯誤** → `scan_symlinks` 假設 `~/.claude/<name>` 應 symlink 到 `~/dotfiles/claude/<name>`；若使用者有自訂命名會被標 unmanaged。**Mitigation**：unmanaged 不是錯誤狀態，是中性訊號，符合實際語義。
- **Risk: skill-usage.log 被使用者手動清掉** → `list_plugins` 的 `triggerCount7d` 失真。**Mitigation**：以 `deadStatus` 另存寬容計算（30 天），並在 UI 上標註「根據 skill-usage.log 推算」。
- **Risk: project root 掃描範圍太廣** → `scan_projects` 預設 `~/*/` 但若使用者把 repo 放 `~/dev/` 會漏。**Mitigation**：`roots: Vec<String>` 參數 + 設定 UI（Phase 1 先 hardcode `["~"]`，Phase 2 加 preferences）。
- **Trade-off: 單一 capability 過於粗顆粒** → 未來 mutation 加進來若只涉及某一 requirement，change proposal 會動到整個 capability 的 spec。**Accept**：Spectra 的 delta 機制本來就是 partial update，實務不痛；若真痛到臨界再拆。
- **Risk: dispatch.yaml schema 在 dotfiles 側演進但 atlas 沒跟上** → 新欄位出現時 atlas 降級顯示，不 crash。**Mitigation**：defensive parsing + dotfiles 側 schema 變動時以 `add-config-observability` 或後續 change 同步更新 atlas struct。
- **Risk: manifest 宣告的 skill/agent 跨 tier（global vs project-local）定義衝突** → manifest drift 可能 false-positive（如 skill 宣告在 project 但實際 symlink 在 global）。**Mitigation**：manifest drift 判定採三階段 lookup (project → global whitelist → not-found)；前兩階段視為 satisfied。

## Migration Plan

不適用 — 首個 capability，無既存使用者配置需要遷移。實作落地後：

1. 合併 change 前需 `spectra validate add-config-observability` 通過
2. 合併後 archive change 到 `openspec/changes/archive/`
3. 後續 feature 以新 change proposal 針對 `config-observability` 寫 delta

## Open Questions

- **project roots 掃描策略** — Phase 1 用 `~/*/` 還是需要 config 檔？**暫定**：`scan_projects(roots: Vec<String>)` 介面先寫好，預設參數由 TS 側傳 `["~"]`，Phase 2 再做設定 UI。
- **Overview tab 的彙總口徑** — drift 總數加總，還是分類顯示？**暫定**：分類（broken / drifted / unmanaged / dead plugin / over-budget memory），不加總避免跨類別可比性問題。
- **unmanaged 是否應計入 drift summary** — 它不是錯誤。**暫定**：不計入，只在 Symlinks tab 列出。
