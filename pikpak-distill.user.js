// ==UserScript==
// @name         PikPak Distill – Dedupe
// @namespace    local.pikpak.dupcompare
// @author       Noel Labs
// @license      MIT
// @homepage     https://github.com/Noel-Labs39/pikpak-distill
// @supportURL   https://github.com/Noel-Labs39/pikpak-distill/issues
// @updateURL    https://raw.githubusercontent.com/Noel-Labs39/pikpak-distill/main/pikpak-distill.user.js
// @downloadURL  https://raw.githubusercontent.com/Noel-Labs39/pikpak-distill/main/pikpak-distill.user.js
// @version      4.0.2
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJwcGR1cC1sZyIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgeTI9IjEiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iIzIyYzNhNiIvPjxzdG9wIG9mZnNldD0iLjUiIHN0b3AtY29sb3I9IiMyZjZiZmYiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM3YjVjZmYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSIxOCIgZmlsbD0iIzE0MTYxYyIvPjxyZWN0IHg9IjkiIHk9IjE0IiB3aWR0aD0iMTMiIGhlaWdodD0iMTYiIHJ4PSIzIiBmaWxsPSJub25lIiBzdHJva2U9InVybCgjcHBkdXAtbGcpIiBzdHJva2Utb3BhY2l0eT0iLjUiIHN0cm9rZS13aWR0aD0iMyIvPjxyZWN0IHg9IjkiIHk9IjM0IiB3aWR0aD0iMTMiIGhlaWdodD0iMTYiIHJ4PSIzIiBmaWxsPSJub25lIiBzdHJva2U9InVybCgjcHBkdXAtbGcpIiBzdHJva2Utb3BhY2l0eT0iLjUiIHN0cm9rZS13aWR0aD0iMyIvPjxwYXRoIGQ9Ik0yMiAyMmg2bDUgMTBNMjIgNDJoNmw1LTEwIiBmaWxsPSJub25lIiBzdHJva2U9InVybCgjcHBkdXAtbGcpIiBzdHJva2Utb3BhY2l0eT0iLjciIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTM2IDE4aDdhMTQgMTQgMCAwIDEgMCAyOGgtN3oiIGZpbGw9Im5vbmUiIHN0cm9rZT0idXJsKCNwcGR1cC1sZykiIHN0cm9rZS13aWR0aD0iNS41IiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PGNpcmNsZSBjeD0iNTEiIGN5PSI0NSIgcj0iNiIgZmlsbD0iI2ZmYjAyMCIgc3Ryb2tlPSIjMTQxNjFjIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNNDguMyA0NWwxLjkgMS45IDMuMS0zLjQiIHN0cm9rZT0iIzE0MTYxYyIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=
// @description  PikPakの重複ファイルを、サムネイルとサイズで比べて整理するツール。広告・宣伝などの不要ファイルの削除、作品ごとの仕分け、フォルダ名の整合、(1)の除去、チェックしたファイルの削除（ゴミ箱／完全削除）に対応。
// @match        https://mypikpak.com/*
// @match        https://fd2ppv.cc/articles/*
// @match        https://fc2cmadb.com/articles/*
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/hls.js@1.6.15/dist/hls.min.js
// @run-at       document-idle
// ==/UserScript==
(function () {
  'use strict';
  // 販売者を調べるときに開くページ（fd2ppv.cc・fc2cmadb.com）：「販売者を調べる」で開いた小さなウィンドウの中だけで動き、
  // 販売者を読み取って PikPak の画面へ知らせる（ほかには何もしない）
  if (location.hostname === 'fd2ppv.cc' || location.hostname === 'fc2cmadb.com') {
    const hm = location.hash.match(/#ppdup-lookup(?:=([\w-]+))?/);
    // Safari は別サイトへ移るとウィンドウ名を消し、初回はサイト側の切り替えで # も消えることがあるため、
    // 開いた元（PikPak の画面）があれば動く（結果は PikPak の画面にしか送らない）
    if (!window.opener) return;
    const token = hm && hm[1] ? hm[1] : '';
    const num = decodeURIComponent((location.pathname.match(/\/articles\/([^/?#]+)/) || [])[1] || '');
    const kw = new URLSearchParams(location.search).get('keyword') || '';
    const send = (d) => { try { window.opener.postMessage({ type: 'ppdup-seller', token, num, kw, ...d }, 'https://mypikpak.com'); } catch (e) { /* 無視 */ } };
    // Cloudflare の確認画面と、年齢確認などの「先に進む前に押す」画面（どちらも人が済ませる）
    const ageGate = () => { const t = (document.body ? document.body.innerText : '').slice(0, 3000); return /18\s*歳(以上|未満)|年齢(確認|認証)|成人向け|Age Verification|Are you (over )?18|I am 18|over 18|adults? only/i.test(t) && [...document.querySelectorAll('button,a,input[type=button],input[type=submit]')].some((b) => /はい|入る|同意|Enter|Yes|I am|Agree|Continue|OK/i.test(b.textContent || b.value || '')) && !document.querySelector('.work-meta-label,a[href*="/writers/"],a[href*="/channels/"]') && !/販売者|Sellers?\b/i.test(t); };
    const challenge = () => /しばらくお待ちください|Just a moment|Attention Required/i.test(document.title) || !!document.querySelector('#challenge-form,.cf-turnstile,[id^="cf-chl"]') || ageGate();
    if (challenge()) { send({ status: 'challenge' }); return; }
    const sidOf = (a, re) => decodeURIComponent((a.getAttribute('href').match(re) || [])[1] || '');
    if (location.hostname === 'fd2ppv.cc') {
      if (/(^|\s)404(\s|$)|Not Found/i.test(document.title)) { send({ status: 'notfound' }); return; }
      // 検索結果のページ：見つかった作品ページの一覧を返す
      if (/^\/articles\/?$/.test(location.pathname)) {
        const hits = [...new Set([...document.querySelectorAll('a[href^="/articles/"]')].map((a) => a.getAttribute('href').replace(/[?#].*$/, '').replace(/\/$/, '')).filter((h) => /^\/articles\/[^/]+$/.test(h)))].slice(0, 40);
        send({ status: 'search', hits }); return;
      }
      const label = (re) => [...document.querySelectorAll('.work-meta-label')].find((l) => re.test(l.textContent.trim()));
      const lab = label(/^(販売者|賣家|卖家|Sellers?|판매자)$/i);
      let a = lab && lab.nextElementSibling ? lab.nextElementSibling.querySelector('a[href*="/channels/"]') : null;
      if (!a && /^\d+$/.test(num)) { const all = [...document.querySelectorAll('.work-meta a[href*="/channels/"]')]; if (new Set(all.map((x) => x.getAttribute('href'))).size === 1) a = all[0]; }
      if (a) { const sid = sidOf(a, /\/channels\/([^/?#]+)/); send(sid ? { status: 'ok', name: a.textContent.trim(), sid } : { status: 'noseller' }); return; }
      // FC2 以外（HEYZO・カリビアンコムなど）は「配信元」を販売者として扱う。ID は作品ページの名前の頭（例：carib-033118_001 → carib）
      const src = label(/^(配信元|發行商|发行商|Studios?|Publisher|Label|メーカー)$/i);
      const slug = (location.pathname.match(/\/articles\/([^/?#]+)/) || [])[1] || '';
      const pre = (slug.match(/^([a-z][a-z0-9]*?)-/i) || [])[1] || '';
      const sv = src && src.nextElementSibling ? src.nextElementSibling.textContent.replace(/\s+/g, ' ').trim() : '';
      send(sv && pre && !/^\d+$/.test(slug) ? { status: 'ok', name: sv, sid: pre.toLowerCase(), studio: true } : { status: 'noseller' });
      return;
    }
    // fc2cmadb.com は画面を後から組み立てるので、販売者の欄が出るまで少し待つ
    let n = 0;
    const tick = () => {
      // 販売者が出ていれば、確認画面の判定より先に読み取る（ページ内の注意書きを年齢確認と見誤らないように）
      const row = [...document.querySelectorAll('tr')].find((tr) => { const th = tr.querySelector('th'); return th && /販売者|Seller/i.test(th.textContent); })
        || [...document.querySelectorAll('div,li,dl,p')].filter((el) => /^\s*(販売者|Sellers?)\s*[：:]?/i.test(el.textContent) && el.querySelector('a[href*="/writers/"]')).sort((x, y) => x.textContent.length - y.textContent.length)[0];
      let a = row ? row.querySelector('a[href*="/writers/"]') : null;
      if (!a) { const all = [...document.querySelectorAll('a[href*="/writers/"]')]; if (all.length && new Set(all.map((x) => x.getAttribute('href'))).size === 1) a = all[0]; }
      if (!a && challenge()) { send({ status: 'challenge' }); return; }
      if (!a && /^404|ページが見つかりません|Not Found/i.test(document.title)) { send({ status: 'notfound' }); return; }
      if (a) { const sid = sidOf(a, /\/writers\/([^/?#]+)/); send(sid ? { status: 'ok', name: a.textContent.trim(), sid } : { status: 'noseller' }); return; }
      if (row && ++n > 10) { send({ status: 'noseller' }); return; }
      if (++n > 48) { send({ status: document.querySelector(`a[href*="/articles/${num}"]`) ? 'noseller' : 'notfound' }); return; }
      setTimeout(tick, 250);
    };
    tick();
    return;
  }
  if (window.__ppdupLoaded) return;
  window.__ppdupLoaded = true;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const UNIT = { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 };
  const fmt = (b) => (b >= UNIT.GB ? (b / UNIT.GB).toFixed(2) + ' GB' : b >= UNIT.MB / 10 ? (b / UNIT.MB).toFixed(1) + ' MB' : (b ? Math.max(1, Math.round(b / UNIT.KB)) : 0) + ' KB');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const NEAR = 0.015; // 最大サイズとの差が1.5%以内なら「サイズが近い」
  const LS_DECISION = 'ppdup:decision:v1';
  const LS_SCAN = 'ppdup:scan:v1';
  const LS_FOLD = 'ppdup:folders:v1';
  const LS_LOG = 'ppdup:log:v1';
  const LS_LOGSEEN = 'ppdup:logseen:v1';
  const LS_OPT_NAME = 'ppdup:opt:cleanname:v1';
  const LS_OPT_JUNK = 'ppdup:opt:junk:v1';
  const SS_RESUME = 'ppdup:resume:v1';
  const VER = '4.0.2'; // @version と合わせて更新する

  // ---------- エラーログ（このブラウザ内に最新300件まで保存） ----------
  function log(level, msg, ctx) {
    try {
      const a = JSON.parse(localStorage.getItem(LS_LOG) || '[]');
      a.push({ t: Date.now(), level, msg: String(msg || '').slice(0, 500), ctx: ctx ? String(ctx).slice(0, 300) : '', v: VER });
      while (a.length > 300) a.shift();
      localStorage.setItem(LS_LOG, JSON.stringify(a));
    } catch (e) { /* 保存できなくても処理は続ける */ }
  }
  const readLog = () => { try { return JSON.parse(localStorage.getItem(LS_LOG) || '[]'); } catch (e) { return []; } };
  window.addEventListener('error', (e) => { if (String(e.filename || '').includes('userscript') || /ppdup|PikPak Distill/.test(String(e.message))) log('error', e.message, 'window.onerror'); });

  const pageWin = window; // @grant none のため、PikPak画面と同じ環境で動く
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
  // 作品の品番（作品ID）。次の違いは同じ作品として扱う
  //   ・拡張子、重複回避の (1)
  //   ・分割・シーン違いの連番：-1 / -2、_1 / _2、part1、cd1、-A など
  //   ・配布元サイト名などの接頭辞：hhd800.com@FC2-PPV-1234567_1.mp4 → FC2-PPV-1234567
  //   ・FC2の表記ゆれ：FC2PPV-1234567 / FC2_PPV_1234567 → FC2-PPV-1234567
  const baseName = (n) => {
    let b = String(n).replace(/\.[A-Za-z0-9]{2,5}$/, '').replace(/\s?\(\d+\)$/, '');
    const fc2 = b.match(/FC2[\s_-]*PPV[\s_-]*(\d{5,8})/i);
    if (fc2) return 'FC2-PPV-' + fc2[1];
    b = b.replace(/^[^@]*@/, '').replace(/^\[[^\]]*\]\s*/, '').trim();
    return b.replace(/^(.*\d{4,})(?:[\s_-]+(?:\d{1,2}|[A-Ea-e])|[\s_-]*(?:part|cd)\s?\d{1,2})$/i, '$1');
  };
  // 計画: [{id, parentId, path, cur, target, status, note}]  status: same / rename / dup / skip
  function buildRenamePlan(files, folders) {
    const direct = new Map();
    files.forEach((f) => { if (!direct.has(f.parentId)) direct.set(f.parentId, []); direct.get(f.parentId).push(f); });
    const kids = new Map();
    folders.forEach((f) => { if (!kids.has(f.parentId)) kids.set(f.parentId, []); kids.get(f.parentId).push(f); });
    const taken = new Map(); // parentId -> Set(小文字の名前) ※「そのまま残るフォルダ」と確定済みの新名
    const add = (pid, n) => { if (!taken.has(pid)) taken.set(pid, new Set()); taken.get(pid).add(n.toLowerCase()); };
    const keep = sellerBoxIds(folders);
    const plan = folders.map((fo) => {
      // 品番の入ったファイルだけを見る（広告など品番のないファイルの名前をフォルダ名にしない）
      const fs = (direct.get(fo.id) || []).filter((f) => hasWorkId(f.name));
      let bases = [...new Set(fs.map((f) => baseName(f.name)))];
      let fromSub = false;
      if (!bases.length) { // 直下に作品ファイルがなく、中のフォルダが（広告フォルダを除いて）1作品だけなら、その品番に揃える
        const sub = (kids.get(fo.id) || []).filter((k) => hasWorkId(k.name) || !(AD_WORD.test(k.name) || DOMAIN.test(k.name)));
        if (sub.length && sub.every((k) => hasWorkId(k.name))) { bases = [...new Set(sub.map((k) => baseName(k.name)))]; fromSub = true; }
      }
      const p = { id: fo.id, parentId: fo.parentId, trail: fo.trail, path: fo.path, cur: fo.name, target: '', status: 'skip', note: '' };
      if (fo.isRoot || fo.parentId === 'root' || fo.parentId === '') p.note = '最上位・スキャン起点のフォルダは変更しません';
      else if (keep.has(fo.id)) p.note = '「販売者ごとに仕分け」のフォルダは変更しません';
      else if (!bases.length) p.note = (direct.get(fo.id) || []).length ? '品番の入ったファイルがないため変更しません' : '直下にファイルなし';
      else if (bases.length > 1) { p.note = (fromSub ? '中に品番の異なるフォルダが複数: ' : '直下に名前の異なるファイルが複数: ') + bases.slice(0, 3).join(' / '); p.cands = bases; }
      else { p.target = bases[0]; if (fromSub) p.why = '中のフォルダの品番に揃えます'; }
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
      p.note = [p.why, i ? '同名フォルダがあるため (' + i + ') を付与' : ''].filter(Boolean).join('／');
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
      const own = [...groups.keys()].find((k) => k.toLowerCase() === baseName(c.name).toLowerCase()); // フォルダ名と同じ作品はそのまま残す
      // 上の階層にすでに同じ作品のフォルダがある場合は、さらに下へフォルダを作らない（入れ子になるのを防ぐ）
      const byId = new Map(folders.map((f) => [f.id, f]));
      const upper = new Set((c.trail || []).slice(0, -1).map((id) => byId.get(id)).filter((f) => f && !f.isRoot).map((f) => baseName(f.name).toLowerCase()));
      [...groups.keys()].sort().forEach((k) => {
        if (k === own || upper.has(k.toLowerCase())) return;
        const ex = (kids.get(c.id) || []).find((f) => f.name.toLowerCase() === k.toLowerCase()) || (kids.get(c.id) || []).find((f) => baseName(f.name).toLowerCase() === k.toLowerCase());
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

  // ---------- FC2 ファイル名を整える ----------
  // 例：4k688.com@FC2-PPV-4988183_1.mp4 → FC2-PPV-4988183-1.mp4
  //   ・品番は FC2-PPV-数字 にそろえる（サイト名・広告などの前後の文字は消す）
  //   ・シリーズ／分割の番号（_1・-1・part1・cd1・_A、タイトル末尾の「…編-3」も）は「-1」「-A」の形で残す
  //   ・重複回避の (1) と拡張子はそのまま残す
  //   ・FC2 以外のファイル名は変更しない
  function fc2CleanName(name) {
    const m = String(name).match(/^(.*?)(\.[A-Za-z0-9]{2,5})?$/);
    let stem = m[1]; const ext = m[2] || '';
    const dup = stem.match(/\s?\((\d+)\)$/); if (dup) stem = stem.slice(0, dup.index);
    const f = stem.match(/FC2[\s_-]*PPV[\s_-]*(\d{5,8})(.*)$/i);
    if (!f) return null;
    // シリーズ番号：品番のすぐ後ろ（FC2-PPV-1234567_2）か、タイトルの末尾（…編-3）にあるもの
    const pm = f[2].match(/^[\s_\-－]*(?:(?:part|cd)\s?)?(\d{1,2}|[A-Ea-e])(?=$|[\s_\-－.[(（【])/i)
      || f[2].match(/[\s_\-－](?:(?:part|cd)\s?)?(\d{1,2}|[A-Ea-e])$/i)
      || f[2].match(/第\s?(\d{1,2})\s?[話部巻章]/);
    return 'FC2-PPV-' + f[1] + (pm ? '-' + pm[1].toUpperCase() : '') + (dup ? '(' + dup[1] + ')' : '') + ext;
  }
  // 計画: [{op:'rename', kind:'file', id, parentId, path, cur, target, status, note}]
  function buildNamePlan(files, folders) {
    const fPath = new Map(folders.map((f) => [f.id, f.path]));
    const byP = new Map(); files.forEach((f) => { if (!byP.has(f.parentId)) byP.set(f.parentId, []); byP.get(f.parentId).push(f); });
    const plan = [];
    byP.forEach((list, pid) => {
      const taken = new Set(list.map((x) => x.name.toLowerCase()));
      list.forEach((x) => {
        const to0 = fc2CleanName(x.name);
        if (!to0 || to0 === x.name) return;
        taken.delete(x.name.toLowerCase());
        let to = to0, note = '';
        if (taken.has(to.toLowerCase())) { to = addSuffix(to0, taken); note = '同じ名前のファイルがあるため (n) を付けます（重複の可能性：「重複を比べて削除」で確認できます）'; }
        taken.add(to.toLowerCase());
        plan.push({ op: 'rename', kind: 'file', id: x.id, parentId: pid, path: fPath.has(pid) ? fPath.get(pid) : (x.path || ''), cur: x.name, target: to, status: 'todo', note });
      });
    });
    return plan;
  }

  // ---------- 作品と関係ないファイル（広告・宣伝／10MB以下 など）の判定 ----------
  // 読み込んだファイルのうち作品と関係ないものを見分け、ほかのステップの対象から外す
  //   del    … 作品と関係ないと判断（最初からチェックあり）
  //   review … 作品の可能性があるので確認してほしいもの（最初はチェックなし）
  const JUNK_MAX = 10 * UNIT.MB;
  const AD_VIDEO_MAX = 50 * UNIT.MB; // 作品フォルダに紛れた品番のない動画は、これより小さければ広告とみなす
  const SPREAD_MAX = 200 * UNIT.MB;
  const AD_EXT = new Set(['url', 'lnk', 'webloc', 'txt', 'htm', 'html', 'mht', 'mhtml', 'chm', 'exe', 'apk', 'bat', 'cmd', 'scr', 'vbs', 'torrent']);
  const SUB_EXT = new Set(['srt', 'ass', 'ssa', 'vtt', 'sub', 'idx', 'smi']);
  const AD_WORD = /广告|廣告|広告|宣传|宣傳|宣伝|推广|推廣|地址|網址|网址|发布|發布|获取|獲取|下载|下載|防屏蔽|永久|澳门|澳門|葡京|赌场|賭場|博彩|娱乐|娛樂|直播|约炮|約炮|社区|社區|论坛|論壇|福利|扫码|掃碼|客服|微信|QQ群|电报|電報|telegram|公告|必看|招募|关注|關注|聯繫|联系|最新アドレス|promo|advert/i;
  const DOMAIN = /(^|[^a-z0-9])[a-z0-9-]{2,}\.(com|net|org|la|xyz|cc|me|tv|top|vip|club|info|app|io|co|link|site|online|live|fun|win|life)($|[^a-z0-9])/i;
  const KANA = /[぀-ヿ]/;
  // 中国語にしかない字（簡体字・繁体字）。日本語の漢字だけのタイトルを中国語と誤判定しないよう、日本語と共通の字は入れない
  const ZH_ONLY = /[们这个资视频获发址网载为无码对时说请关联报电级备实购买么吗该进过还从让给见门问间开头东车马书读写语话认识记广场论坛专业产单经现选择变态爱亲热线红际欢边领导员样传统观众极简习盘约骚妇鸡伦强调們這發實從讓讀寫專產單廣碼說聯對麼嗎]/;
  // 品番＝FC2-PPV-数字、または ABC-123 の形。日付などの数字だけ（例：发布器20260609）は品番とみなさない
  const hasWorkId = (name) => /FC2[\s_-]*PPV[\s_-]*\d{5,8}/i.test(name) || /(^|[^A-Za-z])[A-Za-z]{2,6}-\d{3,5}(?!\d)/.test(name);
  // 判定に使う周りの情報
  //   spreadNames … 品番のない同じ名前のファイルが、別々のフォルダに入っている（作品に付いてきた広告）
  //   workDirs    … 作品のフォルダ（フォルダ名か、中のファイル・フォルダに品番がある）
  //   adDirs      … 名前が広告・宣伝のフォルダ（その中身も含む）
  let spreadNames = new Set(), workDirs = new Set(), adDirs = new Set();
  function prepJunk(files, folders) {
    const where = new Map();
    files.forEach((f) => { if (hasWorkId(f.name)) return; const k = f.name.toLowerCase(); if (!where.has(k)) where.set(k, new Set()); where.get(k).add(f.parentId); });
    spreadNames = new Set([...where].filter(([, s]) => s.size >= 2).map(([k]) => k));
    workDirs = new Set();
    const top = new Set(folders.filter((d) => d.isRoot || d.parentId === 'root' || d.parentId === '').map((d) => d.id)); // 起点・ホーム直下（My Pack 等）は除く
    folders.forEach((d) => { if (hasWorkId(d.name)) { workDirs.add(d.id); if (!top.has(d.parentId)) workDirs.add(d.parentId); } });
    files.forEach((f) => { if (hasWorkId(f.name) && !top.has(f.parentId)) workDirs.add(f.parentId); });
    const ad = folders.filter((d) => !d.isRoot && !hasWorkId(d.name) && (AD_WORD.test(d.name) || DOMAIN.test(d.name))).map((d) => d.id);
    adDirs = new Set(folders.filter((d) => (d.trail || []).some((id) => ad.includes(id))).map((d) => d.id));
  }
  function junkInfo(f) {
    const name = String(f.name || '');
    const m = name.match(/^(.*?)(?:\.([A-Za-z0-9]{2,7}))?$/);
    const stem = m[1], ext = (m[2] || '').toLowerCase();
    const id = hasWorkId(name);
    const zh = !KANA.test(stem) && ZH_ONLY.test(stem);
    if (AD_EXT.has(ext)) return { level: 'del', reason: '広告・宣伝（' + ext + ' ファイル）' };
    if (!id && adDirs.has(f.parentId)) return { level: 'del', reason: '広告・宣伝（広告フォルダの中）' };
    if (!id && (AD_WORD.test(stem) || DOMAIN.test(stem))) return { level: 'del', reason: '広告・宣伝（品番なし）' };
    if (SUB_EXT.has(ext)) return { level: 'review', reason: '字幕ファイル' };
    if (f.size <= JUNK_MAX) return { level: 'del', reason: '10MB以下' };
    // 海外の宣伝ファイルによくある名前（品番なし）。大きいものは本編の可能性もあるため「要確認」に回す
    if (zh && !id) return f.size < AD_VIDEO_MAX ? { level: 'del', reason: '広告・宣伝（品番のない宣伝向けの名前）' } : { level: 'review', reason: '品番のないファイル（作品の可能性）' };
    if (!id && f.size < SPREAD_MAX && spreadNames.has(name.toLowerCase())) return { level: 'del', reason: '広告・宣伝（品番がなく、複数のフォルダに同じ名前）' };
    if (!id && workDirs.has(f.parentId)) return f.size < AD_VIDEO_MAX ? { level: 'del', reason: '広告・宣伝（作品フォルダの中の、品番のない小さなファイル）' } : { level: 'review', reason: '作品フォルダの中の、品番のないファイル' };
    if (zh) return { level: 'review', reason: '品番あり・作品の可能性（念のため確認）' };
    return null;
  }
  // 計画: [{id, name, path, parentId, size, thumb, level, reason}]
  function buildJunkPlan(files, folders) {
    prepJunk(files, folders);
    return files.map((f) => { const j = junkInfo(f); return j ? { ...f, level: j.level, reason: j.reason } : null; }).filter(Boolean)
      .sort((a, b) => (a.level === b.level ? 0 : a.level === 'del' ? -1 : 1) || a.path.localeCompare(b.path) || a.name.localeCompare(b.name));
  }

  // ---------- 仕上げ：(1) を外す・空フォルダを片付ける ----------
  // 重複を削除したあとに残る「中身が空のフォルダ」をゴミ箱へ移し、
  // 同じ場所に元の名前が無くなったフォルダ・ファイルの (n) を外す
  const PAREN_DIR = /^(.*?)\s?\((\d+)\)$/;
  const PAREN_FILE = /^(.*?)\s?\((\d+)\)(\.[A-Za-z0-9]{2,5})$/;
  // 計画: [{op:'trash'|'rename', kind, id, parentId, ptrail, path, cur, target, status:'todo'|'skip', note}]
  function buildCleanPlan(files, folders) {
    const plan = [];
    const fTrail = new Map(folders.map((f) => [f.id, f.trail]));
    const fPath = new Map(folders.map((f) => [f.id, f.path]));
    const nChild = new Map();
    files.forEach((f) => nChild.set(f.parentId, (nChild.get(f.parentId) || 0) + 1));
    folders.forEach((f) => nChild.set(f.parentId, (nChild.get(f.parentId) || 0) + 1));
    const isEmpty = (f) => !nChild.get(f.id);
    const protectedDir = (f) => f.isRoot || f.parentId === 'root' || f.parentId === ''; // 読み込み起点とホーム直下（My Pack 等）は触らない
    const item = (op, kind, x, pid, target, status, note) => ({ op, kind, id: x.id, parentId: pid, ptrail: fTrail.get(pid), path: fPath.has(pid) ? fPath.get(pid) : (x.path || ''), cur: x.name, target, status: fTrail.get(pid) ? status : 'skip', note: fTrail.get(pid) ? note : '場所の情報がありません（ホームから読み込み直してください）' });
    const sib = (arr) => { const m = new Map(); arr.forEach((x) => { if (!m.has(x.parentId)) m.set(x.parentId, []); m.get(x.parentId).push(x); }); return m; };
    // フォルダ：同じ場所の「X」「X(1)」「X(2)」…をまとめて判断
    sib(folders.filter((f) => !protectedDir(f))).forEach((list, pid) => {
      const groups = new Map();
      list.forEach((f) => { const m = f.name.match(PAREN_DIR); const b = m ? m[1] : f.name; const k = b.toLowerCase(); if (!groups.has(k)) groups.set(k, { base: b, items: [] }); groups.get(k).items.push({ f, n: m ? +m[2] : 0 }); });
      groups.forEach(({ base, items }) => {
        items.sort((a, b) => a.n - b.n);
        const empties = items.filter((o) => isEmpty(o.f)), full = items.filter((o) => !isEmpty(o.f));
        empties.forEach((o) => plan.push(item('trash', 'folder', o.f, pid, '', 'todo', items.length > 1 ? '中身が空の同名フォルダ' : '中身が空のフォルダ')));
        if (full.length === 1) {
          const o = full[0];
          if (o.f.name !== base) plan.push(item('rename', 'folder', o.f, pid, base, 'todo', empties.length ? '空の同名フォルダを片付けたあとに外します' : ''));
        } else if (full.length > 1) {
          full.filter((o) => o.n > 0).forEach((o) => plan.push(item('rename', 'folder', o.f, pid, base, 'skip', '中身のある同名フォルダが複数あります（「重複を比べて削除」で整理してください）')));
        }
      });
    });
    // 入れ子：X の中身が「X と同じ名前のフォルダ 1 つだけ」なら、中身を 1 つ上へ出して入れ子をなくす
    //   例：FC2-PPV-123/FC2-PPV-123/FC2-PPV-123.mp4 → FC2-PPV-123/FC2-PPV-123.mp4
    //   複数の作品が入ったフォルダ（オムニバスなど）は対象外
    const junkDel = (typeof junkEnabled === 'function' && junkEnabled()) ? (prepJunk(files, folders), (f) => { const j = junkInfo(f); return !!j && j.level === 'del'; }) : () => false;
    const dKids = sib(folders.filter((f) => !f.isRoot)), fKids = sib(files);
    folders.forEach((P) => {
      if (P.isRoot || P.parentId === 'root' || P.parentId === '') return;
      const cd = dKids.get(P.id) || [], cf = (fKids.get(P.id) || []).filter((f) => !junkDel(f));
      if (cd.length !== 1 || cf.length) return;
      const C = cd[0];
      if (baseName(C.name).toLowerCase() !== baseName(P.name).toLowerCase()) return;
      plan.push(item('flatten', 'folder', C, P.id, P.name, 'todo', '同じ名前のフォルダが入れ子になっているため、中身を 1 つ上の「' + P.name + '」へ出して、空になったフォルダを片付けます'));
    });
    // ファイル：同じ場所に元の名前が無ければ (n) を外す
    sib(files).forEach((list, pid) => {
      const taken = new Set(list.map((x) => x.name.toLowerCase()));
      list.map((x) => ({ x, m: x.name.match(PAREN_FILE) })).filter((o) => o.m)
        .sort((a, b) => (+a.m[2] - +b.m[2]) || a.x.name.localeCompare(b.x.name))
        .forEach(({ x, m }) => {
          const to = m[1] + m[3];
          if (taken.has(to.toLowerCase())) { plan.push(item('rename', 'file', x, pid, to, 'skip', '同じ場所に「' + to + '」が残っています（「重複を比べて削除」で整理してください）')); return; }
          taken.delete(x.name.toLowerCase()); taken.add(to.toLowerCase());
          plan.push(item('rename', 'file', x, pid, to, 'todo', ''));
        });
    });
    // 空フォルダの片付け → 入れ子の解消（深い階層から） → 名前の変更 の順に実行する
    const ORDER = { trash: 0, flatten: 1, rename: 2 };
    return plan.sort((a, b) => (ORDER[a.op] - ORDER[b.op]) || (a.op === 'flatten' ? (b.ptrail || []).length - (a.ptrail || []).length : 0));
  }
  // ---------- PikPak API を直接呼ぶ（画面操作なし・バックグラウンド処理） ----------
  // ログイン中のPikPak画面が保存している認証情報を、このブラウザ内でだけ使います（外部へは送りません）。
  const API = 'https://api-drive.mypikpak.com/drive/v1';
  // ログイン情報（PikPak画面が保存しているもの）。有効期限は約2時間で、PikPak画面が動いている間だけ更新される
  // ---- ログイン情報 ----
  // PikPak の画面が実際に送っている Authorization・x-captcha-token を横から覚えておく（PikPak は新しいログイン情報を
  // ブラウザの保存領域に書き戻さないことがあるため、保存領域の「有効期限」だけを見ると、何度読み込み直しても切れたままに見える）
  const cap = { auth: '', authAt: 0, captcha: '', captchaAt: 0 };
  let ownCall = false; // 自分の通信は覚えない
  const noteHeader = (k, v) => {
    if (ownCall) return;
    k = String(k || '').toLowerCase(); v = String(v || '');
    if (k === 'authorization' && /^Bearer\s+\S{20,}/i.test(v) && v !== cap.auth) { cap.auth = v; cap.authAt = Date.now(); }
    else if (k === 'x-captcha-token' && v.length > 20) { cap.captcha = v; cap.captchaAt = Date.now(); }
  };
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
  // アクセストークン（JWT）の中の有効期限
  const jwtExp = (tok) => { try { const p = String(tok).replace(/^Bearer\s+/i, '').split('.')[1]; const j = JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/'))); return j && j.exp ? j.exp * 1000 : 0; } catch (e) { return 0; } };
  function readCred() {
    const list = [];
    if (cap.auth) list.push({ auth: cap.auth, expiresAt: jwtExp(cap.auth), at: cap.authAt, from: 'page' });
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith('credentials')) continue;
      try {
        const v = JSON.parse(localStorage.getItem(k));
        if (v && v.access_token) { const auth = (v.token_type || 'Bearer') + ' ' + v.access_token; list.push({ auth, expiresAt: jwtExp(auth) || (v.expires_at ? Date.parse(v.expires_at) : 0), at: 0, from: 'storage' }); }
      } catch (e) { /* 次へ */ }
    }
    if (!list.length) return null;
    // 切れていないもの → 画面が最近使ったもの → 期限が先のもの の順に選ぶ
    const now = Date.now(), dead = (x) => (x.expiresAt && x.expiresAt <= now ? 1 : 0);
    list.sort((a, b) => dead(a) - dead(b) || b.at - a.at || (b.expiresAt || 0) - (a.expiresAt || 0));
    return list[0];
  }
  // PikPak画面はログイン情報を「期限が切れてから」更新するため、期限前に切れた扱いにすると再読み込みしても更新されない。
  // そのため余裕は30秒だけにして、期限ぎりぎりまで使う
  const SESSION_MARGIN = 30 * 1000;
  const sessionValid = () => { const c = readCred(); return !!c && (!c.expiresAt || c.expiresAt - Date.now() > SESSION_MARGIN); };
  const sessionError = (msg) => { const e = new Error(msg); e.session = true; return e; };
  function apiHeaders() {
    const c = readCred();
    if (!c) throw sessionError('ログイン情報を取得できません');
    // 期限が切れて見えても送ってみる（PikPak 側で更新済みのことがある。切れていれば 401 が返り、api() が新しいログイン情報を待って再試行する）
    const h = { 'Content-Type': 'application/json', Authorization: c.auth, 'x-device-id': localStorage.getItem('deviceid') || '' };
    if (cap.captcha) h['x-captcha-token'] = cap.captcha;
    return h;
  }
  // 通信はPikPakの画面と同じ方法（ページ上の fetch）で行う。
  // ※ Tampermonkey の GM_xmlhttpRequest 経由だと、PikPak側で「認証コードが無効です」と拒否されるため使わない
  const http = (url, opt) => { ownCall = true; try { return fetch(url, opt); } finally { ownCall = false; } };
  // 操作ごとの確認用トークン（captcha）。PikPak の画面が保存した meta（署名つき）を使って、その操作用のものをもらう。
  // クラウドダウンロードの追加などは、これがないと拒否される
  const capCache = new Map();
  async function getCaptcha(action, fresh) {
    const c = capCache.get(action);
    if (!fresh && c && c.until > Date.now()) return c.token;
    let key = '', rec = null;
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('captcha_')) { try { const v = JSON.parse(localStorage.getItem(k)); if (v && v.meta) { key = k; rec = v; break; } } catch (e) { /* 次へ */ } } }
    if (!rec) return cap.captcha || '';
    const dev = localStorage.getItem('deviceid') || '';
    const body = { client_id: key.slice('captcha_'.length), action, device_id: dev, meta: rec.meta };
    ownCall = true;
    let r; try { r = fetch('https://user.mypikpak.com/v1/shield/captcha/init', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-device-id': dev }, body: JSON.stringify(body) }); } finally { ownCall = false; }
    const res = await r; const d = await res.json().catch(() => ({}));
    if (!res.ok || !d.captcha_token) { log('warn', '確認用トークンを取得できませんでした：' + (d.error_description || d.error || res.status), action); return cap.captcha || ''; }
    capCache.set(action, { token: d.captcha_token, until: Date.now() + Math.max(30, (+d.expires_in || 300) - 30) * 1000 });
    return d.captcha_token;
  }
  async function api(path, opt = {}) {
    for (let tries = 0; ; tries++) {
      let res;
      try {
        const hd = apiHeaders();
        if (opt.captcha) { const ct = await getCaptcha(opt.captcha, tries > 0); if (ct) hd['x-captcha-token'] = ct; }
        const { captcha: _c, raw: _r, ...o2 } = opt;
        res = await http(/^https?:/.test(path) ? path : API + path, { ...o2, headers: hd });
      }
      catch (e) {
        if (e.session) throw e;
        if (tries < 2) { await sleep(1500); continue; }
        log('warn', e.message + '（ログイン切れとして再読み込みで回復します）', (opt.method || 'GET') + ' ' + path.split('?')[0]);
        // 長時間放置後は通信自体が失敗することがあるため、ログイン切れとして扱い再読み込みで回復させる
        throw sessionError(e.message === 'Failed to fetch' ? 'PikPakのサーバーに接続できませんでした' : e.message);
      }
      if ((res.status === 429 || res.status >= 500) && tries < 5) { await sleep(1500 * (tries + 1)); continue; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok && opt.captcha && /captcha/i.test(String(data.error || '')) && tries < 2) continue; // 確認用トークンを取り直してやり直す
      if (!res.ok) {
        const msg = data.error_description || data.error || 'API ' + res.status;
        const where = (opt.method || 'GET') + ' ' + path.split('?')[0] + ' → HTTP ' + res.status;
        // ログイン切れ・認証コードの期限切れは、画面の再読み込みで自動回復するため warn として記録する
        if ((res.status === 401 || /unauthenticated|token/i.test(String(data.error || ''))) && tries < 3) {
          // PikPak の画面が新しいログイン情報で通信するまで少し待って、やり直す
          const used = (readCred() || {}).auth, t0 = Date.now();
          while (Date.now() - t0 < 8000 && (readCred() || {}).auth === used) await sleep(500);
          if ((readCred() || {}).auth !== used) { tries = Math.max(tries, 2); continue; }
        }
        if (opt.raw && res.status !== 401 && !/captcha/i.test(String(data.error || ''))) return { ok: false, status: res.status, data };
        if (res.status === 401 || /unauthenticated|token/i.test(String(data.error || ''))) { log('warn', msg + '（自動で回復します）', where); throw sessionError('ログインの有効期限が切れています'); }
        if (/captcha/i.test(String(data.error || '')) || /認証コード/.test(msg)) { log('warn', msg + '（自動で回復します）', where); throw sessionError('認証の確認が必要です（' + msg + '）'); }
        log('error', msg, where);
        throw new Error(msg);
      }
      return opt.raw ? { ok: true, status: res.status, data } : data;
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
              if (f.kind === 'drive#folder' && f.name === SYNC_DIR && !cur.path) return; // 同期用のフォルダは整理の対象にしない
              if (f.kind === 'drive#folder') {
                const fo = { id: f.id, name: f.name, parentId: cur.id, path: cur.path + '/' + f.name, trail: [...cur.trail, f.id] };
                outFolders.push(fo); queue.push({ id: f.id, path: fo.path, trail: fo.trail });
              } else outFiles.push({ id: f.id, name: f.name, size: +f.size || 0, thumb: f.thumbnail_link || '', ct: f.created_time || '', parentId: cur.id, path: cur.path || '/' });
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
    outFolders.unshift({ id: rootId, name: rootName, parentId: startTrail.length > 1 ? startTrail[startTrail.length - 2] : '', path: '', trail: startTrail, trailNames: crumbs().map((c) => c.name), isRoot: true });
    return { files: outFiles, folders: outFolders };
  }
  const apiGet = (id) => api('/files/' + id);
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
    refreshQuota(true);
    return done;
  }

  // ---------- 画面 ----------
  const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="ppdup-lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22c3a6"/><stop offset=".5" stop-color="#2f6bff"/><stop offset="1" stop-color="#7b5cff"/></linearGradient></defs><rect width="64" height="64" rx="18" fill="#14161c"/><rect x="9" y="14" width="13" height="16" rx="3" fill="none" stroke="url(#ppdup-lg)" stroke-opacity=".5" stroke-width="3"/><rect x="9" y="34" width="13" height="16" rx="3" fill="none" stroke="url(#ppdup-lg)" stroke-opacity=".5" stroke-width="3"/><path d="M22 22h6l5 10M22 42h6l5-10" fill="none" stroke="url(#ppdup-lg)" stroke-opacity=".7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 18h7a14 14 0 0 1 0 28h-7z" fill="none" stroke="url(#ppdup-lg)" stroke-width="5.5" stroke-linejoin="round"/><circle cx="51" cy="45" r="6" fill="#ffb020" stroke="#14161c" stroke-width="2"/><path d="M48.3 45l1.9 1.9 3.1-3.4" stroke="#14161c" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const LS_META = 'ppdup:scanmeta:v1';
  const css = `
  #ppdup-btn{position:fixed;right:20px;bottom:76px;z-index:99998;display:flex;align-items:center;gap:8px;padding:6px 16px 6px 6px;border:1px solid #3a3f4b;border-radius:999px;background:#14161c;color:#fff;font:700 13px system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 14px #0005}
  #ppdup-btn svg{width:30px;height:30px;border-radius:9px}
  #ppdup-btn:hover{filter:brightness(1.08)}
  #ppdup-fab{position:fixed;right:20px;bottom:128px;z-index:99998;width:320px;box-sizing:border-box;background:#1d2027;color:#e6e8ee;border:1px solid #2c303a;border-radius:14px;box-shadow:0 12px 40px #0008;padding:8px;font:13px/1.4 system-ui,"Hiragino Sans","Yu Gothic",sans-serif;display:none}
  #ppdup-fab.on{display:block;animation:pdfab .12s ease-out}
  @keyframes pdfab{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  #ppdup-fab .hd{font-size:11px;color:#8b91a1;padding:6px 10px 4px}
  #ppdup-fab button{display:flex;align-items:center;gap:10px;width:100%;border:0;background:none;color:inherit;font:inherit;padding:9px 10px;border-radius:9px;cursor:pointer;text-align:left}
  #ppdup-fab button:hover:not(:disabled){background:#2a2f3a}
  #ppdup-fab button:disabled{opacity:.45;cursor:not-allowed}
  #ppdup-fab button.flow{background:#306fff;color:#fff;font-weight:700;margin-bottom:4px}
  #ppdup-fab button.flow:hover{background:#3d7bff}
  #ppdup-fab .n{width:22px;height:22px;border-radius:50%;background:#2a2f3a;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex:none}
  #ppdup-fab .t{flex:1}
  #ppdup-fab .b{font-size:11px;color:#8b91a1}
  #ppdup-fab .b.todo{color:#8fb0ff;font-weight:700}
  #ppdup-fab .b.ok{color:#3fb96f}
  #ppdup-fab hr{border:0;border-top:1px solid #2c303a;margin:6px 4px}
  #ppdup-fab button.it{gap:14px;padding:12px;border-radius:12px}
  #ppdup-fab button.it.pri{background:#306fff;color:#fff}
  #ppdup-fab button.it.pri:hover{background:#3d7bff}
  #ppdup-fab .ic{width:42px;height:42px;flex:none;border-radius:11px;background:#22325c;color:#8fb0ff;display:flex;align-items:center;justify-content:center}
  #ppdup-fab .it.pri .ic{background:#ffffff2e;color:#fff}
  #ppdup-fab .ic svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
  #ppdup-fab .it b{display:block;font-size:14px}
  #ppdup-fab .it small{display:block;font-size:12px;opacity:.75;margin-top:2px;font-weight:400}
  #ppdup-fab .err{display:flex;align-items:center;gap:8px;margin:6px 4px 2px;padding:7px 10px;border-radius:8px;background:#3a2226;color:#ff9a9a;font-size:12px}
  #ppdup-fab .err span{flex:1}
  #ppdup-fab .err button{width:auto;padding:0;background:none;color:#ffb4b4;font-weight:700}
  #ppdup-fab .err button:hover{background:none;text-decoration:underline}
  #ppdup.single nav,#ppdup.treev nav{display:none}
  #ppdup,#pd-set,#pd-add,#pd-unzip,#pd-lib{--bg:#f5f6f8;--panel:#fff;--panel2:#eef0f4;--line:#dde0e6;--fg:#1c1f26;--mute:#6a7080;--pri:#306fff;--pri-soft:#306fff1f;--ok:#1f9d55;--danger:#d64545;--keep:#f0faf2;--del:#fff5f5;--ctl:#fff;--ctl-line:#c5c9d2}
  #ppdup{position:fixed;inset:0;z-index:99999;background:var(--bg);color:var(--fg);font:13px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Yu Gothic","Meiryo","Noto Sans CJK JP","Noto Sans JP",sans-serif;display:none;flex-direction:column}
  html.pd-dark #ppdup,html.pd-dark #pd-set,html.pd-dark #pd-add,html.pd-dark #pd-unzip,html.pd-dark #pd-lib{--bg:#15171c;--panel:#1d2027;--panel2:#252932;--line:#2c303a;--fg:#e6e8ee;--mute:#8b91a1;--pri-soft:#306fff33;--keep:#17261c;--del:#2a1a1a;--ctl:#252932;--ctl-line:#3a3f4b}
  #ppdup.on{display:flex}
  #ppdup:not(.pop) .wbtn-full,#ppdup:not(.pop) .wbtn-min{display:none !important}
  #ppdup.pop .wbtn-full,#ppdup.pop .wbtn-min{display:inline-flex}
  #ppdup.pop{inset:auto;box-sizing:border-box;border:1px solid var(--line);border-radius:14px;box-shadow:0 18px 60px #0006,0 2px 8px #0003;overflow:hidden;resize:both;min-width:560px;min-height:380px;max-width:100vw;max-height:100vh;padding-left:58px}
  #ppdup.pop .rail{width:58px;padding-top:10px}
  #ppdup.pop .rail button{width:46px;padding:9px 0}
  #ppdup.pop .rail button span{display:none}
  #ppdup.pop header{padding:8px 12px 0}
  #ppdup.pop .brand{cursor:move;user-select:none;gap:8px;padding-bottom:8px}
  #ppdup.pop .brand :is(button,input,select,label,a){cursor:pointer}
  #ppdup.pop .brand input{cursor:text}
  #ppdup.pop .brand > svg{width:30px;height:30px}
  #ppdup.pop .wm small{display:none}
  #ppdup.pop .wm .gw{font-size:19px}
  #ppdup.pop{container-type:inline-size}
  #ppdup.pop .brand{flex-wrap:nowrap}
  #ppdup.pop .brand > *{flex-shrink:0}
  #ppdup.pop .pd-quota{flex:0 1 210px;width:210px;min-width:120px;overflow:hidden}
  #ppdup.pop .pd-quota .qt i{overflow:hidden;text-overflow:ellipsis}
  #ppdup.pop .pd-quota .ql{display:none}
  #ppdup.pop .hbtn{padding:0 10px}
  #ppdup.pop [data-a=lang] > span,#ppdup.pop [data-a=settings] > span,#ppdup.pop .brand [data-a=addlink] > span{display:none}
  #ppdup.pop .hq input{width:110px}
  @container (max-width:880px){#ppdup .wbtn-full > span,#ppdup .brand .ver,#ppdup .pd-quota{display:none}}
  @container (max-width:700px){#ppdup .wm{display:none}}
  #ppdup.pop .tl-top{position:absolute;right:20px;bottom:44px}
  #ppdup.dragging{user-select:none;opacity:.92}
  #ppdup .pd-popban{display:none}
  #ppdup.pop.ban .pd-popban{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px 14px;background:var(--pri-soft);border-bottom:1px solid var(--line);font-size:12.5px}
  #ppdup .pd-popban span{flex:1 1 260px;min-width:0}
  #ppdup .pd-popban button{height:28px;padding:0 12px;border-radius:7px;border:1px solid var(--ctl-line);background:var(--ctl);color:inherit;font:inherit;cursor:pointer}
  #ppdup .pd-popban button.pri{background:var(--pri);border-color:var(--pri);color:#fff;font-weight:700}
  #ppdup{padding-left:78px}
  #ppdup .rail{position:absolute;left:0;top:0;bottom:0;width:78px;display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 0 10px;background:var(--panel2);border-right:1px solid var(--line);z-index:2}
  #ppdup .rail button{position:relative;width:64px;line-height:1.2;text-align:center;word-break:keep-all;display:flex;flex-direction:column;align-items:center;gap:3px;padding:9px 0 7px;border:0;border-radius:10px;background:none;color:var(--mute);font-size:11px;font-weight:600}
  #ppdup .rail button:hover:not(:disabled){background:var(--panel);color:var(--fg)}
  #ppdup .rail button.on{background:var(--pri-soft);color:var(--pri)}
  #ppdup .rail svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
  #ppdup .rail .sp{flex:1}
  #ppdup [data-r=logbadge]:empty{display:none}
  #ppdup [data-r=logbadge]{position:absolute;top:-6px;right:-6px;min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:var(--danger);color:#fff;font:700 10px/16px system-ui,sans-serif;font-style:normal}
  #ppdup header{padding:10px 18px 0;background:var(--panel);border-bottom:1px solid var(--line)}
  #ppdup .brand{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding-bottom:10px}
  #ppdup .brand > svg{width:40px;height:40px;flex:none}
  #ppdup .brand h1{margin:0;font:800 19px/1.1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Yu Gothic","Meiryo","Noto Sans CJK JP","Noto Sans JP",sans-serif}
  #ppdup .brand h1.wm{display:flex;flex-direction:column;gap:2px;font:inherit;line-height:1}
  #ppdup .wm small{font:700 10px/1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.18em;color:var(--mute)}
  #ppdup .wm .gw{position:relative;display:inline-block;font:800 24px/1.05 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:-.02em}
  #ppdup .wm .gw i{position:absolute;left:3px;top:-2px;font-style:normal;color:#7b5cff;opacity:.3}
  #ppdup .wm .gw i + i{left:6px;top:-4px;opacity:.15}
  #ppdup .wm .gw b{position:relative;font-weight:800;background:linear-gradient(90deg,#13a88d,#2f6bff,#7b5cff);-webkit-background-clip:text;background-clip:text;color:transparent}
  html.pd-dark #ppdup .wm .gw b{background-image:linear-gradient(90deg,#4fe0c4,#7fa8ff,#a891ff)}
  html.pd-dark #ppdup .wm .gw i{color:#a891ff}
  #ppdup .brand .chip{font:700 12px system-ui,sans-serif;padding:3px 10px;border-radius:999px;background:var(--pri-soft);color:var(--pri)}
  #ppdup .brand .ver{font:700 12px ui-monospace,Menlo,monospace;color:var(--mute);border:1px solid var(--line);border-radius:6px;padding:1px 7px;align-self:center}
  /* ヘッダー右上：容量・テーマ・言語・設定・閉じる */
  #ppdup .hbtn{position:relative;display:inline-flex;align-items:center;gap:6px;height:36px;box-sizing:border-box;padding:0 12px;border-radius:9px;font-weight:700}
  #ppdup .hbtn svg,#ppdup .thm svg,#ppdup .hx svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;flex:none}
  #ppdup .hx{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;padding:0;border:0;background:none;color:var(--mute);border-radius:9px}
  #ppdup .hx:hover{background:var(--panel2);color:var(--fg)}
  #ppdup .thm{display:inline-flex;height:36px}
  #ppdup .thm button{display:inline-flex;align-items:center;justify-content:center;min-width:38px;height:36px;box-sizing:border-box;padding:0 10px;font-size:12px;font-weight:700}
  #ppdup .hq{display:none;align-items:center;gap:6px;height:36px;box-sizing:border-box;padding:0 10px;border:1px solid var(--ctl-line);border-radius:9px;background:var(--ctl);color:var(--mute)}
  #ppdup.treev .hq{display:inline-flex}
  #ppdup .hqs{display:none}
  #ppdup.treev .hqs{display:inline-flex}
  #ppdup .hqs button{height:36px;padding:0 10px;font-size:12px}
  #ppdup .hqs button.on{background:var(--pri) !important;color:#fff !important;border-color:var(--pri) !important}
  #ppdup.pop .hqs{display:none}
  .sr{display:flex;flex-direction:column}
  .sr-row{display:flex;align-items:center;gap:12px;padding:7px 18px;border-bottom:1px solid var(--line);cursor:pointer}
  .sr-row:hover{background:var(--pri-soft)}
  .sr-th{width:64px;height:36px;flex:none;border-radius:5px;overflow:hidden;background:var(--panel2);display:flex;align-items:center;justify-content:center}
  .sr-th img{width:100%;height:100%;object-fit:cover}
  .sr-th svg{width:22px;height:22px}
  .sr-t{flex:1;min-width:0;display:flex;flex-direction:column}
  .sr-n{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .sr-p{color:var(--mute);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .sr mark{background:#ffe08a;color:#1c1f26;border-radius:2px;padding:0 1px}
  .sr-s{color:var(--mute);font-size:12px;white-space:nowrap}
  #ppdup .hq svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
  #ppdup .hq input{border:0 !important;background:none !important;padding:0 !important;outline:none;width:180px;color:var(--fg)}
  .pd-quota{display:flex;flex-direction:column;gap:4px;width:310px;padding:5px 12px;border:1px solid var(--line);border-radius:9px;background:var(--panel2);box-sizing:border-box;cursor:default}
  .pd-quota:empty{display:none}
  .pd-quota .qt{display:flex;align-items:baseline;gap:6px;font-size:12px;white-space:nowrap}
  .pd-quota .qt i{font-style:normal;color:var(--mute)}
  .pd-quota .qt .sp{flex:1}
  .pd-quota .qb{display:flex;height:6px;border-radius:99px;overflow:hidden;background:var(--line)}
  .pd-quota .qb span{display:block;height:100%}
  .pd-quota .ql{display:flex;gap:10px;font-size:11px;color:var(--mute);white-space:nowrap;overflow:hidden}
  .pd-quota .ql b{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:4px;vertical-align:0}
  .q-cur{background:#1d4fd6}.q-oth{background:#8fb0ff}.q-tr{background:#f2a33a}
  html.pd-dark .q-cur{background:#5b8cff}html.pd-dark .q-oth{background:#3a4b78}
  @media (max-width:1600px){#ppdup.treev header .hbtn[data-a=lang] span,#ppdup.treev header .hbtn[data-a=addlink] span{display:none}#ppdup.treev .pd-quota .ql{display:none}#ppdup.treev .pd-quota{width:210px}}
  @media (max-width:1280px){.pd-quota .ql{display:none}.pd-quota{width:210px}#ppdup .hq input{width:110px}}
  @media (max-width:1200px){#ppdup .brand .chip{display:none}#ppdup [data-r=langname]{display:none}#ppdup .brand{gap:8px}}
  #ppdup .sp{flex:1}
  #ppdup button,#ppdup select,#ppdup input[type=text]{font:inherit;padding:6px 12px;border:1px solid var(--ctl-line);border-radius:8px;background:var(--ctl);color:inherit;cursor:pointer}
  #ppdup button:disabled{opacity:.45;cursor:not-allowed}
  #ppdup button.pri{background:var(--pri);color:#fff;border-color:var(--pri);font-weight:700}
  #ppdup button.danger{background:var(--danger);color:#fff;border-color:var(--danger);font-weight:700}
  #ppdup button.big{padding:12px 26px;font-size:15px;border-radius:10px}
  #ppdup .note{color:var(--mute);font-size:12px}
  /* ステップ */
  #ppdup nav{display:flex;gap:0;margin-top:12px;overflow-x:auto}
  #ppdup nav .st{flex:1 1 auto;min-width:0;display:flex;align-items:center;gap:7px;padding:10px 14px 12px 6px;border:0;border-bottom:3px solid transparent;border-radius:0;background:none;text-align:left;position:relative}
  #ppdup nav .st:not(:last-child)::after{content:'›';position:absolute;right:2px;top:50%;transform:translateY(-50%);color:var(--mute);font-size:18px}
  #ppdup nav .st .n{width:24px;height:24px;font-size:12px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;background:var(--panel2);color:var(--mute);flex:none}
  #ppdup nav .st .t{font-weight:700;font-size:12.5px;display:block;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #ppdup nav .st > span:last-child{min-width:0}
  #ppdup nav .st .c{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
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
  #ppdup .okbadge{color:var(--ok);font-weight:800;padding:0 6px}
  #ppdup .optsw{display:flex;align-items:center;gap:6px;font-weight:700;cursor:pointer}
  #ppdup .optsw input{width:18px;height:18px;accent-color:var(--pri)}
  .pd-explain{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin-bottom:12px}
  .pd-explain h3{margin:0 0 6px;font-size:14px}
  .pd-explain ul{margin:6px 0 0;padding-left:18px}
  .pd-explain code{background:var(--panel2);padding:1px 6px;border-radius:5px}
  /* 進捗 */
  #ppdup .prog{padding:7px 18px;font-size:12px;color:var(--mute);background:var(--panel2);border-top:1px solid var(--line);display:flex;flex-direction:column;gap:6px}
  #ppdup .prog .pr1,#ppdup .prog .pr2{display:flex;align-items:center;gap:12px;min-width:0}
  #ppdup .prog .pr2{display:none}
  #ppdup .prog.busy .pr2{display:flex}
  #ppdup .prog [data-r=status]{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #ppdup .prog .pb{flex:1 1 auto !important}
  #ppdup .prog .ps{white-space:nowrap;color:var(--fg);opacity:.8}
  #ppdup .prog .pstop{height:24px !important;padding:0 10px !important;font-size:12px !important}
  #ppdup .prog [data-r=status]{flex:1;min-width:0}
  #ppdup .prog [data-r=pright]{white-space:nowrap}
  #ppdup .prog .pb{flex:0 0 220px;height:6px;border-radius:3px;background:var(--line);overflow:hidden;display:none}
  #ppdup .prog .pb i{display:block;height:100%;width:0;background:var(--pri);transition:width .2s}
  #ppdup .prog.busy .pb{display:block}
  #ppdup .prog .pp{white-space:nowrap;font:700 12px ui-monospace,Menlo,Consolas,monospace;color:var(--fg);min-width:0}
  #ppdup .prog .pp:empty{display:none}
  #ppdup main{flex:1;overflow:auto;padding:14px 18px}
  #ppdup .empty{padding:40px;text-align:center;color:var(--mute)}
  /* スキャン画面 */
  .pd-hero{max-width:760px;margin:24px auto;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:28px;text-align:center}
  .pd-hero h2{margin:0 0 8px;font-size:20px}
  .pd-hero .where{display:inline-block;margin:10px 0 18px;padding:6px 14px;border-radius:999px;background:var(--panel2);font-weight:700}
  .pd-hero .acts{display:flex;gap:10px;justify-content:center}
  .sv{max-width:1080px;margin:8px auto 24px;display:flex;flex-direction:column;gap:14px}
  .sv-hero{display:grid;grid-template-columns:auto 1fr auto;gap:20px;align-items:center;padding:24px 26px;border-radius:16px;background:linear-gradient(135deg,var(--panel) 0%,var(--panel) 55%,var(--pri-soft) 100%);border:1px solid var(--line);box-shadow:0 1px 2px #0000000d}
  .sv-hero.ok{background:linear-gradient(135deg,var(--panel) 0%,var(--panel) 55%,#1f9d5524 100%);border-color:#1f9d5566}
  .sv-badge{width:56px;height:56px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:#fff;background:linear-gradient(135deg,#4b8df8,#306fff);box-shadow:0 6px 16px #306fff55}
  .sv-hero.ok .sv-badge{background:linear-gradient(135deg,#34c472,#1f9d55);box-shadow:0 6px 16px #1f9d5555}
  .sv-main h2{margin:0;font-size:20px;letter-spacing:.01em}
  .sv-main p{margin:6px 0 10px;color:var(--mute);font-size:13px}
  .sv-chips{display:flex;flex-wrap:wrap;gap:6px}
  .chip-i{display:inline-flex;gap:6px;align-items:center;padding:3px 10px;border-radius:999px;background:var(--panel2);font-size:12px;font-weight:600}
  .chip-i i{font-style:normal;color:var(--mute);font-weight:500}
  .sv-act{display:flex;flex-direction:column;gap:8px;align-items:stretch;min-width:220px}
  #ppdup .sv-act button.ghost{background:transparent;border-color:var(--pri);color:var(--pri);font-size:13px;padding:9px 14px}
  .sv-opt{display:flex;gap:12px;align-items:center;padding:12px 16px;border-radius:12px;background:var(--panel);border:1px solid var(--line);cursor:pointer}
  .sv-opt b{display:block;font-size:13px}
  .sv-opt small{color:var(--mute);font-size:12px}
  .sw{position:relative;width:40px;height:24px;flex:none}
  .sw input{position:absolute;opacity:0;width:100%;height:100%;margin:0;cursor:pointer}
  .sw i{position:absolute;inset:0;border-radius:999px;background:var(--ctl-line);transition:background .15s}
  .sw i::after{content:'';position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #0004;transition:transform .15s}
  .sw input:checked + i{background:var(--pri)}
  .sw input:checked + i::after{transform:translateX(16px)}
  .sv-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
  #ppdup .sc{display:grid;grid-template-rows:auto 1fr auto;gap:6px;min-height:118px;padding:12px 14px;border-radius:14px;border:1px solid var(--line);background:var(--panel);text-align:left;transition:transform .12s,box-shadow .12s,border-color .12s}
  #ppdup .sc:hover{transform:translateY(-2px);box-shadow:0 8px 20px #0000001a;border-color:var(--pri)}
  .sc-h{display:flex;gap:8px;align-items:center;min-width:0}
  .sc-n{width:22px;height:22px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;background:var(--panel2);color:var(--mute)}
  .sc-t{font-size:12px;font-weight:700;line-height:1.3;color:var(--fg);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .sc-v{display:flex;align-items:baseline;gap:4px;align-self:end}
  .sc-v b{font-size:28px;line-height:1;font-weight:800;letter-spacing:-.02em}
  .sc-v small{font-size:12px;color:var(--mute);font-weight:600}
  .sc-s{font-size:11px;color:var(--mute);min-height:14px}
  .sc.zero .sc-v b{color:var(--ok)} .sc.zero .sc-n{background:#1f9d5522;color:var(--ok)}
  .sc.todo .sc-v b{color:var(--pri)} .sc.todo .sc-n{background:var(--pri);color:#fff}
  .sc.warn .sc-v b{color:#c27a00} .sc.warn .sc-s{color:#c27a00;font-weight:700}
  .sc.off .sc-v b{color:var(--mute);font-size:20px}
  #ppdup .sc.next{border-color:var(--pri);box-shadow:0 0 0 3px var(--pri-soft)}
  .sc.next .sc-s{color:var(--pri);font-weight:700}
  @media (max-width:760px){.sv-hero{grid-template-columns:1fr}.sv-badge{display:none}}
  .pd-next{display:flex;justify-content:flex-end;margin:16px 0 4px}
  .sl-guide{margin:0 0 12px;padding:14px 16px;background:var(--panel);border:1.5px solid var(--pri);border-radius:12px;box-shadow:0 4px 16px #306fff1f;display:flex;flex-direction:column;gap:12px}
  .sl-guide .fl{display:flex;align-items:center;gap:0}
  .sl-guide .st{display:flex;align-items:center;gap:8px;flex:0 1 auto;min-width:0}
  .sl-guide .st .n{width:26px;height:26px;flex:none;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:800;color:#fff;background:#c5c9d2}
  .sl-guide .st.done .n{background:var(--ok)}
  .sl-guide .st.now .n{background:var(--pri);box-shadow:0 0 0 4px var(--pri-soft)}
  .sl-guide .st .t{display:flex;flex-direction:column;min-width:0}
  .sl-guide .st .t b{font-size:13px;white-space:nowrap}
  .sl-guide .st:not(.done):not(.now) .t b{color:var(--mute)}
  .sl-guide .st .t small{font-size:11px;color:var(--mute);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .sl-guide .ln{flex:1 1 24px;height:2px;margin:0 12px;background:var(--line);min-width:16px}
  .sl-guide .msg{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:12px 14px;background:var(--pri-soft);border-radius:9px}
  .sl-guide .msg .tx{flex:1 1 360px;min-width:0;display:flex;flex-direction:column;gap:2px}
  .sl-guide .msg .tx b{font-size:14px}
  .sl-guide .msg .tx small{font-size:12px;color:var(--mute)}
  .sl-guide .msg button{height:36px;padding:0 16px}
  .sl-guide .msg button.pri{font-size:13.5px}
  .sl-prog{display:flex;flex-direction:column;gap:6px;margin-top:8px}
  .sl-prog .bar{height:10px;border-radius:5px;background:var(--line);overflow:hidden;display:flex}
  .sl-prog .bar i{display:block;height:100%;transition:width .3s}
  .sl-prog .bar .ok{background:var(--ok)}
  .sl-prog .bar .ng{background:#8b91a1}
  .sl-prog .nums{display:flex;flex-wrap:wrap;gap:14px;font-size:12px;color:var(--mute)}
  .sl-prog .nums b{color:var(--fg);font-family:ui-monospace,Menlo,monospace}
  .sl-tabs{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}
  .sl-tabs button{display:inline-flex;align-items:center;gap:8px;height:34px;padding:0 14px;border-radius:99px !important;font-weight:600}
  .sl-tabs button i{width:8px;height:8px;border-radius:2px}
  .sl-tabs button b{font-size:14px}
  .sl-tabs button.on{background:var(--fg) !important;color:var(--bg) !important;border-color:var(--fg) !important}
  .sl-tabs button:disabled{opacity:.45}
  .sl-why{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:3px}
  .sl-b{font-size:11px;padding:1px 8px;border-radius:99px;font-weight:700;background:var(--panel2);color:var(--mute)}
  .sl-b:empty{display:none}
  .sl-b.auto{background:#e3f6ec;color:#17703f}
  .sl-b.ok{background:var(--pri-soft);color:var(--pri)}
  .sl-b.man{background:#efe9ff;color:#5b3fd6}
  .sl-b.warn{background:#fff3dc;color:#8a5600}
  html.pd-dark .sl-b.auto{background:#17331f;color:#6fdc9a}
  html.pd-dark .sl-b.man{background:#2a2346;color:#b9a6ff}
  html.pd-dark .sl-b.warn{background:#3a2c12;color:#f0c46c}
  .sl-in{display:flex;flex-wrap:wrap;gap:6px;align-items:center;flex:0 1 auto}
  .sl-in input{height:32px;box-sizing:border-box;padding:0 10px;border:1px solid var(--ctl-line);border-radius:7px;background:var(--ctl);color:inherit;font:inherit}
  .sl-in input[data-sname]{width:180px}
  .sl-in input[data-ssid]{width:96px}
  .sl-in .err{flex-basis:100%;color:var(--danger);font-size:12px}
  .sl-in .err:empty{display:none}
  .pd-g.unk .pd-row{background:var(--panel)}
  .sl-bar{position:sticky;bottom:0;z-index:3;display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin:14px 0 0;padding:10px 14px;background:#1c1f26;color:#fff;border-radius:12px;box-shadow:0 10px 30px #0004}
  html.pd-dark .sl-bar{background:#2b3040}
  .sl-bar:empty{display:none}
  .sl-bar .n{min-width:22px;height:22px;padding:0 4px;box-sizing:border-box;border-radius:11px;background:var(--pri);display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:12px}
  .sl-bar .tx{flex:1 1 280px;min-width:0;display:flex;flex-direction:column}
  .sl-bar .tx small{color:#b6bbc7;font-size:12px}
  .sl-bar button.sec{background:#ffffff1a !important;color:#fff !important;border-color:#5a6070 !important;font-weight:700}
  .sl-bar button:not(.pri):not(.sec){background:transparent !important;color:#fff !important;border-color:#5a6070 !important}
  #pd-ext{position:fixed;z-index:100004;width:400px;max-width:calc(100vw - 16px);box-sizing:border-box;padding:12px 14px 14px;background:#1d2027;color:#e6e8ee;border-radius:14px;box-shadow:0 18px 50px #0006;font:13px/1.5 system-ui,-apple-system,"Segoe UI","Hiragino Sans","Yu Gothic UI","Meiryo",sans-serif}
  #pd-ext .hd{display:flex;align-items:center;gap:8px;margin-bottom:6px}
  #pd-ext .hd b{flex:1}
  #pd-ext .hd button{width:28px;height:28px;border:0;border-radius:7px;background:none;color:#8b91a1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
  #pd-ext .hd svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
  #pd-ext .kw{font:500 12px ui-monospace,Menlo,monospace;color:#8b91a1;margin:6px 0}
  #pd-ext .gr{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
  #pd-ext .gr a{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;height:50px;border:1px solid #3a3f4b;border-radius:10px;background:#252932;color:#e6e8ee;text-decoration:none}
  #pd-ext .gr a:hover{border-color:#7fa8ff;color:#7fa8ff}
  #pd-ext .gr b{font-size:12.5px}
  #pd-ext .gr small{font-size:10px;color:#8b91a1}
  #pd-ext .ft{margin-top:10px;font-size:11px;color:#8b91a1}
  .sl-chips{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:12px}
  #ppdup .pd-rotate{position:absolute;inset:0;z-index:20;background:#0b0d12ee;display:flex;align-items:center;justify-content:center;padding:24px}
  #ppdup .pd-rotate .box{max-width:320px;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:20px;text-align:center;display:flex;flex-direction:column;gap:10px}
  #ppdup .pd-rotate .ic{font-size:40px;line-height:1}
  #ppdup .pd-rotate b{font-size:16px}
  #ppdup .pd-rotate small{color:var(--mute);line-height:1.6}
  #ppdup .pd-rotate button{height:40px;border-radius:9px}
  @media (max-height:520px){
    #ppdup.phone{padding-left:52px}
    #ppdup.phone .rail{width:52px;padding-top:6px}
    #ppdup.phone .rail button{width:42px;padding:7px 0}
    #ppdup.phone .rail button span{display:none}
    #ppdup.phone header{padding:4px 10px 0}
    #ppdup.phone .brand{flex-wrap:nowrap;gap:6px;padding-bottom:4px}
    #ppdup.phone .brand > *{flex-shrink:0}
    #ppdup.phone .brand > svg{width:26px;height:26px}
    #ppdup.phone .wm small,#ppdup.phone .brand .ver,#ppdup.phone .pd-quota,#ppdup.phone .hq,#ppdup.phone .hqs{display:none !important}
    #ppdup.phone .wm .gw{font-size:17px}
    #ppdup.phone .hbtn{height:30px;padding:0 8px}
    #ppdup.phone .hbtn > span{display:none}
    #ppdup.phone .thm{display:none}
    #ppdup.phone .tb{padding:6px 10px}
    #ppdup.phone .tb .head .note{display:none}
    #ppdup.phone .prog{padding:4px 10px}
  }
  .sv-intro{margin:10px 0 0;padding:12px 14px 12px 30px;border-radius:10px;background:var(--panel2);line-height:1.9;color:var(--mute)}
  .sv-intro b{color:var(--fg)}
  .sv-ask{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--mute);margin-top:4px}
  .sv-stale{margin:8px 0;padding:8px 12px;border-radius:8px;background:#fff3dc;color:#8a5600;font-size:12.5px}
  html.pd-dark .sv-stale{background:#3a2c12;color:#f0c46c}
  .pd-sk{position:relative;height:16px;padding:5px 12px;background:#000;cursor:pointer}
  .pd-sk > .sktr{position:relative;height:6px;border-radius:3px;background:#3a3f4b;overflow:hidden}
  .pd-sk:hover > .tr{height:8px;margin-top:-1px}
  .pd-sk > .sktr i{position:absolute;left:0;top:0;bottom:0;width:0}
  .pd-sk .skb{background:#5a6070}
  .pd-sk .skp{background:#306fff}
  .pd-sk .tip{position:absolute;bottom:24px;width:210px;padding:4px;box-sizing:border-box;background:#000;border:2px solid #fff;border-radius:8px;box-shadow:0 6px 18px #000a;pointer-events:none;z-index:5;text-align:center}
  .pd-sk .tip[hidden]{display:none}
  .pd-sk .tip canvas{display:block;width:100%;height:auto;border-radius:4px}
  .pd-sk .tip b{display:block;font:600 11px ui-monospace,Menlo,monospace;color:#fff;padding-top:2px}
  #pd-ql .ql-acts select,#pd-player .pl-h select[data-rate]{min-width:64px}
  #pd-frames{position:fixed;inset:0;z-index:100007;background:#0009;display:flex;align-items:center;justify-content:center;font:13px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Meiryo",sans-serif;color:#e6e8ee}
  #pd-frames .fr-box{width:min(1400px,96vw);max-height:94vh;display:flex;flex-direction:column;background:#1d2027;border-radius:14px;box-shadow:0 18px 50px #000a;overflow:hidden}
  #pd-frames .fr-hd{display:flex;align-items:center;gap:10px;padding:12px 18px;border-bottom:1px solid #2c303a}
  #pd-frames .fr-hd b{font-size:16px}
  #pd-frames .sp{flex:1}
  #pd-frames .note{color:#8b91a1;font-size:12px}
  #pd-frames button{height:32px;padding:0 12px;border:1px solid #3a3f4b;border-radius:8px;background:#252932;color:#e6e8ee;font:inherit;cursor:pointer}
  #pd-frames button:disabled{opacity:.45;cursor:default}
  #pd-frames .seg{display:inline-flex}
  #pd-frames .seg button{border-radius:0;margin-left:-1px}
  #pd-frames .seg button:first-child{border-radius:8px 0 0 8px}
  #pd-frames .seg button:last-child{border-radius:0 8px 8px 0}
  #pd-frames .seg button.on{background:#306fff;border-color:#306fff;color:#fff;font-weight:700}
  #pd-frames button.x{width:32px;padding:0;border:0;background:none;display:inline-flex;align-items:center;justify-content:center;color:#8b91a1}
  #pd-frames button.x svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
  #pd-frames .fr-cols{display:grid;overflow:auto;flex:1 1 auto}
  #pd-frames .fr-col{padding:12px 14px;border-right:1px solid #2c303a;min-width:0}
  #pd-frames .fr-col:last-child{border-right:0}
  #pd-frames .fr-meta{display:flex;align-items:center;gap:8px;margin-bottom:8px}
  #pd-frames .fr-meta b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-frames .fr-tag{font-size:11px;padding:1px 8px;border-radius:99px;font-weight:700}
  #pd-frames .fr-tag.keep{background:#17331f;color:#6fdc9a}
  #pd-frames .fr-tag.del{background:#3a1a1a;color:#ff8a80}
  #pd-frames .fr-grid{display:grid;gap:5px}
  #pd-frames .fr-c{position:relative;height:auto;aspect-ratio:16/9;padding:0;border:0;border-radius:6px;background:#2b2f39;overflow:hidden}
  #pd-frames .fr-c canvas{display:block;width:100%;height:100%;object-fit:cover}
  #pd-frames .fr-c.on{outline:3px solid #306fff;outline-offset:-1px}
  #pd-frames .fr-c .t{position:absolute;left:4px;bottom:3px;font:600 10px ui-monospace,Menlo,monospace;color:#fff;text-shadow:0 1px 2px #000}
  #pd-frames .fr-msg{min-height:18px;margin-top:6px}
  #pd-frames .fr-acts{display:flex;gap:8px;margin-top:6px}
  #pd-frames .fr-ft{padding:8px 18px;border-top:1px solid #2c303a}
  #pd-unzip,  #pd-lib{position:fixed;inset:0;z-index:100005;background:#14161b80;display:flex;align-items:center;justify-content:center;font:13px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Meiryo","Noto Sans CJK JP",sans-serif;color:var(--fg)}
  #pd-unzip .lk-hd,#pd-unzip .lk-ft,  #pd-lib .lk-hd,#pd-lib .lk-ft{display:flex;align-items:center;gap:10px}
  #pd-unzip .lk-ft,  #pd-lib .lk-ft{padding:12px 18px;border-top:1px solid var(--line)}
  #pd-unzip .lk-ft .tx,  #pd-lib .lk-ft .tx{flex:1;min-width:0;color:var(--mute)}
  #pd-unzip .lk-ft .tx b,  #pd-lib .lk-ft .tx b{color:var(--fg)}
  html.pd-dark #pd-unzip .lk-tag.ok,  html.pd-dark #pd-lib .lk-tag.ok{background:#17331f;color:#6fdc9a}
  html.pd-dark #pd-unzip .lk-tag.warn,  html.pd-dark #pd-lib .lk-tag.warn{background:#3a2c12;color:#f0c46c}
  html.pd-dark #pd-unzip .lk-tag.del,  html.pd-dark #pd-lib .lk-tag.del{background:#3a1a1a;color:#ff8a80}
  #pd-unzip .uz-row,  #pd-lib .uz-row{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:10px 12px;background:var(--panel);border:1px solid var(--line);border-radius:10px}
  #pd-unzip .uz-ext,  #pd-lib .uz-ext{width:34px;height:34px;flex:none;border-radius:8px;background:#fff3dc;color:#8a5600;font:700 10px ui-monospace,monospace;display:inline-flex;align-items:center;justify-content:center}
  html.pd-dark #pd-unzip .uz-ext,  html.pd-dark #pd-lib .uz-ext{background:#3a2c12;color:#f0c46c}
  #pd-unzip .uz-t,  #pd-lib .uz-t{flex:1 1 260px;min-width:0;display:flex;flex-direction:column}
  #pd-unzip .uz-t b,  #pd-lib .uz-t b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-unzip .uz-t small,  #pd-lib .uz-t small{color:var(--mute);font-size:12px}
  #pd-unzip .uz-pw,  #pd-lib .uz-pw{display:flex;gap:6px}
  #pd-unzip .uz-pw input,  #pd-lib .uz-pw input{width:160px;height:32px;box-sizing:border-box;padding:0 10px;border:1px solid var(--ctl-line);border-radius:7px;background:var(--ctl);color:inherit;font:inherit}
  #pd-unzip .uz-bar,  #pd-lib .uz-bar{flex:0 0 180px;height:6px;border-radius:3px;background:var(--line);overflow:hidden}
  #pd-unzip .uz-bar i,  #pd-lib .uz-bar i{display:block;height:100%;background:var(--pri);transition:width .3s}
  #pd-lib .lb-tabs{display:flex;gap:4px;padding:8px 14px 0;border-bottom:1px solid var(--line);overflow-x:auto}
  #pd-lib .lb-tab{height:auto!important;display:flex;align-items:center;gap:6px;padding:8px 12px!important;border:0!important;border-bottom:2px solid transparent!important;border-radius:0!important;background:none!important;color:var(--mute)!important}
  #pd-lib .lb-tab.on{color:var(--pri)!important;border-bottom-color:var(--pri)!important}
  #pd-lib .lb-tab svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
  #pd-lib .lb-tab i{font-style:normal;font-size:11px;padding:0 6px;border-radius:99px;background:var(--pri-soft);color:var(--pri)}
  #pd-lib .lb-note{padding:8px 18px;color:var(--mute);font-size:12px;border-bottom:1px solid var(--line)}
  #pd-lib .lk-list{gap:6px}
  #pd-lib .lb-row{display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--panel);border:1px solid var(--line);border-radius:10px}
  #pd-lib .lb-t{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
  #pd-lib .lb-t b,#pd-lib .lb-t small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-lib .lb-t small{color:var(--mute);font-size:12px}
  #pd-lib .lb-t .uz-bar{flex:none;width:100%;max-width:320px}
  #pd-lib .lb-all{display:flex;gap:6px;align-items:center}
  #pd-lib .lk-ft{display:flex;align-items:center;gap:8px;padding:12px 18px;border-top:1px solid var(--line);flex-wrap:wrap}
  #pd-lib .lk-ft .tx{flex:1;min-width:0;color:var(--mute)}
  #pd-lib button.dng{border-color:var(--danger);color:var(--danger)}
  #pd-lib .seg{display:inline-flex;gap:4px}
  #pd-lib .seg button.on{background:var(--pri-soft);border-color:var(--pri);color:var(--pri)}
  html.pd-dark #pd-lib .lk-tag.ok{background:#17331f;color:#6fdc9a}
  html.pd-dark #pd-lib .lk-tag.del{background:#3a1a1a;color:#ff8a80}
  #ppdup .rail{overflow-y:auto;scrollbar-width:none}
  #ppdup .rail .rb{position:absolute;top:3px;right:6px;font-style:normal;font-size:10px;line-height:15px;min-width:15px;padding:0 4px;box-sizing:border-box;border-radius:99px;background:var(--pri);color:#fff}
  #ppdup .rail .rb:empty{display:none}
  #ppdup .pd-upd{display:flex;align-items:center;gap:12px;padding:8px 18px;background:#e8f0ff;color:#1c3d8f;border-bottom:1px solid #c6d6ff;font-size:13px}
  #ppdup .pd-upd[hidden]{display:none}
  #ppdup .pd-upd span{flex:1;min-width:0}
  #ppdup .pd-upd a{color:inherit;font-weight:700}
  #ppdup .pd-upd button{border:0;background:none;color:inherit;cursor:pointer;text-decoration:underline}
  html.pd-dark #ppdup .pd-upd{background:#1f2a44;color:#bcd0ff;border-color:#2f4a8a}
  #pd-add{position:fixed;inset:0;z-index:100005;background:#14161b80;display:flex;align-items:center;justify-content:center;font:13px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Meiryo","Noto Sans CJK JP",sans-serif;color:var(--fg)}
  #pd-add.drop .lk-box{outline:3px dashed var(--pri);outline-offset:-8px}
  #pd-add .lk-box,#pd-unzip .lk-box,#pd-lib .lk-box{width:min(980px,96vw);max-height:92vh;display:flex;flex-direction:column;background:var(--panel);border-radius:14px;box-shadow:0 18px 50px #0006;overflow:hidden}
  #pd-add .lk-hd,#pd-add .lk-ft,#pd-add .lk-row,#pd-add .lk-h{display:flex;align-items:center;gap:10px}
  #pd-add .lk-hd,#pd-unzip .lk-hd,#pd-lib .lk-hd{padding:12px 18px;border-bottom:1px solid var(--line)}
  #pd-add .lk-hd b,#pd-unzip .lk-hd b,#pd-lib .lk-hd b{font-size:16px}
  #pd-add .sp,#pd-unzip .sp,#pd-lib .sp{flex:1}
  #pd-add .note,#pd-unzip .note,#pd-lib .note{color:var(--mute);font-size:12px}
  #pd-add select{max-width:380px;height:32px;border:1px solid var(--ctl-line);border-radius:8px;background:var(--ctl);color:inherit;font:inherit;padding:0 8px}
  #pd-add button,#pd-unzip button,#pd-lib button{white-space:nowrap;height:34px;padding:0 14px;border:1px solid var(--ctl-line);border-radius:8px;background:var(--ctl);color:inherit;font:inherit;font-weight:600;cursor:pointer}
  #pd-add button.pri,#pd-unzip button.pri,#pd-lib button.pri{background:var(--pri);border-color:var(--pri);color:#fff;font-weight:700}
  #pd-add button:disabled,#pd-unzip button:disabled,#pd-lib button:disabled{opacity:.45;cursor:default}
  #pd-add button.x,#pd-unzip button.x,#pd-lib button.x{width:32px;padding:0;border:0;background:none;display:inline-flex;align-items:center;justify-content:center;color:var(--mute)}
  #pd-add button.x svg,#pd-unzip button.x svg,#pd-lib button.x svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
  #pd-add .lk-in{padding:12px 18px;display:flex;flex-direction:column;gap:8px;border-bottom:1px solid var(--line)}
  #pd-add textarea{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid var(--ctl-line);border-radius:9px;background:var(--ctl);color:inherit;font:500 12px/1.6 ui-monospace,Menlo,Consolas,monospace;resize:vertical}
  #pd-add .lk-msg{padding:8px 12px;border-radius:8px;background:var(--pri-soft);font-weight:600}
  #pd-add .lk-list,#pd-unzip .lk-list,#pd-lib .lk-list{flex:1 1 auto;overflow:auto;padding:12px 18px;background:var(--bg);display:flex;flex-direction:column;gap:10px;min-height:120px}
  #pd-add .lk-list .empty,#pd-unzip .lk-list .empty,#pd-lib .lk-list .empty{color:var(--mute);text-align:center;padding:30px 0}
  #pd-add .lk-it{background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden}
  #pd-add .lk-it.ex{border-color:#f0d9a8}
  #pd-add .lk-h,#pd-unzip .lk-h,#pd-lib .lk-h{padding:9px 12px;background:var(--panel2)}
  #pd-add .lk-h b,#pd-unzip .lk-h b,#pd-lib .lk-h b{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:50%}
  #pd-add .lk-h .note,#pd-unzip .lk-h .note,#pd-lib .lk-h .note{text-align:right;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-add .lk-note{padding:6px 12px;font-size:12px;color:#8a5600;background:#fff8e6}
  html.pd-dark #pd-add .lk-note{color:#f0c46c;background:#3a2c12}
  #pd-add .lk-f{display:flex;align-items:center;gap:10px;padding:5px 12px;border-top:1px solid var(--line);cursor:pointer}
  #pd-add .lk-f.dis{opacity:.5;cursor:default}
  #pd-add .lk-f .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-add .lk-f .nm i{font-style:normal;color:var(--mute)}
  #pd-add .lk-f .sz{width:80px;text-align:right;color:var(--mute);font-size:12px}
  #pd-add .lk-tag,#pd-unzip .lk-tag,#pd-lib .lk-tag{font-size:11px;padding:1px 8px;border-radius:99px;font-weight:700;white-space:nowrap;background:var(--panel2);color:var(--mute)}
  #pd-add .lk-tag.ok,#pd-unzip .lk-tag.ok,#pd-lib .lk-tag.ok{background:#e3f6ec;color:#17703f}
  #pd-add .lk-tag.pri,#pd-unzip .lk-tag.pri,#pd-lib .lk-tag.pri{background:var(--pri-soft);color:var(--pri)}
  #pd-add .lk-tag.warn,#pd-unzip .lk-tag.warn,#pd-lib .lk-tag.warn{background:#fff3dc;color:#8a5600}
  #pd-add .lk-tag.del,#pd-unzip .lk-tag.del,#pd-lib .lk-tag.del{background:#fde8e8;color:#b42318}
  html.pd-dark #pd-add .lk-tag.ok{background:#17331f;color:#6fdc9a}
  html.pd-dark #pd-add .lk-tag.warn{background:#3a2c12;color:#f0c46c}
  html.pd-dark #pd-add .lk-tag.del{background:#3a1a1a;color:#ff8a80}
  #pd-add .lk-ft{padding:12px 18px;border-top:1px solid var(--line)}
  #pd-add .lk-ft .tx{flex:1;min-width:0;color:var(--mute)}
  #pd-add .lk-ft .tx b{color:var(--fg)}
  #pd-add input[type=checkbox],#pd-unzip input[type=checkbox],#pd-lib input[type=checkbox]{width:16px;height:16px;accent-color:var(--pri);flex:none}
  .st-bar{position:sticky;bottom:0;z-index:3;display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin:14px 0 0;padding:10px 14px;background:#1c1f26;color:#fff;border-radius:12px;box-shadow:0 10px 30px #0004}
  html.pd-dark .st-bar{background:#2b3040}
  .st-bar.hide{display:none}
  .st-bar .tx{flex:1 1 280px;min-width:0;display:flex;flex-direction:column}
  .st-bar .tx small{color:#b6bbc7;font-size:12px}
  .st-bar .acts{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  .st-bar button:not(.pri):not(.danger){background:transparent !important;color:#fff !important;border-color:#5a6070 !important}
  .st-bar .okbadge{color:#6fdc9a}
  .st-res{display:flex;align-items:center;gap:10px;margin:0 0 12px;padding:10px 14px;border-radius:10px;background:#e3f6ec;color:#17703f;font-weight:600}
  .st-res.warn{background:#fff3dc;color:#8a5600}
  html.pd-dark .st-res{background:#17331f;color:#6fdc9a}
  html.pd-dark .st-res.warn{background:#3a2c12;color:#f0c46c}
  .st-res .ic{width:22px;height:22px;flex:none;border-radius:50%;background:currentColor;display:inline-flex;align-items:center;justify-content:center}
  .st-res .ic{color:inherit}
  .st-res .tx{flex:1;min-width:0}
  .st-res button{width:28px;height:28px;padding:0 !important;border:0 !important;background:none !important;color:inherit !important;display:inline-flex;align-items:center;justify-content:center}
  .st-res button svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
  .sl-chip{display:flex;flex-direction:column;gap:2px;min-width:150px;padding:8px 14px;border-radius:12px;background:var(--panel);border:1px solid var(--line);border-left:4px solid var(--line)}
  .sl-chip span,.sl-chip small{font-size:12px;color:var(--mute)}
  .sl-chip b{font-size:22px;line-height:1.1}
  .pd-g.warn{border-color:#e9c98a}.pd-g.warn .pd-gh{background:#fff6e3}
  html.pd-dark .pd-g.warn{border-color:#6b5426}html.pd-dark .pd-g.warn .pd-gh{background:#2e2716}
  .pd-g.pend{opacity:.85}
  .pd-th img{width:100%;height:100%;object-fit:cover}
  /* 一覧 */
  .pd-g{background:var(--panel);border:1px solid var(--line);border-radius:10px;margin-bottom:12px;overflow:hidden}
  .pd-gh{padding:8px 12px;background:var(--panel2);font-weight:600;display:flex;gap:10px;align-items:center}
  .pd-tag{font-size:11px;padding:1px 7px;border-radius:999px;background:#ffe7b8;color:#7a4b00;font-weight:600}
  .pd-row{display:flex;gap:12px;padding:10px 12px;border-top:1px solid var(--line);align-items:center}
  .pd-row.keep{background:var(--keep)}.pd-row.del{background:var(--del)}.pd-row.sel{background:var(--pri-soft)}
  .pd-row.sel .pd-chk input{accent-color:var(--pri)}
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
  #pd-dlg .logs{max-height:55vh;overflow:auto;font:12px/1.5 ui-monospace,Menlo,monospace;border:1px solid #c5c9d288;border-radius:8px;padding:8px;margin:10px 0;white-space:pre-wrap;word-break:break-all}
  #pd-dlg .logs .error{color:#d93025}#pd-dlg .logs .warn{color:#b26a00}
  /* フォルダ一覧（Finder / エクスプローラーのリスト表示風） */
  #ppdup main:has(.tr){padding:0}
  .tr{outline:none;font:13px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Yu Gothic","Meiryo","Noto Sans CJK JP","Noto Sans JP",sans-serif;min-height:100%;background:var(--panel);user-select:none}
  .tr-h,.tr-row{display:grid;grid-template-columns:minmax(0,1fr) 110px 120px 90px 170px;align-items:center}
  .tr-row .c-pct{display:flex;align-items:center;gap:8px;color:var(--mute);font-size:12px}
  .tr-row .c-pct .pb{flex:1;height:6px;border-radius:99px;background:var(--line);overflow:hidden}
  .tr-row .c-pct .pb i{display:block;height:100%;background:var(--pri);border-radius:99px}
  .tr-row .c-pct em{width:44px;text-align:right;font-style:normal}
  .tr:focus .tr-row.sel .c-pct{color:#fff}.tr:focus .tr-row.sel .c-pct .pb{background:#ffffff55}.tr:focus .tr-row.sel .c-pct .pb i{background:#fff}
  .tr .ot{flex:none;font-size:10px;line-height:15px;padding:0 6px;border-radius:99px;background:var(--panel2);color:var(--mute);margin-left:6px}
  .tr-h{position:sticky;top:0;z-index:1;background:var(--panel);border-bottom:1px solid var(--line);height:28px;color:var(--mute);font-size:12px}
  .tr-h span{padding:0 10px;cursor:pointer;border-left:1px solid var(--line);line-height:28px;white-space:nowrap}
  .tr-h span:first-child{border-left:0;padding-left:34px}
  .tr-h span:hover{color:var(--fg)}
  .tr-row{height:26px;cursor:default}
  .tr-row.odd{background:var(--panel2)}
  .tr-row.sel{background:#d4def5}
  .tr:focus .tr-row.sel{background:#0a64d6;color:#fff}
  .tr:focus .tr-row.sel .c-size,.tr:focus .tr-row.sel .c-kind,.tr:focus .tr-row.sel .c-n,.tr:focus .tr-row.sel .tw{color:#fff}
  .tr-row > span{padding:0 10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .tr-row .c-name{display:flex;align-items:center;gap:5px;padding-right:6px}
  .tr-row .c-size,.tr-h .c-size{text-align:right}
  .tr-row .c-size,.tr-row .c-kind,.tr-row .c-n{color:var(--mute);font-size:12px}
  .tr .tw{width:14px;flex:none;font-size:9px;color:var(--mute);text-align:center;cursor:pointer;transition:transform .12s;display:inline-block}
  .tr .tw.open{transform:rotate(90deg)}
  .tr .tw.blank{cursor:default}
  .tr .ic{width:18px;height:16px;flex:none;display:flex;align-items:center;justify-content:center}
  .tr .ic svg{width:18px;height:16px}
  .tr .nm{overflow:hidden;text-overflow:ellipsis}
  .seg{display:inline-flex}
  #ppdup .seg button{border-radius:0;margin-left:-1px}
  #ppdup .seg button:first-child{border-radius:8px 0 0 8px;margin-left:0}
  #ppdup .seg button:last-child{border-radius:0 8px 8px 0}
  #ppdup .seg button.on{background:var(--pri);border-color:var(--pri);color:#fff}
  .tr.big .tr-row{height:76px}
  .tr.big .tr-h span:first-child{padding-left:34px}
  .tr .th{position:relative;width:112px;height:63px;flex:none;border-radius:6px;overflow:hidden;background:#d8dbe2;display:flex;align-items:center;justify-content:center;margin-right:6px;box-shadow:0 0 0 1px #0000001a}
  .tr .th img{width:100%;height:100%;object-fit:cover;display:block}
  .tr .th .ph svg{width:34px;height:30px}
  .tr .th .badge{position:absolute;right:3px;bottom:3px;width:22px;height:18px;border-radius:4px;background:#000a;display:flex;align-items:center;justify-content:center}
  .tr .th .badge svg{width:16px;height:13px}
  .tr .th.dir{background:#cfe4fb}
  .tr .tx{display:flex;flex-direction:column;gap:4px;min-width:0}
  .tr .tx .nm{font-size:13px}
  .tr .tx .sub{font-size:11px;color:var(--mute)}
  .tr:focus .tr-row.sel .tx .sub{color:#ffffffcc}
  html.pd-dark .tr .th{background:#3a3f4b}html.pd-dark .tr .th.dir{background:#2a3a4f}
  .tr .jk{flex:none;font-size:10px;line-height:14px;padding:0 5px;border-radius:7px;background:#ff6b6b;color:#fff;margin-left:4px}
  .tr-ren{font:inherit;padding:1px 4px !important;border:2px solid #4b8df8 !important;border-radius:3px !important;flex:1;min-width:120px;cursor:text !important}
  html.pd-dark .tr-row.sel{background:#3a3f4b}
  #pd-ql{position:fixed;inset:0;z-index:100002;display:flex;align-items:center;justify-content:center;background:#0004}
  #pd-ql .ql{background:#2b2d31ee;color:#eee;border-radius:12px;box-shadow:0 20px 60px #000a;width:min(820px,90vw);overflow:hidden;font:13px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Yu Gothic","Meiryo","Noto Sans CJK JP","Noto Sans JP",sans-serif;backdrop-filter:blur(20px)}
  #pd-ql .ql-h{display:flex;align-items:center;gap:10px;padding:8px 12px;background:#0003}
  #pd-ql .ql-h b{flex:1;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-ql .ql-h button{border:0;background:#fff2;color:#eee;border-radius:50%;width:22px;height:22px;cursor:pointer}
  #pd-ql .ql-b{display:flex;align-items:center;justify-content:center;min-height:300px;max-height:65vh;background:#000}
  #pd-ql .ql-b img{max-width:100%;max-height:65vh;display:block}
  #pd-ql .ql-ic svg{width:160px;height:140px}
  #pd-ql .ql-f{padding:10px 14px}
  #pd-ql .ql-b{position:relative}
  #pd-ql .ql-b video{width:100%;max-height:65vh;display:block;background:#000}
  #pd-ql .pl-msg{position:absolute;left:0;right:0;bottom:12px;text-align:center;color:#ddd;font-size:12px}
  #pd-ql.playing .ql-wait{display:none}
  #pd-ql .ql-acts{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
  #pd-ql .ql-acts button{border:1px solid #fff3;background:#fff1;color:#eee;border-radius:8px;padding:6px 12px;font:inherit;cursor:pointer}
  #pd-ql .ql-acts select{border:1px solid #fff3;background:#fff1;color:#eee;border-radius:8px;padding:6px 8px;font:inherit}
  #pd-ql .ql-acts select option{color:#1c1f26}
  #pd-ql .ql-acts button.pri{background:#306fff;border-color:#306fff;color:#fff;font-weight:700}
  #pd-ql .ql-acts button:hover{filter:brightness(1.15)}
  #pd-dlg .pset{display:flex;flex-direction:column;gap:6px;margin:12px 0;padding:10px 12px;border:1px solid #c5c9d288;border-radius:8px}
  #pd-dlg .pset label{display:flex;gap:8px;align-items:center;cursor:pointer}
  #pd-ql .note{color:#aaa;font-size:12px;word-break:break-all}
  .tr-path{display:flex;align-items:center;gap:2px;overflow-x:auto;white-space:nowrap;min-width:0;flex:1 1 260px;font-size:14px}
  .tr-path button{border:0 !important;background:none !important;padding:2px 6px !important;border-radius:5px !important;color:var(--mute);font:inherit;cursor:pointer}
  .tr-path button:hover:not(:disabled){background:var(--panel) !important;color:var(--fg)}
  .tr-path button.on{color:var(--fg);font-weight:700}
  .tr-path button.drop{outline:2px solid #4b8df8;background:#4b8df833 !important}
  #ppdup .tr-path [data-tup]{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;padding:0 !important;margin-right:6px;border:1px solid var(--ctl-line) !important;background:var(--ctl) !important;border-radius:8px !important;color:var(--fg);font-weight:800}
  #ppdup .tr-path [data-tup] svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
  .tr-path .csep{color:var(--mute);padding:0 2px}
  .tr.has-path .tr-h{top:0}
  .tr.tl .tr-body{padding:6px 12px 20px}
  .tl-sec{margin-bottom:10px}
  .tl-top{position:fixed;right:28px;bottom:24px;z-index:5;padding:8px 16px !important;border-radius:999px !important;background:var(--pri) !important;color:#fff !important;border:0 !important;font-weight:700;box-shadow:0 6px 18px #0004;opacity:0;pointer-events:none;transition:opacity .15s}
  .tl-top.on{opacity:1;pointer-events:auto}
  @keyframes pdflash{0%,40%{background:#ffd54aaa;box-shadow:0 0 0 3px #ffd54a}20%,60%{background:#ffd54a55;box-shadow:0 0 0 3px #ffd54a88}100%{background:transparent;box-shadow:0 0 0 3px transparent}}
  .flash{animation:pdflash 2.4s ease-out}
  .tl-h{position:sticky;top:0;z-index:1;display:flex;align-items:center;gap:8px;padding:8px 6px;background:var(--panel);border-bottom:1px solid var(--line);font-size:13px}
  .tl-h .ic svg{width:18px;height:16px;display:block}
  .tl-h b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .tl-h .pp{color:var(--mute);font-weight:500}
  .tl-h .sp{flex:1}
  .tl-h button{font-size:12px !important;padding:2px 8px !important}
  .tl-h.drop{outline:2px solid #4b8df8;background:#4b8df833}
  .tl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(176px,1fr));gap:12px;padding:12px 4px}
  .tr .tr-row.tile{display:flex;flex-direction:column;align-items:stretch;height:auto;padding:6px;border-radius:10px;gap:4px;position:relative;background:none}
  .tr .tr-row.tile > span{padding:0}
  .tr .tr-row.tile .th{width:100%;height:auto;aspect-ratio:16/9;margin:0}
  .tr .tr-row.tile .th .ph svg{width:48px;height:42px}
  .tr .tr-row.tile .nm{font-size:12px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;white-space:normal;word-break:break-all;text-align:center;padding:0 2px}
  .tr .tr-row.tile .sub{font-size:11px;color:var(--mute);text-align:center}
  .tr .tr-row.tile .jk{position:absolute;top:10px;left:10px;margin:0}
  .tr .tr-row.tile .tr-ren{min-width:0;width:100%;box-sizing:border-box}
  .tr .tr-row.tile.sel{background:#d4def5}
  .tr:focus .tr-row.tile.sel{background:#0a64d6}
  .tr:focus .tr-row.tile.sel .sub{color:#ffffffcc}
  .tr .tr-row.tile.drop{outline:2px solid #4b8df8}
  html.pd-dark .tr .tr-row.tile.sel{background:#3a3f4b}
  #pd-hover{position:fixed;z-index:100002;width:340px;background:var(--hv-bg,#fff);color:#1c1f26;border-radius:10px;box-shadow:0 10px 32px #0005;padding:8px;pointer-events:none;font:12px/1.4 system-ui,"Segoe UI","Hiragino Sans","Yu Gothic UI","Meiryo","Noto Sans CJK JP",sans-serif;animation:pdhv .12s ease-out}
  @keyframes pdhv{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
  #pd-hover img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:6px;display:block;background:#d8dbe2}
  #pd-hover .hv-n{display:flex;gap:6px;align-items:center;margin-top:6px;font-weight:600;word-break:break-all}
  #pd-hover .hv-n svg{width:16px;height:14px;flex:none}
  #pd-hover .hv-s{color:#6a7080;margin-top:2px;word-break:break-all}
  html.pd-dark #pd-hover{background:#252932;color:#e6e8ee}html.pd-dark #pd-hover .hv-s{color:#8b91a1}
  #ppdup .tsel{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:8px 18px;background:var(--panel);border-bottom:1px solid var(--line);min-height:34px}
  #ppdup .tsel:empty{display:none}
  #ppdup .tsel.on{background:var(--pri-soft);border-bottom-color:#306fff55}
  #ppdup .tsel .cnt{font-weight:700;color:var(--pri);margin-right:6px}
  #ppdup .tsel .hint{color:var(--mute);font-size:12px}
  #ppdup .tsel button.red{color:var(--danger);border-color:#d6454566;font-weight:700}
  .tr-row.drop{outline:2px solid #4b8df8;outline-offset:-2px;background:#4b8df833 !important}
  #pd-drag{position:fixed;z-index:100005;pointer-events:none;background:#306fff;color:#fff;font:600 12px system-ui,sans-serif;padding:4px 10px;border-radius:6px;box-shadow:0 4px 14px #0005;max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-drag.ng{background:#6a7080}
  #pd-ctx{position:fixed;z-index:100004;min-width:220px;background:#f6f6f8f2;color:#1c1f26;border:1px solid #0002;border-radius:8px;box-shadow:0 10px 30px #0004;padding:5px;font:13px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Yu Gothic","Meiryo","Noto Sans CJK JP","Noto Sans JP",sans-serif;backdrop-filter:blur(16px)}
  #pd-ctx button{display:flex;justify-content:space-between;gap:24px;width:100%;border:0;background:none;color:inherit;font:inherit;padding:4px 10px;border-radius:4px;text-align:left;cursor:default}
  #pd-ctx button:hover:not(:disabled){background:#0a64d6;color:#fff}
  #pd-ctx button:disabled{opacity:.4}
  #pd-ctx button.red:not(:hover){color:#d93025}
  #pd-ctx kbd{font:12px system-ui,sans-serif;opacity:.6}
  #pd-ctx hr{border:0;border-top:1px solid #0001;margin:4px 6px}
  html.pd-dark #pd-ctx{background:#2b2d31f2;color:#eee;border-color:#fff2}html.pd-dark #pd-ctx hr{border-color:#fff2}
  #pd-dlg .mv{max-height:50vh;overflow:auto;border:1px solid #c5c9d288;border-radius:8px;margin:10px 0 6px}
  #pd-dlg .mv-r{display:flex;align-items:center;gap:6px;padding:5px 8px;cursor:pointer;font-size:13px}
  #pd-dlg .mv-r svg{width:18px;height:15px;flex:none}
  #pd-dlg .mv-r:hover{background:#306fff1f}
  #pd-dlg .mv-r.on{background:#306fff;color:#fff}
  #pd-dlg .mv-r.ng{opacity:.35;cursor:not-allowed}
  #pd-player{position:fixed;inset:0;z-index:100003;background:#000c;display:flex;align-items:center;justify-content:center}
  #pd-player .pl{width:min(1280px,96vw);background:#111;color:#eee;border-radius:12px;overflow:hidden;box-shadow:0 20px 60px #000;font:13px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Yu Gothic","Meiryo","Noto Sans CJK JP","Noto Sans JP",sans-serif}
  #pd-player .pl-h{display:flex;align-items:center;gap:8px;padding:8px 10px;background:#1d1f24}
  #pd-player .pl-h b{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-player .pl-h button,#pd-player .pl-h select,#pd-player .pl-h a{font:inherit;background:#2b2e35;color:#eee;border:1px solid #3a3f4b;border-radius:6px;padding:4px 10px;text-decoration:none;cursor:pointer}
  #pd-player .pl-h button:disabled{opacity:.35;cursor:default}
  #pd-player .pl-b{position:relative;background:#000;min-height:300px;display:flex;flex-direction:column;align-items:stretch;justify-content:center}
  #pd-player video{width:100%;max-height:78vh;display:block;background:#000}
  #pd-player .pl-msg{padding:40px;color:#bbb;text-align:center}
  #pd-player .pl-f{padding:6px 12px;color:#999;display:flex;gap:4px}
  #pd-player .pl-err{position:absolute;left:0;right:0;bottom:56px;padding:10px 16px;background:#000c;color:#ffb4b4}
  #pd-set{position:fixed;inset:0;z-index:100006;background:#14161b59;font:13px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Meiryo","Noto Sans CJK JP",sans-serif;color:var(--fg)}
  #pd-set .dr{position:absolute;top:0;right:0;bottom:0;width:min(460px,100vw);background:var(--panel);box-shadow:-12px 0 40px #0004;display:flex;flex-direction:column;animation:pdset .16s ease-out}
  @keyframes pdset{from{transform:translateX(24px);opacity:0}to{transform:none;opacity:1}}
  #pd-set .hd{display:flex;align-items:center;gap:10px;padding:14px 20px;border-bottom:1px solid var(--line)}
  #pd-set .hd h2{margin:0;font-size:17px;flex:1}
  #pd-set svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;flex:none}
  #pd-set button,#pd-set select{font:inherit;color:inherit;padding:6px 12px;border:1px solid var(--ctl-line);border-radius:8px;background:var(--ctl);cursor:pointer}
  #pd-set .x{border:0;background:none;width:34px;height:34px;padding:0;display:inline-flex;align-items:center;justify-content:center;color:var(--mute)}
  #pd-set .tabs{display:flex;gap:2px;padding:6px 16px 0;border-bottom:1px solid var(--line)}
  #pd-set .tabs button{border:0;border-radius:0;background:none;padding:8px 10px;color:var(--mute);border-bottom:2px solid transparent;font-weight:600}
  #pd-set .tabs button.on{color:var(--pri);border-bottom-color:var(--pri)}
  #pd-set .bd{flex:1;overflow:auto;padding:4px 20px 24px}
  #pd-set h3{margin:20px 0 4px;font-size:12px;letter-spacing:.04em;color:var(--mute)}
  #pd-set .row{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--line)}
  #pd-set .row > span:first-child{flex:1;min-width:0}
  #pd-set .row b{display:block;font-weight:600}
  #pd-set .row small{display:block;color:var(--mute);font-size:12px;margin-top:2px}
  #pd-set .row.col{flex-direction:column;align-items:stretch;gap:4px}
  #pd-set .row.col label{display:flex;align-items:center;gap:8px;padding:3px 0;cursor:pointer}
  #pd-set input[type=radio],#pd-set input[type=checkbox]{width:16px;height:16px;accent-color:var(--pri);margin:0}
  #pd-set .seg{display:inline-flex}
  #pd-set .seg button{border-radius:0;margin-left:-1px}
  #pd-set .seg button:first-child{border-radius:8px 0 0 8px;margin-left:0}
  #pd-set .seg button:last-child{border-radius:0 8px 8px 0}
  #pd-set .seg button.on{background:var(--pri);border-color:var(--pri);color:#fff}
  #pd-set .ver{font:600 12px ui-monospace,Menlo,monospace;color:var(--mute)}
  #pd-set .badge{display:inline-block;min-width:16px;padding:0 5px;border-radius:8px;background:var(--danger);color:#fff;font:700 10px/16px system-ui,sans-serif;margin-left:6px}
  #pd-dlg{font:13px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Meiryo","Noto Sans CJK JP",sans-serif}
  #pd-dlg{position:fixed;inset:0;z-index:100001;background:#0007;display:flex;align-items:center;justify-content:center}
  #pd-dlg .box{background:#fff;color:#1c1f26;border-radius:12px;padding:24px;width:min(460px,92vw);box-shadow:0 10px 40px #0006}
  #pd-dlg h3{margin:0 0 12px;font-size:17px}
  #pd-dlg .note{color:#6a7080;font-size:12px}
  #pd-dlg .hard{display:flex;gap:8px;align-items:center;color:#d93025;font-weight:600;margin:16px 0;cursor:pointer}
  #pd-dlg .acts{display:flex;justify-content:flex-end;gap:10px}
  #pd-dlg button{font:inherit;padding:6px 14px;border:1px solid #c5c9d2;border-radius:8px;background:#fff;color:inherit;cursor:pointer}
  #pd-dlg button.danger{background:#d64545;color:#fff;border-color:#d64545;font-weight:700}
  html.pd-dark #pd-dlg .box{background:#1d2027;color:#e6e8ee}html.pd-dark #pd-dlg button{background:#252932;border-color:#3a3f4b}
  `;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  const STEPS = [
    { v: 'scan', t: '読み込む', d: '開いているフォルダ以下のファイルとフォルダを読み込みます。ほかの機能はこのあとで使えます。' },
    { v: 'junk', t: '不要ファイルを削除', d: '広告・宣伝のファイルや 10MB 以下のファイルなど、作品と関係ないものを削除します。ほかのステップでは対象から外します（使うかどうかを選べます）。' },
    { v: 'name', t: 'ファイル名を整える', d: 'FC2のファイル名から、サイト名や広告などの余計な文字を消して「FC2-PPV-品番」の形にそろえます（使うかどうかを選べます）。' },
    { v: 'sort', t: '作品ごとに仕分け', d: '複数の作品が入ったフォルダの中に品番フォルダを作り、ファイルを振り分けます。' },
    { v: 'ren', t: 'フォルダ名を揃える', d: 'フォルダ名を中のファイル名（品番）に揃えます。同名があれば (1) を付けます。' },
    { v: 'dup', t: '重複を比べて削除', d: '同じファイルをサムネイルとサイズで比べ、チェックしたものを削除します。' },
    { v: 'clean', t: '(1)を外す・片付け', d: '重複を削除したあとに残った空フォルダをゴミ箱へ移し、同じ名前で入れ子になったフォルダをまとめ、不要になった (1) を外します。' },
    { v: 'seller', t: '販売者ごとに仕分け', d: '作品フォルダの品番から販売者を調べ、ホーム/販売者別/販売者名（販売者ID）/ へ移動します。調べるだけでは何も動かしません（使うかどうかを選べます）。' },
  ];

  // 線のアイコン（currentColor で色を合わせる）
  const SVG = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const IC = {
    gear: SVG('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    sun: SVG('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    moon: SVG('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'),
    globe: SVG('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9M12 3C9.5 5.6 8.2 8.6 8.2 12s1.3 6.4 3.8 9"/>'),
    x: SVG('<path d="M6 6l12 12M18 6L6 18"/>'),
    search: SVG('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
    up: SVG('<path d="M12 19V5M5 12l7-7 7 7"/>'),
    folder: SVG('<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h8.5A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/>'),
    dedupe: SVG('<rect x="3" y="4" width="11" height="13" rx="2"/><path d="M8 8h11a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H10"/>'),
    alert: SVG('<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/>'),
    expand: SVG('<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>'),
    minus: SVG('<path d="M6 12h12"/>'),
    link: SVG('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2"/>'),
  };
  const btn = document.createElement('button'); btn.id = 'ppdup-btn'; btn.innerHTML = LOGO + '<span>Dedupe</span>'; btn.title = 'PikPak Distill – Dedupe（クリックでメニュー）'; document.body.appendChild(btn);
  const fab = document.createElement('div'); fab.id = 'ppdup-fab'; document.body.appendChild(fab);
  const root = document.createElement('div'); root.id = 'ppdup';
  root.innerHTML = `
    <aside class="rail" data-r="rail">
      <button data-a="toflow" data-rail="flow" title="整理（1〜7のステップ）"><svg viewBox="0 0 24 24"><path d="M4 6h10M4 12h16M4 18h7" /><circle cx="18" cy="6" r="2"/><circle cx="15" cy="18" r="2"/></svg><span>整理</span></button>
      <button data-a="tree" data-rail="tree" title="フォルダ一覧（Finder やエクスプローラーのように、フォルダを開いて中身を見られます）"><svg viewBox="0 0 24 24"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h8.5A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/><path d="M7 11h10M7 15h6"/></svg><span>フォルダ​一覧</span></button>
      <button data-a="lib" data-v="dl" data-rail="lib-dl" title="ダウンロード中（クラウドダウンロードの進み具合・失敗）"><svg viewBox="0 0 24 24"><path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 8.5a4 4 0 0 1-.5 7.97"/><path d="M12 11v9M8.8 17l3.2 3 3.2-3"/></svg><span>クラウド​DL</span><i class="rb" data-r="rb-dl"></i></button>
      <button data-a="lib" data-v="recent" data-rail="lib-recent" title="最近追加したもの（追加日の新しい順）"><svg viewBox="0 0 24 24"><circle cx="11" cy="12" r="7.5"/><path d="M11 8v4.2l2.6 1.6"/><path d="M19.5 3.5v4M17.5 5.5h4"/></svg><span>最近の追加</span><i class="rb" data-r="rb-recent"></i></button>
      <button data-a="lib" data-v="hist" data-rail="lib-hist" title="再生した履歴"><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/><path d="M10.5 9.2v5.6l4.4-2.8z"/></svg><span>再生履歴</span><i class="rb" data-r="rb-hist"></i></button>
      <button data-a="lib" data-v="star" data-rail="lib-star" title="スター付き"><svg viewBox="0 0 24 24"><path d="M12 3.8l2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8z"/></svg><span>スター</span><i class="rb" data-r="rb-star"></i></button>
      <button data-a="lib" data-v="trash" data-rail="lib-trash" title="ゴミ箱（中身を見る・元に戻す・完全に削除）"><svg viewBox="0 0 24 24"><path d="M4 7h16M9.5 7V4.8h5V7"/><path d="M6 7l1 12.2A1.5 1.5 0 0 0 8.5 20.6h7a1.5 1.5 0 0 0 1.5-1.4L18 7"/><path d="M10 11v6M14 11v6"/></svg><span>ゴミ箱</span><i class="rb" data-r="rb-trash"></i></button>
      <button data-a="addlink" data-rail="add" title="リンク・マグネットを追加"><svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2"/></svg><span>リンク</span></button>
      <button data-a="rescan" data-rail="scan" title="最新の状態を読み込み直す"><svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/></svg><span>再読み込み</span></button>
    </aside>
    <header>
      <div class="brand">${LOGO}<h1 class="wm" aria-label="PikPak Distill – Dedupe"><small>PIKPAK DISTILL</small><span class="gw"><i aria-hidden="true">Dedupe</i><i aria-hidden="true">Dedupe</i><b>Dedupe</b></span></h1><span class="ver" title="いま動いているバージョン">v${VER}</span><span class="sp"></span>
        <label class="hq" title="名前で絞り込み">${IC.search}<input type="text" data-a="tq" placeholder="名前で絞り込み・検索"></label><span class="seg hqs" data-r="tqs" title="探す範囲"><button data-a="tqs" data-v="here">このフォルダ</button><button data-a="tqs" data-v="all">すべて</button></span>
        <div class="pd-quota" data-r="quota"></div>
        <span class="seg thm" data-r="theme" role="group" aria-label="テーマ"></span>
        <button class="hbtn" data-a="lang" title="表示言語を切り替える">${IC.globe}<span class="raw" data-r="langname"></span></button>
        <button class="hbtn" data-a="addlink" title="リンク・マグネットを追加（追加する前に、もうあるか確かめる）">${IC.link}<span>リンクを追加</span></button>
        <button class="hbtn" data-a="settings" title="設定（表示・再生・整理・情報）">${IC.gear}<span>設定</span><i data-r="logbadge"></i></button>
        <button class="hbtn wbtn-full" data-a="tofull" title="PikPak の画面を Dedupe に切り替えて、広い画面で使う">${IC.expand}<span>全画面で開く</span></button>
        <button class="hx wbtn-min" data-a="mini" title="小さくする（右下のボタンに戻す。作業中の内容はそのまま）" aria-label="小さくする">${IC.minus}</button>
        <button class="hx" data-a="close" title="閉じる（PikPakの画面に戻る）" aria-label="閉じる">${IC.x}</button>
      </div>
      <nav data-r="nav"></nav>
    </header>
    <div class="pd-upd" data-r="upd" hidden></div>
    <div class="pd-popban" data-r="popban"><span>PikPak の画面を Dedupe に切り替えて使うこともできます。一覧が広くなり、キー操作やドラッグも使いやすくなります。</span><button class="pri" data-a="tofull">全画面で開く</button><button data-a="fullnext">次から全画面で開く</button><button data-a="banclose">閉じる</button></div>
    <div class="tb" data-r="tb"></div>
    <div class="tsel" data-r="tsel"></div>
    <main data-r="main"></main>
    <div class="prog" data-r="prog"><div class="pr1"><span data-r="status"></span><span data-r="pright"></span></div><div class="pr2"><span class="pb"><i data-r="pbar"></i></span><b class="pp" data-r="ppct"></b><span class="ps" data-r="psub"></span><button class="pstop" data-a="stop" title="中断（そこまでの分は反映されます）">中断</button></div></div>`;
  document.body.appendChild(root);

  // ---------- 表示言語（日本語／英語） ----------
  // 画面はすべて日本語で組み立て、英語のときは表示の直前に置き換える（ファイル名・フォルダ名は置き換えない）
  const LS_LANG = 'ppdup:lang:v1';
  const langPref = () => { try { return localStorage.getItem(LS_LANG) || 'auto'; } catch (e) { return 'auto'; } };
  const resolveLang = () => { const p = langPref(); return p === 'ja' || p === 'en' ? p : (/^ja\b/i.test(navigator.language || '') ? 'ja' : 'en'); };
  let LANG = resolveLang();
  const loc = () => (LANG === 'en' ? 'en-US' : 'ja-JP');
  const EN = [["読み込んだファイルのうち、作品と関係ないものを見分けて削除します。オンの間は、ここで見つけたファイルを「ファイル名を整える」「作品ごとに仕分け」「フォルダ名を揃える」「重複を比べて削除」の対象から外すので、広告ファイルの名前でフォルダが作られたり、フォルダ名が広告の名前になったりしません（削除しなくても外れます）。","Finds scanned files that are not part of any work and deletes them. While this is on, those files are excluded from \"Clean file names\", \"Sort by work\", \"Align folder names\" and \"Compare duplicates\", so ad files never become folder names (they are excluded even if you don't delete them)."],["「要確認」は最初はチェックなしです。削除はPikPakのゴミ箱へ移動します（確認画面で完全削除も選べます）。削除したあとに空になったフォルダは、「7. (1)を外す・片付け」でまとめて片付けられます。使わない場合は、右上の「このステップを使う」のチェックを外してください。","\"Needs review\" items start unchecked. Deleting moves files to the PikPak trash (you can choose permanent deletion in the confirmation). Folders left empty can be cleaned up in \"7. Remove (1) / tidy up\". To skip this step, uncheck \"Use this step\" at the top right."],["の形にそろえます。名前がそろうと、「重複を比べて削除」で同じ動画が同じ組にまとまり、フォルダ名との対応もそろいます。Enhancement Master の「FC2 クリーン命名」と同じ考え方です。",". With consistent names, \"Compare duplicates\" groups the same video together and folder names line up. Same idea as Enhancement Master's \"FC2 clean naming\"."],["PotPlayer はアプリが入っていれば直接起動します。GOM Player・VLC などは「既定のアプリで開く」を選び、.m3u ファイルを開くアプリにそのプレーヤーを設定してください。","PotPlayer launches directly if installed. For GOM Player, VLC etc., choose \"Open with default app\" and set that player as the app for .m3u files."],["再生用リンクをコピーしました。プレーヤーの「URL を開く」（GOM Player なら Ctrl+U）に貼り付けてください。リンクはしばらくすると無効になります。","Playback link copied. Paste it into your player's \"Open URL\" (Ctrl+U in GOM Player). The link expires after a while."],["再生リストファイル（.m3u）を保存しました。開くと、OS で .m3u に設定しているプレーヤー（GOM Player・VLC など）で再生されます。","Saved a playlist file (.m3u). Opening it plays the video in the player your OS uses for .m3u (GOM Player, VLC, etc.)."],["：品番がなく、宣伝によく使われる文字だけの名前。小さいファイルは削除の対象、50MB 以上や品番が入ったものは作品の可能性があるため「要確認」に回します",": names without a work ID made only of typical promo text. Small files are deleted; files of 50 MB or more, or with a work ID, may be real works and go to \"Needs review\""],["広告・宣伝のファイルや 10MB 以下のファイルなど、作品と関係ないものを削除します。ほかのステップでは対象から外します（使うかどうかを選べます）。","Deletes files that are not part of any work, such as ads and files of 10 MB or less. Other steps ignore them (optional)."],["エラーや主な処理の記録です。このブラウザの中にだけ保存されます（ログイン情報は記録しません）。不具合の報告にはコピーして貼り付けてください。","A record of errors and main actions, stored only in this browser (no login data). Copy and paste it when reporting a problem."],["VLC・mpv・Celluloid などは「既定のアプリで開く」を選び、.m3u ファイルを開くアプリにそのプレーヤーを設定してください。","For VLC, mpv, Celluloid etc., choose \"Open with default app\" and set that player as the app for .m3u files."],["オンにすると、作品と関係ないファイルを、仕分け・名前の変更・重複比較の対象から外します（「2. 不要ファイルを削除」で確認・削除できます）","When on, files unrelated to any work are excluded from sorting, renaming and duplicate checks (review and delete them in \"2. Delete junk files\")"],["ホームか My Pack を開いた状態で実行してください。読み込みはバックグラウンドで行い、PikPak の画面は切り替わりません。","Run this with Home or My Pack open. Scanning runs in the background; the PikPak page does not change."],["同じ名前のものが移動先にある場合は (1) を付けて移動します。グレーのフォルダ（移動するフォルダ自身とその中）へは移動できません。","If the destination already has the same name, (1) is added. Grey folders (the folders being moved and their contents) can't be chosen."],["FC2のファイル名から、サイト名や広告などの余計な文字を消して「FC2-PPV-品番」の形にそろえます（使うかどうかを選べます）。","Strips site names, ads and other extra text from FC2 file names to the form \"FC2-PPV-ID\" (optional)."],["重複を削除したあとに残った空フォルダをゴミ箱へ移し、同じ名前で入れ子になったフォルダをまとめ、不要になった (1) を外します。","Moves folders left empty after deleting duplicates to the trash, flattens nested same-name folders and removes (1) suffixes that are no longer needed."],["PikPakへの再ログインが必要な可能性があります。PikPakの画面で一度ログインし直してから、もう一度お試しください。","You may need to log in to PikPak again. Log in on the PikPak page, then try again."],["すべてのステップが完了しました。PikPakで操作したあとは、「1. 読み込む」で読み込み直すと最新の状態を確認できます。","All steps are complete. After changing things in PikPak, run \"1. Scan\" again to see the latest state."],["チェックの入ったものを実行します。重複を削除したあとは、先に「1. 読み込む」で読み込み直してから使ってください。","Runs the checked items. After deleting duplicates, run \"1. Scan\" again first."],["使わない場合は、右上の「このステップを使う」のチェックを外してください。次回以降もこの設定を覚えておきます。","To skip this step, uncheck \"Use this step\" at the top right. The setting is remembered."],["「X の中に X だけ」のフォルダの中身を 1 つ上へ出します（オムニバスなど複数作品のフォルダは対象外）","Moves the contents of \"X containing only X\" up one level (folders with several works, like omnibus sets, are left alone)"],["この画質（HLS）はこのブラウザの中では再生できません。別の画質か「↗ 外部プレーヤー」を選んでください。","This quality (HLS) can't play in this browser. Choose another quality or \"↗ External player\"."],["チェックの入った空フォルダをゴミ箱へ移し、入れ子のフォルダをまとめ、(1) を外します。よろしいですか？","Move the checked empty folders to the trash, flatten nested folders and remove (1)? "],["ログイン情報を更新しました。途中まで完了した分は保存済みです。もう一度ボタンを押すと続きから実行します。","Login refreshed. Completed work has been saved. Press the button again to continue."],["同じ名前のファイルがあるため (n) を付けます（重複の可能性：「重複を比べて削除」で確認できます）","A file with the same name exists, so (n) is added (possible duplicate: check in \"Compare duplicates\")"],["既定のアプリで開く（.m3u を保存して開く：GOM Player・VLC・MPC・mpv など）","Open with default app (save and open an .m3u: GOM Player, VLC, MPC, mpv, etc.)"],["・右クリックの「再生」で使う方法です。プレビュー（スペース）の中の ▶ からはいつでも選べます。"," and right-click \"Play\". You can always pick a method from ▶ inside the preview (Space)."],["このファイルの再生用リンクを取得できませんでした（PikPak 側で変換中の可能性があります）","Couldn't get a playback link for this file (PikPak may still be converting it)"],["対象はチェックの入ったファイルだけです。通常はPikPakのゴミ箱へ移動し、あとから戻せます。","Only checked files are affected. They normally go to the PikPak trash and can be restored."],["で戻る）・ダブルクリックで再生・ドラッグで移動・右クリックでメニュー・スペースでプレビュー・"," to go back) · double-click to play · drag to move · right-click for menu · Space to preview · "],["作品の可能性があるもの。削除する場合はチェックしてください（ほかのステップの対象のままです）","May be real works. Check to delete (they stay included in other steps)"],["などのファイル、品番がなく「最新地址」「广告」「福利」などの宣伝の言葉やサイトのアドレス（"," files, and names without a work ID containing promo words or site addresses ("],["フォルダ一覧（Finder やエクスプローラーのように、フォルダを開いて中身を見られます）","Folders (browse folders like Finder or Explorer)"],["開いているフォルダ以下のファイルとフォルダを読み込みます。ほかの機能はこのあとで使えます。","Scans all files and folders under the open folder. Other features become available afterwards."],["オフにすると、不要ファイルの判定を使わず、すべてのファイルをほかのステップの対象にします","When off, junk detection is skipped and every file is included in the other steps"],["内容を確認して、まずは「先頭1件だけ試す」で動きを確かめてください。削除はしません。","Review the plan and try \"Try the first one\" first. Nothing is deleted."],["広告・宣伝のファイルや 10MB 以下のファイルなどを、ほかの作業の対象から外します","Excludes ads and files of 10 MB or less from the other tasks"],["読み込み済みです。カードから作業を選べます（操作したら再スキャンで最新にできます）。","Scanned. Pick a task from the cards (rescan after making changes)."],["PikPak でファイルを追加・操作したら、再スキャンで最新の状態を確認できます。","After adding or changing files in PikPak, rescan to see the latest state."],["中身が空のフォルダです。実行直前にも空であることを確認します（ゴミ箱から戻せます）","These folders are empty. Emptiness is re-checked right before running (restorable from trash)"],["フォルダ名を中のファイル名（品番）に揃えます。同名があれば (1) を付けます。","Renames folders after the file (work ID) inside. Adds (1) if the name is taken."],["中身のある同名フォルダが複数あります（「重複を比べて削除」で整理してください）","Several non-empty folders share this name (sort them out in \"Compare duplicates\")"],["FC2 以外のファイルは変更しません。ファイルの中身や置き場所は変わりません","Non-FC2 files are not changed. File contents and locations stay the same"],["そのフォルダへは移動できません（移動するフォルダ自身やその中へは移せません）","Can't move there (a folder can't be moved into itself or its contents)"],["強制削除：全件にチェックが入っている組も、すべて削除する（広告ファイルなど）","Force delete: also delete groups where every file is checked (e.g. ad files)"],["複数の作品が入ったフォルダの中に品番フォルダを作り、ファイルを振り分けます。","Creates work-ID folders inside folders holding several works and sorts the files into them."],["：画像・説明ファイル・短い宣伝動画など（字幕ファイルは「要確認」に回します）",": images, info files, short promo videos, etc. (subtitles go to \"Needs review\")"],["ログインの有効期限が切れていたため、PikPakの画面を再読み込みします…","Your login expired, reloading the PikPak page…"],["画面を再読み込みしました。ログイン情報の更新を待っています…（最大 あと","Page reloaded. Waiting for the login to refresh… (up to"],["表示中の作品をすべて仕分け（フォルダ作成・移動）します。よろしいですか？","Sort all listed works (create folders and move files)?"],[" キーで使う方法です。プレビュー（スペース）の中からはいつでも選べます。"," key. You can always choose from inside the preview (Space)."],["※各組の一番大きいファイルは最初からチェックなし（残す）になっています","* The largest file in each group starts unchecked (kept)"],["再生のしかたの設定（プレビュー内・プレーヤー・全画面・外部プレーヤー）","Playback settings (preview, player, full screen, external player)"],["同じファイルをサムネイルとサイズで比べ、チェックしたものを削除します。","Compares identical files by thumbnail and size, and deletes the checked ones."],["1〜7 の整理ステップの画面へ移ります（左メニューの「整理」と同じ）","Go to the 1–7 organizing steps (same as \"Organize\" in the left menu)"],["PikPak Distill – Dedupe（クリックでメニュー）","PikPak Distill – Dedupe (click for menu)"],["1〜7 のステップをすべて表示します（左メニューの「整理」と同じ）","Show all steps 1–7 (same as \"Organize\" in the left menu)"],["を起動しています。ブラウザの確認が出たら「開く」を押してください（"," is launching. If the browser asks, click \"Open\" ("],["フォルダを作成しました。名前を入力して Enter で確定します。","Folder created. Type a name and press Enter."],["変更内容を確認して、まずは「先頭1件だけ試す」で確かめてください。","Review the changes and try \"Try the first one\" first."],["外側のフォルダにほかのフォルダが増えていたため、まとめませんでした","Not flattened because the outer folder now contains other folders"],["。上の画質を切り替えるか「↗ 外部プレーヤー」を試してください。",". Switch quality above or try \"↗ External player\"."],["同じ名前のフォルダが入れ子になっているため、中身を 1 つ上の「","Nested folders share the same name, so the contents are moved up into \""],["IINA・Infuse はアプリが入っていれば直接起動します。","IINA and Infuse launch directly if installed."],["全画面にできませんでした。プレーヤーの ⛶ を押してください。","Couldn't go full screen. Press ⛶ in the player."],["タイル表示。フォルダごとに見出しを付けて並べます（3 キー）","Tile view, grouped under a heading per folder (key 3)"],["下のカードから作業を選ぶか、おすすめの作業へ進んでください。","Pick a task from the cards below, or go to the suggested one."],["再生のしかたの設定（ダブルクリック時の動作・外部プレーヤー）","Playback settings (double-click action, external player)"],["削除を確認できませんでした（PikPak側で処理中の可能性）","Couldn't confirm the deletion (PikPak may still be processing)"],["画面を再読み込みしました。ログイン情報の更新を待っています…","Page reloaded. Waiting for the login to refresh…"],["移動を確認できませんでした（PikPak側で処理中の可能性）","Couldn't confirm the move (PikPak may still be processing)"],["」が残っています（「重複を比べて削除」で整理してください）","\" still exists here (sort it out in \"Compare duplicates\")"],["ここを最上位にする（ドラッグして離すとこのフォルダへ移動）","Make this the top level (drop items here to move them into this folder)"],["チェックの入ったファイルの名前を整えます。よろしいですか？","Clean up the names of the checked files?"],["リンクをコピー（プレーヤーの「URL を開く」に貼り付け）","Copy link (paste into your player's \"Open URL\")"],["一部のファイルが見つかりません（再スキャンしてください）:","Some files are missing (please rescan):"],["場所の情報がありません（ホームから読み込み直してください）","Location unknown (scan again from Home)"],["広告・宣伝（作品フォルダの中の、品番のない小さなファイル）","Ad (small file without a work ID inside a work folder)"],["を付けます（重複の可能性があるため、あとで比べられます）"," is added (possible duplicate, compare later)"],["サイト名・広告など、品番の前後にある余計な文字は消します","Site names, ads and other text around the work ID are removed"],["件）は、組ごと消えてしまうため通常は対象外にしています（"," files) are normally skipped because the whole group would be deleted ("],["」の中身を表示しています（見出しの「⤒ 一覧へ戻る」か","\" is shown (go back to the top with the heading's \"⤒ Back to overview\" or the"],["表示中のフォルダ名をすべて変更します。よろしいですか？","Rename all listed folders?"],["プレーヤー画面で再生（画質の切り替え・前後のビデオ）","Play in the player (switch quality, previous/next video)"],["中断しています…（いまの処理が終わったら止まります）","Stopping… (after the current item finishes)"],["名前の変更は不要です。次のステップへ進んでください。","No renaming needed. Go to the next step."],["すべてのファイルを、ほかのステップの対象にします。","All files are included in the other steps."],["広告・宣伝（品番がなく、複数のフォルダに同じ名前）","Ad (no work ID, same name in several folders)"],["でゴミ箱へ・1 / 2 / 3 で表示の切り替え"," to trash · 1 / 2 / 3 to switch views"],["ゴミ箱を経由せず完全に削除する（元に戻せません）","Delete permanently without the trash (cannot be undone)"],["マウスを乗せたときにサムネイルを大きく表示します","Shows a large thumbnail when you hover"],["仕分けは不要です。次のステップへ進んでください。","No sorting needed. Go to the next step."],["外部プレーヤー用のリンクを取得できませんでした：","Couldn't get a link for the external player: "],["選んだフォルダを最上位にして、その中だけを表示（","Make the selected folder the top level and show only its contents ("],["オフにすると、このステップを使わず次へ進みます","When off, this step is skipped"],["作品と関係ないファイルは見つかりませんでした。","No files unrelated to works were found."],["最新の状態を読み込んでから、この作業を続けます","Rescans, then continues this task"],["画質（カクつく場合は変換画質を選んでください）","Quality (choose a converted quality if playback stutters)"],["PikPakのサーバーに接続できませんでした","Couldn't connect to the PikPak server"],["✓ このステップの作業はすべて完了しています","✓ Everything in this step is done"],["。⤢ のプレーヤー画面で別の画質を試せます。",". Try another quality in the ⤢ player."],["最上位・スキャン起点のフォルダは変更しません","Top-level and scan-root folders are not changed"],["（ログイン切れとして再読み込みで回復します）"," (treated as an expired login; recovering by reloading)"],["」が既にあります（再スキャンしてください）","\" already exists (please rescan)"],["」へ出して、空になったフォルダを片付けます","\" and the emptied folder is removed"],["再読み込み後もログイン情報が更新されません","Login did not refresh even after reloading"],["同じ品番でまとめる（-1/-2違いも含む）","Group by work ID (including -1/-2 parts)"],["同じ場所に同じ名前のファイルができる場合は","If the same name already exists in the folder,"],["品番の入ったファイルがないため変更しません","Not changed: no file with a work ID"],["見つかりません（読み込み直してください）:","Not found (please rescan):"],["まずは「スキャン開始」を押してください。","Press \"Start scan\" to begin."],["件は実行直前の確認で対象外になりました）"," were skipped by the last-moment check)"],["空の同名フォルダを片付けたあとに外します","Removed after the empty same-name folders are cleaned up"],["✓ 仕分けが必要なフォルダはありません","✓ No folders need sorting"],["が入っていない場合は何も起きません）。"," isn't installed, nothing happens)."],["ログイン期限切れのため画面を再読み込み","Reloading the page because the login expired"],["中身が入っているため削除しませんでした","Not deleted because it isn't empty"],["作品フォルダの中の、品番のないファイル","File without a work ID inside a work folder"],["元フォルダにファイルが見つかりません:","File not found in the source folder:"],["品番あり・作品の可能性（念のため確認）","Has a work ID, may be a real work (please check)"],["広告・宣伝（品番のない宣伝向けの名前）","Ad (promo-style name without a work ID)"],["ダブルクリック・右クリックの「再生」・","Used for double-click, right-click \"Play\" and the "],["このステップでは処理できないものです","Items this step can't handle"],["ほかのステップの対象から外しています","Excluded from the other steps"],["チェックの入ったファイルがありません","No files are checked"],["再生用リンクを取得できませんでした：","Couldn't get a playback link: "],["絞り込みに該当する重複はありません。","No duplicates match the filter."],["」が残っているため外せませんでした","\" still exists, so it couldn't be removed"],["サムネイル付きのリスト（2 キー）","List with thumbnails (key 2)"],["チェックを外したものは変更しません","Unchecked items are not changed"],["件。次のステップを選んでください。",". Choose the next step."],["元ファイル（ダウンロード用リンク）","Original file (download link)"],["再生用リンクを取得できませんでした","Couldn't get a playback link"],["名前に / や \\\\ は使えません","Names can't contain / or \\\\"],["名前の変更は完了しています（要確認","Renaming is done (needs review: "],["品番のないファイル（作品の可能性）","File without a work ID (may be a real work)"],["外部プレーヤー用のリンクを取得中…","Getting a link for the external player…"],["直下に名前の異なるファイルが複数:","Several different files directly inside:"],["閉じる（PikPakの画面に戻る）","Close (back to PikPak)"],["✓ すべて完了（読み込み画面へ）","✓ All done (to the scan screen)"],["✓ 外せる (1) はありません","✓ No (1) to remove"],["」を最上位にして表示しています（","\" is now the top level ("],["このステップはオフになっています","This step is turned off"],["すでにそのフォルダの中にあります","Already in that folder"],["の操作：▶ / ← → で開閉（"," controls: ▶ / ← → open/close ("],["フォルダを作成できませんでした:","Couldn't create the folder:"],["フォルダを作成できませんでした：","Couldn't create the folder: "],["ログインの有効期限が切れています","Your login has expired"],["中に品番の異なるフォルダが複数:","Several folders with different work IDs inside:"],["件は「要確認」で確認できます）。"," items to check under \"Needs review\")."],["作品と関係ないファイルを除外する","Exclude files unrelated to works"],["入れ子のフォルダをまとめています","Flattening nested folders"],["移動（ドラッグでも移動できます）","Move (you can also drag)"],["要確認の項目を確認してください。","Please check the items that need review."],["読み込んだ場所から表示しています","Showing from the scanned location"],["／ 同名のため (1) を付ける"," / (1) added for same names "],["1 つ上の階層を最上位にする（","Make the parent the top level ("],["このフォルダを最上位にして表示","Show this folder as the top level"],["ログ（新しい順・最新300件）","Log (newest first, last 300)"],["不要ファイルの除外はオフです。","Junk file exclusion is off."],["件のフォルダ名を変更しました。"," folders renamed."],["広告・宣伝（広告フォルダの中）","Ad (inside an ad folder)"],["次のステップへ進んでください。","Go to the next step."],["閉じる（スペース / Esc）","Close (Space / Esc)"],["いま最上位にしているフォルダ","Current top-level folder"],["すべてのフォルダを閉じました","All folders collapsed"],["すべてのフォルダを開きました","All folders expanded"],["まずはフォルダを読み込みます","Start by scanning your folders"],["ファイル名の整理はオフです。","File-name cleanup is off."],["ファイル名はそろっています。","File names are already clean."],["フォルダ一覧で新規フォルダ：","New folder in Folders: "],["ログイン情報を取得できません","Can't read login information"],["ログイン情報を更新しました。","Login refreshed."],["一致するフォルダはありません","No matching folders"],["中のフォルダの品番に揃えます","Named after the work ID of the folder inside"],["件に (n) を付けました）"," got (n) added)"],["全件にチェックが入っている組","groups with every file checked"],["名前を変更できませんでした：","Couldn't rename: "],["最新の状態を読み込み直します","Rescan to get the latest state"],["現在の名前が想定と違います:","The current name is not what was expected:"],["組 ／ チェック（削除する）"," groups / checked (to delete) "],["項目の移動先を選んでください"," items: choose where to move them"],["（このブラウザでは再生不可）"," (can't play in this browser)"],["（読み込んだフォルダの直下）","(directly in the scanned folder)"],["1〜7の流れで順番に進める","Go through steps 1–7 in order"],["✓ 空フォルダはありません","✓ No empty folders"],["このフォルダを最上位にする","Make this folder the top level"],["すべてのフォルダを閉じる（","Collapse all folders ("],["または上のパスで戻れます）"," or the path above to go back)"],["キー／マウスの戻るボタン）"," key / mouse back button)"],["ファイル名は変更しません。","File names are not changed."],["フォルダを読み込み済みです","Folders scanned"],["フォルダ一覧で名前を変更：","Renamed in Folders: "],["ログイン情報を更新して再開","Login refreshed, resuming"],["件のファイル名を整えました"," file names cleaned up"],["入れ子のフォルダをまとめる","Flatten nested folders"],["再生用リンクの取得に失敗：","Failed to get playback link: "],["同名フォルダがあるため (","(same-name folder exists, adding ("],["整理はすべて完了しています","Everything is organized"],["空フォルダを片付けています","Removing empty folders"],["読み込んだフォルダは空です","The scanned folder is empty"],["（中で一番大きいファイル：","(largest file inside: "],["（再スキャンしてください）","(please rescan)"],["」は再生できませんでした","\" couldn't be played"],["いま動いているバージョン","Running version"],["このステップでできること","What this step does"],["このプレビューの中で再生","Play inside this preview"],["すべてのフォルダを開く（","Expand all folders ("],["キーで一番上へ戻れます）"," key)"],["チェックしたものを削除（","Delete checked ("],["一致するものはありません","Nothing matches"],["仕分けは完了しています。","Sorting is done."],["同じファイル名でまとめる","Group by identical file name"],["名前を変更（Enter）","Rename (Enter)"],["整理（1〜7のステップ）","Organize (steps 1–7)"],["最新の状態を読み込み直す","Rescan for the latest state"],["片付けは完了しています。","Tidying up is done."],["読み込みに失敗しました：","Scan failed: "],["（パスをコピーしました）","(path copied)"],["🔍 フォルダ名で絞り込み","🔍 Filter by folder name"],["いま開いているフォルダ","Current folder"],["この組のチェックを削除","Delete checked in this group"],["でフォルダを最上位に（"," makes a folder the top level ("],["など）が入ったファイル"," etc.)"],["の中身 → 1 つ上の"," contents → up into"],["シリーズ／分割の番号（","Series / part numbers ("],["チェックしたものを削除","Delete checked"],["チェックしたものを変更","Rename checked"],["チェックしたものを実行","Run checked"],["リスト表示（1 キー）","List view (key 1)"],["中身が空の同名フォルダ","Empty same-name folder"],["作品と関係ないファイル","Files unrelated to works"],["作品を仕分けしました。"," works sorted."],["場所をコピーしました：","Location copied: "],["外部プレーヤーで再生：","Played in external player: "],["絞り込み（品番・名前）","Filter (work ID, name)"],["認証の確認が必要です（","Verification needed ("],["読み込み中… フォルダ","Scanning… folders"],["読み込み完了：フォルダ","Scan complete: folders"],["（同じ名前があったため"," (same names existed, so"],["(1)を外しています","Removing (1)"],["(1)を外す・片付け","Remove (1) / tidy up"],["/ ダブルクリック）","/ double-click)"],["1〜7 をすべて表示","Show steps 1–7"],["1〜7の流れで続ける","Continue with steps 1–7"],["FC2-PPV-品番","FC2-PPV-ID"],["FC2のファイル名を","FC2 file names are aligned to "],["↗ 外部プレーヤー（","↗ External player ("],["オフ（使わない設定）","Off (not used)"],["チェック（削除する）","Checked (to delete)"],["ファイルマネージャー","File manager"],["ファイル名を変更中…","Renaming files…"],["プレビューの中で再生","Play in the preview"],["プレーヤー画面で再生","Play in the player"],["ログを消去しますか？","Clear the log?"],["一番上の一覧へ戻る（","Back to the overview ("],["不要ファイルの判定：","Junk detection: "],["不要ファイルの除外を","Junk exclusion: "],["再生のしかたの設定…","Playback settings…"],["削除を停止しました（","Deletion stopped ("],["削除を停止しました：","Deletion stopped: "],["名前を変更しました：","Renamed: "],["外部プレーヤーで再生","Play in external player"],["外部プレーヤーで開く","Open in external player"],["本 ／ 新規フォルダ"," files / new folders "],["移動を停止しました：","Move stopped: "],["空フォルダをゴミ箱へ","Empty folders to trash"],["読み込み後に使えます","Available after scanning"],["（自動で回復します）"," (recovering automatically)"],["⤓ ここを最上位に","⤓ Make top level"],["このステップを使う","Use this step"],["エラーや処理の記録","Errors and activity log"],["サイズが近い組あり","Has near-size matches"],["サイズが近い組だけ","Near-size groups only"],["チェック＝削除する","Checked = delete"],["ファイル名の整理を","File-name cleanup: "],["ファイル名を整える","Clean file names"],["フォルダを作成中…","Creating folder…"],["フォルダ一覧で削除","Deleted in Folders"],["フォルダ一覧で移動","Moved in Folders"],["フォルダ名を揃える","Align folder names"],["プレビューで再生：","Played in preview: "],["ホバーでサムネイル","Hover thumbnails"],["不要ファイルの削除","Junk file deletion"],["不要ファイルを削除","Delete junk files"],["中身が空のフォルダ","Empty folder"],["再生できない画質：","Unplayable quality: "],["再生のしかたの設定","Playback settings"],["最大＝高画質の候補","Largest = best quality candidate"],["直下にファイルなし","No files directly inside"],["重複はありません。","No duplicates."],["項目（中のファイル"," items (files inside: "],["🔍 名前で絞り込み","🔍 Filter by name"],["⛶ 全画面で再生","⛶ Play full screen"],["、タイトル末尾の",", title-end "],["」が既にあります","\" already exists"],["」へ移動しました","\""],["で中もすべて）・"," for all inside) · "],["で新規フォルダ・"," new folder · "],["エクスプローラー","Explorer"],["ゴミ箱に入れる（","Move to trash ("],["ダブルクリックや","double-click, "],["ファイル名の整理","File-name cleanup"],["フォルダ名の変更","Folder renames"],["件を削除します（"," files will be deleted ("],["件を実行しました"," done"],["作品ごとに仕分け","Sort by work"],["作業を選んで開く","Open a single task"],["先頭1件だけ試す","Try the first one"],["再生のしかたを「","Playback set to \""],["名前を変更中…：","Renaming…: "],["変更するファイル","Files to rename"],["変更（重複回避）","Rename (avoid clash)"],["外部プレーヤー（","External player ("],["整理（1〜7）へ","Organize (1–7)"],["記録はありません","No entries"],["重複を比べて削除","Compare duplicates"],["閉じる（Esc）","Close (Esc)"],["（空のフォルダ）","(empty folder)"],["＋ 新規フォルダ","＋ New folder"],["↻ 再スキャン","↻ Rescan"],["▤ サムネイル","▤ Thumbnails"],["▶ ここで再生","▶ Play here"],["✎ 名前を変更","✎ Rename"],["⤒ 一覧へ戻る","⤒ Back to overview"],["⤢ プレーヤー","⤢ Player"],["すべてチェック","Check all"],["で名前の変更・"," rename · "],["の形で残します"," form"],["まずはここから","Start here"],["コピーしました","Copied"],["ゴミ箱に入れる","Move to trash"],["サイズ(MB)","Size (MB)"],["リンクをコピー","Copy link"],["再生の準備中…","Preparing playback…"],["名前を変更中…","Renaming…"],["完了（閉じる）","Done (close)"],["宣伝向けの名前","Promo-style names"],["新規フォルダ（","New folder ("],["既存フォルダへ","Into existing folder"],["最上位を変更中","Custom top level"],["要確認・対象外","Needs review / skipped"],["読み込み画面へ","To the scan screen"],["読み込んでから","Scan first"],["項目・ファイル"," items · files"],["(1)を外す","Remove (1)"],["10MB以下","10 MB or less"],["✓ 該当なし","✓ None"],["」にしました","\""],["おまかせ整理","Guided organize"],["すべて仕分け","Sort all"],["ゴミ箱へ移動","moved to trash"],["スキャン起点","Scan root"],["スキャン開始","Start scan"],["テキスト保存","Save as text"],["フォルダ一覧","Folders"],["使わない設定","Not used"],["全画面で再生","Play full screen"],["全画面（F）","Full screen (F)"],["再生のしかた","Playback"],["前のビデオ（","Previous video ("],["同じ場所に「","Same location already has \""],["場所をコピー","Copy location"],["変更するもの","To rename"],["字幕ファイル","Subtitle file"],["広告・宣伝（","Ad ("],["強制削除する","Force delete"],["新規フォルダ","New folder"],["既定のアプリ","Default app"],["次のビデオ（","Next video ("],["読み込み中…","Scanning…"],["読み込み済み","scanned"],["項目を選択（"," items selected ("],["項目完了）："," items done): "],["（フォルダ）"," (folder)"],["／ ファイル"," / files"],["／ 一致済み"," / already matching"],["／ 重複回避"," / clash avoided"],["🗑 ゴミ箱へ","🗑 To trash"],[") を付与",")"],["CSV保存","Save CSV"],["↪ 移動…","↪ Move…"],["⊞ 全展開","⊞ Expand all"],["⊟ 全格納","⊟ Collapse all"],["▦ タイル","▦ Tiles"],["▶ 再生（","▶ Play ("],["☰ リスト","☰ List"],["⛶ 全画面","⛶ Full screen"],["おすすめ：","Suggested: "],["ここへ移動","Move here"],["しました。","."],["すべて変更","Rename all"],["すべて外す","Uncheck all"],["キャンセル","Cancel"],["コピー失敗","Copy failed"],["ファイル名","File name"],["ファイル）"," files)"],["プレビュー","Preview"],["・おすすめ"," · suggested"],["・強制削除"," · force delete"],["仕分け中…","Sorting…"],["件・対象外"," · skipped"],["作品完了）"," works done)"],["再読み込み","Rescan"],["名前を変更","Rename"],["場所を開く","Open location"],["完全に削除","permanently deleted"],["広告・宣伝","Ads"],["最大比 -","vs. largest -"],["未読み込み","Not scanned"],["組を含む）"," groups)"],["読み込み：","Scanned: "],["（強制削除"," (force delete"],["▶ 再生","▶ Play"],["✓ 完了","✓ Done"],["おすすめ","Suggested"],["など）は"," etc.) "],["まとめ方","Grouping"],["イメージ","Image"],["エラー：","Error: "],["ドラッグ","Drag"],["ファイル","Files"],["フォルダ","Folders"],["件完了）"," done)"],["作業あり","To do"],["削除する","Delete"],["削除中…","Deleting…"],["変更なし","Unchanged"],["完全削除","permanent"],["対象なし","Nothing to do"],["移動中…","Moving…"],["読み込む","Scan"],["項目 →"," items →"],["項目を「"," items to \""],["（変換）"," (converted)"],["（未定）","(undecided)"],["（要確認"," (needs review"],["表示言語","Language"],["しました",""],["すべて","All"],["に変更"," changed"],["エラー","Error"],["コピー","Copy"],["ゴミ箱","Trash"],["サイズ","Size"],["ビデオ","Video"],["ホーム","Home"],["・変換"," · converted"],["仕分け","Sorting"],["件）・"," files) · "],["停止：","Stopped: "],["再生：","Play: "],["場所：","Location: "],["外部：","External: "],["次へ：","Next: "],["片付け","Tidy up"],["移動…","Move…"],["要確認","Needs review"],["閉じる","Close"],["項目・"," items · "],["項目（"," items ("],["項目）"," items)"],["項目を"," items were "],["オフ","Off"],["オン","On"],["ログ","Log"],["一覧","Overview"],["不要","Junk"],["中断","Stop"],["作品","work"],["保存","Save"],["削除","Delete"],["前回","Last"],["名前","Name"],["場所","Location"],["変更","Rename"],["字幕","Subtitles"],["整理","Organize"],["書類","Document"],["残す","Keep"],["残り","Remaining"],["消去","Clear"],["移動","Move"],["種類","Kind"],["重複","Duplicates"],["開く","Open"],["項目","Items"],[" 風","-style"],["件を"," items were "],["未","Not yet"],["風","-style"]];
  EN.push(...[["テーマ", "Theme"], ["ライト", "Light"], ["ダーク", "Dark"], ["自動", "Auto"], ["自動（OS の設定に合わせる）", "Auto (follow the OS setting)"], ["設定", "Settings"], ["設定（表示・再生・整理・情報）", "Settings (display, playback, organizing, about)"], ["名前で絞り込み", "Filter by name"], ["使用中", "used"], ["その他", "Other"], ["契約容量", "Plan capacity"], [" 使用 / 上限 ", " used / limit "], ["未スキャン", "Not scanned"], ["内の割合", "share"], ["使用量に占める割合", "Share of usage"], ["使用量全体に対する割合（まだ読み込んでいないフォルダがあるため）", "Share of total usage (some folders are not scanned yet)"], ["表示中のフォルダの中での割合", "Share within the shown folder"], ["1 つ上の階層へ（", "Up one level ("], ["1 つ上の階層へ", "Up one level"], ["（未スキャンのフォルダを除く）", " (excluding unscanned folders)"], ["契約容量比 ", "of plan "], ["・全体比 ", " · of total "], ["選択中", "Selected"], ["項目を選ぶと、再生・名前の変更・移動・ゴミ箱が使えます（右クリックでもメニューを開けます）", "Select items to play, rename, move or trash them (right-click also opens the menu)"], ["読み込んだ場所とその上のフォルダは、ここでは移動できません", "The scanned folder and the folders above it can't be moved here"], ["読み込んだ場所とその上のフォルダは、ここではゴミ箱に入れられません", "The scanned folder and the folders above it can't be trashed here"], ["上の階層を確認しています…", "Checking parent folders…"], ["上の階層を読み込めませんでした：", "Couldn't load parent folders: "], ["これより上の階層はありません", "There is no level above this"], ["表示", "Display"], ["再生", "Playback"], ["情報", "About"], ["右上のボタンと同じ設定です", "Same as the buttons at the top right"], ["自動（ブラウザ）", "Auto (browser)"], ["フォルダ一覧の表示", "Folders view"], ["フォルダ一覧の操作", "Folders controls"], ["▶ 再生ボタン・ダブルクリックのとき", "▶ Play button / double-click"], ["更新履歴", "Changelog"], ["ログを表示", "Show log"], ["見る・再生・名前の変更・移動", "Browse · play · rename · move"], ["Dedupe スキャン", "Dedupe scan"], ["重複・不要ファイルを読み込んで整理", "Scan, then clean up duplicates and junk files"], ["前回の操作でエラーが ", "Errors in recent actions: "], ["件あります", ""], ["確認", "Review"], ["閉じる（Esc）", "Close (Esc)"]]);
  EN.push(...[["販売者ごとに仕分け", "Sort by seller"], ["作品フォルダの品番から販売者を調べ、ホーム/販売者別/販売者名（販売者ID）/ へ移動します。調べるだけでは何も動かしません（使うかどうかを選べます）。", "Looks up the seller of each work folder by its ID and moves it to Home/By seller/Seller (ID)/. Looking up alone moves nothing (optional)."], ["販売者が決まった", "Seller found"], ["販売者不明", "Unknown seller"], ["未調査", "Not looked up"], ["販売者を調べる（未調査 ", "Look up sellers (not looked up: "], ["販売者を変更", "Change seller"], ["販売者を入力", "Enter seller"], ["fd2ppv.cc で開く", "Open on fd2ppv.cc"], ["今の場所：", "Now in: "], ["新しく作るフォルダ", "New folder"], ["既にあるフォルダ", "Existing folder"], ["チェックしたものを移動（", "Move checked ("], ["手入力できます", "Can be entered manually"], ["品番が複数・同名あり", "Several IDs / same name"], ["「販売者を調べる」で調べます", "Use \"Look up sellers\""], ["販売者名", "Seller name"], ["入力を消す", "Clear input"], ["まとめるフォルダ", "Container folder"], ["ホームの直下に作ります", "Created directly under Home"], ["販売者が分からないとき", "When the seller is unknown"], ["判断できないとき", "When it can't be decided"], ["調べる間隔", "Lookup interval"], ["調べた結果", "Lookup results"], ["手入力", "manual"], ["fd2ppv.cc で確認", "Confirmed on fd2ppv.cc"], ["fd2ppv.cc にページがありません", "No page on fd2ppv.cc"], ["販売者の欄がありません", "No seller field"], ["ホームから読み込んでいません。", "Not scanned from Home."]]);
  EN.push(...[["fc2cmadb.com で確認", "Confirmed on fc2cmadb.com"], ["fd2ppv.cc で確認（配信元）", "Confirmed on fd2ppv.cc (studio)"], ["fd2ppv.cc・fc2cmadb.com に見つかりません", "Not found on fd2ppv.cc or fc2cmadb.com"], ["fd2ppv.cc に見つかりません", "Not found on fd2ppv.cc"], ["fc2cmadb.com で開く", "Open on fc2cmadb.com"], ["fd2ppv.cc で探す（", "Search on fd2ppv.cc ("], ["同じ番号の作品が複数のサイトにあります（名前にサイト名を入れるか、販売者を入力）", "The same number exists on several sites (add the site name to the folder name, or enter the seller)"], ["販売者名（配信元。例：カリビアンコム）", "Seller name (studio, e.g. Caribbeancom)"], ["販売者ID（英数字。例：carib）", "Seller ID (letters/digits, e.g. carib)"], ["✓ 仕分けが必要な作品フォルダはありません（FC2-PPV-品番・HEYZO・カリビアンコムなどの品番の名前のフォルダが対象です）", "✓ No work folders to sort (folders named with an FC2-PPV, HEYZO, Caribbeancom or similar ID are targets)"]]);
  EN.push(...[["全画面で開く", "Open full screen"], ["ポップアップに戻す", "Back to popup"], ["次から全画面で開く", "Always open full screen"], ["PikPak の画面を Dedupe に切り替えて使うこともできます。一覧が広くなり、キー操作やドラッグも使いやすくなります。", "You can also switch the PikPak screen to Dedupe. Lists get wider, and keys and dragging are easier to use."], ["開き方", "How to open"], ["ポップアップ（おすすめ）", "Popup (recommended)"], ["全画面", "Full screen"], ["PikPak の画面の上に重ねて開きます。動かしたり大きさを変えたりでき、後ろの PikPak もそのまま使えます", "Opens on top of PikPak. You can move and resize it, and keep using PikPak behind it"], ["PikPak の画面を Dedupe に切り替えます（今までの開き方）", "Switches the PikPak screen to Dedupe (the previous way)"], ["次からは全画面で開きます（設定の「表示」→「開き方」で戻せます）", "Will open full screen from now on (change it in Settings → Display → How to open)"]]);
  EN.push(...[["品番から判定", "From the ID"], ["サイトで確認", "Confirmed on a site"], ["名前の「", "From \""], ["」から判定", "\" in the name"], ["日付型の品番だけで、名前にサイト名がありません（名前に 1pon・carib などがあれば自動で決まります）", "Only a date-style ID and no site name (names containing 1pon, carib, etc. are decided automatically)"], ["同じ番号の作品が複数のサイトにあります", "The same number exists on several sites"], ["外部サイトで確かめる", "Check on other sites"], ["外部サイト ▾", "Other sites ▾"], ["分かったら、行の入力欄に販売者名と ID を入れて「保存」", "When you find it, enter the seller name and ID in the row and press Save"], ["調べ直す", "Look up again"], ["販売者を調べる", "Look up sellers"], ["確かめる・入力", "Check & enter"], ["移動", "Move"], ["未調査はありません", "Nothing left to look up"], ["分からないものはありません", "Nothing unknown"], ["件は販売者が分かりませんでした。外部サイトで確かめて入力してください", " could not be identified. Check other sites and enter the seller"], ["このまま ③ 移動へ", "Go to ③ Move as is"], ["② に戻る", "Back to ②"], ["移動するもの ", "To move: "], ["チェックの入った作品がありません", "No works are checked"], ["先頭1件だけ試す", "Try the first one"], ["決まった", "Decided"], ["自動では移動しません（初めはチェックなし）", "Not moved automatically (unchecked at first)"], ["入力すると、その販売者の組へ移ります", "Enter a seller to move it to that group"], ["販売者名と販売者ID（英数字）を入れてください", "Enter the seller name and seller ID (letters/digits)"], ["件を確かめる", " to check"], ["分からない ", "Unknown: "]]);
  EN.push(...[["残り時間を計算中…", "Estimating time left…"], ["まもなく完了", "Almost done"], ["あと約 ", "About "], ["（目安・前回 ", "(estimate, last time "], ["（目安）", "(estimate)"], ["実行中…", "Running…"], ["中断すると、そこまでの分は反映されます", "If you stop, what has been done so far is kept"], ["削除するもの ", "To delete: "], ["PikPak のゴミ箱へ移動します", "Moves to the PikPak trash"], ["チェックの入ったファイルがありません", "No files are checked"], ["削除するものにチェックを入れてください", "Check the files to delete"], ["表示中 ", "Showing "], ["チェックした（削除の）ファイルを PikPak のゴミ箱へ移動します", "Moves the checked (delete) files to the PikPak trash"], ["対象 ", "Targets: "], ["まずは「先頭1件だけ試す」で動きを確かめてください", "First check how it works with \"Try the first one\""], ["下の「画質」で別の画質を試せます。", "Try another quality from the quality menu below."]]);
  EN.push(...[["（残り ", "(left "], ["リンク・マグネットを追加", "Add links / magnets"], ["追加する前に、もうあるか確かめる", "Checks whether you already have it before adding"], ["中身を確認", "Check contents"], ["もうあります", "Already have"], ["すべて保存", "Save all"], ["一部だけ保存", "Save selected only"], ["キャッシュなし", "No cache"], ["中身を確認中…", "Checking contents…"], ["中身を確認できません", "Can't check contents"], ["追加するもの ", "To add: "], ["追加するものがありません", "Nothing to add"], ["PikPak の既定の保存先（My Pack）", "PikPak default location (My Pack)"], ["保存先", "Save to"], ["🔗 リンクを追加", "🔗 Add links"], ["ここにリンクを追加…", "Add links here…"], ["リンク・マグネットを追加…", "Add links / magnets…"]]);
  EN.push(...[["▦ コマ一覧", "▦ Frames"], ["▦ コマで比べる", "▦ Compare frames"], ["▦ 2 本をコマで比べる", "▦ Compare 2 videos by frames"], ["コマ一覧", "Frames"], ["同じ位置のコマを左右に並べています", "Frames at the same positions, side by side"], ["▶ 選んだコマから再生", "▶ Play from selected frame"], ["画像で保存", "Save as image"], ["動画を読み込んでいます…", "Loading video…"], ["コマを作っています… ", "Making frames… "], ["コマを作れませんでした：", "Could not make frames: "], ["この動画はブラウザの制限でコマを作れません", "The browser does not allow frames for this video"], ["再生速度：", "Speed: "], ["残す", "Keep"], [" コマ", " frames"]]);
  EN.push(...[["名前で絞り込み・検索", "Filter / search by name"], ["このフォルダ", "This folder"], ["すべて", "All"], ["行を押すとその場所を開きます", "Click a row to open its location"], ["名前とパスで探しています", "searching names and paths"], ["書き出し／読み込み", "Export / import"], ["別のブラウザやパソコンへ移すときに使います（ログイン情報は含めません）", "Use this to move to another browser or PC (login info is not included)"], ["書き出す（.json）", "Export (.json)"], ["読み込む…", "Import…"], ["販売者の調査結果と手入力", "Seller lookups and manual entries"], ["重複の判断（残す・削除の記録）", "Duplicate decisions (keep / delete)"], ["解凍パスワード", "Archive passwords"], ["読み込む内容", "What to import"], ["今のものに足す（同じものは読み込んだ方を優先）", "Add to the current data (imported wins on conflicts)"], ["置き換える", "Replace"]]);
  EN.push(...[["まず PikPak の中身を読み込みます", "First, load your PikPak contents"], ["フォルダとファイルの一覧を読み込んで、重複や不要ファイルを見つけます。", "Loads the list of folders and files to find duplicates and unneeded files. "], ["読むだけで、ファイルは何も変更しません。", "It only reads; nothing is changed."], ["読み込みを始める", "Start loading"], ["あとで", "Later"], ["次からは確認しない", "Don't ask again"], ["リンクを追加", "Add links"], ["リンク", "Links"], ["販売者を調べています", "Looking up sellers"], ["一時停止", "Pause"], ["再開", "Resume"], ["分かった ", "Found "], ["分からない ", "Unknown "], ["横向きにすると見やすくなります", "Rotate to landscape for a better view"], ["このまま使う", "Use as is"], ["残り ", "Left "]]);
  EN.push(...[["📦 解凍", "📦 Extract"], ["解凍できます", "Can be extracted"], ["パスワードが必要です", "Password required"], ["パスワードが違います", "Wrong password"], ["記録したパスワードで開けました", "Opened with a saved password"], ["解凍できたら元の圧縮ファイルをゴミ箱へ", "Move the archive to trash after extracting"], ["解凍するもの ", "To extract: "], ["件を解凍", " to extract"], ["試す", "Try"]]);
  EN.push(...[["仕分け後の確認：置き場所が違う", "After-sort check: wrong place"], ["置き場所の修正", "Fix placement"], ["同じ品番が複数", "Same ID in several places"], ["同じ品番のフォルダが複数（確認用）", "Same ID in several folders (for review)"], ["販売者違い", "Wrong seller"], ["置き場所違い", "Wrong place"], ["販売者が判明", "Seller found"], ["重複", "Duplicate"]]);
  EN.sort((a, b) => b[0].length - a[0].length); // 長い言い回しから先に置き換える
  const EN_MAP = new Map(EN);
  const EN_UNIT = EN.filter(([a]) => a.length > 1 && /^(件|項目|組|作品|本)./.test(a));
  // 1 語だけで表示される単位・見出し（文の途中では訳さない）
  const EN_ONE = { 件: 'items', 組: 'groups', 作品: 'works', 本: 'files', 項目: 'Items', 'フォルダ': 'Folders', '例：': 'e.g.: ', 'フォルダ一覧': 'Folders', 'フォルダ​一覧': 'Folders' };
  // 列ごとの訳し分け（種類の列は単数形）
  const EN_COL = { 'c-kind': { フォルダ: 'Folder', ビデオ: 'Video', イメージ: 'Image', 字幕: 'Subtitles' } };
  const HAS_JA = /[\u3040-\u30ff\u4e00-\u9fff\uff01-\uff5e]/;
  const trCache = new Map();
  function tr(t) {
    if (LANG !== 'en' || !t || !HAS_JA.test(t)) return t;
    if (trCache.has(t)) return trCache.get(t);
    const k = t.trim();
    const pl = (one, many) => (m, n) => n + ' ' + (n === '1' ? one : many);
    let s = EN_ONE[k] ? t.replace(k, EN_ONE[k]) : EN_MAP.has(k) ? t.replace(k, EN_MAP.get(k)) : t;
    if (s === t) {
      // 単位で始まる言い回し（「件のフォルダ名を変更しました」など）を先に訳し、残った数＋単位を訳す（「3 項目」→「3 items」）
      for (const [a, b] of EN_UNIT) if (s.includes(a)) s = s.split(a).join(b);
      s = s.replace(/(\d[\d,]*)\s*(?:件|項目)/g, pl('item', 'items')).replace(/(\d[\d,]*)\s*組/g, pl('group', 'groups')).replace(/(\d[\d,]*)\s*作品/g, pl('work', 'works')).replace(/(\d[\d,]*)\s*本/g, pl('file', 'files')).replace(/(\d[\d,]*)\s*秒/g, '$1 s');
      for (const [a, b] of EN) if (s.includes(a)) s = s.split(a).join(b);
    }
    s = s.replace(/（/g, ' (').replace(/）/g, ')').replace(/：/g, ': ').replace(/。/g, '. ').replace(/、/g, ', ').replace(/・/g, ' · ').replace(/／/g, ' / ').replace(/[「」]/g, '"').replace(/？/g, '?').replace(/＝/g, ' = ')
      .replace(/ {2,}/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')').replace(/(^|[^\d.,])1 (item|file|group|work)s\b/g, '$11 $2');
    if (trCache.size > 5000) trCache.clear();
    trCache.set(t, s);
    return s;
  }
  // ファイル名・フォルダ名など、利用者のデータを表示している場所は訳さない
  const RAW_SEL = '.nm,.pd-name,.pd-path,.hv-n span,.ql-h b,.pl-h b,.mv-r span,.tl-h b,.tl-h .pp,.tr-path [data-tbase]:not([data-root]),.raw,textarea,option[data-raw]';
  const UI_SEL = '#ppdup,#ppdup-fab,#ppdup-btn,#pd-dlg,#pd-ctx,#pd-ql,#pd-player,#pd-hover,#pd-drag,#pd-set';
  const ATTRS = ['title', 'placeholder', 'aria-label'];
  function trNode(n) {
    if (n.nodeType === 3) {
      const p = n.parentElement; if (!p || p.matches(RAW_SEL) || !p.closest(UI_SEL)) return;
      if (n.__en === n.data) return;
      if (!HAS_JA.test(n.data)) return;
      n.__ja = n.data;
      const col = Object.keys(EN_COL).find((c) => p.classList.contains(c));
      const t = col && EN_COL[col][n.data.trim()] ? EN_COL[col][n.data.trim()] : tr(n.data);
      if (t !== n.data) { n.__en = t; n.data = t; }
    } else if (n.nodeType === 1) {
      if (!n.closest(UI_SEL)) return;
      if (!n.matches(RAW_SEL)) ATTRS.forEach((a) => { const v = n.getAttribute(a); if (v && HAS_JA.test(v) && (!n.__enA || n.__enA[a] !== v)) { (n.__jaA = n.__jaA || {})[a] = v; const t = tr(v); (n.__enA = n.__enA || {})[a] = t; n.setAttribute(a, t); } });
      const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
      let c = w.nextNode();
      while (c) {
        if (c.nodeType === 3) trNode(c);
        else if (!c.matches(RAW_SEL)) ATTRS.forEach((a) => { const v = c.getAttribute(a); if (v && HAS_JA.test(v) && (!c.__enA || c.__enA[a] !== v)) { (c.__jaA = c.__jaA || {})[a] = v; const t = tr(v); (c.__enA = c.__enA || {})[a] = t; c.setAttribute(a, t); } });
        c = w.nextNode();
      }
    }
  }
  const langObs = new MutationObserver((ms) => {
    if (LANG !== 'en') return;
    ms.forEach((m) => {
      if (m.type === 'characterData') trNode(m.target);
      else if (m.type === 'attributes') trNode(m.target);
      else m.addedNodes.forEach(trNode);
    });
  });
  langObs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  function setLang(l) {
    try { localStorage.setItem(LS_LANG, l); } catch (e) { /* 無視 */ }
    LANG = resolveLang(); trCache.clear();
    // 元の日本語に戻してから、いまの画面を描き直す
    document.querySelectorAll(UI_SEL).forEach((el) => {
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
      let c = el;
      while (c) {
        if (c.nodeType === 3 && c.__ja !== undefined && c.__en === c.data) { c.data = c.__ja; c.__en = undefined; }
        if (c.nodeType === 1 && c.__jaA) { Object.keys(c.__jaA).forEach((a) => { if (c.__enA && c.getAttribute(a) === c.__enA[a]) c.setAttribute(a, c.__jaA[a]); }); c.__enA = null; }
        c = w.nextNode();
      }
    });
    renderLangBtn(); renderThemeSeg(); if (document.getElementById('pd-set')) renderSettings();
    if (LANG === 'en') document.querySelectorAll(UI_SEL).forEach(trNode);
    if (root.classList.contains('on') && !busy) setView(view);
    if (fab.classList.contains('on')) renderFab();
  }
  function renderLangBtn() { const n = root.querySelector('[data-r=langname]'); if (n) n.textContent = LANG === 'en' ? 'English' : '日本語'; const b = root.querySelector('[data-a=lang]'); if (b) { b.removeAttribute('title'); b.title = LANG === 'en' ? 'Display language (switch to Japanese)' : '表示言語（English に切り替え）'; } }
  // ---------- テーマ（ライト／ダーク／自動＝OS に合わせる） ----------
  const LS_THEME = 'ppdup:theme:v1';
  const themePref = () => { try { const v = localStorage.getItem(LS_THEME); return v === 'light' || v === 'dark' ? v : 'auto'; } catch (e) { return 'auto'; } };
  const darkMQ = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function renderThemeSeg() {
    const el = root.querySelector('[data-r=theme]'); if (!el) return;
    const p = themePref();
    el.innerHTML = [['light', IC.sun, 'ライト'], ['dark', IC.moon, 'ダーク'], ['auto', '', '自動']].map(([k, ic, l]) => `<button data-a="theme" data-v="${k}" class="${p === k ? 'on' : ''}" aria-pressed="${p === k}" title="${k === 'auto' ? '自動（OS の設定に合わせる）' : l}">${ic || l}</button>`).join('');
  }
  function applyTheme() {
    const p = themePref();
    document.documentElement.classList.toggle('pd-dark', p === 'dark' || (p === 'auto' && !!(darkMQ && darkMQ.matches)));
    renderThemeSeg();
  }
  function setTheme(t) { try { localStorage.setItem(LS_THEME, t); } catch (e) { /* 無視 */ } applyTheme(); if (document.getElementById('pd-set')) renderSettings(); }
  if (darkMQ) { try { darkMQ.addEventListener('change', applyTheme); } catch (e) { if (darkMQ.addListener) darkMQ.addListener(applyTheme); } }
  const $ = (s) => root.querySelector(s);
  // 状態表示（ratio を渡すと進捗バーを出す）
  const status = (t, ratio, sub) => {
    const st = $('[data-r=status]'); st.textContent = t || ''; st.title = t || '';
    const busy = typeof ratio === 'number';
    $('[data-r=prog]').classList.toggle('busy', busy);
    if (busy) {
      const pct = Math.max(0, Math.min(100, ratio * 100));
      $('[data-r=pbar]').style.width = Math.max(2, pct).toFixed(1) + '%';
      // ゲージの横に、進んだ割合と残りの割合を出す
      const done = Math.min(99, Math.floor(pct));
      $('[data-r=ppct]').textContent = `${done}%`;
      $('[data-r=psub]').textContent = `残り ${100 - done}%${sub ? '・' + sub : ''}`;
    } else { $('[data-r=ppct]').textContent = ''; $('[data-r=psub]').textContent = ''; }
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
  let mode = 'flow'; // flow＝1〜7の流れで表示／single＝1つの作業だけを表示
  let afterScan = null; // 読み込み後に開く作業
  let nplan = [];
  const nameOff = new Set(); // ファイル名の整理でチェックを外した項目
  const nameEnabled = () => { try { return localStorage.getItem(LS_OPT_NAME) !== '0'; } catch (e) { return true; } };
  const junkEnabled = () => { try { return localStorage.getItem(LS_OPT_JUNK) !== '0'; } catch (e) { return true; } };
  let jplan = [];
  const junkSel = new Map(); // 不要ファイルのチェック（変更したものだけ記録。未記録は del＝あり／review＝なし）
  const junkChecked = (p) => (junkSel.has(p.id) ? junkSel.get(p.id) : p.level === 'del');
  // ほかのステップで使うファイル（オンのときは「作品と関係ない」と判断したものを除く）
  const workFiles = () => (junkEnabled() ? (prepJunk(files, folders), files).filter((f) => { const j = junkInfo(f); return !j || j.level !== 'del'; }) : files);


  // ---------- ログイン切れの自動回復 ----------
  // 放置してPikPakのログイン情報の期限が切れたら、画面を再読み込みして更新させ、Distillを開き直す
  function reloadForSession(resume) {
    let prev = null; try { prev = JSON.parse(sessionStorage.getItem(SS_RESUME) || 'null'); } catch (e) { prev = null; }
    let g = null; try { g = JSON.parse(localStorage.getItem('ppdup:reloadguard:v1') || 'null'); } catch (e) { g = null; }
    const recent = g && Date.now() - g.at < 10 * 60 * 1000 ? g.n : 0;
    const count = Math.max(prev && Date.now() - prev.at < 5 * 60 * 1000 ? (prev.count || 0) + 1 : 1, recent + 1);
    try { localStorage.setItem('ppdup:reloadguard:v1', JSON.stringify({ at: Date.now(), n: count })); } catch (e) { /* 無視 */ }
    if (count > 2) { // 再読み込みしても直らない場合はループさせない（10 分の間に 2 回まで）
      log('error', '再読み込み後もログイン情報が更新されません', JSON.stringify(resume));
      status('PikPakへの再ログインが必要な可能性があります。PikPakの画面で一度ログインし直してから、もう一度お試しください。');
      try { sessionStorage.removeItem(SS_RESUME); } catch (e) { /* 無視 */ }
      return;
    }
    log('warn', 'ログイン期限切れのため画面を再読み込み', JSON.stringify(resume));
    try { sessionStorage.setItem(SS_RESUME, JSON.stringify({ ...resume, at: Date.now(), count })); } catch (e) { /* 無視 */ }
    status('ログインの有効期限が切れていたため、PikPakの画面を再読み込みします…', 0.5);
    setTimeout(() => location.reload(), 1200);
  }
  // 操作の前にログインの有効期限を確認（切れていれば再読み込みして続きから）
  function ensureSession(action) {
    if (sessionValid() || readCred()) return true; // 期限が切れて見えても、まずは通信してみる（切れていれば PikPak の返事で分かる）
    reloadForSession({ view, action, mode });
    return false;
  }
  // 処理中のエラーがログイン切れなら再読み込み、それ以外はログに残して表示
  function handleErr(err, action, msg) {
    if (err && err.session) { reloadForSession({ view, action, mode }); return; }
    log('error', msg || (err && err.message), action);
    status(msg || ('エラー：' + (err && err.message)));
    updateLogBadge();
  }
  async function resumeAfterReload() {
    let r = null; try { r = JSON.parse(sessionStorage.getItem(SS_RESUME) || 'null'); } catch (e) { r = null; }
    if (!r || Date.now() - r.at > 2 * 60 * 1000) return;
    mode = r.mode || 'flow'; root.classList.toggle('single', mode === 'single');
    showRoot();
    setView(r.view || 'scan');
    status('画面を再読み込みしました。ログイン情報の更新を待っています…', 0.3);
    // 期限の直前に再読み込みした場合、PikPak画面は期限が切れるまで更新しないので、そこまで待つ（最大4分）
    const t0 = Date.now();
    const c0 = readCred();
    const limit = Math.min(4 * 60 * 1000, Math.max(30 * 1000, c0 && c0.expiresAt ? c0.expiresAt - t0 + 30 * 1000 : 0));
    while (!sessionValid() && !cap.auth && Date.now() - t0 < limit) {
      const left = Math.ceil((limit - (Date.now() - t0)) / 1000);
      status(`画面を再読み込みしました。ログイン情報の更新を待っています…（最大 あと ${left} 秒）`, (Date.now() - t0) / limit);
      await sleep(1000);
    }
    if (!sessionValid() && !readCred()) { reloadForSession(r); return; }
    try { sessionStorage.removeItem(SS_RESUME); localStorage.removeItem('ppdup:reloadguard:v1'); } catch (e) { /* 無視 */ }
    log('info', 'ログイン情報を更新して再開', JSON.stringify(r));
    if (r.action === 'scan') { runScan(); return; } // 読み込みは読み取りだけなので自動で再開
    setView(r.view || 'scan');
    status(r.action ? 'ログイン情報を更新しました。途中まで完了した分は保存済みです。もう一度ボタンを押すと続きから実行します。' : 'ログイン情報を更新しました。');
  }
  // 画面を開いたまま放置した場合も、期限切れを検知したら自動で再読み込み
  // （以前は 1 分ごとに期限を確かめて自動で再読み込みしていたが、PikPak が保存領域を更新しないと止まらなくなるためやめた）

  // ---------- ログ表示 ----------
  function updateLogBadge() {
    const seen = +(localStorage.getItem(LS_LOGSEEN) || 0);
    const n = readLog().filter((x) => x.level === 'error' && x.t > seen).length;
    $('[data-r=logbadge]').textContent = n ? String(n) : '';
  }
  function showLog() {
    const logs = readLog().slice().reverse();
    const fmtT = (t) => new Date(t).toLocaleString(loc());
    const text = () => `PikPak Distill ${VER} / ${navigator.userAgent}\n` + readLog().map((x) => `${fmtT(x.t)} [${x.level}] ${x.msg}${x.ctx ? ' | ' + x.ctx : ''}${x.v ? ' (v' + x.v + ')' : ''}`).join('\n');
    const d = document.createElement('div'); d.id = 'pd-dlg';
    d.innerHTML = `<div class="box" style="width:min(820px,94vw)"><h3>ログ（新しい順・最新300件）</h3>
      <div class="note">エラーや主な処理の記録です。このブラウザの中にだけ保存されます（ログイン情報は記録しません）。不具合の報告にはコピーして貼り付けてください。</div>
      <div class="logs">${logs.map((x) => `<div class="${x.level}">${esc(fmtT(x.t))} [${esc(x.level)}] ${esc(x.msg)}${x.ctx ? ' <span style="opacity:.7">| ' + esc(x.ctx) + '</span>' : ''}</div>`).join('') || '記録はありません'}</div>
      <div class="acts"><button data-clear>消去</button><button data-save>テキスト保存</button><button data-copy>コピー</button><button data-close class="danger" style="background:#306fff;border-color:#306fff">閉じる</button></div></div>`;
    document.body.appendChild(d);
    try { localStorage.setItem(LS_LOGSEEN, String(Date.now())); } catch (e) { /* 無視 */ }
    updateLogBadge();
    d.querySelector('[data-close]').onclick = () => d.remove();
    d.querySelector('[data-copy]').onclick = async () => { try { await navigator.clipboard.writeText(text()); d.querySelector('[data-copy]').textContent = 'コピーしました'; } catch (e) { d.querySelector('[data-copy]').textContent = 'コピー失敗'; } };
    d.querySelector('[data-save]').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text()], { type: 'text/plain' })); a.download = 'pikpak-distill-log.txt'; a.click(); };
    d.querySelector('[data-clear]').onclick = () => { if (confirm(tr('ログを消去しますか？'))) { try { localStorage.removeItem(LS_LOG); } catch (e) { /* 無視 */ } d.remove(); updateLogBadge(); } };
  }

  // ---------- 件数（ステップの案内用） ----------
  function counts() {
    if (!hasScan()) return null;
    const wf = workFiles();
    return {
      junk: junkEnabled() ? buildJunkPlan(files, folders).filter((p) => p.level === 'del').length : 0,
      junkReview: junkEnabled() ? buildJunkPlan(files, folders).filter((p) => p.level === 'review').length : 0,
      name: nameEnabled() ? buildNamePlan(wf, folders).length : 0,
      sort: buildSortPlan(wf, folders).length,
      ren: buildRenamePlan(wf, folders).filter((p) => p.status === 'rename' || p.status === 'dup').length,
      dup: buildGroups(wf, 'name').length,
      clean: buildCleanPlan(files, folders).filter((p) => p.status === 'todo').length,
      seller: sellerEnabled() ? buildSellerPlan(folders).filter((x) => x.kind !== 'dupw').length : 0,
      cleanSkip: buildCleanPlan(files, folders).filter((p) => p.status === 'skip').length,
    };
  }
  const UNIT_OF = { junk: '件', name: '件', sort: '作品', ren: '件', dup: '組', clean: '件', seller: '作品' };
  const WORK = ['junk', 'name', 'sort', 'ren', 'dup', 'clean', 'seller'];
  function renderRail() {
    root.querySelectorAll('.rail [data-rail]').forEach((b) => {
      const k = b.dataset.rail;
      b.classList.toggle('on', libSt ? k === 'lib-' + libSt.tab : k === 'tree' ? view === 'tree' : k === 'flow' ? view !== 'tree' && mode === 'flow' : false);
      if (k === 'tree' || k === 'scan' || k === 'flow') b.disabled = busy;
    });
    [['dl', libBadge.dl], ['trash', libBadge.trash]].forEach(([k, n]) => { const e = root.querySelector(`[data-r=rb-${k}]`); if (e) e.textContent = n ? (n > 99 ? '99+' : n) : ''; });
  }
  function renderNav() {
    renderRail();
    const c = counts();
    const next = c ? (WORK.find((k) => c[k] > 0) || null) : 'scan';
    $('[data-r=nav]').innerHTML = STEPS.map((s, i) => {
      let sub, cls = '';
      if (s.v === 'scan') { sub = meta ? `${new Date(meta.at).toLocaleString(loc(), { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 読み込み済み` : 'まずはここから'; if (meta) cls = 'done'; }
      else if (!c) sub = '読み込み後に使えます';
      else if (s.v === 'name' && !nameEnabled()) { sub = 'オフ（使わない設定）'; cls = 'done'; }
      else if (s.v === 'junk' && !junkEnabled()) { sub = 'オフ（使わない設定）'; cls = 'done'; }
      else if (s.v === 'seller' && !sellerEnabled()) { sub = 'オフ（使わない設定）'; cls = 'done'; }
      else if (s.v === 'junk' && c.junk === 0 && c.junkReview) sub = `要確認 ${c.junkReview} 件`;
      else if (s.v === 'clean' && c.clean === 0 && c.cleanSkip) sub = `要確認 ${c.cleanSkip} 件`;
      else if (c[s.v] === 0) { sub = '対象なし'; cls = 'done'; }
      else sub = `${c[s.v]} ${UNIT_OF[s.v]}`;
      if (s.v === next) { cls += ' next'; sub += s.v === 'scan' ? '' : '・おすすめ'; }
      if (s.v === view) cls += ' active';
      const locked = s.v !== 'scan' && !c;
      return `<button class="st ${cls}" data-step="${s.v}"${locked || busy ? ' disabled' : ''} title="${esc(s.d)}"><span class="n">${cls.includes('done') ? '✓' : i + 1}</span><span><span class="t">${esc(s.t)}</span><span class="c">${esc(sub)}</span></span></button>`;
    }).join('');
    renderActs();
  }
  // ステップごとの残作業の数（0 なら完了）
  function remaining(v, c) {
    c = c || counts();
    if (!c) return 0;
    if (v === 'clean') return c.clean;
    return c[v] || 0;
  }
  // このステップのあとで、まだ作業が残っている最初のステップ（なければ null＝すべて完了）
  function nextTarget(c) {
    c = c || counts();
    const i = STEPS.findIndex((s) => s.v === view);
    return STEPS.slice(i + 1).find((s) => remaining(s.v, c) > 0) || null;
  }
  const allDone = (c) => !!c && WORK.every((k) => !remaining(k, c)) && !c.cleanSkip;
  function nextHtml(c, cls) {
    if (mode === 'single') return `<button class="${cls || 'pri'}" data-a="close">完了（閉じる）</button><button data-a="toflow">1〜7の流れで続ける</button>`;
    const n = nextTarget(c);
    if (n) return `<button class="${cls || 'pri'}" data-step="${n.v}">次へ：${STEPS.indexOf(n) + 1}. ${esc(n.t)} →</button>`;
    return `<button class="${cls || 'pri'}" data-step="scan">${allDone(c) ? '✓ すべて完了（読み込み画面へ）' : '読み込み画面へ'}</button>`;
  }
  // 一覧の下に置く「次へ」ボタン
  function nextButton() { return `<div class="pd-next">${nextHtml()}</div>`; }
  // 残作業がないときに一覧の代わりに出す表示
  function doneCard(c) {
    c = c || counts();
    return `<div class="pd-hero"><h2>✓ このステップの作業はすべて完了しています</h2>
      <div class="note">${allDone(c) ? 'すべてのステップが完了しました。PikPakで操作したあとは、「1. 読み込む」で読み込み直すと最新の状態を確認できます。' : '次のステップへ進んでください。'}</div>
      <div class="acts" style="margin-top:16px">${nextHtml(c, 'pri big')}</div></div>`;
  }
  // ステップごとの操作欄（見出しと絞り込みは切り替え時に作り、ボタン部分は状態に合わせて都度更新）
  function renderToolbar() {
    if (view === 'tree') { renderTreeToolbar(); return; }
    const s = STEPS.find((x) => x.v === view);
    const single = mode === 'single' ? `<span class="note">読み込み：${meta ? esc(new Date(meta.at).toLocaleString(loc(), { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })) : '未'}</span><button data-a="rescan" title="最新の状態を読み込んでから、この作業を続けます">再読み込み</button><button data-a="toflow" title="1〜7 のステップをすべて表示します（左メニューの「整理」と同じ）">1〜7 をすべて表示</button><span class="sep"></span>` : '';
    const head = `<div class="head"><b>${mode === 'single' ? '' : STEPS.indexOf(s) + 1 + '. '}${esc(s.t)}</b><span class="note">${esc(s.d)}</span></div><span class="sp"></span>${single}`;
    let html = '';
    if (view === 'sort' || view === 'clean') html = head;
    if (view === 'seller') {
      html = head + `<label class="optsw" title="オフにすると、このステップを使わず次へ進みます"><input type="checkbox" data-a="selleropt"${sellerEnabled() ? ' checked' : ''}> このステップを使う</label>`;
    }
    if (view === 'junk') html = head + `<label class="optsw" title="オフにすると、不要ファイルの判定を使わず、すべてのファイルをほかのステップの対象にします"><input type="checkbox" data-a="junkopt"${junkEnabled() ? ' checked' : ''}> このステップを使う</label><span class="sep"></span>`;
    if (view === 'name') html = head + `<label class="optsw" title="オフにすると、このステップを使わず次へ進みます"><input type="checkbox" data-a="nameopt"${nameEnabled() ? ' checked' : ''}> このステップを使う</label><span class="sep"></span>`;
    if (view === 'ren') html = head + `<select data-a="renfilter"><option value="todo">変更するもの</option><option value="skip">要確認</option><option value="same">変更なし</option><option value="all">すべて</option></select>`;
    if (view === 'dup') html = head + `
      <select data-a="mode" title="まとめ方"><option value="name">同じファイル名でまとめる</option><option value="id">同じ品番でまとめる（-1/-2違いも含む）</option></select>
      <label><input type="checkbox" data-a="nearonly"> サイズが近い組だけ</label>
      <input type="text" data-a="q" placeholder="絞り込み（品番・名前）" size="16">
      <span class="sep"></span>`;
    $('[data-r=tb]').innerHTML = html ? html + (STEPV.includes(view) ? '' : '<span data-r="acts" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"></span>') : '';
    renderActs();
  }
  function renderActs() {
    const el = $('[data-r=acts]'); if (!el) return;
    const bar = $('[data-r=stbar]'), btx = $('[data-r=stbartx]');
    if (bar) bar.classList.remove('done');
    if (busy) { el.innerHTML = '<button data-a="stop">中断</button>'; if (btx) btx.innerHTML = '<b>実行中…</b><small>中断すると、そこまでの分は反映されます</small>'; return; }
    const c = counts();
    if (bar) {
      // 帯の左：何件を実行するか／押せない理由
      const main = $('[data-r=main]');
      const hasNext = !!(main && main.querySelector('.pd-next, .pd-hero .acts'));
      let tx = '';
      if (view === 'junk') { const n = jplan.filter(junkChecked).length; tx = !junkEnabled() || !jplan.length ? '' : n ? `<b>削除するもの ${n} 件</b><small>PikPak のゴミ箱へ移動します</small>` : '<b>チェックの入ったファイルがありません</b><small>削除するものにチェックを入れてください</small>'; }
      else if (view === 'dup') { const g = visibleGroups(); tx = g.length ? `<b>表示中 ${g.length} 組</b><small>チェックした（削除の）ファイルを PikPak のゴミ箱へ移動します</small>` : ''; }
      else { const n = remaining(view, c); tx = n > 0 ? `<b>対象 ${n} ${UNIT_OF[view] || '件'}</b><small>まずは「先頭1件だけ試す」で動きを確かめてください</small>` : ''; }
      if (btx) btx.innerHTML = tx;
      if (!tx) { bar.classList.add('done'); if (hasNext) { el.innerHTML = ''; bar.classList.add('hide'); return; } }
      bar.classList.remove('hide');
      // 青い大きなボタンは 1 つだけ：実行が残っている間は「次へ」を控えめにする
      if (main) main.querySelectorAll('.pd-next .pri').forEach((b) => b.classList.remove('pri'));
    }
    const label = { name: 'チェックしたものを変更', sort: 'すべて仕分け', ren: 'すべて変更', clean: 'チェックしたものを実行' };
    if (view === 'seller') {
      // 実行ボタンは一覧の下の帯（.sl-bar）に置く
      el.innerHTML = sellerEnabled() && selPlan.length ? '' : `<span class="okbadge">✓ 完了</span>${nextHtml(c)}`;
      refreshSellerChrome();
      return;
    }
    if (view === 'junk') {
      const n = jplan.filter(junkChecked).length;
      el.innerHTML = junkEnabled() && jplan.length ? `<button class="danger" data-a="junkdel"${n ? '' : ' disabled'}>チェックしたものを削除（${n} 件）</button>` : `<span class="okbadge">✓ 完了</span>${nextHtml(c)}`;
      return;
    }
    if (view === 'dup') {
      el.innerHTML = visibleGroups().length ? '<button data-a="csv">CSV保存</button><button class="danger" data-a="delall">チェックしたものを削除</button>' : `<span class="okbadge">✓ 完了</span>${nextHtml(c)}`;
      return;
    }
    el.innerHTML = remaining(view, c) > 0
      ? `<button data-a="${view}1">先頭1件だけ試す</button><button class="pri" data-a="${view}all">${label[view]}</button>`
      : `<span class="okbadge">✓ 完了${view === 'clean' && c && c.cleanSkip ? `（要確認 ${c.cleanSkip} 件）` : ''}</span>${nextHtml(c)}`;
  }
  function setView(v) {
    if (v !== 'scan' && !hasScan()) v = 'scan';
    view = v;
    if (v === 'clean') cplan = buildCleanPlan(files, folders);
    if (v === 'junk') jplan = junkEnabled() ? buildJunkPlan(files, folders) : [];
    if (v === 'name') nplan = buildNamePlan(workFiles(), folders);
    if (v === 'ren') rplan = buildRenamePlan(workFiles(), folders);
    if (v === 'sort') splan = buildSortPlan(workFiles(), folders);
    if (v === 'seller') selPlan = sellerEnabled() ? buildSellerPlan(folders) : [];
    if (v !== 'tree') { closeQL(); closeCtx(); closePlayer(); hideHover(); }
    root.classList.toggle('treev', v === 'tree'); // フォルダ一覧ではステップの表示を隠す
    if (v !== 'tree') { renderTreeActs(); $('[data-r=pright]').textContent = ''; }
    renderToolbar(); render(); renderNav();
    $('[data-r=main]').scrollTop = 0;
    renderQuota(); refreshQuota();
    if (v === 'tree') prefetchUp();
  }
  // 案M：ステップ 2〜7 は、実行ボタンを一覧の下の帯に固定し、終わった結果を一覧の上に出す
  const STEPV = ['junk', 'name', 'sort', 'ren', 'dup', 'clean'];
  const lastResult = {}; // ステップ → { text, at }
  function ensureStepChrome() {
    if (!STEPV.includes(view)) return;
    const main = $('[data-r=main]'); if (!main) return;
    if (!main.querySelector('.st-bar')) main.insertAdjacentHTML('beforeend', '<div class="st-bar" data-r="stbar"><span class="tx" data-r="stbartx"></span><span class="acts" data-r="acts"></span></div>');
    const r = lastResult[view];
    if (r && !main.querySelector('.st-res')) main.insertAdjacentHTML('afterbegin', `<div class="st-res${/失敗|できません|停止|エラー/.test(r.text) ? ' warn' : ''}" role="status"><span class="ic">${/失敗|できません|停止|エラー/.test(r.text) ? '!' : '✓'}</span><span class="tx">${esc(r.text)}</span><button data-a="resclose" title="閉じる" aria-label="閉じる">${IC.x}</button></div>`);
  }
  // 実行が終わったら、下の帯の文を「結果」として一覧の上に残す
  function captureResult(v) {
    const t = ($('[data-r=status]') || {}).textContent || '';
    if (!t || busy) return;
    lastResult[v] = { text: t, at: Date.now() };
    if (view === v) { const old = $('[data-r=main] .st-res'); if (old) old.remove(); ensureStepChrome(); if (LANG === 'en') root.querySelectorAll('[data-r=main] .st-res *').forEach(trNode); }
  }
  function render() {
    const out = renderBody();
    if (STEPV.includes(view)) { ensureStepChrome(); renderActs(); }
    return out;
  }
  function renderBody() {
    if (view === 'scan') return renderScan();
    if (view === 'ren') return renderRen();
    if (view === 'sort') return renderSort();
    if (view === 'clean') return renderClean();
    if (view === 'seller') return renderSeller();
    if (view === 'name') return renderName();
    if (view === 'junk') return renderJunk();
    if (view === 'tree') return renderTree();
    return renderDup();
  }

  // ---------- 1. 読み込む ----------
  // 初めて読み込むときは、いきなり読み込まずに案内を出す（「次からは確認しない」で省略）
  const LS_SCANASK = 'ppdup:scanask:v1';
  const scanAsk = () => { try { return localStorage.getItem(LS_SCANASK) !== '0'; } catch (e) { return true; } };
  function renderScan() {
    const where = crumbs().map((c) => c.name).filter(Boolean).join(' › ') || (currentFolderId() === 'root' ? 'ホーム' : 'いま開いているフォルダ');
    const c = counts();
    const next = c && (WORK.find((k) => c[k] > 0));
    const val = (k) => {
      if ((k === 'name' && !nameEnabled()) || (k === 'junk' && !junkEnabled()) || (k === 'seller' && !sellerEnabled())) return { v: 'オフ', cls: 'off' };
      if (c[k]) return { v: c[k], u: UNIT_OF[k], cls: 'todo' };
      if (k === 'clean' && c.cleanSkip) return { v: c.cleanSkip, u: '件', sub: '要確認', cls: 'warn' };
      if (k === 'junk' && c.junkReview) return { v: c.junkReview, u: '件', sub: '要確認', cls: 'warn' };
      return { v: '✓', sub: '対象なし', cls: 'zero' };
    };
    const card = (k) => {
      const i = STEPS.findIndex((x) => x.v === k), x = val(k);
      return `<button data-step="${k}" class="sc ${x.cls}${k === next ? ' next' : ''}" title="${esc(STEPS[i].d)}"><span class="sc-h"><span class="sc-n">${i + 1}</span><span class="sc-t">${esc(STEPS[i].t)}</span></span><span class="sc-v"><b>${esc(String(x.v))}</b>${x.u ? `<small>${esc(x.u)}</small>` : ''}</span><span class="sc-s">${esc(x.sub || (x.cls === 'todo' ? (k === next ? 'おすすめ' : '作業あり') : x.cls === 'off' ? '使わない設定' : ''))}</span></button>`;
    };
    const when = meta ? new Date(meta.at).toLocaleString(loc(), { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    const staleH = meta ? Math.floor((Date.now() - meta.at) / 3600000) : 0;
    const done = allDone(c);
    $('[data-r=main]').innerHTML = `<div class="sv">
      <section class="sv-hero${done ? ' ok' : ''}">
        <div class="sv-badge">${done ? '✓' : meta ? '↻' : '⇣'}</div>${!meta && !busy ? (() => {
          let st = null; try { st = (JSON.parse(localStorage.getItem(LS_SCANSTAT) || '{}') || {})[String(currentTrail().slice(-1)[0] || 'root')]; } catch (e) { st = null; }
          return `<div class="sv-main"><h2>まず PikPak の中身を読み込みます</h2><p>フォルダとファイルの一覧を読み込んで、重複や不要ファイルを見つけます。<b>読むだけで、ファイルは何も変更しません。</b></p>
            <ul class="sv-intro"><li>📁 読み込む場所：<b>${esc(where)}</b>（この中のすべて。ほかの場所は PikPak の画面でフォルダを開いてから）</li><li>⏱ かかる時間：<b>${st ? `前回は ${fmtDur(st.ms)}（フォルダ ${st.folders}）` : '数十秒〜数分'}</b>（フォルダが多いほど長くなります）</li><li>💡 読み込み中も画面は見られます。途中で止めても大丈夫です</li></ul></div>
            <div class="sv-act"><button class="pri big" data-a="scan">読み込みを始める</button><button class="big ghost" data-a="close">あとで</button><label class="sv-ask"><input type="checkbox" data-a="scanask"${scanAsk() ? '' : ' checked'}> 次からは確認しない</label></div>`;
        })() : ''}
        ${!meta && !busy ? '' : `<div class="sv-main">
          <h2>${done ? '整理はすべて完了しています' : meta ? 'フォルダを読み込み済みです' : 'まずはフォルダを読み込みます'}</h2>
          <p>${done ? 'PikPak でファイルを追加・操作したら、再スキャンで最新の状態を確認できます。' : meta ? (next ? '下のカードから作業を選ぶか、おすすめの作業へ進んでください。' : '要確認の項目を確認してください。') : 'ホームか My Pack を開いた状態で実行してください。読み込みはバックグラウンドで行い、PikPak の画面は切り替わりません。'}</p>
          ${staleH >= 6 && !busy ? `<div class="sv-stale">前回の読み込みから ${staleH >= 48 ? Math.floor(staleH / 24) + ' 日' : staleH + ' 時間'}たっています。PikPak で追加・削除したものは「↻ 再スキャン」で反映されます。</div>` : ''}
          <div class="sv-chips">
            <span class="chip-i"><i>場所</i>${esc(where)}</span>
            ${meta ? `<span class="chip-i"><i>フォルダ</i>${meta.nfo.toLocaleString()}</span><span class="chip-i"><i>ファイル</i>${meta.nfi.toLocaleString()}</span><span class="chip-i"><i>前回</i>${esc(when)}</span>` : ''}
          </div>
        </div>
        <div class="sv-act">
          <button class="pri big" data-a="scan"${busy ? ' disabled' : ''}>${meta ? '↻ 再スキャン' : 'スキャン開始'}</button>${busy ? '<button class="big" data-a="stop">中断</button>' : ''}
          ${next ? `<button class="big ghost" data-step="${next}">おすすめ：${STEPS.findIndex((s) => s.v === next) + 1}. ${esc(STEPS.find((s) => s.v === next).t)} →</button>` : ''}
        </div>`}
      </section>
      <label class="sv-opt" title="オンにすると、作品と関係ないファイルを、仕分け・名前の変更・重複比較の対象から外します（「2. 不要ファイルを削除」で確認・削除できます）"><span class="sw"><input type="checkbox" data-a="junkopt"${junkEnabled() ? ' checked' : ''}><i></i></span><span><b>作品と関係ないファイルを除外する</b><small>広告・宣伝のファイルや 10MB 以下のファイルなどを、ほかの作業の対象から外します</small></span></label>
      ${c ? `<div class="sv-grid">${WORK.map(card).join('')}</div>` : ''}
    </div>`;
    if (!busy) status(meta ? '読み込み済みです。カードから作業を選べます（操作したら再スキャンで最新にできます）。' : 'まずは「スキャン開始」を押してください。');
  }
  // 読み込みの残り時間（目安）：同じ場所を前に読み込んだときのフォルダ数・時間と、今の速さから見積もる
  const LS_SCANSTAT = 'ppdup:scanstat:v1';
  const fmtDur = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return s < 60 ? `${s} 秒` : `${Math.floor(s / 60)} 分 ${String(s % 60).padStart(2, '0')} 秒`; };
  function scanEta(trail) {
    const key = String(trail[trail.length - 1] || 'root');
    let all = {}; try { all = JSON.parse(localStorage.getItem(LS_SCANSTAT) || '{}') || {}; } catch (e) { all = {}; }
    const prev = all[key] && all[key].folders > 0 && all[key].ms > 0 ? all[key] : null;
    const t0 = Date.now();
    let shown = null, lastAt = t0, maxFrac = 0;
    return {
      tick(d, known) {
        const now = Date.now(), el = now - t0;
        const expected = Math.max(known, prev ? prev.folders : 0, d);
        let est = null;
        const rate = d / Math.max(el, 1); // フォルダ／ミリ秒
        const byRate = d >= 3 && el >= 1500 ? (expected - d) / rate : null;
        const byPrev = prev ? Math.max(0, prev.ms * (expected / prev.folders) - el) : null;
        if (byRate != null && byPrev != null) { const w = Math.min(1, d / Math.max(40, expected * 0.25)); est = w * byRate + (1 - w) * byPrev; }
        else est = byRate != null ? byRate : byPrev;
        // 数字が跳ねないようにならす（経過した分は減らしてから混ぜる）
        if (est != null) { shown = shown == null ? est : Math.max(0, shown - (now - lastAt)) * 0.7 + est * 0.3; }
        lastAt = now;
        const tail = prev ? `（目安・前回 ${fmtDur(prev.ms)}）` : '（目安）';
        const text = shown == null ? '残り時間を計算中…' : shown < 5000 ? `まもなく完了${tail}` : `あと約 ${fmtDur(shown)}${tail}`;
        // ％は戻らないようにする（初めての場所では、フォルダが見つかるにつれて全体の数が増えるため）
        let frac = d / Math.max(expected, 1);
        if (!prev && el < 3000 && known < 20) frac = Math.min(frac, 0.05);
        maxFrac = Math.max(maxFrac, Math.min(0.99, frac));
        return { text, frac: maxFrac, expectedLabel: prev || known > d ? `約 ${expected}` : `${expected}` };
      },
      done(nfo, nfi) {
        if (window.__ppdupStop) return;
        all[key] = { folders: nfo, files: nfi, ms: Date.now() - t0, at: Date.now() };
        const keys = Object.keys(all); if (keys.length > 30) keys.sort((a, b) => (all[a].at || 0) - (all[b].at || 0)).slice(0, keys.length - 30).forEach((k) => delete all[k]);
        try { localStorage.setItem(LS_SCANSTAT, JSON.stringify(all)); } catch (e) { /* 無視 */ }
      },
    };
  }
  async function runScan() {
    if (busy) return;
    if (!ensureSession('scan')) return;
    busy = true; renderNav(); renderScan();
    status('読み込み中…', 0);
    try {
      const where = crumbs().map((c) => c.name).filter(Boolean).join(' › ') || 'ホーム';
      const eta = scanEta(currentTrail());
      const r = await scanApi(currentTrail(), { onProgress: (d, total, n) => { const e = eta.tick(d, total); status(`読み込み中… フォルダ ${d} / ${e.expectedLabel} ／ ファイル ${n} 件`, e.frac, e.text); } });
      eta.done(r.folders.length, r.files.length);
      files = r.files; folders = r.folders; saveAll();
      meta = { at: Date.now(), where, nfo: folders.length, nfi: files.length };
      try { localStorage.setItem(LS_META, JSON.stringify(meta)); } catch (e) { /* 無視 */ }
      busy = false;
      status(`読み込み完了：フォルダ ${folders.length} ／ ファイル ${files.length} 件`);
      if (afterScan) { const v = afterScan; afterScan = null; setView(v); status(`読み込み完了：フォルダ ${folders.length} ／ ファイル ${files.length} 件`); }
      else { setView('scan'); status(`読み込み完了：フォルダ ${folders.length} ／ ファイル ${files.length} 件。次のステップを選んでください。`); }
      log('info', `読み込み完了：フォルダ ${folders.length} ／ ファイル ${files.length}`, where);
    } catch (err) { busy = false; renderNav(); renderScan(); handleErr(err, 'scan', '読み込みに失敗しました：' + err.message); }
  }

  // ---------- 2. 不要ファイルを削除 ----------
  function renderJunk() {
    const explain = `<div class="pd-explain"><h3>このステップでできること</h3>
      <div class="note">読み込んだファイルのうち、作品と関係ないものを見分けて削除します。オンの間は、ここで見つけたファイルを「ファイル名を整える」「作品ごとに仕分け」「フォルダ名を揃える」「重複を比べて削除」の対象から外すので、広告ファイルの名前でフォルダが作られたり、フォルダ名が広告の名前になったりしません（削除しなくても外れます）。</div>
      <ul class="note">
        <li><b>広告・宣伝</b>：<code>.url</code> <code>.txt</code> <code>.html</code> <code>.exe</code> <code>.apk</code> <code>.torrent</code> などのファイル、品番がなく「最新地址」「广告」「福利」などの宣伝の言葉やサイトのアドレス（<code>xxx.com</code> など）が入ったファイル</li>
        <li><b>10MB以下</b>：画像・説明ファイル・短い宣伝動画など（字幕ファイルは「要確認」に回します）</li>
        <li><b>宣伝向けの名前</b>：品番がなく、宣伝によく使われる文字だけの名前。小さいファイルは削除の対象、50MB 以上や品番が入ったものは作品の可能性があるため「要確認」に回します</li>
      </ul>
      <div class="note" style="margin-top:6px">「要確認」は最初はチェックなしです。削除はPikPakのゴミ箱へ移動します（確認画面で完全削除も選べます）。削除したあとに空になったフォルダは、「7. (1)を外す・片付け」でまとめて片付けられます。使わない場合は、右上の「このステップを使う」のチェックを外してください。</div></div>`;
    if (!junkEnabled()) { $('[data-r=main]').innerHTML = explain + `<div class="pd-hero"><h2>このステップはオフになっています</h2><div class="note">すべてのファイルを、ほかのステップの対象にします。</div><div class="acts" style="margin-top:16px">${nextHtml(undefined, 'pri big')}</div></div>`; if (!busy) status('不要ファイルの除外はオフです。'); return; }
    if (!jplan.length) { $('[data-r=main]').innerHTML = explain + doneCard(); if (!busy) status('作品と関係ないファイルは見つかりませんでした。'); return; }
    const row = (p) => {
      const on = junkChecked(p);
      return `<div class="pd-row ${on ? 'del' : ''}" data-id="${esc(p.id)}"><label class="pd-chk" title="チェック＝削除する"><input type="checkbox" data-jchk="${esc(p.id)}"${on ? ' checked' : ''}></label>
        <div class="pd-th" style="width:96px;height:54px">${p.thumb ? `<img loading="lazy" referrerpolicy="no-referrer" src="${esc(p.thumb)}" alt="">` : ''}</div>
        <div class="pd-info"><div class="pd-name">${esc(p.name)} <span class="pd-tag">${esc(p.reason)}</span></div><div class="pd-path">${esc(p.path)}</div></div>
        <div class="pd-sz"><b>${fmt(p.size)}</b></div></div>`;
    };
    const sec = (lv, title, note) => {
      const l = jplan.filter((p) => p.level === lv);
      if (!l.length) return '';
      return `<div class="pd-g"><div class="pd-gh"><span>${title} ${l.length} 件</span><span class="note">${note}</span><span class="sp"></span><button data-a="jall" data-lv="${lv}">すべてチェック</button><button data-a="jnone" data-lv="${lv}">すべて外す</button></div>${l.map(row).join('')}</div>`;
    };
    $('[data-r=main]').innerHTML = explain
      + sec('del', '作品と関係ないファイル', 'ほかのステップの対象から外しています')
      + sec('review', '要確認', '作品の可能性があるもの。削除する場合はチェックしてください（ほかのステップの対象のままです）')
      + nextButton();
    if (!busy) { const sel = jplan.filter(junkChecked); status(`チェック（削除する） ${sel.length} 件・${fmt(sel.reduce((a, p) => a + p.size, 0))}`); }
  }
  async function runJunk() {
    const list = jplan.filter(junkChecked).map((p) => files.find((f) => f.id === p.id)).filter(Boolean);
    if (!list.length) { status('チェックの入ったファイルがありません'); return; }
    if (!ensureSession('junk')) return;
    const ans = await askDelete(list, []);
    if (!ans) return;
    busy = true; renderNav(); renderActs(); window.__ppdupStop = false;
    try {
      const n = await deleteApi(list, ans.hard, (d, t) => status(`削除中… ${d}/${t}`, d / t));
      list.forEach((f) => junkSel.delete(f.id));
      busy = false; setView('junk'); status(`${n} 件を${ans.hard ? '完全に削除' : 'ゴミ箱へ移動'}しました。`); log('info', `不要ファイルの削除 ${n} 件（${ans.hard ? '完全削除' : 'ゴミ箱'}）`); refreshView();
    } catch (err) { busy = false; setView('junk'); handleErr(err, 'junk', '削除を停止しました：' + err.message); }
  }

  // ---------- 3. ファイル名を整える ----------
  function renderName() {
    const on = nameEnabled();
    const todo = nplan.filter((p) => p.status === 'todo');
    const explain = `<div class="pd-explain"><h3>このステップでできること</h3>
      <div class="note">FC2のファイル名を <code>FC2-PPV-品番</code> の形にそろえます。名前がそろうと、「重複を比べて削除」で同じ動画が同じ組にまとまり、フォルダ名との対応もそろいます。Enhancement Master の「FC2 クリーン命名」と同じ考え方です。</div>
      <ul class="note">
        <li>例：<code>4k688.com@FC2-PPV-4988183_1.mp4</code> → <code>FC2-PPV-4988183-1.mp4</code></li>
        <li>サイト名・広告など、品番の前後にある余計な文字は消します</li>
        <li>シリーズ／分割の番号（<code>_1</code>・<code>part2</code>・<code>cd1</code>・<code>_A</code>、タイトル末尾の <code>…編-3</code>、<code>第2話</code> など）は <code>-1</code>・<code>-3</code> の形で残します</li>
        <li>同じ場所に同じ名前のファイルができる場合は <code>(1)</code> を付けます（重複の可能性があるため、あとで比べられます）</li>
        <li>FC2 以外のファイルは変更しません。ファイルの中身や置き場所は変わりません</li>
      </ul>
      <div class="note" style="margin-top:6px">使わない場合は、右上の「このステップを使う」のチェックを外してください。次回以降もこの設定を覚えておきます。</div></div>`;
    if (!on) { $('[data-r=main]').innerHTML = explain + `<div class="pd-hero"><h2>このステップはオフになっています</h2><div class="note">ファイル名は変更しません。</div><div class="acts" style="margin-top:16px">${nextHtml(undefined, 'pri big')}</div></div>`; if (!busy) status('ファイル名の整理はオフです。'); return; }
    if (!todo.length) { $('[data-r=main]').innerHTML = explain + doneCard(); if (!busy) status('ファイル名はそろっています。'); return; }
    const row = (p) => `<div class="pd-row ${nameOff.has(p.id) ? '' : 'sel'}"><label class="pd-chk"><input type="checkbox" data-nchk="${esc(p.id)}"${nameOff.has(p.id) ? '' : ' checked'}></label><div class="pd-info"><div class="pd-path">${esc(p.path || '（読み込んだフォルダの直下）')}</div>
      <div class="pd-name">${esc(p.cur)} <span class="note">→</span> ${esc(p.target)}</div>${p.note ? `<div class="note">${esc(p.note)}</div>` : ''}</div></div>`;
    $('[data-r=main]').innerHTML = explain + `<div class="pd-g"><div class="pd-gh"><span>変更するファイル ${todo.length} 件</span><span class="note">チェックを外したものは変更しません</span></div>${todo.map(row).join('')}</div>${nextButton()}`;
    if (!busy) status('変更内容を確認して、まずは「先頭1件だけ試す」で確かめてください。');
  }
  async function runName(onlyFirst) {
    const targets = nplan.filter((p) => p.status === 'todo' && !nameOff.has(p.id)).slice(0, onlyFirst ? 1 : undefined);
    if (!targets.length || !ensureSession('name')) return;
    busy = true; renderNav(); window.__ppdupStop = false; let ok = 0, skipped = 0;
    for (const p of targets) {
      if (window.__ppdupStop) break;
      status(`ファイル名を変更中… ${ok + skipped + 1}/${targets.length}：${p.cur}`, (ok + skipped) / targets.length);
      try { if (await cleanOne(p)) ok++; else skipped++; saveAll(); }
      catch (err) { saveAll(); busy = false; setView('name'); handleErr(err, 'name', `停止：${p.cur}：${err.message}（${ok}件完了）`); return; }
      await sleep(120);
    }
    busy = false; setView('name'); status(`${ok} 件のファイル名を整えました${skipped ? `（${skipped} 件は実行直前の確認で対象外になりました）` : ''}。`); log('info', `ファイル名の整理 ${ok} 件・対象外 ${skipped} 件`); refreshView();
  }

  // ---------- 4. 作品ごとに仕分け ----------
  function renderSort() {
    const todo = splan.filter((g) => g.status !== 'done');
    if (!todo.length) { $('[data-r=main]').innerHTML = doneCard(); if (!busy) status('仕分けは完了しています。'); return; }
    const nNew = todo.filter((g) => g.folderNew).length, nFiles = todo.reduce((a, g) => a + g.items.length, 0), nRen = todo.reduce((a, g) => a + g.items.filter((x) => x.to !== x.name).length, 0);
    $('[data-r=main]').innerHTML = `<div class="pd-g"><div class="pd-gh"><span>残り ${todo.length} 作品</span><span class="note">移動 ${nFiles} 本 ／ 新規フォルダ ${nNew} ／ 同名のため (1) を付ける ${nRen}</span></div>
      ${todo.map((g) => `<div class="pd-row"><div class="pd-info"><div class="pd-path">${esc(g.cpath || '（読み込んだフォルダの直下）')}</div>
        <div class="pd-name">${esc(g.work)} <span class="pd-tag">${g.folderNew ? '新規フォルダ' : '既存フォルダへ'}</span></div>
        <div class="note">${g.items.map((x) => esc(x.name) + (x.to !== x.name ? ' → <b>' + esc(x.to) + '</b>' : '')).join('　')}</div></div></div>`).join('') || '<div class="empty">✓ 仕分けが必要なフォルダはありません</div>'}</div>${nextButton()}`;
    if (!busy) status(todo.length ? '内容を確認して、まずは「先頭1件だけ試す」で動きを確かめてください。削除はしません。' : '仕分けは不要です。次のステップへ進んでください。');
  }
  async function runSort(onlyFirst) {
    const targets = splan.filter((g) => g.status !== 'done').slice(0, onlyFirst ? 1 : undefined);
    if (!targets.length || !ensureSession('sort')) return;
    busy = true; renderNav(); window.__ppdupStop = false; let ok = 0;
    for (const g of targets) {
      if (window.__ppdupStop) break;
      status(`仕分け中… ${ok + 1}/${targets.length}：${g.work}`, ok / targets.length);
      try { await sortApi(g); ok++; saveAll(); }
      catch (err) { saveAll(); busy = false; setView('sort'); handleErr(err, 'sort', `停止：${g.cpath} の ${g.work}：${err.message}（${ok}作品完了）`); return; }
      await sleep(100);
    }
    busy = false; setView('sort'); status(`${ok} 作品を仕分けしました。`); log('info', `仕分け ${ok} 作品`); refreshView();
  }

  // ---------- 5. フォルダ名を揃える ----------
  const STLABEL = { same: '変更なし', rename: '変更', dup: '変更（重複回避）', skip: '要確認・対象外' };
  function renderRen() {
    const show = $('[data-a=renfilter]') ? $('[data-a=renfilter]').value : 'todo';
    const list = rplan.filter((p) => show === 'all' || (show === 'todo' ? p.status === 'rename' || p.status === 'dup' : p.status === show));
    const cnt = (s) => rplan.filter((p) => p.status === s).length;
    if (show === 'todo' && !list.length) { $('[data-r=main]').innerHTML = doneCard(); if (!busy) status(`名前の変更は完了しています（要確認 ${cnt('skip')} 件は「要確認」で確認できます）。`); return; }
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
    if (!targets.length || !ensureSession('ren')) return;
    busy = true; renderNav(); window.__ppdupStop = false; let ok = 0;
    for (const p of targets) {
      if (window.__ppdupStop) break;
      status(`名前を変更中… ${ok + 1}/${targets.length}：${p.cur}`, ok / targets.length);
      try { await renameApi(p); ok++; persistFolders(); }
      catch (err) { persistFolders(); busy = false; setView('ren'); handleErr(err, 'ren', `停止：${p.cur} → ${p.target}：${err.message}（${ok}件完了）`); return; }
      await sleep(150);
    }
    persistFolders(); busy = false; setView('ren'); status(`${ok} 件のフォルダ名を変更しました。`); log('info', `フォルダ名の変更 ${ok} 件`); refreshView();
  }
  function persistFolders() { // 変更後の名前をキャッシュへ反映（中のフォルダ・ファイルの場所の表示も更新）
    rplan.forEach((p) => {
      const f = folders.find((x) => x.id === p.id);
      if (!f || f.name === p.cur) return;
      const old = f.path; f.name = p.cur; f.path = old.slice(0, old.length - old.split('/').pop().length) + p.cur;
      folders.forEach((y) => { if (y.path.startsWith(old + '/')) y.path = f.path + y.path.slice(old.length); });
      files.forEach((y) => { if (y.path === old || y.path.startsWith(old + '/')) y.path = f.path + y.path.slice(old.length); });
    });
    saveAll();
  }

  // ---------- 6. 重複を比べて削除 ----------
  function visibleGroups() {
    const m = $('[data-a=mode]'), n = $('[data-a=nearonly]'), qq = $('[data-a=q]');
    let groups = buildGroups(workFiles(), m ? m.value : 'name');
    if (n && n.checked) groups = groups.filter((g) => g.near);
    const q = qq ? qq.value.trim().toLowerCase() : '';
    if (q) groups = groups.filter((g) => g.items.some((x) => x.name.toLowerCase().includes(q)));
    return groups;
  }
  const delList = (groups) => groups.flatMap((g) => g.items.filter((f, i) => stateOf(f, i) === 'del'));
  function renderDup() {
    const groups = visibleGroups();
    const main = $('[data-r=main]');
    if (!groups.length) { const qq = $('[data-a=q]'), nn = $('[data-a=nearonly]'); main.innerHTML = (qq && qq.value) || (nn && nn.checked) ? '<div class="empty">絞り込みに該当する重複はありません。</div>' : doneCard(); if (!busy) status('重複はありません。'); renderActs(); return; }
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
      return `<section class="pd-g"><div class="pd-gh"><span>${esc(g.items[0].name)}</span><span class="note">${g.items.length}件</span>${g.near ? '<span class="pd-tag">サイズが近い組あり</span>' : ''}<span class="sp"></span><button data-frg="${esc(g.key)}" title="この組の 2 本を、同じ位置のコマで並べて比べる">▦ コマで比べる</button><button data-g="${esc(g.key)}">この組のチェックを削除</button></div>${rows}</section>`;
    }).join('') + nextButton();
    renderActs();
    if (!busy) { const dl = delList(groups); status(`重複 ${groups.length} 組 ／ チェック（削除する） ${dl.length} 件・${fmt(dl.reduce((a, f) => a + f.size, 0))}　※各組の一番大きいファイルは最初からチェックなし（残す）になっています`); }
  }
  // 削除確認（Enhancement Master と同じく「ゴミ箱を経由しない」チェック付き）
  // skipped: 全件にチェックが入っている組 [{name, items}]。「強制削除」にチェックしたときだけ、それらも削除する
  function askDelete(list, skipped) {
    return new Promise((resolve) => {
      const d = document.createElement('div'); d.id = 'pd-dlg';
      const sItems = skipped.flatMap((g) => g.items || []);
      const sum = (a) => a.reduce((x, f) => x + f.size, 0);
      const title = (force) => (force ? list.length + sItems.length : list.length) + ' 件を削除します（' + fmt(sum(list) + (force ? sum(sItems) : 0)) + '）';
      d.innerHTML = `<div class="box"><h3 data-title>${title(false)}</h3>
        <div class="note">対象はチェックの入ったファイルだけです。通常はPikPakのゴミ箱へ移動し、あとから戻せます。</div>
        ${skipped.length ? `<div class="note" style="color:#d93025;margin-top:8px">全件にチェックが入っている組 ${skipped.length} 組（${sItems.length} 件）は、組ごと消えてしまうため通常は対象外にしています（${esc(skipped.slice(0, 3).map((g) => g.name).join(' / '))}${skipped.length > 3 ? ' …' : ''}）</div>
        <label class="hard" style="margin:10px 0 0"><input type="checkbox" data-force> 強制削除：全件にチェックが入っている組も、すべて削除する（広告ファイルなど）</label>` : ''}
        <label class="hard"><input type="checkbox" data-hard> ゴミ箱を経由せず完全に削除する（元に戻せません）</label>
        <div class="acts"><button data-no>キャンセル</button><button class="danger" data-yes${list.length ? '' : ' disabled'}>削除する</button></div></div>`;
      document.body.appendChild(d);
      const fc = d.querySelector('[data-force]'), yes = d.querySelector('[data-yes]');
      if (fc) fc.onchange = () => { d.querySelector('[data-title]').textContent = title(fc.checked); yes.disabled = !list.length && !fc.checked; yes.textContent = fc.checked ? '強制削除する' : '削除する'; };
      const done = (v) => { d.remove(); resolve(v); };
      d.querySelector('[data-no]').onclick = () => done(null);
      yes.onclick = () => { if (yes.disabled) return; done({ hard: d.querySelector('[data-hard]').checked, force: !!(fc && fc.checked) }); };
    });
  }
  async function runDelete(groups) {
    const skipped = [], list = [];
    groups.forEach((g) => {
      const del = g.items.filter((f, i) => stateOf(f, i) === 'del');
      if (!del.length) return;
      if (del.length === g.items.length) { skipped.push({ name: g.items[0].name, items: del }); return; }
      list.push(...del);
    });
    if (!list.length && !skipped.length) { status('チェックの入ったファイルがありません'); return; }
    if (!ensureSession('dup')) return;
    const ans = await askDelete(list, skipped);
    if (!ans) return;
    const targets = ans.force ? list.concat(skipped.flatMap((g) => g.items)) : list;
    busy = true; renderNav(); window.__ppdupStop = false;
    try {
      const n = await deleteApi(targets, ans.hard, (d, t) => status(`削除中… ${d}/${t}`, d / t));
      busy = false; render(); renderNav(); status(`${n} 件を${ans.hard ? '完全に削除' : 'ゴミ箱へ移動'}しました${ans.force ? `（強制削除 ${skipped.length} 組を含む）` : ''}。`); log('info', `削除 ${n} 件（${ans.hard ? '完全削除' : 'ゴミ箱'}${ans.force ? '・強制削除 ' + skipped.length + ' 組' : ''}）`); refreshView();
    } catch (err) { busy = false; render(); renderNav(); handleErr(err, 'dup', '削除を停止しました：' + err.message); }
  }

  // ---------- 7. (1)を外す ----------
  const cleanOff = new Set(); // チェックを外した（実行しない）項目
  function renderClean() {
    const trash = cplan.filter((p) => p.status === 'todo' && p.op === 'trash'), ren = cplan.filter((p) => p.status === 'todo' && p.op === 'rename'), skip = cplan.filter((p) => p.status === 'skip');
    const flat = cplan.filter((p) => p.status === 'todo' && p.op === 'flatten');
    if (!trash.length && !ren.length && !skip.length && !flat.length) { $('[data-r=main]').innerHTML = doneCard(); if (!busy) status('片付けは完了しています。'); return; }
    const row = (p, chk) => `<div class="pd-row ${chk && !cleanOff.has(p.id) ? (p.op === 'trash' ? 'del' : 'sel') : ''}">${chk ? `<label class="pd-chk"><input type="checkbox" data-cchk="${esc(p.id)}"${cleanOff.has(p.id) ? '' : ' checked'}></label>` : ''}<div class="pd-info"><div class="pd-path">${esc(p.path || '（読み込んだフォルダの直下）')}</div>
      <div class="pd-name">${esc(p.cur)}${p.op === 'rename' ? ` <span class="note">→</span> ${esc(p.target)}` : p.op === 'flatten' ? ` <span class="note">の中身 → 1 つ上の</span> ${esc(p.target)}` : ''} <span class="pd-tag">${p.kind === 'folder' ? 'フォルダ' : 'ファイル'}</span></div>
      ${p.note ? `<div class="note">${esc(p.note)}</div>` : ''}</div></div>`;
    $('[data-r=main]').innerHTML = `
      <div class="pd-g"><div class="pd-gh"><span>空フォルダをゴミ箱へ ${trash.length} 件</span><span class="note">中身が空のフォルダです。実行直前にも空であることを確認します（ゴミ箱から戻せます）</span></div>
        ${trash.map((p) => row(p, true)).join('') || '<div class="empty">✓ 空フォルダはありません</div>'}</div>
      ${flat.length ? `<div class="pd-g"><div class="pd-gh"><span>入れ子のフォルダをまとめる ${flat.length} 件</span><span class="note">「X の中に X だけ」のフォルダの中身を 1 つ上へ出します（オムニバスなど複数作品のフォルダは対象外）</span></div>${flat.map((p) => row(p, true)).join('')}</div>` : ''}
      <div class="pd-g"><div class="pd-gh"><span>(1)を外す ${ren.length} 件</span><span class="note">フォルダ ${ren.filter((p) => p.kind === 'folder').length} ／ ファイル ${ren.filter((p) => p.kind === 'file').length}</span></div>
        ${ren.map((p) => row(p, true)).join('') || '<div class="empty">✓ 外せる (1) はありません</div>'}</div>
      ${skip.length ? `<div class="pd-g"><div class="pd-gh"><span>要確認 ${skip.length} 件</span><span class="note">このステップでは処理できないものです</span></div>${skip.map((p) => row(p, false)).join('')}</div>` : ''}`;
    if (!busy) status('チェックの入ったものを実行します。重複を削除したあとは、先に「1. 読み込む」で読み込み直してから使ってください。');
  }
  async function runClean(onlyFirst) {
    const targets = cplan.filter((p) => p.status === 'todo' && !cleanOff.has(p.id)).slice(0, onlyFirst ? 1 : undefined);
    if (!targets.length || !ensureSession('clean')) return;
    busy = true; renderNav(); window.__ppdupStop = false; let ok = 0, skipped = 0;
    for (const p of targets) {
      if (window.__ppdupStop) break;
      status(`${p.op === 'trash' ? '空フォルダを片付けています' : p.op === 'flatten' ? '入れ子のフォルダをまとめています' : '(1)を外しています'}… ${ok + skipped + 1}/${targets.length}：${p.cur}`, (ok + skipped) / targets.length);
      try { if (await cleanOne(p)) ok++; else skipped++; saveAll(); }
      catch (err) { saveAll(); busy = false; setView('clean'); handleErr(err, 'clean', `停止：${p.cur}：${err.message}（${ok}件完了）`); return; }
      await sleep(150);
    }
    busy = false; setView('clean'); status(`${ok} 件を実行しました${skipped ? `（${skipped} 件は実行直前の確認で対象外になりました）` : ''}。`); log('info', `片付け ${ok} 件・対象外 ${skipped} 件`); refreshView();
  }

  // ---------- フォルダ一覧（Finder / エクスプローラーに近い操作） ----------
  // 読み込んだ結果をツリーで表示する。キー操作はブラウザが動いている OS に合わせる
  //   macOS：Finder と同じ（⌘ キー・Enter で名前の変更・⌘⌫ でゴミ箱）
  //   Windows / Linux：エクスプローラーやファイルマネージャーと同じ（Ctrl キー・F2 で名前の変更・Delete でゴミ箱）
  // ※ ブラウザ自体が使うショートカット（⌘1〜3・Ctrl+1〜3＝タブ切り替え、⇧⌘N・Ctrl+Shift+N＝シークレットウィンドウ、
  //    ⌥⌘← →＝タブ移動 など）はページ側で止められないため使わない
  // ---------- 8. 販売者ごとに仕分け ----------
  // 作品フォルダ（FC2-PPV-品番）の品番から販売者を調べ、ホーム/販売者別/販売者名（販売者ID）/ へ移動する。
  // 販売者は fd2ppv.cc の作品ページで調べ、FC2 で見つからなければ fc2cmadb.com も見る。FC2 以外は fd2ppv.cc の検索 → 作品ページの「配信元」。PikPak の画面からは別サイトを読めないため、小さなウィンドウで作品ページを順に開き、
  // そのページの上で動くこのスクリプト（下の fd2Lookup）が販売者を読み取って、こちらへ知らせる（Cloudflare の確認が出たら、そのウィンドウで済ませてもらう）
  const LS_SELLER = 'ppdup:seller:v1'; // 品番 → { name, sid, src: 'fd2ppv' | 'manual', status: 'ok' | 'notfound' | 'noseller', at }
  const LS_SELLER_CFG = 'ppdup:seller:cfg:v1';
  const LS_OPT_SELLER = 'ppdup:opt:seller:v1';
  const FD2 = 'https://fd2ppv.cc';
  const CMADB = 'https://fc2cmadb.com';
  let sellerDb = {};
  try { sellerDb = JSON.parse(localStorage.getItem(LS_SELLER) || '{}') || {}; } catch (e) { sellerDb = {}; }
  const saveSellerDb = () => { try { localStorage.setItem(LS_SELLER, JSON.stringify(sellerDb)); } catch (e) { /* 無視 */ } };
  const sellerEnabled = () => { try { return localStorage.getItem(LS_OPT_SELLER) !== '0'; } catch (e) { return true; } };
  function sellerCfg() {
    let c = {}; try { c = JSON.parse(localStorage.getItem(LS_SELLER_CFG) || '{}') || {}; } catch (e) { c = {}; }
    const nm = (v, d) => (typeof v === 'string' && v.trim() && !/[\/\\]/.test(v) ? v.trim() : d);
    return { root: nm(c.root, '販売者別'), unknown: nm(c.unknown, '販売者不明'), review: nm(c.review, '要確認'), interval: [1, 1.5, 3].includes(+c.interval) ? +c.interval : 1.5 };
  }
  const saveSellerCfg = (c) => { try { localStorage.setItem(LS_SELLER_CFG, JSON.stringify(c)); } catch (e) { /* 無視 */ } };
  // 名前に入っている品番。FC2 は品番（「FC2 〇〇 collection 1234567 2345678」のような複数作品の名前も拾う）、
  // FC2 以外は HEYZO・カリビアンコムなど日付型の品番（例：033118_001 / 102324-001）・h4610 系を拾う
  // 名前にサイト名が入っていれば、販売者（配信元）はその場で決まる（調べに行かない）。フォルダ名は既存の「Caribbeancom（carib）」に合わせて英語名
  const BRANDS = [
    ['caribpr', 'Caribbeancom Premium', /caribbeancompr|caribpr|カリビアンコム\s*プレミアム/i],
    ['carib', 'Caribbeancom', /caribbean|carib|カリビアン/i],
    ['1pon', '1pondo', /1pondo|1pon(?![a-z])|一本道/i],
    ['10mu', '10musume', /10musume|10mu(?![a-z])|天然むすめ/i],
    ['paco', 'Pacopacomama', /pacopacomama|(?:^|[^a-z])paco(?![a-z])|パコパコママ/i],
    ['mura', 'Muramura', /muramura|(?:^|[^a-z])mura(?![a-z])|ムラムラ/i],
  ];
  // 名前に入っている品番。FC2 は品番（「FC2 〇〇 collection 1234567 2345678」のような複数作品の名前も拾う）、
  // FC2 以外は HEYZO・h4610 系・日付型の品番（例：121815_3315-1pon / 122415-053-carib）を拾う
  function workKeys(name) {
    const n = String(name), out = [], seen = new Set();
    const add = (k) => { if (!seen.has(k.key)) { seen.add(k.key); out.push(k); } };
    if (/FC2/i.test(n)) { [...n.matchAll(/(?:^|[^\d])(\d{6,8})(?!\d)/g)].forEach((m) => add({ key: m[1], kind: 'fc2', num: m[1], label: 'FC2-PPV-' + m[1] })); return out; }
    [...n.matchAll(/heyzo[\s_-]*(\d{4})(?!\d)/gi)].forEach((m) => add({ key: 'x:heyzo-' + m[1], kind: 'brand', sid: 'heyzo', name: 'HEYZO', code: m[1], label: 'HEYZO-' + m[1] }));
    [...n.matchAll(/([hc]\d{4})[\s_-]*([a-z]{2,10})[\s_-]*(\d{3,6})(?!\d)/gi)].forEach((m) => { const b = m[1].toLowerCase(); add({ key: `x:${b}-${m[2]}${m[3]}`.toLowerCase(), kind: 'brand', sid: b, name: b.toUpperCase(), code: `${m[2]}${m[3]}`.toLowerCase(), label: `${b} ${m[2]}${m[3]}`.toLowerCase() }); });
    const br = BRANDS.find(([, , re]) => re.test(n));
    [...n.matchAll(/(?:^|[^\d])(\d{6})([-_])(\d{2,4})(?![\d])/g)].forEach((m) => {
      const code = `${m[1]}${m[2]}${m[3]}`;
      if (br) add({ key: `x:${br[0]}-${code}`, kind: 'brand', sid: br[0], name: br[1], code, date: m[1], serial: m[3], label: `${br[0]} ${code}` });
      else add({ key: `x:${code}`, kind: 'other', kw: code, digits: m[1] + m[3], prefix: '', date: m[1], serial: m[3], label: code });
    });
    return out;
  }
  const SRC_LABEL = { fd2ppv: 'fd2ppv.cc', fc2cmadb: 'fc2cmadb.com', manual: '手入力', name: '品番' };
  // 品番 1 つの結果（手入力が最優先 → 名前から決まるもの → 調べた結果）
  const keyRec = (k) => { const r = sellerDb[k.key]; if (r && r.src === 'manual') return r; if (k.kind === 'brand') return { status: 'ok', name: k.name, sid: k.sid, src: 'name' }; return r; };
  // 販売者フォルダの名前（フォルダ名に使えない / や \ は置き換える）
  const sellerFolderName = (s) => `${String(s.name || s.sid).replace(/[\/\\]/g, '・').replace(/\s+/g, ' ').trim().slice(0, 80)}（${s.sid}）`;
  // 仕分けの計画：作品フォルダごとに、移動先の種類（seller / unknown / review / pending）を決める
  // 品番の結果から、販売者が決まるか（seller）・分からないか（unknown）・判断できないか（review）・未調査か（pending）を決める
  function resolveKeys(keys) {
    const recs = keys.map(keyRec);
    if (recs.some((r) => !r)) return { kind: 'pending', note: '未調査' };
    const ok = recs.filter((r) => r.status === 'ok' && r.sid);
    const sids = [...new Set(ok.map((r) => r.sid))];
    if (keys.length > 1 && (sids.length > 1 || ok.length !== recs.length)) return { kind: 'review', why: 'multi', note: `品番が ${keys.length} つ（${recs.map((r) => (r.status === 'ok' ? r.name : '不明')).join('・')}）` };
    if (sids.length === 1) return { kind: 'seller', seller: ok[0], note: ok[0].src === 'manual' ? '手入力' : ok[0].src === 'name' ? `名前の「${keys[0].sid}」から判定` : `${SRC_LABEL[ok[0].src] || ok[0].src} で確認${ok[0].studio ? '（配信元）' : ''}` };
    return { kind: 'unknown', why: recs[0].status,
      note: recs[0].status === 'ambiguous' ? '同じ番号の作品が複数のサイトにあります'
        : keys[0].kind === 'other' ? '日付型の品番だけで、名前にサイト名がありません（名前に 1pon・carib などがあれば自動で決まります）'
        : recs[0].status === 'notfound' ? (keys[0].kind === 'fc2' ? 'fd2ppv.cc・fc2cmadb.com に見つかりません' : 'fd2ppv.cc に見つかりません') : '販売者の欄がありません' };
  }
  const boxSidOf = (name) => (String(name || '').match(/（([^（）]+)）$/) || [])[1] || '';
  // 仕分けの計画：作品フォルダごとに、移動先の種類（seller / unknown / review / pending）を決める。
  // ホームから読み込んだときは、仕分け済みの「販売者別」の中も見直す（販売者違い・置き場所違い）、同じ品番のフォルダが複数あるものも知らせる
  function buildSellerPlan(ds) {
    const cfg = sellerCfg();
    const R = ds.find((d) => d.isRoot);
    const homeScan = !!R && (!R.id || R.id === 'root');
    const byId = new Map(ds.map((d) => [d.id, d]));
    const sortedRoot = homeScan ? ds.find((d) => !d.isRoot && (d.parentId === R.id || !d.parentId || d.parentId === 'root') && d.name === cfg.root) : null;
    // 「販売者別」の中から読み込んだとき（ホーム › 販売者別 › …）は、全部が仕分け済み（見直しはホームから読み込んだときだけ）
    const insideBox = !!R && !homeScan && (R.name === cfg.root || (R.trailNames || []).slice(0, 3).includes(cfg.root) || (R.trail || []).some((id) => dirLabel(id) === cfg.root));
    const inSorted = (d) => insideBox || (!!sortedRoot && (d.id === sortedRoot.id || (d.trail || []).includes(sortedRoot.id)));
    const keysOf = new Map(); ds.forEach((d) => { if (!d.isRoot) { const k = workKeys(d.name); if (k.length) keysOf.set(d.id, k); } });
    const resOf = new Map(); const res = (id) => { if (!resOf.has(id)) resOf.set(id, resolveKeys(keysOf.get(id))); return resOf.get(id); };
    const sidOf = (id) => { const r = res(id); return r.kind === 'seller' ? r.seller.sid : ''; };
    const mk = (d, r, extra) => ({ id: d.id, name: d.name, path: d.path, parentId: d.parentId, keys: keysOf.get(d.id), kind: r.kind, seller: r.seller || null, note: r.note, why: r.why || '', depth: (d.trail || []).length, ...extra });
    const plan = [];
    // 1. まだ仕分けていない作品フォルダ
    const cand = ds.filter((d) => keysOf.has(d.id) && !inSorted(d));
    const candIds = new Set(cand.map((d) => d.id));
    cand.forEach((d) => {
      const anc = (d.trail || []).slice(0, -1).filter((id) => candIds.has(id));
      if (anc.length) {
        // 作品フォルダの中の作品フォルダ：外側と同じ販売者なら一緒に動かす。違うときは、先にこれだけを外へ出す
        // 作品フォルダの中の別の作品フォルダ（入れ子）は、いったん My Pack へ出す
        const outer = anc[anc.length - 1];
        const on = (byId.get(outer) || {}).name || dirLabel(outer) || '';
        plan.push(mk(d, res(d.id), { fix: 'nest', nested: on, note: `「${on}」の中にあります（入れ子）→ いったん My Pack へ出して、仕分け直します` }));
        return;
      }
      const r = res(d.id);
      // 中に別の販売者の作品フォルダがあるときは、自動では動かさない
      const mySid = sidOf(d.id);
      const others = cand.filter((x) => x.id !== d.id && (x.trail || []).includes(d.id));
      if (others.length) { plan.push(mk(d, { kind: 'review', why: 'inner', note: `中に作品フォルダが ${others.length} つあります（入れ子）。中の作品を My Pack へ出すと、このフォルダも仕分けできます` })); return; }
      plan.push(mk(d, r));
    });
    // 2. 仕分け後の確認（ホームから読み込んだときだけ）：「販売者別」の中の作品フォルダが正しい場所にあるか
    if (sortedRoot) {
      ds.filter((d) => keysOf.has(d.id) && (d.trail || []).includes(sortedRoot.id) && d.parentId !== sortedRoot.id).forEach((d) => {
        const tr = d.trail || [], bi = tr.indexOf(sortedRoot.id);
        const box = byId.get(tr[bi + 1]); if (!box || box.id === d.id) return;
        // 外側の作品フォルダと同じ販売者なら、外側に任せる
        const anc = tr.slice(bi + 2, -1).filter((id) => keysOf.has(id));
        const r = res(d.id), sid = sidOf(d.id), bsid = boxSidOf(box.name);
        if (anc.length) { const on = (byId.get(anc[anc.length - 1]) || {}).name || ''; plan.push(mk(d, r, { fix: 'nest', nested: on, note: `「${on}」の中にあります（入れ子・今：${box.name}）→ いったん My Pack へ出して、仕分け直します` })); return; }
        const where = (d.path || '').replace(/\/[^/]*$/, '') || '/';
        if (r.kind === 'seller') {
          if (bsid && sid !== bsid) plan.push(mk(d, r, { fix: 'wrong', note: `販売者が違います（今：${box.name}）・${r.note}` }));
          else if (!bsid && (box.name === cfg.unknown || box.name === cfg.review) && !ds.some((x) => x.parentId !== d.parentId && x.name.toLowerCase() === d.name.toLowerCase() && boxSidOf((byId.get(x.parentId) || {}).name) === sid)) plan.push(mk(d, r, { fix: 'found', note: `販売者が分かりました（今：${box.name}）・${r.note}` }));
          else if (bsid && d.parentId !== box.id) plan.push(mk(d, r, { fix: 'deep', note: `販売者フォルダの直下にありません（今：${where}/）` }));
        } else if (r.kind === 'pending' && bsid) plan.push(mk(d, r, { fix: 'pend', note: `仕分け済みの中・未調査（今：${box.name}）` }));
      });
    }
    // 3. 同じ品番のフォルダが複数（確認用。移動はしない）
    if (homeScan) {
      const byKey = new Map();
      ds.forEach((d) => { const ks = keysOf.get(d.id); if (!ks || ks.length !== 1) return; const k = ks[0].key; if (!byKey.has(k)) byKey.set(k, []); byKey.get(k).push(d); });
      byKey.forEach((list) => {
        // 入れ子（外側と内側）は同じ作品なので除く
        const top = list.filter((d) => !list.some((o) => o.id !== d.id && (d.trail || []).includes(o.id)));
        if (top.length < 2) return;
        const d = top[0];
        plan.push({ id: 'dup:' + d.id, name: d.name, path: d.path, parentId: d.parentId, keys: keysOf.get(d.id), kind: 'dupw', seller: null, note: `同じ品番のフォルダが ${top.length} つ：${top.map((x) => (x.path || '').replace(/^\//, '')).join(' ／ ')}`, why: '', depth: 0, dupIds: top.map((x) => x.id) });
      });
    }
    return plan;
  }
  // 「販売者別」とその直下（販売者・不明・要確認のフォルダ）。ほかのステップで名前を変えないように使う
  function sellerBoxIds(ds) {
    const cfg = sellerCfg();
    const R = ds.find((d) => d.isRoot);
    const top = (d) => d.parentId === '' || d.parentId === 'root' || (R && (!R.id || R.id === 'root') && d.parentId === R.id);
    const box = ds.find((d) => !d.isRoot && top(d) && d.name === cfg.root);
    return new Set(box ? [box.id, ...ds.filter((d) => d.parentId === box.id).map((d) => d.id)] : []);
  }
  let selPlan = [];
  const sellerSel = new Map(); // 作品フォルダ → チェック（未記録は seller だけチェックあり）
  const sellerChecked = (p) => ((p.kind === 'pending' && p.fix !== 'nest') || p.kind === 'dupw' ? false : sellerSel.has(p.id) ? sellerSel.get(p.id) : (p.fix === 'nest' || (p.kind === 'seller' && !p.fix)));
  const SELLER_KIND = { seller: '決まった', unknown: '販売者不明', review: '要確認', pending: '未調査' };
  let sellerFilter = 'all'; // 絞り込みのタブ
  let sellerAck = false; // ②「確かめる・入力」を済ませて ③ へ進んだか
  // 外部サイトで確かめる（品番は各サイトの形に直して開く）
  function extSites(k) {
    if (k.kind === 'fc2') {
      const id = 'FC2-PPV-' + k.num;
      return [['FD2PPV', 'FC2・配信元', `${FD2}/articles/${k.num}`], ['FC2CMADB', 'FC2 販売者', `${CMADB}/articles/${k.num}`], ['FC2DB', 'FC2 販売者', `https://fc2db.net/work/${k.num}/`], ['FC2', '公式', `https://adult.contents.fc2.com/article/${k.num}/`],
        ['MissAV', '作品', `https://missav.ws/cn/fc2-ppv-${k.num}`], ['Supjav', '作品', `https://supjav.com/zh/?s=${encodeURIComponent(id)}`], ['JavDB', '作品', `https://javdb.com/search?q=${encodeURIComponent(id)}&f=all`], ['Sukebei', '名前で検索', `https://sukebei.nyaa.si/?f=0&c=0_0&q=${encodeURIComponent(id)}`]];
    }
    const short = k.kind === 'brand' && k.date ? k.sid : '';
    const code = k.date && short ? `${k.date}${short === 'carib' ? '-' : '_'}${k.serial}` : k.kw || k.code || '';
    const jav = short ? `${short.toUpperCase()}-${k.date}-${k.serial}` : k.label;
    const suke = short ? `${code}-${short}` : (k.kw || k.label);
    return [['FD2PPV', '配信元', `${FD2}/articles/?keyword=${encodeURIComponent(k.kw || k.label)}`], ['JavDB', 'メーカー', `https://javdb.com/search?q=${encodeURIComponent(jav)}&f=all`], ['JavBus', 'メーカー', `https://www.javbus.com/${encodeURIComponent(jav)}`],
      ['JavLibrary', 'メーカー', `https://www.javlibrary.com/cn/vl_searchbyid.php?keyword=${encodeURIComponent(jav)}`], ['MissAV', '作品', `https://missav.ws/cn/${encodeURIComponent(jav.toLowerCase())}`], ['Supjav', '作品', `https://supjav.com/zh/?s=${encodeURIComponent(code || jav)}`],
      ['Sukebei', '名前で検索', `https://sukebei.nyaa.si/?f=0&c=0_0&q=${encodeURIComponent(suke)}`], ['DMM', 'FANZA', `https://www.dmm.co.jp/search/=/searchstr=${encodeURIComponent(code || jav)}`]];
  }
  function openExt(btn, id) {
    closeExt();
    const p = selPlan.find((x) => x.id === id); if (!p) return;
    const d = document.createElement('div'); d.id = 'pd-ext';
    d.innerHTML = `<div class="hd"><b>外部サイトで確かめる</b><button data-x title="閉じる（Esc）" aria-label="閉じる">${IC.x}</button></div>` + p.keys.map((k) => `<div class="kw raw">${esc(k.label)}</div><div class="gr">${extSites(k).map(([n, s, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer"><b class="raw">${n}</b><small>${esc(s)}</small></a>`).join('')}</div>`).join('') + '<div class="ft">分かったら、行の入力欄に販売者名と ID を入れて「保存」</div>';
    document.body.appendChild(d);
    const r = btn.getBoundingClientRect(), w = d.offsetWidth, h = d.offsetHeight;
    d.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.right - w)) + 'px';
    d.style.top = (r.bottom + 6 + h > window.innerHeight - 8 ? Math.max(8, r.top - h - 6) : r.bottom + 6) + 'px';
    d.querySelector('[data-x]').onclick = closeExt;
    if (LANG === 'en') d.querySelectorAll('*').forEach(trNode);
  }
  function closeExt() { const d = document.getElementById('pd-ext'); if (d) d.remove(); }
  document.addEventListener('mousedown', (e) => { const d = document.getElementById('pd-ext'); if (d && !d.contains(e.target) && !e.target.closest('[data-sext]')) closeExt(); }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.getElementById('pd-ext')) { e.preventDefault(); e.stopImmediatePropagation(); closeExt(); } }, true);
  // 行の中で販売者を保存
  function saveRowSeller(id) {
    const p = selPlan.find((x) => x.id === id); if (!p) return;
    const row = $(`[data-srow="${CSS.escape(id)}"]`); if (!row) return;
    const name = row.querySelector('[data-sname]').value.trim();
    const sid = row.querySelector('[data-ssid]').value.trim().replace(/^.*\/(users|writers|channels)\//, '').replace(/[\/?#].*$/, '');
    const err = row.querySelector('[data-serr]');
    if (!name || !/^[A-Za-z0-9_.-]{1,64}$/.test(sid)) { err.textContent = tr('販売者名と販売者ID（英数字）を入れてください'); return; }
    p.keys.forEach((k) => { sellerDb[k.key] = { name, sid, src: 'manual', status: 'ok', at: Date.now() }; });
    saveSellerDb(); sellerSel.delete(id); log('info', `販売者を手入力：${p.name} → ${name}（${sid}）`);
    setView('seller');
  }
  // 次にやること（① 調べる → ② 確かめる・入力 → ③ 移動）
  function sellerStage() {
    const n = (k) => selPlan.filter((p) => p.kind === k).length;
    if (n('pending')) return 1;
    if ((n('unknown') || n('review')) && !sellerAck) return 2;
    return 3;
  }
  function sellerGuideHtml() {
    const n = (k) => selPlan.filter((p) => p.kind === k).length;
    const st = sellerStage(), pend = n('pending'), unk = n('unknown') + n('review');
    const auto = selPlan.filter((p) => p.kind === 'seller' && p.seller.src === 'name').length;
    const looked = selPlan.filter((p) => p.kind === 'seller' && p.seller.src !== 'name' && p.seller.src !== 'manual').length;
    const manual = selPlan.filter((p) => p.kind === 'seller' && p.seller.src === 'manual').length;
    const mv = selPlan.filter((p) => (p.kind !== 'pending' || p.fix === 'nest') && sellerChecked(p)).length;
    const steps = [['販売者を調べる', pend ? `未調査 ${pend} 件` : '未調査はありません'], ['確かめる・入力', unk ? `分からない ${unk} 件` : '分からないものはありません'], ['移動', `チェック ${mv} 件`]];
    const flow = steps.map(([t, s], i) => `<div class="st ${i + 1 < st ? 'done' : i + 1 === st ? 'now' : ''}"><span class="n">${i + 1 < st ? '✓' : i + 1}</span><span class="t"><b>${t}</b><small>${esc(s)}</small></span></div>`).join('<i class="ln"></i>');
    const parts = [auto ? `品番から判定 ${auto}` : '', looked ? `サイトで確認 ${looked}` : '', manual ? `手入力 ${manual}` : ''].filter(Boolean).join('・');
    let msg = '';
    if (st === 1 && lookupSt.on) {
      const L = lookupSt, pct = Math.floor(L.done / Math.max(1, L.total) * 100);
      msg = `<div class="tx"><b>${L.challenge ? `${esc(L.challenge)} の確認画面が出ています。前に出した小さなウィンドウで確認を済ませてください` : L.paused ? '一時停止しています' : '販売者を調べています'}</b><small>${L.cur ? `調べている作品：${esc(L.cur)}（${esc(L.site)}）` : ''}${L.challenge ? '' : '　小さなウィンドウは画面の端に寄せてあります（閉じると止まります）'}</small>
        <div class="sl-prog"><div class="bar"><i class="ok" style="width:${L.ok / Math.max(1, L.total) * 100}%"></i><i class="ng" style="width:${L.miss / Math.max(1, L.total) * 100}%"></i></div>
        <div class="nums"><b>${L.done} / ${L.total}（${pct}%）</b><span>🟩 分かった ${L.ok}</span><span>⬜ 分からない ${L.miss}</span><span>${esc(lookupEta())}（1 件 ${sellerCfg().interval} 秒＋読み込み）</span></div></div></div>
        <button data-a="spause">${L.paused ? '再開' : '一時停止'}</button><button data-a="stop">中断</button>`;
    } else if (st === 1) msg = `<div class="tx"><b>未調査が ${pend} 件あります。まず販売者を調べます</b><small>小さなウィンドウで fd2ppv.cc（見つからなければ fc2cmadb.com）の作品ページを順に開いて調べます。調べるだけでは移動しません。</small></div><button class="pri" data-a="slookup"${busy ? ' disabled' : ''}>販売者を調べる（${pend} 件）</button>`;
    else if (st === 2) msg = `<div class="tx"><b>${unk} 件は販売者が分かりませんでした。外部サイトで確かめて入力してください</b><small>${selPlan.length} 件中 ${selPlan.length - unk} 件は決まりました${parts ? `（${parts}）` : ''}。入力しなくても「${esc(sellerCfg().unknown)}」「${esc(sellerCfg().review)}」へまとめて移動できます。</small></div><button class="pri" data-a="sshowunk">分からない ${unk} 件を確かめる</button><button data-a="sack">このまま ③ 移動へ</button>`;
    else msg = `<div class="tx"><b>${mv ? `チェックした ${mv} 件を移動できます。下のボタンで実行します` : 'チェックの入った作品がありません'}</b><small>${selPlan.length} 件中 ${selPlan.length - unk} 件は販売者が決まりました${parts ? `（${parts}）` : ''}。まずは「先頭1件だけ試す」で動きを確かめてください。削除はしません。</small></div>${unk ? `<button data-a="sunack">② に戻る（分からない ${unk} 件）</button>` : ''}`;
    return `<section class="sl-guide" aria-label="次にやること"><div class="fl">${flow}</div><div class="msg">${msg}</div></section>`;
  }
  function sellerBarHtml() {
    if (busy) return '';
    const sel = selPlan.filter((p) => (p.kind !== 'pending' || p.fix === 'nest') && sellerChecked(p));
    const cfg = sellerCfg();
    const cnt = new Map(); sel.forEach((p) => { const k = p.fix === 'nest' ? 'My Pack へ' : p.kind === 'seller' ? p.seller.name : p.kind === 'unknown' ? cfg.unknown : cfg.review; cnt.set(k, (cnt.get(k) || 0) + 1); });
    const brk = [...cnt.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${esc(k)} ${v}`).join('・') + (cnt.size > 6 ? ' …' : '');
    const unk = selPlan.filter((p) => (p.kind === 'unknown' || p.kind === 'review') && !sellerChecked(p)).length;
    return `<span class="n">${sellerStage() === 3 ? '③' : '移動'}</span><span class="tx"><b>${sel.length ? `移動するもの ${sel.length} 作品` : 'チェックの入った作品がありません'}</b><small>${sel.length ? `（${brk}）` : ''}${unk ? `　分からない ${unk} 件はチェックを入れると「${esc(cfg.unknown)}」などへ一緒に移動します` : ''}</small></span>
      <button data-a="seller1"${sel.length ? '' : ' disabled'}>先頭1件だけ試す</button><button class="${sellerStage() === 3 ? 'pri' : 'sec'}" data-a="sellerall"${sel.length ? '' : ' disabled'}>${sel.length} 作品を移動</button>`;
  }
  // 一覧を作り直さずに、上の案内と下の帯だけを更新する（入力中の欄を消さないため）
  function refreshSellerChrome() {
    if (view !== 'seller') return;
    const bar = $('[data-r=slbar]'); if (bar) bar.innerHTML = sellerBarHtml();
    const g = $('[data-r=main] .sl-guide'); if (g && selPlan.length) g.outerHTML = sellerGuideHtml();
    if (LANG === 'en') root.querySelectorAll('[data-r=slbar] *, [data-r=main] .sl-guide *').forEach(trNode);
  }
  function renderSeller() {
    const cfg = sellerCfg();
    if (!sellerEnabled()) { $('[data-r=main]').innerHTML = `<div class="pd-hero"><h2>このステップはオフになっています</h2><div class="note">右上の「このステップを使う」か、設定の「整理」でオンにできます。</div></div>${nextButton()}`; if (!busy) status('販売者ごとの仕分けはオフです。'); return; }
    const by = (k) => selPlan.filter((p) => p.kind === k);
    if (sellerFilter !== 'all' && !(sellerFilter === 'fix' ? selPlan.some((p) => p.fix) : by(sellerFilter).length)) sellerFilter = 'all';
    const show = sellerFilter;
    const ix = buildTreeIndex();
    const R = folders.find((d) => d.isRoot);
    const homeScan = !!R && (!R.id || R.id === 'root');
    const sellers = new Map();
    by('seller').filter((p) => !p.fix).forEach((p) => { const k = p.seller.sid; if (!sellers.has(k)) sellers.set(k, { s: p.seller, items: [] }); sellers.get(k).items.push(p); });
    const groups = [];
    const fixes = selPlan.filter((p) => p.fix);
    if (show === 'all' || show === 'fix') if (fixes.length) groups.push({ key: 'k:fix', title: '置き場所の修正（入れ子・販売者違いなど）', dest: '', items: fixes, cls: ' warn', hint: '入れ子は My Pack へ出します（初めからチェック）。ほかは正しい販売者フォルダへ（初めはチェックなし）' });
    if (show === 'all' || show === 'unknown') if (by('unknown').length) groups.push({ key: 'k:unknown', title: cfg.unknown, dest: `${cfg.root}/${cfg.unknown}/`, items: by('unknown'), cls: ' unk', hint: '入力すると、その販売者の組へ移ります' });
    if (show === 'all' || show === 'review') if (by('review').length) groups.push({ key: 'k:review', title: cfg.review, dest: `${cfg.root}/${cfg.review}/`, items: by('review'), cls: ' warn', hint: '自動では移動しません（初めはチェックなし）' });
    if (show === 'all' || show === 'pending') if (by('pending').filter((p) => !p.fix).length) groups.push({ key: 'k:pending', title: SELLER_KIND.pending, dest: '', items: by('pending').filter((p) => !p.fix), cls: ' pend', hint: '「販売者を調べる」で調べます（調べるだけでは移動しません）' });
    if (show === 'all' || show === 'dupw') if (by('dupw').length) groups.push({ key: 'k:dupw', title: '同じ品番のフォルダが複数（確認用）', dest: '', items: by('dupw'), cls: ' pend', hint: '移動はしません。「6. 重複を比べて削除」や「5. フォルダ名を揃える」で整理できます' });
    if (show === 'all' || show === 'seller') [...sellers.values()].sort((a, b) => b.items.length - a.items.length || String(a.s.name).localeCompare(String(b.s.name), 'ja')).forEach((g) => groups.push({ key: 's:' + g.s.sid, title: g.s.name, sid: g.s.sid, dest: `${cfg.root}/${sellerFolderName(g.s)}/`, items: g.items, cls: '' }));
    const thumb = (p) => { const f = ix.thumbOf.get(p.id); return f && f.thumb ? `<img loading="lazy" referrerpolicy="no-referrer" src="${esc(f.thumb)}" alt="">` : ''; };
    const sz = (p) => { const a = ix.agg.get(p.id); return a ? fmt(a.size) : ''; };
    const known = new Map(); Object.values(sellerDb).forEach((r) => { if (r && r.status === 'ok' && r.sid && !known.has(r.sid)) known.set(r.sid, r.name); });
    const BADGE = { seller: ['ok', ''], unknown: ['unk', '販売者不明'], review: ['warn', '要確認'], pending: ['pend', '未調査'] };
    const row = (p) => {
      const on = sellerChecked(p);
      const [bc, bt] = p.kind === 'dupw' ? ['warn', '重複'] : p.fix ? ['warn', p.fix === 'nest' ? '入れ子' : p.fix === 'wrong' ? '販売者違い' : p.fix === 'deep' ? '置き場所違い' : p.fix === 'found' ? '販売者が判明' : '未調査'] : p.kind === 'seller' ? (p.seller.src === 'name' ? ['auto', '品番から判定'] : p.seller.src === 'manual' ? ['man', '手入力'] : ['ok', 'サイトで確認']) : BADGE[p.kind];
      const canRedo = p.kind === 'unknown' && p.keys.some((k) => k.kind !== 'brand' && sellerDb[k.key] && sellerDb[k.key].src !== 'manual');
      const input = p.kind === 'unknown' || p.kind === 'review'
        ? `<div class="sl-in"><input type="text" data-sname list="pd-sellers" placeholder="販売者名" value="${esc(p.seller ? p.seller.name : '')}"><input type="text" data-ssid class="raw" placeholder="ID" value="${esc(p.seller ? p.seller.sid : '')}"><button data-ssave="${esc(p.id)}">保存</button><button data-sext="${esc(p.id)}">外部サイト ▾</button>${canRedo ? `<button data-sredo="${esc(p.id)}" title="調べた結果を消して、もう一度調べる対象に戻します">調べ直す</button>` : ''}<span class="err" data-serr></span></div>`
: p.kind === 'pending' || p.kind === 'dupw' ? '' : p.fix ? `<div class="pd-act" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><span class="note">→ ${p.fix === 'nest' ? 'My Pack/' : `${esc(sellerCfg().root)}/${esc(sellerFolderName(p.seller))}/`}</span><button data-sext="${esc(p.id)}">外部サイト ▾</button><button data-sedit="${esc(p.id)}">販売者を変更</button></div>` : `<div class="pd-act" style="display:flex;gap:6px;flex-wrap:wrap"><button data-sext="${esc(p.id)}">外部サイト ▾</button><button data-sedit="${esc(p.id)}">販売者を変更</button></div>`;
      return `<div class="pd-row sl-row${on ? ' sel' : ''}" data-srow="${esc(p.id)}"><label class="pd-chk"><input type="checkbox" data-schk="${esc(p.id)}"${on ? ' checked' : ''}${(p.kind === 'pending' && p.fix !== 'nest') || p.kind === 'dupw' ? ' disabled' : ''}></label>
        <div class="pd-th" style="width:112px;height:63px">${thumb(p)}</div>
        <div class="pd-info"><div class="pd-name">${esc(p.name)}</div><div class="pd-path">今の場所：${esc((p.path || '').replace(/\/[^/]*$/, '') || '/')}/・${sz(p)}</div><div class="sl-why"><span class="sl-b ${bc}">${bt}</span><span class="note">${esc(p.note)}</span></div></div>
        ${input}</div>`;
    };
    const tagNew = (g) => { if (!g.sid) return ''; const ex = sellerFolderExists(g.sid); return `<span class="pd-tag" style="${ex ? '' : 'background:var(--pri-soft);color:var(--pri)'}">${ex ? '既にあるフォルダ' : '新しく作るフォルダ'}</span>`; };
    const body = groups.map((g) => {
      const all = g.items.filter((p) => p.kind !== 'pending' && p.kind !== 'dupw'), on = all.filter(sellerChecked);
      return `<div class="pd-g${g.cls}"><div class="pd-gh">${g.key === 'k:pending' || g.key === 'k:dupw' ? '' : `<input type="checkbox" data-sgrp="${esc(g.key)}"${all.length && on.length === all.length ? ' checked' : ''} title="この組をすべて選ぶ／外す">`}<b>${esc(g.title)}</b>${g.sid ? `<span class="note raw">（${esc(g.sid)}）</span>` : ''}${tagNew(g)}${g.dest ? `<span class="note">→ ${esc(g.dest)}</span>` : ''}<span class="sp" style="flex:1"></span>${g.hint ? `<span class="note">${esc(g.hint)}</span>` : ''}<span class="note">${g.items.length} 作品</span></div>${g.items.map(row).join('')}</div>`;
    }).join('');
    const tab = (k, label, color, n) => `<button role="tab" data-sfilter="${k}" class="${show === k ? 'on' : ''}" aria-selected="${show === k}"${n || k === 'all' ? '' : ' disabled'}><i style="background:${color}"></i>${label}<b>${n}</b></button>`;
    const tabs = selPlan.length ? `<div class="sl-tabs" role="tablist" aria-label="表示">${tab('all', 'すべて', '#c5c9d2', selPlan.length)}${tab('unknown', '販売者不明', '#8b91a1', by('unknown').length)}${tab('review', '要確認', '#c27a00', by('review').length)}${tab('pending', '未調査', '#dde0e6', by('pending').length)}${fixes.length ? tab('fix', '置き場所の修正', '#c27a00', fixes.length) : ''}${by('dupw').length ? tab('dupw', '同じ品番が複数', '#8b91a1', by('dupw').length) : ''}${tab('seller', `決まった（${sellers.size} 販売者）`, '#306fff', by('seller').length)}</div>` : '';
    $('[data-r=main]').innerHTML = `${selPlan.length ? sellerGuideHtml() : ''}${tabs}
      ${homeScan ? '' : '<div class="pd-explain"><b>ホームから読み込んでいません。</b><div class="note">移動先の「' + esc(cfg.root) + '」はホームの直下に作るため、移動した作品は読み込んだ場所の外に出て、重複チェックなどの対象から外れます。ホームを開いて読み込み直すと、仕分け後もまとめて管理できます。</div></div>'}
      ${body || '<div class="empty">' + (selPlan.length ? '表示する作品はありません' : '✓ 仕分けが必要な作品フォルダはありません（FC2-PPV-品番・HEYZO・カリビアンコムなどの品番の名前のフォルダが対象です）') + '</div>'}
      <datalist id="pd-sellers">${[...known.entries()].map(([sid, nm]) => `<option value="${esc(nm)}" label="${esc(sid)}"></option>`).join('')}</datalist>
      ${selPlan.length ? `<div class="sl-bar" data-r="slbar">${sellerBarHtml()}</div>` : nextButton()}`;
    if (!busy) status(sellerStage() === 1 ? `未調査 ${by('pending').length} 件。上の「販売者を調べる」で調べます（移動はしません）。` : sellerStage() === 2 ? '分からなかった作品は、外部サイトで確かめて販売者を入力できます。' : '内容を確認して、まずは「先頭1件だけ試す」で動きを確かめてください。削除はしません。');
  }
  // 「販売者別」の中に、その販売者ID のフォルダが既にあるか（ホームから読み込んだときだけ分かる）
  function sellerFolderExists(sid) {
    const cfg = sellerCfg();
    const R = folders.find((d) => d.isRoot); if (!R || (R.id && R.id !== 'root')) return false;
    const root = folders.find((d) => !d.isRoot && (d.parentId === R.id || !d.parentId || d.parentId === 'root') && d.name === cfg.root);
    return !!root && folders.some((d) => d.parentId === root.id && d.name.endsWith(`（${sid}）`));
  }
  // 販売者の入力（不明・要確認・変更）
  function askSeller(p) {
    return new Promise((resolve) => {
      const cur = p.seller || {};
      const fc2 = p.keys.some((k) => k.kind === 'fc2');
      const d = document.createElement('div'); d.id = 'pd-dlg';
      d.innerHTML = `<div class="box" style="width:min(520px,94vw)"><h3>販売者を入力</h3>
        <div class="note raw" style="margin-bottom:8px">${esc(p.name)}</div>
        <label style="display:block;margin:8px 0 4px">${fc2 ? '販売者名' : '販売者名（配信元。例：カリビアンコム）'}</label><input type="text" data-sn value="${esc(cur.name || '')}" style="width:100%;box-sizing:border-box;font:inherit;padding:6px 10px;border:1px solid #c5c9d2;border-radius:8px">
        <label style="display:block;margin:10px 0 4px">${fc2 ? '販売者ID（FC2 の販売者ページ adult.contents.fc2.com/users/〇〇/ の 〇〇）' : '販売者ID（英数字。例：carib）'}</label><input type="text" data-si value="${esc(cur.sid || '')}" style="width:100%;box-sizing:border-box;font:inherit;padding:6px 10px;border:1px solid #c5c9d2;border-radius:8px">
        <div class="note" style="margin-top:8px">既に同じ ID のフォルダがあれば、そこへ入れます。入力した内容は調べた結果より優先します。</div>
        <div class="acts" style="margin-top:14px">${p.seller ? '<button data-clear>入力を消す</button>' : ''}<span style="flex:1"></span><button data-no>キャンセル</button><button class="danger" data-yes style="background:#306fff;border-color:#306fff">保存</button></div></div>`;
      document.body.appendChild(d);
      const done = (v) => { d.remove(); resolve(v); };
      d.querySelector('[data-no]').onclick = () => done(null);
      const c = d.querySelector('[data-clear]'); if (c) c.onclick = () => done({ clear: true });
      d.querySelector('[data-yes]').onclick = () => {
        const name = d.querySelector('[data-sn]').value.trim(), sid = d.querySelector('[data-si]').value.trim().replace(/^.*\/(users|writers|channels)\//, '').replace(/[\/?#].*$/, '');
        if (!name || !sid || !/^[A-Za-z0-9_.-]{1,64}$/.test(sid)) { d.querySelector('.note:last-of-type').textContent = '販売者名と販売者ID（英数字）を入れてください'; return; }
        done({ name, sid });
      };
      d.addEventListener('keydown', (e) => { if (e.key === 'Escape') done(null); });
      d.querySelector('[data-sn]').focus();
    });
  }
  async function editSeller(id) {
    const p = selPlan.find((x) => x.id === id); if (!p) return;
    const v = await askSeller(p); if (!v) return;
    if (v.clear) p.keys.forEach((k) => { if (sellerDb[k.key] && sellerDb[k.key].src === 'manual') delete sellerDb[k.key]; });
    else p.keys.forEach((k) => { sellerDb[k.key] = { name: v.name, sid: v.sid, src: 'manual', status: 'ok', at: Date.now() }; });
    saveSellerDb(); sellerSel.delete(id); log('info', `販売者を手入力：${p.name} → ${v.clear ? '（消去）' : v.name + '（' + v.sid + '）'}`);
    setView('seller');
  }
  // ---- 販売者を調べる（小さなウィンドウでページを順に開き、そのページの上のスクリプトから結果を受け取る） ----
  let lookupSeq = 0;
  function visitAndWait(win, origin, url, onChallenge, num) {
    return new Promise((resolve) => {
      const token = 'p' + Date.now().toString(36) + (++lookupSeq);
      let limit = 30000, timer = null, challenged = false;
      let kwq = ''; try { kwq = new URL(url).searchParams.get('keyword') || ''; } catch (e) { /* 無視 */ }
      const off = () => { clearTimeout(timer); clearInterval(watch); window.removeEventListener('message', on); };
      const arm = () => { clearTimeout(timer); timer = setTimeout(() => { off(); resolve({ status: challenged ? 'challenge' : 'timeout' }); }, limit); };
      const on = (e) => {
        if (e.origin !== origin || !e.data || e.data.type !== 'ppdup-seller') return;
        // 合言葉で照合する（画面を後から組み立てるサイトで # が消えたときは品番で照合）
        if (e.data.token ? e.data.token !== token : !((num && e.data.num === num) || (kwq && e.data.kw === kwq))) return;
        if (e.data.status === 'challenge') { if (!challenged) { challenged = true; limit = 5 * 60 * 1000; arm(); onChallenge(origin); } return; } // 確認を済ませるとページが切り替わり、もう一度知らせが来る
        off(); resolve(e.data);
      };
      const watch = setInterval(() => { if (win.closed) { off(); resolve({ status: 'closed' }); } }, 500);
      window.addEventListener('message', on); arm();
      try { win.location.href = `${url}#ppdup-lookup=${token}`; } catch (err) { off(); resolve({ status: 'closed' }); }
    });
  }
  // 1 つの品番を調べる：FC2 は fd2ppv.cc → 見つからなければ fc2cmadb.com、それ以外は fd2ppv.cc で検索して作品ページの配信元
  async function lookupKey(win, k, onChallenge) {
    const stopped = (r) => r.status === 'closed' || r.status === 'challenge';
    if (k.kind === 'fc2') {
      const a = await visitAndWait(win, FD2, `${FD2}/articles/${encodeURIComponent(k.num)}`, onChallenge, k.num);
      if (stopped(a) || a.status === 'ok') return { ...a, src: 'fd2ppv' };
      await sleep(sellerCfg().interval * 1000);
      const b = await visitAndWait(win, CMADB, `${CMADB}/articles/${encodeURIComponent(k.num)}`, onChallenge, k.num);
      if (stopped(b) || b.status === 'ok') return { ...b, src: 'fc2cmadb' };
      return { status: a.status === 'noseller' || b.status === 'noseller' ? 'noseller' : a.status === 'timeout' && b.status === 'timeout' ? 'timeout' : 'notfound', src: 'fd2ppv' };
    }
    const s = await visitAndWait(win, FD2, `${FD2}/articles/?keyword=${encodeURIComponent(k.kw)}`, onChallenge);
    if (stopped(s) || s.status === 'timeout') return { ...s, src: 'fd2ppv' };
    // 検索結果から、品番の数字が一致する作品を選ぶ（例：carib-033118_001 → 033118001）
    const hits = (s.hits || []).map((h) => String(h).split('/').pop()).filter((slug) => { const dg = slug.replace(/^[a-z][a-z0-9]*?-/i, '').replace(/\D/g, ''); return dg === k.digits && (!k.prefix || slug.toLowerCase().startsWith(k.prefix + '-')); });
    if (!hits.length) return { status: 'notfound', src: 'fd2ppv' };
    // 同じ番号が別のサイトにもあって決められないときは「販売者不明」にする（手入力で決める）
    if (new Set(hits.map((h) => h.split('-')[0].toLowerCase())).size > 1) return { status: 'ambiguous', src: 'fd2ppv' };
    const hit = hits[0];
    await sleep(sellerCfg().interval * 1000);
    const slug = String(hit).split('/').pop();
    const a = await visitAndWait(win, FD2, `${FD2}/articles/${encodeURIComponent(slug)}`, onChallenge, slug);
    return { ...a, src: 'fd2ppv' };
  }
  // 調べている間の進み具合（「販売者を調べる」の枠に出す）
  let lookupSt = { on: false, total: 0, done: 0, ok: 0, miss: 0, cur: '', site: '', paused: false, t0: 0, challenge: '' };
  // 小さなウィンドウ：確認画面が出たら前に出し、済んだら小さくして画面の端に寄せる（ほかのサイトに埋め込めないため、完全には隠せない）
  function parkWin(win) { try { win.resizeTo(340, 220); win.moveTo(Math.max(0, screen.availWidth - 360), Math.max(0, screen.availHeight - 260)); } catch (e) { /* 無視 */ } try { window.focus(); } catch (e) { /* 無視 */ } }
  function showWin(win) { try { win.resizeTo(560, 720); win.moveTo(Math.max(0, (screen.availWidth - 560) / 2), Math.max(0, (screen.availHeight - 720) / 2)); win.focus(); } catch (e) { /* 無視 */ } }
  const lookupEta = () => { const d = lookupSt.done, el = Date.now() - lookupSt.t0; if (d < 2) return '残り時間を計算中…'; return `あと約 ${fmtDur((lookupSt.total - d) * el / d)}`; };
  async function runSellerLookup() {
    if (busy) return;
    const keys = []; const seen = new Set();
    selPlan.filter((p) => p.kind === 'pending').forEach((p) => p.keys.forEach((k) => { if (k.kind !== 'brand' && !sellerDb[k.key] && !seen.has(k.key)) { seen.add(k.key); keys.push(k); } }));
    if (!keys.length) { status('未調査の作品はありません。'); return; }
    // ポップアップを止められないよう、押した直後に開く
    let win = window.open('about:blank', 'ppdup-lookup', 'width=560,height=720');
    if (!win) { status('小さなウィンドウを開けませんでした。ブラウザのアドレスバーで、このサイトのポップアップを許可してから、もう一度押してください。'); return; }
    const cfg = sellerCfg();
    busy = true; window.__ppdupStop = false; renderNav(); renderToolbar();
    let done = 0, ok = 0, miss = 0, stop = '', parked = false;
    lookupSt = { on: true, total: keys.length, done: 0, ok: 0, miss: 0, cur: '', site: '', paused: false, t0: Date.now(), challenge: '' };
    refreshSellerChrome();
    for (const k of keys) {
      while (lookupSt.paused && !window.__ppdupStop) await sleep(300);
      if (window.__ppdupStop) { stop = '中断しました'; break; }
      lookupSt.cur = k.label; lookupSt.site = k.kind === 'fc2' ? 'fd2ppv.cc → fc2cmadb.com' : 'fd2ppv.cc'; lookupSt.challenge = '';
      status(`販売者を調べています… ${done + 1}/${keys.length}：${k.label}`, done / keys.length, lookupEta());
      refreshSellerChrome();
      const onCh = (origin) => { lookupSt.challenge = origin.replace('https://', ''); showWin(win); parked = false; refreshSellerChrome(); status(`${origin.replace('https://', '')} の確認画面が出ています。開いた小さなウィンドウで確認を済ませてください（済むと自動で続きます）：${k.label}`, done / keys.length);};
      let r = await lookupKey(win, k, onCh);
      // 確認画面（Cloudflare・年齢確認など）を挟んだあとや、結果が返らず止まったときは、ウィンドウを開き直して同じ作品をもう一度調べる
      for (let retry = 0; retry < 2 && (r.status === 'timeout' || r.status === 'challenge' || (r.status === 'closed' && retry === 0 && lookupSt.challenge)) && !window.__ppdupStop; retry++) {
        log('info', `販売者の調査：開き直してもう一度調べます（${r.status}）`, k.label);
        try { win.close(); } catch (e) { /* 無視 */ }
        await sleep(800);
        win = window.open('about:blank', 'ppdup-lookup', 'width=560,height=720');
        if (!win) break;
        parked = false; lookupSt.challenge = '';
        r = await lookupKey(win, k, onCh);
      }
      if (!win) { stop = '小さなウィンドウを開き直せませんでした（ポップアップを許可してください）'; break; }
      lookupSt.challenge = '';
      if (!parked && r.status !== 'closed' && r.status !== 'challenge') { parkWin(win); parked = true; }
      if (r.status === 'closed') { stop = 'ウィンドウが閉じられたため止めました'; break; }
      if (r.status === 'challenge') { stop = '確認画面が済まなかったため止めました'; break; }
      if (r.status === 'timeout') { log('warn', '販売者の調査が時間切れ', k.label); miss++; }
      else {
        sellerDb[k.key] = r.status === 'ok' ? { name: String(r.name || '').slice(0, 120), sid: String(r.sid || '').slice(0, 64), src: r.src, status: 'ok', studio: !!r.studio, at: Date.now() } : { status: r.status === 'notfound' || r.status === 'ambiguous' ? r.status : 'noseller', src: r.src, at: Date.now() };
        if (r.status === 'ok') ok++; else miss++;
        saveSellerDb();
      }
      done++;
      Object.assign(lookupSt, { done, ok, miss });
      // 分かった作品から順に一覧へ（3 件ごとに作り直す）
      if (view === 'seller' && (done % 3 === 0 || done === keys.length)) { const sc = $('[data-r=main]').scrollTop; selPlan = buildSellerPlan(folders); renderSeller(); $('[data-r=main]').scrollTop = sc; }
      else refreshSellerChrome();
      await sleep(cfg.interval * 1000);
    }
    try { win.close(); } catch (e) { /* 無視 */ }
    lookupSt.on = false;
    busy = false; sellerAck = false; setView('seller');
    status(`${stop ? stop + '。' : ''}${done} 件を調べました（販売者が分かった ${ok} 件・分からなかった ${miss} 件）。調べた結果は保存済みです。`);
    log('info', `販売者を調べた：${done} 件（判明 ${ok}・不明 ${miss}）${stop ? '・' + stop : ''}`);
  }
  // ---- 移動 ----
  async function runSeller(onlyFirst) {
    // 深いフォルダから先に動かす（入れ子の作品を外へ出してから外側を動かすため）
    const targets = selPlan.filter((p) => (p.kind !== 'pending' || p.fix === 'nest') && p.kind !== 'dupw' && sellerChecked(p)).sort((a, b) => (b.depth || 0) - (a.depth || 0)).slice(0, onlyFirst ? 1 : undefined);
    if (!targets.length) { status('チェックの入った作品がありません'); return; }
    if (!ensureSession('seller')) return;
    const cfg = sellerCfg();
    const R = folders.find((d) => d.isRoot);
    const homeScan = !!R && (!R.id || R.id === 'root');
    busy = true; renderNav(); window.__ppdupStop = false;
    let ok = 0, skip = 0; const failed = [];
    const lists = new Map(); // フォルダ → 中身（同名の確認用）
    const listOf = async (pid) => { if (!lists.has(pid)) lists.set(pid, await apiList(pid)); return lists.get(pid); };
    // ホーム直下の「販売者別」と、その中のフォルダを用意（無ければ作る）
    const addCache = (id, name, pid) => {
      if (!homeScan || folders.some((d) => d.id === id)) return;
      const np = folders.find((d) => d.id === pid) || R;
      folders.push({ id, name, parentId: pid, path: ((np && !np.isRoot && np.path) || '') + '/' + name, trail: [...((np && np.trail) || [pid]), id] });
    };
    const ensureDir = async (pid, name, match) => {
      const l = await listOf(pid);
      const ex = l.find((x) => x.kind === 'drive#folder' && (match ? match(x.name) : x.name === name));
      if (ex) { addCache(ex.id, ex.name, homeScan && pid === '' ? R.id : pid); return ex.id; }
      const id = await apiMkdir(pid, name);
      l.push({ id, name, kind: 'drive#folder' }); lists.set(id, []);
      addCache(id, name, homeScan && pid === '' ? R.id : pid);
      return id;
    };
    try {
      const rootId = await ensureDir('', cfg.root);
      let mp = null;
      var myPackId = async () => { if (mp) return mp; const h = await listOf(''); const f = h.find((x) => x.kind === 'drive#folder' && (x.folder_type === 'DOWNLOAD' || x.name === 'My Pack')); mp = f ? f.id : await ensureDir('', 'My Pack'); return mp; };
      for (const p of targets) {
        if (window.__ppdupStop) break;
        status(`移動中… ${ok + skip + 1}/${targets.length}：${p.name}`, (ok + skip) / targets.length);
        if (p.id === rootId) { skip++; continue; }
        try {
        let dest = p.fix === 'nest' ? await myPackId() : p.kind === 'seller' ? await ensureDir(rootId, sellerFolderName(p.seller), (nm) => nm.endsWith(`（${p.seller.sid}）`))
          : await ensureDir(rootId, p.kind === 'unknown' ? cfg.unknown : cfg.review);
        // 移動先に同じ名前があれば「要確認」へ、そこにもあれば移動しない
        const same = (pid) => listOf(pid).then((l) => l.some((x) => x.id !== p.id && x.name.toLowerCase() === p.name.toLowerCase()));
        // 移動先がその作品フォルダ自身・その中になるときは移動しない（「販売者別」の中から読み込んだときなど）
        if (dest === p.id || (folders.find((d) => d.id === dest) || {}).trail?.includes(p.id)) { skip++; log('warn', `移動先が作品フォルダ自身のため移動しませんでした：${p.name}`); continue; }
        if (await same(dest)) {
          const rv = await ensureDir(rootId, cfg.review);
          if (dest === rv || await same(rv)) { skip++; log('warn', `移動先に同じ名前があるため移動しませんでした：${p.name}`); continue; }
          dest = rv;
        }
        // 実行の直前に、移動元にまだあるかを確認
        const src = await apiList(p.parentId);
        if (!src.some((x) => x.id === p.id)) throw new Error('見つかりません（読み込み直してください）: ' + p.name);
        await apiMove([p.id], dest);
        (lists.get(dest) || []).push({ id: p.id, name: p.name, kind: 'drive#folder' });
        const it = folders.find((d) => d.id === p.id);
        if (it) { if (homeScan && folders.some((d) => d.id === dest)) cacheMoveFolder(p.id, dest); else dropFromScan(it); }
        ok++; saveAll();
        } catch (err) {
          // ログイン切れ以外は、その作品だけ飛ばして続ける
          if (err.session) throw err;
          skip++; failed.push(p.name); log('error', `移動できませんでした：${p.name}（${err.message}）`, 'seller');
        }
        await sleep(100);
      }
    } catch (err) { saveAll(); busy = false; setView('seller'); handleErr(err, 'seller', `停止：${err.message}（${ok} 作品完了）`); return; }
    if (meta) { meta.nfo = folders.length; meta.nfi = files.length; try { localStorage.setItem(LS_META, JSON.stringify(meta)); } catch (e) { /* 無視 */ } }
    busy = false; setView('seller');
    status(`${ok} 作品を移動しました（入れ子を My Pack へ出したものは、続けてもう一度仕分けてください）${skip ? `（移動しなかった ${skip} 件${failed.length ? `・うち失敗 ${failed.length} 件：${failed.slice(0, 3).join('・')}${failed.length > 3 ? ' …' : ''}（ログに詳細）` : '：同じ名前があった・移動先が自分自身など'}）` : ''}。`);
    log('info', `販売者ごとに仕分け ${ok} 作品${skip ? `（移動しなかった ${skip}）` : ''}`); refreshView();
  }

  const OS = (() => {
    const p = String((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent || '');
    return /mac|iphone|ipad/i.test(p) ? 'mac' : /win/i.test(p) ? 'win' : 'linux';
  })();
  const IS_MAC = OS === 'mac';
  const OS_NAME = { mac: 'macOS', win: 'Windows', linux: 'Linux' }[OS];
  const modKey = (e) => (IS_MAC ? e.metaKey : e.ctrlKey); // ⌘（mac）／Ctrl（Windows・Linux）
  const KEY = IS_MAC
    ? { mod: '⌘', multi: '⌘', deep: '⌥', open: '⌘↓', up: '⌘↑', rename: 'Enter', trash: '⌘⌫', mkdir: '⌥⌘N', expand: '⇧⌘→', collapse: '⇧⌘←', copy: '⌘C', all: '⌘A', back: '⌫（delete）', next: '⌘↓', prev: '⌘↑' }
    : { mod: 'Ctrl', multi: 'Ctrl', deep: 'Alt', open: 'Enter', up: 'Alt+↑', rename: 'F2', trash: 'Delete', mkdir: 'Alt+N', expand: 'Ctrl+Shift+→', collapse: 'Ctrl+Shift+←', copy: 'Ctrl+C', all: 'Ctrl+A', back: 'Backspace', next: 'Ctrl+↓', prev: 'Ctrl+↑' };
  const LS_TREE = 'ppdup:tree:v1';
  let tree = { open: [], sort: 'name', dir: 1, q: '', thumb: false };
  try { tree = { ...tree, ...JSON.parse(localStorage.getItem(LS_TREE) || '{}') }; } catch (e) { /* 無視 */ }
  if (!tree.view) tree.view = tree.thumb ? 'thumb' : 'list'; // 表示：list（リスト）／thumb（サムネイル付きリスト）／tile（タイル）
  const treeOpen = new Set(tree.open || []);
  const saveTree = () => { try { localStorage.setItem(LS_TREE, JSON.stringify({ qs: tree.qs, open: [...treeOpen].slice(-2000), sort: tree.sort, dir: tree.dir, base: tree.base || '', view: tree.view, hover: tree.hover !== false })); } catch (e) { /* 無視 */ } };
  const treeSel = new Set();
  let treeCur = '', treeAnchor = '', treeRowsCache = [], treeIdx = null, qlOpen = false, renaming = '';
  const VIDEO_EXT = new Set(['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'ts', 'm4v', 'webm', 'rmvb', 'mpg', 'mpeg']);
  const IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic']);
  const extOf = (n) => ((String(n).match(/\.([A-Za-z0-9]{2,7})$/) || [])[1] || '').toLowerCase();
  const kindOf = (r) => (r.kind === 'folder' ? 'フォルダ' : VIDEO_EXT.has(r.ext) ? 'ビデオ' : IMAGE_EXT.has(r.ext) ? 'イメージ' : SUB_EXT.has(r.ext) ? '字幕' : r.ext ? r.ext.toUpperCase() + ' 書類' : '書類');
  const ICON_DIR = '<svg viewBox="0 0 20 16"><path d="M1 3.2C1 2 2 1 3.2 1h4.3l1.8 2h7.5C18 3 19 4 19 5.2v7.6c0 1.2-1 2.2-2.2 2.2H3.2C2 15 1 14 1 12.8z" fill="#5aa9f6"/><path d="M1 5.5h18v7.3c0 1.2-1 2.2-2.2 2.2H3.2C2 15 1 14 1 12.8z" fill="#7cc0fb"/></svg>';
  const ICON_FILE = (r) => `<svg viewBox="0 0 16 20"><path d="M2 1h8l4 4v13a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z" fill="#f4f5f7" stroke="#b9bec8"/><path d="M10 1v4h4" fill="none" stroke="#b9bec8"/>${VIDEO_EXT.has(r.ext) ? '<path d="M6 9.5v5l4-2.5z" fill="#6b7280"/>' : ''}</svg>`;

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
    renderTree(); $('[data-r=main]').scrollTop = 0;
    status(tree.base ? `「${dirLabel(id)}」を最上位にして表示しています（${KEY.up} または上のパスで戻れます）` : '読み込んだ場所から表示しています');
    if (needLoad(tree.base)) loadAndRender([tree.base]);
  }
  // 表示する行（開いているフォルダの中だけ）。絞り込み中は、一致したものとその上のフォルダを開いて表示
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
      const v = tree.sort === 'size' ? (a.size - b.size) : tree.sort === 'kind' ? coll.compare(kindOf(a), kindOf(b)) : 0;
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
    const head = `<div class="tr-h"><span class="c-name" data-tsort="name">名前${arrow('name')}</span><span class="c-size" data-tsort="size">サイズ${arrow('size')}</span><span class="c-kind" data-tsort="kind">種類${arrow('kind')}</span><span class="c-n">項目</span><span class="c-pct" title="${top.unk ? '使用量全体に対する割合（まだ読み込んでいないフォルダがあるため）' : '表示中のフォルダの中での割合'}">${top.unk ? '使用量に占める割合' : `<b class="raw" style="font-weight:inherit">${esc(baseName)}</b> 内の割合`}</span></div>`;
    const rowHtml = (r, i) => {
      const jr = r.kind === 'file' ? junk(r.f) : '';
      const name = renaming === r.id ? `<input class="tr-ren" data-tren="${esc(r.id)}" value="${esc(r.name)}">` : `<span class="nm">${esc(r.name)}</span>`;
      return `<div class="tr-row${i % 2 ? ' odd' : ''}${treeSel.has(r.id) ? ' sel' : ''}${treeCur === r.id ? ' cur' : ''}" data-tid="${esc(r.id)}" title="${esc(r.path || '')}">
        <span class="c-name" style="padding-left:${8 + r.depth * 18}px">${r.kind === 'folder' ? `<span class="tw${r.open ? ' open' : ''}" data-ttw="${esc(r.id)}">▶</span>` : '<span class="tw blank"></span>'}${tree.view === 'thumb' ? thumbHtml(r) : `<span class="ic">${r.kind === 'folder' ? ICON_DIR : ICON_FILE(r)}</span>`}${tree.view === 'thumb' ? `<span class="tx">${name}<span class="sub">${esc(subOf(r))}</span></span>` : name}${tagOf(r)}${jr ? `<span class="jk" title="${esc(jr)}">不要</span>` : ''}</span>
        <span class="c-size">${sizeOf(r)}</span><span class="c-kind">${esc(kindOf(r))}</span><span class="c-n">${r.kind === 'folder' ? (r.unloaded ? '—' : r.n + ' 項目') : ''}</span>${pctCell(r)}</div>`;
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
      $('[data-r=main]').innerHTML = `<div class="tr has-path${tree.view === 'thumb' ? ' big' : ''}" tabindex="0" data-r="tree">${head}<div class="tr-body">${rows.map(rowHtml).join('') || emptyHtml}</div></div>`;
    }
    const selN = treeSel.size, selSize = [...treeSel].reduce((a, id) => { const r = rows.find((x) => x.id === id); return a + (r ? r.size : 0); }, 0);
    const capOf = (b) => (quota && quota.limit > 0 ? pctTxt(b / quota.limit) : '');
    const sizeTxt = top.unloaded ? '未スキャン' : top.unk ? `${fmt(top.size)}（未スキャンのフォルダを除く）` : `${fmt(top.size)}${capOf(top.size) ? `（契約容量比 ${capOf(top.size)}）` : ''}`;
    if (!busy) status(`${baseName}：${top.n} 項目・ファイル ${top.files} 件・${sizeTxt}${selN ? `　｜　${selN} 項目を選択（${fmt(selSize)}${capOf(selSize) ? `・全体比 ${capOf(selSize)}` : ''}）` : ''}`);
    const pr = $('[data-r=pright]'); if (pr) pr.textContent = meta ? `読み込み：${new Date(meta.at).toLocaleString(loc(), { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : '';
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
  function showQL() {
    const r = treeRowsCache.find((x) => x.id === treeCur); if (!r) return closeQL();
    let d = document.getElementById('pd-ql');
    if (!d) { d = document.createElement('div'); d.id = 'pd-ql'; document.body.appendChild(d); d.addEventListener('click', (e) => { if (e.target === d || e.target.dataset.qlclose !== undefined) closeQL(); }); }
    qlOpen = true;
    const big = r.kind === 'file' && r.thumb ? `<img src="${esc(r.thumb)}" referrerpolicy="no-referrer" alt="">` : `<div class="ql-ic">${r.kind === 'folder' ? ICON_DIR : ICON_FILE(r)}</div>`;
    const ix = treeIdx;
    const info = r.kind === 'folder' ? `${r.n} 項目（中のファイル ${ix.agg.get(r.id).files} 件）・${fmt(r.size)}` : `${esc(kindOf(r))}・${fmt(r.size)}`;
    const jr = r.kind === 'file' && junkEnabled() ? (prepJunk(files, folders), junkInfo(r.f)) : null;
    d.innerHTML = `<div class="ql"><div class="ql-h"><button data-qlclose title="閉じる（スペース / Esc）">✕</button><b>${esc(r.name)}</b></div><div class="ql-b">${big}</div>
      <div class="ql-f"><div>${info}</div><div class="note">${esc((r.kind === 'folder' ? r.path : r.path + '/').replace(/^\/?/, '/').replace(/\/+$/, '') || '/')}</div>${jr ? `<div style="color:#ff6b6b">不要ファイルの判定：${esc(jr.reason)}</div>` : ''}${isVideoRow(r) ? `<div class="ql-acts"><button data-qlplay class="pri" title="このプレビューの中で再生">▶ ここで再生</button><button data-qlfull title="全画面で再生">⛶ 全画面</button><button data-qlframes title="コマ一覧（動画の中身を 16 コマで見る）">▦ コマ一覧</button>${rateSelect()}<button data-qlext title="外部プレーヤーで開く">↗ ${esc(EXT_PLAYERS[playPref().ext].short)}</button><button data-qlset title="再生のしかたの設定（ダブルクリック時の動作・外部プレーヤー）">⚙</button></div>` : ''}</div></div>`;
    d.classList.remove('playing'); killHls(qlHls); qlHls = null;
    const on = (sel, fn) => { const b = d.querySelector(sel); if (b) b.onclick = fn; };
    on('[data-qlplay]', () => qlPlay(r.id));
    on('[data-qlfull]', () => playFile(r.id, { full: true }));
    on('[data-qlext]', () => { const v = d.querySelector('video'); if (v) v.pause(); openExternal(r.id); });
    on('[data-qlset]', () => openSettings('play'));
    on('[data-qlframes]', () => { const v = d.querySelector('video'); if (v) v.pause(); openFrames([r.id]); });
  }
  function closeQL() { qlOpen = false; killHls(qlHls); qlHls = null; const d = document.getElementById('pd-ql'); if (d) { d.querySelectorAll('.pd-sk').forEach((b) => { if (b._grab) b._grab.close(); }); const v = d.querySelector('video'); try { if (v) v.pause(); } catch (e) { /* 無視 */ } d.remove(); } }
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
  // ---------- フォルダ一覧：移動・新規フォルダ・右クリックメニュー・再生 ----------
  const isVideoRow = (r) => !!r && r.kind === 'file' && VIDEO_EXT.has(r.ext);
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
      if (meta) { meta.nfo = folders.length; meta.nfi = files.length; try { localStorage.setItem(LS_META, JSON.stringify(meta)); } catch (e) { /* 無視 */ } }
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
      const d = document.createElement('div'); d.id = 'pd-dlg';
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
      document.body.appendChild(d);
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
        <button data-ta="rename"${dis(one)} title="名前を変更（${KEY.rename}）">✎ 名前を変更</button>
        <button data-ta="move"${dis(rows.length && !fixed)} title="${fixed ? '読み込んだ場所とその上のフォルダは、ここでは移動できません' : '移動（ドラッグでも移動できます）'}">↪ 移動…</button>
        ${rows.some((r) => r.kind === 'file' && isArchive(r.name)) ? '<button data-ta="unzip" title="選んだ圧縮ファイルを PikPak の上で解凍">📦 解凍</button>' : ''}
        <button data-ta="base"${dis(one && one.kind === 'folder')} title="選んだフォルダを最上位にして、その中だけを表示（${KEY.open}）">⤓ ここを最上位に</button>
        <button data-ta="trash"${dis(rows.length && !fixed)} class="red" title="${fixed ? '読み込んだ場所とその上のフォルダは、ここではゴミ箱に入れられません' : `ゴミ箱に入れる（${KEY.trash}）`}">🗑 ゴミ箱へ</button>
        <span class="sp"></span><button data-ta="addlink"${dis(true)} title="リンク・マグネットを、選んでいる場所へ追加">🔗 リンクを追加</button><button data-ta="mkdir"${dis(true)} title="新規フォルダ（${KEY.mkdir}）">＋ 新規フォルダ</button>`
      : `<span class="hint">項目を選ぶと、再生・名前の変更・移動・ゴミ箱が使えます（右クリックでもメニューを開けます）</span><span class="sp"></span><button data-ta="addlink"${dis(true)} title="リンク・マグネットを、表示中の場所へ追加">🔗 リンクを追加</button><button data-ta="mkdir"${dis(true)} title="新規フォルダ（${KEY.mkdir}）">＋ 新規フォルダ</button>`;
  }
  function treeAction(a) {
    const rows = selRows(), one = rows.length === 1 ? rows[0] : null;
    closeCtx();
    if (a === 'play' && isVideoRow(one)) playDefault(one.id);
    else if (a === 'playfull' && isVideoRow(one)) playFile(one.id, { full: true });
    else if (a === 'playext' && isVideoRow(one)) openExternal(one.id);
    else if (a === 'playset') openSettings('play');
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
      rows.length && rows.length <= 2 && rows.every(isVideoRow) ? it('frames', rows.length === 2 ? '▦ 2 本をコマで比べる' : '▦ コマ一覧', '', true) : '',
      isVideoRow(one) ? it('playset', '再生のしかたの設定…', '', true) + '<hr>' : '',
      one && one.kind === 'folder' ? it('open', '開く', '→', true) : '',
      one && one.kind === 'folder' ? it('base', 'このフォルダを最上位にして表示', KEY.open, true) : '',
      it('preview', 'プレビュー', 'Space', !!one), '<hr>',
      it('rename', '名前を変更', KEY.rename, !!one), it('move', `移動…${rows.length > 1 ? `（${rows.length} 項目）` : ''}`, 'ドラッグ', rows.length > 0 && !rows.some((r) => isRootOrAbove(r.id))), it('mkdir', '新規フォルダ', KEY.mkdir, true), it('addlink', one && one.kind === 'folder' ? 'ここにリンクを追加…' : 'リンク・マグネットを追加…', '', true), '<hr>',
      rows.some((r) => r.kind === 'file' && isArchive(r.name)) ? it('unzip', `📦 解凍…${rows.filter((r) => r.kind === 'file' && isArchive(r.name)).length > 1 ? `（${rows.filter((r) => r.kind === 'file' && isArchive(r.name)).length} ファイル）` : ''}`, '', true) + '<hr>' : '',
      it('copy', '場所をコピー', KEY.copy, !!one), '<hr>',
      it('trash', `ゴミ箱に入れる${rows.length > 1 ? `（${rows.length} 項目）` : ''}`, KEY.trash, rows.length > 0 && !rows.some((r) => isRootOrAbove(r.id)), 'red'),
    ].join('');
    document.body.appendChild(m);
    const w = m.offsetWidth || 220, h = m.offsetHeight || 300;
    m.style.left = Math.min(e.clientX, innerWidth - w - 8) + 'px'; m.style.top = Math.min(e.clientY, innerHeight - h - 8) + 'px';
    m.addEventListener('click', (ev) => { const b = ev.target.closest('[data-ta]'); if (b && !b.disabled) treeAction(b.dataset.ta); });
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
  const LS_PLQ = 'ppdup:player:q:v1'; // 前回選んだ画質の種類（orig＝オリジナル／trans＝変換画質）
  const LS_PLAY = 'ppdup:player:v1'; // 再生のしかた { mode: inline|window|full|external, ext }
  let curHls = null, qlHls = null;
  const TS_DL = 'https://web-vod-xdrive.mypikpak.com/ts_downloader', TS_CLIENT = 'UElLUEFLX1dFQg';
  // ts_downloader の一覧（m3u8）を hls.js で読める形に直す（BYTERANGE と EXTINF の順番）
  const fixTsM3u8 = (t) => { t = String(t || '').replace(/\r\n/g, '\n'); if (!t.includes('#EXTM3U')) return t; return t.replace(/(#EXT-X-BYTERANGE:[^\n]+)\n(#EXTINF:[^\n]+)\n/g, '$2\n$1\n'); };
  const isHlsUrl = (u) => /\.m3u8(\?|#|$)|ts_downloader|[?&](format|type)=(hls|m3u8)\b|\/hls(\/|$)/i.test(String(u || ''));
  function getHls() {
    const H = window.Hls || (typeof Hls !== 'undefined' ? Hls : null); // eslint-disable-line no-undef
    if (H || getHls.loading) return Promise.resolve(H || null);
    // @require が効かない環境向けに、念のため読み込みを試す
    getHls.loading = new Promise((res) => {
      const sc = document.createElement('script'); sc.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.6.15/dist/hls.min.js';
      sc.onload = () => res(window.Hls || null); sc.onerror = () => res(null);
      document.head.appendChild(sc); setTimeout(() => res(window.Hls || null), 8000);
    });
    return getHls.loading;
  }
  const killHls = (h) => { if (h) { try { h.destroy(); } catch (e) { /* 無視 */ } } };
  function stopHls() { killHls(curHls); curHls = null; }

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
    let p = {}; try { p = JSON.parse(localStorage.getItem(LS_PLAY) || '{}'); } catch (e) { p = {}; }
    if (!MODES[p.mode]) p.mode = 'inline'; // 以前の「プレーヤー画面」はプレビューでの再生にまとめた
    if (!extList().includes(p.ext)) p.ext = IS_MAC ? 'iina' : OS === 'win' ? 'potplayer' : 'm3u';
    return p;
  }
  const savePlayPref = (p) => { try { localStorage.setItem(LS_PLAY, JSON.stringify(p)); } catch (e) { /* 無視 */ } };
  const prefLabel = () => { const p = playPref(); return p.mode === 'external' ? '外部：' + EXT_PLAYERS[p.ext].short : MODES[p.mode]; };

  // 再生用リンクを取得して、画質の候補を作る
  async function loadSources(id) {
    const info = await api('/files/' + id + '?thumbnail_size=SIZE_LARGE');
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
    // 最初の画質：前回選んだ種類（なければデータが軽くカクつきにくい変換画質）
    let first = src.findIndex((x) => !x.dl && playable(x) && (pref === 'orig' ? x.origin : !x.origin));
    if (first < 0) first = src.findIndex((x) => playable(x));
    return { src, H, nativeHls, playable, first: Math.max(0, first) };
  }
  // video 要素に再生元をつなぐ（HLS は hls.js、それ以外はそのまま。失敗したら hls.js で再試行）
  function mountVideo(box, x, S, onFail, opt = {}) {
    const t = opt.t || 0;
    // 前の動画のシークバー（とサムネイル用の影の動画）を片付ける
    const oldBar = box.nextElementSibling && box.nextElementSibling.classList.contains('pd-sk') ? box.nextElementSibling : null;
    if (oldBar) { if (oldBar._grab) oldBar._grab.close(); oldBar.remove(); }
    box.innerHTML = '<video controls autoplay playsinline preload="auto"></video>';
    const v = box.querySelector('video');
    v.addEventListener('loadedmetadata', () => { if (t) v.currentTime = t; v.defaultPlaybackRate = getRate(); v.playbackRate = getRate(); if (opt.onMeta) opt.onMeta(v); }, { once: true });
    if (opt.seekbar !== false) { const tmp = document.createElement('div'); box.after(tmp); attachSeekbar(tmp, v, x, S); const bar = tmp.querySelector('.pd-sk'); tmp.replaceWith(bar); }
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
  async function openExternal(id, ext) {
    const f = fileById(id); if (!f) return;
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
      log('info', `外部プレーヤーで再生：${P.short}`, f.name);
    } catch (err) { if (err.session) { handleErr(err, 'tree'); return; } status('外部プレーヤー用のリンクを取得できませんでした：' + err.message); }
  }
  // 既定の再生のしかたで再生（ダブルクリック・Enter など）
  function playDefault(id) {
    const p = playPref();
    if (p.mode === 'external') openExternal(id, p.ext);
    else if (p.mode === 'inline') { treeCur = id; showQL(); qlPlay(id); }
    else playFile(id, { full: p.mode === 'full' });
  }
  // ---------- 設定（右からのパネル：表示・再生・整理・情報） ----------
  const SET_TABS = [['all', 'すべて'], ['view', '表示'], ['play', '再生'], ['org', '整理'], ['info', '情報']];
  let setTab = 'all';
  function openSettings(tab) {
    setTab = tab || 'all';
    let d = document.getElementById('pd-set');
    if (!d) {
      d = document.createElement('div'); d.id = 'pd-set'; document.body.appendChild(d);
      d.addEventListener('mousedown', (e) => { if (e.target === d) closeSettings(); });
      d.addEventListener('click', onSettingsClick);
      d.addEventListener('change', onSettingsChange);
    }
    renderSettings();
    const x = d.querySelector('.x'); if (x) x.focus();
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.getElementById('pd-set') && !document.getElementById('pd-dlg')) { e.preventDefault(); e.stopImmediatePropagation(); closeSettings(); } }, true);
  function closeSettings() { const d = document.getElementById('pd-set'); if (d) d.remove(); const t = $('[data-r=tree]'); if (t && view === 'tree') t.focus({ preventScroll: true }); }
  function renderSettings() {
    const d = document.getElementById('pd-set'); if (!d) return;
    const p = playPref(), th = themePref(), lp = langPref();
    const seen = +(localStorage.getItem(LS_LOGSEEN) || 0);
    const errs = readLog().filter((x) => x.level === 'error' && x.t > seen).length;
    const sec = (k) => setTab === 'all' || setTab === k;
    const helpTree = `${OS_NAME} の操作：▶ / ← → で開閉（${KEY.deep} で中もすべて）・${KEY.open} でフォルダを最上位に（${KEY.up} で戻る）・ダブルクリックで再生・ドラッグで移動・右クリックでメニュー・スペースでプレビュー・${KEY.rename} で名前の変更・${KEY.mkdir} で新規フォルダ・${KEY.trash} でゴミ箱へ・1 / 2 / 3 で表示の切り替え`;
    const scroll = d.querySelector('.bd') ? d.querySelector('.bd').scrollTop : 0;
    d.innerHTML = `<aside class="dr" role="dialog" aria-label="設定">
      <div class="hd">${IC.gear}<h2>設定</h2><button class="x" data-s="close" title="閉じる（Esc）" aria-label="閉じる">${IC.x}</button></div>
      <div class="tabs" role="tablist">${SET_TABS.map(([k, l]) => `<button role="tab" data-s="tab" data-v="${k}" class="${setTab === k ? 'on' : ''}" aria-selected="${setTab === k}">${l}</button>`).join('')}</div>
      <div class="bd">
        ${sec('view') ? `<h3>表示</h3>
        <div class="row"><span><b>テーマ</b><small>右上のボタンと同じ設定です</small></span><span class="seg">${[['light', 'ライト'], ['dark', 'ダーク'], ['auto', '自動']].map(([k, l]) => `<button data-s="theme" data-v="${k}" class="${th === k ? 'on' : ''}">${l}</button>`).join('')}</span></div>
        <div class="row col"><b>開き方</b>${[['pop', 'ポップアップ（おすすめ）', 'PikPak の画面の上に重ねて開きます。動かしたり大きさを変えたりでき、後ろの PikPak もそのまま使えます'], ['full', '全画面', 'PikPak の画面を Dedupe に切り替えます（今までの開き方）']].map(([k, l, d]) => `<label><input type="radio" name="pdopen" data-s="openmode" value="${k}"${(root.classList.contains('on') ? winMode : openPref()) === k ? ' checked' : ''}> <span><b>${l}</b><small style="display:block">${d}</small></span></label>`).join('')}</div>
        <div class="row"><span><b>表示言語</b></span><select data-s="lang"><option value="auto"${lp === 'auto' ? ' selected' : ''}>自動（ブラウザ）</option><option value="ja" data-raw${lp === 'ja' ? ' selected' : ''}>日本語</option><option value="en" data-raw${lp === 'en' ? ' selected' : ''}>English</option></select></div>
        <div class="row"><span><b>フォルダ一覧の表示</b></span><select data-s="tview"><option value="list"${tree.view === 'list' ? ' selected' : ''}>☰ リスト</option><option value="thumb"${tree.view === 'thumb' ? ' selected' : ''}>▤ サムネイル</option><option value="tile"${tree.view === 'tile' ? ' selected' : ''}>▦ タイル</option></select></div>
        <label class="row"><span><b>ホバーでサムネイル</b><small>マウスを乗せたときにサムネイルを大きく表示します</small></span><input type="checkbox" data-s="hover"${tree.hover !== false ? ' checked' : ''}></label>
        <div class="row"><span><b>フォルダ一覧の操作</b><small>${esc(helpTree)}</small></span></div>` : ''}
        ${sec('play') ? `<h3 data-sec="play">再生</h3>
        <div class="row col"><b>▶ 再生ボタン・ダブルクリックのとき</b>${Object.keys(MODES).map((k) => `<label><input type="radio" name="pdmode" data-s="mode" value="${k}"${p.mode === k ? ' checked' : ''}> ${MODES[k]}</label>`).join('')}</div>
        <div class="row"><span><b>外部プレーヤー（${OS_NAME}）</b><small>${IS_MAC ? 'IINA・Infuse はアプリが入っていれば直接起動します。' : OS === 'win' ? 'PotPlayer はアプリが入っていれば直接起動します。GOM Player・VLC などは「既定のアプリで開く」を選び、.m3u ファイルを開くアプリにそのプレーヤーを設定してください。' : 'VLC・mpv・Celluloid などは「既定のアプリで開く」を選び、.m3u ファイルを開くアプリにそのプレーヤーを設定してください。'}</small></span><select data-s="ext">${extList().map((k) => `<option value="${k}"${p.ext === k ? ' selected' : ''}>${esc(EXT_PLAYERS[k].short)}</option>`).join('')}</select></div>` : ''}
        ${sec('org') ? `<h3>整理</h3>
        <label class="row"><span><b>作品と関係ないファイルを除外する</b><small>広告・宣伝のファイルや 10MB 以下のファイルなどを、ほかの作業の対象から外します</small></span><input type="checkbox" data-s="junk"${junkEnabled() ? ' checked' : ''}></label>
        <label class="row"><span><b>ファイル名を整える</b><small>オフにすると、このステップを使わず次へ進みます</small></span><input type="checkbox" data-s="name"${nameEnabled() ? ' checked' : ''}></label>` : ''}
        ${sec('org') ? `<div class="row"><span><b>解凍パスワード</b><small>解凍できたパスワード ${pwList().length} 件（次から自動で順に試します）。このブラウザにだけ保存</small></span><button data-s="pwclear"${pwList().length ? '' : ' disabled'}>消去</button></div>` : ''}
        ${sec('org') ? `<h3>販売者ごとに仕分け</h3>
        <label class="row"><span><b>このステップを使う</b><small>オフにすると「8. 販売者ごとに仕分け」を使いません</small></span><input type="checkbox" data-s="seller"${sellerEnabled() ? ' checked' : ''}></label>
        <div class="row"><span><b>まとめるフォルダ</b><small>ホームの直下に作ります</small></span><input type="text" data-s="scfg" data-k="root" value="${esc(sellerCfg().root)}" style="width:150px;font:inherit;padding:6px 10px;border:1px solid var(--ctl-line);border-radius:8px;background:var(--ctl);color:inherit"></div>
        <div class="row"><span><b>販売者が分からないとき</b></span><input type="text" data-s="scfg" data-k="unknown" value="${esc(sellerCfg().unknown)}" style="width:150px;font:inherit;padding:6px 10px;border:1px solid var(--ctl-line);border-radius:8px;background:var(--ctl);color:inherit"></div>
        <div class="row"><span><b>判断できないとき</b></span><input type="text" data-s="scfg" data-k="review" value="${esc(sellerCfg().review)}" style="width:150px;font:inherit;padding:6px 10px;border:1px solid var(--ctl-line);border-radius:8px;background:var(--ctl);color:inherit"></div>
        <div class="row"><span><b>調べる間隔</b><small>短くしすぎると、相手のサイトに断られることがあります</small></span><select data-s="scfg" data-k="interval">${[1, 1.5, 3].map((v) => `<option value="${v}"${sellerCfg().interval === v ? ' selected' : ''}>${v} 秒</option>`).join('')}</select></div>
        <div class="row"><span><b>調べた結果</b><small>${Object.keys(sellerDb).length} 件（手入力 ${Object.values(sellerDb).filter((r) => r.src === 'manual').length} 件を含む）。このブラウザにだけ保存</small></span><button data-s="sclear"${Object.keys(sellerDb).length ? '' : ' disabled'}>消去</button></div>` : ''}
        ${sec('info') ? `<h3>情報</h3>
        <div class="row"><span><b>PikPak Distill – Dedupe</b><small class="ver">v${VER} · Noel Labs</small></span><button data-s="changelog">更新履歴</button></div>
        <div class="row"><span><b>PikPak で同期する</b><small>調査結果・判断・設定を PikPak の「${esc(SYNC_DIR)}」に保存し、ほかのブラウザやアプリと共有します（ログイン情報は含めません）</small><small data-r="syncrow"></small><label style="display:flex;gap:6px;align-items:center;margin-top:4px"><input type="checkbox" data-s="syncpw"${syncCfg().pw ? ' checked' : ''}> 解凍パスワードも同期する</label></span><span style="display:flex;gap:8px;align-items:center"><button data-s="syncnow"${syncCfg().on && syncCfg().asked ? '' : ' disabled'}>今すぐ同期</button><input type="checkbox" data-s="syncon" title="同期する"${syncCfg().on && syncCfg().asked ? ' checked' : ''}></span></div>
        <div class="row col"><b>書き出し／読み込み</b><small class="note" style="display:block">別のブラウザやパソコンへ移すときに使います（ログイン情報は含めません）</small>${Object.keys(EXPORT_GROUPS).map((g) => `<label><input type="checkbox" data-s="expg" value="${g}"${exportSel[g] ? ' checked' : ''}> ${EXPORT_GROUPS[g].label}<small style="color:var(--mute)">（${groupCount(g)} 件）</small></label>`).join('')}<span style="display:flex;gap:8px;margin-top:6px"><button data-s="export">書き出す（.json）</button><button data-s="import">読み込む…</button></span></div>
        <div class="row"><span><b>ログ</b><small>エラーや処理の記録</small></span><button data-s="log">ログを表示${errs ? `<span class="badge">${errs}</span>` : ''}</button></div>` : ''}
      </div></aside>`;
    d.querySelector('.bd').scrollTop = scroll;
    renderSyncRow();
  }
  function onSettingsClick(e) {
    const b = e.target.closest('[data-s]'); if (!b || b.tagName === 'SELECT' || b.tagName === 'INPUT') return;
    const k = b.dataset.s;
    if (k === 'close') closeSettings();
    else if (k === 'tab') { setTab = b.dataset.v; renderSettings(); }
    else if (k === 'theme') setTheme(b.dataset.v);
    else if (k === 'log') { closeSettings(); showLog(); }
    else if (k === 'sclear') { if (confirm(tr('調べた販売者の結果（手入力を含む）をすべて消去しますか？'))) { sellerDb = {}; saveSellerDb(); syncCleared(LS_SELLER); sellerSel.clear(); log('info', '販売者の調査結果を消去'); renderSettings(); if (root.classList.contains('on') && !busy) setView(view); } }
    else if (k === 'pwclear') { if (confirm(tr('記録した解凍パスワードをすべて消去しますか？'))) { try { localStorage.setItem(LS_UNZIPPW, '[]'); } catch (e) { /* 無視 */ } syncCleared(LS_UNZIPPW); log('info', '解凍パスワードを消去'); renderSettings(); } }
    else if (k === 'syncnow') syncNow('手動').then((ok) => { status(ok ? 'PikPak と同期しました' : '同期できませんでした（「ログを表示」で理由を確認できます）'); renderSettings(); });
    else if (k === 'export') exportData();
    else if (k === 'import') importData();
    else if (k === 'changelog') window.open('https://github.com/Noel-Labs39/pikpak-distill/blob/main/CHANGELOG.md', '_blank', 'noopener');
  }
  function onSettingsChange(e) {
    const t = e.target, k = t.dataset.s;
    if (k === 'syncon') { saveSyncCfg({ asked: true, on: t.checked }); if (t.checked) syncNow('オンにした'); renderSettings(); return; }
    if (k === 'syncpw') { saveSyncCfg({ pw: t.checked }); if (t.checked) syncNow('解凍パスワード'); return; }
    if (k === 'lang') { setLang(t.value); return; }
    if (k === 'expg') { exportSel[t.value] = t.checked; return; }
    if (k === 'openmode') { setOpenPref(t.value); if (root.classList.contains('on')) setWin(t.value); return; }
    if (k === 'tview') { tree.view = t.value; saveTree(); if (view === 'tree') treeView(t.value); return; }
    if (k === 'hover') { tree.hover = t.checked; saveTree(); hideHover(); return; }
    if (k === 'mode' || k === 'ext') {
      const p = playPref();
      savePlayPref({ mode: k === 'mode' ? t.value : p.mode, ext: k === 'ext' ? t.value : p.ext });
      status('再生のしかたを「' + prefLabel() + '」にしました'); if (view === 'tree') renderTreeActs(); if (qlOpen) showQL();
      return;
    }
    if (k === 'seller') { try { localStorage.setItem(LS_OPT_SELLER, t.checked ? '1' : '0'); } catch (err) { /* 無視 */ } if (root.classList.contains('on') && !busy) setView(view); return; }
    if (k === 'scfg') {
      const c = sellerCfg(), key = t.dataset.k;
      const v = key === 'interval' ? +t.value : t.value.trim();
      if (key !== 'interval' && (!v || /[\/\\]/.test(v))) { t.value = c[key]; status('フォルダ名に / や \\ は使えません'); return; }
      c[key] = v; saveSellerCfg(c); if (root.classList.contains('on') && !busy && view === 'seller') setView('seller');
      return;
    }
    if (k === 'junk' || k === 'name') {
      try { localStorage.setItem(k === 'junk' ? LS_OPT_JUNK : LS_OPT_NAME, t.checked ? '1' : '0'); } catch (err) { /* 無視 */ }
      log('info', (k === 'junk' ? '不要ファイルの除外を' : 'ファイル名の整理を') + (t.checked ? 'オン' : 'オフ') + 'に変更');
      if (root.classList.contains('on') && !busy) setView(view);
    }
  }
  // プレビュー（クイックルック）の中で再生する
  async function qlPlay(id) {
    const d = document.getElementById('pd-ql'); if (!d) return;
    const box = d.querySelector('.ql-b'), f = fileById(id); if (!box || !f) return;
    if (!ensureSession('tree')) return;
    killHls(qlHls); qlHls = null;
    box.insertAdjacentHTML('beforeend', '<div class="pl-msg ql-wait">再生の準備中…</div>');
    try {
      const S = await loadSources(id);
      if (!document.body.contains(box) || treeCur !== id) return;
      if (!S.src.length) { box.innerHTML = '<div class="pl-msg">再生用リンクを取得できませんでした</div>'; return; }
      const fail = (x, why) => { box.insertAdjacentHTML('beforeend', `<div class="pl-msg pl-err">「${esc(x.label)}」は再生できませんでした${why ? `（${esc(why)}）` : ''}。下の「画質」で別の画質を試せます。</div>`); log('warn', `再生できない画質：${x.label}`, f.name); };
      // 画質の切り替えと解像度の表示（以前の「プレーヤー画面」の機能をプレビューにまとめた）
      const acts = d.querySelector('.ql-acts'), inf = d.querySelector('.ql-f > div');
      const base = inf ? inf.textContent : '';
      const meta = (v) => { if (inf) inf.textContent = base + (v.videoWidth ? ` ・ ${v.videoWidth}×${v.videoHeight}` : ''); };
      const load = (k) => {
        const x = S.src[k];
        try { localStorage.setItem(LS_PLQ, x.origin ? 'orig' : 'trans'); } catch (e) { /* 無視 */ }
        const cur = (box.querySelector('video') || {}).currentTime || 0;
        killHls(qlHls); qlHls = null;
        if (!S.playable(x)) { box.innerHTML = '<div class="pl-msg">この画質（HLS）はこのブラウザの中では再生できません。別の画質か外部プレーヤーを選んでください。</div>'; return; }
        const m = mountVideo(box, x, S, fail, { t: cur, onMeta: meta });
        setTimeout(() => { qlHls = m.hls; }, 0);
      };
      if (acts && S.src.length > 1 && !acts.querySelector('[data-qlq]')) {
        acts.insertAdjacentHTML('afterbegin', `<select data-qlq title="画質">${S.src.map((x, k) => `<option value="${k}"${k === S.first ? ' selected' : ''}>${esc(x.label)}${x.hls ? '・変換' : ''}${S.playable(x) ? '' : '（このブラウザでは再生不可）'}</option>`).join('')}</select>`);
        acts.querySelector('[data-qlq]').onchange = (e) => load(+e.target.value);
      }
      const m = mountVideo(box, S.src[S.first], S, fail, { onMeta: meta });
      setTimeout(() => { qlHls = m.hls; }, 0);
      d.classList.add('playing');
      log('info', 'プレビューで再生：' + f.name);
    } catch (err) { if (err.session) { closeQL(); handleErr(err, 'tree'); return; } box.insertAdjacentHTML('beforeend', `<div class="pl-msg pl-err">${esc(err.message)}</div>`); }
  }
  async function playFile(id, opt = {}) {
    const f = fileById(id); if (!f) return;
    // プレビューで再生中なら、その位置から続ける
    const qv = document.querySelector('#pd-ql video'); const fromT = opt.t || (qv && treeCur === id ? qv.currentTime : 0);
    closeQL(); closeCtx();
    if (!ensureSession('tree')) return;
    stopHls();
    let d = document.getElementById('pd-player');
    if (!d) {
      d = document.createElement('div'); d.id = 'pd-player'; document.body.appendChild(d);
      d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-pl=close]')) closePlayer(); });
    }
    const vids = treeRowsCache.filter(isVideoRow);
    const i = vids.findIndex((r) => r.id === id);
    d.innerHTML = `<div class="pl"><div class="pl-h"><button data-pl="prev"${i > 0 ? '' : ' disabled'} title="前のビデオ（${KEY.prev}）">◀</button><button data-pl="next"${i >= 0 && i < vids.length - 1 ? '' : ' disabled'} title="次のビデオ（${KEY.next}）">▶</button><b>${esc(f.name)}</b><select data-pl="q" title="画質（カクつく場合は変換画質を選んでください）" style="display:none"></select>${rateSelect()}<button data-pl="frames" title="コマ一覧">▦ コマ一覧</button><button data-pl="full" title="全画面（F）">⛶ 全画面</button><button data-pl="ext" title="外部プレーヤーで開く">↗ ${esc(EXT_PLAYERS[playPref().ext].short)}</button><button data-pl="set" title="再生のしかたの設定">⚙</button><button data-pl="close" title="閉じる（Esc）">✕</button></div>
      <div class="pl-b"><div class="pl-msg">再生の準備中…</div></div><div class="pl-f note"><span>${esc(f.outer ? fullPath(f.parentId) : (f.path || '/').replace(/\/$/, ''))}/ ・ ${fmt(f.size)}</span><span data-pl="info"></span></div></div>`;
    const prev = d.querySelector('[data-pl=prev]'), next = d.querySelector('[data-pl=next]');
    prev.onclick = () => { if (i > 0) { treeSelect(vids[i - 1].id, null); renderTree(); playFile(vids[i - 1].id, { full: !!document.fullscreenElement }); } };
    next.onclick = () => { if (i < vids.length - 1) { treeSelect(vids[i + 1].id, null); renderTree(); playFile(vids[i + 1].id, { full: !!document.fullscreenElement }); } };
    const goFull = () => { const v = d.querySelector('video') || d.querySelector('.pl'); const fn = v && (v.requestFullscreen || v.webkitRequestFullscreen); if (fn) Promise.resolve(fn.call(v)).catch(() => status('全画面にできませんでした。プレーヤーの ⛶ を押してください。')); };
    d.querySelector('[data-pl=full]').onclick = goFull;
    d.querySelector('[data-pl=ext]').onclick = () => { const v = d.querySelector('video'); if (v) v.pause(); openExternal(id); };
    d.querySelector('[data-pl=set]').onclick = () => openSettings('play');
    d.querySelector('[data-pl=frames]').onclick = () => { const v = d.querySelector('video'); if (v) v.pause(); openFrames([id]); };
    try {
      const S = await loadSources(id);
      if (!document.body.contains(d)) return;
      const { src } = S;
      if (!src.length) { d.querySelector('.pl-msg').textContent = 'このファイルの再生用リンクを取得できませんでした（PikPak 側で変換中の可能性があります）'; return; }
      const sel = d.querySelector('[data-pl=q]'), inf = d.querySelector('[data-pl=info]');
      sel.innerHTML = src.map((x, k) => `<option value="${k}">${esc(x.label)}${x.hls ? '・変換' : ''}${S.playable(x) ? '' : '（このブラウザでは再生不可）'}</option>`).join('');
      sel.style.display = src.length > 1 ? '' : 'none';
      const fail = (x, why) => {
        const box = d.querySelector('.pl-b');
        if (!box.querySelector('.pl-err')) box.insertAdjacentHTML('beforeend', `<div class="pl-msg pl-err">「${esc(x.label)}」は再生できませんでした${why ? `（${esc(why)}）` : ''}。上の画質を切り替えるか「↗ 外部プレーヤー」を試してください。</div>`);
        log('warn', `再生できない画質：${x.label}${why ? '（' + why + '）' : ''}`, f.name); updateLogBadge();
      };
      const load = (k, t) => {
        const x = src[k];
        try { localStorage.setItem(LS_PLQ, x.origin ? 'orig' : 'trans'); } catch (e) { /* 無視 */ }
        const box = d.querySelector('.pl-b');
        const cur = (box.querySelector('video') || {}).currentTime || t || 0;
        stopHls();
        if (!S.playable(x)) { box.innerHTML = '<div class="pl-msg">この画質（HLS）はこのブラウザの中では再生できません。別の画質か「↗ 外部プレーヤー」を選んでください。</div>'; return; }
        const m = mountVideo(box, x, S, fail, { t: cur, onMeta: (v) => { inf.textContent = v.videoWidth ? ` ・ ${v.videoWidth}×${v.videoHeight}${x.hls ? '（変換）' : ''}` : ''; } });
        setTimeout(() => { curHls = m.hls; }, 0);
        m.v.focus();
      };
      sel.onchange = () => load(+sel.value);
      sel.value = String(S.first); load(S.first, fromT);
      if (opt.full) goFull();
      log('info', '再生：' + f.name + '（' + src[S.first].label + '）');
    } catch (err) { if (err.session) { closePlayer(); handleErr(err, 'tree'); return; } d.querySelector('.pl-msg').textContent = '再生用リンクを取得できませんでした：' + err.message; log('error', '再生用リンクの取得に失敗：' + err.message, f.name); updateLogBadge(); }
  }
  function closePlayer() { stopHls(); const d = document.getElementById('pd-player'); if (d) { d.querySelectorAll('.pd-sk').forEach((b) => { if (b._grab) b._grab.close(); }); const v = d.querySelector('video'); try { if (v) { v.pause(); v.removeAttribute('src'); v.load(); } } catch (e) { /* 無視 */ } d.remove(); } const t = $('[data-r=tree]'); if (t) t.focus(); }
  document.addEventListener('keydown', (e) => {
    const d = document.getElementById('pd-player'); if (!d) return;
    if (e.key === 'Escape') { if (document.fullscreenElement) return; e.preventDefault(); e.stopImmediatePropagation(); closePlayer(); }
    else if ((e.key === 'f' || e.key === 'F') && !e.metaKey && !e.ctrlKey) { e.preventDefault(); d.querySelector('[data-pl=full]').click(); }
    else if ((e.key === 'ArrowDown' && modKey(e)) || e.key === 'PageDown') { e.preventDefault(); d.querySelector('[data-pl=next]').click(); }
    else if ((e.key === 'ArrowUp' && modKey(e)) || e.key === 'PageUp') { e.preventDefault(); d.querySelector('[data-pl=prev]').click(); }
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
  // マウス操作
  root.addEventListener('mousedown', (e) => {
    if (view !== 'tree' || busy) return;
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
        const r = treeRowsCache.find((x) => x.id === id); if (r) openRow(r, e.altKey);
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
  // キーボード操作
  document.addEventListener('keydown', (e) => {
    if (!root.classList.contains('on') || view !== 'tree' || busy || document.getElementById('pd-dlg') || document.getElementById('pd-player') || document.getElementById('pd-set')) return;
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
    else if (k === ' ' && cur) {
      e.preventDefault();
      const qv = document.querySelector('#pd-ql video');
      if (qv && e.target === qv) return; // 再生中の動画にフォーカスがあるときは一時停止に使う
      if (qlOpen) closeQL(); else showQL();
    }
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

  // ---------- 操作 ----------
  const CONFIRM = { name: 'チェックの入ったファイルの名前を整えます。よろしいですか？', sort: '表示中の作品をすべて仕分け（フォルダ作成・移動）します。よろしいですか？', ren: '表示中のフォルダ名をすべて変更します。よろしいですか？', clean: 'チェックの入った空フォルダをゴミ箱へ移し、入れ子のフォルダをまとめ、(1) を外します。よろしいですか？' , seller: 'チェックの入った作品フォルダを「販売者別」の中へ移動します（削除はしません）。よろしいですか？' };
  const RUN = { name: runName, sort: runSort, ren: runRen, clean: runClean, seller: runSeller };
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
    if (t.dataset.frg !== undefined) { const g = visibleGroups().find((x) => x.key === t.dataset.frg); if (g) { const del = g.items.find((f, i) => stateOf(f, i) === 'del'); openFrames([g.items[0].id, (del || g.items[1]).id]); } return; }
    if (t.dataset.g !== undefined) { if (busy) return; const g = visibleGroups().find((x) => x.key === t.dataset.g); if (g) runDelete([g]); return; }
    if (a === 'close' || a === 'mini') { root.classList.remove('on'); return; }
    if (a === 'tofull') { setWin('full'); return; }
    if (a === 'fullnext') { setOpenPref('full'); setWin('full'); status('次からは全画面で開きます（設定の「表示」→「開き方」で戻せます）'); return; }
    if (a === 'banclose') { try { localStorage.setItem(LS_POPBAN, '0'); } catch (err) { /* 無視 */ } applyWin(); return; }
    if (a === 'log') { showLog(); return; }
    if (a === 'settings') { openSettings(); return; }
    if (a === 'slookup') { runSellerLookup(); return; }
    if (t.dataset.sfilter) { sellerFilter = t.dataset.sfilter; render(); return; }
    if (a === 'sshowunk') { sellerFilter = selPlan.some((p) => p.kind === 'unknown') ? 'unknown' : 'review'; render(); const tb = $('[data-r=main] .sl-tabs'); if (tb) tb.scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
    if (a === 'sack') { sellerAck = true; sellerFilter = 'all'; render(); return; }
    if (a === 'sunack') { sellerAck = false; render(); return; }
    if (t.dataset.ssave) { if (!busy) saveRowSeller(t.dataset.ssave); return; }
    if (t.dataset.sext) { if (document.getElementById('pd-ext')) { closeExt(); return; } openExt(t, t.dataset.sext); return; }
    if (t.dataset.sredo) { if (busy) return; const p = selPlan.find((x) => x.id === t.dataset.sredo); if (p) { p.keys.forEach((k) => { if (sellerDb[k.key] && sellerDb[k.key].src !== 'manual') delete sellerDb[k.key]; }); saveSellerDb(); sellerSel.delete(p.id); sellerAck = false; log('info', `販売者を調べ直す対象に戻した：${p.name}`); setView('seller'); } return; }
    if (t.dataset.sedit) { if (!busy) editSeller(t.dataset.sedit); return; }
    if (a === 'theme') { setTheme(t.dataset.v); return; }
    if (a === 'lang') { if (!busy) setLang(LANG === 'en' ? 'ja' : 'en'); return; }
    if (a === 'tree') { if (!busy) openTree(); return; }
    if (a === 'lib') { openLib(t.dataset.v); return; }
    if (a === 'updskip') { const u = updRead(); u.skip = u.latest; updWrite(u); renderUpdate(); return; }
    if (a === 'updget') { status('インストール画面で「更新」（または「再インストール」）を押したあと、この画面を再読み込みすると新しいバージョンになります'); return; }
    if (a === 'texpand' || a === 'tcollapse') { if (!busy) treeAll(a === 'texpand'); return; }
    if (a === 'tview') { if (!busy) treeView(t.dataset.v); return; }
    if (a === 'tqs') { tree.qs = t.dataset.v; saveTree(); syncTqs(); if (view === 'tree') renderTree(); return; }
    if (a === 'toflow') { if (!busy) { if (view === 'tree') view = 'scan'; openFlow(); } return; }
    if (a === 'rescan') { if (!busy) { afterScan = view; runScan(); } return; }
    if (a === 'addlink') { if (!busy || view !== 'tree') { const c = view === 'tree' ? treeBase() : currentFolderId(); openAdd(isHomeId(c) ? 'DL' : c); } return; }
    if (a === 'spause') { lookupSt.paused = !lookupSt.paused; refreshSellerChrome(); status(lookupSt.paused ? '販売者の調査を一時停止しています（「再開」で続けます）' : '販売者の調査を再開しました'); return; }
    if (a === 'stop') { window.__ppdupStop = true; status('中断しています…（いまの処理が終わったら止まります）'); return; }
    if (busy) return;
    if (a === 'scan') return runScan();
    if (a === 'resclose') { delete lastResult[view]; const r = t.closest('.st-res'); if (r) r.remove(); return; }
    if (a === 'delall') return Promise.resolve(runDelete(visibleGroups())).then(() => captureResult('dup'));
    if (a === 'junkdel') return Promise.resolve(runJunk()).then(() => captureResult('junk'));
    if (a === 'jall' || a === 'jnone') { const lv = t.dataset.lv; jplan.filter((p) => p.level === lv).forEach((p) => junkSel.set(p.id, a === 'jall')); render(); renderActs(); return; }
    const m = /^(name|sort|ren|clean|seller)(1|all)$/.exec(a || '');
    if (m) { const v0 = view; if (m[2] === '1') Promise.resolve(RUN[m[1]](true)).then(() => captureResult(v0)); else if (confirm(tr(CONFIRM[m[1]]))) Promise.resolve(RUN[m[1]](false)).then(() => captureResult(v0)); return; }
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
    if (e.target.dataset && e.target.dataset.a === 'thover') { tree.hover = e.target.checked; saveTree(); hideHover(); return; }
    if (e.target.dataset && e.target.dataset.a === 'junkopt') { try { localStorage.setItem(LS_OPT_JUNK, e.target.checked ? '1' : '0'); } catch (err) { /* 無視 */ } log('info', '不要ファイルの除外を' + (e.target.checked ? 'オン' : 'オフ') + 'に変更'); setView(view); return; }
    const jid = e.target.dataset && e.target.dataset.jchk;
    if (jid) { junkSel.set(jid, e.target.checked); const row = e.target.closest('.pd-row'); if (row) row.classList.toggle('del', e.target.checked); renderActs(); return; }
    if (e.target.dataset && e.target.dataset.a === 'nameopt') { try { localStorage.setItem(LS_OPT_NAME, e.target.checked ? '1' : '0'); } catch (err) { /* 無視 */ } log('info', 'ファイル名の整理を' + (e.target.checked ? 'オン' : 'オフ') + 'に変更'); render(); renderNav(); return; }
    if (e.target.dataset && e.target.dataset.a === 'scanask') { try { localStorage.setItem(LS_SCANASK, e.target.checked ? '0' : '1'); } catch (err) { /* 無視 */ } return; }
    const sid2 = e.target.dataset && e.target.dataset.schk;
    if (sid2) { sellerSel.set(sid2, e.target.checked); const row = e.target.closest('.pd-row'); if (row) row.classList.toggle('sel', e.target.checked); refreshSellerChrome(); return; }
    const sg = e.target.dataset && e.target.dataset.sgrp;
    if (sg) { selPlan.filter((p) => p.kind !== 'pending' && (sg === 'k:fix' ? !!p.fix : sg === 'k:unknown' ? p.kind === 'unknown' : sg === 'k:review' ? p.kind === 'review' : p.kind === 'seller' && !p.fix && 's:' + p.seller.sid === sg)).forEach((p) => sellerSel.set(p.id, e.target.checked)); render(); renderActs(); return; }
    if (e.target.dataset && e.target.dataset.a === 'selleropt') { try { localStorage.setItem(LS_OPT_SELLER, e.target.checked ? '1' : '0'); } catch (err) { /* 無視 */ } log('info', '販売者ごとの仕分けを' + (e.target.checked ? 'オン' : 'オフ') + 'に変更'); setView(view); return; }
    const nid = e.target.dataset && e.target.dataset.nchk;
    if (nid) { if (e.target.checked) nameOff.delete(nid); else nameOff.add(nid); const row = e.target.closest('.pd-row'); if (row) row.classList.toggle('sel', e.target.checked); return; }
    const cid = e.target.dataset && e.target.dataset.cchk;
    if (cid) { if (e.target.checked) cleanOff.delete(cid); else cleanOff.add(cid); const row = e.target.closest('.pd-row'); const it = cplan.find((x) => x.id === cid); if (row) row.classList.toggle(it && it.op === 'rename' ? 'sel' : 'del', e.target.checked); return; }
    if (['mode', 'nearonly', 'renfilter'].includes(e.target.dataset.a)) render();
  });
  root.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches && e.target.matches('.sl-in input')) { e.preventDefault(); const b = e.target.closest('.sl-row'); if (b && !busy) saveRowSeller(b.dataset.srow); } });
  root.addEventListener('click', (e) => { const r = e.target.closest('[data-sr]'); if (r && view === 'tree' && !busy) revealInTree(r.dataset.sr); });
  const syncTqs = () => root.querySelectorAll('[data-a=tqs]').forEach((b) => b.classList.toggle('on', (tree.qs || 'here') === b.dataset.v));
  syncTqs();
  root.addEventListener('input', (e) => { if (e.target.dataset.a === 'q') render(); if (e.target.dataset.a === 'tq') { tree.q = e.target.value; renderTree(); } });
  // ---------- 開き方（ポップアップ／全画面） ----------
  // ポップアップは PikPak の画面の上に重ねる小さな画面。見出しをつかんで移動、右下で大きさを変える。位置と大きさは覚えておく
  const LS_OPEN = 'ppdup:open:v1', LS_POPGEOM = 'ppdup:popgeom:v1', LS_POPBAN = 'ppdup:popban:v1';
  const openPref = () => { try { return localStorage.getItem(LS_OPEN) === 'full' ? 'full' : 'pop'; } catch (e) { return 'pop'; } };
  const setOpenPref = (v) => { try { localStorage.setItem(LS_OPEN, v === 'full' ? 'full' : 'pop'); } catch (e) { /* 無視 */ } if (document.getElementById('pd-set')) renderSettings(); };
  let winMode = openPref();
  function popGeom() {
    let g = null; try { g = JSON.parse(localStorage.getItem(LS_POPGEOM) || 'null'); } catch (e) { g = null; }
    const W = window.innerWidth, H = window.innerHeight;
    const w = Math.min(W, Math.max(560, g && g.w ? g.w : Math.min(1040, W - 80))), h = Math.min(H, Math.max(380, g && g.h ? g.h : Math.min(720, H - 80)));
    const x = Math.min(Math.max(0, g && g.x != null ? g.x : W - w - 40), W - w), y = Math.min(Math.max(0, g && g.y != null ? g.y : 40), H - h);
    return { x, y, w, h };
  }
  const savePopGeom = (g) => { try { localStorage.setItem(LS_POPGEOM, JSON.stringify(g)); } catch (e) { /* 無視 */ } };
  function applyWin() {
    const pop = winMode === 'pop';
    root.classList.toggle('pop', pop);
    let ban = true; try { ban = localStorage.getItem(LS_POPBAN) !== '0'; } catch (e) { /* 無視 */ }
    root.classList.toggle('ban', pop && ban);
    if (pop) { const g = popGeom(); Object.assign(root.style, { left: g.x + 'px', top: g.y + 'px', width: g.w + 'px', height: g.h + 'px' }); }
    else ['left', 'top', 'width', 'height'].forEach((k) => root.style.removeProperty(k));
  }
  function setWin(m) { winMode = m === 'full' ? 'full' : 'pop'; applyWin(); if (document.getElementById('pd-set')) renderSettings(); }
  function showRoot() { if (!root.classList.contains('on')) winMode = isPhone() ? 'full' : openPref(); applyWin(); root.classList.add('on'); checkRotate(); checkUpdate(); libPeek(); setTimeout(() => { syncAsk(); if (Date.now() - syncAt > 60e3) syncNow('開いたとき'); }, 1500); }
  // 見出しをつかんで移動
  root.addEventListener('mousedown', (e) => {
    if (winMode !== 'pop' || e.button !== 0 || !e.target.closest('.brand') || e.target.closest('button,input,select,label,a,.pd-quota,.seg')) return;
    e.preventDefault();
    const r = root.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
    root.classList.add('dragging');
    const mv = (ev) => { root.style.left = Math.min(Math.max(0, ev.clientX - dx), window.innerWidth - 120) + 'px'; root.style.top = Math.min(Math.max(0, ev.clientY - dy), window.innerHeight - 48) + 'px'; };
    const up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); root.classList.remove('dragging'); const b = root.getBoundingClientRect(); savePopGeom({ x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) }); };
    document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
  });
  // 右下で大きさを変えたら覚えておく
  if (window.ResizeObserver) {
    let rt = null;
    new ResizeObserver(() => { if (winMode !== 'pop' || !root.classList.contains('on')) return; clearTimeout(rt); rt = setTimeout(() => { const b = root.getBoundingClientRect(); if (b.width && b.height) savePopGeom({ x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) }); }, 300); }).observe(root);
  }
  window.addEventListener('resize', () => { if (winMode === 'pop' && root.classList.contains('on')) applyWin(); });
  // ---------- 再生の強化（倍速・シークバーのサムネイル）とコマ一覧 ----------
  const LS_RATE = 'ppdup:rate:v1', LS_FRAMES = 'ppdup:frames:v1';
  const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
  const getRate = () => { let r = 1; try { r = +localStorage.getItem(LS_RATE) || 1; } catch (e) { /* 無視 */ } return r >= 0.25 && r <= 3 ? r : 1; };
  function setRate(r) {
    r = Math.round(Math.max(0.25, Math.min(3, r)) * 100) / 100;
    try { localStorage.setItem(LS_RATE, String(r)); } catch (e) { /* 無視 */ }
    document.querySelectorAll('#pd-ql video, #pd-player video').forEach((v) => { v.defaultPlaybackRate = r; v.playbackRate = r; });
    document.querySelectorAll('[data-rate]').forEach((s) => { if (![...s.options].some((o) => +o.value === r)) s.insertAdjacentHTML('beforeend', `<option value="${r}">${r}×</option>`); s.value = String(r); });
    return r;
  }
  const rateSelect = () => `<select data-rate title="再生速度（[ ] で 0.25 ずつ、\\ で 1 倍）">${[...new Set([...RATES, getRate()])].sort((a, b) => a - b).map((r) => `<option value="${r}"${r === getRate() ? ' selected' : ''}>${r}×</option>`).join('')}</select>`;
  document.addEventListener('change', (e) => { if (e.target.matches && e.target.matches('select[data-rate]')) setRate(+e.target.value); }, true);
  document.addEventListener('keydown', (e) => {
    if (!document.querySelector('#pd-ql video, #pd-player video')) return;
    const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === ']') { e.preventDefault(); status('再生速度：' + setRate(getRate() + 0.25) + '×'); }
    else if (e.key === '[') { e.preventDefault(); status('再生速度：' + setRate(getRate() - 0.25) + '×'); }
    else if (e.key === '\\') { e.preventDefault(); status('再生速度：' + setRate(1) + '×'); }
  }, true);
  // 影の video：見えないところでシークして、その位置の画面をキャンバスに描く（コマ一覧・シークバーのサムネイル）
  function makeGrabber(x, S) {
    const v = document.createElement('video');
    v.muted = true; v.crossOrigin = 'anonymous'; v.preload = 'auto'; v.playsInline = true;
    v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
    // Safari（特に iPhone・iPad）は画面に置いていない動画を読み込まないことがあるため、見えない場所に置く
    v.style.cssText = 'position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0;pointer-events:none';
    document.body.appendChild(v);
    let hls = null, closed = false;
    const ready = new Promise((res, rej) => {
      const to = setTimeout(() => rej(new Error('動画の読み込みが時間切れになりました')), 25000);
      v.addEventListener('loadedmetadata', () => { clearTimeout(to); res(); }, { once: true });
      v.addEventListener('error', () => { clearTimeout(to); rej(new Error('動画を読み込めませんでした')); }, { once: true });
      if (x.hls && S.H && S.H.isSupported()) {
        hls = new S.H({ maxBufferLength: 4, maxMaxBufferLength: 8, enableWorker: true, startLevel: 0, capLevelToPlayerSize: false });
        hls.on(S.H.Events.ERROR, (ev, d) => { if (d && d.fatal) { clearTimeout(to); rej(new Error(d.details || 'HLS の読み込みに失敗しました')); } });
        (async () => {
          let u = x.url;
          if (x.tsdl) { try { const r = await fetch(x.url, { cache: 'no-store', credentials: 'omit' }); if (r.ok) { const txt = fixTsM3u8(await r.text()); if (txt.includes('#EXTM3U')) u = URL.createObjectURL(new Blob([txt], { type: 'application/vnd.apple.mpegurl' })); } } catch (e) { /* そのまま読む */ } }
          if (!closed) { hls.loadSource(u); hls.attachMedia(v); }
        })();
      } else { v.src = x.url; try { v.load(); } catch (e) { /* 無視 */ } }
    });
    ready.catch(() => {});
    let q = Promise.resolve();
    const grab = (t, w = 320) => {
      const p = q.catch(() => {}).then(() => ready).then(() => new Promise((res, rej) => {
        if (closed) { rej(new Error('closed')); return; }
        const to = setTimeout(() => { v.removeEventListener('seeked', done); rej(new Error('コマの取得が時間切れになりました')); }, 20000);
        // Safari（拡張機能・アプリ版）は、移動した直後だとまだ絵が出ておらず真っ黒に描かれることがあるため、
        // 次のコマが表示されるのを待ち、真っ黒なら少し再生してから描き直す（3 回まで）
        const draw = () => {
          const h = Math.round(w * (v.videoHeight || 9) / (v.videoWidth || 16));
          const c = document.createElement('canvas'); c.width = w; c.height = h;
          const g = c.getContext('2d'); g.drawImage(v, 0, 0, w, h);
          const px = g.getImageData(0, 0, w, h).data; // 別のサイトの動画で描けないときはここで止まる
          let sum = 0, n = 0; for (let i = 0; i < px.length; i += 4 * 97) { sum += px[i] + px[i + 1] + px[i + 2]; n++; }
          return { c, dark: n > 0 && sum / n < 6 };
        };
        const nextFrame = (ms) => new Promise((r) => { const t2 = setTimeout(r, ms); if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(() => { clearTimeout(t2); r(); }); });
        async function done() {
          try {
            await nextFrame(400);
            let out = draw();
            for (let k = 0; out.dark && k < 3 && !closed; k++) {
              try { await v.play(); } catch (e) { /* 無視 */ }
              await nextFrame(600); await sleep(120);
              try { v.pause(); } catch (e) { /* 無視 */ }
              out = draw();
            }
            clearTimeout(to); res(out.c);
          } catch (e) { clearTimeout(to); rej(new Error('この動画はブラウザの制限でコマを作れません')); }
        }
        v.addEventListener('seeked', done, { once: true });
        v.currentTime = Math.max(0, Math.min(t, (v.duration || t + 1) - 0.2));
      }));
      q = p; return p;
    };
    return { ready, grab, v, get duration() { return v.duration || 0; }, close() { closed = true; killHls(hls); try { v.removeAttribute('src'); v.load(); } catch (e) { /* 無視 */ } v.remove(); } };
  }
  // コマを作るときは軽い画質（変換画質の低いもの）を使う
  // iPhone など hls.js が使えない環境では、HLS の動画を絵として取り出せない（真っ黒・止まる）ため、オリジナル画質（MP4）を使う
  const lightSrc = (S) => { if (!(S.H && S.H.isSupported && S.H.isSupported())) { const o = S.src.find((x) => !x.hls && !x.dl) || S.src.find((x) => !x.hls); if (o) return o; } const c = S.src.filter((x) => !x.dl && S.playable(x)); return c.filter((x) => !x.origin && x.h).sort((a, b) => a.h - b.h)[0] || c[c.length - 1] || S.src[S.first]; };
  const fmtT = (s) => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, ss = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : String(m).padStart(2, '0')) + ':' + String(ss).padStart(2, '0'); };
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
      tip.hidden = false; lb.textContent = fmtT(t);
      tip.style.left = Math.max(0, Math.min(r.width - 210, e.clientX - r.left - 105)) + 'px';
      if (!lb.dataset.err) { const k = Math.round(t / 5); if (cache.has(k)) draw(cache.get(k)); want = t; pump(); }
    });
    bar.addEventListener('mouseleave', () => { tip.hidden = true; want = -1; });
    bar.addEventListener('click', (e) => { v.currentTime = tAt(e); });
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
    const run = ++framesRun;
    let n = 16; try { n = +localStorage.getItem(LS_FRAMES) || 16; } catch (e) { /* 無視 */ }
    if (![9, 16, 25].includes(n)) n = 16;
    const d = document.createElement('div'); d.id = 'pd-frames'; document.body.appendChild(d);
    const kept = (id) => { if (view !== 'dup') return ''; const g = visibleGroups().find((x) => x.items.some((f) => f.id === id)); if (!g) return ''; const i = g.items.findIndex((f) => f.id === id); return stateOf(g.items[i], i) === 'del' ? 'del' : 'keep'; };
    d.innerHTML = `<div class="fr-box" role="dialog" aria-label="コマ一覧"><div class="fr-hd"><b>コマ一覧</b><span class="note">${ids.length > 1 ? '同じ位置のコマを左右に並べています' : ''}</span><span class="sp"></span><span class="seg">${[9, 16, 25].map((k) => `<button data-frn="${k}" class="${k === n ? 'on' : ''}">${k} コマ</button>`).join('')}</span><button class="x" data-frclose title="閉じる（Esc）" aria-label="閉じる">${IC.x}</button></div>
      <div class="fr-cols" style="grid-template-columns:repeat(${ids.length},minmax(0,1fr))">${ids.map((id) => { const f = fileById(id), k = kept(id); return `<div class="fr-col" data-frid="${esc(id)}"><div class="fr-meta">${k ? `<span class="fr-tag ${k}">${k === 'keep' ? '残す' : '削除'}</span>` : ''}<b title="${esc(f.name)}">${esc(f.name)}</b><span class="note raw" data-frinfo>${fmt(f.size)}</span></div><div class="fr-grid" style="grid-template-columns:repeat(${Math.sqrt(n)},1fr)">${Array.from({ length: n }, (_, i) => `<button class="fr-c" data-fri="${i}"><span class="t"></span></button>`).join('')}</div><div class="fr-msg note" data-frmsg>動画を読み込んでいます…</div><div class="fr-acts"><button data-frplay disabled>▶ 選んだコマから再生</button><button data-frsave disabled>画像で保存</button></div></div>`; }).join('')}</div>
      <div class="fr-ft note">コマは動画を読み込みながら順に出ます（1 本 10〜30 秒ほど）。コマを押して選び、「選んだコマから再生」でその位置から再生します。</div></div>`;
    if (LANG === 'en') d.querySelectorAll('*').forEach(trNode);
    d.addEventListener('mousedown', (e) => { if (e.target === d) closeFrames(); });
    d.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.frclose !== undefined) { closeFrames(); return; }
      if (b.dataset.frn) { try { localStorage.setItem(LS_FRAMES, b.dataset.frn); } catch (err) { /* 無視 */ } openFrames(ids); return; }
      const col = b.closest('.fr-col'); if (!col) return;
      if (b.dataset.fri !== undefined) { col.querySelectorAll('.fr-c.on').forEach((x) => x.classList.remove('on')); b.classList.add('on'); col.querySelector('[data-frplay]').disabled = !b.dataset.t; return; }
      if (b.dataset.frplay !== undefined) { const on = col.querySelector('.fr-c.on'); const t = on ? +on.dataset.t : 0; const id = col.dataset.frid; closeFrames(); playFile(id, { t }); return; }
      if (b.dataset.frsave !== undefined) saveSheet(col);
    });
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
        col.querySelector('[data-frinfo]').textContent = `${gr.v.videoWidth ? '' : ''}${fmt(fileById(id).size)}・${fmtT(dur)}`;
        const cells = [...col.querySelectorAll('.fr-c')];
        for (let i = 0; i < cells.length; i++) {
          if (run !== framesRun) return;
          const t = dur * (i + 0.5) / cells.length;
          msg.textContent = tr(`コマを作っています… ${i + 1} / ${cells.length}`);
          const c = await gr.grab(t, 320);
          cells[i].dataset.t = String(t); cells[i].prepend(c); cells[i].querySelector('.t').textContent = fmtT(t);
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
  const LIB_IC = { dl: '<svg viewBox="0 0 24 24"><path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 8.5a4 4 0 0 1-.5 7.97"/><path d="M12 11v9M8.8 17l3.2 3 3.2-3"/></svg>', recent: '<svg viewBox="0 0 24 24"><circle cx="11" cy="12" r="7.5"/><path d="M11 8v4.2l2.6 1.6"/><path d="M19.5 3.5v4M17.5 5.5h4"/></svg>', hist: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/><path d="M10.5 9.2v5.6l4.4-2.8z"/></svg>', star: '<svg viewBox="0 0 24 24"><path d="M12 3.8l2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8z"/></svg>', trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M9.5 7V4.8h5V7"/><path d="M6 7l1 12.2A1.5 1.5 0 0 0 8.5 20.6h7a1.5 1.5 0 0 0 1.5-1.4L18 7"/><path d="M10 11v6M14 11v6"/></svg>' };
  // ---------- 左メニュー：ダウンロード中・最近追加したもの・再生した履歴・スター付き・ゴミ箱 ----------
  const LIB_TABS = [['dl', 'ダウンロード中'], ['recent', '最近追加したもの'], ['hist', '再生した履歴'], ['star', 'スター付き'], ['trash', 'ゴミ箱']];
  let libSt = null, libBadge = { dl: 0, trash: 0 };
  const encF = (o) => encodeURIComponent(JSON.stringify(o));
  const phaseTxt = { PHASE_TYPE_RUNNING: 'ダウンロード中', PHASE_TYPE_PENDING: '順番待ち', PHASE_TYPE_ERROR: '失敗', PHASE_TYPE_COMPLETE: '完了' };
  async function libFetch(tab) {
    if (tab === 'dl') {
      const d = await api(`/tasks?type=offline&limit=100&thumbnail_size=SIZE_SMALL&filters=${encF({ phase: { in: 'PHASE_TYPE_RUNNING,PHASE_TYPE_PENDING,PHASE_TYPE_ERROR,PHASE_TYPE_COMPLETE' } })}`);
      return (d.tasks || []).map((t) => ({ id: t.id, fid: t.file_id || '', name: t.name || t.file_name || '', size: +t.file_size || 0, phase: t.phase, pct: +t.progress || 0, msg: t.message || '', at: t.created_time || '' }));
    }
    if (tab === 'hist') {
      const d = await api(`/events?thumbnail_size=SIZE_SMALL&limit=100&filters=${encF({ type: { in: 'TYPE_PLAY' } })}`);
      const seen = new Set(), out = [];
      (d.events || []).forEach((e) => {
        const r = e.reference_resource || {}; const id = String(e.file_id || r.id || '');
        if (!id || seen.has(id) || r.trashed) return; seen.add(id);
        out.push({ id, name: r.name || e.file_name || id, size: +(r.size || e.file_size) || 0, at: e.event_time || e.created_time || e.updated_time || '' });
      });
      return out;
    }
    if (tab === 'star' || tab === 'trash') {
      const fl = tab === 'star' ? { trashed: { eq: false }, system_tag: { in: 'STAR' } } : { trashed: { eq: true } };
      const out = []; let tk = '', n = 0;
      do {
        const d = await api(`/files?thumbnail_size=SIZE_SMALL&limit=500&parent_id=*&filters=${encF(fl)}${tk ? '&page_token=' + encodeURIComponent(tk) : ''}`);
        (d.files || []).forEach((f) => out.push({ id: f.id, name: f.name, size: +f.size || 0, folder: f.kind === 'drive#folder', at: f.modified_time || f.created_time || '' }));
        tk = d.next_page_token || '';
      } while (tk && ++n < 20);
      return out;
    }
    // 最近追加したもの：読み込んだ内容から（追加日の新しい順）
    if (!hasScan()) return null;
    const lim = Date.now() - libSt.days * 864e5;
    return files.filter((f) => f.ct && Date.parse(f.ct) >= lim).sort((a, b) => Date.parse(b.ct) - Date.parse(a.ct)).slice(0, 500)
      .map((f) => ({ id: f.id, name: f.name, size: f.size, at: f.ct, path: f.path }));
  }
  function openLib(tab) {
    if (!ensureSession(view)) return;
    closeCtx(); closeQL();
    libSt = { tab: tab || 'trash', items: [], sel: new Set(), loading: false, err: '', days: 7, busy: false };
    let d = document.getElementById('pd-lib');
    if (!d) {
      d = document.createElement('div'); d.id = 'pd-lib'; document.body.appendChild(d);
      d.addEventListener('mousedown', (e) => { if (e.target === d && !libSt.busy) closeLib(); });
      d.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b || b.disabled || !libSt) return;
        const x = b.dataset;
        if (x.lbclose !== undefined) { if (!libSt.busy) closeLib(); }
        else if (x.lbtab) { if (!libSt.busy) libLoad(x.lbtab); }
        else if (x.lbdays) { libSt.days = +x.lbdays; libLoad('recent'); }
        else if (x.lbreload !== undefined) libLoad(libSt.tab);
        else if (x.lbopen) libReveal(x.lbopen);
        else if (x.lbdo) libDo(x.lbdo);
      });
      d.addEventListener('change', (e) => {
        const t = e.target; if (!libSt) return;
        if (t.dataset.lbi !== undefined) { if (t.checked) libSt.sel.add(t.dataset.lbi); else libSt.sel.delete(t.dataset.lbi); renderLib(); }
        else if (t.dataset.lball !== undefined) { libSt.sel = new Set(t.checked ? libSt.items.map((i) => i.id) : []); renderLib(); }
      });
    }
    libLoad(libSt.tab);
  }
  function closeLib() { const d = document.getElementById('pd-lib'); if (d) d.remove(); libSt = null; renderRail(); }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.getElementById('pd-lib') && libSt && !libSt.busy) { e.preventDefault(); e.stopImmediatePropagation(); closeLib(); } }, true);
  async function libLoad(tab) {
    libSt.tab = tab; libSt.items = []; libSt.sel.clear(); libSt.err = ''; libSt.loading = true; renderLib(); renderRail();
    const my = libSt;
    try {
      const r = await libFetch(tab);
      if (libSt !== my || my.tab !== tab) return;
      if (r === null) my.err = 'scan'; else my.items = r;
      if (tab === 'dl') libBadge.dl = r.filter((t) => t.phase === 'PHASE_TYPE_RUNNING' || t.phase === 'PHASE_TYPE_PENDING').length;
      if (tab === 'trash') libBadge.trash = r.length;
    } catch (e) { if (libSt === my) my.err = e.message || String(e); }
    if (libSt !== my) return;
    my.loading = false; renderLib(); renderRail();
  }
  function libReveal(id) {
    if (!fileById(id) && !dirById(id)) { status('この項目は、読み込んだ範囲の外にあるか、読み込んだあとに追加されたものです。「再読み込み」すると場所を開けます'); return; }
    closeLib(); if (view !== 'tree') openTree(); revealInTree(id);
  }
  async function libDo(op) {
    const ids = [...libSt.sel]; const my = libSt;
    const n = ids.length;
    const chunk = async (fn) => { for (let i = 0; i < ids.length; i += 100) await fn(ids.slice(i, i + 100)); };
    let msg = '';
    if (op === 'empty') { if (!confirm(`ゴミ箱の ${my.items.length} 項目を完全に削除します。元に戻せません。よろしいですか？`)) return; }
    else if (op === 'del') { if (!n || !confirm(`選んだ ${n} 項目を完全に削除します。元に戻せません。よろしいですか？`)) return; }
    else if (!n) return;
    my.busy = true; renderLib();
    try {
      if (op === 'restore') { await chunk((c) => api('/files:batchUntrash', { method: 'POST', body: JSON.stringify({ ids: c }) })); msg = `${n} 項目を元の場所に戻しました（Dedupe の一覧に出すには「再読み込み」）`; }
      else if (op === 'del') { await chunk((c) => api('/files:batchDelete', { method: 'POST', body: JSON.stringify({ ids: c }) })); msg = `${n} 項目を完全に削除しました`; }
      else if (op === 'empty') { await api('/files/trash:empty', { method: 'PATCH' }); msg = 'ゴミ箱を空にしました'; }
      else if (op === 'unstar') { await chunk((c) => api('/files:unstar', { method: 'POST', body: JSON.stringify({ ids: c }) })); msg = `${n} 項目のスターを外しました`; }
      else if (op === 'cancel') { await chunk((c) => api(`/tasks?task_ids=${c.join(',')}&delete_files=false`, { method: 'DELETE' })); msg = `${n} 件をダウンロードの一覧から外しました（ダウンロード済みのファイルは残ります）`; }
      log('info', msg); status(msg);
    } catch (e) { if (e.session) { my.busy = false; closeLib(); throw e; } status('うまくいきませんでした：' + (e.message || e)); log('warn', '左メニューの操作に失敗：' + (e.message || e), op); }
    my.busy = false;
    if (libSt === my) { if (op === 'empty' || op === 'del' || op === 'restore') refreshQuota(true); libLoad(my.tab); }
  }
  function renderLib() {
    const d = document.getElementById('pd-lib'); if (!d || !libSt) return;
    const S = libSt, tab = S.tab;
    const when = (t) => { const v = Date.parse(t); return v ? new Date(v).toLocaleString(loc(), { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''; };
    const tabs = LIB_TABS.map(([k, l]) => `<button class="lb-tab${k === tab ? ' on' : ''}" data-lbtab="${k}">${LIB_IC[k]}<span>${l}</span>${k === 'dl' && libBadge.dl ? `<i>${libBadge.dl}</i>` : k === 'trash' && libBadge.trash ? `<i>${libBadge.trash}</i>` : ''}</button>`).join('');
    const selectable = tab !== 'recent' && tab !== 'hist';
    const row = (it) => {
      let tag = '', info = [it.size ? fmt(it.size) : '', when(it.at)];
      if (tab === 'dl') {
        const cls = it.phase === 'PHASE_TYPE_ERROR' ? 'del' : it.phase === 'PHASE_TYPE_COMPLETE' ? 'ok' : 'pri';
        tag = `<span class="lk-tag ${cls}">${phaseTxt[it.phase] || it.phase}${it.phase === 'PHASE_TYPE_RUNNING' ? ` ${it.pct}%` : ''}</span>`;
        if (it.phase === 'PHASE_TYPE_ERROR' && it.msg) info.push(it.msg);
      }
      if (tab === 'recent' && it.path) info.unshift(it.path);
      const openId = tab === 'dl' ? it.fid : tab === 'trash' ? '' : it.id;
      const bar = tab === 'dl' && it.phase === 'PHASE_TYPE_RUNNING' ? `<span class="uz-bar"><i style="width:${it.pct}%"></i></span>` : '';
      return `<div class="lb-row">${selectable ? `<input type="checkbox" data-lbi="${esc(it.id)}"${S.sel.has(it.id) ? ' checked' : ''}${S.busy ? ' disabled' : ''}>` : ''}<span class="lb-t"><b title="${esc(it.name)}">${it.folder ? '📁 ' : ''}${esc(it.name)}</b><small>${esc(info.filter(Boolean).join('・'))}</small>${bar}</span>${tag}${openId && (tab !== 'dl' || it.phase === 'PHASE_TYPE_COMPLETE') ? `<button data-lbopen="${esc(openId)}" title="フォルダ一覧でこの項目の場所を開く">場所を開く</button>` : ''}</div>`;
    };
    let body;
    if (S.loading) body = '<div class="empty">読み込み中…</div>';
    else if (S.err === 'scan') body = '<div class="empty">「最近追加したもの」は、読み込んだ内容から作ります。先に左の「再読み込み」で PikPak の中身を読み込んでください。</div>';
    else if (S.err) body = `<div class="empty">読み込めませんでした：${esc(S.err)}</div>`;
    else if (!S.items.length) body = `<div class="empty">${{ dl: 'ダウンロードのタスクはありません', recent: `この ${S.days} 日間に追加したものはありません`, hist: '再生した履歴はありません', star: 'スター付きの項目はありません', trash: 'ゴミ箱は空です' }[tab]}</div>`;
    else body = S.items.map(row).join('');
    const n = S.sel.size, dis = S.busy || S.loading ? ' disabled' : '';
    const acts = {
      dl: `<button data-lbdo="cancel"${n ? '' : ' disabled'}${dis}>一覧から外す（${n}）</button>`,
      recent: `<span class="seg">${[7, 30].map((x) => `<button data-lbdays="${x}" class="${S.days === x ? 'on' : ''}"${dis}>直近 ${x} 日</button>`).join('')}</span>`,
      hist: '', star: `<button data-lbdo="unstar"${n ? '' : ' disabled'}${dis}>スターを外す（${n}）</button>`,
      trash: `<button data-lbdo="restore"${n ? '' : ' disabled'}${dis}>元に戻す（${n}）</button><button class="dng" data-lbdo="del"${n ? '' : ' disabled'}${dis}>完全に削除（${n}）</button><button class="dng" data-lbdo="empty"${S.items.length ? '' : ' disabled'}${dis}>ゴミ箱を空にする</button>`,
    }[tab];
    const note = { dl: 'クラウドダウンロード（リンク・マグネットの追加）の状況。「一覧から外す」はタスクを消すだけで、ダウンロード済みのファイルは消しません。', recent: '追加日の新しい順。読み込んだ範囲（' + esc(dirLabel((scanRoot() || {}).id) || '—') + '）のファイルだけが出ます。', hist: 'PikPak で再生した動画（新しい順）。', star: 'PikPak でスターを付けた項目。', trash: `ゴミ箱の中身${quota ? `（${fmtCap(quota.trash)}）` : ''}。「完全に削除」「空にする」は元に戻せません。` }[tab];
    const all = selectable && S.items.length ? `<label class="note lb-all"><input type="checkbox" data-lball${n && n === S.items.length ? ' checked' : ''}${dis}> すべて選ぶ</label>` : '';
    d.innerHTML = `<div class="lk-box" role="dialog" aria-label="${esc(LIB_TABS.find((x) => x[0] === tab)[1])}"><div class="lk-hd"><b>${LIB_TABS.find((x) => x[0] === tab)[1]}</b><span class="note">${S.items.length && !S.loading ? S.items.length + ' 項目' : ''}</span><span class="sp"></span><button data-lbreload title="読み込み直す"${dis}>更新</button><button class="x" data-lbclose aria-label="閉じる">${IC.x}</button></div>
      <div class="lb-tabs">${tabs}</div>
      <div class="lb-note">${note}</div>
      <div class="lk-list">${all}${body}</div>
      <div class="lk-ft"><span class="tx">${S.busy ? '処理しています…' : ''}</span>${acts}</div></div>`;
  }
  // ---------- 新しいバージョンのお知らせ（12 時間に 1 回、GitHub の最新版の番号だけを確かめる） ----------
  const LS_UPD = 'ppdup:update:v1';
  const REPO_RAW = 'https://raw.githubusercontent.com/Noel-Labs39/pikpak-distill/main/pikpak-distill.user.js';
  const REPO_REL = 'https://github.com/Noel-Labs39/pikpak-distill/releases';
  const verNum = (v) => String(v || '').split('.').map((x) => +x || 0);
  const verNewer = (a, b) => { const x = verNum(a), y = verNum(b); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return false; };
  function updRead() { try { return JSON.parse(localStorage.getItem(LS_UPD) || '{}') || {}; } catch (e) { return {}; } }
  function updWrite(o) { try { localStorage.setItem(LS_UPD, JSON.stringify(o)); } catch (e) { /* 無視 */ } }
  async function checkUpdate(force) {
    const u = updRead();
    if (!force && u.at && Date.now() - u.at < 12 * 3600e3) { renderUpdate(); return u.latest; }
    try {
      const res = await fetch(REPO_RAW + '?t=' + Math.floor(Date.now() / 600e3), { cache: 'no-store', credentials: 'omit' });
      const txt = res.ok ? (await res.text()).slice(0, 2000) : '';
      const m = /@version\s+([\d.]+)/.exec(txt);
      if (m) { u.latest = m[1]; u.at = Date.now(); updWrite(u); }
    } catch (e) { log('info', '新しいバージョンの確認ができませんでした：' + (e.message || e)); }
    renderUpdate();
    return u.latest;
  }
  // 左メニューのバッジ（ダウンロード中の件数・ゴミ箱の項目数）。開いたときに 1 回だけ軽く確かめる
  let libPeekAt = 0;
  async function libPeek() {
    if (Date.now() - libPeekAt < 60e3 || !sessionValid()) return; libPeekAt = Date.now();
    try {
      const d = await api(`/tasks?type=offline&limit=100&filters=${encF({ phase: { in: 'PHASE_TYPE_RUNNING,PHASE_TYPE_PENDING' } })}`);
      libBadge.dl = (d.tasks || []).length;
      const t = await api(`/files?limit=100&parent_id=*&filters=${encF({ trashed: { eq: true } })}`);
      libBadge.trash = (t.files || []).length + (t.next_page_token ? 1 : 0);
    } catch (e) { if (e.session) return; }
    renderRail();
  }
  function renderUpdate() {
    const el = $('[data-r=upd]'); if (!el) return;
    const u = updRead();
    const show = u.latest && verNewer(u.latest, VER) && u.skip !== u.latest;
    el.hidden = !show;
    el.innerHTML = show ? `<span>新しいバージョン <b>v${esc(u.latest)}</b> が出ています（いまは v${VER}）</span><a href="${REPO_RAW}" target="_blank" rel="noopener" data-a="updget">更新する</a><a href="${REPO_REL}" target="_blank" rel="noopener">変更点</a><button data-a="updskip" title="このバージョンのお知らせを出さない">閉じる</button>` : '';
  }
  // ---------- 書き出し／読み込み（設定・販売者の調査結果・重複の判断・解凍パスワード） ----------
  const EXPORT_GROUPS = {
    settings: { label: '設定', keys: ['ppdup:theme:v1', 'ppdup:lang:v1', 'ppdup:open:v1', 'ppdup:popban:v1', 'ppdup:popgeom:v1', 'ppdup:opt:junk:v1', 'ppdup:opt:cleanname:v1', 'ppdup:opt:seller:v1', 'ppdup:player:v1', 'ppdup:player:q:v1', 'ppdup:rate:v1', 'ppdup:frames:v1', 'ppdup:tree:v1', 'ppdup:seller:cfg:v1', 'ppdup:scanstat:v1'] },
    seller: { label: '販売者の調査結果と手入力', keys: ['ppdup:seller:v1'], merge: true },
    decision: { label: '重複の判断（残す・削除の記録）', keys: ['ppdup:decision:v1'], merge: true },
    unzip: { label: '解凍パスワード', keys: ['ppdup:unzippw:v1'], merge: true },
  };
  let exportSel = { settings: true, seller: true, decision: true, unzip: true };
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const groupCount = (g, src) => {
    let n = 0;
    EXPORT_GROUPS[g].keys.forEach((k) => { const v = src ? src[k] : lsGet(k); if (v == null) return; if (!EXPORT_GROUPS[g].merge) { n++; return; } try { const o = JSON.parse(v); n += Array.isArray(o) ? o.length : Object.keys(o || {}).length; } catch (e) { n++; } });
    return n;
  };
  function exportData() {
    const data = {};
    Object.keys(EXPORT_GROUPS).forEach((g) => { if (!exportSel[g]) return; EXPORT_GROUPS[g].keys.forEach((k) => { const v = lsGet(k); if (v != null) data[k] = v; }); });
    const blob = new Blob([JSON.stringify({ app: 'pikpak-distill', ver: VER, at: new Date().toISOString(), data }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    const d = new Date(); a.download = `pikpak-distill_${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.json`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    status(`書き出しました（${Object.keys(data).length} 項目）。ログイン情報は含まれていません。`); log('info', '設定などを書き出し', Object.keys(data).join(','));
  }
  function importData() {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = async () => {
      const f = inp.files && inp.files[0]; if (!f) return;
      let j = null; try { j = JSON.parse(await f.text()); } catch (e) { j = null; }
      if (!j || j.app !== 'pikpak-distill' || !j.data || typeof j.data !== 'object') { status('このファイルは読み込めません（PikPak Distill で書き出した .json を選んでください）'); return; }
      const allowed = new Set(Object.values(EXPORT_GROUPS).flatMap((g) => g.keys));
      const src = {}; Object.keys(j.data).forEach((k) => { if (allowed.has(k) && typeof j.data[k] === 'string') src[k] = j.data[k]; });
      const gs = Object.keys(EXPORT_GROUPS).filter((g) => EXPORT_GROUPS[g].keys.some((k) => k in src));
      if (!gs.length) { status('読み込める項目がありませんでした'); return; }
      closeSettings();
      const d = document.createElement('div'); d.id = 'pd-dlg';
      d.innerHTML = `<div class="box" style="width:min(520px,94vw)"><h3>読み込む内容</h3><div class="note">${esc(f.name)}（v${esc(j.ver || '?')}・${esc(String(j.at || '').slice(0, 10))}）</div>
        <div style="margin:12px 0;display:flex;flex-direction:column;gap:6px">${gs.map((g) => `<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-ig="${g}" checked> <span>${esc(EXPORT_GROUPS[g].label)}：${groupCount(g, src)} 件${EXPORT_GROUPS[g].merge ? `（今は ${groupCount(g)} 件）` : ''}</span></label>`).join('')}</div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px"><label><input type="radio" name="pdim" value="merge" checked> 今のものに足す（同じものは読み込んだ方を優先）</label><label><input type="radio" name="pdim" value="replace"> 置き換える</label></div>
        <div class="note">読み込んだあと、画面を読み込み直して反映します。</div>
        <div class="acts" style="margin-top:14px"><button data-no>キャンセル</button><button class="danger" data-yes style="background:#306fff;border-color:#306fff">読み込む</button></div></div>`;
      document.body.appendChild(d);
      if (LANG === 'en') d.querySelectorAll('*').forEach(trNode);
      d.querySelector('[data-no]').onclick = () => d.remove();
      d.querySelector('[data-yes]').onclick = () => {
        const mode = d.querySelector('input[name=pdim]:checked').value;
        let n = 0;
        gs.filter((g) => d.querySelector(`[data-ig="${g}"]`).checked).forEach((g) => EXPORT_GROUPS[g].keys.forEach((k) => {
          if (!(k in src)) return;
          let v = src[k];
          if (mode === 'merge' && EXPORT_GROUPS[g].merge) { try { const cur = JSON.parse(lsGet(k) || 'null'); const inc = JSON.parse(v); if (Array.isArray(cur) && Array.isArray(inc)) v = JSON.stringify([...new Set([...inc, ...cur])]); else if (cur && typeof cur === 'object' && inc && typeof inc === 'object') v = JSON.stringify({ ...cur, ...inc }); } catch (e) { /* そのまま */ } }
          try { localStorage.setItem(k, v); n++; } catch (e) { /* 無視 */ }
        }));
        d.remove(); log('info', `設定などを読み込み（${mode === 'merge' ? '足す' : '置き換え'}・${n} 項目）`);
        status(`読み込みました（${n} 項目）。画面を読み込み直します…`);
        setTimeout(() => location.reload(), 900);
      };
    };
    inp.click();
  }
  // ---------- PikPak で同期（調査結果・判断・設定を PikPak のフォルダに置き、どの環境でも同じものを使う） ----------
  const SYNC_DIR = 'Dedupe（設定・同期）';
  const SYNC_FILE = 'dedupe-sync.json';
  const LS_SYNC = 'ppdup:sync:v1'; // { on, asked, pw, last, err }
  const LS_SYNCMETA = 'ppdup:syncmeta:v1'; // キー → { h: 中身の目印, at: 変わった時刻, clr: 消去した時刻 }
  const SYNC_KEYS = {
    'ppdup:seller:v1': 'seller', 'ppdup:decision:v1': 'union', 'ppdup:unzippw:v1': 'union',
    // 端末ごとに違ってよいもの（ウィンドウの位置・開き方など）は同期しない
    'ppdup:theme:v1': 'last', 'ppdup:lang:v1': 'last', 'ppdup:opt:junk:v1': 'last', 'ppdup:opt:cleanname:v1': 'last', 'ppdup:opt:seller:v1': 'last',
    'ppdup:player:v1': 'last', 'ppdup:player:q:v1': 'last', 'ppdup:rate:v1': 'last', 'ppdup:frames:v1': 'last', 'ppdup:seller:cfg:v1': 'last',
  };
  const syncCfg = () => { try { return { on: true, ...(JSON.parse(localStorage.getItem(LS_SYNC) || '{}') || {}) }; } catch (e) { return { on: true }; } };
  const saveSyncCfg = (p) => { try { localStorage.setItem(LS_SYNC, JSON.stringify({ ...syncCfg(), ...p })); } catch (e) { /* 無視 */ } };
  const syncKeys = () => Object.keys(SYNC_KEYS).filter((k) => k !== 'ppdup:unzippw:v1' || syncCfg().pw);
  const strHash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return s.length + ':' + h; };
  function syncMeta() { try { return JSON.parse(localStorage.getItem(LS_SYNCMETA) || '{}') || {}; } catch (e) { return {}; } }
  const saveSyncMeta = (m) => { try { localStorage.setItem(LS_SYNCMETA, JSON.stringify(m)); } catch (e) { /* 無視 */ } };
  // 手元で変わったキーに時刻を付ける（変わったものがあれば true）
  function syncTouch() {
    const m = syncMeta(); let ch = false;
    syncKeys().forEach((k) => { const v = lsGet(k); const h = v == null ? '' : strHash(v); if (!m[k] || m[k].h !== h) { m[k] = { ...(m[k] || {}), h, at: Date.now() }; ch = true; } });
    if (ch) saveSyncMeta(m);
    return ch;
  }
  // 「調べた結果をすべて消去」など、消したことを別の環境にも伝える
  function syncCleared(k) { const m = syncMeta(); m[k] = { ...(m[k] || {}), clr: Date.now() }; saveSyncMeta(m); }
  const parseJ = (v, d) => { try { const o = JSON.parse(v); return o == null ? d : o; } catch (e) { return d; } };
  function syncMerge(local, remote) {
    const out = {};
    new Set([...Object.keys(local), ...Object.keys(remote)]).forEach((k) => {
      const a = local[k], b = remote[k], kind = SYNC_KEYS[k];
      if (!kind) return;
      if (!a || !b) { out[k] = a || b; return; }
      const clr = Math.max(a.clr || 0, b.clr || 0);
      if (kind === 'last') { out[k] = (b.at || 0) > (a.at || 0) ? b : a; return; }
      const va = parseJ(a.v, null), vb = parseJ(b.v, null);
      let v;
      if (Array.isArray(va) || Array.isArray(vb)) v = [...new Set([...(Array.isArray(va) ? va : []), ...(Array.isArray(vb) ? vb : [])])];
      else if (kind === 'seller') {
        v = {};
        [vb || {}, va || {}].forEach((o) => Object.entries(o).forEach(([id, r]) => { if (!r || (r.at || 0) < clr) return; if (!v[id] || (r.at || 0) > (v[id].at || 0)) v[id] = r; }));
      } else v = { ...(vb || {}), ...(va || {}) };
      out[k] = { v: JSON.stringify(v), at: Math.max(a.at || 0, b.at || 0), clr };
    });
    return out;
  }
  // Thunder 方式のハッシュ（PikPak のファイル作成に必要）
  async function gcidOf(buf) {
    const sha = async (b) => new Uint8Array(await crypto.subtle.digest('SHA-1', b));
    let ps = 0x40000; while (buf.length / ps > 0x200 && ps < 0x200000) ps <<= 1;
    const parts = []; for (let i = 0; i < buf.length || i === 0; i += ps) { parts.push(await sha(buf.subarray(i, i + ps))); if (!buf.length) break; }
    const all = new Uint8Array(parts.length * 20); parts.forEach((p, i) => all.set(p, i * 20));
    return [...await sha(all)].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
  }
  async function syncFolder() {
    const home = await apiList('');
    const f = home.find((x) => x.kind === 'drive#folder' && x.name === SYNC_DIR);
    return f ? f.id : apiMkdir('', SYNC_DIR);
  }
  async function syncRead(dir) {
    const list = (await apiList(dir)).filter((x) => x.kind === 'drive#file' && /^dedupe-sync.*\.json$/.test(x.name)).sort((a, b) => Date.parse(b.modified_time || b.created_time || 0) - Date.parse(a.modified_time || a.created_time || 0));
    if (!list.length) return { files: [], data: null };
    const f = await apiGet(list[0].id);
    const url = f.web_content_link || ((f.links || {})['application/octet-stream'] || {}).url;
    let j = null; if (url) { try { j = await (await fetch(url, { cache: 'no-store', credentials: 'omit' })).json(); } catch (e) { j = null; } }
    return { files: list, data: j && j.app === 'pikpak-distill' && j.keys ? j.keys : null };
  }
  async function syncWrite(dir, keys) {
    const buf = new TextEncoder().encode(JSON.stringify({ app: 'pikpak-distill', ver: VER, at: new Date().toISOString(), note: 'PikPak Distill – Dedupe の設定と調査結果です。消すと、次に開いたときに手元の内容から作り直します。', keys }));
    const d = await api('/files', { method: 'POST', captcha: 'POST:/drive/v1/files', body: JSON.stringify({ kind: 'drive#file', name: SYNC_FILE, parent_id: dir, folder_type: 'NORMAL', size: String(buf.length), hash: await gcidOf(buf), upload_type: 'UPLOAD_TYPE_FORM' }) });
    if (d.form && d.form.url) {
      const fd = new FormData(); Object.entries(d.form.multi_parts || {}).forEach(([k, v]) => fd.append(k, v));
      fd.append('file', new Blob([buf], { type: 'application/json' }), SYNC_FILE);
      const r = await fetch(d.form.url, { method: d.form.method || 'POST', body: fd, credentials: 'omit' });
      if (!r.ok) throw new Error('同期ファイルを送れませんでした（HTTP ' + r.status + '）');
    }
    return (d.file || {}).id || '';
  }
  let syncBusy = false, syncAt = 0;
  async function syncNow(why) {
    const c = syncCfg();
    if (!c.on || !c.asked || syncBusy || !sessionValid()) return false;
    syncBusy = true; renderSyncRow('同期しています…');
    try {
      syncTouch();
      const m = syncMeta(), local = {};
      syncKeys().forEach((k) => { const v = lsGet(k); if (v != null || (m[k] && m[k].clr)) local[k] = { v: v == null ? (SYNC_KEYS[k] === 'last' ? null : '{}') : v, at: !c.last && SYNC_KEYS[k] === 'last' ? 0 : (m[k] && m[k].at) || 0, clr: (m[k] && m[k].clr) || 0 }; }); // 初めて同期する環境では、設定は PikPak 側を優先する
      const dir = await syncFolder();
      const R = await syncRead(dir);
      const merged = R.data ? syncMerge(local, R.data) : local;
      // 手元に反映
      let changed = [];
      Object.entries(merged).forEach(([k, o]) => { if (!syncKeys().includes(k) || o.v == null) return; if (lsGet(k) !== o.v) { try { localStorage.setItem(k, o.v); changed.push(k); } catch (e) { /* 無視 */ } } m[k] = { h: strHash(o.v), at: o.at || 0, clr: o.clr || 0 }; });
      saveSyncMeta(m);
      if (changed.length) syncApply(changed);
      // PikPak 側と違えば、新しいファイルを置いて古いものを消す
      const same = R.data && JSON.stringify(R.data) === JSON.stringify(merged);
      if (!same) {
        const id = await syncWrite(dir, merged);
        const old = R.files.map((x) => x.id).filter((x) => x && x !== id);
        if (old.length) await api('/files:batchDelete', { method: 'POST', body: JSON.stringify({ ids: old }) }).catch(() => {});
      }
      saveSyncCfg({ last: Date.now(), err: '' }); syncAt = Date.now();
      log('info', `PikPak で同期（${why}${changed.length ? `・取り込み ${changed.length} 項目` : ''}${same ? '' : '・保存'}）`);
      return true;
    } catch (e) {
      if (e.session) { syncBusy = false; return false; }
      saveSyncCfg({ err: String(e.message || e).slice(0, 200) }); log('warn', 'PikPak での同期に失敗：' + (e.message || e), why);
      return false;
    } finally { syncBusy = false; renderSyncRow(); }
  }
  // ほかの環境の内容を取り込んだら、画面に反映する
  function syncApply(keys) {
    if (keys.includes(LS_SELLER)) { sellerDb = parseJ(lsGet(LS_SELLER), {}) || {}; }
    if (keys.includes(LS_DECISION)) { decision = parseJ(lsGet(LS_DECISION), {}) || {}; }
    if (keys.includes(LS_THEME)) applyTheme();
    if (keys.includes(LS_LANG) && resolveLang() !== LANG) setLang(langPref());
    try { if (root.classList.contains('on') && !busy) { if (typeof selPlan !== 'undefined' && hasScan()) { /* 販売者の一覧は次に開いたときに作り直す */ } renderNav(); } } catch (e) { /* 無視 */ }
    status(`ほかの環境の内容を取り込みました（${keys.length} 項目）`);
  }
  function renderSyncRow(msg) {
    const el = document.querySelector('#pd-set [data-r=syncrow]'); if (!el) return;
    const c = syncCfg();
    el.textContent = msg || (!c.asked || !c.on ? 'オフ（このブラウザにだけ保存）' : c.err ? '前回は失敗：' + c.err : c.last ? '最後に同期：' + new Date(c.last).toLocaleString(loc(), { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'まだ同期していません');
  }
  // 初めて開いたときに一度だけ聞く
  function syncAsk() {
    if (syncCfg().asked || document.getElementById('pd-dlg') || !sessionValid()) return;
    const d = document.createElement('div'); d.id = 'pd-dlg';
    d.innerHTML = `<div class="box" style="width:min(520px,94vw)"><h3>調査結果と設定を PikPak で同期しますか？</h3>
      <div style="line-height:1.8">販売者の調査結果・重複の判断・設定を、PikPak のホームに作る「${esc(SYNC_DIR)}」フォルダに保存します。<b>ほかのブラウザやアプリでも、同じ PikPak にログインするだけで同じ内容を使えます。</b></div>
      <div class="note" style="margin:10px 0 16px">ログイン情報は保存しません。あとから「設定」→「情報」で切り替えられます。</div>
      <div class="acts"><button data-no>同期しない</button><button class="danger" data-yes style="background:#306fff;border-color:#306fff">同期する</button></div></div>`;
    document.body.appendChild(d);
    if (LANG === 'en') d.querySelectorAll('*').forEach(trNode);
    d.querySelector('[data-no]').onclick = () => { saveSyncCfg({ asked: true, on: false }); d.remove(); };
    d.querySelector('[data-yes]').onclick = () => { saveSyncCfg({ asked: true, on: true }); d.remove(); syncNow('はじめて'); };
  }
  // 変わったら 20 秒ほど待ってまとめて保存。開いたときと 10 分おきに取り込み
  setInterval(() => {
    const c = syncCfg(); if (!c.on || !c.asked || syncBusy || !sessionValid()) return;
    if (syncTouch() || Date.now() - syncAt > 10 * 60e3) syncNow(Date.now() - syncAt > 10 * 60e3 ? '定期' : '変更');
  }, 20e3);
  // ---------- 一括解凍（PikPak のサーバー側で解凍する。成功したパスワードを記録して次から自動で試す） ----------
  const LS_UNZIPPW = 'ppdup:unzippw:v1';
  const DEC = 'https://api-drive.mypikpak.com/decompress/v1';
  const isArchive = (name) => { const n = String(name || '').toLowerCase(); if (/\.part0*([2-9]|\d{2,})\.rar$/.test(n)) return false; return /\.(zip|rar|7z)$/.test(n) || /\.(7z|zip)\.0*1$/.test(n); };
  const pwList = () => { try { const a = JSON.parse(localStorage.getItem(LS_UNZIPPW) || '[]'); return Array.isArray(a) ? a.filter((x) => typeof x === 'string') : []; } catch (e) { return []; } };
  const savePw = (pw) => { if (!pw) return; const a = [pw, ...pwList().filter((x) => x !== pw)].slice(0, 50); try { localStorage.setItem(LS_UNZIPPW, JSON.stringify(a)); } catch (e) { /* 無視 */ } };
  const pwSignal = (d) => { const code = +(d && (d.error_code != null ? d.error_code : d.code)) || 0; const st = String((d && (d.status || d.status_code || d.error)) || '').toUpperCase(); return code === 10023 || /PASS_?WORD/.test(st); };
  let uzSt = null; // { items: [...], trash: true, busy }
  async function uzList(it, pw) {
    const r = await api(DEC + '/list', { method: 'POST', raw: true, captcha: 'POST:/decompress/v1/list', body: JSON.stringify({ gcid: it.gcid, file_id: it.id, password: pw || '', path: '' }) });
    const d = r.data || {};
    if (pwSignal(d)) return { pw: true };
    if (!r.ok || (d.status && d.status !== 'OK')) return { err: d.status_text || d.error_description || d.error || ('API ' + r.status) };
    const fs = Array.isArray(d.files) ? d.files : Array.isArray(d.list) ? d.list : [];
    return { ok: true, n: fs.length, size: fs.reduce((s, f) => s + (+(f.filesize || f.size || f.file_size) || 0), 0) };
  }
  async function uzCheck(it) {
    it.st = 'checking'; renderUnzip();
    try {
      if (!it.gcid) { const info = await apiGet(it.id); it.gcid = info.gcid || info.hash || info.md5_checksum || ''; }
      let r = await uzList(it, '');
      if (r.pw) {
        // 記録したパスワードを順に試す（最大 10 個）
        for (const pw of pwList().slice(0, 10)) { const t = await uzList(it, pw); if (t.ok) { r = t; it.pw = pw; it.autoPw = true; break; } await sleep(250); }
      }
      if (r.ok) { it.st = 'ready'; it.n = r.n; it.usize = r.size; it.on = true; }
      else if (r.pw) { it.st = 'pw'; it.on = false; }
      else { it.st = 'err'; it.err = r.err; it.on = false; }
    } catch (err) { if (err.session) { handleErr(err, view); return; } it.st = 'err'; it.err = err.message; it.on = false; }
    renderUnzip();
  }
  async function uzTryPw(i) {
    const it = uzSt.items[i]; const inp = document.querySelector(`#pd-unzip [data-uzpw="${i}"]`); if (!it || !inp) return;
    const pw = inp.value; if (!pw) return;
    it.st = 'checking'; renderUnzip();
    try { const r = await uzList(it, pw); if (r.ok) { it.st = 'ready'; it.pw = pw; it.n = r.n; it.usize = r.size; it.on = true; savePw(pw); } else if (r.pw) { it.st = 'pw'; it.bad = true; } else { it.st = 'err'; it.err = r.err; } }
    catch (err) { if (err.session) { handleErr(err, view); return; } it.st = 'err'; it.err = err.message; }
    renderUnzip();
  }
  function openUnzip(rows) {
    const list = rows.filter((r) => r.kind === 'file' && isArchive(r.name));
    if (!list.length) { status('選んだ中に、解凍できるファイル（.zip・.rar・.7z）がありません'); return; }
    if (!ensureSession(view)) return;
    closeCtx(); closeQL();
    uzSt = { trash: true, busy: false, items: list.map((r) => ({ id: r.id, name: r.name, size: r.size, parentId: r.parentId, path: r.path || fullPath(r.parentId), st: 'new', on: false, pw: '', gcid: '' })) };
    let d = document.getElementById('pd-unzip');
    if (!d) {
      d = document.createElement('div'); d.id = 'pd-unzip'; document.body.appendChild(d);
      d.addEventListener('mousedown', (e) => { if (e.target === d && !uzSt.busy) closeUnzip(); });
      d.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b || b.disabled) return;
        if (b.dataset.uzclose !== undefined) { if (!uzSt.busy) closeUnzip(); }
        else if (b.dataset.uztry !== undefined) uzTryPw(+b.dataset.uztry);
        else if (b.dataset.uzgo !== undefined) runUnzip();
      });
      d.addEventListener('change', (e) => { const t = e.target; if (t.dataset.uzi !== undefined) { uzSt.items[+t.dataset.uzi].on = t.checked; renderUnzip(); } else if (t.dataset.uztrash !== undefined) uzSt.trash = t.checked; });
      d.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.dataset.uzpw !== undefined) { e.preventDefault(); uzTryPw(+e.target.dataset.uzpw); } });
    }
    renderUnzip();
    (async () => { for (const it of uzSt.items) { if (!document.getElementById('pd-unzip')) return; await uzCheck(it); await sleep(200); } })();
  }
  function closeUnzip() { const d = document.getElementById('pd-unzip'); if (d) d.remove(); uzSt = null; }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.getElementById('pd-unzip') && uzSt && !uzSt.busy) { e.preventDefault(); e.stopImmediatePropagation(); closeUnzip(); } }, true);
  function renderUnzip() {
    const d = document.getElementById('pd-unzip'); if (!d || !uzSt) return;
    const typed = {}; d.querySelectorAll('[data-uzpw]').forEach((x) => { typed[x.dataset.uzpw] = x.value; });
    const tag = (cls, t) => `<span class="lk-tag ${cls}">${esc(t)}</span>`;
    const row = (it, i) => {
      const ext = (it.name.match(/\.([a-z0-9]+)(?:\.\d+)?$/i) || [, ''])[1].toUpperCase();
      const st = it.st === 'new' || it.st === 'checking' ? tag('pend', '中身を確認中…') : it.st === 'ready' ? tag('ok', it.autoPw ? '記録したパスワードで開けました' : it.pw ? 'パスワードで開けました' : '解凍できます')
        : it.st === 'pw' ? tag('warn', it.bad ? 'パスワードが違います' : 'パスワードが必要です') : it.st === 'running' ? tag('pri', `解凍中 ${it.pct || 0}%`) : it.st === 'done' ? tag('ok', '✓ 解凍しました' + (it.trashed ? '（元はゴミ箱へ）' : '')) : tag('del', 'できません');
      const info = `${esc(it.path || '/')}/・${fmt(it.size)}${it.n != null ? ` → ${it.n} 項目${it.usize ? `・解凍後 ${fmt(it.usize)}` : ''}` : ''}${it.st === 'err' ? `・${esc(it.err || '')}` : ''}`;
      const pw = it.st === 'pw' ? `<span class="uz-pw"><input type="password" data-uzpw="${i}" placeholder="パスワード" value="${esc(typed[i] || '')}"><button data-uztry="${i}">試す</button></span>` : '';
      const bar = it.st === 'running' ? `<span class="uz-bar"><i style="width:${it.pct || 0}%"></i></span>` : '';
      return `<div class="uz-row"><input type="checkbox" data-uzi="${i}"${it.on ? ' checked' : ''}${it.st !== 'ready' || uzSt.busy ? ' disabled' : ''}><span class="uz-ext">${esc(ext)}</span><span class="uz-t"><b title="${esc(it.name)}">${esc(it.name)}</b><small>${info}</small></span>${st}${pw}${bar}</div>`;
    };
    const n = uzSt.items.filter((x) => x.on && x.st === 'ready').length;
    const sz = uzSt.items.filter((x) => x.on && x.st === 'ready').reduce((s, x) => s + (x.usize || 0), 0);
    d.innerHTML = `<div class="lk-box" role="dialog" aria-label="解凍"><div class="lk-hd"><b>解凍（${uzSt.items.length} ファイル）</b><span class="sp"></span><label class="note" style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-uztrash${uzSt.trash ? ' checked' : ''}${uzSt.busy ? ' disabled' : ''}> 解凍できたら元の圧縮ファイルをゴミ箱へ</label><button class="x" data-uzclose title="閉じる（Esc）" aria-label="閉じる">${IC.x}</button></div>
      <div class="lk-list">${uzSt.items.map(row).join('')}</div>
      <div class="lk-ft"><span class="tx">${n ? `<b>解凍するもの ${n} 件</b>${sz ? `（解凍後 約 ${fmt(sz)}・PikPak の容量を使います）` : ''}　解凍先：それぞれ同じフォルダ` : '<b>解凍できるものを選んでください</b>（パスワードが必要なものは入力して「試す」）'}</span><button data-uzclose${uzSt.busy ? ' disabled' : ''}>閉じる</button><button class="pri" data-uzgo${n && !uzSt.busy ? '' : ' disabled'}>${n} 件を解凍</button></div></div>`;
    if (LANG === 'en') d.querySelectorAll('*').forEach(trNode);
  }
  async function runUnzip() {
    if (!uzSt || uzSt.busy) return;
    const list = uzSt.items.filter((x) => x.on && x.st === 'ready');
    if (!list.length) return;
    uzSt.busy = true; renderUnzip();
    let ok = 0, ng = 0;
    for (const it of list) {
      it.st = 'running'; it.pct = 0; renderUnzip();
      try {
        const r = await api(DEC + '/decompress', { method: 'POST', raw: true, captcha: 'POST:/decompress/v1/decompress', body: JSON.stringify({ gcid: it.gcid, file_id: it.id, password: it.pw || '', files: [], default_parent: true }) });
        const dd = r.data || {};
        if (pwSignal(dd)) throw new Error('パスワードが違います');
        if (!r.ok || (dd.status && dd.status !== 'OK' && dd.code !== 0 && !dd.task_id)) throw new Error(dd.status_text || dd.error_description || dd.error || ('API ' + r.status));
        const tid = dd.task_id || (dd.task && dd.task.id) || '';
        // 進み具合を見る（最大 30 分）
        const t0 = Date.now(); let fin = !tid;
        while (!fin && Date.now() - t0 < 30 * 60 * 1000) {
          await sleep(2000);
          const p = await api(DEC + '/progress?task_id=' + encodeURIComponent(tid), { raw: true });
          const pd = p.data || {}, ph = String(pd.phase || '').toUpperCase();
          it.pct = Math.max(it.pct || 0, Math.min(100, Math.floor(+pd.progress || 0))); renderUnzip();
          if (ph === 'PHASE_TYPE_COMPLETE') fin = true;
          else if (/ERROR|FAIL/.test(ph)) throw new Error(pd.message || pd.status_text || '解凍に失敗しました');
          else if (p.status === 404 && Date.now() - t0 > 20000) fin = true; // 終わると見えなくなることがある
        }
        if (!fin) throw new Error('時間切れ（PikPak 側で続いている可能性があります）');
        if (it.pw) savePw(it.pw);
        it.st = 'done'; it.pct = 100; ok++;
        if (uzSt.trash) {
          // 分割ファイル（〇〇.part2.rar など）も一緒にゴミ箱へ
          const m = it.name.match(/^(.*)\.part0*1\.rar$/i) || it.name.match(/^(.*\.(?:7z|zip))\.0*1$/i);
          const ids = [it.id, ...(m ? [...files, ...outer.files.values()].filter((f) => f.parentId === it.parentId && f.id !== it.id && (f.name.toLowerCase().startsWith(m[1].toLowerCase() + '.part') && /\.rar$/i.test(f.name) || f.name.toLowerCase().startsWith(m[1].toLowerCase() + '.') && /\.\d{2,3}$/.test(f.name))).map((f) => f.id) : [])];
          try { await api('/files:batchTrash', { method: 'POST', body: JSON.stringify({ ids }) }); it.trashed = true; } catch (e) { if (e.session) throw e; log('warn', '元の圧縮ファイルをゴミ箱へ移せませんでした：' + it.name); } }
        log('info', `解凍：${it.name}${it.trashed ? '（元はゴミ箱へ）' : ''}`);
      } catch (err) {
        if (err.session) { uzSt.busy = false; handleErr(err, view); return; }
        it.st = 'err'; it.err = err.message; ng++; log('error', `解凍できませんでした：${it.name}（${err.message}）`);
      }
      renderUnzip();
    }
    uzSt.busy = false; renderUnzip();
    status(`${ok} 件を解凍しました${ng ? `・できなかった ${ng} 件` : ''}。フォルダ一覧は「再読み込み」で最新になります。`);
    refreshQuota(); if (view === 'tree') refreshView();
  }
  // ---------- リンク・マグネットを追加（追加する前に、もうあるか確かめる） ----------
  // ・中身の確認：PikPak の resource/list で、マグネットの中のファイル一覧（とキャッシュの有無）を取る
  // ・すべて保存：クラウドダウンロード（UPLOAD_TYPE_URL）に追加
  // ・一部だけ保存：PikPak 側にキャッシュがあるファイル（gcid あり）だけを、選んだものだけすぐ保存
  const SS_ADDTEXT = 'ppdup:addtext';
  let addSt = null; // { pid, text, items: [...] }
  // 名前から「同じ作品」を見分けるための鍵（FC2 の品番・ABC-123・日付型の品番）
  function libKeys(name) {
    const n = String(name || ''), out = new Set();
    const fc2 = n.match(/FC2[\s_-]*(?:PPV[\s_-]*)?(\d{5,8})(?!\d)/i); if (fc2) out.add('fc2:' + fc2[1]);
    if (/FC2/i.test(n)) [...n.matchAll(/(?:^|[^\d])(\d{6,8})(?!\d)/g)].forEach((m) => out.add('fc2:' + m[1]));
    if (!out.size) {
      const j = n.match(/(?:^|[^A-Za-z0-9])([A-Za-z]{2,6})[-_ ]?(\d{3,5})(?![\d])/); if (j && !/^(FC|MP|AVI|MKV|HD|FHD|UHD|PART|CD|DISC|VOL|EP)$/i.test(j[1])) out.add('id:' + j[1].toUpperCase() + '-' + j[2]);
      workKeys(n).forEach((k) => { if (k.kind !== 'fc2') out.add(k.key.replace(/^x:(?:[a-z0-9]+-)?(?=\d{6})/, 'x:').replace(/_/g, '-')); });
    }
    // 品番がないときは、名前（拡張子を除く）が同じものを同じとみなす
    if (!out.size) { const nm = n.normalize('NFKC').toLowerCase().replace(/\.[a-z0-9]{2,5}$/, '').replace(/[\s._-]+/g, ' ').trim(); if (nm.length >= 6) out.add('nm:' + nm); }
    return [...out];
  }
  let libIdx = null;
  function buildLibIdx() {
    const m = new Map();
    const add = (name, path, size, isDir) => libKeys(name).forEach((k) => { if (!m.has(k)) m.set(k, { path, size, isDir }); });
    folders.forEach((d) => { if (!d.isRoot) add(d.name, d.path || '/', 0, true); });
    files.forEach((f) => add(f.name, (f.path || '').replace(/\/$/, '') + '/' + f.name, f.size, false));
    libIdx = m; return m;
  }
  const findInLib = (name) => { if (!hasScan()) return null; const m = libIdx || buildLibIdx(); for (const k of libKeys(name)) if (m.has(k)) return m.get(k); return null; };
  // 貼り付けた文からリンクを取り出す（マグネット・40 桁のハッシュ・http(s)/ftp/ed2k）。同じものは 1 つにまとめる
  function parseLinks(text) {
    const out = [], seen = new Set();
    const push = (url, kind, hash) => { const k = hash ? 'h:' + hash : 'u:' + url; if (seen.has(k)) return; seen.add(k); out.push({ url, kind, hash: hash || '' }); };
    String(text || '').split(/\r?\n/).forEach((line) => {
      [...line.matchAll(/magnet:\?[^\s"'<>]+/gi)].forEach((m) => { const h = (m[0].match(/xt=urn:btih:([a-z0-9]{32,40})/i) || [])[1]; if (h) push(m[0].replace(/&amp;/g, '&'), 'magnet', h.toLowerCase()); });
      if (/magnet:\?/i.test(line)) return;
      [...line.matchAll(/(?:https?|ftp|ed2k|thunder):\/\/[^\s"'<>]+/gi)].forEach((m) => push(m[0], 'url'));
      if (/:\/\//.test(line)) return;
      [...line.matchAll(/(?:^|[^a-z0-9])([a-f0-9]{40})(?![a-z0-9])/gi)].forEach((m) => push(`magnet:?xt=urn:btih:${m[1].toLowerCase()}`, 'magnet', m[1].toLowerCase()));
    });
    return out;
  }
  const linkName = (it) => { if (it.kind === 'magnet') { const dn = (it.url.match(/[?&]dn=([^&]+)/i) || [])[1]; if (dn) { try { return decodeURIComponent(dn.replace(/\+/g, ' ')); } catch (e) { return dn; } } return ''; } try { return decodeURIComponent(new URL(it.url).pathname.split('/').pop() || '') || it.url; } catch (e) { return it.url; } };
  // .torrent → マグネット（info の部分の SHA-1）
  async function torrentToMagnet(file) {
    const b = new Uint8Array(await file.arrayBuffer());
    let i = 0;
    const num = (end) => { let s = ''; while (b[i] !== end) s += String.fromCharCode(b[i++]); i++; return +s; };
    const skip = () => {
      const c = b[i];
      if (c === 0x69) { i++; num(0x65); return; } // i...e
      if (c === 0x6c || c === 0x64) { i++; while (b[i] !== 0x65) { skip(); } i++; return; } // l...e / d...e
      const len = num(0x3a); i += len; // 文字列
    };
    if (b[i] !== 0x64) throw new Error('.torrent の形式ではありません');
    i++;
    let name = '';
    while (b[i] !== 0x65 && i < b.length) {
      const klen = num(0x3a); const key = new TextDecoder().decode(b.slice(i, i + klen)); i += klen;
      if (key === 'info') {
        const st = i; skip(); const en = i;
        const h = new Uint8Array(await crypto.subtle.digest('SHA-1', b.slice(st, en)));
        // info の中の name（表示用）
        try { const t = new TextDecoder().decode(b.slice(st, en)); const m = t.match(/4:name(\d+):/); if (m) { const p = t.indexOf(m[0]) + m[0].length; name = t.slice(p, p + +m[1]); } } catch (e) { /* 無視 */ }
        const hex = [...h].map((x) => x.toString(16).padStart(2, '0')).join('');
        return `magnet:?xt=urn:btih:${hex}${name ? '&dn=' + encodeURIComponent(name) : ''}`;
      }
      skip();
    }
    throw new Error('.torrent の中に info がありません');
  }
  // resource/list の結果を、ファイルの一覧（相対パスつき）にする
  function flatResources(data) {
    const list = data && data.list && typeof data.list === 'object' ? data.list : data;
    const res = Array.isArray(list && list.resources) ? list.resources : Array.isArray(data && data.resources) ? data.resources : [];
    const kids = (r) => (r && r.dir && Array.isArray(r.dir.resources) ? r.dir.resources : Array.isArray(r && r.resources) ? r.resources : Array.isArray(r && r.children) ? r.children : []);
    const isDir = (r) => !!(r && (r.is_dir === true || r.is_dir === 'true' || r.kind === 'drive#folder' || kids(r).length));
    const out = [];
    let rootName = '';
    let roots = res;
    if (res.length === 1 && isDir(res[0])) { rootName = String(res[0].name || res[0].file_name || '').trim(); roots = kids(res[0]); }
    const walk = (r, dir) => {
      const name = String(r.name || r.file_name || r.title || '').trim() || '（名前なし）';
      if (isDir(r)) { kids(r).forEach((c) => walk(c, dir ? dir + '/' + name : name)); return; }
      out.push({ name, dir, size: Math.max(0, +(r.file_size != null ? r.file_size : r.size) || 0), gcid: String((r.meta && r.meta.hash) || r.gcid || r.hash || '').trim() });
    };
    roots.forEach((r) => walk(r, ''));
    if (!rootName && res.length === 1) rootName = String(res[0].name || res[0].file_name || '').trim();
    return { rootName, files: out };
  }
  // 一部だけ保存できるか（選んだファイルがすべてキャッシュあり）
  const addMode = (it) => {
    if (it.kind !== 'magnet' || !it.files || !it.files.length) return 'all';
    const on = it.files.filter((f) => f.on);
    return on.length === it.files.length ? 'all' : 'part';
  };
  async function previewLinks() {
    const ta = document.querySelector('#pd-add textarea');
    if (ta) addSt.text = ta.value;
    const links = parseLinks(addSt.text);
    if (!links.length) { addSt.msg = 'リンクが見つかりません。マグネット・http(s) のリンクを 1 行に 1 つずつ貼り付けてください'; renderAdd(); return; }
    if (!sessionValid()) { try { sessionStorage.setItem(SS_ADDTEXT, addSt.text); } catch (e) { /* 無視 */ } ensureSession(view); return; }
    const old = new Map(addSt.items.map((x) => [x.hash ? 'h:' + x.hash : 'u:' + x.url, x]));
    addSt.items = links.map((l) => old.get(l.hash ? 'h:' + l.hash : 'u:' + l.url) || { ...l, name: linkName(l), st: 'new', on: true });
    addSt.msg = ''; libIdx = null;
    addSt.busy = true; renderAdd();
    for (const it of addSt.items) {
      if (it.st === 'ok' || !document.getElementById('pd-add')) continue;
      const ex = findInLib(it.name);
      if (it.kind !== 'magnet') { it.st = 'ok'; it.exists = ex; it.on = !ex; renderAdd(); continue; }
      it.st = 'loading'; renderAdd();
      try {
        const r = flatResources(await api('/resource/list', { method: 'POST', captcha: 'POST:/drive/v1/resource/list', body: JSON.stringify({ urls: it.url }) }));
        it.rootName = r.rootName || it.name; if (!it.name) it.name = it.rootName;
        prepJunk(files, folders);
        it.files = r.files.map((f) => { const j = junkInfo({ name: f.name, size: f.size, parentId: '' }); const fx = findInLib(f.name); return { ...f, junk: j && j.level === 'del' ? j.reason : '', sub: j && j.level === 'review' ? j.reason : '', exists: fx, on: !(j && j.level === 'del') && !fx }; });
        it.exists = findInLib(it.name) || (it.files.length && it.files.every((f) => f.exists || f.junk) && it.files.some((f) => f.exists) ? it.files.find((f) => f.exists).exists : null);
        it.on = !it.exists;
        // 一部だけにしたいのにキャッシュがないファイルを含むときは、すべて保存に戻す
        if (addMode(it) === 'part' && it.files.some((f) => f.on && !f.gcid)) { it.files.forEach((f) => { f.on = true; }); it.note = 'キャッシュがないファイルがあるため、広告ファイルも含めてすべて保存します'; }
        it.st = 'ok';
      } catch (err) {
        if (err.session) { try { sessionStorage.setItem(SS_ADDTEXT, addSt.text); } catch (e) { /* 無視 */ } addSt.busy = false; handleErr(err, view); return; }
        it.st = 'err'; it.err = err.message; it.exists = findInLib(it.name); it.on = !it.exists;
      }
      renderAdd();
      await sleep(300);
    }
    addSt.busy = false; renderAdd();
  }
  function addSummary() {
    const on = addSt.items.filter((x) => x.on && x.st !== 'new' && x.st !== 'loading');
    const all = on.filter((x) => addMode(x) === 'all').length, part = on.filter((x) => addMode(x) === 'part');
    const pf = part.reduce((n, x) => n + x.files.filter((f) => f.on).length, 0), ps = part.reduce((n, x) => n + x.files.filter((f) => f.on).reduce((s, f) => s + f.size, 0), 0);
    const ex = addSt.items.filter((x) => x.exists && !x.on).length;
    return { n: on.length, text: on.length ? `<b>追加するもの ${on.length} 件</b>（すべて保存 ${all}${part.length ? `・一部だけ保存 ${part.length}：${pf} ファイル ${fmt(ps)}` : ''}）${ex ? `　もうある ${ex} 件は追加しません` : ''}` : `<b>追加するものがありません</b>${addSt.items.length ? '（チェックを入れたリンクだけを追加します）' : ''}` };
  }
  function addDestOptions() {
    const opts = [['DL', 'PikPak の既定の保存先（My Pack）']];
    const seen = new Set(['DL']);
    const push = (id, label) => { if (seen.has(id)) return; seen.add(id); opts.push([id, label]); };
    if (addSt.pid && addSt.pid !== 'DL') push(addSt.pid, isHomeId(addSt.pid) ? 'ホーム' : fullPath(addSt.pid));
    push('root', 'ホーム');
    folders.filter((d) => !d.isRoot).slice().sort((a, b) => a.path.localeCompare(b.path)).slice(0, 800).forEach((d) => push(d.id, d.path));
    return opts;
  }
  function renderAdd() {
    const d = document.getElementById('pd-add'); if (!d || !addSt) return;
    const ta = d.querySelector('textarea'); if (ta) addSt.text = ta.value;
    const pill = (cls, t) => `<span class="lk-tag ${cls}">${esc(t)}</span>`;
    const item = (it, i) => {
      const mode = addMode(it);
      const tag = it.st === 'loading' ? pill('pend', '中身を確認中…') : it.st === 'new' ? pill('pend', '未確認') : it.exists ? pill('warn', 'もうあります') : it.st === 'err' ? pill('warn', '中身を確認できません') : pill(mode === 'part' ? 'pri' : 'ok', mode === 'part' ? '一部だけ保存' : 'すべて保存');
      const info = it.exists ? `${esc(it.exists.path)} に同じ品番${it.exists.size ? `（${fmt(it.exists.size)}）` : ''}${it.on ? '・それでも追加します' : '・追加しません'}`
        : it.st === 'err' ? `${esc(it.err || '')}（すべて保存として追加はできます）` : it.files ? `${it.files.filter((f) => f.on).length} / ${it.files.length} ファイル・${fmt(it.files.filter((f) => f.on).reduce((s, f) => s + f.size, 0))}` : it.kind === 'url' ? 'クラウドダウンロードに追加' : '';
      const fl = it.files && it.files.length > 1 || (it.files && it.files.length === 1 && (it.files[0].junk || it.files[0].exists)) ? it.files.map((f, k) => {
        const part = mode === 'part';
        const dis = part && !f.gcid && !f.on;
        const t = f.junk ? pill('del', /広告/.test(f.junk) ? '広告' : '小さいファイル') : f.exists ? pill('warn', 'もうあります') : f.sub ? pill('mute', f.sub) : !f.gcid ? pill('mute', 'キャッシュなし') : '';
        return `<label class="lk-f${dis ? ' dis' : ''}" style="padding-left:${38 + (f.dir ? f.dir.split('/').length * 14 : 0)}px"><input type="checkbox" data-adf="${i}:${k}"${f.on ? ' checked' : ''}${dis ? ' disabled' : ''}><span class="nm" title="${esc((f.dir ? f.dir + '/' : '') + f.name)}">${f.dir ? `<i>${esc(f.dir)}/</i>` : ''}${esc(f.name)}</span>${t}<span class="sz">${fmt(f.size)}</span></label>`;
      }).join('') : '';
      return `<div class="lk-it${it.exists ? ' ex' : ''}"><div class="lk-h"><input type="checkbox" data-adi="${i}"${it.on ? ' checked' : ''}${it.st === 'new' || it.st === 'loading' ? ' disabled' : ''}><b title="${esc(it.url)}">${esc(it.name || it.rootName || it.url)}</b>${tag}<span class="sp"></span><span class="note">${info}</span></div>${it.note ? `<div class="lk-note">${esc(it.note)}</div>` : ''}${fl}</div>`;
    };
    const sum = addSummary();
    const checked = addSt.items.some((x) => x.st === 'ok' || x.st === 'err');
    const nLinks = parseLinks(addSt.text).length;
    d.innerHTML = `<div class="lk-box" role="dialog" aria-label="リンク・マグネットを追加">
      <div class="lk-hd"><b>リンク・マグネットを追加</b><span class="sp"></span><span class="note">保存先</span><select data-adpid>${addDestOptions().map(([id, l]) => `<option value="${esc(id)}"${(addSt.pid || 'DL') === id ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select><button class="x" data-adclose title="閉じる（Esc）" aria-label="閉じる">${IC.x}</button></div>
      <div class="lk-in"><textarea rows="4" placeholder="magnet:?xt=urn:btih:…&#10;https://…&#10;（.torrent ファイルはここにドロップ）" spellcheck="false">${esc(addSt.text)}</textarea>
        <div class="lk-row"><span class="note">1 行に 1 つ。マグネット・http(s)・40 桁のハッシュ・.torrent（ドロップ）に対応。同じリンクと文中のほかの文字は取り除きます。${hasScan() ? '読み込んだライブラリと照らして、もうある作品を知らせます。' : '<b>まだ読み込んでいないため、もうあるかは確かめられません</b>（先に「Dedupe スキャン」で読み込むと確かめられます）。'}</span><span class="sp"></span><button class="${checked ? '' : 'pri'}" data-adcheck${addSt.busy || !nLinks ? ' disabled' : ''}>${addSt.busy ? '確認中…' : `中身を確認（${nLinks} 件）`}</button></div>
        ${addSt.msg ? `<div class="lk-msg">${esc(addSt.msg)}</div>` : ''}</div>
      <div class="lk-list">${addSt.items.map(item).join('') || '<div class="empty">リンクを貼り付けて「中身を確認」を押すと、ここに中身が出ます</div>'}</div>
      <div class="lk-ft"><span class="tx">${sum.text}</span><button data-adclose>キャンセル</button><button class="${checked ? 'pri' : ''}" data-adgo${sum.n && !addSt.busy ? '' : ' disabled'}>${sum.n} 件を追加</button></div></div>`;
    if (LANG === 'en') d.querySelectorAll('*').forEach(trNode);
    const nta = d.querySelector('textarea');
    nta.addEventListener('input', () => { addSt.text = nta.value; const b = d.querySelector('[data-adcheck]'); const n = parseLinks(nta.value).length; if (b && !addSt.busy) { b.disabled = !n; b.textContent = tr(`中身を確認（${n} 件）`); } });
  }
  function openAdd(pid) {
    closeFab(); closeCtx();
    let text = ''; try { text = sessionStorage.getItem(SS_ADDTEXT) || ''; sessionStorage.removeItem(SS_ADDTEXT); } catch (e) { /* 無視 */ }
    addSt = { pid: pid || 'DL', text, items: [], busy: false, msg: '' };
    let d = document.getElementById('pd-add');
    if (!d) {
      d = document.createElement('div'); d.id = 'pd-add'; document.body.appendChild(d);
      d.addEventListener('mousedown', (e) => { if (e.target === d && !addSt.busy) closeAdd(); });
      d.addEventListener('click', onAddClick);
      d.addEventListener('change', onAddChange);
      d.addEventListener('dragover', (e) => { e.preventDefault(); d.classList.add('drop'); });
      d.addEventListener('dragleave', (e) => { if (e.target === d) d.classList.remove('drop'); });
      d.addEventListener('drop', async (e) => {
        e.preventDefault(); d.classList.remove('drop');
        const fs = [...(e.dataTransfer.files || [])].filter((f) => /\.torrent$/i.test(f.name));
        const add = [];
        for (const f of fs) { try { add.push(await torrentToMagnet(f)); } catch (err) { addSt.msg = `${f.name}：${err.message}`; } }
        const txt = e.dataTransfer.getData('text');
        addSt.text = [addSt.text.trim(), ...add, fs.length ? '' : txt].filter(Boolean).join('\n');
        renderAdd();
      });
    }
    renderAdd();
    d.querySelector('textarea').focus();
  }
  function closeAdd() { const d = document.getElementById('pd-add'); if (d) d.remove(); addSt = null; }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.getElementById('pd-add') && addSt && !addSt.busy) { e.preventDefault(); e.stopImmediatePropagation(); closeAdd(); } }, true);
  function onAddClick(e) {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.adclose !== undefined) { if (!addSt.busy) closeAdd(); return; }
    if (b.dataset.adcheck !== undefined) { previewLinks(); return; }
    if (b.dataset.adgo !== undefined) { runAdd(); }
  }
  function onAddChange(e) {
    const t = e.target;
    if (t.dataset.adpid !== undefined) { addSt.pid = t.value; return; }
    if (t.dataset.adi !== undefined) { const it = addSt.items[+t.dataset.adi]; if (it) it.on = t.checked; renderAdd(); return; }
    if (t.dataset.adf) {
      const [i, k] = t.dataset.adf.split(':').map(Number); const it = addSt.items[i]; if (!it) return;
      it.files[k].on = t.checked; it.note = '';
      // 一部だけ保存になったら、キャッシュのないファイルは選べない
      if (addMode(it) === 'part') { const bad = it.files.filter((f) => f.on && !f.gcid); if (bad.length) { bad.forEach((f) => { f.on = false; }); it.note = `キャッシュがないファイル ${bad.length} 件は、一部だけの保存では保存できません（すべてにチェックを入れると、すべて保存になります）`; } }
      if (!it.files.some((f) => f.on)) it.on = false; else if (!it.exists) it.on = true;
      renderAdd();
    }
  }
  async function runAdd() {
    if (!addSt || addSt.busy) return;
    const list = addSt.items.filter((x) => x.on && x.st !== 'new' && x.st !== 'loading');
    if (!list.length) return;
    if (!sessionValid()) { try { sessionStorage.setItem(SS_ADDTEXT, addSt.text); } catch (e) { /* 無視 */ } ensureSession(view); return; }
    const pid = addSt.pid === 'DL' ? '' : apiPid(addSt.pid);
    addSt.busy = true; renderAdd();
    let ok = 0, ng = 0, dupl = 0, nfile = 0;
    const errs = [];
    for (const it of list) {
      try {
        if (addMode(it) === 'part') {
          // 入れ物のフォルダ（同じ名前があれば (2) などを付ける）→ 中のフォルダ → ファイル
          // 既定の保存先のときは、PikPak の既定の保存フォルダ（My Pack）の中に作る
          let base = pid;
          if (!base) { const home = await apiList(''); const mp = home.find((x) => x.kind === 'drive#folder' && (x.folder_type === 'DOWNLOAD' || x.name === 'My Pack')); if (mp) base = mp.id; }
          const sib = new Set((await apiList(base || '')).map((x) => x.name.toLowerCase()));
          let nm = String(it.rootName || it.name || 'magnet').replace(/[\/\\]/g, '・').slice(0, 200), c = 1;
          while (sib.has(nm.toLowerCase())) nm = `${String(it.rootName || it.name).replace(/[\/\\]/g, '・').slice(0, 200)} (${++c})`;
          const top = await apiMkdir(base, nm);
          const dirs = new Map([['', top]]);
          for (const f of it.files.filter((x) => x.on)) {
            let cur = '', p = top;
            for (const part of (f.dir ? f.dir.split('/') : [])) { cur = cur ? cur + '/' + part : part; if (!dirs.has(cur)) dirs.set(cur, await apiMkdir(p, part)); p = dirs.get(cur); }
            await api('/files', { method: 'POST', captcha: 'POST:/drive/v1/files', body: JSON.stringify({ kind: 'drive#file', name: f.name, size: String(f.size), hash: f.gcid.toUpperCase(), upload_type: 'UPLOAD_TYPE_RESUMABLE', folder_type: 'NORMAL', objProvider: { provider: 'UPLOAD_TYPE_UNKNOWN' }, parent_id: p }) });
            nfile++;
          }
        } else {
          const body = { kind: 'drive#file', upload_type: 'UPLOAD_TYPE_URL', url: { url: it.url }, params: { with_thumbnail: 'true', from: 'manual' } };
          if (pid) body.parent_id = pid; else body.folder_type = 'DOWNLOAD';
          await api('/files', { method: 'POST', captcha: 'POST:/drive/v1/files', body: JSON.stringify(body) });
        }
        ok++; it.on = false; it.done = true;
        log('info', `リンクを追加（${addMode(it) === 'part' ? '一部だけ保存' : 'クラウドダウンロード'}）：${it.name || it.url}`);
      } catch (err) {
        if (err.session) { try { sessionStorage.setItem(SS_ADDTEXT, addSt.text); } catch (e) { /* 無視 */ } addSt.busy = false; handleErr(err, view); return; }
        if (/exist|already|重複|已存在/i.test(err.message)) { dupl++; it.on = false; continue; }
        ng++; errs.push(`${it.name || it.url}：${err.message}`);
      }
      await sleep(400);
    }
    addSt.busy = false;
    addSt.msg = `${ok} 件を追加しました${nfile ? `（すぐ保存したファイル ${nfile}）` : ''}${dupl ? `・PikPak に同じタスクがあった ${dupl} 件` : ''}${ng ? `・失敗 ${ng} 件：${errs.slice(0, 3).join(' ／ ')}` : ''}。クラウドダウンロードの分は、完了すると保存先に出ます。`;
    addSt.items = addSt.items.filter((x) => !x.done);
    addSt.text = addSt.items.map((x) => x.url).join('\n');
    renderAdd(); status(addSt.msg); refreshQuota();
    if (view === 'tree' && nfile) refreshView();
  }
  // ---------- スマホ（案 A）：縦向きのときは横向きをすすめる。横向きは左のメニューを文字なしにして詰める ----------
  const SS_ROTATE = 'ppdup:rotate-ok';
  const isPhone = () => { try { return matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 600; } catch (e) { return false; } };
  function checkRotate() {
    const old = root.querySelector('.pd-rotate');
    let ok = false; try { ok = sessionStorage.getItem(SS_ROTATE) === '1'; } catch (e) { /* 無視 */ }
    const portrait = isPhone() && innerHeight > innerWidth;
    root.classList.toggle('phone', isPhone());
    if (!portrait || ok || !root.classList.contains('on')) { if (old) old.remove(); return; }
    if (old) return;
    root.insertAdjacentHTML('beforeend', '<div class="pd-rotate"><div class="box"><div class="ic">⟲</div><b>横向きにすると見やすくなります</b><small>Dedupe は一覧や比べる画面が横に広いので、スマホは横向きがおすすめです</small><button data-a="rotateok">このまま使う</button></div></div>');
    if (LANG === 'en') root.querySelectorAll('.pd-rotate *').forEach(trNode);
  }
  window.addEventListener('resize', checkRotate);
  window.addEventListener('orientationchange', () => setTimeout(checkRotate, 300));
  root.addEventListener('click', (e) => { if (e.target.closest('[data-a=rotateok]')) { try { sessionStorage.setItem(SS_ROTATE, '1'); } catch (err) { /* 無視 */ } checkRotate(); } });
  // ---------- フローティングメニュー ----------
  function openFlow() {
    mode = 'flow'; root.classList.remove('single'); showRoot(); updateLogBadge();
    if (!busy) setView(hasScan() ? (view || 'scan') : 'scan');
  }
  // 1つの作業だけを開く。まだ読み込んでいなければ、先に読み込んでから開く
  function openTask(v) {
    mode = v === 'scan' ? 'flow' : 'single';
    root.classList.toggle('single', mode === 'single'); showRoot(); updateLogBadge();
    if (busy) return;
    if (v !== 'scan' && !hasScan()) { afterScan = v; setView('scan'); if (!scanAsk()) runScan(); return; }
    setView(v);
  }
  function renderFab() {
    const seen = +(localStorage.getItem(LS_LOGSEEN) || 0);
    const errs = readLog().filter((x) => x.level === 'error' && x.t > seen).length;
    fab.innerHTML = `<button class="it" data-fab="tree"${busy ? ' disabled' : ''}><span class="ic">${IC.folder}</span><span class="t"><b>フォルダ一覧</b><small>見る・再生・名前の変更・移動</small></span></button>
      <button class="it pri" data-fab="flow"><span class="ic">${IC.dedupe}</span><span class="t"><b>Dedupe スキャン</b><small>重複・不要ファイルを読み込んで整理</small></span></button>
      <button class="it" data-fab="add"${busy ? ' disabled' : ''}><span class="ic">${IC.link}</span><span class="t"><b>リンク・マグネットを追加</b><small>追加する前に、もうあるか確かめる</small></span></button>
      ${errs ? `<div class="err">${IC.alert}<span>前回の操作でエラーが ${errs} 件あります</span><button data-fab="log">確認</button></div>` : ''}`;
  }
  const closeFab = () => fab.classList.remove('on');
  btn.addEventListener('click', (e) => { e.stopPropagation(); if (fab.classList.contains('on')) { closeFab(); return; } renderFab(); fab.classList.add('on'); });
  fab.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    const k = b.dataset.fab; closeFab();
    if (k === 'flow') { if (!busy && view === 'tree') view = 'scan'; openFlow(); }
    else if (k === 'log') showLog();
    else if (k === 'add') { const c = currentFolderId(); openAdd(isHomeId(c) ? 'DL' : c); }
    else if (k === 'tree') { mode = 'single'; root.classList.add('single'); showRoot(); updateLogBadge(); openTree(); }
    else openTask(k);
  });
  document.addEventListener('click', (e) => { if (fab.classList.contains('on') && !fab.contains(e.target) && e.target !== btn) closeFab(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeFab(); });
  updateLogBadge();
  renderLangBtn(); applyTheme();
  if (LANG === 'en') document.querySelectorAll(UI_SEL).forEach(trNode);
  resumeAfterReload();

  window.PPDup = { buildCleanPlan, buildSortPlan, buildRenamePlan, get folders() { return folders; }, scanApi, buildGroups, render, get files() { return files; }, set files(v) { files = v; } };
})();
