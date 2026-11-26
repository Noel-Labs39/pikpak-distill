  // ---------- 簡易プレーヤーの操作（常に出る操作バー・マウスを乗せたらキー操作・ズーム） ----------
  const LS_QP = 'ppdup:qp:v1';
  const QP_DEF = { step: 5, big: 30, jl: 10, vol: 10, wheel: 'zoom', hover: true, bar: 'always', resume: true, hold: 2, tri: true, triNext: true, skimN: 16, skimSec: 4, fsMenu: 'bottom' };
  const qpCfg = () => { let c = {}; c = lsJson(LS_QP, {}); return { ...QP_DEF, ...c }; };
  const saveQpCfg = (p) => { const c = { ...qpCfg(), ...p }; lsSetJson(LS_QP, c); document.querySelectorAll('.qp-ui').forEach((u) => u.classList.toggle('qp-auto', c.bar === 'auto')); return c; };
  const QP_OPTS = {
    step: ['← / → の移動幅', [3, 5, 10, 15], (v) => v + ' 秒'],
    big: ['Shift + ← / →', [15, 30, 60], (v) => (v >= 60 ? v / 60 + ' 分' : v + ' 秒')],
    jl: ['J / L・±ボタンの移動幅', [5, 10, 15, 30], (v) => v + ' 秒'],
    vol: ['音量の刻み（↑ / ↓）', [5, 10, 20], (v) => v + '%'],
    wheel: ['マウスホイール', ['zoom', 'vol', 'seek'], (v) => ({ zoom: 'ズーム', vol: '音量', seek: 'シーク' })[v]],
    hover: ['マウスを乗せたらキー操作', [true, false], (v) => (v ? 'オン' : 'オフ（押したとき）')],
    bar: ['操作バー', ['always', 'auto'], (v) => (v === 'always' ? '常に表示' : 'マウスを乗せたとき')],
    resume: ['続きから再生', [true, false], (v) => (v ? 'オン' : 'オフ（いつも最初から）')],
    hold: ['長押しの速さ（画面・→ キー）', [1.5, 2, 3], (v) => v + '×'],
    tri: ['見ながら仕分けのバー', [true, false], (v) => (v ? '出す' : '出さない（キーだけ効く）')],
    triNext: ['仕分けたら次の動画へ', [true, false], (v) => (v ? 'すぐ次へ' : 'そのまま')],
    fsMenu: ['全画面のときのメニューの位置', ['bottom', 'top', 'float'], (v) => ({ bottom: '下に固定', top: '上に固定', float: 'フローティング（動かせる）' })[v]],
    skimN: ['ざっと見：何か所に分けるか', [8, 12, 16, 24], (v) => v + ' か所'],
    skimSec: ['ざっと見：1 か所の長さ', [2, 3, 4, 6], (v) => v + ' 秒'],
  };
  const qpSelect = (k, attr) => { const c = qpCfg(), [, vals, lab] = QP_OPTS[k]; return `<select ${attr} data-k="${k}">${vals.map((v) => `<option value="${v}"${c[k] === v ? ' selected' : ''}>${esc(lab(v))}</option>`).join('')}</select>`; };
  const qpVal = (k, s) => { const v = QP_OPTS[k][1].find((x) => String(x) === s); return v === undefined ? QP_DEF[k] : v; };
  const QP_IC = { gear: IC.gear, play: IC.play, pause: IC.pause };
  // ---- 全画面のときのメニュー（操作バー・仕分け・キー操作）の位置：下に固定・上に固定・フローティング ----
  const LS_FSPOS = 'ppdup:fsmenu:v1';
  let fsHideT = 0, fsDrag = false;
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement || null;
  function fsPoke() {
    const fe = fsEl(); if (!fe || fe.dataset.qpfs !== 'float') return;
    const u = fe.querySelector('.qp-ui'); if (!u) return;
    u.classList.remove('qp-fshide'); clearTimeout(fsHideT);
    fsHideT = setTimeout(() => { if (!fsDrag && !u.matches(':hover') && !fe.querySelector('.qp-set:not([hidden])')) u.classList.add('qp-fshide'); }, 3000);
  }
  function applyFsMenu() {
    clearTimeout(fsHideT);
    document.querySelectorAll('[data-qpfs]').forEach((el) => { delete el.dataset.qpfs; el.querySelectorAll('.qp-ui').forEach((u) => { u.style.transform = ''; u.classList.remove('qp-fshide'); }); });
    const fe = fsEl(); if (!fe || !fe.querySelector || !fe.querySelector('.qp-ui')) return;
    const mode = qpCfg().fsMenu; fe.dataset.qpfs = mode;
    if (mode === 'float') { const q = lsJson(LS_FSPOS, {}); fe.querySelectorAll('.qp-ui').forEach((u) => { u.style.transform = `translate(${+q.x || 0}px,${+q.y || 0}px)`; }); fsPoke(); }
  }
  ['fullscreenchange', 'webkitfullscreenchange'].forEach((n) => document.addEventListener(n, applyFsMenu));
  ['mousemove', 'keydown', 'touchstart'].forEach((n) => document.addEventListener(n, fsPoke, true));
  // 簡易プレーヤーの「前へ（P）・次へ（N）」：どの画面でも同じ作りにする（list＝動画の並び、go＝その動画へ移る処理）
  const qpSeq = (list, id, go) => { const i = list.findIndex((x) => x.id === id); return { prev: i > 0 ? () => go(list[i - 1].id) : null, next: i >= 0 && i < list.length - 1 ? () => go(list[i + 1].id) : null }; };
  let qpActive = null;
  function qpSetActive(P) {
    if (qpActive === P) return;
    if (qpActive) qpActive.root.forEach((el) => el.classList.remove('qp-on'));
    qpActive = P; if (P) P.root.forEach((el) => el.classList.add('qp-on'));
  }
  // video を包んだ枠（stage）と、下の操作バー（ui）を作る
  function qpAttach(box, v, ui, opt) {
    const stage = box.querySelector('.qp-stage');
    stage.insertAdjacentHTML('beforeend', '<div class="qp-osd" hidden></div><div class="qp-mini" hidden><i></i></div><div class="qp-keys" hidden></div><div class="qp-notes"></div><div class="qp-hold" hidden></div>');
    const osd = stage.querySelector('.qp-osd'), mini = stage.querySelector('.qp-mini'), mr = mini.querySelector('i');
    const P = { v, root: [box, ui], opt, z: 1, tx: 0, ty: 0 };
    v._qp = P;
    // ---- ズーム（マウスの位置を中心に。動画の枠の大きさは変えない） ----
    const apply = () => {
      const W = stage.clientWidth, H = stage.clientHeight;
      P.tx = Math.min(0, Math.max(W - W * P.z, P.tx)); P.ty = Math.min(0, Math.max(H - H * P.z, P.ty));
      v.style.transform = P.z > 1.001 ? `translate(${P.tx}px,${P.ty}px) scale(${P.z})` : '';
      stage.classList.toggle('qp-zoomed', P.z > 1.001);
      mini.hidden = !(P.z > 1.001);
      if (P.z > 1.001) { mr.style.cssText = `left:${-P.tx / (W * P.z) * 100}%;top:${-P.ty / (H * P.z) * 100}%;width:${100 / P.z}%;height:${100 / P.z}%`; }
      const zb = ui.querySelector('[data-qp=zoom]'); if (zb) zb.textContent = '🔍 ' + Math.round(P.z * 100) + '%';
    };
    const zoomAt = (nz, px, py, show = true) => {
      nz = Math.max(1, Math.min(4, nz));
      if (px === undefined) { px = stage.clientWidth / 2; py = stage.clientHeight / 2; }
      P.tx = px - (px - P.tx) * nz / P.z; P.ty = py - (py - P.ty) * nz / P.z; P.z = nz;
      if (nz <= 1.001) { P.z = 1; P.tx = 0; P.ty = 0; }
      apply(); if (show) flash('🔍 ' + Math.round(P.z * 100) + '%');
      if (P.z > 1.001) { zHintDone(); hideZHint(); }
    };
    // ---- 拡大縮小の案内（最初の 3 回だけ・3 秒で消える・一度使えばもう出さない） ----
    const ZH_KEY = 'ppdup:zoomhint:v1';
    const zh = (() => { return lsJson(ZH_KEY, { n: 0, used: false }); })();
    const zSave = () => { lsSetJson(ZH_KEY, zh); };
    const zHintDone = () => { if (!zh.used) { zh.used = true; zSave(); } };
    let zhEl = null, zhT = 0;
    const hideZHint = () => { clearTimeout(zhT); if (zhEl) { const el = zhEl; zhEl = null; el.classList.remove('on'); setTimeout(() => el.remove(), 450); } };
    if (!zh.used && zh.n < 3) {
      zh.n++; zSave();
      const wz = qpCfg().wheel === 'zoom';
      zhEl = document.createElement('div'); zhEl.className = 'qp-zhint';
      zhEl.textContent = `🔍 ピンチ・${wz ? 'ホイール' : 'Ctrl＋ホイール'}で拡大縮小（ダブルクリック・R で元に戻す）`;
      stage.appendChild(zhEl); requestAnimationFrame(() => zhEl && zhEl.classList.add('on'));
      zhT = setTimeout(hideZHint, 3000);
      ['pointerdown', 'keydown'].forEach((t) => stage.addEventListener(t, hideZHint, { once: true }));
      v.addEventListener('play', () => { if (v.currentTime > 0.5) hideZHint(); });
    }
    P.zoomAt = zoomAt; P.zoomReset = () => { zoomAt(1, 0, 0, false); flash('🔍 100%'); };
    const local = (e) => { const r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    P.lastXY = null;
    stage.addEventListener('mousemove', (e) => { P.lastXY = local(e); });
    stage.addEventListener('wheel', (e) => {
      const c = qpCfg(); const [x, y] = local(e);
      // トラックパッドのピンチは ctrlKey 付きのホイールとして届く：設定に関係なくズーム
      if (e.ctrlKey || c.wheel === 'zoom') { e.preventDefault(); zoomAt(P.z * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), x, y); }
      else if (c.wheel === 'vol') { e.preventDefault(); P.vol(e.deltaY < 0 ? c.vol : -c.vol); }
      else if (c.wheel === 'seek') { e.preventDefault(); P.seek(e.deltaY < 0 ? c.step : -c.step); }
    }, { passive: false });
    // タッチ：2 本指でピンチ（2 本指のまん中を中心に）・拡大中は 1 本指／2 本指で移動
    let pin = null, pan = null;
    stage.addEventListener('touchstart', (e) => {
      qpSetActive(P);
      if (e.touches.length === 2) {
        const r = stage.getBoundingClientRect(), [a, b] = e.touches;
        const mx = (a.clientX + b.clientX) / 2 - r.left, my = (a.clientY + b.clientY) / 2 - r.top;
        pin = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1, z: P.z, cx: (mx - P.tx) / P.z, cy: (my - P.ty) / P.z }; pan = null; e.preventDefault();
      } else if (e.touches.length === 1 && P.z > 1.001) { pan = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx: P.tx, ty: P.ty }; }
      else if (e.touches.length === 1 && !v.paused) { clearTimeout(P.tHold); const t0 = e.touches[0]; P.tHoldXY = [t0.clientX, t0.clientY]; P.tHold = setTimeout(() => { P.tHeld = true; P.holdOn(); }, 450); }
    }, { passive: false });
    stage.addEventListener('touchmove', (e) => { if (P.tHoldXY && e.touches[0] && Math.abs(e.touches[0].clientX - P.tHoldXY[0]) + Math.abs(e.touches[0].clientY - P.tHoldXY[1]) > 10) clearTimeout(P.tHold); }, { passive: true });
    stage.addEventListener('contextmenu', (e) => { if (P.tHeld || P.held) e.preventDefault(); });
    stage.addEventListener('touchmove', (e) => {
      if (pin && e.touches.length === 2) {
        e.preventDefault();
        const r = stage.getBoundingClientRect(), [a, b] = e.touches;
        const mx = (a.clientX + b.clientX) / 2 - r.left, my = (a.clientY + b.clientY) / 2 - r.top;
        P.z = Math.max(1, Math.min(4, pin.z * Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / pin.d));
        P.tx = mx - pin.cx * P.z; P.ty = my - pin.cy * P.z; apply();
      } else if (pan && e.touches.length === 1) { e.preventDefault(); P.tx = pan.tx + e.touches[0].clientX - pan.x; P.ty = pan.ty + e.touches[0].clientY - pan.y; apply(); }
    }, { passive: false });
    stage.addEventListener('touchend', (e) => { clearTimeout(P.tHold); P.tHoldXY = null; if (P.tHeld) { P.tHeld = false; P.holdOff(); e.preventDefault(); } if (e.touches.length < 2) pin = null; if (!e.touches.length) pan = null; if (P.z <= 1.001) zoomAt(1, 0, 0, false); });
    // マウス：拡大中はドラッグで移動。押すだけなら再生・一時停止、ダブルクリックで拡大を戻す
    let drag = null, clickT = null;
    stage.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || e.target.closest('.qp-mini')) return;
      const sp = ui.querySelector('.qp-set'); if (sp && !sp.hidden) { sp.hidden = true; e.preventDefault(); return; } // 設定の枠が開いているときは、閉じるだけ
      drag = { x: e.clientX, y: e.clientY, tx: P.tx, ty: P.ty, moved: false };
      // 押したままにすると、離すまで速く再生（拡大中は移動に使うので除く）
      const holdT = P.z > 1.001 || v.paused ? null : setTimeout(() => { if (drag && !drag.moved) { drag.held = true; P.holdOn(); } }, 450);
      const mv = (ev) => { if (!drag) return; const dx = ev.clientX - drag.x, dy = ev.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true; if (P.z > 1.001 && drag.moved) { P.tx = drag.tx + dx; P.ty = drag.ty + dy; apply(); } };
      const up = () => { clearTimeout(holdT); window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); const moved = drag && drag.moved, held = drag && drag.held; drag = null; if (held) { P.holdOff(); return; } if (!moved) { clearTimeout(clickT); clickT = setTimeout(() => P.toggle(), 220); } };
      window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
      e.preventDefault();
    });
    stage.addEventListener('dblclick', (e) => { e.preventDefault(); clearTimeout(clickT); if (P.z > 1.001) P.zoomReset(); else P.full(); });
    // ---- 画面中央の一瞬の表示 ----
    let osdT = null;
    const flash = (t, ms = 700) => { osd.textContent = t; osd.hidden = false; clearTimeout(osdT); osdT = setTimeout(() => { osd.hidden = true; }, ms); };
    // キー操作の一覧（隠れがちな操作をここで見せる）
    const keysEl = stage.querySelector('.qp-keys');
    const KEYS = [['Space / K', '再生・一時停止'], ['I', '作品情報（作品名・販売者・女優）'], ['← / →', '戻る・進む（→ 長押しで速く再生）'], ['Shift＋← / →', '大きく戻る・進む'], ['J / L', '10 秒戻る・進む'], [', / .', '1 コマ戻る・進む'], ['0〜9', '0%〜90% の位置へ'], ['↑ / ↓', '音量'], ['M', '消音・解除'], ['[ / ] / \\', '速度を下げる・上げる・1×'], ['Z / X / R', '拡大・縮小・元に戻す（ピンチ・ホイールでも）'], ['F', '全画面'], ['V', 'ざっと見（バーのマスで場所を選べる）'], ['G', 'シーン'], ['A / B', '飛ばす区間の始め・終わり'], ['Y / D / S', '残す・消す候補・スター'], ['P / N', '前の動画・次の動画'], ['Enter', 'ざっと見中：ここから再生／それ以外：外部プレーヤー'], ['?', 'この一覧を出す・閉じる']];
    keysEl.innerHTML = KEYS.map(([k, t]) => `<kbd>${esc(k)}</kbd><span>${esc(t)}</span>`).join('');
    P.keys = () => { keysEl.hidden = !keysEl.hidden; };
    // 「キー操作 ON ・ ?」の表示は、動画に重ねず、動画の下の行に置く（動画を見るのに邪魔にならず、押し間違いで再生・停止もしない）
    const hintEl = document.createElement('div'); hintEl.className = 'qp-hint';
    hintEl.innerHTML = '<button class="qp-badge" title="押すとキー操作の一覧（? キーでも）">⌨ キー操作 ON ・ ?</button>';
    ui.appendChild(hintEl);
    // フローティングのときだけ出る「動かすつまみ」
    const grip = document.createElement('div'); grip.className = 'qp-grip';
    grip.innerHTML = '<span>⠿ ここをドラッグして動かせます</span><button type="button">位置を戻す</button>';
    ui.insertBefore(grip, ui.firstChild);
    grip.querySelector('button').addEventListener('click', (e) => { e.stopPropagation(); lsSetJson(LS_FSPOS, {}); document.querySelectorAll('.qp-ui').forEach((u) => { u.style.transform = 'translate(0px,0px)'; }); });
    grip.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      e.preventDefault(); fsDrag = true;
      const q = lsJson(LS_FSPOS, {}), x0 = +q.x || 0, y0 = +q.y || 0, sx = e.clientX, sy = e.clientY;
      const mv = (ev) => { const x = x0 + ev.clientX - sx, y = y0 + ev.clientY - sy; ui.style.transform = `translate(${x}px,${y}px)`; ui._fsPos = { x, y }; };
      const up = () => { document.removeEventListener('pointermove', mv, true); document.removeEventListener('pointerup', up, true); fsDrag = false; if (ui._fsPos) lsSetJson(LS_FSPOS, ui._fsPos); fsPoke(); };
      document.addEventListener('pointermove', mv, true); document.addEventListener('pointerup', up, true);
    });
    hintEl.querySelector('.qp-badge').addEventListener('click', (e) => { e.stopPropagation(); P.keys(); });
    keysEl.addEventListener('click', (e) => { e.stopPropagation(); keysEl.hidden = true; });
    P.flash = flash;
    // ---- 押している間だけ速く ----
    const hold = stage.querySelector('.qp-hold');
    P.holdOn = () => { if (P.held) return; P.held = { r: v.playbackRate }; const r = qpCfg().hold; v.playbackRate = r; hold.textContent = `▶▶ ${r}×`; hold.hidden = false; };
    P.holdOff = () => { if (!P.held) return; v.playbackRate = P.held.r || getRate(); P.held = null; hold.hidden = true; };
    // ---- 知らせの帯（「続きから」「飛ばしました」など。押せるボタン付き） ----
    const notes = stage.querySelector('.qp-notes');
    P.note = (text, acts = [], ms = 4000) => {
      const n = document.createElement('div'); n.className = 'qp-note';
      n.innerHTML = `<span>${esc(text)}</span>${acts.map((a, i) => `<button data-qn="${i}">${esc(a[0])}</button>`).join('')}`;
      n.addEventListener('mousedown', (e) => e.stopPropagation());
      n.addEventListener('click', (e) => { const b = e.target.closest('[data-qn]'); if (!b) return; e.stopPropagation(); acts[+b.dataset.qn][1](); n.remove(); });
      notes.appendChild(n); while (notes.children.length > 2) notes.firstChild.remove();
      setTimeout(() => n.remove(), ms);
      return n;
    };
    // ---- 飛ばす区間（A で始め、B で終わり。次からその区間を自動で飛ばす） ----
    const mk = opt.media || null;
    P.markA = null; let ignore = null, selfSeek = false;
    P.drawSkips = () => {
      const tr = ui.querySelector('.pd-sk > .sktr'); if (!tr || !mk) return;
      tr.querySelectorAll('.skz,.ska').forEach((z) => z.remove());
      const d = v.duration; if (!d || !isFinite(d)) return;
      mk.skips().forEach(([a, b]) => tr.insertAdjacentHTML('beforeend', `<i class="skz" style="left:${a / d * 100}%;width:${Math.max(0.4, (b - a) / d * 100)}%"></i>`));
      if (P.markA != null) tr.insertAdjacentHTML('beforeend', `<i class="ska" style="left:${P.markA / d * 100}%"></i>`);
      const sl = ui.querySelector('[data-qp=sklist]'); if (sl) { const n = mk.skips().length; sl.hidden = !n; sl.textContent = `区間 ${n}`; }
      const ab = ui.querySelector('[data-qp=ab]'); if (ab) { ab.textContent = P.markA != null ? '✂ B（終わり）' : '✂ A–B'; ab.classList.toggle('on', P.markA != null); }
    };
    P.mark = (which) => {
      if (!mk) return;
      const t = v.currentTime || 0;
      if (which === 'A' || (which !== 'B' && P.markA == null)) { P.markA = t; flash('✂ 始め ' + fmtClock(t)); if (P.aNote) P.aNote.remove(); P.aNote = P.note(`飛ばす区間の始め ${fmtClock(t)}。終わりの位置で B を押してください`, [['やめる', () => { P.markA = null; P.drawSkips(); }]], 5000); }
      else if (P.markA != null) {
        const a = Math.min(P.markA, t), b = Math.max(P.markA, t); P.markA = null; if (P.aNote) { P.aNote.remove(); P.aNote = null; }
        if (b - a < 1) { flash('短すぎます'); P.drawSkips(); return; }
        mk.addSkip(a, b); ignore = [a, b]; flash(`✂ ${fmtClock(a)}–${fmtClock(b)} を飛ばします`);
      } else { flash('先に A で始めを決めてください'); }
      P.drawSkips();
    };
    // ---- シーン（一定の間隔で画面を取って右に並べる。押すとその場面へ） ----
    const scn = { el: null, gr: null, times: [], run: 0 };
    const sceneTimes = () => { const d = v.duration; if (!d || !isFinite(d)) return []; const n = Math.max(8, Math.min(30, Math.round(d / 120))); return Array.from({ length: n }, (_, i) => Math.round(d * i / n)); };
    P.drawTicks = () => {
      const tr = ui.querySelector('.pd-sk > .sktr'); if (!tr) return;
      tr.querySelectorAll('.skt').forEach((z) => z.remove());
      const d = v.duration; if (!scn.el || !d || !isFinite(d)) return;
      scn.times.forEach((t) => { if (t > 0) tr.insertAdjacentHTML('beforeend', `<i class="skt" style="left:${t / d * 100}%"></i>`); });
    };
    const sceneCur = () => {
      if (!scn.el) return; const t = v.currentTime; let k = 0; scn.times.forEach((x, i) => { if (t >= x) k = i; });
      scn.el.querySelectorAll('[data-sc]').forEach((b) => b.classList.toggle('cur', +b.dataset.sc === k));
    };
    P.scenes = (on) => {
      if (on === undefined) on = !scn.el;
      const btn = ui.querySelector('[data-qp=scene]');
      if (!on) { scn.run++; if (scn.gr) { scn.gr.close(); scn.gr = null; } if (scn.el) { scn.el._grab = null; scn.el.remove(); scn.el = null; } if (btn) btn.classList.remove('on'); P.drawTicks(); return; }
      if (scn.el || !opt.src) return;
      scn.times = sceneTimes(); if (!scn.times.length) { flash('長さが分かってから開けます'); return; }
      const el = document.createElement('div'); el.className = 'qp-scn';
      el.innerHTML = `<div class="qp-scn-h"><b>シーン</b><small>${scn.times.length} か所</small><button data-scx title="シーンを閉じる（G）" aria-label="閉じる">${IC.x}</button></div><div class="qp-scn-l">${scn.times.map((t, i) => `<button data-sc="${i}"><span class="im"><i>…</i></span><span>${fmtClock(t)}</span></button>`).join('')}</div>`;
      el.addEventListener('mousedown', (e) => e.stopPropagation());
      el.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (e.target.closest('[data-scx]')) { P.scenes(false); return; }
        const b = e.target.closest('[data-sc]'); if (!b) return; v.currentTime = scn.times[+b.dataset.sc]; sceneCur();
      });
      stage.appendChild(el); scn.el = el; if (btn) btn.classList.add('on');
      P.drawTicks(); sceneCur();
      // 画像は軽い画質から 1 枚ずつ作る（閉じたらやめる）
      const my = ++scn.run;
      try { scn.gr = makeGrabber(lightSrc(opt.src.S) || opt.src.x, opt.src.S); el._grab = scn.gr; } catch (e) { scn.gr = null; }
      (async () => {
        for (let i = 0; i < scn.times.length; i++) {
          if (my !== scn.run || !scn.gr) return;
          const im = el.querySelector(`[data-sc="${i}"] .im`);
          try { const c = await scn.gr.grab(scn.times[i] + (i ? 0 : 1), 240); if (my !== scn.run) return; c.className = ''; im.innerHTML = ''; im.appendChild(c); }
          catch (e) { if (my !== scn.run) return; im.innerHTML = '<i>×</i>'; if (i === 0) { el.querySelectorAll('.im i').forEach((x) => { x.textContent = '—'; }); el.querySelector('.qp-scn-h small').textContent = '画像を作れませんでした（時間だけ表示）'; return; } }
        }
      })();
    };
    v.addEventListener('timeupdate', sceneCur);
    if (mk) {
      v.addEventListener('loadedmetadata', () => P.drawSkips());
      v.addEventListener('durationchange', () => P.drawSkips());
      // 自分で区間の中へ移ったときは飛ばさない（見たくて戻した場合）
      v.addEventListener('seeking', () => { if (selfSeek) { selfSeek = false; return; } const t = v.currentTime; ignore = mk.skips().find(([a, b]) => t >= a && t < b) || null; });
      v.addEventListener('timeupdate', () => {
        const t = v.currentTime; if (ignore && (t < ignore[0] - 0.5 || t >= ignore[1])) ignore = null;
        const z = mk.skips().find(([a, b]) => t >= a && t < b - 0.3);
        if (!z || (ignore && ignore[0] === z[0] && ignore[1] === z[1]) || P.markA != null) return;
        selfSeek = true; v.currentTime = z[1]; ignore = null;
        P.note(`⤼ ${fmtClock(z[0])}–${fmtClock(z[1])} を飛ばしました`, [['戻す', () => { selfSeek = true; ignore = z; v.currentTime = z[0]; }]], 3500);
      });
    }
    // ---- 操作 ----
    P.toggle = () => { if (v.paused) { v.play().catch(() => {}); flash('▶'); } else { v.pause(); flash('⏸'); } };
    P.seek = (d) => { if (!v.duration) return; v.currentTime = Math.max(0, Math.min(v.duration - 0.05, v.currentTime + d)); flash((d < 0 ? '◀◀ ' : '▶▶ ') + (d < 0 ? '-' : '+') + (Math.abs(d) >= 60 ? Math.abs(d) / 60 + ' 分' : Math.abs(d) + ' 秒')); };
    P.vol = (d) => { v.muted = false; v.volume = Math.max(0, Math.min(1, Math.round((v.volume * 100 + d)) / 100)); flash('🔊 ' + Math.round(v.volume * 100) + '%'); };
    P.full = () => {
      if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); return; }
      if (opt.full) { opt.full(); return; }
      goFullEl(box.parentElement || box, v).catch(() => {});
    };
    // ---- 操作バー ----
    const jl = qpCfg().jl;
    const ctl = document.createElement('div'); ctl.className = 'qp-ctl';
    ctl.innerHTML = `${opt.prev ? `<button data-qp="prev" title="前の動画（P）" aria-label="前の動画">${IC.prev}</button>` : ''}<button data-qp="play" title="再生・一時停止（Space / K）" aria-label="再生・一時停止">${IC.pause}</button>${opt.next ? `<button data-qp="next" title="次の動画（N）" aria-label="次の動画">${IC.next}</button>` : ''}<button data-qp="back" title="戻る（J）">-${jl}</button><button data-qp="fwd" title="進む（L）">+${jl}</button><span class="qp-t" data-qp="time">00:00 / 00:00</span><span class="qp-sp"></span><button data-qp="mute" title="消音・解除（M）" aria-label="消音">${IC.vol}</button><input type="range" data-qp="vol" min="0" max="100" value="${Math.round(v.volume * 100)}" aria-label="音量">${rateSelect()}<button data-qp="skim" title="ざっと見（V）：何か所かを少しずつ順に流して、中身をすぐ確かめる">⏩ ざっと見</button>${opt.src ? '<button data-qp="scene" title="シーン（G）">▦ シーン</button>' : ''}${opt.media ? '<button data-qp="ab" title="飛ばす区間（A で始め・B で終わり）">✂ A–B</button><button data-qp="sklist" title="この動画の飛ばす区間の一覧（消すのもここから）" hidden></button>' : ''}<button data-qp="zoom" title="ズーム（ホイール・ピンチ・Z / X、押すと 100% に戻す）">🔍 100%</button><button data-qp="gear" title="簡易プレーヤーの設定・飛ばす区間の一覧" aria-label="設定">${QP_IC.gear}</button><button data-qp="full" title="全画面（F）" aria-label="全画面">${IC.full}</button><div class="qp-set" hidden></div>`;
    ui.insertBefore(ctl, ui.querySelector('.qp-hint')); // 並び：シークバー → 操作バー → 見ながら仕分け → キー操作
    const q = (k) => ctl.querySelector(`[data-qp=${k}]`), setPanel = ctl.querySelector('.qp-set');
    const syncUi = () => {
      // timeupdate のたびに中身を作り直すと、押している最中にボタンの中身が入れ替わってクリックが無効になる
      const pb = q('play'), ps = v.paused ? 'play' : 'pause'; if (pb.dataset.st !== ps) { pb.dataset.st = ps; pb.innerHTML = QP_IC[ps]; }
      q('time').textContent = `${fmtClock(v.currentTime || 0)} / ${fmtClock(v.duration || 0)}`;
      const mb = q('mute'), ms = v.muted || !v.volume ? 'mute' : 'vol'; if (mb.dataset.st !== ms) { mb.dataset.st = ms; mb.innerHTML = IC[ms]; }
      const r = q('vol'); if (document.activeElement !== r) r.value = v.muted ? 0 : Math.round(v.volume * 100);
    };
    ['play', 'pause', 'timeupdate', 'durationchange', 'volumechange', 'loadedmetadata'].forEach((ev) => v.addEventListener(ev, syncUi));
    const renderSet = () => {
      const sk = mk ? mk.skips() : [];
      setPanel.innerHTML = `<b>簡易プレーヤーの設定</b>${Object.keys(QP_OPTS).map((k) => `<label><span>${esc(QP_OPTS[k][0])}</span>${qpSelect(k, 'data-qpset')}</label>`).join('')}${mk ? `<b style="margin-top:6px" data-sk>この動画の飛ばす区間</b>${sk.length ? sk.map(([a, b], i) => `<label><span>${fmtClock(a)} – ${fmtClock(b)}</span><button data-qp="skdel" data-i="${i}" title="この区間を消す">✕ 消す</button></label>`).join('') : '<small>ありません（A・B キーか ✂ で作れます）</small>'}` : ''}<small>右上の ⚙ 設定 →「再生」にも同じ項目があります</small>`;
    };
    ctl.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-qp]'); if (!b) return;
      const k = b.dataset.qp; const c = qpCfg();
      if (k === 'play') P.toggle(); else if (k === 'back') P.seek(-c.jl); else if (k === 'fwd') P.seek(c.jl);
      else if (k === 'prev' && opt.prev) opt.prev(); else if (k === 'next' && opt.next) opt.next();
      else if (k === 'mute') { v.muted = !v.muted; flash(v.muted ? '🔇 消音' : '🔊 ' + Math.round(v.volume * 100) + '%'); }
      else if (k === 'zoom') P.zoomReset(); else if (k === 'full') P.full();
      else if (k === 'ab') P.mark();
      else if (k === 'scene') P.scenes();
      else if (k === 'skim') P.skim();
      else if (k === 'sklist') { renderSet(); setPanel.hidden = false; const h = setPanel.querySelector('[data-sk]'); if (h) h.scrollIntoView({ block: 'nearest' }); }
      else if (k === 'skdel' && mk) { mk.delSkip(+b.dataset.i); P.drawSkips(); renderSet(); }
      else if (k === 'gear') { if (setPanel.hidden) renderSet(); setPanel.hidden = !setPanel.hidden; }
    });
    ctl.addEventListener('click', (e) => { if (!setPanel.hidden && !e.target.closest('.qp-set, [data-qp=gear], [data-qp=sklist], [data-qp=skdel]')) setPanel.hidden = true; }, true);
    ctl.addEventListener('input', (e) => { if (e.target.dataset.qp === 'vol') { v.volume = +e.target.value / 100; v.muted = !+e.target.value; } });
    ctl.addEventListener('change', (e) => {
      const t = e.target; if (t.dataset.qpset === undefined) return;
      saveQpCfg({ [t.dataset.k]: qpVal(t.dataset.k, t.value) }); if (t.dataset.k === 'fsMenu') applyFsMenu();
      if (t.dataset.k === 'jl') document.querySelectorAll('.qp-ctl').forEach((x) => { const n = qpCfg().jl; const bb = x.querySelector('[data-qp=back]'), ff = x.querySelector('[data-qp=fwd]'); if (bb) bb.textContent = '-' + n; if (ff) ff.textContent = '+' + n; });
      if (t.dataset.k === 'tri' || t.dataset.k === 'triNext') document.querySelectorAll('video').forEach((x) => { if (x._qp && x._qp.drawTri) x._qp.drawTri(); });
      if (document.getElementById('pd-set')) renderSettings();
    });
    // ---- マウスを乗せたら（設定がオフなら押したら）キー操作の対象にする ----
    [box, ui].forEach((el) => {
      el.addEventListener('mouseenter', () => { if (qpCfg().hover) qpSetActive(P); });
      el.addEventListener('mousedown', () => qpSetActive(P));
    });
    // ---- 見ながら仕分け（Y 残す／D 消す候補／S スター） ----
    if (mk && mk.setTri) {
      const tb = document.createElement('div'); tb.className = 'qp-tri';
      ui.insertBefore(tb, ui.querySelector('.qp-hint'));
      P.drawTri = () => {
        const t = mk.tri(), st = mk.starred();
        tb.hidden = !qpCfg().tri;
        tb.innerHTML = `<b>見ながら仕分け</b><button data-qt="keep" class="k${t === 'keep' ? ' on' : ''}" title="残す（Y）。もう一度押すと外す"><kbd>Y</kbd>残す</button><button data-qt="del" class="d${t === 'del' ? ' on' : ''}" title="消す候補（D）。すぐには消さず、左メニューの「消す候補」にまとめます"><kbd>D</kbd>消す候補</button><button data-qt="star" class="s${st ? ' on' : ''}" title="スター（S）。PikPak のスターを付ける・外す"><kbd>S</kbd>${st ? '★' : '☆'} スター</button>${opt.prev ? '<button data-qt="prev" title="前の動画（P）"><kbd>P</kbd>前へ</button>' : ''}${opt.next ? '<button data-qt="next" title="次の動画（N）"><kbd>N</kbd>次へ</button>' : ''}<span class="sp"></span><small>${qpCfg().triNext && opt.next ? '印を付けたら次の動画へ' : ''}</small>`;
      };
      P.tri = async (k) => {
        if (k === 'star') { try { const on = await mk.star(); flash(on ? '★ スターを付けました' : '☆ スターを外しました'); } catch (e) { if (e.session) { handleErr(e, view); return; } flash('スターを変えられませんでした'); } P.drawTri(); return; }
        const nv = mk.setTri(k); P.drawTri();
        flash(nv === 'keep' ? '✓ 残す' : nv === 'del' ? '🗑 消す候補に入れました' : '印を外しました');
        if (nv && qpCfg().triNext && opt.next) setTimeout(() => { if (v.isConnected) opt.next(); }, 450);
      };
      tb.addEventListener('click', (e) => { const b = e.target.closest('[data-qt]'); if (!b) return; const k = b.dataset.qt; if (k === 'next') { if (opt.next) opt.next(); } else if (k === 'prev') { if (opt.prev) opt.prev(); } else P.tri(k); });
      P.drawTri();
    }
    // ---- ざっと見（1 本を何か所かに分けて、少しずつ順に流す。気になったら Enter でその位置から普通に再生） ----
    const sk = { on: false, i: 0, timer: null, muted: false };
    const skimEl = document.createElement('div'); skimEl.className = 'qp-skim'; skimEl.hidden = true; stage.appendChild(skimEl);
    const skimDraw = () => { const N = qpCfg().skimN; skimEl.innerHTML = `<span>ざっと見 ${sk.i + 1} / ${N} か所目 ・ Enter でここから再生 ・ V でやめる</span><div>${Array.from({ length: N }, (_, j) => `<i data-sj="${j}" title="${j + 1} か所目${v.duration ? '（' + fmtClock(v.duration * (j + 0.5) / N) + '）' : ''}から" class="${j < sk.i ? 'p' : j === sk.i ? 'c' : ''}"></i>`).join('')}</div>`; };
    // バーのマスを押すと、その場所からざっと見を続ける
    skimEl.addEventListener('click', (e) => { const t = e.target.closest('[data-sj]'); if (!t || !sk.on) return; e.stopPropagation(); sk.i = +t.dataset.sj; skimStep(); });
    const skimStep = () => {
      clearTimeout(sk.timer); if (!sk.on || !v.isConnected) return;
      const c = qpCfg(), N = c.skimN, d = v.duration;
      if (!d || !isFinite(d)) { sk.timer = setTimeout(skimStep, 300); return; }
      if (sk.i >= N) { P.skim(false); if (opt.next && qpCfg().triNext) { flash('ざっと見 おわり → 次の動画へ'); opt.next(); } else flash('ざっと見 おわり'); return; }
      v.currentTime = Math.min(d - 1, d * (sk.i + 0.5) / N); v.play().catch(() => {}); skimDraw();
      sk.timer = setTimeout(() => { sk.i++; skimStep(); }, c.skimSec * 1000 / Math.max(1, v.playbackRate / 1));
    };
    P.skim = (on) => {
      if (on === undefined) on = !sk.on;
      const b = ui.querySelector('[data-qp=skim]');
      if (on && !sk.on) {
        sk.on = true; sk.i = 0; sk.muted = v.muted; v.muted = true; skimEl.hidden = false; if (b) b.classList.add('on'); skimStep();
        if (!sk.muted) { flash('🔇 ざっと見の間は消音です（音量ボタンで出せます）', 1600); const mb = ui.querySelector('[data-qp=mute]'); if (mb) { mb.classList.remove('qp-blink'); void mb.offsetWidth; mb.classList.add('qp-blink'); setTimeout(() => mb.classList.remove('qp-blink'), 1600); } }
      }
      else if (!on && sk.on) { sk.on = false; clearTimeout(sk.timer); v.muted = sk.muted; skimEl.hidden = true; if (b) b.classList.remove('on'); }
    };
    P.skimOn = () => sk.on;
    ui.classList.toggle('qp-auto', qpCfg().bar === 'auto');
    window.addEventListener('resize', apply);
    syncUi();
    if (!qpActive || !qpActive.v.isConnected) qpSetActive(P);
    return P;
  }
  // プレーヤーの外を押したら、キー操作の対象から外す（フォルダ一覧の ← → などを横取りし続けないため）
  document.addEventListener('mousedown', (e) => {
    if (!qpActive) return;
    if (!qpActive.v.isConnected) { qpActive = null; return; }
    const pvb = qpActive.root[0] && qpActive.root[0].closest('.pv'); // 作品情報の枠など、同じ外枠の中を押したときは対象のまま
    if (!qpActive.root.some((el) => el.contains(e.target)) && !(pvb && pvb.contains(e.target))) { const sp = qpActive.root[1] && qpActive.root[1].querySelector('.qp-set'); if (sp) sp.hidden = true; qpSetActive(null); }
  }, true);
  window.addEventListener('keydown', (e) => {
    const P = qpActive; if (!P) return;
    if (!P.v.isConnected) { qpActive = null; return; }
    const t = e.target; if (t && (t.tagName === 'INPUT' && t.type !== 'range' && t.type !== 'checkbox' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    if (e.metaKey || e.ctrlKey || e.altKey || document.getElementById('pd-dlg')) return;
    const c = qpCfg(), k = e.key, v = P.v;
    const done = () => { e.preventDefault(); e.stopImmediatePropagation(); };
    if (k === 'Escape') {
      // Esc は、どの簡易プレーヤーでも同じ順：設定の枠・キー一覧 → （全画面ならブラウザが全画面を終える）→ プレーヤーを閉じる
      const sp = P.root[1] && P.root[1].querySelector('.qp-set'); if (sp && !sp.hidden) { done(); sp.hidden = true; return; }
      const ke = P.root[0] && P.root[0].querySelector('.qp-keys'); if (ke && !ke.hidden) { done(); ke.hidden = true; return; }
      const pvb = P.root[0] && P.root[0].closest('.pv'), pi = pvb && pvb.querySelector('.pv-info'); if (pi) { done(); pi.remove(); return; }
      if (document.fullscreenElement || document.webkitFullscreenElement) return;
      if (P.opt.close) { done(); qpSetActive(null); P.opt.close(); return; }
    }
    if (k === 'i' || k === 'I') { const pvb = P.root[0] && P.root[0].closest('.pv'), ib = pvb && pvb.querySelector('[data-pvinfob]'); if (ib) { done(); ib.click(); return; } }
    if (k === ' ' || k === 'k' || k === 'K') { done(); P.toggle(); }
    else if (k === 'ArrowLeft') { done(); P.seek(-(e.shiftKey ? c.big : c.step)); }
    else if (k === 'ArrowRight') {
      done();
      // 押したままにすると速く再生、すぐ離せば今までどおり進む（離したときに進む）
      if (e.shiftKey) { P.seek(c.big); return; }
      if (e.repeat) return;
      if (v.paused) { P.seek(c.step); return; }
      clearTimeout(P.kHold); P.kDown = true; P.kHeld = false;
      P.kHold = setTimeout(() => { if (P.kDown) { P.kHeld = true; P.holdOn(); } }, 350);
    }
    else if (k === 'a' || k === 'A') { done(); P.mark('A'); }
    else if ((k === 'g' || k === 'G') && P.scenes) { done(); P.scenes(); }
    else if ((k === 'v' || k === 'V') && P.skim) { done(); P.skim(); }
    else if (k === '?' && P.keys) { done(); P.keys(); }
    else if (k === 'Enter' && P.skimOn && P.skimOn()) { done(); P.skim(false); v.play().catch(() => {}); P.flash('▶ ここから再生'); }
    else if ((k === 'y' || k === 'Y') && P.tri) { done(); P.tri('keep'); }
    else if ((k === 'd' || k === 'D') && P.tri) { done(); P.tri('del'); }
    else if ((k === 's' || k === 'S') && P.tri) { done(); P.tri('star'); }
    else if (k === 'b' || k === 'B') { done(); P.mark('B'); }
    else if (k === 'j' || k === 'J') { done(); P.seek(-c.jl); }
    else if (k === 'l' || k === 'L') { done(); P.seek(c.jl); }
    else if (k === ',' || k === '.') { done(); if (!v.paused) v.pause(); v.currentTime = Math.max(0, v.currentTime + (k === ',' ? -1 : 1) / 30); P.flash(k === ',' ? '◀ 1 コマ' : '1 コマ ▶'); }
    else if (k === 'ArrowUp') { done(); P.vol(c.vol); }
    else if (k === 'ArrowDown') { done(); P.vol(-c.vol); }
    else if (k === 'm' || k === 'M') { done(); v.muted = !v.muted; P.flash(v.muted ? '🔇 消音' : '🔊 ' + Math.round(v.volume * 100) + '%'); }
    else if (/^[0-9]$/.test(k) && !e.shiftKey) { done(); if (v.duration) { v.currentTime = v.duration * (+k) / 10; P.flash(k + '0%'); } }
    else if (k === ']' || k === '[' || k === '\\') { done(); P.flash(setRate(k === '\\' ? 1 : getRate() + (k === ']' ? 0.25 : -0.25)) + '×'); }
    else if (k === 'f' || k === 'F') { done(); P.full(); }
    else if (k === 'z' || k === 'Z' || k === 'x' || k === 'X') { done(); const xy = P.lastXY || []; P.zoomAt(P.z * (k.toLowerCase() === 'z' ? 1.25 : 0.8), xy[0], xy[1]); }
    else if (k === 'r' || k === 'R') { done(); P.zoomReset(); }
    else if ((k === 'n' || k === 'N') && P.opt.next) { done(); P.opt.next(); }
    else if ((k === 'p' || k === 'P') && P.opt.prev) { done(); P.opt.prev(); }
    else if (k === 'Enter' && P.opt.ext) { done(); v.pause(); P.opt.ext(); }
  }, true);
  window.addEventListener('keyup', (e) => {
    const P = qpActive; if (!P || e.key !== 'ArrowRight' || !P.kDown) return;
    P.kDown = false; clearTimeout(P.kHold);
    e.preventDefault(); e.stopImmediatePropagation();
    if (P.kHeld) { P.kHeld = false; P.holdOff(); } else P.seek(qpCfg().step);
  }, true);
  // 自分のシークバー（動画の下）：マウスを乗せるとその位置の画面を小さく出す。押すとその位置へ
  function attachSeekbar(box, v, x, S) {
    const bar = document.createElement('div'); bar.className = 'pd-sk';
    bar.innerHTML = '<div class="sktr"><i class="skb"></i><i class="skp"></i></div><div class="tip"><canvas></canvas><b></b></div>';
    box.appendChild(bar);
    const tip = bar.querySelector('.tip'), cv = tip.querySelector('canvas'), lb = tip.querySelector('b'), pl = bar.querySelector('.skp'), bf = bar.querySelector('.skb');
    let gr = null, want = -1, busyG = false, cache = new Map();
    const upd = () => { const d = v.duration || 0; pl.style.width = d ? (v.currentTime / d * 100) + '%' : '0'; try { bf.style.width = d && v.buffered.length ? (v.buffered.end(v.buffered.length - 1) / d * 100) + '%' : '0'; } catch (e) { /* 無視 */ } };
    v.addEventListener('timeupdate', upd); v.addEventListener('progress', upd);
    const tAt = (e) => { const r = bar.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * (v.duration || 0); };
    const draw = (c) => { cv.width = c.width; cv.height = c.height; cv.getContext('2d').drawImage(c, 0, 0); cv.style.display = ''; };
    const pump = async () => {
      if (busyG || want < 0) return;
      const t = want, k = Math.round(t / 5); want = -1;
      if (cache.has(k)) { draw(cache.get(k)); pump(); return; }
      busyG = true;
      try { if (!gr) { gr = makeGrabber(lightSrc(S) || x, S); bar._grab = gr; } const c = await gr.grab(k * 5, 200); cache.set(k, c); if (cache.size > 200) cache.delete(cache.keys().next().value); if (!tip.hidden) draw(c); }
      catch (e) { cv.style.display = 'none'; lb.dataset.err = '1'; }
      busyG = false; pump();
    };
    bar.addEventListener('mousemove', (e) => {
      const t = tAt(e), r = bar.getBoundingClientRect();
      tip.hidden = false; lb.textContent = fmtClock(t);
      tip.style.left = Math.max(0, Math.min(r.width - 210, e.clientX - r.left - 105)) + 'px';
      if (!lb.dataset.err) { const k = Math.round(t / 5); if (cache.has(k)) draw(cache.get(k)); want = t; pump(); }
    });
    bar.addEventListener('mouseleave', () => { tip.hidden = true; want = -1; });
    bar.addEventListener('click', (e) => { v.currentTime = tAt(e); });
    // ドラッグでも移動
    bar.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return; e.preventDefault(); try { bar.setPointerCapture(e.pointerId); } catch (er) { /* 無視 */ }
      v.currentTime = tAt(e); upd();
      const mv = (ev) => { v.currentTime = tAt(ev); upd(); };
      const up = () => { bar.removeEventListener('pointermove', mv); bar.removeEventListener('pointerup', up); bar.removeEventListener('pointercancel', up); };
      bar.addEventListener('pointermove', mv); bar.addEventListener('pointerup', up); bar.addEventListener('pointercancel', up);
    });
    tip.hidden = true; cv.style.display = 'none';
  }
  function closeGrab(scope) { (scope ? [scope] : []).forEach((el) => { if (!el) return; el.querySelectorAll('*').forEach((n) => { if (n._grab) { n._grab.close(); n._grab = null; } }); if (el._grab) { el._grab.close(); el._grab = null; } }); }
  // ---- コマ一覧（1 本、または重複の 2 本を並べる） ----
  let framesRun = 0;
  function openFrames(ids) {
    ids = [...new Set(ids)].filter((id) => fileById(id)).slice(0, 2);
    if (!ids.length) return;
    if (!ensureSession(view)) return;
    closeFrames();
    // ほかの動画（プレビュー・再生画面）を止めて片付ける。iPhone は動画を同時に 1 本しか動かせず、コマ作りが途中で止まるため
    closeQL(); closePlayer();
    document.querySelectorAll('video').forEach((x) => { try { x.pause(); } catch (e) { /* 無視 */ } });
    const run = ++framesRun;
    let n = 16; try { n = +localStorage.getItem(LS_FRAMES) || 16; } catch (e) { /* 無視 */ }
    if (![9, 16, 25].includes(n)) n = 16;
    const d = mkEl('pd-frames');
    const kept = (id) => { if (view !== 'dup') return ''; const g = visibleGroups().find((x) => x.items.some((f) => f.id === id)); if (!g) return ''; const i = g.items.findIndex((f) => f.id === id); return stateOf(g.items[i], i) === 'del' ? 'del' : 'keep'; };
    d.innerHTML = `<div class="fr-box" role="dialog" aria-label="コマ一覧"><div class="fr-hd"><b>コマ一覧</b><span class="note">${ids.length > 1 ? '同じ位置のコマを左右に並べています' : ''}</span><span class="sp"></span><span class="seg">${[9, 16, 25].map((k) => `<button data-frn="${k}" class="${k === n ? 'on' : ''}">${k} コマ</button>`).join('')}</span><button class="x" data-frclose title="閉じる（Esc）" aria-label="閉じる">${IC.x}</button></div>
      <div class="fr-cols" style="grid-template-columns:repeat(${ids.length},minmax(0,1fr))">${ids.map((id) => { const f = fileById(id), k = kept(id); return `<div class="fr-col" data-frid="${esc(id)}"><div class="fr-meta">${k ? `<span class="fr-tag ${k}">${k === 'keep' ? '残す' : '削除'}</span>` : ''}<b title="${esc(f.name)}">${esc(f.name)}</b><span class="note raw" data-frinfo>${fmt(f.size)}</span></div><div class="fr-grid" style="grid-template-columns:repeat(${Math.sqrt(n)},1fr)">${Array.from({ length: n }, (_, i) => `<button class="fr-c" data-fri="${i}"><span class="t"></span></button>`).join('')}</div><div class="fr-msg note" data-frmsg>動画を読み込んでいます…</div><div class="fr-acts"><button data-frplay disabled>▶ 選んだコマから再生</button><button data-frsave disabled>画像で保存</button></div></div>`; }).join('')}</div>
      <div class="fr-ft note">コマは動画を読み込みながら順に出ます（1 本 10〜30 秒ほど）。コマを押して選び、「選んだコマから再生」（またはコマをダブルクリック）でその位置から再生します。</div></div>`;
    if (LANG === 'en') d.querySelectorAll('*').forEach(trNode);
    d.addEventListener('mousedown', (e) => { if (e.target === d) closeFrames(); });
    d.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.frclose !== undefined) { closeFrames(); return; }
      if (b.dataset.frn) { lsSet(LS_FRAMES, b.dataset.frn); openFrames(ids); return; }
      const col = b.closest('.fr-col'); if (!col) return;
      if (b.dataset.fri !== undefined) { col.querySelectorAll('.fr-c.on').forEach((x) => x.classList.remove('on')); b.classList.add('on'); col.querySelector('[data-frplay]').disabled = !b.dataset.t; return; }
      if (b.dataset.frplay !== undefined) { const on = col.querySelector('.fr-c.on'); const t = on ? +on.dataset.t : 0; framesPlay(col.dataset.frid, t); return; }
      if (b.dataset.frsave !== undefined) saveSheet(col);
    });
    // コマをダブルクリックすると、その位置から再生
    d.addEventListener('dblclick', (e) => { const c = e.target.closest('.fr-c'); if (!c || !c.dataset.t) return; e.preventDefault(); framesPlay(c.closest('.fr-col').dataset.frid, +c.dataset.t); });
    ids.forEach(async (id) => {
      const col = d.querySelector(`.fr-col[data-frid="${CSS.escape(id)}"]`);
      const msg = col.querySelector('[data-frmsg]');
      let gr = null;
      try {
        const S = await loadSources(id);
        if (run !== framesRun) return;
        const x = lightSrc(S); if (!x) throw new Error('再生用リンクを取得できませんでした');
        gr = makeGrabber(x, S); col._grab = gr;
        await gr.ready;
        const dur = gr.duration;
        col.querySelector('[data-frinfo]').textContent = `${gr.v.videoWidth ? '' : ''}${fmt(fileById(id).size)}・${fmtClock(dur)}`;
        const cells = [...col.querySelectorAll('.fr-c')];
        for (let i = 0; i < cells.length; i++) {
          if (run !== framesRun) return;
          const t = dur * (i + 0.5) / cells.length;
          msg.textContent = tr(`コマを作っています… ${i + 1} / ${cells.length}`);
          // 1 コマ取れなくても止めない：少しずらしてもう一度、それでもだめなら空けて次へ
          let c = null, tt = t;
          for (const dt of [0, 1.5]) { tt = Math.min(dur - 0.5, t + dt); try { c = await Promise.race([gr.grab(tt, 320), sleep(15000).then(() => { throw new Error('時間切れ'); })]); break; } catch (e) { if (e.message === 'closed' || run !== framesRun) return; log('warn', `コマを取れませんでした（${fmtClock(tt)}）：${e.message}`, fileById(id).name); } }
          cells[i].dataset.t = String(tt); cells[i].querySelector('.t').textContent = fmtClock(tt);
          if (c) cells[i].prepend(c); else cells[i].classList.add('ng');
        }
        msg.textContent = ''; col.querySelector('[data-frsave]').disabled = false;
        const on = col.querySelector('.fr-c.on'); if (on) col.querySelector('[data-frplay]').disabled = false;
        log('info', 'コマ一覧を作成：' + fileById(id).name);
      } catch (err) {
        if (err.session) { closeFrames(); handleErr(err, view); return; }
        if (run === framesRun) msg.textContent = tr('コマを作れませんでした：') + err.message;
      } finally { if (gr) { gr.close(); col._grab = null; } }
    });
  }
  // コマ一覧を閉じてから少し待って再生する（コマ作りの動画を片付け終わる前に再生を始めると、Safari・アプリ版で落ちることがあるため）
  function framesPlay(id, t) { closeFrames(); setTimeout(() => playFile(id, { t }), 250); }
  function closeFrames() { framesRun++; const d = document.getElementById('pd-frames'); if (d) { closeGrab(d); d.remove(); } }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.getElementById('pd-frames')) { e.preventDefault(); e.stopImmediatePropagation(); closeFrames(); } }, true);
  // コマを 1 枚の画像にまとめて保存（時刻つき）
  function saveSheet(col) {
    const cs = [...col.querySelectorAll('.fr-c canvas')]; if (!cs.length) return;
    const n = Math.round(Math.sqrt(col.querySelectorAll('.fr-c').length)), w = cs[0].width, h = cs[0].height, pad = 6, head = 36;
    const c = document.createElement('canvas'); c.width = n * w + (n + 1) * pad; c.height = head + Math.ceil(cs.length / n) * (h + pad) + pad;
    const g = c.getContext('2d'); g.fillStyle = '#111318'; g.fillRect(0, 0, c.width, c.height);
    const name = col.querySelector('.fr-meta b').textContent;
    g.fillStyle = '#e6e8ee'; g.font = '600 15px system-ui,sans-serif'; g.fillText(name + '   ' + col.querySelector('[data-frinfo]').textContent, pad + 2, 24);
    cs.forEach((x, i) => {
      const cx = pad + (i % n) * (w + pad), cy = head + Math.floor(i / n) * (h + pad);
      g.drawImage(x, cx, cy);
      const t = x.parentElement.querySelector('.t').textContent;
      g.font = '600 12px ui-monospace,monospace'; g.fillStyle = '#000a'; g.fillRect(cx + 4, cy + h - 20, g.measureText(t).width + 8, 16); g.fillStyle = '#fff'; g.fillText(t, cx + 8, cy + h - 8);
    });
    c.toBlob((b) => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name.replace(/\.[^.]+$/, '') + '_コマ一覧.jpg'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }, 'image/jpeg', 0.9);
  }
