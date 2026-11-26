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
  const blurOn = () => { return lsGet(LS_BLUR) === '1'; };
  const blurHov = () => { return lsGet(LS_BLURHOV) !== '0'; };
  function applyBlur() { document.documentElement.classList.toggle('pd-blur', blurOn()); document.documentElement.classList.toggle('pd-blurhov', blurOn() && blurHov()); }
  applyBlur();
  function applyTheme() {
    const p = themePref();
    document.documentElement.classList.toggle('pd-dark', p === 'dark' || (p === 'auto' && !!(darkMQ && darkMQ.matches)));
    renderThemeSeg();
  }
  function setTheme(t) { lsSet(LS_THEME, t); applyTheme(); if (document.getElementById('pd-set')) renderSettings(); }
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
  folders = lsJson(LS_FOLD, []);
  let files = [];
  files = lsJson(LS_SCAN, []);
  let meta = null;
  meta = lsJson(LS_META, null);
  let decision = {};
  decision = lsJson(LS_DECISION, {});
  const saveDecision = () => { lsSetJson(LS_DECISION, decision); };
  const saveAll = () => {
    try { localStorage.setItem(LS_FOLD, JSON.stringify(folders)); localStorage.setItem(LS_SCAN, JSON.stringify(files)); return true; }
    catch (e) {
      // 保存容量があふれたら、サムネイルのアドレス（大きい項目）を外して保存し直す（表示中の一覧はそのまま）
      try { localStorage.setItem(LS_SCAN, JSON.stringify(files.map(({ thumb: _t, ...x }) => x))); log('warn', `読み込み結果が大きいため、サムネイルのアドレスを外して保存しました（ファイル ${files.length} 件）`, 'scan'); return true; }
      catch (e2) { try { localStorage.removeItem(LS_SCAN); localStorage.removeItem(LS_FOLD); localStorage.removeItem(LS_META); } catch (e3) { /* 無視 */ } log('error', `読み込み結果を保存できませんでした（ブラウザの保存容量が足りません・ファイル ${files.length} 件）。次に開いたときは読み込み直しが必要です`, 'scan'); return false; }
    }
  };
  const stateOf = (f, idx) => decision[f.id] || (idx === 0 ? 'keep' : 'del');
  const hasScan = () => !!meta && (folders.length > 0 || files.length > 0); // このバージョンで読み込んだ結果だけを使う
  let view = 'scan';
  let splan = [], cplan = [], rplan = [];
  let busy = false;
  let mode = 'flow'; // flow＝1〜7の流れで表示／single＝1つの作業だけを表示
  let afterScan = null; // 読み込み後に開く作業
  let nplan = [];
  const nameOff = new Set(); // ファイル名の整理でチェックを外した項目
  const nameEnabled = () => { return lsGet(LS_OPT_NAME) !== '0'; };
  const junkEnabled = () => { return lsGet(LS_OPT_JUNK) !== '0'; };
  let jplan = [];
  const junkSel = new Map(); // 不要ファイルのチェック（変更したものだけ記録。未記録は del＝あり／review＝なし）
  const junkChecked = (p) => (junkSel.has(p.id) ? junkSel.get(p.id) : p.level === 'del');
  // ほかのステップで使うファイル（オンのときは「作品と関係ない」と判断したものを除く）
  const workFiles = () => (junkEnabled() ? (prepJunk(files, folders), files).filter((f) => { const j = junkInfo(f); return !j || j.level !== 'del'; }) : files);


