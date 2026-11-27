  // ---------- 大きい記録の置き場所（IndexedDB・src/core/store.mjs） ----------
  // 読み込み結果・作品の情報・販売者の記録・再生の記録・ログを IndexedDB に置く。起動のはじめに全部を読み、そのあとはすぐに読み書きできる
  // （ここで待つので、この先の部品はすべて読み終えてから動く。使えないときは今までどおり localStorage）
  bigKV = PPCore.createBigStore({
    keys: [LS_SCAN, LS_FOLD, LS_LOG, 'ppdup:winfo:v1', 'ppdup:seller:v1', 'ppdup:media:v1'],
    log: (lv, m) => setTimeout(() => { try { log(lv, m); } catch (e) { /* 無視 */ } }, 0),
  });
  await bigKV.ready();
  // 閉じる・隠れるときは、まとめて待っている書き込みをすぐ送る
  window.addEventListener('pagehide', () => { bigKV.flush(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) bigKV.flush(); });

