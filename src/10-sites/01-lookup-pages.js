(function () {
  'use strict';
  // 販売者を調べるときに開くページ（fd2ppv.cc・fc2cmadb.com）：「販売者を調べる」で開いた小さなウィンドウの中だけで動き、
  // 販売者と作品の情報（タイトル・女優・タグ・配信日・収録時間・モザイク）を読み取って PikPak の画面へ知らせる（ほかには何もしない）
  if (location.hostname === 'fd2ppv.cc' || location.hostname === 'fc2cmadb.com' || location.hostname === 'video.dmm.co.jp') {
    const hm = location.hash.match(/#ppdup-lookup(?:=([\w-]+))?/);
    // Safari は別サイトへ移るとウィンドウ名を消し、初回はサイト側の切り替えで # も消えることがあるため、
    // 開いた元（PikPak の画面）があれば動く（結果は PikPak の画面にしか送らない）
    if (!window.opener) return;
    const token = hm && hm[1] ? hm[1] : '';
    const num = location.hostname === 'video.dmm.co.jp' ? (new URLSearchParams(location.search).get('id') || '') : decodeURIComponent((location.pathname.match(/\/articles\/([^/?#]+)/) || [])[1] || '');
    const kw = new URLSearchParams(location.search).get('keyword') || '';
    const send = (d) => { try { window.opener.postMessage({ type: 'ppdup-seller', token, num, kw, ...d }, 'https://mypikpak.com'); } catch (e) { /* 無視 */ } };
    // Cloudflare の確認画面と、年齢確認などの「先に進む前に押す」画面（どちらも人が済ませる）
    const ageGate = () => { const t = (document.body ? document.body.innerText : '').slice(0, 3000); return /18\s*歳(以上|未満)|年齢(確認|認証)|成人向け|Age Verification|Are you (over )?18|I am 18|over 18|adults? only/i.test(t) && [...document.querySelectorAll('button,a,input[type=button],input[type=submit]')].some((b) => /はい|入る|同意|Enter|Yes|I am|Agree|Continue|OK/i.test(b.textContent || b.value || '')) && !document.querySelector('.work-meta-label,a[href*="/writers/"],a[href*="/channels/"]') && !/販売者|Sellers?\b/i.test(t); };
    const challenge = () => /しばらくお待ちください|Just a moment|Attention Required/i.test(document.title) || !!document.querySelector('#challenge-form,.cf-turnstile,[id^="cf-chl"]') || ageGate();
    // 年齢確認（人が「はい」を押す）は、開き直しても消えないので gate: 'age' を付けて知らせる（すぐに人に頼む）
    const gate = () => (ageGate() ? 'age' : 'cf');
    // 調べる側へ「このページで動き始めた」ことを知らせる（時間切れのとき、どこまで進んでいたかをログに残すため）
    send({ status: 'alive', stage: challenge() ? 'challenge' : num || kw ? 'article' : 'other', path: location.pathname.slice(0, 60) });
    // FANZA（video.dmm.co.jp）の作品ページ：表の「出演者・メーカー・レーベル・ジャンル・配信開始日・収録時間」を読む
    if (location.hostname === 'video.dmm.co.jp') {
      let n = 0;
      const tdOf = (re) => { const th = [...document.querySelectorAll('th')].find((t) => re.test(t.textContent.replace(/\s+/g, ''))); return th && th.parentElement ? th.parentElement.querySelector('td') : null; };
      const txOf = (re) => { const t = tdOf(re); return t ? t.textContent.replace(/\s+/g, ' ').trim().slice(0, 60) : ''; };
      const idIn = (h, key) => { try { return new URL(h, location.href).searchParams.get(key) || ''; } catch (e) { return ''; } };
      const tick = () => {
        if (tdOf(/^配信品番[:：]?$/)) {
          let title = ''; try { const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((x) => JSON.parse(x.textContent)).find((x) => x && x.name); title = ld ? ld.name : ''; } catch (e) { /* 無視 */ }
          if (!title) title = (document.querySelector('meta[property="og:title"]') || {}).content || '';
          const at = tdOf(/^出演者[:：]?$/), mk = tdOf(/^メーカー[:：]?$/), gn = tdOf(/^ジャンル[:：]?$/);
          const ma = mk && mk.querySelector('a');
          const info = {
            site: 'fanza', title: String(title).replace(/\s+/g, ' ').trim().slice(0, 300),
            actresses: at ? [...at.querySelectorAll('a')].map((x) => ({ name: x.textContent.replace(/\s+/g, ' ').trim().slice(0, 60), id: idIn(x.getAttribute('href'), 'actress') })).filter((x) => x.name && !/^[-－―]+$/.test(x.name)).slice(0, 20) : [],
            tags: gn ? [...gn.querySelectorAll('a')].map((x) => x.textContent.trim().replace(/^#/, '').slice(0, 40)).filter(Boolean).slice(0, 30) : [],
            date: txOf(/^配信開始日[:：]?$/) || txOf(/^商品発売日[:：]?$/), dur: txOf(/^収録時間[:：]?$/), mosaic: '',
            label: txOf(/^レーベル[:：]?$/), code: txOf(/^メーカー品番[:：]?$/),
          };
          send(ma ? { status: 'ok', name: ma.textContent.trim(), sid: 'fanza-maker-' + idIn(ma.getAttribute('href'), 'maker'), info } : { status: 'noseller', info });
          return;
        }
        if (challenge()) { send({ status: 'challenge', gate: gate() }); return; }
        if (/404|ページが見つかりません|お探しのページ|見つかりませんでした/.test(document.title + ' ' + (document.body ? document.body.innerText.slice(0, 400) : ''))) { send({ status: 'notfound' }); return; }
        if (++n > 60) { send({ status: 'notfound' }); return; }
        setTimeout(tick, 250);
      };
      tick();
      return;
    }
    if (challenge()) { send({ status: 'challenge', gate: gate() }); return; }
    const sidOf = (a, re) => decodeURIComponent((a.getAttribute('href').match(re) || [])[1] || '');
    if (location.hostname === 'fd2ppv.cc') {
      if (/(^|\s)404(\s|$)|Not Found/i.test(document.title)) { send({ status: 'notfound' }); return; }
      // 検索結果のページ：見つかった作品ページの一覧を返す
      if (/^\/articles\/?$/.test(location.pathname)) {
        const hits = [...new Set([...document.querySelectorAll('a[href^="/articles/"]')].map((a) => a.getAttribute('href').replace(/[?#].*$/, '').replace(/\/$/, '')).filter((h) => /^\/articles\/[^/]+$/.test(h)))].slice(0, 40);
        send({ status: 'search', hits }); return;
      }
      const label = (re) => [...document.querySelectorAll('.work-meta-label')].find((l) => re.test(l.textContent.trim()));
      const lv = (re) => { const l = label(re); return l && l.nextElementSibling ? l.nextElementSibling.textContent.replace(/\s+/g, ' ').trim().slice(0, 60) : ''; };
      const idOf = (h) => decodeURIComponent((String(h).match(/\/actresses\/([^/?#]+)/) || [])[1] || '');
      const info = {
        site: 'fd2ppv',
        title: ((document.querySelector('.work-brief') || {}).textContent || '').replace(/\s+/g, ' ').trim().slice(0, 300),
        actresses: [...new Map([...document.querySelectorAll('.artist-info-card a[href*="/actresses/"], a.artistUrl[href*="/actresses/"]')].map((x) => [idOf(x.getAttribute('href')), { name: x.textContent.replace(/\s+/g, ' ').trim().slice(0, 60), id: idOf(x.getAttribute('href')) }])).values()].filter((x) => x.name && x.id).slice(0, 20),
        tags: [...new Set([...document.querySelectorAll('a[href^="/tags/"]')].filter((x) => !/^\/tags\/actresses\//.test(x.getAttribute('href')) && /^#/.test(x.textContent.trim())).map((x) => x.textContent.trim().replace(/^#/, '').slice(0, 40)))].slice(0, 30),
        date: lv(/^(配信日|販売日|發行日|发行日|Release)/i), dur: lv(/^(収録時間|時長|时长|Duration)/i), mosaic: lv(/^(モザイク|Mosaic)/i),
      };
      const lab = label(/^(販売者|賣家|卖家|Sellers?|판매자)$/i);
      let a = lab && lab.nextElementSibling ? lab.nextElementSibling.querySelector('a[href*="/channels/"]') : null;
      if (!a && /^\d+$/.test(num)) { const all = [...document.querySelectorAll('.work-meta a[href*="/channels/"]')]; if (new Set(all.map((x) => x.getAttribute('href'))).size === 1) a = all[0]; }
      if (a) { const sid = sidOf(a, /\/channels\/([^/?#]+)/); send(sid ? { status: 'ok', name: a.textContent.trim(), sid, info } : { status: 'noseller', info }); return; }
      // FC2 以外（HEYZO・カリビアンコムなど）は「配信元」を販売者として扱う。ID は作品ページの名前の頭（例：carib-033118_001 → carib）
      const src = label(/^(配信元|發行商|发行商|Studios?|Publisher|Label|メーカー)$/i);
      const slug = (location.pathname.match(/\/articles\/([^/?#]+)/) || [])[1] || '';
      const pre = (slug.match(/^([a-z][a-z0-9]*?)-/i) || [])[1] || '';
      const sv = src && src.nextElementSibling ? src.nextElementSibling.textContent.replace(/\s+/g, ' ').trim() : '';
      send(sv && pre && !/^\d+$/.test(slug) ? { status: 'ok', name: sv, sid: pre.toLowerCase(), studio: true, info } : { status: 'noseller', info });
      return;
    }
    // fc2cmadb.com は画面を後から組み立てるので、販売者の欄が出るまで少し待つ
    // 裏のウィンドウでは時計の処理が遅らされることがあるので、回数ではなく経過時間で区切り、画面が変わったときにもすぐ読み直す
    const t0 = Date.now(); let tA = 0, tRow = 0, sent = false;
    const NAV = /^(bookmark-ranking|ranking|all|new|search|comments?)$/i; // 上のメニューの「販売者」などのリンクは販売者ではない
    const rowOf = (re) => [...document.querySelectorAll('tr')].find((tr) => { const th = tr.querySelector('th'); return th && re.test(th.textContent); });
    const tdOf = (re) => { const r = rowOf(re); return r ? r.querySelector('td') : null; };
    const txOf = (re) => { const t = tdOf(re); return t ? t.textContent.replace(/\s+/g, ' ').trim().slice(0, 60) : ''; };
    const cmInfo = () => {
      const at = tdOf(/女優|Actress/i), tg = tdOf(/タグ|Tags?/i);
      return {
        site: 'fc2cmadb',
        title: ((document.querySelector('h1') || {}).textContent || '').replace(/\s+/g, ' ').trim().slice(0, 300),
        actresses: at ? [...at.querySelectorAll('a[href*="/actresses/"]')].map((x) => ({ name: x.textContent.replace(/\s+/g, ' ').trim().slice(0, 60), id: decodeURIComponent((x.getAttribute('href').match(/\/actresses\/([^/?#]+)/) || [])[1] || '') })).filter((x) => x.name).slice(0, 20) : [],
        tags: tg ? [...tg.querySelectorAll('a')].map((x) => x.textContent.trim().slice(0, 40)).filter(Boolean).slice(0, 30) : [],
        date: txOf(/販売日|配信日/), dur: txOf(/収録時間/), mosaic: txOf(/モザイク/),
      };
    };
    const tick = () => {
      // 販売者が出ていれば、確認画面の判定より先に読み取る（ページ内の注意書きを年齢確認と見誤らないように）
      const row = [...document.querySelectorAll('tr')].find((tr) => { const th = tr.querySelector('th'); return th && /販売者|Seller/i.test(th.textContent); })
        || [...document.querySelectorAll('div,li,dl,p')].filter((el) => /^\s*(販売者|Sellers?)\s*[：:]?/i.test(el.textContent) && el.querySelector('a[href*="/writers/"]')).sort((x, y) => x.textContent.length - y.textContent.length)[0];
      let a = row ? row.querySelector('a[href*="/writers/"]') : null;
      if (a && (NAV.test(sidOf(a, /\/writers\/([^/?#]+)/)) || /^(販売者|Sellers?|賣家|卖家)$/i.test(a.textContent.trim()))) a = null;
      if (!a && challenge()) { send({ status: 'challenge', gate: gate() }); return; }
      if (!a && /^404|ページが見つかりません|Not Found/i.test(document.title)) { send({ status: 'notfound' }); return; }
      const fin = (d) => { if (sent) return; sent = true; try { mo.disconnect(); } catch (e) { /* 無視 */ } send(d); };
      if (a) {
        // 女優の欄は少し遅れて表示されるので、空のうちは少しだけ待つ（最大 2 秒）
        if (!tA) tA = Date.now();
        const at = tdOf(/女優|Actress/i); if (at && !at.textContent.trim() && Date.now() - tA < 2000) { setTimeout(tick, 250); return; }
        const sid = sidOf(a, /\/writers\/([^/?#]+)/); fin(sid ? { status: 'ok', name: a.textContent.trim(), sid, info: cmInfo() } : { status: 'noseller', info: cmInfo() }); return;
      }
      if (row && !tRow) tRow = Date.now();
      if (row && Date.now() - tRow > 2500) { fin({ status: 'noseller', info: cmInfo() }); return; }
      if (Date.now() - t0 > 12000) { fin({ status: document.querySelector(`a[href*="/articles/${num}"]`) ? 'noseller' : 'notfound' }); return; }
      setTimeout(tick, 250);
    };
    const mo = new MutationObserver(() => { if (!sent) tick(); });
    try { mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true }); } catch (e) { /* 無視 */ }
    tick();
    return;
  }
  if (window.__ppdupLoaded) return;
  window.__ppdupLoaded = true;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const UNIT = { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 };
  const fmt = (b) => (b >= UNIT.GB ? (b / UNIT.GB).toFixed(2) + ' GB' : b >= UNIT.MB / 10 ? (b / UNIT.MB).toFixed(1) + ' MB' : (b ? Math.max(1, Math.round(b / UNIT.KB)) : 0) + ' KB');
  // <common> ---------- 共通部品（設定の読み書き・日時と時間の表示） ----------
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
  const lsJson = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const lsSetJson = (k, v) => lsSet(k, JSON.stringify(v));
  // 日時：'md' 10/29 19:14（既定）・'ymd' 2026/10/29 19:14・'full' 秒まで・'d2' 26/10/29
  const DATE_FMT = { md: { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }, ymd: { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }, full: undefined };
  const fmtDate = (t, k = 'md') => { const v = typeof t === 'number' ? t : Date.parse(t); if (!v && v !== 0) return ''; const d = new Date(v); return k === 'd2' ? d.toLocaleDateString(loc(), { year: '2-digit', month: 'numeric', day: 'numeric' }) : d.toLocaleString(loc(), DATE_FMT[k]); };
  // 時間：fmtClock(秒) → 1:07:47 / 04:05、fmtDur(ミリ秒) → 4 分 05 秒
  const pad2 = (n) => String(n).padStart(2, '0');
  const fmtClock = (s) => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60; return (h ? h + ':' + pad2(m) : pad2(m)) + ':' + pad2(s % 60); };
  const fmtDur = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return s < 60 ? `${s} 秒` : `${Math.floor(s / 60)} 分 ${pad2(s % 60)} 秒`; };
  // SHA-1（中身の手がかり・マグネットの作成で使う）
  const sha1 = async (b) => new Uint8Array(await crypto.subtle.digest('SHA-1', b));
  const hexOf = (u8) => [...u8].map((x) => x.toString(16).padStart(2, '0')).join('');
  // 画面に出す枠（id を付けて body に置く）
  const mkEl = (id) => { const d = document.createElement('div'); d.id = id; document.body.appendChild(d); return d; };
  // </common>
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
  const VER = '4.22.2'; // @version と合わせて更新する

