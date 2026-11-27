  // ---------- PikPak で同期（調査結果・判断・設定を PikPak のフォルダに置き、どの環境でも同じものを使う） ----------
  const SYNC_DIR = 'Dedupe（設定・同期）';
  const SYNC_FILE = 'dedupe-sync.json';
  const LS_SYNC = 'ppdup:sync:v1'; // { on, asked, pw, last, err }
  const LS_SYNCMETA = 'ppdup:syncmeta:v1'; // キー → { h: 中身の目印, at: 変わった時刻, clr: 消去した時刻 }
  const SYNC_KEYS = {
    'ppdup:seller:v1': 'seller', 'ppdup:winfo:v1': 'seller', 'ppdup:decision:v1': 'union', 'ppdup:unzippw:x': 'pwx',
    // 端末ごとに違ってよいもの（ウィンドウの位置・開き方など）は同期しない
    'ppdup:theme:v1': 'last', 'ppdup:lang:v1': 'last', 'ppdup:opt:junk:v1': 'last', 'ppdup:opt:cleanname:v1': 'last', 'ppdup:opt:seller:v1': 'last',
    'ppdup:player:v1': 'last', 'ppdup:player:q:v1': 'last', 'ppdup:rate:v1': 'last', 'ppdup:frames:v1': 'last', 'ppdup:seller:cfg:v1': 'last',
  };
  const syncCfg = () => { try { return { on: true, ...(JSON.parse(localStorage.getItem(LS_SYNC) || '{}') || {}) }; } catch (e) { return { on: true }; } };
  const saveSyncCfg = (p) => { try { localStorage.setItem(LS_SYNC, JSON.stringify({ ...syncCfg(), ...p })); } catch (e) { /* 無視 */ } };
  const syncKeys = () => Object.keys(SYNC_KEYS).filter((k) => k !== 'ppdup:unzippw:x' || syncCfg().pw);
  const strHash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return s.length + ':' + h; };
  function syncMeta() { return lsJson(LS_SYNCMETA, {}); }
  const saveSyncMeta = (m) => { lsSetJson(LS_SYNCMETA, m); };
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
    let ps = 0x40000; while (buf.length / ps > 0x200 && ps < 0x200000) ps <<= 1;
    const parts = []; for (let i = 0; i < buf.length || i === 0; i += ps) { parts.push(await sha1(buf.subarray(i, i + ps))); if (!buf.length) break; }
    const all = new Uint8Array(parts.length * 20); parts.forEach((p, i) => all.set(p, i * 20));
    return hexOf(await sha1(all)).toUpperCase();
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
      Object.entries(merged).forEach(([k, o]) => { if (!syncKeys().includes(k) || o.v == null) return; if (lsGet(k) !== o.v) { if (lsSet(k, o.v)) changed.push(k); } m[k] = { h: strHash(o.v), at: o.at || 0, clr: o.clr || 0 }; });
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
      // 変化がなかったとき（10 分ごとの確認など）はログに残さない（ログが読みにくくなるため）
      if (changed.length || !same) log('info', `PikPak で同期（${why}${changed.length ? `・取り込み ${changed.length} 項目` : ''}${same ? '' : '・保存'}）`);
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
    el.textContent = msg || (!c.asked || !c.on ? 'オフ（このブラウザにだけ保存）' : c.err ? '前回は失敗：' + c.err : c.last ? '最後に同期：' + fmtDate(c.last) : 'まだ同期していません');
  }
  // 初めて開いたときに一度だけ聞く
  function syncAsk() {
    if (syncCfg().asked || document.getElementById('pd-dlg') || !sessionValid()) return;
    const d = mkEl('pd-dlg');
    d.innerHTML = `<div class="box" style="width:min(520px,94vw)"><h3>調査結果と設定を PikPak で同期しますか？</h3>
      <div style="line-height:1.8">販売者の調査結果・重複の判断・設定を、PikPak のホームに作る「${esc(SYNC_DIR)}」フォルダに保存します。<b>ほかのブラウザやアプリでも、同じ PikPak にログインするだけで同じ内容を使えます。</b></div>
      <div class="note" style="margin:10px 0 16px">ログイン情報は保存しません。あとから「設定」→「情報」で切り替えられます。</div>
      <div class="acts"><button data-no>同期しない</button><button class="danger" data-yes style="background:#306fff;border-color:#306fff">同期する</button></div></div>`;
    if (LANG === 'en') d.querySelectorAll('*').forEach(trNode);
    d.querySelector('[data-no]').onclick = () => { saveSyncCfg({ asked: true, on: false }); d.remove(); };
    d.querySelector('[data-yes]').onclick = () => { saveSyncCfg({ asked: true, on: true }); d.remove(); syncNow('はじめて'); };
  }
  // 変わったら 20 秒ほど待ってまとめて保存。開いたときと 10 分おきに取り込み
  setInterval(() => {
    const c = syncCfg(); if (!c.on || !c.asked || syncBusy || scanning || !sessionValid()) return; // 読み込み中は同期しない（通信を読み込みに回す）
    if (syncTouch() || Date.now() - syncAt > 10 * 60e3) syncNow(Date.now() - syncAt > 10 * 60e3 ? '定期' : '変更');
  }, 20e3);
  // 追加したもののダウンロードが終わったかを 2 分おきに見て、不要ファイルを片付ける（読み込み中・操作中は休む）
  setInterval(() => { if (!busy && !scanning) addJunkSweep(); }, 120e3);
