  // ---------- 2. 不要ファイルを削除 ----------
  function renderJunk() { renderKit('junk'); }
  async function runJunk() {
    const list = jplan.filter(junkChecked).map((p) => files.find((f) => f.id === p.id)).filter(Boolean);
    if (!list.length) { status('チェックの入ったファイルがありません'); return; }
    if (!ensureSession('junk')) return;
    const ans = await askDelete(list, []);
    if (!ans) return;
    busy = true; renderNav(); renderActs(); window.__ppdupStop = false;
    try {
      const { n, fails } = await deleteEach(list, ans.hard, (d, t, e) => status(`削除しています… ${d} / ${t}`, d / t, e));
      list.forEach((f) => { if (!fails.has(f.id)) { junkSel.delete(f.id); kitFail.junk.delete(f.id); } });
      fails.forEach((m, id) => kitFail.junk.set(id, m));
      kitTab.junk = fails.size ? 'fail' : 'todo';
      busy = false; setView('junk'); status(`${n} 件を${ans.hard ? '完全に削除' : 'ゴミ箱へ移動'}しました${fails.size ? `・失敗 ${fails.size} 件（「失敗」タブに理由があります。チェックしたまま押すと、もう一度試します）` : ''}。`); log('info', `不要ファイルの削除 ${n} 件（${ans.hard ? '完全削除' : 'ゴミ箱'}）`); refreshView();
    } catch (err) { busy = false; setView('junk'); handleErr(err, 'junk', '削除を停止しました：' + err.message); }
  }

