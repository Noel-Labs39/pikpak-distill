  // ---------- 契約容量（ヘッダーのメーター） ----------
  let quota = null, quotaAt = 0, quotaLoading = false;
  const fmtCap = (b) => (b >= UNIT.TB ? (b / UNIT.TB).toFixed(2) + ' TB' : fmt(b));
  async function refreshQuota(force) {
    if (quotaLoading || (!force && quota && Date.now() - quotaAt < 60 * 1000) || !sessionValid()) return;
    quotaLoading = true;
    try { quota = await apiQuota(); quotaAt = Date.now(); renderQuota(); if (view === 'tree' && !busy && root.classList.contains('on')) renderTree(); } catch (e) { /* 表示できなくても処理は続ける */ }
    quotaLoading = false;
  }
  // 表示中のフォルダ（フォルダ一覧では最上位にしているフォルダ、それ以外は読み込んだ場所）
  function curFolderInfo() {
    if (!hasScan()) return null;
    const ix = treeIdx || buildTreeIndex();
    const id = view === 'tree' ? treeBase() : ix.rootId;
    const a = ix.agg.get(id);
    return a && !a.unk ? { name: dirLabel(id) || ix.rootName, size: a.size } : null;
  }
  function renderQuota() {
    const el = $('[data-r=quota]'); if (!el) return;
    if (!quota || !quota.usage) { el.innerHTML = ''; return; }
    const L = quota.limit, cur = curFolderInfo();
    const w = (b) => (L > 0 ? Math.max(0, Math.min(100, (b / L) * 100)) : 0).toFixed(2) + '%';
    const curB = cur ? Math.min(cur.size, quota.usage) : 0;
    const other = Math.max(0, quota.usage - curB - quota.trash);
    el.title = `契約容量：${fmtCap(quota.usage)} 使用 / 上限 ${L > 0 ? fmtCap(L) : '—'}（ゴミ箱 ${fmtCap(quota.trash)}）`;
    el.innerHTML = `<span class="qt"><b>${fmtCap(quota.usage)}</b><i>/ ${L > 0 ? fmtCap(L) : '—'} 使用中</i><span class="sp"></span><b>${L > 0 ? Math.round((quota.usage / L) * 100) + '%' : ''}</b></span>
      <span class="qb">${cur ? `<span class="q-cur" style="width:${w(curB)}"></span>` : ''}<span class="q-oth" style="width:${w(other)}"></span><span class="q-tr" style="width:${w(quota.trash)}"></span></span>
      <span class="ql">${cur ? `<span><b class="q-cur"></b><span class="raw">${esc(cur.name)}</span> ${fmtCap(cur.size)}</span>` : ''}<span><b class="q-oth"></b>その他</span><span><b class="q-tr"></b>ゴミ箱 ${fmtCap(quota.trash)}</span></span>`;
  }

  // 親子関係と、フォルダごとの合計サイズ・項目数（読み込んだ場所の外は、読み込んだフォルダの直下だけ）
  function buildTreeIndex() {
    syncOuter();
    const kd = new Map(), kf = new Map();
    const R = scanRoot();
    const addD = (pid, d) => { if (!kd.has(pid)) kd.set(pid, []); kd.get(pid).push(d); };
    const addF = (f) => { if (!kf.has(f.parentId)) kf.set(f.parentId, []); kf.get(f.parentId).push(f); };
    folders.forEach((d) => { if (d.isRoot) { if (upKnown()) addD(outer.rootPid, d); return; } addD(d.parentId, d); });
    outer.dirs.forEach((d) => addD(d.parentId, d));
    files.forEach(addF); outer.files.forEach(addF);
    const agg = new Map();
    const sum = (id, seen) => {
      if (agg.has(id)) return agg.get(id);
      if (seen.has(id)) return { size: 0, n: 0, files: 0 };
      seen.add(id);
      const isOut = R && id === R.id ? false : isHomeId(id) ? upKnown() : outer.dirs.has(id);
      if (isOut && !outer.loaded.has(id)) { const a = { size: 0, n: 0, files: 0, unk: true, unloaded: true }; agg.set(id, a); return a; }
      const a = { size: 0, n: (kd.get(id) || []).length + (kf.get(id) || []).length, files: 0, unk: false };
      (kf.get(id) || []).forEach((f) => { a.size += f.size; a.files++; });
      (kd.get(id) || []).forEach((d) => { const s = sum(d.id, seen); a.size += s.size; a.files += s.files; if (s.unk) a.unk = true; });
      agg.set(id, a); return a;
    };
    const rootId = R ? R.id : (folders[0] ? folders[0].parentId : 'root');
    sum(rootId, new Set());
    if (upKnown()) { sum(HOME, new Set()); outer.dirs.forEach((d) => sum(d.id, new Set())); }
    const byId = new Map(); folders.forEach((d) => byId.set(d.id, d)); outer.dirs.forEach((d) => byId.set(d.id, d));
    if (upKnown() && !byId.has(HOME)) byId.set(HOME, HOME_DIR);
    // フォルダのサムネイル＝中で一番大きい（＝本編の可能性が高い）ファイルのサムネイル
    const thumbOf = new Map();
    const pick = (id, seen) => {
      if (thumbOf.has(id)) return thumbOf.get(id);
      if (seen.has(id)) return null; seen.add(id);
      let best = null;
      (kf.get(id) || []).forEach((f) => { if (f.thumb && (!best || f.size > best.size)) best = f; });
      (kd.get(id) || []).forEach((d) => { const b = pick(d.id, seen); if (b && (!best || b.size > best.size)) best = b; });
      thumbOf.set(id, best); return best;
    };
    byId.forEach((d) => pick(d.id, new Set()));
    return { kd, kf, agg, thumbOf, rootId, rootName: R ? R.name : 'ホーム', byId };
  }
  // 表示の起点（最上位として表示するフォルダ）。未設定・見つからないときは読み込んだ場所
  function treeBase() { const ix = treeIdx || buildTreeIndex(); return tree.base && ix.byId.has(tree.base) ? tree.base : ix.rootId; }
  function setBase(id) {
    const ix = treeIdx || buildTreeIndex();
    tree.base = !id || id === ix.rootId ? '' : id; saveTree();
    treeSel.clear(); treeCur = ''; treeAnchor = ''; closeQL();
    if (tree.base) treeOpen.add(tree.base);
    renderTree(); $('[data-r=main]').scrollTop = 0; ddKick();
    status(tree.base ? `「${dirLabel(id)}」を最上位にして表示しています（${KEY.up} または上のパスで戻れます）` : '読み込んだ場所から表示しています');
    if (needLoad(tree.base)) loadAndRender([tree.base]);
  }
  // 表示する行（開いているフォルダの中だけ）。絞り込み中は、一致したものとその上のフォルダを開いて表示
  // ---- フォルダ一覧の列：出す列と幅（名前は残りの幅いっぱい）。スマホは名前・サイズだけ ----
  const LS_COLS = 'ppdup:cols:v1';
  const COLS = { size: ['サイズ', 100], date: ['追加日', 110], kind: ['種類', 110], n: ['項目', 80], pct: ['割合', 160] };
  const COL_DEF = { on: { size: true, date: true, kind: false, n: false, pct: false }, w: {} };
  function colCfg() { let c = {}; c = lsJson(LS_COLS, {}); return { on: { ...COL_DEF.on, ...(c.on || {}) }, w: { ...(c.w || {}) } }; }
  const saveColCfg = (c) => { lsSetJson(LS_COLS, c); };
  const phoneCols = () => innerWidth < 600;
  const colList = () => { const c = colCfg(); return Object.keys(COLS).filter((k) => (phoneCols() ? k === 'size' : c.on[k])); };
  function colTemplate() { const c = colCfg(); return ['minmax(140px,1fr)', ...colList().map((k) => (c.w[k] || COLS[k][1]) + 'px')].join(' '); }
  function openColMenu(btn) {
    document.querySelectorAll('.pd-colmenu').forEach((x) => x.remove());
    const m = document.createElement('div'); m.className = 'pd-colmenu';
    const c = colCfg();
    m.innerHTML = `<small>出す列（名前はいつも出ます）</small>${Object.keys(COLS).map((k) => `<label><input type="checkbox" data-colon="${k}"${c.on[k] ? ' checked' : ''}> ${k === 'pct' ? 'フォルダ内の割合' : COLS[k][0]}</label>`).join('')}<label><input type="checkbox" data-colreset> 幅を元に戻す</label>`;
    root.appendChild(m);
    const r = btn.getBoundingClientRect(); m.style.top = (r.bottom + 4) + 'px'; m.style.left = Math.max(4, r.right - m.offsetWidth) + 'px';
    m.addEventListener('change', (e) => {
      const t = e.target, cc = colCfg();
      if (t.dataset.colon) cc.on[t.dataset.colon] = t.checked;
      if (t.dataset.colreset !== undefined) { cc.w = {}; t.checked = false; }
      saveColCfg(cc); renderTree();
    });
    const off = (e) => { if (!m.contains(e.target)) { m.remove(); removeEventListener('mousedown', off, true); } };
    setTimeout(() => addEventListener('mousedown', off, true), 0);
  }
  function treeRows() {
    const ix = treeIdx = buildTreeIndex();
    const base = treeBase();
    const terms = qTerms(), hit = (name) => { const n = normQ(name); return terms.every((t) => n.includes(t)); };
    let keep = null;
    if (terms.length) {
      keep = new Set();
      const up = (pid) => { let cur = pid; for (let k = 0; k < 200 && cur !== undefined && cur !== null && !keep.has(cur) && cur !== base; k++) { keep.add(cur); cur = parentOf(cur); } };
      ix.byId.forEach((d) => { if (!d.home && d.id !== base && hit(d.name)) { keep.add(d.id); up(parentOf(d.id)); } });
      [...files, ...outer.files.values()].forEach((f) => { if (hit(f.name)) { keep.add(f.id); up(f.parentId); } });
    }
    const coll = new Intl.Collator('ja', { numeric: true, sensitivity: 'base' });
    const cmp = (a, b) => {
      if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1;
      const v = tree.sort === 'size' ? (a.size - b.size) : tree.sort === 'kind' ? coll.compare(kindOf(a), kindOf(b)) : tree.sort === 'date' ? ((Date.parse((a.f || {}).ct) || 0) - (Date.parse((b.f || {}).ct) || 0)) : 0;
      return (v || coll.compare(a.name, b.name)) * tree.dir;
    };
    const R = scanRoot();
    const rows = [];
    const walk = (pid, depth) => {
      const items = [
        ...(ix.kd.get(pid) || []).map((d) => { const a = ix.agg.get(d.id) || { size: 0, n: 0, files: 0, unk: true }; return { id: d.id, kind: 'folder', name: d.name, parentId: pid, depth, size: a.size, n: a.n, nf: a.files, unk: !!a.unk, unloaded: !!a.unloaded, outer: !!d.outer, isScanRoot: !!(R && d.id === R.id), path: d.outer || d.isRoot ? fullPath(d.id) : d.path, ext: '' }; }),
        ...(ix.kf.get(pid) || []).map((f) => ({ id: f.id, kind: 'file', name: f.name, parentId: pid, depth, size: f.size, path: f.outer ? fullPath(pid) : f.path, ext: extOf(f.name), thumb: f.thumb, outer: !!f.outer, f })),
      ].filter((r) => !keep || keep.has(r.id)).sort(cmp);
      items.forEach((r) => {
        r.open = r.kind === 'folder' && (treeOpen.has(r.id) || (!!keep && keep.has(r.id)));
        rows.push(r);
        if (r.open) walk(r.id, depth + 1);
      });
    };
    walk(base, 0);
    return rows;
  }
  function renderTreeToolbar() {
    $('[data-r=tb]').innerHTML = `<div class="tr-path" data-r="tpath"></div>
      <span class="seg"><button data-a="tview" data-v="list" class="${tree.view === 'list' ? 'on' : ''}" title="リスト表示（1 キー）">☰ リスト</button><button data-a="tview" data-v="thumb" class="${tree.view === 'thumb' ? 'on' : ''}" title="サムネイル付きのリスト（2 キー）">▤ サムネイル</button><button data-a="tview" data-v="tile" class="${tree.view === 'tile' ? 'on' : ''}" title="タイル表示。フォルダごとに見出しを付けて並べます（3 キー）">▦ タイル</button></span>
      <span class="seg"><button data-a="texpand" title="すべてのフォルダを開く（${KEY.expand}）">⊞ 全展開</button><button data-a="tcollapse" title="すべてのフォルダを閉じる（${KEY.collapse}）">⊟ 全格納</button></span>`;
  }
  // サムネイル付き表示：ファイルは自分の、フォルダは中の一番大きいファイルのサムネイル（右下にフォルダの印）
  function thumbHtml(r) {
    const f = r.kind === 'folder' ? treeIdx.thumbOf.get(r.id) : r.f;
    const img = f && f.thumb ? `<img loading="lazy" referrerpolicy="no-referrer" src="${esc(f.thumb)}" alt="">` : `<span class="ph">${r.kind === 'folder' ? ICON_DIR : ICON_FILE(r)}</span>`;
    return `<span class="th${r.kind === 'folder' ? ' dir' : ''}">${img}${r.kind === 'folder' && f && f.thumb ? `<span class="badge">${ICON_DIR}</span>` : ''}</span>`;
  }
  // フォルダの大きさの表示（まだ読み込んでいないフォルダは「—」）
  const sizeOf = (r) => (r.kind === 'folder' ? (r.unk ? '—' : r.nf ? fmt(r.size) : '--') : fmt(r.size));
  const subOf = (r) => (r.kind === 'folder' ? (r.unloaded ? '未スキャン' : r.n + ' 項目・' + (r.unk ? '—' : r.nf ? fmt(r.size) : '空')) : kindOf(r) + '・' + fmt(r.size));
  const tagOf = (r) => (r.unloaded ? '<span class="ot">未スキャン</span>' : r.isScanRoot ? '<span class="ot" style="color:var(--pri)">読み込み済み</span>' : '');
  function renderTree() {
    if (qTerms().length && tree.qs === 'all') { if (!$('[data-r=tpath]')) renderTreeToolbar(); return renderSearch(); }
    if (!$('[data-r=tpath]')) renderTreeToolbar();
    const rows = treeRowsCache = treeRows();
    if (treeCur && !rows.some((r) => r.id === treeCur)) treeCur = '';
    [...treeSel].forEach((id) => { if (!rows.some((r) => r.id === id)) treeSel.delete(id); });
    const ix = treeIdx;
    const junk = junkEnabled() ? (prepJunk(files, folders), (f) => { if (f.outer) return ''; const j = junkInfo(f); return j && j.level === 'del' ? j.reason : ''; }) : () => '';
    const baseId = treeBase();
    const top = ix.agg.get(baseId) || { n: 0, size: 0, files: 0 };
    const baseName = dirLabel(baseId) || ix.rootName;
    // 割合：表示中のフォルダの大きさが分かればその中での割合、分からなければ使用量全体に対する割合
    const denom = top.unk ? (quota ? quota.usage : 0) : top.size;
    const pctCell = (r) => {
      if ((r.kind === 'folder' && r.unk) || !denom) return '<span class="c-pct">—</span>';
      const v = r.size / denom;
      return `<span class="c-pct"><span class="pb"><i style="width:${Math.min(100, v * 100).toFixed(2)}%"></i></span><em>${pctTxt(v)}</em></span>`;
    };
    const arrow = (k) => (tree.sort === k ? (tree.dir > 0 ? ' ▲' : ' ▼') : '');
    const pctTitle = top.unk ? '使用量全体に対する割合（まだ読み込んでいないフォルダがあるため）' : '表示中のフォルダの中での割合';
    const pctLabel = top.unk ? '使用量に占める割合' : `<b class="raw" style="font-weight:inherit">${esc(baseName)}</b> 内の割合`;
    const hcell = (k) => {
      const lab = k === 'pct' ? pctLabel : COLS[k][0];
      const sort = { size: 'size', date: 'date', kind: 'kind' }[k];
      return `<span class="c-${k}"${sort ? ` data-tsort="${sort}"` : ''}${k === 'pct' ? ` title="${pctTitle}"` : ''}>${lab}${sort ? arrow(sort) : ''}<i class="cr" data-colr="${k}" title="ドラッグで幅を変える（ダブルクリックで元の幅）"></i></span>`;
    };
    const head = `<div class="tr-h"><span class="c-name" data-tsort="name">名前${arrow('name')}</span>${colList().map(hcell).join('')}${phoneCols() ? '' : '<button class="c-pick" data-colpick title="出す列を選ぶ" aria-label="出す列を選ぶ">⋯</button>'}</div>`;
    const rowHtml = (r, i) => {
      const jr = r.kind === 'file' ? junk(r.f) : '';
      const name = renaming === r.id ? `<input class="tr-ren" data-tren="${esc(r.id)}" value="${esc(r.name)}">` : `<span class="nm">${esc(r.name)}</span>`;
      return `<div class="tr-row${i % 2 ? ' odd' : ''}${treeSel.has(r.id) ? ' sel' : ''}${treeCur === r.id ? ' cur' : ''}" data-tid="${esc(r.id)}" title="${esc(r.path || '')}">
        <span class="c-name" style="padding-left:${8 + r.depth * 18}px">${r.kind === 'folder' ? `<span class="tw${r.open ? ' open' : ''}" data-ttw="${esc(r.id)}">▶</span>` : '<span class="tw blank"></span>'}${tree.view === 'thumb' ? thumbHtml(r) : `<span class="ic">${r.kind === 'folder' ? ICON_DIR : ICON_FILE(r)}</span>`}${tree.view === 'thumb' ? `<span class="tx">${name}<span class="sub">${esc(subOf(r))}</span></span>` : name}${tagOf(r)}${jr ? `<span class="jk" title="${esc(jr)}">不要</span>` : ''}</span>
        ${colList().map((k) => k === 'size' ? `<span class="c-size">${sizeOf(r)}</span>` : k === 'date' ? `<span class="c-date">${r.f && r.f.ct ? esc(fmtDate(r.f.ct, 'd2')) : ''}</span>` : k === 'kind' ? `<span class="c-kind">${esc(kindOf(r))}</span>` : k === 'n' ? `<span class="c-n">${r.kind === 'folder' ? (r.unloaded ? '—' : r.n + ' 項目') : ''}</span>` : pctCell(r)).join('')}</div>`;
    };
    // パス：ホームから表示中のフォルダまで（読み込んだ場所より上も、押すとその場で読み込んで移動）
    const chain = [baseId, ...ancestorsOf(baseId)].reverse();
    const upOff = (isHomeId(baseId) && (upKnown() || baseId === ix.rootId)) || (baseId === ix.rootId && outer.rootPid === null);
    const tp = $('[data-r=tpath]');
    if (tp) tp.innerHTML = `<button data-tup${upOff ? ' disabled' : ''} title="1 つ上の階層へ（${KEY.up}）" aria-label="1 つ上の階層へ">${IC.up}</button>${chain.map((id, k) => `${k ? '<span class="csep">›</span>' : ''}<button data-tbase="${esc(id)}"${isHomeId(id) ? ' data-root' : ''} class="${id === baseId ? 'on' : ''}" title="${id === baseId ? 'いま最上位にしているフォルダ' : 'ここを最上位にする（ドラッグして離すとこのフォルダへ移動）'}">${isHomeId(id) ? '⌂ ' : ''}${esc(dirLabel(id) || ix.rootName)}</button>`).join('')}`;
    const emptyHtml = '<div class="empty">' + (tree.q ? '一致するものはありません' : top.unloaded ? '読み込み中…' : '読み込んだフォルダは空です') + '</div>';
    if (tree.view === 'tile') {
      // タイル：最上位のフォルダの中身と、開いているフォルダの中身を、フォルダごとの見出し付きで並べる
      const kids = new Map(); rows.forEach((r) => { if (!kids.has(r.parentId)) kids.set(r.parentId, []); kids.get(r.parentId).push(r); });
      const secs = [baseId, ...rows.filter((r) => r.kind === 'folder' && r.open).map((r) => r.id)];
      treeRowsCache = secs.flatMap((pid) => kids.get(pid) || []);
      const relPath = (id) => { if (id === baseId) return [baseName]; const ch = [id, ...ancestorsOf(id)]; const k = ch.indexOf(baseId); return ch.slice(0, k < 0 ? ch.length : k).reverse().map(dirLabel); };
      const tile = (r) => {
        const jr = r.kind === 'file' ? junk(r.f) : '';
        const name = renaming === r.id ? `<input class="tr-ren" data-tren="${esc(r.id)}" value="${esc(r.name)}">` : `<span class="nm" title="${esc(r.name)}">${esc(r.name)}</span>`;
        return `<div class="tr-row tile${treeSel.has(r.id) ? ' sel' : ''}${treeCur === r.id ? ' cur' : ''}${r.kind === 'folder' ? ' dir' : ''}" data-tid="${esc(r.id)}">${thumbHtml(r)}${jr ? `<span class="jk" title="${esc(jr)}">不要</span>` : ''}${name}<span class="sub">${esc(r.kind === 'folder' ? subOf(r) : fmt(r.size))}</span></div>`;
      };
      const body = secs.map((pid) => {
        const items = kids.get(pid) || [];
        const a = ix.agg.get(pid) || { n: 0, size: 0 };
        const path = relPath(pid);
        return `<section class="tl-sec" data-sec="${esc(pid)}"><div class="tl-h" data-tdrop="${esc(pid)}">${pid === baseId ? '' : `<span class="tw open" data-ttw="${esc(pid)}" title="閉じる">▶</span>`}<span class="ic">${ICON_DIR}</span><b>${path.map((n, k) => (k === path.length - 1 ? esc(n) : `<span class="pp">${esc(n)} ›</span> `)).join('')}</b><span class="note">${a.unloaded ? '未スキャン' : `${a.n} 項目・${a.unk ? '—' : fmt(a.size)}`}</span><span class="sp"></span>${pid === baseId ? '' : `<button data-ttop="${esc(pid)}" title="一番上の一覧へ戻る（${KEY.back} キー／マウスの戻るボタン）">⤒ 一覧へ戻る</button><button data-tbase="${esc(pid)}" title="このフォルダを最上位にする">⤓ ここを最上位に</button>`}</div>
          <div class="tl-grid">${items.map(tile).join('') || `<div class="note" style="padding:8px">${a.unloaded ? '読み込み中…' : '（空のフォルダ）'}</div>`}</div></section>`;
      }).join('');
      $('[data-r=main]').innerHTML = `<div class="tr has-path tl" tabindex="0" data-r="tree"><div class="tr-body">${rows.length ? body : emptyHtml}</div><button class="tl-top" data-ttop="" title="一番上の一覧へ戻る（${KEY.back} キー／マウスの戻るボタン）">⤒ 一覧へ戻る</button></div>`;
    } else {
      $('[data-r=main]').innerHTML = `<div class="tr has-path${tree.view === 'thumb' ? ' big' : ''}" tabindex="0" data-r="tree" style="--tcols:${colTemplate()}">${head}<div class="tr-body">${rows.map(rowHtml).join('') || emptyHtml}</div></div>`;
    }
    const selN = treeSel.size, selSize = [...treeSel].reduce((a, id) => { const r = rows.find((x) => x.id === id); return a + (r ? r.size : 0); }, 0);
    const capOf = (b) => (quota && quota.limit > 0 ? pctTxt(b / quota.limit) : '');
    const sizeTxt = top.unloaded ? '未スキャン' : top.unk ? `${fmt(top.size)}（未スキャンのフォルダを除く）` : `${fmt(top.size)}${capOf(top.size) ? `（契約容量比 ${capOf(top.size)}）` : ''}`;
    if (!busy) status(`${baseName}：${top.n} 項目・ファイル ${top.files} 件・${sizeTxt}${selN ? `　｜　${selN} 項目を選択（${fmt(selSize)}${capOf(selSize) ? `・全体比 ${capOf(selSize)}` : ''}）` : ''}`);
    const pr = $('[data-r=pright]'); if (pr) pr.textContent = meta ? `読み込み：${fmtDate(meta.at)}` : '';
    renderTreeActs(); renderQuota();
    const ren = $('.tr-ren'); if (ren) { ren.focus(); const dot = ren.value.lastIndexOf('.'); ren.setSelectionRange(0, dot > 0 && treeRowsCache.find((x) => x.id === renaming).kind === 'file' ? dot : ren.value.length); }
    else { const t = $('[data-r=tree]'); if (t && view === 'tree' && !qlOpen && document.activeElement !== $('[data-a=tq]')) t.focus({ preventScroll: true }); }
    const cur = treeCur && [...root.querySelectorAll('.tr-row')].find((x) => x.dataset.tid === treeCur); if (cur) cur.scrollIntoView({ block: 'nearest' });
  }
  // 選択・カーソル
  function treeSelect(id, ev) {
    const ids = treeRowsCache.map((r) => r.id);
    if (ev && ev.shiftKey && treeAnchor && ids.includes(treeAnchor)) {
      const a = ids.indexOf(treeAnchor), b = ids.indexOf(id);
      if (!(ev.metaKey || ev.ctrlKey)) treeSel.clear();
      ids.slice(Math.min(a, b), Math.max(a, b) + 1).forEach((x) => treeSel.add(x));
    } else if (ev && (ev.metaKey || ev.ctrlKey)) {
      if (treeSel.has(id)) treeSel.delete(id); else treeSel.add(id);
      treeAnchor = id;
    } else { treeSel.clear(); treeSel.add(id); treeAnchor = id; }
    treeCur = id;
  }
  // 開閉（deep＝⌥：中のフォルダもすべて）
  function treeToggle(id, open, deep) {
    const want = open === undefined ? !treeOpen.has(id) : open;
    const ids = [id];
    if (deep && treeIdx) { const st = [id]; while (st.length) { const x = st.pop(); (treeIdx.kd.get(x) || []).forEach((d) => { ids.push(d.id); st.push(d.id); }); } }
    ids.forEach((x) => (want ? treeOpen.add(x) : treeOpen.delete(x)));
    saveTree();
    if (want && ids.some(needLoad)) setTimeout(() => loadAndRender(ids), 0);
  }
  // クイックルック（スペース）
  function showQL(play) {
    const r = treeRowsCache.find((x) => x.id === treeCur); if (!r) return closeQL();
    let d = document.getElementById('pd-ql');
    if (!d) { d = mkEl('pd-ql'); d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-qlclose]')) closeQL(); }); }
    else { plStop('ql'); unloadMedia(d); } // 次・前のファイルへ移るときは、前の動画とシークバー用の影の動画を片付ける
    qlRun++;
    qlOpen = true;
    const big = r.kind === 'file' && r.thumb ? `<img src="${esc(r.thumb)}" referrerpolicy="no-referrer" alt="">` : `<div class="ql-ic">${r.kind === 'folder' ? ICON_DIR : ICON_FILE(r)}</div>`;
    const ix = treeIdx;
    const info = r.kind === 'folder' ? `${r.n} 項目（中のファイル ${ix.agg.get(r.id).files} 件）・${fmt(r.size)}` : `${esc(kindOf(r))}・${fmt(r.size)}`;
    const jr = r.kind === 'file' && junkEnabled() ? (prepJunk(files, folders), junkInfo(r.f)) : null;
    const qpath = (r.kind === 'folder' ? r.path : r.path + '/').replace(/^\/?/, '/').replace(/\/+$/, '') || '/';
    d.innerHTML = `<div class="ql pv">${pvHeadHtml(r.name, 'data-qlclose')}<div class="ql-b">${big}</div>${pvFootHtml({ info: info, path: qpath, extra: jr ? `<div style="color:#ff6b6b">不要ファイルの判定：${esc(jr.reason)}</div>` : '', acts: isVideoRow(r) })}</div>`;
    d.classList.remove('playing'); d.classList.toggle('ql-vid', isVideoRow(r)); plStop('ql');
    const on = (sel, fn) => { const b = d.querySelector(sel); if (b) b.onclick = fn; };
    pvWire(d, { id: r.id, name: r.name, frames: () => { closeQL(); openFrames([r.id]); }, loc: () => { closeQL(); revealInTree(r.id); }, ext: () => openExternal(r.id) });
    // 動画は、情報だけの画面を挟まず、そのまま簡易プレーヤーを開く（play が偽なら、押すまで再生しない）
    if (isVideoRow(r)) qlPlay(r.id, { armed: !play });
  }
  // ---- 簡易プレーヤーの外枠（フォルダ一覧・プレーヤー画面・左メニューの 3 か所で共通）----
  //   上：ファイル名と ✕／中：動画と操作バー・見ながら仕分け／下：情報・画質・コマ一覧・場所を開く・外部プレーヤー
  //   速度・歯車・全画面・前へ／次へは操作バーだけに置く（二重に置かない）
  const pvHeadHtml = (name, closeAttr) => `<div class="pv-hd"><b title="${esc(name)}">${esc(name)}</b><button type="button" class="pv-x" ${closeAttr} title="閉じる（Esc）" aria-label="閉じる">${IC.x}</button></div>`;
  const pvFootHtml = (o) => `<div class="pv-ft"><div class="pv-inf"><div><span data-pvinfo>${o.info}</span><span data-pvdim></span></div><div class="note" title="${esc(o.path)}">${esc(o.path)}</div>${o.extra || ''}</div>${o.acts === false ? '' : `<div class="pv-acts"><span class="pv-q"></span><button type="button" data-pvinfob title="作品名・販売者・出演者などを見る（I）">ⓘ 作品情報</button><button type="button" data-pvframes title="動画の中身をコマで見る">▦ コマ一覧</button><button type="button" data-pvloc title="この動画のあるフォルダを、フォルダ一覧で開く">場所を開く</button><button type="button" class="pri" data-pvext title="外部プレーヤーで開く（オリジナル画質）">↗ 外部プレーヤー</button></div>`}</div>`;
  function pvWire(root, h) {
    const on = (sel, fn) => { const b = root.querySelector(sel); if (!b) return; b.onclick = (e) => { e.stopPropagation(); fn(); }; };
    on('[data-pvframes]', h.frames);
    on('[data-pvinfob]', () => pvInfoToggle(root, h.id, h.name));
    on('[data-pvloc]', h.loc);
    on('[data-pvext]', () => { const v = root.querySelector('video'); try { if (v) v.pause(); } catch (e) { /* 無視 */ } h.ext(); });
  }
  const pvDim = (root, v, more) => { const e = root.querySelector('[data-pvdim]'); if (e) e.textContent = v && v.videoWidth ? ` ・ ${v.videoWidth}×${v.videoHeight}${more || ''}` : ''; };
  const pvPath = (f) => ((f.outer ? fullPath(f.parentId) : (f.path || '/')).replace(/\/$/, '') || '') + '/';
  // ---- 作品情報の枠（簡易プレーヤーの「ⓘ 作品情報」・I キー）----
  function infoKeyOf(id, name) {
    const f = id && fileById(id), dn = f ? ((folders.find((d) => d.id === f.parentId) || {}).name || '') : '';
    const w = parseWork(name, dn);
    const wk = workKeys(w && w.kind === 'fc2' ? w.label : name)[0];
    if (wk) return { k: wk, w };
    if (w && w.kind === 'code') { const m = w.label.match(/^([A-Z]+)-(\d+)$/); return { k: { key: 'x:' + w.label, kind: 'fanza', kw: w.label, label: w.label, cid: m ? m[1].toLowerCase() + m[2].padStart(5, '0') : w.label.toLowerCase() }, w }; }
    if (w && w.kind === 'fc2') return { k: { key: 'x:' + w.label, kind: 'other', kw: w.label, label: w.label, noLookup: true }, w };
    return { k: null, w };
  }
  function pvInfoToggle(root, id, name) {
    const box = root.closest('.pv') || root.querySelector('.pv') || root; const old = box.querySelector('.pv-info');
    if (old) { old.remove(); return; }
    box.insertAdjacentHTML('beforeend', '<div class="pv-info" role="dialog" aria-label="作品情報"></div>');
    pvInfoRender(box.querySelector('.pv-info'), id, name);
  }
  function pvInfoRender(el, id, name) {
    const { k, w } = infoKeyOf(id, name);
    const inf = k ? wInfo[k.key] || null : null, sel = k ? sellerDb[k.key] : null;
    const acts = inf && inf.manual && inf.manual.actresses ? inf.manual.actresses.map((n) => ({ name: n })) : (inf && inf.actresses) || [];
    const row = (t, v) => `<dt>${t}</dt><dd>${v}</dd>`;
    const none = '<span class="mu">—</span>';
    const sellers = inf && inf.sellers ? Object.entries(inf.sellers) : [];
    const sellerHtml = !sel && sellers.length ? sellers.map(([st, x]) => `${esc(x.name)} <span class="mu">（${st === 'fanza' ? 'FANZA のメーカー' : esc(st)}）</span>`).join('<br>') : sel && sel.status === 'ok' ? `${esc(sel.name)} <span class="mu">（${esc(sel.sid)}${sel.src === 'manual' ? '・手入力' : ''}）</span>${sellers.filter(([st]) => st !== 'fanza').map(([st, x]) => `<div class="mu">${esc(SITE_NM[st] || st)}：${esc(x.name)}（${esc(x.sid || '')}）</div>`).join('')}` : sel ? `<span class="mu">${sel.status === 'notfound' ? '見つかりませんでした' : '分かりませんでした'}</span>` : '<span class="mu">まだ調べていません</span>';
    const ttl = (inf && inf.title) || (w ? titleOf(w).replace(/_/g, ' ') : '');
    el.innerHTML = `<div class="pv-ih"><b>ⓘ 作品情報</b><button type="button" class="pv-x" data-pvi-x title="閉じる（Esc）" aria-label="閉じる">${IC.x}</button></div>
      <dl>${row('品番', w ? esc(w.label + (w.part ? '-' + w.part : '')) : none)}${row('タイトル', ttl ? esc(ttl) : none)}${row('販売者', k ? sellerHtml : none)}
      ${row('出演者', `${acts.length ? acts.map((x) => esc(x.name)).join('、') : (inf ? '<span class="mu">載っていませんでした</span>' : '<span class="mu">まだ調べていません</span>')}<div class="pv-ied"><input type="text" data-pvi-act placeholder="手入力（「、」区切り）" value="${esc(inf && inf.manual && inf.manual.actresses ? inf.manual.actresses.join('、') : '')}" aria-label="出演者を手入力"><button type="button" data-pvi-save>保存</button></div>`)}
      ${inf && inf.label ? row('レーベル', esc(inf.label)) : ''}${inf && inf.tags && inf.tags.length ? row('タグ', inf.tags.map(esc).join('・')) : ''}${inf && inf.date ? row('配信日', esc(inf.date)) : ''}${inf && inf.dur ? row('収録時間', esc(inf.dur)) : ''}</dl>
      ${k && !k.noLookup ? `<div class="pv-ia"><button type="button" class="pri" data-pvi-look>${inf || sel ? '↻ 調べ直す' : '🔍 調べる'}</button><span class="mu">${inf ? '調べた日：' + esc(fmtDate(inf.at, 'ymd')) : (k.kind === 'fanza' ? 'FANZA の作品ページを小さなウィンドウで開いて読み取ります（年齢確認が出たら「はい」を押してください）' : 'fd2ppv.cc・fc2cmadb.com を小さなウィンドウで開いて読み取ります')}</span></div>` : ''}
      ${k ? `<div class="pv-il"><span class="mu">外部サイトで確かめる</span>${extSites(k).map(([n, , u]) => `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(n)}</a>`).join('')}</div>` : '<div class="pv-il mu">ファイル名から品番が読めないため、調べられません</div>'}`;
    el.querySelector('[data-pvi-x]').onclick = (e) => { e.stopPropagation(); el.remove(); };
    // 出演者・販売者のリンクと、関連する作品（同じ出演者 → 同じ販売者）。読み込み済みのときだけ
    if (k && hasScan()) {
      const P = peopleIndex(), wo = P.works.get(k.key);
      if (wo) {
        const lnk = (mode, n) => { const c = ((mode === 'sel' ? P.sel : P.act).get(n) || []).length - 1; return `<a href="#" data-pvi-ppl="${mode}" data-n="${esc(n)}">${esc(n)}</a>${c > 0 ? `<span class="mu">（ほかに ${c} 作品）</span>` : ''}`; };
        const rel = relatedWorks(k.key, 8);
        const html = `<div class="pv-ppl">${wo.seller ? `<div><span class="mu">販売者：</span>${lnk('sel', wo.seller)}</div>` : ''}${wo.actors.length ? `<div><span class="mu">出演者：</span>${wo.actors.map((n) => lnk('act', n)).join('、')}</div>` : ''}<div class="mu" style="font-size:11px">名前を押すと「出演者・販売者」でその作品の一覧を開きます</div></div>`
          + (rel.length ? `<div class="pv-rel"><b>関連する作品</b><div class="pv-rels">${rel.map((o) => `<button type="button" data-pvi-rel="${esc(o.file.id)}" title="${esc(o.label + (o.title ? '　' + o.title : '') + '\n' + o.why)}"><span class="th">${o.file.thumb ? `<img loading="lazy" referrerpolicy="no-referrer" src="${esc(o.file.thumb)}" alt="">` : ''}</span><span class="nm">${esc(o.label)}</span></button>`).join('')}</div></div>` : '');
        const dl = el.querySelector('dl'); if (dl) dl.insertAdjacentHTML('afterend', html);
        el.querySelectorAll('[data-pvi-ppl]').forEach((a) => { a.onclick = (e) => { e.preventDefault(); e.stopPropagation(); openPeople(a.dataset.pviPpl, a.dataset.n); }; });
        el.querySelectorAll('[data-pvi-rel]').forEach((b) => { b.onclick = (e) => {
          e.stopPropagation(); const fid = b.dataset.pviRel, f = fileById(fid); if (!f) return;
          if (el.closest('#pd-lib') && libSt) { if (!libItem(fid)) libSt.items.unshift({ id: fid, name: f.name, size: f.size, at: f.ct, path: f.path, thumb: f.thumb || '' }); libPreview(fid).then(() => { const pv = document.querySelector('#pd-lib .lb-pv'); if (pv) pvInfoToggle(pv, fid, f.name); }); }
          else playFile(fid);
        }; });
      }
    }
    const sv = el.querySelector('[data-pvi-save]');
    if (sv) sv.onclick = (e) => {
      e.stopPropagation(); if (!k) return;
      const names = el.querySelector('[data-pvi-act]').value.split(/[、,，\n]/).map((x) => x.trim()).filter(Boolean).slice(0, 30);
      const o = wInfo[k.key] || { at: Date.now() };
      if (names.length) o.manual = { actresses: names }; else delete o.manual;
      wInfo[k.key] = o; lsSetJson(LS_WINFO, wInfo); log('info', `出演者を手入力：${k.label} → ${names.join('、') || '（消去）'}`); pvInfoRender(el, id, name);
    };
    const lb = el.querySelector('[data-pvi-look]');
    if (lb) lb.onclick = (e) => { e.stopPropagation(); lookupOne(k, () => { if (el.isConnected) pvInfoRender(el, id, name); }); };
    el.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); el.remove(); } });
    el.addEventListener('click', (e) => e.stopPropagation());
  }
  // 1 作品だけ調べる（作品情報の「調べる」）。ポップアップを止められないよう、押した直後にウィンドウを開く
  function lookupOne(k, onDone) {
    if (lookupSt.on) { status('いま販売者を一括で調べています。終わってからもう一度押してください。'); return; }
    const w0 = window.open('about:blank', 'ppdup-lookup', 'width=560,height=720');
    if (!w0) { status('小さなウィンドウを開けませんでした。ブラウザのアドレスバーで、このサイトのポップアップを許可してから、もう一度押してください。'); return; }
    (async () => {
      const ref = { win: w0, parked: false };
      lookupSt = { ...lookupSt, on: true, total: 1, done: 0, cur: k.label, challenge: '', paused: false };
      status(`作品の情報を調べています：${k.label}`);
      let r = { status: 'closed' };
      try {
        await lookupWarmUp(ref, k);
        if (ref.win) r = await lookupAny(ref, k, (o) => { lookupSt.challenge = o.replace('https://', ''); showWin(ref.win); status(`${o.replace('https://', '')} の確認画面が出ています。小さなウィンドウで確認を済ませてください（済むと自動で続きます）`); });
        if (k.kind === 'fanza') { /* FANZA のメーカーは作品情報にだけ記録する（販売者ごとの仕分けには使わない） */ } else if (r.status === 'ok' && !(sellerDb[k.key] && sellerDb[k.key].src === 'manual')) { sellerDb[k.key] = { name: String(r.name || '').slice(0, 120), sid: String(r.sid || '').slice(0, 64), src: r.src, status: 'ok', studio: !!r.studio, at: Date.now() }; saveSellerDb(); }
        else if (k.kind !== 'fanza' && (r.status === 'notfound' || r.status === 'noseller') && !sellerDb[k.key]) { sellerDb[k.key] = { status: r.status, src: r.src, at: Date.now() }; saveSellerDb(); }
      } finally { try { if (ref.win) ref.win.close(); } catch (e) { /* 無視 */ } lookupSt.on = false; lookupSt.challenge = ''; }
      status(r.status === 'ok' || r.info ? `作品の情報を調べました：${k.label}` : r.status === 'notfound' ? `見つかりませんでした：${k.label}` : r.status === 'closed' ? '小さなウィンドウが閉じられたため止めました' : `読み取れませんでした（${r.status}）：${k.label}`);
      log('info', `作品の情報を調べる：${k.label} → ${r.status}`);
      onDone();
    })();
  }
  function closeQL() { qlRun++; unloadMedia(document.getElementById('pd-ql')); qlOpen = false; plStop('ql'); const d = document.getElementById('pd-ql'); if (d) { d.querySelectorAll('.pd-sk').forEach((b) => { if (b._grab) b._grab.close(); }); const v = d.querySelector('video'); try { if (v) v.pause(); } catch (e) { /* 無視 */ } d.remove(); } }
  // 名前の変更（Enter）
  function applyRenameCache(kind, id, name) {
    const o = kind === 'file' ? outer.files.get(id) : outer.dirs.get(id);
    if (o) { o.name = name; return; }
    if (kind === 'file') { const f = files.find((x) => x.id === id); if (f) f.name = name; return; }
    const f = folders.find((x) => x.id === id); if (!f) return;
    if (f.isRoot) { f.name = name; return; }
    const old = f.path; f.name = name; f.path = old.slice(0, old.length - old.split('/').pop().length) + name;
    folders.forEach((y) => { if (y.path.startsWith(old + '/')) y.path = f.path + y.path.slice(old.length); });
    files.forEach((y) => { if (y.path === old || y.path.startsWith(old + '/')) y.path = f.path + y.path.slice(old.length); });
  }
  async function treeCommitRename(id, name) {
    const r = treeRowsCache.find((x) => x.id === id); renaming = '';
    name = String(name || '').trim();
    if (!r || !name || name === r.name) { renderTree(); return; }
    if (/[\/\\]/.test(name)) { renderTree(); status('名前に / や \\ は使えません'); return; }
    const sib = [...(treeIdx.kd.get(r.parentId) || []), ...(treeIdx.kf.get(r.parentId) || [])];
    if (sib.some((x) => x.id !== id && x.name.toLowerCase() === name.toLowerCase())) { renderTree(); status(`同じ場所に「${name}」が既にあります`); return; }
    if (!ensureSession('tree')) return;
    busy = true; status(`名前を変更中…：${r.name} → ${name}`, 0.5);
    try {
      await renameApi({ id, cur: r.name, target: name });
      applyRenameCache(r.kind, id, name); saveAll();
      busy = false; renderTree(); status(`名前を変更しました：${r.name} → ${name}`); log('info', `フォルダ一覧で名前を変更：${r.name} → ${name}`); refreshView();
    } catch (err) { busy = false; renderTree(); handleErr(err, 'tree', '名前を変更できませんでした：' + err.message); }
  }
  // ゴミ箱へ（⌘⌫／Delete）
  async function treeTrash() {
    const rows = treeRowsCache.filter((r) => treeSel.has(r.id));
    if (!rows.length) return;
    if (rows.some((r) => isRootOrAbove(r.id))) { status('読み込んだ場所とその上のフォルダは、ここではゴミ箱に入れられません'); return; }
    // 選択したフォルダの中にあるものは、フォルダごと削除されるので除く
    const selDirs = new Set(rows.filter((r) => r.kind === 'folder').map((r) => r.id));
    const inside = (r) => { let p = treeIdx.byId.get(r.parentId); while (p) { if (selDirs.has(p.id)) return true; p = treeIdx.byId.get(p.parentId); } return false; };
    const list = rows.filter((r) => !inside(r));
    if (!ensureSession('tree')) return;
    const ans = await askDelete(list.map((r) => ({ ...r, name: r.name + (r.kind === 'folder' ? '（フォルダ）' : '') })), []);
    if (!ans) return;
    busy = true; window.__ppdupStop = false;
    let done = 0;
    try {
      const byP = new Map(); list.forEach((r) => { if (!byP.has(r.parentId)) byP.set(r.parentId, []); byP.get(r.parentId).push(r); });
      for (const [pid, items] of byP) {
        if (window.__ppdupStop) break;
        status(`削除中… ${done}/${list.length}`, done / list.length);
        await apiRemove(items.map((r) => r.id), pid, ans.hard);
        const gone = new Set(items.map((r) => r.id));
        const goneO = new Set([...outer.dirs.keys()].filter((id) => gone.has(id) || ancestorsOf(id).some((x) => gone.has(x))));
        goneO.forEach((id) => outer.dirs.delete(id));
        [...outer.files.values()].forEach((f) => { if (gone.has(f.id) || goneO.has(f.parentId)) outer.files.delete(f.id); });
        const goneDirs = new Set(folders.filter((d) => (d.trail || []).some((x) => gone.has(x))).map((d) => d.id));
        folders = folders.filter((d) => !goneDirs.has(d.id));
        files = files.filter((f) => !gone.has(f.id) && !goneDirs.has(f.parentId));
        done += items.length; saveAll();
      }
      treeSel.clear(); busy = false; treeIdx = null; renderTree(); refreshQuota(true);
      status(`${done} 項目を${ans.hard ? '完全に削除' : 'ゴミ箱へ移動'}しました。`); log('info', `フォルダ一覧で削除 ${done} 項目（${ans.hard ? '完全削除' : 'ゴミ箱'}）`); refreshView();
    } catch (err) { saveAll(); busy = false; renderTree(); handleErr(err, 'tree', `削除を停止しました（${done} 項目完了）：` + err.message); }
  }
