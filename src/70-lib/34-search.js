  // ---------- 全体検索（名前とパス・スペース区切りはすべてを含むもの） ----------
  const normQ = (s) => String(s || '').normalize('NFKC').toLowerCase();
  const qTerms = () => normQ(tree.q).trim().split(/\s+/).filter(Boolean);
  // 一致した部分を <mark> で強調。長い名前は、最初に一致した周りを優先して見せる
  function hlText(text, terms, max) {
    let s = String(text || '');
    const low = normQ(s);
    if (max && s.length > max) {
      const p = Math.min(...terms.map((t) => low.indexOf(t)).filter((i) => i >= 0), s.length);
      const st = Math.max(0, Math.min(p - Math.floor(max / 3), s.length - max));
      s = (st > 0 ? '…' : '') + s.slice(st, st + max) + (st + max < s.length ? '…' : '');
    }
    const l2 = normQ(s), marks = new Array(s.length).fill(false);
    terms.forEach((t) => { let i = 0; while (t && (i = l2.indexOf(t, i)) >= 0) { for (let k = i; k < i + t.length && k < s.length; k++) marks[k] = true; i += t.length; } });
    let out = '', on = false;
    for (let i = 0; i < s.length; i++) { if (marks[i] !== on) { out += marks[i] ? '<mark>' : '</mark>'; on = marks[i]; } out += esc(s[i]); }
    return out + (on ? '</mark>' : '');
  }
  function renderSearch() {
    const terms = qTerms();
    treeRowsCache = []; treeSel.clear(); treeCur = '';
    const hits = [];
    const add = (kind, x, path) => {
      const nm = normQ(x.name), hay = nm + ' ' + normQ(path);
      if (!terms.every((t) => hay.includes(t))) return;
      hits.push({ kind, id: x.id, name: x.name, path, size: kind === 'file' ? x.size : 0, thumb: x.thumb || '', score: terms.filter((t) => nm.includes(t)).length });
    };
    folders.forEach((d) => { if (!d.isRoot) add('folder', d, (d.path || '').replace(/\/[^/]*$/, '') || '/'); });
    outer.dirs.forEach((d) => { if (!folders.some((x) => x.id === d.id)) add('folder', d, fullPath(d.parentId)); });
    files.forEach((f) => add('file', f, (f.path || '/').replace(/\/$/, '') || '/'));
    outer.files.forEach((f) => add('file', f, fullPath(f.parentId)));
    hits.sort((a, b) => b.score - a.score || (a.kind === b.kind ? 0 : a.kind === 'folder' ? -1 : 1) || a.name.localeCompare(b.name, 'ja', { numeric: true }));
    const shown = hits.slice(0, 400);
    const nF = files.length + outer.files.size, nD = folders.length + outer.dirs.size;
    $('[data-r=main]').innerHTML = `<div class="sr">${shown.map((h) => `<div class="sr-row" data-sr="${esc(h.id)}" title="押すとその場所を開きます"><span class="sr-th">${h.thumb ? `<img loading="lazy" referrerpolicy="no-referrer" src="${esc(h.thumb)}" alt="">` : h.kind === 'folder' ? ICON_DIR : ICON_FILE({ name: h.name, ext: extOf(h.name) })}</span><span class="sr-t"><span class="sr-n">${hlText(h.name, terms, 90)}</span><small class="sr-p">${hlText(h.path, terms, 120)}</small></span><span class="sr-s">${h.kind === 'folder' ? 'フォルダ' : fmt(h.size)}</span></div>`).join('') || '<div class="empty">一致するものはありません</div>'}</div>`;
    status(`${hits.length} 件${hits.length > shown.length ? `（先頭 ${shown.length} 件を表示）` : ''}（読み込んだ ${nF} ファイル・${nD} フォルダから。名前とパスで探しています）。行を押すとその場所を開きます`);
  }
  // 検索結果から、その場所をフォルダ一覧で開いて選ぶ
  function revealInTree(id) {
    const f = fileById(id);
    const pid = f ? f.parentId : id;
    tree.q = ''; const qi = $('[data-a=tq]'); if (qi) qi.value = '';
    tree.base = ''; saveTree();
    [pid, ...ancestorsOf(pid)].forEach((x) => { if (x && (!f || x !== id)) treeOpen.add(x); });
    if (!f) treeOpen.delete(id);
    treeSel.clear(); treeSel.add(id); treeCur = id; treeAnchor = id;
    renderTree();
    const row = $(`[data-r=main] [data-tid="${CSS.escape(id)}"]`);
    if (row) { row.scrollIntoView({ block: 'center' }); flash(row); }
    const t = $('[data-r=tree]'); if (t) t.focus({ preventScroll: true });
  }
  const LIB_IC = { people: RAIL_IC.people, cand: RAIL_IC.cand, cont: RAIL_IC.cont, dl: RAIL_IC.dl, recent: RAIL_IC.recent, hist: RAIL_IC.hist, star: RAIL_IC.star, trash: RAIL_IC.trash };
