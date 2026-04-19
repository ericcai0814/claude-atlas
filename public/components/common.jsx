/* Shared icons + small helpers used across tabs */

window.Icons = (() => {
  const I = (d, opts={}) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={opts.w||1.8} strokeLinecap="round" strokeLinejoin="round">
      {d}
    </svg>
  );
  return {
    Logo: () => (
      <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
        <path d="M6 22 L12 8 L14 8 L8 22 Z" fill="currentColor"/>
        <path d="M18 22 L24 8 L26 8 L20 22 Z" fill="currentColor" opacity="0.55"/>
        <circle cx="16" cy="16" r="2" fill="currentColor"/>
      </svg>
    ),
    Dashboard: () => I(<><rect x="3" y="3" width="8" height="10" rx="1.5"/><rect x="13" y="3" width="8" height="6" rx="1.5"/><rect x="13" y="11" width="8" height="10" rx="1.5"/><rect x="3" y="15" width="8" height="6" rx="1.5"/></>),
    Link: () => I(<><path d="M10 14a4 4 0 0 1 0-6l2-2a4 4 0 0 1 6 6l-1.5 1.5"/><path d="M14 10a4 4 0 0 1 0 6l-2 2a4 4 0 0 1-6-6l1.5-1.5"/></>),
    Folder: () => I(<><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></>),
    Plug: () => I(<><path d="M9 2v4M15 2v4"/><path d="M7 6h10v5a5 5 0 0 1-10 0z"/><path d="M12 16v6"/></>),
    Gauge: () => I(<><path d="M12 14l4-4"/><path d="M21 12a9 9 0 1 0-17.5 3"/><circle cx="12" cy="14" r="1"/></>),
    Refresh: () => I(<><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></>),
    Settings: () => I(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>),
    Sun: () => I(<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>),
    Moon: () => I(<><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></>),
    Search: () => I(<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>),
    Check: () => I(<><path d="m5 13 4 4L19 7"/></>),
    X: () => I(<><path d="M18 6 6 18M6 6l12 12"/></>),
    Warn: () => I(<><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></>),
    Alert: () => I(<><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></>),
    Info: () => I(<><circle cx="12" cy="12" r="10"/><path d="M12 11v6M12 7h.01"/></>),
    Copy: () => I(<><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>),
    ExternalLink: () => I(<><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14 21 3"/></>),
    ChevronRight: () => I(<><path d="m9 6 6 6-6 6"/></>),
    Sliders: () => I(<><path d="M4 21V14M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M2 14h4M10 8h4M18 16h4"/></>),
    Bell: () => I(<><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></>),
    Circle: () => I(<circle cx="12" cy="12" r="9"/>),
    Terminal: () => I(<><path d="m4 17 6-6-6-6"/><path d="M12 19h8"/></>),
    BookOpen: () => I(<><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>),
    Cpu: () => I(<><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/></>),
    FileText: () => I(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></>),
    Activity: () => I(<><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></>),
    Hash: () => I(<><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/></>),
    Layers: () => I(<><path d="m12 2 10 6-10 6L2 8z"/><path d="m2 16 10 6 10-6"/><path d="m2 12 10 6 10-6"/></>),
    History: () => I(<><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 3"/></>),
    Eye: () => I(<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>),
  };
})();

window.fmt = (() => {
  const kb = (bytes) => bytes < 1024 ? `${bytes} B` : `${(bytes/1024).toFixed(1)} KB`;
  const tokens = (bytes) => {
    const t = Math.round(bytes / 4);
    return t >= 1000 ? `${(t/1000).toFixed(1)}k` : `${t}`;
  };
  const ago = (iso) => {
    const tr = (key, vars) => {
      try { return window.i18n.t(key, vars); } catch { return key; }
    };
    if (!iso) return tr('time.never');
    const diff = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 10) return tr('time.justNow');
    if (diff < 60) return tr('time.secondsAgo', { n: Math.round(diff) });
    if (diff < 3600) return tr('time.minutesAgo', { n: Math.round(diff/60) });
    if (diff < 86400) return tr('time.hoursAgo', { n: Math.round(diff/3600) });
    return tr('time.daysAgo', { n: Math.round(diff/86400) });
  };
  const home = (p) => p ? p.replace('/Users/eric', '~') : p;
  return { kb, tokens, ago, home };
})();
