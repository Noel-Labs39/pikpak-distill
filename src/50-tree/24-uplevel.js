  // ---------- 読み込んだ場所より上の階層（必要になったときにその場で読み込む。整理の対象には含めない） ----------
  const HOME = 'root';
  const isHomeId = (id) => !id || id === HOME;
  const outer = { dirs: new Map(), files: new Map(), loaded: new Set(), loading: new Set(), rootPid: undefined, rootKey: '' };
  const HOME_DIR = { id: HOME, name: 'ホーム', parentId: null, outer: true, home: true };
  const scanRoot = () => folders.find((d) => d.isRoot);
  // 読み込み直したら、上の階層の情報も作り直す
  function syncOuter() {
    const R = scanRoot(); const k = R ? R.id + ':' + (meta ? meta.at : '') : '';
    if (k === outer.rootKey) return;
    outer.dirs.clear(); outer.files.clear(); outer.loaded.clear(); outer.rootPid = undefined; outer.rootKey = k;
  }
  const upKnown = () => { syncOuter(); return outer.rootPid !== undefined && outer.rootPid !== null; };
  // 読み込んだ場所から親をたどって、ホームまでの道筋を調べる
  async function ensureUp() {
    syncOuter();
    const R = scanRoot(); if (!R || outer.rootPid !== undefined) return;
    if (isHomeId(R.id)) { outer.rootPid = null; return; }
    const g = await apiGet(R.id);
    if (g.name && (!R.name || R.name === 'スキャン起点')) { R.name = g.name; saveAll(); }
    const chain = new Map();
    let pid = g.parent_id || HOME;
    for (let k = 0; k < 32 && !isHomeId(pid); k++) { const p = await apiGet(pid); chain.set(pid, { id: pid, name: p.name || '', parentId: p.parent_id || HOME, outer: true }); pid = p.parent_id || HOME; }
    chain.forEach((v, k) => { if (!outer.dirs.has(k)) outer.dirs.set(k, v); });
    outer.rootPid = g.parent_id || HOME;
  }
  // 読み込んだ場所の外のフォルダは、直下だけをその場で読み込む
  async function loadOuter(pid) {
    if (outer.loading.has(pid)) return;
    outer.loading.add(pid);
    try {
      const list = await apiList(isHomeId(pid) ? '' : pid);
      const R = scanRoot();
      [...outer.dirs.values()].forEach((d) => { if (d.parentId === pid && !list.some((x) => x.id === d.id)) outer.dirs.delete(d.id); });
      [...outer.files.values()].forEach((f) => { if (f.parentId === pid) outer.files.delete(f.id); });
      list.forEach((x) => {
        if (R && x.id === R.id) return;
        if (x.kind === 'drive#folder') outer.dirs.set(x.id, { ...(outer.dirs.get(x.id) || {}), id: x.id, name: x.name, parentId: pid, outer: true });
        else outer.files.set(x.id, { id: x.id, name: x.name, size: +x.size || 0, thumb: x.thumbnail_link || '', parentId: pid, path: '', outer: true });
      });
      outer.loaded.add(pid);
    } finally { outer.loading.delete(pid); }
  }
  const needLoad = (id) => !!id && ((isHomeId(id) && upKnown()) || outer.dirs.has(id)) && !outer.loaded.has(id);
  async function loadAndRender(ids, after) {
    const need = ids.filter(needLoad);
    if (!need.length) { if (after) after(); return; }
    if (!sessionValid()) { status('ログインの有効期限が切れています'); return; }
    status('読み込み中…', 0.5);
    try { for (const id of need) await loadOuter(id); } catch (err) { if (view === 'tree') renderTree(); status('読み込みに失敗しました：' + err.message); return; }
    if (view === 'tree') { treeIdx = null; renderTree(); if (after) after(); }
  }
  // 画面を開いたときに、上の階層の道筋を先に調べておく（失敗しても ↑ を押したときにもう一度試す）
  async function prefetchUp() {
    syncOuter();
    if (outer.rootPid !== undefined || !sessionValid()) return;
    try { await ensureUp(); } catch (e) { return; }
    if (view !== 'tree' || busy) return;
    treeIdx = null; renderTree();
    if (needLoad(treeBase())) loadAndRender([treeBase()]);
  }
  const dirById = (id) => (treeIdx && treeIdx.byId.get(id)) || folders.find((d) => d.id === id) || outer.dirs.get(id) || (isHomeId(id) && upKnown() ? HOME_DIR : null);
  const fileById = (id) => files.find((x) => x.id === id) || outer.files.get(id) || null;
  const parentOf = (id) => { const R = scanRoot(); if (R && id === R.id) return outer.rootPid; if (isHomeId(id)) return null; const d = dirById(id) || fileById(id); return d ? d.parentId : undefined; };
  // 親を近い順にたどった一覧
  function ancestorsOf(id) {
    const out = []; let p = parentOf(id);
    for (let k = 0; k < 200 && p !== undefined && p !== null && p !== ''; k++) { out.push(p); if (isHomeId(p)) break; p = parentOf(p); }
    return out;
  }
  const inScan = (id) => { const R = scanRoot(); return !!R && (id === R.id || folders.some((d) => d.id === id) || files.some((f) => f.id === id)); };
  // 読み込んだ場所そのものと、その上のフォルダ（ここでは移動・削除しない）
  const isRootOrAbove = (id) => { const R = scanRoot(); return !!R && (id === R.id || ancestorsOf(R.id).includes(id)); };
  const dirLabel = (id) => (isHomeId(id) ? 'ホーム' : ((dirById(id) || {}).name || ''));
  const fullPath = (id) => '/' + [id, ...ancestorsOf(id)].filter((x) => !isHomeId(x)).reverse().map(dirLabel).join('/');
  const pctTxt = (r) => (!isFinite(r) || r < 0 ? '—' : r > 0 && r < 0.001 ? '<0.1%' : (r * 100).toFixed(1) + '%');

