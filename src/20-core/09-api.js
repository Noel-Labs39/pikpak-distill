  // ---------- PikPak API を直接呼ぶ（画面操作なし・バックグラウンド処理） ----------
  // ログイン中のPikPak画面が保存している認証情報を、このブラウザ内でだけ使います（外部へは送りません）。
  // 通信そのもの（ログイン情報・確認用トークン・やり直しの決まり）は src/core/pikpak-api.mjs。ここではページ上の fetch と保存領域を渡す
  const PP = PPCore.createPikPakApi({ fetch: (u, o) => window.fetch(u, o), storage: localStorage, log: (...a) => log(...a), sleep: (ms) => sleep(ms) });
  const { API, cap, noteHeader, readCred, sessionValid, sessionError, api, apiPid, apiListAll, apiList } = PP;
  if (!window.__ppdupCapHooked) {
    window.__ppdupCapHooked = true;
    try {
      const oSet = XMLHttpRequest.prototype.setRequestHeader;
      XMLHttpRequest.prototype.setRequestHeader = function (k, v) { try { noteHeader(k, v); } catch (e) { /* 無視 */ } return oSet.apply(this, arguments); };
      const oFetch = window.fetch;
      window.fetch = function (input, init) {
        try {
          const h = (init && init.headers) || (input && input.headers);
          if (h) { if (typeof h.forEach === 'function' && !Array.isArray(h)) h.forEach((v, k) => noteHeader(k, v)); else if (Array.isArray(h)) h.forEach(([k, v]) => noteHeader(k, v)); else Object.keys(h).forEach((k) => noteHeader(k, h[k])); }
        } catch (e) { /* 無視 */ }
        return oFetch.apply(this, arguments);
      };
    } catch (e) { /* 無視 */ }
  }
  // 全画面にする（要素の全画面ができない iPhone などは動画だけ全画面）
  const goFullEl = (el, v) => { const fn = el && (el.requestFullscreen || el.webkitRequestFullscreen); if (fn) return Promise.resolve(fn.call(el)); const f2 = v && v.webkitEnterFullscreen; if (f2) { f2.call(v); return Promise.resolve(); } return Promise.reject(new Error('fullscreen')); };
  // ---- ファイルの中身の手がかり：ハッシュ値（中身が同じなら同じ値）と長さ ----
  //   PikPak のファイル情報の hash（gcid）を使う。一覧で取れなければ、重複の候補だけ 1 件ずつ詳しく取りに行く
  const durOf = (f) => { const p = f.params || {}, v = (Array.isArray(f.medias) && f.medias[0] && f.medias[0].video) || {}; const d = +(p.duration || p.video_duration || v.duration || f.duration || 0); return d > 0 ? Math.round(d > 1e5 ? d / 1000 : d) : 0; };
  const metaOf = (f) => { const o = {}; const h = String(f.hash || f.gcid || '').trim(); if (h) o.hash = h; const d = durOf(f); if (d) o.dur = d; const p = f.params || {}; const w = +(p.width || 0), hh = +(p.height || 0); if (w && hh) o.res = w + '×' + hh; return o; };
  // 実機で一覧に何が入っているかを 1 回だけログに残す（ハッシュ値・長さが一覧で取れるかの確認用）
  let scanDiagDone = false;
  function scanDiag(f) {
    if (scanDiagDone || !VIDEO_EXT.has(extOf(f.name))) return; scanDiagDone = true;
    const m = metaOf(f);
    log('info', `[診断] ファイル一覧の項目：${Object.keys(f).sort().join(', ')} ／ params：${Object.keys(f.params || {}).sort().join(', ') || 'なし'} ／ ハッシュ値：${m.hash ? 'あり' : 'なし'} ／ 長さ：${m.dur ? 'あり' : 'なし'} ／ 解像度：${m.res ? 'あり' : 'なし'}`);
  }
  const fileMeta = new Map(); // id → { hash, dur, res }（詳しく取りに行った分）
  const metaGet = (f) => ({ hash: f.hash, dur: f.dur, res: f.res, ...(fileMeta.get(f.id) || {}) });
  let metaBusy = false;
  async function fetchMeta(list) {
    const need = list.filter((f) => !metaGet(f).hash && !fileMeta.has(f.id)).slice(0, 300);
    if (!need.length || metaBusy) return false;
    metaBusy = true; let n = 0;
    try {
      for (let i = 0; i < need.length; i += 4) {
        await Promise.all(need.slice(i, i + 4).map(async (f) => {
          try { const info = await apiGet(f.id); const m = metaOf(info || {}); if (!m.res && info && Array.isArray(info.medias)) { const v = (info.medias.find((x) => x && x.is_origin) || info.medias[0] || {}).video || {}; if (v.width && v.height) m.res = v.width + '×' + v.height; } fileMeta.set(f.id, m); n++; }
          catch (e) { if (e.session) throw e; fileMeta.set(f.id, {}); }
        }));
      }
    } finally { metaBusy = false; }
    if (n) log('info', `重複の候補 ${n} 件の中身の手がかり（ハッシュ値・長さ・解像度）を取得しました`);
    return n > 0;
  }
  // 読み込み（フォルダを順に一覧して、ファイルとフォルダを集める）
  //   ・読めないフォルダ（途中で削除・移動されたなど）は飛ばして最後まで進め、skipped に残す
  //   ・ログインが切れたら、読み終えた分と残りを resumeState に入れて投げる（画面の再読み込み後に続きから読む）
  //   ・同時に読む数は 6 から。PikPak が「混んでいる」と返したら減らす
  const SCAN_FILTER = { phase: { eq: 'PHASE_TYPE_COMPLETE' }, trashed: { eq: false } };
  async function scanApi(startTrail, opt = {}) {
    const rs = opt.resume || null;
    const outFiles = rs ? rs.files : [], outFolders = rs ? rs.folders : [], skipped = rs ? rs.skipped || [] : [];
    const queue = rs ? rs.queue.slice() : [{ id: startTrail[startTrail.length - 1], path: '', trail: startTrail }];
    const retry = []; // ログイン切れで読めなかったフォルダ（続きから読むときに先頭に戻す）
    let done = rs ? rs.done || 0 : 0, active = 0, err = null, limit = 6, hits0 = PP.busyHits(), read = 0;
    window.__ppdupStop = false;
    await new Promise((resolve) => {
      const pump = () => {
        if (err || window.__ppdupStop) { if (!active) resolve(); return; }
        if (!queue.length && !active) { resolve(); return; }
        if (PP.busyHits() > hits0) { hits0 = PP.busyHits(); limit = Math.max(2, limit - 1); }
        while (active < limit && queue.length) {
          const cur = queue.shift(); active++;
          apiListAll(apiPid(cur.id), SCAN_FILTER, Infinity, { probe: true }).then((list) => {
            read++;
            list.forEach((f) => {
              if (f.kind === 'drive#folder' && f.name === SYNC_DIR && !cur.path) return; // 同期用のフォルダは整理の対象にしない
              if (f.kind === 'drive#folder') {
                const fo = { id: f.id, name: f.name, parentId: cur.id, path: cur.path + '/' + f.name, trail: [...cur.trail, f.id] };
                outFolders.push(fo); queue.push({ id: f.id, path: fo.path, trail: fo.trail });
              } else { scanDiag(f); outFiles.push({ id: f.id, name: f.name, size: +f.size || 0, thumb: f.thumbnail_link || '', ct: f.created_time || '', parentId: cur.id, path: cur.path || '/', ...metaOf(f) }); }
            });
          }).catch((e) => {
            if (e.session) { retry.push(cur); if (!err) err = e; return; }
            skipped.push({ id: cur.id, path: cur.path || '/', msg: e.captcha ? '見つかりません（削除・移動された可能性）' : e.message || String(e) });
          }).finally(() => { active--; done++; if (opt.onProgress) opt.onProgress(done, done + queue.length + active, outFiles.length); pump(); });
        }
      };
      pump();
    });
    if (err) { err.resumeState = { files: outFiles, folders: outFolders, skipped, done, queue: [...retry, ...queue] }; throw err; }
    // 1 つも読めなかった（起点から読めない）ときは、確認の不具合の可能性があるため失敗として扱う
    if (!read && skipped.length && !window.__ppdupStop) throw new Error('フォルダを読み込めませんでした（' + skipped[0].msg + '）');
    // スキャン起点（例：My Pack）自身も仕分け対象にするため登録（名前の変更対象にはしない）
    const rootId = startTrail[startTrail.length - 1];
    const rootName = rootId === 'root' ? 'ホーム' : opt.rootName || ((crumbs().pop() || {}).name) || 'スキャン起点';
    outFolders.unshift({ id: rootId, name: rootName, parentId: startTrail.length > 1 ? startTrail[startTrail.length - 2] : '', path: '', trail: startTrail, trailNames: rootId === 'root' ? [] : crumbs().map((c) => c.name), isRoot: true });
    return { files: outFiles, folders: outFolders, skipped, stopped: !!window.__ppdupStop };
  }
  // 1 件だけ取りに行く。PikPak は削除済みのものにも「認証コードが無効です」を返すため、ログイン切れではなく「削除済み（e.gone）」として扱う
  //   削除済みと分かった id は覚えておき、同じ id を何度も取りに行かない（新しく読み込み直したら忘れる）
  const goneIds = new Set();
  const goneErr = (id) => { const e = new Error('見つかりません（削除・移動された可能性）'); e.gone = true; e.id = id; return e; };
  async function apiGetOne(id, q = '') {
    if (goneIds.has(id)) throw goneErr(id);
    try { return await api('/files/' + id + q, { gone: true }); } catch (e) {
      if (e && e.gone) { if (!goneIds.has(id)) { goneIds.add(id); log('info', 'PikPak にないファイル・フォルダを飛ばしました（削除・移動された可能性）', 'GET /files/' + id); } throw goneErr(id); }
      throw e;
    }
  }
  const apiGet = (id) => apiGetOne(id);
  // 契約容量（上限・使用量・ゴミ箱の使用量）
  async function apiQuota() { const d = await api('/about'); const q = d.quota || {}; return { limit: +q.limit || 0, usage: +q.usage || 0, trash: +q.usage_in_trash || 0 }; }
  const apiRename = (id, name) => api('/files/' + id, { method: 'PATCH', body: JSON.stringify({ name }) });
  async function apiMkdir(pid, name) {
    const d = await api('/files', { method: 'POST', body: JSON.stringify({ kind: 'drive#folder', parent_id: apiPid(pid), name }) });
    const f = d.file || (d.files && d.files[0]) || d;
    if (!f || !f.id) throw new Error('フォルダを作成できませんでした: ' + name);
    return f.id;
  }
  // 移動・削除はPikPak側で非同期に処理されることがあるため、一覧で反映を確認する
  async function waitList(pid, okFn, ms = 30000) {
    const t = Date.now();
    while (Date.now() - t < ms) { const l = await apiList(pid); if (okFn(l)) return true; await sleep(1500); }
    return false;
  }
  async function apiMove(ids, to) {
    await api('/files:batchMove', { method: 'POST', body: JSON.stringify({ ids, to: { parent_id: apiPid(to) } }) });
    if (!(await waitList(to, (l) => ids.every((id) => l.some((f) => f.id === id))))) throw new Error('移動を確認できませんでした（PikPak側で処理中の可能性）');
  }
  async function apiRemove(ids, pid, hard) {
    await api(hard ? '/files:batchDelete' : '/files:batchTrash', { method: 'POST', body: JSON.stringify({ ids }) });
    if (!(await waitList(pid, (l) => !l.some((f) => ids.includes(f.id))))) throw new Error('削除を確認できませんでした（PikPak側で処理中の可能性）');
  }
  // 処理後に Enhancement Master / 標準画面の表示を最新にする
  function refreshView() {
    const b = document.getElementById('pk-refresh');
    if (b && !b.disabled) { b.click(); return; }
    const r = getRouter(); if (r && r.currentRoute) r.replace({ ...r.currentRoute.value, query: { ...(r.currentRoute.value.query || {}), _t: Date.now() } }).catch(() => {});
  }
  async function renameApi(p) {
    const f = await apiGet(p.id);
    if (f.name === p.target) { p.cur = p.target; p.status = 'same'; return; }
    if (f.name !== p.cur) { p.cur = f.name; throw new Error('現在の名前が想定と違います: ' + f.name + '（再スキャンしてください）'); }
    const sibs = await apiList(f.parent_id || '');
    if (sibs.some((x) => x.id !== p.id && x.name.toLowerCase() === p.target.toLowerCase())) throw new Error('同じ場所に「' + p.target + '」が既にあります（再スキャンしてください）');
    await apiRename(p.id, p.target);
    p.cur = p.target; p.status = 'same';
  }
  async function sortApi(g) {
    const src = await apiList(g.cid);
    for (const it of g.items) { if (!src.some((f) => f.id === it.id)) throw new Error('元フォルダにファイルが見つかりません: ' + it.name); }
    let fid = g.folderId;
    if (!fid) {
      const ex = src.find((f) => f.kind === 'drive#folder' && f.name.toLowerCase() === g.work.toLowerCase());
      fid = ex ? ex.id : await apiMkdir(g.cid, g.work);
      g.folderId = fid;
      if (!folders.some((f) => f.id === fid)) folders.push({ id: fid, name: g.work, parentId: g.cid, path: g.cpath + '/' + g.work, trail: [...(g.ctrail || [g.cid]), fid] });
    }
    // 移動先の最新状態で同名を確認し、必要なら (1) を付ける
    const dst = await apiList(fid);
    const taken = new Set(dst.map((f) => f.name.toLowerCase()));
    for (const it of g.items) {
      let to = it.name;
      if (taken.has(to.toLowerCase())) to = addSuffix(it.name, taken);
      taken.add(to.toLowerCase());
      if (to !== it.name) { await apiRename(it.id, to); const f = files.find((x) => x.id === it.id); if (f) f.name = to; it.name = to; }
      it.to = to;
    }
    await apiMove(g.items.map((x) => x.id), fid);
    g.items.forEach((it) => { const f = files.find((x) => x.id === it.id); if (f) { f.parentId = fid; f.path = g.cpath + '/' + g.work; } });
    g.status = 'done';
  }
  // キャッシュ（読み込んだ結果）上でファイル・フォルダを移動したことにする
  function cacheMoveFile(id, newPid) {
    const f = files.find((x) => x.id === id); if (!f) return;
    const np = folders.find((x) => x.id === newPid);
    f.parentId = newPid; f.path = (np && np.path) || '/';
  }
  function cacheMoveFolder(id, newPid) {
    const f = folders.find((x) => x.id === id); if (!f) return;
    const np = folders.find((x) => x.id === newPid);
    const oldPath = f.path, newPath = ((np && np.path) || '') + '/' + f.name;
    const newTrail = [...((np && np.trail) || [newPid]), id];
    f.parentId = newPid; f.path = newPath; f.trail = newTrail;
    folders.forEach((y) => { if (y !== f && (y.trail || []).includes(id)) { y.path = newPath + y.path.slice(oldPath.length); y.trail = newTrail.concat(y.trail.slice(y.trail.indexOf(id) + 1)); } });
    files.forEach((y) => { if (y.path === oldPath || y.path.startsWith(oldPath + '/')) y.path = newPath + y.path.slice(oldPath.length); });
  }
  async function cleanApi(p) {
    const sibs = await apiList(p.parentId);
    const me = sibs.find((x) => x.id === p.id);
    if (!me) throw new Error('見つかりません（読み込み直してください）: ' + p.cur);
    if (p.op === 'trash') {
      const inside = await apiList(p.id); // 実行直前に、本当に空かを確認
      if (inside.length) { p.status = 'skip'; p.note = '中身が入っているため削除しませんでした'; return false; }
      await apiRemove([p.id], p.parentId, false);
      return true;
    }
    if (p.op === 'flatten') {
      const inside = await apiList(p.id);
      if (sibs.some((x) => x.id !== p.id && x.kind === 'drive#folder')) { p.status = 'skip'; p.note = '外側のフォルダにほかのフォルダが増えていたため、まとめませんでした'; return false; }
      if (!inside.length) { await apiRemove([p.id], p.parentId, false); return true; }
      // 中に同じ名前のもの（X/X/X）がある場合は、先に内側のフォルダを仮の名前にしてから出す
      if (inside.some((x) => x.name.toLowerCase() === me.name.toLowerCase())) await apiRename(p.id, me.name + '_distill_tmp');
      const taken = new Set(sibs.filter((x) => x.id !== p.id).map((x) => x.name.toLowerCase()));
      for (const x of inside) {
        if (taken.has(x.name.toLowerCase())) { const to = addSuffix(x.name, taken); await apiRename(x.id, to); x.name = to; }
        taken.add(x.name.toLowerCase());
      }
      const ids = inside.map((x) => x.id);
      for (let i = 0; i < ids.length; i += 100) await apiMove(ids.slice(i, i + 100), p.parentId);
      p.moved = inside.map((x) => ({ id: x.id, name: x.name }));
      const left = await apiList(p.id);
      if (!left.length) await apiRemove([p.id], p.parentId, false);
      return true;
    }
    if (me.name === p.target) return true;
    if (me.name !== p.cur) throw new Error('現在の名前が想定と違います: ' + me.name);
    if (sibs.some((x) => x.id !== p.id && x.name.toLowerCase() === p.target.toLowerCase())) { p.status = 'skip'; p.note = '同じ場所に「' + p.target + '」が残っているため外せませんでした'; return false; }
    await apiRename(p.id, p.target);
    return true;
  }
  async function cleanOne(p) {
    if (!(await cleanApi(p))) return false; // 実行時の確認で対象外になったものは飛ばす
    if (p.op === 'flatten') {
      (p.moved || []).forEach((m) => {
        const f = files.find((x) => x.id === m.id); if (f) f.name = m.name;
        const d = folders.find((x) => x.id === m.id); if (d) d.name = m.name;
        if (f) cacheMoveFile(m.id, p.parentId); else if (d) cacheMoveFolder(m.id, p.parentId);
      });
      folders = folders.filter((x) => x.id !== p.id);
      p.status = 'done';
      return true;
    }
    if (p.op === 'trash') {
      folders = folders.filter((x) => x.id !== p.id);
      p.status = 'done';
      return true;
    }
    if (p.kind === 'folder') {
      const f = folders.find((x) => x.id === p.id);
      if (f) {
        const old = f.path; f.name = p.target; f.path = p.path + '/' + p.target;
        folders.forEach((y) => { if (y.path.startsWith(old + '/')) y.path = f.path + y.path.slice(old.length); });
        files.forEach((y) => { if (y.path === old || y.path.startsWith(old + '/')) y.path = f.path + y.path.slice(old.length); });
      }
    } else { const f = files.find((x) => x.id === p.id); if (f) f.name = p.target; }
    p.cur = p.target; p.status = 'done';
    return true;
  }
  // 削除：フォルダ（置き場所）ごとに試し、失敗した分は理由を残して最後まで続ける（ログインが切れたときだけ止める）
  async function deleteEach(list, hard, onProgress) {
    const byP = new Map(); list.forEach((f) => { if (!byP.has(f.parentId)) byP.set(f.parentId, []); byP.get(f.parentId).push(f); });
    let n = 0, d = 0; const fails = new Map(); const t0 = Date.now();
    for (const items of byP.values()) {
      if (window.__ppdupStop) break;
      try { n += await deleteApi(items, hard); }
      catch (err) { if (err.session) throw err; items.forEach((f) => fails.set(f.id, err.message || String(err))); log('warn', '削除できませんでした：' + (err.message || err), items[0].path); }
      d += items.length; if (onProgress) onProgress(d, list.length, d ? `あと約 ${fmtDur((Date.now() - t0) / d * (list.length - d))}` : '');
    }
    refreshQuota(true);
    return { n, fails };
  }
  async function deleteApi(list, hard, onProgress) {
    const byP = new Map(); list.forEach((f) => { if (!byP.has(f.parentId)) byP.set(f.parentId, []); byP.get(f.parentId).push(f); });
    let done = 0;
    for (const [pid, items] of byP) {
      if (window.__ppdupStop) break;
      const cur = await apiList(pid);
      const ids = items.map((f) => f.id).filter((id) => cur.some((x) => x.id === id));
      if (ids.length !== items.length) throw new Error('一部のファイルが見つかりません（再スキャンしてください）: ' + items[0].path);
      for (let i = 0; i < ids.length; i += 100) await apiRemove(ids.slice(i, i + 100), pid, hard);
      const set = new Set(ids); files = files.filter((f) => !set.has(f.id));
      ids.forEach((id) => delete decision[id]);
      lsSetJson(LS_SCAN, files); saveDecision();
      done += ids.length; if (onProgress) onProgress(done, list.length);
    }
    refreshQuota(true);
    return done;
  }

