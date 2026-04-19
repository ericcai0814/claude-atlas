// Shell: activity bar + top chrome + toast system + tweaks panel

const { useState, useEffect, useCallback, useMemo, useSyncExternalStore } = React;

window.useT = function useT() {
  const lang = useSyncExternalStore(
    (cb) => window.i18n.subscribe(cb),
    () => window.i18n.lang
  );
  return useMemo(() => (key, vars) => window.i18n.t(key, vars), [lang]);
};

window.useToasts = function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    const toast = { id, kind: 'info', ...t };
    setToasts(prev => [...prev, toast]);
    setTimeout(() => setToasts(prev => prev.map(x => x.id === id ? {...x, exiting: true} : x)), 3800);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 4000);
  }, []);
  return { toasts, push, dismiss: (id) => setToasts(prev => prev.filter(x => x.id !== id)) };
};

window.ToastStack = function ToastStack({ toasts, onDismiss }) {
  const iconFor = (k) => {
    if (k === 'ok') return <Icons.Check/>;
    if (k === 'error') return <Icons.Alert/>;
    return <Icons.Info/>;
  };
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.kind} ${t.exiting ? 'exiting' : ''}`}>
          <span className="toast-icon" style={{color: `var(--sem-${t.kind === 'ok' ? 'ok' : t.kind === 'error' ? 'broken' : 'unmanaged'}-500)`}}>
            {iconFor(t.kind)}
          </span>
          <div className="toast-body">
            {t.title && <div className="toast-title">{t.title}</div>}
            <div className="toast-msg">{t.message}</div>
          </div>
          <button className="toast-close" onClick={() => onDismiss(t.id)}><Icons.X/></button>
        </div>
      ))}
    </div>
  );
};

window.ActivityBar = function ActivityBar({ active, onSelect, badges }) {
  const t = useT();
  const items = [
    { id: 'overview', icon: <Icons.Dashboard/>, label: t('nav.overview') },
    { id: 'symlinks', icon: <Icons.Link/>, label: t('nav.symlinks') },
    { id: 'projects', icon: <Icons.Folder/>, label: t('nav.projects') },
    { id: 'plugins', icon: <Icons.Plug/>, label: t('nav.plugins') },
    { id: 'context', icon: <Icons.Gauge/>, label: t('nav.context') },
  ];
  return (
    <nav className="activity-bar" aria-label="Primary">
      <div className="activity-logo"><Icons.Logo/></div>
      {items.map(it => (
        <div
          key={it.id}
          className={`activity-item ${active === it.id ? 'active' : ''}`}
          onClick={() => onSelect(it.id)}
          role="button"
          tabIndex={0}
        >
          {it.icon}
          {badges[it.id] > 0 && (
            <span className={`badge ${badges[`${it.id}_drift`] ? 'drifted' : ''}`}>
              {badges[it.id] > 99 ? '99' : badges[it.id]}
            </span>
          )}
          <span className="activity-tooltip">{it.label}</span>
        </div>
      ))}
    </nav>
  );
};

window.TopChrome = function TopChrome({ scanning, lastScanAt, onRefreshAll, theme, onToggleTheme, onToggleTweaks, tweaksOn }) {
  const t = useT();
  return (
    <header className="chrome">
      <div className="chrome-left">
        <div className="chrome-title-group">
          <span className="chrome-brand">claude<span className="accent">·</span>atlas</span>
          <span className="chrome-path">{t('app.brand.path')}</span>
        </div>
      </div>
      <div className="chrome-right">
        <div className={`chrome-scan-status ${scanning ? 'scanning' : ''}`}>
          <span className="pulse"/>
          <span>{scanning ? t('chrome.scanning') : `${t('chrome.lastScan')} · ${fmt.ago(lastScanAt)}`}</span>
        </div>
        <button className="btn" onClick={onRefreshAll} disabled={scanning}>
          <Icons.Refresh/> {t('chrome.refreshAll')}
        </button>
        <LanguageSwitch/>
        <button className={`icon-btn ${tweaksOn ? 'active' : ''}`} onClick={onToggleTweaks} title={t('chrome.tweaks')}>
          <Icons.Sliders/>
        </button>
        <button className="icon-btn" onClick={onToggleTheme} title={t('chrome.toggleTheme')}>
          {theme === 'dark' ? <Icons.Sun/> : <Icons.Moon/>}
        </button>
        <button className="icon-btn" title={t('chrome.notifications')}><Icons.Bell/></button>
        <button className="icon-btn" title={t('chrome.settings')}><Icons.Settings/></button>
      </div>
    </header>
  );
};

function LanguageSwitch() {
  const t = useT();
  const lang = window.i18n.lang;
  return (
    <div className="tweaks-seg lang-switch">
      {window.i18n.languages.map(l => (
        <button
          key={l.code}
          className={lang === l.code ? 'active' : ''}
          style={{padding: '2px 8px', fontSize: 'var(--fs-11)'}}
          onClick={() => window.i18n.setLang(l.code)}
          title={l.label}
        >{l.label}</button>
      ))}
    </div>
  );
}

window.TabHeader = function TabHeader({ title, count, actions, children }) {
  return (
    <div className="tab-header">
      <div className="tab-header-title">
        <h1>{title}</h1>
        {count !== undefined && <span className="count">{count}</span>}
        {children}
      </div>
      <div className="tab-header-actions">{actions}</div>
    </div>
  );
};

window.EmptyState = function EmptyState({ icon, title, hint, cta }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {hint && <div className="empty-hint">{hint}</div>}
      {cta}
    </div>
  );
};

window.Skeleton = function Skeleton({ w='100%', h=14, style={} }) {
  return <div className="skeleton" style={{ width: w, height: h, ...style }}/>;
};

window.SkeletonTable = function SkeletonTable({ rows=8 }) {
  return (
    <div style={{padding: '12px 16px'}}>
      {Array.from({length: rows}).map((_,i) => (
        <div key={i} style={{display:'grid', gridTemplateColumns: '14px 1fr 90px 120px', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)'}}>
          <Skeleton w={10} h={10} style={{borderRadius: 10}}/>
          <Skeleton h={12} w={`${50 + (i*7)%40}%`}/>
          <Skeleton h={12} w={60}/>
          <Skeleton h={16} w={80} style={{borderRadius: 8}}/>
        </div>
      ))}
    </div>
  );
};

window.Badge = function Badge({ kind, children, showDot=true }) {
  return (
    <span className={`badge-pill ${kind}`}>
      {showDot && <span className="dot"/>}
      {children}
    </span>
  );
};

window.CliBox = function CliBox({ command, onCopy }) {
  const t = useT();
  const copy = () => {
    navigator.clipboard?.writeText(command);
    onCopy && onCopy(command);
  };
  return (
    <div className="cli-box">
      <span className="prompt">$</span>
      <code>{command}</code>
      <button className="copy-btn" onClick={copy}>
        <Icons.Copy/> {t('common.copy')}
      </button>
    </div>
  );
};

window.TweaksPanel = function TweaksPanel({ open, tweaks, setTweaks, onClose }) {
  const t = useT();
  if (!open) return null;
  const Seg = ({ value, onChange, options }) => (
    <div className="tweaks-seg">
      {options.map(o => (
        <button key={o.value} className={value === o.value ? 'active' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
  return (
    <div className="tweaks-panel">
      <header>
        <span>{t('tweaks.title')}</span>
        <button className="icon-btn" onClick={onClose}><Icons.X/></button>
      </header>
      <div className="body">
        <div className="tweaks-row">
          <label>{t('tweaks.language')}</label>
          <Seg value={window.i18n.lang} onChange={v => window.i18n.setLang(v)}
               options={window.i18n.languages.map(l => ({value: l.code, label: l.label}))}/>
        </div>
        <div className="tweaks-row">
          <label>{t('tweaks.density')}</label>
          <Seg value={tweaks.density} onChange={v => setTweaks({...tweaks, density: v})}
               options={[{value:'compact',label:t('tweaks.density.compact')},{value:'comfortable',label:t('tweaks.density.comfortable')}]}/>
        </div>
        <div className="tweaks-row">
          <label>{t('tweaks.driftPalette')}</label>
          <Seg value={tweaks.driftPalette} onChange={v => setTweaks({...tweaks, driftPalette: v})}
               options={[{value:'semantic',label:t('tweaks.driftPalette.semantic')},{value:'neutral',label:t('tweaks.driftPalette.neutral')}]}/>
        </div>
        <div className="tweaks-row">
          <label>{t('tweaks.theme')}</label>
          <Seg value={tweaks.theme} onChange={v => setTweaks({...tweaks, theme: v})}
               options={[{value:'light',label:t('tweaks.theme.light')},{value:'dark',label:t('tweaks.theme.dark')}]}/>
        </div>
        <div className="tweaks-row">
          <label>{t('tweaks.simLoading')}</label>
          <Seg value={tweaks.forceLoading ? 'on' : 'off'} onChange={v => setTweaks({...tweaks, forceLoading: v==='on'})}
               options={[{value:'off',label:t('tweaks.off')},{value:'on',label:t('tweaks.on')}]}/>
        </div>
        <div className="tweaks-row">
          <label>{t('tweaks.dataState')}</label>
          <Seg value={tweaks.dataState} onChange={v => setTweaks({...tweaks, dataState: v})}
               options={[{value:'populated',label:t('tweaks.dataState.populated')},{value:'empty',label:t('tweaks.dataState.empty')}]}/>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { useT: window.useT, useToasts: window.useToasts, ToastStack: window.ToastStack,
  ActivityBar: window.ActivityBar, TopChrome: window.TopChrome, TabHeader: window.TabHeader,
  EmptyState: window.EmptyState, Skeleton: window.Skeleton, SkeletonTable: window.SkeletonTable,
  Badge: window.Badge, CliBox: window.CliBox, TweaksPanel: window.TweaksPanel });
