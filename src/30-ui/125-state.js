  // ---------- 共有している状態（読み込み結果・画面の状態・各ステップの計画） ----------
  //   多くの部品から読み書きされる変数はここにまとめる（一覧は CLAUDE.md の「共有している状態」）
  //   files / folders / meta … 読み込み結果（scan / folders は IndexedDB・scanmeta は localStorage。保存は saveAll）
  //   decision               … 重複で「残す／消す」を選んだ記録（ppdup:decision）
  //   view / mode            … いま開いている画面（scan・dup・tree など）／1〜8 の流れで見せるか 1 つだけか
  //   busy / afterScan       … 何か実行中か（ほかの操作を止める）／読み込みのあとに開く画面
  //   splan・cplan・rplan・nplan・jplan … 各ステップの計画（作品ごとの仕分け・仕上げ・フォルダ名・ファイル名・不要ファイル）
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
    if (lsSet(LS_FOLD, JSON.stringify(folders)) && lsSet(LS_SCAN, JSON.stringify(files))) return true;
    // 保存容量があふれたら（IndexedDB が使えず、ブラウザの保存領域を使っているとき）、サムネイルのアドレス（大きい項目）を外して保存し直す（表示中の一覧はそのまま）
    if (lsSet(LS_SCAN, JSON.stringify(files.map(({ thumb: _t, ...x }) => x)))) { log('warn', `読み込み結果が大きいため、サムネイルのアドレスを外して保存しました（ファイル ${files.length} 件）`, 'scan'); return true; }
    lsDel(LS_SCAN); lsDel(LS_FOLD); lsDel(LS_META);
    log('error', `読み込み結果を保存できませんでした（ブラウザの保存容量が足りません・ファイル ${files.length} 件）。次に開いたときは読み込み直しが必要です`, 'scan');
    return false;
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


