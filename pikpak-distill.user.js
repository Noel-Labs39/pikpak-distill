// ==UserScript==
// @name         PikPak Distill – Dedupe
// @namespace    local.pikpak.dupcompare
// @author       Noel Labs
// @license      MIT
// @homepage     https://github.com/Noel-Labs39/pikpak-distill
// @supportURL   https://github.com/Noel-Labs39/pikpak-distill/issues
// @updateURL    https://raw.githubusercontent.com/Noel-Labs39/pikpak-distill/main/pikpak-distill.user.js
// @downloadURL  https://raw.githubusercontent.com/Noel-Labs39/pikpak-distill/main/pikpak-distill.user.js
// @version      3.13.1
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTQiIGZpbGw9IiMzMDZmZmYiLz48cmVjdCB4PSIxMiIgeT0iMTYiIHdpZHRoPSIyNCIgaGVpZ2h0PSIzMiIgcng9IjQiIGZpbGw9IiNmZmYiIG9wYWNpdHk9Ii41NSIvPjxyZWN0IHg9IjI2IiB5PSIxMiIgd2lkdGg9IjI2IiBoZWlnaHQ9IjM0IiByeD0iNCIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik0zMiAyNGgxNE0zMiAzMGgxNE0zMiAzNmg5IiBzdHJva2U9IiMzMDZmZmYiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PGNpcmNsZSBjeD0iNDQiIGN5PSI0NiIgcj0iOSIgZmlsbD0iI2ZmYjAyMCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjMiLz48cGF0aCBkPSJNNDAgNDZsMyAzIDUtNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==
// @description  PikPakの重複ファイルを、サムネイルとサイズで比べて整理するツール。広告・宣伝などの不要ファイルの削除、作品ごとの仕分け、フォルダ名の整合、(1)の除去、チェックしたファイルの削除（ゴミ箱／完全削除）に対応。
// @match        https://mypikpak.com/*
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/hls.js@1.5.8/dist/hls.min.js
// @run-at       document-idle
// ==/UserScript==
(function () {
  'use strict';
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
  const VER = '3.13.1'; // @version と合わせて更新する

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

  // ---------- 不要ファイル（広告・宣伝／10MB以下／中国語）の判定 ----------
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
    if (zh && !id) return { level: 'del', reason: '中国語のファイル（品番なし）' };
    if (!id && f.size < SPREAD_MAX && spreadNames.has(name.toLowerCase())) return { level: 'del', reason: '広告・宣伝（品番がなく、複数のフォルダに同じ名前）' };
    if (!id && workDirs.has(f.parentId)) return f.size < AD_VIDEO_MAX ? { level: 'del', reason: '広告・宣伝（作品フォルダの中の、品番のない小さなファイル）' } : { level: 'review', reason: '作品フォルダの中の、品番のないファイル' };
    if (zh) return { level: 'review', reason: '中国語のファイル名（品番あり・作品の可能性）' };
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
  function readCred() {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith('credentials')) continue;
      try {
        const v = JSON.parse(localStorage.getItem(k));
        if (v && v.access_token) return { auth: (v.token_type || 'Bearer') + ' ' + v.access_token, expiresAt: v.expires_at ? Date.parse(v.expires_at) : 0 };
      } catch (e) { /* 次へ */ }
    }
    return null;
  }
  // PikPak画面はログイン情報を「期限が切れてから」更新するため、期限前に切れた扱いにすると再読み込みしても更新されない。
  // そのため余裕は30秒だけにして、期限ぎりぎりまで使う
  const SESSION_MARGIN = 30 * 1000;
  const sessionValid = () => { const c = readCred(); return !!c && (!c.expiresAt || c.expiresAt - Date.now() > SESSION_MARGIN); };
  const sessionError = (msg) => { const e = new Error(msg); e.session = true; return e; };
  function apiHeaders() {
    const c = readCred();
    if (!c) throw sessionError('ログイン情報を取得できません');
    if (c.expiresAt && c.expiresAt - Date.now() <= SESSION_MARGIN) throw sessionError('ログインの有効期限が切れています');
    return { 'Content-Type': 'application/json', Authorization: c.auth, 'x-device-id': localStorage.getItem('deviceid') || '' };
  }
  // 通信はPikPakの画面と同じ方法（ページ上の fetch）で行う。
  // ※ Tampermonkey の GM_xmlhttpRequest 経由だと、PikPak側で「認証コードが無効です」と拒否されるため使わない
  const http = (url, opt) => fetch(url, opt);
  async function api(path, opt = {}) {
    for (let tries = 0; ; tries++) {
      let res;
      try { res = await http(API + path, { ...opt, headers: apiHeaders() }); }
      catch (e) {
        if (e.session) throw e;
        if (tries < 2) { await sleep(1500); continue; }
        log('warn', e.message + '（ログイン切れとして再読み込みで回復します）', (opt.method || 'GET') + ' ' + path.split('?')[0]);
        // 長時間放置後は通信自体が失敗することがあるため、ログイン切れとして扱い再読み込みで回復させる
        throw sessionError(e.message === 'Failed to fetch' ? 'PikPakのサーバーに接続できませんでした' : e.message);
      }
      if ((res.status === 429 || res.status >= 500) && tries < 5) { await sleep(1500 * (tries + 1)); continue; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error_description || data.error || 'API ' + res.status;
        const where = (opt.method || 'GET') + ' ' + path.split('?')[0] + ' → HTTP ' + res.status;
        // ログイン切れ・認証コードの期限切れは、画面の再読み込みで自動回復するため warn として記録する
        if (res.status === 401 || /unauthenticated|token/i.test(String(data.error || ''))) { log('warn', msg + '（自動で回復します）', where); throw sessionError('ログインの有効期限が切れています'); }
        if (/captcha/i.test(String(data.error || '')) || /認証コード/.test(msg)) { log('warn', msg + '（自動で回復します）', where); throw sessionError('認証の確認が必要です（' + msg + '）'); }
        log('error', msg, where);
        throw new Error(msg);
      }
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
    return done;
  }

  // ---------- 画面 ----------
  const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#306fff"/><rect x="12" y="16" width="24" height="32" rx="4" fill="#fff" opacity=".55"/><rect x="26" y="12" width="26" height="34" rx="4" fill="#fff"/><path d="M32 24h14M32 30h14M32 36h9" stroke="#306fff" stroke-width="3" stroke-linecap="round"/><circle cx="44" cy="46" r="9" fill="#ffb020" stroke="#fff" stroke-width="3"/><path d="M40 46l3 3 5-6" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const LS_META = 'ppdup:scanmeta:v1';
  const css = `
  #ppdup-btn{position:fixed;right:20px;bottom:76px;z-index:99998;display:flex;align-items:center;gap:8px;padding:6px 14px 6px 6px;border:0;border-radius:999px;background:#306fff;color:#fff;font:700 13px system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 14px #0005}
  #ppdup-btn svg{width:30px;height:30px;border-radius:9px;box-shadow:0 0 0 2px #ffffff80}
  #ppdup-btn:hover{filter:brightness(1.08)}
  #ppdup-fab{position:fixed;right:20px;bottom:128px;z-index:99998;width:290px;background:#1d2027;color:#e6e8ee;border:1px solid #2c303a;border-radius:14px;box-shadow:0 12px 40px #0008;padding:8px;font:13px/1.4 system-ui,"Hiragino Sans","Yu Gothic",sans-serif;display:none}
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
  #ppdup.single nav,#ppdup.treev nav{display:none}
  #ppdup{--bg:#f5f6f8;--panel:#fff;--panel2:#eef0f4;--line:#dde0e6;--fg:#1c1f26;--mute:#6a7080;--pri:#306fff;--pri-soft:#306fff1f;--ok:#1f9d55;--danger:#d64545;--keep:#f0faf2;--del:#fff5f5;--ctl:#fff;--ctl-line:#c5c9d2;
    position:fixed;inset:0;z-index:99999;background:var(--bg);color:var(--fg);font:13px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Yu Gothic","Meiryo","Noto Sans CJK JP","Noto Sans JP",sans-serif;display:none;flex-direction:column}
  @media (prefers-color-scheme:dark){#ppdup{--bg:#15171c;--panel:#1d2027;--panel2:#252932;--line:#2c303a;--fg:#e6e8ee;--mute:#8b91a1;--pri-soft:#306fff33;--keep:#17261c;--del:#2a1a1a;--ctl:#252932;--ctl-line:#3a3f4b}}
  #ppdup.on{display:flex}
  #ppdup{padding-left:78px}
  #ppdup .rail{position:absolute;left:0;top:0;bottom:0;width:78px;display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 0 10px;background:var(--panel2);border-right:1px solid var(--line);z-index:2}
  #ppdup .rail button{position:relative;width:64px;line-height:1.2;text-align:center;display:flex;flex-direction:column;align-items:center;gap:3px;padding:9px 0 7px;border:0;border-radius:10px;background:none;color:var(--mute);font-size:11px;font-weight:600}
  #ppdup .rail button:hover:not(:disabled){background:var(--panel);color:var(--fg)}
  #ppdup .rail button.on{background:var(--pri-soft);color:var(--pri)}
  #ppdup .rail svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
  #ppdup .rail .sp{flex:1}
  #ppdup .rail .rv{font:600 10px ui-monospace,Menlo,monospace;color:var(--mute)}
  #ppdup .rail [data-r=logbadge]:empty{display:none}
  #ppdup .rail [data-r=logbadge]{position:absolute;top:4px;right:10px;min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:var(--danger);color:#fff;font:700 10px/16px system-ui,sans-serif;font-style:normal}
  #ppdup header{padding:12px 18px 0;background:var(--panel);border-bottom:1px solid var(--line)}
  #ppdup .brand{display:flex;align-items:center;gap:12px}
  #ppdup .brand svg{width:44px;height:44px;flex:none}
  #ppdup .brand h1{margin:0;font:800 24px/1.1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Yu Gothic","Meiryo","Noto Sans CJK JP","Noto Sans JP",sans-serif}
  #ppdup .brand .chip{font:700 12px system-ui,sans-serif;padding:3px 10px;border-radius:999px;background:var(--pri-soft);color:var(--pri)}
  #ppdup .brand .ver{font:700 12px ui-monospace,Menlo,monospace;color:var(--mute);border:1px solid var(--line);border-radius:6px;padding:1px 7px;align-self:center}
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
  #ppdup .okbadge{color:var(--ok);font-weight:800;padding:0 6px}
  #ppdup .optsw{display:flex;align-items:center;gap:6px;font-weight:700;cursor:pointer}
  #ppdup .optsw input{width:18px;height:18px;accent-color:var(--pri)}
  .pd-explain{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin-bottom:12px}
  .pd-explain h3{margin:0 0 6px;font-size:14px}
  .pd-explain ul{margin:6px 0 0;padding-left:18px}
  .pd-explain code{background:var(--panel2);padding:1px 6px;border-radius:5px}
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
  .pd-sum{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;max-width:900px;margin:0 auto}
  .pd-sum button{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:14px;border-radius:12px;background:var(--panel);text-align:left}
  .pd-sum button b{font-size:22px}
  .pd-sum button.zero b{color:var(--ok)}
  .pd-next{display:flex;justify-content:flex-end;margin:16px 0 4px}
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
  .tr-h,.tr-row{display:grid;grid-template-columns:minmax(0,1fr) 110px 120px 90px;align-items:center}
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
  @media (prefers-color-scheme:dark){.tr .th{background:#3a3f4b}.tr .th.dir{background:#2a3a4f}}
  .tr .jk{flex:none;font-size:10px;line-height:14px;padding:0 5px;border-radius:7px;background:#ff6b6b;color:#fff;margin-left:4px}
  .tr-ren{font:inherit;padding:1px 4px !important;border:2px solid #4b8df8 !important;border-radius:3px !important;flex:1;min-width:120px;cursor:text !important}
  @media (prefers-color-scheme:dark){.tr-row.sel{background:#3a3f4b}}
  #pd-ql{position:fixed;inset:0;z-index:100002;display:flex;align-items:center;justify-content:center;background:#0004}
  #pd-ql .ql{background:#2b2d31ee;color:#eee;border-radius:12px;box-shadow:0 20px 60px #000a;width:min(820px,90vw);overflow:hidden;font:13px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Yu Gothic","Meiryo","Noto Sans CJK JP","Noto Sans JP",sans-serif;backdrop-filter:blur(20px)}
  #pd-ql .ql-h{display:flex;align-items:center;gap:10px;padding:8px 12px;background:#0003}
  #pd-ql .ql-h b{flex:1;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-ql .ql-h button{border:0;background:#fff2;color:#eee;border-radius:50%;width:22px;height:22px;cursor:pointer}
  #pd-ql .ql-b{display:flex;align-items:center;justify-content:center;min-height:300px;max-height:65vh;background:#000}
  #pd-ql .ql-b img{max-width:100%;max-height:65vh;display:block}
  #pd-ql .ql-ic svg{width:160px;height:140px}
  #pd-ql .ql-f{padding:10px 14px}
  #pd-ql .note{color:#aaa;font-size:12px;word-break:break-all}
  .tr-path{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:2px;overflow-x:auto;white-space:nowrap;height:30px;box-sizing:border-box;padding:0 10px;background:var(--panel2);border-bottom:1px solid var(--line);font-size:12px}
  .tr-path button{border:0 !important;background:none !important;padding:2px 6px !important;border-radius:5px !important;color:var(--mute);font:inherit;cursor:pointer}
  .tr-path button:hover:not(:disabled){background:var(--panel) !important;color:var(--fg)}
  .tr-path button.on{color:var(--fg);font-weight:700}
  .tr-path button.drop{outline:2px solid #4b8df8;background:#4b8df833 !important}
  .tr-path [data-tup]{font-weight:800;margin-right:4px}
  .tr-path .sep{color:var(--mute)}
  .tr.has-path .tr-h{top:30px}
  .tr.tl .tr-body{padding:6px 12px 20px}
  .tl-sec{margin-bottom:10px}
  .tl-top{position:fixed;right:28px;bottom:24px;z-index:5;padding:8px 16px !important;border-radius:999px !important;background:var(--pri) !important;color:#fff !important;border:0 !important;font-weight:700;box-shadow:0 6px 18px #0004;opacity:0;pointer-events:none;transition:opacity .15s}
  .tl-top.on{opacity:1;pointer-events:auto}
  @keyframes pdflash{0%{background:#ffd54a88}100%{background:transparent}}
  .flash{animation:pdflash 1.2s ease-out}
  .tl-h{position:sticky;top:30px;z-index:1;display:flex;align-items:center;gap:8px;padding:8px 6px;background:var(--panel);border-bottom:1px solid var(--line);font-size:13px}
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
  @media (prefers-color-scheme:dark){.tr .tr-row.tile.sel{background:#3a3f4b}}
  .tacts{display:flex;gap:6px;flex-wrap:wrap;width:100%;padding-top:4px;border-top:1px dashed var(--line);margin-top:2px}
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
  @media (prefers-color-scheme:dark){#pd-ctx{background:#2b2d31f2;color:#eee;border-color:#fff2}#pd-ctx hr{border-color:#fff2}}
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
    { v: 'junk', t: '不要ファイルを削除', d: '広告・宣伝のファイル、10MB以下のファイル、中国語のファイルなど、作品と関係ないものを削除します。ほかのステップでは対象から外します（使うかどうかを選べます）。' },
    { v: 'name', t: 'ファイル名を整える', d: 'FC2のファイル名から、サイト名や広告などの余計な文字を消して「FC2-PPV-品番」の形にそろえます（使うかどうかを選べます）。' },
    { v: 'sort', t: '作品ごとに仕分け', d: '複数の作品が入ったフォルダの中に品番フォルダを作り、ファイルを振り分けます。' },
    { v: 'ren', t: 'フォルダ名を揃える', d: 'フォルダ名を中のファイル名（品番）に揃えます。同名があれば (1) を付けます。' },
    { v: 'dup', t: '重複を比べて削除', d: '同じファイルをサムネイルとサイズで比べ、チェックしたものを削除します。' },
    { v: 'clean', t: '(1)を外す・片付け', d: '重複を削除したあとに残った空フォルダをゴミ箱へ移し、同じ名前で入れ子になったフォルダをまとめ、不要になった (1) を外します。' },
  ];

  const btn = document.createElement('button'); btn.id = 'ppdup-btn'; btn.innerHTML = LOGO + '<span>Distill</span>'; btn.title = 'PikPak Distill – Dedupe（クリックでメニュー）'; document.body.appendChild(btn);
  const fab = document.createElement('div'); fab.id = 'ppdup-fab'; document.body.appendChild(fab);
  const root = document.createElement('div'); root.id = 'ppdup';
  root.innerHTML = `
    <aside class="rail" data-r="rail">
      <button data-a="toflow" data-rail="flow" title="整理（1〜7のステップ）"><svg viewBox="0 0 24 24"><path d="M4 6h10M4 12h16M4 18h7" /><circle cx="18" cy="6" r="2"/><circle cx="15" cy="18" r="2"/></svg><span>整理</span></button>
      <button data-a="tree" data-rail="tree" title="フォルダ一覧（Finder やエクスプローラーのように、フォルダを開いて中身を見られます）"><svg viewBox="0 0 24 24"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h8.5A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/><path d="M7 11h10M7 15h6"/></svg><span>フォルダ<br>一覧</span></button>
      <button data-a="rescan" data-rail="scan" title="最新の状態を読み込み直す"><svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/></svg><span>再読み込み</span></button>
      <button data-a="log" data-rail="log" title="エラーや処理の記録"><svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z"/><path d="M9 11h7M9 15h7M9 7h3"/></svg><span>ログ</span><i data-r="logbadge"></i></button>
      <span class="sp"></span>
      <button data-a="close" data-rail="close" title="閉じる（PikPakの画面に戻る）"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg><span>閉じる</span></button>
      <span class="rv">v${VER}</span>
    </aside>
    <header>
      <div class="brand">${LOGO}<h1>PikPak Distill</h1><span class="chip">Dedupe</span><span class="ver" title="いま動いているバージョン">v${VER}</span><span class="by">by Noel Labs</span><span class="sp"></span></div>
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
    const count = prev && Date.now() - prev.at < 5 * 60 * 1000 ? (prev.count || 0) + 1 : 1;
    if (count > 2) { // 再読み込みしても直らない場合はループさせない
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
    if (sessionValid()) return true;
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
    root.classList.add('on');
    setView(r.view || 'scan');
    status('画面を再読み込みしました。ログイン情報の更新を待っています…', 0.3);
    // 期限の直前に再読み込みした場合、PikPak画面は期限が切れるまで更新しないので、そこまで待つ（最大4分）
    const t0 = Date.now();
    const c0 = readCred();
    const limit = Math.min(4 * 60 * 1000, Math.max(30 * 1000, c0 && c0.expiresAt ? c0.expiresAt - t0 + 30 * 1000 : 0));
    while (!sessionValid() && Date.now() - t0 < limit) {
      const left = Math.ceil((limit - (Date.now() - t0)) / 1000);
      status(`画面を再読み込みしました。ログイン情報の更新を待っています…（最大 あと ${left} 秒）`, (Date.now() - t0) / limit);
      await sleep(1000);
    }
    if (!sessionValid()) { reloadForSession(r); return; }
    try { sessionStorage.removeItem(SS_RESUME); } catch (e) { /* 無視 */ }
    log('info', 'ログイン情報を更新して再開', JSON.stringify(r));
    if (r.action === 'scan') { runScan(); return; } // 読み込みは読み取りだけなので自動で再開
    setView(r.view || 'scan');
    status(r.action ? 'ログイン情報を更新しました。途中まで完了した分は保存済みです。もう一度ボタンを押すと続きから実行します。' : 'ログイン情報を更新しました。');
  }
  // 画面を開いたまま放置した場合も、期限切れを検知したら自動で再読み込み
  setInterval(() => { if (root.classList.contains('on') && !busy && !sessionValid() && readCred()) reloadForSession({ view, mode }); }, 60 * 1000);

  // ---------- ログ表示 ----------
  function updateLogBadge() {
    const seen = +(localStorage.getItem(LS_LOGSEEN) || 0);
    const n = readLog().filter((x) => x.level === 'error' && x.t > seen).length;
    $('[data-r=logbadge]').textContent = n ? String(n) : '';
  }
  function showLog() {
    const logs = readLog().slice().reverse();
    const fmtT = (t) => new Date(t).toLocaleString('ja-JP');
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
    d.querySelector('[data-clear]').onclick = () => { if (confirm('ログを消去しますか？')) { try { localStorage.removeItem(LS_LOG); } catch (e) { /* 無視 */ } d.remove(); updateLogBadge(); } };
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
      cleanSkip: buildCleanPlan(files, folders).filter((p) => p.status === 'skip').length,
    };
  }
  const UNIT_OF = { junk: '件', name: '件', sort: '作品', ren: '件', dup: '組', clean: '件' };
  const WORK = ['junk', 'name', 'sort', 'ren', 'dup', 'clean'];
  function renderRail() {
    root.querySelectorAll('.rail [data-rail]').forEach((b) => {
      const k = b.dataset.rail;
      b.classList.toggle('on', k === 'tree' ? view === 'tree' : k === 'flow' ? view !== 'tree' && mode === 'flow' : false);
      if (k === 'tree' || k === 'scan' || k === 'flow') b.disabled = busy;
    });
  }
  function renderNav() {
    renderRail();
    const c = counts();
    const next = c ? (WORK.find((k) => c[k] > 0) || null) : 'scan';
    $('[data-r=nav]').innerHTML = STEPS.map((s, i) => {
      let sub, cls = '';
      if (s.v === 'scan') { sub = meta ? `${new Date(meta.at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 読み込み済み` : 'まずはここから'; if (meta) cls = 'done'; }
      else if (!c) sub = '読み込み後に使えます';
      else if (s.v === 'name' && !nameEnabled()) { sub = 'オフ（使わない設定）'; cls = 'done'; }
      else if (s.v === 'junk' && !junkEnabled()) { sub = 'オフ（使わない設定）'; cls = 'done'; }
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
    const single = mode === 'single' ? `<span class="note">読み込み：${meta ? esc(new Date(meta.at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })) : '未'}</span><button data-a="rescan" title="最新の状態を読み込んでから、この作業を続けます">再読み込み</button><button data-a="toflow" title="1〜7のステップ表示に切り替えます">流れで表示</button><span class="sep"></span>` : '';
    const head = `<div class="head"><b>${mode === 'single' ? '' : STEPS.indexOf(s) + 1 + '. '}${esc(s.t)}</b><span class="note">${esc(s.d)}</span></div><span class="sp"></span>${single}`;
    let html = '';
    if (view === 'sort' || view === 'clean') html = head;
    if (view === 'junk') html = head + `<label class="optsw" title="オフにすると、不要ファイルの判定を使わず、すべてのファイルをほかのステップの対象にします"><input type="checkbox" data-a="junkopt"${junkEnabled() ? ' checked' : ''}> このステップを使う</label><span class="sep"></span>`;
    if (view === 'name') html = head + `<label class="optsw" title="オフにすると、このステップを使わず次へ進みます"><input type="checkbox" data-a="nameopt"${nameEnabled() ? ' checked' : ''}> このステップを使う</label><span class="sep"></span>`;
    if (view === 'ren') html = head + `<select data-a="renfilter"><option value="todo">変更するもの</option><option value="skip">要確認</option><option value="same">変更なし</option><option value="all">すべて</option></select>`;
    if (view === 'dup') html = head + `
      <select data-a="mode" title="まとめ方"><option value="name">同じファイル名でまとめる</option><option value="id">同じ品番でまとめる（-1/-2違いも含む）</option></select>
      <label><input type="checkbox" data-a="nearonly"> サイズが近い組だけ</label>
      <input type="text" data-a="q" placeholder="絞り込み（品番・名前）" size="16">
      <span class="sep"></span>`;
    $('[data-r=tb]').innerHTML = html ? html + '<span data-r="acts" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"></span>' : '';
    renderActs();
  }
  function renderActs() {
    const el = $('[data-r=acts]'); if (!el) return;
    if (busy) { el.innerHTML = '<button data-a="stop">中断</button>'; return; }
    const c = counts();
    const label = { name: 'チェックしたものを変更', sort: 'すべて仕分け', ren: 'すべて変更', clean: 'チェックしたものを実行' };
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
    if (v !== 'tree') { closeQL(); closeCtx(); closePlayer(); }
    root.classList.toggle('treev', v === 'tree'); // フォルダ一覧ではステップの表示を隠す
    renderToolbar(); render(); renderNav();
    $('[data-r=main]').scrollTop = 0;
  }
  function render() {
    if (view === 'scan') return renderScan();
    if (view === 'ren') return renderRen();
    if (view === 'sort') return renderSort();
    if (view === 'clean') return renderClean();
    if (view === 'name') return renderName();
    if (view === 'junk') return renderJunk();
    if (view === 'tree') return renderTree();
    return renderDup();
  }

  // ---------- 1. 読み込む ----------
  function renderScan() {
    const where = crumbs().map((c) => c.name).filter(Boolean).join(' › ') || (currentFolderId() === 'root' ? 'ホーム' : 'いま開いているフォルダ');
    const c = counts();
    const sum = c ? `<div class="pd-sum">${WORK.map((k) => { const i = STEPS.findIndex((x) => x.v === k); return `<button data-step="${k}" class="${c[k] || (k === 'clean' && c.cleanSkip) ? '' : 'zero'}"><span class="note">${i + 1}. ${esc(STEPS[i].t)}</span><b>${(k === 'name' && !nameEnabled()) || (k === 'junk' && !junkEnabled()) ? 'オフ' : c[k] ? c[k] + ' ' + UNIT_OF[k] : k === 'clean' && c.cleanSkip ? '要確認 ' + c.cleanSkip + ' 件' : k === 'junk' && c.junkReview ? '要確認 ' + c.junkReview + ' 件' : '✓ 対象なし'}</b></button>`; }).join('')}</div>` : '';
    const next = c && (WORK.find((k) => c[k] > 0));
    const doneBanner = allDone(c) ? '<div class="pd-hero" style="border-color:var(--ok)"><h2>✓ 整理はすべて完了しています</h2><div class="note">PikPakで新しくファイルを追加・操作したら、「再スキャン」で最新の状態を確認できます。</div></div>' : '';
    $('[data-r=main]').innerHTML = `${doneBanner}
      <div class="pd-hero">
        <h2>${meta ? 'もう一度読み込む' : 'まずはフォルダを読み込みます'}</h2>
        <div class="note">ホームか My Pack を開いた状態で実行してください。読み込みはバックグラウンドで行い、PikPakの画面は切り替わりません。</div>
        <div class="where">読み込む場所：${esc(where)}</div>
        <div style="margin:0 0 16px"><label class="optsw" style="justify-content:center" title="オンにすると、広告・宣伝、10MB以下、中国語のファイルなど作品と関係ないものを、仕分け・名前の変更・重複比較の対象から外します（「2. 不要ファイルを削除」で削除できます）"><input type="checkbox" data-a="junkopt"${junkEnabled() ? ' checked' : ''}> 作品と関係ないファイル（広告・宣伝／10MB以下／中国語）を除外する</label></div>
        <div class="acts"><button class="pri big" data-a="scan"${busy ? ' disabled' : ''}>${meta ? '再スキャン' : 'スキャン開始'}</button>${busy ? '<button class="big" data-a="stop">中断</button>' : ''}</div>
        ${meta ? `<div class="note" style="margin-top:14px">前回：${new Date(meta.at).toLocaleString('ja-JP')} ／ ${esc(meta.where || '')} ／ フォルダ ${meta.nfo} ・ ファイル ${meta.nfi}</div>` : ''}
      </div>
      ${sum}
      ${next ? `<div class="pd-next" style="max-width:760px;margin:16px auto"><button class="pri" data-step="${next}">おすすめ：${STEPS.findIndex((s) => s.v === next) + 1}. ${esc(STEPS.find((s) => s.v === next).t)} へ →</button></div>` : ''}`;
    if (!busy) status(meta ? '読み込み済みです。上のステップから機能を選べます（操作したら再スキャンで最新にできます）。' : 'まずは「スキャン開始」を押してください。');
  }
  async function runScan() {
    if (busy) return;
    if (!ensureSession('scan')) return;
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
        <li><b>中国語のファイル</b>：ひらがな・カタカナがなく、中国語にしかない字が入った名前。品番がないものは削除の対象、品番があるものは作品の可能性があるため「要確認」に回します</li>
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
      return `<section class="pd-g"><div class="pd-gh"><span>${esc(g.items[0].name)}</span><span class="note">${g.items.length}件</span>${g.near ? '<span class="pd-tag">サイズが近い組あり</span>' : ''}<span class="sp"></span><button data-g="${esc(g.key)}">この組のチェックを削除</button></div>${rows}</section>`;
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
  const saveTree = () => { try { localStorage.setItem(LS_TREE, JSON.stringify({ open: [...treeOpen].slice(-2000), sort: tree.sort, dir: tree.dir, base: tree.base || '', view: tree.view })); } catch (e) { /* 無視 */ } };
  const treeSel = new Set();
  let treeCur = '', treeAnchor = '', treeRowsCache = [], treeIdx = null, qlOpen = false, renaming = '';
  const VIDEO_EXT = new Set(['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'ts', 'm4v', 'webm', 'rmvb', 'mpg', 'mpeg']);
  const IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic']);
  const extOf = (n) => ((String(n).match(/\.([A-Za-z0-9]{2,7})$/) || [])[1] || '').toLowerCase();
  const kindOf = (r) => (r.kind === 'folder' ? 'フォルダ' : VIDEO_EXT.has(r.ext) ? 'ビデオ' : IMAGE_EXT.has(r.ext) ? 'イメージ' : SUB_EXT.has(r.ext) ? '字幕' : r.ext ? r.ext.toUpperCase() + ' 書類' : '書類');
  const ICON_DIR = '<svg viewBox="0 0 20 16"><path d="M1 3.2C1 2 2 1 3.2 1h4.3l1.8 2h7.5C18 3 19 4 19 5.2v7.6c0 1.2-1 2.2-2.2 2.2H3.2C2 15 1 14 1 12.8z" fill="#5aa9f6"/><path d="M1 5.5h18v7.3c0 1.2-1 2.2-2.2 2.2H3.2C2 15 1 14 1 12.8z" fill="#7cc0fb"/></svg>';
  const ICON_FILE = (r) => `<svg viewBox="0 0 16 20"><path d="M2 1h8l4 4v13a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z" fill="#f4f5f7" stroke="#b9bec8"/><path d="M10 1v4h4" fill="none" stroke="#b9bec8"/>${VIDEO_EXT.has(r.ext) ? '<path d="M6 9.5v5l4-2.5z" fill="#6b7280"/>' : ''}</svg>`;

  // 親子関係と、フォルダごとの合計サイズ・項目数
  function buildTreeIndex() {
    const kd = new Map(), kf = new Map();
    folders.forEach((d) => { if (d.isRoot) return; if (!kd.has(d.parentId)) kd.set(d.parentId, []); kd.get(d.parentId).push(d); });
    files.forEach((f) => { if (!kf.has(f.parentId)) kf.set(f.parentId, []); kf.get(f.parentId).push(f); });
    const agg = new Map();
    const sum = (id, seen) => {
      if (agg.has(id)) return agg.get(id);
      if (seen.has(id)) return { size: 0, n: 0, files: 0 };
      seen.add(id);
      const a = { size: 0, n: (kd.get(id) || []).length + (kf.get(id) || []).length, files: 0 };
      (kf.get(id) || []).forEach((f) => { a.size += f.size; a.files++; });
      (kd.get(id) || []).forEach((d) => { const s = sum(d.id, seen); a.size += s.size; a.files += s.files; });
      agg.set(id, a); return a;
    };
    const rootF = folders.find((d) => d.isRoot);
    const rootId = rootF ? rootF.id : (folders[0] ? folders[0].parentId : 'root');
    sum(rootId, new Set());
    const byId = new Map(); folders.forEach((d) => byId.set(d.id, d));
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
    folders.forEach((d) => pick(d.id, new Set()));
    return { kd, kf, agg, thumbOf, rootId, rootName: rootF ? rootF.name : 'ホーム', byId };
  }
  // 表示する行（開いているフォルダの中だけ）。絞り込み中は、一致したものとその上のフォルダを開いて表示
  // 表示の起点（最上位として表示するフォルダ）。未設定・見つからないときは読み込んだ場所
  function treeBase() { const ix = treeIdx || buildTreeIndex(); return tree.base && ix.byId.has(tree.base) ? tree.base : ix.rootId; }
  function setBase(id) {
    const ix = treeIdx || buildTreeIndex();
    tree.base = !id || id === ix.rootId ? '' : id; saveTree();
    treeSel.clear(); treeCur = ''; treeAnchor = ''; closeQL();
    if (tree.base) treeOpen.add(tree.base);
    renderTree(); $('[data-r=main]').scrollTop = 0;
    status(tree.base ? `「${(ix.byId.get(id) || {}).name}」を最上位にして表示しています（${KEY.up} または上のパスで戻れます）` : '読み込んだ場所から表示しています');
  }
  function treeRows() {
    const ix = treeIdx = buildTreeIndex();
    const q = (tree.q || '').trim().toLowerCase();
    let keep = null;
    if (q) {
      keep = new Set();
      const up = (pid) => { let cur = ix.byId.get(pid); while (cur && !keep.has(cur.id) && cur.id !== treeBase()) { keep.add(cur.id); cur = ix.byId.get(cur.parentId); } };
      folders.forEach((d) => { if (!d.isRoot && d.name.toLowerCase().includes(q)) { keep.add(d.id); up(d.parentId); } });
      files.forEach((f) => { if (f.name.toLowerCase().includes(q)) { keep.add(f.id); up(f.parentId); } });
    }
    const coll = new Intl.Collator('ja', { numeric: true, sensitivity: 'base' });
    const cmp = (a, b) => {
      if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1;
      const v = tree.sort === 'size' ? (a.size - b.size) : tree.sort === 'kind' ? coll.compare(kindOf(a), kindOf(b)) : 0;
      return (v || coll.compare(a.name, b.name)) * tree.dir;
    };
    const rows = [];
    const walk = (pid, depth) => {
      const items = [
        ...(ix.kd.get(pid) || []).map((d) => ({ id: d.id, kind: 'folder', name: d.name, parentId: pid, depth, size: ix.agg.get(d.id).size, n: ix.agg.get(d.id).n, nf: ix.agg.get(d.id).files, path: d.path, ext: '' })),
        ...(ix.kf.get(pid) || []).map((f) => ({ id: f.id, kind: 'file', name: f.name, parentId: pid, depth, size: f.size, path: f.path, ext: extOf(f.name), thumb: f.thumb, f })),
      ].filter((r) => !keep || keep.has(r.id)).sort(cmp);
      items.forEach((r) => {
        r.open = r.kind === 'folder' && (treeOpen.has(r.id) || (!!keep && keep.has(r.id)));
        rows.push(r);
        if (r.open) walk(r.id, depth + 1);
      });
    };
    walk(treeBase(), 0);
    return rows;
  }
  function renderTreeToolbar() {
    const arrow = (k) => (tree.sort === k ? (tree.dir > 0 ? ' ▲' : ' ▼') : '');
    $('[data-r=tb]').innerHTML = `<div class="head"><b>フォルダ一覧 <span class="pd-tag" style="vertical-align:2px">${{ mac: 'Finder', win: 'エクスプローラー', linux: 'ファイルマネージャー' }[OS]} 風</span></b><span class="note">${OS_NAME} の操作：▶ / ← → で開閉（${KEY.deep} で中もすべて）・${KEY.open} でフォルダを最上位に（${KEY.up} で戻る）・ダブルクリックで再生・ドラッグで移動・右クリックでメニュー・スペースでプレビュー・${KEY.rename} で名前の変更・${KEY.mkdir} で新規フォルダ・${KEY.trash} でゴミ箱へ・1 / 2 / 3 で表示の切り替え</span></div><span class="sp"></span>
      <span class="note">読み込み：${meta ? esc(new Date(meta.at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })) : '未'}</span>
      <input type="text" data-a="tq" placeholder="🔍 名前で絞り込み" size="18" value="${esc(tree.q || '')}">
      <span class="seg"><button data-a="texpand" title="すべてのフォルダを開く（${KEY.expand}）">⊞ 全展開</button><button data-a="tcollapse" title="すべてのフォルダを閉じる（${KEY.collapse}）">⊟ 全格納</button></span>
      <span class="seg"><button data-a="tview" data-v="list" class="${tree.view === 'list' ? 'on' : ''}" title="リスト表示（1 キー）">☰ リスト</button><button data-a="tview" data-v="thumb" class="${tree.view === 'thumb' ? 'on' : ''}" title="サムネイル付きのリスト（2 キー）">▤ サムネイル</button><button data-a="tview" data-v="tile" class="${tree.view === 'tile' ? 'on' : ''}" title="タイル表示。フォルダごとに見出しを付けて並べます（3 キー）">▦ タイル</button></span>
      <button data-a="rescan" title="最新の状態を読み込み直します">再読み込み</button>${mode === 'single' ? '<button data-a="toflow">流れで表示</button>' : ''}
      <span class="tacts" data-r="tacts"></span>`;
    treeHeadHtml = `<div class="tr-h"><span class="c-name" data-tsort="name">名前${arrow('name')}</span><span class="c-size" data-tsort="size">サイズ${arrow('size')}</span><span class="c-kind" data-tsort="kind">種類${arrow('kind')}</span><span class="c-n">項目</span></div>`;
  }
  let treeHeadHtml = '';
  // サムネイル付き表示：ファイルは自分の、フォルダは中の一番大きいファイルのサムネイル（右下にフォルダの印）
  function thumbHtml(r) {
    const f = r.kind === 'folder' ? treeIdx.thumbOf.get(r.id) : r.f;
    const img = f && f.thumb ? `<img loading="lazy" referrerpolicy="no-referrer" src="${esc(f.thumb)}" alt="">` : `<span class="ph">${r.kind === 'folder' ? ICON_DIR : ICON_FILE(r)}</span>`;
    return `<span class="th${r.kind === 'folder' ? ' dir' : ''}">${img}${r.kind === 'folder' && f && f.thumb ? `<span class="badge">${ICON_DIR}</span>` : ''}</span>`;
  }
  function renderTree() {
    if (!treeHeadHtml) renderTreeToolbar();
    const rows = treeRowsCache = treeRows();
    if (treeCur && !rows.some((r) => r.id === treeCur)) treeCur = '';
    [...treeSel].forEach((id) => { if (!rows.some((r) => r.id === id)) treeSel.delete(id); });
    const ix = treeIdx;
    const junk = junkEnabled() ? (prepJunk(files, folders), (f) => { const j = junkInfo(f); return j && j.level === 'del' ? j.reason : ''; }) : () => '';
    const rowHtml = (r, i) => {
      const jr = r.kind === 'file' ? junk(r.f) : '';
      const name = renaming === r.id ? `<input class="tr-ren" data-tren="${esc(r.id)}" value="${esc(r.name)}">` : `<span class="nm">${esc(r.name)}</span>`;
      return `<div class="tr-row${i % 2 ? ' odd' : ''}${treeSel.has(r.id) ? ' sel' : ''}${treeCur === r.id ? ' cur' : ''}" data-tid="${esc(r.id)}" title="${esc(r.path || '')}">
        <span class="c-name" style="padding-left:${8 + r.depth * 18}px">${r.kind === 'folder' ? `<span class="tw${r.open ? ' open' : ''}" data-ttw="${esc(r.id)}">▶</span>` : '<span class="tw blank"></span>'}${tree.view === 'thumb' ? thumbHtml(r) : `<span class="ic">${r.kind === 'folder' ? ICON_DIR : ICON_FILE(r)}</span>`}${tree.view === 'thumb' ? `<span class="tx">${name}<span class="sub">${esc(r.kind === 'folder' ? r.n + ' 項目・' + (r.nf ? fmt(r.size) : '空') : kindOf(r) + '・' + fmt(r.size))}</span></span>` : name}${jr ? `<span class="jk" title="${esc(jr)}">不要</span>` : ''}</span>
        <span class="c-size">${r.kind === 'folder' ? (r.nf ? fmt(r.size) : '--') : fmt(r.size)}</span><span class="c-kind">${esc(kindOf(r))}</span><span class="c-n">${r.kind === 'folder' ? r.n + ' 項目' : ''}</span></div>`;
    };
    const baseId = treeBase();
    const top = ix.agg.get(baseId) || { n: 0, size: 0, files: 0 };
    const baseName = baseId === ix.rootId ? ix.rootName : (ix.byId.get(baseId) || {}).name;
    const crumbIds = baseId === ix.rootId ? [ix.rootId] : [ix.rootId, ...((ix.byId.get(baseId) || {}).trail || []).filter((x) => ix.byId.has(x) && !ix.byId.get(x).isRoot)];
    const crumbHtml = `<div class="tr-path"><button data-tup${baseId === ix.rootId ? ' disabled' : ''} title="1 つ上の階層を最上位にする（${KEY.up}）">↑</button>${crumbIds.map((id, k) => `${k ? '<span class="sep">›</span>' : ''}<button data-tbase="${esc(id)}" class="${id === baseId ? 'on' : ''}" title="${id === baseId ? 'いま最上位にしているフォルダ' : 'ここを最上位にする（ドラッグして離すとこのフォルダへ移動）'}">${id === ix.rootId ? '⌂ ' : ''}${esc(id === ix.rootId ? ix.rootName : ix.byId.get(id).name)}</button>`).join('')}${baseId !== ix.rootId ? '<span class="pd-tag" style="margin-left:8px">最上位を変更中</span>' : ''}</div>`;
    const emptyHtml = '<div class="empty">' + (tree.q ? '一致するものはありません' : '読み込んだフォルダは空です') + '</div>';
    if (tree.view === 'tile') {
      // タイル：最上位のフォルダの中身と、開いているフォルダの中身を、フォルダごとの見出し付きで並べる
      const kids = new Map(); rows.forEach((r) => { if (!kids.has(r.parentId)) kids.set(r.parentId, []); kids.get(r.parentId).push(r); });
      const secs = [baseId, ...rows.filter((r) => r.kind === 'folder' && r.open).map((r) => r.id)];
      treeRowsCache = secs.flatMap((pid) => kids.get(pid) || []);
      const relPath = (id) => { if (id === baseId) return [baseName]; const f = ix.byId.get(id); const tr = (f.trail || []); const k = tr.indexOf(baseId); return tr.slice(k + 1).map((x) => (ix.byId.get(x) || {}).name).filter(Boolean); };
      const tile = (r) => {
        const jr = r.kind === 'file' ? junk(r.f) : '';
        const name = renaming === r.id ? `<input class="tr-ren" data-tren="${esc(r.id)}" value="${esc(r.name)}">` : `<span class="nm" title="${esc(r.name)}">${esc(r.name)}</span>`;
        return `<div class="tr-row tile${treeSel.has(r.id) ? ' sel' : ''}${treeCur === r.id ? ' cur' : ''}${r.kind === 'folder' ? ' dir' : ''}" data-tid="${esc(r.id)}">${thumbHtml(r)}${jr ? `<span class="jk" title="${esc(jr)}">不要</span>` : ''}${name}<span class="sub">${esc(r.kind === 'folder' ? r.n + ' 項目・' + (r.nf ? fmt(r.size) : '空') : fmt(r.size))}</span></div>`;
      };
      const body = secs.map((pid) => {
        const items = kids.get(pid) || [];
        const a = ix.agg.get(pid) || { n: 0, size: 0 };
        const path = relPath(pid);
        return `<section class="tl-sec" data-sec="${esc(pid)}"><div class="tl-h" data-tdrop="${esc(pid)}">${pid === baseId ? '' : `<span class="tw open" data-ttw="${esc(pid)}" title="閉じる">▶</span>`}<span class="ic">${ICON_DIR}</span><b>${path.map((n, k) => (k === path.length - 1 ? esc(n) : `<span class="pp">${esc(n)} ›</span> `)).join('')}</b><span class="note">${a.n} 項目・${fmt(a.size)}</span><span class="sp"></span>${pid === baseId ? '' : `<button data-ttop="${esc(pid)}" title="一番上の一覧へ戻る（${KEY.back} キー／マウスの戻るボタン）">⤒ 一覧へ戻る</button><button data-tbase="${esc(pid)}" title="このフォルダを最上位にする">⤓ ここを最上位に</button>`}</div>
          <div class="tl-grid">${items.map(tile).join('') || '<div class="note" style="padding:8px">（空のフォルダ）</div>'}</div></section>`;
      }).join('');
      $('[data-r=main]').innerHTML = `<div class="tr has-path tl" tabindex="0" data-r="tree">${crumbHtml}<div class="tr-body">${rows.length ? body : emptyHtml}</div><button class="tl-top" data-ttop="" title="一番上の一覧へ戻る（${KEY.back} キー／マウスの戻るボタン）">⤒ 一覧へ戻る</button></div>`;
    } else {
      $('[data-r=main]').innerHTML = `<div class="tr has-path${tree.view === 'thumb' ? ' big' : ''}" tabindex="0" data-r="tree">${crumbHtml}${treeHeadHtml}<div class="tr-body">${rows.map(rowHtml).join('') || emptyHtml}</div></div>`;
    }
    const selN = treeSel.size, selSize = [...treeSel].reduce((a, id) => { const r = rows.find((x) => x.id === id); return a + (r ? r.size : 0); }, 0);
    if (!busy) status(`${esc(baseName)}：${top.n} 項目・ファイル ${top.files} 件・${fmt(top.size)}${selN ? `　｜　${selN} 項目を選択（${fmt(selSize)}）` : ''}`);
    renderTreeActs();
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
      <div class="ql-f"><div>${info}</div><div class="note">${esc((r.kind === 'folder' ? r.path : r.path + '/').replace(/^\/?/, '/').replace(/\/+$/, '') || '/')}</div>${jr ? `<div style="color:#ff6b6b">不要ファイルの判定：${esc(jr.reason)}</div>` : ''}${isVideoRow(r) ? `<button data-qlplay style="margin-top:8px;border:0;border-radius:8px;padding:6px 16px;background:#306fff;color:#fff;font-weight:700;cursor:pointer">▶ 再生</button>` : ''}</div></div>`;
    const pb = d.querySelector('[data-qlplay]'); if (pb) pb.onclick = () => playFile(r.id);
  }
  function closeQL() { qlOpen = false; const d = document.getElementById('pd-ql'); if (d) d.remove(); }
  // 名前の変更（Enter）
  function applyRenameCache(kind, id, name) {
    if (kind === 'file') { const f = files.find((x) => x.id === id); if (f) f.name = name; return; }
    const f = folders.find((x) => x.id === id); if (!f) return;
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
        const goneDirs = new Set(folders.filter((d) => (d.trail || []).some((x) => gone.has(x))).map((d) => d.id));
        folders = folders.filter((d) => !goneDirs.has(d.id));
        files = files.filter((f) => !gone.has(f.id) && !goneDirs.has(f.parentId));
        done += items.length; saveAll();
      }
      treeSel.clear(); busy = false; renderTree();
      status(`${done} 項目を${ans.hard ? '完全に削除' : 'ゴミ箱へ移動'}しました。`); log('info', `フォルダ一覧で削除 ${done} 項目（${ans.hard ? '完全削除' : 'ゴミ箱'}）`); refreshView();
    } catch (err) { saveAll(); busy = false; renderTree(); handleErr(err, 'tree', `削除を停止しました（${done} 項目完了）：` + err.message); }
  }
  // ---------- フォルダ一覧：移動・新規フォルダ・右クリックメニュー・再生 ----------
  const isVideoRow = (r) => !!r && r.kind === 'file' && VIDEO_EXT.has(r.ext);
  const selRows = () => treeRowsCache.filter((r) => treeSel.has(r.id));
  const folderById = (id) => folders.find((d) => d.id === id);
  // to の中へ ids を移動できるか（自分自身や自分の中へは移動できない）
  function canMoveTo(ids, to) {
    if (!to) return false;
    const tf = folderById(to);
    const trail = tf ? (tf.trail || []) : [to];
    return ids.every((id) => id !== to && !trail.includes(id));
  }
  async function treeMove(ids, to) {
    if (!canMoveTo(ids, to)) { status('そのフォルダへは移動できません（移動するフォルダ自身やその中へは移せません）'); return; }
    const all = new Set(ids);
    const anc = (id) => { const f = files.find((x) => x.id === id) || folderById(id); let p = f && folderById(f.parentId); while (p) { if (all.has(p.id)) return true; p = folderById(p.parentId); } return false; };
    const items = ids.map((id) => files.find((x) => x.id === id) || folderById(id)).filter((x) => x && !anc(x.id) && x.parentId !== to);
    if (!items.length) { status('すでにそのフォルダの中にあります'); return; }
    if (!ensureSession('tree')) return;
    const dest = to === treeIdx.rootId ? treeIdx.rootName : ((folderById(to) || {}).name || '');
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
      items.forEach((it) => (files.includes(it) ? cacheMoveFile(it.id, to) : cacheMoveFolder(it.id, to)));
      saveAll(); treeOpen.add(to); saveTree();
      busy = false; renderTree();
      status(`${items.length} 項目を「${dest}」へ移動しました${renamed ? `（同じ名前があったため ${renamed} 件に (n) を付けました）` : ''}。`); log('info', `フォルダ一覧で移動 ${items.length} 項目 → ${dest}`); refreshView();
    } catch (err) { saveAll(); busy = false; renderTree(); handleErr(err, 'tree', '移動を停止しました：' + err.message); }
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
      const np = folderById(pid);
      folders.push({ id, name, parentId: pid, path: ((np && np.path) || '') + '/' + name, trail: [...((np && np.trail) || [pid]), id] });
      saveAll(); treeOpen.add(pid); saveTree();
      busy = false; treeSel.clear(); treeSel.add(id); treeCur = id; treeAnchor = id; renaming = id; renderTree();
      status('フォルダを作成しました。名前を入力して Enter で確定します。'); log('info', `フォルダ一覧で新規フォルダ：${name}`); refreshView();
    } catch (err) { busy = false; renderTree(); handleErr(err, 'tree', 'フォルダを作成できませんでした：' + err.message); }
  }
  // 移動先を選ぶ画面
  function askMoveTarget(ids) {
    return new Promise((resolve) => {
      const d = document.createElement('div'); d.id = 'pd-dlg';
      const list = [{ id: treeIdx.rootId, name: treeIdx.rootName, depth: 0 }];
      const walk = (pid, depth) => (treeIdx.kd.get(pid) || []).slice().sort((a, b) => a.name.localeCompare(b.name, 'ja', { numeric: true })).forEach((f) => { list.push({ id: f.id, name: f.name, depth }); walk(f.id, depth + 1); });
      walk(treeIdx.rootId, 1);
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
    const el = $('[data-r=tacts]'); if (!el) return;
    const rows = selRows(), one = rows.length === 1 ? rows[0] : null;
    const dis = (b) => (b && !busy ? '' : ' disabled');
    el.innerHTML = `<button data-ta="play"${dis(isVideoRow(one))} title="再生（${KEY.open} / ダブルクリック）">▶ 再生</button>
      <button data-ta="rename"${dis(one)} title="名前を変更（Enter）">✎ 名前を変更</button>
      <button data-ta="move"${dis(rows.length)} title="移動（ドラッグでも移動できます）">↪ 移動…</button>
      <button data-ta="mkdir"${dis(true)} title="新規フォルダ（${KEY.mkdir}）">＋ 新規フォルダ</button>
      <button data-ta="base"${dis(one && one.kind === 'folder')} title="選んだフォルダを最上位にして、その中だけを表示（${KEY.open}）">⤓ ここを最上位に</button>
      <button data-ta="trash"${dis(rows.length)} class="danger" title="ゴミ箱に入れる（${KEY.trash}）">🗑 ゴミ箱へ</button>`;
  }
  function treeAction(a) {
    const rows = selRows(), one = rows.length === 1 ? rows[0] : null;
    closeCtx();
    if (a === 'play' && isVideoRow(one)) playFile(one.id);
    else if (a === 'preview' && one) { treeCur = one.id; showQL(); }
    else if (a === 'rename' && one) { closeQL(); renaming = one.id; renderTree(); }
    else if (a === 'move') treeMoveAsk();
    else if (a === 'mkdir') treeNewFolder();
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
      isVideoRow(one) ? it('play', '▶ 再生', KEY.open, true) : '',
      one && one.kind === 'folder' ? it('open', '開く', '→', true) : '',
      one && one.kind === 'folder' ? it('base', 'このフォルダを最上位にして表示', KEY.open, true) : '',
      it('preview', 'プレビュー', 'Space', !!one), '<hr>',
      it('rename', '名前を変更', KEY.rename, !!one), it('move', `移動…${rows.length > 1 ? `（${rows.length} 項目）` : ''}`, 'ドラッグ', rows.length > 0), it('mkdir', '新規フォルダ', KEY.mkdir, true), '<hr>',
      it('copy', '場所をコピー', KEY.copy, !!one), '<hr>',
      it('trash', `ゴミ箱に入れる${rows.length > 1 ? `（${rows.length} 項目）` : ''}`, KEY.trash, rows.length > 0, 'red'),
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
  let curHls = null;
  const isHlsUrl = (u) => /\.m3u8(\?|#|$)|ts_downloader|[?&](format|type)=(hls|m3u8)\b|\/hls(\/|$)/i.test(String(u || ''));
  function getHls() {
    const H = window.Hls || (typeof Hls !== 'undefined' ? Hls : null); // eslint-disable-line no-undef
    if (H || getHls.loading) return Promise.resolve(H || null);
    // @require が効かない環境向けに、念のため読み込みを試す
    getHls.loading = new Promise((res) => {
      const sc = document.createElement('script'); sc.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.8/dist/hls.min.js';
      sc.onload = () => res(window.Hls || null); sc.onerror = () => res(null);
      document.head.appendChild(sc); setTimeout(() => res(window.Hls || null), 8000);
    });
    return getHls.loading;
  }
  function stopHls() { if (curHls) { try { curHls.destroy(); } catch (e) { /* 無視 */ } curHls = null; } }
  async function playFile(id) {
    const f = files.find((x) => x.id === id); if (!f) return;
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
    d.innerHTML = `<div class="pl"><div class="pl-h"><button data-pl="prev"${i > 0 ? '' : ' disabled'} title="前のビデオ（${KEY.prev}）">◀</button><button data-pl="next"${i >= 0 && i < vids.length - 1 ? '' : ' disabled'} title="次のビデオ（${KEY.next}）">▶</button><b>${esc(f.name)}</b><select data-pl="q" title="画質（カクつく場合は変換画質を選んでください）" style="display:none"></select><a data-pl="tab" target="_blank" rel="noreferrer" style="display:none">↗ 新しいタブ</a><button data-pl="close" title="閉じる（Esc）">✕</button></div>
      <div class="pl-b"><div class="pl-msg">再生の準備中…</div></div><div class="pl-f note"><span>${esc((f.path || '/').replace(/\/$/, ''))}/ ・ ${fmt(f.size)}</span><span data-pl="info"></span></div></div>`;
    const prev = d.querySelector('[data-pl=prev]'), next = d.querySelector('[data-pl=next]');
    prev.onclick = () => { if (i > 0) { treeSelect(vids[i - 1].id, null); renderTree(); playFile(vids[i - 1].id); } };
    next.onclick = () => { if (i < vids.length - 1) { treeSelect(vids[i + 1].id, null); renderTree(); playFile(vids[i + 1].id); } };
    try {
      const info = await api('/files/' + id + '?thumbnail_size=SIZE_LARGE');
      if (!document.body.contains(d)) return;
      const src = [];
      (Array.isArray(info.medias) ? info.medias : []).forEach((m) => {
        const url = m && m.link && m.link.url; if (!url) return;
        const origin = m.is_origin === true || String(m.is_origin) === 'true';
        const nm = m.media_name || m.resolution_name || '';
        const v = m.video || {};
        const h = parseInt(v.height || m.height || (String(nm).match(/(\d{3,4})\s*p/i) || [])[1] || 0, 10);
        src.push({ label: origin ? 'オリジナル画質' + (nm && !/orig/i.test(nm) ? `（${nm}）` : '') : (nm || (h ? h + 'P' : '変換画質')), url, origin, h, hls: isHlsUrl(url) });
      });
      if (info.web_content_link) src.push({ label: '元ファイル（ダウンロード用リンク）', url: info.web_content_link, origin: true, h: 0, dl: true, hls: false });
      if (!src.length) { d.querySelector('.pl-msg').textContent = 'このファイルの再生用リンクを取得できませんでした（PikPak 側で変換中の可能性があります）'; return; }
      // 並び：オリジナル → 変換画質（高い順） → 元ファイル
      src.sort((a, b) => (!!a.dl - !!b.dl) || (!!b.origin - !!a.origin) || (b.h - a.h));
      const H = await getHls();
      const nativeHls = !!document.createElement('video').canPlayType('application/vnd.apple.mpegurl');
      const canHls = nativeHls || !!(H && H.isSupported && H.isSupported());
      const playable = (x) => !x.hls || canHls;
      const sel = d.querySelector('[data-pl=q]'), tab = d.querySelector('[data-pl=tab]'), inf = d.querySelector('[data-pl=info]');
      sel.innerHTML = src.map((x, k) => `<option value="${k}">${esc(x.label)}${x.hls ? '・変換' : ''}${playable(x) ? '' : '（このブラウザでは再生不可）'}</option>`).join('');
      sel.style.display = src.length > 1 ? '' : 'none';
      const fail = (x, why) => {
        const box = d.querySelector('.pl-b');
        if (!box.querySelector('.pl-err')) box.insertAdjacentHTML('beforeend', `<div class="pl-msg pl-err">「${esc(x.label)}」は再生できませんでした${why ? `（${esc(why)}）` : ''}。上の画質を切り替えるか「↗ 新しいタブ」を試してください。</div>`);
        log('warn', `再生できない画質：${x.label}${why ? '（' + why + '）' : ''}`, f.name); updateLogBadge();
      };
      const load = (k, retried) => {
        const x = src[k]; tab.href = x.url; tab.style.display = '';
        try { localStorage.setItem(LS_PLQ, x.origin ? 'orig' : 'trans'); } catch (e) { /* 無視 */ }
        const box = d.querySelector('.pl-b');
        const t = (box.querySelector('video') || {}).currentTime || 0;
        stopHls();
        if (!playable(x)) { box.innerHTML = '<div class="pl-msg">この画質（HLS）はこのブラウザの中では再生できません。別の画質か「↗ 新しいタブ」を選んでください。</div>'; return; }
        box.innerHTML = '<video controls autoplay playsinline preload="auto"></video>';
        const v = box.querySelector('video');
        v.addEventListener('loadedmetadata', () => { if (t) v.currentTime = t; inf.textContent = v.videoWidth ? ` ・ ${v.videoWidth}×${v.videoHeight}${x.hls ? '（変換）' : ''}` : ''; }, { once: true });
        const useHls = x.hls || retried;
        if (useHls && !nativeHls && H && H.isSupported()) {
          curHls = new H({ maxBufferLength: 60, enableWorker: true });
          curHls.on(H.Events.ERROR, (ev, data) => { if (data && data.fatal) { fail(x, data.details || data.type); stopHls(); } });
          curHls.loadSource(x.url); curHls.attachMedia(v);
        } else {
          v.src = x.url;
          // 拡張子で HLS と判別できなかったリンクは、hls.js でもう一度試す
          v.addEventListener('error', () => { if (!retried && !x.hls && !x.dl && H && H.isSupported()) load(k, true); else fail(x, v.error && v.error.message); }, { once: true });
        }
        v.focus();
      };
      sel.onchange = () => load(+sel.value);
      // 最初の画質：前回選んだ種類（なければ変換画質）を優先。変換画質の方がデータが軽く、カクつきにくい
      let pref = 'trans'; try { pref = localStorage.getItem(LS_PLQ) || 'trans'; } catch (e) { /* 無視 */ }
      let first = src.findIndex((x) => !x.dl && playable(x) && (pref === 'orig' ? x.origin : !x.origin));
      if (first < 0) first = src.findIndex((x) => playable(x));
      if (first < 0) first = 0;
      sel.value = String(first); load(first);
      log('info', '再生：' + f.name + '（' + src[first].label + '）');
    } catch (err) { if (err.session) { closePlayer(); handleErr(err, 'tree'); return; } d.querySelector('.pl-msg').textContent = '再生用リンクを取得できませんでした：' + err.message; log('error', '再生用リンクの取得に失敗：' + err.message, f.name); updateLogBadge(); }
  }
  function closePlayer() { stopHls(); const d = document.getElementById('pd-player'); if (d) { const v = d.querySelector('video'); try { if (v) { v.pause(); v.removeAttribute('src'); v.load(); } } catch (e) { /* 無視 */ } d.remove(); } const t = $('[data-r=tree]'); if (t) t.focus(); }
  document.addEventListener('keydown', (e) => {
    const d = document.getElementById('pd-player'); if (!d) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); closePlayer(); }
    else if ((e.key === 'ArrowDown' && modKey(e)) || e.key === 'PageDown') { e.preventDefault(); d.querySelector('[data-pl=next]').click(); }
    else if ((e.key === 'ArrowUp' && modKey(e)) || e.key === 'PageUp') { e.preventDefault(); d.querySelector('[data-pl=prev]').click(); }
  }, true);

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
    if (r.kind === 'folder') { treeToggle(r.id, undefined, deep); renderTree(); } else if (isVideoRow(r)) playFile(r.id); else { treeCur = r.id; showQL(); }
  }
  // キーボード操作
  document.addEventListener('keydown', (e) => {
    if (!root.classList.contains('on') || view !== 'tree' || busy || document.getElementById('pd-dlg') || document.getElementById('pd-player')) return;
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
    if (openKey && cur) { e.preventDefault(); closeQL(); if (isVideoRow(cur)) playFile(cur.id); else if (cur.kind === 'folder') setBase(cur.id); else showQL(); return; } // 開く：⌘↓／Enter
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
    else if (k === ' ' && cur) { e.preventDefault(); if (qlOpen) closeQL(); else showQL(); }
    else if (k === 'Escape') { if (qlOpen) { e.preventDefault(); closeQL(); } }
    else if ((k === 'a' || k === 'A') && modKey(e)) { e.preventDefault(); rows.forEach((r) => treeSel.add(r.id)); renderTree(); }
    else if ((k === 'c' || k === 'C') && modKey(e) && cur && !String(window.getSelection ? window.getSelection() : '').trim()) { e.preventDefault(); copyPath(cur); }
  });
  root.addEventListener('focusout', (e) => { if (e.target.classList && e.target.classList.contains('tr-ren') && renaming) treeCommitRename(renaming, e.target.value); });
  function treeUp() {
    const ix = treeIdx || buildTreeIndex(); const b = treeBase(); if (b === ix.rootId) return;
    const cur = ix.byId.get(b); setBase(cur && ix.byId.has(cur.parentId) && !ix.byId.get(cur.parentId).isRoot ? cur.parentId : '');
    if (cur) { treeSel.add(cur.id); treeCur = cur.id; treeAnchor = cur.id; renderTree(); }
  }
  function treeAll(open) {
    if (open) folders.forEach((d) => { if (!d.isRoot) treeOpen.add(d.id); }); else treeOpen.clear();
    saveTree(); renderTree(); status(open ? 'すべてのフォルダを開きました' : 'すべてのフォルダを閉じました');
  }
  // タイル：フォルダの見出しへ飛ぶ／一番上の一覧へ戻る
  function flash(el) { if (!el) return; el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
  function jumpToSection(id) {
    const main = $('[data-r=main]'), sec = [...root.querySelectorAll('.tl-sec')].find((x) => x.dataset.sec === id);
    if (!sec) return;
    main.scrollTo({ top: main.scrollTop + sec.getBoundingClientRect().top - main.getBoundingClientRect().top - 30, behavior: 'smooth' });
    flash(sec.querySelector('.tl-h'));
    status(`「${(folderById(id) || {}).name}」の中身を表示しています（見出しの「⤒ 一覧へ戻る」か ${KEY.back} キーで一番上へ戻れます）`);
  }
  function jumpTop(fromId) {
    const main = $('[data-r=main]');
    main.scrollTo({ top: 0, behavior: 'smooth' });
    // 戻り先：最上位の一覧にある、そのフォルダ（またはそのフォルダを含むフォルダ）のタイルを選ぶ
    const f = fromId && folderById(fromId), base = treeBase();
    if (f) {
      const tr = f.trail || [], k = tr.indexOf(base);
      const top = k >= 0 ? tr[k + 1] : (tr.find((x) => treeRowsCache.some((q) => q.id === x && q.parentId === base)) || '');
      if (top) { treeSel.clear(); treeSel.add(top); treeCur = top; treeAnchor = top; renderTree(); main.scrollTo({ top: 0, behavior: 'smooth' }); flash([...root.querySelectorAll('.tr-row.tile')].find((x) => x.dataset.tid === top)); }
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
    closeQL(); treeHeadHtml = '';
    if (!hasScan()) { afterScan = 'tree'; setView('scan'); runScan(); return; }
    setView('tree');
  }

  // ---------- 操作 ----------
  const CONFIRM = { name: 'チェックの入ったファイルの名前を整えます。よろしいですか？', sort: '表示中の作品をすべて仕分け（フォルダ作成・移動）します。よろしいですか？', ren: '表示中のフォルダ名をすべて変更します。よろしいですか？', clean: 'チェックの入った空フォルダをゴミ箱へ移し、入れ子のフォルダをまとめ、(1) を外します。よろしいですか？' };
  const RUN = { name: runName, sort: runSort, ren: runRen, clean: runClean };
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
    if (a === 'log') { showLog(); return; }
    if (a === 'tree') { if (!busy) openTree(); return; }
    if (a === 'texpand' || a === 'tcollapse') { if (!busy) treeAll(a === 'texpand'); return; }
    if (a === 'tview') { if (!busy) treeView(t.dataset.v); return; }
    if (a === 'toflow') { if (!busy) { if (view === 'tree') view = 'scan'; openFlow(); } return; }
    if (a === 'rescan') { if (!busy) { afterScan = view; runScan(); } return; }
    if (a === 'stop') { window.__ppdupStop = true; status('中断しています…（いまの処理が終わったら止まります）'); return; }
    if (busy) return;
    if (a === 'scan') return runScan();
    if (a === 'delall') return runDelete(visibleGroups());
    if (a === 'junkdel') return runJunk();
    if (a === 'jall' || a === 'jnone') { const lv = t.dataset.lv; jplan.filter((p) => p.level === lv).forEach((p) => junkSel.set(p.id, a === 'jall')); render(); renderActs(); return; }
    const m = /^(name|sort|ren|clean)(1|all)$/.exec(a || '');
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
    if (e.target.dataset && e.target.dataset.a === 'junkopt') { try { localStorage.setItem(LS_OPT_JUNK, e.target.checked ? '1' : '0'); } catch (err) { /* 無視 */ } log('info', '不要ファイルの除外を' + (e.target.checked ? 'オン' : 'オフ') + 'に変更'); setView(view); return; }
    const jid = e.target.dataset && e.target.dataset.jchk;
    if (jid) { junkSel.set(jid, e.target.checked); const row = e.target.closest('.pd-row'); if (row) row.classList.toggle('del', e.target.checked); renderActs(); return; }
    if (e.target.dataset && e.target.dataset.a === 'nameopt') { try { localStorage.setItem(LS_OPT_NAME, e.target.checked ? '1' : '0'); } catch (err) { /* 無視 */ } log('info', 'ファイル名の整理を' + (e.target.checked ? 'オン' : 'オフ') + 'に変更'); render(); renderNav(); return; }
    const nid = e.target.dataset && e.target.dataset.nchk;
    if (nid) { if (e.target.checked) nameOff.delete(nid); else nameOff.add(nid); const row = e.target.closest('.pd-row'); if (row) row.classList.toggle('sel', e.target.checked); return; }
    const cid = e.target.dataset && e.target.dataset.cchk;
    if (cid) { if (e.target.checked) cleanOff.delete(cid); else cleanOff.add(cid); const row = e.target.closest('.pd-row'); const it = cplan.find((x) => x.id === cid); if (row) row.classList.toggle(it && it.op === 'rename' ? 'sel' : 'del', e.target.checked); return; }
    if (['mode', 'nearonly', 'renfilter'].includes(e.target.dataset.a)) render();
  });
  root.addEventListener('input', (e) => { if (e.target.dataset.a === 'q') render(); if (e.target.dataset.a === 'tq') { tree.q = e.target.value; renderTree(); } });
  // ---------- フローティングメニュー ----------
  function openFlow() {
    mode = 'flow'; root.classList.remove('single'); root.classList.add('on'); updateLogBadge();
    if (!busy) setView(hasScan() ? (view || 'scan') : 'scan');
  }
  // 1つの作業だけを開く。まだ読み込んでいなければ、先に読み込んでから開く
  function openTask(v) {
    mode = v === 'scan' ? 'flow' : 'single';
    root.classList.toggle('single', mode === 'single'); root.classList.add('on'); updateLogBadge();
    if (busy) return;
    if (v !== 'scan' && !hasScan()) { afterScan = v; setView('scan'); runScan(); return; }
    setView(v);
  }
  function renderFab() {
    const c = counts();
    const badge = (k) => {
      if (k === 'scan') return meta ? `<span class="b ok">${esc(new Date(meta.at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }))}</span>` : '<span class="b todo">未読み込み</span>';
      if (!c) return '<span class="b">読み込んでから</span>';
      const n = remaining(k, c);
      if (n) return `<span class="b todo">${n} ${UNIT_OF[k]}</span>`;
      if (k === 'clean' && c.cleanSkip) return `<span class="b">要確認 ${c.cleanSkip}</span>`;
      return '<span class="b ok">✓ 完了</span>';
    };
    const seen = +(localStorage.getItem(LS_LOGSEEN) || 0);
    const errs = readLog().filter((x) => x.level === 'error' && x.t > seen).length;
    fab.innerHTML = `<button class="flow" data-fab="flow"><span class="n" style="background:#ffffff33">▶</span><span class="t">おまかせ整理<br><span style="font-weight:400;font-size:11px;opacity:.85">1〜7の流れで順番に進める</span></span></button>
      <div class="hd">作業を選んで開く</div>
      ${STEPS.map((s, i) => `<button data-fab="${s.v}"${busy ? ' disabled' : ''}><span class="n">${i + 1}</span><span class="t">${esc(s.t)}</span>${badge(s.v)}</button>`).join('')}
      <hr><button data-fab="tree"${busy ? ' disabled' : ''}><span class="n">🗂</span><span class="t">フォルダ一覧</span>${meta ? `<span class="b">${folders.length} フォルダ</span>` : '<span class="b">読み込んでから</span>'}</button>
      <button data-fab="log"><span class="n">≡</span><span class="t">ログ</span>${errs ? `<span class="b todo">エラー ${errs}</span>` : ''}</button>
      <div class="hd" style="text-align:right;padding:2px 10px 4px">PikPak Distill v${VER}</div>`;
  }
  const closeFab = () => fab.classList.remove('on');
  btn.addEventListener('click', (e) => { e.stopPropagation(); if (fab.classList.contains('on')) { closeFab(); return; } renderFab(); fab.classList.add('on'); });
  fab.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    const k = b.dataset.fab; closeFab();
    if (k === 'flow') openFlow();
    else if (k === 'log') showLog();
    else if (k === 'tree') { mode = 'single'; root.classList.add('single', 'on'); updateLogBadge(); openTree(); }
    else openTask(k);
  });
  document.addEventListener('click', (e) => { if (fab.classList.contains('on') && !fab.contains(e.target) && e.target !== btn) closeFab(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeFab(); });
  updateLogBadge();
  resumeAfterReload();

  window.PPDup = { buildCleanPlan, buildSortPlan, buildRenamePlan, get folders() { return folders; }, scanApi, buildGroups, render, get files() { return files; }, set files(v) { files = v; } };
})();
