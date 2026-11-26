  // ---------- エラーログ（このブラウザ内に最新300件まで保存） ----------
  function log(level, msg, ctx) {
    try {
      const a = JSON.parse(localStorage.getItem(LS_LOG) || '[]');
      a.push({ t: Date.now(), level, msg: String(msg || '').slice(0, 500), ctx: ctx ? String(ctx).slice(0, 300) : '', v: VER });
      while (a.length > 300) a.shift();
      localStorage.setItem(LS_LOG, JSON.stringify(a));
    } catch (e) { /* 保存できなくても処理は続ける */ }
  }
  const readLog = () => { return lsJson(LS_LOG, []); };
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
  const currentFolderId = () => { if (isPem()) return (crumbs().pop() || {}).id || 'root'; const last = location.pathname.split('/').filter(Boolean).pop(); return !last || !/^[A-Za-z0-9_-]{16,}$/.test(last) ? 'root' : last; };  // recent・starred・trash など、フォルダ以外のページはホーム
  const currentTrail = () => (isPem() && crumbs().length ? crumbs().map((c) => c.id) : [currentFolderId()]);

