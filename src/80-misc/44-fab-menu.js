  // ---------- フローティングメニュー ----------
  function openFlow() {
    mode = 'flow'; root.classList.remove('single'); showRoot(); updateLogBadge();
    if (!busy) setView(hasScan() ? (view || 'scan') : 'scan');
  }
  // 1つの作業だけを開く。まだ読み込んでいなければ、先に読み込んでから開く
  function openTask(v) {
    mode = v === 'scan' ? 'flow' : 'single';
    root.classList.toggle('single', mode === 'single'); showRoot(); updateLogBadge();
    if (busy) return;
    if (v !== 'scan' && !hasScan()) { afterScan = v; setView('scan'); if (!scanAsk()) runScan(); return; }
    setView(v);
  }
  function renderFab() {
    const seen = +(localStorage.getItem(LS_LOGSEEN) || 0);
    const errs = readLog().filter((x) => x.level === 'error' && x.t > seen).length;
    fab.innerHTML = `<button class="it" data-fab="tree"${busy ? ' disabled' : ''}><span class="ic">${IC.folder}</span><span class="t"><b>フォルダ一覧</b><small>見る・再生・名前の変更・移動</small></span></button>
      <button class="it pri" data-fab="flow"><span class="ic">${IC.dedupe}</span><span class="t"><b>Dedupe スキャン</b><small>重複・不要ファイルを読み込んで整理</small></span></button>
      <button class="it" data-fab="add"${busy ? ' disabled' : ''}><span class="ic">${IC.link}</span><span class="t"><b>リンク・マグネットを追加</b><small>追加する前に、もうあるか確かめる</small></span></button>
      ${errs ? `<div class="err">${IC.alert}<span>前回の操作でエラーが ${errs} 件あります</span><button data-fab="log">確認</button></div>` : ''}`;
  }
  const closeFab = () => fab.classList.remove('on');
  btn.addEventListener('click', (e) => { e.stopPropagation(); if (fab.classList.contains('on')) { closeFab(); return; } renderFab(); fab.classList.add('on'); });
  fab.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    const k = b.dataset.fab; closeFab();
    if (k === 'flow') { if (!busy && view === 'tree') view = 'scan'; openFlow(); }
    else if (k === 'log') showLog();
    else if (k === 'add') { const c = currentFolderId(); openAdd(isHomeId(c) ? 'DL' : c); }
    else if (k === 'tree') { mode = 'single'; root.classList.add('single'); showRoot(); updateLogBadge(); openTree(); }
    else openTask(k);
  });
  document.addEventListener('click', (e) => { if (fab.classList.contains('on') && !fab.contains(e.target) && e.target !== btn) closeFab(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeFab(); });
