  // ---------- 6. 重複を比べて削除 ----------
  const dupFail = new Map(); let dupTab = 'todo';
  function dupAllGroups() {
    const m = $('[data-a=mode]'), n = $('[data-a=nearonly]'), qq = $('[data-a=q]');
    let groups = buildGroups(workFiles(), m ? m.value : 'name');
    if (n && n.checked) groups = groups.filter((g) => g.near);
    groups = groups.concat(visLive());
    if (scopeTop) groups = groups.filter((g) => g.items.some((x) => inScope(x.path)));
    const q = qq ? qq.value.trim().toLowerCase() : '';
    if (q) groups = groups.filter((g) => g.items.some((x) => x.name.toLowerCase().includes(q)));
    return groups;
  }
  const dupCat = (g) => (g.items.some((f) => dupFail.has(f.id)) ? 'fail' : g.items.some((f, i) => stateOf(f, i) === 'del') ? 'todo' : 'keep');
  function visibleGroups() { const all = dupAllGroups(); if (dupTab !== 'all' && !all.some((g) => dupCat(g) === dupTab)) dupTab = 'all'; return dupTab === 'all' ? all : all.filter((g) => dupCat(g) === dupTab); }
  function dupTabsHtml() {
    const all = dupAllGroups(), n = (k) => (k === 'all' ? all.length : all.filter((g) => dupCat(g) === k).length);
    return `<div class="kit-tabs">${[['todo', '削除するものあり'], ['keep', '残すだけ'], ['fail', '失敗'], ['all', 'すべて']].filter(([k]) => k === 'todo' || k === 'all' || n(k)).map(([k, l]) => `<button class="kit-tab${dupTab === k ? ' on' : ''}${k === 'fail' ? ' bad' : ''}" data-dtab="${k}">${l}<i>${n(k)}</i></button>`).join('')}</div>`;
  }
  function visibleGroups0() {
    const m = $('[data-a=mode]'), n = $('[data-a=nearonly]'), qq = $('[data-a=q]');
    let groups = buildGroups(workFiles(), m ? m.value : 'name');
    if (n && n.checked) groups = groups.filter((g) => g.near);
    const q = qq ? qq.value.trim().toLowerCase() : '';
    if (q) groups = groups.filter((g) => g.items.some((x) => x.name.toLowerCase().includes(q)));
    return groups;
  }
  // ---- 見た目で探す重複 ----
  //   長さが近くて品番が違う動画を、5か所の画面から作った小さな指紋（64ビット×5）で比べる。
  //   見つかった組は「チェックなし」で出すだけで、自動では削除しない
  let visGroups = [];
  const visHash = new Map(); // id → [指紋 or ''] ×5
  const VIS_AT = [0.1, 0.3, 0.5, 0.7, 0.9];
  const visLive = () => { const ids = new Set(files.map((f) => f.id)); return visGroups.map((g) => ({ ...g, items: g.items.filter((f) => ids.has(f.id)) })).filter((g) => g.items.length > 1); };
  function dHashOf(c) {
    const t = document.createElement('canvas'); t.width = 9; t.height = 8;
    const g = t.getContext('2d'); g.drawImage(c, 0, 0, 9, 8);
    const d = g.getImageData(0, 0, 9, 8).data, y = [];
    for (let i = 0; i < 72; i++) y.push(d[i * 4] * 0.3 + d[i * 4 + 1] * 0.59 + d[i * 4 + 2] * 0.11);
    const mean = y.reduce((a, b) => a + b, 0) / 72, sd = Math.sqrt(y.reduce((a, b) => a + (b - mean) * (b - mean), 0) / 72);
    if (sd < 6) return ''; // ほぼ一色の画面（暗転など）は比べない
    let o = ''; for (let r = 0; r < 8; r++) for (let x = 0; x < 8; x++) o += y[r * 9 + x] > y[r * 9 + x + 1] ? '1' : '0';
    return o;
  }
  function visDist(a, b) {
    let sum = 0, n = 0;
    for (let k = 0; k < 5; k++) { if (!a[k] || !b[k]) continue; let h = 0; for (let i = 0; i < 64; i++) if (a[k][i] !== b[k][i]) h++; sum += h; n++; }
    return n >= 3 ? sum / n : 99;
  }
  const VIS_MAX = 10; // 64ビット中の差の平均がこれ以下なら「近い」
  function visClusters() {
    const dn = new Map(folders.map((d) => [d.id, d.name]));
    const idKey = (f) => keyOf(f.name, 'id', dn.get(f.parentId));
    const vids = workFiles().filter((f) => VIDEO_EXT.has(extOf(f.name)) && metaGet(f).dur > 0).sort((a, b) => metaGet(a).dur - metaGet(b).dur);
    const out = []; let cur = [];
    vids.forEach((f) => { const d = metaGet(f).dur; if (cur.length && d - metaGet(cur[cur.length - 1]).dur > Math.max(2, d * 0.015)) { out.push(cur); cur = []; } cur.push(f); });
    out.push(cur);
    return out.filter((c) => c.length > 1 && new Set(c.map(idKey)).size > 1).map((c) => c.slice(0, 60));
  }
  const visHooks = { hash: (f) => visHashOf(f) }; // テストで差し替えられるようにしている
  async function visHashOf(f) {
    const S = await loadSources(f.id), x = lightSrc(S); if (!x) throw new Error('再生用リンクを取得できませんでした');
    const gr = makeGrabber(x, S);
    try {
      await gr.ready; const dur = gr.duration || metaGet(f).dur, out = [];
      for (const p of VIS_AT) { if (window.__ppdupStop) break; try { out.push(dHashOf(await gr.grab(dur * p, 48))); } catch (e) { out.push(''); } }
      while (out.length < 5) out.push('');
      return out;
    } finally { gr.close(); }
  }
  async function runVisual() {
    if (busy) return;
    const clusters = visClusters(), todo = [...new Map(clusters.flat().map((f) => [f.id, f])).values()].filter((f) => !visHash.has(f.id));
    const all = clusters.reduce((a, c) => a + c.length, 0);
    if (!all) { status('見た目で比べる候補（長さが近くて品番が違う動画）はありません。'); return; }
    if (todo.length && !window.confirm(`長さが近くて品番が違う動画 ${all} 件を、画面の見た目で比べます。\n\n・${todo.length} 件の動画から画面を 5 か所ずつ読み込みます（目安：約 ${Math.max(1, Math.round(todo.length * 6 / 2 / 60))} 分）\n・見つかった組は「チェックなし」で表示します。自動では削除しません\n\n始めますか？`)) return;
    if (!ensureSession('dup')) return;
    busy = true; window.__ppdupStop = false; render(); renderNav();
    let i = 0, fail = 0, done = 0;
    try {
      const worker = async () => {
        while (i < todo.length && !window.__ppdupStop) {
          const f = todo[i++];
          try { visHash.set(f.id, await visHooks.hash(f)); } catch (e) { if (e && e.session) throw e; fail++; visHash.set(f.id, []); }
          done++; status(`見た目で比べています… ${done} / ${todo.length}`);
        }
      };
      await Promise.all([worker(), worker()]);
      const groups = [];
      clusters.forEach((c) => {
        const par = c.map((_, k) => k), find = (k) => (par[k] === k ? k : (par[k] = find(par[k])));
        for (let a = 0; a < c.length; a++) for (let b = a + 1; b < c.length; b++) { const ha = visHash.get(c[a].id), hb = visHash.get(c[b].id); if (ha && hb && ha.length && hb.length && visDist(ha, hb) <= VIS_MAX) par[find(a)] = find(b); }
        const m = new Map(); c.forEach((f, k) => { const r = find(k); if (!m.has(r)) m.set(r, []); m.get(r).push(f); });
        m.forEach((v) => { if (v.length > 1) { v.sort((a, b) => b.size - a.size); v.forEach((f) => { if (!decision[f.id]) decision[f.id] = 'keep'; }); groups.push({ key: 'vis:' + v[0].id, items: v, near: false, visual: true }); } });
      });
      saveDecision();
      const known = new Set(buildGroups(workFiles(), 'name').flatMap((g) => g.items.map((f) => f.id)));
      visGroups = groups.filter((g) => !g.items.every((f) => known.has(f.id)));
      log('info', `見た目で探す：${all} 件を比べ、似ている組が ${visGroups.length} 組見つかりました${fail ? `（${fail} 件は画面を読み込めませんでした）` : ''}${window.__ppdupStop ? '（途中で中断）' : ''}`);
    } catch (e) { handleErr(e, 'dup', '見た目での比較を停止しました：' + e.message); }
    finally { busy = false; window.__ppdupStop = false; }
    dupTab = 'all'; render(); renderNav();
    if (!visGroups.length) status('見た目が近い組は見つかりませんでした。');
  }
  const delList = (groups) => groups.flatMap((g) => g.items.filter((f, i) => stateOf(f, i) === 'del'));
  function renderDup() { renderDup0(); if (!metaBusy) fetchMeta(dupAllGroups().flatMap((g) => g.items)).then((ch) => { if (ch && view === 'dup') renderDup(); }).catch((e) => { if (e && e.session) handleErr(e, 'dup'); }); const m = $('[data-r=main]'); if (!m) return; if (dupAllGroups().length && !m.querySelector('.kit-tabs')) m.insertAdjacentHTML('afterbegin', dupTabsHtml()); if (!m.querySelector('.kit-ex')) m.insertAdjacentHTML('afterbegin', kitExHtml('dup')); if (scopeTop && !m.querySelector('.nt-scope')) m.insertAdjacentHTML('afterbegin', scopeBannerHtml()); m.querySelectorAll('.pd-row[data-id]').forEach((r) => { const e = dupFail.get(r.dataset.id); if (e && !r.querySelector('.kit-err')) { r.classList.add('fail', 'kit-row'); const i = r.querySelector('.pd-info'); if (i) i.insertAdjacentHTML('beforeend', `<div class="kit-err">失敗：${esc(e)}</div>`); } }); }
  function renderDup0() {
    const groups = visibleGroups();
    const main = $('[data-r=main]');
    if (!groups.length) { const qq = $('[data-a=q]'), nn = $('[data-a=nearonly]'); main.innerHTML = (qq && qq.value) || (nn && nn.checked) ? '<div class="empty">絞り込みに該当する重複はありません。</div>' : doneCard(); if (!busy) status('重複はありません。'); renderActs(); return; }
    main.innerHTML = groups.map((g) => {
      const max = g.items[0].size || 1;
      const rows = g.items.map((f, i) => {
        const st = stateOf(f, i);
        const diff = i === 0 ? '' : '最大比 -' + (((max - f.size) / max) * 100).toFixed(1) + '%';
        return `<div class="pd-row ${st}" data-id="${esc(f.id)}">
          <label class="pd-chk" title="チェック＝削除する"><input type="checkbox" data-chk="${esc(f.id)}"${st === 'del' ? ' checked' : ''}></label>
          <div class="pd-th">${f.thumb ? `<img loading="lazy" referrerpolicy="no-referrer" src="${esc(f.thumb)}" alt="">` : ''}</div>
          <div class="pd-info"><div class="pd-name">${esc(f.name)}${i === 0 ? ' <span class="pd-tag" style="background:#d7f0dd;color:#14612f">最大＝高画質の候補</span>' : ''}</div>
            <div class="pd-path">${esc(f.path)}</div>
            <div class="pd-bar"><i style="width:${Math.max(2, (f.size / max) * 100).toFixed(1)}%"></i></div></div>
          <div class="pd-sz"><b>${fmt(f.size)}</b><div class="note">${diff}</div>${(() => { const m = metaGet(f); return m.dur || m.res ? `<div class="note">${[m.res, m.dur ? fmtClock(m.dur) : ''].filter(Boolean).join(' ・ ')}</div>` : ''; })()}</div>
          <div class="pd-act"><button data-s="open">場所を開く</button></div></div>`;
      }).join('');
      const hs = g.items.map((f) => metaGet(f).hash);
      const same = hs.every(Boolean) && new Set(hs).size === 1, part = hs.every(Boolean) && new Set(hs).size < hs.length && !same;
      return `<section class="pd-g"><div class="pd-gh"><span>${esc(g.items[0].name)}</span><span class="note">${g.items.length}件</span>${g.visual ? '<span class="pd-tag" style="background:#fff1d6;color:#8a5a00" title="ハッシュ値は違いますが、画面の見た目が近い動画です。必ず中身を見て確かめてください">見た目が近い</span>' : ''}${same ? '<span class="pd-tag" style="background:#d7f0dd;color:#14612f" title="ハッシュ値が同じ＝中身がまったく同じファイル">中身が同じ</span>' : part ? '<span class="pd-tag" style="background:#d7f0dd;color:#14612f" title="この組の中に、中身がまったく同じファイルがあります">中身が同じものあり</span>' : hs.every(Boolean) ? '<span class="pd-tag" title="ハッシュ値が違う＝中身は別のファイル（画質・編集が違うなど）">中身は別</span>' : ''}${g.near ? '<span class="pd-tag">サイズが近い組あり</span>' : ''}<span class="sp"></span><button data-cmpg="${esc(g.key)}" title="この組の 2 本を左右に並べて、いっしょに再生して比べる">▶ 見比べ</button><button data-frg="${esc(g.key)}" title="この組の 2 本を、同じ位置のコマで並べて比べる">▦ コマで比べる</button><button data-g="${esc(g.key)}">この組のチェックを削除</button></div>${rows}</section>`;
    }).join('') + nextButton();
    renderActs();
    if (!busy) { const dl = delList(groups); status(`重複 ${groups.length} 組 ／ チェック（削除する） ${dl.length} 件・${fmt(dl.reduce((a, f) => a + f.size, 0))}　※各組の一番大きいファイルは最初からチェックなし（残す）になっています`); }
  }
  // 削除確認（Enhancement Master と同じく「ゴミ箱を経由しない」チェック付き）
  // skipped: 全件にチェックが入っている組 [{name, items}]。「強制削除」にチェックしたときだけ、それらも削除する
  function askDelete(list, skipped) {
    return new Promise((resolve) => {
      const d = mkEl('pd-dlg');
      const sItems = skipped.flatMap((g) => g.items || []);
      const sum = (a) => a.reduce((x, f) => x + f.size, 0);
      const title = (force) => (force ? list.length + sItems.length : list.length) + ' 件を削除します（' + fmt(sum(list) + (force ? sum(sItems) : 0)) + '）';
      d.innerHTML = `<div class="box"><h3 data-title>${title(false)}</h3>
        <div class="note">対象はチェックの入ったファイルだけです。通常はPikPakのゴミ箱へ移動し、あとから戻せます。</div>
        ${skipped.length ? `<div class="note" style="color:#d93025;margin-top:8px">全件にチェックが入っている組 ${skipped.length} 組（${sItems.length} 件）は、組ごと消えてしまうため通常は対象外にしています（${esc(skipped.slice(0, 3).map((g) => g.name).join(' / '))}${skipped.length > 3 ? ' …' : ''}）</div>
        <label class="hard" style="margin:10px 0 0"><input type="checkbox" data-force> 強制削除：全件にチェックが入っている組も、すべて削除する（広告ファイルなど）</label>` : ''}
        <label class="hard"><input type="checkbox" data-hard> ゴミ箱を経由せず完全に削除する（元に戻せません）</label>
        <div class="acts"><button data-no>キャンセル</button><button class="danger" data-yes${list.length ? '' : ' disabled'}>削除する</button></div></div>`;
      const fc = d.querySelector('[data-force]'), yes = d.querySelector('[data-yes]');
      if (fc) fc.onchange = () => { d.querySelector('[data-title]').textContent = title(fc.checked); yes.disabled = !list.length && !fc.checked; yes.textContent = fc.checked ? '強制削除する' : '削除する'; };
      const done = (v) => { d.remove(); resolve(v); };
      d.querySelector('[data-no]').onclick = () => done(null);
      yes.onclick = () => { if (yes.disabled) return; done({ hard: d.querySelector('[data-hard]').checked, force: !!(fc && fc.checked) }); };
    });
  }
  async function runDelete(groups) {
    const skipped = [], list = [];
    groups.forEach((g) => {
      const del = g.items.filter((f, i) => stateOf(f, i) === 'del');
      if (!del.length) return;
      if (del.length === g.items.length) { skipped.push({ name: g.items[0].name, items: del }); return; }
      list.push(...del);
    });
    if (!list.length && !skipped.length) { status('チェックの入ったファイルがありません'); return; }
    if (!ensureSession('dup')) return;
    const ans = await askDelete(list, skipped);
    if (!ans) return;
    const targets = ans.force ? list.concat(skipped.flatMap((g) => g.items)) : list;
    busy = true; renderNav(); window.__ppdupStop = false;
    try {
      const { n, fails } = await deleteEach(targets, ans.hard, (d, t, e) => status(`削除しています… ${d} / ${t}`, d / t, e));
      targets.forEach((f) => dupFail.delete(f.id)); fails.forEach((m, id) => dupFail.set(id, m));
      dupTab = fails.size ? 'fail' : 'todo';
      busy = false; render(); renderNav(); status(`${n} 件を${ans.hard ? '完全に削除' : 'ゴミ箱へ移動'}しました${ans.force ? `（強制削除 ${skipped.length} 組を含む）` : ''}${fails.size ? `・失敗 ${fails.size} 件（「失敗」タブに理由があります）` : ''}。`); log('info', `削除 ${n} 件（${ans.hard ? '完全削除' : 'ゴミ箱'}${ans.force ? '・強制削除 ' + skipped.length + ' 組' : ''}）`); refreshView();
    } catch (err) { busy = false; render(); renderNav(); handleErr(err, 'dup', '削除を停止しました：' + err.message); }
  }

