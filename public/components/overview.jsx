// Overview tab — drift summary + recent stream + system snapshot

window.OverviewTab = function OverviewTab({ data, loading, onGoTo, onToast }) {
  const t = useT();
  if (loading) {
    return (
      <div style={{padding: 24, display: 'flex', flexDirection: 'column', gap: 16}}>
        <Skeleton h={72}/>
        <div style={{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap: 12}}>
          {Array.from({length:5}).map((_,i) => <Skeleton key={i} h={110}/>)}
        </div>
        <Skeleton h={260}/>
      </div>
    );
  }

  const { driftSummary: d, recentDrift, projects, plugins, contextBudget, symlinks } = data;
  const totalIssues = d.symlinkBroken + d.symlinkDrifted + d.pluginsDead + d.memoryOverBudget;
  const healthKind = totalIssues === 0 ? 'ok' : (d.symlinkBroken > 0 ? 'broken' : 'drifted');
  const cats = [d.symlinkBroken && t('nav.symlinks').toLowerCase(), d.pluginsDead && t('nav.plugins').toLowerCase(), d.memoryOverBudget && 'memory'].filter(Boolean).join(' · ');
  const healthMessage = totalIssues === 0
    ? t('overview.allClear')
    : t('overview.issues', { count: totalIssues, plural: totalIssues>1?'s':'', cats });

  const pluginsEnabled = plugins.filter(p => p.enabled).length;

  return (
    <div style={{display:'flex', flexDirection:'column', gap: 20}}>
      <div className={`card`} style={{padding: '16px 20px', display:'flex', alignItems:'center', gap: 16, borderLeft: `3px solid var(--sem-${healthKind}-500)`}}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `var(--sem-${healthKind}-bg)`,
          color: `var(--sem-${healthKind}-text)`,
          display:'flex', alignItems:'center', justifyContent:'center'
        }}>
          {totalIssues === 0 ? <Icons.Check/> : <Icons.Warn/>}
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:'var(--fs-14)', fontWeight:'var(--fw-semibold)'}}>{healthMessage}</div>
          <div style={{fontSize:'var(--fs-12)', color:'var(--text-tertiary)', marginTop: 2}}>
            {t('overview.subtitle')}
          </div>
        </div>
      </div>

      <div className="kpi-grid">
        <KPI label={t('overview.kpi.broken.label')} value={d.symlinkBroken} tone="broken" delta={d.symlinkBroken > 0 ? t('overview.kpi.broken.delta.yes') : t('overview.kpi.broken.delta.no')} onClick={() => onGoTo('symlinks','broken')} zero={d.symlinkBroken===0}/>
        <KPI label={t('overview.kpi.drifted.label')} value={d.symlinkDrifted} tone="drifted" delta={t('overview.kpi.drifted.delta')} onClick={() => onGoTo('symlinks','drifted')} zero={d.symlinkDrifted===0}/>
        <KPI label={t('overview.kpi.unmanaged.label')} value={d.symlinkUnmanaged} tone="unmanaged" delta={t('overview.kpi.unmanaged.delta')} onClick={() => onGoTo('symlinks','unmanaged')} zero={false} neutral/>
        <KPI label={t('overview.kpi.dead.label')} value={d.pluginsDead} tone="dead" delta={t('overview.kpi.dead.delta')} onClick={() => onGoTo('plugins','dead')} zero={d.pluginsDead===0}/>
        <KPI label={t('overview.kpi.memory.label')} value={d.memoryOverBudget} tone="memory" delta={t('overview.kpi.memory.delta')} onClick={() => onGoTo('context','memory')} zero={d.memoryOverBudget===0}/>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1.5fr 1fr', gap: 16}}>
        <div className="card">
          <div style={{padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <div style={{fontSize:'var(--fs-13)', fontWeight:'var(--fw-semibold)'}}>{t('overview.recent.title')}</div>
            <div style={{fontSize:'var(--fs-11)', color:'var(--text-tertiary)'}}>{t('overview.recent.events', { n: recentDrift.length })}</div>
          </div>
          {recentDrift.length === 0 ? (
            <EmptyState icon={<Icons.Activity/>} title={t('overview.recent.empty.title')} hint={t('overview.recent.empty.hint')}/>
          ) : (
            <div>
              {recentDrift.map((e, i) => (
                <div key={i} style={{
                  display:'grid',
                  gridTemplateColumns: '90px 24px 1fr auto',
                  gap: 12,
                  padding: 'calc(var(--sp-row) + 2px) calc(var(--sp-cell) + 6px)',
                  alignItems:'center',
                  borderBottom: i < recentDrift.length-1 ? '1px solid var(--border-subtle)' : 'none',
                  fontSize: 'var(--fs-12)'
                }}>
                  <span style={{color: 'var(--text-tertiary)', fontVariantNumeric:'tabular-nums'}}>{fmt.ago(e.at)}</span>
                  <span style={{color: 'var(--text-tertiary)'}}>
                    {e.kind === 'symlink' ? <Icons.Link/> : e.kind === 'plugin' ? <Icons.Plug/> : <Icons.FileText/>}
                  </span>
                  <div style={{minWidth:0}}>
                    <div style={{color:'var(--text-primary)', wordBreak:'break-all'}}>{e.artifact}</div>
                    <div style={{color:'var(--text-tertiary)', fontSize:'var(--fs-11)', marginTop: 2}}>{e.note}</div>
                  </div>
                  <div style={{display:'flex', alignItems:'center', gap: 6}}>
                    <Badge kind={/broken|dead|over/i.test(e.to) ? 'broken' : 'drifted'} showDot={false}>{e.to}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div style={{padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', fontSize:'var(--fs-13)', fontWeight:'var(--fw-semibold)'}}>{t('overview.snapshot.title')}</div>
          <div style={{padding: '8px 0'}}>
            <SnapRow label={t('overview.snapshot.projects')} value={projects.length} sub={t('overview.snapshot.projects.sub', { n: projects.filter(p=>p.hasClaudeDir).length })}/>
            <SnapRow label={t('overview.snapshot.symlinks')} value={symlinks.length} sub={t('overview.snapshot.symlinks.sub', { n: symlinks.filter(s=>s.state==='ok').length })}/>
            <SnapRow label={t('overview.snapshot.plugins')} value={`${pluginsEnabled} / ${plugins.length}`} sub={t('overview.snapshot.plugins.sub', { n: plugins.filter(p=>p.deadStatus==='active').length })}/>
            <SnapRow label={t('overview.snapshot.rules')} value={`${(contextBudget.alwaysOnRuleBytes/1024).toFixed(1)} KB`} sub={t('overview.snapshot.rules.sub', { n: fmt.tokens(contextBudget.alwaysOnRuleBytes) })}/>
            <SnapRow label={t('overview.snapshot.catalog')} value={contextBudget.catalogSkillCount} sub={t('overview.snapshot.catalog.sub', { n: contextBudget.globalSkillCount })}/>
            <SnapRow label={t('overview.snapshot.memory')} value={t('overview.snapshot.memoryUnit', { n: contextBudget.memoryTotalLines.toLocaleString() })} sub={t('overview.snapshot.memory.sub', { n: projects.filter(p=>p.memoryLines).length })}/>
          </div>
        </div>
      </div>
    </div>
  );
};

function KPI({ label, value, tone, delta, onClick, zero, neutral }) {
  return (
    <div className={`kpi accent-left ${tone} ${zero ? 'zero' : ''}`} onClick={onClick} role="button" tabIndex={0}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-delta">{delta}</div>
    </div>
  );
}

function SnapRow({ label, value, sub }) {
  return (
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding: 'var(--sp-row) calc(var(--sp-cell) + 6px)', fontSize:'var(--fs-12)'}}>
      <div>
        <div style={{color:'var(--text-primary)'}}>{label}</div>
        {sub && <div style={{color:'var(--text-tertiary)', fontSize:'var(--fs-11)', marginTop:2}}>{sub}</div>}
      </div>
      <div style={{fontWeight:'var(--fw-semibold)', fontVariantNumeric:'tabular-nums'}}>{value}</div>
    </div>
  );
}
