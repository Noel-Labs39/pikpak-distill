  // ---------- ログイン切れの自動回復 ----------
  // 放置してPikPakのログイン情報の期限が切れたら、画面を再読み込みして更新させ、Distillを開き直す
  function reloadForSession(resume) {
    let prev = null; try { prev = JSON.parse(sessionStorage.getItem(SS_RESUME) || 'null'); } catch (e) { prev = null; }
    let g = null; g = lsJson('ppdup:reloadguard:v1', null);
    const recent = g && Date.now() - g.at < 10 * 60 * 1000 ? g.n : 0;
    const count = Math.max(prev && Date.now() - prev.at < 5 * 60 * 1000 ? (prev.count || 0) + 1 : 1, recent + 1);
    try { localStorage.setItem('ppdup:reloadguard:v1', JSON.stringify({ at: Date.now(), n: count })); } catch (e) { /* 無視 */ }
    if (count > 2) { // 再読み込みしても直らない場合はループさせない（10 分の間に 2 回まで）
      log('error', '再読み込み後もログイン情報が更新されません', JSON.stringify(resume));
      status('PikPakへの再ログインが必要な可能性があります。PikPakの画面で一度ログインし直してから、もう一度お試しください。');
      try { sessionStorage.removeItem(SS_RESUME); } catch (e) { /* 無視 */ }
      return;
    }
    log('warn', 'ログイン期限切れのため画面を再読み込み', JSON.stringify(resume));
    try { sessionStorage.setItem(SS_RESUME, JSON.stringify({ ...resume, at: Date.now(), count })); } catch (e) { /* 無視 */ }
    status('ログインの有効期限が切れていたため、PikPakの画面を再読み込みします…', 0.5);
    setTimeout(() => location.reload(), 1200);
  }
  // 操作の前にログインの有効期限を確認（切れていれば再読み込みして続きから）
  function ensureSession(action) {
    if (sessionValid() || readCred()) return true; // 期限が切れて見えても、まずは通信してみる（切れていれば PikPak の返事で分かる）
    reloadForSession({ view, action, mode });
    return false;
  }
  // 処理中のエラーがログイン切れなら再読み込み、それ以外はログに残して表示
  function handleErr(err, action, msg) {
    if (err && err.session) { reloadForSession({ view, action, mode }); return; }
    log('error', msg || (err && err.message), action);
    status(msg || ('エラー：' + (err && err.message)));
    updateLogBadge();
  }
  async function resumeAfterReload() {
    let r = null; try { r = JSON.parse(sessionStorage.getItem(SS_RESUME) || 'null'); } catch (e) { r = null; }
    if (!r || Date.now() - r.at > 2 * 60 * 1000) return;
    mode = r.mode || 'flow'; root.classList.toggle('single', mode === 'single');
    showRoot();
    setView(r.view || 'scan');
    status('画面を再読み込みしました。ログイン情報の更新を待っています…', 0.3);
    // 期限の直前に再読み込みした場合、PikPak画面は期限が切れるまで更新しないので、そこまで待つ（最大4分）
    const t0 = Date.now();
    const c0 = readCred();
    const limit = Math.min(4 * 60 * 1000, Math.max(30 * 1000, c0 && c0.expiresAt ? c0.expiresAt - t0 + 30 * 1000 : 0));
    while (!sessionValid() && !cap.auth && Date.now() - t0 < limit) {
      const left = Math.ceil((limit - (Date.now() - t0)) / 1000);
      status(`画面を再読み込みしました。ログイン情報の更新を待っています…（最大 あと ${left} 秒）`, (Date.now() - t0) / limit);
      await sleep(1000);
    }
    if (!sessionValid() && !readCred()) { reloadForSession(r); return; }
    try { sessionStorage.removeItem(SS_RESUME); } catch (e) { /* 無視 */ } // 再読み込みの回数は 10 分たつまで数え続ける（ここで 0 に戻すと、繰り返しを止められない）
    log('info', 'ログイン情報を更新して再開', JSON.stringify(r));
    if (r.action === 'scan') { runScan(); return; } // 読み込みは読み取りだけなので自動で再開
    setView(r.view || 'scan');
    status(r.action ? 'ログイン情報を更新しました。途中まで完了した分は保存済みです。もう一度ボタンを押すと続きから実行します。' : 'ログイン情報を更新しました。');
  }
  // 画面を開いたまま放置した場合も、期限切れを検知したら自動で再読み込み
  // （以前は 1 分ごとに期限を確かめて自動で再読み込みしていたが、PikPak が保存領域を更新しないと止まらなくなるためやめた）

