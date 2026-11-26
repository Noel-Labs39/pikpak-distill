  // ---------- 見比べ：重複の 2 本を左右に並べて、いっしょに再生する ----------
  //   シーク・再生／停止・速度は 2 本で連動（オフにもできる）。音は片方だけ。ずれたら「位置をそろえる」
  let cmpRun = 0;
  function closeCompare() {
    cmpRun++; plStop('cmpA'); plStop('cmpB');
    const d = document.getElementById('pd-cmp'); if (!d) return;
    unloadMedia(d); d.remove();
  }
  function openCompare(ids) {
    ids = ids.filter(Boolean).slice(0, 2); if (ids.length < 2) return;
    if (!ensureSession(view)) return;
    closeQL(); closePlayer(); closeCompare(); closeCtx();
    const run = ++cmpRun;
    const F = ids.map((id) => fileById(id) || { id, name: (mediaGet(id) || {}).name || id, size: (mediaGet(id) || {}).size || 0 });
    const d = mkEl('pd-cmp');
    const st = { link: true, audio: 0, busy: false };
    const pane = (f, i) => `<div class="cm-p" data-cmi="${i}"><div class="cm-ph"><span class="cm-tag">${i ? '右' : '左'}</span><b title="${esc(f.name)}">${esc(f.name)}</b></div><div class="cm-b"><div class="pl-msg">再生の準備中…</div></div><div class="cm-pf"><span class="cm-inf">${fmt(f.size)}<span data-cminf="${i}"></span></span><span class="sp"></span><button class="cm-keep" data-cmkeep="${i}" title="こちらを残して、もう片方を「削除する」にする（重複の判断に記録）">こちらを残す</button></div></div>`;
    d.innerHTML = `<div class="cm"><div class="cm-h"><b>見比べ</b><span class="note">2 本をいっしょに再生</span><span class="sp"></span>
      <button data-cm="both" title="2 本とも 再生／一時停止（Space）">${IC.play}<span>2 本とも</span></button>
      <button data-cm="sync" title="右を左と同じ位置にそろえる">⇆ 位置をそろえる</button>
      <button data-cm="link" class="on" title="シーク・再生／停止・速度を 2 本で連動する（押すと切り替え）">🔗 連動</button>
      <button data-cm="audio" title="音を出す方を切り替える">${IC.vol}<span>音：左</span></button>
      <button class="x" data-cm="close" title="閉じる（Esc）" aria-label="閉じる">${IC.x}</button></div>
      <div class="cm-ps">${F.map(pane).join('')}</div></div>`;
    const P = [];
    const vids = () => P.map((x) => x && x.v).filter(Boolean);
    let guard = false;
    const other = (v) => vids().find((x) => x !== v);
    const link = (v) => {
      if (v._cmLinked) return; v._cmLinked = true;
      const pass = (fn) => { if (!st.link || guard) return; const o = other(v); if (!o) return; guard = true; try { fn(o); } finally { setTimeout(() => { guard = false; }, 0); } };
      v.addEventListener('play', () => pass((o) => { if (o.paused) o.play().catch(() => {}); }));
      v.addEventListener('pause', () => pass((o) => { if (!o.paused) o.pause(); }));
      v.addEventListener('seeking', () => pass((o) => { if (Math.abs(o.currentTime - v.currentTime) > 0.3) o.currentTime = v.currentTime; }));
      v.addEventListener('ratechange', () => pass((o) => { if (o.playbackRate !== v.playbackRate) o.playbackRate = v.playbackRate; }));
    };
    const applyAudio = () => { vids().forEach((v, i) => { v.muted = i !== st.audio; }); const b = d.querySelector('[data-cm=audio] span'); if (b) b.textContent = '音：' + (st.audio ? '右' : '左'); };
    F.forEach((f, i) => {
      const box = d.querySelector(`[data-cmi="${i}"] .cm-b`);
      P[i] = playerCore(box, f.id, {
        slot: i ? 'cmpB' : 'cmpA', name: f.name, pick: 'light',
        alive: () => run === cmpRun && document.body.contains(d),
        qp: { ext: () => openExternal(f.id, '', f.name) },
        onMeta: (v) => { const e = d.querySelector(`[data-cminf="${i}"]`); if (e) e.textContent = v.videoWidth ? ` ・ ${v.videoWidth}×${v.videoHeight} ・ ${fmtClock(v.duration || 0)}` : ''; link(v); applyAudio(); },
        fail: (x, why) => { if (!box.querySelector('.pl-err')) box.insertAdjacentHTML('beforeend', `<div class="pl-msg pl-err">再生できませんでした${why ? `（${esc(why)}）` : ''}</div>`); },
      });
      P[i].ready.catch((err) => { if (err && err.session) { closeCompare(); handleErr(err, view); } else box.innerHTML = `<div class="pl-msg pl-err">${err && err.gone ? '' : '再生用リンクを取得できませんでした：'}${esc((err && err.message) || err)}</div>`; });
    });
    // 2 本とも準備ができたら、同じ位置（続きの位置があれば左に合わせる）から始める
    Promise.all(P.map((x) => x.ready.catch(() => null))).then(() => { if (run !== cmpRun) return; const [a, b] = vids(); if (a && b) { const go = () => { b.currentTime = a.currentTime; applyAudio(); }; if (a.readyState > 0 && b.readyState > 0) go(); else setTimeout(go, 800); } });
    const keep = (i) => {
      const k = F[i].id, del = F[1 - i].id;
      decision[k] = 'keep'; decision[del] = 'del'; saveDecision();
      mediaPut(k, { tri: 'keep' }); mediaPut(del, { tri: 'del' }, true);
      d.querySelectorAll('.cm-p').forEach((x, j) => { x.classList.toggle('keep', j === i); x.classList.toggle('del', j !== i); });
      status(`見比べ：「${F[i].name}」を残し、もう片方を削除する方にしました（重複の判断に記録。削除は整理の「重複」ステップか「消す候補」から）`);
      log('info', '見比べで残す方を決めました', F[i].name);
      if (view === 'dup' && typeof renderDup === 'function') renderDup();
    };
    d.addEventListener('click', (e) => {
      if (e.target === d) { closeCompare(); return; }
      const b = e.target.closest('button'); if (!b) return;
      const k = b.dataset.cm;
      if (b.dataset.cmkeep !== undefined) { keep(+b.dataset.cmkeep); return; }
      if (k === 'close') closeCompare();
      else if (k === 'both') { const vs = vids(); const play = vs.some((v) => v.paused); guard = true; vs.forEach((v) => { if (play) v.play().catch(() => {}); else v.pause(); }); setTimeout(() => { guard = false; }, 0); }
      else if (k === 'sync') { const [a, bb] = vids(); if (a && bb) { guard = true; bb.currentTime = a.currentTime; setTimeout(() => { guard = false; }, 0); status('右を左と同じ位置にそろえました'); } }
      else if (k === 'link') { st.link = !st.link; b.classList.toggle('on', st.link); status(st.link ? '2 本を連動します' : '2 本を別々に操作します'); }
      else if (k === 'audio') { st.audio = 1 - st.audio; applyAudio(); }
    });
    const onKey = (e) => {
      if (!document.body.contains(d)) { removeEventListener('keydown', onKey, true); return; }
      if (e.key === 'Escape' && !document.fullscreenElement) { e.preventDefault(); e.stopImmediatePropagation(); closeCompare(); removeEventListener('keydown', onKey, true); }
    };
    addEventListener('keydown', onKey, true);
    log('info', '見比べを開きました', F.map((f) => f.name).join(' ／ '));
  }
  // 動画を止めて読み込みをやめる（シークバー用の影の動画も）
  // 再生の位置を記録する（5 秒ごと・止めたとき・閉じたとき）。最後の 5% まで見たら「見終わった」
  function savePos(P, v, now) {
    if (!P || !v || P.k < 0) return;
    // 閉じるときは先に動画が外されていることがあるので、最後に見えていた位置を使う
    const live = !!v.currentSrc && v.readyState > 0;
    const t = live ? v.currentTime || 0 : P.lastT || 0, dur = live && isFinite(v.duration) ? v.duration : P.dur || 0;
    if (!dur) return;
    if (t < 3 && !now) return;
    const done = t >= dur * 0.95 || t >= dur - 20;
    mediaPut(P.id, { pos: done ? 0 : Math.floor(t), dur: Math.round(dur), done: done || (!!(mediaGet(P.id) || {}).done && t < 10) }, now);
  }
  function trackPos(P, v) {
    let last = 0;
    v.addEventListener('timeupdate', () => { if (P.dead) return; if (v.currentSrc && v.readyState > 0) { P.lastT = v.currentTime; if (isFinite(v.duration)) P.dur = v.duration; } const n = Date.now(); if (n - last > 5000) { last = n; savePos(P, v); } });
    v.addEventListener('pause', () => { if (!P.dead && v.currentSrc && v.readyState > 0) { P.lastT = v.currentTime; savePos(P, v, true); } });
    v.addEventListener('ended', () => { if (!P.dead) mediaPut(P.id, { pos: 0, done: true }, true); });
  }
  // 飛ばす区間の読み書き（操作バーから使う）
  // 見ながら仕分け：残す（keep）／消す候補（del）。重複の判断の記録にも同じ値を書く（重複の組にあれば、その判断にも効く）
  function setTri(id, v) {
    const r = mediaGet(id) || {}; const nv = r.tri === v ? null : v; // 同じ印をもう一度押したら外す
    mediaPut(id, { tri: nv }, true);
    if (nv) decision[id] = nv; else delete decision[id];
    saveDecision();
    return nv;
  }
  async function toggleStar(id) {
    const r = mediaGet(id) || {}; const on = !r.star;
    await api(on ? '/files:star' : '/files:unstar', { method: 'POST', body: JSON.stringify({ ids: [id] }) });
    mediaPut(id, { star: on }, true); return on;
  }
  const mediaHooks = (id) => ({
    tri: () => (mediaGet(id) || {}).tri || null,
    setTri: (v) => setTri(id, v),
    star: () => toggleStar(id),
    starred: () => !!(mediaGet(id) || {}).star,
    skips: () => ((mediaGet(id) || {}).skip || []).slice().sort((a, b) => a[0] - b[0]),
    addSkip: (a, b) => { const r = mediaGet(id) || {}; const l = (r.skip || []).filter((z) => z[1] <= a || z[0] >= b); l.push([Math.round(a * 10) / 10, Math.round(b * 10) / 10]); mediaPut(id, { skip: l.sort((x, y) => x[0] - y[0]) }, true); },
    delSkip: (i) => { const l = ((mediaGet(id) || {}).skip || []).slice().sort((a, b) => a[0] - b[0]); l.splice(i, 1); mediaPut(id, { skip: l }, true); },
  });
  function unloadMedia(scope) {
    if (!scope) return;
    closeGrab(scope);
    scope.querySelectorAll('.pd-sk').forEach((b) => { if (b._grab) { b._grab.close(); b._grab = null; } });
    scope.querySelectorAll('video').forEach((v) => { try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) { /* 無視 */ } });
  }
  async function playFile(id, opt = {}) {
    const f = fileById(id); if (!f) return;
    // プレビューで再生中なら、その位置から続ける
    const qv = document.querySelector('#pd-ql video'); const fromT = opt.t || (qv && treeCur === id ? qv.currentTime : 0);
    closeQL(); closeCtx();
    if (!ensureSession('tree')) return;
    stopHls();
    // 次・前へ移るたびに、前の動画（とシークバー用の影の動画）を確実に止めて片付ける。
    // 片付けずに続けて再生すると、裏で動画がいくつも読み込まれ続けて、画面ごと落ちていた
    const run = ++playRun;
    let d = document.getElementById('pd-player');
    if (d) unloadMedia(d);
    if (!d) {
      d = mkEl('pd-player');
      d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-pl=close]')) closePlayer(); });
    }
    const vids = treeRowsCache.filter(isVideoRow);
    const i = vids.findIndex((r) => r.id === id);
    d.innerHTML = `<div class="pl pv">${pvHeadHtml(f.name, 'data-pl="close"')}<div class="pl-b"><div class="pl-msg">再生の準備中…</div></div>${pvFootHtml({ info: `${esc(kindOf({ kind: 'file', name: f.name, ext: extOf(f.name) }))}・${fmt(f.size)}`, path: pvPath(f) })}</div>`;
    const goSeq = (nid) => { treeSelect(nid, null); renderTree(); playFile(nid, { full: !!document.fullscreenElement }); };
    const seq = qpSeq(vids, id, goSeq);
    const goFull = () => goFullEl(d.querySelector('.pl')).catch(() => status('全画面にできませんでした。プレーヤーの ⛶ を押してください。'));
    d._pl = { full: goFull, seq };
    // コマ一覧を開くときは再生画面を閉じる（動画を同時にいくつも読み込むと、Safari・アプリ版で画面ごと落ちることがあるため）
    pvWire(d, { id, name: f.name, frames: () => { closePlayer(); openFrames([id]); }, loc: () => { closePlayer(); revealInTree(id); }, ext: () => openExternal(id) });
    const sel = d.querySelector('.pv-q');
    const P = playerCore(d.querySelector('.pl-b'), id, {
      slot: 'main', name: f.name, t: fromT, qHost: sel,
      alive: () => document.body.contains(d) && run === playRun, // その間に別の動画へ移った
      msg: (t) => { d.querySelector('.pl-b').innerHTML = `<div class="pl-msg">${esc(t)}</div>`; },
      unplayable: 'この画質（HLS）はこのブラウザの中では再生できません。別の画質か「↗ 外部プレーヤー」を選んでください。',
      qp: { ext: () => openExternal(id), full: goFull, close: () => closePlayer(), ...seq },
      onMeta: (v, x) => pvDim(d, v, x.hls ? '（変換）' : ''),
      fail: (x, why) => {
        const box = d.querySelector('.pl-b');
        if (!box.querySelector('.pl-err')) box.insertAdjacentHTML('beforeend', `<div class="pl-msg pl-err">「${esc(x.label)}」は再生できませんでした${why ? `（${esc(why)}）` : ''}。上の画質を切り替えるか「↗ 外部プレーヤー」を試してください。</div>`);
        log('warn', `再生できない画質：${x.label}${why ? '（' + why + '）' : ''}`, f.name); updateLogBadge();
      },
    });
    try {
      if (!(await P.ready)) return;
      if (P.v) P.v.focus();
      if (opt.full) goFull();
      log('info', '再生：' + f.name + '（' + P.S.src[P.k >= 0 ? P.k : P.S.first].label + '）');
    } catch (err) { if (err.session) { closePlayer(); handleErr(err, 'tree'); return; } d.querySelector('.pl-msg').textContent = (err.gone ? '' : '再生用リンクを取得できませんでした：') + err.message; log('error', '再生用リンクの取得に失敗：' + err.message, f.name); updateLogBadge(); }
  }
  function closePlayer() { playRun++; unloadMedia(document.getElementById('pd-player')); stopHls(); const d = document.getElementById('pd-player'); if (d) { d.querySelectorAll('.pd-sk').forEach((b) => { if (b._grab) b._grab.close(); }); const v = d.querySelector('video'); try { if (v) { v.pause(); v.removeAttribute('src'); v.load(); } } catch (e) { /* 無視 */ } d.remove(); } const t = $('[data-r=tree]'); if (t) t.focus(); }
  document.addEventListener('keydown', (e) => {
    const d = document.getElementById('pd-player'); if (!d) return;
    if (e.key === 'Escape') { if (document.fullscreenElement) return; e.preventDefault(); e.stopImmediatePropagation(); closePlayer(); }
    else if ((e.key === 'f' || e.key === 'F') && !e.metaKey && !e.ctrlKey) { e.preventDefault(); if (d._pl) d._pl.full(); }
    else if ((e.key === 'ArrowDown' && modKey(e)) || e.key === 'PageDown') { e.preventDefault(); if (d._pl && d._pl.seq.next) d._pl.seq.next(); }
    else if ((e.key === 'ArrowUp' && modKey(e)) || e.key === 'PageUp') { e.preventDefault(); if (d._pl && d._pl.seq.prev) d._pl.seq.prev(); }
  }, true);

  // ホバーでサムネイルを大きく表示（Enhancement Master と同じく、リスト・サムネイル・タイルのどれでも）
  let hovT = null, hovId = '';
  function hideHover() { clearTimeout(hovT); hovT = null; hovId = ''; const h = document.getElementById('pd-hover'); if (h) h.remove(); }
  function showHover(id, x, y) {
    const r = treeRowsCache.find((q) => q.id === id); if (!r) return;
    const f = r.kind === 'folder' ? treeIdx.thumbOf.get(r.id) : r.f;
    if (!f || !f.thumb) return;
    let h = document.getElementById('pd-hover');
    if (!h) { h = document.createElement('div'); h.id = 'pd-hover'; document.body.appendChild(h); }
    h.innerHTML = `<img src="${esc(f.thumb)}" referrerpolicy="no-referrer" alt=""><div class="hv-n">${r.kind === 'folder' ? ICON_DIR : ''}<span>${esc(r.name)}</span></div><div class="hv-s">${esc(r.kind === 'folder' ? `${r.n} 項目・${fmt(r.size)}（中で一番大きいファイル：${f.name}）` : `${kindOf(r)}・${fmt(r.size)}`)}</div>`;
    const W = 340, H = 250;
    const left = x + 18 + W > innerWidth ? Math.max(8, x - W - 18) : x + 18;
    const top = Math.min(Math.max(8, y + 14), innerHeight - H - 8);
    h.style.left = left + 'px'; h.style.top = top + 'px';
  }
  root.addEventListener('mousemove', (e) => {
    if (view !== 'tree' || tree.hover === false || drag || renaming || qlOpen || document.getElementById('pd-ctx') || document.getElementById('pd-player') || document.getElementById('pd-dlg')) { if (hovId) hideHover(); return; }
    const row = e.target.closest('.tr-row');
    const id = row ? row.dataset.tid : '';
    if (!id) { if (hovId || hovT) hideHover(); return; }
    if (id === hovId) { const h = document.getElementById('pd-hover'); if (h) showHover(id, e.clientX, e.clientY); return; }
    hideHover(); hovId = id;
    const x = e.clientX, y = e.clientY;
    hovT = setTimeout(() => { if (hovId === id) showHover(id, x, y); }, 350);
  });
  root.addEventListener('mouseleave', hideHover);
  root.addEventListener('mousedown', hideHover, true);
  root.addEventListener('wheel', hideHover, { passive: true });
  document.addEventListener('keydown', () => { if (hovId) hideHover(); }, true);
  root.addEventListener('dblclick', (e) => { const cr = e.target.closest('[data-colr]'); if (!cr) return; e.preventDefault(); e.stopPropagation(); const c = colCfg(); delete c.w[cr.dataset.colr]; saveColCfg(c); renderTree(); }, true);
  // マウス操作
  root.addEventListener('mousedown', (e) => {
    if (view !== 'tree' || busy) return;
    // 列の幅を変える（見出しの境目をドラッグ）
    const cr = e.target.closest('[data-colr]');
    if (cr) {
      e.preventDefault(); e.stopPropagation();
      const k = cr.dataset.colr, cell = cr.parentElement, x0 = e.clientX, w0 = cell.getBoundingClientRect().width, trEl = cell.closest('.tr');
      cr.classList.add('on');
      // 境目は列の左側：左へ引くと広がる
      const mv = (ev) => { const c = colCfg(); c.w[k] = Math.round(Math.max(48, Math.min(600, w0 - (ev.clientX - x0)))); saveColCfg(c); if (trEl) trEl.style.setProperty('--tcols', colTemplate()); };
      const up = () => { removeEventListener('mousemove', mv); removeEventListener('mouseup', up); cr.classList.remove('on'); };
      addEventListener('mousemove', mv); addEventListener('mouseup', up);
      return;
    }
    if (e.target.closest('[data-colpick]')) { e.preventDefault(); e.stopPropagation(); openColMenu(e.target.closest('[data-colpick]')); return; }
    const s = e.target.closest('[data-tsort]');
    if (s) { const k = s.dataset.tsort; if (tree.sort === k) tree.dir = -tree.dir; else { tree.sort = k; tree.dir = 1; } saveTree(); renderTreeToolbar(); renderTree(); return; }
    const tt = e.target.closest('[data-ttop]');
    if (tt && e.button === 0) { e.preventDefault(); jumpTop(tt.dataset.ttop); return; }
    const cbtn = e.target.closest('[data-tbase]');
    if (cbtn && e.button === 0) { e.preventDefault(); const id = cbtn.dataset.tbase; drag = null; if (id !== treeBase()) setBase(id); return; }
    if (e.target.closest('[data-tup]') && e.button === 0) { e.preventDefault(); treeUp(); return; }
    const tw = e.target.closest('[data-ttw]');
    if (tw) { e.preventDefault(); treeToggle(tw.dataset.ttw, undefined, e.altKey); renderTree(); return; }
    if (e.target.closest('.tr-ren')) return;
    const row = e.target.closest('.tr-row');
    if (row) {
      e.preventDefault();
      if (renaming) { const i = $('.tr-ren'); treeCommitRename(renaming, i && i.value); }
      const id = row.dataset.tid;
      const now = Date.now();
      if (e.button === 0 && !e.shiftKey && !e.metaKey && !e.ctrlKey && (e.detail >= 2 || (!e.detail && lastDown.id === id && now - lastDown.t < 450))) {
        lastDown = { id: '', t: 0 }; drag = null;
        const r = treeRowsCache.find((x) => x.id === id); if (!r) return;
        const alt = e.altKey;
        if (isVideoRow(r)) multiClick(e.detail || 2, () => openRow(r, alt), () => { closeQL(); openExternal(r.id); });
        else if (e.detail < 3) openRow(r, alt);
        return;
      }
      lastDown = { id, t: now };
      if (e.button === 2) { if (!treeSel.has(id)) { treeSelect(id, null); renderTree(); } return; } // 右クリックは選択を保つ
      // 選択済みの行を押したときは、ドラッグに備えて選択を保つ（離したときに単独選択へ）
      if (treeSel.has(id) && !e.shiftKey && !e.metaKey && !e.ctrlKey) { treeCur = id; drag = { ids: [...treeSel], x: e.clientX, y: e.clientY, single: id }; renderTree(); }
      else { treeSelect(id, e); renderTree(); if (treeSel.has(id)) drag = { ids: [...treeSel], x: e.clientX, y: e.clientY }; }
      if (qlOpen) showQL();
    }
  });
  // ダブルクリック：フォルダは開閉、ビデオは再生、それ以外はプレビュー
  // （1 回目のクリックで行を描き直すため、dblclick イベントではなく mousedown の回数で判定する）
  let lastDown = { id: '', t: 0 };
  function openRow(r, deep) {
    if (r.kind === 'folder' && tree.view === 'tile') { treeOpen.add(r.id); saveTree(); renderTree(); jumpToSection(r.id); return; }
    if (r.kind === 'folder') { treeToggle(r.id, undefined, deep); renderTree(); } else if (isVideoRow(r)) playDefault(r.id); else { treeCur = r.id; showQL(); }
  }
  // スペース：簡易プレーヤーを開く・閉じる（開いているときは再生・一時停止。閉じるのは Esc）
  function treeSpace(e) {
    const qv = document.querySelector('#pd-ql video');
    if (qv) { if (e.target !== qv && qv._qp) qv._qp.toggle(); return; }
    if (qlOpen) closeQL(); else showQL();
  }
  const treeKeysOn = () => root.classList.contains('on') && view === 'tree' && !busy && !document.getElementById('pd-dlg') && !document.getElementById('pd-player') && !document.getElementById('pd-set') && !document.getElementById('pd-lib') && !document.getElementById('pd-ctx');
  // フォルダ一覧に focus がない（ページ本体にある）ときのスペースは、PikPak の画面側が先に受け取って止めてしまうことがある
  //   （Enter やダブルクリックは効くのにスペースだけ効かない）。ページ全体の入口で先に受け取り、フォルダ一覧へ focus を戻して処理する
  window.addEventListener('keydown', (e) => {
    if (e.key !== ' ' || e.metaKey || e.ctrlKey || e.altKey || qpActive || winMode === 'pop' || !treeKeysOn()) return;
    const t = e.target; if (t && t !== document.body && t !== document.documentElement && root.contains(t)) return; // フォルダ一覧の中なら、いつもの処理に任せる
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    if (!treeRowsCache.some((r) => r.id === treeCur)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const tr = $('[data-r=tree]'); if (tr) tr.focus({ preventScroll: true });
    treeSpace(e);
  }, true);
  // キーボード操作
  document.addEventListener('keydown', (e) => {
    if (!root.classList.contains('on') || view !== 'tree' || busy || document.getElementById('pd-dlg') || document.getElementById('pd-player') || document.getElementById('pd-set') || document.getElementById('pd-lib')) return; // 左メニューの画面が開いている間は、後ろのフォルダ一覧のキー操作は止める
    if (winMode === 'pop' && !root.contains(document.activeElement)) return; // ポップアップのときは、後ろの PikPak を操作中ならキーを横取りしない
    if (document.getElementById('pd-ctx')) { if (e.key === 'Escape') { e.preventDefault(); closeCtx(); } return; }
    const t = e.target;
    if (t && t.classList && t.classList.contains('tr-ren')) {
      if (e.key === 'Enter') { e.preventDefault(); treeCommitRename(renaming, t.value); }
      else if (e.key === 'Escape') { e.preventDefault(); renaming = ''; renderTree(); }
      return;
    }
    if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) { if (e.key === 'Escape' || e.key === 'ArrowDown') { t.blur(); $('[data-r=tree]').focus(); } if (e.key !== 'ArrowDown') return; }
    const rows = treeRowsCache; if (!rows.length) return;
    let i = rows.findIndex((r) => r.id === treeCur);
    const cur = rows[i];
    const move = (j) => { j = Math.max(0, Math.min(rows.length - 1, j)); treeSelect(rows[j].id, e.shiftKey ? { shiftKey: true } : null); renderTree(); if (qlOpen) showQL(); };
    const k = e.key;
    const plain = !e.metaKey && !e.ctrlKey && !e.altKey;
    if ((k === 'ArrowRight' || k === 'ArrowLeft') && e.shiftKey && modKey(e)) { e.preventDefault(); treeAll(k === 'ArrowRight'); return; } // 全展開／全格納
    if ((k === '1' || k === '2' || k === '3') && plain && !e.shiftKey) { e.preventDefault(); treeView({ 1: 'list', 2: 'thumb', 3: 'tile' }[k]); return; }
    if ((k === 'Backspace' || k === 'Home') && plain && !e.shiftKey) { // 戻る：タイルは一番上の一覧へ、リストは 1 つ上の階層へ
      e.preventDefault();
      if (tree.view === 'tile') { const c = treeRowsCache.find((q) => q.id === treeCur); jumpTop(c ? c.parentId : ''); } else if (k === 'Backspace') treeUp();
      return;
    }
    if (tree.view === 'tile' && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(k) && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const cols = tileCols(), j = i < 0 ? 0 : i + ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -cols, ArrowDown: cols }[k]);
      move(j); return;
    }
    const isN = e.code === 'KeyN' || k === 'n' || k === 'N';
    if (isN && e.altKey && (IS_MAC ? e.metaKey : !e.ctrlKey)) { e.preventDefault(); treeNewFolder(); return; } // 新規フォルダ：⌥⌘N／Alt+N
    if (k === 'ArrowUp' && (IS_MAC ? e.metaKey : (e.altKey && !e.ctrlKey))) { e.preventDefault(); treeUp(); return; } // 1 つ上へ：⌘↑／Alt+↑
    const openKey = IS_MAC ? ((k === 'ArrowDown' && e.metaKey) || ((k === 'o' || k === 'O') && e.metaKey)) : (k === 'Enter' && plain && !e.shiftKey);
    if (openKey && cur) { e.preventDefault(); closeQL(); if (isVideoRow(cur)) playDefault(cur.id); else if (cur.kind === 'folder') setBase(cur.id); else showQL(); return; } // 開く：⌘↓／Enter
    const renameKey = IS_MAC ? (k === 'Enter' && plain) : (k === 'F2');
    if (renameKey && cur) { e.preventDefault(); closeQL(); renaming = cur.id; renderTree(); return; } // 名前の変更：Enter（mac）／F2
    const trashKey = IS_MAC ? ((k === 'Backspace' && e.metaKey) || k === 'Delete') : (k === 'Delete' && !e.ctrlKey && !e.altKey);
    if (trashKey && treeSel.size) { e.preventDefault(); closeQL(); treeTrash(); return; } // ゴミ箱：⌘⌫／Delete
    if (k === 'ArrowDown') { e.preventDefault(); move(i < 0 ? 0 : i + 1); }
    else if (k === 'ArrowUp') { e.preventDefault(); move(i < 0 ? 0 : i - 1); }
    else if (k === 'End') { e.preventDefault(); move(rows.length - 1); }
    else if (k === 'ArrowRight' && cur) { e.preventDefault(); if (cur.kind === 'folder') { if (!cur.open || e.altKey) { treeToggle(cur.id, true, e.altKey); renderTree(); } else move(i + 1); } }
    else if (k === 'ArrowLeft' && cur) {
      e.preventDefault();
      if (cur.kind === 'folder' && cur.open) { treeToggle(cur.id, false, e.altKey); renderTree(); }
      else { const p = rows.findIndex((r) => r.id === cur.parentId); if (p >= 0) move(p); }
    }
    else if (k === ' ' && cur) { e.preventDefault(); treeSpace(e); }
    else if (k === 'Escape') { if (qlOpen) { e.preventDefault(); closeQL(); } }
    else if ((k === 'a' || k === 'A') && modKey(e)) { e.preventDefault(); rows.forEach((r) => treeSel.add(r.id)); renderTree(); }
    else if ((k === 'c' || k === 'C') && modKey(e) && cur && !String(window.getSelection ? window.getSelection() : '').trim()) { e.preventDefault(); copyPath(cur); }
  });
  root.addEventListener('focusout', (e) => { if (e.target.classList && e.target.classList.contains('tr-ren') && renaming) treeCommitRename(renaming, e.target.value); });
  // 1 つ上の階層へ（読み込んだ場所より上も、その場で読み込んで移動する）
  async function treeUp() {
    const ix = treeIdx || buildTreeIndex(); const b = treeBase();
    if (b === ix.rootId && outer.rootPid === undefined) {
      if (!sessionValid()) { ensureSession('tree'); return; }
      status('上の階層を確認しています…', 0.4);
      try { await ensureUp(); } catch (err) { if (err.session) { handleErr(err, 'tree'); return; } status('上の階層を読み込めませんでした：' + err.message); return; }
      treeIdx = null;
    }
    const p = parentOf(b);
    if (p === undefined || p === null || (isHomeId(b) && b !== ix.rootId)) { status('これより上の階層はありません'); renderTree(); return; }
    setBase(p);
    treeSel.add(b); treeCur = b; treeAnchor = b; renderTree();
  }
  function treeAll(open) {
    if (open) { folders.forEach((d) => { if (!d.isRoot) treeOpen.add(d.id); }); outer.dirs.forEach((d) => { if (outer.loaded.has(d.id)) treeOpen.add(d.id); }); } else treeOpen.clear();
    saveTree(); renderTree(); status(open ? 'すべてのフォルダを開きました' : 'すべてのフォルダを閉じました');
  }
  // タイル：フォルダの見出しへ飛ぶ／一番上の一覧へ戻る
  function flash(el) { if (!el) return; el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
  // スクロールが止まってから光らせる（スクロール中に光り終わって見落とさないように）
  function afterScroll(main, fn) {
    let last = -1, still = 0, done = false;
    const end = () => { if (done) return; done = true; fn(); };
    const t0 = Date.now();
    const tick = () => { if (done) return; const y = main.scrollTop; still = y === last ? still + 1 : 0; last = y; if (still >= 3 || Date.now() - t0 > 2000) end(); else requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
  function jumpToSection(id) {
    const main = $('[data-r=main]'), sec = [...root.querySelectorAll('.tl-sec')].find((x) => x.dataset.sec === id);
    if (!sec) return;
    main.scrollTo({ top: main.scrollTop + sec.getBoundingClientRect().top - main.getBoundingClientRect().top - 30, behavior: 'smooth' });
    afterScroll(main, () => flash(sec.querySelector('.tl-h')));
    status(`「${dirLabel(id)}」の中身を表示しています（見出しの「⤒ 一覧へ戻る」か ${KEY.back} キーで一番上へ戻れます）`);
  }
  function jumpTop(fromId) {
    const main = $('[data-r=main]');
    main.scrollTo({ top: 0, behavior: 'smooth' });
    // 戻り先：最上位の一覧にある、そのフォルダ（またはそのフォルダを含むフォルダ）のタイルを選ぶ
    const base = treeBase();
    if (fromId) {
      const ch = [fromId, ...ancestorsOf(fromId)], k = ch.indexOf(base);
      const top = k > 0 ? ch[k - 1] : (ch.find((x) => treeRowsCache.some((q) => q.id === x && q.parentId === base)) || '');
      if (top) { treeSel.clear(); treeSel.add(top); treeCur = top; treeAnchor = top; renderTree(); main.scrollTo({ top: 0, behavior: 'smooth' }); afterScroll(main, () => flash([...root.querySelectorAll('.tr-row.tile')].find((x) => x.dataset.tid === top))); }
    }
  }
  // マウスの「戻る」ボタン（サイドボタン）でも一番上の一覧へ戻る
  root.addEventListener('mousedown', (e) => { if (e.button === 3 && view === 'tree' && tree.view === 'tile') e.preventDefault(); });
  root.addEventListener('auxclick', (e) => { if (e.button === 3 && view === 'tree' && tree.view === 'tile') e.preventDefault(); });
  root.addEventListener('mouseup', (e) => {
    if (e.button !== 3 || view !== 'tree' || tree.view !== 'tile' || busy) return;
    e.preventDefault(); const c = treeRowsCache.find((q) => q.id === treeCur); jumpTop(c ? c.parentId : '');
  });
  $('[data-r=main]').addEventListener('scroll', (e) => { const b = root.querySelector('.tl-top'); if (b) b.classList.toggle('on', e.target.scrollTop > 120); }, { passive: true });
  // タイルの横の数（↑↓ で 1 行ぶん移動するため）
  function tileCols() {
    const t = [...root.querySelectorAll('.tr-row.tile')]; const cur = t.find((x) => x.dataset.tid === treeCur) || t[0];
    if (!cur) return 1;
    const g = cur.parentElement, top = [...g.children].filter((x) => x.classList.contains('tile'));
    return Math.max(1, top.filter((x) => x.offsetTop === top[0].offsetTop).length);
  }
  function treeView(v) { tree.view = v; saveTree(); renderTreeToolbar(); renderTree(); $('[data-r=main]').scrollTop = 0; }
  function openTree() {
    if (busy) return;
    closeQL();
    if (!hasScan()) { afterScan = 'tree'; setView('scan'); if (!scanAsk()) runScan(); return; }
    setView('tree');
    const q = $('[data-a=tq]'); if (q) q.value = tree.q || '';
    prefetchUp();
  }

