// Root App — wires tabs, theme, refresh, loading, tweaks

const { useState: useStateApp, useEffect: useEffectApp, useCallback: useCallbackApp, useMemo: useMemoApp } = React;

function App() {
  const t = useT();
  const [tab, setTab] = useStateApp(() => localStorage.getItem('atlas.tab') || 'overview');
  const [focus, setFocus] = useStateApp(null); // filter hint when jumping from Overview
  const [tweaksOpen, setTweaksOpen] = useStateApp(false);
  const [tweaks, setTweaks] = useStateApp(() => {
    try { return JSON.parse(localStorage.getItem('atlas.tweaks')) || defaults(); } catch { return defaults(); }
  });
  const [loading, setLoading] = useStateApp({ overview:true, symlinks:true, projects:true, plugins:true, context:true });
  const [data, setData] = useStateApp(window.MOCK);
  const [scanning, setScanning] = useStateApp(false);
  const [lastScanAt, setLastScanAt] = useStateApp(window.MOCK.lastScanAt);
  const { toasts, push: pushToast, dismiss } = useToasts();

  function defaults() { return { density:'compact', driftPalette:'semantic', theme:'dark', forceLoading:false, dataState:'populated' }; }

  // apply doc-level attrs
  useEffectApp(() => {
    document.documentElement.dataset.theme = tweaks.theme;
    document.documentElement.dataset.density = tweaks.density;
    document.documentElement.dataset.driftPalette = tweaks.driftPalette;
    localStorage.setItem('atlas.tweaks', JSON.stringify(tweaks));
  }, [tweaks]);

  // initial loading simulation — staggered per tab
  useEffectApp(() => {
    const order = ['overview','symlinks','projects','plugins','context'];
    order.forEach((t, i) => {
      setTimeout(() => setLoading(prev => ({ ...prev, [t]: false })), 300 + i * 180);
    });
  }, []);

  // Tauri data wiring — replace mock.symlinks with real scan_symlinks output
  // when running inside the Tauri webview. Silently fall back to mock data
  // in a plain browser (Vite dev without tauri dev).
  useEffectApp(() => {
    const tauri = window.__TAURI__;
    if (!tauri?.core?.invoke) return;
    tauri.core.invoke('scan_symlinks', {
      claudeDir: '~/.claude',
      dotfilesSource: '~/dotfiles/claude',
    })
      .then((symlinks) => {
        if (!Array.isArray(symlinks)) return;
        setData(prev => ({ ...prev, symlinks }));
      })
      .catch((err) => {
        console.warn('[atlas] scan_symlinks failed, using mock data:', err);
      });
  }, []);

  useEffectApp(() => { localStorage.setItem('atlas.tab', tab); }, [tab]);

  const activeData = tweaks.dataState === 'empty' ? emptyData() : data;

  function emptyData() {
    return {
      ...window.MOCK,
      symlinks: [],
      projects: [],
      plugins: [],
      mcpServers: [],
      recentDrift: [],
      driftSummary: { symlinkBroken:0, symlinkDrifted:0, symlinkUnmanaged:0, pluginsDead:0, memoryOverBudget:0 },
    };
  }

  const effectiveLoading = useMemoApp(() => {
    if (tweaks.forceLoading) return { overview:true, symlinks:true, projects:true, plugins:true, context:true };
    return loading;
  }, [loading, tweaks.forceLoading]);

  const goTo = useCallbackApp((nextTab, focusHint) => {
    setFocus(focusHint || null);
    setTab(nextTab);
  }, []);

  const refreshAll = useCallbackApp(() => {
    setScanning(true);
    setLoading({ overview:true, symlinks:true, projects:true, plugins:true, context:true });
    pushToast({ kind:'info', title: t('app.scanning.title'), message: t('common.scanning.msg') });
    setTimeout(() => {
      setScanning(false);
      setLastScanAt(new Date().toISOString());
      setLoading({ overview:false, symlinks:false, projects:false, plugins:false, context:false });
      pushToast({ kind:'ok', title: t('common.scanComplete'), message: t('app.scanComplete.msg', { symlinks: data.symlinks.length, projects: data.projects.length, plugins: data.plugins.length }) });
    }, 1400);
  }, [data, pushToast, t]);

  const refreshTab = useCallbackApp((tabKey) => {
    setLoading(prev => ({ ...prev, [tabKey]: true }));
    const tabName = t(`nav.${tabKey}`);
    pushToast({ kind:'info', message: t('common.rescanning', { tab: tabName }) });
    setTimeout(() => {
      setLoading(prev => ({ ...prev, [tabKey]: false }));
      pushToast({ kind:'ok', message: t('common.upToDate', { tab: tabName }) });
    }, 900);
  }, [pushToast, t]);

  const badges = useMemoApp(() => {
    const d = activeData.driftSummary;
    return {
      symlinks: d.symlinkBroken + d.symlinkDrifted,
      projects: 0,
      plugins: d.pluginsDead,
      context: d.memoryOverBudget,
      overview: 0,
    };
  }, [activeData]);

  const tabTitles = {
    overview: t('tab.overview.title'),
    symlinks: t('tab.symlinks.title'),
    projects: t('tab.projects.title'),
    plugins: t('tab.plugins.title'),
    context: t('tab.context.title'),
  };
  const tabCounts = {
    overview: undefined,
    symlinks: activeData.symlinks.length || undefined,
    projects: activeData.projects.length || undefined,
    plugins: activeData.plugins.length || undefined,
    context: undefined,
  };

  const header = (
    <TabHeader
      title={tabTitles[tab]}
      count={tabCounts[tab]}
      actions={
        <>
          {tab === 'symlinks' && focus && (
            <button className="btn ghost sm" onClick={() => setFocus(null)}><Icons.X/> {t('app.clearFilter', { name: t(`filter.${focus}`) })}</button>
          )}
          <button className="btn sm" onClick={() => refreshTab(tab)} disabled={effectiveLoading[tab]}>
            <Icons.Refresh/> {effectiveLoading[tab] ? t('chrome.scanning') : t('chrome.refresh')}
          </button>
        </>
      }
    />
  );

  const body = (() => {
    if (tab === 'overview') return <OverviewTab data={activeData} loading={effectiveLoading.overview} onGoTo={goTo} onToast={pushToast}/>;
    if (tab === 'symlinks') return <SymlinksTab data={activeData} loading={effectiveLoading.symlinks} focus={focus} onToast={pushToast}/>;
    if (tab === 'projects') return <ProjectsTab data={activeData} loading={effectiveLoading.projects} onToast={pushToast}/>;
    if (tab === 'plugins')  return <PluginsTab data={activeData} loading={effectiveLoading.plugins} focus={focus} onToast={pushToast}/>;
    if (tab === 'context')  return <ContextTab data={activeData} loading={effectiveLoading.context} focus={focus} onToast={pushToast}/>;
  })();

  const fullscreenTabs = ['symlinks','projects'];
  const needsPadding = !fullscreenTabs.includes(tab);

  return (
    <div className="app">
      <TopChrome
        scanning={scanning}
        lastScanAt={lastScanAt}
        onRefreshAll={refreshAll}
        theme={tweaks.theme}
        onToggleTheme={() => setTweaks({...tweaks, theme: tweaks.theme==='dark'?'light':'dark'})}
        onToggleTweaks={() => setTweaksOpen(v => !v)}
        tweaksOn={tweaksOpen}
      />
      <ActivityBar active={tab} onSelect={(t) => { setFocus(null); setTab(t); }} badges={badges}/>
      <div className="main">
        {header}
        <div className={`tab-body ${needsPadding ? '' : 'no-pad'}`} data-screen-label={`0${['overview','symlinks','projects','plugins','context'].indexOf(tab)+1} ${tabTitles[tab]}`}>
          {body}
        </div>
      </div>
      <ToastStack toasts={toasts} onDismiss={dismiss}/>
      <TweaksPanel open={tweaksOpen} tweaks={tweaks} setTweaks={setTweaks} onClose={() => setTweaksOpen(false)}/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
