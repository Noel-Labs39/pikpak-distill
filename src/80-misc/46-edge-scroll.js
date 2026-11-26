  // ---------- 端でスクロール：マウスを一覧の下（上）の端へ持っていくと、ゆっくりスクロール（上のバーのボタンで オン／オフ） ----------
  const LS_EDGE = 'ppdup:edgescroll:v1';
  const edgeOn = () => { return lsGet(LS_EDGE) === '1'; };
  function setEdge(on) { lsSet(LS_EDGE, on ? '1' : '0'); const b = root.querySelector('[data-r=edgebtn]'); if (b) b.classList.toggle('on', on); if (document.getElementById('pd-set')) renderSettings(); }
  { const b = root.querySelector('[data-r=edgebtn]'); if (b) b.classList.toggle('on', edgeOn()); }
  let edgeSc = null, edgeV = 0, edgeRaf = 0;
  const EDGE_Z = 70; // 端から何 px で動き始めるか
  const edgeTick = () => { edgeRaf = 0; if (!edgeSc || !edgeV) return; edgeSc.scrollTop += edgeV; edgeRaf = requestAnimationFrame(edgeTick); };
  const edgeStop = () => { edgeV = 0; edgeSc = null; if (edgeRaf) cancelAnimationFrame(edgeRaf); edgeRaf = 0; };
  document.addEventListener('mousemove', (e) => {
    if (!edgeOn()) { if (edgeV) edgeStop(); return; }
    const t = e.target;
    // 下の帯・ボタン・入力欄・プレーヤーの上では動かさない（押したいものに届かなくなるため）
    if (!t || !t.closest || t.closest('.st-bar,.sv-dock,.lk-ft,.sl-bar,.lk-hd,.lb-tabs,.kit-tabs,button,input,select,textarea,video,.qp-ui,.lb-pv,#pd-ql,#pd-player')) { edgeStop(); return; }
    const sc = t.closest('#ppdup [data-r=main], #pd-lib .lk-list');
    if (!sc || sc.scrollHeight <= sc.clientHeight + 2) { edgeStop(); return; }
    const r = sc.getBoundingClientRect();
    // 画面の下にある帯（下の実行ボタンの帯など）の分は、端の位置から外す
    let bottom = r.bottom; const bar = sc.querySelector(':scope > .st-bar, :scope .sv-dock'); if (bar) { const br = bar.getBoundingClientRect(); if (br.top < bottom && br.bottom >= bottom - 4) bottom = br.top; }
    const dB = bottom - e.clientY, dT = e.clientY - r.top;
    let v = 0;
    if (dB >= 0 && dB < EDGE_Z) v = Math.ceil((1 - dB / EDGE_Z) * 8);
    else if (dT >= 0 && dT < EDGE_Z * 0.6) v = -Math.ceil((1 - dT / (EDGE_Z * 0.6)) * 8);
    edgeSc = v ? sc : null; edgeV = v;
    if (v && !edgeRaf) edgeRaf = requestAnimationFrame(edgeTick);
  }, { passive: true });
  document.addEventListener('mouseleave', edgeStop);
  window.addEventListener('blur', edgeStop);
