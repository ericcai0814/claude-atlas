// Context tab — budget visualization

window.ContextTab = function ContextTab({ data, loading, focus, onToast }) {
  const t = useT();
  if (loading) {
    return (
      <div style={{padding: 24, display:'flex', flexDirection:'column', gap:16}}>
        <Skeleton h={120}/>
        <Skeleton h={300}/>
        <Skeleton h={200}/>
      </div>
    );
  }
  if (!data) return <EmptyState icon={<Icons.Gauge/>} title={t('context.empty.title')}/>;

  const { contextBudget: b, contextBreakdown: br } = data;

  const rulesTokens = br.rules.reduce((s,r) => s + r.tokensEst, 0);
  const skillsBytes = br.globalSkills.reduce((s,r) => s + r.bytes, 0);
  const skillsTokens = Math.round(skillsBytes / 4);
  const memoryTokens = Math.round(b.memoryTotalLines * 60 / 4);
  const totalTokens = rulesTokens + skillsTokens + memoryTokens;
  const budgetCap = 80000;
  const pct = Math.min(100, (totalTokens / budgetCap) * 100);

  return (
    <div style={{display:'flex', flexDirection:'column', gap: 20}}>
      <div className="card" style={{padding: '18px 22px'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: 12}}>
          <div>
            <div style={{fontSize:'var(--fs-11)', color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:'.06em'}}>{t('context.total.label')}</div>
            <div style={{fontSize:'var(--fs-28)', fontWeight:'var(--fw-semibold)', letterSpacing:'-0.02em', marginTop: 4, fontVariantNumeric:'tabular-nums'}}>
              {(totalTokens/1000).toFixed(1)}k <span style={{fontSize:'var(--fs-14)', color:'var(--text-tertiary)', fontWeight:'var(--fw-regular)'}}>{t('context.budget.unit', { cap: budgetCap/1000 })}</span>
            </div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:'var(--fs-22)', fontWeight:'var(--fw-semibold)', color: pct > 75 ? 'var(--sem-drifted-text)' : 'var(--sem-ok-text)'}}>{pct.toFixed(0)}%</div>
            <div style={{fontSize:'var(--fs-11)', color:'var(--text-tertiary)'}}>{t('context.total.of')}</div>
          </div>
        </div>

        <div style={{display:'flex', height: 22, background:'var(--bg-inset)', borderRadius: 4, overflow:'hidden', border:'1px solid var(--border-subtle)'}}>
          <Seg value={rulesTokens} total={budgetCap} label={t('context.legend.rules')} color="var(--accent-500)"/>
          <Seg value={skillsTokens} total={budgetCap} label={t('context.legend.skills')} color="oklch(0.72 0.09 195)"/>
          <Seg value={memoryTokens} total={budgetCap} label={t('context.legend.memory')} color="oklch(0.70 0.11 300)"/>
          <Seg value={Math.max(0, budgetCap - totalTokens)} total={budgetCap} label={t('context.free')} color="transparent" isFree/>
        </div>

        <div style={{display:'flex', gap: 18, marginTop: 12, flexWrap:'wrap'}}>
          <Legend color="var(--accent-500)" label={t('context.legend.rules')} val={t('context.legend.rulesVal', { tokens: (rulesTokens/1000).toFixed(1), bytes: (b.alwaysOnRuleBytes/1024).toFixed(1) })}/>
          <Legend color="oklch(0.72 0.09 195)" label={t('context.legend.skills')} val={t('context.legend.skillsVal', { tokens: (skillsTokens/1000).toFixed(1), n: b.globalSkillCount })}/>
          <Legend color="oklch(0.70 0.11 300)" label={t('context.legend.memory')} val={t('context.legend.memoryVal', { tokens: (memoryTokens/1000).toFixed(1), lines: b.memoryTotalLines.toLocaleString() })}/>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16}}>
        <div className="card">
          <div style={{padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div style={{fontSize:'var(--fs-13)', fontWeight:'var(--fw-semibold)'}}>{t('context.rules.title')}</div>
            <div className="muted" style={{fontSize:'var(--fs-11)'}}>{t('context.rules.files', { n: br.rules.length })}</div>
          </div>
          <table className="data-table">
            <thead><tr><th>{t('context.rules.col.file')}</th><th style={{width: 140}}>{t('context.rules.col.size')}</th><th style={{width: 140}}>{t('context.rules.col.tokens')}</th></tr></thead>
            <tbody>
              {br.rules.map(r => (
                <tr key={r.path}>
                  <td className="mono-path"><span className="muted">~/.claude/rules/common/</span>{r.path.split('/').pop()}</td>
                  <td className="num mono-num">{(r.bytes/1024).toFixed(1)} KB</td>
                  <td className="num mono-num"><Badge kind="accent" showDot={false}>{(r.tokensEst/1000).toFixed(1)}k</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div style={{padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div style={{fontSize:'var(--fs-13)', fontWeight:'var(--fw-semibold)'}}>{t('context.skills.title')}</div>
            <div className="muted" style={{fontSize:'var(--fs-11)'}}>{t('context.skills.count', { n: br.globalSkills.length })}</div>
          </div>
          <div style={{padding: '8px 18px 14px'}}>
            {br.globalSkills.map(s => {
              const pct = (s.bytes / skillsBytes) * 100;
              return (
                <div key={s.name} style={{padding: '8px 0', borderBottom: '1px solid var(--border-subtle)'}}>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'var(--fs-12)', marginBottom: 4}}>
                    <span className="mono-path">{s.name}</span>
                    <span className="muted mono-num">{(s.bytes/1024).toFixed(1)} KB</span>
                  </div>
                  <div style={{height: 4, background:'var(--bg-inset)', borderRadius: 2, overflow:'hidden'}}>
                    <div style={{width:`${pct}%`, height:'100%', background:'oklch(0.72 0.09 195)'}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{padding: '14px 18px', borderBottom:'1px solid var(--border-subtle)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div>
            <div style={{fontSize:'var(--fs-13)', fontWeight:'var(--fw-semibold)'}}>{t('context.memory.title')}</div>
            <div className="muted" style={{fontSize:'var(--fs-11)', marginTop:2}}>{t('context.memory.subtitle')}</div>
          </div>
          <Badge kind="drifted">{t('context.memory.overBadge', { n: br.memory.filter(m=>m.overBudget).length })}</Badge>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('context.memory.col.project')}</th>
              <th>{t('context.memory.col.path')}</th>
              <th style={{width: 110}}>{t('context.memory.col.lines')}</th>
              <th style={{width: 160}}>{t('context.memory.col.dist')}</th>
              <th style={{width: 110}}>{t('context.memory.col.status')}</th>
            </tr>
          </thead>
          <tbody>
            {br.memory.map(m => {
              const pct = Math.min(100, (m.lines / 600) * 100);
              return (
                <tr key={m.path}>
                  <td style={{fontWeight:'var(--fw-medium)'}}>{m.project}</td>
                  <td className="mono-path muted">{m.path}</td>
                  <td className="num mono-num">{m.lines}</td>
                  <td>
                    <div style={{height: 6, background:'var(--bg-inset)', borderRadius: 3, overflow:'hidden'}}>
                      <div style={{width:`${pct}%`, height:'100%', background: m.overBudget ? 'var(--sem-drifted-500)' : 'var(--accent-500)'}}/>
                    </div>
                  </td>
                  <td>{m.overBudget ? <Badge kind="drifted">{t('context.memory.over')}</Badge> : <Badge kind="ok">{t('state.ok')}</Badge>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function Seg({ value, total, label, color, isFree }) {
  const pct = (value / total) * 100;
  if (pct < 0.5) return null;
  return (
    <div
      title={`${label} · ${(value/1000).toFixed(1)}k tokens`}
      style={{
        width: `${pct}%`,
        background: isFree ? 'transparent' : color,
        borderRight: isFree ? 'none' : '1px solid rgba(255,255,255,0.12)',
      }}
    />
  );
}
function Legend({ color, label, val }) {
  return (
    <div style={{display:'flex', alignItems:'center', gap: 8, fontSize:'var(--fs-11)'}}>
      <span style={{width:10, height: 10, borderRadius: 2, background: color, display:'inline-block'}}/>
      <div>
        <div style={{color:'var(--text-primary)', fontWeight:'var(--fw-medium)'}}>{label}</div>
        <div className="muted mono-num">{val}</div>
      </div>
    </div>
  );
}
