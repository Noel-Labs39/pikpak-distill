  // ---------- 出演者・販売者（フォルダは動かさず、作品の情報から並べる） ----------
  //   作品ごと（品番）に代表の動画 1 本（いちばん大きいもの）を選び、出演者（手入力を優先）と販売者（調べた結果）で引けるようにする
  //   中身を決める部分は src/core/library.mjs（試験あり）。ここでは画面側の状態を渡す
  const { NO_ACT, NO_SEL, pplNames } = PPCore;
  let pplCache = null;
  function peopleIndex() {
    // 作り直しは軽いので、同じ一覧なら 3 秒だけ使い回す（作品の情報を調べ直したら次に開いたときに反映）
    if (pplCache && pplCache.files === files && Date.now() - pplCache.at < 3000) return pplCache;
    pplCache = { at: Date.now(), files, ...PPCore.buildPeopleIndex(files, { isVideo: (f) => VIDEO_EXT.has(extOf(f.name)), keyOf: (f) => infoKeyOf(f.id, f.name), wInfo, sellerDb }) };
    return pplCache;
  }
  // 関連する作品：同じ出演者 → 同じ販売者の順（自分は除く）
  const relatedWorks = (key, max = 8) => PPCore.relatedWorks(peopleIndex(), key, max);
  let pplWant = null; // 開いたときに選んでおく {mode, name}
  function pplSideHtml() {
    const S = libSt, P = peopleIndex(), m = S.pmode === 'sel' ? P.sel : P.act;
    const list = pplNames(m, S.pq || '');
    return `<div class="pp-side"><div class="pp-mode" role="tablist">${[['act', '出演者'], ['sel', '販売者']].map(([k, l]) => `<button role="tab" aria-selected="${S.pmode === k}" data-lbpm="${k}" class="${S.pmode === k ? 'on' : ''}">${l}</button>`).join('')}</div>
      <label class="pp-q"><span>名前で絞り込む</span><input type="search" data-lbpq value="${esc(S.pq || '')}" placeholder="例：さんぷる"></label>
      <div class="pp-names">${list.length ? list.slice(0, 400).map(([n, c]) => `<button data-lbpn="${esc(n)}" title="${esc(n)}（${c} 作品）" class="${n === S.pname ? 'on' : ''}${n === NO_ACT || n === NO_SEL ? ' mu' : ''}"><span>${esc(n)}</span><i>${c} 作品</i></button>`).join('') : '<div class="note" style="padding:8px">見つかりません</div>'}</div>
      <div class="note pp-hint">作品の情報（「作品の情報をまとめて調べる」・プレーヤーの ⓘ）から作ります。フォルダは動かしません。</div></div>`;
  }
  function openPeople(mode, name) {
    pplWant = { mode, name };
    closeCtx(); closeQL(); try { closePlayer(); } catch (e) { /* 無視 */ }
    if (document.getElementById('pd-lib') && libSt) { libSt.pmode = mode; libSt.pname = name; libSt.pq = ''; pplWant = null; libLoad('people'); }
    else openLib('people');
  }
  // 作品の行・カードの右クリック（長押し）メニュー。消す・動かすなど戻せない操作は入れない
  function workMenu(x, y, o) {
    closeCtx();
    const f = fileById(o.id), name = o.name || (f && f.name) || '';
    const { k } = infoKeyOf(o.id, name);
    const P = k ? peopleIndex() : null, wo = P && P.works.get(k.key);
    const vid = VIDEO_EXT.has(extOf(name));
    const btn = (a, label, ok = true) => `<button data-wm="${a}"${ok ? '' : ' disabled'}><span>${label}</span><kbd></kbd></button>`;
    const m = document.createElement('div'); m.id = 'pd-ctx'; m.setAttribute('role', 'menu');
    m.innerHTML = [
      vid ? btn('pv', '▶ 簡易プレーヤーで再生') : '',
      vid ? btn('ext', `↗ 外部プレーヤーで再生（${EXT_PLAYERS[playPref().ext].short}）`) : '',
      btn('loc', '格納しているフォルダを開く', !!f), '<hr>',
      vid ? btn('info', 'ⓘ 作品の情報') : '',
      ...(wo ? wo.actors.slice(0, 3).map((n, i) => `<button data-wm="act" data-n="${esc(n)}"><span>同じ出演者の作品（${esc(n)}）</span><kbd></kbd></button>`) : []),
      wo && wo.seller ? `<button data-wm="sel" data-n="${esc(wo.seller)}"><span>同じ販売者の作品（${esc(wo.seller)}）</span><kbd></kbd></button>` : '',
      k ? '<hr>' + btn('copy', `品番をコピー（${esc(k.label)}）`) : '',
    ].join('');
    document.body.appendChild(m);
    const w = m.offsetWidth || 240, h = m.offsetHeight || 300;
    m.style.left = Math.max(8, Math.min(x, innerWidth - w - 8)) + 'px'; m.style.top = Math.max(8, Math.min(y, innerHeight - h - 8)) + 'px';
    const items = () => [...m.querySelectorAll('button:not(:disabled)')];
    m.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-wm]'); if (!b || b.disabled) return; ev.stopPropagation();
      const a = b.dataset.wm; closeCtx();
      if (a === 'pv') o.preview ? o.preview() : playFile(o.id);
      else if (a === 'ext') { if (o.beforeExt) o.beforeExt(); openExternal(o.id, '', name); }
      else if (a === 'loc') { if (document.getElementById('pd-lib')) libReveal(o.id); else { if (view !== 'tree') openTree(); revealInTree(o.id); } }
      else if (a === 'info') { if (o.info) o.info(); }
      else if (a === 'act') openPeople('act', b.dataset.n);
      else if (a === 'sel') openPeople('sel', b.dataset.n);
      else if (a === 'copy') { try { navigator.clipboard.writeText(k.label); } catch (e) { /* 無視 */ } status('品番をコピーしました：' + k.label); }
    });
    // キー操作：↑↓で選ぶ・Enter で決定・Esc で閉じる
    m.addEventListener('keydown', (ev) => {
      const it = items(), i = it.indexOf(document.activeElement);
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); const n = it.length; if (n) it[(i + (ev.key === 'ArrowDown' ? 1 : n - 1) + (i < 0 && ev.key === 'ArrowUp' ? 1 : 0)) % n].focus(); }
      else if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); closeCtx(); if (o.el) o.el.focus(); }
    });
    if (o.kbd) { const f0 = items()[0]; if (f0) f0.focus(); }
  }
  // 開いているメニューは Esc で先に閉じる（後ろの一覧やプレーヤーは閉じない）
  addEventListener('keydown', (e) => { if (e.key !== 'Escape') return; const m = document.getElementById('pd-ctx'); if (!m) return; e.preventDefault(); e.stopImmediatePropagation(); const back = libSt && libSt.cur && document.querySelector(`#pd-lib [data-lbc="${CSS.escape(libSt.cur)}"]`); closeCtx(); if (back) back.focus(); }, true);
  // スマホ・タブレット：長押しで右クリックと同じメニューを出す
  function longPress(el, sel, fn) {
    let t = 0, sx = 0, sy = 0;
    el.addEventListener('touchstart', (e) => { const c = e.target.closest(sel); if (!c || e.touches.length !== 1) return; sx = e.touches[0].clientX; sy = e.touches[0].clientY; clearTimeout(t); t = setTimeout(() => { t = 0; fn(c, sx, sy); }, 550); }, { passive: true });
    const stop = () => { clearTimeout(t); t = 0; };
    el.addEventListener('touchmove', (e) => { if (t && Math.abs(e.touches[0].clientX - sx) + Math.abs(e.touches[0].clientY - sy) > 10) stop(); }, { passive: true });
    el.addEventListener('touchend', stop); el.addEventListener('touchcancel', stop);
  }
  // 追加したときに不要と判定したファイル（すべて保存になったため一緒に保存されたもの）を、ダウンロードが終わったらゴミ箱へ移す
  //   名前（フォルダの中の位置も含む）と大きさが両方合うものだけ。ゴミ箱なので元に戻せる。7 日たっても終わらないものはあきらめる
  let junkSweeping = false;
  async function addJunkSweep(tasks) {
    if (junkSweeping || !sessionValid()) return;
    const logs = addLogRead(); const todo = logs.filter((r) => r.junk && !r.jdone && Date.now() - r.at < 7 * 864e5);
    if (!todo.length) return;
    junkSweeping = true;
    try {
      if (!tasks) { const d = await api(`/tasks?type=offline&limit=100&filters=${encodeURIComponent(JSON.stringify({ phase: { in: 'PHASE_TYPE_RUNNING,PHASE_TYPE_PENDING,PHASE_TYPE_ERROR,PHASE_TYPE_COMPLETE' } }))}`); tasks = new Map((d.tasks || []).map((t) => [t.id, t])); }
      for (const r of todo) {
        const t = r.task && tasks.get(r.task);
        if (t && t.phase !== 'PHASE_TYPE_COMPLETE') { if (t.phase === 'PHASE_TYPE_ERROR') r.jdone = true; continue; }
        const fid = (t && t.file_id) || r.fid; if (!fid) continue;
        const want = new Map(r.junk.map((j) => [j.p + '|' + j.s, j]));
        const hit = [];
        const walk = async (id, pre, depth) => { for (const x of await apiList(id)) { if (x.kind === 'drive#folder') { if (depth < 6) await walk(x.id, pre + x.name + '/', depth + 1); } else if (want.has((pre + x.name).toLowerCase() + '|' + (+x.size || 0))) hit.push(x); } };
        let top = null; try { top = await apiGet(fid); } catch (e) { if (e.session) throw e; }
        if (!top || top.trashed) { r.jdone = true; continue; }
        if (top.kind === 'drive#folder') await walk(fid, '', 0);
        if (hit.length) {
          await api('/files:batchTrash', { method: 'POST', body: JSON.stringify({ ids: hit.map((x) => x.id) }) });
          const gone = new Set(hit.map((x) => x.id)); files = files.filter((f) => !gone.has(f.id)); saveAll();
          log('info', `追加後に不要ファイル ${hit.length} 件をゴミ箱へ移しました（${hit.map((x) => x.name).slice(0, 5).join('、')}）`, r.name);
        }
        r.jdone = true;
      }
      const byId = new Map(todo.map((r) => [r.lid, r]));
      addLogWrite(addLogRead().map((r) => byId.get(r.lid) || r));
    } catch (e) { if (!e.session) log('warn', '追加後の不要ファイルの片付けに失敗：' + (e.message || e)); }
    finally { junkSweeping = false; }
  }
  const LIB_GRID = new Set(['recent', 'cont', 'people', 'cand', 'hist', 'star']);
  async function libFetch(tab) {
    if (tab === 'dl') {
      const d = await api(`/tasks?type=offline&limit=100&thumbnail_size=SIZE_SMALL&filters=${encF({ phase: { in: 'PHASE_TYPE_RUNNING,PHASE_TYPE_PENDING,PHASE_TYPE_ERROR,PHASE_TYPE_COMPLETE' } })}`);
      const tasks = new Map((d.tasks || []).map((t) => [t.id, t]));
      addJunkSweep(tasks);
      const ST = { PHASE_TYPE_RUNNING: 'run', PHASE_TYPE_PENDING: 'wait', PHASE_TYPE_ERROR: 'err', PHASE_TYPE_COMPLETE: 'ok' };
      const lim = Date.now() - 60 * 864e5;
      const logs = addLogRead().filter((r) => r.at >= lim);
      const used = new Set();
      const out = logs.map((r) => {
        const t = r.task && tasks.get(r.task);
        if (t) used.add(t.id);
        return { id: r.lid, lid: r.lid, task: r.task || '', name: r.name, size: r.size || (t ? +t.file_size || 0 : 0), at: new Date(r.at).toISOString(), url: r.url || '', mode: r.mode, fid: (t && t.file_id) || r.fid || r.top || '', st: r.fail ? 'fail' : t ? ST[t.phase] || 'run' : 'check', pct: t ? +t.progress || 0 : 0, msg: r.fail || (t && t.message) || '', thumb: (t && t.thumbnail_link) || '' };
      });
      // タスクの見つからないもの（すぐ保存した分・完了して消えたタスク）は、保存先にあるかを確かめる
      const chk = out.filter((x) => x.st === 'check');
      for (let i = 0; i < chk.length; i += 6) {
        await Promise.all(chk.slice(i, i + 6).map(async (x) => {
          if (!x.fid) { x.st = x.mode === 'all' ? 'gone' : 'missing'; return; }
          try { const f = await apiGet(x.fid); x.st = f && !f.trashed && f.phase !== 'PHASE_TYPE_ERROR' ? 'ok' : 'missing'; if (f && f.thumbnail_link) x.thumb = f.thumbnail_link; if (f && +f.size) x.size = +f.size; } catch (e) { if (e.session) throw e; x.st = 'missing'; }
        }));
      }
      // Dedupe 以外（PikPak の画面など）で追加したダウンロード
      (d.tasks || []).filter((t) => !used.has(t.id)).forEach((t) => out.push({ id: t.id, task: t.id, name: t.name || t.file_name || '', size: +t.file_size || 0, at: t.created_time || '', mode: 'pikpak', fid: t.file_id || '', st: ST[t.phase] || 'run', pct: +t.progress || 0, msg: t.message || '' }));
      return out.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
    }
    // 続きを見る：途中で止めたもの（このブラウザの再生の記録から。新しい順）／消す候補：見ながら仕分けで D を付けたもの
    if (tab === 'cand' || tab === 'cont') return PPCore.mediaList(mediaAll(), tab, fileById);
    if (tab === 'hist') {
      let d = {}; try { d = await api(`/events?thumbnail_size=SIZE_MEDIUM&limit=100&filters=${encF({ type: { in: 'TYPE_PLAY' } })}`); } catch (e) { if (e.session) throw e; }
      return PPCore.mergeHistory(d.events, mediaAll(), fileById);
    }
    if (tab === 'star' || tab === 'trash') {
      const fl = tab === 'star' ? { trashed: { eq: false }, system_tag: { in: 'STAR' } } : { trashed: { eq: true } };
      const out = (await apiListAll('*', fl, 20)).map((f) => ({ id: f.id, name: f.name, size: +f.size || 0, folder: f.kind === 'drive#folder', at: f.modified_time || f.created_time || '', thumb: f.thumbnail_link || '', parentId: f.parent_id || '' }));
      if (tab === 'trash') {
        // 取りこぼしの候補：数字だけの名前で、その数字が入っていたフォルダの品番と同じもの（見て知らせるだけ・ゴミ箱は変えない）
        const k = PPCore.markTrashMissed(out, folders);
        if (k) log('info', `ゴミ箱：取りこぼしの候補 ${k} 件（数字だけの名前で、フォルダの品番と同じ番号）`);
      }
      return out;
    }
    if (tab === 'people') {
      if (!hasScan()) return null;
      const P = peopleIndex();
      if (pplWant) { libSt.pmode = pplWant.mode; libSt.pname = pplWant.name; pplWant = null; }
      if (!libSt.pmode) libSt.pmode = lsGet('ppdup:pplmode:v1') === 'sel' ? 'sel' : 'act';
      const m = libSt.pmode === 'sel' ? P.sel : P.act;
      if (!libSt.pname || !m.has(libSt.pname)) libSt.pname = (pplNames(m, '')[0] || [''])[0];
      return PPCore.peopleWorks(P, libSt.pmode, libSt.pname);
    }
    // 最近追加したもの：読み込んだ内容から（追加日の新しい順）
    if (!hasScan()) return null;
    return PPCore.recentFiles(files, Date.now() - libSt.days * 864e5);
  }
  const libAuto = () => { return lsGet('ppdup:libauto:v1') !== '0'; };
  const libView = () => { try { const v = localStorage.getItem('ppdup:libview:v1'); return ['list', 'thumb', 'tile'].includes(v) ? v : 'tile'; } catch (e) { return 'tile'; } };
  // ダブルクリック・Enter はフォルダ一覧と同じく「再生のしかた」の設定に従う（外部プレーヤーにしていれば外部で開く）。スペースは簡易プレビュー
  function libPlayDefault(it) { const p = playPref(); if (p.mode === 'external') { libPvClose(); openExternal(it.id, p.ext, it.name); } else { libPreview(it.id).then(() => { if (p.mode === 'full') { goFullEl(document.querySelector('#pd-lib .lb-pv .lb-pvbox')).catch(() => {}); } }); } }
  const libIsVid = (it) => !!it && !it.folder && VIDEO_EXT.has(extOf(it.name));
  const libItem = (id) => libSt && libSt.items.find((i) => i.id === id);
  function openLib(tab) {
    if (!ensureSession(view)) return;
    closeCtx(); closeQL();
    libSt = { tab: tab || 'trash', items: [], sel: new Set(), cur: '', loading: false, err: '', days: 7, busy: false };
    let d = document.getElementById('pd-lib');
    if (!d) {
      // 整理・フォルダ一覧と同じく、メインの画面に広げて表示する（小さなポップアップにはしない）
      d = document.createElement('div'); d.id = 'pd-lib'; d.className = 'emb'; const mainEl = root.querySelector('[data-r=main]'); root.insertBefore(d, mainEl);
      d.addEventListener('click', (e) => {
        if (!libSt) return;
        const b = e.target.closest('button');
        if (!b) {
          const tg = e.target.closest('[data-lbtog]'); if (tg) { const k = tg.dataset.lbtog; libSt.closed = libSt.closed || new Set(); if (libSt.closed.has(k)) libSt.closed.delete(k); else libSt.closed.add(k); renderLib(); return; }
          // カードを押すと選ぶ（再生はダブルクリック・Enter・下のボタン）
          const c = e.target.closest('[data-lbc]'); if (!c || e.target.closest('input')) return;
          libSt.cur = c.dataset.lbc; d.querySelectorAll('[data-lbc].cur').forEach((x) => x.classList.remove('cur')); c.classList.add('cur'); libFoot(); return;
        }
        if (b.disabled) return;
        const x = b.dataset;
        if (x.lbpm) { libSt.pmode = x.lbpm; libSt.pname = ''; libSt.pq = ''; libSt.ppScroll = 0; lsSet('ppdup:pplmode:v1', x.lbpm); libLoad('people'); return; }
        if (x.lbpn !== undefined) { libSt.pname = x.lbpn; libLoad('people'); return; }
        if (x.lbpj) { libSt.pmode = x.lbpj; libSt.pname = x.n; libSt.pq = ''; libLoad('people'); return; }
        if (x.lbclose !== undefined) { if (!libSt.busy) closeLib(); }
        else if (x.lbtab) { if (!libSt.busy) libLoad(x.lbtab); }
        else if (x.lbdays) { libSt.days = +x.lbdays; libLoad('recent'); }
        else if (x.lbreload !== undefined) libLoad(libSt.tab);
        else if (x.lbtall) { libSt.closed = new Set(); if (x.lbtall === 'close') libSt.items.forEach((it) => { let acc = ''; String(it.path || '/').split('/').filter(Boolean).forEach((seg) => { acc += '/' + seg; libSt.closed.add(acc); }); }); renderLib(); }
        else if (x.lbview) { lsSet('ppdup:libview:v1', x.lbview); renderLib(); }
        else if (x.lbauto !== undefined) { lsSet('ppdup:libauto:v1', libAuto() ? '0' : '1'); renderLib(); }
        else if (x.lbsz) { lsSet('ppdup:libsize:v1', x.lbsz); renderLib(); }
        else if (x.lbopen) libReveal(x.lbopen);
        else if (x.lbre) { const it = libItem(x.lbre); if (it && it.url) { try { sessionStorage.setItem(SS_ADDTEXT, it.url); } catch (e) { /* 無視 */ } closeLib(); openAdd('DL'); } }
        else if (x.lbadd !== undefined) { closeLib(); openAdd('DL'); }
        else if (x.lbpv) libPreview(x.lbpv);
        else if (x.lbext) { const it = libItem(x.lbext); libPvClose(); openExternal(x.lbext, '', it && it.name); }
        else if (x.lbpvx !== undefined) libPvClose();
        else if (x.lbdo) libDo(x.lbdo);
      });
      d.addEventListener('click', (e) => {
        if (e.detail < 2) return;
        const c = e.target.closest('[data-lbc]'); if (!c || !libSt || e.target.closest('input,button')) return;
        const it = libItem(c.dataset.lbc); if (!it) return;
        if (libIsVid(it)) multiClick(e.detail, () => libPlayDefault(it), () => { libPvClose(); openExternal(it.id, '', it.name); });
        else if (e.detail === 2) libReveal(it.id);
      });
      d.addEventListener('keydown', (e) => {
        const c = e.target.closest && e.target.closest('[data-lbc]'); if (!c || !libSt) return;
        if (e.key === 'Enter') { e.preventDefault(); const it = libItem(c.dataset.lbc); if (libIsVid(it)) libPlayDefault(it); else if (it) libReveal(it.id); }
        else if (e.key === ' ') { e.preventDefault(); c.click(); const it = libItem(c.dataset.lbc); if (libIsVid(it)) libPreview(it.id, { armed: true }); }
      });
      // 名前で絞り込む（入力のたびに左の一覧だけ描き直す）
      d.addEventListener('input', (e) => {
        const t = e.target; if (!libSt || t.dataset.lbpq === undefined) return;
        libSt.pq = t.value; const side = d.querySelector('.pp-side'); if (!side) return;
        const pos = t.selectionStart; libSt.ppScroll = 0; side.outerHTML = pplSideHtml();
        const ni = d.querySelector('[data-lbpq]'); if (ni) { ni.focus(); try { ni.setSelectionRange(pos, pos); } catch (er) { /* 無視 */ } }
      });
      // 右クリック・長押し・Shift+F10（メニューキー）で作品のメニュー
      const libMenu = (c, x, y, kbd) => {
        const it = libItem(c.dataset.lbc); if (!it || it.folder) return;
        libSt.cur = it.id; d.querySelectorAll('[data-lbc].cur').forEach((q) => q.classList.remove('cur')); c.classList.add('cur');
        workMenu(x, y, { id: it.id, name: it.name, el: c, kbd, preview: () => libPreview(it.id), beforeExt: () => libPvClose(), info: () => libPreview(it.id).then(() => { const pv = d.querySelector('.lb-pv'); if (pv) pvInfoToggle(pv, it.id, it.name); }) });
      };
      d.addEventListener('contextmenu', (e) => { const c = e.target.closest('[data-lbc]'); if (!c || !libSt) return; e.preventDefault(); libMenu(c, e.clientX, e.clientY); });
      longPress(d, '[data-lbc]', (c, x, y) => { if (libSt) libMenu(c, x, y); });
      d.addEventListener('keydown', (e) => { if (!((e.key === 'F10' && e.shiftKey) || e.key === 'ContextMenu')) return; const c = e.target.closest && e.target.closest('[data-lbc]'); if (!c || !libSt) return; e.preventDefault(); const r = c.getBoundingClientRect(); libMenu(c, r.left + 20, r.top + 20, true); });
      d.addEventListener('change', (e) => {
        const t = e.target; if (!libSt) return;
        if (t.dataset.lbi !== undefined) { if (t.checked) libSt.sel.add(t.dataset.lbi); else libSt.sel.delete(t.dataset.lbi); renderLib(); }
        else if (t.dataset.lball !== undefined) { libSt.sel = new Set(t.checked ? libSt.items.map((i) => i.id) : []); renderLib(); }
      });
    }
    root.classList.add('libv'); closePlayer(); hideHover();
    libLoad(libSt.tab); ddKick();
  }
  function closeLib() { libPvClose(); const d = document.getElementById('pd-lib'); if (d) d.remove(); root.classList.remove('libv'); libSt = null; renderRail(); ddKick(); }
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !document.getElementById('pd-lib') || !libSt || libSt.busy) return;
    if (document.fullscreenElement) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (document.querySelector('#pd-lib .lb-pv')) libPvClose(); else closeLib();
  }, true);
  async function libLoad(tab) {
    libPvClose();
    libSt.tab = tab; libSt.items = []; libSt.sel.clear(); libSt.cur = ''; libSt.err = ''; libSt.loading = true; renderLib(); renderRail();
    const my = libSt;
    try {
      const r = await libFetch(tab);
      if (libSt !== my || my.tab !== tab) return;
      if (r === null) my.err = 'scan'; else my.items = r;
      if (tab === 'dl') libBadge.dl = r.filter((t) => t.st === 'run' || t.st === 'wait').length;
      if (tab === 'trash') libBadge.trash = r.length;
    } catch (e) { if (libSt === my) my.err = e.message || String(e); }
    if (libSt !== my) return;
    my.loading = false; renderLib(); renderRail();
  }
  function libReveal(id) {
    if (!fileById(id) && !dirById(id)) { status('この項目は、読み込んだ範囲の外にあるか、読み込んだあとに追加されたものです。「再読み込み」すると場所を開けます'); return; }
    closeLib(); if (view !== 'tree') openTree(); revealInTree(id);
  }
  // ---- 左メニューの中で見る簡易プレビュー（PikPak が用意している軽い変換画質。本編は外部プレーヤーをすすめる） ----
  let libPvRun = 0;
  function libPvClose() {
    libPvRun++;
    const p = document.querySelector('#pd-lib .lb-pv'); if (!p) return;
    unloadMedia(p); plStop('lib'); p.remove();
    const c = libSt && libSt.cur && document.querySelector(`#pd-lib [data-lbc="${CSS.escape(libSt.cur)}"]`); if (c) c.focus();
  }
  async function libPreview(id, opt = {}) {
    const it = libItem(id); if (!it || !libIsVid(it)) return;
    const d = document.getElementById('pd-lib'); if (!d) return;
    libPvClose(); libSt.cur = id;
    const run = ++libPvRun;
    const p = document.createElement('div'); p.className = 'lb-pv';
    const fi = fileById(id);
    p.innerHTML = `<div class="lb-pvbox pv" role="dialog" aria-label="プレビュー">${pvHeadHtml(it.name, 'data-lbpvx')}
      <div class="lb-pvv"><div class="pl-msg">再生の準備中…</div></div>
      ${pvFootHtml({ info: `ビデオ${it.size ? '・' + fmt(it.size) : ''}`, path: fi ? pvPath(fi) : (it.path ? String(it.path).replace(/\/?$/, '/') : '') })}</div>`;
    d.appendChild(p);
    pvWire(p, { id, name: it.name, frames: () => { libPvClose(); openFrames([id]); }, loc: () => libReveal(id), ext: () => { libPvClose(); openExternal(id, '', it.name); } });
    const box = p.querySelector('.lb-pvv');
    const vids = libSt.items.filter(libIsVid), vi = vids.findIndex((v) => v.id === id);
    const seqL = qpSeq(vids, id, (nid) => libPreview(nid));
    const P = playerCore(box, id, {
      slot: 'lib', name: it.name, qHost: p.querySelector('.pv-q'), armed: opt.armed, poster: it.thumb || '',
      alive: () => run === libPvRun && document.body.contains(p),
      noSource: 'このブラウザの中では再生できません。「↗ 外部プレーヤーで見る」を使ってください。',
      unplayable: 'このブラウザの中では再生できません。「↗ 外部プレーヤーで見る」を使ってください。',
      fail: (q, why) => { if (!box.querySelector('.pl-err')) box.insertAdjacentHTML('beforeend', `<div class="pl-msg pl-err">再生できませんでした${why ? `（${esc(why)}）` : ''}。「↗ 外部プレーヤーで見る」を試してください。</div>`); },
      qp: { ext: () => { libPvClose(); openExternal(id, '', it.name); }, close: () => libPvClose(), ...seqL },
      onMeta: (v) => pvDim(p, v),
      // 続けて流す：終わったら次の動画へ（設定でオフにできる）
      onEnded: () => { if (run === libPvRun && seqL.next && libAuto()) seqL.next(); },
    });
    try {
      if (!(await P.ready)) return;
      log('info', `左メニューからプレビュー：${P.x ? P.x.label : ''}`, it.name);
    } catch (err) {
      if (err.session) { closeLib(); handleErr(err, view); return; }
      if (run === libPvRun) box.innerHTML = `<div class="pl-msg pl-err">${err.gone ? '' : '再生用リンクを取得できませんでした：'}${esc(err.message || err)}</div>`;
    }
  }
  async function libDo(op) {
    const ids = [...libSt.sel]; const my = libSt;
    const n = ids.length;
    const chunk = async (fn) => { for (let i = 0; i < ids.length; i += 100) await fn(ids.slice(i, i + 100)); };
    let msg = '';
    if (op === 'empty') { if (!confirm(`ゴミ箱の ${my.items.length} 項目を完全に削除します。元に戻せません。よろしいですか？`)) return; }
    else if (op === 'del') { if (!n || !confirm(`選んだ ${n} 項目を完全に削除します。元に戻せません。よろしいですか？`)) return; }
    else if (op === 'candtrash') { if (!n || !confirm(`選んだ ${n} 項目を PikPak のゴミ箱へ移します。よろしいですか？（ゴミ箱から元に戻せます）`)) return; }
    else if (!n) return;
    my.busy = true; renderLib();
    try {
      if (op === 'restore') { await chunk((c) => api('/files:batchUntrash', { method: 'POST', body: JSON.stringify({ ids: c }) })); msg = `${n} 項目を元の場所に戻しました（Dedupe の一覧に出すには「再読み込み」）`; }
      else if (op === 'del') { await chunk((c) => api('/files:batchDelete', { method: 'POST', body: JSON.stringify({ ids: c }) })); msg = `${n} 項目を完全に削除しました`; }
      else if (op === 'empty') { await api('/files/trash:empty', { method: 'PATCH' }); msg = 'ゴミ箱を空にしました'; }
      else if (op === 'uncand') { ids.forEach((id) => { mediaPut(id, { tri: null }); delete decision[id]; }); mediaSave(true); saveDecision(); msg = `${n} 項目を消す候補から外しました`; }
      else if (op === 'candtrash') { await chunk((c) => api('/files:batchTrash', { method: 'POST', body: JSON.stringify({ ids: c }) })); ids.forEach((id) => { mediaPut(id, { tri: null }); delete decision[id]; }); mediaSave(true); saveDecision(); msg = `${n} 項目をゴミ箱へ移しました（Dedupe の一覧に反映するには「再読み込み」）`; }
      else if (op === 'unstar') { await chunk((c) => api('/files:unstar', { method: 'POST', body: JSON.stringify({ ids: c }) })); msg = `${n} 項目のスターを外しました`; }
      else if (op === 'cancel') { const it2 = my.items.filter((x) => my.sel.has(x.id)); const tids = it2.map((x) => x.task).filter(Boolean), lids = new Set(it2.map((x) => x.lid).filter(Boolean)); for (let i = 0; i < tids.length; i += 100) await api(`/tasks?task_ids=${tids.slice(i, i + 100).join(',')}&delete_files=false`, { method: 'DELETE' }).catch((e) => { if (e.session) throw e; }); if (lids.size) addLogWrite(addLogRead().filter((r) => !lids.has(r.lid))); msg = `${n} 件をダウンロードの一覧から外しました（ダウンロード済みのファイルは残ります）`; }
      log('info', msg); status(msg);
    } catch (e) { if (e.session) { my.busy = false; closeLib(); throw e; } status('うまくいきませんでした：' + (e.message || e)); log('warn', '左メニューの操作に失敗：' + (e.message || e), op); }
    my.busy = false;
    if (libSt === my) { if (op === 'empty' || op === 'del' || op === 'restore' || op === 'candtrash') refreshQuota(true); libLoad(my.tab); }
  }
  // 下の操作ボタン（サムネイル表示のタブは、選んだカードに対する操作）
  function libActs() {
    const S = libSt, tab = S.tab, n = S.sel.size, dis = S.busy || S.loading ? ' disabled' : '';
    if (LIB_GRID.has(tab)) {
      const it = libItem(S.cur), v = libIsVid(it), id = it ? esc(it.id) : '';
      const name = it ? `<b title="${esc(it.name)}">${esc(it.name)}</b>` : '選んでスペースでプレビュー、' + (xclick() === 'double' ? 'ダブルクリックで外部プレーヤー' : 'ダブルクリックで「' + esc(prefLabel()) + '」' + esc(xclickHint()));
      return `<span class="tx lb-sel">${S.busy ? '処理しています…' : name}</span>${tab === 'recent' ? `<span class="seg">${[7, 30].map((x) => `<button data-lbdays="${x}" class="${S.days === x ? 'on' : ''}"${dis}>直近 ${x} 日</button>`).join('')}</span>` : ''}${tab === 'cand' ? `<button data-lbdo="uncand"${n ? '' : ' disabled'}${dis} title="選んだものを消す候補から外す（ファイルはそのまま）">候補から外す（${n}）</button><button class="dng" data-lbdo="candtrash"${n ? '' : ' disabled'}${dis} title="選んだものを PikPak のゴミ箱へ移す（ゴミ箱から戻せます）">ゴミ箱へ（${n}）</button>` : ''}${tab === 'star' ? `<button data-lbdo="unstar"${n ? '' : ' disabled'}${dis}>スターを外す（${n}）</button>` : ''}<button class="sub" data-lbopen="${id}"${it ? '' : ' disabled'} title="フォルダ一覧でこの項目の場所を開く">場所を開く</button><button data-lbpv="${id}"${v ? '' : ' disabled'} title="PikPak が用意している軽い画質で、この画面の中ですぐ見る">▶ プレビュー（低画質）</button><button class="pri" data-lbext="${id}"${v ? '' : ' disabled'} title="本編をきちんと見るときに。オリジナル画質で外部プレーヤーを開きます">↗ 外部プレーヤー（本編）</button>`;
    }
    return `<span class="tx">${S.busy ? '処理しています…' : ''}</span>` + {
      dl: `<button data-lbdo="cancel"${n ? '' : ' disabled'}${dis}>一覧から外す（${n}）</button><button class="pri" data-lbadd${dis}>リンクを追加…</button>`,
      trash: `<button data-lbdo="restore"${n ? '' : ' disabled'}${dis}>元に戻す（${n}）</button><button class="dng" data-lbdo="del"${n ? '' : ' disabled'}${dis}>完全に削除（${n}）</button><button class="dng" data-lbdo="empty"${S.items.length ? '' : ' disabled'}${dis}>ゴミ箱を空にする</button>`,
    }[tab];
  }
  function libFoot() { const f = document.querySelector('#pd-lib .lk-ft'); if (f && libSt) f.innerHTML = libActs(); }
  function renderLib() {
    const d = document.getElementById('pd-lib'); if (!d || !libSt) return;
    const S = libSt, tab = S.tab, grid = LIB_GRID.has(tab);
    const when = (t) => fmtDate(t);
    const tabs = LIB_TABS.map(([k, l]) => `<button class="lb-tab${k === tab ? ' on' : ''}" data-lbtab="${k}">${LIB_IC[k]}<span>${l}</span>${k === 'dl' && libBadge.dl ? `<i>${libBadge.dl}</i>` : k === 'trash' && libBadge.trash ? `<i>${libBadge.trash}</i>` : ''}</button>`).join('');
    const selectable = tab === 'dl' || tab === 'trash' || tab === 'star' || tab === 'cand';
    const cb = (it) => `<input type="checkbox" data-lbi="${esc(it.id)}"${S.sel.has(it.id) ? ' checked' : ''}${S.busy ? ' disabled' : ''} aria-label="選ぶ">`;
    // どこまで見たか（青い線。見終わったものは灰色の線）
    const triTag = (it) => { const m = !it.folder && mediaGet(it.id); return m && m.tri ? `<span class="lb-tri ${m.tri}">${m.tri === 'keep' ? '残す' : '消す候補'}</span>` : ''; };
    const prog = (it) => { const m = !it.folder && mediaGet(it.id); if (!m) return ''; if (m.done) return '<i class="lb-prog done" style="width:100%" title="見終わった"></i>'; return m.pos > 0 && m.dur ? `<i class="lb-prog" style="width:${Math.min(100, Math.max(2, m.pos / m.dur * 100)).toFixed(1)}%" title="${fmtClock(m.pos)} まで見た"></i>` : ''; };
    const card = (it) => {
      const r = { name: it.name, ext: extOf(it.name) };
      const th = it.thumb ? `<img loading="lazy" referrerpolicy="no-referrer" src="${esc(it.thumb)}" alt="">` : `<span class="ph">${it.folder ? ICON_DIR : ICON_FILE(r)}</span>`;
      const mm = !it.folder && mediaGet(it.id);
      const info = [it.size && !it.folder ? fmt(it.size) : '', tab === 'cont' && mm && mm.pos ? `途中 ${fmtClock(mm.pos)} / ${fmtClock(mm.dur || 0)}` : when(it.at)].filter(Boolean).join('・');
      return `<div class="lb-card${S.cur === it.id ? ' cur' : ''}" data-lbc="${esc(it.id)}" tabindex="0" title="${esc(it.name)}${tab === 'recent' && it.path ? '\n' + esc(it.path) : ''}"><div class="lb-th">${th}${libIsVid(it) ? '<span class="lb-play">▶</span>' : ''}${prog(it)}${triTag(it)}${selectable ? cb(it) : ''}</div><div class="lb-ct"><b>${esc(it.name)}</b><small>${esc(info)}</small></div></div>`;
    };
    const row = (it) => {
      let tag = '', info = [it.size ? fmt(it.size) : '', when(it.at)];
      if (tab === 'dl') {
        const T = { ok: ['ok', '保存済み'], run: ['pri', `ダウンロード中 ${it.pct}%`], wait: ['pri', '順番待ち'], err: ['del', '失敗'], fail: ['del', '追加できませんでした'], missing: ['warn', '見つかりません'], gone: ['mute', 'タスク終了'] }[it.st] || ['mute', it.st];
        tag = `<span class="lk-tag ${T[0]}">${T[1]}</span>`;
        info.unshift({ part: 'すぐ保存', all: 'クラウドダウンロード', pikpak: 'PikPak の画面などで追加' }[it.mode] || '');
        if ((it.st === 'err' || it.st === 'fail') && it.msg) info.push(it.msg);
        if (it.st === 'missing') info.push('保存先に見当たりません（削除・移動した可能性があります）');
      }
      if (tab === 'trash' && it.miss) { tag = '<span class="lk-tag warn" title="名前は数字だけですが、入っていたフォルダの品番と同じ番号です。消してよいか確かめてください">取りこぼし候補</span>'; info.unshift('フォルダ「' + it.miss + '」の品番と同じ番号'); }
      const openId = tab === 'dl' && it.st === 'ok' ? it.fid : '';
      const retry = tab === 'dl' && it.url && (it.st === 'fail' || it.st === 'err' || it.st === 'missing') ? `<button data-lbre="${esc(it.id)}" title="このリンクを、リンク追加の画面にもう一度入れます">もう一度追加</button>` : '';
      const bar = tab === 'dl' && it.st === 'run' ? `<span class="uz-bar"><i style="width:${it.pct}%"></i></span>` : '';
      return `<div class="lb-row">${cb(it)}<span class="lb-t"><b title="${esc(it.name)}">${it.folder ? '📁 ' : ''}${esc(it.name)}</b><small>${esc(info.filter(Boolean).join('・'))}</small>${bar}</span>${tag}${retry}${openId ? `<button data-lbopen="${esc(openId)}" title="フォルダ一覧でこの項目の場所を開く">場所を開く</button>` : ''}</div>`;
    };
    const lv = libView();
    const lsz = (() => { return lsGet('ppdup:libsize:v1') || 'm'; })();
    let body;
    if (S.loading) body = '<div class="empty">読み込み中…</div>';
    else if (S.err === 'scan') body = '<div class="empty">「最近追加したもの」は、読み込んだ内容から作ります。先に左の「再読み込み」で PikPak の中身を読み込んでください。</div>';
    else if (S.err) body = `<div class="empty">読み込めませんでした：${esc(S.err)}</div>`;
    else if (!S.items.length) body = `<div class="empty">${{ dl: 'まだ何も追加していません（Dedupe の「リンクを追加」で追加したものと、PikPak のダウンロードがここに出ます）', recent: `この ${S.days} 日間に追加したものはありません`, cand: '消す候補はありません（再生中に D キーか「消す候補」を押すと、ここに集まります）', cont: '途中で止めた動画はありません（Dedupe で再生して途中で閉じると、ここに出ます）', hist: '再生した履歴はありません', star: 'スター付きの項目はありません', trash: 'ゴミ箱は空です' }[tab]}</div>`;
    else if (grid && lv === 'tile') body = `<div class="lb-grid sz-${lsz}">${S.items.map(card).join('')}</div>`;
    else if (grid) {
      // リスト（フォルダごとにまとめる）・サムネイル（大きめの画像つきの行）
      const li = (it) => {
        const th = it.thumb ? `<img loading="lazy" referrerpolicy="no-referrer" src="${esc(it.thumb)}" alt="">` : `<span class="ph">${it.folder ? ICON_DIR : ICON_FILE({ name: it.name, ext: extOf(it.name) })}</span>`;
        return `<div class="lb-li ${lv}${S.cur === it.id ? ' cur' : ''}" data-lbc="${esc(it.id)}" tabindex="0" title="${esc(it.name)}">${tab === 'star' ? cb(it) : ''}<span class="th">${th}${libIsVid(it) ? '<span class="lb-play">▶</span>' : ''}${prog(it)}</span><span class="nm"><b>${esc(it.name)}</b>${lv === 'thumb' && it.path ? `<small>${esc(it.path)}</small>` : ''}</span><span class="sz">${it.size && !it.folder ? fmt(it.size) : ''}</span><span class="dt">${esc(when(it.at))}</span></div>`;
      };
      if (lv === 'list' && tab === 'recent') {
        // 最近追加したものだけのツリー：追加したファイルのあるフォルダだけを、階層ごとに開いたり閉じたりできる
        const rootN = { name: '', path: '', kids: new Map(), files: [], n: 0 };
        S.items.forEach((it) => {
          let node = rootN, acc = '';
          for (const seg of String(it.path || '/').split('/').filter(Boolean)) { acc += '/' + seg; if (!node.kids.has(seg)) node.kids.set(seg, { name: seg, path: acc, kids: new Map(), files: [], n: 0 }); node = node.kids.get(seg); node.n++; }
          node.files.push(it);
        });
        const closed = S.closed || (S.closed = new Set());
        const tn = (node, dep) => {
          // 1 つしか子がないフォルダは、まとめて 1 行に（/My Pack/作品 のように）
          let n = node, label = node.name;
          while (n.kids.size === 1 && !n.files.length) { const c = [...n.kids.values()][0]; label += ' / ' + c.name; n = c; }
          const open = !closed.has(n.path);
          return `<div class="lb-tn" data-lbtog="${esc(n.path)}" style="padding-left:${10 + dep * 18}px"><span class="tw">${open ? '▾' : '▸'}</span><span class="fi">${ICON_DIR}</span><b>${esc(label)}</b><span class="nn">${node.n} 件</span></div>`
            + (open ? [...n.kids.values()].sort((a, b) => a.name.localeCompare(b.name, 'ja')).map((c) => tn(c, dep + 1)).join('') + n.files.map((it) => `<div class="lb-tf" style="padding-left:${28 + dep * 18}px">${li(it)}</div>`).join('') : '');
        };
        body = `<div class="lb-tree">${[...rootN.kids.values()].map((c) => tn(c, 0)).join('')}${rootN.files.map((it) => li(it)).join('')}</div>`;
      }
      else body = `<div class="lb-lst ${lv}">${S.items.map(li).join('')}</div>`;
    }
    else body = S.items.map(row).join('');
    if (tab === 'people' && S.err !== 'scan') {
      const P = !S.loading && S.pname ? peopleIndex() : null;
      const ks = P ? ((S.pmode === 'sel' ? P.sel : P.act).get(S.pname) || []) : [];
      // 出演者を見ているときは販売者の内訳、販売者のときは出演者の内訳
      const cnt = new Map(); ks.forEach((k) => { const o = P.works.get(k); (S.pmode === 'sel' ? (o.actors.length ? o.actors : [NO_ACT]) : [o.seller || NO_SEL]).forEach((n) => cnt.set(n, (cnt.get(n) || 0) + 1)); });
      const sub = [...cnt.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([n2, c]) => `<button class="pp-chip" data-lbpj="${S.pmode === 'sel' ? 'act' : 'sel'}" data-n="${esc(n2)}">${esc(n2)} ${c}</button>`).join('');
      body = `<div class="pp-wrap">${pplSideHtml()}<div class="pp-main">${S.pname ? `<div class="pp-hd"><b>${esc(S.pname)}</b><span class="note">${S.items.length} 作品</span><span class="pp-sub"><span class="note">${S.pmode === 'sel' ? '出演者：' : '販売者：'}</span>${sub}</span></div>` : ''}${body}</div></div>`;
    }
    const n = S.sel.size, dis = S.busy || S.loading ? ' disabled' : '';
    const pvTip = `スペースでプレビュー（止まった状態で開きます。画質はプレビューの中で選べます）、ダブルクリック・Enter は設定の「再生のしかた」（${esc(prefLabel())}）で開きます。本編は「↗ 外部プレーヤー」（オリジナル画質）がおすすめ。`;
    const note = { people: '作品の情報から、出演者・販売者ごとに作品を並べます（フォルダは動かしません）。右クリック・長押しでメニュー。', dl: 'リンク・マグネットで追加したもの（直近 60 日）。すぐ保存した分は保存先にあるかを、クラウドダウンロードの分は進み具合を確かめて表示します。「一覧から外す」は記録とタスクを消すだけで、保存したファイルは消しません。', recent: '追加日の新しい順（読み込んだ範囲：' + esc(dirLabel((scanRoot() || {}).id) || '—') + '）。' + pvTip, cand: '見ながら仕分けで「消す候補」にしたもの。選んで「ゴミ箱へ」で PikPak のゴミ箱へ移します（すぐには消しません）。', cont: '途中で止めた動画（新しい順）。開くと前回の続きから再生します。', hist: 'Dedupe と PikPak で再生した動画（新しい順）。Dedupe で再生した分はこのブラウザに記録します。' + pvTip, star: 'PikPak でスターを付けた項目。' + pvTip, trash: `ゴミ箱の中身${quota ? `（${fmtCap(quota.trash)}）` : ''}。「完全に削除」「空にする」は元に戻せません。` }[tab];
    const all = selectable && S.items.length ? `<label class="note lb-all"><input type="checkbox" data-lball${n && n === S.items.length ? ' checked' : ''}${dis}> すべて選ぶ</label>` : '';
    const html = `<div class="lk-box" role="dialog" aria-label="${esc(LIB_TABS.find((x) => x[0] === tab)[1])}"><div class="lk-hd"><b>${LIB_TABS.find((x) => x[0] === tab)[1]}</b><span class="note">${S.items.length && !S.loading ? S.items.length + ' 項目' : ''}</span><span class="sp"></span>${grid ? `<span class="seg lb-vw" title="表示のしかた">${[['list', tab === 'recent' ? '🌲 ツリー' : '☰ リスト'], ['thumb', '▤ サムネイル'], ['tile', '▦ タイル']].map(([k, l]) => `<button data-lbview="${k}" class="${lv === k ? 'on' : ''}">${l}</button>`).join('')}</span>${lv === 'list' && tab === 'recent' ? '<span class="seg"><button data-lbtall="open" title="すべて開く">⊞ 全展開</button><button data-lbtall="close" title="すべて閉じる">⊟ 全格納</button></span>' : ''}<button data-lbauto class="${libAuto() ? 'on' : ''}" title="プレビューで動画が終わったら、次の動画を続けて再生します">${libAuto() ? '✓ ' : ''}続けて再生</button>` : ''}${grid && lv === 'tile' ? `<span class="seg lb-sz" title="サムネイルの大きさ">${[['s', '小'], ['m', '中'], ['l', '大']].map(([k, l]) => `<button data-lbsz="${k}" class="${lsz === k ? 'on' : ''}">${l}</button>`).join('')}</span>` : ''}<button data-lbreload title="読み込み直す"${dis}>更新</button><button class="x" data-lbclose title="閉じる（Esc）" aria-label="閉じる">${IC.x}</button></div>
      <div class="lb-tabs">${tabs}</div>
      <div class="lb-note">${note}</div>
      <div class="lk-list">${all}${body}</div>
      <div class="lk-ft">${libActs()}</div></div>`;
    // プレビューを開いたままでも一覧だけ描き直す（動画は止めない）
    const old = d.querySelector('.lk-box'); const sc = old ? (old.querySelector('.lk-list') || {}).scrollTop || 0 : 0;
    // 出演者・販売者の名前の一覧は、選んだ位置のまま（一番上に戻さない）
    const pn = old && old.querySelector('.pp-names'); if (pn) S.ppScroll = pn.scrollTop;
    if (old) old.outerHTML = html; else d.insertAdjacentHTML('afterbegin', html);
    if (sc) { const l = d.querySelector('.lk-list'); if (l) l.scrollTop = sc; }
    if (S.ppScroll) { const l = d.querySelector('.pp-names'); if (l) l.scrollTop = S.ppScroll; }
  }
