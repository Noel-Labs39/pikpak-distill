  // ---------- 設定（右からのパネル：表示・再生・整理・情報） ----------
  const SET_TABS = [['all', 'すべて'], ['view', '表示'], ['play', '再生'], ['org', '整理'], ['info', '情報']];
  let setTab = 'all';
  function openSettings(tab) {
    setTab = tab || 'all';
    let d = document.getElementById('pd-set');
    if (!d) {
      d = mkEl('pd-set');
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
        <div class="row"><span><b>テーマ</b></span><span class="seg">${[['light', 'ライト'], ['dark', 'ダーク'], ['auto', '自動']].map(([k, l]) => `<button data-s="theme" data-v="${k}" class="${th === k ? 'on' : ''}">${l}</button>`).join('')}</span></div>
        <div class="row col"><b>開き方</b>${[['full', '全画面（おすすめ）', 'PikPak の画面を Dedupe に切り替えて、広い画面で使います'], ['pop', 'ポップアップ', 'PikPak の画面の上に重ねて開きます。動かしたり大きさを変えたりでき、後ろの PikPak もそのまま使えます']].map(([k, l, d]) => `<label><input type="radio" name="pdopen" data-s="openmode" value="${k}"${(root.classList.contains('on') ? winMode : openPref()) === k ? ' checked' : ''}> <span><b>${l}</b><small style="display:block">${d}</small></span></label>`).join('')}</div>
        <div class="row"><span><b>表示言語</b></span><select data-s="lang"><option value="auto"${lp === 'auto' ? ' selected' : ''}>自動（ブラウザ）</option><option value="ja" data-raw${lp === 'ja' ? ' selected' : ''}>日本語</option><option value="en" data-raw${lp === 'en' ? ' selected' : ''}>English</option></select></div>
        <div class="row"><span><b>フォルダ一覧の表示</b></span><select data-s="tview"><option value="list"${tree.view === 'list' ? ' selected' : ''}>☰ リスト</option><option value="thumb"${tree.view === 'thumb' ? ' selected' : ''}>▤ サムネイル</option><option value="tile"${tree.view === 'tile' ? ' selected' : ''}>▦ タイル</option></select></div>
        <label class="row"><span><b>サムネイルをぼかす</b><small>人に画面を見られても分からないよう、サムネイル・プレビュー・コマをぼかします（このブラウザだけの設定）</small></span><input type="checkbox" data-s="blur"${blurOn() ? ' checked' : ''}></label>
        <label class="row"><span><b>マウスを乗せたら、はっきり表示</b><small>「サムネイルをぼかす」がオンのとき、マウスを乗せた（スマホは押している）間だけぼかしを外します</small></span><input type="checkbox" data-s="blurhov"${blurHov() ? ' checked' : ''}${blurOn() ? '' : ' disabled'}></label>
        <label class="row"><span><b>起動時に Dedupe を全画面で開く</b><small>PikPak を開いたら、最初から Dedupe の画面で使います（✕ で閉じれば PikPak の画面に戻ります）。開いている画面は URL に残るので、戻る・再読み込み・ブックマークで同じ画面に戻れます</small></span><input type="checkbox" data-s="autostart"${autoStart() ? ' checked' : ''}></label>
        <label class="row"><span><b>端でスクロール</b><small>一覧の下（上）の端にマウスを持っていくと、ゆっくりスクロールします</small></span><input type="checkbox" data-s="edge"${edgeOn() ? ' checked' : ''}></label>
        <div class="row"><span><b>入口ボタン（Dedupe）の位置</b><small>ボタンはドラッグで好きな場所へ動かせます（右クリックで置き場所を選べます）。既定は PikPak の左メニューの空き</small></span><button data-s="fabreset"${fabSaved() ? '' : ' disabled'}>元に戻す</button></div>
        <label class="row"><span><b>ホバーでサムネイル</b><small>マウスを乗せたときにサムネイルを大きく表示します</small></span><input type="checkbox" data-s="hover"${tree.hover !== false ? ' checked' : ''}></label>
        <div class="row"><span><b>フォルダ一覧の操作</b><small>${esc(helpTree)}</small></span></div>` : ''}
        ${sec('play') ? `<h3 data-sec="play">再生</h3>
        <div class="row col"><b>▶ 再生ボタン・ダブルクリックのとき</b>${Object.keys(MODES).map((k) => `<label><input type="radio" name="pdmode" data-s="mode" value="${k}"${p.mode === k ? ' checked' : ''}> ${MODES[k]}</label>`).join('')}</div>
        <div class="row col"><b>外部プレーヤーをすぐ開く操作</b><small>一覧の動画をこの回数クリックすると、上の設定に関係なく外部プレーヤー（オリジナル画質）で開きます。ふだんは簡易プレーヤーで見て、本編だけ外部で、という使い方向け。外部プレーヤーをいつも使うなら、上で「外部プレーヤーで再生」を選んでください</small>${Object.keys(XCLICK).map((k) => `<label><input type="radio" name="pdxclick" data-s="xclick" value="${k}"${xclick() === k ? ' checked' : ''}> ${XCLICK[k]}</label>`).join('')}</div>
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
    if (k === 'autostart') { lsSet(LS_AUTO, t.checked ? '1' : '0'); status(t.checked ? '次に PikPak を開いたときから、Dedupe を全画面で開きます' : '起動時には開かないようにしました'); return; }
    if (k === 'qp') { saveQpCfg({ [t.dataset.k]: qpVal(t.dataset.k, t.value) }); return; }
    if (k === 'lang') { setLang(t.value); return; }
    if (k === 'expg') { exportSel[t.value] = t.checked; return; }
    if (k === 'blur' || k === 'blurhov') { lsSet(k === 'blur' ? LS_BLUR : LS_BLURHOV, t.checked ? '1' : '0'); applyBlur(); renderSettings(); return; }
    if (k === 'openmode') { setOpenPref(t.value); if (root.classList.contains('on')) setWin(t.value); return; }
    if (k === 'tview') { tree.view = t.value; saveTree(); if (view === 'tree') treeView(t.value); return; }
    if (k === 'hover') { tree.hover = t.checked; saveTree(); hideHover(); return; }
    if (k === 'xclick') { savePlayPref({ ...playPref(), xclick: t.value }); status('外部プレーヤーをすぐ開く操作を「' + XCLICK[t.value] + '」にしました'); return; }
    if (k === 'mode' || k === 'ext') {
      const p = playPref();
      savePlayPref({ ...p, mode: k === 'mode' ? t.value : p.mode, ext: k === 'ext' ? t.value : p.ext });
      status('再生のしかたを「' + prefLabel() + '」にしました'); if (view === 'tree') renderTreeActs(); if (qlOpen) showQL();
      return;
    }
    if (k === 'seller') { lsSet(LS_OPT_SELLER, t.checked ? '1' : '0'); if (root.classList.contains('on') && !busy) setView(view); return; }
    if (k === 'scfg') {
      const c = sellerCfg(), key = t.dataset.k;
      const v = key === 'interval' ? +t.value : t.value.trim();
      if (key !== 'interval' && (!v || /[\/\\]/.test(v))) { t.value = c[key]; status('フォルダ名に / や \\ は使えません'); return; }
      c[key] = v; saveSellerCfg(c); if (root.classList.contains('on') && !busy && view === 'seller') setView('seller');
      return;
    }
    if (k === 'junk' || k === 'name') {
      lsSet(k === 'junk' ? LS_OPT_JUNK : LS_OPT_NAME, t.checked ? '1' : '0');
      log('info', (k === 'junk' ? '不要ファイルの除外を' : 'ファイル名の整理を') + (t.checked ? 'オン' : 'オフ') + 'に変更');
      if (root.classList.contains('on') && !busy) setView(view);
    }
  }
  // プレビュー（クイックルック）の中で再生する
  let qlRun = 0;
  async function qlPlay(id, o2 = {}) {
    const myRun = qlRun;
    const d = document.getElementById('pd-ql'); if (!d) return;
    const box = d.querySelector('.ql-b'), f = fileById(id); if (!box || !f) return;
    if (!ensureSession('tree')) return;
    box.insertAdjacentHTML('beforeend', '<div class="pl-msg ql-wait">再生の準備中…</div>');
    // 画質の切り替えと解像度の表示（以前の「プレーヤー画面」の機能をプレビューにまとめた）
    const acts = d.querySelector('.pv-q');
    const P = playerCore(box, id, {
      slot: 'ql', name: f.name, qHost: acts, armed: o2.armed, poster: (treeRowsCache.find((x) => x.id === id) || {}).thumb || '',
      alive: () => document.body.contains(box) && treeCur === id && myRun === qlRun,
      qp: { ext: () => openExternal(id), close: () => closeQL(), ...qpSeq(treeRowsCache.filter(isVideoRow), id, (nid) => { treeSelect(nid, null); renderTree(); showQL(true); }) },
      onMeta: (v) => pvDim(d, v),
      noSource: '再生用リンクを取得できませんでした',
      unplayable: 'この画質（HLS）はこのブラウザの中では再生できません。別の画質か外部プレーヤーを選んでください。',
      fail: (x, why) => { box.insertAdjacentHTML('beforeend', `<div class="pl-msg pl-err">「${esc(x.label)}」は再生できませんでした${why ? `（${esc(why)}）` : ''}。下の「画質」で別の画質を試せます。</div>`); log('warn', `再生できない画質：${x.label}`, f.name); },
    });
    try {
      if (!(await P.ready)) return;
      d.classList.add('playing');
      log('info', 'プレビューで再生：' + f.name);
    } catch (err) { if (err.session) { closeQL(); handleErr(err, 'tree'); return; } box.insertAdjacentHTML('beforeend', `<div class="pl-msg pl-err">${esc(err.message)}</div>`); }
  }
  let playRun = 0;
