// Plugins & MCP tab — two sections in one tab

const { useState: useStatePl } = React;

window.PluginsTab = function PluginsTab({ data, loading, focus, onToast }) {
  const t = useT();
  const [filter, setFilter] = useStatePl('all');
  const [query, setQuery] = useStatePl('');

  React.useEffect(() => { if (focus) setFilter(focus); }, [focus]);

  if (loading) return <SkeletonTable rows={12}/>;
  if (!data || data.plugins.length === 0) {
    return <EmptyState icon={<Icons.Plug/>} title={t('plugins.empty.title')}
      hint={t('plugins.empty.hint')}
      cta={<button className="btn primary" style={{marginTop:12}}><Icons.Refresh/> {t('plugins.empty.cta')}</button>}/>;
  }

  const counts = {
    all: data.plugins.length,
    active: data.plugins.filter(p => p.deadStatus==='active').length,
    quiet: data.plugins.filter(p => p.deadStatus==='quiet').length,
    dead: data.plugins.filter(p => p.deadStatus==='dead').length,
    disabled: data.plugins.filter(p => !p.enabled).length,
  };

  let rows = data.plugins;
  if (filter === 'active') rows = rows.filter(p => p.deadStatus==='active');
  if (filter === 'quiet') rows = rows.filter(p => p.deadStatus==='quiet');
  if (filter === 'dead') rows = rows.filter(p => p.deadStatus==='dead');
  if (filter === 'disabled') rows = rows.filter(p => !p.enabled);
  if (query) rows = rows.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));

  const maxTrig = Math.max(...data.plugins.map(p => p.triggerCount7d), 1);

  return (
    <div style={{display:'flex', flexDirection:'column', gap: 24}}>
      <section>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12}}>
          <div>
            <div style={{fontSize:'var(--fs-14)', fontWeight:'var(--fw-semibold)'}}>{t('plugins.section.title')} <span className="muted" style={{marginLeft:6}}>{data.plugins.length}</span></div>
            <div style={{fontSize:'var(--fs-12)', color:'var(--text-tertiary)', marginTop: 2}}>{t('plugins.section.subtitle')}</div>
          </div>
        </div>

        <div className="card" style={{overflow:'hidden'}}>
          <div className="filter-bar" style={{borderTopLeftRadius:'var(--radius-lg)', borderTopRightRadius:'var(--radius-lg)'}}>
            <div className="filter-search">
              <Icons.Search/>
              <input placeholder={t('search.plugins')} value={query} onChange={e=>setQuery(e.target.value)}/>
            </div>
            <Chip2 k="all" cur={filter} setCur={setFilter} label={t('filter.all')} count={counts.all}/>
            <Chip2 k="active" cur={filter} setCur={setFilter} label={t('filter.active')} count={counts.active} tone="ok"/>
            <Chip2 k="quiet" cur={filter} setCur={setFilter} label={t('filter.quiet')} count={counts.quiet} tone="drifted"/>
            <Chip2 k="dead" cur={filter} setCur={setFilter} label={t('filter.dead')} count={counts.dead} tone="broken"/>
            <Chip2 k="disabled" cur={filter} setCur={setFilter} label={t('filter.disabled')} count={counts.disabled}/>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th style={{width: 28}}></th>
                <th>{t('plugins.col.name')}</th>
                <th style={{width: 220}}>{t('plugins.col.triggers')}</th>
                <th style={{width: 120}}>{t('plugins.col.lastTriggered')}</th>
                <th style={{width: 110}}>{t('plugins.col.status')}</th>
                <th style={{width: 90}}>{t('plugins.col.enabled')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(p => {
                const tone = p.deadStatus==='dead' ? 'broken' : p.deadStatus==='quiet' ? 'drifted' : 'ok';
                const pct = (p.triggerCount7d / maxTrig) * 100;
                return (
                  <tr key={p.name} onClick={() => onToast({kind:'info', message: t('plugins.stub', { name: p.name })})}>
                    <td><span className={`state-dot ${tone}`} style={{width:8,height:8,borderRadius:4,display:'inline-block'}}/></td>
                    <td className="mono-path">{p.name}</td>
                    <td>
                      <div style={{display:'flex', alignItems:'center', gap: 8}}>
                        <div style={{flex:1, height: 6, background:'var(--bg-inset)', borderRadius: 3, overflow:'hidden', minWidth: 60}}>
                          <div style={{width:`${pct}%`, height:'100%', background: p.triggerCount7d === 0 ? 'var(--border-default)' : 'var(--accent-500)'}}/>
                        </div>
                        <span className="num mono-num" style={{width: 36, color: p.triggerCount7d===0 ? 'var(--text-tertiary)' : 'var(--text-primary)'}}>{p.triggerCount7d}</span>
                      </div>
                    </td>
                    <td className="muted mono-num">{fmt.ago(p.lastTriggeredAt)}</td>
                    <td><Badge kind={tone}>{t(`filter.${p.deadStatus}`)}</Badge></td>
                    <td>{p.enabled ? <Badge kind="ok" showDot={false}>{t('common.on')}</Badge> : <Badge kind="unmanaged" showDot={false}>{t('common.off')}</Badge>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <div style={{padding:24, textAlign:'center', color:'var(--text-tertiary)'}}>{t('search.noMatch')}</div>}
        </div>
      </section>

      <section>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12}}>
          <div>
            <div style={{fontSize:'var(--fs-14)', fontWeight:'var(--fw-semibold)'}}>{t('plugins.mcp.title')} <span className="muted" style={{marginLeft:6}}>{data.mcpServers.length}</span></div>
            <div style={{fontSize:'var(--fs-12)', color:'var(--text-tertiary)', marginTop:2}}>{t('plugins.mcp.subtitle')}</div>
          </div>
        </div>

        <div className="card" style={{overflow:'hidden'}}>
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('plugins.col.name')}</th>
                <th style={{width: 100}}>{t('plugins.col.scope')}</th>
                <th>{t('plugins.col.project')}</th>
                <th style={{width: 90}}>{t('plugins.col.enabled')}</th>
              </tr>
            </thead>
            <tbody>
              {data.mcpServers.map(m => (
                <tr key={m.name}>
                  <td className="mono-path">{m.name}</td>
                  <td><span className="tag-chip">{t(`plugins.scope.${m.scope}`) }</span></td>
                  <td className="muted">{m.projectPath ? fmt.home(m.projectPath) : <span className="muted">—</span>}</td>
                  <td>{m.enabled ? <Badge kind="ok" showDot={false}>{t('common.on')}</Badge> : <Badge kind="unmanaged" showDot={false}>{t('common.off')}</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

function Chip2({ k, cur, setCur, label, count, tone }) {
  return (
    <button className={`filter-chip ${cur===k?'active':''}`} onClick={()=>setCur(k)}>
      {tone && <span style={{width:6,height:6,borderRadius:3,background:`var(--sem-${tone}-500)`,display:'inline-block'}}/>}
      {label}<span className="count">{count}</span>
    </button>
  );
}

Object.assign(window, { PluginsTab: window.PluginsTab });
