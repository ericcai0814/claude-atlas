import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { SymlinkEntry, SymlinkState } from "../types";

const STATE_ORDER: SymlinkState[] = ["broken", "drifted", "unmanaged", "ok"];

export function Symlinks() {
  const [entries, setEntries] = useState<SymlinkEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    invoke<SymlinkEntry[]>("scan_symlinks", {
      claudeDir: "~/.claude",
      dotfilesSource: "~/dotfiles/claude",
    })
      .then(setEntries)
      .catch((e) => setError(String(e)));
  }, []);

  const counts = useMemo(() => {
    if (!entries) return null;
    return entries.reduce<Record<SymlinkState, number>>(
      (acc, e) => ({ ...acc, [e.state]: acc[e.state] + 1 }),
      { ok: 0, drifted: 0, broken: 0, unmanaged: 0 },
    );
  }, [entries]);

  const sorted = useMemo(() => {
    if (!entries) return null;
    return [...entries].sort((a, b) => {
      const byState = STATE_ORDER.indexOf(a.state) - STATE_ORDER.indexOf(b.state);
      return byState !== 0 ? byState : a.linkPath.localeCompare(b.linkPath);
    });
  }, [entries]);

  if (error) return <p className="error">scan_symlinks failed: {error}</p>;
  if (!sorted || !counts) return <p className="muted">Scanning…</p>;

  return (
    <section className="tab">
      <div className="summary">
        {STATE_ORDER.map((s) => (
          <span key={s} className={`chip chip-${s}`}>
            <strong>{counts[s]}</strong> {s}
          </span>
        ))}
      </div>

      <table className="entries">
        <thead>
          <tr>
            <th>State</th>
            <th>Link</th>
            <th>Target</th>
            <th>Expected source</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((e) => (
            <tr key={e.linkPath} className={`row-${e.state}`}>
              <td>
                <span className={`badge badge-${e.state}`}>{e.state}</span>
              </td>
              <td className="mono">{shortPath(e.linkPath)}</td>
              <td className="mono muted">
                {e.target ? shortPath(e.target) : <em>none</em>}
              </td>
              <td className="mono muted">
                {e.expectedSource ? shortPath(e.expectedSource) : <em>n/a</em>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {counts.drifted + counts.broken > 0 && (
        <p className="cta">
          <strong>{counts.drifted + counts.broken}</strong> issues detected. Run{" "}
          <code>cd ~/dotfiles && just restore</code> to re-sync.
        </p>
      )}
    </section>
  );
}

function shortPath(p: string): string {
  const home = "/Users/ericcai";
  return p.startsWith(home) ? "~" + p.slice(home.length) : p;
}
