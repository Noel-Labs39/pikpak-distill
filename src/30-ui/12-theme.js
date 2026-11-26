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

