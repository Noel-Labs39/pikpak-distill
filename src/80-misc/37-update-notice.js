  // ---------- 新しいバージョンのお知らせ（12 時間に 1 回、GitHub の最新版の番号だけを確かめる） ----------
  const LS_UPD = 'ppdup:update:v1';
  const REPO_RAW = 'https://raw.githubusercontent.com/Noel-Labs39/pikpak-distill/main/pikpak-distill.user.js';
  const REPO_REL = 'https://github.com/Noel-Labs39/pikpak-distill/releases';
  const verNum = (v) => String(v || '').split('.').map((x) => +x || 0);
  const verNewer = (a, b) => { const x = verNum(a), y = verNum(b); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return false; };
  function updRead() { return lsJson(LS_UPD, {}); }
  function updWrite(o) { lsSetJson(LS_UPD, o); }
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
