// Data model mirrors src-tauri/src/commands/*.rs structs.
// Keep field names in camelCase (serde rename_all = "camelCase").

export type SymlinkState = "ok" | "broken" | "drifted" | "unmanaged";

export interface SymlinkEntry {
  linkPath: string;
  target: string | null;
  expectedSource: string | null;
  state: SymlinkState;
}

// Scaffolds — implemented in later vertical slices.
export interface Project {
  path: string;
  name: string;
  hasClaudeDir: boolean;
  hasClaudeMd: boolean;
  skills: string[];
  agents: string[];
  memoryLines: number | null;
}

export interface Plugin {
  name: string;
  enabled: boolean;
  lastTriggeredAt: string | null;
  triggerCount7d: number;
  deadStatus: "active" | "quiet" | "dead";
}

export interface McpServer {
  name: string;
  scope: "global" | "project";
  projectPath?: string;
  enabled: boolean;
}

export interface ContextBudget {
  alwaysOnRuleBytes: number;
  globalSkillCount: number;
  catalogSkillCount: number;
  memoryTotalLines: number;
}

export interface DriftSummary {
  symlinkBroken: number;
  symlinkDrifted: number;
  pluginsDead: number;
  memoryOverBudget: number;
}
