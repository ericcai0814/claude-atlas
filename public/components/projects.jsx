// Projects tab — master-detail cross-project inventory

const { useState: useStateProj } = React;

window.ProjectsTab = function ProjectsTab({ data, loading, onToast }) {
  const t = useT();
  const [selectedPath, setSelectedPath] = useStateProj(null);
  const [query, setQuery] = useStateProj('');
  const [filter, setFilter] = useStateProj('all');

  if (loading) return <SkeletonTable rows={10}/>;
  if (!data || data.projects.length === 0) {
    return <EmptyState icon={<Icons.Folder/>} title={t('projects.empty.title')}
      hint={t('projects.empty.hint')}
      cta={<button className="btn primary" style={{marginTop:12}}><Icons.Refresh/> {t('projects.empty.cta')}</button>}/>;
  }

  let rows = data.projects;
  if (filter === 'managed') rows = rows.filter(p => p.hasClaudeDir);
  if (filter === 'drift') rows = rows.filter(p => (p.memoryLines||0) > 200);
  if (query) rows = rows.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.path.toLowerCase().includes(query.toLowerCase()));

  const selected = rows.find(p => p.path === selectedPath) || rows[0];
  const counts = {
    all: data.projects.length,
    managed: data.projects.filter(p=>p.hasClaudeDir).length,
    drift: data.projects.filter(p=>(p.memoryLines||0)>200).length,
  };

  return (
    <div className="split">
      <div className="split-list">
        <div className="filter-bar">
          <div className="filter-search">
            <Icons.Search/>
            <input placeholder={t('search.projects')} value={query} onChange={e=>setQuery(e.target.value)}/>
          </div>
          <button className={`filter-chip ${filter==='all'?'active':''}`} onClick={()=>setFilter('all')}>{t('filter.all')}<span className="count">{counts.all}</span></button>
          <button className={`filter-chip ${filter==='managed'?'active':''}`} onClick={()=>setFilter('managed')}>{t('filter.managed')}<span className="count">{counts.managed}</span></button>
          <button className={`filter-chip ${filter==='drift'?'active':''}`} onClick={()=>setFilter('drift')}>{t('filter.overBudget')}<span className="count">{counts.drift}</span></button>
        </div>

        <div>
          {rows.map(p => {
            const over = (p.memoryLines||0) > 200;
            return (
              <div key={p.path} className={`list-row ${selected && selected.path === p.path ? 'selected':''}`} onClick={()=>setSelectedPath(p.path)}>
                <span className={`state-dot ${over ? 'drifted' : p.hasClaudeDir ? 'ok' : 'unmanaged'}`}/>
                <div className="main-col">
                  <div className="row-title">{p.name}</div>
                  <div className="row-sub truncate">{fmt.home(p.path)}</div>
                </div>
                <div style={{display:'flex', gap: 6, alignItems:'center'}}>
                  {p.hasClaudeDir && <span className="tag-chip">.claude</span>}
                  {p.hasClaudeMd && <span className="tag-chip">CLAUDE.md</span>}
                  {p.memoryLines != null && <span className="tag-chip" style={over ? {color:'var(--sem-drifted-text)'}:{}}>{p.memoryLines}L</span>}
                </div>
              </div>
            );
          })}
          {rows.length === 0 && <div style={{padding: '40px 20px', textAlign:'center', color:'var(--text-tertiary)'}}>{t('search.noMatch')}</div>}
        </div>
      </div>

      <div className="split-detail">
        {selected ? <ProjectDetail project={selected} onToast={onToast}/> : <EmptyState icon={<Icons.Folder/>} title={t('projects.selectOne')}/>}
      </div>
    </div>
  );
};

function ProjectDetail({ project: p, onToast }) {
  const t = useT();
  const over = (p.memoryLines||0) > 200;
  return (
    <div>
      <div className="detail-header">
        <div className="detail-title-stack">
          <div className="detail-eyebrow">{p.hasClaudeDir ? t('projects.detail.managed') : t('projects.detail.unmanaged')}</div>
          <h2 className="detail-title">{p.name}</h2>
          <div className="detail-sub">{p.path}</div>
        </div>
        <div style={{display:'flex', gap: 8}}>
          <button className="btn"><Icons.Terminal/> {t('projects.openVSCode')}</button>
          <button className="btn ghost"><Icons.ExternalLink/> {t('projects.finder')}</button>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 12, marginBottom: 20}}>
        <StatMini label={t('projects.claudeDir')} value={p.hasClaudeDir ? <Badge kind="ok">{t('common.yes')}</Badge> : <Badge kind="unmanaged">{t('common.no')}</Badge>}/>
        <StatMini label={t('projects.claudeMd')} value={p.hasClaudeMd ? <Badge kind="ok">{t('common.yes')}</Badge> : <Badge kind="unmanaged">{t('common.no')}</Badge>}/>
        <StatMini label={t('projects.skills')} value={<span>{p.skills.length}</span>}/>
        <StatMini label={t('projects.memoryLines')} value={<span style={over?{color:'var(--sem-drifted-text)'}:{}}>{p.memoryLines ?? '—'}</span>} sub={over ? t('projects.overBudget') : undefined}/>
      </div>

      <div className="section-title">{t('projects.section.skills', { n: p.skills.length })}</div>
      {p.skills.length === 0 ? <div className="muted" style={{fontSize:'var(--fs-12)'}}>{t('projects.noSkills')}</div> : (
        <div style={{display:'flex', flexWrap:'wrap', gap: 6}}>
          {p.skills.map(s => <span key={s} className="tag-chip" style={{padding:'3px 9px'}}>{s}</span>)}
        </div>
      )}

      <div className="section-title">{t('projects.section.agents', { n: p.agents.length })}</div>
      {p.agents.length === 0 ? <div className="muted" style={{fontSize:'var(--fs-12)'}}>{t('projects.noAgents')}</div> : (
        <div style={{display:'flex', flexWrap:'wrap', gap: 6}}>
          {p.agents.map(a => <span key={a} className="tag-chip" style={{padding:'3px 9px'}}>{a}</span>)}
        </div>
      )}

      <div className="section-title">{t('projects.section.memory')}</div>
      <dl className="kv-grid">
        <dt>{t('projects.memory.path')}</dt><dd>~/.claude/projects/{p.name}/memory/MEMORY.md</dd>
        <dt>{t('projects.memory.linesLabel')}</dt><dd>{p.memoryLines ?? '—'} {over && <Badge kind="drifted">{t('projects.tag.over')}</Badge>}</dd>
        <dt>{t('projects.memory.modified')}</dt><dd className="muted">{t('projects.memory.modifiedVal')}</dd>
      </dl>

      {over && (
        <>
          <div className="section-title">{t('projects.action.title')}</div>
          <CliBox command={`claude-skill memory compact ${p.name}`} onCopy={c => onToast({kind:'ok', title: t('common.copied'), message: c})}/>
        </>
      )}
    </div>
  );
}

function StatMini({ label, value, sub }) {
  return (
    <div className="card" style={{padding: '10px 14px'}}>
      <div style={{fontSize:'var(--fs-11)', color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:'.05em'}}>{label}</div>
      <div style={{marginTop: 6, fontSize:'var(--fs-16)', fontWeight:'var(--fw-semibold)'}}>{value}</div>
      {sub && <div style={{fontSize:'var(--fs-11)', color:'var(--text-tertiary)', marginTop: 4}}>{sub}</div>}
    </div>
  );
}

Object.assign(window, { ProjectsTab: window.ProjectsTab });
