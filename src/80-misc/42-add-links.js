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
        const h = await sha1(b.slice(st, en));
        // info の中の name（表示用）
        try { const t = new TextDecoder().decode(b.slice(st, en)); const m = t.match(/4:name(\d+):/); if (m) { const p = t.indexOf(m[0]) + m[0].length; name = t.slice(p, p + +m[1]); } } catch (e) { /* 無視 */ }
        const hex = hexOf(h);
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
        if (addMode(it) === 'part' && it.files.some((f) => f.on && !f.gcid)) { it.files.forEach((f) => { f.on = true; }); it.note = 'キャッシュがないファイルがあるため、すべて保存します（不要と判定したファイルは、ダウンロードが終わったら自動でゴミ箱へ移します）'; }
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
      d = mkEl('pd-add');
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
          // すべて保存になったときも、不要と判定したファイル（広告など）は覚えておき、ダウンロードが終わったらゴミ箱へ移す
          const junk = (it.files || []).filter((f) => f.junk).map((f) => ({ p: ((f.dir ? f.dir + '/' : '') + f.name).toLowerCase(), s: +f.size || 0, r: f.junk }));
          addLogPush({ mode: 'all', name: it.name || it.rootName || it.url, task: (res && res.task && res.task.id) || '', fid: (res && res.file && res.file.id) || '', url: it.url, size: it.files ? it.files.reduce((a, f) => a + (+f.size || 0), 0) : 0, ...(junk.length ? { junk } : {}) });
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
