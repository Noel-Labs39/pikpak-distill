  // ---------- 起動時に全画面で開く・画面ごとの URL（#dd/…）：戻る・再読み込み・ブックマークで同じ画面へ ----------
  const LS_AUTO = 'ppdup:autostart:v1';
  const autoStart = () => { return lsGet(LS_AUTO) === '1'; };
  let ddApplying = false;
  function ddState() {
    if (!root.classList.contains('on')) return '';
    if (libSt) return 'lib/' + libSt.tab;
    if (view === 'tree') return 'tree/' + (hasScan() ? (tree.base || '') : (tree.base || ''));
    return (mode === 'single' ? 'task/' : 'step/') + (view || 'scan');
  }
  function ddFromUrl() { const m = /#dd\/(.*)$/.exec(location.hash); return m ? decodeURIComponent(m[1]) : null; }
  function ddSync() {
    if (ddApplying) return;
    const s = ddState(), cur = ddFromUrl() || '';
    if (s === cur) return;
    const base = location.pathname + location.search;
    // PikPak の画面（Vue Router）が持っている履歴の情報はそのまま引き継ぐ
    try { history.pushState(history.state, '', s ? base + '#dd/' + s.split('/').map(encodeURIComponent).join('/') : base); } catch (e) { /* 無視 */ }
  }
  function ddKick() { clearTimeout(ddKick.t); ddKick.t = setTimeout(ddSync, 30); }
  function ddApply(s) {
    ddApplying = true;
    try {
      if (!s) { if (root.classList.contains('on')) { if (libSt) closeLib(); root.classList.remove('on'); } return; }
      if (!sessionValid() || busy) return;
      const i = s.indexOf('/'), k = i < 0 ? s : s.slice(0, i), v = i < 0 ? '' : s.slice(i + 1);
      if (k === 'lib') { if (!root.classList.contains('on')) openFlow(); if (!libSt || libSt.tab !== v) openLib(v); return; }
      if (libSt) closeLib();
      if (k === 'tree') {
        mode = 'single'; root.classList.add('single'); showRoot(); updateLogBadge();
        if (v && v !== tree.base) { tree.base = v; saveTree(); }
        if (view !== 'tree') openTree(); else if (hasScan()) setBase(v);
      } else if (k === 'task') openTask(v || 'scan');
      else { openFlow(); if (hasScan() && v && view !== v) setView(v); }
    } finally { ddApplying = false; if (s && autoStart() && root.classList.contains('on') && winMode !== 'full') setWin('full'); }
  }
  addEventListener('popstate', () => { const s = ddFromUrl() || ''; if (s !== ddState()) ddApply(s); });
  function ddStart() {
    let resuming = false; try { const r = JSON.parse(sessionStorage.getItem(SS_RESUME) || 'null'); resuming = !!r && Date.now() - r.at < 2 * 60 * 1000; } catch (e) { resuming = false; }
    if (resuming) return;
    const s = ddFromUrl();
    const go = () => {
      if (!sessionValid()) return;
      if (s) ddApply(s); else if (autoStart() && /^\/drive/.test(location.pathname)) { ddApplying = true; try { openFlow(); } finally { ddApplying = false; } ddKick(); }
      else return;
      if (winMode !== 'full') setWin('full');
    };
    setTimeout(go, 300);
  }
  updateLogBadge();
  renderLangBtn(); applyTheme();
  if (LANG === 'en') document.querySelectorAll(UI_SEL).forEach(trNode);
  resumeAfterReload();
  ddStart();

  window.PPDup = { visHooks, addJunkSweep, buildCleanPlan, buildSortPlan, buildRenamePlan, get folders() { return folders; }, scanApi, buildGroups, render, get files() { return files; }, set files(v) { files = v; } };
})();
