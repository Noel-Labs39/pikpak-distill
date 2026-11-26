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
    lsSetJson(LS_PWX, await aesEnc(k, pwCache));
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
      d = mkEl('pd-unzip');
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
