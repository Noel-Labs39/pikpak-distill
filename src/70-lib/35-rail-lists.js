  // ---------- 左メニュー：ダウンロード中・最近追加したもの・再生した履歴・スター付き・ゴミ箱 ----------
  // ---- 追加したもの：Dedupe でリンクを追加したときの記録（このブラウザに保存）と、PikPak のダウンロードタスクを合わせて見せる ----
  const LS_ADDLOG = 'ppdup:addlog:v1';
  const addLogRead = () => { return lsJson(LS_ADDLOG, []); };
  const addLogWrite = (a) => { lsSetJson(LS_ADDLOG, a.slice(0, 300)); };
  const addLogPush = (r) => { const a = addLogRead(); a.unshift({ ...r, lid: 'L' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), at: Date.now() }); addLogWrite(a); };
  const LIB_TABS = [['dl', '追加したもの'], ['recent', '最近追加したもの'], ['cont', '続きを見る'], ['people', '出演者・販売者'], ['cand', '消す候補'], ['hist', '再生した履歴'], ['star', 'スター付き'], ['trash', 'ゴミ箱']];
  let libSt = null, libBadge = { dl: 0, trash: 0 };
  const encF = (o) => encodeURIComponent(JSON.stringify(o));
  const phaseTxt = { PHASE_TYPE_RUNNING: 'ダウンロード中', PHASE_TYPE_PENDING: '順番待ち', PHASE_TYPE_ERROR: '失敗', PHASE_TYPE_COMPLETE: '完了' };
