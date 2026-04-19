use std::process::Command;

fn expand_tilde(s: &str) -> String {
    match s.strip_prefix("~") {
        Some(rest) => {
            let home = std::env::var("HOME").unwrap_or_default();
            let rest = rest.strip_prefix('/').unwrap_or(rest);
            if rest.is_empty() {
                home
            } else {
                format!("{}/{}", home, rest)
            }
        }
        None => s.to_string(),
    }
}

/// Reveal the given path in the OS file manager.
/// macOS: `open -R <path>` highlights the file in Finder.
/// Linux: `xdg-open <parent-dir>` opens the containing directory.
/// Windows: `explorer /select,<path>` highlights the file.
#[tauri::command]
pub fn reveal_in_finder(path: String) -> Result<(), String> {
    let expanded = expand_tilde(&path);

    #[cfg(target_os = "macos")]
    let result = Command::new("open").args(["-R", &expanded]).status();

    #[cfg(target_os = "linux")]
    let result = {
        let parent = std::path::Path::new(&expanded)
            .parent()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_else(|| expanded.clone());
        Command::new("xdg-open").arg(parent).status()
    };

    #[cfg(target_os = "windows")]
    let result = Command::new("explorer")
        .args(["/select,", &expanded])
        .status();

    match result {
        Ok(s) if s.success() => Ok(()),
        Ok(s) => Err(format!("reveal exited with code {}", s.code().unwrap_or(-1))),
        Err(e) => Err(format!("reveal failed: {}", e)),
    }
}

/// Open the given path in VS Code. Prefers the `code` CLI if on PATH,
/// falls back to macOS `open -a` / Linux `xdg-open code://`.
#[tauri::command]
pub fn open_in_vscode(path: String) -> Result<(), String> {
    let expanded = expand_tilde(&path);

    if let Ok(status) = Command::new("code").arg(&expanded).status() {
        if status.success() {
            return Ok(());
        }
    }

    #[cfg(target_os = "macos")]
    let result = Command::new("open")
        .args(["-a", "Visual Studio Code", &expanded])
        .status();

    #[cfg(target_os = "linux")]
    let result = Command::new("xdg-open").arg(&expanded).status();

    #[cfg(target_os = "windows")]
    let result = Command::new("cmd")
        .args(["/C", "code", &expanded])
        .status();

    match result {
        Ok(s) if s.success() => Ok(()),
        Ok(s) => Err(format!(
            "open_in_vscode exited with code {}",
            s.code().unwrap_or(-1)
        )),
        Err(e) => Err(format!(
            "open_in_vscode failed: {} (is the `code` CLI installed?)",
            e
        )),
    }
}
