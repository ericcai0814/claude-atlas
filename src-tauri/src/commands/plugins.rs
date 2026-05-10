use chrono::{Duration, Local, NaiveDateTime, TimeZone};
use serde::Serialize;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct McpServer {
    pub name: String,
    pub scope: &'static str, // "global" | "project"
    pub project_path: Option<String>,
    pub server_type: Option<String>,
    pub command: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Plugin {
    pub name: String,
    pub enabled: bool,
    pub last_triggered_at: Option<String>,
    pub trigger_count7d: u32,
    pub dead_status: &'static str, // "active" | "quiet" | "dead" | "disabled"
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

fn plugin_key(plugin_name: &str) -> &str {
    plugin_name.split('@').next().unwrap_or(plugin_name)
}

fn skill_namespace(skill_name: &str) -> &str {
    skill_name.split(':').next().unwrap_or(skill_name)
}

/// Parse one usage log line: "YYYY-MM-DD HH:MM:SS user skill-name ..."
fn parse_log_line(line: &str) -> Option<(NaiveDateTime, String)> {
    let mut parts = line.splitn(5, ' ');
    let date = parts.next()?;
    let time = parts.next()?;
    let _user = parts.next()?;
    let skill = parts.next()?;
    let dt_str = format!("{} {}", date, time);
    let dt = NaiveDateTime::parse_from_str(&dt_str, "%Y-%m-%d %H:%M:%S").ok()?;
    Some((dt, skill.to_string()))
}

#[derive(Default)]
struct SkillStats {
    count_7d: u32,
    count_30d: u32,
    last_trigger: Option<NaiveDateTime>,
}

#[tauri::command]
pub fn list_plugins(
    settings_path: String,
    usage_log_path: String,
) -> Result<Vec<Plugin>, String> {
    let settings_file = expand_tilde(&settings_path);
    let log_file = expand_tilde(&usage_log_path);

    let settings_raw = fs::read_to_string(&settings_file)
        .map_err(|e| format!("read {}: {}", settings_file.display(), e))?;
    let settings: serde_json::Value = serde_json::from_str(&settings_raw)
        .map_err(|e| format!("parse settings.json: {}", e))?;

    let enabled_map: HashMap<String, bool> = settings
        .get("enabledPlugins")
        .and_then(|v| v.as_object())
        .map(|obj| {
            obj.iter()
                .filter_map(|(k, v)| v.as_bool().map(|b| (k.clone(), b)))
                .collect()
        })
        .unwrap_or_default();

    let now = Local::now().naive_local();
    let cutoff_7d = now - Duration::days(7);
    let cutoff_30d = now - Duration::days(30);

    let mut stats_by_ns: HashMap<String, SkillStats> = HashMap::new();
    if let Ok(log_raw) = fs::read_to_string(&log_file) {
        for line in log_raw.lines() {
            let Some((ts, skill)) = parse_log_line(line) else { continue };
            let ns = skill_namespace(&skill).to_string();
            let entry = stats_by_ns.entry(ns).or_default();
            if ts >= cutoff_30d {
                entry.count_30d += 1;
            }
            if ts >= cutoff_7d {
                entry.count_7d += 1;
            }
            if entry.last_trigger.map_or(true, |cur| ts > cur) {
                entry.last_trigger = Some(ts);
            }
        }
    }

    let mut plugins: Vec<Plugin> = enabled_map
        .into_iter()
        .map(|(name, enabled)| {
            let key = plugin_key(&name);
            let stats = stats_by_ns.get(key);
            let count_7d = stats.map(|s| s.count_7d).unwrap_or(0);
            let count_30d = stats.map(|s| s.count_30d).unwrap_or(0);
            let last_triggered_at = stats.and_then(|s| s.last_trigger).and_then(|dt| {
                Local.from_local_datetime(&dt).single().map(|d| d.to_rfc3339())
            });
            let dead_status = if !enabled {
                "disabled"
            } else if count_30d >= 3 {
                "active"
            } else if count_30d >= 1 {
                "quiet"
            } else {
                "dead"
            };
            Plugin {
                name,
                enabled,
                last_triggered_at,
                trigger_count7d: count_7d,
                dead_status,
            }
        })
        .collect();

    plugins.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(plugins)
}

fn extract_mcp(
    value: &serde_json::Value,
    scope: &'static str,
    project_path: Option<String>,
) -> Vec<McpServer> {
    let Some(map) = value.as_object() else { return Vec::new() };
    map.iter()
        .map(|(name, cfg)| McpServer {
            name: name.clone(),
            scope,
            project_path: project_path.clone(),
            server_type: cfg.get("type").and_then(|v| v.as_str()).map(|s| s.to_string()),
            command: cfg.get("command").and_then(|v| v.as_str()).map(|s| s.to_string()),
        })
        .collect()
}

#[tauri::command]
pub fn list_mcp(claude_json_path: String) -> Result<Vec<McpServer>, String> {
    let path = expand_tilde(&claude_json_path);
    let raw = fs::read_to_string(&path)
        .map_err(|e| format!("read {}: {}", path.display(), e))?;
    let root: serde_json::Value =
        serde_json::from_str(&raw).map_err(|e| format!("parse .claude.json: {}", e))?;

    let mut servers = Vec::new();
    if let Some(global) = root.get("mcpServers") {
        servers.extend(extract_mcp(global, "global", None));
    }
    if let Some(projects) = root.get("projects").and_then(|v| v.as_object()) {
        for (proj_path, proj_cfg) in projects.iter() {
            if let Some(mcp) = proj_cfg.get("mcpServers") {
                servers.extend(extract_mcp(mcp, "project", Some(proj_path.clone())));
            }
        }
    }
    servers.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(servers)
}
