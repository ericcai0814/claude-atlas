use serde::Serialize;
use std::collections::BTreeSet;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub path: String,
    pub name: String,
    pub has_claude_dir: bool,
    pub has_claude_md: bool,
    pub skills: Vec<String>,
    pub agents: Vec<String>,
    pub memory_lines: Option<usize>,
    pub manifest: Option<DispatchManifest>,
    pub manifest_drift: Option<Vec<ManifestDriftEntry>>,
    pub manifest_parse_error: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DispatchManifest {
    pub skills_include: Vec<String>,
    pub skills_exclude: Vec<String>,
    pub agents: Vec<String>,
    pub plugins_include: Vec<String>,
    pub plugins_exclude: Vec<String>,
    pub mcp_servers: Vec<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ManifestDriftEntry {
    pub category: &'static str, // "skill" | "agent" | "plugin" | "mcp"
    pub name: String,
    pub state: &'static str, // "satisfied" | "missing" | "excess"
    pub resolved_tier: Option<&'static str>, // "project" | "global-whitelist" | "dotfiles-source"
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

fn slug_from_path(p: &Path) -> String {
    let s = p.to_string_lossy();
    let trimmed = s.trim_start_matches('/');
    format!("-{}", trimmed.replace('/', "-"))
}

fn count_lines(path: &Path) -> Option<usize> {
    fs::read_to_string(path).ok().map(|s| s.lines().count())
}

fn list_basenames(dir: &Path, suffix: Option<&str>, is_dir: bool) -> Vec<String> {
    let Ok(rd) = fs::read_dir(dir) else { return Vec::new() };
    let mut out: Vec<String> = rd
        .filter_map(|e| e.ok())
        .filter_map(|e| {
            let name = e.file_name().to_string_lossy().to_string();
            if name.starts_with('.') {
                return None;
            }
            let meta = e.metadata().ok()?;
            if is_dir && !meta.is_dir() {
                return None;
            }
            if !is_dir && !meta.is_file() {
                return None;
            }
            match suffix {
                Some(ext) => name.strip_suffix(ext).map(|s| s.to_string()),
                None => Some(name),
            }
        })
        .collect();
    out.sort();
    out
}

fn read_whitelist(whitelist_path: &Path) -> BTreeSet<String> {
    let Ok(contents) = fs::read_to_string(whitelist_path) else {
        return BTreeSet::new();
    };
    contents
        .lines()
        .map(|l| l.trim())
        .filter(|l| !l.is_empty() && !l.starts_with('#'))
        .map(|l| l.to_string())
        .collect()
}

fn parse_manifest(yaml_path: &Path) -> Result<DispatchManifest, String> {
    let raw = fs::read_to_string(yaml_path).map_err(|e| format!("read: {}", e))?;
    let value: serde_yaml::Value =
        serde_yaml::from_str(&raw).map_err(|e| format!("yaml: {}", e))?;

    let extract_list = |root: &serde_yaml::Value, key: &str| -> Vec<String> {
        root.get(key)
            .and_then(|v| v.as_sequence())
            .map(|seq| {
                seq.iter()
                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                    .collect()
            })
            .unwrap_or_default()
    };
    let nested_list = |root: &serde_yaml::Value, outer: &str, inner: &str| -> Vec<String> {
        root.get(outer)
            .and_then(|v| v.get(inner))
            .and_then(|v| v.as_sequence())
            .map(|seq| {
                seq.iter()
                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                    .collect()
            })
            .unwrap_or_default()
    };

    Ok(DispatchManifest {
        skills_include: nested_list(&value, "skills", "include"),
        skills_exclude: nested_list(&value, "skills", "exclude"),
        agents: extract_list(&value, "agents"),
        plugins_include: nested_list(&value, "plugins", "include"),
        plugins_exclude: nested_list(&value, "plugins", "exclude"),
        mcp_servers: nested_list(&value, "mcp", "servers"),
    })
}

fn lookup_tier(
    name: &str,
    project_set: &BTreeSet<String>,
    global_whitelist: &BTreeSet<String>,
    dotfiles_set: &BTreeSet<String>,
) -> Option<&'static str> {
    if project_set.contains(name) {
        Some("project")
    } else if global_whitelist.contains(name) {
        Some("global-whitelist")
    } else if dotfiles_set.contains(name) {
        Some("dotfiles-source")
    } else {
        None
    }
}

fn compute_manifest_drift(
    manifest: &DispatchManifest,
    project_skills: &[String],
    project_agents: &[String],
    global_skills_whitelist: &BTreeSet<String>,
    dotfiles_skills: &BTreeSet<String>,
    dotfiles_agents: &BTreeSet<String>,
) -> Vec<ManifestDriftEntry> {
    let mut out = Vec::new();
    let proj_skill_set: BTreeSet<String> = project_skills.iter().cloned().collect();
    let proj_agent_set: BTreeSet<String> = project_agents.iter().cloned().collect();
    let empty: BTreeSet<String> = BTreeSet::new();

    for name in &manifest.skills_include {
        let tier = lookup_tier(name, &proj_skill_set, global_skills_whitelist, dotfiles_skills);
        out.push(ManifestDriftEntry {
            category: "skill",
            name: name.clone(),
            state: if tier.is_some() { "satisfied" } else { "missing" },
            resolved_tier: tier,
        });
    }
    for name in &manifest.agents {
        let tier = lookup_tier(name, &proj_agent_set, &empty, dotfiles_agents);
        out.push(ManifestDriftEntry {
            category: "agent",
            name: name.clone(),
            state: if tier.is_some() { "satisfied" } else { "missing" },
            resolved_tier: tier,
        });
    }

    let declared_skills: BTreeSet<String> = manifest.skills_include.iter().cloned().collect();
    for actual in project_skills {
        if !declared_skills.contains(actual) && !global_skills_whitelist.contains(actual) {
            out.push(ManifestDriftEntry {
                category: "skill",
                name: actual.clone(),
                state: "excess",
                resolved_tier: Some("project"),
            });
        }
    }

    out
}

#[tauri::command]
pub fn scan_projects(
    roots: Vec<String>,
    dotfiles_claude: Option<String>,
    global_whitelist: Option<String>,
) -> Result<Vec<Project>, String> {
    let home = std::env::var("HOME").unwrap_or_default();
    let dotfiles = dotfiles_claude
        .map(|s| expand_tilde(&s))
        .unwrap_or_else(|| PathBuf::from(&home).join("dotfiles").join("claude"));
    let whitelist_path = global_whitelist
        .map(|s| expand_tilde(&s))
        .unwrap_or_else(|| dotfiles.join("skills").join(".global-whitelist"));

    let dotfiles_skills: BTreeSet<String> = list_basenames(&dotfiles.join("skills"), None, true)
        .into_iter()
        .collect();
    let dotfiles_agents: BTreeSet<String> =
        list_basenames(&dotfiles.join("agents"), Some(".md"), false)
            .into_iter()
            .collect();
    let global_whitelist_set = read_whitelist(&whitelist_path);

    let memory_root = PathBuf::from(&home).join(".claude").join("projects");
    let mut projects = Vec::new();
    let mut seen: BTreeSet<PathBuf> = BTreeSet::new();

    for root in &roots {
        let root_path = expand_tilde(root);
        let Ok(rd) = fs::read_dir(&root_path) else { continue };
        for entry in rd.flatten() {
            let path = entry.path();
            if !entry.metadata().map(|m| m.is_dir()).unwrap_or(false) {
                continue;
            }
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with('.') {
                continue;
            }

            let claude_dir = path.join(".claude");
            let claude_md = path.join("CLAUDE.md");
            let has_claude_dir = claude_dir.is_dir();
            let has_claude_md = claude_md.is_file();
            if !has_claude_dir && !has_claude_md {
                continue;
            }
            let canonical = fs::canonicalize(&path).unwrap_or_else(|_| path.clone());
            if !seen.insert(canonical.clone()) {
                continue;
            }

            let skills = if has_claude_dir {
                list_basenames(&claude_dir.join("skills"), None, true)
            } else {
                Vec::new()
            };
            let agents = if has_claude_dir {
                list_basenames(&claude_dir.join("agents"), Some(".md"), false)
            } else {
                Vec::new()
            };

            let slug = slug_from_path(&canonical);
            let memory_path = memory_root.join(&slug).join("memory").join("MEMORY.md");
            let memory_lines = count_lines(&memory_path);

            let mut manifest: Option<DispatchManifest> = None;
            let mut manifest_drift: Option<Vec<ManifestDriftEntry>> = None;
            let mut manifest_parse_error: Option<String> = None;
            let dispatch_path = claude_dir.join("dispatch.yaml");
            if dispatch_path.is_file() {
                match parse_manifest(&dispatch_path) {
                    Ok(m) => {
                        let drift = compute_manifest_drift(
                            &m,
                            &skills,
                            &agents,
                            &global_whitelist_set,
                            &dotfiles_skills,
                            &dotfiles_agents,
                        );
                        manifest = Some(m);
                        manifest_drift = Some(drift);
                    }
                    Err(e) => {
                        manifest_parse_error = Some(e);
                    }
                }
            }

            projects.push(Project {
                path: canonical.to_string_lossy().to_string(),
                name,
                has_claude_dir,
                has_claude_md,
                skills,
                agents,
                memory_lines,
                manifest,
                manifest_drift,
                manifest_parse_error,
            });
        }
    }

    projects.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(projects)
}
