// ==UserScript==
// @name         PikPak Distill – Dedupe
// @namespace    local.pikpak.dupcompare
// @author       Noel Labs
// @license      MIT
// @homepage     https://github.com/Noel-Labs39/pikpak-distill
// @supportURL   https://github.com/Noel-Labs39/pikpak-distill/issues
// @updateURL    https://raw.githubusercontent.com/Noel-Labs39/pikpak-distill/main/pikpak-distill.user.js
// @downloadURL  https://raw.githubusercontent.com/Noel-Labs39/pikpak-distill/main/pikpak-distill.user.js
// @version      4.8.3
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJwcGR1cC1sZyIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgeTI9IjEiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iIzIyYzNhNiIvPjxzdG9wIG9mZnNldD0iLjUiIHN0b3AtY29sb3I9IiMyZjZiZmYiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM3YjVjZmYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSIxOCIgZmlsbD0iIzE0MTYxYyIvPjxyZWN0IHg9IjkiIHk9IjE0IiB3aWR0aD0iMTMiIGhlaWdodD0iMTYiIHJ4PSIzIiBmaWxsPSJub25lIiBzdHJva2U9InVybCgjcHBkdXAtbGcpIiBzdHJva2Utb3BhY2l0eT0iLjUiIHN0cm9rZS13aWR0aD0iMyIvPjxyZWN0IHg9IjkiIHk9IjM0IiB3aWR0aD0iMTMiIGhlaWdodD0iMTYiIHJ4PSIzIiBmaWxsPSJub25lIiBzdHJva2U9InVybCgjcHBkdXAtbGcpIiBzdHJva2Utb3BhY2l0eT0iLjUiIHN0cm9rZS13aWR0aD0iMyIvPjxwYXRoIGQ9Ik0yMiAyMmg2bDUgMTBNMjIgNDJoNmw1LTEwIiBmaWxsPSJub25lIiBzdHJva2U9InVybCgjcHBkdXAtbGcpIiBzdHJva2Utb3BhY2l0eT0iLjciIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTM2IDE4aDdhMTQgMTQgMCAwIDEgMCAyOGgtN3oiIGZpbGw9Im5vbmUiIHN0cm9rZT0idXJsKCNwcGR1cC1sZykiIHN0cm9rZS13aWR0aD0iNS41IiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PGNpcmNsZSBjeD0iNTEiIGN5PSI0NSIgcj0iNiIgZmlsbD0iI2ZmYjAyMCIgc3Ryb2tlPSIjMTQxNjFjIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNNDguMyA0NWwxLjkgMS45IDMuMS0zLjQiIHN0cm9rZT0iIzE0MTYxYyIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=
// @description  PikPakの重複ファイルを、サムネイルとサイズで比べて整理するツール。広告・宣伝などの不要ファイルの削除、作品ごとの仕分け、フォルダ名の整合、(1)の除去、チェックしたファイルの削除（ゴミ箱／完全削除）に対応。
// @match        https://mypikpak.com/*
// @match        https://fd2ppv.cc/articles/*
// @match        https://fc2cmadb.com/articles/*
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/hls.js@1.6.15/dist/hls.min.js#sha256=413a83e2bb0c77ed0bf0be105d539d17ef45dfd984a0b13ecd3b14a901383938
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
  const VER = '4.8.3'; // @version と合わせて更新する

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

  // <work-id> ---------- 品番の読み取り（品番に関わる判定はすべてここを通す） ----------
  //   変えたら tests/work-id.test.js の見本で確かめる（PR ごとに自動で走る）
  //   読み取る順番：
  //     ① ファイル名に品番がある（FC2-PPV-1234567・FC2PPV1234567・FC2_PPV_1234567・FC2-1234567・サイト名@… など）
  //     ② ファイル名が数字で始まり、その数字が入っているフォルダの品番と同じ（フォルダ FC2-PPV-1234567 の 1234567-1.mp4）
  //     ③ ABC-123 の形（FC2 以外）
  //   日付などの数字だけ（20260609.mp4）や、フォルダと違う数字は品番とみなさない
  const FC2_RE = /FC2[\s_-]*(?:PPV[\s_-]*)?(\d{5,8})(?!\d)/i;
  // ABC-123：英字の前が数字（1pon-1080p の pon）や、数字の後ろが p（1080p・720p＝解像度）のものは品番とみなさない
  const CODE_RE = /(^|[^A-Za-z0-9])([A-Za-z]{2,6})-(\d{3,5})(?![\dpP])/;
  const CODE_NG = /^(FC|MP|AVI|MKV|HD|FHD|UHD|PART|CD|DISC|VOL|EP|PON|CARIB|MURA|PACO)$/i;
  // 日付型の品番を使うメーカー（121815_3315-1pon・122415-053-carib など）
  const BRANDS = [
    ['caribpr', 'Caribbeancom Premium', /caribbeancompr|caribpr|カリビアンコム\s*プレミアム/i],
    ['carib', 'Caribbeancom', /caribbean|carib|カリビアン/i],
    ['1pon', '1pondo', /1pondo|1pon(?![a-z])|一本道/i],
    ['10mu', '10musume', /10musume|10mu(?![a-z])|天然むすめ/i],
    ['paco', 'Pacopacomama', /pacopacomama|(?:^|[^a-z])paco(?![a-z])|パコパコママ/i],
    ['mura', 'Muramura', /muramura|(?:^|[^a-z])mura(?![a-z])|ムラムラ/i],
  ];

  // 拡張子・重複回避の (1) を分ける
  function splitName(name) {
    const m = String(name || '').match(/^(.*?)(\.[A-Za-z0-9]{2,5})?$/);
    let stem = m[1]; const ext = m[2] || '';
    const dup = stem.match(/\s?\((\d+)\)$/); if (dup) stem = stem.slice(0, dup.index);
    return { stem, ext, dup: dup ? dup[1] : '' };
  }
  // 品番の後ろの文字から連番を取る（すぐ後ろの _2・-2・part2・cd2・_A／タイトル末尾の「…編-3」／第3話）
  function partOf(rest) {
    const pm = rest.match(/^[\s_\-－]*(?:(?:part|cd)\s?)?(\d{1,2}|[A-Ea-e])(?=$|[\s_\-－.[(（【])/i)
      || rest.match(/[\s_\-－](?:(?:part|cd)\s?)?(\d{1,2}|[A-Ea-e])$/i)
      || rest.match(/第\s?(\d{1,2})\s?[話部巻章]/);
    return pm ? pm[1].toUpperCase() : '';
  }
  const dirFc2 = (dirName) => (String(dirName || '').match(FC2_RE) || [])[1] || '';
  // 返り値：{ kind: 'fc2'|'code', num, key（作品の鍵）, label（そろえた品番）, part（連番）, src: 'name'|'dir', ext, dup } または null
  function parseWork(name, dirName) {
    const { stem, ext, dup } = splitName(name);
    const fc2 = (num, rest, src) => ({ kind: 'fc2', num, key: 'FC2-PPV-' + num, label: 'FC2-PPV-' + num, part: partOf(rest), src, ext, dup });
    const m = stem.match(FC2_RE);
    if (m) return fc2(m[1], stem.slice(m.index + m[0].length), 'name');
    const d = dirFc2(dirName);
    if (d) { const b = stem.match(/^(?:[^@]*@)?\s*(\d{5,8})(?!\d)/); if (b && b[1] === d) return fc2(d, stem.slice(b.index + b[0].length), 'dir'); }
    // ④ HEYZO-1234
    const hz = stem.match(/heyzo[\s_-]*(\d{4})(?!\d)/i);
    if (hz) return { kind: 'brand', num: hz[1], key: 'HEYZO-' + hz[1], label: 'HEYZO-' + hz[1], part: '', src: 'name', ext, dup };
    // ⑤ 日付型（121815_3315-1pon など）。メーカー名が分かればメーカーごとに分ける
    const dt = stem.match(/(?:^|[^\d])(\d{6})([-_])(\d{2,4})(?![\d])/);
    if (dt) { const br = BRANDS.find(([, , re]) => re.test(stem)); const code = dt[1] + '_' + dt[3]; const key = (br ? br[0] + '-' : '') + code; return { kind: br ? 'brand' : 'date', num: code, key, label: key, part: '', src: 'name', ext, dup }; }
    const c = stem.match(CODE_RE);
    if (c && !CODE_NG.test(c[2])) { const label = c[2].toUpperCase() + '-' + c[3]; return { kind: 'code', num: c[3], key: label, label, part: '', src: 'name', ext, dup }; }
    return null;
  }
  const hasWorkId = (name, dirName) => !!parseWork(name, dirName);
  // 作品の品番（作品ID）。次の違いは同じ作品として扱う（フォルダ名を揃える・作品ごとに仕分けで使う）
  //   ・拡張子、重複回避の (1)
  //   ・分割・シーン違いの連番：-1 / -2、_1 / _2、part1、cd1、-A など
  //   ・配布元サイト名などの接頭辞：hhd800.com@FC2-PPV-1234567_1.mp4 → FC2-PPV-1234567
  //   ・FC2の表記ゆれ：FC2PPV-1234567 / FC2_PPV_1234567 / FC2-1234567 → FC2-PPV-1234567
  function baseName(n, dirName) {
    const w = parseWork(n, dirName); if (w && w.kind === 'fc2') return w.label;
    let b = splitName(n).stem;
    b = b.replace(/^[^@]*@/, '').replace(/^\[[^\]]*\]\s*/, '').trim();
    return b.replace(/^(.*\d{4,})(?:[\s_-]+(?:\d{1,2}|[A-Ea-e])|[\s_-]*(?:part|cd)\s?\d{1,2})$/i, '$1');
  }
  // FC2 のファイル名を整えた形（例：4k688.com@FC2-PPV-4988183_1.mp4 → FC2-PPV-4988183-1.mp4）
  //   ・品番は FC2-PPV-数字 にそろえる（サイト名・広告などの前後の文字は消す）
  //   ・連番は「-1」「-A」の形で残す。重複回避の (1) と拡張子はそのまま
  //   ・FC2 以外のファイル名は変更しない（null）
  function fc2CleanName(name, dirName) {
    const w = parseWork(name, dirName); if (!w || w.kind !== 'fc2') return null;
    return w.label + (w.part ? '-' + w.part : '') + (w.dup ? '(' + w.dup + ')' : '') + w.ext;
  }
  // 連番まで同じものの鍵（-1 と -2 を別に扱う）。いまの「同じ品番でまとめる」は -1/-2 違いも 1 組にする仕様なので、そちらは key を使う
  const dupKeyOf = (name, dirName) => { const w = parseWork(name, dirName); return w ? w.key + (w.part ? '#' + w.part : '') : ''; };
  // </work-id>
  // ---------- グルーピング ----------
  // 同じファイル名モードでも、重複回避の (1) 等は同名として扱う
  const keyOf = (name, mode, dirName) => (mode === 'id' ? ((parseWork(name, dirName) || {}).key || ((name.match(/(\d{5,8})/) || [])[1]) || name.toLowerCase()) : name.toLowerCase().replace(/\s?\(\d+\)(?=\.[a-z0-9]{2,5}$|$)/, ''));
  function buildGroups(files, mode) {
    const m = new Map();
    const dn = new Map((typeof folders !== 'undefined' ? folders : []).map((d) => [d.id, d.name]));
    files.forEach((f) => { const k = keyOf(f.name, mode, dn.get(f.parentId)); if (!m.has(k)) m.set(k, []); m.get(k).push(f); });
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
      const fs = (direct.get(fo.id) || []).filter((f) => hasWorkId(f.name, fo.name));
      let bases = [...new Set(fs.map((f) => baseName(f.name, fo.name)))];
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
  const workKey = (n, dirName) => { const b = baseName(n, dirName); return /\d{5,8}/.test(b) ? b : ''; };
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
  // 計画: [{op:'rename', kind:'file', id, parentId, path, cur, target, status, note}]
  function buildNamePlan(files, folders) {
    const fPath = new Map(folders.map((f) => [f.id, f.path]));
    const fName = new Map(folders.map((f) => [f.id, f.name]));
    const byP = new Map(); files.forEach((f) => { if (!byP.has(f.parentId)) byP.set(f.parentId, []); byP.get(f.parentId).push(f); });
    const plan = [];
    byP.forEach((list, pid) => {
      const taken = new Set(list.map((x) => x.name.toLowerCase()));
      list.forEach((x) => {
        const to0 = fc2CleanName(x.name, fName.get(pid));
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
  // 判定に使う周りの情報
  //   spreadNames … 品番のない同じ名前のファイルが、別々のフォルダに入っている（作品に付いてきた広告）
  //   workDirs    … 作品のフォルダ（フォルダ名か、中のファイル・フォルダに品番がある）
  //   adDirs      … 名前が広告・宣伝のフォルダ（その中身も含む）
  let spreadNames = new Set(), workDirs = new Set(), adDirs = new Set(), dirNames = new Map();
  function prepJunk(files, folders) {
    dirNames = new Map(folders.map((d) => [d.id, d.name]));
    const where = new Map();
    files.forEach((f) => { if (hasWorkId(f.name, dirNames.get(f.parentId))) return; const k = f.name.toLowerCase(); if (!where.has(k)) where.set(k, new Set()); where.get(k).add(f.parentId); });
    spreadNames = new Set([...where].filter(([, s]) => s.size >= 2).map(([k]) => k));
    workDirs = new Set();
    const top = new Set(folders.filter((d) => d.isRoot || d.parentId === 'root' || d.parentId === '').map((d) => d.id)); // 起点・ホーム直下（My Pack 等）は除く
    folders.forEach((d) => { if (hasWorkId(d.name)) { workDirs.add(d.id); if (!top.has(d.parentId)) workDirs.add(d.parentId); } });
    files.forEach((f) => { if (hasWorkId(f.name, dirNames.get(f.parentId)) && !top.has(f.parentId)) workDirs.add(f.parentId); });
    const ad = folders.filter((d) => !d.isRoot && !hasWorkId(d.name) && (AD_WORD.test(d.name) || DOMAIN.test(d.name))).map((d) => d.id);
    adDirs = new Set(folders.filter((d) => (d.trail || []).some((id) => ad.includes(id))).map((d) => d.id));
  }
  function junkInfo(f) {
    const name = String(f.name || '');
    const m = name.match(/^(.*?)(?:\.([A-Za-z0-9]{2,7}))?$/);
    const stem = m[1], ext = (m[2] || '').toLowerCase();
    const id = hasWorkId(name, dirNames.get(f.parentId));
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
        if (opt._nocap) delete hd['x-captcha-token'];
        const { captcha: _c, raw: _r, _cap: _k, _nocap: _n, ...o2 } = opt;
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
        if (/captcha/i.test(String(data.error || '')) || /認証コード/.test(msg)) {
          // 画面から借りた確認用トークンが古くなっただけのことが多い。まず付けずに、次に取り直して試し、それでもだめなら再読み込み
          if (!opt._cap) { cap.captcha = ''; opt = { ...opt, _cap: 1, _nocap: true }; continue; }
          if (opt._cap === 1 && !opt.captcha) { opt = { ...opt, _cap: 2, _nocap: false, captcha: (opt.method || 'GET') + ':/drive/v1' + path.split('?')[0].replace(/^https?:\/\/[^/]+\/drive\/v1/, '') }; continue; }
          log('warn', msg + '（自動で回復します）', where); throw sessionError('認証の確認が必要です（' + msg + '）');
        }
        // 404：ファイル・フォルダがもうない（削除済み）。呼び出し側で「削除済み」と分かるように印を付ける
        if (res.status === 404) { const ge = new Error(msg); ge.status = 404; ge.gone = true; ge.where = where; throw ge; }
        log('error', msg, where);
        const e2 = new Error(msg); e2.status = res.status; throw e2;
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
              } else { scanDiag(f); outFiles.push({ id: f.id, name: f.name, size: +f.size || 0, thumb: f.thumbnail_link || '', ct: f.created_time || '', parentId: cur.id, path: cur.path || '/', ...metaOf(f) }); }
            });
          }).catch((e) => { err = e; }).finally(() => { active--; done++; if (opt.onProgress) opt.onProgress(done, done + queue.length + active, outFiles.length); pump(); });
        }
      };
      pump();
    });
    if (err) throw err;
    // スキャン起点（例：My Pack）自身も仕分け対象にするため登録（名前の変更対象にはしない）
    const rootId = startTrail[startTrail.length - 1];
    const rootName = rootId === 'root' ? 'ホーム' : ((crumbs().pop() || {}).name) || 'スキャン起点';
    outFolders.unshift({ id: rootId, name: rootName, parentId: startTrail.length > 1 ? startTrail[startTrail.length - 2] : '', path: '', trail: startTrail, trailNames: rootId === 'root' ? [] : crumbs().map((c) => c.name), isRoot: true });
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
  #ppdup-btn{touch-action:none;user-select:none;-webkit-user-select:none}
  #ppdup-btn .grip{font-style:normal;color:#8b91a1;letter-spacing:-3px;margin-left:2px;cursor:grab}
  #ppdup-btn.drag{cursor:grabbing;opacity:.9;box-shadow:0 10px 30px #0008;transition:none}
  #pd-fabpos{position:fixed;z-index:100006;width:220px;background:#1d2027;color:#e6e8ee;border:1px solid #2c303a;border-radius:12px;box-shadow:0 12px 40px #0008;padding:8px;display:flex;flex-direction:column;gap:2px;font:13px/1.4 system-ui,"Hiragino Sans","Yu Gothic",sans-serif}
  #pd-fabpos b{font-size:11px;color:#8b91a1;padding:4px 8px}
  #pd-fabpos button{border:0;background:none;color:inherit;font:inherit;text-align:left;padding:8px 10px;border-radius:8px;cursor:pointer}
  #pd-fabpos button:hover{background:#2a2f3a}
  #pd-fabpos small{color:#8b91a1;font-size:11px;padding:4px 8px}
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
  @media (max-width:1200px){#ppdup .pd-quota,#ppdup header .thm{display:none !important}#ppdup header .hbtn[data-a=lang] span,#ppdup header .hbtn[data-a=addlink] span,#ppdup header .hxl span{display:none}#ppdup .hq input{width:120px}}
  @media (max-height:640px){#ppdup{overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}#ppdup main{flex:none;min-height:calc(100vh - 20px);overflow:visible}#ppdup header{padding-top:6px}#ppdup .wm small{display:none}}
  @media (max-width:1600px){#ppdup.treev header .hbtn[data-a=lang] span,#ppdup.treev header .hbtn[data-a=addlink] span,#ppdup.treev header .hxl span{display:none}#ppdup.treev .pd-quota .ql{display:none}#ppdup.treev .pd-quota{width:210px}}
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
  .kit-ex summary{cursor:pointer;font-weight:800;font-size:13px}
  .kit-ex[open] summary{margin-bottom:6px}
  .kit-tabs{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:4px 0 12px}
  .kit-tabs .sp{flex:1}
  .kit-tab{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 14px;border-radius:16px;border:1px solid var(--line);background:var(--panel);color:var(--fg);font:inherit;font-weight:700;cursor:pointer}
  .kit-tab i{font-style:normal;font-size:12px;color:var(--mute)}
  .kit-tab.on{background:var(--pri);border-color:var(--pri);color:#fff}.kit-tab.on i{color:#fff}
  .kit-tab.bad:not(.on){color:var(--danger);border-color:var(--danger)}
  .kit-tabs input[type=search]{height:32px;padding:0 12px;border-radius:16px;border:1px solid var(--ctl-line);background:var(--ctl);color:inherit;font:inherit;width:220px}
  .pd-gh input[type=checkbox]{margin:0 4px 0 0;width:16px;height:16px}
  .kit-row .kit-th{width:80px;height:45px;display:flex;align-items:center;justify-content:center;background:var(--panel2);border-radius:8px;overflow:hidden;flex:none}
  .kit-row .kit-th img{width:100%;height:100%;object-fit:cover}
  .kit-row .kit-ic svg{width:26px;height:26px}
  .kit-row .kit-to{color:var(--pri)}
  .kit-row .kit-err{color:var(--danger);font-size:12px;font-weight:700}
  .kit-row.fail{background:var(--del)}
  .kit-row .kit-tag{flex:none;white-space:nowrap}
  .kit-row .kit-tag.pri{background:var(--pri-soft);color:var(--pri)}
  .kit-row .kit-tag.ok{background:#e3f6ec;color:#17703f}
  .kit-row .kit-tag.warn{background:#fff4dc;color:#8a5600}
  .kit-row .kit-tag.del{background:#fde8e8;color:#b42318}
  .kit-row .kit-open{flex:none;height:30px;padding:0 10px;border:1px solid var(--ctl-line);border-radius:8px;background:var(--ctl);color:inherit;font:inherit;font-size:12px;cursor:pointer}
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
  #ppdup main{flex:1;overflow:auto;padding:14px 18px;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;touch-action:pan-x pan-y;min-height:0}
  #pd-frames .fr-c.ng::before{content:'このコマは取れませんでした';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--mute,#8b91a1)}
  html.pd-blur #ppdup img,html.pd-blur #pd-hover img,html.pd-blur #pd-ql img,html.pd-blur #pd-frames canvas,html.pd-blur #pd-add img,html.pd-blur .pd-sk canvas,html.pd-blur .pd-sk img{filter:blur(14px) saturate(.6);transition:filter .15s}
  html.pd-blur #ppdup .pd-th,html.pd-blur #pd-frames .fr-c{overflow:hidden}
  html.pd-blurhov #ppdup img:hover,html.pd-blurhov #ppdup :hover > img,html.pd-blurhov #pd-ql img:hover,html.pd-blurhov #pd-frames .fr-c:hover canvas,html.pd-blurhov #pd-frames .fr-c:active canvas,html.pd-blurhov #ppdup img:active{filter:none}
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
  .qp-stage{position:relative;overflow:hidden;width:100%;touch-action:pan-x pan-y;cursor:pointer}
  .qp-stage.qp-zoomed{touch-action:none;cursor:grab}
  .qp-stage video{transform-origin:0 0;will-change:transform}
  #pd-lib .lb-pvv .qp-stage{height:100%;display:flex;align-items:center}
  .qp-osd{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);padding:8px 16px;border-radius:10px;background:#000b;color:#fff;font:700 16px system-ui,sans-serif;pointer-events:none;z-index:4;white-space:nowrap}
  .qp-osd[hidden],.qp-mini[hidden]{display:none}
  .qp-mini{position:absolute;right:10px;top:10px;width:96px;aspect-ratio:16/9;border:1px solid #fff9;background:#0007;z-index:4;pointer-events:none}
  .qp-mini i{position:absolute;border:1.5px solid #fff;box-sizing:border-box}
  .qp-badge{position:absolute;left:10px;top:10px;z-index:4;font:700 11px system-ui,sans-serif;padding:2px 8px;border-radius:99px;background:#306fff;color:#fff;opacity:0;transition:opacity .2s;pointer-events:none}
  .qp-on .qp-badge{opacity:.9}
  .qp-on > .qp-stage{box-shadow:inset 0 0 0 2px #306fff}
  .qp-ui{position:relative;background:#000;color:#fff;font:13px/1.4 system-ui,-apple-system,"Hiragino Sans","Yu Gothic UI",sans-serif}
  .qp-ui.qp-on{box-shadow:inset 2px 0 0 #306fff,inset -2px 0 0 #306fff,inset 0 -2px 0 #306fff}
  .qp-ui.qp-auto:not(.qp-on){opacity:.15;transition:opacity .2s}
  .qp-ui .pd-sk{background:transparent}
  .qp-ctl{display:flex;align-items:center;gap:4px;padding:2px 10px 8px;flex-wrap:wrap}
  .qp-ctl button svg{display:block}
  .qp-ctl button{display:inline-flex;align-items:center;justify-content:center;height:30px!important;min-width:30px;padding:0 8px!important;border:0!important;border-radius:6px!important;background:transparent!important;color:#fff!important;font:600 13px system-ui,sans-serif!important;cursor:pointer;line-height:30px}
  .qp-ctl button:hover{background:#ffffff26!important}
  .qp-ctl button[data-qp=gear]{background:#306fff!important}
  .qp-ctl .qp-t{font:12px ui-monospace,monospace;color:#ddd;margin:0 6px;white-space:nowrap}
  .qp-ctl .qp-sp{flex:1}
  .qp-ctl input[type=range]{width:80px;accent-color:#306fff}
  .qp-ctl select{height:28px;border-radius:6px;border:1px solid #ffffff55;background:#000;color:#fff;font:12px system-ui,sans-serif}
  .qp-set{position:absolute;right:10px;bottom:46px;width:300px;max-width:calc(100% - 20px);background:#fff;color:#1c1f26;border-radius:12px;box-shadow:0 12px 30px #0009;padding:12px 14px;z-index:6;display:flex;flex-direction:column;gap:6px;font-size:12px}
  html.pd-dark .qp-set{background:#1d2027;color:#e6e8ee}
  .qp-set[hidden]{display:none}
  .qp-set label{display:flex;align-items:center;gap:8px;justify-content:space-between}
  .qp-set select{width:150px;background:inherit;color:inherit;border:1px solid #c5c9d2}
  .qp-set small{color:#6a7080}
  :fullscreen{background:#000}
  :fullscreen .qp-stage video{max-height:calc(100vh - 140px)!important}
  #pd-player .pl:fullscreen{width:100vw;border-radius:0}
  .pd-sk{position:relative;height:16px;padding:5px 12px;background:#000;cursor:pointer}
  .pd-sk > .sktr{position:relative;height:6px;border-radius:3px;background:#3a3f4b;overflow:hidden}
  .pd-sk:hover > .tr{height:8px;margin-top:-1px}
  .pd-sk > .sktr i{position:absolute;left:0;top:0;bottom:0;width:0}
  .pd-sk .skb{background:#5a6070}
  .pd-sk .skp{background:#306fff}
  .pd-sk > .sktr i.skz{background:#f5a62499;box-shadow:inset 0 0 0 1px #f5a624;z-index:2}
  .pd-sk > .sktr i.ska{width:3px;background:#f5a624;z-index:3}
  .qp-notes{position:absolute;left:12px;top:36px;display:flex;flex-direction:column;align-items:flex-start;gap:6px;z-index:5;pointer-events:none}
  .qp-note{display:flex;align-items:center;gap:10px;padding:7px 8px 7px 12px;border-radius:10px;background:#000c;color:#fff;font:600 12px system-ui,sans-serif;pointer-events:auto;box-shadow:0 4px 14px #0006}
  .qp-note button{font:inherit;font-weight:700;padding:3px 10px;border-radius:7px;border:0;background:#306fff;color:#fff;cursor:pointer}
  .qp-hold{position:absolute;left:50%;top:16px;transform:translateX(-50%);padding:6px 16px;border-radius:999px;background:#000b;color:#fff;font:700 15px system-ui,sans-serif;pointer-events:none;z-index:5}
  .qp-hold[hidden]{display:none}
  .qp-ctl button[data-qp=ab].on{background:#f5a624!important;color:#111!important}
  .qp-ctl button[data-qp=scene].on,.qp-ctl button[data-qp=skim].on{background:#306fff!important}
  .qp-tri{display:flex;align-items:center;gap:8px;padding:8px 12px;background:#14171d;border-top:1px solid #ffffff14;font:12px system-ui,sans-serif;color:#aab;flex-wrap:wrap}
  .qp-tri[hidden]{display:none}
  .qp-tri b{color:#8b91a1;font-weight:700;margin-right:4px}
  .qp-tri button{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border-radius:8px;border:1px solid #ffffff22;background:#232833;color:#dfe2ea;font:600 12px system-ui,sans-serif;cursor:pointer}
  .qp-tri button kbd{font:700 11px ui-monospace,monospace;padding:1px 5px;border-radius:4px;background:#ffffff1a}
  .qp-tri button.k.on{background:#1f3b2c;border-color:#3fbf7f;color:#7fe0a6}
  .qp-tri button.d.on{background:#3d2224;border-color:#e05a5a;color:#ff9b9b}
  .qp-tri button.s.on{background:#3a3320;border-color:#f5a624;color:#f5c46a}
  .qp-tri .sp{flex:1}
  .qp-skim{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);width:min(520px,80%);padding:8px 12px;border-radius:10px;background:#000c;color:#fff;font:600 12px system-ui,sans-serif;z-index:5;pointer-events:none}
  .qp-skim[hidden]{display:none}
  .qp-skim div{display:flex;gap:3px;margin-top:6px}
  .qp-skim i{flex:1;height:6px;border-radius:2px;background:#ffffff2a}
  .qp-skim i.p{background:#306fff}
  .qp-skim i.c{background:#7fb0ff}
  .qp-ctl button[data-qp=sklist]{background:#f5a62433!important;color:#f5c46a!important;font-size:12px}
  .qp-ctl button[data-qp=sklist][hidden]{display:none}
  .qp-ctl button svg.ic,.pl-h button svg.ic,.ql-h button svg.ic,.ql-acts button svg.ic,.qp-scn-h button svg.ic{width:20px;height:20px;display:block;flex:none}
  .pl-h button:has(> svg.ic:only-child),.ql-h button:has(> svg.ic:only-child),.ql-acts button:has(> svg.ic:only-child){min-width:34px;display:inline-flex;align-items:center;justify-content:center}
  .pd-sk > .sktr i.skt{width:2px;background:#ffffffb0;z-index:3}
  .qp-scn{position:absolute;right:0;top:0;bottom:0;width:min(210px,40%);display:flex;flex-direction:column;background:#0d0f14e6;border-left:1px solid #ffffff1a;z-index:6;cursor:default;font:12px system-ui,sans-serif;color:#dfe2ea}
  .qp-scn-h{display:flex;align-items:center;gap:8px;padding:8px 10px;flex:none}
  .qp-scn-h small{color:#8b91a1;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .qp-scn-h button{border:0;background:transparent;color:#dfe2ea;cursor:pointer;font-size:13px}
  .qp-scn-l{flex:1;min-height:0;overflow:auto;padding:0 8px 8px;display:flex;flex-direction:column;gap:6px;overscroll-behavior:contain}
  .qp-scn-l button{display:flex;flex-direction:column;gap:3px;height:auto!important;min-height:0;width:100%;padding:4px;border-radius:8px;border:2px solid transparent;background:transparent;color:inherit;cursor:pointer;text-align:left;font:inherit;flex:none}
  .qp-scn-l button:hover{background:#ffffff14}
  .qp-scn-l button.cur{border-color:#306fff}
  .qp-scn-l .im{width:100%;height:auto;flex:none;display:flex;align-items:center;justify-content:center;aspect-ratio:16/9;border-radius:6px;overflow:hidden;background:#1c212b;color:#6a7080}
  .qp-scn-l .im canvas{width:100%;height:100%;object-fit:cover;display:block}
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
  #pd-lib .lb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(176px,1fr));gap:12px}
  #pd-lib .lb-card{display:flex;flex-direction:column;background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden;cursor:pointer;outline:none;user-select:none}
  #pd-lib .lb-card:hover{border-color:var(--ctl-line)}
  #pd-lib .lb-card.cur,#pd-lib .lb-card:focus-visible{border-color:var(--pri);box-shadow:0 0 0 2px var(--pri-soft)}
  #pd-lib .lb-th{position:relative;aspect-ratio:16/9;background:var(--panel2);display:flex;align-items:center;justify-content:center}
  #pd-lib .lb-th img{width:100%;height:100%;object-fit:cover;display:block}
  #pd-lib .lb-th .ph svg{width:34px;height:42px}
  #pd-lib .lb-prog{position:absolute;left:0;bottom:0;height:4px;background:#306fff;z-index:1}
  #pd-lib .lb-prog.done{background:#8b91a1}
  #pd-lib .lb-tri{position:absolute;right:6px;top:6px;font-size:11px;font-weight:700;padding:2px 7px;border-radius:6px;z-index:1}
  #pd-lib .lb-tri.keep{background:#1f3b2c;color:#7fe0a6}
  #pd-lib .lb-tri.del{background:#3d2224;color:#ff9b9b}
  #pd-lib .lb-li .th .lb-prog{height:3px}
  #pd-lib .lb-th .lb-play{position:absolute;right:6px;bottom:6px;font-size:10px;padding:2px 6px;border-radius:6px;background:#000a;color:#fff}
  #pd-lib .lb-th input{position:absolute;left:6px;top:6px;width:18px;height:18px;margin:0}
  #pd-lib .lb-ct{padding:7px 9px;display:flex;flex-direction:column;gap:2px;min-width:0}
  #pd-lib .lb-ct b{font-size:12px;font-weight:600;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-all}
  #pd-lib .lb-ct small{color:var(--mute);font-size:11px}
  #pd-lib .lk-ft .lb-sel{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-lib button.sub{border-color:transparent;background:none;color:var(--mute);font-weight:500}
  #pd-lib .lb-pv{position:fixed;inset:0;z-index:1;background:#000a;display:flex;align-items:center;justify-content:center}
  /* メインの画面に広げているときは、左メニューに隠れないよう一覧の範囲だけに重ねる */
  #pd-lib.emb .lb-pv{position:absolute;z-index:6}
  #pd-lib.emb .lb-pvbox{max-width:calc(100% - 24px);max-height:calc(100% - 24px)}
  #pd-lib.emb .lb-pvv{flex:0 1 auto;min-height:120px;max-height:none}
  #pd-lib.emb .lb-pvbox > *:not(.lb-pvv){flex:none}
  #pd-lib .lb-pvbox{width:min(960px,96vw);max-height:94vh;display:flex;flex-direction:column;background:var(--panel);border-radius:14px;overflow:hidden;box-shadow:0 18px 50px #0008}
  #pd-lib .lb-pvbox .lk-hd b{font-size:14px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-lib .lb-pvv{position:relative;background:#000;aspect-ratio:16/9;max-height:70vh;display:flex;align-items:center;justify-content:center;color:#ccc}
  #pd-lib .lb-pvv video{width:100%;height:100%;background:#000}
  #pd-lib .lb-pvv .pl-msg{position:absolute;inset:0 0 auto;background:#000b;padding:10px 14px;text-align:center}
  #pd-lib .lb-pvft{display:flex;align-items:center;gap:8px;padding:10px 18px;flex-wrap:wrap}
  #pd-lib .lb-pvft .tx{flex:1 1 300px;min-width:0;color:var(--mute);font-size:12px}
  #pd-lib .lb-pvft .tx b{color:var(--fg)}
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
  #ppdup .pd-rsban{display:flex;align-items:center;gap:12px;padding:10px 18px;background:#fff4dc;color:#5c3d00;border-bottom:1px solid #f0d9a6;font-size:13px}
  #ppdup .pd-rsban[hidden]{display:none}
  #ppdup .pd-rsban .ic{width:28px;height:28px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;flex:none}
  #ppdup .pd-rsban .tx{flex:1;min-width:0;display:flex;flex-direction:column}
  #ppdup .pd-rsban small{opacity:.8}
  #ppdup .pd-rsban button{height:34px;padding:0 14px;border:1px solid #d9b56a;border-radius:17px;background:#fff;color:inherit;font:inherit;font-weight:700;cursor:pointer;white-space:nowrap}
  #ppdup .pd-rsban button.pri{background:#306fff;border-color:#306fff;color:#fff}
  html.pd-dark #ppdup .pd-rsban{background:#3a2c12;color:#f0d9a6;border-color:#5c4518}
  html.pd-dark #ppdup .pd-rsban .ic,html.pd-dark #ppdup .pd-rsban button:not(.pri){background:#252932;border-color:#5c4518}
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
  #pd-add .lk-prog{margin-top:10px;padding:12px 14px;border-radius:12px;background:var(--pri-soft);display:flex;flex-direction:column;gap:6px}
  #pd-add .lk-prog .hd{display:flex;align-items:center;gap:8px}
  #pd-add .lk-prog .sp{flex:1}
  #pd-add .lk-prog .eta{font-size:12px;color:var(--mute);font-weight:700}
  #pd-add .lk-prog .bar{height:6px;border-radius:3px;background:var(--line);overflow:hidden}
  #pd-add .lk-prog .bar i{display:block;height:100%;background:var(--pri);transition:width .3s}
  #pd-add .lk-prog small{color:var(--mute);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-add .lk-prog .spin{width:14px;height:14px;border:2px solid var(--pri);border-right-color:transparent;border-radius:50%;animation:pdspin .8s linear infinite;flex:none}
  @keyframes pdspin{to{transform:rotate(360deg)}}
  /* 項目が多くても一つ一つが縦に押しつぶされないように（一覧だけをスクロール） */
  #pd-add .lk-list > *,#pd-unzip .lk-list > *,#pd-lib .lk-list > *{flex:none}
  #pd-add .lk-box > :not(.lk-list),#pd-unzip .lk-box > :not(.lk-list){flex:none}
  #pd-add .lk-list,#pd-unzip .lk-list{min-height:0}
  #pd-add .lk-done{margin:auto;max-width:560px;width:100%;display:flex;flex-direction:column;align-items:center;gap:8px;padding:24px;text-align:center}
  #pd-add .lk-done .ic{width:56px;height:56px;border-radius:50%;background:#e3f6ec;color:#17703f;font:800 28px/56px system-ui,sans-serif}
  html.pd-dark #pd-add .lk-done .ic{background:#17331f;color:#6fdc9a}
  #pd-add .lk-done b{font-size:17px}
  #pd-add .lk-done small{color:var(--mute);font-size:12px}
  #pd-add .lk-done ul{margin:6px 0 0;padding:10px 14px;list-style:none;width:100%;box-sizing:border-box;background:var(--panel);border:1px solid var(--line);border-radius:12px;text-align:left;font-size:12px}
  #pd-add .lk-done li{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:3px 0}
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
  .tr-h,.tr-row{display:grid;grid-template-columns:var(--tcols,minmax(140px,1fr) 100px 110px) 28px;align-items:center}
  .tr-row .nm{flex:1 1 auto;min-width:40px}
  .tr-row .c-date{color:var(--mute);font-size:12px}
  .tr-h span{position:relative}
  .tr-h .cr{position:absolute;left:-4px;top:4px;bottom:4px;width:8px;cursor:col-resize;z-index:2}
  .tr-h .cr:hover,.tr-h .cr.on{background:linear-gradient(90deg,transparent 3px,var(--pri) 3px,var(--pri) 5px,transparent 5px)}
  .tr-h .c-pick{height:22px;width:24px;padding:0!important;border:0!important;background:transparent!important;color:var(--mute);cursor:pointer;font-size:14px}
  .tr-h .c-pick:hover{color:var(--fg)}
  .pd-colmenu{position:fixed;z-index:2147483646;background:var(--panel);color:var(--fg);border:1px solid var(--line);border-radius:10px;box-shadow:0 10px 30px #0005;padding:8px;display:flex;flex-direction:column;gap:2px;font-size:13px;min-width:180px}
  .pd-colmenu label{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;cursor:pointer}
  .pd-colmenu label:hover{background:var(--panel2)}
  .pd-colmenu small{color:var(--mute);padding:4px 8px}
  /* ---- まとめて整理 ---- */
  #ppdup .op{margin:0 0 18px;padding:16px 18px;border-radius:18px;background:var(--panel);border:1px solid var(--line);display:flex;flex-direction:column;gap:12px}
  #ppdup .op-hd{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}
  #ppdup .op-hd b{font-size:17px}
  #ppdup .op-base{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:12px;background:var(--pri-soft);flex-wrap:wrap}
  #ppdup .op-base span{flex:1 1 300px}
  #ppdup .op-auto{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
  #ppdup .op-a{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:10px 12px;border-radius:12px;border:1px solid var(--line);background:var(--panel2);color:var(--fg);font:inherit;text-align:left;cursor:pointer}
  #ppdup .op-a span{font-size:12px;color:var(--mute)}
  #ppdup .op-a b{font-size:20px}
  #ppdup .op-a b small{font-size:12px;font-weight:600}
  #ppdup .op-a em{font-style:normal;font-size:11px;color:var(--mute)}
  #ppdup .op-a.zero{opacity:.55}
  #ppdup .op-q{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  #ppdup .op-q button{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;border:1px solid var(--line);background:var(--panel2);color:var(--fg);font:inherit;cursor:pointer;white-space:nowrap}
  #ppdup .op-q button i{font-style:normal;font-weight:800;color:#c2561a}
  #ppdup .op-rvs{display:flex;flex-direction:column;gap:8px}
  #ppdup .op-rv{border:1px solid var(--line);border-radius:12px;padding:8px 10px;background:var(--panel2)}
  #ppdup .op-rvh{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  #ppdup .op-rvh .sp{flex:1}
  #ppdup .op-rf{display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:10px;padding:4px 2px;font-size:12px}
  #ppdup .op-rf span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #ppdup .op-rf small{grid-column:1;color:var(--mute);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #ppdup .op-rf em{grid-row:1/3;grid-column:2;font-style:normal;color:var(--mute);align-self:center;white-space:nowrap}
  #ppdup .op-run{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;background:var(--panel2);flex-wrap:wrap}
  #ppdup .op-run .sp{flex:1}
  #ppdup .op button.pri{background:var(--pri);border-color:var(--pri);color:#fff;font-weight:800;padding:9px 16px;border-radius:10px;border:1px solid var(--pri);cursor:pointer}
  #ppdup .op button.pri:disabled{opacity:.45;cursor:default}

  /* ---- 見比べ ---- */
  #pd-cmp{position:fixed;inset:0;z-index:100003;background:#000d;display:flex;align-items:center;justify-content:center;font:13px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI",sans-serif;color:#eee}
  #pd-cmp .cm{width:min(1500px,98vw);max-height:96vh;display:flex;flex-direction:column;background:#111;border-radius:12px;overflow:hidden;box-shadow:0 20px 60px #000}
  #pd-cmp .cm-h{display:flex;align-items:center;gap:8px;padding:8px 10px;background:#1d1f24;flex-wrap:wrap}
  #pd-cmp .cm-h .note{color:#8b91a1}
  #pd-cmp .sp{flex:1}
  #pd-cmp button{font:inherit;background:#2b2e35;color:#eee;border:1px solid #3a3f4b;border-radius:8px;padding:5px 12px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
  #pd-cmp button.on{background:#306fff;border-color:#306fff}
  #pd-cmp button[hidden]{display:none}
  #pd-cmp .qp-tri{display:none}
  #pd-cmp button svg.ic{width:18px;height:18px}
  #pd-cmp button.x{padding:5px 8px}
  #pd-cmp .cm-ps{display:flex;gap:6px;padding:6px;min-height:0;flex:1 1 auto}
  #pd-cmp .cm-p{flex:1 1 0;min-width:0;display:flex;flex-direction:column;background:#000;border-radius:8px;overflow:hidden;box-shadow:0 0 0 2px transparent}
  #pd-cmp .cm-p.keep{box-shadow:0 0 0 2px #3fbf7f}
  #pd-cmp .cm-p.del{box-shadow:0 0 0 2px #e05a5a;opacity:.85}
  #pd-cmp .cm-ph{display:flex;align-items:center;gap:8px;padding:6px 10px;background:#16181d}
  #pd-cmp .cm-ph b{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-cmp .cm-tag{flex:none;font-size:11px;font-weight:700;padding:1px 7px;border-radius:6px;background:#2b2e35;color:#aab}
  #pd-cmp .cm-b{position:relative;flex:1 1 auto;min-height:200px;display:flex;flex-direction:column;justify-content:center}
  #pd-cmp .cm-b .qp-stage video{width:100%;max-height:62vh;display:block;background:#000}
  #pd-cmp .cm-pf{display:flex;align-items:center;gap:8px;padding:8px 10px;background:#16181d}
  #pd-cmp .cm-inf{color:#aab;font-size:12px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-cmp .cm-p.keep .cm-keep{background:#1f3b2c;border-color:#3fbf7f;color:#7fe0a6}
  #pd-cmp .pl-msg{padding:10px 14px;text-align:center;color:#ccc}
  #pd-cmp .pl-err{color:#ff9b9b}
  @media (max-width:899px){#pd-cmp .cm{height:96vh}#pd-cmp .cm-ps{flex-direction:column;overflow:auto}#pd-cmp .cm-p{flex:none}#pd-cmp .cm-b{flex:none}#pd-cmp .cm-b .qp-stage video{max-height:32vh}#pd-cmp .cm-h .note{display:none}}

  /* ---- 下の引き出し（スマホ・狭い画面） ---- */
  #ppdup .pd-sheet{display:none}
  #ppdup.narrow .pd-sheet{display:flex;flex-direction:column;position:absolute;left:0;right:0;bottom:0;z-index:8;background:var(--panel);border-radius:22px 22px 0 0;box-shadow:0 -8px 28px #0006;padding:0 12px calc(12px + env(safe-area-inset-bottom));transform:translateY(var(--shdy,0px));transition:max-height .22s ease;max-height:150px}
  #ppdup.narrow.ios-bar .pd-sheet{padding-bottom:calc(76px + env(safe-area-inset-bottom));max-height:226px}
  #ppdup.narrow.ios-bar main,#ppdup.narrow.ios-bar #pd-lib .lk-list{padding-bottom:200px!important}
  #ppdup.narrow .pd-sheet.covered{display:none}
  #ppdup.narrow .pd-sheet[data-st="1"]{max-height:min(460px,72vh)}
  #ppdup.narrow .pd-sheet[data-st="2"]{max-height:88vh}
  #ppdup .pd-sheet .sh-h{flex:none;display:flex;justify-content:center;align-items:center;height:22px;width:100%;border:0;background:none;padding:0;cursor:grab;touch-action:none}
  #ppdup .pd-sheet .sh-h i{width:44px;height:5px;border-radius:3px;background:var(--mute);opacity:.6}
  #ppdup .pd-sheet .sh-b{flex:none;display:flex;gap:8px;padding:2px 0 8px}
  #ppdup .pd-sheet .sh-b button{flex:1 1 0;min-width:0;height:46px;border-radius:14px;border:1px solid var(--line);background:var(--panel2);color:var(--fg);font:inherit;font-weight:800;font-size:14px;display:flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;overflow:hidden}
  #ppdup .pd-sheet .sh-b button span{overflow:hidden;text-overflow:ellipsis}
  #ppdup .pd-sheet .sh-b button.pri{background:var(--pri);border-color:var(--pri);color:#fff;flex-grow:2}
  #ppdup .pd-sheet .sh-b button.sub{flex:0 0 auto;padding:0 14px}
  #ppdup .pd-sheet button:disabled{opacity:.45}
  #ppdup .pd-sheet .sh-in{flex:1 1 auto;min-height:0;overflow:auto;overscroll-behavior:contain;display:none}
  #ppdup .pd-sheet:not([data-st="0"]) .sh-in{display:block}
  #ppdup .pd-sheet .sh-m{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:6px 0 10px}
  #ppdup .pd-sheet .sh-m button{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 2px;border-radius:12px;border:0;background:var(--panel2);color:var(--fg);font:inherit;font-size:11px;font-weight:700;min-width:0}
  #ppdup .pd-sheet .sh-m button span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #ppdup .pd-sheet .sh-m button svg{width:22px;height:22px}
  #ppdup .pd-sheet svg{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
  #ppdup.narrow #pd-lib .lb-note{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  #ppdup .pd-sheet .sh-m button.on{background:var(--pri-soft);color:var(--pri)}
  #ppdup .pd-sheet .sh-x{display:none;padding-bottom:8px}
  #ppdup .pd-sheet[data-st="2"] .sh-x{display:block}
  #ppdup .pd-sheet .sh-x > b{display:block;font-size:12px;color:var(--mute);margin:6px 2px}
  #ppdup .pd-sheet .sh-x > div{display:flex;flex-wrap:wrap;gap:6px}
  #ppdup .pd-sheet .sh-x button{height:40px;padding:0 14px;border-radius:12px;border:1px solid var(--line);background:var(--panel2);color:var(--fg);font:inherit;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
  #ppdup .pd-sheet .sh-x button.on{background:var(--pri);border-color:var(--pri);color:#fff}
  #ppdup .pd-sheet .sh-x button.red{color:#e05a5a}
  #ppdup .pd-sheet .sh-x button svg{width:18px;height:18px}
  /* 引き出しに移したものは、元の場所では出さない */
  #ppdup.narrow [data-a=navtoggle],#ppdup.narrow .sv-dock,#ppdup.narrow [data-r=tsel],#ppdup.narrow [data-r=tb] .seg,#ppdup.narrow #pd-lib .lk-ft,#ppdup.narrow #pd-lib .lk-hd > button:not(.x),#ppdup.narrow #pd-lib .lk-hd > .seg,#ppdup.narrow #pd-lib .lk-hd .seg{display:none!important}
  #ppdup.narrow main,#ppdup.narrow #pd-lib .lk-list{padding-bottom:120px!important}
  #ppdup.narrow .prog{margin-bottom:0}
  @media (max-width:599px){
    #pd-add .lk-hd{flex-wrap:wrap;row-gap:8px}
    #pd-add .lk-hd > b{white-space:nowrap;flex:1 1 calc(100% - 60px)}
    #pd-add .lk-hd > .sp{display:none}
    #pd-add .lk-hd > .x{order:1}
    #pd-add .lk-hd > .note{order:2;white-space:nowrap;flex:none}
    #pd-add .lk-hd > select{order:3;flex:1 1 0;min-width:0;max-width:none}
    #ppdup .wm .gw i{display:none}
  }

  /* 文字が 1 文字ずつ縦に折り返さないように（ロゴ・切り替え・ボタンは 1 行のまま） */
  #ppdup .wm,#ppdup .wm *,#ppdup .seg button,#ppdup .hbtn,#ppdup [data-r=tb] button{white-space:nowrap}
  #ppdup .brand h1.wm{flex:none}
  /* スマホ（〜599px）：上のバーは アイコン＋Dedupe と最小限のボタン。検索は 2 行目に横いっぱい */
  @media (max-width:599px){
    #ppdup header .brand{flex-wrap:wrap!important;row-gap:8px}
    #ppdup header .brand > *{flex-shrink:0}
    #ppdup .wm small{display:none}
    #ppdup .wm .gw{font-size:20px}
    #ppdup header .hq{order:10;flex:1 1 calc(100% - 180px)!important;min-width:0;width:auto!important;max-width:none!important}
    #ppdup header .brand > .sp,#ppdup header .brand > span:empty{display:none}
    #ppdup header .hqs{order:11;flex:none}
    #ppdup header [data-a=edgescroll],#ppdup header [data-a=lang],#ppdup header .brand > [data-a=addlink],#ppdup header [data-a=settings]{display:none!important}
    #ppdup [data-r=tb]{flex-wrap:wrap!important;gap:6px}
    #ppdup [data-r=tb] .tr-path{flex:1 1 100%;min-width:0}
    #ppdup .tr-hint,#ppdup [data-r=tacts] .note{display:none}
  }
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
  #pd-player video{width:100%;max-height:calc(100vh - 150px);display:block;background:#000}
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
  /* 追加したもの〜ゴミ箱：メインの画面に広げて表示 */
  #ppdup.libv > main,#ppdup.libv > .tb,#ppdup.libv > .tsel,#ppdup.libv header nav{display:none!important}
  #pd-lib.emb{position:relative;inset:auto;z-index:1;flex:1 1 auto;min-height:0;display:flex;align-items:stretch;justify-content:stretch;background:var(--bg)}
  #pd-lib.emb .lk-box{width:100%;max-height:none;flex:1;border-radius:0;box-shadow:none;background:var(--bg)}
  #pd-lib.emb .lk-hd{background:var(--panel);flex-wrap:wrap;row-gap:8px}
  #pd-lib .lk-hd > b{white-space:nowrap;flex:none}
  #pd-lib.emb .lb-tabs,#pd-lib.emb .lb-note{background:var(--panel)}
  #pd-lib.emb .lk-list{padding:16px 22px;flex:1 1 auto;min-height:0}
  #pd-lib .lk-box > .lk-hd,#pd-lib .lk-box > .lb-tabs,#pd-lib .lk-box > .lb-note,#pd-lib .lk-box > .lk-ft{flex:none}
  #pd-lib.emb .lk-ft{background:var(--panel)}
  #pd-lib .lb-grid.sz-s{grid-template-columns:repeat(auto-fill,minmax(180px,1fr))}
  #pd-lib .lb-grid.sz-m{grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
  #pd-lib .lb-grid.sz-l{grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:18px}
  #pd-lib .lb-grid.sz-l .lb-ct b{font-size:14px}
  #pd-lib .lb-tree{display:flex;flex-direction:column;gap:2px;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:6px}
  #pd-lib .lb-tn{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:8px;cursor:pointer;user-select:none;font-size:13px}
  #pd-lib .lb-tn:hover{background:var(--panel2)}
  #pd-lib .lb-tn .tw{width:12px;color:var(--mute);font-size:11px}
  #pd-lib .lb-tn .fi svg{width:18px;height:16px;display:block}
  #pd-lib .lb-tn b{font-weight:700;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-lib .lb-tn .nn{color:var(--mute);font-size:12px;margin-left:auto}
  #pd-lib .lb-tf .lb-li{border-color:transparent;background:transparent}
  #pd-lib .lb-tf .lb-li:hover{background:var(--panel2)}
  #pd-lib .lb-tf .lb-li.cur{background:var(--pri-soft);border-color:var(--pri)}
  #pd-lib .lb-lst{display:flex;flex-direction:column;gap:4px}
  #pd-lib .lb-grp{display:flex;flex-direction:column;gap:4px;margin-bottom:14px}
  #pd-lib .lb-gh{display:flex;align-items:center;gap:8px;font-weight:800;font-size:13px;padding:4px 2px}
  #pd-lib .lb-gh span{color:var(--mute);font-weight:500;font-size:12px}
  #pd-lib .lb-li{display:flex;align-items:center;gap:12px;padding:6px 10px;background:var(--panel);border:1px solid var(--line);border-radius:10px;cursor:pointer;outline:none;user-select:none}
  #pd-lib .lb-li:hover{border-color:var(--ctl-line)}
  #pd-lib .lb-li.cur,#pd-lib .lb-li:focus-visible{border-color:var(--pri);box-shadow:0 0 0 2px var(--pri-soft)}
  #pd-lib .lb-li .th{position:relative;width:64px;height:36px;flex:none;border-radius:6px;overflow:hidden;background:var(--panel2);display:flex;align-items:center;justify-content:center}
  #pd-lib .lb-li.thumb .th{width:192px;height:108px;border-radius:8px}
  #pd-lib .lb-li .th img{width:100%;height:100%;object-fit:cover}
  #pd-lib .lb-li .th .ph svg{width:22px;height:26px}
  #pd-lib .lb-li .th .lb-play{position:absolute;right:4px;bottom:4px;font-size:9px;padding:1px 5px;border-radius:5px;background:#000a;color:#fff}
  #pd-lib .lb-li .nm{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
  #pd-lib .lb-li .nm b{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-lib .lb-li.thumb .nm b{font-size:14px;white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
  #pd-lib .lb-li .nm small{color:var(--mute);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-lib .lb-li .sz{width:80px;text-align:right;color:var(--mute);font-size:12px;flex:none}
  #pd-lib .lb-li .dt{width:110px;text-align:right;color:var(--mute);font-size:12px;flex:none}
  #pd-lib .lb-li input{margin:0}
  #pd-lib [data-lbauto].on{background:var(--pri-soft);border-color:var(--pri);color:var(--pri)}
  #pd-lib .lb-vw button.on,#pd-lib .lb-sz button.on{background:var(--pri);border-color:var(--pri);color:#fff}
  /* 共通の型（StepKit） */
  #ppdup .kit-ex{padding:10px 16px}
  #ppdup .kit-ex summary{cursor:pointer;font-weight:800;font-size:13px;color:var(--pri)}
  #ppdup .kit-ex .note{margin-top:6px}
  #ppdup .kit-tabs{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 12px}
  #ppdup .kit-tab{height:34px;padding:0 14px;border:1px solid var(--line);border-radius:17px;background:var(--panel);color:var(--fg);font:inherit;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:8px}
  #ppdup .kit-tab i{font-style:normal;font-size:12px;color:var(--mute)}
  #ppdup .kit-tab.on{background:var(--pri);border-color:var(--pri);color:#fff}
  #ppdup .kit-tab.on i{color:#fffc}
  #ppdup .kit-tab.bad:not(.on){border-color:var(--danger);color:var(--danger)}
  #ppdup .kit-tabs .sp{flex:1}
  #ppdup .kit-tabs input[type=search]{height:34px;width:220px;max-width:100%;box-sizing:border-box;padding:0 14px;border:1px solid var(--ctl-line);border-radius:17px;background:var(--ctl);color:inherit;font:inherit}
  #ppdup .pd-gh input[type=checkbox]{margin:0 4px 0 0;width:16px;height:16px}
  #ppdup .kit-row{align-items:center}
  #ppdup .kit-th{width:64px!important;height:40px!important;display:flex;align-items:center;justify-content:center;flex:none}
  #ppdup .kit-th .kit-ic svg{width:24px;height:28px}
  #ppdup .kit-to{color:var(--pri)}
  #ppdup .kit-err{color:var(--danger);font-size:12px;font-weight:700;margin-top:2px}
  #ppdup .kit-row.fail{box-shadow:inset 3px 0 0 var(--danger)}
  #ppdup .kit-tag{white-space:nowrap}
  #ppdup .kit-tag.pri{background:var(--pri-soft);color:var(--pri)}
  #ppdup .kit-tag.ok{background:#e3f6ec;color:#17703f}
  #ppdup .kit-tag.warn{background:#fff4dc;color:#8a5600}
  #ppdup .kit-tag.del{background:#fde8e8;color:#b42318}
  html.pd-dark #ppdup .kit-tag.ok{background:#17331f;color:#6fdc9a}
  html.pd-dark #ppdup .kit-tag.warn{background:#3a2c12;color:#f0c46c}
  html.pd-dark #ppdup .kit-tag.del{background:#3a1a1a;color:#ff8a80}
  #ppdup .kit-open{flex:none;height:30px;padding:0 10px;border:1px solid var(--ctl-line);border-radius:8px;background:var(--ctl);color:inherit;font:inherit;font-size:12px;cursor:pointer}
  /* ===== v4.1：デリログ風の見た目（丸み・やわらかい色・左の常設メニュー・ダッシュボード） ===== */
  #ppdup{--rf:"Hiragino Maru Gothic ProN","Hiragino Maru Gothic Pro","M PLUS Rounded 1c","Kosugi Maru","Yu Gothic UI","Hiragino Sans","Meiryo",system-ui,sans-serif;font-family:var(--rf)}
  #ppdup:not(.pop):not(.narrow){padding-left:236px}
  #ppdup:not(.pop):not(.narrow) .rail{box-sizing:border-box;width:236px;align-items:stretch;padding:14px 12px 12px;background:var(--panel);gap:2px}
  #ppdup:not(.pop):not(.narrow) .rail > button:not(.rl-sub):not(.rl-acct){width:auto;flex-direction:row;justify-content:flex-start;gap:12px;padding:10px 12px;border-radius:12px;font-size:14px;font-weight:800;color:var(--fg);text-align:left}
  #ppdup:not(.pop):not(.narrow) .rail > button span{flex:1}
  #ppdup:not(.pop):not(.narrow) .rail svg{width:20px;height:20px;color:var(--mute)}
  #ppdup:not(.pop):not(.narrow) .rail button.on{background:var(--pri-soft);color:var(--pri)}
  #ppdup:not(.pop):not(.narrow) .rail button.on svg{color:var(--pri)}
  #ppdup:not(.pop):not(.narrow) .rail .rb{position:static;font-size:11px;line-height:18px;min-width:18px;padding:0 6px;font-weight:800}
  #ppdup .rail .rl-sep{height:1px;background:var(--line);margin:10px 6px;flex:none}
  #ppdup .rail .rl-sub{width:auto!important;flex-direction:row!important;padding:7px 12px!important;font-size:12px!important;font-weight:700;color:var(--mute)!important;text-align:left;border-radius:10px}
  #ppdup .rail .rl-acct{margin-top:auto;width:auto!important;flex-direction:row!important;align-items:center!important;gap:10px!important;padding:10px 12px!important;border:1px solid var(--line)!important;border-radius:16px!important;text-align:left;color:var(--fg)!important}
  #ppdup .rail .rl-acct i{width:34px;height:34px;flex:none;border-radius:50%;background:var(--panel2);display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px var(--ok)}
  #ppdup .rail .rl-acct.ng i{box-shadow:0 0 0 2px var(--danger)}
  #ppdup .rail .rl-acct svg{width:18px!important;height:18px!important}
  #ppdup .rail .rl-acct span{display:flex!important;flex-direction:column;min-width:0}
  #ppdup .rail .rl-acct b{font-size:12px}
  #ppdup .rail .rl-acct small{font-size:11px;color:var(--ok);font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #ppdup .rail .rl-acct.ng small{color:var(--danger)}
  #ppdup .rail .rl-acct small.t{color:var(--mute);font-weight:500}
  #ppdup.narrow .rail .rl-acct small{white-space:normal}
  /* アイコンだけ（☰ でたたむ）・ポップアップ */
  #ppdup.navmin:not(.pop):not(.narrow){padding-left:78px}
  #ppdup.navmin:not(.pop):not(.narrow) .rail{width:78px;align-items:center;padding:12px 0 10px}
  #ppdup.navmin:not(.pop):not(.narrow) .rail > button:not(.rl-sub):not(.rl-acct){width:56px;flex-direction:column;justify-content:center;padding:10px 0;font-size:0}
  #ppdup.navmin:not(.pop):not(.narrow) .rail > button span{display:none}
  #ppdup.navmin:not(.pop):not(.narrow) .rail .rb{position:absolute;top:3px;right:4px;font-size:10px;line-height:15px;min-width:15px;padding:0 4px}
  #ppdup .rail .rl-sub{gap:10px;align-items:center}
  #ppdup .rail .rl-sub svg{width:18px!important;height:18px!important;flex:none}
  /* アイコンだけの表示でも、ログ・書き出し・更新履歴をアイコンで出す（名前はマウスを乗せると出る） */
  #ppdup.navmin:not(.pop):not(.narrow) .rail .rl-sub{width:56px!important;justify-content:center;padding:9px 0!important}
  #ppdup.navmin:not(.pop):not(.narrow) .rail .rl-sub span{display:none}
  #ppdup.pop .rail .rl-sub,#ppdup.pop .rail .rl-sep{display:none!important}
  /* マウスを乗せたときの説明（アイコンだけのボタン用。すぐ出る） */
  #pd-tip{position:fixed;z-index:2147483647;max-width:280px;padding:6px 10px;border-radius:8px;background:#11141a;color:#fff;font:600 12px/1.45 system-ui,-apple-system,'Hiragino Sans',sans-serif;box-shadow:0 6px 18px #0006;pointer-events:none;white-space:normal}
  #pd-tip[hidden]{display:none}
  #ppdup.navmin .rail .rl-acct,#ppdup.pop .rail .rl-acct{border:0!important;padding:6px!important}
  #ppdup.navmin .rail .rl-acct span,#ppdup.pop .rail .rl-acct span{display:none!important}
  #ppdup.pop [data-a=navtoggle]{display:none}
  /* 隠す */
  #ppdup.navhide:not(.pop):not(.narrow){padding-left:18px}
  #ppdup.navhide:not(.pop):not(.narrow) .rail{display:none}
  /* ドラッグ中は幅を指で追う */
  #ppdup.navdrag:not(.pop):not(.narrow){padding-left:var(--navw)!important}
  #ppdup.navdrag:not(.pop):not(.narrow) .rail{display:flex!important;width:var(--navw)!important;overflow:hidden}
  #ppdup.navdrag{user-select:none;cursor:ew-resize}
  /* つまみ（デリログの引き出しと同じ考え方。縦の短い線） */
  #ppdup .rl-grip{position:absolute;top:50%;left:236px;transform:translate(-50%,-50%);z-index:7;width:18px;height:64px;padding:0;border:1px solid var(--line);border-radius:10px;background:var(--panel);box-shadow:0 2px 8px #0003;cursor:ew-resize;display:flex;align-items:center;justify-content:center;touch-action:none}
  #ppdup .rl-grip i{width:4px;height:34px;border-radius:2px;background:var(--mute);opacity:.7}
  #ppdup .rl-grip:hover i{background:var(--pri);opacity:1}
  #ppdup.navmin .rl-grip{left:78px}
  #ppdup.navhide .rl-grip{left:0;transform:translate(0,-50%);border-left:0;border-radius:0 10px 10px 0;width:16px}
  #ppdup.navdrag .rl-grip{left:var(--navw)}
  #ppdup.pop .rl-grip,#ppdup.narrow .rl-grip{display:none}
  /* PC では引き出しのつまみで出し入れするので ☰ は出さない（スマホ・狭い画面では ☰ でメニューを開く） */
  #ppdup:not(.narrow) [data-a=navtoggle]{display:none}
  #ppdup.pop header .thm,#ppdup.pop header .hbtn[data-a=lang],#ppdup.pop .hbtn.hacct > span,#ppdup.pop header .wbtn-full > span{display:none!important}
  #ppdup.pop .hbtn.hacct{padding:0 5px!important}
  /* 狭い画面・スマホ：左メニューは ☰ で右から出す */
  #ppdup.narrow{padding-left:0!important}
  #ppdup.narrow .rail{display:none}
  #ppdup.narrow.navopen::before{content:"";position:absolute;inset:0;background:#1e243066;z-index:5}
  #ppdup.narrow.navopen .rail{box-sizing:border-box;display:flex;position:absolute;left:auto;right:0;top:0;bottom:0;width:min(300px,86vw);z-index:6;align-items:stretch;padding:16px 14px;background:var(--panel);box-shadow:-10px 0 30px #0003;gap:2px}
  #ppdup.narrow.navopen .rail > button:not(.rl-sub):not(.rl-acct){width:auto;flex-direction:row;justify-content:flex-start;gap:12px;padding:12px;border-radius:12px;font-size:15px;font-weight:800;color:var(--fg)}
  #ppdup.narrow.navopen .rail > button:not(.rl-acct) > span{display:block!important;flex:1;text-align:left}
  #ppdup.narrow.navopen .rail .rb{position:static}
  /* 上のバー */
  #ppdup header{border-bottom:1px solid var(--line)}
  #ppdup .hbtn{border-radius:12px!important;border:1px solid var(--line)!important;background:var(--panel)!important}
  #ppdup header .hbtn[data-a=lang] > span,#ppdup header .brand > .hbtn[data-a=addlink] > span{display:none}
  #ppdup header .hbtn[data-a=lang],#ppdup header .brand > .hbtn[data-a=addlink]{width:38px;padding:0!important;justify-content:center}
  @media (max-width:1500px){#ppdup header .hbtn[data-a=settings] > span,#ppdup header .hxl > span{display:none}#ppdup header .hbtn[data-a=settings],#ppdup header .hxl{width:38px;padding:0!important;justify-content:center}}
  #ppdup.narrow header .thm,#ppdup.narrow header .hbtn[data-a=lang],#ppdup.narrow header .brand > .hbtn[data-a=addlink],#ppdup.narrow header .hbtn[data-a=settings]{display:none!important}
  #ppdup.narrow .hbtn.hacct > span{display:none}
  #ppdup.narrow .brand .ver,#ppdup.narrow .wm small{display:none!important}
  #ppdup.narrow .brand{flex-wrap:nowrap}
  #ppdup.narrow .brand .sp{flex:1}
  #ppdup:not(.pop) header .pd-quota{flex:0 1 210px;width:210px}
  #ppdup:not(.pop) header .pd-quota .ql{display:none}
  @media (max-width:1700px){#ppdup:not(.pop) header .thm,#ppdup:not(.pop) header .hbtn[data-a=lang]{display:none!important}#ppdup:not(.pop) header .hq input{width:150px}}
  @media (max-width:1500px){#ppdup:not(.pop) header .hbtn.hacct > span,#ppdup:not(.pop) header .brand .ver{display:none}#ppdup:not(.pop) header .hbtn.hacct{padding:0 5px!important}}
  #ppdup .hbtn[data-a=edgescroll].on{background:var(--pri-soft)!important;border-color:var(--pri)!important;color:var(--pri)}
  #ppdup .hbtn.hic{width:38px;padding:0!important;justify-content:center}
  #ppdup .hbtn.hacct{border-radius:20px!important;padding:0 12px 0 5px!important;gap:6px}
  #ppdup .hbtn.hacct svg{width:26px!important;height:26px!important;padding:4px;box-sizing:border-box;border-radius:50%;background:var(--panel2);box-shadow:0 0 0 2px var(--ok)}
  #ppdup .hbtn.hacct.ng svg{box-shadow:0 0 0 2px var(--danger)}
  #ppdup .hbtn.hacct.ng{color:var(--danger)}
  #pd-acct{position:fixed;z-index:100006;width:280px;background:var(--panel,#fff);color:var(--fg,#1c1f26);border:1px solid var(--line,#dde0e6);border-radius:16px;box-shadow:0 14px 40px #0003;padding:14px 16px;display:flex;flex-direction:column;gap:6px;font:13px/1.5 system-ui,"Hiragino Sans",sans-serif}
  html.pd-dark #pd-acct{background:#1d2027;color:#e6e8ee;border-color:#2c303a}
  #pd-acct small{color:#6a7080;font-size:12px}
  #pd-acct .ln{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #8881}
  #pd-acct .acts{display:flex;gap:8px;margin-top:6px}
  #pd-acct button{flex:1;height:34px;border:1px solid #c5c9d2;border-radius:17px;background:none;color:inherit;font:inherit;font-weight:700;cursor:pointer}
  #pd-acct button:disabled{opacity:.45}
  /* ダッシュボード */
  #ppdup .db{display:flex;flex-direction:column;gap:16px;max-width:1400px;padding-bottom:10px}
  #ppdup .db-main{margin-bottom:6px}
  #ppdup .db-hd{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  #ppdup .db-hd h2{margin:0 6px 0 0;font-size:21px;font-weight:800}
  #ppdup .db-hd .sp{flex:1}
  #ppdup .db-chip{height:32px;padding:0 14px;border-radius:16px;display:inline-flex;align-items:center;font-weight:800;border:1px solid var(--line);background:var(--panel)}
  #ppdup .db-chip.on{background:var(--pri);border-color:var(--pri);color:#fff}
  #ppdup .db-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
  #ppdup .db-st{background:var(--panel);border-radius:18px;padding:14px 18px;box-shadow:0 2px 10px #0000000d;display:flex;flex-direction:column;gap:2px;min-width:0}
  #ppdup .db-st span{font-size:12px;color:var(--mute)}
  #ppdup .db-st b{font-size:28px;font-weight:800;line-height:1.2}
  #ppdup .db-st b small{font-size:13px}
  #ppdup .db-st.pri b{color:var(--pri)}
  #ppdup .db-st em{font-style:normal;font-size:11px;color:var(--mute);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #ppdup .db-main{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:14px;align-items:start}
  #ppdup .db-tasks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
  #ppdup .db-tk{display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:14px 16px;border:0;border-radius:18px;background:var(--tk-bg);color:#1e2430;font:inherit;text-align:left;cursor:pointer;transition:transform .1s}
  #ppdup .db-tk:hover{transform:translateY(-1px);box-shadow:0 4px 14px #0000001a}
  #ppdup .db-tk .n{width:24px;height:24px;border-radius:50%;background:#fff;color:var(--tk-fg);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800}
  #ppdup .db-tk b{font-size:15px}
  #ppdup .db-tk em{font-style:normal;font-size:12px;color:#4a5160}
  #ppdup .db-tk .go{margin-top:2px;font-size:13px;font-weight:800;color:var(--tk-fg)}
  #ppdup .db-tk.zero{background:var(--panel);box-shadow:inset 0 0 0 1px var(--line);color:var(--fg)}
  #ppdup .db-tk.zero em{color:var(--mute)}
  #ppdup .db-tk.zero .n{background:var(--panel2)}
  #ppdup .db-tk.next{box-shadow:0 0 0 2px var(--tk-fg)}
  html.pd-dark #ppdup .db-tk:not(.zero){filter:brightness(.92)}
  #ppdup .db-card{background:var(--panel);border-radius:18px;padding:14px 18px;box-shadow:0 2px 10px #0000000d;display:flex;flex-direction:column;gap:10px}
  #ppdup .db-ct{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:800}
  #ppdup .db-ct > i{width:8px;height:8px;border-radius:50%;background:var(--ok)}
  #ppdup .db-ct .sp{flex:1}
  #ppdup .db-ct .lnk{border:0;background:none;color:var(--pri);font:inherit;font-size:12px;font-weight:800;cursor:pointer}
  #ppdup .db-ths{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
  #ppdup .db-th{display:flex;flex-direction:column;gap:3px;padding:0;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;min-width:0}
  #ppdup .db-th .im{aspect-ratio:16/10;border-radius:10px;background:var(--panel2);overflow:hidden;display:flex;align-items:center;justify-content:center}
  #ppdup .db-th .im img{width:100%;height:100%;object-fit:cover}
  #ppdup .db-th .im svg{width:28px;height:34px}
  #ppdup .db-th b{font-size:11px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #ppdup .db-th small{font-size:10px;color:var(--mute)}
  /* 右下のボタン群（狭い画面では、下から出るメニュー） */
  #ppdup .sv-dock{position:sticky;bottom:0;align-self:flex-end;display:flex;flex-direction:column;gap:10px;padding:8px;border-radius:30px;background:var(--panel);box-shadow:0 10px 30px #0000002a;z-index:3}
  #ppdup .sv-dock .dk-h,#ppdup .sv-dock .dk-q{display:none}
  #ppdup .sv-dock .dk-b{display:flex;gap:10px}
  #ppdup .sv-dock button{height:44px;padding:0 18px;border:1px solid var(--line);border-radius:22px;background:var(--panel);color:var(--fg);font:inherit;font-size:14px;font-weight:800;cursor:pointer;white-space:nowrap}
  #ppdup .sv-dock button.pri{background:var(--pri);border-color:var(--pri);color:#fff}
  @media (max-width:1100px){#ppdup .db-stats{grid-template-columns:repeat(2,minmax(0,1fr))}#ppdup .db-main{grid-template-columns:1fr}}
  #ppdup.narrow .db-tasks{grid-template-columns:1fr 1fr}
  #ppdup.narrow .db-hd .note{display:none}
  #ppdup.narrow .db{padding-bottom:90px}
  #ppdup.narrow .sv-dock{position:fixed;left:0;right:0;bottom:0;align-self:auto;border-radius:24px 24px 0 0;padding:6px 14px 16px}
  #ppdup.narrow .sv-dock .dk-h{display:flex;justify-content:center;height:18px;border:0;padding:0;background:none}
  #ppdup.narrow .sv-dock .dk-h i{width:44px;height:5px;border-radius:3px;background:var(--ctl-line)}
  #ppdup.narrow .sv-dock .dk-b{flex-wrap:wrap}
  #ppdup.narrow .sv-dock .dk-b button{flex:1 1 40%;height:48px;border-radius:24px}
  #ppdup.narrow .sv-dock .dk-b button.pri{flex-basis:100%;order:-1}
  #ppdup.narrow .sv-dock.open .dk-q{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
  #ppdup .sv-dock .dk-q button{height:auto;padding:12px 8px;border-radius:16px;display:flex;flex-direction:column;align-items:flex-start;gap:2px;background:var(--panel2);border:0}
  #ppdup .sv-dock .dk-q small{font-size:11px;color:var(--mute);font-weight:500}
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
  // ---- 共通のアイコン部品 ----
  //   決まり：アイコンは文字（⚙ ✕ ⛶ など）ではなくこの IC の絵を使う（端末のフォントで小さく潰れるため）。
  //           アイコンだけのボタンには必ず title（マウスを乗せたときの説明）を付ける。大きさは 20px が基本
  const SVG = (d) => `<svg class="ic" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const IC = {
    gear: SVG('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    sun: SVG('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    moon: SVG('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'),
    globe: SVG('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9M12 3C9.5 5.6 8.2 8.6 8.2 12s1.3 6.4 3.8 9"/>'),
    x: SVG('<path d="M6 6l12 12M18 6L6 18"/>'),
    play: SVG('<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>'),
    pause: SVG('<path d="M7 4.5h3.5v15H7zM13.5 4.5H17v15h-3.5z" fill="currentColor" stroke="none"/>'),
    prev: SVG('<path d="M6 5v14"/><path d="M19 5.5v13L9 12z" fill="currentColor"/>'),
    next: SVG('<path d="M18 5v14"/><path d="M5 5.5v13L15 12z" fill="currentColor"/>'),
    vol: SVG('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>'),
    mute: SVG('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>'),
    full: SVG('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
    search: SVG('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
    up: SVG('<path d="M12 19V5M5 12l7-7 7 7"/>'),
    folder: SVG('<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h8.5A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/>'),
    dedupe: SVG('<rect x="3" y="4" width="11" height="13" rx="2"/><path d="M8 8h11a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H10"/>'),
    alert: SVG('<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/>'),
    expand: SVG('<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>'),
    minus: SVG('<path d="M6 12h12"/>'),
    link: SVG('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2"/>'),
  };
  const btn = document.createElement('button'); btn.id = 'ppdup-btn'; btn.innerHTML = LOGO + '<span>Dedupe</span><i class="grip" aria-hidden="true">⋮⋮</i>'; btn.title = 'PikPak Distill – Dedupe（クリックでメニュー・ドラッグで移動・右クリックで置き場所）'; document.body.appendChild(btn);
  const fab = document.createElement('div'); fab.id = 'ppdup-fab'; document.body.appendChild(fab);
  const root = document.createElement('div'); root.id = 'ppdup';
  root.innerHTML = `
    <aside class="rail" data-r="rail">
      <button data-a="toflow" data-rail="flow" title="整理（1〜7のステップ）"><svg viewBox="0 0 24 24"><path d="M4 6h10M4 12h16M4 18h7" /><circle cx="18" cy="6" r="2"/><circle cx="15" cy="18" r="2"/></svg><span>整理</span></button>
      <button data-a="tree" data-rail="tree" title="フォルダ一覧（Finder やエクスプローラーのように、フォルダを開いて中身を見られます）"><svg viewBox="0 0 24 24"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h8.5A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/><path d="M7 11h10M7 15h6"/></svg><span>フォルダ​一覧</span></button>
      <button data-a="lib" data-v="dl" data-rail="lib-dl" title="追加したもの（リンク・マグネットで追加した作品の保存状況とダウンロードの進み具合）"><svg viewBox="0 0 24 24"><path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 8.5a4 4 0 0 1-.5 7.97"/><path d="M12 11v9M8.8 17l3.2 3 3.2-3"/></svg><span>追加したもの</span><i class="rb" data-r="rb-dl"></i></button>
      <button data-a="lib" data-v="recent" data-rail="lib-recent" title="最近追加したもの（追加日の新しい順）"><svg viewBox="0 0 24 24"><circle cx="11" cy="12" r="7.5"/><path d="M11 8v4.2l2.6 1.6"/><path d="M19.5 3.5v4M17.5 5.5h4"/></svg><span>最近の追加</span><i class="rb" data-r="rb-recent"></i></button>
      <button data-a="lib" data-v="cont" data-rail="lib-cont" title="続きを見る（途中で止めた動画）"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M10 8.5v5l4-2.5z"/><path d="M3 20.5h11" stroke-width="2.4"/></svg><span>続きを見る</span></button>
      <button data-a="lib" data-v="cand" data-rail="lib-cand" title="消す候補（見ながら仕分けで D を付けたもの）"><svg viewBox="0 0 24 24"><path d="M5 7h14M9.5 7V5h5v2"/><path d="M7 7l.8 12.2A1.5 1.5 0 0 0 9.3 20.6h5.4a1.5 1.5 0 0 0 1.5-1.4L17 7"/><path d="M10 11.5l4 4M14 11.5l-4 4"/></svg><span>消す候補</span><i class="rb" data-r="rb-cand"></i></button>
      <button data-a="lib" data-v="hist" data-rail="lib-hist" title="再生した履歴"><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/><path d="M10.5 9.2v5.6l4.4-2.8z"/></svg><span>再生履歴</span><i class="rb" data-r="rb-hist"></i></button>
      <button data-a="lib" data-v="star" data-rail="lib-star" title="スター付き"><svg viewBox="0 0 24 24"><path d="M12 3.8l2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8z"/></svg><span>スター</span><i class="rb" data-r="rb-star"></i></button>
      <button data-a="lib" data-v="trash" data-rail="lib-trash" title="ゴミ箱（中身を見る・元に戻す・完全に削除）"><svg viewBox="0 0 24 24"><path d="M4 7h16M9.5 7V4.8h5V7"/><path d="M6 7l1 12.2A1.5 1.5 0 0 0 8.5 20.6h7a1.5 1.5 0 0 0 1.5-1.4L18 7"/><path d="M10 11v6M14 11v6"/></svg><span>ゴミ箱</span><i class="rb" data-r="rb-trash"></i></button>
      <button data-a="addlink" data-rail="add" title="リンク・マグネットを追加"><svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2"/></svg><span>リンク</span></button>
      <button data-a="rescan" data-rail="scan" title="最新の状態を読み込み直す"><svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/></svg><span>再読み込み</span></button>
      <button data-a="settings" data-rail="set" title="設定（表示・再生・整理・情報）"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg><span>設定</span></button>
      <div class="rl-sep"></div>
      <button class="rl-sub" data-a="log" title="ログを見る・不具合を報告する"><svg viewBox="0 0 24 24"><path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20z"/><path d="M14 3.5V8h4M10 12h5M10 15.5h5"/></svg><span>ログ・不具合の報告</span></button>
      <button class="rl-sub" data-a="setinfo" title="設定や記録を書き出す・読み込む"><svg viewBox="0 0 24 24"><path d="M8 4v12M4.5 12.5L8 16l3.5-3.5"/><path d="M16 20V8M12.5 11.5L16 8l3.5 3.5"/></svg><span>書き出し／読み込み</span></button>
      <button class="rl-sub" data-a="changelog" title="更新履歴（いまは v${VER}）"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg><span>更新履歴（v${VER}）</span></button>
      <button class="rl-acct" data-a="acct" data-r="acct" title="PikPak のログイン状態と同期"></button>
    </aside>
    <header>
      <div class="brand"><button class="hbtn hic" data-a="navtoggle" title="左のメニューの表示を切り替える" aria-label="左のメニューの表示を切り替える"><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>${LOGO}<h1 class="wm" aria-label="PikPak Distill – Dedupe"><small>PIKPAK DISTILL</small><span class="gw"><i aria-hidden="true">Dedupe</i><i aria-hidden="true">Dedupe</i><b>Dedupe</b></span></h1><span class="ver" title="いま動いているバージョン">v${VER}</span><span class="sp"></span>
        <label class="hq" title="名前で絞り込み">${IC.search}<input type="text" data-a="tq" placeholder="名前で絞り込み・検索"></label><span class="seg hqs" data-r="tqs" title="探す範囲"><button data-a="tqs" data-v="here">このフォルダ</button><button data-a="tqs" data-v="all">すべて</button></span>
        <div class="pd-quota" data-r="quota"></div>
        <span class="seg thm" data-r="theme" role="group" aria-label="テーマ"></span>
        <button class="hbtn" data-a="lang" title="表示言語を切り替える">${IC.globe}<span class="raw" data-r="langname"></span></button>
        <button class="hbtn" data-a="addlink" title="リンク・マグネットを追加（追加する前に、もうあるか確かめる）">${IC.link}<span>リンクを追加</span></button>
        <button class="hbtn hic" data-a="edgescroll" data-r="edgebtn" title="端でスクロール：マウスを一覧の下（上）の端へ持っていくと、ゆっくりスクロールします" aria-label="端でスクロール"><svg viewBox="0 0 24 24"><path d="M12 4v16M8 8l4-4 4 4M8 16l4 4 4-4"/></svg></button>
        <button class="hbtn hic" data-a="bell" title="お知らせ（エラー・新しいバージョン）" aria-label="お知らせ"><svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg><i data-r="logbadge"></i></button>
        <button class="hbtn hacct" data-a="acct" data-r="acctbtn" title="PikPak のログイン状態と同期"></button>
        <button class="hbtn" data-a="settings" title="設定（表示・再生・整理・情報）">${IC.gear}<span>設定</span></button>
        <button class="hbtn wbtn-full" data-a="tofull" title="PikPak の画面を Dedupe に切り替えて、広い画面で使う">${IC.expand}<span>全画面で開く</span></button>
        <button class="hbtn hxl wbtn-min" data-a="mini" title="小さくする（右下のボタンに戻す。作業中の内容はそのまま）">${IC.minus}<span>小さくする</span></button>
        <button class="hbtn hxl" data-a="close" title="Dedupe を閉じて、PikPak の画面に戻る（作業中の内容はそのまま）">${IC.x}<span>Dedupe を閉じる</span></button>
      </div>
      <nav data-r="nav"></nav>
    </header>
    <div class="pd-upd" data-r="upd" hidden></div>
    <div class="pd-rsban" data-r="rsban" hidden></div>
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
  EN.push(...[["全画面で開く", "Open full screen"], ["ポップアップに戻す", "Back to popup"], ["次から全画面で開く", "Always open full screen"], ["PikPak の画面を Dedupe に切り替えて使うこともできます。一覧が広くなり、キー操作やドラッグも使いやすくなります。", "You can also switch the PikPak screen to Dedupe. Lists get wider, and keys and dragging are easier to use."], ["開き方", "How to open"], ["ポップアップ", "Popup"], ["全画面（おすすめ）", "Full screen (recommended)"], ["PikPak の画面を Dedupe に切り替えて、広い画面で使います", "Switches the PikPak screen to Dedupe for a wide view"], ["全画面", "Full screen"], ["PikPak の画面の上に重ねて開きます。動かしたり大きさを変えたりでき、後ろの PikPak もそのまま使えます", "Opens on top of PikPak. You can move and resize it, and keep using PikPak behind it"], ["PikPak の画面を Dedupe に切り替えます（今までの開き方）", "Switches the PikPak screen to Dedupe (the previous way)"], ["次からは全画面で開きます（設定の「表示」→「開き方」で戻せます）", "Will open full screen from now on (change it in Settings → Display → How to open)"]]);
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
  // サムネイルをぼかす（プライバシー）。この端末だけの設定（同期しない）
  const LS_BLUR = 'ppdup:blur:v1', LS_BLURHOV = 'ppdup:blurhov:v1';
  const blurOn = () => { try { return localStorage.getItem(LS_BLUR) === '1'; } catch (e) { return false; } };
  const blurHov = () => { try { return localStorage.getItem(LS_BLURHOV) !== '0'; } catch (e) { return true; } };
  function applyBlur() { document.documentElement.classList.toggle('pd-blur', blurOn()); document.documentElement.classList.toggle('pd-blurhov', blurOn() && blurHov()); }
  applyBlur();
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

  // 左メニューの「再読み込み」：いきなり始めず、確認してから（読み込み中はファイルの操作ができないため）
  function askRescan() {
    if (document.getElementById('pd-dlg')) return;
    const back = view;
    const where = (meta && meta.where) || crumbs().map((c) => c.name).filter(Boolean).join(' › ') || 'ホーム';
    let st = null; try { st = (JSON.parse(localStorage.getItem(LS_SCANSTAT) || '{}') || {})[String(currentTrail().slice(-1)[0] || 'root')]; } catch (e) { st = null; }
    const when = meta ? new Date(meta.at).toLocaleString(loc(), { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    const d = document.createElement('div'); d.id = 'pd-dlg';
    d.innerHTML = `<div class="box" role="dialog" aria-label="再読み込み"><h3>PikPak の中身を読み込み直しますか？</h3>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px">
        <div>📁 読み込む場所：<b>${esc(where)}</b></div>
        ${meta ? `<div>🕘 前回：<b>${esc(when)}</b>（フォルダ ${meta.nfo.toLocaleString()} ／ ファイル ${meta.nfi.toLocaleString()}）</div>` : ''}
        <div>⏱ かかる時間：<b>${st ? `前回は ${fmtDur(st.ms)}` : '数十秒〜数分'}</b></div>
      </div>
      <div class="note" style="margin-bottom:16px">PikPak で追加・削除・移動したものを反映します。<b>読み込み中は、移動・削除・名前の変更などの操作ができません</b>（途中で「中断」できます）。ファイルは何も変更しません。</div>
      <div class="acts"><button data-no>やめる</button><button data-go style="background:#306fff;border-color:#306fff;color:#fff;font-weight:700">読み込みを始める</button></div></div>`;
    document.body.appendChild(d);
    const close = () => { d.remove(); document.removeEventListener('keydown', onKey, true); };
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); } };
    document.addEventListener('keydown', onKey, true);
    d.addEventListener('mousedown', (e) => { if (e.target === d) close(); });
    d.querySelector('[data-no]').onclick = close;
    d.querySelector('[data-go]').onclick = () => { close(); if (busy) return; afterScan = back; runScan(); };
    d.querySelector('[data-go]').focus();
  }

  // ---------- 件数（ステップの案内用） ----------
  function counts() {
    if (!hasScan()) return null;
    const wf = workFiles();
    return {
      junk: junkEnabled() ? buildJunkPlan(files, folders).filter((p) => p.level === 'del').length : 0,
      junkReview: junkEnabled() ? buildJunkPlan(files, folders).filter((p) => p.level === 'review').length : 0,
      name: nameEnabled() ? buildNamePlan(wf, folders).length : 0,
      sort: stepOn('sort') ? buildSortPlan(wf, folders).length : 0,
      ren: stepOn('ren') ? buildRenamePlan(wf, folders).filter((p) => p.status === 'rename' || p.status === 'dup').length : 0,
      dup: buildGroups(wf, 'name').length,
      clean: stepOn('clean') ? buildCleanPlan(files, folders).filter((p) => p.status === 'todo').length : 0,
      seller: sellerEnabled() ? buildSellerPlan(folders).filter((x) => x.kind !== 'dupw' || x.merge).length : 0,
      cleanSkip: stepOn('clean') ? buildCleanPlan(files, folders).filter((p) => p.status === 'skip').length : 0,
    };
  }
  const UNIT_OF = { junk: '件', name: '件', sort: '作品', ren: '件', dup: '組', clean: '件', seller: '作品' };
  const WORK = ['junk', 'name', 'sort', 'ren', 'dup', 'clean', 'seller'];

  // ---------- スマホ・狭い画面：下の引き出し（デリログと同じ考え方） ----------
  //   0＝閉じる（今の画面でよく使う 2 つだけ）／1＝半分（メニュー）／2＝全部（今の画面の詳しい操作）
  //   ボタンは画面にある本物のボタンを押す「代わり」。動きは本物と同じ（作り直さない）
  const sheet = document.createElement('div'); sheet.className = 'pd-sheet'; sheet.dataset.st = '0';
  sheet.innerHTML = '<button class="sh-h" title="引き出す・しまう（上下にドラッグ・押す）" aria-label="引き出す・しまう"><i></i></button><div class="sh-b"></div><div class="sh-in"><div class="sh-m"></div><div class="sh-x"></div></div>';
  root.appendChild(sheet);
  // iPhone・iPad の Safari は画面の下に浮いたツールバーがあり、その近くを押すと最初の 1 回はツールバーが反応して
  // こちらのボタンに届かない。ブラウザで開いているとき（ホーム画面のアプリでないとき）は、その分だけ引き出しを上げる
  const iosSafari = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone;
  if (iosSafari && !standalone) root.classList.add('ios-bar');
  let shRefs = [], shT = null;
  const shOn = () => root.classList.contains('narrow') && root.classList.contains('on');
  // 上に重なる画面（リンク追加・解凍・プレーヤー・確認など）を開いている間は、引き出しを隠す
  const shCover = () => !!document.querySelector('#pd-add,#pd-unzip,#pd-player,#pd-ql,#pd-dlg,#pd-set,#pd-frames,#pd-cmp');
  setInterval(() => { if (shOn()) sheet.classList.toggle('covered', shCover()); }, 400);
  const shSet = (n) => { sheet.dataset.st = String(Math.max(0, Math.min(2, n))); };
  const shBtn = (el, cls) => {
    if (!el) return '';
    const i = shRefs.push(el) - 1;
    const SHORT = { lbpv: '▶ プレビュー', lbext: '↗ 外部プレーヤー' };
    const sk = Object.keys(SHORT).find((k) => el.dataset[k] !== undefined);
    const tx = sk ? SHORT[sk] : (el.querySelector('span:not(.rb)') || el).textContent.replace(/\s+/g, ' ').trim();
    const ic = el.querySelector('svg') ? el.querySelector('svg').outerHTML : '';
    return `<button data-shref="${i}" class="${cls || ''}${el.classList.contains('pri') ? ' pri' : ''}${el.classList.contains('on') ? ' on' : ''}${el.classList.contains('red') || el.classList.contains('dng') ? ' red' : ''}"${el.disabled ? ' disabled' : ''} title="${esc(el.getAttribute('title') || el.dataset.ttl || tx)}">${ic}<span>${esc(tx)}</span></button>`;
  };
  function renderSheet() {
    if (!shOn()) return;
    shRefs = [];
    const lib = document.getElementById('pd-lib');
    const all = (sel, scope) => [...(scope || root).querySelectorAll(sel)].filter((b) => !b.closest('.pd-sheet'));
    let prim = [], ctx = [];
    if (lib && libSt) {
      const ft = all('.lk-ft button', lib);
      prim = lib.querySelector('[data-lbpv]') ? [lib.querySelector('[data-lbpv]'), lib.querySelector('[data-lbext]')] : ft.slice().sort((x, y) => y.classList.contains('pri') - x.classList.contains('pri')).slice(0, 2);
      ctx = [...all('.lk-hd button:not(.x)', lib), ...ft.filter((x) => !prim.includes(x))];
    } else if (view === 'tree') {
      const play = root.querySelector('[data-r=tsel] [data-ta=play]');
      prim = [play || null];
      if (!play) prim = [];
      ctx = [...all('[data-r=tb] button').filter((x) => !x.closest('.tr-path')), ...all('[data-r=tsel] button:not([data-ta=play])')];
    } else {
      const dk = all('.sv-dock .dk-b button').sort((x, y) => (y.classList.contains('pri') - x.classList.contains('pri')) || ((y.dataset.a === 'rescan') - (x.dataset.a === 'rescan')));
      prim = dk.slice(0, 2); ctx = dk.slice(2);
    }
    prim = prim.filter(Boolean);
    const put = (el, html) => { if (el._html !== html) { el._html = html; el.innerHTML = html; } };
    const b = sheet.querySelector('.sh-b');
    const bHtml = (prim.length ? prim.map((x) => shBtn(x, 'p')).join('') : view === 'tree' && !(lib && libSt) ? '<button class="p" disabled title="一覧で動画を選ぶと再生できます"><span>▶ 再生（動画を選ぶ）</span></button>' : '') + (ctx.length ? `<button class="p sub" data-shmore title="今の画面の操作をすべて出す"><span>⋯ 操作</span></button>` : '');
    put(b, bHtml);
    // メニュー：左メニューと同じ項目
    const rail = [...root.querySelectorAll('.rail > button:not(.rl-acct)')];
    put(sheet.querySelector('.sh-m'), rail.map((x) => shBtn(x, 'm')).join(''));
    put(sheet.querySelector('.sh-x'), ctx.length ? `<b>この画面の操作</b><div>${ctx.map((x) => shBtn(x, 'x')).join('')}</div>` : '');
    if (LANG === 'en') sheet.querySelectorAll('*').forEach(trNode);
  }
  let shTouch = false;
  sheet.addEventListener('pointerdown', () => { shTouch = true; }, true);
  addEventListener('pointerup', () => { if (shTouch) { shTouch = false; } }, true);
  addEventListener('pointercancel', () => { shTouch = false; }, true);
  const shQueue = () => { if (shTouch) { clearTimeout(shT); shT = setTimeout(shQueue, 150); return; } clearTimeout(shT); shT = setTimeout(() => { try { renderSheet(); } catch (e) { /* 初期化の途中 */ } }, 60); };
  new MutationObserver((ms) => { if (!shOn()) return; if (ms.every((m) => sheet.contains(m.target))) return; shQueue(); }).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'class'] });
  sheet.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.classList.contains('sh-h')) { if (!sheet._dragged) shSet(sheet.dataset.st === '0' ? 1 : 0); sheet._dragged = false; return; }
    if (b.dataset.shmore !== undefined) { shSet(+sheet.dataset.st === 2 ? 0 : 2); return; }
    const el = shRefs[+b.dataset.shref]; if (!el || !el.isConnected) { renderSheet(); return; }
    el.click();
    if (b.classList.contains('m') || b.classList.contains('x')) shSet(0);
  });
  // つまみを上下にドラッグ：上で引き出す・下でしまう
  sheet.querySelector('.sh-h').addEventListener('pointerdown', (e) => {
    const y0 = e.clientY, st0 = +sheet.dataset.st; sheet._dragged = false;
    const h = sheet.querySelector('.sh-h'); try { h.setPointerCapture(e.pointerId); } catch (er) { /* 無視 */ }
    const mv = (ev) => { const dy = ev.clientY - y0; if (Math.abs(dy) > 8) sheet._dragged = true; sheet.style.setProperty('--shdy', Math.max(-60, Math.min(60, dy)) + 'px'); };
    const up = (ev) => {
      h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', up);
      sheet.style.removeProperty('--shdy');
      const dy = ev.clientY - y0; if (sheet._dragged) shSet(st0 + (dy < -40 ? (dy < -220 ? 2 : 1) : dy > 40 ? (dy > 220 ? -2 : -1) : 0));
    };
    h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up);
  });
  // 引き出しの外（一覧など）を押したら閉じる
  root.addEventListener('pointerdown', (e) => { if (sheet.dataset.st !== '0' && !sheet.contains(e.target)) shSet(0); }, true);
  function renderRail() {
    root.querySelectorAll('.rail [data-rail]').forEach((b) => {
      const k = b.dataset.rail;
      b.classList.toggle('on', libSt ? k === 'lib-' + libSt.tab : k === 'tree' ? view === 'tree' : k === 'flow' ? view !== 'tree' && mode === 'flow' : false);
      if (k === 'tree' || k === 'scan' || k === 'flow') b.disabled = busy;
    });
    renderAcct();
    [['dl', libBadge.dl], ['trash', libBadge.trash], ['cand', (() => { try { const db = mediaAll(); return Object.keys(db).filter((k) => db[k].tri === 'del').length; } catch (e) { return 0; } })()]].forEach(([k, n]) => { const e = root.querySelector(`[data-r=rb-${k}]`); if (e) e.textContent = n ? (n > 99 ? '99+' : n) : ''; });
  }
  // PikPak のログイン状態と同期（左メニューの下・上のバーのアカウントボタン）
  function renderAcct() {
    const ok = sessionValid(), sc = syncCfg();
    const sync = sc.on && sc.asked ? '同期オン' : '同期オフ';
    const syncT = sc.on && sc.asked && sc.last ? '前回 ' + new Date(sc.last).toLocaleString(loc(), { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    const card = root.querySelector('[data-r=acct]'), btn = root.querySelector('[data-r=acctbtn]');
    const ic = '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/></svg>';
    if (card) { card.className = 'rl-acct ' + (ok ? 'ok' : 'ng'); card.innerHTML = `<i>${ic}</i><span><b>${ok ? 'PikPak にログイン中' : 'ログインが必要です'}</b><small>● ${esc(ok ? sync : 'PikPak の画面でログインしてください')}</small>${ok && syncT ? `<small class="t">${esc(syncT)}</small>` : ''}</span>`; }
    if (btn) { btn.className = 'hbtn hacct ' + (ok ? 'ok' : 'ng'); btn.innerHTML = `${ic}<span>${ok ? 'ログイン中' : '要ログイン'}</span>`; }
  }
  function openAcct(anchor) {
    let m = document.getElementById('pd-acct'); if (m) { m.remove(); return; }
    const ok = sessionValid(), sc = syncCfg();
    m = document.createElement('div'); m.id = 'pd-acct';
    m.innerHTML = `<b>${ok ? 'PikPak にログイン中' : 'ログインが必要です'}</b><small>${ok ? 'Dedupe は PikPak のログインをそのまま使います（パスワードは扱いません）' : 'PikPak の画面でログインしてから、もう一度開いてください'}</small>
      <div class="ln"><span>PikPak で同期</span><b>${sc.on && sc.asked ? 'オン' : 'オフ'}</b></div>${sc.last ? `<div class="ln"><span>前回の同期</span><b>${new Date(sc.last).toLocaleString(loc(), { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</b></div>` : ''}
      ${quota && quota.usage ? `<div class="ln"><span>使用量</span><b>${fmtCap(quota.usage)} / ${quota.limit > 0 ? fmtCap(quota.limit) : '—'}</b></div>` : ''}
      <div class="acts"><button data-ac="sync"${ok && sc.on && sc.asked ? '' : ' disabled'}>今すぐ同期</button><button data-ac="set">同期の設定</button></div>`;
    document.body.appendChild(m);
    const r = anchor.getBoundingClientRect();
    m.style.top = (r.bottom + 8 + m.offsetHeight > innerHeight ? Math.max(8, r.top - m.offsetHeight - 8) : r.bottom + 8) + 'px';
    m.style.left = Math.max(8, Math.min(innerWidth - m.offsetWidth - 8, r.right - m.offsetWidth)) + 'px';
    const off = (ev) => { if (!m.contains(ev.target) && !anchor.contains(ev.target)) { m.remove(); document.removeEventListener('mousedown', off, true); } };
    document.addEventListener('mousedown', off, true);
    m.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-ac]'); if (!b || b.disabled) return;
      m.remove(); document.removeEventListener('mousedown', off, true);
      if (b.dataset.ac === 'sync') syncNow('手動').then((x) => { status(x ? 'PikPak と同期しました' : '同期できませんでした（「ログ」で理由を確認できます）'); renderAcct(); });
      else openSettings('info');
    });
  }
  // 左メニュー：広い表示／アイコンだけ（PC）、右から出す（スマホ・狭い画面）
  const LS_NAVMIN = 'ppdup:navmin:v1';
  const narrowUI = () => innerWidth < 760 || root.classList.contains('phone');
  // 3 段階：wide＝広い表示／min＝アイコンだけ／hide＝隠す（右のふちのつまみで引き出す・しまう）
  const LS_NAV = 'ppdup:nav:v1';
  const NAV_W = { wide: 236, min: 78, hide: 0 };
  function navState() {
    let v = null; try { v = localStorage.getItem(LS_NAV); if (!v) v = localStorage.getItem(LS_NAVMIN) === '1' || innerWidth < 1024 ? 'min' : 'wide'; } catch (e) { v = 'wide'; }
    return NAV_W[v] != null ? v : 'wide';
  }
  function setNav(v) { try { localStorage.setItem(LS_NAV, v); if (v !== 'hide') localStorage.setItem('ppdup:navlast:v1', v); } catch (e) { /* 無視 */ } applyNav(); }
  const navLast = () => { try { const v = localStorage.getItem('ppdup:navlast:v1'); return v === 'min' ? 'min' : 'wide'; } catch (e) { return 'wide'; } };
  function applyNav() {
    const st = navState();
    root.classList.toggle('navmin', st === 'min'); root.classList.toggle('navhide', st === 'hide'); root.classList.toggle('narrow', narrowUI());
    const b = root.querySelector('[data-a=navtoggle]');
    if (b) b.title = narrowUI() ? 'メニューを開く・閉じる' : st === 'hide' ? '左のメニューを出す' : st === 'min' ? '左のメニューを広げる（いまはアイコンだけ）' : '左のメニューをアイコンだけにする（いまは広い表示）';
    const g = root.querySelector('.rl-grip');
    if (g) g.title = st === 'hide' ? '左のメニューを引き出す（右へドラッグ・押す）' : '左のメニューをしまう（左へドラッグ・押す）。右へドラッグで広げる';
  }

  // ---- マウスを乗せたときの説明（アイコンだけのボタン・アイコンだけの左メニュー） ----
  //   ブラウザ標準の title は出るまで時間がかかり気づきにくいため、すぐ出す吹き出しにする
  const tipEl = document.createElement('div'); tipEl.id = 'pd-tip'; tipEl.hidden = true; document.body.appendChild(tipEl);
  let tipBtn = null;
  const tipText = (b) => {
    const t = b.dataset.ttl || b.getAttribute('title') || b.getAttribute('aria-label') || '';
    const lab = [...b.children].find((c) => c.tagName === 'SPAN' && !c.classList.contains('rb') && getComputedStyle(c).display !== 'none');
    const vis = (lab ? lab.textContent : [...b.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('')).trim();
    if (vis && !/^[\s\W]{0,2}$/.test(vis)) return ''; // 文字が見えているボタンは標準の説明のまま
    const nm = b.querySelector('span') ? b.querySelector('span').textContent.trim() : '';
    return nm && t && !t.startsWith(nm) ? `${nm}：${t}` : t || nm;
  };
  // 表示中に説明が書き換わった（状態が変わった）ときは、新しい方を残す
  const tipHide = () => { if (tipBtn && tipBtn.dataset.ttl != null) { if (!tipBtn.hasAttribute('title')) tipBtn.setAttribute('title', tipBtn.dataset.ttl); delete tipBtn.dataset.ttl; } tipBtn = null; tipEl.hidden = true; };
  document.addEventListener('mouseover', (e) => {
    const b = e.target.closest && e.target.closest('button');
    if (b === tipBtn) return; tipHide();
    if (!b || !b.isConnected || b.closest('#pd-tip')) return;
    const t = tipText(b); if (!t) return;
    tipBtn = b; if (b.hasAttribute('title')) { b.dataset.ttl = b.getAttribute('title'); b.removeAttribute('title'); }
    tipEl.textContent = t; tipEl.hidden = false;
    const r = b.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    const side = b.closest('.rail');
    let x = side ? r.right + 8 : r.left + r.width / 2 - w / 2, y = side ? r.top + r.height / 2 - h / 2 : r.bottom + 8;
    if (!side && y + h > innerHeight - 4) y = r.top - h - 8;
    tipEl.style.left = Math.max(4, Math.min(innerWidth - w - 4, x)) + 'px'; tipEl.style.top = Math.max(4, Math.min(innerHeight - h - 4, y)) + 'px';
  }, true);
  document.addEventListener('mousedown', tipHide, true);
  addEventListener('scroll', tipHide, true);
  function toggleNav() {
    if (narrowUI()) { root.classList.toggle('navopen'); return; }
    const st = navState(); setNav(st === 'hide' ? navLast() : st === 'min' ? 'wide' : 'min');
  }
  // ---- つまみ：左メニューの右のふち。ドラッグで引き出す・しまう（離した位置に近い段階にそろえる）。押すと しまう ⇔ 出す ----
  const grip = document.createElement('button'); grip.className = 'rl-grip'; grip.setAttribute('aria-label', '左のメニューを引き出す・しまう'); grip.innerHTML = '<i></i>';
  root.appendChild(grip);
  grip.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return; e.preventDefault();
    const x0 = e.clientX, w0 = NAV_W[navState()]; let moved = false;
    try { grip.setPointerCapture(e.pointerId); } catch (er) { /* 無視 */ }
    root.classList.add('navdrag');
    const mv = (ev) => {
      const dx = ev.clientX - x0; if (Math.abs(dx) > 4) moved = true; if (!moved) return;
      const w = Math.max(0, Math.min(NAV_W.wide, w0 + dx));
      root.style.setProperty('--navw', w + 'px'); root.classList.toggle('navmin', w < 160 && w > 0); root.classList.remove('navhide');
    };
    const up = () => {
      grip.removeEventListener('pointermove', mv); grip.removeEventListener('pointerup', up); grip.removeEventListener('pointercancel', up);
      root.classList.remove('navdrag');
      const cur = parseFloat(root.style.getPropertyValue('--navw')); root.style.removeProperty('--navw');
      if (!moved) { setNav(navState() === 'hide' ? navLast() : 'hide'); return; }
      const near = Object.keys(NAV_W).sort((a, b2) => Math.abs(NAV_W[a] - cur) - Math.abs(NAV_W[b2] - cur))[0];
      setNav(near);
    };
    grip.addEventListener('pointermove', mv); grip.addEventListener('pointerup', up); grip.addEventListener('pointercancel', up);
  });
  addEventListener('resize', () => { applyNav(); if (!narrowUI()) root.classList.remove('navopen'); });
  root.addEventListener('click', (e) => { if (root.classList.contains('navopen') && (e.target === root || e.target.closest('.rail button'))) setTimeout(() => root.classList.remove('navopen'), 0); });
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
    const kopt = (k) => `<label class="optsw" title="オフにすると、このステップを使わず次へ進みます"><input type="checkbox" data-kopt="${k}"${stepOn(k) ? ' checked' : ''}> このステップを使う</label><button data-a="kreplan" title="PikPak の最新の内容ではなく、読み込んだ内容から計画を作り直します">計画を作り直す</button><span class="sep"></span>`;
    if (view === 'sort' || view === 'clean' || view === 'ren') html = head + kopt(view);
    if (view === 'seller') {
      html = head + `<label class="optsw" title="オフにすると、このステップを使わず次へ進みます"><input type="checkbox" data-a="selleropt"${sellerEnabled() ? ' checked' : ''}> このステップを使う</label>`;
    }
    if (view === 'junk') html = head + kopt('junk');
    if (view === 'name') html = head + kopt('name');
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
      if (view === 'dup') { const g = visibleGroups(), n = delList(g).length; tx = g.length ? (n ? `<b>チェックした ${n} 件を削除します</b><small>表示中 ${g.length} 組。各組の一番大きいファイルは最初からチェックなし（残す）。確認画面のあと、PikPak のゴミ箱へ移します</small>` : '<b>チェックの入ったファイルがありません</b><small>削除するファイルにチェックを入れてください</small>') : ''; }
      else if (KIT_VERB[view]) { const all = kitItems(view), n = kitTargets(view).length, un = UNIT_OF[view] || '件'; const off = all.filter((it) => (it.st === 'todo' || it.st === 'fail') && kitIsOff(view, it.id)).length, rv = all.filter((it) => it.st === 'review').length; tx = !stepOn(view) || !all.some((it) => it.st === 'todo' || it.st === 'fail') ? '' : n ? `<b>チェックした ${n} ${un}を${KIT_VERB[view]}します</b><small>${[off ? `チェックなし ${off}` : '', rv ? `要確認 ${rv}` : ''].filter(Boolean).join('・')}${off || rv ? ' は対象外。' : ''}${view === 'junk' ? '確認画面のあと、PikPak のゴミ箱へ移します' : 'まずは「先頭1件だけ試す」で動きを確かめてください'}</small>` : '<b>チェックの入ったものがありません</b><small>実行するものにチェックを入れてください</small>'; }
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
    if (view === 'dup') {
      el.innerHTML = visibleGroups().length ? (() => { const n = delList(visibleGroups()).length; return `<button data-a="csv">CSV保存</button><button class="danger" data-a="delall"${n ? '' : ' disabled'}>チェックした ${n} 件を削除</button>`; })() : `<span class="okbadge">✓ 完了</span>${nextHtml(c)}`;
      return;
    }
    if (KIT_VERB[view]) { const n = kitTargets(view).length, un = UNIT_OF[view] || '件'; el.innerHTML = stepOn(view) && kitItems(view).some((it) => it.st === 'todo' || it.st === 'fail') ? (view === 'junk' ? `<button class="danger" data-a="junkdel"${n ? '' : ' disabled'}>チェックした ${n} ${un}を削除</button>` : `<button data-a="${view}1"${n ? '' : ' disabled'}>先頭1件だけ試す</button><button class="pri" data-a="${view}all"${n ? '' : ' disabled'}>チェックした ${n} ${un}を${KIT_VERB[view]}</button>`) : `<span class="okbadge">✓ 完了${view === 'clean' && c && c.cleanSkip ? `（要確認 ${c.cleanSkip} 件）` : ''}</span>${nextHtml(c)}`; return; }
    el.innerHTML = remaining(view, c) > 0
      ? `<button data-a="${view}1">先頭1件だけ試す</button><button class="pri" data-a="${view}all">${label[view]}</button>`
      : `<span class="okbadge">✓ 完了${view === 'clean' && c && c.cleanSkip ? `（要確認 ${c.cleanSkip} 件）` : ''}</span>${nextHtml(c)}`;
  }
  function setView(v) {
    if (libSt && !ddApplying) closeLib();
    if (v !== 'scan' && !hasScan()) v = 'scan';
    view = v;
    if (v === 'clean') cplan = stepOn('clean') ? buildCleanPlan(files, folders) : [];
    if (v === 'junk') jplan = junkEnabled() ? buildJunkPlan(files, folders) : [];
    if (v === 'name') nplan = buildNamePlan(workFiles(), folders);
    if (v === 'ren') rplan = stepOn('ren') ? buildRenamePlan(workFiles(), folders) : [];
    if (v === 'sort') splan = stepOn('sort') ? buildSortPlan(workFiles(), folders) : [];
    if (v === 'seller') selPlan = sellerEnabled() ? buildSellerPlan(folders) : [];
    if (v !== 'tree') { closeQL(); closeCtx(); closePlayer(); hideHover(); }
    root.classList.toggle('treev', v === 'tree'); // フォルダ一覧ではステップの表示を隠す
    if (v !== 'tree') { renderTreeActs(); $('[data-r=pright]').textContent = ''; }
    renderToolbar(); render(); renderNav();
    $('[data-r=main]').scrollTop = 0;
    renderQuota(); refreshQuota();
    if (v === 'tree') prefetchUp();
    ddKick();
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
    if (view === v && v === 'seller') { const old = $('[data-r=main] .st-res'); if (old) old.remove(); renderSeller(); return; }
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

  // ---------- まとめて整理（基準を決める → 判定 → 確認 → まとめて実行） ----------
  // 判定はいまの各ステップと同じ部品を使い、人が見るのは「迷うもの」だけにする。
  // 実行の順番は固定：不要ファイル → 重複 → 作品ごとに仕分け → 販売者ごとに仕分け → ファイル名 → フォルダ名 → 片付け
  //   先に消すので、名前をそろえるときに同じ名前がぶつかって (1) が付くことがほとんどなくなる

  // 重複（作品・連番まで同じ組）：中身の手がかりで自動か確認かを決める
  //   ① ハッシュ値が同じ ＝ 中身がまったく同じ → 1 つを残して自動で消す
  //   ② 解像度と長さが同じ（容量は違ってよい）、または容量・解像度・長さがほぼ同じ → 大きい方を残して自動で消す
  //   ※ 動画どうしだけを比べる（zip などと動画は比べない）
  //   ③ それ以外（長さ・解像度・容量が違う）→ 確認に回す（見比べで目で見て決める）
  const SD_NEAR = 0.02;
  function smartDup() {
    const dn = new Map(folders.map((d) => [d.id, d.name]));
    const g = new Map();
    workFiles().forEach((f) => { if (!VIDEO_EXT.has(extOf(f.name))) return; const k = dupKeyOf(f.name, dn.get(f.parentId)); if (!k) return; if (!g.has(k)) g.set(k, []); g.get(k).push(f); });
    const auto = [], review = [];
    // 正しい置き場所（フォルダ名に品番が入っている）にあるものを優先して残す
    const placed = (f, k) => (dn.get(f.parentId) || '').toUpperCase().includes(k.split('#')[0].toUpperCase());
    const better = (a, b, k) => (placed(b, k) - placed(a, k)) || (b.size - a.size);
    g.forEach((list, k) => {
      if (list.length < 2) return;
      const m = list.map((f) => ({ f, ...metaGet(f) }));
      const byH = new Map(); const reps = [];
      m.forEach((x) => { if (!x.hash) { reps.push(x); return; } if (!byH.has(x.hash)) byH.set(x.hash, []); byH.get(x.hash).push(x); });
      byH.forEach((xs) => { xs.sort((a, b) => better(a.f, b.f, k)); reps.push(xs[0]); xs.slice(1).forEach((x) => auto.push({ key: k, keep: xs[0].f, del: x.f, why: '中身が同じ（ハッシュ値が一致）' })); });
      if (reps.length < 2) return;
      reps.sort((a, b) => b.f.size - a.f.size);
      const top = reps[0];
      // 解像度と長さが同じ（分かっている）なら、容量が違っても同じ作品の別のコピー（変換・再圧縮）とみなし、大きい方を残す
      const sameMedia = (x) => top.res && x.res && top.res === x.res && top.dur && x.dur && Math.abs(top.dur - x.dur) <= Math.max(5, top.dur * SD_NEAR);
      const near = (x) => sameMedia(x) || (Math.abs(top.f.size - x.f.size) / (top.f.size || 1) <= SD_NEAR && (!top.res || !x.res || top.res === x.res) && (!top.dur || !x.dur || Math.abs(top.dur - x.dur) <= Math.max(5, top.dur * SD_NEAR)));
      if (reps.slice(1).every(near)) { const keep = reps.slice().sort((a, b) => better(a.f, b.f, k))[0]; reps.filter((x) => x !== keep).forEach((x) => auto.push({ key: k, keep: keep.f, del: x.f, why: '容量・解像度・長さがほぼ同じ（大きい方を残す）' })); return; }
      const why = [];
      if (reps.some((x) => x.dur && top.dur && Math.abs(x.dur - top.dur) > Math.max(5, top.dur * SD_NEAR))) why.push('長さが違う');
      if (reps.some((x) => x.res && top.res && x.res !== top.res)) why.push('解像度が違う');
      if (!why.length) why.push('容量が違う');
      // 名前を整えるステップでも、決めるまでは名前を変えない
      review.push({ key: k, items: reps.map((x) => x.f), why: why.join('・') });
    });
    return { auto, review };
  }
  // 確認に回すもの・自動で決まる分の件数
  function onePlan() {
    const c = counts() || {};
    const sd = smartDup();
    const jp = junkEnabled() ? buildJunkPlan(files, folders) : [];
    const sp = sellerEnabled() ? buildSellerPlan(folders) : [];
    const pend = sp.filter((x) => x.kind === 'pending').length, unknown = sp.filter((x) => x.kind === 'unknown' || x.kind === 'review').length;
    return {
      auto: [
        ['junk', '不要ファイル', jp.filter((x) => x.level === 'del').length, '件', '広告・10MB 以下など'],
        ['dup', '重複（自動で決まったもの）', sd.auto.length, '件', '中身が同じ・ほぼ同じ'],
        ['sort', '作品ごとに仕分け', c.sort || 0, '作品', '品番のフォルダへ'],
        ['seller', '販売者ごとに仕分け', sp.filter((x) => (x.kind !== 'pending' || x.fix === 'nest') && (x.kind !== 'dupw' || x.merge) && sellerChecked(x)).length, '作品', '販売者が分かった作品だけ'],
        ['name', 'ファイル名を整える', c.name || 0, '件', 'FC2-PPV-品番[-連番]'],
        ['ren', 'フォルダ名を揃える', c.ren || 0, '件', '中のファイルの品番に'],
        ['clean', '片付け', c.clean || 0, '件', '空のフォルダ・(1) など'],
      ],
      sd, pend, unknown,
      junkReview: jp.filter((x) => x.level === 'review').length,
    };
  }
  function onePanelHtml() {
    if (!hasScan()) return '';
    const P = onePlan();
    const total = P.auto.reduce((a, x) => a + x[2], 0);
    const rv = P.sd.review;
    const rvRow = (g) => `<div class="op-rv"><div class="op-rvh"><b>${esc(g.key.replace('#', ' -'))}</b><span class="pd-tag">${esc(g.why)}</span><span class="sp"></span><button data-opcmp="${esc(g.key)}" title="2 本を並べて見比べる">▶ 見比べ</button></div>${g.items.map((f) => { const m = metaGet(f); return `<div class="op-rf"><span>${esc(f.name)}</span><small>${esc(f.path || '')}</small><em>${fmt(f.size)}${m.res ? ' ・ ' + m.res : ''}${m.dur ? ' ・ ' + fmtT(m.dur) : ''}</em></div>`; }).join('')}</div>`;
    const tabs = [
      ['dup', '違う可能性がある重複', rv.length],
      ['junk', '不要ファイル（要確認）', P.junkReview],
      ['seller', '販売者が分からない', P.unknown],
    ].filter((x) => x[2]);
    return `<section class="op">
      <div class="op-hd"><b>まとめて整理</b><span class="note">判定した結果です。自動で決まった分は件数だけ、人が決めるものだけを下に並べています</span></div>
      ${P.pend ? `<div class="op-base"><span>販売者が<b>未調査の作品が ${P.pend} 件</b>あります。調べると、販売者ごとの仕分けに入ります（調べた結果は記録されるので次からは待ちません）</span><button class="pri" data-a="oplookup">販売者を調べる</button></div>` : ''}
      <div class="op-auto">${P.auto.map(([k, t, n, u, d]) => `<button class="op-a${n ? '' : ' zero'}" data-step="${k}" title="開くと中身を見られます"><span>${t}</span><b>${n.toLocaleString()}<small> ${u}</small></b><em>${d}</em></button>`).join('')}</div>
      ${tabs.length ? `<div class="op-q"><b>人が決めるもの</b>${tabs.map(([k, t, n]) => `<button data-step="${k}">${t} <i>${n}</i></button>`).join('')}</div>` : '<div class="op-q"><b>人が決めるものはありません</b></div>'}
      ${rv.length ? `<div class="op-rvs">${rv.slice(0, 5).map(rvRow).join('')}${rv.length > 5 ? `<button class="lnk" data-step="dup">ほか ${rv.length - 5} 組を見る →</button>` : ''}</div>` : ''}
      <div class="op-run"><div><b>${total ? `まとめて実行すると：${P.auto.filter((x) => x[2]).map(([, t, n, u]) => `${t} ${n} ${u}`).join(' ・ ')}` : '実行するものはありません'}</b><div class="note">不要ファイル → 重複 → 作品ごと → 販売者ごと → ファイル名 → フォルダ名 → 片付け の順。消すものは PikPak のゴミ箱へ（戻せます）。人が決めるもの（違う可能性がある重複）は、消さず名前も変えません</div></div><span class="sp"></span><button class="pri" data-a="onepass"${total && !busy ? '' : ' disabled'}>まとめて実行</button></div>
    </section>`;
  }
  let oneRunning = false;
  async function runOnePass() {
    if (busy || oneRunning || !ensureSession(view)) return;
    const P = onePlan();
    const sum = P.auto.filter((x) => x[2]).map(([, t, n, u]) => `・${t}：${n} ${u}`).join('\n');
    if (!sum) { status('実行するものはありません'); return; }
    if (!confirm(tr('次の順番でまとめて実行します。消すものは PikPak のゴミ箱へ移します（戻せます）。\n\n') + sum + tr('\n\nよろしいですか？'))) return;
    oneRunning = true; window.__ppdupStop = false;
    const done = []; const t0 = Date.now();
    const step = (t) => status(`まとめて実行：${t}`);
    try {
      // 1. 不要ファイル
      if (junkEnabled()) {
        jplan = buildJunkPlan(files, folders);
        const list = jplan.filter((x) => x.level === 'del' && junkChecked(x)).map((x) => files.find((f) => f.id === x.id)).filter(Boolean);
        if (list.length) { step('不要ファイルをゴミ箱へ'); busy = true; renderNav(); const r = await deleteEach(list, false, (d, t, e) => status(`まとめて実行：不要ファイル ${d} / ${t}`, d / t, e)); busy = false; done.push(`不要ファイル ${r.n} 件`); }
      }
      // 2. 重複（自動で決まったものだけ）
      if (!window.__ppdupStop) {
        const sd = smartDup(); const list = sd.auto.map((x) => x.del).filter((f) => files.some((y) => y.id === f.id));
        if (list.length) {
          step('重複をゴミ箱へ'); busy = true; renderNav();
          sd.auto.forEach((x) => { decision[x.keep.id] = 'keep'; decision[x.del.id] = 'del'; }); saveDecision();
          const r = await deleteEach(list, false, (d, t, e) => status(`まとめて実行：重複 ${d} / ${t}`, d / t, e)); busy = false; done.push(`重複 ${r.n} 件`);
          log('info', 'まとめて実行：重複の内訳', sd.auto.map((x) => `${x.del.name}（${x.why}）`).slice(0, 50).join(' ／ '));
        }
      }
      // 人が決める重複は、名前を変えない（決めてから整える。(1) を付けて紛らわしくしないため）
      const hold = smartDup().review.flatMap((g) => g.items.map((f) => f.id));
      // 3〜7. 仕分け・販売者・名前・フォルダ名・片付け（各ステップの実行をそのまま使う）
      for (const v of ['sort', 'seller', 'name', 'ren', 'clean']) {
        if (window.__ppdupStop) break;
        if (v === 'seller') { if (!sellerEnabled()) continue; selPlan = buildSellerPlan(folders); const n = selPlan.filter((x) => (x.kind !== 'pending' || x.fix === 'nest') && (x.kind !== 'dupw' || x.merge) && sellerChecked(x)).length; if (!n) continue; step('販売者ごとに仕分け'); await runSeller(false); done.push(`販売者ごとに仕分け ${n} 作品`); continue; }
        if (!stepOn(v)) continue;
        kitPlan(v); if (v === 'name') hold.forEach((id) => kitSetOff('name', id, true));
        const n = kitTargets(v).length; if (!n) continue;
        step(STEPS.find((x) => x.v === v).t); await runKit(v, false); done.push(`${STEPS.find((x) => x.v === v).t} ${n} ${UNIT_OF[v] || '件'}`);
      }
    } catch (err) { busy = false; oneRunning = false; handleErr(err, view, 'まとめて実行を止めました：' + (err.message || err)); return; }
    busy = false; oneRunning = false;
    const msg = `${window.__ppdupStop ? '途中で止めました' : 'まとめて実行しました'}（${fmtDur(Date.now() - t0)}）：${done.join(' ・ ') || '実行したものはありません'}`;
    log('info', msg);
    view = 'scan'; mode = 'flow'; setView('scan'); renderNav(); status(msg + '。失敗があれば各ステップの「失敗」タブに理由があります');
  }
  // ---------- 1. 読み込む ----------
  // 初めて読み込むときは、いきなり読み込まずに案内を出す（「次からは確認しない」で省略）
  const LS_SCANASK = 'ppdup:scanask:v1';
  const scanAsk = () => { try { return localStorage.getItem(LS_SCANASK) !== '0'; } catch (e) { return true; } };
  // 読み込み済みのときのダッシュボード（大きな数字・作業カード・最近追加したもの・右下のボタン群）
  const DASH_TINT = { junk: ['#fdebe1', '#c2561a'], name: ['#f1ebff', '#6a3fd1'], sort: ['#e6f6ee', '#17703f'], ren: ['#fff4dc', '#8a5600'], dup: ['#e8efff', '#306fff'], clean: ['#e3f4f7', '#0f6f80'], seller: ['#fde8f0', '#b4235f'] };
  function renderDash(where, c, next) {
    const done = allDone(c);
    const when = new Date(meta.at).toLocaleString(loc(), { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const staleH = Math.floor((Date.now() - meta.at) / 3600000);
    const stat = (l, v, u, d, cls) => `<div class="db-st${cls ? ' ' + cls : ''}"><span>${l}</span><b>${v}<small>${u}</small></b><em>${d}</em></div>`;
    const qv = quota && quota.usage ? fmtCap(quota.usage).split(' ') : ['—', ''];
    const todo = WORK.filter((k) => c[k] > 0).length;
    const card = (k) => {
      const i = STEPS.findIndex((x) => x.v === k), [bg, fg] = DASH_TINT[k];
      const off = (k === 'name' && !nameEnabled()) || (k === 'junk' && !junkEnabled()) || (k === 'seller' && !sellerEnabled());
      const n = c[k] || 0, warn = (k === 'clean' && !n && c.cleanSkip) || (k === 'junk' && !n && c.junkReview);
      const v = off ? 'オフ' : n ? `${n} ${UNIT_OF[k]}` : warn ? `要確認 ${warn} 件` : '対象なし';
      return `<button class="db-tk${off || (!n && !warn) ? ' zero' : ''}${k === next ? ' next' : ''}" data-step="${k}" style="--tk-bg:${bg};--tk-fg:${fg}" title="${esc(STEPS[i].d)}"><span class="n">${i + 1}</span><b>${esc(STEPS[i].t)}</b><em>${esc(v)}</em><span class="go">${k === next ? 'おすすめ：' : ''}${off ? '設定で使う' : n || warn ? '確認する' : '見る'} →</span></button>`;
    };
    const rec = files.filter((f) => f.ct).sort((a, b) => Date.parse(b.ct) - Date.parse(a.ct)).slice(0, 6);
    const th = (f) => `<button class="db-th" data-a="lib" data-v="recent" title="${esc(f.name)}"><span class="im">${f.thumb ? `<img loading="lazy" referrerpolicy="no-referrer" src="${esc(f.thumb)}" alt="">` : ICON_FILE({ name: f.name, ext: extOf(f.name) })}</span><b>${esc(f.name)}</b><small>${new Date(Date.parse(f.ct)).toLocaleDateString(loc(), { month: 'numeric', day: 'numeric' })}・${fmt(f.size)}</small></button>`;
    const nx = next && STEPS.find((s) => s.v === next);
    const quick = [['tree', 'フォルダ一覧', '見る・再生'], ['lib:dl', '追加したもの', libBadge.dl ? libBadge.dl + ' 件 進行中' : '進み具合'], ['lib:recent', '最近の追加', '直近 7 日'], ['lib:cont', '続きを見る', '途中から'], ['lib:hist', '再生履歴', '見たもの'], ['lib:star', 'スター', 'スター付き'], ['lib:trash', 'ゴミ箱', quota ? fmtCap(quota.trash) : '中身を見る']];
    $('[data-r=main]').innerHTML = `<div class="db">
      <div class="db-hd"><h2>整理</h2><span class="db-chip on" title="読み込んだ場所">${esc(where)}</span><span class="sp"></span><span class="note">前回の読み込み：${esc(when)}（フォルダ ${meta.nfo.toLocaleString()} ／ ファイル ${meta.nfi.toLocaleString()}）</span></div>
      ${staleH >= 6 && staleH < 24 ? `<div class="sv-stale">前回の読み込みから ${staleH >= 48 ? Math.floor(staleH / 24) + ' 日' : staleH + ' 時間'}たっています。PikPak で追加・削除したものは「読み込み直す」で反映されます。</div>` : ''}
      <div class="db-stats">${stat('使用量', qv[0], ' ' + (qv[1] || ''), quota && quota.limit > 0 ? `${fmtCap(quota.limit)} 中 ${Math.round(quota.usage / quota.limit * 100)}%` : '契約容量', 'pri')}${stat('ファイル', meta.nfi.toLocaleString(), ' 件', `フォルダ ${meta.nfo.toLocaleString()}`)}${stat('重複', String(c.dup || 0), ' 組', '同じ作品が複数')}${stat('残っている作業', String(todo), ' 件', done ? 'すべて完了' : nx ? 'おすすめ：' + esc(nx.t) : '')}</div>
      ${onePanelHtml()}
      <div class="db-main">
        <div class="db-tasks">${WORK.map(card).join('')}</div>
        <div class="db-card"><div class="db-ct"><i></i>最近追加したもの<span class="sp"></span><button class="lnk" data-a="lib" data-v="recent">すべて見る →</button></div><div class="db-ths">${rec.map(th).join('') || '<div class="note">この 30 日に追加したものはありません</div>'}</div></div>
      </div>
      <label class="sv-opt" title="オンにすると、作品と関係ないファイルを、仕分け・名前の変更・重複比較の対象から外します（「2. 不要ファイルを削除」で確認・削除できます）"><span class="sw"><input type="checkbox" data-a="junkopt"${junkEnabled() ? ' checked' : ''}><i></i></span><span><b>作品と関係ないファイルを除外する</b><small>広告・宣伝のファイルや 10MB 以下のファイルなどを、ほかの作業の対象から外します</small></span></label>
      <div class="sv-dock"><button class="dk-h" data-a="dockx" title="メニューを広げる・たたむ" aria-label="メニューを広げる"><i></i></button>
        <div class="dk-b"><button data-a="addlink">リンクを追加</button><button data-a="rescan">読み込み直す</button>${nx ? `<button class="pri" data-step="${nx.v}">おすすめ：${STEPS.indexOf(nx) + 1}. ${esc(nx.t)} →</button>` : '<button class="pri" data-a="tree">フォルダ一覧へ →</button>'}</div>
        <div class="dk-q">${quick.map(([k, t, d]) => `<button ${k === 'tree' ? 'data-a="tree"' : `data-a="lib" data-v="${k.slice(4)}"`}><b>${t}</b><small>${esc(d)}</small></button>`).join('')}</div>
      </div>
    </div>`;
    status(done ? '整理はすべて完了しています。PikPak で操作したら「読み込み直す」で最新にできます。' : '読み込み済みです。カードから作業を選べます。');
  }
  function renderScan() {
    const where = crumbs().map((c) => c.name).filter(Boolean).join(' › ') || (currentFolderId() === 'root' ? 'ホーム' : 'いま開いているフォルダ');
    const c = counts();
    const next = c && (WORK.find((k) => c[k] > 0));
    if (meta && c && !busy) { renderDash(crumbs().map((x) => x.name).filter(Boolean).join(' › ') || meta.where || 'ホーム', c, next); return; }
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
    rsHide();
    if (busy) return;
    if (!ensureSession('scan')) return;
    busy = true; renderNav(); renderScan();
    status('読み込み中…', 0);
    try {
      const where = crumbs().map((c) => c.name).filter(Boolean).join(' › ') || 'ホーム';
      let trail = currentTrail();
      // 開いていたフォルダが消えた・移動した（まとめた・ゴミ箱へ移したなど）ときは、ホームを読み込む
      if (trail.length && trail[trail.length - 1] !== 'root') {
        const chk = await api('/files/' + trail[trail.length - 1], { raw: true });
        if (!chk.ok || (chk.data && chk.data.trashed)) { trail = ['root']; status('開いていたフォルダが見つからないため、ホームを読み込みます'); log('warn', '開いていたフォルダが見つからないため、ホームを読み込みました', 'scan'); }
      }
      const eta = scanEta(trail);
      const r = await scanApi(trail, { onProgress: (d, total, n) => { const e = eta.tick(d, total); status(`読み込み中… フォルダ ${d} / ${e.expectedLabel} ／ ファイル ${n} 件`, e.frac, e.text); } });
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
  function renderJunk() { renderKit('junk'); }
  async function runJunk() {
    const list = jplan.filter(junkChecked).map((p) => files.find((f) => f.id === p.id)).filter(Boolean);
    if (!list.length) { status('チェックの入ったファイルがありません'); return; }
    if (!ensureSession('junk')) return;
    const ans = await askDelete(list, []);
    if (!ans) return;
    busy = true; renderNav(); renderActs(); window.__ppdupStop = false;
    try {
      const { n, fails } = await deleteEach(list, ans.hard, (d, t, e) => status(`削除しています… ${d} / ${t}`, d / t, e));
      list.forEach((f) => { if (!fails.has(f.id)) { junkSel.delete(f.id); kitFail.junk.delete(f.id); } });
      fails.forEach((m, id) => kitFail.junk.set(id, m));
      kitTab.junk = fails.size ? 'fail' : 'todo';
      busy = false; setView('junk'); status(`${n} 件を${ans.hard ? '完全に削除' : 'ゴミ箱へ移動'}しました${fails.size ? `・失敗 ${fails.size} 件（「失敗」タブに理由があります。チェックしたまま押すと、もう一度試します）` : ''}。`); log('info', `不要ファイルの削除 ${n} 件（${ans.hard ? '完全削除' : 'ゴミ箱'}）`); refreshView();
    } catch (err) { busy = false; setView('junk'); handleErr(err, 'junk', '削除を停止しました：' + err.message); }
  }

  // ---------- 3〜5・7：共通の型（StepKit） ----------
  // どのステップも「見出し・タブ（実行する／要確認／変更なし／失敗／すべて）・チェック＝実行する・今 → 後の行・下の実行の帯」で組む。
  // 実行は途中で止めずに最後まで進め、失敗は「失敗」タブに理由つきで残す
  const cleanOff = new Set(); // 7. 片付けでチェックを外した項目
  const kitOffS = { junk: new Set(), name: nameOff, clean: cleanOff, sort: new Set(), ren: new Set() };
  const kitFail = { junk: new Map(), name: new Map(), sort: new Map(), ren: new Map(), clean: new Map() };
  const kitTab = { junk: 'todo', name: 'todo', sort: 'todo', ren: 'todo', clean: 'todo' };
  const kitQ = { junk: '', name: '', sort: '', ren: '', clean: '' };
  const KIT_OPT_J = 1;
  const KIT_OPT = { sort: 'ppdup:opt:sort:v1', ren: 'ppdup:opt:ren:v1', clean: 'ppdup:opt:clean:v1' };
  const stepOn = (v) => (v === 'name' ? nameEnabled() : v === 'junk' ? junkEnabled() : KIT_OPT[v] ? (() => { try { return localStorage.getItem(KIT_OPT[v]) !== '0'; } catch (e) { return true; } })() : true);
  const KIT_EX = {
    junk: '作品と関係ないファイル（広告・宣伝の <code>.url</code> <code>.txt</code> <code>.html</code> <code>.exe</code> など、品番がなく宣伝の言葉やサイトのアドレスだけの名前、10MB 以下の画像・短い宣伝動画）を見分けてゴミ箱へ移します。オンの間は、ここで見つけたファイルをほかのステップの対象から外します。作品の可能性があるもの（50MB 以上・品番入り・字幕）は「要確認」に回し、最初はチェックなしです。空になったフォルダは「7. 片付け」でまとめて片付けられます。',
    name: `FC2 のファイル名を <code>FC2-PPV-品番</code> の形にそろえます（例：<code>4k688.com@FC2-PPV-4988183_1.mp4</code> → <code>FC2-PPV-4988183-1.mp4</code>）。サイト名・広告などの余計な文字は消し、<code>_1</code>・<code>part2</code>・<code>cd1</code> などの分割番号は <code>-1</code> の形で残します。同じ場所に同じ名前ができる場合は <code>(1)</code> を付けます。FC2 以外のファイル・中身・置き場所は変えません。`,
    sort: '複数の作品が混ざったフォルダの中で、作品ごとに品番のフォルダを作って（あれば既存のフォルダへ）ファイルを移します。同じ名前のファイルがあるときは <code>(1)</code> を付けます。削除はしません。',
    ren: 'フォルダ名を、中のファイル名（品番）に揃えます。中に複数の作品があるフォルダや、品番が決まらないフォルダは「要確認」に回して変更しません。同じ名前のフォルダがすでにあるときは重ならない名前にします。',
    clean: '重複の削除のあとに残ったものを片付けます：空のフォルダをゴミ箱へ（実行直前にも空か確かめます）、「X の中に X だけ」のフォルダの中身を 1 つ上へ、不要になった <code>(1)</code> を外す。このステップで処理できないものは「要確認」に出します。',
  };
  KIT_EX.dup = '同じファイル名（または同じ品番）のファイルをまとめ、サムネイル・サイズで比べて削除するものを選びます。各組の一番大きいファイルは高画質の候補として最初からチェックなし（残す）。組の 2 本を「コマで比べる」で見比べられます。全部にチェックした組は、確認画面で「強制削除」を選ばない限り削除しません。';
  KIT_EX.seller = '作品フォルダの品番から販売者を調べ（fd2ppv.cc → 見つからなければ fc2cmadb.com、FC2 以外は配信元）、ホーム/販売者別/販売者名（販売者ID）/ へ移動します。調べるだけでは何も動かしません。分からないものは外部サイトで確かめて手で入力できます。';
  const kitExHtml = (v) => `<details class="pd-explain kit-ex"><summary>このステップでできること</summary><div class="note">${KIT_EX[v]}</div></details>`;
  const KIT_VERB = { junk: '削除', name: '変更', sort: '移動', ren: '変更', clean: '実行' };
  const tg = (t, c) => ({ tag: t, tc: c || '' });
  const sortKey = (g) => g.cid + ':' + g.work;
  function kitItems(v) {
    const fail = kitFail[v];
    const fx = (it) => (fail.has(it.id) ? { ...it, st: 'fail', err: fail.get(it.id) } : it);
    if (v === 'junk') return jplan.map((p) => fx({ id: p.id, st: 'todo', grp: p.level === 'del' ? '作品と関係ないファイル（ほかのステップの対象から外しています）' : '要確認：作品の可能性があるもの（削除するならチェック）', before: p.name, after: '', note: `${p.path}　${fmt(p.size)}`, thumb: p.thumb || '', open: p.id, ...tg(p.reason, p.level === 'del' ? 'del' : 'warn'), danger: true }));
    if (v === 'name') return nplan.filter((p) => p.status === 'todo').map((p) => fx({ id: p.id, st: 'todo', grp: p.path || '（読み込んだフォルダの直下）', before: p.cur, after: p.target, note: p.note || '', thumb: (fileById(p.id) || {}).thumb || '', open: p.id, ...tg('名前を変更', 'pri') }));
    if (v === 'sort') return splan.filter((g) => g.status !== 'done').map((g) => { const ren = g.items.filter((x) => x.to !== x.name); return fx({ id: sortKey(g), st: 'todo', grp: g.cpath || '（読み込んだフォルダの直下）', before: g.items.length === 1 ? g.items[0].name : `${g.items.length} 本（${g.items.map((x) => x.name).join('、')}）`, after: `📁 ${g.work}/`, note: ren.length ? '同じ名前があるため：' + ren.map((x) => `${x.name} → ${x.to}`).join('、') : '', thumb: ((fileById(g.items[0].id) || {}).thumb) || '', open: g.cid, ...(g.folderNew ? tg('新しいフォルダ', 'ok') : tg('既存のフォルダへ', 'pri')) }); });
    if (v === 'ren') return rplan.map((p) => { const st = p.status === 'rename' || p.status === 'dup' ? 'todo' : p.status === 'skip' ? 'review' : 'same'; const pp = p.path.slice(0, p.path.length - p.cur.length).replace(/\/$/, '') || '（読み込んだフォルダの直下）'; return fx({ id: p.id, st, grp: pp, before: p.cur, after: p.target || '（未定）', note: p.note || '', open: p.id, ...tg(STLABEL[p.status], p.status === 'skip' ? 'warn' : p.status === 'same' ? '' : 'pri'), folder: true }); });
    if (v === 'clean') {
      const GL = { trash: '空のフォルダをゴミ箱へ', flatten: '入れ子のフォルダをまとめる', rename: '(1) を外す' };
      return cplan.filter((p) => p.status === 'todo' || p.status === 'skip').map((p) => fx({ id: p.id, st: p.status === 'todo' ? 'todo' : 'review', grp: p.status === 'skip' ? '要確認（このステップでは処理できません）' : GL[p.op] || p.op, before: p.cur, after: p.op === 'rename' ? p.target : p.op === 'flatten' ? `中身を 1 つ上の ${p.target} へ` : p.op === 'trash' ? 'ゴミ箱へ' : '', note: [p.path, p.note].filter(Boolean).join('　'), open: p.id, ...tg(p.kind === 'folder' ? 'フォルダ' : 'ファイル', p.op === 'trash' ? 'del' : ''), folder: p.kind === 'folder', danger: p.op === 'trash' }));
    }
    return [];
  }
  const kitRaw = (v, id) => (v === 'junk' ? jplan.find((p) => p.id === id) : v === 'name' ? nplan.find((p) => p.id === id) : v === 'sort' ? splan.find((g) => sortKey(g) === id) : v === 'ren' ? rplan.find((p) => p.id === id) : cplan.find((p) => p.id === id));
  // チェックを外したか（2. 不要ファイルは「要確認」が最初からチェックなしなので、専用の記録を使う）
  const kitIsOff = (v, id) => (v === 'junk' ? (() => { const p = jplan.find((x) => x.id === id); return !p || !junkChecked(p); })() : kitOffS[v].has(id));
  const kitSetOff = (v, id, off) => { if (v === 'junk') junkSel.set(id, !off); else if (off) kitOffS[v].add(id); else kitOffS[v].delete(id); };
  const kitOn = (v, it) => (it.st === 'todo' || it.st === 'fail') && !kitIsOff(v, it.id);
  function kitTargets(v) { return kitItems(v).filter((it) => kitOn(v, it)); }
  function kitPlan(v) { if (v === 'junk') jplan = junkEnabled() ? buildJunkPlan(files, folders) : []; if (v === 'name') nplan = buildNamePlan(workFiles(), folders); if (v === 'sort') splan = buildSortPlan(workFiles(), folders); if (v === 'ren') rplan = buildRenamePlan(workFiles(), folders); if (v === 'clean') cplan = buildCleanPlan(files, folders); }
  function renderKit(v) {
    const main = $('[data-r=main]');
    const s = STEPS.find((x) => x.v === v);
    const ex = `<details class="pd-explain kit-ex"${stepOn(v) ? '' : ' open'}><summary>このステップでできること</summary><div class="note">${KIT_EX[v]}</div></details>`;
    if (!stepOn(v)) { main.innerHTML = ex + `<div class="pd-hero"><h2>このステップはオフになっています</h2><div class="note">「${esc(s.t)}」は行いません。使うときは右上の「このステップを使う」にチェックを入れてください。</div><div class="acts" style="margin-top:16px">${nextHtml(undefined, 'pri big')}</div></div>`; if (!busy) status('このステップはオフです。'); return; }
    const all = kitItems(v);
    const n = (st) => all.filter((it) => (st === 'all' ? true : it.st === st)).length;
    if (!n('todo') && !n('fail') && kitTab[v] === 'todo') { main.innerHTML = ex + (n('review') ? `<div class="st-res"><span class="ic">!</span><span class="tx">実行するものはありません。要確認が ${n('review')} 件あります（「要確認」タブで確かめられます）</span></div>` : '') + kitTabsHtml(v, n) + doneCard(); if (!busy) status('このステップで実行するものはありません。'); return; }
    const tab = kitTab[v], q = kitQ[v].trim().toLowerCase();
    const list = all.filter((it) => (tab === 'all' || it.st === tab) && (!q || (it.before + ' ' + it.after + ' ' + it.grp).toLowerCase().includes(q)));
    const groups = new Map(); list.forEach((it) => { if (!groups.has(it.grp)) groups.set(it.grp, []); groups.get(it.grp).push(it); });
    const row = (it) => {
      const can = it.st === 'todo' || it.st === 'fail', on = can && !kitIsOff(v, it.id);
      const th = it.folder ? `<span class="kit-ic">${ICON_DIR}</span>` : it.thumb ? `<img loading="lazy" referrerpolicy="no-referrer" src="${esc(it.thumb)}" alt="">` : `<span class="kit-ic">${ICON_FILE({ name: it.before, ext: extOf(it.before) })}</span>`;
      return `<div class="pd-row kit-row ${on ? (it.danger ? 'del' : 'sel') : ''}${it.st === 'fail' ? ' fail' : ''}" data-id="${esc(it.id)}"><label class="pd-chk"><input type="checkbox" data-kchk="${esc(it.id)}"${on ? ' checked' : ''}${can ? '' : ' disabled'}></label>
        <div class="pd-th kit-th">${th}</div>
        <div class="pd-info"><div class="pd-name">${esc(it.before)}${it.after ? ` <span class="note">→</span> <b class="kit-to">${esc(it.after)}</b>` : ''}</div>${it.note ? `<div class="note">${esc(it.note)}</div>` : ''}${it.st === 'fail' ? `<div class="kit-err">失敗：${esc(it.err)}</div>` : ''}</div>
        <span class="pd-tag kit-tag ${it.tc}">${esc(it.tag)}</span>${it.open ? `<button class="kit-open" data-kopen="${esc(it.open)}" title="フォルダ一覧でこの項目の場所を開く">場所を開く</button>` : ''}</div>`;
    };
    const body = [...groups].map(([g, l]) => { const chk = l.filter((it) => it.st === 'todo' || it.st === 'fail'); const allOn = chk.length && chk.every((it) => !kitIsOff(v, it.id)); return `<div class="pd-g"><div class="pd-gh">${chk.length ? `<input type="checkbox" data-kgrp="${esc(g)}"${allOn ? ' checked' : ''} title="このまとまりをすべてチェック／外す">` : ''}<span>${esc(g)}</span><span class="note">${l.length} ${UNIT_OF[v] || '件'}</span></div>${l.map(row).join('')}</div>`; }).join('') || '<div class="empty">この区分に該当するものはありません</div>';
    main.innerHTML = ex + kitTabsHtml(v, n) + body + nextButton();
    if (!busy) status(n('todo') + n('fail') ? (v === 'junk' ? '削除するものにチェックを入れて、下の「チェックした n 件を削除」を押してください（PikPak のゴミ箱へ移します）。'.replace('n 件', kitTargets(v).length + ' 件') : '内容を確かめて、まずは「先頭1件だけ試す」で動きを確かめてください。') : 'このステップで実行するものはありません。');
  }
  function kitTabsHtml(v, n) {
    const T = [['todo', '実行する'], ['review', '要確認'], ['same', '変更なし'], ['fail', '失敗'], ['all', 'すべて']].filter(([k]) => k === 'todo' || k === 'all' || n(k));
    return `<div class="kit-tabs">${T.map(([k, l]) => `<button class="kit-tab${kitTab[v] === k ? ' on' : ''}${k === 'fail' ? ' bad' : ''}" data-ktab="${k}">${l}<i>${n(k)}</i></button>`).join('')}<span class="sp"></span><input type="search" data-kq placeholder="絞り込み（品番・名前）" value="${esc(kitQ[v])}"></div>`;
  }
  // 実行：止めずに最後まで。失敗は理由を残す（ログインが切れたときだけ止める）
  async function runKit(v, onlyFirst) {
    const targets = kitTargets(v).slice(0, onlyFirst ? 1 : undefined);
    if (!targets.length || !ensureSession(v)) return;
    busy = true; renderNav(); renderActs(); window.__ppdupStop = false;
    let ok = 0, skipped = 0, ng = 0; const t0 = Date.now();
    for (const it of targets) {
      if (window.__ppdupStop) break;
      const d = ok + skipped + ng;
      status(`${KIT_VERB[v]}しています… ${d + 1} / ${targets.length}：${it.before}`, d / targets.length, d ? `あと約 ${fmtDur((Date.now() - t0) / d * (targets.length - d))}` : '残り時間を計算中…');
      const p = kitRaw(v, it.id);
      try {
        if (!p) throw new Error('計画が見つかりません（作り直してください）');
        const r = v === 'sort' ? (await sortApi(p), true) : v === 'ren' ? (await renameApi(p), true) : await cleanOne(p);
        if (r === false) skipped++; else ok++;
        kitFail[v].delete(it.id);
      } catch (err) {
        if (err.session) { if (v === 'ren') persistFolders(); else saveAll(); busy = false; setView(v); handleErr(err, v, `ログインが切れたため止めました（${ok} 件完了）`); return; }
        ng++; kitFail[v].set(it.id, err.message || String(err)); log('warn', `${STEPS.find((x) => x.v === v).t}：失敗：${it.before}：${err.message || err}`);
      }
      if (v === 'ren') persistFolders(); else saveAll();
      await sleep(v === 'sort' ? 100 : 130);
    }
    busy = false;
    kitTab[v] = ng ? 'fail' : 'todo';
    setView(v);
    const unit = UNIT_OF[v] || '件';
    status(`${ok} ${unit}を${KIT_VERB[v]}しました${skipped ? `（${skipped} 件は実行直前の確認で対象外になりました）` : ''}${ng ? `・失敗 ${ng} 件（「失敗」タブに理由があります。チェックしたまま実行すると、もう一度試します）` : ''}${window.__ppdupStop ? '・中断しました' : ''}。`);
    log('info', `${STEPS.find((x) => x.v === v).t}：${ok} 件・対象外 ${skipped}・失敗 ${ng}`);
    refreshView();
  }
  const renderName = () => renderKit('name'), renderSort = () => renderKit('sort'), renderRen = () => renderKit('ren'), renderClean = () => renderKit('clean');
  const runName = (o) => runKit('name', o), runSort = (o) => runKit('sort', o), runRen = (o) => runKit('ren', o), runClean = (o) => runKit('clean', o);
  const STLABEL = { same: '変更なし', rename: 'フォルダ名を変更', dup: '変更（重複を避ける）', skip: '要確認' };
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
  const dupFail = new Map(); let dupTab = 'todo';
  function dupAllGroups() {
    const m = $('[data-a=mode]'), n = $('[data-a=nearonly]'), qq = $('[data-a=q]');
    let groups = buildGroups(workFiles(), m ? m.value : 'name');
    if (n && n.checked) groups = groups.filter((g) => g.near);
    const q = qq ? qq.value.trim().toLowerCase() : '';
    if (q) groups = groups.filter((g) => g.items.some((x) => x.name.toLowerCase().includes(q)));
    return groups;
  }
  const dupCat = (g) => (g.items.some((f) => dupFail.has(f.id)) ? 'fail' : g.items.some((f, i) => stateOf(f, i) === 'del') ? 'todo' : 'keep');
  function visibleGroups() { const all = dupAllGroups(); if (dupTab !== 'all' && !all.some((g) => dupCat(g) === dupTab)) dupTab = 'all'; return dupTab === 'all' ? all : all.filter((g) => dupCat(g) === dupTab); }
  function dupTabsHtml() {
    const all = dupAllGroups(), n = (k) => (k === 'all' ? all.length : all.filter((g) => dupCat(g) === k).length);
    return `<div class="kit-tabs">${[['todo', '削除するものあり'], ['keep', '残すだけ'], ['fail', '失敗'], ['all', 'すべて']].filter(([k]) => k === 'todo' || k === 'all' || n(k)).map(([k, l]) => `<button class="kit-tab${dupTab === k ? ' on' : ''}${k === 'fail' ? ' bad' : ''}" data-dtab="${k}">${l}<i>${n(k)}</i></button>`).join('')}</div>`;
  }
  function visibleGroups0() {
    const m = $('[data-a=mode]'), n = $('[data-a=nearonly]'), qq = $('[data-a=q]');
    let groups = buildGroups(workFiles(), m ? m.value : 'name');
    if (n && n.checked) groups = groups.filter((g) => g.near);
    const q = qq ? qq.value.trim().toLowerCase() : '';
    if (q) groups = groups.filter((g) => g.items.some((x) => x.name.toLowerCase().includes(q)));
    return groups;
  }
  const delList = (groups) => groups.flatMap((g) => g.items.filter((f, i) => stateOf(f, i) === 'del'));
  function renderDup() { renderDup0(); if (!metaBusy) fetchMeta(dupAllGroups().flatMap((g) => g.items)).then((ch) => { if (ch && view === 'dup') renderDup(); }).catch((e) => { if (e && e.session) handleErr(e, 'dup'); }); const m = $('[data-r=main]'); if (!m) return; if (dupAllGroups().length && !m.querySelector('.kit-tabs')) m.insertAdjacentHTML('afterbegin', dupTabsHtml()); if (!m.querySelector('.kit-ex')) m.insertAdjacentHTML('afterbegin', kitExHtml('dup')); m.querySelectorAll('.pd-row[data-id]').forEach((r) => { const e = dupFail.get(r.dataset.id); if (e && !r.querySelector('.kit-err')) { r.classList.add('fail', 'kit-row'); const i = r.querySelector('.pd-info'); if (i) i.insertAdjacentHTML('beforeend', `<div class="kit-err">失敗：${esc(e)}</div>`); } }); }
  function renderDup0() {
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
          <div class="pd-sz"><b>${fmt(f.size)}</b><div class="note">${diff}</div>${(() => { const m = metaGet(f); return m.dur || m.res ? `<div class="note">${[m.res, m.dur ? fmtT(m.dur) : ''].filter(Boolean).join(' ・ ')}</div>` : ''; })()}</div>
          <div class="pd-act"><button data-s="open">場所を開く</button></div></div>`;
      }).join('');
      const hs = g.items.map((f) => metaGet(f).hash);
      const same = hs.every(Boolean) && new Set(hs).size === 1, part = hs.every(Boolean) && new Set(hs).size < hs.length && !same;
      return `<section class="pd-g"><div class="pd-gh"><span>${esc(g.items[0].name)}</span><span class="note">${g.items.length}件</span>${same ? '<span class="pd-tag" style="background:#d7f0dd;color:#14612f" title="ハッシュ値が同じ＝中身がまったく同じファイル">中身が同じ</span>' : part ? '<span class="pd-tag" style="background:#d7f0dd;color:#14612f" title="この組の中に、中身がまったく同じファイルがあります">中身が同じものあり</span>' : hs.every(Boolean) ? '<span class="pd-tag" title="ハッシュ値が違う＝中身は別のファイル（画質・編集が違うなど）">中身は別</span>' : ''}${g.near ? '<span class="pd-tag">サイズが近い組あり</span>' : ''}<span class="sp"></span><button data-cmpg="${esc(g.key)}" title="この組の 2 本を左右に並べて、いっしょに再生して比べる">▶ 見比べ</button><button data-frg="${esc(g.key)}" title="この組の 2 本を、同じ位置のコマで並べて比べる">▦ コマで比べる</button><button data-g="${esc(g.key)}">この組のチェックを削除</button></div>${rows}</section>`;
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
      const { n, fails } = await deleteEach(targets, ans.hard, (d, t, e) => status(`削除しています… ${d} / ${t}`, d / t, e));
      targets.forEach((f) => dupFail.delete(f.id)); fails.forEach((m, id) => dupFail.set(id, m));
      dupTab = fails.size ? 'fail' : 'todo';
      busy = false; render(); renderNav(); status(`${n} 件を${ans.hard ? '完全に削除' : 'ゴミ箱へ移動'}しました${ans.force ? `（強制削除 ${skipped.length} 組を含む）` : ''}${fails.size ? `・失敗 ${fails.size} 件（「失敗」タブに理由があります）` : ''}。`); log('info', `削除 ${n} 件（${ans.hard ? '完全削除' : 'ゴミ箱'}${ans.force ? '・強制削除 ' + skipped.length + ' 組' : ''}）`); refreshView();
    } catch (err) { busy = false; render(); renderNav(); handleErr(err, 'dup', '削除を停止しました：' + err.message); }
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
        // まとめ先：販売者フォルダの中にあるもの（販売者が 1 つに決まるとき）。なければ「要確認」「販売者不明」以外の 1 つ
        const segs = (x) => String(x.path || '').split('/').filter(Boolean);
        const sidOf = (x) => { const g = segs(x); return g[0] === cfg.root && g.length > 2 ? boxSidOf(g[1]) : ''; };
        const loose = (x) => { const g = segs(x); return g[0] === cfg.root && (g[1] === cfg.review || g[1] === cfg.unknown); };
        const sids = [...new Set(top.map(sidOf).filter(Boolean))];
        let keep = sids.length === 1 ? top.find((x) => sidOf(x) === sids[0]) : null;
        if (!keep && !sids.length) { const k = top.filter((x) => !loose(x)); if (k.length === 1) keep = k[0]; }
        const d = keep || top[0];
        const others = top.filter((x) => x.id !== d.id);
        const where = (x) => (x.path || '').replace(/^\//, '');
        plan.push({ id: 'dup:' + d.id, name: d.name, path: d.path, parentId: d.parentId, keys: keysOf.get(d.id), kind: 'dupw', seller: null, merge: !!keep, keepId: keep ? keep.id : '', keepPath: keep ? where(keep) : '', mergeIds: keep ? others.map((x) => x.id) : [],
          note: keep ? `同じ品番のフォルダが ${top.length} つ：${others.map(where).join(' ／ ')} の中身を ${where(keep)} にまとめます（空になったフォルダはゴミ箱へ）` : `同じ品番のフォルダが ${top.length} つ（販売者が違うため自動ではまとめません）：${top.map(where).join(' ／ ')}`, why: '', depth: 0, dupIds: top.map((x) => x.id) });
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
  const sellerChecked = (p) => ((p.kind === 'pending' && p.fix !== 'nest') || (p.kind === 'dupw' && !p.merge) ? false : sellerSel.has(p.id) ? sellerSel.get(p.id) : (p.fix === 'nest' || p.kind === 'dupw' || (p.kind === 'seller' && !p.fix)));
  const SELLER_KIND = { seller: '決まった', unknown: '販売者不明', review: '要確認', pending: '未調査' };
  let sellerFilter = 'all'; // 絞り込みのタブ
  const sellerFail = new Map(); // 移動できなかった作品 → 理由
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
        ${L.challenge ? '<button class="pri" data-a="skick" title="確認を済ませても続きが始まらないときに押す（ウィンドウを開き直して、同じ作品を調べ直します）">確認が済んだら：続きを調べる</button>' : ''}<button data-a="spause">${L.paused ? '再開' : '一時停止'}</button><button data-a="stop">中断</button>`;
    } else if (st === 1) msg = `<div class="tx"><b>未調査が ${pend} 件あります。まず販売者を調べます</b><small>小さなウィンドウで fd2ppv.cc（見つからなければ fc2cmadb.com）の作品ページを順に開いて調べます。調べるだけでは移動しません。</small></div><button class="pri" data-a="slookup"${busy ? ' disabled' : ''}>販売者を調べる（${pend} 件）</button>`;
    else if (st === 2) msg = `<div class="tx"><b>${unk} 件は販売者が分かりませんでした。外部サイトで確かめて入力してください</b><small>${selPlan.length} 件中 ${selPlan.length - unk} 件は決まりました${parts ? `（${parts}）` : ''}。入力しなくても「${esc(sellerCfg().unknown)}」「${esc(sellerCfg().review)}」へまとめて移動できます。</small></div><button class="pri" data-a="sshowunk">分からない ${unk} 件を確かめる</button><button data-a="sack">このまま ③ 移動へ</button>`;
    else msg = `<div class="tx"><b>${mv ? `チェックした ${mv} 件を移動できます。下のボタンで実行します` : 'チェックの入った作品がありません'}</b><small>${selPlan.length} 件中 ${selPlan.length - unk} 件は販売者が決まりました${parts ? `（${parts}）` : ''}。まずは「先頭1件だけ試す」で動きを確かめてください。削除はしません。</small></div>${unk ? `<button data-a="sunack">② に戻る（分からない ${unk} 件）</button>` : ''}`;
    return `<section class="sl-guide" aria-label="次にやること"><div class="fl">${flow}</div><div class="msg">${msg}</div></section>`;
  }
  function sellerBarHtml() {
    if (busy) return '';
    const sel = selPlan.filter((p) => (p.kind !== 'pending' || p.fix === 'nest') && sellerChecked(p));
    const cfg = sellerCfg();
    const cnt = new Map(); sel.forEach((p) => { const k = p.fix === 'nest' ? 'My Pack へ' : p.kind === 'dupw' ? '同じ品番をまとめる' : p.kind === 'seller' ? p.seller.name : p.kind === 'unknown' ? cfg.unknown : cfg.review; cnt.set(k, (cnt.get(k) || 0) + 1); });
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
    renderSeller0(); const m = $('[data-r=main]'); if (!m) return;
    if (!m.querySelector('.kit-ex')) m.insertAdjacentHTML('afterbegin', kitExHtml('seller'));
    // 実行結果のカード（ほかのステップと同じく一覧の上に残す）
    const r = lastResult.seller;
    if (r && !m.querySelector('.st-res')) { const bad = /失敗|できません|停止|エラー|止め/.test(r.text); m.insertAdjacentHTML('afterbegin', `<div class="st-res${bad ? ' warn' : ''}" role="status"><span class="ic">${bad ? '!' : '✓'}</span><span class="tx">${esc(r.text)}</span><button data-a="resclose" title="閉じる" aria-label="閉じる">${IC.x}</button></div>`); }
  }
  function renderSeller0() {
    const cfg = sellerCfg();
    if (!sellerEnabled()) { $('[data-r=main]').innerHTML = `<div class="pd-hero"><h2>このステップはオフになっています</h2><div class="note">右上の「このステップを使う」か、設定の「整理」でオンにできます。</div></div>${nextButton()}`; if (!busy) status('販売者ごとの仕分けはオフです。'); return; }
    const by = (k) => selPlan.filter((p) => p.kind === k);
    if (sellerFilter !== 'all' && !(sellerFilter === 'fix' ? selPlan.some((p) => p.fix) : sellerFilter === 'fail' ? selPlan.some((p) => sellerFail.has(p.id)) : by(sellerFilter).length)) sellerFilter = 'all';
    const show = sellerFilter;
    const ix = buildTreeIndex();
    const R = folders.find((d) => d.isRoot);
    const homeScan = !!R && (!R.id || R.id === 'root');
    const sellers = new Map();
    by('seller').filter((p) => !p.fix).forEach((p) => { const k = p.seller.sid; if (!sellers.has(k)) sellers.set(k, { s: p.seller, items: [] }); sellers.get(k).items.push(p); });
    const groups = [];
    const fixes = selPlan.filter((p) => p.fix);
    if (show === 'fail') groups.push({ key: 'k:fail', title: '失敗（移動できなかった作品）', dest: '', items: selPlan.filter((p) => sellerFail.has(p.id)), cls: ' warn', hint: '理由を確かめて、チェックしたまま「移動」を押すともう一度試します' });
    if (show === 'all' || show === 'fix') if (fixes.length) groups.push({ key: 'k:fix', title: '置き場所の修正（入れ子・販売者違いなど）', dest: '', items: fixes, cls: ' warn', hint: '入れ子は My Pack へ出します（初めからチェック）。ほかは正しい販売者フォルダへ（初めはチェックなし）' });
    if (show === 'all' || show === 'unknown') if (by('unknown').length) groups.push({ key: 'k:unknown', title: cfg.unknown, dest: `${cfg.root}/${cfg.unknown}/`, items: by('unknown'), cls: ' unk', hint: '入力すると、その販売者の組へ移ります' });
    if (show === 'all' || show === 'review') if (by('review').length) groups.push({ key: 'k:review', title: cfg.review, dest: `${cfg.root}/${cfg.review}/`, items: by('review'), cls: ' warn', hint: '自動では移動しません（初めはチェックなし）' });
    if (show === 'all' || show === 'pending') if (by('pending').filter((p) => !p.fix).length) groups.push({ key: 'k:pending', title: SELLER_KIND.pending, dest: '', items: by('pending').filter((p) => !p.fix), cls: ' pend', hint: '「販売者を調べる」で調べます（調べるだけでは移動しません）' });
    if (show === 'all' || show === 'dupw') if (by('dupw').length) groups.push({ key: 'k:dupw', title: '同じ品番のフォルダが複数', dest: '', items: by('dupw'), cls: ' pend', hint: '中身を 1 つのフォルダにまとめます（初めからチェック）。まとめたあと「6. 重複を比べて削除」で同じファイルを片付けられます' });
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
      return `<div class="pd-row sl-row${on ? ' sel' : ''}" data-srow="${esc(p.id)}"><label class="pd-chk"><input type="checkbox" data-schk="${esc(p.id)}"${on ? ' checked' : ''}${(p.kind === 'pending' && p.fix !== 'nest') || (p.kind === 'dupw' && !p.merge) ? ' disabled' : ''}></label>
        <div class="pd-th" style="width:112px;height:63px">${thumb(p)}</div>
        <div class="pd-info"><div class="pd-name">${esc(p.name)}</div><div class="pd-path">今の場所：${esc((p.path || '').replace(/\/[^/]*$/, '') || '/')}/・${sz(p)}</div><div class="sl-why"><span class="sl-b ${bc}">${bt}</span><span class="note">${esc(p.note)}</span></div>${sellerFail.has(p.id) ? `<div class="kit-err">失敗：${esc(sellerFail.get(p.id))}</div>` : ''}</div>
        ${input}</div>`;
    };
    const tagNew = (g) => { if (!g.sid) return ''; const ex = sellerFolderExists(g.sid); return `<span class="pd-tag" style="${ex ? '' : 'background:var(--pri-soft);color:var(--pri)'}">${ex ? '既にあるフォルダ' : '新しく作るフォルダ'}</span>`; };
    const body = groups.map((g) => {
      const all = g.items.filter((p) => p.kind !== 'pending' && (p.kind !== 'dupw' || p.merge)), on = all.filter(sellerChecked);
      return `<div class="pd-g${g.cls}"><div class="pd-gh">${g.key === 'k:pending' || (g.key === 'k:dupw' && !all.length) ? '' : `<input type="checkbox" data-sgrp="${esc(g.key)}"${all.length && on.length === all.length ? ' checked' : ''} title="この組をすべて選ぶ／外す">`}<b>${esc(g.title)}</b>${g.sid ? `<span class="note raw">（${esc(g.sid)}）</span>` : ''}${tagNew(g)}${g.dest ? `<span class="note">→ ${esc(g.dest)}</span>` : ''}<span class="sp" style="flex:1"></span>${g.hint ? `<span class="note">${esc(g.hint)}</span>` : ''}<span class="note">${g.items.length} 作品</span></div>${g.items.map(row).join('')}</div>`;
    }).join('');
    const tab = (k, label, color, n) => `<button role="tab" data-sfilter="${k}" class="${show === k ? 'on' : ''}" aria-selected="${show === k}"${n || k === 'all' ? '' : ' disabled'}><i style="background:${color}"></i>${label}<b>${n}</b></button>`;
    const tabs = selPlan.length ? `<div class="sl-tabs" role="tablist" aria-label="表示">${tab('all', 'すべて', '#c5c9d2', selPlan.length)}${selPlan.some((p) => sellerFail.has(p.id)) ? tab('fail', '失敗', '#d64545', selPlan.filter((p) => sellerFail.has(p.id)).length) : ''}${tab('unknown', '販売者不明', '#8b91a1', by('unknown').length)}${tab('review', '要確認', '#c27a00', by('review').length)}${tab('pending', '未調査', '#dde0e6', by('pending').length)}${fixes.length ? tab('fix', '置き場所の修正', '#c27a00', fixes.length) : ''}${by('dupw').length ? tab('dupw', '同じ品番が複数', '#8b91a1', by('dupw').length) : ''}${tab('seller', `決まった（${sellers.size} 販売者）`, '#306fff', by('seller').length)}</div>` : '';
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
      const off = () => { clearTimeout(timer); clearInterval(watch); window.removeEventListener('message', on); lookupSt.kick = null; };
      const arm = () => { clearTimeout(timer); timer = setTimeout(() => { off(); resolve({ status: challenged ? 'challenge' : 'timeout' }); }, limit); };
      const on = (e) => {
        if (e.origin !== origin || !e.data || e.data.type !== 'ppdup-seller') return;
        // 合言葉で照合する（画面を後から組み立てるサイトで # が消えたときは品番で照合）
        if (e.data.token ? e.data.token !== token : !((num && e.data.num === num) || (kwq && e.data.kw === kwq))) return;
        if (e.data.status === 'challenge') { if (!challenged) { challenged = true; limit = 5 * 60 * 1000; arm(); lookupSt.kick = () => { off(); resolve({ status: 'severed' }); }; onChallenge(origin); } return; } // 確認を済ませるとページが切り替わり、もう一度知らせが来る
        off(); resolve(e.data);
      };
      // 確認画面（Cloudflare など）を通ると、サイト側の設定でこちらとのつながりが切れ、ウィンドウが「閉じた」ように見えることがある。
      // 確認画面のあとに閉じたように見えたときは「つながりが切れた」として扱い、呼び出し側で開き直して同じページを調べ直す
      const watch = setInterval(() => { if (win.closed) { off(); resolve({ status: challenged ? 'severed' : 'closed' }); } }, 500);
      window.addEventListener('message', on); arm();
      try { win.location.href = `${url}#ppdup-lookup=${token}`; } catch (err) { off(); resolve({ status: 'closed' }); }
    });
  }
  // 1 つの品番を調べる：FC2 は fd2ppv.cc → 見つからなければ fc2cmadb.com、それ以外は fd2ppv.cc で検索して作品ページの配信元
  async function lookupKey(win, k, onChallenge) {
    const stopped = (r) => r.status === 'closed' || r.status === 'challenge' || r.status === 'severed';
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
      //   確認画面を通ったあとはつながりが切れていることが多いので（severed）、何度でも開き直す（確認は済んでいるので次はそのまま読める）
      for (let retry = 0, sev = 0; (r.status === 'severed' ? sev++ < 4 : retry++ < 2) && (r.status === 'timeout' || r.status === 'challenge' || r.status === 'severed' || (r.status === 'closed' && retry === 1 && lookupSt.challenge)) && !window.__ppdupStop;) {
        log('info', `販売者の調査：開き直してもう一度調べます（${r.status === 'severed' ? '確認画面のあとでつながりが切れたため' : r.status}）`, k.label);
        try { win.close(); } catch (e) { /* 無視 */ }
        await sleep(r.status === 'severed' ? 400 : 800);
        win = window.open('about:blank', 'ppdup-lookup' + (++lookupSeq), 'width=560,height=720');
        if (!win) break;
        parked = false; lookupSt.challenge = '';
        r = await lookupKey(win, k, onCh);
      }
      if (!win) { stop = '小さなウィンドウを開き直せませんでした（ポップアップを許可してください）'; break; }
      lookupSt.challenge = '';
      if (!parked && r.status !== 'closed' && r.status !== 'challenge') { parkWin(win); parked = true; }
      if (r.status === 'closed') { stop = 'ウィンドウが閉じられたため止めました'; break; }
      if (r.status === 'challenge' || r.status === 'severed') { stop = '確認画面のあと、続きを読み取れなかったため止めました（もう一度「販売者を調べる」を押すと続きから調べます）'; break; }
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
    const targets = selPlan.filter((p) => (p.kind !== 'pending' || p.fix === 'nest') && (p.kind !== 'dupw' || p.merge) && sellerChecked(p)).sort((a, b) => (b.depth || 0) - (a.depth || 0)).slice(0, onlyFirst ? 1 : undefined);
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
        // 同じ品番のフォルダ：ほかのフォルダの中身をまとめ先へ移し、空になったフォルダはゴミ箱へ（同じ名前は (1) を付ける）
        if (p.kind === 'dupw') {
          const into = await apiList(p.keepId), names = new Set(into.map((x) => x.name.toLowerCase()));
          for (const oid of p.mergeIds) {
            const kids = await apiList(oid);
            for (const k of kids) {
              let nm = k.name;
              if (names.has(nm.toLowerCase())) { const m = nm.match(/^(.*?)(\.[A-Za-z0-9]{2,5})?$/); let i = 1; do { nm = `${m[1]}(${i++})${m[2] || ''}`; } while (names.has(nm.toLowerCase())); await apiRename(k.id, nm); }
              names.add(nm.toLowerCase());
            }
            if (kids.length) await apiMove(kids.map((k) => k.id), p.keepId);
            await api('/files:batchTrash', { method: 'POST', body: JSON.stringify({ ids: [oid] }) });
            const it = folders.find((d) => d.id === oid); if (it) dropFromScan(it);
          }
          ok++; saveAll(); log('info', `同じ品番のフォルダをまとめました：${p.name} → ${p.keepPath}`); await sleep(100); continue;
        }
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
        ok++; sellerFail.delete(p.id); saveAll();
        } catch (err) {
          // ログイン切れ以外は、その作品だけ飛ばして続ける
          if (err.session) throw err;
          skip++; failed.push(p.name); sellerFail.set(p.id, err.message || String(err)); log('error', `移動できませんでした：${p.name}（${err.message}）`, 'seller');
        }
        await sleep(100);
      }
    } catch (err) { saveAll(); busy = false; setView('seller'); handleErr(err, 'seller', `停止：${err.message}（${ok} 作品完了）`); return; }
    if (meta) { meta.nfo = folders.length; meta.nfi = files.length; try { localStorage.setItem(LS_META, JSON.stringify(meta)); } catch (e) { /* 無視 */ } }
    busy = false; if (failed.length) sellerFilter = 'fail'; setView('seller');
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
    renderTree(); $('[data-r=main]').scrollTop = 0; ddKick();
    status(tree.base ? `「${dirLabel(id)}」を最上位にして表示しています（${KEY.up} または上のパスで戻れます）` : '読み込んだ場所から表示しています');
    if (needLoad(tree.base)) loadAndRender([tree.base]);
  }
  // 表示する行（開いているフォルダの中だけ）。絞り込み中は、一致したものとその上のフォルダを開いて表示
  // ---- フォルダ一覧の列：出す列と幅（名前は残りの幅いっぱい）。スマホは名前・サイズだけ ----
  const LS_COLS = 'ppdup:cols:v1';
  const COLS = { size: ['サイズ', 100], date: ['追加日', 110], kind: ['種類', 110], n: ['項目', 80], pct: ['割合', 160] };
  const COL_DEF = { on: { size: true, date: true, kind: false, n: false, pct: false }, w: {} };
  function colCfg() { let c = {}; try { c = JSON.parse(localStorage.getItem(LS_COLS) || '{}') || {}; } catch (e) { c = {}; } return { on: { ...COL_DEF.on, ...(c.on || {}) }, w: { ...(c.w || {}) } }; }
  const saveColCfg = (c) => { try { localStorage.setItem(LS_COLS, JSON.stringify(c)); } catch (e) { /* 無視 */ } };
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
        ${colList().map((k) => k === 'size' ? `<span class="c-size">${sizeOf(r)}</span>` : k === 'date' ? `<span class="c-date">${r.f && r.f.ct ? esc(new Date(r.f.ct).toLocaleDateString(loc(), { year: '2-digit', month: 'numeric', day: 'numeric' })) : ''}</span>` : k === 'kind' ? `<span class="c-kind">${esc(kindOf(r))}</span>` : k === 'n' ? `<span class="c-n">${r.kind === 'folder' ? (r.unloaded ? '—' : r.n + ' 項目') : ''}</span>` : pctCell(r)).join('')}</div>`;
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
    else { plStop('ql'); unloadMedia(d); } // 次・前のファイルへ移るときは、前の動画とシークバー用の影の動画を片付ける
    qlRun++;
    qlOpen = true;
    const big = r.kind === 'file' && r.thumb ? `<img src="${esc(r.thumb)}" referrerpolicy="no-referrer" alt="">` : `<div class="ql-ic">${r.kind === 'folder' ? ICON_DIR : ICON_FILE(r)}</div>`;
    const ix = treeIdx;
    const info = r.kind === 'folder' ? `${r.n} 項目（中のファイル ${ix.agg.get(r.id).files} 件）・${fmt(r.size)}` : `${esc(kindOf(r))}・${fmt(r.size)}`;
    const jr = r.kind === 'file' && junkEnabled() ? (prepJunk(files, folders), junkInfo(r.f)) : null;
    d.innerHTML = `<div class="ql"><div class="ql-h"><button data-qlclose title="閉じる（スペース / Esc）" aria-label="閉じる">${IC.x}</button><b>${esc(r.name)}</b></div><div class="ql-b">${big}</div>
      <div class="ql-f"><div>${info}</div><div class="note">${esc((r.kind === 'folder' ? r.path : r.path + '/').replace(/^\/?/, '/').replace(/\/+$/, '') || '/')}</div>${jr ? `<div style="color:#ff6b6b">不要ファイルの判定：${esc(jr.reason)}</div>` : ''}${isVideoRow(r) ? `<div class="ql-acts"><button data-qlplay class="pri" title="このプレビューの中で再生">▶ ここで再生</button><button data-qlfull title="全画面で再生">⛶ 全画面</button><button data-qlframes title="コマ一覧（動画の中身を 16 コマで見る）">▦ コマ一覧</button>${rateSelect()}<button data-qlext title="外部プレーヤーで開く">↗ ${esc(EXT_PLAYERS[playPref().ext].short)}</button><button data-qlset title="再生のしかたの設定（ダブルクリック時の動作・外部プレーヤー）" aria-label="再生のしかたの設定">${IC.gear}</button></div>` : ''}</div></div>`;
    d.classList.remove('playing'); plStop('ql');
    const on = (sel, fn) => { const b = d.querySelector(sel); if (b) b.onclick = fn; };
    on('[data-qlplay]', () => qlPlay(r.id));
    on('[data-qlfull]', () => playFile(r.id, { full: true }));
    on('[data-qlext]', () => { const v = d.querySelector('video'); if (v) v.pause(); openExternal(r.id); });
    on('[data-qlset]', () => openSettings('play'));
    on('[data-qlframes]', () => { closeQL(); openFrames([r.id]); });
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
        ${rows.length === 2 && rows.every(isVideoRow) ? '<button data-ta="compare" title="選んだ 2 本を左右に並べて、いっしょに再生して比べる">▶ 2 本を見比べる</button>' : ''}
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
    let p = {}; try { p = JSON.parse(localStorage.getItem(LS_PLAY) || '{}'); } catch (e) { p = {}; }
    if (!MODES[p.mode]) p.mode = 'inline'; // 以前の「プレーヤー画面」はプレビューでの再生にまとめた
    if (!extList().includes(p.ext)) p.ext = IS_MAC ? 'iina' : OS === 'win' ? 'potplayer' : 'm3u';
    return p;
  }
  const savePlayPref = (p) => { try { localStorage.setItem(LS_PLAY, JSON.stringify(p)); } catch (e) { /* 無視 */ } };
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
    try { info = await api('/files/' + id + '?thumbnail_size=SIZE_LARGE'); } catch (e) { if (e.gone) throw markGone(id); throw e; }
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
    box.innerHTML = '<div class="qp-stage"><video autoplay playsinline preload="auto"></video></div>';
    const v = box.querySelector('video');
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
    try { mediaDb = JSON.parse(localStorage.getItem(LS_MEDIA) || '{}') || {}; } catch (e) { mediaDb = {}; }
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
      try { localStorage.setItem(LS_MEDIA, JSON.stringify(db)); } catch (e) { /* 無視 */ }
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
  async function openExternal(id, ext, name) {
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
        <div class="row col"><b>開き方</b>${[['full', '全画面（おすすめ）', 'PikPak の画面を Dedupe に切り替えて、広い画面で使います'], ['pop', 'ポップアップ', 'PikPak の画面の上に重ねて開きます。動かしたり大きさを変えたりでき、後ろの PikPak もそのまま使えます']].map(([k, l, d]) => `<label><input type="radio" name="pdopen" data-s="openmode" value="${k}"${(root.classList.contains('on') ? winMode : openPref()) === k ? ' checked' : ''}> <span><b>${l}</b><small style="display:block">${d}</small></span></label>`).join('')}</div>
        <div class="row"><span><b>表示言語</b></span><select data-s="lang"><option value="auto"${lp === 'auto' ? ' selected' : ''}>自動（ブラウザ）</option><option value="ja" data-raw${lp === 'ja' ? ' selected' : ''}>日本語</option><option value="en" data-raw${lp === 'en' ? ' selected' : ''}>English</option></select></div>
        <div class="row"><span><b>フォルダ一覧の表示</b></span><select data-s="tview"><option value="list"${tree.view === 'list' ? ' selected' : ''}>☰ リスト</option><option value="thumb"${tree.view === 'thumb' ? ' selected' : ''}>▤ サムネイル</option><option value="tile"${tree.view === 'tile' ? ' selected' : ''}>▦ タイル</option></select></div>
        <label class="row"><span><b>サムネイルをぼかす</b><small>人に画面を見られても分からないよう、サムネイル・プレビュー・コマをぼかします（このブラウザだけの設定）</small></span><input type="checkbox" data-s="blur"${blurOn() ? ' checked' : ''}></label>
        <label class="row"><span><b>マウスを乗せたら、はっきり表示</b><small>「サムネイルをぼかす」がオンのとき、マウスを乗せた（スマホは押している）間だけぼかしを外します</small></span><input type="checkbox" data-s="blurhov"${blurHov() ? ' checked' : ''}${blurOn() ? '' : ' disabled'}></label>
        <label class="row"><span><b>起動時に Dedupe を全画面で開く</b><small>PikPak を開いたら、最初から Dedupe の画面で使います（✕ で閉じれば PikPak の画面に戻ります）。開いている画面は URL に残るので、戻る・再読み込み・ブックマークで同じ画面に戻れます</small></span><input type="checkbox" data-s="autostart"${autoStart() ? ' checked' : ''}></label>
        <label class="row"><span><b>端でスクロール</b><small>一覧の下（上）の端にマウスを持っていくと、ゆっくりスクロールします。上のバーの ⇕ ボタンでも切り替えられます</small></span><input type="checkbox" data-s="edge"${edgeOn() ? ' checked' : ''}></label>
        <div class="row"><span><b>入口ボタン（Dedupe）の位置</b><small>ボタンはドラッグで好きな場所へ動かせます（右クリックで置き場所を選べます）。既定は PikPak の左メニューの空き</small></span><button data-s="fabreset"${fabSaved() ? '' : ' disabled'}>元に戻す</button></div>
        <label class="row"><span><b>ホバーでサムネイル</b><small>マウスを乗せたときにサムネイルを大きく表示します</small></span><input type="checkbox" data-s="hover"${tree.hover !== false ? ' checked' : ''}></label>
        <div class="row"><span><b>フォルダ一覧の操作</b><small>${esc(helpTree)}</small></span></div>` : ''}
        ${sec('play') ? `<h3 data-sec="play">再生</h3>
        <div class="row col"><b>▶ 再生ボタン・ダブルクリックのとき</b>${Object.keys(MODES).map((k) => `<label><input type="radio" name="pdmode" data-s="mode" value="${k}"${p.mode === k ? ' checked' : ''}> ${MODES[k]}</label>`).join('')}</div>
        <div class="row"><span><b>外部プレーヤー（${OS_NAME}）</b><small>${IS_MAC ? 'IINA・Infuse はアプリが入っていれば直接起動します。' : OS === 'win' ? 'PotPlayer はアプリが入っていれば直接起動します。GOM Player・VLC などは「既定のアプリで開く」を選び、.m3u ファイルを開くアプリにそのプレーヤーを設定してください。' : 'VLC・mpv・Celluloid などは「既定のアプリで開く」を選び、.m3u ファイルを開くアプリにそのプレーヤーを設定してください。'}</small></span><select data-s="ext">${extList().map((k) => `<option value="${k}"${p.ext === k ? ' selected' : ''}>${esc(EXT_PLAYERS[k].short)}</option>`).join('')}</select></div>
        <div class="row"><span><b>簡易プレーヤーの操作</b><small>Space / K 再生・一時停止、← → 移動（Shift で大きく）、J / L 戻る・進む、, . 1 コマ、↑ ↓ 音量、M 消音、0〜9 位置、[ ] 速度、F 全画面、ホイール・ピンチ・Z / X ズーム（R・ダブルクリックで戻す）、Enter 外部プレーヤー</small></span></div>
        ${Object.keys(QP_OPTS).map((k) => `<div class="row"><span><b>${esc(QP_OPTS[k][0])}</b></span>${qpSelect(k, 'data-s="qp"')}</div>`).join('')}` : ''}
        ${sec('org') ? `<h3>整理</h3>
        <label class="row"><span><b>作品と関係ないファイルを除外する</b><small>広告・宣伝のファイルや 10MB 以下のファイルなどを、ほかの作業の対象から外します</small></span><input type="checkbox" data-s="junk"${junkEnabled() ? ' checked' : ''}></label>
        <label class="row"><span><b>ファイル名を整える</b><small>オフにすると、このステップを使わず次へ進みます</small></span><input type="checkbox" data-s="name"${nameEnabled() ? ' checked' : ''}></label>` : ''}
        ${sec('org') ? `<div class="row"><span><b>解凍パスワード</b><small>解凍できたパスワード ${pwList().length} 件（次から自動で順に試します）。このブラウザにだけ暗号化して保存</small></span><button data-s="pwclear"${pwList().length ? '' : ' disabled'}>消去</button></div>` : ''}
        ${sec('org') ? `<h3>販売者ごとに仕分け</h3>
        <label class="row"><span><b>このステップを使う</b><small>オフにすると「8. 販売者ごとに仕分け」を使いません</small></span><input type="checkbox" data-s="seller"${sellerEnabled() ? ' checked' : ''}></label>
        <div class="row"><span><b>まとめるフォルダ</b><small>ホームの直下に作ります</small></span><input type="text" data-s="scfg" data-k="root" value="${esc(sellerCfg().root)}" style="width:150px;font:inherit;padding:6px 10px;border:1px solid var(--ctl-line);border-radius:8px;background:var(--ctl);color:inherit"></div>
        <div class="row"><span><b>販売者が分からないとき</b></span><input type="text" data-s="scfg" data-k="unknown" value="${esc(sellerCfg().unknown)}" style="width:150px;font:inherit;padding:6px 10px;border:1px solid var(--ctl-line);border-radius:8px;background:var(--ctl);color:inherit"></div>
        <div class="row"><span><b>判断できないとき</b></span><input type="text" data-s="scfg" data-k="review" value="${esc(sellerCfg().review)}" style="width:150px;font:inherit;padding:6px 10px;border:1px solid var(--ctl-line);border-radius:8px;background:var(--ctl);color:inherit"></div>
        <div class="row"><span><b>調べる間隔</b><small>短くしすぎると、相手のサイトに断られることがあります</small></span><select data-s="scfg" data-k="interval">${[1, 1.5, 3].map((v) => `<option value="${v}"${sellerCfg().interval === v ? ' selected' : ''}>${v} 秒</option>`).join('')}</select></div>
        <div class="row"><span><b>調べた結果</b><small>${Object.keys(sellerDb).length} 件（手入力 ${Object.values(sellerDb).filter((r) => r.src === 'manual').length} 件を含む）。このブラウザにだけ保存</small></span><button data-s="sclear"${Object.keys(sellerDb).length ? '' : ' disabled'}>消去</button></div>` : ''}
        ${sec('info') ? `<h3>情報</h3>
        <div class="row"><span><b>PikPak Distill – Dedupe</b><small class="ver">v${VER} · Noel Labs</small></span><button data-s="changelog">更新履歴</button></div>
        <div class="row"><span><b>PikPak で同期する</b><small>調査結果・判断・設定を PikPak の「${esc(SYNC_DIR)}」に保存し、ほかのブラウザやアプリと共有します（ログイン情報は含めません）</small><small data-r="syncrow"></small><label style="display:flex;gap:6px;align-items:center;margin-top:4px"><input type="checkbox" data-s="syncpw"${syncCfg().pw ? ' checked' : ''}> 解凍パスワードも同期する（合言葉で暗号化）</label></span><span style="display:flex;gap:8px;align-items:center"><button data-s="syncnow"${syncCfg().on && syncCfg().asked ? '' : ' disabled'}>今すぐ同期</button><input type="checkbox" data-s="syncon" title="同期する"${syncCfg().on && syncCfg().asked ? ' checked' : ''}></span></div>
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
    else if (k === 'fabreset') { setFabPos(null, '入口ボタンを元の位置に戻しました'); renderSettings(); }
    else if (k === 'sclear') { if (confirm(tr('調べた販売者の結果（手入力を含む）をすべて消去しますか？'))) { sellerDb = {}; saveSellerDb(); syncCleared(LS_SELLER); sellerSel.clear(); log('info', '販売者の調査結果を消去'); renderSettings(); if (root.classList.contains('on') && !busy) setView(view); } }
    else if (k === 'pwclear') { if (confirm(tr('記録した解凍パスワードをすべて消去しますか？'))) { clearPws(); syncCleared(LS_PWX); log('info', '解凍パスワードを消去'); renderSettings(); } }
    else if (k === 'syncnow') syncNow('手動').then((ok) => { status(ok ? 'PikPak と同期しました' : '同期できませんでした（「ログを表示」で理由を確認できます）'); renderSettings(); });
    else if (k === 'export') exportData();
    else if (k === 'import') importData();
    else if (k === 'changelog') window.open('https://github.com/Noel-Labs39/pikpak-distill/blob/main/CHANGELOG.md', '_blank', 'noopener');
  }
  function onSettingsChange(e) {
    const t = e.target, k = t.dataset.s;
    if (k === 'syncon') { saveSyncCfg({ asked: true, on: t.checked }); if (t.checked) syncNow('オンにした'); renderSettings(); return; }
    if (k === 'syncpw') {
      if (t.checked) { syncPassKey().then(async (have) => { const pass = askPass(have ? '解凍パスワードを、合言葉で暗号化して同期します（前に決めた合言葉を入れてください）。' : 'ほかの端末と同じ合言葉を決めてください。解凍パスワードは、この合言葉で暗号化してから PikPak に保存します。', !have); if (!pass) { t.checked = false; return; } await setSyncPass(pass); saveSyncCfg({ pw: true }); syncNow('解凍パスワード'); renderSettings(); }); }
      else { saveSyncCfg({ pw: false }); idb.del('sync').catch(() => {}); try { localStorage.removeItem(LS_PWX); } catch (e) { /* 無視 */ } }
      return;
    }
    if (k === 'edge') { setEdge(t.checked); return; }
    if (k === 'autostart') { try { localStorage.setItem(LS_AUTO, t.checked ? '1' : '0'); } catch (err) { /* 無視 */ } status(t.checked ? '次に PikPak を開いたときから、Dedupe を全画面で開きます' : '起動時には開かないようにしました'); return; }
    if (k === 'qp') { saveQpCfg({ [t.dataset.k]: qpVal(t.dataset.k, t.value) }); return; }
    if (k === 'lang') { setLang(t.value); return; }
    if (k === 'expg') { exportSel[t.value] = t.checked; return; }
    if (k === 'blur' || k === 'blurhov') { try { localStorage.setItem(k === 'blur' ? LS_BLUR : LS_BLURHOV, t.checked ? '1' : '0'); } catch (e) { /* 無視 */ } applyBlur(); renderSettings(); return; }
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
  let qlRun = 0;
  async function qlPlay(id) {
    const myRun = qlRun;
    const d = document.getElementById('pd-ql'); if (!d) return;
    const box = d.querySelector('.ql-b'), f = fileById(id); if (!box || !f) return;
    if (!ensureSession('tree')) return;
    box.insertAdjacentHTML('beforeend', '<div class="pl-msg ql-wait">再生の準備中…</div>');
    // 画質の切り替えと解像度の表示（以前の「プレーヤー画面」の機能をプレビューにまとめた）
    const acts = d.querySelector('.ql-acts'), inf = d.querySelector('.ql-f > div');
    const base = inf ? inf.textContent : '';
    const P = playerCore(box, id, {
      slot: 'ql', name: f.name,
      alive: () => document.body.contains(box) && treeCur === id && myRun === qlRun,
      qp: { ext: () => openExternal(id) },
      onMeta: (v) => { if (inf) inf.textContent = base + (v.videoWidth ? ` ・ ${v.videoWidth}×${v.videoHeight}` : ''); },
      noSource: '再生用リンクを取得できませんでした',
      unplayable: 'この画質（HLS）はこのブラウザの中では再生できません。別の画質か外部プレーヤーを選んでください。',
      fail: (x, why) => { box.insertAdjacentHTML('beforeend', `<div class="pl-msg pl-err">「${esc(x.label)}」は再生できませんでした${why ? `（${esc(why)}）` : ''}。下の「画質」で別の画質を試せます。</div>`); log('warn', `再生できない画質：${x.label}`, f.name); },
      onSources: (S, k) => {
        if (acts && S.src.length > 1 && !acts.querySelector('[data-qlq]')) {
          acts.insertAdjacentHTML('afterbegin', `<select data-qlq title="画質">${S.src.map((x, j) => `<option value="${j}"${j === k ? ' selected' : ''}>${esc(x.label)}${x.hls ? '・変換' : ''}${S.playable(x) ? '' : '（このブラウザでは再生不可）'}</option>`).join('')}</select>`);
          acts.querySelector('[data-qlq]').onchange = (e) => P.load(+e.target.value);
        }
      },
    });
    try {
      if (!(await P.ready)) return;
      d.classList.add('playing');
      log('info', 'プレビューで再生：' + f.name);
    } catch (err) { if (err.session) { closeQL(); handleErr(err, 'tree'); return; } box.insertAdjacentHTML('beforeend', `<div class="pl-msg pl-err">${esc(err.message)}</div>`); }
  }
  let playRun = 0;
  // ---------- 共通プレーヤー ----------
  // 再生元の取得・最初の画質選び・video への接続・画質の切り替え・失敗の表示・後片付け・再生の記録を 1 か所にまとめる。
  // 置き場所（プレーヤー画面・フォルダ一覧のプレビュー・左メニューのプレビュー）は見た目と操作だけを受け持つ
  //   o.slot   … PL のどこに置くか（同じ場所の前の再生は止める）
  //   o.pick   … 'pref'＝前回選んだ種類の画質（既定）／'light'＝一番軽い変換画質（オリジナルは選ばない）
  //   o.alive  … まだこの再生を続けてよいか（その間に別のファイルへ移ったら false）
  //   o.qp / o.onMeta(v, x) / o.onEnded / o.onSources(S, k) / o.fail(x, why) / o.msg(text)
  function playerCore(box, id, o = {}) {
    if (o.slot) plStop(o.slot);
    const P = { id, S: null, x: null, k: -1, v: null, hls: null, dead: false };
    P.stop = () => { if (P.v && !P.dead) savePos(P, P.v, true); P.dead = true; killHls(P.hls); P.hls = null; };
    const msg = (t) => { if (o.msg) o.msg(t); else box.innerHTML = `<div class="pl-msg">${esc(t)}</div>`; };
    const fail = (x, why) => { if (o.fail) o.fail(x, why); else if (!box.querySelector('.pl-err')) box.insertAdjacentHTML('beforeend', `<div class="pl-msg pl-err">再生できませんでした${why ? `（${esc(why)}）` : ''}</div>`); };
    P.load = (k, t) => {
      const x = P.S && P.S.src[k]; if (!x || P.dead) return null;
      if (o.pick !== 'light') { try { localStorage.setItem(LS_PLQ, x.origin ? 'orig' : 'trans'); } catch (e) { /* 無視 */ } }
      const cur = t != null ? t : (P.v && P.v.currentTime) || 0;
      killHls(P.hls); P.hls = null;
      if (!P.S.playable(x)) { P.v = null; msg(o.unplayable || 'この画質（HLS）はこのブラウザの中では再生できません。別の画質か外部プレーヤーを選んでください。'); return null; }
      P.x = x; P.k = k;
      const m = mountVideo(box, x, P.S, fail, { t: cur, qp: { ...(o.qp || {}), media: mediaHooks(id) }, onMeta: (v) => { if (o.onMeta) o.onMeta(v, x); } });
      P.v = m.v;
      trackPos(P, m.v);
      setTimeout(() => { if (P.dead) killHls(m.hls); else P.hls = m.hls; }, 0);
      if (o.onEnded) m.v.addEventListener('ended', () => { if (!P.dead) o.onEnded(); });
      return m;
    };
    P.ready = (async () => {
      const S = await loadSources(id);
      if (P.dead || (o.alive && !o.alive())) return null;
      P.S = S;
      if (!S.src.length) { msg(o.noSource || 'このファイルの再生用リンクを取得できませんでした（PikPak 側で変換中の可能性があります）'); return null; }
      let k = S.first;
      if (o.pick === 'light') {
        const tr = S.src.map((x, i) => [x, i]).filter(([x]) => !x.dl && !x.origin && S.playable(x));
        k = tr.length ? tr[tr.length - 1][1] : S.src.findIndex((q) => !q.dl && S.playable(q));
        if (k < 0) { msg(o.unplayable || 'このブラウザの中では再生できません。外部プレーヤーを使ってください。'); return null; }
      }
      if (o.onSources) o.onSources(S, k);
      // 続きから：前回止めた所から始める（最初の数秒・見終わったものは最初から）
      const rec = mediaGet(id); let t0 = o.t || 0, resumed = 0;
      if (!t0 && qpCfg().resume && rec && !rec.done && rec.pos > 10 && (!rec.dur || rec.pos < rec.dur - 15)) { t0 = rec.pos; resumed = rec.pos; }
      const m = P.load(k, t0);
      playLogPush(id, o.name);
      if (m && resumed) m.v.addEventListener('loadedmetadata', () => { const q = m.v._qp; if (q) q.note(`⏵ 前回の続き ${fmtT(resumed)} から再生しています`, [['最初から', () => { m.v.currentTime = 0; mediaPut(id, { pos: 0 }); }]], 6000); }, { once: true });
      return P;
    })();
    if (o.slot) PL[o.slot] = P;
    return P;
  }
  // ---------- 見比べ：重複の 2 本を左右に並べて、いっしょに再生する ----------
  //   シーク・再生／停止・速度は 2 本で連動（オフにもできる）。音は片方だけ。ずれたら「位置をそろえる」
  let cmpRun = 0;
  function closeCompare() {
    cmpRun++; plStop('cmpA'); plStop('cmpB');
    const d = document.getElementById('pd-cmp'); if (!d) return;
    unloadMedia(d); d.remove();
  }
  function openCompare(ids) {
    ids = ids.filter(Boolean).slice(0, 2); if (ids.length < 2) return;
    if (!ensureSession(view)) return;
    closeQL(); closePlayer(); closeCompare(); closeCtx();
    const run = ++cmpRun;
    const F = ids.map((id) => fileById(id) || { id, name: (mediaGet(id) || {}).name || id, size: (mediaGet(id) || {}).size || 0 });
    const d = document.createElement('div'); d.id = 'pd-cmp'; document.body.appendChild(d);
    const st = { link: true, audio: 0, busy: false };
    const pane = (f, i) => `<div class="cm-p" data-cmi="${i}"><div class="cm-ph"><span class="cm-tag">${i ? '右' : '左'}</span><b title="${esc(f.name)}">${esc(f.name)}</b></div><div class="cm-b"><div class="pl-msg">再生の準備中…</div></div><div class="cm-pf"><span class="cm-inf">${fmt(f.size)}<span data-cminf="${i}"></span></span><span class="sp"></span><button class="cm-keep" data-cmkeep="${i}" title="こちらを残して、もう片方を「削除する」にする（重複の判断に記録）">こちらを残す</button></div></div>`;
    d.innerHTML = `<div class="cm"><div class="cm-h"><b>見比べ</b><span class="note">2 本をいっしょに再生</span><span class="sp"></span>
      <button data-cm="both" title="2 本とも 再生／一時停止（Space）">${IC.play}<span>2 本とも</span></button>
      <button data-cm="sync" title="右を左と同じ位置にそろえる">⇆ 位置をそろえる</button>
      <button data-cm="link" class="on" title="シーク・再生／停止・速度を 2 本で連動する（押すと切り替え）">🔗 連動</button>
      <button data-cm="audio" title="音を出す方を切り替える">${IC.vol}<span>音：左</span></button>
      <button class="x" data-cm="close" title="閉じる（Esc）" aria-label="閉じる">${IC.x}</button></div>
      <div class="cm-ps">${F.map(pane).join('')}</div></div>`;
    const P = [];
    const vids = () => P.map((x) => x && x.v).filter(Boolean);
    let guard = false;
    const other = (v) => vids().find((x) => x !== v);
    const link = (v) => {
      if (v._cmLinked) return; v._cmLinked = true;
      const pass = (fn) => { if (!st.link || guard) return; const o = other(v); if (!o) return; guard = true; try { fn(o); } finally { setTimeout(() => { guard = false; }, 0); } };
      v.addEventListener('play', () => pass((o) => { if (o.paused) o.play().catch(() => {}); }));
      v.addEventListener('pause', () => pass((o) => { if (!o.paused) o.pause(); }));
      v.addEventListener('seeking', () => pass((o) => { if (Math.abs(o.currentTime - v.currentTime) > 0.3) o.currentTime = v.currentTime; }));
      v.addEventListener('ratechange', () => pass((o) => { if (o.playbackRate !== v.playbackRate) o.playbackRate = v.playbackRate; }));
    };
    const applyAudio = () => { vids().forEach((v, i) => { v.muted = i !== st.audio; }); const b = d.querySelector('[data-cm=audio] span'); if (b) b.textContent = '音：' + (st.audio ? '右' : '左'); };
    F.forEach((f, i) => {
      const box = d.querySelector(`[data-cmi="${i}"] .cm-b`);
      P[i] = playerCore(box, f.id, {
        slot: i ? 'cmpB' : 'cmpA', name: f.name, pick: 'light',
        alive: () => run === cmpRun && document.body.contains(d),
        qp: { ext: () => openExternal(f.id, '', f.name) },
        onMeta: (v) => { const e = d.querySelector(`[data-cminf="${i}"]`); if (e) e.textContent = v.videoWidth ? ` ・ ${v.videoWidth}×${v.videoHeight} ・ ${fmtT(v.duration || 0)}` : ''; link(v); applyAudio(); },
        fail: (x, why) => { if (!box.querySelector('.pl-err')) box.insertAdjacentHTML('beforeend', `<div class="pl-msg pl-err">再生できませんでした${why ? `（${esc(why)}）` : ''}</div>`); },
      });
      P[i].ready.catch((err) => { if (err && err.session) { closeCompare(); handleErr(err, view); } else box.innerHTML = `<div class="pl-msg pl-err">${err && err.gone ? '' : '再生用リンクを取得できませんでした：'}${esc((err && err.message) || err)}</div>`; });
    });
    // 2 本とも準備ができたら、同じ位置（続きの位置があれば左に合わせる）から始める
    Promise.all(P.map((x) => x.ready.catch(() => null))).then(() => { if (run !== cmpRun) return; const [a, b] = vids(); if (a && b) { const go = () => { b.currentTime = a.currentTime; applyAudio(); }; if (a.readyState > 0 && b.readyState > 0) go(); else setTimeout(go, 800); } });
    const keep = (i) => {
      const k = F[i].id, del = F[1 - i].id;
      decision[k] = 'keep'; decision[del] = 'del'; saveDecision();
      mediaPut(k, { tri: 'keep' }); mediaPut(del, { tri: 'del' }, true);
      d.querySelectorAll('.cm-p').forEach((x, j) => { x.classList.toggle('keep', j === i); x.classList.toggle('del', j !== i); });
      status(`見比べ：「${F[i].name}」を残し、もう片方を削除する方にしました（重複の判断に記録。削除は整理の「重複」ステップか「消す候補」から）`);
      log('info', '見比べで残す方を決めました', F[i].name);
      if (view === 'dup' && typeof renderDup === 'function') renderDup();
    };
    d.addEventListener('click', (e) => {
      if (e.target === d) { closeCompare(); return; }
      const b = e.target.closest('button'); if (!b) return;
      const k = b.dataset.cm;
      if (b.dataset.cmkeep !== undefined) { keep(+b.dataset.cmkeep); return; }
      if (k === 'close') closeCompare();
      else if (k === 'both') { const vs = vids(); const play = vs.some((v) => v.paused); guard = true; vs.forEach((v) => { if (play) v.play().catch(() => {}); else v.pause(); }); setTimeout(() => { guard = false; }, 0); }
      else if (k === 'sync') { const [a, bb] = vids(); if (a && bb) { guard = true; bb.currentTime = a.currentTime; setTimeout(() => { guard = false; }, 0); status('右を左と同じ位置にそろえました'); } }
      else if (k === 'link') { st.link = !st.link; b.classList.toggle('on', st.link); status(st.link ? '2 本を連動します' : '2 本を別々に操作します'); }
      else if (k === 'audio') { st.audio = 1 - st.audio; applyAudio(); }
    });
    const onKey = (e) => {
      if (!document.body.contains(d)) { removeEventListener('keydown', onKey, true); return; }
      if (e.key === 'Escape' && !document.fullscreenElement) { e.preventDefault(); e.stopImmediatePropagation(); closeCompare(); removeEventListener('keydown', onKey, true); }
    };
    addEventListener('keydown', onKey, true);
    log('info', '見比べを開きました', F.map((f) => f.name).join(' ／ '));
  }
  // 動画を止めて読み込みをやめる（シークバー用の影の動画も）
  // 再生の位置を記録する（5 秒ごと・止めたとき・閉じたとき）。最後の 5% まで見たら「見終わった」
  function savePos(P, v, now) {
    if (!P || !v || P.k < 0) return;
    // 閉じるときは先に動画が外されていることがあるので、最後に見えていた位置を使う
    const live = !!v.currentSrc && v.readyState > 0;
    const t = live ? v.currentTime || 0 : P.lastT || 0, dur = live && isFinite(v.duration) ? v.duration : P.dur || 0;
    if (!dur) return;
    if (t < 3 && !now) return;
    const done = t >= dur * 0.95 || t >= dur - 20;
    mediaPut(P.id, { pos: done ? 0 : Math.floor(t), dur: Math.round(dur), done: done || (!!(mediaGet(P.id) || {}).done && t < 10) }, now);
  }
  function trackPos(P, v) {
    let last = 0;
    v.addEventListener('timeupdate', () => { if (P.dead) return; if (v.currentSrc && v.readyState > 0) { P.lastT = v.currentTime; if (isFinite(v.duration)) P.dur = v.duration; } const n = Date.now(); if (n - last > 5000) { last = n; savePos(P, v); } });
    v.addEventListener('pause', () => { if (!P.dead && v.currentSrc && v.readyState > 0) { P.lastT = v.currentTime; savePos(P, v, true); } });
    v.addEventListener('ended', () => { if (!P.dead) mediaPut(P.id, { pos: 0, done: true }, true); });
  }
  // 飛ばす区間の読み書き（操作バーから使う）
  // 見ながら仕分け：残す（keep）／消す候補（del）。重複の判断の記録にも同じ値を書く（重複の組にあれば、その判断にも効く）
  function setTri(id, v) {
    const r = mediaGet(id) || {}; const nv = r.tri === v ? null : v; // 同じ印をもう一度押したら外す
    mediaPut(id, { tri: nv }, true);
    if (nv) decision[id] = nv; else delete decision[id];
    saveDecision();
    return nv;
  }
  async function toggleStar(id) {
    const r = mediaGet(id) || {}; const on = !r.star;
    await api(on ? '/files:star' : '/files:unstar', { method: 'POST', body: JSON.stringify({ ids: [id] }) });
    mediaPut(id, { star: on }, true); return on;
  }
  const mediaHooks = (id) => ({
    tri: () => (mediaGet(id) || {}).tri || null,
    setTri: (v) => setTri(id, v),
    star: () => toggleStar(id),
    starred: () => !!(mediaGet(id) || {}).star,
    skips: () => ((mediaGet(id) || {}).skip || []).slice().sort((a, b) => a[0] - b[0]),
    addSkip: (a, b) => { const r = mediaGet(id) || {}; const l = (r.skip || []).filter((z) => z[1] <= a || z[0] >= b); l.push([Math.round(a * 10) / 10, Math.round(b * 10) / 10]); mediaPut(id, { skip: l.sort((x, y) => x[0] - y[0]) }, true); },
    delSkip: (i) => { const l = ((mediaGet(id) || {}).skip || []).slice().sort((a, b) => a[0] - b[0]); l.splice(i, 1); mediaPut(id, { skip: l }, true); },
  });
  function unloadMedia(scope) {
    if (!scope) return;
    closeGrab(scope);
    scope.querySelectorAll('.pd-sk').forEach((b) => { if (b._grab) { b._grab.close(); b._grab = null; } });
    scope.querySelectorAll('video').forEach((v) => { try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) { /* 無視 */ } });
  }
  async function playFile(id, opt = {}) {
    const f = fileById(id); if (!f) return;
    // プレビューで再生中なら、その位置から続ける
    const qv = document.querySelector('#pd-ql video'); const fromT = opt.t || (qv && treeCur === id ? qv.currentTime : 0);
    closeQL(); closeCtx();
    if (!ensureSession('tree')) return;
    stopHls();
    // 次・前へ移るたびに、前の動画（とシークバー用の影の動画）を確実に止めて片付ける。
    // 片付けずに続けて再生すると、裏で動画がいくつも読み込まれ続けて、画面ごと落ちていた
    const run = ++playRun;
    let d = document.getElementById('pd-player');
    if (d) unloadMedia(d);
    if (!d) {
      d = document.createElement('div'); d.id = 'pd-player'; document.body.appendChild(d);
      d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-pl=close]')) closePlayer(); });
    }
    const vids = treeRowsCache.filter(isVideoRow);
    const i = vids.findIndex((r) => r.id === id);
    d.innerHTML = `<div class="pl"><div class="pl-h"><button data-pl="prev"${i > 0 ? '' : ' disabled'} title="前のビデオ（${KEY.prev}）">◀</button><button data-pl="next"${i >= 0 && i < vids.length - 1 ? '' : ' disabled'} title="次のビデオ（${KEY.next}）">▶</button><b>${esc(f.name)}</b><select data-pl="q" title="画質（カクつく場合は変換画質を選んでください）" style="display:none"></select>${rateSelect()}<button data-pl="frames" title="コマ一覧">▦ コマ一覧</button><button data-pl="full" title="全画面（F）">⛶ 全画面</button><button data-pl="ext" title="外部プレーヤーで開く">↗ ${esc(EXT_PLAYERS[playPref().ext].short)}</button><button data-pl="set" title="再生のしかたの設定" aria-label="再生のしかたの設定">${IC.gear}</button><button data-pl="close" title="閉じる（Esc）" aria-label="閉じる">${IC.x}</button></div>
      <div class="pl-b"><div class="pl-msg">再生の準備中…</div></div><div class="pl-f note"><span>${esc(f.outer ? fullPath(f.parentId) : (f.path || '/').replace(/\/$/, ''))}/ ・ ${fmt(f.size)}</span><span data-pl="info"></span></div></div>`;
    const prev = d.querySelector('[data-pl=prev]'), next = d.querySelector('[data-pl=next]');
    prev.onclick = () => { if (i > 0) { treeSelect(vids[i - 1].id, null); renderTree(); playFile(vids[i - 1].id, { full: !!document.fullscreenElement }); } };
    next.onclick = () => { if (i < vids.length - 1) { treeSelect(vids[i + 1].id, null); renderTree(); playFile(vids[i + 1].id, { full: !!document.fullscreenElement }); } };
    const goFull = () => { const v = d.querySelector('.pl'); const fn = v && (v.requestFullscreen || v.webkitRequestFullscreen); if (fn) Promise.resolve(fn.call(v)).catch(() => status('全画面にできませんでした。プレーヤーの ⛶ を押してください。')); };
    d.querySelector('[data-pl=full]').onclick = goFull;
    d.querySelector('[data-pl=ext]').onclick = () => { const v = d.querySelector('video'); if (v) v.pause(); openExternal(id); };
    d.querySelector('[data-pl=set]').onclick = () => openSettings('play');
    // コマ一覧を開くときは再生画面を閉じる（動画を同時にいくつも読み込むと、Safari・アプリ版で画面ごと落ちることがあるため）
    d.querySelector('[data-pl=frames]').onclick = () => { closePlayer(); openFrames([id]); };
    const sel = d.querySelector('[data-pl=q]'), inf = d.querySelector('[data-pl=info]');
    const P = playerCore(d.querySelector('.pl-b'), id, {
      slot: 'main', name: f.name, t: fromT,
      alive: () => document.body.contains(d) && run === playRun, // その間に別の動画へ移った
      msg: (t) => { d.querySelector('.pl-b').innerHTML = `<div class="pl-msg">${esc(t)}</div>`; },
      unplayable: 'この画質（HLS）はこのブラウザの中では再生できません。別の画質か「↗ 外部プレーヤー」を選んでください。',
      qp: { ext: () => openExternal(id), full: goFull, next: i >= 0 && i < vids.length - 1 ? () => next.click() : null, prev: i > 0 ? () => prev.click() : null },
      onMeta: (v, x) => { inf.textContent = v.videoWidth ? ` ・ ${v.videoWidth}×${v.videoHeight}${x.hls ? '（変換）' : ''}` : ''; },
      fail: (x, why) => {
        const box = d.querySelector('.pl-b');
        if (!box.querySelector('.pl-err')) box.insertAdjacentHTML('beforeend', `<div class="pl-msg pl-err">「${esc(x.label)}」は再生できませんでした${why ? `（${esc(why)}）` : ''}。上の画質を切り替えるか「↗ 外部プレーヤー」を試してください。</div>`);
        log('warn', `再生できない画質：${x.label}${why ? '（' + why + '）' : ''}`, f.name); updateLogBadge();
      },
      onSources: (S, k) => {
        sel.innerHTML = S.src.map((x, j) => `<option value="${j}">${esc(x.label)}${x.hls ? '・変換' : ''}${S.playable(x) ? '' : '（このブラウザでは再生不可）'}</option>`).join('');
        sel.style.display = S.src.length > 1 ? '' : 'none'; sel.value = String(k);
      },
    });
    sel.onchange = () => { const m = P.load(+sel.value); if (m) m.v.focus(); };
    try {
      if (!(await P.ready)) return;
      if (P.v) P.v.focus();
      if (opt.full) goFull();
      log('info', '再生：' + f.name + '（' + P.S.src[P.k >= 0 ? P.k : P.S.first].label + '）');
    } catch (err) { if (err.session) { closePlayer(); handleErr(err, 'tree'); return; } d.querySelector('.pl-msg').textContent = (err.gone ? '' : '再生用リンクを取得できませんでした：') + err.message; log('error', '再生用リンクの取得に失敗：' + err.message, f.name); updateLogBadge(); }
  }
  function closePlayer() { playRun++; unloadMedia(document.getElementById('pd-player')); stopHls(); const d = document.getElementById('pd-player'); if (d) { d.querySelectorAll('.pd-sk').forEach((b) => { if (b._grab) b._grab.close(); }); const v = d.querySelector('video'); try { if (v) { v.pause(); v.removeAttribute('src'); v.load(); } } catch (e) { /* 無視 */ } d.remove(); } const t = $('[data-r=tree]'); if (t) t.focus(); }
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
  root.addEventListener('dblclick', (e) => { const cr = e.target.closest('[data-colr]'); if (!cr) return; e.preventDefault(); e.stopPropagation(); const c = colCfg(); delete c.w[cr.dataset.colr]; saveColCfg(c); renderTree(); }, true);
  // マウス操作
  root.addEventListener('mousedown', (e) => {
    if (view !== 'tree' || busy) return;
    // 列の幅を変える（見出しの境目をドラッグ）
    const cr = e.target.closest('[data-colr]');
    if (cr) {
      e.preventDefault(); e.stopPropagation();
      const k = cr.dataset.colr, cell = cr.parentElement, x0 = e.clientX, w0 = cell.getBoundingClientRect().width, trEl = cell.closest('.tr');
      cr.classList.add('on');
      // 境目は列の左側：左へ引くと広がる
      const mv = (ev) => { const c = colCfg(); c.w[k] = Math.round(Math.max(48, Math.min(600, w0 - (ev.clientX - x0)))); saveColCfg(c); if (trEl) trEl.style.setProperty('--tcols', colTemplate()); };
      const up = () => { removeEventListener('mousemove', mv); removeEventListener('mouseup', up); cr.classList.remove('on'); };
      addEventListener('mousemove', mv); addEventListener('mouseup', up);
      return;
    }
    if (e.target.closest('[data-colpick]')) { e.preventDefault(); e.stopPropagation(); openColMenu(e.target.closest('[data-colpick]')); return; }
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
    if (t.dataset.cmpg !== undefined) { const g = visibleGroups().find((x) => x.key === t.dataset.cmpg); if (g) { const del = g.items.find((f, i) => stateOf(f, i) === 'del'); openCompare([g.items[0].id, (del || g.items[1]).id]); } return; }
    if (t.dataset.frg !== undefined) { const g = visibleGroups().find((x) => x.key === t.dataset.frg); if (g) { const del = g.items.find((f, i) => stateOf(f, i) === 'del'); openFrames([g.items[0].id, (del || g.items[1]).id]); } return; }
    if (t.dataset.g !== undefined) { if (busy) return; const g = visibleGroups().find((x) => x.key === t.dataset.g); if (g) runDelete([g]); return; }
    if (a === 'close' || a === 'mini') { root.classList.remove('on'); ddKick(); return; }
    if (a === 'tofull') { setWin('full'); return; }
    if (a === 'fullnext') { setOpenPref('full'); setWin('full'); status('次からは全画面で開きます（設定の「表示」→「開き方」で戻せます）'); return; }
    if (a === 'banclose') { try { localStorage.setItem(LS_POPBAN, '0'); } catch (err) { /* 無視 */ } applyWin(); return; }
    if (a === 'log') { showLog(); return; }
    if (a === 'settings') { openSettings(); return; }
    if (a === 'setinfo') { openSettings('info'); return; }
    if (a === 'changelog') { window.open('https://github.com/Noel-Labs39/pikpak-distill/blob/main/CHANGELOG.md', '_blank', 'noopener'); return; }
    if (a === 'navtoggle') { toggleNav(); return; }
    if (a === 'edgescroll') { setEdge(!edgeOn()); status(edgeOn() ? '端でスクロールをオンにしました（一覧の下・上の端にマウスを持っていくと、ゆっくりスクロールします）' : '端でスクロールをオフにしました'); return; }
    if (a === 'acct') { openAcct(t); return; }
    if (a === 'bell') { const u = updRead(); if (u.latest && verNewer(u.latest, VER) && u.skip !== u.latest) { const el = $('[data-r=upd]'); if (el) { el.hidden = false; el.scrollIntoView({ block: 'nearest' }); } } showLog(); return; }
    if (a === 'dockx') { const dk = t.closest('.sv-dock'); if (dk) dk.classList.toggle('open'); return; }
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
    if (a === 'rescan') { if (!busy) askRescan(); return; }
    if (a === 'rsgo') { rsHide(); if (!busy) { afterScan = view === 'scan' ? null : view; if (libSt) closeLib(); runScan(); } return; }
    if (a === 'rslater') { const el = $('[data-r=rsban]'); if (el && el.dataset.why === 'stale') { try { sessionStorage.setItem(SS_RSLATER, new Date().toDateString()); } catch (err) { /* 無視 */ } } rsHide(); return; }
    if (a === 'addlink') { if (!busy || view !== 'tree') { const c = view === 'tree' ? treeBase() : currentFolderId(); openAdd(isHomeId(c) ? 'DL' : c); } return; }
    if (a === 'skick') { if (lookupSt.kick) { log('info', '販売者の調査：確認のあとの続きを手動で再開'); lookupSt.kick(); } return; }
    if (a === 'spause') { lookupSt.paused = !lookupSt.paused; refreshSellerChrome(); status(lookupSt.paused ? '販売者の調査を一時停止しています（「再開」で続けます）' : '販売者の調査を再開しました'); return; }
    if (a === 'stop') { window.__ppdupStop = true; status('中断しています…（いまの処理が終わったら止まります）'); return; }
    if (busy) return;
    if (a === 'scan') return runScan();
    if (a === 'onepass') return runOnePass();
    if (a === 'oplookup') { selPlan = buildSellerPlan(folders); return runSellerLookup(); }
    if (a === 'resclose') { delete lastResult[view]; const r = t.closest('.st-res'); if (r) r.remove(); return; }
    if (a === 'delall') return Promise.resolve(runDelete(visibleGroups())).then(() => captureResult('dup'));
    if (a === 'junkdel') return Promise.resolve(runJunk()).then(() => captureResult('junk'));
    if (a === 'jall' || a === 'jnone') { const lv = t.dataset.lv; jplan.filter((p) => p.level === lv).forEach((p) => junkSel.set(p.id, a === 'jall')); render(); renderActs(); return; }
    const m = /^(name|sort|ren|clean|seller)(1|all)$/.exec(a || '');
    if (m) { const v0 = view; if (m[2] === '1') Promise.resolve(RUN[m[1]](true)).then(() => captureResult(v0)); else if (KIT_VERB[m[1]] || confirm(tr(CONFIRM[m[1]]))) Promise.resolve(RUN[m[1]](false)).then(() => captureResult(v0)); return; }
    if (t.dataset.opcmp) { const g = smartDup().review.find((x) => x.key === t.dataset.opcmp); if (g) openCompare(g.items.slice(0, 2).map((f) => f.id)); return; }
    if (t.dataset.ktab) { kitTab[view] = t.dataset.ktab; render(); return; }
    if (t.dataset.dtab) { dupTab = t.dataset.dtab; render(); return; }
    if (t.dataset.kopen) { const id = t.dataset.kopen; if (!busy) { openTree(); revealInTree(id); } return; }
    if (a === 'kreplan') { if (!busy) { kitFail[view] && kitFail[view].clear(); setView(view); status('計画を作り直しました（PikPak の最新の内容にするには「読み込み直す」）'); } return; }
    if (a === 'csv') {
      const rows = [['判定', 'ファイル名', '場所', 'サイズ(MB)']];
      visibleGroups().forEach((g) => g.items.forEach((f, i) => rows.push([stateOf(f, i) === 'keep' ? '残す' : '削除する', f.name, f.path, (f.size / UNIT.MB).toFixed(2)])));
      // Excel で開いたときに、= + - @ で始まるファイル名が数式として動かないよう、先頭に ' を付ける
      const cell = (c) => { let v = String(c); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };
      const csv = '﻿' + rows.map((r) => r.map(cell).join(',')).join('\n');
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
    const kid = e.target.dataset && e.target.dataset.kchk;
    if (kid && KIT_VERB[view]) { kitSetOff(view, kid, !e.target.checked); const row = e.target.closest('.pd-row'); const it = kitItems(view).find((x) => x.id === kid); if (row) row.classList.toggle(it && it.danger ? 'del' : 'sel', e.target.checked); renderActs(); return; }
    const kg = e.target.dataset && e.target.dataset.kgrp;
    if (kg !== undefined && KIT_VERB[view]) { kitItems(view).filter((it) => it.grp === kg && (it.st === 'todo' || it.st === 'fail')).forEach((it) => { kitSetOff(view, it.id, !e.target.checked); }); render(); return; }
    const ko = e.target.dataset && e.target.dataset.kopt;
    if (ko) { if (ko === 'junk') { try { localStorage.setItem(LS_OPT_JUNK, e.target.checked ? '1' : '0'); } catch (err) { /* 無視 */ } } else if (ko === 'name') { try { localStorage.setItem(LS_OPT_NAME, e.target.checked ? '1' : '0'); } catch (err) { /* 無視 */ } } else { try { localStorage.setItem(KIT_OPT[ko], e.target.checked ? '1' : '0'); } catch (err) { /* 無視 */ } } log('info', `${STEPS.find((x) => x.v === ko).t}を${e.target.checked ? 'オン' : 'オフ'}`); if (!busy) setView(ko); return; }
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
  root.addEventListener('input', (e) => { if (e.target.dataset.kq !== undefined && kitQ[view] !== undefined) { kitQ[view] = e.target.value; clearTimeout(kitQ.t); kitQ.t = setTimeout(() => { render(); const q = $('[data-kq]'); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } }, 250); return; } if (e.target.dataset.a === 'q') render(); if (e.target.dataset.a === 'tq') { tree.q = e.target.value; renderTree(); } });
  // ---------- 開き方（ポップアップ／全画面） ----------
  // ポップアップは PikPak の画面の上に重ねる小さな画面。見出しをつかんで移動、右下で大きさを変える。位置と大きさは覚えておく
  const LS_OPEN = 'ppdup:open:v1', LS_POPGEOM = 'ppdup:popgeom:v1', LS_POPBAN = 'ppdup:popban:v1';
  // 開き方：選んでいなければ全画面（おすすめ）
  const openPref = () => { try { return localStorage.getItem(LS_OPEN) === 'pop' ? 'pop' : 'full'; } catch (e) { return 'full'; } };
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
  function showRoot() { if (!root.classList.contains('on')) { winMode = isPhone() ? 'full' : openPref(); setTimeout(() => { if (meta && Date.now() - meta.at >= 864e5) rsAsk('stale'); }, 400); } applyWin(); applyNav(); root.classList.add('on'); checkRotate(); checkUpdate(); libPeek(); setTimeout(() => { syncAsk(); if (Date.now() - syncAt > 60e3) syncNow('開いたとき'); }, 1500); }
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
        const to = setTimeout(() => { v.removeEventListener('seeked', done); rej(new Error('コマの取得が時間切れになりました')); }, 10000);
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
              try { await Promise.race([v.play(), sleep(1200)]); } catch (e) { /* 無視 */ } // iPhone では play() が返ってこないことがある
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
  // ---------- 簡易プレーヤーの操作（常に出る操作バー・マウスを乗せたらキー操作・ズーム） ----------
  const LS_QP = 'ppdup:qp:v1';
  const QP_DEF = { step: 5, big: 30, jl: 10, vol: 10, wheel: 'zoom', hover: true, bar: 'always', resume: true, hold: 2, tri: true, triNext: true, skimN: 16, skimSec: 4 };
  const qpCfg = () => { let c = {}; try { c = JSON.parse(localStorage.getItem(LS_QP) || '{}') || {}; } catch (e) { c = {}; } return { ...QP_DEF, ...c }; };
  const saveQpCfg = (p) => { const c = { ...qpCfg(), ...p }; try { localStorage.setItem(LS_QP, JSON.stringify(c)); } catch (e) { /* 無視 */ } document.querySelectorAll('.qp-ui').forEach((u) => u.classList.toggle('qp-auto', c.bar === 'auto')); return c; };
  const QP_OPTS = {
    step: ['← / → の移動幅', [3, 5, 10, 15], (v) => v + ' 秒'],
    big: ['Shift + ← / →', [15, 30, 60], (v) => (v >= 60 ? v / 60 + ' 分' : v + ' 秒')],
    jl: ['J / L・±ボタンの移動幅', [5, 10, 15, 30], (v) => v + ' 秒'],
    vol: ['音量の刻み（↑ / ↓）', [5, 10, 20], (v) => v + '%'],
    wheel: ['マウスホイール', ['zoom', 'vol', 'seek'], (v) => ({ zoom: 'ズーム', vol: '音量', seek: 'シーク' })[v]],
    hover: ['マウスを乗せたらキー操作', [true, false], (v) => (v ? 'オン' : 'オフ（押したとき）')],
    bar: ['操作バー', ['always', 'auto'], (v) => (v === 'always' ? '常に表示' : 'マウスを乗せたとき')],
    resume: ['続きから再生', [true, false], (v) => (v ? 'オン' : 'オフ（いつも最初から）')],
    hold: ['長押しの速さ（画面・→ キー）', [1.5, 2, 3], (v) => v + '×'],
    tri: ['見ながら仕分けのバー', [true, false], (v) => (v ? '出す' : '出さない（キーだけ効く）')],
    triNext: ['仕分けたら次の動画へ', [true, false], (v) => (v ? 'すぐ次へ' : 'そのまま')],
    skimN: ['ざっと見：何か所に分けるか', [8, 12, 16, 24], (v) => v + ' か所'],
    skimSec: ['ざっと見：1 か所の長さ', [2, 3, 4, 6], (v) => v + ' 秒'],
  };
  const qpSelect = (k, attr) => { const c = qpCfg(), [, vals, lab] = QP_OPTS[k]; return `<select ${attr} data-k="${k}">${vals.map((v) => `<option value="${v}"${c[k] === v ? ' selected' : ''}>${esc(lab(v))}</option>`).join('')}</select>`; };
  const qpVal = (k, s) => { const v = QP_OPTS[k][1].find((x) => String(x) === s); return v === undefined ? QP_DEF[k] : v; };
  const QP_IC = { gear: IC.gear, play: IC.play, pause: IC.pause };
  let qpActive = null;
  function qpSetActive(P) {
    if (qpActive === P) return;
    if (qpActive) qpActive.root.forEach((el) => el.classList.remove('qp-on'));
    qpActive = P; if (P) P.root.forEach((el) => el.classList.add('qp-on'));
  }
  // video を包んだ枠（stage）と、下の操作バー（ui）を作る
  function qpAttach(box, v, ui, opt) {
    const stage = box.querySelector('.qp-stage');
    stage.insertAdjacentHTML('beforeend', '<div class="qp-osd" hidden></div><div class="qp-mini" hidden><i></i></div><span class="qp-badge">⌨ キー操作 ON</span><div class="qp-notes"></div><div class="qp-hold" hidden></div>');
    const osd = stage.querySelector('.qp-osd'), mini = stage.querySelector('.qp-mini'), mr = mini.querySelector('i');
    const P = { v, root: [box, ui], opt, z: 1, tx: 0, ty: 0 };
    v._qp = P;
    // ---- ズーム（マウスの位置を中心に。動画の枠の大きさは変えない） ----
    const apply = () => {
      const W = stage.clientWidth, H = stage.clientHeight;
      P.tx = Math.min(0, Math.max(W - W * P.z, P.tx)); P.ty = Math.min(0, Math.max(H - H * P.z, P.ty));
      v.style.transform = P.z > 1.001 ? `translate(${P.tx}px,${P.ty}px) scale(${P.z})` : '';
      stage.classList.toggle('qp-zoomed', P.z > 1.001);
      mini.hidden = !(P.z > 1.001);
      if (P.z > 1.001) { mr.style.cssText = `left:${-P.tx / (W * P.z) * 100}%;top:${-P.ty / (H * P.z) * 100}%;width:${100 / P.z}%;height:${100 / P.z}%`; }
      const zb = ui.querySelector('[data-qp=zoom]'); if (zb) zb.textContent = '🔍 ' + Math.round(P.z * 100) + '%';
    };
    const zoomAt = (nz, px, py, show = true) => {
      nz = Math.max(1, Math.min(4, nz));
      if (px === undefined) { px = stage.clientWidth / 2; py = stage.clientHeight / 2; }
      P.tx = px - (px - P.tx) * nz / P.z; P.ty = py - (py - P.ty) * nz / P.z; P.z = nz;
      if (nz <= 1.001) { P.z = 1; P.tx = 0; P.ty = 0; }
      apply(); if (show) flash('🔍 ' + Math.round(P.z * 100) + '%');
    };
    P.zoomAt = zoomAt; P.zoomReset = () => { zoomAt(1, 0, 0, false); flash('🔍 100%'); };
    const local = (e) => { const r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    P.lastXY = null;
    stage.addEventListener('mousemove', (e) => { P.lastXY = local(e); });
    stage.addEventListener('wheel', (e) => {
      const c = qpCfg(); const [x, y] = local(e);
      // トラックパッドのピンチは ctrlKey 付きのホイールとして届く：設定に関係なくズーム
      if (e.ctrlKey || c.wheel === 'zoom') { e.preventDefault(); zoomAt(P.z * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), x, y); }
      else if (c.wheel === 'vol') { e.preventDefault(); P.vol(e.deltaY < 0 ? c.vol : -c.vol); }
      else if (c.wheel === 'seek') { e.preventDefault(); P.seek(e.deltaY < 0 ? c.step : -c.step); }
    }, { passive: false });
    // タッチ：2 本指でピンチ（2 本指のまん中を中心に）・拡大中は 1 本指／2 本指で移動
    let pin = null, pan = null;
    stage.addEventListener('touchstart', (e) => {
      qpSetActive(P);
      if (e.touches.length === 2) {
        const r = stage.getBoundingClientRect(), [a, b] = e.touches;
        const mx = (a.clientX + b.clientX) / 2 - r.left, my = (a.clientY + b.clientY) / 2 - r.top;
        pin = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1, z: P.z, cx: (mx - P.tx) / P.z, cy: (my - P.ty) / P.z }; pan = null; e.preventDefault();
      } else if (e.touches.length === 1 && P.z > 1.001) { pan = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx: P.tx, ty: P.ty }; }
      else if (e.touches.length === 1 && !v.paused) { clearTimeout(P.tHold); const t0 = e.touches[0]; P.tHoldXY = [t0.clientX, t0.clientY]; P.tHold = setTimeout(() => { P.tHeld = true; P.holdOn(); }, 450); }
    }, { passive: false });
    stage.addEventListener('touchmove', (e) => { if (P.tHoldXY && e.touches[0] && Math.abs(e.touches[0].clientX - P.tHoldXY[0]) + Math.abs(e.touches[0].clientY - P.tHoldXY[1]) > 10) clearTimeout(P.tHold); }, { passive: true });
    stage.addEventListener('contextmenu', (e) => { if (P.tHeld || P.held) e.preventDefault(); });
    stage.addEventListener('touchmove', (e) => {
      if (pin && e.touches.length === 2) {
        e.preventDefault();
        const r = stage.getBoundingClientRect(), [a, b] = e.touches;
        const mx = (a.clientX + b.clientX) / 2 - r.left, my = (a.clientY + b.clientY) / 2 - r.top;
        P.z = Math.max(1, Math.min(4, pin.z * Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / pin.d));
        P.tx = mx - pin.cx * P.z; P.ty = my - pin.cy * P.z; apply();
      } else if (pan && e.touches.length === 1) { e.preventDefault(); P.tx = pan.tx + e.touches[0].clientX - pan.x; P.ty = pan.ty + e.touches[0].clientY - pan.y; apply(); }
    }, { passive: false });
    stage.addEventListener('touchend', (e) => { clearTimeout(P.tHold); P.tHoldXY = null; if (P.tHeld) { P.tHeld = false; P.holdOff(); e.preventDefault(); } if (e.touches.length < 2) pin = null; if (!e.touches.length) pan = null; if (P.z <= 1.001) zoomAt(1, 0, 0, false); });
    // マウス：拡大中はドラッグで移動。押すだけなら再生・一時停止、ダブルクリックで拡大を戻す
    let drag = null, clickT = null;
    stage.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || e.target.closest('.qp-mini')) return;
      drag = { x: e.clientX, y: e.clientY, tx: P.tx, ty: P.ty, moved: false };
      // 押したままにすると、離すまで速く再生（拡大中は移動に使うので除く）
      const holdT = P.z > 1.001 || v.paused ? null : setTimeout(() => { if (drag && !drag.moved) { drag.held = true; P.holdOn(); } }, 450);
      const mv = (ev) => { if (!drag) return; const dx = ev.clientX - drag.x, dy = ev.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true; if (P.z > 1.001 && drag.moved) { P.tx = drag.tx + dx; P.ty = drag.ty + dy; apply(); } };
      const up = () => { clearTimeout(holdT); window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); const moved = drag && drag.moved, held = drag && drag.held; drag = null; if (held) { P.holdOff(); return; } if (!moved) { clearTimeout(clickT); clickT = setTimeout(() => P.toggle(), 220); } };
      window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
      e.preventDefault();
    });
    stage.addEventListener('dblclick', (e) => { e.preventDefault(); clearTimeout(clickT); if (P.z > 1.001) P.zoomReset(); else P.full(); });
    // ---- 画面中央の一瞬の表示 ----
    let osdT = null;
    const flash = (t) => { osd.textContent = t; osd.hidden = false; clearTimeout(osdT); osdT = setTimeout(() => { osd.hidden = true; }, 700); };
    P.flash = flash;
    // ---- 押している間だけ速く ----
    const hold = stage.querySelector('.qp-hold');
    P.holdOn = () => { if (P.held) return; P.held = { r: v.playbackRate }; const r = qpCfg().hold; v.playbackRate = r; hold.textContent = `▶▶ ${r}×`; hold.hidden = false; };
    P.holdOff = () => { if (!P.held) return; v.playbackRate = P.held.r || getRate(); P.held = null; hold.hidden = true; };
    // ---- 知らせの帯（「続きから」「飛ばしました」など。押せるボタン付き） ----
    const notes = stage.querySelector('.qp-notes');
    P.note = (text, acts = [], ms = 4000) => {
      const n = document.createElement('div'); n.className = 'qp-note';
      n.innerHTML = `<span>${esc(text)}</span>${acts.map((a, i) => `<button data-qn="${i}">${esc(a[0])}</button>`).join('')}`;
      n.addEventListener('mousedown', (e) => e.stopPropagation());
      n.addEventListener('click', (e) => { const b = e.target.closest('[data-qn]'); if (!b) return; e.stopPropagation(); acts[+b.dataset.qn][1](); n.remove(); });
      notes.appendChild(n); while (notes.children.length > 2) notes.firstChild.remove();
      setTimeout(() => n.remove(), ms);
      return n;
    };
    // ---- 飛ばす区間（A で始め、B で終わり。次からその区間を自動で飛ばす） ----
    const mk = opt.media || null;
    P.markA = null; let ignore = null, selfSeek = false;
    P.drawSkips = () => {
      const tr = ui.querySelector('.pd-sk > .sktr'); if (!tr || !mk) return;
      tr.querySelectorAll('.skz,.ska').forEach((z) => z.remove());
      const d = v.duration; if (!d || !isFinite(d)) return;
      mk.skips().forEach(([a, b]) => tr.insertAdjacentHTML('beforeend', `<i class="skz" style="left:${a / d * 100}%;width:${Math.max(0.4, (b - a) / d * 100)}%"></i>`));
      if (P.markA != null) tr.insertAdjacentHTML('beforeend', `<i class="ska" style="left:${P.markA / d * 100}%"></i>`);
      const sl = ui.querySelector('[data-qp=sklist]'); if (sl) { const n = mk.skips().length; sl.hidden = !n; sl.textContent = `区間 ${n}`; }
      const ab = ui.querySelector('[data-qp=ab]'); if (ab) { ab.textContent = P.markA != null ? '✂ B（終わり）' : '✂ A–B'; ab.classList.toggle('on', P.markA != null); }
    };
    P.mark = (which) => {
      if (!mk) return;
      const t = v.currentTime || 0;
      if (which === 'A' || (which !== 'B' && P.markA == null)) { P.markA = t; flash('✂ 始め ' + fmtT(t)); if (P.aNote) P.aNote.remove(); P.aNote = P.note(`飛ばす区間の始め ${fmtT(t)}。終わりの位置で B を押してください`, [['やめる', () => { P.markA = null; P.drawSkips(); }]], 5000); }
      else if (P.markA != null) {
        const a = Math.min(P.markA, t), b = Math.max(P.markA, t); P.markA = null; if (P.aNote) { P.aNote.remove(); P.aNote = null; }
        if (b - a < 1) { flash('短すぎます'); P.drawSkips(); return; }
        mk.addSkip(a, b); ignore = [a, b]; flash(`✂ ${fmtT(a)}–${fmtT(b)} を飛ばします`);
      } else { flash('先に A で始めを決めてください'); }
      P.drawSkips();
    };
    // ---- シーン（一定の間隔で画面を取って右に並べる。押すとその場面へ） ----
    const scn = { el: null, gr: null, times: [], run: 0 };
    const sceneTimes = () => { const d = v.duration; if (!d || !isFinite(d)) return []; const n = Math.max(8, Math.min(30, Math.round(d / 120))); return Array.from({ length: n }, (_, i) => Math.round(d * i / n)); };
    P.drawTicks = () => {
      const tr = ui.querySelector('.pd-sk > .sktr'); if (!tr) return;
      tr.querySelectorAll('.skt').forEach((z) => z.remove());
      const d = v.duration; if (!scn.el || !d || !isFinite(d)) return;
      scn.times.forEach((t) => { if (t > 0) tr.insertAdjacentHTML('beforeend', `<i class="skt" style="left:${t / d * 100}%"></i>`); });
    };
    const sceneCur = () => {
      if (!scn.el) return; const t = v.currentTime; let k = 0; scn.times.forEach((x, i) => { if (t >= x) k = i; });
      scn.el.querySelectorAll('[data-sc]').forEach((b) => b.classList.toggle('cur', +b.dataset.sc === k));
    };
    P.scenes = (on) => {
      if (on === undefined) on = !scn.el;
      const btn = ui.querySelector('[data-qp=scene]');
      if (!on) { scn.run++; if (scn.gr) { scn.gr.close(); scn.gr = null; } if (scn.el) { scn.el._grab = null; scn.el.remove(); scn.el = null; } if (btn) btn.classList.remove('on'); P.drawTicks(); return; }
      if (scn.el || !opt.src) return;
      scn.times = sceneTimes(); if (!scn.times.length) { flash('長さが分かってから開けます'); return; }
      const el = document.createElement('div'); el.className = 'qp-scn';
      el.innerHTML = `<div class="qp-scn-h"><b>シーン</b><small>${scn.times.length} か所</small><button data-scx title="シーンを閉じる（G）" aria-label="閉じる">${IC.x}</button></div><div class="qp-scn-l">${scn.times.map((t, i) => `<button data-sc="${i}"><span class="im"><i>…</i></span><span>${fmtT(t)}</span></button>`).join('')}</div>`;
      el.addEventListener('mousedown', (e) => e.stopPropagation());
      el.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (e.target.closest('[data-scx]')) { P.scenes(false); return; }
        const b = e.target.closest('[data-sc]'); if (!b) return; v.currentTime = scn.times[+b.dataset.sc]; sceneCur();
      });
      stage.appendChild(el); scn.el = el; if (btn) btn.classList.add('on');
      P.drawTicks(); sceneCur();
      // 画像は軽い画質から 1 枚ずつ作る（閉じたらやめる）
      const my = ++scn.run;
      try { scn.gr = makeGrabber(lightSrc(opt.src.S) || opt.src.x, opt.src.S); el._grab = scn.gr; } catch (e) { scn.gr = null; }
      (async () => {
        for (let i = 0; i < scn.times.length; i++) {
          if (my !== scn.run || !scn.gr) return;
          const im = el.querySelector(`[data-sc="${i}"] .im`);
          try { const c = await scn.gr.grab(scn.times[i] + (i ? 0 : 1), 240); if (my !== scn.run) return; c.className = ''; im.innerHTML = ''; im.appendChild(c); }
          catch (e) { if (my !== scn.run) return; im.innerHTML = '<i>×</i>'; if (i === 0) { el.querySelectorAll('.im i').forEach((x) => { x.textContent = '—'; }); el.querySelector('.qp-scn-h small').textContent = '画像を作れませんでした（時間だけ表示）'; return; } }
        }
      })();
    };
    v.addEventListener('timeupdate', sceneCur);
    if (mk) {
      v.addEventListener('loadedmetadata', () => P.drawSkips());
      v.addEventListener('durationchange', () => P.drawSkips());
      // 自分で区間の中へ移ったときは飛ばさない（見たくて戻した場合）
      v.addEventListener('seeking', () => { if (selfSeek) { selfSeek = false; return; } const t = v.currentTime; ignore = mk.skips().find(([a, b]) => t >= a && t < b) || null; });
      v.addEventListener('timeupdate', () => {
        const t = v.currentTime; if (ignore && (t < ignore[0] - 0.5 || t >= ignore[1])) ignore = null;
        const z = mk.skips().find(([a, b]) => t >= a && t < b - 0.3);
        if (!z || (ignore && ignore[0] === z[0] && ignore[1] === z[1]) || P.markA != null) return;
        selfSeek = true; v.currentTime = z[1]; ignore = null;
        P.note(`⤼ ${fmtT(z[0])}–${fmtT(z[1])} を飛ばしました`, [['戻す', () => { selfSeek = true; ignore = z; v.currentTime = z[0]; }]], 3500);
      });
    }
    // ---- 操作 ----
    P.toggle = () => { if (v.paused) { v.play().catch(() => {}); flash('▶'); } else { v.pause(); flash('⏸'); } };
    P.seek = (d) => { if (!v.duration) return; v.currentTime = Math.max(0, Math.min(v.duration - 0.05, v.currentTime + d)); flash((d < 0 ? '◀◀ ' : '▶▶ ') + (d < 0 ? '-' : '+') + (Math.abs(d) >= 60 ? Math.abs(d) / 60 + ' 分' : Math.abs(d) + ' 秒')); };
    P.vol = (d) => { v.muted = false; v.volume = Math.max(0, Math.min(1, Math.round((v.volume * 100 + d)) / 100)); flash('🔊 ' + Math.round(v.volume * 100) + '%'); };
    P.full = () => {
      if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); return; }
      if (opt.full) { opt.full(); return; }
      const el = box.parentElement || box; const fn = el.requestFullscreen || el.webkitRequestFullscreen;
      if (fn) Promise.resolve(fn.call(el)).catch(() => {}); else { const f2 = v.webkitEnterFullscreen; if (f2) f2.call(v); }
    };
    // ---- 操作バー ----
    const jl = qpCfg().jl;
    const ctl = document.createElement('div'); ctl.className = 'qp-ctl';
    ctl.innerHTML = `${opt.prev ? `<button data-qp="prev" title="前の動画（P）" aria-label="前の動画">${IC.prev}</button>` : ''}<button data-qp="play" title="再生・一時停止（Space / K）" aria-label="再生・一時停止">${IC.pause}</button>${opt.next ? `<button data-qp="next" title="次の動画（N）" aria-label="次の動画">${IC.next}</button>` : ''}<button data-qp="back" title="戻る（J）">-${jl}</button><button data-qp="fwd" title="進む（L）">+${jl}</button><span class="qp-t" data-qp="time">00:00 / 00:00</span><span class="qp-sp"></span><button data-qp="mute" title="消音・解除（M）" aria-label="消音">${IC.vol}</button><input type="range" data-qp="vol" min="0" max="100" value="${Math.round(v.volume * 100)}" aria-label="音量">${rateSelect()}<button data-qp="skim" title="ざっと見（V）：何か所かを少しずつ順に流して、中身をすぐ確かめる">⏩ ざっと見</button>${opt.src ? '<button data-qp="scene" title="シーン（G）">▦ シーン</button>' : ''}${opt.media ? '<button data-qp="ab" title="飛ばす区間（A で始め・B で終わり）">✂ A–B</button><button data-qp="sklist" title="この動画の飛ばす区間の一覧（消すのもここから）" hidden></button>' : ''}<button data-qp="zoom" title="ズーム（ホイール・ピンチ・Z / X、押すと 100% に戻す）">🔍 100%</button><button data-qp="gear" title="簡易プレーヤーの設定・飛ばす区間の一覧" aria-label="設定">${QP_IC.gear}</button><button data-qp="full" title="全画面（F）" aria-label="全画面">${IC.full}</button><div class="qp-set" hidden></div>`;
    ui.appendChild(ctl);
    const q = (k) => ctl.querySelector(`[data-qp=${k}]`), setPanel = ctl.querySelector('.qp-set');
    const syncUi = () => {
      // timeupdate のたびに中身を作り直すと、押している最中にボタンの中身が入れ替わってクリックが無効になる
      const pb = q('play'), ps = v.paused ? 'play' : 'pause'; if (pb.dataset.st !== ps) { pb.dataset.st = ps; pb.innerHTML = QP_IC[ps]; }
      q('time').textContent = `${fmtT(v.currentTime || 0)} / ${fmtT(v.duration || 0)}`;
      const mb = q('mute'), ms = v.muted || !v.volume ? 'mute' : 'vol'; if (mb.dataset.st !== ms) { mb.dataset.st = ms; mb.innerHTML = IC[ms]; }
      const r = q('vol'); if (document.activeElement !== r) r.value = v.muted ? 0 : Math.round(v.volume * 100);
    };
    ['play', 'pause', 'timeupdate', 'durationchange', 'volumechange', 'loadedmetadata'].forEach((ev) => v.addEventListener(ev, syncUi));
    const renderSet = () => {
      const sk = mk ? mk.skips() : [];
      setPanel.innerHTML = `<b>簡易プレーヤーの設定</b>${Object.keys(QP_OPTS).map((k) => `<label><span>${esc(QP_OPTS[k][0])}</span>${qpSelect(k, 'data-qpset')}</label>`).join('')}${mk ? `<b style="margin-top:6px" data-sk>この動画の飛ばす区間</b>${sk.length ? sk.map(([a, b], i) => `<label><span>${fmtT(a)} – ${fmtT(b)}</span><button data-qp="skdel" data-i="${i}" title="この区間を消す">✕ 消す</button></label>`).join('') : '<small>ありません（A・B キーか ✂ で作れます）</small>'}` : ''}<small>右上の ⚙ 設定 →「再生」にも同じ項目があります</small>`;
    };
    ctl.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-qp]'); if (!b) return;
      const k = b.dataset.qp; const c = qpCfg();
      if (k === 'play') P.toggle(); else if (k === 'back') P.seek(-c.jl); else if (k === 'fwd') P.seek(c.jl);
      else if (k === 'prev' && opt.prev) opt.prev(); else if (k === 'next' && opt.next) opt.next();
      else if (k === 'mute') { v.muted = !v.muted; flash(v.muted ? '🔇 消音' : '🔊 ' + Math.round(v.volume * 100) + '%'); }
      else if (k === 'zoom') P.zoomReset(); else if (k === 'full') P.full();
      else if (k === 'ab') P.mark();
      else if (k === 'scene') P.scenes();
      else if (k === 'skim') P.skim();
      else if (k === 'sklist') { renderSet(); setPanel.hidden = false; const h = setPanel.querySelector('[data-sk]'); if (h) h.scrollIntoView({ block: 'nearest' }); }
      else if (k === 'skdel' && mk) { mk.delSkip(+b.dataset.i); P.drawSkips(); renderSet(); }
      else if (k === 'gear') { if (setPanel.hidden) renderSet(); setPanel.hidden = !setPanel.hidden; }
    });
    ctl.addEventListener('input', (e) => { if (e.target.dataset.qp === 'vol') { v.volume = +e.target.value / 100; v.muted = !+e.target.value; } });
    ctl.addEventListener('change', (e) => {
      const t = e.target; if (t.dataset.qpset === undefined) return;
      saveQpCfg({ [t.dataset.k]: qpVal(t.dataset.k, t.value) });
      if (t.dataset.k === 'jl') document.querySelectorAll('.qp-ctl').forEach((x) => { const n = qpCfg().jl; const bb = x.querySelector('[data-qp=back]'), ff = x.querySelector('[data-qp=fwd]'); if (bb) bb.textContent = '-' + n; if (ff) ff.textContent = '+' + n; });
      if (t.dataset.k === 'tri' || t.dataset.k === 'triNext') document.querySelectorAll('video').forEach((x) => { if (x._qp && x._qp.drawTri) x._qp.drawTri(); });
      if (document.getElementById('pd-set')) renderSettings();
    });
    // ---- マウスを乗せたら（設定がオフなら押したら）キー操作の対象にする ----
    [box, ui].forEach((el) => {
      el.addEventListener('mouseenter', () => { if (qpCfg().hover) qpSetActive(P); });
      el.addEventListener('mousedown', () => qpSetActive(P));
    });
    // ---- 見ながら仕分け（Y 残す／D 消す候補／S スター） ----
    if (mk && mk.setTri) {
      const tb = document.createElement('div'); tb.className = 'qp-tri';
      ui.appendChild(tb);
      P.drawTri = () => {
        const t = mk.tri(), st = mk.starred();
        tb.hidden = !qpCfg().tri;
        tb.innerHTML = `<b>見ながら仕分け</b><button data-qt="keep" class="k${t === 'keep' ? ' on' : ''}" title="残す（Y）。もう一度押すと外す"><kbd>Y</kbd>残す</button><button data-qt="del" class="d${t === 'del' ? ' on' : ''}" title="消す候補（D）。すぐには消さず、左メニューの「消す候補」にまとめます"><kbd>D</kbd>消す候補</button><button data-qt="star" class="s${st ? ' on' : ''}" title="スター（S）。PikPak のスターを付ける・外す"><kbd>S</kbd>${st ? '★' : '☆'} スター</button>${opt.next ? '<button data-qt="next" title="次の動画（N）"><kbd>N</kbd>次へ</button>' : ''}<span class="sp"></span><small>${qpCfg().triNext && opt.next ? '印を付けたら次の動画へ' : ''}</small>`;
      };
      P.tri = async (k) => {
        if (k === 'star') { try { const on = await mk.star(); flash(on ? '★ スターを付けました' : '☆ スターを外しました'); } catch (e) { if (e.session) { handleErr(e, view); return; } flash('スターを変えられませんでした'); } P.drawTri(); return; }
        const nv = mk.setTri(k); P.drawTri();
        flash(nv === 'keep' ? '✓ 残す' : nv === 'del' ? '🗑 消す候補に入れました' : '印を外しました');
        if (nv && qpCfg().triNext && opt.next) setTimeout(() => { if (v.isConnected) opt.next(); }, 450);
      };
      tb.addEventListener('click', (e) => { const b = e.target.closest('[data-qt]'); if (!b) return; const k = b.dataset.qt; if (k === 'next') { if (opt.next) opt.next(); } else P.tri(k); });
      P.drawTri();
    }
    // ---- ざっと見（1 本を何か所かに分けて、少しずつ順に流す。気になったら Enter でその位置から普通に再生） ----
    const sk = { on: false, i: 0, timer: null, muted: false };
    const skimEl = document.createElement('div'); skimEl.className = 'qp-skim'; skimEl.hidden = true; stage.appendChild(skimEl);
    const skimDraw = () => { const N = qpCfg().skimN; skimEl.innerHTML = `<span>ざっと見 ${sk.i + 1} / ${N} か所目 ・ Enter でここから再生 ・ V でやめる</span><div>${Array.from({ length: N }, (_, j) => `<i class="${j < sk.i ? 'p' : j === sk.i ? 'c' : ''}"></i>`).join('')}</div>`; };
    const skimStep = () => {
      clearTimeout(sk.timer); if (!sk.on || !v.isConnected) return;
      const c = qpCfg(), N = c.skimN, d = v.duration;
      if (!d || !isFinite(d)) { sk.timer = setTimeout(skimStep, 300); return; }
      if (sk.i >= N) { P.skim(false); if (opt.next && qpCfg().triNext) { flash('ざっと見 おわり → 次の動画へ'); opt.next(); } else flash('ざっと見 おわり'); return; }
      v.currentTime = Math.min(d - 1, d * (sk.i + 0.5) / N); v.play().catch(() => {}); skimDraw();
      sk.timer = setTimeout(() => { sk.i++; skimStep(); }, c.skimSec * 1000 / Math.max(1, v.playbackRate / 1));
    };
    P.skim = (on) => {
      if (on === undefined) on = !sk.on;
      const b = ui.querySelector('[data-qp=skim]');
      if (on && !sk.on) { sk.on = true; sk.i = 0; sk.muted = v.muted; v.muted = true; skimEl.hidden = false; if (b) b.classList.add('on'); skimStep(); }
      else if (!on && sk.on) { sk.on = false; clearTimeout(sk.timer); v.muted = sk.muted; skimEl.hidden = true; if (b) b.classList.remove('on'); }
    };
    P.skimOn = () => sk.on;
    ui.classList.toggle('qp-auto', qpCfg().bar === 'auto');
    window.addEventListener('resize', apply);
    syncUi();
    if (!qpActive || !qpActive.v.isConnected) qpSetActive(P);
    return P;
  }
  // プレーヤーの外を押したら、キー操作の対象から外す（フォルダ一覧の ← → などを横取りし続けないため）
  document.addEventListener('mousedown', (e) => {
    if (!qpActive) return;
    if (!qpActive.v.isConnected) { qpActive = null; return; }
    if (!qpActive.root.some((el) => el.contains(e.target))) qpSetActive(null);
  }, true);
  window.addEventListener('keydown', (e) => {
    const P = qpActive; if (!P) return;
    if (!P.v.isConnected) { qpActive = null; return; }
    const t = e.target; if (t && (t.tagName === 'INPUT' && t.type !== 'range' && t.type !== 'checkbox' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    if (e.metaKey || e.ctrlKey || e.altKey || document.getElementById('pd-dlg')) return;
    const c = qpCfg(), k = e.key, v = P.v;
    const done = () => { e.preventDefault(); e.stopImmediatePropagation(); };
    if (k === ' ' || k === 'k' || k === 'K') { done(); P.toggle(); }
    else if (k === 'ArrowLeft') { done(); P.seek(-(e.shiftKey ? c.big : c.step)); }
    else if (k === 'ArrowRight') {
      done();
      // 押したままにすると速く再生、すぐ離せば今までどおり進む（離したときに進む）
      if (e.shiftKey) { P.seek(c.big); return; }
      if (e.repeat) return;
      if (v.paused) { P.seek(c.step); return; }
      clearTimeout(P.kHold); P.kDown = true; P.kHeld = false;
      P.kHold = setTimeout(() => { if (P.kDown) { P.kHeld = true; P.holdOn(); } }, 350);
    }
    else if (k === 'a' || k === 'A') { done(); P.mark('A'); }
    else if ((k === 'g' || k === 'G') && P.scenes) { done(); P.scenes(); }
    else if ((k === 'v' || k === 'V') && P.skim) { done(); P.skim(); }
    else if (k === 'Enter' && P.skimOn && P.skimOn()) { done(); P.skim(false); v.play().catch(() => {}); P.flash('▶ ここから再生'); }
    else if ((k === 'y' || k === 'Y') && P.tri) { done(); P.tri('keep'); }
    else if ((k === 'd' || k === 'D') && P.tri) { done(); P.tri('del'); }
    else if ((k === 's' || k === 'S') && P.tri) { done(); P.tri('star'); }
    else if (k === 'b' || k === 'B') { done(); P.mark('B'); }
    else if (k === 'j' || k === 'J') { done(); P.seek(-c.jl); }
    else if (k === 'l' || k === 'L') { done(); P.seek(c.jl); }
    else if (k === ',' || k === '.') { done(); if (!v.paused) v.pause(); v.currentTime = Math.max(0, v.currentTime + (k === ',' ? -1 : 1) / 30); P.flash(k === ',' ? '◀ 1 コマ' : '1 コマ ▶'); }
    else if (k === 'ArrowUp') { done(); P.vol(c.vol); }
    else if (k === 'ArrowDown') { done(); P.vol(-c.vol); }
    else if (k === 'm' || k === 'M') { done(); v.muted = !v.muted; P.flash(v.muted ? '🔇 消音' : '🔊 ' + Math.round(v.volume * 100) + '%'); }
    else if (/^[0-9]$/.test(k) && !e.shiftKey) { done(); if (v.duration) { v.currentTime = v.duration * (+k) / 10; P.flash(k + '0%'); } }
    else if (k === ']' || k === '[' || k === '\\') { done(); P.flash(setRate(k === '\\' ? 1 : getRate() + (k === ']' ? 0.25 : -0.25)) + '×'); }
    else if (k === 'f' || k === 'F') { done(); P.full(); }
    else if (k === 'z' || k === 'Z' || k === 'x' || k === 'X') { done(); const xy = P.lastXY || []; P.zoomAt(P.z * (k.toLowerCase() === 'z' ? 1.25 : 0.8), xy[0], xy[1]); }
    else if (k === 'r' || k === 'R') { done(); P.zoomReset(); }
    else if ((k === 'n' || k === 'N') && P.opt.next) { done(); P.opt.next(); }
    else if ((k === 'p' || k === 'P') && P.opt.prev) { done(); P.opt.prev(); }
    else if (k === 'Enter' && P.opt.ext) { done(); v.pause(); P.opt.ext(); }
  }, true);
  window.addEventListener('keyup', (e) => {
    const P = qpActive; if (!P || e.key !== 'ArrowRight' || !P.kDown) return;
    P.kDown = false; clearTimeout(P.kHold);
    e.preventDefault(); e.stopImmediatePropagation();
    if (P.kHeld) { P.kHeld = false; P.holdOff(); } else P.seek(qpCfg().step);
  }, true);
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
    // ドラッグでも移動
    bar.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return; e.preventDefault(); try { bar.setPointerCapture(e.pointerId); } catch (er) { /* 無視 */ }
      v.currentTime = tAt(e); upd();
      const mv = (ev) => { v.currentTime = tAt(ev); upd(); };
      const up = () => { bar.removeEventListener('pointermove', mv); bar.removeEventListener('pointerup', up); bar.removeEventListener('pointercancel', up); };
      bar.addEventListener('pointermove', mv); bar.addEventListener('pointerup', up); bar.addEventListener('pointercancel', up);
    });
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
    // ほかの動画（プレビュー・再生画面）を止めて片付ける。iPhone は動画を同時に 1 本しか動かせず、コマ作りが途中で止まるため
    closeQL(); closePlayer();
    document.querySelectorAll('video').forEach((x) => { try { x.pause(); } catch (e) { /* 無視 */ } });
    const run = ++framesRun;
    let n = 16; try { n = +localStorage.getItem(LS_FRAMES) || 16; } catch (e) { /* 無視 */ }
    if (![9, 16, 25].includes(n)) n = 16;
    const d = document.createElement('div'); d.id = 'pd-frames'; document.body.appendChild(d);
    const kept = (id) => { if (view !== 'dup') return ''; const g = visibleGroups().find((x) => x.items.some((f) => f.id === id)); if (!g) return ''; const i = g.items.findIndex((f) => f.id === id); return stateOf(g.items[i], i) === 'del' ? 'del' : 'keep'; };
    d.innerHTML = `<div class="fr-box" role="dialog" aria-label="コマ一覧"><div class="fr-hd"><b>コマ一覧</b><span class="note">${ids.length > 1 ? '同じ位置のコマを左右に並べています' : ''}</span><span class="sp"></span><span class="seg">${[9, 16, 25].map((k) => `<button data-frn="${k}" class="${k === n ? 'on' : ''}">${k} コマ</button>`).join('')}</span><button class="x" data-frclose title="閉じる（Esc）" aria-label="閉じる">${IC.x}</button></div>
      <div class="fr-cols" style="grid-template-columns:repeat(${ids.length},minmax(0,1fr))">${ids.map((id) => { const f = fileById(id), k = kept(id); return `<div class="fr-col" data-frid="${esc(id)}"><div class="fr-meta">${k ? `<span class="fr-tag ${k}">${k === 'keep' ? '残す' : '削除'}</span>` : ''}<b title="${esc(f.name)}">${esc(f.name)}</b><span class="note raw" data-frinfo>${fmt(f.size)}</span></div><div class="fr-grid" style="grid-template-columns:repeat(${Math.sqrt(n)},1fr)">${Array.from({ length: n }, (_, i) => `<button class="fr-c" data-fri="${i}"><span class="t"></span></button>`).join('')}</div><div class="fr-msg note" data-frmsg>動画を読み込んでいます…</div><div class="fr-acts"><button data-frplay disabled>▶ 選んだコマから再生</button><button data-frsave disabled>画像で保存</button></div></div>`; }).join('')}</div>
      <div class="fr-ft note">コマは動画を読み込みながら順に出ます（1 本 10〜30 秒ほど）。コマを押して選び、「選んだコマから再生」（またはコマをダブルクリック）でその位置から再生します。</div></div>`;
    if (LANG === 'en') d.querySelectorAll('*').forEach(trNode);
    d.addEventListener('mousedown', (e) => { if (e.target === d) closeFrames(); });
    d.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.frclose !== undefined) { closeFrames(); return; }
      if (b.dataset.frn) { try { localStorage.setItem(LS_FRAMES, b.dataset.frn); } catch (err) { /* 無視 */ } openFrames(ids); return; }
      const col = b.closest('.fr-col'); if (!col) return;
      if (b.dataset.fri !== undefined) { col.querySelectorAll('.fr-c.on').forEach((x) => x.classList.remove('on')); b.classList.add('on'); col.querySelector('[data-frplay]').disabled = !b.dataset.t; return; }
      if (b.dataset.frplay !== undefined) { const on = col.querySelector('.fr-c.on'); const t = on ? +on.dataset.t : 0; framesPlay(col.dataset.frid, t); return; }
      if (b.dataset.frsave !== undefined) saveSheet(col);
    });
    // コマをダブルクリックすると、その位置から再生
    d.addEventListener('dblclick', (e) => { const c = e.target.closest('.fr-c'); if (!c || !c.dataset.t) return; e.preventDefault(); framesPlay(c.closest('.fr-col').dataset.frid, +c.dataset.t); });
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
          // 1 コマ取れなくても止めない：少しずらしてもう一度、それでもだめなら空けて次へ
          let c = null, tt = t;
          for (const dt of [0, 1.5]) { tt = Math.min(dur - 0.5, t + dt); try { c = await Promise.race([gr.grab(tt, 320), sleep(15000).then(() => { throw new Error('時間切れ'); })]); break; } catch (e) { if (e.message === 'closed' || run !== framesRun) return; log('warn', `コマを取れませんでした（${fmtT(tt)}）：${e.message}`, fileById(id).name); } }
          cells[i].dataset.t = String(tt); cells[i].querySelector('.t').textContent = fmtT(tt);
          if (c) cells[i].prepend(c); else cells[i].classList.add('ng');
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
  // コマ一覧を閉じてから少し待って再生する（コマ作りの動画を片付け終わる前に再生を始めると、Safari・アプリ版で落ちることがあるため）
  function framesPlay(id, t) { closeFrames(); setTimeout(() => playFile(id, { t }), 250); }
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
  const LIB_IC = { cand: '<svg viewBox="0 0 24 24"><path d="M5 7h14M9.5 7V5h5v2"/><path d="M7 7l.8 12.2A1.5 1.5 0 0 0 9.3 20.6h5.4a1.5 1.5 0 0 0 1.5-1.4L17 7"/><path d="M10 11.5l4 4M14 11.5l-4 4"/></svg>', cont: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M10 8.5v5l4-2.5z"/><path d="M3 20.5h11" stroke-width="2.4"/></svg>', dl: '<svg viewBox="0 0 24 24"><path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 8.5a4 4 0 0 1-.5 7.97"/><path d="M12 11v9M8.8 17l3.2 3 3.2-3"/></svg>', recent: '<svg viewBox="0 0 24 24"><circle cx="11" cy="12" r="7.5"/><path d="M11 8v4.2l2.6 1.6"/><path d="M19.5 3.5v4M17.5 5.5h4"/></svg>', hist: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/><path d="M10.5 9.2v5.6l4.4-2.8z"/></svg>', star: '<svg viewBox="0 0 24 24"><path d="M12 3.8l2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8z"/></svg>', trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M9.5 7V4.8h5V7"/><path d="M6 7l1 12.2A1.5 1.5 0 0 0 8.5 20.6h7a1.5 1.5 0 0 0 1.5-1.4L18 7"/><path d="M10 11v6M14 11v6"/></svg>' };
  // ---------- 左メニュー：ダウンロード中・最近追加したもの・再生した履歴・スター付き・ゴミ箱 ----------
  // ---- 追加したもの：Dedupe でリンクを追加したときの記録（このブラウザに保存）と、PikPak のダウンロードタスクを合わせて見せる ----
  const LS_ADDLOG = 'ppdup:addlog:v1';
  const addLogRead = () => { try { return JSON.parse(localStorage.getItem(LS_ADDLOG) || '[]') || []; } catch (e) { return []; } };
  const addLogWrite = (a) => { try { localStorage.setItem(LS_ADDLOG, JSON.stringify(a.slice(0, 300))); } catch (e) { /* 無視 */ } };
  const addLogPush = (r) => { const a = addLogRead(); a.unshift({ ...r, lid: 'L' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), at: Date.now() }); addLogWrite(a); };
  const LIB_TABS = [['dl', '追加したもの'], ['recent', '最近追加したもの'], ['cont', '続きを見る'], ['cand', '消す候補'], ['hist', '再生した履歴'], ['star', 'スター付き'], ['trash', 'ゴミ箱']];
  let libSt = null, libBadge = { dl: 0, trash: 0 };
  const encF = (o) => encodeURIComponent(JSON.stringify(o));
  const phaseTxt = { PHASE_TYPE_RUNNING: 'ダウンロード中', PHASE_TYPE_PENDING: '順番待ち', PHASE_TYPE_ERROR: '失敗', PHASE_TYPE_COMPLETE: '完了' };
  const LIB_GRID = new Set(['recent', 'cont', 'cand', 'hist', 'star']);
  async function libFetch(tab) {
    if (tab === 'dl') {
      const d = await api(`/tasks?type=offline&limit=100&thumbnail_size=SIZE_SMALL&filters=${encF({ phase: { in: 'PHASE_TYPE_RUNNING,PHASE_TYPE_PENDING,PHASE_TYPE_ERROR,PHASE_TYPE_COMPLETE' } })}`);
      const tasks = new Map((d.tasks || []).map((t) => [t.id, t]));
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
    // 続きを見る：途中で止めたもの（このブラウザの再生の記録から。新しい順）
    // 消す候補：見ながら仕分けで D を付けたもの
    if (tab === 'cand') {
      const db = mediaAll();
      return Object.keys(db).filter((k) => db[k].tri === 'del').sort((a, b) => Date.parse(db[b].at) - Date.parse(db[a].at))
        .map((k) => { const m = db[k], sf = fileById(k); return { id: k, name: m.name || (sf && sf.name) || k, size: m.size || (sf && sf.size) || 0, at: m.at, thumb: m.thumb || (sf && sf.thumb) || '' }; });
    }
    if (tab === 'cont') {
      const db = mediaAll();
      return Object.keys(db).filter((k) => db[k].pos > 0 && !db[k].done).sort((a, b) => Date.parse(db[b].at) - Date.parse(db[a].at)).slice(0, 300)
        .map((k) => { const m = db[k], sf = fileById(k); return { id: k, name: m.name || (sf && sf.name) || k, size: m.size || (sf && sf.size) || 0, at: m.at, thumb: m.thumb || (sf && sf.thumb) || '' }; });
    }
    if (tab === 'hist') {
      let d = {}; try { d = await api(`/events?thumbnail_size=SIZE_MEDIUM&limit=100&filters=${encF({ type: { in: 'TYPE_PLAY' } })}`); } catch (e) { if (e.session) throw e; }
      const seen = new Set(), out = [];
      const db = mediaAll(); const loc = Object.keys(db).filter((k) => db[k].at).map((k) => ({ id: k, ...db[k] }));
      (d.events || []).forEach((e) => {
        const r = e.reference_resource || {}; const id = String(e.file_id || r.id || '');
        if (!id || seen.has(id) || r.trashed) return; seen.add(id);
        const sf = fileById(id);
        out.push({ id, name: r.name || e.file_name || id, size: +(r.size || e.file_size) || 0, at: e.event_time || e.created_time || e.updated_time || '', thumb: r.thumbnail_link || e.thumbnail_link || (sf && sf.thumb) || '' });
      });
      // このブラウザで再生した記録と合わせる（同じファイルは新しい方の日時）
      loc.forEach((x) => {
        if (!x || !x.id) return;
        const o = out.find((y) => y.id === x.id);
        if (o) { if (Date.parse(x.at) > Date.parse(o.at || 0)) o.at = x.at; return; }
        const sf = fileById(x.id); out.push({ id: x.id, name: x.name, size: x.size || (sf && sf.size) || 0, at: x.at, thumb: x.thumb || (sf && sf.thumb) || '' });
      });
      return out.sort((a, b) => (Date.parse(b.at) || 0) - (Date.parse(a.at) || 0));
    }
    if (tab === 'star' || tab === 'trash') {
      const fl = tab === 'star' ? { trashed: { eq: false }, system_tag: { in: 'STAR' } } : { trashed: { eq: true } };
      const out = []; let tk = '', n = 0;
      do {
        const d = await api(`/files?thumbnail_size=SIZE_MEDIUM&limit=500&parent_id=*&filters=${encF(fl)}${tk ? '&page_token=' + encodeURIComponent(tk) : ''}`);
        (d.files || []).forEach((f) => out.push({ id: f.id, name: f.name, size: +f.size || 0, folder: f.kind === 'drive#folder', at: f.modified_time || f.created_time || '', thumb: f.thumbnail_link || '' }));
        tk = d.next_page_token || '';
      } while (tk && ++n < 20);
      return out;
    }
    // 最近追加したもの：読み込んだ内容から（追加日の新しい順）
    if (!hasScan()) return null;
    const lim = Date.now() - libSt.days * 864e5;
    return files.filter((f) => f.ct && Date.parse(f.ct) >= lim).sort((a, b) => Date.parse(b.ct) - Date.parse(a.ct)).slice(0, 500)
      .map((f) => ({ id: f.id, name: f.name, size: f.size, at: f.ct, path: f.path, thumb: f.thumb || '' }));
  }
  const libAuto = () => { try { return localStorage.getItem('ppdup:libauto:v1') !== '0'; } catch (e) { return true; } };
  const libView = () => { try { const v = localStorage.getItem('ppdup:libview:v1'); return ['list', 'thumb', 'tile'].includes(v) ? v : 'tile'; } catch (e) { return 'tile'; } };
  // ダブルクリック・Enter はフォルダ一覧と同じく「再生のしかた」の設定に従う（外部プレーヤーにしていれば外部で開く）。スペースは簡易プレビュー
  function libPlayDefault(it) { const p = playPref(); if (p.mode === 'external') { libPvClose(); openExternal(it.id, p.ext, it.name); } else { libPreview(it.id).then(() => { if (p.mode === 'full') { const v = document.querySelector('#pd-lib .lb-pv .lb-pvbox'); const fn = v && (v.requestFullscreen || v.webkitRequestFullscreen); if (fn) Promise.resolve(fn.call(v)).catch(() => {}); } }); } }
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
        if (x.lbclose !== undefined) { if (!libSt.busy) closeLib(); }
        else if (x.lbtab) { if (!libSt.busy) libLoad(x.lbtab); }
        else if (x.lbdays) { libSt.days = +x.lbdays; libLoad('recent'); }
        else if (x.lbreload !== undefined) libLoad(libSt.tab);
        else if (x.lbtall) { libSt.closed = new Set(); if (x.lbtall === 'close') libSt.items.forEach((it) => { let acc = ''; String(it.path || '/').split('/').filter(Boolean).forEach((seg) => { acc += '/' + seg; libSt.closed.add(acc); }); }); renderLib(); }
        else if (x.lbview) { try { localStorage.setItem('ppdup:libview:v1', x.lbview); } catch (e) { /* 無視 */ } renderLib(); }
        else if (x.lbauto !== undefined) { try { localStorage.setItem('ppdup:libauto:v1', libAuto() ? '0' : '1'); } catch (e) { /* 無視 */ } renderLib(); }
        else if (x.lbsz) { try { localStorage.setItem('ppdup:libsize:v1', x.lbsz); } catch (e) { /* 無視 */ } renderLib(); }
        else if (x.lbopen) libReveal(x.lbopen);
        else if (x.lbre) { const it = libItem(x.lbre); if (it && it.url) { try { sessionStorage.setItem(SS_ADDTEXT, it.url); } catch (e) { /* 無視 */ } closeLib(); openAdd('DL'); } }
        else if (x.lbadd !== undefined) { closeLib(); openAdd('DL'); }
        else if (x.lbpv) libPreview(x.lbpv);
        else if (x.lbext) { const it = libItem(x.lbext); libPvClose(); openExternal(x.lbext, '', it && it.name); }
        else if (x.lbpvx !== undefined) libPvClose();
        else if (x.lbdo) libDo(x.lbdo);
      });
      d.addEventListener('dblclick', (e) => {
        const c = e.target.closest('[data-lbc]'); if (!c || !libSt || e.target.closest('input,button')) return;
        const it = libItem(c.dataset.lbc); if (libIsVid(it)) libPlayDefault(it); else if (it) libReveal(it.id);
      });
      d.addEventListener('keydown', (e) => {
        const c = e.target.closest && e.target.closest('[data-lbc]'); if (!c || !libSt) return;
        if (e.key === 'Enter') { e.preventDefault(); const it = libItem(c.dataset.lbc); if (libIsVid(it)) libPlayDefault(it); else if (it) libReveal(it.id); }
        else if (e.key === ' ') { e.preventDefault(); c.click(); const it = libItem(c.dataset.lbc); if (libIsVid(it)) libPreview(it.id); }
      });
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
  async function libPreview(id) {
    const it = libItem(id); if (!it || !libIsVid(it)) return;
    const d = document.getElementById('pd-lib'); if (!d) return;
    libPvClose(); libSt.cur = id;
    const run = ++libPvRun;
    const p = document.createElement('div'); p.className = 'lb-pv';
    p.innerHTML = `<div class="lb-pvbox" role="dialog" aria-label="プレビュー"><div class="lk-hd"><b title="${esc(it.name)}">${esc(it.name)}</b><span class="sp"></span><button class="x" data-lbpvx title="プレビューを閉じる（Esc）" aria-label="閉じる">${IC.x}</button></div>
      <div class="lb-pvv"><div class="pl-msg">再生の準備中…</div></div>
      <div class="lb-pvft"><span class="tx"><b>簡易プレビュー（低画質）</b>・本編をきちんと見るなら、外部プレーヤー（オリジナル画質）がおすすめです<span data-lbpvi></span></span><button data-lbopen="${esc(id)}">場所を開く</button><button class="pri" data-lbext="${esc(id)}">↗ 外部プレーヤーで見る（オリジナル画質）</button></div></div>`;
    d.appendChild(p);
    const box = p.querySelector('.lb-pvv');
    const vids = libSt.items.filter(libIsVid), vi = vids.findIndex((v) => v.id === id);
    const nx = vi >= 0 && vi < vids.length - 1 ? () => libPreview(vids[vi + 1].id) : null, pv = vi > 0 ? () => libPreview(vids[vi - 1].id) : null;
    // オリジナル画質は選ばない：一番軽い変換画質。なければ再生できるもの
    const P = playerCore(box, id, {
      slot: 'lib', name: it.name, pick: 'light',
      alive: () => run === libPvRun && document.body.contains(p),
      noSource: 'このブラウザの中では再生できません。「↗ 外部プレーヤーで見る」を使ってください。',
      unplayable: 'このブラウザの中では再生できません。「↗ 外部プレーヤーで見る」を使ってください。',
      fail: (q, why) => { if (!box.querySelector('.pl-err')) box.insertAdjacentHTML('beforeend', `<div class="pl-msg pl-err">再生できませんでした${why ? `（${esc(why)}）` : ''}。「↗ 外部プレーヤーで見る」を試してください。</div>`); },
      qp: { ext: () => { libPvClose(); openExternal(id, '', it.name); }, next: nx, prev: pv },
      onMeta: (v, x) => { const i = p.querySelector('[data-lbpvi]'); if (i) i.textContent = `（${x.label}${v.videoHeight ? `・${v.videoWidth}×${v.videoHeight}` : ''}）`; },
      // 続けて流す：終わったら次の動画へ（設定でオフにできる）
      onEnded: () => { if (run === libPvRun && nx && libAuto()) nx(); },
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
      const name = it ? `<b title="${esc(it.name)}">${esc(it.name)}</b>` : '選んでスペースでプレビュー、ダブルクリックで「' + esc(prefLabel()) + '」';
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
    const when = (t) => { const v = Date.parse(t); return v ? new Date(v).toLocaleString(loc(), { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''; };
    const tabs = LIB_TABS.map(([k, l]) => `<button class="lb-tab${k === tab ? ' on' : ''}" data-lbtab="${k}">${LIB_IC[k]}<span>${l}</span>${k === 'dl' && libBadge.dl ? `<i>${libBadge.dl}</i>` : k === 'trash' && libBadge.trash ? `<i>${libBadge.trash}</i>` : ''}</button>`).join('');
    const selectable = tab === 'dl' || tab === 'trash' || tab === 'star' || tab === 'cand';
    const cb = (it) => `<input type="checkbox" data-lbi="${esc(it.id)}"${S.sel.has(it.id) ? ' checked' : ''}${S.busy ? ' disabled' : ''} aria-label="選ぶ">`;
    // どこまで見たか（青い線。見終わったものは灰色の線）
    const triTag = (it) => { const m = !it.folder && mediaGet(it.id); return m && m.tri ? `<span class="lb-tri ${m.tri}">${m.tri === 'keep' ? '残す' : '消す候補'}</span>` : ''; };
    const prog = (it) => { const m = !it.folder && mediaGet(it.id); if (!m) return ''; if (m.done) return '<i class="lb-prog done" style="width:100%" title="見終わった"></i>'; return m.pos > 0 && m.dur ? `<i class="lb-prog" style="width:${Math.min(100, Math.max(2, m.pos / m.dur * 100)).toFixed(1)}%" title="${fmtT(m.pos)} まで見た"></i>` : ''; };
    const card = (it) => {
      const r = { name: it.name, ext: extOf(it.name) };
      const th = it.thumb ? `<img loading="lazy" referrerpolicy="no-referrer" src="${esc(it.thumb)}" alt="">` : `<span class="ph">${it.folder ? ICON_DIR : ICON_FILE(r)}</span>`;
      const mm = !it.folder && mediaGet(it.id);
      const info = [it.size && !it.folder ? fmt(it.size) : '', tab === 'cont' && mm && mm.pos ? `途中 ${fmtT(mm.pos)} / ${fmtT(mm.dur || 0)}` : when(it.at)].filter(Boolean).join('・');
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
      const openId = tab === 'dl' && it.st === 'ok' ? it.fid : '';
      const retry = tab === 'dl' && it.url && (it.st === 'fail' || it.st === 'err' || it.st === 'missing') ? `<button data-lbre="${esc(it.id)}" title="このリンクを、リンク追加の画面にもう一度入れます">もう一度追加</button>` : '';
      const bar = tab === 'dl' && it.st === 'run' ? `<span class="uz-bar"><i style="width:${it.pct}%"></i></span>` : '';
      return `<div class="lb-row">${cb(it)}<span class="lb-t"><b title="${esc(it.name)}">${it.folder ? '📁 ' : ''}${esc(it.name)}</b><small>${esc(info.filter(Boolean).join('・'))}</small>${bar}</span>${tag}${retry}${openId ? `<button data-lbopen="${esc(openId)}" title="フォルダ一覧でこの項目の場所を開く">場所を開く</button>` : ''}</div>`;
    };
    const lv = libView();
    const lsz = (() => { try { return localStorage.getItem('ppdup:libsize:v1') || 'm'; } catch (e) { return 'm'; } })();
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
    const n = S.sel.size, dis = S.busy || S.loading ? ' disabled' : '';
    const pvTip = `スペースで低画質のプレビュー、ダブルクリック・Enter は設定の「再生のしかた」（${esc(prefLabel())}）で開きます。本編は「↗ 外部プレーヤー」（オリジナル画質）がおすすめ。`;
    const note = { dl: 'リンク・マグネットで追加したもの（直近 60 日）。すぐ保存した分は保存先にあるかを、クラウドダウンロードの分は進み具合を確かめて表示します。「一覧から外す」は記録とタスクを消すだけで、保存したファイルは消しません。', recent: '追加日の新しい順（読み込んだ範囲：' + esc(dirLabel((scanRoot() || {}).id) || '—') + '）。' + pvTip, cand: '見ながら仕分けで「消す候補」にしたもの。選んで「ゴミ箱へ」で PikPak のゴミ箱へ移します（すぐには消しません）。', cont: '途中で止めた動画（新しい順）。開くと前回の続きから再生します。', hist: 'Dedupe と PikPak で再生した動画（新しい順）。Dedupe で再生した分はこのブラウザに記録します。' + pvTip, star: 'PikPak でスターを付けた項目。' + pvTip, trash: `ゴミ箱の中身${quota ? `（${fmtCap(quota.trash)}）` : ''}。「完全に削除」「空にする」は元に戻せません。` }[tab];
    const all = selectable && S.items.length ? `<label class="note lb-all"><input type="checkbox" data-lball${n && n === S.items.length ? ' checked' : ''}${dis}> すべて選ぶ</label>` : '';
    const html = `<div class="lk-box" role="dialog" aria-label="${esc(LIB_TABS.find((x) => x[0] === tab)[1])}"><div class="lk-hd"><b>${LIB_TABS.find((x) => x[0] === tab)[1]}</b><span class="note">${S.items.length && !S.loading ? S.items.length + ' 項目' : ''}</span><span class="sp"></span>${grid ? `<span class="seg lb-vw" title="表示のしかた">${[['list', tab === 'recent' ? '🌲 ツリー' : '☰ リスト'], ['thumb', '▤ サムネイル'], ['tile', '▦ タイル']].map(([k, l]) => `<button data-lbview="${k}" class="${lv === k ? 'on' : ''}">${l}</button>`).join('')}</span>${lv === 'list' && tab === 'recent' ? '<span class="seg"><button data-lbtall="open" title="すべて開く">⊞ 全展開</button><button data-lbtall="close" title="すべて閉じる">⊟ 全格納</button></span>' : ''}<button data-lbauto class="${libAuto() ? 'on' : ''}" title="プレビューで動画が終わったら、次の動画を続けて再生します">${libAuto() ? '✓ ' : ''}続けて再生</button>` : ''}${grid && lv === 'tile' ? `<span class="seg lb-sz" title="サムネイルの大きさ">${[['s', '小'], ['m', '中'], ['l', '大']].map(([k, l]) => `<button data-lbsz="${k}" class="${lsz === k ? 'on' : ''}">${l}</button>`).join('')}</span>` : ''}<button data-lbreload title="読み込み直す"${dis}>更新</button><button class="x" data-lbclose title="閉じる（Esc）" aria-label="閉じる">${IC.x}</button></div>
      <div class="lb-tabs">${tabs}</div>
      <div class="lb-note">${note}</div>
      <div class="lk-list">${all}${body}</div>
      <div class="lk-ft">${libActs()}</div></div>`;
    // プレビューを開いたままでも一覧だけ描き直す（動画は止めない）
    const old = d.querySelector('.lk-box'); const sc = old ? (old.querySelector('.lk-list') || {}).scrollTop || 0 : 0;
    if (old) old.outerHTML = html; else d.insertAdjacentHTML('afterbegin', html);
    if (sc) { const l = d.querySelector('.lk-list'); if (l) l.scrollTop = sc; }
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
    unzip: { label: '解凍パスワード（合言葉で暗号化）', keys: ['ppdup:unzippw:x'], merge: true, enc: true },
    media: { label: '再生の記録（再生した履歴・続きの位置・飛ばす区間）', keys: ['ppdup:media:v1'], merge: true },
  };
  let exportSel = { settings: true, seller: true, decision: true, unzip: true, media: true };
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const groupCount = (g, src) => {
    if (EXPORT_GROUPS[g].enc && !src) return pwCache.length;
    let n = 0;
    EXPORT_GROUPS[g].keys.forEach((k) => { const v = src ? src[k] : lsGet(k); if (v == null) return; if (!EXPORT_GROUPS[g].merge) { n++; return; } try { const o = JSON.parse(v); n += Array.isArray(o) ? o.length : Object.keys(o || {}).length; } catch (e) { n++; } });
    return n;
  };
  async function exportData() {
    const data = {};
    Object.keys(EXPORT_GROUPS).forEach((g) => { if (!exportSel[g] || EXPORT_GROUPS[g].enc) return; EXPORT_GROUPS[g].keys.forEach((k) => { const v = lsGet(k); if (v != null) data[k] = v; }); });
    if (exportSel.unzip) { await pwReady; if (pwCache.length) { const pass = askPass('解凍パスワードを、合言葉で暗号化して書き出します。', true); if (pass) data[LS_PWX] = await pwExportBox(pwCache, pass); else status('解凍パスワードは書き出しませんでした'); } }
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
          if (k === LS_PWX) { const pass = askPass('書き出したときの合言葉を入れると、解凍パスワードを読み込みます。'); if (pass) pwImportBox(src[k], pass).then((l) => { const n = addPws(l); log('info', `解凍パスワードを ${n} 件読み込みました`); }).catch(() => alert(tr('合言葉が違うため、解凍パスワードは読み込めませんでした'))); return; }
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
    'ppdup:seller:v1': 'seller', 'ppdup:decision:v1': 'union', 'ppdup:unzippw:x': 'pwx',
    // 端末ごとに違ってよいもの（ウィンドウの位置・開き方など）は同期しない
    'ppdup:theme:v1': 'last', 'ppdup:lang:v1': 'last', 'ppdup:opt:junk:v1': 'last', 'ppdup:opt:cleanname:v1': 'last', 'ppdup:opt:seller:v1': 'last',
    'ppdup:player:v1': 'last', 'ppdup:player:q:v1': 'last', 'ppdup:rate:v1': 'last', 'ppdup:frames:v1': 'last', 'ppdup:seller:cfg:v1': 'last',
  };
  const syncCfg = () => { try { return { on: true, ...(JSON.parse(localStorage.getItem(LS_SYNC) || '{}') || {}) }; } catch (e) { return { on: true }; } };
  const saveSyncCfg = (p) => { try { localStorage.setItem(LS_SYNC, JSON.stringify({ ...syncCfg(), ...p })); } catch (e) { /* 無視 */ } };
  const syncKeys = () => Object.keys(SYNC_KEYS).filter((k) => k !== 'ppdup:unzippw:x' || syncCfg().pw);
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
      if (kind === 'pwx') { out[k] = a; return; } // 相手の分は取り込み済み（mergePwSyncBox）。手元の暗号文で上書き
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
      if (c.pw && R.data && R.data[LS_PWX] && R.data[LS_PWX].v) { const ok = await mergePwSyncBox(R.data[LS_PWX].v); if (!ok) delete m[LS_PWX]; }
      if (c.pw) { await pwReady; await refreshPwSyncBox(); const v = lsGet(LS_PWX); if (v != null) local[LS_PWX] = { v, at: Date.now(), clr: (m[LS_PWX] && m[LS_PWX].clr) || 0 }; }
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
  // ---------- 解凍パスワードの暗号化（AES-GCM） ----------
  //   ・この端末：ブラウザの中に「取り出せない鍵」を作って暗号化（IndexedDB に保存。鍵そのものは読み出せない）
  //   ・書き出し・PikPak での同期：ノエルさんが決めた合言葉から鍵を作って暗号化（PBKDF2-SHA256 60 万回）
  //   ・平文では保存しない（以前の平文の記録は、開いたときに暗号化して置き換える）
  const LS_PWENC = 'ppdup:unzippw:v2', LS_PWX = 'ppdup:unzippw:x';
  const PBKDF2_N = 600000;
  const b64 = (u8) => btoa(String.fromCharCode(...new Uint8Array(u8)));
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const idb = (() => {
    let dbp = null;
    const open = () => dbp || (dbp = new Promise((res, rej) => { const r = indexedDB.open('ppdup-keys', 1); r.onupgradeneeded = () => r.result.createObjectStore('k'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
    const tx = (mode, fn) => open().then((db) => new Promise((res, rej) => { const t = db.transaction('k', mode); const q = fn(t.objectStore('k')); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }));
    return { get: (k) => tx('readonly', (s) => s.get(k)), set: (k, v) => tx('readwrite', (s) => s.put(v, k)), del: (k) => tx('readwrite', (s) => s.delete(k)) };
  })();
  let devKeyP = null;
  const deviceKey = () => devKeyP || (devKeyP = (async () => {
    let k = await idb.get('dev');
    if (!k) { k = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); await idb.set('dev', k); }
    return k;
  })());
  async function aesEnc(key, obj) { const iv = crypto.getRandomValues(new Uint8Array(12)); const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(obj))); return { i: b64(iv), c: b64(ct) }; }
  async function aesDec(key, box) { const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(box.i) }, key, unb64(box.c)); return JSON.parse(new TextDecoder().decode(pt)); }
  async function passKey(pass, salt) {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass.normalize('NFKC')), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: PBKDF2_N, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  // 合言葉を 2 回入れてもらう（短すぎるものは断る）
  function askPass(why, twice) {
    const a = prompt(tr(why + '\n\n合言葉（8 文字以上）を入れてください。忘れると、ほかの端末や書き出したファイルからは戻せません。'));
    if (a == null) return null;
    if (a.length < 8) { alert(tr('合言葉は 8 文字以上にしてください')); return null; }
    if (twice && prompt(tr('確認のため、もう一度入れてください')) !== a) { alert(tr('合言葉が一致しませんでした')); return null; }
    return a;
  }
  // 書き出し用：合言葉で暗号化（塩はファイルに入れる）
  async function pwExportBox(list, pass) { const salt = crypto.getRandomValues(new Uint8Array(16)); const box = await aesEnc(await passKey(pass, salt), list); return JSON.stringify({ v: 1, s: b64(salt), ...box }); }
  async function pwImportBox(str, pass) { const o = JSON.parse(str); return aesDec(await passKey(pass, unb64(o.s)), o); }
  // 同期用：PikPak のアカウントごとに決まる塩＋合言葉の鍵（この端末に「取り出せない鍵」として保存）
  async function acctSalt() { const c = readCred(); let sub = ''; try { sub = JSON.parse(atob(String(c && c.auth).replace(/^Bearer\s+/i, '').split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).sub || ''; } catch (e) { /* 無視 */ } return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('ppdup-sync:' + sub))); }
  async function setSyncPass(pass) { await idb.set('sync', await passKey(pass, await acctSalt())); }
  const syncPassKey = () => idb.get('sync').catch(() => null);
  // 手元の一覧（メモリ上だけに平文で持つ）
  let pwCache = [], pwReady = null;
  const pwList = () => pwCache;
  async function pwPersist() {
    try { localStorage.setItem(LS_PWENC, JSON.stringify(await aesEnc(await deviceKey(), pwCache))); localStorage.removeItem(LS_UNZIPPW); } catch (e) { log('warn', '解凍パスワードを暗号化して保存できませんでした：' + (e.message || e)); }
    refreshPwSyncBox();
  }
  const savePw = (pw) => { if (!pw) return; pwCache = [pw, ...pwCache.filter((x) => x !== pw)].slice(0, 50); pwPersist(); };
  const addPws = (list) => { const n = pwCache.length; pwCache = [...new Set([...pwCache, ...(Array.isArray(list) ? list : []).filter((x) => typeof x === 'string' && x)])].slice(0, 50); if (pwCache.length !== n) pwPersist(); return pwCache.length - n; };
  async function clearPws() { pwCache = []; try { localStorage.removeItem(LS_PWENC); localStorage.removeItem(LS_UNZIPPW); localStorage.removeItem(LS_PWX); } catch (e) { /* 無視 */ } }
  pwReady = (async () => {
    try {
      const enc = lsGet(LS_PWENC);
      if (enc) pwCache = await aesDec(await deviceKey(), JSON.parse(enc));
      // 以前の平文の記録 → 暗号化して置き換え
      const old = lsGet(LS_UNZIPPW);
      if (old) { let a = []; try { a = JSON.parse(old); } catch (e) { a = []; } addPws(a); await pwPersist(); log('info', '解凍パスワードを暗号化して保存し直しました'); }
    } catch (e) { log('warn', '解凍パスワードを読み出せませんでした（この端末の鍵が変わった可能性があります）：' + (e.message || e)); }
  })();
  // 同期用の暗号化した一覧（合言葉の鍵があるときだけ）
  async function refreshPwSyncBox() {
    if (!syncCfg().pw) return;
    const k = await syncPassKey(); if (!k) return;
    try { localStorage.setItem(LS_PWX, JSON.stringify(await aesEnc(k, pwCache))); } catch (e) { /* 無視 */ }
  }
  // 同期で受け取った暗号化した一覧を取り込む（合言葉が違えば取り込まない）
  async function mergePwSyncBox(str) {
    const k = await syncPassKey(); if (!k || !str) return false;
    try { const n = addPws(await aesDec(k, JSON.parse(str))); if (n) log('info', `ほかの端末の解凍パスワードを ${n} 件取り込みました`); return true; } catch (e) { status('合言葉が違うため、解凍パスワードを同期できません（設定 → 情報 で合言葉を入れ直してください）'); log('warn', '解凍パスワードの同期：合言葉が違います'); return false; }
  }
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
        await pwReady;
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
    const fc2 = n.match(FC2_RE); if (fc2) out.add('fc2:' + fc2[1]);
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
    addSt.msg = ''; libIdx = null; addSt.done = null; addSt.stop = false;
    const todo = addSt.items.filter((x) => x.st !== 'ok');
    addSt.prog = { phase: 'check', done: 0, total: todo.length, cur: '', t0: Date.now() };
    addSt.busy = true; renderAdd();
    for (const it of addSt.items) {
      if (it.st === 'ok' || !document.getElementById('pd-add')) continue;
      if (addSt.stop) break;
      addSt.prog.cur = it.name || it.url;
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
      addSt.prog.done++;
      renderAdd();
      await sleep(300);
    }
    addSt.items.forEach((x) => { if (x.st === 'new' || x.st === 'loading') x.st = 'new'; });
    addSt.busy = false; addSt.prog = null; renderAdd();
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
      const tag = it.failed ? pill('del', '失敗') : it.st === 'loading' ? pill('pend', '中身を確認中…') : it.st === 'new' ? pill('pend', '未確認') : it.exists ? pill('warn', 'もうあります') : it.st === 'err' ? pill('warn', '中身を確認できません') : pill(mode === 'part' ? 'pri' : 'ok', mode === 'part' ? '一部だけ保存' : 'すべて保存');
      const info = it.failed ? `${esc(it.failed)}（チェックを入れ直すと、もう一度追加します）` : it.exists ? `${esc(it.exists.path)} に同じ品番${it.exists.size ? `（${fmt(it.exists.size)}）` : ''}${it.on ? '・それでも追加します' : '・追加しません'}`
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
    const dn = addSt.done, pg = addSt.prog;
    const pctV = pg ? Math.round(pg.done / Math.max(1, pg.total) * 100) : 0;
    const etaTx = !pg ? '' : pg.done < 1 ? '残り時間を計算中…' : (() => { const left = (Date.now() - pg.t0) / pg.done * (pg.total - pg.done); return left < 5000 ? 'まもなく完了' : `あと約 ${fmtDur(left)}`; })();
    const doneCard = dn ? `<div class="lk-done"><div class="ic">${dn.ng && !dn.ok ? '!' : '✓'}</div><b>${dn.ok ? `${dn.ok} 件を追加しました` : '追加するものはありませんでした'}</b><small>${dn.nfile ? `すぐ保存したファイル ${dn.nfile}。` : ''}${dn.dupl ? `PikPak に同じタスクがあった ${dn.dupl} 件。` : ''}${dn.already ? `保存先に同じものがあった ${dn.already} 件は追加しませんでした。` : ''}${dn.skipped ? `保存先にすでにあったファイル ${dn.skipped} 個は入れていません。` : ''}${dn.ng ? `失敗 ${dn.ng} 件（下の一覧に残しています）。` : ''}クラウドダウンロードの分は、完了すると保存先に出ます。</small>${dn.names.length ? `<ul>${dn.names.slice(0, 8).map((n) => `<li>${esc(n)}</li>`).join('')}${dn.names.length > 8 ? `<li>ほか ${dn.names.length - 8} 件</li>` : ''}</ul>` : ''}</div>` : '';
    d.innerHTML = `<div class="lk-box" role="dialog" aria-label="リンク・マグネットを追加">
      <div class="lk-hd"><b>リンク・マグネットを追加</b><span class="sp"></span><span class="note">保存先</span><select data-adpid>${addDestOptions().map(([id, l]) => `<option value="${esc(id)}"${(addSt.pid || 'DL') === id ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select><button class="x" data-adclose title="閉じる（Esc）" aria-label="閉じる">${IC.x}</button></div>
      <div class="lk-in"><textarea rows="4" placeholder="magnet:?xt=urn:btih:…&#10;https://…&#10;（.torrent ファイルはここにドロップ）" spellcheck="false">${esc(addSt.text)}</textarea>
        <div class="lk-row"><span class="note">1 行に 1 つ。マグネット・http(s)・40 桁のハッシュ・.torrent（ドロップ）に対応。同じリンクと文中のほかの文字は取り除きます。${hasScan() ? '読み込んだライブラリと照らして、もうある作品を知らせます。' : '<b>まだ読み込んでいないため、もうあるかは確かめられません</b>（先に「Dedupe スキャン」で読み込むと確かめられます）。'}</span><span class="sp"></span><button class="${checked ? '' : 'pri'}" data-adcheck${addSt.busy || !nLinks ? ' disabled' : ''}>${addSt.busy ? '確認中…' : `中身を確認（${nLinks} 件）`}</button></div>
        ${pg ? `<div class="lk-prog"><div class="hd"><span class="spin"></span><b>${pg.phase === 'check' ? '中身を確認しています' : '追加しています'}　${pg.done} / ${pg.total}</b><span class="sp"></span><span class="eta">${esc(etaTx)}</span></div><div class="bar"><i style="width:${pctV}%"></i></div><small>${pg.cur ? `いま：${esc(pg.cur)}　` : ''}${pg.phase === 'check' ? '1 件ごとに PikPak へ中身を問い合わせています（1 件数秒）。' : '保存先を確かめてから 1 件ずつ追加しています。'}この画面を閉じずにお待ちください。</small></div>` : addSt.msg ? `<div class="lk-msg">${esc(addSt.msg)}</div>` : ''}</div>
      <div class="lk-list">${addSt.items.map(item).join('') || (dn ? doneCard : '<div class="empty">リンクを貼り付けて「中身を確認」を押すと、ここに中身が出ます</div>')}</div>
      <div class="lk-ft">${dn && !addSt.items.length ? `<span class="tx"><b>追加が終わりました</b>（次のリンクを貼り付ければ、続けて追加できます）</span><button data-addl>追加したものを見る</button><button class="pri" data-adclose>閉じる</button>` : (pg ? `<span class="tx"><b>${pg.phase === 'check' ? '確認中' : '追加中'}… ${pg.done} / ${pg.total}</b>（${esc(etaTx)}）</span><button data-adstop${addSt.stop ? ' disabled' : ''}>${addSt.stop ? '止めています…' : pg.phase === 'check' ? '確認を中断' : '追加を中断'}</button><button class="pri" disabled>${pg.phase === 'check' ? '確認中…' : '追加中…'}</button>` : `<span class="tx">${sum.text}</span><button data-adclose>${dn ? '閉じる' : 'キャンセル'}</button><button class="${checked ? 'pri' : ''}" data-adgo${sum.n && !addSt.busy ? '' : ' disabled'}>${sum.n} 件を追加</button>`)}</div></div>`;
    if (LANG === 'en') d.querySelectorAll('*').forEach(trNode);
    const nta = d.querySelector('textarea');
    nta.addEventListener('input', () => { addSt.text = nta.value; const b = d.querySelector('[data-adcheck]'); const n = parseLinks(nta.value).length; if (b && !addSt.busy) { b.disabled = !n; b.textContent = tr(`中身を確認（${n} 件）`); } });
  }
  function openAdd(pid) {
    closeFab(); closeCtx();
    let text = ''; try { text = sessionStorage.getItem(SS_ADDTEXT) || ''; sessionStorage.removeItem(SS_ADDTEXT); } catch (e) { /* 無視 */ }
    // 一覧に無い（消した・移した）フォルダが保存先になっていたら、既定の保存先に戻す
    if (pid && pid !== 'DL' && !isHomeId(pid) && !dirById(pid)) pid = 'DL';
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
  function closeAdd() { const added = addSt && addSt.done && addSt.done.ok > 0; const d = document.getElementById('pd-add'); if (d) d.remove(); addSt = null; if (added) rsAsk('add'); }
  // ---- 読み込み直すかの確認（自動では読み込まない：いつ読み込むかは人が決める） ----
  //   ・リンクを追加したあと、メインの画面に戻ったとき
  //   ・開いたときに、前回の読み込みから 1 日以上たっているとき（「あとで」を押したら、その日はもう出さない）
  const SS_RSLATER = 'ppdup:rslater:v1';
  function rsAsk(why) {
    const el = $('[data-r=rsban]'); if (!el || busy || !hasScan()) return;
    if (why === 'stale') { let l = ''; try { l = sessionStorage.getItem(SS_RSLATER) || ''; } catch (e) { /* 無視 */ } if (l === new Date().toDateString()) return; }
    const days = meta ? Math.floor((Date.now() - meta.at) / 864e5) : 0;
    el.dataset.why = why;
    el.innerHTML = `<span class="ic">↻</span><span class="tx"><b>${why === 'add' ? '追加したものを一覧に反映するため、読み込み直しますか？' : `前回の読み込みから ${days} 日たっています。読み込み直しますか？`}</b><small>${why === 'add' ? 'すぐ保存した分は一覧に出ていますが、クラウドダウンロードの分や PikPak で変わった分は、読み込み直すと反映されます。' : 'PikPak で追加・削除・移動したものは、読み込み直すと整理やフォルダ一覧に反映されます。'}読み込み中は移動・削除などの操作ができません。</small></span><button class="pri" data-a="rsgo">読み込み直す</button><button data-a="rslater">あとで</button>`;
    el.hidden = false;
  }
  function rsHide() { const el = $('[data-r=rsban]'); if (el) { el.hidden = true; el.innerHTML = ''; } }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.getElementById('pd-add') && addSt && !addSt.busy) { e.preventDefault(); e.stopImmediatePropagation(); closeAdd(); } }, true);
  function onAddClick(e) {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.adclose !== undefined) { if (!addSt.busy) closeAdd(); return; }
    if (b.dataset.adstop !== undefined) { addSt.stop = true; renderAdd(); return; }
    if (b.dataset.adcheck !== undefined) { addSt.done = null; addSt.msg = ''; previewLinks(); return; }
    if (b.dataset.addl !== undefined) { closeAdd(); if (!root.classList.contains('on')) openFlow(); openLib('dl'); return; }
    if (b.dataset.adgo !== undefined) { runAdd(); }
  }
  function onAddChange(e) {
    const t = e.target;
    if (t.dataset.adpid !== undefined) { addSt.pid = t.value; return; }
    if (t.dataset.adi !== undefined) { const it = addSt.items[+t.dataset.adi]; if (it) { it.on = t.checked; if (t.checked) it.failed = ''; } renderAdd(); return; }
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
    // 保存先のフォルダが本当にあるかを先に確かめる（消した・移したフォルダを選んだままだと、全部「存在しない」で失敗するため）
    if (pid) {
      let okDest = false; try { const g = await apiGet(pid); okDest = !!g && !g.trashed && g.kind === 'drive#folder'; } catch (e) { if (e.session) { handleErr(e, view); return; } okDest = false; }
      if (!okDest) { addSt.msg = `保存先のフォルダ「${addSt.pid === 'root' ? 'ホーム' : fullPath(addSt.pid)}」が PikPak に見つかりません（削除・移動された可能性があります）。上の「保存先」を選び直してから、もう一度「追加」を押してください。`; renderAdd(); return; }
    }
    addSt.busy = true; addSt.stop = false; addSt.prog = { phase: 'add', done: 0, total: list.length, cur: '', t0: Date.now() }; renderAdd();
    let ok = 0, ng = 0, dupl = 0, nfile = 0, skipped = 0, already = 0;
    const errs = [], addedTops = [];
    for (const it of list) {
      if (addSt.stop) break;
      addSt.prog.cur = it.name || it.rootName || it.url; addSt.prog.done = ok + ng + dupl + already; renderAdd();
      try {
        if (addMode(it) === 'part') {
          // 入れ物のフォルダ（同じ名前があれば (2) などを付ける）→ 中のフォルダ → ファイル
          // 既定の保存先のときは、PikPak の既定の保存フォルダ（My Pack）の中に作る
          let base = pid;
          if (!base) { const home = await apiList(''); const mp = home.find((x) => x.kind === 'drive#folder' && (x.folder_type === 'DOWNLOAD' || x.name === 'My Pack')); if (mp) base = mp.id; }
          // 保存先をその場で確かめる：同じ名前のフォルダがあれば、そこへ足りないファイルだけを入れる（同じものを二重に保存しない）
          const baseList = await apiList(base || '');
          const nm = String(it.rootName || it.name || 'magnet').replace(/[\/\\]/g, '・').slice(0, 200);
          const same = baseList.find((x) => x.kind === 'drive#folder' && x.name.toLowerCase() === nm.toLowerCase());
          let top, have = new Set();
          if (same) {
            top = same.id;
            const walk = async (id, pre) => { for (const x of await apiList(id)) { if (x.kind === 'drive#folder') await walk(x.id, pre + x.name + '/'); else have.add((pre + x.name).toLowerCase() + '|' + (+x.size || 0)); } };
            await walk(top, '');
          } else top = await apiMkdir(base, nm);
          addedTops.push({ id: top, name: nm, base: base || '' });
          const dirs = new Map([['', top]]);
          const want = it.files.filter((x) => x.on);
          const todo = want.filter((f) => !have.has(((f.dir ? f.dir + '/' : '') + f.name).toLowerCase() + '|' + f.size));
          skipped += want.length - todo.length;
          if (same && !todo.length) { it.on = false; it.done = true; it.already = true; already++; log('info', `保存先に同じものがあるため追加しません：${nm}`); continue; }
          addLogPush({ mode: 'part', name: nm, top, url: it.url, size: todo.reduce((a, f) => a + (+f.size || 0), 0), n: todo.length });
          for (const f of todo) {
            let cur = '', p = top;
            for (const part of (f.dir ? f.dir.split('/') : [])) {
              cur = cur ? cur + '/' + part : part;
              if (!dirs.has(cur)) { const ex = same ? (await apiList(p)).find((x) => x.kind === 'drive#folder' && x.name === part) : null; dirs.set(cur, ex ? ex.id : await apiMkdir(p, part)); }
              p = dirs.get(cur);
            }
            await api('/files', { method: 'POST', captcha: 'POST:/drive/v1/files', body: JSON.stringify({ kind: 'drive#file', name: f.name, size: String(f.size), hash: f.gcid.toUpperCase(), upload_type: 'UPLOAD_TYPE_RESUMABLE', folder_type: 'NORMAL', objProvider: { provider: 'UPLOAD_TYPE_UNKNOWN' }, parent_id: p }) });
            nfile++;
          }
        } else {
          const body = { kind: 'drive#file', upload_type: 'UPLOAD_TYPE_URL', url: { url: it.url }, params: { with_thumbnail: 'true', from: 'manual' } };
          if (pid) body.parent_id = pid; else body.folder_type = 'DOWNLOAD';
          const res = await api('/files', { method: 'POST', captcha: 'POST:/drive/v1/files', body: JSON.stringify(body) });
          addLogPush({ mode: 'all', name: it.name || it.rootName || it.url, task: (res && res.task && res.task.id) || '', fid: (res && res.file && res.file.id) || '', url: it.url, size: it.files ? it.files.reduce((a, f) => a + (+f.size || 0), 0) : 0 });
        }
        ok++; it.on = false; it.done = true;
        log('info', `リンクを追加（${addMode(it) === 'part' ? '一部だけ保存' : 'クラウドダウンロード'}）：${it.name || it.url}`);
      } catch (err) {
        if (err.session) { try { sessionStorage.setItem(SS_ADDTEXT, addSt.text); } catch (e) { /* 無視 */ } addSt.busy = false; handleErr(err, view); return; }
        if (/exist|already|重複|已存在/i.test(err.message)) { dupl++; it.on = false; continue; }
        ng++; errs.push(`${it.name || it.url}：${err.message}`); addLogPush({ mode: addMode(it) === 'part' ? 'part' : 'all', name: it.name || it.rootName || it.url, url: it.url, fail: err.message || String(err) });
        // 失敗したものはチェックを外して「失敗」と理由を出す（そのままもう一度押せる状態にしない。直してからチェックを入れ直す）
        it.failed = /存在しない|not.?found|not exist/i.test(err.message) ? '保存先のフォルダが見つかりません（削除・移動された可能性があります。保存先を選び直してください）' : err.message; it.on = false;
      }
      await sleep(400);
    }
    addSt.busy = false; addSt.prog = null;
    addSt.msg = `${ok} 件を追加しました${nfile ? `（すぐ保存したファイル ${nfile}）` : ''}${dupl ? `・PikPak に同じタスクがあった ${dupl} 件` : ''}${ng ? `・失敗 ${ng} 件：${errs.slice(0, 3).join(' ／ ')}` : ''}。クラウドダウンロードの分は、完了すると保存先に出ます。`;
    // 追加できたものは一覧と入力欄から外し、終わった画面（結果と次の操作）を出す
    // 読み込んだ範囲の中に保存したものは、Dedupe の一覧にもすぐ反映する（再読み込みしなくてよい）
    for (const t of addedTops) {
      try {
        if (!hasScan() || !(folders.some((d) => d.id === t.base) || (scanRoot() && scanRoot().id === t.base))) continue;
        if (folders.some((d) => d.id === t.id)) { const gone = new Set([t.id, ...folders.filter((d) => ancestorsOf(d.id).includes(t.id)).map((d) => d.id)]); folders = folders.filter((d) => !gone.has(d.id) || d.id === t.id); files = files.filter((f) => !gone.has(f.parentId)); folders = folders.filter((d) => d.id !== t.id); }
        await addToScan({ id: t.id, name: t.name, kind: 'drive#folder' }, t.base);
      } catch (e) { log('warn', '追加したフォルダを一覧に反映できませんでした：' + (e.message || e), t.name); }
    }
    if (addedTops.length && hasScan()) { treeIdx = null; if (view === 'tree') renderTree(); else if (view === 'scan') render(); renderNav(); }
    addSt.done = { ok, nfile, dupl, ng, skipped, already, names: addSt.items.filter((x) => x.done && !x.already).map((x) => x.name || x.rootName || x.url) };
    addSt.items = addSt.items.filter((x) => !x.done);
    addSt.text = addSt.items.map((x) => x.url).join('\n');
    { const ta = document.querySelector('#pd-add textarea'); if (ta) ta.value = addSt.text; }
    if (!addSt.items.length) addSt.msg = '';
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
  // ---------- 入口ボタンの位置（ドラッグで移動・端にくっつく・このブラウザに保存） ----------
  const LS_FABPOS = 'ppdup:fabpos:v1', FAB_M = 12;
  const fabKey = () => location.host;
  const fabSaved = () => { try { return (JSON.parse(localStorage.getItem(LS_FABPOS) || '{}') || {})[fabKey()] || null; } catch (e) { return null; } };
  const fabSave = (p) => { let all = {}; try { all = JSON.parse(localStorage.getItem(LS_FABPOS) || '{}') || {}; } catch (e) { all = {}; } if (p) all[fabKey()] = p; else delete all[fabKey()]; try { localStorage.setItem(LS_FABPOS, JSON.stringify(all)); } catch (e) { /* 無視 */ } };
  // 既定の位置：PikPak の左メニューの空き（容量表示のすぐ上）。見つからなければ左下
  function fabDefault() {
    const W = innerWidth, H = innerHeight, bw = btn.offsetWidth || 120, bh = btn.offsetHeight || 42;
    let cap = null;
    const it = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (/\d[\d.]*\s*[TGM]B\s*\/\s*\d/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP) });
    for (let n = it.nextNode(); n; n = it.nextNode()) {
      const el = n.parentElement; if (!el || el.closest(UI_SEL)) continue;
      const r = el.getBoundingClientRect(); if (r.width && r.left < 360 && r.top > H * 0.4) { cap = r; break; }
    }
    if (cap) return { side: 'l', x: Math.max(FAB_M, cap.left), y: Math.max(FAB_M, cap.top - bh - 14), auto: true };
    return { side: 'l', x: FAB_M + 8, y: H - bh - FAB_M - 8, auto: true };
  }
  // 保存は「左右どちらの端か」と「上からの位置の割合」：画面の大きさが変わっても同じあたりに戻る
  function placeFab() {
    const s = fabSaved(), W = innerWidth, H = innerHeight, bw = btn.offsetWidth || 120, bh = btn.offsetHeight || 42;
    let x, y;
    if (s) { x = s.side === 'r' ? W - bw - FAB_M : FAB_M; y = s.fy * H; }
    else { const d = fabDefault(); x = d.x; y = d.y; }
    x = Math.max(FAB_M, Math.min(W - bw - FAB_M, x)); y = Math.max(FAB_M, Math.min(H - bh - FAB_M, y));
    btn.style.left = x + 'px'; btn.style.top = y + 'px'; btn.style.right = 'auto'; btn.style.bottom = 'auto';
    placeFabMenu();
  }
  // メニューはボタンのそばに（ボタンが下半分なら上へ、左にあれば左揃え）
  function placeFabMenu() {
    const r = btn.getBoundingClientRect(), W = innerWidth, H = innerHeight, fw = 320;
    fab.style.left = Math.max(FAB_M, Math.min(W - fw - FAB_M, r.left + r.width / 2 < W / 2 ? r.left : r.right - fw)) + 'px'; fab.style.right = 'auto';
    if (r.top + r.height / 2 > H / 2) { fab.style.top = 'auto'; fab.style.bottom = (H - r.top + 8) + 'px'; }
    else { fab.style.bottom = 'auto'; fab.style.top = (r.bottom + 8) + 'px'; }
    fab.style.maxHeight = Math.max(200, (r.top + r.height / 2 > H / 2 ? r.top : H - r.bottom) - 24) + 'px'; fab.style.overflowY = 'auto';
  }
  function setFabPos(p, msg) { fabSave(p); placeFab(); if (msg) status(msg); }
  let fabDrag = null, fabMoved = false;
  btn.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const r = btn.getBoundingClientRect();
    fabDrag = { id: e.pointerId, dx: e.clientX - r.left, dy: e.clientY - r.top, sx: e.clientX, sy: e.clientY, on: false }; fabMoved = false;
  });
  addEventListener('pointermove', (e) => {
    if (!fabDrag || e.pointerId !== fabDrag.id) return;
    if (!fabDrag.on) { if (Math.hypot(e.clientX - fabDrag.sx, e.clientY - fabDrag.sy) < 6) return; fabDrag.on = true; try { btn.setPointerCapture(e.pointerId); } catch (er) { /* 無視 */ } btn.classList.add('drag'); closeFab(); }
    const W = innerWidth, H = innerHeight;
    btn.style.left = Math.max(0, Math.min(W - btn.offsetWidth, e.clientX - fabDrag.dx)) + 'px';
    btn.style.top = Math.max(0, Math.min(H - btn.offsetHeight, e.clientY - fabDrag.dy)) + 'px';
  });
  const fabEnd = (e) => {
    if (!fabDrag || e.pointerId !== fabDrag.id) return;
    const was = fabDrag.on; fabDrag = null; btn.classList.remove('drag');
    if (!was) return;
    fabMoved = true;
    const r = btn.getBoundingClientRect();
    // 離したら一番近い左右の端にくっつく
    setFabPos({ side: r.left + r.width / 2 < innerWidth / 2 ? 'l' : 'r', fy: Math.max(0, r.top) / innerHeight });
  };
  addEventListener('pointerup', fabEnd, true); addEventListener('pointercancel', fabEnd, true);
  // ドラッグしたあとの click ではメニューを開かない
  btn.addEventListener('click', (e) => { if (fabMoved) { fabMoved = false; e.stopImmediatePropagation(); e.preventDefault(); } else placeFabMenu(); }, true);
  // 右クリックで置き場所をすぐ選ぶ
  btn.addEventListener('contextmenu', (e) => {
    e.preventDefault(); closeFab();
    let m = document.getElementById('pd-fabpos'); if (m) m.remove();
    m = document.createElement('div'); m.id = 'pd-fabpos';
    m.innerHTML = `<b>入口ボタンの位置</b>${[['def', '元の位置（左メニューの空き）'], ['lt', '左上へ'], ['lb', '左下へ'], ['rb', '右下へ'], ['rt', '右上へ']].map(([k, l]) => `<button data-fp="${k}">${l}</button>`).join('')}<small>ボタンはドラッグでも動かせます</small>`;
    document.body.appendChild(m);
    const r = btn.getBoundingClientRect();
    m.style.left = Math.max(8, Math.min(innerWidth - m.offsetWidth - 8, r.left)) + 'px';
    m.style.top = (r.top > innerHeight / 2 ? Math.max(8, r.top - m.offsetHeight - 8) : r.bottom + 8) + 'px';
    const off = (ev) => { if (!m.contains(ev.target)) { m.remove(); document.removeEventListener('mousedown', off, true); } };
    document.addEventListener('mousedown', off, true);
    m.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-fp]'); if (!b) return;
      const k = b.dataset.fp, bh = btn.offsetHeight || 42;
      m.remove(); document.removeEventListener('mousedown', off, true);
      if (k === 'def') setFabPos(null, '入口ボタンを元の位置に戻しました');
      else setFabPos({ side: k[0], fy: k[1] === 't' ? (FAB_M + 60) / innerHeight : (innerHeight - bh - FAB_M - 8) / innerHeight });
    });
  });
  addEventListener('resize', () => placeFab());
  placeFab();
  // PikPak の左メニューは読み込みのあとに出てくるので、既定の位置のときはしばらく置き直す
  { let n = 0; const tm = setInterval(() => { if (fabSaved() || ++n > 20) { clearInterval(tm); return; } if (!fabDrag) placeFab(); }, 1000); }
  // ---------- 端でスクロール：マウスを一覧の下（上）の端へ持っていくと、ゆっくりスクロール（上のバーのボタンで オン／オフ） ----------
  const LS_EDGE = 'ppdup:edgescroll:v1';
  const edgeOn = () => { try { return localStorage.getItem(LS_EDGE) === '1'; } catch (e) { return false; } };
  function setEdge(on) { try { localStorage.setItem(LS_EDGE, on ? '1' : '0'); } catch (e) { /* 無視 */ } const b = root.querySelector('[data-r=edgebtn]'); if (b) b.classList.toggle('on', on); if (document.getElementById('pd-set')) renderSettings(); }
  { const b = root.querySelector('[data-r=edgebtn]'); if (b) b.classList.toggle('on', edgeOn()); }
  let edgeSc = null, edgeV = 0, edgeRaf = 0;
  const EDGE_Z = 70; // 端から何 px で動き始めるか
  const edgeTick = () => { edgeRaf = 0; if (!edgeSc || !edgeV) return; edgeSc.scrollTop += edgeV; edgeRaf = requestAnimationFrame(edgeTick); };
  const edgeStop = () => { edgeV = 0; edgeSc = null; if (edgeRaf) cancelAnimationFrame(edgeRaf); edgeRaf = 0; };
  document.addEventListener('mousemove', (e) => {
    if (!edgeOn()) { if (edgeV) edgeStop(); return; }
    const t = e.target;
    // 下の帯・ボタン・入力欄・プレーヤーの上では動かさない（押したいものに届かなくなるため）
    if (!t || !t.closest || t.closest('.st-bar,.sv-dock,.lk-ft,.sl-bar,.lk-hd,.lb-tabs,.kit-tabs,button,input,select,textarea,video,.qp-ui,.lb-pv,#pd-ql,#pd-player')) { edgeStop(); return; }
    const sc = t.closest('#ppdup [data-r=main], #pd-lib .lk-list');
    if (!sc || sc.scrollHeight <= sc.clientHeight + 2) { edgeStop(); return; }
    const r = sc.getBoundingClientRect();
    // 画面の下にある帯（下の実行ボタンの帯など）の分は、端の位置から外す
    let bottom = r.bottom; const bar = sc.querySelector(':scope > .st-bar, :scope .sv-dock'); if (bar) { const br = bar.getBoundingClientRect(); if (br.top < bottom && br.bottom >= bottom - 4) bottom = br.top; }
    const dB = bottom - e.clientY, dT = e.clientY - r.top;
    let v = 0;
    if (dB >= 0 && dB < EDGE_Z) v = Math.ceil((1 - dB / EDGE_Z) * 8);
    else if (dT >= 0 && dT < EDGE_Z * 0.6) v = -Math.ceil((1 - dT / (EDGE_Z * 0.6)) * 8);
    edgeSc = v ? sc : null; edgeV = v;
    if (v && !edgeRaf) edgeRaf = requestAnimationFrame(edgeTick);
  }, { passive: true });
  document.addEventListener('mouseleave', edgeStop);
  window.addEventListener('blur', edgeStop);
  // ---------- 起動時に全画面で開く・画面ごとの URL（#dd/…）：戻る・再読み込み・ブックマークで同じ画面へ ----------
  const LS_AUTO = 'ppdup:autostart:v1';
  const autoStart = () => { try { return localStorage.getItem(LS_AUTO) === '1'; } catch (e) { return false; } };
  let ddApplying = false;
  function ddState() {
    if (!root.classList.contains('on')) return '';
    if (libSt) return 'lib/' + libSt.tab;
    if (view === 'tree') return 'tree/' + (hasScan() ? (tree.base || '') : (tree.base || ''));
    return (mode === 'single' ? 'task/' : 'step/') + (view || 'scan');
  }
  function ddFromUrl() { const m = /#dd\/(.*)$/.exec(location.hash); return m ? decodeURIComponent(m[1]) : null; }
  function ddSync() {
    if (ddApplying) return;
    const s = ddState(), cur = ddFromUrl() || '';
    if (s === cur) return;
    const base = location.pathname + location.search;
    // PikPak の画面（Vue Router）が持っている履歴の情報はそのまま引き継ぐ
    try { history.pushState(history.state, '', s ? base + '#dd/' + s.split('/').map(encodeURIComponent).join('/') : base); } catch (e) { /* 無視 */ }
  }
  function ddKick() { clearTimeout(ddKick.t); ddKick.t = setTimeout(ddSync, 30); }
  function ddApply(s) {
    ddApplying = true;
    try {
      if (!s) { if (root.classList.contains('on')) { if (libSt) closeLib(); root.classList.remove('on'); } return; }
      if (!sessionValid() || busy) return;
      const i = s.indexOf('/'), k = i < 0 ? s : s.slice(0, i), v = i < 0 ? '' : s.slice(i + 1);
      if (k === 'lib') { if (!root.classList.contains('on')) openFlow(); if (!libSt || libSt.tab !== v) openLib(v); return; }
      if (libSt) closeLib();
      if (k === 'tree') {
        mode = 'single'; root.classList.add('single'); showRoot(); updateLogBadge();
        if (v && v !== tree.base) { tree.base = v; saveTree(); }
        if (view !== 'tree') openTree(); else if (hasScan()) setBase(v);
      } else if (k === 'task') openTask(v || 'scan');
      else { openFlow(); if (hasScan() && v && view !== v) setView(v); }
    } finally { ddApplying = false; if (s && autoStart() && root.classList.contains('on') && winMode !== 'full') setWin('full'); }
  }
  addEventListener('popstate', () => { const s = ddFromUrl() || ''; if (s !== ddState()) ddApply(s); });
  function ddStart() {
    let resuming = false; try { const r = JSON.parse(sessionStorage.getItem(SS_RESUME) || 'null'); resuming = !!r && Date.now() - r.at < 2 * 60 * 1000; } catch (e) { resuming = false; }
    if (resuming) return;
    const s = ddFromUrl();
    const go = () => {
      if (!sessionValid()) return;
      if (s) ddApply(s); else if (autoStart() && /^\/drive/.test(location.pathname)) { ddApplying = true; try { openFlow(); } finally { ddApplying = false; } ddKick(); }
      else return;
      if (winMode !== 'full') setWin('full');
    };
    setTimeout(go, 300);
  }
  updateLogBadge();
  renderLangBtn(); applyTheme();
  if (LANG === 'en') document.querySelectorAll(UI_SEL).forEach(trNode);
  resumeAfterReload();
  ddStart();

  window.PPDup = { buildCleanPlan, buildSortPlan, buildRenamePlan, get folders() { return folders; }, scanApi, buildGroups, render, get files() { return files; }, set files(v) { files = v; } };
})();
