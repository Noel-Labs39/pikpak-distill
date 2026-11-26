  // ---------- 1. 読み込む ----------
  // 初めて読み込むときは、いきなり読み込まずに案内を出す（「次からは確認しない」で省略）
  const LS_SCANASK = 'ppdup:scanask:v1';
  const scanAsk = () => { return lsGet(LS_SCANASK) !== '0'; };
  // 読み込み済みのときのダッシュボード（大きな数字・作業カード・最近追加したもの・右下のボタン群）
  const DASH_TINT = { junk: ['#fdebe1', '#c2561a'], name: ['#f1ebff', '#6a3fd1'], sort: ['#e6f6ee', '#17703f'], ren: ['#fff4dc', '#8a5600'], dup: ['#e8efff', '#306fff'], clean: ['#e3f4f7', '#0f6f80'], seller: ['#fde8f0', '#b4235f'] };
  // ---- ホームの直下に新しく増えたフォルダの見守りと、そのフォルダだけの確認 ----
  const LS_TOPSEEN = 'ppdup:topseen:v1';
  let scopeTop = null; // 確認中のフォルダ（folders の項目）
  const topFolders = () => folders.filter((d) => d.parentId === 'root' && d.trail && d.trail.length === 2);
  function newTop() {
    const now = topFolders(); if (!now.length) return []; // ホームを読み込んでいないときは調べない
    const seen = lsJson(LS_TOPSEEN, null);
    if (!seen || !Array.isArray(seen.ids)) { lsSetJson(LS_TOPSEEN, { ids: now.map((d) => d.id) }); return []; } // 初めて読み込んだときは、いまあるものを「確認済み」にする
    const set = new Set(seen.ids);
    return now.filter((d) => !set.has(d.id));
  }
  const inScope = (path) => { if (!scopeTop) return true; const sp = scopeTop.path; return path === sp || String(path).startsWith(sp + '/'); };
  function newTopHtml() {
    const n = newTop(); if (!n.length) return '';
    const cnt = (d) => files.filter((f) => f.path === d.path || String(f.path).startsWith(d.path + '/')).length;
    return `<div class="sv-stale" data-newtop style="border-color:#f5a624"><b>ホームの直下に新しいフォルダが ${n.length} 件あります</b>${n.slice(0, 6).map((d) => `<div style="margin-top:6px;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span>📁 ${esc(d.name)}（ファイル ${cnt(d).toLocaleString()} 件）</span><button data-a="ntscope" data-id="${esc(d.id)}" data-v="dup">重複を確認</button><button data-a="ntscope" data-id="${esc(d.id)}" data-v="sort">仕分け・移動を確認</button></div>`).join('')}${n.length > 6 ? `<div class="note" style="margin-top:6px">ほか ${n.length - 6} 件</div>` : ''}<div style="margin-top:8px"><button data-a="ntseen" title="この知らせを消します（フォルダは何も変わりません）">確認済みにする</button></div></div>`;
  }
  function scopeBannerHtml() {
    return `<div class="sv-stale nt-scope" style="border-color:#306fff"><b>「${esc(scopeTop.name)}」の中を中心に確認しています</b><span class="note"> 重複は、ほかのフォルダにある同じファイルとも比べています</span> <button data-a="ntclear">すべてに戻す</button></div>`;
  }
  function renderDash(where, c, next) {
    const done = allDone(c);
    const when = fmtDate(meta.at);
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
      ${newTopHtml()}
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
    const where = scanWhereLabel();
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
    const when = meta ? fmtDate(meta.at, 'ymd') : '';
    const staleH = meta ? Math.floor((Date.now() - meta.at) / 3600000) : 0;
    const done = allDone(c);
    $('[data-r=main]').innerHTML = `<div class="sv">
      <section class="sv-hero${done ? ' ok' : ''}">
        <div class="sv-badge">${done ? '✓' : meta ? '↻' : '⇣'}</div>${!meta && !busy ? (() => {
          let st = null; try { st = (JSON.parse(localStorage.getItem(LS_SCANSTAT) || '{}') || {})[String(currentTrail().slice(-1)[0] || 'root')]; } catch (e) { st = null; }
          return `<div class="sv-main"><h2>まず PikPak の中身を読み込みます</h2><p>フォルダとファイルの一覧を読み込んで、重複や不要ファイルを見つけます。<b>読むだけで、ファイルは何も変更しません。</b></p>
            <ul class="sv-intro">${scopeHtml() ? `<li class="sv-scope-li">${scopeHtml()}</li>` : `<li>📁 読み込む場所：<b>${esc(where)}</b>（この中のすべて。ほかの場所は PikPak の画面でフォルダを開いてから）</li>`}<li>⏱ かかる時間：<b>${st ? `前回は ${fmtDur(st.ms)}（フォルダ ${st.folders}）` : '数十秒〜数分'}</b>（フォルダが多いほど長くなります）</li><li>💡 読み込み中も画面は見られます。途中で止めても大丈夫です</li></ul></div>
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
    wireScope($('[data-r=main]'));
    if (!busy) status(meta ? '読み込み済みです。カードから作業を選べます（操作したら再スキャンで最新にできます）。' : 'まずは「スキャン開始」を押してください。');
  }
  // 読み込みの残り時間（目安）：同じ場所を前に読み込んだときのフォルダ数・時間と、今の速さから見積もる
  const LS_SCANSTAT = 'ppdup:scanstat:v1';
  function scanEta(trail) {
    const key = String(trail[trail.length - 1] || 'root');
    let all = {}; all = lsJson(LS_SCANSTAT, {});
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
        lsSetJson(LS_SCANSTAT, all);
      },
    };
  }
  // 読み込む場所：「いま開いているフォルダ」か「ホーム全体」（前回選んだほうを覚える）
  const LS_SCOPE = 'ppdup:scanscope:v1', SS_SCANCP = 'ppdup:scancp:v1';
  const scopeHome = () => lsGet(LS_SCOPE) === 'home';
  const hereId = () => String(currentTrail().slice(-1)[0] || 'root');
  function hereLabel() {
    const c = crumbs().map((x) => x.name).filter(Boolean).join(' › ');
    if (c) return c;
    const id = hereId(); if (id === 'root') return 'ホーム';
    const d = folders.find((x) => x.id === id);
    if (d && d.isRoot && meta && meta.where) return meta.where;
    return d && d.path ? 'ホーム' + d.path.replace(/\//g, ' › ') : 'いま開いているフォルダ';
  }
  const scanWhereLabel = () => (hereId() === 'root' || scopeHome() ? 'ホーム' : hereLabel());
  // 開いているフォルダがホーム以外のときだけ、読み込む場所を選べるようにする
  const scopeHtml = () => hereId() === 'root' ? '' : `<div class="sv-scope" role="radiogroup" aria-label="読み込む場所"><span>📁 読み込む場所：</span><label><input type="radio" name="pdscope" value="here"${scopeHome() ? '' : ' checked'}> <span>このフォルダだけ（<b>${esc(hereLabel())}</b>）</span></label><label><input type="radio" name="pdscope" value="home"${scopeHome() ? ' checked' : ''}> <span><b>ホーム全体</b></span></label></div>`;
  const wireScope = (el) => el.querySelectorAll('input[name=pdscope]').forEach((r) => { r.onchange = () => { if (r.checked) lsSet(LS_SCOPE, r.value); }; });
  // フォルダの場所を「ホーム › A › B」の形で調べる（表示用。たどれないところで止める）
  async function folderPathLabel(d) {
    const names = [d.name]; let pid = d.parent_id, n = 0;
    try { while (pid && n++ < 12) { const p = await apiGet(pid); names.unshift(p.name); pid = p.parent_id; } } catch (e) { if (e.session) throw e; }
    return ['ホーム', ...names].join(' › ');
  }
  let scanning = false;
  async function runScan(o = {}) {
    rsHide();
    if (busy) return;
    if (!ensureSession('scan')) return;
    busy = true; scanning = true; renderNav(); renderScan();
    status('読み込み中…', 0);
    let trail = currentTrail(), where = '';
    try {
      const here = trail[trail.length - 1];
      if (here === 'root' || scopeHome() || o.home) { trail = ['root']; where = 'ホーム'; }
      else {
        // 開いていたフォルダが消えた・移動した（まとめた・ゴミ箱へ移したなど）ときは、ホームを読み込む
        //   ※ 削除したフォルダには「認証コードが無効です」が返ることがあるため、それも「見つからない」として扱う（ログイン切れにしない）
        let chk; try { chk = await api('/files/' + here, { raw: true, probe: true }); } catch (e) { if (!e.captcha) throw e; chk = { ok: false, status: e.status, why: e.message }; }
        if (!chk.ok || (chk.data && (chk.data.trashed || (chk.data.kind && chk.data.kind !== 'drive#folder')))) {
          trail = ['root']; where = 'ホーム';
          status('開いていたフォルダが見つからないため、ホームを読み込みます');
          log('warn', `開いていたフォルダが見つからないため、ホームを読み込みました（${chk.ok ? 'ゴミ箱の中' : (chk.why || 'HTTP ' + chk.status)}・URL の最後「${here}」・ページ ${location.pathname}）`, 'scan');
        } else where = crumbs().map((c) => c.name).filter(Boolean).join(' › ') || (await folderPathLabel(chk.data));
      }
      const key = String(trail[trail.length - 1]);
      // ログイン切れで中断した読み込みがあれば続きから（15 分以内・同じ場所）
      let cp = null; try { cp = JSON.parse(sessionStorage.getItem(SS_SCANCP) || 'null'); } catch (e) { cp = null; }
      try { sessionStorage.removeItem(SS_SCANCP); } catch (e) { /* 無視 */ }
      const resume = cp && cp.key === key && Date.now() - cp.at < 15 * 60e3 ? cp.st : null;
      if (resume) log('info', `ログイン切れの前に読んだ続きから読み込みます（フォルダ ${resume.done} まで読み済み）`, where);
      const eta = scanEta(trail);
      let r;
      try { r = await scanApi(trail, { resume, rootName: where.split(' › ').pop(), onProgress: (d, total, n) => { const e = eta.tick(d, total); status(`読み込み中（${where}）… フォルダ ${d} / ${e.expectedLabel} ／ ファイル ${n} 件`, e.frac, e.text); } }); }
      catch (e) {
        if (e.session && e.resumeState) { try { sessionStorage.setItem(SS_SCANCP, JSON.stringify({ key, at: Date.now(), st: e.resumeState })); } catch (e2) { log('warn', '途中までの読み込み結果を保存できませんでした（再読み込み後は最初から読みます）', 'scan'); } }
        throw e;
      }
      busy = false; scanning = false;
      // 中断したときは、途中までの結果で前回の結果を上書きしない
      if (r.stopped) { renderNav(); setView('scan'); status(meta ? '読み込みを中断しました。前回の読み込み結果をそのまま使います。' : '読み込みを中断しました。'); log('info', '読み込みを中断（前回の結果はそのまま）', where); return; }
      eta.done(r.folders.length, r.files.length);
      const prev = meta;
      files = r.files; folders = r.folders;
      const saved = saveAll();
      meta = { at: Date.now(), where, nfo: folders.length, nfi: files.length };
      if (saved) lsSetJson(LS_META, meta);
      const skip = r.skipped.length ? `・読めなかったフォルダ ${r.skipped.length}（ログに場所があります）` : '';
      r.skipped.slice(0, 50).forEach((x) => log('warn', '読めなかったフォルダを飛ばしました：' + x.msg, x.path));
      // 同じ場所なのに前回より大きく減ったときは知らせる（読む場所の勘違い・読み込みの不具合に気づけるように）
      const drop = prev && prev.where === where && prev.nfi >= 50 && files.length < prev.nfi * 0.5 ? `　⚠ 前回（ファイル ${prev.nfi} 件）より大きく減っています。場所が合っているか確かめてください。` : '';
      const head = `読み込み完了（${where}）：フォルダ ${folders.length} ／ ファイル ${files.length} 件${skip}`;
      if (afterScan) { const v = afterScan; afterScan = null; setView(v); status(head + drop); }
      else { setView('scan'); status(head + (drop || '。次のステップを選んでください。')); }
      log(drop ? 'warn' : 'info', `読み込み完了：フォルダ ${folders.length} ／ ファイル ${files.length}${skip}${drop ? `（前回 ${prev.nfi} 件から大きく減少）` : ''}`, where);
    } catch (err) { busy = false; scanning = false; renderNav(); renderScan(); handleErr(err, 'scan', '読み込みに失敗しました：' + err.message); }
  }

