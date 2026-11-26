  // ---------- 操作 ----------
  const CONFIRM = { name: 'チェックの入ったファイルの名前を整えます。よろしいですか？', sort: '表示中の作品をすべて仕分け（フォルダ作成・移動）します。よろしいですか？', ren: '表示中のフォルダ名をすべて変更します。よろしいですか？', clean: 'チェックの入った空フォルダをゴミ箱へ移し、入れ子のフォルダをまとめ、(1) を外します。よろしいですか？' , seller: 'チェックの入った作品フォルダを「販売者別」の中へ移動します（削除はしません）。よろしいですか？' };
  const RUN = { name: runName, sort: runSort, ren: runRen, clean: runClean, seller: runSeller };
  root.addEventListener('click', async (e) => {
    const t = e.target.closest('button'); if (!t || t.disabled) return;
    const a = t.dataset.a;
    if (t.dataset.step) { if (!busy) setView(t.dataset.step); return; }
    if (t.dataset.s === 'open') {
      const id = t.closest('.pd-row').dataset.id;
      const f = files.find((x) => x.id === id); const r = getRouter();
      if (f && isPem()) { try { await navigator.clipboard.writeText(f.path); } catch (err) { /* 無視 */ } status('場所：' + f.path + '（パスをコピーしました）'); return; }
      if (f && r) { root.classList.remove('on'); r.push('/all/' + f.parentId); }
      return;
    }
    if (t.dataset.cmpg !== undefined) { const g = visibleGroups().find((x) => x.key === t.dataset.cmpg); if (g) { const del = g.items.find((f, i) => stateOf(f, i) === 'del'); openCompare([g.items[0].id, (del || g.items[1]).id]); } return; }
    if (t.dataset.frg !== undefined) { const g = visibleGroups().find((x) => x.key === t.dataset.frg); if (g) { const del = g.items.find((f, i) => stateOf(f, i) === 'del'); openFrames([g.items[0].id, (del || g.items[1]).id]); } return; }
    if (t.dataset.g !== undefined) { if (busy) return; const g = visibleGroups().find((x) => x.key === t.dataset.g); if (g) runDelete([g]); return; }
    if (a === 'close' || a === 'mini') { root.classList.remove('on'); ddKick(); return; }
    if (a === 'tofull') { setWin('full'); return; }
    if (a === 'fullnext') { setOpenPref('full'); setWin('full'); status('次からは全画面で開きます（設定の「表示」→「開き方」で戻せます）'); return; }
    if (a === 'banclose') { lsSet(LS_POPBAN, '0'); applyWin(); return; }
    if (a === 'log') { showLog(); return; }
    if (a === 'settings') { openSettings(); return; }
    if (a === 'setinfo') { openSettings('info'); return; }
    if (a === 'changelog') { window.open('https://github.com/Noel-Labs39/pikpak-distill/blob/main/CHANGELOG.md', '_blank', 'noopener'); return; }
    if (a === 'navtoggle') { toggleNav(); return; }
    if (a === 'edgescroll') { setEdge(!edgeOn()); status(edgeOn() ? '端でスクロールをオンにしました（一覧の下・上の端にマウスを持っていくと、ゆっくりスクロールします）' : '端でスクロールをオフにしました'); return; }
    if (a === 'acct') { openAcct(t); return; }
    if (a === 'bell') { const u = updRead(); if (u.latest && verNewer(u.latest, VER) && u.skip !== u.latest) { const el = $('[data-r=upd]'); if (el) { el.hidden = false; el.scrollIntoView({ block: 'nearest' }); } } showLog(); return; }
    if (a === 'dockx') { const dk = t.closest('.sv-dock'); if (dk) dk.classList.toggle('open'); return; }
    if (a === 'slookup') { runSellerLookup(); return; }
    if (a === 'sinfo') { runSellerLookup(t.dataset.v); return; }
    if (a === 'sdiff') { showSellerDiffs(); return; }
    if (t.dataset.sfilter) { sellerFilter = t.dataset.sfilter; render(); return; }
    if (a === 'sshowunk') { sellerFilter = selPlan.some((p) => p.kind === 'unknown') ? 'unknown' : 'review'; render(); const tb = $('[data-r=main] .sl-tabs'); if (tb) tb.scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
    if (a === 'sack') { sellerAck = true; sellerFilter = 'all'; render(); return; }
    if (a === 'sunack') { sellerAck = false; render(); return; }
    if (t.dataset.ssave) { if (!busy) saveRowSeller(t.dataset.ssave); return; }
    if (t.dataset.sext) { if (document.getElementById('pd-ext')) { closeExt(); return; } openExt(t, t.dataset.sext); return; }
    if (t.dataset.sredo) { if (busy) return; const p = selPlan.find((x) => x.id === t.dataset.sredo); if (p) { p.keys.forEach((k) => { if (sellerDb[k.key] && sellerDb[k.key].src !== 'manual') delete sellerDb[k.key]; }); saveSellerDb(); sellerSel.delete(p.id); sellerAck = false; log('info', `販売者を調べ直す対象に戻した：${p.name}`); setView('seller'); } return; }
    if (t.dataset.sedit) { if (!busy) editSeller(t.dataset.sedit); return; }
    if (a === 'theme') { setTheme(t.dataset.v); return; }
    if (a === 'lang') { if (!busy) setLang(LANG === 'en' ? 'ja' : 'en'); return; }
    if (a === 'tree') { if (!busy) openTree(); return; }
    if (a === 'lib') { openLib(t.dataset.v); return; }
    if (a === 'updskip') { const u = updRead(); u.skip = u.latest; updWrite(u); renderUpdate(); return; }
    if (a === 'updget') { status('インストール画面で「更新」（または「再インストール」）を押したあと、この画面を再読み込みすると新しいバージョンになります'); return; }
    if (a === 'texpand' || a === 'tcollapse') { if (!busy) treeAll(a === 'texpand'); return; }
    if (a === 'tview') { if (!busy) treeView(t.dataset.v); return; }
    if (a === 'tqs') { tree.qs = t.dataset.v; saveTree(); syncTqs(); if (view === 'tree') renderTree(); return; }
    if (a === 'toflow') { if (!busy) { if (view === 'tree') view = 'scan'; openFlow(); } return; }
    if (a === 'rescan') { if (!busy) askRescan(); return; }
    if (a === 'rsgo') { rsHide(); if (!busy) { afterScan = view === 'scan' ? null : view; if (libSt) closeLib(); runScan(); } return; }
    if (a === 'rslater') { const el = $('[data-r=rsban]'); if (el && el.dataset.why === 'stale') { try { sessionStorage.setItem(SS_RSLATER, new Date().toDateString()); } catch (err) { /* 無視 */ } } rsHide(); return; }
    if (a === 'addlink') { if (!busy || view !== 'tree') { const c = view === 'tree' ? treeBase() : currentFolderId(); openAdd(isHomeId(c) ? 'DL' : c); } return; }
    if (a === 'skick') { if (lookupSt.kick) { log('info', '販売者の調査：確認のあとの続きを手動で再開'); lookupSt.kick(); } return; }
    if (a === 'spause') { lookupSt.paused = !lookupSt.paused; refreshSellerChrome(); status(lookupSt.paused ? '販売者の調査を一時停止しています（「再開」で続けます）' : '販売者の調査を再開しました'); return; }
    if (a === 'stop') { window.__ppdupStop = true; status('中断しています…（いまの処理が終わったら止まります）'); return; }
    if (busy) return;
    if (a === 'ntseen') { lsSetJson(LS_TOPSEEN, { ids: topFolders().map((d) => d.id) }); render(); return; }
    if (a === 'ntclear') { scopeTop = null; render(); return; }
    if (a === 'ntscope') { const d = folders.find((x) => x.id === t.dataset.id); if (!d) return; scopeTop = d; log('info', `ホームの新しいフォルダ「${d.name}」を確認：${t.dataset.v === 'dup' ? '重複' : '仕分け・移動'}`); setView(t.dataset.v); return; }
    if (a === 'scan') return runScan();
    if (a === 'onepass') return runOnePass();
    if (a === 'oplookup') { selPlan = buildSellerPlan(folders); return runSellerLookup(); }
    if (a === 'resclose') { delete lastResult[view]; const r = t.closest('.st-res'); if (r) r.remove(); return; }
    if (a === 'visual') return runVisual();
    if (a === 'delall') return Promise.resolve(runDelete(visibleGroups())).then(() => captureResult('dup'));
    if (a === 'junkdel') return Promise.resolve(runJunk()).then(() => captureResult('junk'));
    if (a === 'jall' || a === 'jnone') { const lv = t.dataset.lv; jplan.filter((p) => p.level === lv).forEach((p) => junkSel.set(p.id, a === 'jall')); render(); renderActs(); return; }
    const m = /^(name|sort|ren|clean|seller)(1|all)$/.exec(a || '');
    if (m) { const v0 = view; if (m[2] === '1') Promise.resolve(RUN[m[1]](true)).then(() => captureResult(v0)); else if (KIT_VERB[m[1]] || confirm(tr(CONFIRM[m[1]]))) Promise.resolve(RUN[m[1]](false)).then(() => captureResult(v0)); return; }
    if (t.dataset.opcmp) { const g = smartDup().review.find((x) => x.key === t.dataset.opcmp); if (g) openCompare(g.items.slice(0, 2).map((f) => f.id)); return; }
    if (t.dataset.ktab) { kitTab[view] = t.dataset.ktab; render(); return; }
    if (t.dataset.dtab) { dupTab = t.dataset.dtab; render(); return; }
    if (t.dataset.kopen) { const id = t.dataset.kopen; if (!busy) { openTree(); revealInTree(id); } return; }
    if (a === 'kreplan') { if (!busy) { kitFail[view] && kitFail[view].clear(); setView(view); status('計画を作り直しました（PikPak の最新の内容にするには「読み込み直す」）'); } return; }
    if (a === 'csv') {
      const rows = [['判定', 'ファイル名', '場所', 'サイズ(MB)']];
      visibleGroups().forEach((g) => g.items.forEach((f, i) => rows.push([stateOf(f, i) === 'keep' ? '残す' : '削除する', f.name, f.path, (f.size / UNIT.MB).toFixed(2)])));
      // Excel で開いたときに、= + - @ で始まるファイル名が数式として動かないよう、先頭に ' を付ける
      const cell = (c) => { let v = String(c); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };
      const csv = '﻿' + rows.map((r) => r.map(cell).join(',')).join('\n');
      const aEl = document.createElement('a');
      aEl.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); aEl.download = 'pikpak_duplicates.csv'; aEl.click();
    }
  });
  root.addEventListener('change', (e) => {
    const id = e.target.dataset && e.target.dataset.chk;
    if (id) { decision[id] = e.target.checked ? 'del' : 'keep'; saveDecision(); const row = e.target.closest('.pd-row'); if (row) { row.classList.toggle('del', e.target.checked); row.classList.toggle('keep', !e.target.checked); } const dl = delList(visibleGroups()); status(`チェック（削除する） ${dl.length} 件・${fmt(dl.reduce((a, f) => a + f.size, 0))}`); return; }
    if (e.target.dataset && e.target.dataset.a === 'thover') { tree.hover = e.target.checked; saveTree(); hideHover(); return; }
    if (e.target.dataset && e.target.dataset.a === 'junkopt') { lsSet(LS_OPT_JUNK, e.target.checked ? '1' : '0'); log('info', '不要ファイルの除外を' + (e.target.checked ? 'オン' : 'オフ') + 'に変更'); setView(view); return; }
    const jid = e.target.dataset && e.target.dataset.jchk;
    if (jid) { junkSel.set(jid, e.target.checked); const row = e.target.closest('.pd-row'); if (row) row.classList.toggle('del', e.target.checked); renderActs(); return; }
    if (e.target.dataset && e.target.dataset.a === 'nameopt') { lsSet(LS_OPT_NAME, e.target.checked ? '1' : '0'); log('info', 'ファイル名の整理を' + (e.target.checked ? 'オン' : 'オフ') + 'に変更'); render(); renderNav(); return; }
    if (e.target.dataset && e.target.dataset.a === 'scanask') { lsSet(LS_SCANASK, e.target.checked ? '0' : '1'); return; }
    const sid2 = e.target.dataset && e.target.dataset.schk;
    if (sid2) { sellerSel.set(sid2, e.target.checked); const row = e.target.closest('.pd-row'); if (row) row.classList.toggle('sel', e.target.checked); refreshSellerChrome(); return; }
    const sg = e.target.dataset && e.target.dataset.sgrp;
    if (sg) { selPlan.filter((p) => p.kind !== 'pending' && (sg === 'k:fix' ? !!p.fix : sg === 'k:unknown' ? p.kind === 'unknown' : sg === 'k:review' ? p.kind === 'review' : p.kind === 'seller' && !p.fix && 's:' + p.seller.sid === sg)).forEach((p) => sellerSel.set(p.id, e.target.checked)); render(); renderActs(); return; }
    if (e.target.dataset && e.target.dataset.a === 'selleropt') { lsSet(LS_OPT_SELLER, e.target.checked ? '1' : '0'); log('info', '販売者ごとの仕分けを' + (e.target.checked ? 'オン' : 'オフ') + 'に変更'); setView(view); return; }
    const kid = e.target.dataset && e.target.dataset.kchk;
    if (kid && KIT_VERB[view]) { kitSetOff(view, kid, !e.target.checked); const row = e.target.closest('.pd-row'); const it = kitItems(view).find((x) => x.id === kid); if (row) row.classList.toggle(it && it.danger ? 'del' : 'sel', e.target.checked); renderActs(); return; }
    const kg = e.target.dataset && e.target.dataset.kgrp;
    if (kg !== undefined && KIT_VERB[view]) { kitItems(view).filter((it) => it.grp === kg && (it.st === 'todo' || it.st === 'fail')).forEach((it) => { kitSetOff(view, it.id, !e.target.checked); }); render(); return; }
    const ko = e.target.dataset && e.target.dataset.kopt;
    if (ko) { if (ko === 'junk') { lsSet(LS_OPT_JUNK, e.target.checked ? '1' : '0'); } else if (ko === 'name') { lsSet(LS_OPT_NAME, e.target.checked ? '1' : '0'); } else { lsSet(KIT_OPT[ko], e.target.checked ? '1' : '0'); } log('info', `${STEPS.find((x) => x.v === ko).t}を${e.target.checked ? 'オン' : 'オフ'}`); if (!busy) setView(ko); return; }
    const nid = e.target.dataset && e.target.dataset.nchk;
    if (nid) { if (e.target.checked) nameOff.delete(nid); else nameOff.add(nid); const row = e.target.closest('.pd-row'); if (row) row.classList.toggle('sel', e.target.checked); return; }
    const cid = e.target.dataset && e.target.dataset.cchk;
    if (cid) { if (e.target.checked) cleanOff.delete(cid); else cleanOff.add(cid); const row = e.target.closest('.pd-row'); const it = cplan.find((x) => x.id === cid); if (row) row.classList.toggle(it && it.op === 'rename' ? 'sel' : 'del', e.target.checked); return; }
    if (['mode', 'nearonly', 'renfilter'].includes(e.target.dataset.a)) render();
  });
  root.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches && e.target.matches('.sl-in input')) { e.preventDefault(); const b = e.target.closest('.sl-row'); if (b && !busy) saveRowSeller(b.dataset.srow); } });
  root.addEventListener('click', (e) => { const r = e.target.closest('[data-sr]'); if (r && view === 'tree' && !busy) revealInTree(r.dataset.sr); });
  const syncTqs = () => root.querySelectorAll('[data-a=tqs]').forEach((b) => b.classList.toggle('on', (tree.qs || 'here') === b.dataset.v));
  syncTqs();
  root.addEventListener('input', (e) => { if (e.target.dataset.kq !== undefined && kitQ[view] !== undefined) { kitQ[view] = e.target.value; clearTimeout(kitQ.t); kitQ.t = setTimeout(() => { render(); const q = $('[data-kq]'); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } }, 250); return; } if (e.target.dataset.a === 'q') render(); if (e.target.dataset.a === 'tq') { tree.q = e.target.value; renderTree(); } });
