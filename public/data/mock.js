// Mock data aligned with src/types.ts — same camelCase field names
// so wiring to real Tauri commands later is a drop-in replacement.

window.MOCK = (() => {
  const now = new Date();
  const isoAgo = (mins) => new Date(now.getTime() - mins * 60_000).toISOString();

  // --- Symlinks (20) -----------------------------------------------------
  const symlinks = [
    { linkPath: '~/.claude/settings.json', target: '/Users/eric/dotfiles/claude/settings.json', expectedSource: '/Users/eric/dotfiles/claude/settings.json', state: 'ok' },
    { linkPath: '~/.claude/CLAUDE.md', target: '/Users/eric/dotfiles/claude/CLAUDE.md', expectedSource: '/Users/eric/dotfiles/claude/CLAUDE.md', state: 'ok' },
    { linkPath: '~/.claude/rules', target: '/Users/eric/dotfiles/claude/rules', expectedSource: '/Users/eric/dotfiles/claude/rules', state: 'ok' },
    { linkPath: '~/.claude/skills', target: '/Users/eric/dotfiles/claude/skills', expectedSource: '/Users/eric/dotfiles/claude/skills', state: 'ok' },
    { linkPath: '~/.claude/agents', target: '/Users/eric/dotfiles/claude/agents', expectedSource: '/Users/eric/dotfiles/claude/agents', state: 'ok' },
    { linkPath: '~/.claude/hooks', target: '/Users/eric/dotfiles/claude/hooks', expectedSource: '/Users/eric/dotfiles/claude/hooks', state: 'ok' },
    { linkPath: '~/.claude/statusline-command.sh', target: '/Users/eric/dotfiles/claude/statusline-command.sh', expectedSource: '/Users/eric/dotfiles/claude/statusline-command.sh', state: 'ok' },
    { linkPath: '~/.claude/plugins-manifest.json', target: '/Users/eric/dotfiles/claude/plugins-manifest.json', expectedSource: '/Users/eric/dotfiles/claude/plugins-manifest.json', state: 'ok' },
    { linkPath: '~/.claude/references', target: '/Users/eric/dotfiles/claude/references', expectedSource: '/Users/eric/dotfiles/claude/references', state: 'ok' },
    { linkPath: '~/.claude/scripts', target: '/Users/eric/dotfiles/claude/scripts', expectedSource: '/Users/eric/dotfiles/claude/scripts', state: 'ok' },
    { linkPath: '~/.claude/docs', target: '/Users/eric/dotfiles/claude/docs', expectedSource: '/Users/eric/dotfiles/claude/docs', state: 'ok' },

    // drifted — file exists but isn't a symlink, diverged from source
    { linkPath: '~/.claude/hookify.warn-ts-any.local.md', target: '/Users/eric/.claude/hookify.warn-ts-any.local.md', expectedSource: '/Users/eric/dotfiles/claude/hookify.warn-ts-any.local.md', state: 'drifted' },
    { linkPath: '~/.claude/hookify.block-eval-exec.local.md', target: '/Users/eric/.claude/hookify.block-eval-exec.local.md', expectedSource: '/Users/eric/dotfiles/claude/hookify.block-eval-exec.local.md', state: 'drifted' },
    { linkPath: '~/.claude/hookify.warn-mutation.local.md', target: '/Users/eric/.claude/hookify.warn-mutation.local.md', expectedSource: '/Users/eric/dotfiles/claude/hookify.warn-mutation.local.md', state: 'drifted' },

    // broken — symlink points at something that no longer exists
    { linkPath: '~/.claude/homunculus', target: null, expectedSource: '/Users/eric/dotfiles/claude/homunculus', state: 'broken' },
    { linkPath: '~/.claude/learning-notes', target: null, expectedSource: '/Users/eric/dotfiles/claude/learning-notes', state: 'broken' },

    // unmanaged — local-only, no dotfiles source
    { linkPath: '~/.claude/memory', target: '/Users/eric/.claude/memory', expectedSource: null, state: 'unmanaged' },
    { linkPath: '~/.claude/hookify.warn-sensitive-files.local.md', target: '/Users/eric/.claude/hookify.warn-sensitive-files.local.md', expectedSource: null, state: 'unmanaged' },
    { linkPath: '~/.claude/hookify.warn-todo-fixme.local.md', target: '/Users/eric/.claude/hookify.warn-todo-fixme.local.md', expectedSource: null, state: 'unmanaged' },
    { linkPath: '~/.claude/skill-usage.log', target: '/Users/eric/.claude/skill-usage.log', expectedSource: null, state: 'unmanaged' },
  ];

  // --- Projects (15) -----------------------------------------------------
  const projects = [
    { path: '/Users/eric/dotfiles', name: 'dotfiles', hasClaudeDir: true, hasClaudeMd: true, skills: ['agent-browser', 'claude-skill', 'ts-hygiene', 'commit-discipline', 'spectra-change'], agents: ['reviewer', 'researcher', 'test-runner'], memoryLines: 412 },
    { path: '/Users/eric/vibe-vibe', name: 'vibe-vibe', hasClaudeDir: true, hasClaudeMd: true, skills: ['react-patterns', 'tailwind-audit'], agents: ['reviewer'], memoryLines: 287 },
    { path: '/Users/eric/financial-services', name: 'financial-services', hasClaudeDir: true, hasClaudeMd: true, skills: ['agent-browser', 'db-migration', 'pii-scrub', 'audit-log'], agents: ['reviewer', 'test-runner', 'sec-auditor'], memoryLines: 523 },
    { path: '/Users/eric/claude-atlas', name: 'claude-atlas', hasClaudeDir: true, hasClaudeMd: true, skills: ['tauri-commands', 'react-patterns'], agents: ['reviewer'], memoryLines: 94 },
    { path: '/Users/eric/ccusage-tracker', name: 'ccusage-tracker', hasClaudeDir: true, hasClaudeMd: true, skills: ['react-patterns'], agents: [], memoryLines: 142 },
    { path: '/Users/eric/frontstage', name: 'frontstage', hasClaudeDir: true, hasClaudeMd: true, skills: ['react-patterns', 'tailwind-audit', 'a11y-check'], agents: ['reviewer'], memoryLines: 201 },
    { path: '/Users/eric/notion-auto', name: 'notion-auto', hasClaudeDir: true, hasClaudeMd: false, skills: ['agent-browser'], agents: [], memoryLines: 58 },
    { path: '/Users/eric/obsidian-data', name: 'obsidian-data', hasClaudeDir: false, hasClaudeMd: true, skills: [], agents: [], memoryLines: 31 },
    { path: '/Users/eric/1111-maid', name: '1111-maid', hasClaudeDir: true, hasClaudeMd: false, skills: ['react-patterns'], agents: ['reviewer'], memoryLines: null },
    { path: '/Users/eric/spectra', name: 'spectra', hasClaudeDir: true, hasClaudeMd: true, skills: ['spectra-change', 'ts-hygiene', 'commit-discipline'], agents: ['reviewer', 'researcher'], memoryLines: 178 },
    { path: '/Users/eric/homunculus', name: 'homunculus', hasClaudeDir: true, hasClaudeMd: true, skills: ['ts-hygiene'], agents: [], memoryLines: 64 },
    { path: '/Users/eric/experiments/langchain-poc', name: 'langchain-poc', hasClaudeDir: false, hasClaudeMd: false, skills: [], agents: [], memoryLines: null },
    { path: '/Users/eric/experiments/rag-sandbox', name: 'rag-sandbox', hasClaudeDir: true, hasClaudeMd: false, skills: ['agent-browser'], agents: [], memoryLines: 12 },
    { path: '/Users/eric/archive/legacy-api', name: 'legacy-api', hasClaudeDir: false, hasClaudeMd: true, skills: [], agents: [], memoryLines: 8 },
    { path: '/Users/eric/archive/old-dashboard', name: 'old-dashboard', hasClaudeDir: false, hasClaudeMd: false, skills: [], agents: [], memoryLines: null },
  ];

  // --- Plugins (30) ------------------------------------------------------
  const plugins = [
    { name: 'mgrep@Mixedbread-Grep', enabled: true, lastTriggeredAt: isoAgo(14), triggerCount7d: 87, deadStatus: 'active' },
    { name: 'agent-browser@Official', enabled: true, lastTriggeredAt: isoAgo(52), triggerCount7d: 42, deadStatus: 'active' },
    { name: 'ts-hygiene@Eric', enabled: true, lastTriggeredAt: isoAgo(8), triggerCount7d: 124, deadStatus: 'active' },
    { name: 'commit-discipline@Eric', enabled: true, lastTriggeredAt: isoAgo(180), triggerCount7d: 33, deadStatus: 'active' },
    { name: 'claude-skill@Official', enabled: true, lastTriggeredAt: isoAgo(240), triggerCount7d: 18, deadStatus: 'active' },
    { name: 'spectra-change@Eric', enabled: true, lastTriggeredAt: isoAgo(600), triggerCount7d: 12, deadStatus: 'active' },
    { name: 'react-patterns@Eric', enabled: true, lastTriggeredAt: isoAgo(45), triggerCount7d: 56, deadStatus: 'active' },
    { name: 'tailwind-audit@Eric', enabled: true, lastTriggeredAt: isoAgo(360), triggerCount7d: 9, deadStatus: 'active' },
    { name: 'a11y-check@Official', enabled: true, lastTriggeredAt: isoAgo(720), triggerCount7d: 4, deadStatus: 'active' },
    { name: 'pii-scrub@Eric', enabled: true, lastTriggeredAt: isoAgo(1100), triggerCount7d: 6, deadStatus: 'active' },
    { name: 'db-migration@Eric', enabled: true, lastTriggeredAt: isoAgo(2300), triggerCount7d: 3, deadStatus: 'active' },
    { name: 'audit-log@Eric', enabled: true, lastTriggeredAt: isoAgo(4200), triggerCount7d: 2, deadStatus: 'quiet' },
    { name: 'sec-auditor@Eric', enabled: true, lastTriggeredAt: isoAgo(6100), triggerCount7d: 1, deadStatus: 'quiet' },
    { name: 'tauri-commands@Eric', enabled: true, lastTriggeredAt: isoAgo(820), triggerCount7d: 11, deadStatus: 'active' },
    { name: 'rust-clippy@Official', enabled: true, lastTriggeredAt: isoAgo(3400), triggerCount7d: 2, deadStatus: 'quiet' },
    { name: 'image-optim@Community', enabled: true, lastTriggeredAt: isoAgo(8400), triggerCount7d: 1, deadStatus: 'quiet' },
    { name: 'regex-explain@Community', enabled: true, lastTriggeredAt: isoAgo(12000), triggerCount7d: 0, deadStatus: 'dead' },
    { name: 'sql-lint@Community', enabled: true, lastTriggeredAt: isoAgo(18000), triggerCount7d: 0, deadStatus: 'dead' },
    { name: 'yaml-schema@Community', enabled: true, lastTriggeredAt: isoAgo(22000), triggerCount7d: 0, deadStatus: 'dead' },
    { name: 'dockerfile-lint@Community', enabled: true, lastTriggeredAt: isoAgo(28000), triggerCount7d: 0, deadStatus: 'dead' },
    { name: 'graphql-audit@Community', enabled: true, lastTriggeredAt: isoAgo(32000), triggerCount7d: 0, deadStatus: 'dead' },
    { name: 'k8s-manifest@Community', enabled: true, lastTriggeredAt: null, triggerCount7d: 0, deadStatus: 'dead' },
    { name: 'terraform-fmt@Community', enabled: true, lastTriggeredAt: null, triggerCount7d: 0, deadStatus: 'dead' },
    { name: 'ansible-lint@Community', enabled: true, lastTriggeredAt: null, triggerCount7d: 0, deadStatus: 'dead' },
    { name: 'helm-values@Community', enabled: false, lastTriggeredAt: null, triggerCount7d: 0, deadStatus: 'dead' },
    { name: 'protobuf-check@Community', enabled: false, lastTriggeredAt: null, triggerCount7d: 0, deadStatus: 'dead' },
    { name: 'openapi-diff@Community', enabled: true, lastTriggeredAt: isoAgo(5200), triggerCount7d: 1, deadStatus: 'quiet' },
    { name: 'shell-safety@Eric', enabled: true, lastTriggeredAt: isoAgo(300), triggerCount7d: 22, deadStatus: 'active' },
    { name: 'md-toc@Community', enabled: true, lastTriggeredAt: isoAgo(1800), triggerCount7d: 4, deadStatus: 'active' },
    { name: 'json-pretty@Community', enabled: true, lastTriggeredAt: isoAgo(90), triggerCount7d: 15, deadStatus: 'active' },
  ];

  // --- MCP Servers (6) ---------------------------------------------------
  const mcpServers = [
    { name: 'filesystem', scope: 'global', enabled: true },
    { name: 'github', scope: 'global', enabled: true },
    { name: 'postgres', scope: 'project', projectPath: '/Users/eric/financial-services', enabled: true },
    { name: 'puppeteer', scope: 'global', enabled: false },
    { name: 'linear', scope: 'project', projectPath: '/Users/eric/spectra', enabled: true },
    { name: 'notion', scope: 'project', projectPath: '/Users/eric/notion-auto', enabled: true },
  ];

  // --- Context Budget ----------------------------------------------------
  const contextBudget = {
    alwaysOnRuleBytes: 142_840,
    globalSkillCount: 8,
    catalogSkillCount: 24,
    memoryTotalLines: 2_423,
  };

  // Breakdown detail for Context tab (extension beyond the base struct)
  const contextBreakdown = {
    rules: [
      { path: '~/.claude/rules/common/core.md', bytes: 38_240, tokensEst: 9_560 },
      { path: '~/.claude/rules/common/ts.md', bytes: 24_100, tokensEst: 6_025 },
      { path: '~/.claude/rules/common/react.md', bytes: 28_940, tokensEst: 7_235 },
      { path: '~/.claude/rules/common/git.md', bytes: 18_620, tokensEst: 4_655 },
      { path: '~/.claude/rules/common/shell.md', bytes: 14_480, tokensEst: 3_620 },
      { path: '~/.claude/rules/common/writing.md', bytes: 18_460, tokensEst: 4_615 },
    ],
    globalSkills: [
      { name: 'agent-browser', bytes: 5_049 },
      { name: 'claude-skill', bytes: 3_820 },
      { name: 'ts-hygiene', bytes: 4_210 },
      { name: 'commit-discipline', bytes: 2_980 },
      { name: 'react-patterns', bytes: 6_130 },
      { name: 'spectra-change', bytes: 4_440 },
      { name: 'shell-safety', bytes: 2_160 },
      { name: 'pii-scrub', bytes: 3_300 },
    ],
    memory: [
      { project: 'financial-services', path: '~/.claude/projects/financial-services/memory/MEMORY.md', lines: 523, overBudget: true },
      { project: 'dotfiles', path: '~/.claude/projects/dotfiles/memory/MEMORY.md', lines: 412, overBudget: true },
      { project: 'vibe-vibe', path: '~/.claude/projects/vibe-vibe/memory/MEMORY.md', lines: 287, overBudget: true },
      { project: 'frontstage', path: '~/.claude/projects/frontstage/memory/MEMORY.md', lines: 201, overBudget: true },
      { project: 'spectra', path: '~/.claude/projects/spectra/memory/MEMORY.md', lines: 178, overBudget: false },
      { project: 'ccusage-tracker', path: '~/.claude/projects/ccusage-tracker/memory/MEMORY.md', lines: 142, overBudget: false },
      { project: 'claude-atlas', path: '~/.claude/projects/claude-atlas/memory/MEMORY.md', lines: 94, overBudget: false },
      { project: 'homunculus', path: '~/.claude/projects/homunculus/memory/MEMORY.md', lines: 64, overBudget: false },
      { project: 'notion-auto', path: '~/.claude/projects/notion-auto/memory/MEMORY.md', lines: 58, overBudget: false },
      { project: 'obsidian-data', path: '~/.claude/projects/obsidian-data/memory/MEMORY.md', lines: 31, overBudget: false },
    ],
  };

  // --- Drift summary -----------------------------------------------------
  const driftSummary = {
    symlinkBroken: symlinks.filter(s => s.state === 'broken').length,
    symlinkDrifted: symlinks.filter(s => s.state === 'drifted').length,
    symlinkUnmanaged: symlinks.filter(s => s.state === 'unmanaged').length,
    pluginsDead: plugins.filter(p => p.deadStatus === 'dead').length,
    memoryOverBudget: contextBreakdown.memory.filter(m => m.overBudget).length,
  };

  // --- Recent drift stream (synthetic 7d) --------------------------------
  const recentDrift = [
    { at: isoAgo(12), artifact: '~/.claude/homunculus', kind: 'symlink', from: 'ok', to: 'broken', note: 'dotfiles source removed' },
    { at: isoAgo(180), artifact: '~/.claude/hookify.warn-ts-any.local.md', kind: 'symlink', from: 'ok', to: 'drifted', note: 'local edit diverged from source' },
    { at: isoAgo(640), artifact: 'MEMORY.md · financial-services', kind: 'memory', from: '498 lines', to: '523 lines', note: 'crossed 500-line threshold' },
    { at: isoAgo(1440), artifact: 'regex-explain@Community', kind: 'plugin', from: 'quiet', to: 'dead', note: 'no triggers in 30d' },
    { at: isoAgo(2880), artifact: '~/.claude/learning-notes', kind: 'symlink', from: 'ok', to: 'broken', note: 'dotfiles source removed' },
    { at: isoAgo(4320), artifact: 'sql-lint@Community', kind: 'plugin', from: 'quiet', to: 'dead', note: 'no triggers in 30d' },
    { at: isoAgo(6000), artifact: 'MEMORY.md · frontstage', kind: 'memory', from: '195 lines', to: '201 lines', note: 'crossed 200-line threshold' },
  ];

  const lastScanAt = isoAgo(2);

  return {
    now: now.toISOString(),
    lastScanAt,
    symlinks,
    projects,
    plugins,
    mcpServers,
    contextBudget,
    contextBreakdown,
    driftSummary,
    recentDrift,
  };
})();
