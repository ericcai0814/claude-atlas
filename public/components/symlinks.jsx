// Symlinks tab — master-detail, the MVP vertical slice

const { useState: useStateSl, useMemo: useMemoSl } = React;

window.SymlinksTab = function SymlinksTab({ data, loading, focus, onToast }) {
  const t = useT();
  const [filter, setFilter] = useStateSl('all');
  const [query, setQuery] = useStateSl('');
  const [selectedPath, setSelectedPath] = useStateSl(null);

  React.useEffect(() => { if (focus) setFilter(focus); }, [focus]);

  const filtered = useMemoSl(() => {
    if (!data) return [];
    let rows = data.symlinks;
    if (filter !== 'all') rows = rows.filter(s => s.state === filter);
    if (query) {
      const q = query.toLowerCase();
      rows = rows.filter(s => s.linkPath.toLowerCase().includes(q) || (s.target||'').toLowerCase().includes(q));
    }
    return rows;
  }, [data, filter, query]);

  const counts = useMemoSl(() => {
    if (!data) return {};
    const c = { all: data.symlinks.length, ok:0, drifted:0, broken:0, unmanaged:0 };
    data.symlinks.forEach(s => c[s.state]++);
    return c;
  }, [data]);

  React.useEffect(() => {
    if (filtered.length > 0 && !filtered.find(s => s.linkPath === selectedPath)) {
      setSelectedPath(filtered[0].linkPath);
    }
  }, [filtered, selectedPath]);

  if (loading) return <SkeletonTable rows={10}/>;

  const selected = filtered.find(s => s.linkPath === selectedPath);

  if (data.symlinks.length === 0) {
    return <EmptyState icon={<Icons.Link/>} title={t('symlinks.empty.title')}
      hint={t('symlinks.empty.hint')}
      cta={<button className="btn primary" style={{marginTop:12}}><Icons.Refresh/> {t('symlinks.empty.cta')}</button>}/>;
  }

  return (
    <div className="split">
      <div className="split-list">
        <div className="filter-bar">
          <div className="filter-search">
            <Icons.Search/>
            <input placeholder={t('search.symlinks')} value={query} onChange={e => setQuery(e.target.value)}/>
          </div>
          <Chip k="all" cur={filter} setCur={setFilter} count={counts.all} label={t('filter.all')}/>
          <Chip k="ok" cur={filter} setCur={setFilter} count={counts.ok} label={t('filter.ok')} tone="ok"/>
          <Chip k="drifted" cur={filter} setCur={setFilter} count={counts.drifted} label={t('filter.drifted')} tone="drifted"/>
          <Chip k="broken" cur={filter} setCur={setFilter} count={counts.broken} label={t('filter.broken')} tone="broken"/>
          <Chip k="unmanaged" cur={filter} setCur={setFilter} count={counts.unmanaged} label={t('filter.unmanaged')} tone="unmanaged"/>
        </div>
        <div>
          {filtered.map(s => (
            <div key={s.linkPath}
              className={`list-row ${s.linkPath === selectedPath ? 'selected' : ''}`}
              onClick={() => setSelectedPath(s.linkPath)}>
              <span className={`state-dot ${s.state}`}/>
              <div className="main-col">
                <div className="row-title truncate">{s.linkPath.replace('/Users/eric','~')}</div>
                <div className="row-sub truncate">
                  {s.target ? `→ ${s.target.replace('/Users/eric','~')}` : `→ (${t('symlinks.actualTarget.missing')})`}
                </div>
              </div>
              <Badge kind={s.state}>{t(`state.${s.state}`)}</Badge>
            </div>
          ))}
          {filtered.length === 0 && <div style={{padding: '40px 20px', textAlign:'center', color:'var(--text-tertiary)'}}>{t('search.noMatch')}</div>}
        </div>
      </div>

      <div className="split-detail">
        {selected ? <SymlinkDetail entry={selected} onToast={onToast}/> : <EmptyState icon={<Icons.Link/>} title={t('symlinks.selectOne')}/>}
      </div>
    </div>
  );
};

function Chip({ k, cur, setCur, count, label, tone }) {
  return (
    <button className={`filter-chip ${cur===k?'active':''}`} onClick={() => setCur(k)}>
      {tone && <span className="state-dot" style={{width:6,height:6,display:'inline-block',borderRadius:3,background:`var(--sem-${tone}-500)`}}/>}
      {label}
      <span className="count">{count}</span>
    </button>
  );
}

function SymlinkDetail({ entry, onToast }) {
  const t = useT();
  const { linkPath, target, expectedSource, state } = entry;
  const cli = {
    drifted: `just restore ${linkPath.split('/').pop()}`,
    broken: `ls -la ${(expectedSource||'').replace(/[^/]+$/,'') || '~/dotfiles/claude/'}`,
    unmanaged: `claude-skill adopt ${linkPath}`,
    ok: null,
  };

  return (
    <div>
      <div className="detail-header">
        <div className="detail-title-stack">
          <div className="detail-eyebrow">{t('symlinks.detail.eyebrow', { state: t(`state.${state}`) })}</div>
          <h2 className="detail-title">{linkPath.replace('/Users/eric','~')}</h2>
          <div className="detail-sub">{t(`symlinks.explain.${state}`)}</div>
        </div>
        <div style={{display:'flex', gap: 8}}>
          <button className="btn" onClick={() => window.revealInFinder(linkPath, onToast)}>
            <Icons.ExternalLink/> {t('symlinks.reveal')}
          </button>
          <Badge kind={state}>{t(`state.${state}`)}</Badge>
        </div>
      </div>

      <div className="section-title">{t('symlinks.resolution')}</div>
      <dl className="kv-grid">
        <dt>{t('symlinks.linkPath')}</dt><dd>{linkPath}</dd>
        <dt>{t('symlinks.actualTarget')}</dt><dd>{target || <span style={{color:'var(--sem-broken-text)'}}>{t('symlinks.actualTarget.missing')}</span>}</dd>
        <dt>{t('symlinks.expectedSource')}</dt><dd>{expectedSource || <span className="muted">{t('symlinks.expectedSource.none')}</span>}</dd>
        <dt>{t('symlinks.tier')}</dt><dd>{t('symlinks.tier.global')}</dd>
      </dl>

      {cli[state] && (
        <>
          <div className="section-title">{t('symlinks.action')}</div>
          <div className="detail-sub" style={{marginBottom: 8}}>{t('symlinks.action.hint')}</div>
          <CliBox command={cli[state]} onCopy={(c) => onToast({kind:'ok', title: t('common.copied'), message: c})}/>
        </>
      )}

      <div className="section-title">{t('symlinks.diag')}</div>
      <div className="kv-grid">
        <dt>{t('symlinks.diag.readlink')}</dt><dd style={{fontFamily:'var(--font-mono)'}}>{target || t('symlinks.diag.readlink.broken')}</dd>
        <dt>{t('symlinks.diag.srcExists')}</dt><dd>{expectedSource ? <Badge kind="ok">{t('common.yes')}</Badge> : <Badge kind="unmanaged">n/a</Badge>}</dd>
        <dt>{t('symlinks.diag.checksum')}</dt><dd>{state==='ok' ? <Badge kind="ok">{t('symlinks.diag.checksum.identical')}</Badge> : state==='drifted' ? <Badge kind="drifted">{t('symlinks.diag.checksum.differs')}</Badge> : <span className="muted">—</span>}</dd>
        <dt>{t('symlinks.diag.modified')}</dt><dd>{t('symlinks.diag.modified.val')}</dd>
      </div>
    </div>
  );
}

Object.assign(window, { SymlinksTab: window.SymlinksTab });
