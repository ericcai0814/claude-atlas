use std::fs;
use std::path::PathBuf;

use super::symlinks::{classify, severity_rank};
pub use super::symlinks::SymlinkEntry as HookEntry;

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

fn is_hook_file(name: &str) -> bool {
    name.ends_with(".sh")
}

#[tauri::command]
pub fn scan_hooks(
    claude_hooks_dir: String,
    dotfiles_hooks_dir: String,
) -> Result<Vec<HookEntry>, String> {
    let claude = expand_tilde(&claude_hooks_dir);
    let dotfiles = expand_tilde(&dotfiles_hooks_dir);

    let dir = fs::read_dir(&claude)
        .map_err(|e| format!("read_dir {}: {}", claude.display(), e))?;

    let mut entries = Vec::new();

    for entry in dir {
        let entry = entry.map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().to_string();
        if !is_hook_file(&name) {
            continue;
        }

        let path = entry.path();
        let expected = dotfiles.join(&name);
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

        entries.push(HookEntry {
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;
    use std::fs;
    use std::os::unix::fs::symlink;
    use std::path::Path;

    struct Fixture {
        claude: PathBuf,
        dotfiles: PathBuf,
        _temp: tempfile::TempDir,
    }

    fn setup() -> Fixture {
        let temp = tempfile::tempdir().expect("tempdir");
        let claude = temp.path().join("claude_hooks");
        let dotfiles = temp.path().join("dotfiles_hooks");
        fs::create_dir_all(&claude).unwrap();
        fs::create_dir_all(&dotfiles).unwrap();
        Fixture { claude, dotfiles, _temp: temp }
    }

    fn states_by_filename(entries: &[HookEntry]) -> HashMap<String, &'static str> {
        entries
            .iter()
            .map(|e| {
                let name = Path::new(&e.link_path)
                    .file_name()
                    .unwrap()
                    .to_string_lossy()
                    .into_owned();
                (name, e.state)
            })
            .collect()
    }

    #[test]
    fn enumerates_all_four_states() {
        let f = setup();

        // dotfiles-side fixtures
        fs::write(f.dotfiles.join("ok.sh"), "ok script").unwrap();
        fs::write(f.dotfiles.join("drifted.sh"), "expected content").unwrap();

        // claude-side fixtures
        symlink(f.dotfiles.join("ok.sh"), f.claude.join("ok.sh")).unwrap();
        fs::write(f.claude.join("drifted.sh"), "different content").unwrap();
        symlink(f.dotfiles.join("nonexistent.sh"), f.claude.join("broken.sh")).unwrap();
        fs::write(f.claude.join("orphan.sh"), "orphan").unwrap();

        let entries = scan_hooks(
            f.claude.to_string_lossy().into_owned(),
            f.dotfiles.to_string_lossy().into_owned(),
        )
        .expect("scan_hooks");

        let by_name = states_by_filename(&entries);
        assert_eq!(by_name.get("ok.sh"), Some(&"ok"), "ok symlink should be ok");
        assert_eq!(by_name.get("drifted.sh"), Some(&"drifted"), "non-symlink with dotfiles counterpart should be drifted");
        assert_eq!(by_name.get("broken.sh"), Some(&"broken"), "symlink to nonexistent should be broken");
        assert_eq!(by_name.get("orphan.sh"), Some(&"unmanaged"), "regular file without dotfiles counterpart should be unmanaged");

        for entry in &entries {
            assert!(!entry.link_path.is_empty(), "entry must carry link_path");
        }
    }

    #[test]
    fn spec_example_stop_and_orphan() {
        // Spec R1 example: stop.sh symlinks to dotfiles, orphan.sh is regular file with no counterpart
        let f = setup();
        fs::write(f.dotfiles.join("stop.sh"), "stop hook").unwrap();
        symlink(f.dotfiles.join("stop.sh"), f.claude.join("stop.sh")).unwrap();
        fs::write(f.claude.join("orphan.sh"), "orphan hook").unwrap();

        let entries = scan_hooks(
            f.claude.to_string_lossy().into_owned(),
            f.dotfiles.to_string_lossy().into_owned(),
        )
        .expect("scan_hooks");

        let by_name = states_by_filename(&entries);
        assert_eq!(by_name.get("stop.sh"), Some(&"ok"));
        assert_eq!(by_name.get("orphan.sh"), Some(&"unmanaged"));
    }

    #[test]
    fn skips_non_sh_files() {
        let f = setup();
        fs::write(f.claude.join("README.md"), "docs").unwrap();
        fs::write(f.claude.join("hook.sh"), "actual hook").unwrap();

        let entries = scan_hooks(
            f.claude.to_string_lossy().into_owned(),
            f.dotfiles.to_string_lossy().into_owned(),
        )
        .expect("scan_hooks");

        let names: Vec<String> = entries
            .iter()
            .map(|e| Path::new(&e.link_path).file_name().unwrap().to_string_lossy().into_owned())
            .collect();
        assert!(names.contains(&"hook.sh".to_string()), "hook.sh should be enumerated");
        assert!(!names.contains(&"README.md".to_string()), "non-.sh files must be skipped");
    }
}
