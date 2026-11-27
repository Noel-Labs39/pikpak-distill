  // ---------- フォルダ一覧：移動・新規フォルダ・右クリックメニュー・再生 ----------
  const isVideoRow = (r) => !!r && r.kind === 'file' && VIDEO_EXT.has(extOf(r.name)); // 動画かどうかは拡張子だけで決める
  const selRows = () => treeRowsCache.filter((r) => treeSel.has(r.id));
  // to の中へ ids を移動できるか（自分自身や自分の中、読み込んだ場所とその上のフォルダは移動できない）
  function canMoveTo(ids, to) {
    if (!to || (!isHomeId(to) && !dirById(to)) || (isHomeId(to) && !upKnown() && !inScan(to))) return false;
    if (ids.some(isRootOrAbove)) return false;
    const anc = [to, ...ancestorsOf(to)];
    return ids.every((id) => !anc.includes(id));
  }
  // 読み込んだ場所の外へ出したものは、整理の対象（読み込み結果）から外す
  function dropFromScan(it) {
    if (files.includes(it)) { files = files.filter((f) => f !== it); return; }
    const gone = new Set(folders.filter((d) => d.id === it.id || (d.trail || []).includes(it.id)).map((d) => d.id));
    folders = folders.filter((d) => !gone.has(d.id));
    files = files.filter((f) => !gone.has(f.parentId));
  }
  // 読み込んだ場所の中へ入れたものは、整理の対象に加える（フォルダは中身も読み込む）
  async function addToScan(it, to) {
    const np = folders.find((d) => d.id === to) || scanRoot();
    if (!it.kind || it.kind !== 'drive#folder') {
      if (outer.files.has(it.id)) { outer.files.delete(it.id); files.push({ id: it.id, name: it.name, size: it.size, thumb: it.thumb, parentId: to, path: (np && np.path) || '/' }); return; }
    }
    const sub = new Set([it.id, ...[...outer.dirs.keys()].filter((id) => ancestorsOf(id).includes(it.id))]);
    sub.forEach((id) => outer.dirs.delete(id));
    [...outer.files.values()].forEach((f) => { if (sub.has(f.parentId)) outer.files.delete(f.id); });
    const trail = [...((np && np.trail) || [to]), it.id];
    const base = ((np && np.path) || '') + '/' + it.name;
    const r = await scanApi(trail);
    r.folders.forEach((fo) => {
      if (fo.isRoot) { folders.push({ id: it.id, name: it.name, parentId: to, path: base, trail }); return; }
      folders.push({ ...fo, path: base + fo.path });
    });
    r.files.forEach((f) => files.push({ ...f, path: f.path === '/' ? base : base + f.path }));
  }
  async function treeMove(ids, to) {
    if (ids.some(isRootOrAbove)) { status('読み込んだ場所とその上のフォルダは、ここでは移動できません'); return; }
    if (!canMoveTo(ids, to)) { status('そのフォルダへは移動できません（移動するフォルダ自身やその中へは移せません）'); return; }
    const all = new Set(ids);
    const anc = (id) => ancestorsOf(id).some((p) => all.has(p));
    const items = ids.map((id) => fileById(id) || dirById(id)).filter((x) => x && !anc(x.id) && x.parentId !== to);
    if (!items.length) { status('すでにそのフォルダの中にあります'); return; }
    if (!ensureSession('tree')) return;
    const dest = dirLabel(to) || treeIdx.rootName;
    busy = true; status(`移動中… ${items.length} 項目 → ${dest}`, 0.3);
    try {
      const dst = await apiList(to);
      const taken = new Set(dst.map((x) => x.name.toLowerCase()));
      let renamed = 0;
      for (const it of items) {
        if (taken.has(it.name.toLowerCase())) { const nn = addSuffix(it.name, taken); await apiRename(it.id, nn); it.name = nn; renamed++; }
        taken.add(it.name.toLowerCase());
      }
      const idl = items.map((x) => x.id);
      for (let i = 0; i < idl.length; i += 100) { status(`移動中… ${Math.min(i + 100, idl.length)}/${idl.length} → ${dest}`, i / idl.length); await apiMove(idl.slice(i, i + 100), to); }
      const toScan = inScan(to);
      for (const it of items) {
        if (!it.outer && toScan) (files.includes(it) ? cacheMoveFile(it.id, to) : cacheMoveFolder(it.id, to));
        else if (!it.outer) dropFromScan(it);
        else if (toScan) await addToScan({ ...it, kind: outer.dirs.has(it.id) ? 'drive#folder' : 'file' }, to);
        else it.parentId = to;
      }
      if (!toScan && outer.loaded.has(to)) await loadOuter(to);
      if (meta) { meta.nfo = folders.length; meta.nfi = files.length; lsSetJson(LS_META, meta); }
      saveAll(); treeOpen.add(to); saveTree();
      busy = false; treeIdx = null; renderTree();
      status(`${items.length} 項目を「${dest}」へ移動しました${renamed ? `（同じ名前があったため ${renamed} 件に (n) を付けました）` : ''}。`); log('info', `フォルダ一覧で移動 ${items.length} 項目 → ${dest}`); refreshView();
    } catch (err) { saveAll(); busy = false; treeIdx = null; renderTree(); handleErr(err, 'tree', '移動を停止しました：' + err.message); }
  }
  // 新規フォルダ（⌥⌘N／Alt+N）：選んでいるフォルダが開いていればその中、そうでなければ同じ場所に作る
  async function treeNewFolder() {
    const cur = treeRowsCache.find((r) => r.id === treeCur);
    const pid = cur ? (cur.kind === 'folder' && cur.open ? cur.id : cur.parentId) : treeBase();
    if (!ensureSession('tree')) return;
    busy = true; status('フォルダを作成中…', 0.5);
    try {
      const sibs = await apiList(pid);
      const taken = new Set(sibs.map((x) => x.name.toLowerCase()));
      let name = '新規フォルダ', i = 1; while (taken.has(name.toLowerCase())) name = `新規フォルダ ${++i}`;
      const id = await apiMkdir(pid, name);
      if (inScan(pid)) {
        const np = folders.find((d) => d.id === pid);
        folders.push({ id, name, parentId: pid, path: ((np && np.path) || '') + '/' + name, trail: [...((np && np.trail) || [pid]), id] });
      } else { outer.dirs.set(id, { id, name, parentId: pid, outer: true }); outer.loaded.add(id); }
      saveAll(); treeOpen.add(pid); saveTree();
      busy = false; treeSel.clear(); treeSel.add(id); treeCur = id; treeAnchor = id; renaming = id; treeIdx = null; renderTree();
      status('フォルダを作成しました。名前を入力して Enter で確定します。'); log('info', `フォルダ一覧で新規フォルダ：${name}`); refreshView();
    } catch (err) { busy = false; renderTree(); handleErr(err, 'tree', 'フォルダを作成できませんでした：' + err.message); }
  }
  // 移動先を選ぶ画面
  function askMoveTarget(ids) {
    return new Promise((resolve) => {
      const d = mkEl('pd-dlg');
      const topId = upKnown() ? HOME : treeIdx.rootId;
      const list = [{ id: topId, name: dirLabel(topId) || treeIdx.rootName, depth: 0 }];
      const walk = (pid, depth) => (treeIdx.kd.get(pid) || []).slice().sort((a, b) => a.name.localeCompare(b.name, 'ja', { numeric: true })).forEach((f) => { list.push({ id: f.id, name: f.name, depth }); walk(f.id, depth + 1); });
      walk(topId, 1);
      let pick = '';
      const draw = (q) => {
        q = (q || '').toLowerCase();
        d.querySelector('.mv').innerHTML = list.filter((x) => !q || x.name.toLowerCase().includes(q)).map((x) => {
          const ok = canMoveTo(ids, x.id);
          return `<div class="mv-r${pick === x.id ? ' on' : ''}${ok ? '' : ' ng'}" data-mv="${esc(x.id)}" style="padding-left:${8 + (q ? 0 : x.depth * 16)}px">${ICON_DIR}<span>${esc(x.name)}</span></div>`;
        }).join('') || '<div class="note" style="padding:10px">一致するフォルダはありません</div>';
      };
      d.innerHTML = `<div class="box" style="width:min(620px,94vw)"><h3>${ids.length} 項目の移動先を選んでください</h3>
        <input type="text" data-mvq placeholder="🔍 フォルダ名で絞り込み" style="width:100%;box-sizing:border-box;font:inherit;padding:6px 10px;border:1px solid #c5c9d2;border-radius:8px">
        <div class="mv"></div><div class="note">同じ名前のものが移動先にある場合は (1) を付けて移動します。グレーのフォルダ（移動するフォルダ自身とその中）へは移動できません。</div>
        <div class="acts" style="margin-top:12px"><button data-no>キャンセル</button><button class="danger" data-yes disabled style="background:#306fff;border-color:#306fff">ここへ移動</button></div></div>`;
      draw('');
      const done = (v) => { d.remove(); resolve(v); };
      d.querySelector('[data-mvq]').oninput = (e) => draw(e.target.value);
      d.querySelector('.mv').onclick = (e) => { const r = e.target.closest('[data-mv]'); if (!r || r.classList.contains('ng')) return; pick = r.dataset.mv; d.querySelector('[data-yes]').disabled = false; draw(d.querySelector('[data-mvq]').value); };
      d.querySelector('.mv').ondblclick = (e) => { const r = e.target.closest('[data-mv]'); if (r && !r.classList.contains('ng')) done(r.dataset.mv); };
      d.querySelector('[data-no]').onclick = () => done(null);
      d.querySelector('[data-yes]').onclick = () => { if (pick) done(pick); };
      d.addEventListener('keydown', (e) => { if (e.key === 'Escape') done(null); });
      d.querySelector('[data-mvq]').focus();
    });
  }
  async function treeMoveAsk() {
    const rows = selRows(); if (!rows.length) return;
    const to = await askMoveTarget(rows.map((r) => r.id));
    if (to) treeMove(rows.map((r) => r.id), to);
  }
  function copyPath(r) {
    const p = (r.kind === 'folder' ? r.path : (r.path.replace(/\/$/, '') + '/' + r.name)).replace(/^\/?/, '/');
    try { navigator.clipboard.writeText(p); } catch (err) { /* 無視 */ }
    status('場所をコピーしました：' + p);
  }
  // 操作ボタン（選択に合わせて押せる／押せないを切り替える）
  function renderTreeActs() {
    const el = $('[data-r=tsel]'); if (!el) return;
    if (view !== 'tree') { el.innerHTML = ''; el.classList.remove('on'); return; }
    const rows = selRows(), one = rows.length === 1 ? rows[0] : null;
    const dis = (b) => (b && !busy ? '' : ' disabled');
    const fixed = rows.some((r) => isRootOrAbove(r.id));
    el.classList.toggle('on', rows.length > 0);
    el.innerHTML = rows.length
      ? `<span class="cnt">選択中：${rows.length} 項目</span><button class="pri" data-ta="play"${dis(isVideoRow(one))} title="再生：${prefLabel()}（${KEY.open} / ダブルクリック）">▶ 再生</button>
        ${rows.length === 2 && rows.every(isVideoRow) ? '<button data-ta="compare" title="選んだ 2 本を左右に並べて、いっしょに再生して比べる">▶ 2 本を見比べる</button>' : ''}
        <button data-ta="download"${dis(rows.some((r) => r.kind === 'file'))} title="選んだファイルを、このパソコンにダウンロード（一度に ${DL_MAX} 本まで。フォルダは選べません）">⬇ ダウンロード</button>
        <button data-ta="rename"${dis(one)} title="名前を変更（${KEY.rename}）">✎ 名前を変更</button>
        <button data-ta="move"${dis(rows.length && !fixed)} title="${fixed ? '読み込んだ場所とその上のフォルダは、ここでは移動できません' : '移動（ドラッグでも移動できます）'}">↪ 移動…</button>
        ${rows.some((r) => r.kind === 'file' && isArchive(r.name)) ? '<button data-ta="unzip" title="選んだ圧縮ファイルを PikPak の上で解凍">📦 解凍</button>' : ''}
        <button data-ta="base"${dis(one && one.kind === 'folder')} title="選んだフォルダを最上位にして、その中だけを表示（${KEY.open}）">⤓ ここを最上位に</button>
        <button data-ta="trash"${dis(rows.length && !fixed)} class="red" title="${fixed ? '読み込んだ場所とその上のフォルダは、ここではゴミ箱に入れられません' : `ゴミ箱に入れる（${KEY.trash}）`}">🗑 ゴミ箱へ</button>
        <span class="sp"></span><button data-ta="addlink"${dis(true)} title="リンク・マグネットを、選んでいる場所へ追加">🔗 リンクを追加</button><button data-ta="mkdir"${dis(true)} title="新規フォルダ（${KEY.mkdir}）">＋ 新規フォルダ</button>`
      : `<span class="hint">項目を選ぶと、再生・名前の変更・移動・ゴミ箱が使えます（右クリックでもメニューを開けます）</span><span class="sp"></span><button data-ta="addlink"${dis(true)} title="リンク・マグネットを、表示中の場所へ追加">🔗 リンクを追加</button><button data-ta="mkdir"${dis(true)} title="新規フォルダ（${KEY.mkdir}）">＋ 新規フォルダ</button>`;
  }
  // 選んだファイルを、このパソコンへダウンロードする（PikPak のダウンロード用リンクで、ブラウザのダウンロードを始める）
  const DL_MAX = 10;
  async function downloadRows(rows) {
    const fs = rows.filter((r) => r.kind === 'file');
    if (!fs.length) { status('ダウンロードできるのはファイルです。フォルダは、中のファイルを選んでください。'); return; }
    if (fs.length > DL_MAX) { status(`一度にダウンロードできるのは ${DL_MAX} 本までです（${fs.length} 本選ばれています）。`); return; }
    if (!ensureSession('tree')) return;
    const skipped = rows.length - fs.length, total = fs.reduce((a, r) => a + (r.size || 0), 0);
    if (!window.confirm(`${fs.length} 本（${fmt(total)}）をダウンロードします。${skipped ? `\n※フォルダ ${skipped} 件は含みません。` : ''}\n\n始めますか？`)) return;
    let ok = 0, ng = 0;
    for (const r of fs) {
      try {
        const info = await apiGet(r.id);
        const o = (Array.isArray(info.medias) ? info.medias.find((m) => m && m.is_origin && m.link && m.link.url) : null);
        const url = info.web_content_link || (o && o.link.url);
        if (!url) throw new Error('ダウンロード用リンクがありません');
        const a = document.createElement('a'); a.href = url; a.download = r.name; a.rel = 'noopener'; a.style.display = 'none';
        document.body.appendChild(a); a.click(); a.remove(); ok++;
        status(`ダウンロードを始めました：${r.name}（${ok} / ${fs.length}）`);
        await sleep(900);
      } catch (e) { if (e && e.session) { handleErr(e, 'tree'); return; } ng++; log('warn', `ダウンロードできませんでした：${r.name}（${e.message}）`); }
    }
    status(`ダウンロードを始めたのは ${ok} 本${ng ? `、できなかったのは ${ng} 本` : ''}です。保存先はブラウザの設定に従います。`);
    log('info', `ダウンロード：${ok} 本を開始${ng ? `／${ng} 本は失敗` : ''}`);
  }
  function treeAction(a) {
    const rows = selRows(), one = rows.length === 1 ? rows[0] : null;
    closeCtx();
    if (a === 'play' && isVideoRow(one)) playDefault(one.id);
    else if (a === 'playfull' && isVideoRow(one)) playFile(one.id, { full: true });
    else if (a === 'playext' && isVideoRow(one)) openExternal(one.id);
    else if (a === 'download') downloadRows(rows);
    else if (a === 'playset') openSettings('play');
    else if (a === 'compare' && rows.length === 2 && rows.every(isVideoRow)) openCompare(rows.map((r) => r.id));
    else if (a === 'frames' && rows.length && rows.length <= 2 && rows.every(isVideoRow)) openFrames(rows.map((r) => r.id));
    else if (a === 'preview' && one) { treeCur = one.id; showQL(); }
    else if (a === 'rename' && one) { closeQL(); renaming = one.id; renderTree(); }
    else if (a === 'move') treeMoveAsk();
    else if (a === 'mkdir') treeNewFolder();
    else if (a === 'unzip') openUnzip(rows);
    else if (a === 'addlink') openAdd(one ? (one.kind === 'folder' ? one.id : one.parentId) : treeBase());
    else if (a === 'trash' && rows.length) { closeQL(); treeTrash(); }
    else if (a === 'copy' && one) copyPath(one);
    else if (a === 'open' && one && one.kind === 'folder') { treeToggle(one.id, true); renderTree(); }
    else if (a === 'base' && one && one.kind === 'folder') setBase(one.id);
  }
  // 右クリックメニュー
  function closeCtx() { const m = document.getElementById('pd-ctx'); if (m) m.remove(); }
  root.addEventListener('contextmenu', (e) => {
    if (view !== 'tree' || busy) return;
    const row = e.target.closest('.tr-row'); if (!row) return;
    e.preventDefault(); closeCtx();
    if (!treeSel.has(row.dataset.tid)) { treeSelect(row.dataset.tid, null); renderTree(); }
    const rows = selRows(), one = rows.length === 1 ? rows[0] : null;
    const it = (a, label, key, ok, cls) => `<button data-ta="${a}"${ok ? '' : ' disabled'} class="${cls || ''}"><span>${label}</span><kbd>${key || ''}</kbd></button>`;
    const m = document.createElement('div'); m.id = 'pd-ctx';
    m.innerHTML = [
      isVideoRow(one) ? it('play', `▶ 再生（${prefLabel()}）`, KEY.open, true) : '',
      isVideoRow(one) ? it('playfull', '⛶ 全画面で再生', '', true) : '',
      isVideoRow(one) ? it('playext', `↗ 外部プレーヤー（${EXT_PLAYERS[playPref().ext].short}）`, '', true) : '',
      rows.length === 2 && rows.every(isVideoRow) ? it('compare', '▶ 2 本を見比べる', '', true) : '',
      rows.length && rows.length <= 2 && rows.every(isVideoRow) ? it('frames', rows.length === 2 ? '▦ 2 本をコマで比べる' : '▦ コマ一覧', '', true) : '',
      rows.some((r) => r.kind === 'file') ? it('download', '⬇ ダウンロード', '', true) : '',
      isVideoRow(one) ? it('playset', '再生のしかたの設定…', '', true) + '<hr>' : '',
      one && one.kind === 'folder' ? it('open', '開く', '→', true) : '',
      one && one.kind === 'folder' ? it('base', 'このフォルダを最上位にして表示', KEY.open, true) : '',
      it('preview', 'プレビュー', 'Space', !!one), '<hr>',
      it('rename', '名前を変更', KEY.rename, !!one), it('move', `移動…${rows.length > 1 ? `（${rows.length} 項目）` : ''}`, 'ドラッグ', rows.length > 0 && !rows.some((r) => isRootOrAbove(r.id))), it('mkdir', '新規フォルダ', KEY.mkdir, true), it('addlink', one && one.kind === 'folder' ? 'ここにリンクを追加…' : 'リンク・マグネットを追加…', '', true), '<hr>',
      rows.some((r) => r.kind === 'file' && isArchive(r.name)) ? it('unzip', `📦 解凍…${rows.filter((r) => r.kind === 'file' && isArchive(r.name)).length > 1 ? `（${rows.filter((r) => r.kind === 'file' && isArchive(r.name)).length} ファイル）` : ''}`, '', true) + '<hr>' : '',
      it('copy', '場所をコピー', KEY.copy, !!one),
      (() => { if (!isVideoRow(one)) return ''; const { k } = infoKeyOf(one.id, one.name); const wo = k && hasScan() && peopleIndex().works.get(k.key); if (!wo) return ''; return '<hr>' + wo.actors.slice(0, 3).map((n) => `<button data-tppl="act" data-n="${esc(n)}"><span>同じ出演者の作品（${esc(n)}）</span><kbd></kbd></button>`).join('') + (wo.seller ? `<button data-tppl="sel" data-n="${esc(wo.seller)}"><span>同じ販売者の作品（${esc(wo.seller)}）</span><kbd></kbd></button>` : ''); })(), '<hr>',
      it('trash', `ゴミ箱に入れる${rows.length > 1 ? `（${rows.length} 項目）` : ''}`, KEY.trash, rows.length > 0 && !rows.some((r) => isRootOrAbove(r.id)), 'red'),
    ].join('');
    document.body.appendChild(m);
    const w = m.offsetWidth || 220, h = m.offsetHeight || 300;
    m.style.left = Math.min(e.clientX, innerWidth - w - 8) + 'px'; m.style.top = Math.min(e.clientY, innerHeight - h - 8) + 'px';
    m.addEventListener('click', (ev) => { const pb = ev.target.closest('[data-tppl]'); if (pb) { closeCtx(); openPeople(pb.dataset.tppl, pb.dataset.n); return; } const b = ev.target.closest('[data-ta]'); if (b && !b.disabled) treeAction(b.dataset.ta); });
  });
  document.addEventListener('mousedown', (e) => { const m = document.getElementById('pd-ctx'); if (m && !m.contains(e.target)) closeCtx(); }, true);
  root.addEventListener('click', (e) => { const b = e.target.closest('[data-ta]'); if (b && !b.disabled && view === 'tree' && !busy) treeAction(b.dataset.ta); });

  // ドラッグで移動（Finder・エクスプローラーと同じく、フォルダの上で離すとその中へ。フォルダの上で少し待つと開く）
  let drag = null;
  function dragTarget(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el || !root.contains(el)) return null;
    const row = el.closest('.tr-row');
    if (row) { const r = treeRowsCache.find((q) => q.id === row.dataset.tid); if (!r) return null; return { id: r.kind === 'folder' ? r.id : r.parentId, row: r.kind === 'folder' ? row : null, hover: r }; }
    const cb = el.closest('[data-tbase],[data-tdrop]');
    if (cb) return { id: cb.dataset.tbase || cb.dataset.tdrop, row: cb };
    if (el.closest('.tr')) return { id: treeBase(), row: null };
    return null;
  }
  document.addEventListener('mousemove', (e) => {
    if (!drag) return;
    if (!drag.active) { if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 6) return; drag.active = true; drag.ghost = document.createElement('div'); drag.ghost.id = 'pd-drag'; drag.ghost.textContent = drag.ids.length === 1 ? (treeRowsCache.find((r) => r.id === drag.ids[0]) || {}).name : `${drag.ids.length} 項目`; document.body.appendChild(drag.ghost); }
    drag.ghost.style.left = (e.clientX + 14) + 'px'; drag.ghost.style.top = (e.clientY + 10) + 'px';
    root.querySelectorAll('.drop').forEach((x) => x.classList.remove('drop'));
    const t = dragTarget(e.clientX, e.clientY);
    drag.to = t && canMoveTo(drag.ids, t.id) ? t.id : '';
    if (drag.to && t.row) t.row.classList.add('drop');
    drag.ghost.classList.toggle('ng', !drag.to);
    // フォルダの上で 0.8 秒止まったら開く（スプリングロード）
    const hov = t && t.hover && t.hover.kind === 'folder' && !t.hover.open ? t.hover.id : '';
    if (hov !== drag.hov) { clearTimeout(drag.timer); drag.hov = hov; if (hov) drag.timer = setTimeout(() => { if (drag && drag.hov === hov) { treeToggle(hov, true); renderTree(); } }, 800); }
    // 端に近づいたらスクロール
    const main = $('[data-r=main]'), rc = main.getBoundingClientRect();
    if (e.clientY < rc.top + 40) main.scrollTop -= 18; else if (e.clientY > rc.bottom - 40) main.scrollTop += 18;
  });
  document.addEventListener('mouseup', (e) => {
    if (!drag) return;
    const d = drag; drag = null; clearTimeout(d.timer);
    if (d.ghost) d.ghost.remove();
    root.querySelectorAll('.drop').forEach((x) => x.classList.remove('drop'));
    if (d.active && d.to) treeMove(d.ids, d.to);
    else if (!d.active && d.single && treeSel.size > 1) { treeSelect(d.single, null); renderTree(); }
  });

  // 再生（PikPak の再生用リンクを取得して、この画面の中で再生する）
  // HLS（PikPak の変換画質）は Chrome / Edge / Firefox では標準で再生できないため hls.js を使う（Safari は標準で再生可）
  const LS_PLQ = 'ppdup:player:q:v2'; // 前回選んだ画質の種類（orig＝オリジナル／trans＝変換画質）
  const LS_PLAY = 'ppdup:player:v1'; // 再生のしかた { mode: inline|window|full|external, ext }
  // 再生中のプレーヤー（置き場所ごとに 1 つ）：main＝プレーヤー画面、ql＝フォルダ一覧のプレビュー、lib＝左メニューのプレビュー
  const PL = { main: null, ql: null, lib: null };
  function plStop(slot) { const P = PL[slot]; PL[slot] = null; if (P) P.stop(); }
  const TS_DL = 'https://web-vod-xdrive.mypikpak.com/ts_downloader', TS_CLIENT = 'UElLUEFLX1dFQg';
  // ts_downloader の一覧（m3u8）を hls.js で読める形に直す（BYTERANGE と EXTINF の順番）
  const fixTsM3u8 = (t) => { t = String(t || '').replace(/\r\n/g, '\n'); if (!t.includes('#EXTM3U')) return t; return t.replace(/(#EXT-X-BYTERANGE:[^\n]+)\n(#EXTINF:[^\n]+)\n/g, '$2\n$1\n'); };
  const isHlsUrl = (u) => /\.m3u8(\?|#|$)|ts_downloader|[?&](format|type)=(hls|m3u8)\b|\/hls(\/|$)/i.test(String(u || ''));
  function getHls() {
    const H = window.Hls || (typeof Hls !== 'undefined' ? Hls : null); // eslint-disable-line no-undef
    if (H || getHls.loading) return Promise.resolve(H || null);
    // @require が効かない環境向けに、念のため読み込みを試す
    getHls.loading = new Promise((res) => {
      const sc = document.createElement('script'); sc.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.6.15/dist/hls.min.js'; sc.integrity = 'sha384-iZBI1/lW9u8FcBjxuQ8nPTsU7TXhZNtzkV8H3gQHSTgz+VYQoKWqGlBHqhO84alJ'; sc.crossOrigin = 'anonymous'; // 中身が書き換えられていたら読み込まない
      sc.onload = () => res(window.Hls || null); sc.onerror = () => res(null);
      document.head.appendChild(sc); setTimeout(() => res(window.Hls || null), 8000);
    });
    return getHls.loading;
  }
  const killHls = (h) => { if (h) { try { h.destroy(); } catch (e) { /* 無視 */ } } };
  function stopHls() { plStop('main'); }

  // ---- 外部プレーヤー（OS ごとに、よく使われていて URL で起動できるもの） ----
  //   ※ URL スキームで起動できないプレーヤー（GOM Player・VLC・MPC など）は「既定のアプリで開く（.m3u）」で、
  //     OS で .m3u を開くアプリに設定しているプレーヤーが起動します
  const EXT_PLAYERS = {
    iina: { short: 'IINA', name: 'IINA', os: ['mac'], url: (u) => 'iina://weblink?url=' + encodeURIComponent(u) },
    infuse: { short: 'Infuse', name: 'Infuse', os: ['mac'], url: (u) => 'infuse://x-callback-url/play?url=' + encodeURIComponent(u) },
    potplayer: { short: 'PotPlayer', name: 'PotPlayer', os: ['win'], url: (u) => 'potplayer://' + u },
    m3u: { short: '既定のアプリ', name: '既定のアプリで開く（.m3u を保存して開く：GOM Player・VLC・MPC・mpv など）', os: ['mac', 'win', 'linux'] },
    copy: { short: 'リンクをコピー', name: 'リンクをコピー（プレーヤーの「URL を開く」に貼り付け）', os: ['mac', 'win', 'linux'] },
  };
  const extList = () => Object.keys(EXT_PLAYERS).filter((k) => EXT_PLAYERS[k].os.includes(OS));
  const MODES = { inline: 'プレビューの中で再生', full: '全画面で再生', external: '外部プレーヤーで再生' };
  function playPref() {
    let p = {}; p = lsJson(LS_PLAY, {});
    if (!MODES[p.mode]) p.mode = 'inline'; // 以前の「プレーヤー画面」はプレビューでの再生にまとめた
    if (!extList().includes(p.ext)) p.ext = IS_MAC ? 'iina' : OS === 'win' ? 'potplayer' : 'm3u';
    return p;
  }
  // 外部プレーヤーをすぐ開く操作：triple＝3 回クリック（既定）／double＝2 回クリック／off＝使わない
  //   3 回にしているときは、2 回目のあと少し待ってから「再生のしかた」で再生する（3 回目が来たら外部プレーヤー）
  const XCLICK = { triple: 'トリプルクリック（3 回）', double: 'ダブルクリック（2 回）', off: '使わない' };
  const xclick = () => { const v = playPref().xclick; return XCLICK[v] ? v : 'triple'; };
  let mcT = null;
  function multiClick(n, onDouble, onExt) {
    const x = xclick();
    if (n >= 3) { clearTimeout(mcT); if (x === 'triple') onExt(); return; }
    if (n !== 2) return;
    if (x === 'double') { onExt(); return; }
    if (x === 'off') { onDouble(); return; }
    clearTimeout(mcT); mcT = setTimeout(onDouble, 300);
  }
  const xclickHint = () => ({ triple: '・3 回クリックで外部プレーヤー', double: '・ダブルクリックで外部プレーヤー', off: '' })[xclick()];
  const savePlayPref = (p) => { lsSetJson(LS_PLAY, p); };
  const prefLabel = () => { const p = playPref(); return p.mode === 'external' ? '外部：' + EXT_PLAYERS[p.ext].short : MODES[p.mode]; };

  // 再生用リンクを取得して、画質の候補を作る
  // 再生しようとしたファイルが PikPak にもうないとき：分かりやすい知らせに置き換え、再生の記録（履歴・続きを見る）から外す
  function markGone(id) {
    const db = mediaAll(); const name = (db[id] || {}).name || (fileById(id) || {}).name || id;
    if (db[id]) { delete db[id]; mediaSave(true); }
    if (libSt && libSt.items.some((x) => x.id === id)) { libSt.items = libSt.items.filter((x) => x.id !== id); renderLib(); }
    log('info', 'PikPak にもうないファイルを再生の記録から外しました（削除・整理で消えたもの）', name);
    const e = new Error('このファイルは PikPak にもうありません（削除されたか、整理でゴミ箱へ移したもの）。再生の記録から外しました'); e.gone = true; return e;
  }
  async function loadSources(id) {
    let info;
    try { info = await apiGetOne(id, '?thumbnail_size=SIZE_LARGE'); } catch (e) { if (e.gone) throw markGone(id); throw e; }
    const src = [];
    (Array.isArray(info.medias) ? info.medias : []).forEach((m) => {
      const url = m && m.link && m.link.url; if (!url) return;
      const origin = m.is_origin === true || String(m.is_origin) === 'true';
      const nm = m.media_name || m.resolution_name || '';
      const v = m.video || {};
      const h = parseInt(v.height || m.height || (String(nm).match(/(\d{3,4})\s*p/i) || [])[1] || 0, 10);
      // 変換画質（480P・720P など）は MPEG-TS のままなので、PikPak の画面と同じく ts_downloader を通して HLS にする
      const ts = !origin && (/[?&]ext=\.m3u8/i.test(url) || String(v.video_type || m.video_type || '').toLowerCase() === 'mpegts');
      const purl = ts && !/ts_downloader/.test(url) ? `${TS_DL}?client_id=${TS_CLIENT}&url=${encodeURIComponent(url.replace('&ext=.m3u8', '').replace('?ext=.m3u8&', '?').replace('?ext=.m3u8', ''))}` : url;
      src.push({ label: origin ? 'オリジナル画質' + (nm && !/orig/i.test(nm) ? `（${nm}）` : '') : (nm || (h ? h + 'P' : '変換画質')), url: purl, origin, h, hls: ts || isHlsUrl(purl), tsdl: ts , codec: String(v.video_codec || m.video_codec || '').toLowerCase() });
    });
    if (info.web_content_link) src.push({ label: '元ファイル（ダウンロード用リンク）', url: info.web_content_link, origin: true, h: 0, dl: true, hls: false });
    // 並び：オリジナル → 変換画質（高い順） → 元ファイル
    src.sort((a, b) => (!!a.dl - !!b.dl) || (!!b.origin - !!a.origin) || (b.h - a.h));
    const H = await getHls();
    const nativeHls = !!document.createElement('video').canPlayType('application/vnd.apple.mpegurl');
    const canHls = nativeHls || !!(H && H.isSupported && H.isSupported());
    // 変換画質は HEVC（H.265）のことがある。この環境で HEVC を再生できなければ、その画質は使わない（音だけで画面が真っ黒になるため）
    const MS = window.ManagedMediaSource || window.MediaSource;
    const hevcOk = (() => { try { return !!(MS && MS.isTypeSupported && (MS.isTypeSupported('video/mp4; codecs="hvc1.1.6.L93.B0"') || MS.isTypeSupported('video/mp4; codecs="hev1.1.6.L93.B0"'))); } catch (e) { return false; } })();
    const playable = (x) => (!x.hls || canHls) && (!/^(hevc|h265)$/.test(x.codec || '') || !x.hls || hevcOk);
    let pref = 'trans'; try { pref = localStorage.getItem(LS_PLQ) || 'trans'; } catch (e) { /* 無視 */ }
    // 最初の画質：前回選んだ種類。初めは PikPak が用意している一番軽い変換画質（すぐ始まり、通信も少ない）
    //   本編をきちんと見るときは、外部プレーヤー（オリジナル画質）をすすめる
    const trans = src.map((x, i) => [x, i]).filter(([x]) => !x.dl && !x.origin && playable(x));
    let first = pref === 'orig' ? src.findIndex((x) => !x.dl && playable(x) && x.origin) : trans.length ? trans[trans.length - 1][1] : -1;
    if (first < 0) first = src.findIndex((x) => playable(x));
    return { src, H, nativeHls, playable, first: Math.max(0, first) };
  }
  // video 要素に再生元をつなぐ（HLS は hls.js、それ以外はそのまま。失敗したら hls.js で再試行）
  function mountVideo(box, x, S, onFail, opt = {}) {
    const t = opt.t || 0;
    // 前の動画のシークバー（とサムネイル用の影の動画）を片付ける
    const oldBar = box.nextElementSibling && (box.nextElementSibling.classList.contains('pd-sk') || box.nextElementSibling.classList.contains('qp-ui')) ? box.nextElementSibling : null;
    if (oldBar) { oldBar.querySelectorAll('.pd-sk').forEach((b) => { if (b._grab) { b._grab.close(); b._grab = null; } }); if (oldBar._grab) oldBar._grab.close(); oldBar.remove(); }
    // ブラウザ標準のコントロールは使わず、下の操作バーに一本化する
    box.innerHTML = `<div class="qp-stage"><video ${opt.armed ? '' : 'autoplay '}playsinline preload="${opt.armed ? 'metadata' : 'auto'}"></video></div>`;
    const v = box.querySelector('video');
    // 開くだけで再生しないとき：サムネイルと大きな ▶ を出し、押す（スペース）と再生する
    if (opt.armed) {
      if (opt.poster) v.poster = opt.poster;
      const st = box.querySelector('.qp-stage'); st.insertAdjacentHTML('beforeend', '<div class="qp-bigplay" aria-hidden="true">▶</div>');
      const bp = st.querySelector('.qp-bigplay'); v.addEventListener('play', () => bp.remove(), { once: true });
    }
    v.addEventListener('loadedmetadata', () => { if (t) v.currentTime = t; v.defaultPlaybackRate = getRate(); v.playbackRate = getRate(); if (opt.onMeta) opt.onMeta(v); }, { once: true });
    const ui = document.createElement('div'); ui.className = 'qp-ui'; box.after(ui);
    if (opt.seekbar !== false) attachSeekbar(ui, v, x, S);
    qpAttach(box, v, ui, { ...(opt.qp || {}), src: { x, S } });
    let hls = null;
    const viaHls = async () => {
      hls = new S.H({ maxBufferLength: 60, enableWorker: true });
      hls.on(S.H.Events.ERROR, (ev, data) => { if (data && data.fatal) { onFail(x, data.details || data.type); killHls(hls); } });
      let u = x.url;
      if (x.tsdl) {
        try { const r = await fetch(x.url, { cache: 'no-store', credentials: 'omit' }); if (r.ok) { const txt = fixTsM3u8(await r.text()); if (txt.includes('#EXTM3U')) u = URL.createObjectURL(new Blob([txt], { type: 'application/vnd.apple.mpegurl' })); } } catch (e) { /* そのまま読む */ }
      }
      if (!hls) return;
      hls.loadSource(u); hls.attachMedia(v);
    };
    // HLS は hls.js を優先する（Chrome 14x 以降は「そのまま再生できる」と答えるが、PikPak の変換画質はそのままでは再生できない）
    if (x.hls && S.H && S.H.isSupported()) viaHls();
    else if (x.hls && x.tsdl) {
      (async () => { let u = x.url; try { const r = await fetch(x.url, { cache: 'no-store', credentials: 'omit' }); if (r.ok) { const txt = fixTsM3u8(await r.text()); if (txt.includes('#EXTM3U')) u = URL.createObjectURL(new Blob([txt], { type: 'application/vnd.apple.mpegurl' })); } } catch (e) { /* そのまま */ } v.src = u; })();
      v.addEventListener('error', () => onFail(x, v.error && v.error.message), { once: true });
    }
    else {
      v.src = x.url;
      v.addEventListener('error', () => { if (!x.hls && !x.dl && S.H && S.H.isSupported() && !opt.retried) { viaHls(); } else onFail(x, v.error && v.error.message); }, { once: true });
    }
    return { v, get hls() { return hls; } };
  }
  // 外部プレーヤーで開く（リンクは時間がたつと無効になるため、その都度取得する）
  // ---- 再生の記録（ファイルごとに 1 件）：再生した履歴・続きの位置・見終わったか・飛ばす区間 ----
  //   PikPak 側の視聴記録（/events）は Dedupe からの再生では増えないため、このブラウザに記録する
  //   { [id]: { name, size, thumb, at: 最後に再生した日時, pos: 続きの位置（秒）, dur: 長さ, done: 見終わった, skip: [[始め, 終わり], …] } }
  const LS_MEDIA = 'ppdup:media:v1', LS_PLAYLOG = 'ppdup:playlog:v1';
  let mediaDb = null;
  function mediaAll() {
    if (mediaDb) return mediaDb;
    mediaDb = lsJson(LS_MEDIA, {});
    // 4.3.12 の「再生した履歴」（ppdup:playlog:v1）を移す
    try {
      const old = JSON.parse(localStorage.getItem(LS_PLAYLOG) || 'null');
      if (Array.isArray(old)) { old.forEach((x) => { if (x && x.id && !mediaDb[x.id]) mediaDb[x.id] = { name: x.name, size: x.size || 0, thumb: x.thumb || '', at: x.at }; }); localStorage.removeItem(LS_PLAYLOG); mediaSave(); }
    } catch (e) { /* 無視 */ }
    return mediaDb;
  }
  let mediaSaveT = null;
  function mediaSave(now) {
    clearTimeout(mediaSaveT);
    const go = () => {
      const db = mediaAll(), ids = Object.keys(db);
      // 1 年以上再生していないもの・多すぎる分（古い順）を消す
      const lim = Date.now() - 365 * 864e5;
      ids.forEach((k) => { if (!(Date.parse(db[k].at) >= lim)) delete db[k]; });
      const rest = Object.keys(db); if (rest.length > 3000) rest.sort((x, y) => Date.parse(db[x].at) - Date.parse(db[y].at)).slice(0, rest.length - 3000).forEach((k) => delete db[k]);
      lsSetJson(LS_MEDIA, db);
    };
    if (now) go(); else mediaSaveT = setTimeout(go, 800);
  }
  const mediaGet = (id) => mediaAll()[id] || null;
  function mediaPut(id, patch, now) {
    if (!id) return null;
    const db = mediaAll(); const r = db[id] || (db[id] = { at: new Date().toISOString() });
    Object.assign(r, patch); mediaSave(now); return r;
  }
  function playLogPush(id, name) {
    if (!id) return;
    const sf = fileById(id) || (libItem(id) || {});
    mediaPut(id, { name: name || sf.name || (mediaGet(id) || {}).name || id, size: +sf.size || (mediaGet(id) || {}).size || 0, thumb: sf.thumb || (mediaGet(id) || {}).thumb || '', at: new Date().toISOString() }, true);
  }
  let extLast = { id: '', t: 0 };
  async function openExternal(id, ext, name) {
    if (extLast.id === id && Date.now() - extLast.t < 1500) return;
    extLast = { id, t: Date.now() };
    const f = fileById(id) || (name ? { name } : null); if (!f) return;
    ext = ext || playPref().ext;
    if (!ensureSession('tree')) return;
    status('外部プレーヤー用のリンクを取得中…', 0.5);
    try {
      const S = await loadSources(id);
      // 外部プレーヤーはどの形式でも再生できることが多いので、元の画質を優先
      const x = S.src.find((q) => q.origin && !q.dl) || S.src.find((q) => q.dl) || S.src[0];
      if (!x) { status('再生用リンクを取得できませんでした'); return; }
      const P = EXT_PLAYERS[ext];
      if (ext === 'copy') { try { await navigator.clipboard.writeText(x.url); } catch (e) { /* 無視 */ } status('再生用リンクをコピーしました。プレーヤーの「URL を開く」（GOM Player なら Ctrl+U）に貼り付けてください。リンクはしばらくすると無効になります。'); }
      else if (ext === 'm3u') {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([`#EXTM3U\n#EXTINF:-1,${f.name}\n${x.url}\n`], { type: 'audio/x-mpegurl' }));
        a.download = f.name.replace(/\.[^.]+$/, '') + '.m3u'; a.click();
        status('再生リストファイル（.m3u）を保存しました。開くと、OS で .m3u に設定しているプレーヤー（GOM Player・VLC など）で再生されます。');
      } else {
        const a = document.createElement('a'); a.href = P.url(x.url); a.click();
        status(`${P.name} を起動しています。ブラウザの確認が出たら「開く」を押してください（${P.name} が入っていない場合は何も起きません）。`);
      }
      playLogPush(id, f.name);
      log('info', `外部プレーヤーで再生：${P.short}`, f.name);
    } catch (err) { if (err.session) { handleErr(err, 'tree'); return; } status(err.gone ? err.message : '外部プレーヤー用のリンクを取得できませんでした：' + err.message); }
  }
  // 既定の再生のしかたで再生（ダブルクリック・Enter など）
  function playDefault(id) {
    const p = playPref();
    if (p.mode === 'external') openExternal(id, p.ext);
    else if (p.mode === 'inline') { treeCur = id; showQL(true); }
    else playFile(id, { full: p.mode === 'full' });
  }
