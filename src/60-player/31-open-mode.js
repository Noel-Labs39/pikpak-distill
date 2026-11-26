  // ---------- 開き方（ポップアップ／全画面） ----------
  // ポップアップは PikPak の画面の上に重ねる小さな画面。見出しをつかんで移動、右下で大きさを変える。位置と大きさは覚えておく
  const LS_OPEN = 'ppdup:open:v1', LS_POPGEOM = 'ppdup:popgeom:v1', LS_POPBAN = 'ppdup:popban:v1';
  // 開き方：選んでいなければ全画面（おすすめ）
  const openPref = () => { return lsGet(LS_OPEN) === 'pop' ? 'pop' : 'full'; };
  const setOpenPref = (v) => { lsSet(LS_OPEN, v === 'full' ? 'full' : 'pop'); if (document.getElementById('pd-set')) renderSettings(); };
  let winMode = openPref();
  function popGeom() {
    let g = null; g = lsJson(LS_POPGEOM, null);
    const W = window.innerWidth, H = window.innerHeight;
    const w = Math.min(W, Math.max(560, g && g.w ? g.w : Math.min(1040, W - 80))), h = Math.min(H, Math.max(380, g && g.h ? g.h : Math.min(720, H - 80)));
    const x = Math.min(Math.max(0, g && g.x != null ? g.x : W - w - 40), W - w), y = Math.min(Math.max(0, g && g.y != null ? g.y : 40), H - h);
    return { x, y, w, h };
  }
  const savePopGeom = (g) => { lsSetJson(LS_POPGEOM, g); };
  function applyWin() {
    const pop = winMode === 'pop';
    root.classList.toggle('pop', pop);
    let ban = true; try { ban = localStorage.getItem(LS_POPBAN) !== '0'; } catch (e) { /* 無視 */ }
    root.classList.toggle('ban', pop && ban);
    if (pop) { const g = popGeom(); Object.assign(root.style, { left: g.x + 'px', top: g.y + 'px', width: g.w + 'px', height: g.h + 'px' }); }
    else ['left', 'top', 'width', 'height'].forEach((k) => root.style.removeProperty(k));
  }
  function setWin(m) { winMode = m === 'full' ? 'full' : 'pop'; applyWin(); if (document.getElementById('pd-set')) renderSettings(); }
  function showRoot() { if (!root.classList.contains('on')) { winMode = isPhone() ? 'full' : openPref(); setTimeout(() => { if (meta && Date.now() - meta.at >= 864e5) rsAsk('stale'); }, 400); } applyWin(); applyNav(); root.classList.add('on'); checkRotate(); checkUpdate(); libPeek(); setTimeout(() => { syncAsk(); if (Date.now() - syncAt > 60e3) syncNow('開いたとき'); }, 1500); }
  // 見出しをつかんで移動
  root.addEventListener('mousedown', (e) => {
    if (winMode !== 'pop' || e.button !== 0 || !e.target.closest('.brand') || e.target.closest('button,input,select,label,a,.pd-quota,.seg')) return;
    e.preventDefault();
    const r = root.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
    root.classList.add('dragging');
    const mv = (ev) => { root.style.left = Math.min(Math.max(0, ev.clientX - dx), window.innerWidth - 120) + 'px'; root.style.top = Math.min(Math.max(0, ev.clientY - dy), window.innerHeight - 48) + 'px'; };
    const up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); root.classList.remove('dragging'); const b = root.getBoundingClientRect(); savePopGeom({ x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) }); };
    document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
  });
  // 右下で大きさを変えたら覚えておく
  if (window.ResizeObserver) {
    let rt = null;
    new ResizeObserver(() => { if (winMode !== 'pop' || !root.classList.contains('on')) return; clearTimeout(rt); rt = setTimeout(() => { const b = root.getBoundingClientRect(); if (b.width && b.height) savePopGeom({ x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) }); }, 300); }).observe(root);
  }
  window.addEventListener('resize', () => { if (winMode === 'pop' && root.classList.contains('on')) applyWin(); });
