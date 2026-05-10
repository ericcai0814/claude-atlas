use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ContextBudget {
    pub always_on_rule_bytes: u64,
    pub global_skill_count: usize,
    pub catalog_skill_count: usize,
    pub memory_total_lines: usize,
}

fn expand_tilde(s: &str) -> PathBuf {
    match s.strip_prefix("~") {
        Some(rest) => {
            let home = std::env::var("HOME").unwrap_or_default();
            let rest = rest.strip_prefix('/').unwrap_or(rest);
            if rest.is_empty() {
                PathBuf::from(home)
            } else {
                PathBuf::from(home).join(rest)
            }
        }
        None => PathBuf::from(s),
    }
}

fn sum_md_bytes(dir: &Path) -> u64 {
    let Ok(rd) = fs::read_dir(dir) else { return 0 };
    rd.flatten()
        .filter_map(|e| {
            let name = e.file_name().to_string_lossy().to_string();
            if !name.ends_with(".md") || name.starts_with('.') {
                return None;
            }
            e.metadata().ok().map(|m| m.len())
        })
        .sum()
}

fn count_subdirs(dir: &Path) -> usize {
    fs::read_dir(dir)
        .map(|rd| {
            rd.flatten()
                .filter(|e| {
                    let name = e.file_name().to_string_lossy().to_string();
                    !name.starts_with('.')
                        && e.metadata().map(|m| m.is_dir()).unwrap_or(false)
                })
                .count()
        })
        .unwrap_or(0)
}

fn count_whitelist_entries(path: &Path) -> usize {
    fs::read_to_string(path)
        .map(|c| {
            c.lines()
                .filter(|l| {
                    let t = l.trim();
                    !t.is_empty() && !t.starts_with('#')
                })
                .count()
        })
        .unwrap_or(0)
}

fn sum_memory_lines(memory_root: &Path) -> usize {
    // Walk ~/.claude/projects/<slug>/memory/MEMORY.md (or similar)
    let Ok(rd) = fs::read_dir(memory_root) else { return 0 };
    rd.flatten()
        .filter_map(|e| {
            if !e.metadata().ok()?.is_dir() {
                return None;
            }
            let memory_md = e.path().join("memory").join("MEMORY.md");
            fs::read_to_string(&memory_md)
                .ok()
                .map(|c| c.lines().count())
        })
        .sum()
}

#[tauri::command]
pub fn compute_context_budget(
    rules_dir: String,
    skills_dir: String,
    whitelist_path: String,
    memory_dir: String,
) -> Result<ContextBudget, String> {
    let rules = expand_tilde(&rules_dir);
    let skills = expand_tilde(&skills_dir);
    let whitelist = expand_tilde(&whitelist_path);
    let memory = expand_tilde(&memory_dir);

    Ok(ContextBudget {
        always_on_rule_bytes: sum_md_bytes(&rules),
        global_skill_count: count_whitelist_entries(&whitelist),
        catalog_skill_count: count_subdirs(&skills),
        memory_total_lines: sum_memory_lines(&memory),
    })
}
