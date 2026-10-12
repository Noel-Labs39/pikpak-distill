// ==UserScript==
// @name         PikPak Distill – Dedupe
// @namespace    local.pikpak.dupcompare
// @author       Noel Labs
// @license      MIT
// @homepage     https://github.com/Noel-Labs39/pikpak-distill
// @supportURL   https://github.com/Noel-Labs39/pikpak-distill/issues
// @updateURL    https://raw.githubusercontent.com/Noel-Labs39/pikpak-distill/main/pikpak-distill.user.js
// @downloadURL  https://raw.githubusercontent.com/Noel-Labs39/pikpak-distill/main/pikpak-distill.user.js
// @version      3.9.0
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTQiIGZpbGw9IiMzMDZmZmYiLz48cmVjdCB4PSIxMiIgeT0iMTYiIHdpZHRoPSIyNCIgaGVpZ2h0PSIzMiIgcng9IjQiIGZpbGw9IiNmZmYiIG9wYWNpdHk9Ii41NSIvPjxyZWN0IHg9IjI2IiB5PSIxMiIgd2lkdGg9IjI2IiBoZWlnaHQ9IjM0IiByeD0iNCIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik0zMiAyNGgxNE0zMiAzMGgxNE0zMiAzNmg5IiBzdHJva2U9IiMzMDZmZmYiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PGNpcmNsZSBjeD0iNDQiIGN5PSI0NiIgcj0iOSIgZmlsbD0iI2ZmYjAyMCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjMiLz48cGF0aCBkPSJNNDAgNDZsMyAzIDUtNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==
// @description  PikPakの重複ファイルを、サムネイルとサイズで比べて整理するツール。広告・宣伝などの不要ファイルの削除、作品ごとの仕分け、フォルダ名の整合、(1)の除去、チェックしたファイルの削除（ゴミ箱／完全削除）に対応。
// @match        https://mypikpak.com/*
// @grant        none
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
  const VER = '3.9.0'; // @version と合わせて更新する

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
      [...groups.keys()].sort().forEach((k) => {
        if (k === own) return;
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
    // 空フォルダの片付けを先に、名前の変更をあとに実行する
    return plan.sort((a, b) => (a.op === b.op ? 0 : a.op === 'trash' ? -1 : 1));
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
    if (me.name === p.target) return true;
    if (me.name !== p.cur) throw new Error('現在の名前が想定と違います: ' + me.name);
    if (sibs.some((x) => x.id !== p.id && x.name.toLowerCase() === p.target.toLowerCase())) { p.status = 'skip'; p.note = '同じ場所に「' + p.target + '」が残っているため外せませんでした'; return false; }
    await apiRename(p.id, p.target);
    return true;
  }
  async function cleanOne(p) {
    if (!(await cleanApi(p))) return false; // 実行時の確認で対象外になったものは飛ばす
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
  #ppdup.single nav{display:none}
  #ppdup{--bg:#f5f6f8;--panel:#fff;--panel2:#eef0f4;--line:#dde0e6;--fg:#1c1f26;--mute:#6a7080;--pri:#306fff;--pri-soft:#306fff1f;--ok:#1f9d55;--danger:#d64545;--keep:#f0faf2;--del:#fff5f5;--ctl:#fff;--ctl-line:#c5c9d2;
    position:fixed;inset:0;z-index:99999;background:var(--bg);color:var(--fg);font:13px/1.5 system-ui,"Hiragino Sans","Yu Gothic",sans-serif;display:none;flex-direction:column}
  @media (prefers-color-scheme:dark){#ppdup{--bg:#15171c;--panel:#1d2027;--panel2:#252932;--line:#2c303a;--fg:#e6e8ee;--mute:#8b91a1;--pri-soft:#306fff33;--keep:#17261c;--del:#2a1a1a;--ctl:#252932;--ctl-line:#3a3f4b}}
  #ppdup.on{display:flex}
  #ppdup header{padding:12px 18px 0;background:var(--panel);border-bottom:1px solid var(--line)}
  #ppdup .brand{display:flex;align-items:center;gap:12px}
  #ppdup .brand svg{width:44px;height:44px;flex:none}
  #ppdup .brand h1{margin:0;font:800 24px/1.1 system-ui,"Hiragino Sans",sans-serif}
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
  #ppdup [data-r=logbadge]:not(:empty){margin-left:6px;padding:0 6px;border-radius:999px;background:var(--danger);color:#fff;font-size:11px;font-weight:700}
  #pd-dlg .logs{max-height:55vh;overflow:auto;font:12px/1.5 ui-monospace,Menlo,monospace;border:1px solid #c5c9d288;border-radius:8px;padding:8px;margin:10px 0;white-space:pre-wrap;word-break:break-all}
  #pd-dlg .logs .error{color:#d93025}#pd-dlg .logs .warn{color:#b26a00}
  /* フォルダツリー（Finder のリスト表示風） */
  #ppdup main:has(.tr){padding:0}
  .tr{outline:none;font:13px/1 -apple-system,BlinkMacSystemFont,"Hiragino Sans","Yu Gothic",sans-serif;min-height:100%;background:var(--panel);user-select:none}
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
  .tr .jk{flex:none;font-size:10px;line-height:14px;padding:0 5px;border-radius:7px;background:#ff6b6b;color:#fff;margin-left:4px}
  .tr-ren{font:inherit;padding:1px 4px !important;border:2px solid #4b8df8 !important;border-radius:3px !important;flex:1;min-width:120px;cursor:text !important}
  @media (prefers-color-scheme:dark){.tr-row.sel{background:#3a3f4b}}
  #pd-ql{position:fixed;inset:0;z-index:100002;display:flex;align-items:center;justify-content:center;background:#0004}
  #pd-ql .ql{background:#2b2d31ee;color:#eee;border-radius:12px;box-shadow:0 20px 60px #000a;width:min(820px,90vw);overflow:hidden;font:13px/1.5 -apple-system,"Hiragino Sans",sans-serif;backdrop-filter:blur(20px)}
  #pd-ql .ql-h{display:flex;align-items:center;gap:10px;padding:8px 12px;background:#0003}
  #pd-ql .ql-h b{flex:1;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-ql .ql-h button{border:0;background:#fff2;color:#eee;border-radius:50%;width:22px;height:22px;cursor:pointer}
  #pd-ql .ql-b{display:flex;align-items:center;justify-content:center;min-height:300px;max-height:65vh;background:#000}
  #pd-ql .ql-b img{max-width:100%;max-height:65vh;display:block}
  #pd-ql .ql-ic svg{width:160px;height:140px}
  #pd-ql .ql-f{padding:10px 14px}
  #pd-ql .note{color:#aaa;font-size:12px;word-break:break-all}
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
    { v: 'clean', t: '(1)を外す・片付け', d: '重複を削除したあとに残った空フォルダをゴミ箱へ移し、不要になった (1) を外します。' },
  ];

  const btn = document.createElement('button'); btn.id = 'ppdup-btn'; btn.innerHTML = LOGO + '<span>Distill</span>'; btn.title = 'PikPak Distill – Dedupe（クリックでメニュー）'; document.body.appendChild(btn);
  const fab = document.createElement('div'); fab.id = 'ppdup-fab'; document.body.appendChild(fab);
  const root = document.createElement('div'); root.id = 'ppdup';
  root.innerHTML = `
    <header>
      <div class="brand">${LOGO}<h1>PikPak Distill</h1><span class="chip">Dedupe</span><span class="ver" title="いま動いているバージョン">v${VER}</span><span class="by">by Noel Labs</span><span class="sp"></span><button data-a="tree" title="読み込んだフォルダをツリーで表示（Finder のような操作）">ツリー</button><button data-a="log" title="エラーや処理の記録">ログ<span data-r="logbadge"></span></button><button data-a="close">閉じる</button></div>
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
  function renderNav() {
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
    if (v !== 'tree') closeQL();
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
    if (!trash.length && !ren.length && !skip.length) { $('[data-r=main]').innerHTML = doneCard(); if (!busy) status('片付けは完了しています。'); return; }
    const row = (p, chk) => `<div class="pd-row ${chk && !cleanOff.has(p.id) ? (p.op === 'trash' ? 'del' : 'sel') : ''}">${chk ? `<label class="pd-chk"><input type="checkbox" data-cchk="${esc(p.id)}"${cleanOff.has(p.id) ? '' : ' checked'}></label>` : ''}<div class="pd-info"><div class="pd-path">${esc(p.path || '（読み込んだフォルダの直下）')}</div>
      <div class="pd-name">${esc(p.cur)}${p.op === 'rename' ? ` <span class="note">→</span> ${esc(p.target)}` : ''} <span class="pd-tag">${p.kind === 'folder' ? 'フォルダ' : 'ファイル'}</span></div>
      ${p.note ? `<div class="note">${esc(p.note)}</div>` : ''}</div></div>`;
    $('[data-r=main]').innerHTML = `
      <div class="pd-g"><div class="pd-gh"><span>空フォルダをゴミ箱へ ${trash.length} 件</span><span class="note">中身が空のフォルダです。実行直前にも空であることを確認します（ゴミ箱から戻せます）</span></div>
        ${trash.map((p) => row(p, true)).join('') || '<div class="empty">✓ 空フォルダはありません</div>'}</div>
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
      status(`${p.op === 'trash' ? '空フォルダを片付けています' : '(1)を外しています'}… ${ok + skipped + 1}/${targets.length}：${p.cur}`, (ok + skipped) / targets.length);
      try { if (await cleanOne(p)) ok++; else skipped++; saveAll(); }
      catch (err) { saveAll(); busy = false; setView('clean'); handleErr(err, 'clean', `停止：${p.cur}：${err.message}（${ok}件完了）`); return; }
      await sleep(150);
    }
    busy = false; setView('clean'); status(`${ok} 件を実行しました${skipped ? `（${skipped} 件は実行直前の確認で対象外になりました）` : ''}。`); log('info', `片付け ${ok} 件・対象外 ${skipped} 件`); refreshView();
  }

  // ---------- フォルダツリー（macOS の Finder のリスト表示に近い操作） ----------
  // 読み込んだ結果をツリーで表示する。▶ で開閉、矢印キーで移動、スペースでプレビュー、
  // Enter で名前の変更、⌘⌫ でゴミ箱へ。⌘/Shift クリックで複数選択。
  const LS_TREE = 'ppdup:tree:v1';
  let tree = { open: [], sort: 'name', dir: 1, q: '' };
  try { tree = { ...tree, ...JSON.parse(localStorage.getItem(LS_TREE) || '{}') }; } catch (e) { /* 無視 */ }
  const treeOpen = new Set(tree.open || []);
  const saveTree = () => { try { localStorage.setItem(LS_TREE, JSON.stringify({ open: [...treeOpen].slice(-2000), sort: tree.sort, dir: tree.dir })); } catch (e) { /* 無視 */ } };
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
    return { kd, kf, agg, rootId, rootName: rootF ? rootF.name : 'ホーム', byId };
  }
  // 表示する行（開いているフォルダの中だけ）。絞り込み中は、一致したものとその上のフォルダを開いて表示
  function treeRows() {
    const ix = treeIdx = buildTreeIndex();
    const q = (tree.q || '').trim().toLowerCase();
    let keep = null;
    if (q) {
      keep = new Set();
      const up = (pid) => { let cur = ix.byId.get(pid); while (cur && !keep.has(cur.id)) { keep.add(cur.id); cur = ix.byId.get(cur.parentId); } };
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
    walk(ix.rootId, 0);
    return rows;
  }
  function renderTreeToolbar() {
    const arrow = (k) => (tree.sort === k ? (tree.dir > 0 ? ' ▲' : ' ▼') : '');
    $('[data-r=tb]').innerHTML = `<div class="head"><b>フォルダツリー</b><span class="note">Finder と同じ操作：▶ / ← → で開閉（⌥ で中もすべて）・↑↓ で移動・スペースでプレビュー・Enter で名前の変更・⌘⌫ でゴミ箱へ・⌘C で場所をコピー</span></div><span class="sp"></span>
      <span class="note">読み込み：${meta ? esc(new Date(meta.at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })) : '未'}</span>
      <input type="text" data-a="tq" placeholder="🔍 名前で絞り込み" size="18" value="${esc(tree.q || '')}">
      <button data-a="texpand" title="すべてのフォルダを開く">すべて開く</button><button data-a="tcollapse" title="すべてのフォルダを閉じる">すべて閉じる</button>
      <button data-a="rescan" title="最新の状態を読み込み直します">再読み込み</button>${mode === 'single' ? '<button data-a="toflow">流れで表示</button>' : ''}`;
    treeHeadHtml = `<div class="tr-h"><span class="c-name" data-tsort="name">名前${arrow('name')}</span><span class="c-size" data-tsort="size">サイズ${arrow('size')}</span><span class="c-kind" data-tsort="kind">種類${arrow('kind')}</span><span class="c-n">項目</span></div>`;
  }
  let treeHeadHtml = '';
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
        <span class="c-name" style="padding-left:${8 + r.depth * 18}px">${r.kind === 'folder' ? `<span class="tw${r.open ? ' open' : ''}" data-ttw="${esc(r.id)}">▶</span>` : '<span class="tw blank"></span>'}<span class="ic">${r.kind === 'folder' ? ICON_DIR : ICON_FILE(r)}</span>${name}${jr ? `<span class="jk" title="${esc(jr)}">不要</span>` : ''}</span>
        <span class="c-size">${r.kind === 'folder' ? (r.nf ? fmt(r.size) : '--') : fmt(r.size)}</span><span class="c-kind">${esc(kindOf(r))}</span><span class="c-n">${r.kind === 'folder' ? r.n + ' 項目' : ''}</span></div>`;
    };
    const top = ix.agg.get(ix.rootId) || { n: 0, size: 0, files: 0 };
    $('[data-r=main]').innerHTML = `<div class="tr" tabindex="0" data-r="tree">${treeHeadHtml}<div class="tr-body">${rows.map(rowHtml).join('') || '<div class="empty">' + (tree.q ? '一致するものはありません' : '読み込んだフォルダは空です') + '</div>'}</div></div>`;
    const selN = treeSel.size, selSize = [...treeSel].reduce((a, id) => { const r = rows.find((x) => x.id === id); return a + (r ? r.size : 0); }, 0);
    if (!busy) status(`${esc(ix.rootName)}：${top.n} 項目・ファイル ${top.files} 件・${fmt(top.size)}${selN ? `　｜　${selN} 項目を選択（${fmt(selSize)}）` : ''}`);
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
      <div class="ql-f"><div>${info}</div><div class="note">${esc((r.kind === 'folder' ? r.path : r.path + '/').replace(/^\/?/, '/').replace(/\/+$/, '') || '/')}</div>${jr ? `<div style="color:#ff6b6b">不要ファイルの判定：${esc(jr.reason)}</div>` : ''}</div></div>`;
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
      busy = false; renderTree(); status(`名前を変更しました：${r.name} → ${name}`); log('info', `ツリーで名前を変更：${r.name} → ${name}`); refreshView();
    } catch (err) { busy = false; renderTree(); handleErr(err, 'tree', '名前を変更できませんでした：' + err.message); }
  }
  // ゴミ箱へ（⌘⌫）
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
      status(`${done} 項目を${ans.hard ? '完全に削除' : 'ゴミ箱へ移動'}しました。`); log('info', `ツリーで削除 ${done} 項目（${ans.hard ? '完全削除' : 'ゴミ箱'}）`); refreshView();
    } catch (err) { saveAll(); busy = false; renderTree(); handleErr(err, 'tree', `削除を停止しました（${done} 項目完了）：` + err.message); }
  }
  // マウス操作
  root.addEventListener('mousedown', (e) => {
    if (view !== 'tree' || busy) return;
    const s = e.target.closest('[data-tsort]');
    if (s) { const k = s.dataset.tsort; if (tree.sort === k) tree.dir = -tree.dir; else { tree.sort = k; tree.dir = 1; } saveTree(); renderTreeToolbar(); renderTree(); return; }
    const tw = e.target.closest('[data-ttw]');
    if (tw) { e.preventDefault(); treeToggle(tw.dataset.ttw, undefined, e.altKey); renderTree(); return; }
    if (e.target.closest('.tr-ren')) return;
    const row = e.target.closest('.tr-row');
    if (row) { e.preventDefault(); if (renaming) { const i = $('.tr-ren'); treeCommitRename(renaming, i && i.value); } treeSelect(row.dataset.tid, e); renderTree(); if (qlOpen) showQL(); }
  });
  root.addEventListener('dblclick', (e) => {
    if (view !== 'tree' || busy) return;
    const row = e.target.closest('.tr-row'); if (!row || e.target.closest('[data-ttw]')) return;
    const r = treeRowsCache.find((x) => x.id === row.dataset.tid); if (!r) return;
    if (r.kind === 'folder') { treeToggle(r.id, undefined, e.altKey); renderTree(); } else { treeCur = r.id; showQL(); }
  });
  // キーボード操作
  document.addEventListener('keydown', (e) => {
    if (!root.classList.contains('on') || view !== 'tree' || busy || document.getElementById('pd-dlg')) return;
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
    if (k === 'ArrowDown') { e.preventDefault(); move(i < 0 ? 0 : (e.metaKey ? rows.length - 1 : i + 1)); }
    else if (k === 'ArrowUp') { e.preventDefault(); move(i < 0 ? 0 : (e.metaKey ? 0 : i - 1)); }
    else if (k === 'ArrowRight' && cur) { e.preventDefault(); if (cur.kind === 'folder') { if (!cur.open || e.altKey) { treeToggle(cur.id, true, e.altKey); renderTree(); } else move(i + 1); } }
    else if (k === 'ArrowLeft' && cur) {
      e.preventDefault();
      if (cur.kind === 'folder' && cur.open) { treeToggle(cur.id, false, e.altKey); renderTree(); }
      else { const p = rows.findIndex((r) => r.id === cur.parentId); if (p >= 0) move(p); }
    }
    else if (k === ' ' && cur) { e.preventDefault(); if (qlOpen) closeQL(); else showQL(); }
    else if (k === 'Escape') { if (qlOpen) { e.preventDefault(); closeQL(); } }
    else if (k === 'Enter' && cur) { e.preventDefault(); closeQL(); renaming = cur.id; renderTree(); }
    else if ((k === 'Backspace' || k === 'Delete') && (e.metaKey || k === 'Delete') && treeSel.size) { e.preventDefault(); closeQL(); treeTrash(); }
    else if ((k === 'a' || k === 'A') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); rows.forEach((r) => treeSel.add(r.id)); renderTree(); }
    else if ((k === 'c' || k === 'C') && (e.metaKey || e.ctrlKey) && cur) { e.preventDefault(); const p = (cur.kind === 'folder' ? cur.path : (cur.path.replace(/\/$/, '') + '/' + cur.name)).replace(/^\/?/, '/'); try { navigator.clipboard.writeText(p); } catch (err) { /* 無視 */ } status('場所をコピーしました：' + p); }
  });
  root.addEventListener('focusout', (e) => { if (e.target.classList && e.target.classList.contains('tr-ren') && renaming) treeCommitRename(renaming, e.target.value); });
  function openTree() {
    if (busy) return;
    closeQL(); treeHeadHtml = '';
    if (!hasScan()) { afterScan = 'tree'; setView('scan'); runScan(); return; }
    setView('tree');
  }

  // ---------- 操作 ----------
  const CONFIRM = { name: 'チェックの入ったファイルの名前を整えます。よろしいですか？', sort: '表示中の作品をすべて仕分け（フォルダ作成・移動）します。よろしいですか？', ren: '表示中のフォルダ名をすべて変更します。よろしいですか？', clean: 'チェックの入った空フォルダをゴミ箱へ移し、(1) を外します。よろしいですか？' };
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
    if (a === 'texpand' || a === 'tcollapse') { if (busy) return; if (a === 'tcollapse') treeOpen.clear(); else folders.forEach((d) => { if (!d.isRoot) treeOpen.add(d.id); }); saveTree(); renderTree(); return; }
    if (a === 'toflow') { if (!busy) openFlow(); return; }
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
      <hr><button data-fab="tree"${busy ? ' disabled' : ''}><span class="n">🗂</span><span class="t">フォルダツリー</span>${meta ? `<span class="b">${folders.length} フォルダ</span>` : '<span class="b">読み込んでから</span>'}</button>
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
