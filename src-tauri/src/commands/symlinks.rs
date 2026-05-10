use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SymlinkEntry {
    pub link_path: String,
    pub target: Option<String>,
    pub expected_source: Option<String>,
    pub state: &'static str, // "ok" | "broken" | "drifted" | "unmanaged"
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

/// Noise directories under ~/.claude that aren't user-managed symlinks.
fn is_noise(name: &str) -> bool {
    matches!(
        name,
        "projects" | "todos" | "shell-snapshots" | "statsig" | "ide" | "__store.db"
    ) || name.starts_with('.')
}

fn severity_rank(state: &str) -> u8 {
    match state {
        "broken" => 0,
        "drifted" => 1,
        "unmanaged" => 2,
        _ => 3,
    }
}

#[tauri::command]
pub fn scan_symlinks(
    claude_dir: String,
    dotfiles_source: String,
) -> Result<Vec<SymlinkEntry>, String> {
    let claude = expand_tilde(&claude_dir);
    let source = expand_tilde(&dotfiles_source);

    let dir = fs::read_dir(&claude)
        .map_err(|e| format!("read_dir {}: {}", claude.display(), e))?;

    let mut entries = Vec::new();

    for entry in dir {
        let entry = entry.map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().to_string();
        if is_noise(&name) {
            continue;
        }

        let path = entry.path();
        let expected = source.join(&name);
        let expected_exists = expected.exists();
        let expected_source = if expected_exists {
            Some(expected.to_string_lossy().to_string())
        } else {
            None
        };

        let is_symlink = fs::symlink_metadata(&path)
            .map(|m| m.file_type().is_symlink())
            .unwrap_or(false);

        let (target, state) = classify(&path, is_symlink, &expected, expected_exists);

        entries.push(SymlinkEntry {
            link_path: path.to_string_lossy().to_string(),
            target,
            expected_source,
            state,
        });
    }

    entries.sort_by(|a, b| {
        severity_rank(a.state)
            .cmp(&severity_rank(b.state))
            .then_with(|| a.link_path.cmp(&b.link_path))
    });
    Ok(entries)
}

fn classify(
    path: &Path,
    is_symlink: bool,
    expected: &Path,
    expected_exists: bool,
) -> (Option<String>, &'static str) {
    if !is_symlink {
        let t = Some(path.to_string_lossy().to_string());
        return if expected_exists {
            (t, "drifted") // should be a symlink to dotfiles
        } else {
            (t, "unmanaged") // local-only file, no dotfiles counterpart
        };
    }

    let raw_target = match fs::read_link(path) {
        Ok(t) => t,
        Err(_) => return (None, "broken"),
    };

    let resolved = if raw_target.is_absolute() {
        raw_target.clone()
    } else {
        path.parent()
            .map(|p| p.join(&raw_target))
            .unwrap_or_else(|| raw_target.clone())
    };

    let target_str = Some(resolved.to_string_lossy().to_string());

    let canonical = match fs::canonicalize(&resolved) {
        Ok(c) => c,
        Err(_) => return (target_str, "broken"),
    };

    if expected_exists {
        match fs::canonicalize(expected) {
            Ok(exp) if exp == canonical => (Some(canonical.to_string_lossy().to_string()), "ok"),
            _ => (Some(canonical.to_string_lossy().to_string()), "drifted"),
        }
    } else {
        (Some(canonical.to_string_lossy().to_string()), "unmanaged")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn entry(link_path: &str, state: &'static str) -> SymlinkEntry {
        SymlinkEntry {
            link_path: link_path.to_string(),
            target: None,
            expected_source: None,
            state,
        }
    }

    #[test]
    fn sort_severity_then_alpha() {
        let mut entries = vec![
            entry("/a/settings.json", "ok"),
            entry("/a/CLAUDE.md", "broken"),
            entry("/a/hooks", "drifted"),
            entry("/a/agents", "unmanaged"),
        ];
        entries.sort_by(|a, b| {
            severity_rank(a.state)
                .cmp(&severity_rank(b.state))
                .then_with(|| a.link_path.cmp(&b.link_path))
        });
        let order: Vec<&str> = entries.iter().map(|e| e.state).collect();
        assert_eq!(order, vec!["broken", "drifted", "unmanaged", "ok"]);

        let mut tie = vec![
            entry("/z/file", "drifted"),
            entry("/a/file", "drifted"),
        ];
        tie.sort_by(|a, b| {
            severity_rank(a.state)
                .cmp(&severity_rank(b.state))
                .then_with(|| a.link_path.cmp(&b.link_path))
        });
        assert_eq!(tie[0].link_path, "/a/file");
        assert_eq!(tie[1].link_path, "/z/file");
    }
}
