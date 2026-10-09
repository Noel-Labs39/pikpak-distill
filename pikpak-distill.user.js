// ==UserScript==
// @name         PikPak Distill – Dedupe
// @namespace    local.pikpak.dupcompare
// @author       Noel Labs
// @license      MIT
// @homepage     https://github.com/Noel-Labs39/pikpak-distill
// @supportURL   https://github.com/Noel-Labs39/pikpak-distill/issues
// @updateURL    https://raw.githubusercontent.com/Noel-Labs39/pikpak-distill/main/pikpak-distill.user.js
// @downloadURL  https://raw.githubusercontent.com/Noel-Labs39/pikpak-distill/main/pikpak-distill.user.js
// @version      3.3.1
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTQiIGZpbGw9IiMzMDZmZmYiLz48cmVjdCB4PSIxMiIgeT0iMTYiIHdpZHRoPSIyNCIgaGVpZ2h0PSIzMiIgcng9IjQiIGZpbGw9IiNmZmYiIG9wYWNpdHk9Ii41NSIvPjxyZWN0IHg9IjI2IiB5PSIxMiIgd2lkdGg9IjI2IiBoZWlnaHQ9IjM0IiByeD0iNCIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik0zMiAyNGgxNE0zMiAzMGgxNE0zMiAzNmg5IiBzdHJva2U9IiMzMDZmZmYiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PGNpcmNsZSBjeD0iNDQiIGN5PSI0NiIgcj0iOSIgZmlsbD0iI2ZmYjAyMCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjMiLz48cGF0aCBkPSJNNDAgNDZsMyAzIDUtNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==
// @description  PikPakの重複ファイルを、サムネイルとサイズで比べて整理するツール。作品ごとの仕分け、フォルダ名の整合、(1)の除去、チェックしたファイルの削除（ゴミ箱／完全削除）に対応。
// @match        https://mypikpak.com/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      api-drive.mypikpak.com
// @run-at       document-idle
// ==/UserScript==
(function () {
  'use strict';
  if (window.__ppdupLoaded) return;
  window.__ppdupLoaded = true;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const UNIT = { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 };
  const fmt = (b) => (b >= UNIT.GB ? (b / UNIT.GB).toFixed(2) + ' GB' : (b / UNIT.MB).toFixed(1) + ' MB');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const NEAR = 0.015; // 最大サイズとの差が1.5%以内なら「サイズが近い」
  const LS_DECISION = 'ppdup:decision:v1';
  const LS_SCAN = 'ppdup:scan:v1';
  const LS_FOLD = 'ppdup:folders:v1';

  // Tampermonkey の権限付き実行では、PikPak画面側のオブジェクトは unsafeWindow 経由で参照する
  const pageWin = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
  const getRouter = () => {
    const d = pageWin.document || document;
    const a = d.querySelector('#app') || d.body.firstElementChild;
    return a && a.__vue_app__ && a.__vue_app__.config.globalProperties.$router;
  };
  // PikPak Enhancement Master が画面を置き換えている場合（.pk-row）と標準画面（li.row）の両対応
  const isPem = () => !!document.querySelector('.pk-vp, .pk-row');
  const crumbs = () => [...document.querySelectorAll('.pk-nav span[data-id]')].map((e) => ({ id: e.dataset.id, el: e, name: e.textContent.trim() }));
  const currentFolderId = () => { if (isPem()) return (crumbs().pop() || {}).id || 'root'; const last = location.pathname.split('/').filter(Boolean).pop(); return !last || last === 'all' || last === 'drive' ? 'root' : last; };
  const currentTrail = () => (isPem() && crumbs().length ? crumbs().map((c) => c.id) : [currentFolderId()]);

  // ---------- グルーピング ----------
  // 同じファイル名モードでも、重複回避の (1) 等は同名として扱う
  const keyOf = (name, mode) => (mode === 'id' ? ((name.match(/(\d{5,8})/) || [])[1] || name.toLowerCase()) : name.toLowerCase().replace(/\s?\(\d+\)(?=\.[a-z0-9]{2,5}$|$)/, ''));
  function buildGroups(files, mode) {
    const m = new Map();
    files.forEach((f) => { const k = keyOf(f.name, mode); if (!m.has(k)) m.set(k, []); m.get(k).push(f); });
    return [...m.entries()]
      .filter(([, v]) => v.length > 1)
      .map(([k, v]) => {
        v.sort((a, b) => b.size - a.size);
        const max = v[0].size || 1;
        // 隣り合うサイズ同士が1.5%以内なら「サイズが近い組」（最大以外の組も拾う）
        const near = v.some((x, i) => i > 0 && (v[i - 1].size - x.size) / (v[i - 1].size || 1) <= NEAR);
        return { key: k, items: v, near };
      })
      .sort((a, b) => (b.near - a.near) || a.key.localeCompare(b.key));
  }


  // ---------- フォルダ名を中のファイル名に揃える ----------
  // 拡張子と、分割ファイルの連番(-1,-2)を除いた名前（SAMPLE-1234567-2.mp4 → SAMPLE-1234567）
  // 重複回避で付けた (1) なども除く（SAMPLE-1234567(1).mp4 → SAMPLE-1234567）
  const baseName = (n) => n.replace(/\.[A-Za-z0-9]{2,5}$/, '').replace(/\s?\(\d+\)$/, '').replace(/^(.*\d{4,})-\d{1,2}$/, '$1');
  // 計画: [{id, parentId, path, cur, target, status, note}]  status: same / rename / dup / skip
  function buildRenamePlan(files, folders) {
    const direct = new Map();
    files.forEach((f) => { if (!direct.has(f.parentId)) direct.set(f.parentId, []); direct.get(f.parentId).push(f); });
    const taken = new Map(); // parentId -> Set(小文字の名前) ※「そのまま残るフォルダ」と確定済みの新名
    const add = (pid, n) => { if (!taken.has(pid)) taken.set(pid, new Set()); taken.get(pid).add(n.toLowerCase()); };
    const plan = folders.map((fo) => {
      const fs = (direct.get(fo.id) || []).filter((f) => f.size > 0 || true);
      const bases = [...new Set(fs.map((f) => baseName(f.name)))];
      const p = { id: fo.id, parentId: fo.parentId, trail: fo.trail, path: fo.path, cur: fo.name, target: '', status: 'skip', note: '' };
      if (fo.isRoot || (fo.trail && fo.trail.length < 3)) p.note = '最上位・スキャン起点のフォルダは変更しません';
      else if (!fs.length) p.note = '直下にファイルなし';
      else if (bases.length > 1) { p.note = '直下に名前の異なるファイルが複数: ' + bases.slice(0, 3).join(' / '); p.cands = bases; }
      else p.target = bases[0];
      return p;
    });
    // すでに一致しているものを先に確定（衝突時にこちらを優先して名前を守る）
    plan.forEach((p) => { if (p.target && p.target === p.cur) { p.status = 'same'; add(p.parentId, p.target); } });
    // 既に「名前(n)」形式で付いているものも、その名前が空いていれば維持（毎回付け替わらないように）
    plan.forEach((p) => {
      if (p.status === 'same' || !p.target) return;
      const esc2 = p.target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp('^' + esc2 + '\\(\\d+\\)$').test(p.cur) && !(taken.get(p.parentId) || new Set()).has(p.cur.toLowerCase())) { p.status = 'same'; add(p.parentId, p.cur); }
    });
    // 目的地のない・要確認のフォルダは現状の名前を占有
    plan.forEach((p) => { if (!p.target) add(p.parentId, p.cur); });
    plan.forEach((p) => {
      if (!p.target || p.status === 'same') return;
      let n = p.target, i = 0;
      while (taken.get(p.parentId) && taken.get(p.parentId).has(n.toLowerCase())) { i++; n = `${p.target}(${i})`; }
      // 自分自身の現名が (n) と一致している場合は変更不要
      if (n === p.cur) { p.status = 'same'; add(p.parentId, n); return; }
      add(p.parentId, n);
      p.finalName = n; p.status = i ? 'dup' : 'rename';
      p.note = i ? '同名フォルダがあるため (' + i + ') を付与' : '';
    });
    plan.forEach((p) => { if (p.finalName) p.target = p.finalName; else if (p.status === 'same') p.target = p.cur; });
    return plan;
  }

  // ---------- 作品ごとに仕分け（混在フォルダの中に品番フォルダを作り、そこへ移動） ----------
  const workKey = (n) => { const b = baseName(n); return /\d{5,8}/.test(b) ? b : ''; };
  const addSuffix = (name, taken) => {
    const m = name.match(/^(.*?)(\.[A-Za-z0-9]{2,5})?$/); let i = 1, n;
    do { n = `${m[1]}(${i})${m[2] || ''}`; i++; } while (taken.has(n.toLowerCase()));
    return n;
  };
  // 計画: [{cid, ctrail, cpath, work, folderId, folderNew, items:[{id,name,to}], status, note}]
  function buildSortPlan(files, folders) {
    const kids = new Map(), direct = new Map();
    folders.forEach((f) => { if (!kids.has(f.parentId)) kids.set(f.parentId, []); kids.get(f.parentId).push(f); });
    files.forEach((f) => { if (!direct.has(f.parentId)) direct.set(f.parentId, []); direct.get(f.parentId).push(f); });
    const plan = [];
    folders.forEach((c) => {
      const fs = direct.get(c.id) || [];
      const groups = new Map();
      fs.forEach((f) => { const k = workKey(f.name); if (!k) return; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(f); });
      if (groups.size < 2) return; // 1作品だけのフォルダは仕分け不要（フォルダ名の整合で対応）
      const own = [...groups.keys()].find((k) => k.toLowerCase() === c.name.toLowerCase()); // フォルダ名と同じ作品はそのまま残す
      [...groups.keys()].sort().forEach((k) => {
        if (k === own) return;
        const ex = (kids.get(c.id) || []).find((f) => f.name.toLowerCase() === k.toLowerCase());
        const taken = new Set((ex ? direct.get(ex.id) || [] : []).map((f) => f.name.toLowerCase()));
        const items = groups.get(k).map((f) => {
          let to = f.name;
          if (taken.has(to.toLowerCase())) to = addSuffix(f.name, taken);
          taken.add(to.toLowerCase());
          return { id: f.id, name: f.name, to };
        });
        plan.push({ cid: c.id, ctrail: c.trail, cpath: c.path, work: k, folderId: ex ? ex.id : '', folderNew: !ex, items, status: 'todo', note: '' });
      });
    });
    // 下の階層の混在フォルダから先に（My Pack直下の大量振り分けは最後）
    return plan.sort((a, b) => (b.ctrail.length - a.ctrail.length) || a.cpath.localeCompare(b.cpath));
  }

  // ---------- 仕上げ：不要になった (1) を外す ----------
  // 重複を削除したあと、同じ場所に元の名前が無くなったフォルダ・ファイルの (n) を外す
  const PAREN_DIR = /^(.*?)\s?\((\d+)\)$/;
  const PAREN_FILE = /^(.*?)\s?\((\d+)\)(\.[A-Za-z0-9]{2,5})$/;
  function buildCleanPlan(files, folders) {
    const plan = [];
    const fTrail = new Map(folders.map((f) => [f.id, f.trail]));
    const fPath = new Map(folders.map((f) => [f.id, f.path]));
    const sib = (arr) => { const m = new Map(); arr.forEach((x) => { if (!m.has(x.parentId)) m.set(x.parentId, []); m.get(x.parentId).push(x); }); return m; };
    const run = (groups, re, kind) => groups.forEach((list, pid) => {
      const ptrail = fTrail.get(pid);
      const taken = new Set(list.map((x) => x.name.toLowerCase()));
      list.map((x) => ({ x, m: x.name.match(re) })).filter((o) => o.m)
        .sort((a, b) => (+a.m[2] - +b.m[2]) || a.x.name.localeCompare(b.x.name))
        .forEach(({ x, m }) => {
          const to = m[1] + (m[3] || '');
          const p = { kind, id: x.id, parentId: pid, ptrail, path: fPath.get(pid) || x.path || '', cur: x.name, target: to, status: 'todo', note: '' };
          if (kind === 'folder' && (x.isRoot || (x.trail && x.trail.length < 3))) return;
          if (!ptrail) { p.status = 'skip'; p.note = '場所の情報がありません（ホームからスキャンし直してください）'; }
          else if (taken.has(to.toLowerCase())) { p.status = 'skip'; p.note = '同じ場所に「' + to + '」が残っているため外せません（重複の可能性）'; }
          else { taken.delete(x.name.toLowerCase()); taken.add(to.toLowerCase()); }
          plan.push(p);
        });
    });
    run(sib(folders), PAREN_DIR, 'folder');
    run(sib(files), PAREN_FILE, 'file');
    return plan;
  }
  // ---------- PikPak API を直接呼ぶ（画面操作なし・バックグラウンド処理） ----------
  // ログイン中のPikPak画面が保存している認証情報を、このブラウザ内でだけ使います（外部へは送りません）。
  const API = 'https://api-drive.mypikpak.com/drive/v1';
  function apiHeaders() {
    let auth = '';
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith('credentials')) continue;
      try { const v = JSON.parse(localStorage.getItem(k)); if (v && v.access_token) { auth = (v.token_type || 'Bearer') + ' ' + v.access_token; break; } } catch (e) { /* 次へ */ }
    }
    if (!auth) throw new Error('ログイン情報を取得できません（PikPakの画面を再読み込みするか、再ログインしてください）');
    return { 'Content-Type': 'application/json', Authorization: auth, 'x-device-id': localStorage.getItem('deviceid') || '' };
  }
  // 通信は Tampermonkey の GM_xmlhttpRequest を優先（ブラウザやスクリプト実行環境の通信制限を受けない）
  function http(url, opt) {
    if (typeof GM_xmlhttpRequest !== 'function') return fetch(url, opt);
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: opt.method || 'GET', url, headers: opt.headers, data: opt.body, timeout: 60000,
        onload: (r) => resolve({ ok: r.status >= 200 && r.status < 300, status: r.status, json: async () => JSON.parse(r.responseText || '{}') }),
        onerror: () => reject(new Error('通信に失敗しました（ネットワーク、またはTampermonkeyの通信許可を確認してください）')),
        ontimeout: () => reject(new Error('通信がタイムアウトしました')),
      });
    });
  }
  async function api(path, opt = {}) {
    for (let tries = 0; ; tries++) {
      let res;
      try { res = await http(API + path, { ...opt, headers: apiHeaders() }); }
      catch (e) { if (tries < 2) { await sleep(1500); continue; } throw new Error(e.message === 'Failed to fetch' ? 'PikPakのサーバーに接続できませんでした（画面を再読み込みして、もう一度お試しください）' : e.message); }
      if ((res.status === 429 || res.status >= 500) && tries < 5) { await sleep(1500 * (tries + 1)); continue; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data.error_description || data.error || 'API ' + res.status) + (res.status === 401 ? '（画面を再読み込みしてから再実行してください）' : ''));
      return data;
    }
  }
  const apiPid = (id) => (!id || id === 'root' ? '' : id);
  async function apiList(pid) {
    const out = []; let token = '';
    const filters = encodeURIComponent(JSON.stringify({ phase: { eq: 'PHASE_TYPE_COMPLETE' }, trashed: { eq: false } }));
    do {
      const d = await api(`/files?thumbnail_size=SIZE_MEDIUM&limit=500&parent_id=${apiPid(pid)}&filters=${filters}${token ? '&page_token=' + encodeURIComponent(token) : ''}`);
      (d.files || []).forEach((f) => out.push(f));
      token = d.next_page_token || '';
    } while (token);
    return out;
  }
  async function scanApi(startTrail, opt = {}) {
    const outFiles = [], outFolders = [];
    const queue = [{ id: startTrail[startTrail.length - 1], path: '', trail: startTrail }];
    let done = 0, active = 0, err = null;
    window.__ppdupStop = false;
    await new Promise((resolve) => {
      const pump = () => {
        if (err || window.__ppdupStop) { if (!active) resolve(); return; }
        if (!queue.length && !active) { resolve(); return; }
        while (active < 4 && queue.length) {
          const cur = queue.shift(); active++;
          apiList(cur.id).then((list) => {
            list.forEach((f) => {
              if (f.kind === 'drive#folder') {
                const fo = { id: f.id, name: f.name, parentId: cur.id, path: cur.path + '/' + f.name, trail: [...cur.trail, f.id] };
                outFolders.push(fo); queue.push({ id: f.id, path: fo.path, trail: fo.trail });
              } else outFiles.push({ id: f.id, name: f.name, size: +f.size || 0, thumb: f.thumbnail_link || '', parentId: cur.id, path: cur.path || '/' });
            });
          }).catch((e) => { err = e; }).finally(() => { active--; done++; if (opt.onProgress) opt.onProgress(done, done + queue.length + active, outFiles.length); pump(); });
        }
      };
      pump();
    });
    if (err) throw err;
    // スキャン起点（例：My Pack）自身も仕分け対象にするため登録（名前の変更対象にはしない）
    const rootId = startTrail[startTrail.length - 1];
    const rootName = ((crumbs().pop() || {}).name) || 'スキャン起点';
    outFolders.unshift({ id: rootId, name: rootName, parentId: startTrail.length > 1 ? startTrail[startTrail.length - 2] : '', path: '', trail: startTrail, isRoot: true });
    return { files: outFiles, folders: outFolders };
  }
  const apiGet = (id) => api('/files/' + id);
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
  async function cleanApi(p) {
    const sibs = await apiList(p.parentId);
    const me = sibs.find((x) => x.id === p.id);
    if (!me) throw new Error('見つかりません（再スキャンしてください）: ' + p.cur);
    if (me.name === p.target) { p.cur = p.target; p.status = 'done'; return; }
    if (me.name !== p.cur) throw new Error('現在の名前が想定と違います: ' + me.name);
    if (sibs.some((x) => x.id !== p.id && x.name.toLowerCase() === p.target.toLowerCase())) { p.status = 'skip'; p.note = '同じ場所に「' + p.target + '」があります'; throw new Error('同じ場所に「' + p.target + '」が残っています'); }
    await apiRename(p.id, p.target);
  }
  async function cleanOne(p) {
    await cleanApi(p);
    if (p.kind === 'folder') {
      const f = folders.find((x) => x.id === p.id);
      if (f) {
        const old = f.path; f.name = p.target; f.path = p.path + '/' + p.target;
        folders.forEach((y) => { if (y.path.startsWith(old + '/')) y.path = f.path + y.path.slice(old.length); });
        files.forEach((y) => { if (y.path === old || y.path.startsWith(old + '/')) y.path = f.path + y.path.slice(old.length); });
      }
    } else { const f = files.find((x) => x.id === p.id); if (f) f.name = p.target; }
    p.cur = p.target; p.status = 'done';
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
      try { localStorage.setItem(LS_SCAN, JSON.stringify(files)); } catch (e) { /* 無視 */ } saveDecision();
      done += ids.length; if (onProgress) onProgress(done, list.length);
    }
    return done;
  }

  // ---------- 画面 ----------
  const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#306fff"/><rect x="12" y="16" width="24" height="32" rx="4" fill="#fff" opacity=".55"/><rect x="26" y="12" width="26" height="34" rx="4" fill="#fff"/><path d="M32 24h14M32 30h14M32 36h9" stroke="#306fff" stroke-width="3" stroke-linecap="round"/><circle cx="44" cy="46" r="9" fill="#ffb020" stroke="#fff" stroke-width="3"/><path d="M40 46l3 3 5-6" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const LS_META = 'ppdup:scanmeta:v1';
  const css = `
  #ppdup-btn{position:fixed;right:20px;bottom:76px;z-index:99998;display:flex;align-items:center;gap:8px;padding:6px 14px 6px 6px;border:0;border-radius:999px;background:#306fff;color:#fff;font:700 13px system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 14px #0005}
  #ppdup-btn svg{width:30px;height:30px;border-radius:9px;box-shadow:0 0 0 2px #ffffff80}
  #ppdup-btn:hover{filter:brightness(1.08)}
  #ppdup{--bg:#f5f6f8;--panel:#fff;--panel2:#eef0f4;--line:#dde0e6;--fg:#1c1f26;--mute:#6a7080;--pri:#306fff;--pri-soft:#306fff1f;--ok:#1f9d55;--danger:#d64545;--keep:#f0faf2;--del:#fff5f5;--ctl:#fff;--ctl-line:#c5c9d2;
    position:fixed;inset:0;z-index:99999;background:var(--bg);color:var(--fg);font:13px/1.5 system-ui,"Hiragino Sans","Yu Gothic",sans-serif;display:none;flex-direction:column}
  @media (prefers-color-scheme:dark){#ppdup{--bg:#15171c;--panel:#1d2027;--panel2:#252932;--line:#2c303a;--fg:#e6e8ee;--mute:#8b91a1;--pri-soft:#306fff33;--keep:#17261c;--del:#2a1a1a;--ctl:#252932;--ctl-line:#3a3f4b}}
  #ppdup.on{display:flex}
  #ppdup header{padding:12px 18px 0;background:var(--panel);border-bottom:1px solid var(--line)}
  #ppdup .brand{display:flex;align-items:center;gap:12px}
  #ppdup .brand svg{width:44px;height:44px;flex:none}
  #ppdup .brand h1{margin:0;font:800 24px/1.1 system-ui,"Hiragino Sans",sans-serif}
  #ppdup .brand .chip{font:700 12px system-ui,sans-serif;padding:3px 10px;border-radius:999px;background:var(--pri-soft);color:var(--pri)}
  #ppdup .brand .by{font-size:12px;color:var(--mute);align-self:flex-end;margin-bottom:4px}
  #ppdup .sp{flex:1}
  #ppdup button,#ppdup select,#ppdup input[type=text]{font:inherit;padding:6px 12px;border:1px solid var(--ctl-line);border-radius:8px;background:var(--ctl);color:inherit;cursor:pointer}
  #ppdup button:disabled{opacity:.45;cursor:not-allowed}
  #ppdup button.pri{background:var(--pri);color:#fff;border-color:var(--pri);font-weight:700}
  #ppdup button.danger{background:var(--danger);color:#fff;border-color:var(--danger);font-weight:700}
  #ppdup button.big{padding:12px 26px;font-size:15px;border-radius:10px}
  #ppdup .note{color:var(--mute);font-size:12px}
  /* ステップ */
  #ppdup nav{display:flex;gap:0;margin-top:12px;overflow-x:auto}
  #ppdup nav .st{flex:1;min-width:150px;display:flex;align-items:center;gap:10px;padding:10px 12px 12px;border:0;border-bottom:3px solid transparent;border-radius:0;background:none;text-align:left;position:relative}
  #ppdup nav .st:not(:last-child)::after{content:'›';position:absolute;right:2px;top:50%;transform:translateY(-50%);color:var(--mute);font-size:18px}
  #ppdup nav .st .n{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;background:var(--panel2);color:var(--mute);flex:none}
  #ppdup nav .st .t{font-weight:700;display:block;line-height:1.25}
  #ppdup nav .st .c{font-size:11px;color:var(--mute);display:block}
  #ppdup nav .st.active{border-bottom-color:var(--pri)}
  #ppdup nav .st.active .n{background:var(--pri);color:#fff}
  #ppdup nav .st.done .n{background:var(--ok);color:#fff}
  #ppdup nav .st.next .c{color:var(--pri);font-weight:700}
  #ppdup nav .st:disabled{opacity:.4}
  /* ステップごとの操作欄 */
  #ppdup .tb{display:flex;flex-wrap:wrap;gap:8px 10px;align-items:center;padding:12px 18px;background:var(--panel);border-bottom:1px solid var(--line)}
  #ppdup .tb .head{display:flex;flex-direction:column;margin-right:8px}
  #ppdup .tb .head b{font-size:15px}
  #ppdup .tb .sep{width:1px;height:24px;background:var(--line)}
  #ppdup .tb:empty{display:none}
  /* 進捗 */
  #ppdup .prog{padding:6px 18px;font-size:12px;color:var(--mute);background:var(--bg);border-bottom:1px solid var(--line);display:flex;align-items:center;gap:12px}
  #ppdup .prog .pb{flex:0 0 180px;height:6px;border-radius:3px;background:var(--line);overflow:hidden;display:none}
  #ppdup .prog .pb i{display:block;height:100%;width:0;background:var(--pri);transition:width .2s}
  #ppdup .prog.busy .pb{display:block}
  #ppdup main{flex:1;overflow:auto;padding:14px 18px}
  #ppdup .empty{padding:40px;text-align:center;color:var(--mute)}
  /* スキャン画面 */
  .pd-hero{max-width:760px;margin:24px auto;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:28px;text-align:center}
  .pd-hero h2{margin:0 0 8px;font-size:20px}
  .pd-hero .where{display:inline-block;margin:10px 0 18px;padding:6px 14px;border-radius:999px;background:var(--panel2);font-weight:700}
  .pd-hero .acts{display:flex;gap:10px;justify-content:center}
  .pd-sum{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;max-width:760px;margin:0 auto}
  .pd-sum button{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:14px;border-radius:12px;background:var(--panel);text-align:left}
  .pd-sum button b{font-size:22px}
  .pd-sum button.zero b{color:var(--ok)}
  .pd-next{display:flex;justify-content:flex-end;margin:16px 0 4px}
  /* 一覧 */
  .pd-g{background:var(--panel);border:1px solid var(--line);border-radius:10px;margin-bottom:12px;overflow:hidden}
  .pd-gh{padding:8px 12px;background:var(--panel2);font-weight:600;display:flex;gap:10px;align-items:center}
  .pd-tag{font-size:11px;padding:1px 7px;border-radius:999px;background:#ffe7b8;color:#7a4b00;font-weight:600}
  .pd-row{display:flex;gap:12px;padding:10px 12px;border-top:1px solid var(--line);align-items:center}
  .pd-row.keep{background:var(--keep)}.pd-row.del{background:var(--del)}
  .pd-th{width:160px;height:90px;border-radius:6px;background:#d8dbe2;flex:none;position:relative;overflow:hidden}
  .pd-th img{width:100%;height:100%;object-fit:cover;display:block}
  .pd-th:hover img{position:fixed;z-index:100000;left:50%;top:50%;transform:translate(-50%,-50%);width:auto;height:auto;max-width:80vw;max-height:80vh;box-shadow:0 8px 40px #000a;border-radius:8px}
  .pd-info{flex:1;min-width:0}
  .pd-name{font-weight:600;word-break:break-all}
  .pd-path{color:var(--mute);font-size:12px;word-break:break-all}
  .pd-bar{height:6px;border-radius:3px;background:var(--line);margin-top:6px;max-width:320px}
  .pd-bar i{display:block;height:100%;border-radius:3px;background:var(--pri)}
  .pd-sz{width:130px;text-align:right;flex:none}
  .pd-sz b{font-size:15px}
  .pd-act{flex:none}
  .pd-chk{flex:none;display:flex;align-items:center;justify-content:center;width:34px;align-self:stretch;cursor:pointer}
  .pd-chk input{width:20px;height:20px;cursor:pointer;accent-color:var(--danger)}
  #pd-dlg{position:fixed;inset:0;z-index:100001;background:#0007;display:flex;align-items:center;justify-content:center}
  #pd-dlg .box{background:#fff;color:#1c1f26;border-radius:12px;padding:24px;width:min(460px,92vw);box-shadow:0 10px 40px #0006}
  #pd-dlg h3{margin:0 0 12px;font-size:17px}
  #pd-dlg .note{color:#6a7080;font-size:12px}
  #pd-dlg .hard{display:flex;gap:8px;align-items:center;color:#d93025;font-weight:600;margin:16px 0;cursor:pointer}
  #pd-dlg .acts{display:flex;justify-content:flex-end;gap:10px}
  #pd-dlg button{font:inherit;padding:6px 14px;border:1px solid #c5c9d2;border-radius:8px;background:#fff;color:inherit;cursor:pointer}
  #pd-dlg button.danger{background:#d64545;color:#fff;border-color:#d64545;font-weight:700}
  @media (prefers-color-scheme:dark){#pd-dlg .box{background:#1d2027;color:#e6e8ee}#pd-dlg button{background:#252932;border-color:#3a3f4b}}
  `;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  const STEPS = [
    { v: 'scan', t: '読み込む', d: '開いているフォルダ以下のファイルとフォルダを読み込みます。ほかの機能はこのあとで使えます。' },
    { v: 'sort', t: '作品ごとに仕分け', d: '複数の作品が入ったフォルダの中に品番フォルダを作り、ファイルを振り分けます。' },
    { v: 'ren', t: 'フォルダ名を揃える', d: 'フォルダ名を中のファイル名（品番）に揃えます。同名があれば (1) を付けます。' },
    { v: 'dup', t: '重複を比べて削除', d: '同じファイルをサムネイルとサイズで比べ、チェックしたものを削除します。' },
    { v: 'clean', t: '(1)を外す', d: '重複を削除したあと、不要になった (1) をフォルダ名・ファイル名から外します。' },
  ];

  const btn = document.createElement('button'); btn.id = 'ppdup-btn'; btn.innerHTML = LOGO + '<span>Distill</span>'; btn.title = 'PikPak Distill – Dedupe'; document.body.appendChild(btn);
  const root = document.createElement('div'); root.id = 'ppdup';
  root.innerHTML = `
    <header>
      <div class="brand">${LOGO}<h1>PikPak Distill</h1><span class="chip">Dedupe</span><span class="by">by Noel Labs</span><span class="sp"></span><button data-a="close">閉じる</button></div>
      <nav data-r="nav"></nav>
    </header>
    <div class="tb" data-r="tb"></div>
    <div class="prog" data-r="prog"><span data-r="status"></span><span class="pb"><i data-r="pbar"></i></span></div>
    <main data-r="main"></main>`;
  document.body.appendChild(root);
  const $ = (s) => root.querySelector(s);
  // 状態表示（ratio を渡すと進捗バーを出す）
  const status = (t, ratio) => {
    $('[data-r=status]').textContent = t || '';
    const busy = typeof ratio === 'number';
    $('[data-r=prog]').classList.toggle('busy', busy);
    if (busy) $('[data-r=pbar]').style.width = Math.max(2, Math.min(100, ratio * 100)).toFixed(1) + '%';
  };

  let folders = [];
  try { folders = JSON.parse(localStorage.getItem(LS_FOLD) || '[]'); } catch (e) { folders = []; }
  let files = [];
  try { files = JSON.parse(localStorage.getItem(LS_SCAN) || '[]'); } catch (e) { files = []; }
  let meta = null;
  try { meta = JSON.parse(localStorage.getItem(LS_META) || 'null'); } catch (e) { meta = null; }
  let decision = {};
  try { decision = JSON.parse(localStorage.getItem(LS_DECISION) || '{}'); } catch (e) { decision = {}; }
  const saveDecision = () => { try { localStorage.setItem(LS_DECISION, JSON.stringify(decision)); } catch (e) { /* 無視 */ } };
  const saveAll = () => { try { localStorage.setItem(LS_SCAN, JSON.stringify(files)); localStorage.setItem(LS_FOLD, JSON.stringify(folders)); } catch (e) { /* 容量超過は無視 */ } };
  const stateOf = (f, idx) => decision[f.id] || (idx === 0 ? 'keep' : 'del');
  const hasScan = () => !!meta && (folders.length > 0 || files.length > 0); // このバージョンで読み込んだ結果だけを使う
  let view = 'scan';
  let splan = [], cplan = [], rplan = [];
  let busy = false;

  // ---------- 件数（ステップの案内用） ----------
  function counts() {
    if (!hasScan()) return null;
    return {
      sort: buildSortPlan(files, folders).length,
      ren: buildRenamePlan(files, folders).filter((p) => p.status === 'rename' || p.status === 'dup').length,
      dup: buildGroups(files, 'name').length,
      clean: buildCleanPlan(files, folders).filter((p) => p.status === 'todo').length,
    };
  }
  const UNIT_OF = { sort: '作品', ren: '件', dup: '組', clean: '件' };
  function renderNav() {
    const c = counts();
    const next = c ? (['sort', 'ren', 'dup', 'clean'].find((k) => c[k] > 0) || null) : 'scan';
    $('[data-r=nav]').innerHTML = STEPS.map((s, i) => {
      let sub, cls = '';
      if (s.v === 'scan') { sub = meta ? `${new Date(meta.at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 読み込み済み` : 'まずはここから'; if (meta) cls = 'done'; }
      else if (!c) sub = '読み込み後に使えます';
      else if (c[s.v] === 0) { sub = '対象なし'; cls = 'done'; }
      else sub = `${c[s.v]} ${UNIT_OF[s.v]}`;
      if (s.v === next) { cls += ' next'; sub += s.v === 'scan' ? '' : '・おすすめ'; }
      if (s.v === view) cls += ' active';
      const locked = s.v !== 'scan' && !c;
      return `<button class="st ${cls}" data-step="${s.v}"${locked || busy ? ' disabled' : ''} title="${esc(s.d)}"><span class="n">${cls.includes('done') && s.v !== view ? '✓' : i + 1}</span><span><span class="t">${esc(s.t)}</span><span class="c">${esc(sub)}</span></span></button>`;
    }).join('');
  }
  // 次のステップへのボタン
  function nextButton() {
    const i = STEPS.findIndex((s) => s.v === view);
    const n = STEPS[i + 1];
    return n ? `<div class="pd-next"><button class="pri" data-step="${n.v}">次へ：${i + 2}. ${esc(n.t)} →</button></div>` : '';
  }
  // ステップごとの操作欄（切り替え時に作り直す）
  function renderToolbar() {
    const s = STEPS.find((x) => x.v === view);
    const head = `<div class="head"><b>${STEPS.indexOf(s) + 1}. ${esc(s.t)}</b><span class="note">${esc(s.d)}</span></div><span class="sp"></span>`;
    const run = (k, label) => `<button data-a="${k}1">先頭1件だけ試す</button><button class="pri" data-a="${k}all">${label}</button><button data-a="stop">中断</button>`;
    let html = '';
    if (view === 'scan') html = '';
    if (view === 'sort') html = head + run('sort', 'すべて仕分け');
    if (view === 'ren') html = head + `<select data-a="renfilter"><option value="todo">変更するもの</option><option value="skip">要確認</option><option value="same">変更なし</option><option value="all">すべて</option></select>` + run('ren', 'すべて変更');
    if (view === 'clean') html = head + run('clean', 'すべて外す');
    if (view === 'dup') html = head + `
      <select data-a="mode" title="まとめ方"><option value="name">同じファイル名でまとめる</option><option value="id">同じ品番でまとめる（-1/-2違いも含む）</option></select>
      <label><input type="checkbox" data-a="nearonly"> サイズが近い組だけ</label>
      <input type="text" data-a="q" placeholder="絞り込み（品番・名前）" size="16">
      <span class="sep"></span>
      <button data-a="csv">CSV保存</button>
      <button class="danger" data-a="delall">チェックしたものを削除</button>`;
    $('[data-r=tb]').innerHTML = html;
  }
  function setView(v) {
    if (v !== 'scan' && !hasScan()) v = 'scan';
    view = v;
    if (v === 'clean') cplan = buildCleanPlan(files, folders);
    if (v === 'ren') rplan = buildRenamePlan(files, folders);
    if (v === 'sort') splan = buildSortPlan(files, folders);
    renderToolbar(); render(); renderNav();
    $('[data-r=main]').scrollTop = 0;
  }
  function render() {
    if (view === 'scan') return renderScan();
    if (view === 'ren') return renderRen();
    if (view === 'sort') return renderSort();
    if (view === 'clean') return renderClean();
    return renderDup();
  }

  // ---------- 1. 読み込む ----------
  function renderScan() {
    const where = crumbs().map((c) => c.name).filter(Boolean).join(' › ') || (currentFolderId() === 'root' ? 'ホーム' : 'いま開いているフォルダ');
    const c = counts();
    const sum = c ? `<div class="pd-sum">${['sort', 'ren', 'dup', 'clean'].map((k, i) => `<button data-step="${k}" class="${c[k] ? '' : 'zero'}"><span class="note">${i + 2}. ${esc(STEPS[i + 1].t)}</span><b>${c[k] ? c[k] + ' ' + UNIT_OF[k] : '✓ 対象なし'}</b></button>`).join('')}</div>` : '';
    const next = c && (['sort', 'ren', 'dup', 'clean'].find((k) => c[k] > 0));
    $('[data-r=main]').innerHTML = `
      <div class="pd-hero">
        <h2>${meta ? 'もう一度読み込む' : 'まずはフォルダを読み込みます'}</h2>
        <div class="note">ホームか My Pack を開いた状態で実行してください。読み込みはバックグラウンドで行い、PikPakの画面は切り替わりません。</div>
        <div class="where">読み込む場所：${esc(where)}</div>
        <div class="acts"><button class="pri big" data-a="scan"${busy ? ' disabled' : ''}>${meta ? '再スキャン' : 'スキャン開始'}</button><button class="big" data-a="stop">中断</button></div>
        ${meta ? `<div class="note" style="margin-top:14px">前回：${new Date(meta.at).toLocaleString('ja-JP')} ／ ${esc(meta.where || '')} ／ フォルダ ${meta.nfo} ・ ファイル ${meta.nfi}</div>` : ''}
      </div>
      ${sum}
      ${next ? `<div class="pd-next" style="max-width:760px;margin:16px auto"><button class="pri" data-step="${next}">おすすめ：${STEPS.findIndex((s) => s.v === next) + 1}. ${esc(STEPS.find((s) => s.v === next).t)} へ →</button></div>` : ''}`;
    if (!busy) status(meta ? '読み込み済みです。上のステップから機能を選べます（操作したら再スキャンで最新にできます）。' : 'まずは「スキャン開始」を押してください。');
  }
  async function runScan() {
    if (busy) return;
    busy = true; renderNav(); renderScan();
    status('読み込み中…', 0);
    try {
      const where = crumbs().map((c) => c.name).filter(Boolean).join(' › ') || 'ホーム';
      const r = await scanApi(currentTrail(), { onProgress: (d, total, n) => status(`読み込み中… フォルダ ${d}/${total} ／ ファイル ${n} 件`, d / Math.max(total, 1)) });
      files = r.files; folders = r.folders; saveAll();
      meta = { at: Date.now(), where, nfo: folders.length, nfi: files.length };
      try { localStorage.setItem(LS_META, JSON.stringify(meta)); } catch (e) { /* 無視 */ }
      busy = false;
      status(`読み込み完了：フォルダ ${folders.length} ／ ファイル ${files.length} 件`);
      setView('scan');
      status(`読み込み完了：フォルダ ${folders.length} ／ ファイル ${files.length} 件。次のステップを選んでください。`);
    } catch (err) { busy = false; renderNav(); renderScan(); status('エラー: ' + err.message); }
  }

  // ---------- 2. 作品ごとに仕分け ----------
  function renderSort() {
    const todo = splan.filter((g) => g.status !== 'done');
    const nNew = todo.filter((g) => g.folderNew).length, nFiles = todo.reduce((a, g) => a + g.items.length, 0), nRen = todo.reduce((a, g) => a + g.items.filter((x) => x.to !== x.name).length, 0);
    $('[data-r=main]').innerHTML = `<div class="pd-g"><div class="pd-gh"><span>残り ${todo.length} 作品</span><span class="note">移動 ${nFiles} 本 ／ 新規フォルダ ${nNew} ／ 同名のため (1) を付ける ${nRen}</span></div>
      ${todo.map((g) => `<div class="pd-row"><div class="pd-info"><div class="pd-path">${esc(g.cpath || '（読み込んだフォルダの直下）')}</div>
        <div class="pd-name">${esc(g.work)} <span class="pd-tag">${g.folderNew ? '新規フォルダ' : '既存フォルダへ'}</span></div>
        <div class="note">${g.items.map((x) => esc(x.name) + (x.to !== x.name ? ' → <b>' + esc(x.to) + '</b>' : '')).join('　')}</div></div></div>`).join('') || '<div class="empty">✓ 仕分けが必要なフォルダはありません</div>'}</div>${nextButton()}`;
    if (!busy) status(todo.length ? '内容を確認して、まずは「先頭1件だけ試す」で動きを確かめてください。削除はしません。' : '仕分けは不要です。次のステップへ進んでください。');
  }
  async function runSort(onlyFirst) {
    const targets = splan.filter((g) => g.status !== 'done').slice(0, onlyFirst ? 1 : undefined);
    if (!targets.length) return;
    busy = true; renderNav(); window.__ppdupStop = false; let ok = 0;
    for (const g of targets) {
      if (window.__ppdupStop) break;
      status(`仕分け中… ${ok + 1}/${targets.length}：${g.work}`, ok / targets.length);
      try { await sortApi(g); ok++; saveAll(); }
      catch (err) { saveAll(); busy = false; setView('sort'); status(`停止：${g.cpath} の ${g.work}：${err.message}（${ok}作品完了）`); return; }
      await sleep(100);
    }
    busy = false; setView('sort'); status(`${ok} 作品を仕分けしました。`); refreshView();
  }

  // ---------- 3. フォルダ名を揃える ----------
  const STLABEL = { same: '変更なし', rename: '変更', dup: '変更（重複回避）', skip: '要確認・対象外' };
  function renderRen() {
    const show = $('[data-a=renfilter]') ? $('[data-a=renfilter]').value : 'todo';
    const list = rplan.filter((p) => show === 'all' || (show === 'todo' ? p.status === 'rename' || p.status === 'dup' : p.status === show));
    const cnt = (s) => rplan.filter((p) => p.status === s).length;
    $('[data-r=main]').innerHTML = `<div class="pd-g"><div class="pd-gh"><span>変更 ${cnt('rename')} ／ 重複回避 ${cnt('dup')}</span><span class="note">要確認 ${cnt('skip')} ／ 一致済み ${cnt('same')}</span></div>
      ${list.map((p) => `<div class="pd-row"><div class="pd-info"><div class="pd-path">${esc(p.path)}</div>
        <div class="pd-name">${esc(p.cur)} <span class="note">→</span> ${p.target ? esc(p.target) : '<i>（未定）</i>'}</div>
        ${p.note ? `<div class="note">${esc(p.note)}</div>` : ''}</div><div class="pd-sz"><span class="pd-tag">${STLABEL[p.status]}</span></div></div>`).join('') || '<div class="empty">✓ 該当なし</div>'}</div>${nextButton()}`;
    if (!busy) status(cnt('rename') + cnt('dup') ? '変更内容を確認して、まずは「先頭1件だけ試す」で確かめてください。' : '名前の変更は不要です。次のステップへ進んでください。');
  }
  async function runRen(onlyFirst) {
    const sh = $('[data-a=renfilter]') ? $('[data-a=renfilter]').value : 'todo';
    const todo = rplan.filter((p) => p.status === 'rename' || p.status === 'dup');
    const targets = (sh === 'all' || sh === 'todo' ? todo : []).slice(0, onlyFirst ? 1 : undefined);
    if (!targets.length) return;
    busy = true; renderNav(); window.__ppdupStop = false; let ok = 0;
    for (const p of targets) {
      if (window.__ppdupStop) break;
      status(`名前を変更中… ${ok + 1}/${targets.length}：${p.cur}`, ok / targets.length);
      try { await renameApi(p); ok++; persistFolders(); }
      catch (err) { persistFolders(); busy = false; setView('ren'); status(`停止：${p.cur} → ${p.target}：${err.message}（${ok}件完了）`); return; }
      await sleep(150);
    }
    persistFolders(); busy = false; setView('ren'); status(`${ok} 件のフォルダ名を変更しました。`); refreshView();
  }
  function persistFolders() { // 変更後の名前をキャッシュへ反映
    rplan.forEach((p) => { const f = folders.find((x) => x.id === p.id); if (f) f.name = p.cur; });
    saveAll();
  }

  // ---------- 4. 重複を比べて削除 ----------
  function visibleGroups() {
    const m = $('[data-a=mode]'), n = $('[data-a=nearonly]'), qq = $('[data-a=q]');
    let groups = buildGroups(files, m ? m.value : 'name');
    if (n && n.checked) groups = groups.filter((g) => g.near);
    const q = qq ? qq.value.trim().toLowerCase() : '';
    if (q) groups = groups.filter((g) => g.items.some((x) => x.name.toLowerCase().includes(q)));
    return groups;
  }
  const delList = (groups) => groups.flatMap((g) => g.items.filter((f, i) => stateOf(f, i) === 'del'));
  function renderDup() {
    const groups = visibleGroups();
    const main = $('[data-r=main]');
    if (!groups.length) { main.innerHTML = '<div class="empty">✓ 該当する重複はありません。</div>' + nextButton(); if (!busy) status('重複はありません。'); return; }
    main.innerHTML = groups.map((g) => {
      const max = g.items[0].size || 1;
      const rows = g.items.map((f, i) => {
        const st = stateOf(f, i);
        const diff = i === 0 ? '' : '最大比 -' + (((max - f.size) / max) * 100).toFixed(1) + '%';
        return `<div class="pd-row ${st}" data-id="${esc(f.id)}">
          <label class="pd-chk" title="チェック＝削除する"><input type="checkbox" data-chk="${esc(f.id)}"${st === 'del' ? ' checked' : ''}></label>
          <div class="pd-th">${f.thumb ? `<img loading="lazy" referrerpolicy="no-referrer" src="${esc(f.thumb)}" alt="">` : ''}</div>
          <div class="pd-info"><div class="pd-name">${esc(f.name)}${i === 0 ? ' <span class="pd-tag" style="background:#d7f0dd;color:#14612f">最大＝高画質の候補</span>' : ''}</div>
            <div class="pd-path">${esc(f.path)}</div>
            <div class="pd-bar"><i style="width:${Math.max(2, (f.size / max) * 100).toFixed(1)}%"></i></div></div>
          <div class="pd-sz"><b>${fmt(f.size)}</b><div class="note">${diff}</div></div>
          <div class="pd-act"><button data-s="open">場所を開く</button></div></div>`;
      }).join('');
      return `<section class="pd-g"><div class="pd-gh"><span>${esc(g.items[0].name)}</span><span class="note">${g.items.length}件</span>${g.near ? '<span class="pd-tag">サイズが近い組あり</span>' : ''}<span class="sp"></span><button data-g="${esc(g.key)}">この組のチェックを削除</button></div>${rows}</section>`;
    }).join('') + nextButton();
    if (!busy) { const dl = delList(groups); status(`重複 ${groups.length} 組 ／ チェック（削除する） ${dl.length} 件・${fmt(dl.reduce((a, f) => a + f.size, 0))}　※各組の一番大きいファイルは最初からチェックなし（残す）になっています`); }
  }
  // 削除確認（Enhancement Master と同じく「ゴミ箱を経由しない」チェック付き）
  function askDelete(list, skipped) {
    return new Promise((resolve) => {
      const d = document.createElement('div'); d.id = 'pd-dlg';
      const total = list.reduce((a, f) => a + f.size, 0);
      d.innerHTML = `<div class="box"><h3>${list.length} 件を削除します（${fmt(total)}）</h3>
        <div class="note">対象はチェックの入ったファイルだけです。通常はPikPakのゴミ箱へ移動し、あとから戻せます。</div>
        ${skipped.length ? `<div class="note" style="color:#d93025;margin-top:8px">全件にチェックが入っている組 ${skipped.length} 組は、すべて消えてしまうため対象外にしました（${esc(skipped.slice(0, 3).join(' / '))}${skipped.length > 3 ? ' …' : ''}）</div>` : ''}
        <label class="hard"><input type="checkbox" data-hard> ゴミ箱を経由せず完全に削除する（元に戻せません）</label>
        <div class="acts"><button data-no>キャンセル</button><button class="danger" data-yes>削除する</button></div></div>`;
      document.body.appendChild(d);
      const done = (v) => { d.remove(); resolve(v); };
      d.querySelector('[data-no]').onclick = () => done(null);
      d.querySelector('[data-yes]').onclick = () => done({ hard: d.querySelector('[data-hard]').checked });
    });
  }
  async function runDelete(groups) {
    const skipped = [], list = [];
    groups.forEach((g) => {
      const del = g.items.filter((f, i) => stateOf(f, i) === 'del');
      if (!del.length) return;
      if (del.length === g.items.length) { skipped.push(g.items[0].name); return; }
      list.push(...del);
    });
    if (!list.length) { status(skipped.length ? '全件にチェックが入っている組しかないため、削除しませんでした（1件は残してください）' : 'チェックの入ったファイルがありません'); return; }
    const ans = await askDelete(list, skipped);
    if (!ans) return;
    busy = true; renderNav(); window.__ppdupStop = false;
    try {
      const n = await deleteApi(list, ans.hard, (d, t) => status(`削除中… ${d}/${t}`, d / t));
      busy = false; render(); renderNav(); status(`${n} 件を${ans.hard ? '完全に削除' : 'ゴミ箱へ移動'}しました。`); refreshView();
    } catch (err) { busy = false; render(); renderNav(); status('停止：' + err.message); }
  }

  // ---------- 5. (1)を外す ----------
  function renderClean() {
    const todo = cplan.filter((p) => p.status === 'todo'), skip = cplan.filter((p) => p.status === 'skip');
    const row = (p) => `<div class="pd-row"><div class="pd-info"><div class="pd-path">${esc(p.path)}</div>
      <div class="pd-name">${esc(p.cur)} <span class="note">→</span> ${esc(p.target)} <span class="pd-tag">${p.kind === 'folder' ? 'フォルダ' : 'ファイル'}</span></div>
      ${p.note ? `<div class="note">${esc(p.note)}</div>` : ''}</div></div>`;
    $('[data-r=main]').innerHTML = `<div class="pd-g"><div class="pd-gh"><span>外せる ${todo.length} 件</span><span class="note">フォルダ ${todo.filter((p) => p.kind === 'folder').length} ／ ファイル ${todo.filter((p) => p.kind === 'file').length}</span></div>
      ${todo.map(row).join('') || '<div class="empty">✓ 外せる (1) はありません</div>'}</div>
      ${skip.length ? `<div class="pd-g"><div class="pd-gh"><span>まだ外せないもの ${skip.length} 件</span><span class="note">同じ名前が残っています。先に「4. 重複を比べて削除」で整理してください</span></div>${skip.map(row).join('')}</div>` : ''}`;
    if (!busy) status('重複を削除したあとは、先に「1. 読み込む」で再スキャンしてから使ってください。');
  }
  async function runClean(onlyFirst) {
    const targets = cplan.filter((p) => p.status === 'todo').slice(0, onlyFirst ? 1 : undefined);
    if (!targets.length) return;
    busy = true; renderNav(); window.__ppdupStop = false; let ok = 0;
    for (const p of targets) {
      if (window.__ppdupStop) break;
      status(`(1)を外しています… ${ok + 1}/${targets.length}：${p.cur}`, ok / targets.length);
      try { await cleanOne(p); ok++; saveAll(); }
      catch (err) { saveAll(); busy = false; setView('clean'); status(`停止：${p.cur} → ${p.target}：${err.message}（${ok}件完了）`); return; }
      await sleep(150);
    }
    busy = false; setView('clean'); status(`${ok} 件の (1) を外しました。`); refreshView();
  }

  // ---------- 操作 ----------
  const CONFIRM = { sort: '表示中の作品をすべて仕分け（フォルダ作成・移動）します。よろしいですか？', ren: '表示中のフォルダ名をすべて変更します。よろしいですか？', clean: '表示中の (1) をすべて外します。よろしいですか？' };
  const RUN = { sort: runSort, ren: runRen, clean: runClean };
  root.addEventListener('click', async (e) => {
    const t = e.target.closest('button'); if (!t || t.disabled) return;
    const a = t.dataset.a;
    if (t.dataset.step) { if (!busy) setView(t.dataset.step); return; }
    if (t.dataset.s === 'open') {
      const id = t.closest('.pd-row').dataset.id;
      const f = files.find((x) => x.id === id); const r = getRouter();
      if (f && isPem()) { try { await navigator.clipboard.writeText(f.path); } catch (err) { /* 無視 */ } status('場所：' + f.path + '（パスをコピーしました）'); return; }
      if (f && r) { root.classList.remove('on'); r.push('/all/' + f.parentId); }
      return;
    }
    if (t.dataset.g !== undefined) { if (busy) return; const g = visibleGroups().find((x) => x.key === t.dataset.g); if (g) runDelete([g]); return; }
    if (a === 'close') { root.classList.remove('on'); return; }
    if (a === 'stop') { window.__ppdupStop = true; status('中断しています…（いまの処理が終わったら止まります）'); return; }
    if (busy) return;
    if (a === 'scan') return runScan();
    if (a === 'delall') return runDelete(visibleGroups());
    const m = /^(sort|ren|clean)(1|all)$/.exec(a || '');
    if (m) { if (m[2] === '1') RUN[m[1]](true); else if (confirm(CONFIRM[m[1]])) RUN[m[1]](false); return; }
    if (a === 'csv') {
      const rows = [['判定', 'ファイル名', '場所', 'サイズ(MB)']];
      visibleGroups().forEach((g) => g.items.forEach((f, i) => rows.push([stateOf(f, i) === 'keep' ? '残す' : '削除する', f.name, f.path, (f.size / UNIT.MB).toFixed(2)])));
      const csv = '﻿' + rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
      const aEl = document.createElement('a');
      aEl.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); aEl.download = 'pikpak_duplicates.csv'; aEl.click();
    }
  });
  root.addEventListener('change', (e) => {
    const id = e.target.dataset && e.target.dataset.chk;
    if (id) { decision[id] = e.target.checked ? 'del' : 'keep'; saveDecision(); const row = e.target.closest('.pd-row'); if (row) { row.classList.toggle('del', e.target.checked); row.classList.toggle('keep', !e.target.checked); } const dl = delList(visibleGroups()); status(`チェック（削除する） ${dl.length} 件・${fmt(dl.reduce((a, f) => a + f.size, 0))}`); return; }
    if (['mode', 'nearonly', 'renfilter'].includes(e.target.dataset.a)) render();
  });
  root.addEventListener('input', (e) => { if (e.target.dataset.a === 'q') render(); });
  btn.addEventListener('click', () => { root.classList.add('on'); if (!busy) setView(hasScan() ? view : 'scan'); });

  window.PPDup = { buildCleanPlan, buildSortPlan, buildRenamePlan, get folders() { return folders; }, scanApi, buildGroups, render, get files() { return files; }, set files(v) { files = v; } };
})();
