  // ---------- 入口ボタンの位置（ドラッグで移動・端にくっつく・このブラウザに保存） ----------
  const LS_FABPOS = 'ppdup:fabpos:v1', FAB_M = 12;
  const fabKey = () => location.host;
  const fabSaved = () => { try { return (JSON.parse(localStorage.getItem(LS_FABPOS) || '{}') || {})[fabKey()] || null; } catch (e) { return null; } };
  const fabSave = (p) => { let all = {}; all = lsJson(LS_FABPOS, {}); if (p) all[fabKey()] = p; else delete all[fabKey()]; lsSetJson(LS_FABPOS, all); };
  // 既定の位置：PikPak の左メニューの空き（容量表示のすぐ上）。見つからなければ左下
  function fabDefault() {
    const W = innerWidth, H = innerHeight, bw = btn.offsetWidth || 120, bh = btn.offsetHeight || 42;
    let cap = null;
    const it = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (/\d[\d.]*\s*[TGM]B\s*\/\s*\d/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP) });
    for (let n = it.nextNode(); n; n = it.nextNode()) {
      const el = n.parentElement; if (!el || el.closest(UI_SEL)) continue;
      const r = el.getBoundingClientRect(); if (r.width && r.left < 360 && r.top > H * 0.4) { cap = r; break; }
    }
    if (cap) return { side: 'l', x: Math.max(FAB_M, cap.left), y: Math.max(FAB_M, cap.top - bh - 14), auto: true };
    return { side: 'l', x: FAB_M + 8, y: H - bh - FAB_M - 8, auto: true };
  }
  // 保存は「左右どちらの端か」と「上からの位置の割合」：画面の大きさが変わっても同じあたりに戻る
  function placeFab() {
    const s = fabSaved(), W = innerWidth, H = innerHeight, bw = btn.offsetWidth || 120, bh = btn.offsetHeight || 42;
    let x, y;
    if (s) { x = s.side === 'r' ? W - bw - FAB_M : FAB_M; y = s.fy * H; }
    else { const d = fabDefault(); x = d.x; y = d.y; }
    x = Math.max(FAB_M, Math.min(W - bw - FAB_M, x)); y = Math.max(FAB_M, Math.min(H - bh - FAB_M, y));
    btn.style.left = x + 'px'; btn.style.top = y + 'px'; btn.style.right = 'auto'; btn.style.bottom = 'auto';
    placeFabMenu();
  }
  // メニューはボタンのそばに（ボタンが下半分なら上へ、左にあれば左揃え）
  function placeFabMenu() {
    const r = btn.getBoundingClientRect(), W = innerWidth, H = innerHeight, fw = 320;
    fab.style.left = Math.max(FAB_M, Math.min(W - fw - FAB_M, r.left + r.width / 2 < W / 2 ? r.left : r.right - fw)) + 'px'; fab.style.right = 'auto';
    if (r.top + r.height / 2 > H / 2) { fab.style.top = 'auto'; fab.style.bottom = (H - r.top + 8) + 'px'; }
    else { fab.style.bottom = 'auto'; fab.style.top = (r.bottom + 8) + 'px'; }
    fab.style.maxHeight = Math.max(200, (r.top + r.height / 2 > H / 2 ? r.top : H - r.bottom) - 24) + 'px'; fab.style.overflowY = 'auto';
  }
  function setFabPos(p, msg) { fabSave(p); placeFab(); if (msg) status(msg); }
  let fabDrag = null, fabMoved = false;
  btn.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const r = btn.getBoundingClientRect();
    fabDrag = { id: e.pointerId, dx: e.clientX - r.left, dy: e.clientY - r.top, sx: e.clientX, sy: e.clientY, on: false }; fabMoved = false;
  });
  addEventListener('pointermove', (e) => {
    if (!fabDrag || e.pointerId !== fabDrag.id) return;
    if (!fabDrag.on) { if (Math.hypot(e.clientX - fabDrag.sx, e.clientY - fabDrag.sy) < 6) return; fabDrag.on = true; try { btn.setPointerCapture(e.pointerId); } catch (er) { /* 無視 */ } btn.classList.add('drag'); closeFab(); }
    const W = innerWidth, H = innerHeight;
    btn.style.left = Math.max(0, Math.min(W - btn.offsetWidth, e.clientX - fabDrag.dx)) + 'px';
    btn.style.top = Math.max(0, Math.min(H - btn.offsetHeight, e.clientY - fabDrag.dy)) + 'px';
  });
  const fabEnd = (e) => {
    if (!fabDrag || e.pointerId !== fabDrag.id) return;
    const was = fabDrag.on; fabDrag = null; btn.classList.remove('drag');
    if (!was) return;
    fabMoved = true;
    const r = btn.getBoundingClientRect();
    // 離したら一番近い左右の端にくっつく
    setFabPos({ side: r.left + r.width / 2 < innerWidth / 2 ? 'l' : 'r', fy: Math.max(0, r.top) / innerHeight });
  };
  addEventListener('pointerup', fabEnd, true); addEventListener('pointercancel', fabEnd, true);
  // ドラッグしたあとの click ではメニューを開かない
  btn.addEventListener('click', (e) => { if (fabMoved) { fabMoved = false; e.stopImmediatePropagation(); e.preventDefault(); } else placeFabMenu(); }, true);
  // 右クリックで置き場所をすぐ選ぶ
  btn.addEventListener('contextmenu', (e) => {
    e.preventDefault(); closeFab();
    let m = document.getElementById('pd-fabpos'); if (m) m.remove();
    m = document.createElement('div'); m.id = 'pd-fabpos';
    m.innerHTML = `<b>入口ボタンの位置</b>${[['def', '元の位置（左メニューの空き）'], ['lt', '左上へ'], ['lb', '左下へ'], ['rb', '右下へ'], ['rt', '右上へ']].map(([k, l]) => `<button data-fp="${k}">${l}</button>`).join('')}<small>ボタンはドラッグでも動かせます</small>`;
    document.body.appendChild(m);
    const r = btn.getBoundingClientRect();
    m.style.left = Math.max(8, Math.min(innerWidth - m.offsetWidth - 8, r.left)) + 'px';
    m.style.top = (r.top > innerHeight / 2 ? Math.max(8, r.top - m.offsetHeight - 8) : r.bottom + 8) + 'px';
    const off = (ev) => { if (!m.contains(ev.target)) { m.remove(); document.removeEventListener('mousedown', off, true); } };
    document.addEventListener('mousedown', off, true);
    m.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-fp]'); if (!b) return;
      const k = b.dataset.fp, bh = btn.offsetHeight || 42;
      m.remove(); document.removeEventListener('mousedown', off, true);
      if (k === 'def') setFabPos(null, '入口ボタンを元の位置に戻しました');
      else setFabPos({ side: k[0], fy: k[1] === 't' ? (FAB_M + 60) / innerHeight : (innerHeight - bh - FAB_M - 8) / innerHeight });
    });
  });
  addEventListener('resize', () => placeFab());
  placeFab();
  // PikPak の左メニューは読み込みのあとに出てくるので、既定の位置のときはしばらく置き直す
  { let n = 0; const tm = setInterval(() => { if (fabSaved() || ++n > 20) { clearInterval(tm); return; } if (!fabDrag) placeFab(); }, 1000); }
