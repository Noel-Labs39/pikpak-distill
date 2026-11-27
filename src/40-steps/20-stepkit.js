  // ---------- 3〜5・7：共通の型（StepKit） ----------
  // どのステップも「見出し・タブ（実行する／要確認／変更なし／失敗／すべて）・チェック＝実行する・今 → 後の行・下の実行の帯」で組む。
  // 実行は途中で止めずに最後まで進め、失敗は「失敗」タブに理由つきで残す
  const cleanOff = new Set(); // 7. 片付けでチェックを外した項目
  const kitOffS = { junk: new Set(), name: nameOff, clean: cleanOff, sort: new Set(), ren: new Set() };
  const kitFail = { junk: new Map(), name: new Map(), sort: new Map(), ren: new Map(), clean: new Map() };
  const kitTab = { junk: 'todo', name: 'todo', sort: 'todo', ren: 'todo', clean: 'todo' };
  const kitQ = { junk: '', name: '', sort: '', ren: '', clean: '' };
  const KIT_OPT_J = 1;
  const KIT_OPT = { sort: 'ppdup:opt:sort:v1', ren: 'ppdup:opt:ren:v1', clean: 'ppdup:opt:clean:v1' };
  const stepOn = (v) => (v === 'name' ? nameEnabled() : v === 'junk' ? junkEnabled() : KIT_OPT[v] ? (() => { return lsGet(KIT_OPT[v]) !== '0'; })() : true);
  const KIT_EX = {
    junk: '作品と関係ないファイル（広告・宣伝の <code>.url</code> <code>.txt</code> <code>.html</code> <code>.exe</code> など、品番がなく宣伝の言葉やサイトのアドレスだけの名前、10MB 以下の画像・短い宣伝動画）を見分けてゴミ箱へ移します。オンの間は、ここで見つけたファイルをほかのステップの対象から外します。作品の可能性があるもの（50MB 以上・品番入り・字幕）は「要確認」に回し、最初はチェックなしです。空になったフォルダは「7. 片付け」でまとめて片付けられます。',
    name: `ファイル名の先頭を品番にそろえ、元のタイトルは <code>_</code> のあとに残します（例：<code>sample.net@FC2-PPV-2345678_1 夏の思い出【高画質】.mp4</code> → <code>FC2-PPV-2345678-1_夏の思い出.mp4</code>、<code>ssis00123.mp4</code> → <code>SSIS-123.mp4</code>）。サイト名・URL・宣伝の【】・画質の表記は消し、空白や Windows で使えない記号は <code>_</code> にします。タイトルは 40 文字まで。<code>_1</code>・<code>part2</code>・<code>cd1</code> などの分割番号は <code>-1</code> の形で残します。同じ場所に同じ名前ができる場合は <code>(1)</code> を付けます。品番の読めないファイル・中身・置き場所は変えません。`,
    sort: '複数の作品が混ざったフォルダの中で、作品ごとに品番のフォルダを作って（あれば既存のフォルダへ）ファイルを移します。My Pack など置き場所のフォルダ（読み込んだ場所・ホームの直下）では、1 作品だけでもフォルダを作ります（品番が読めないファイルは「要確認」に理由を出します）。同じ名前のファイルがあるときは <code>(1)</code> を付けます。削除はしません。',
    ren: 'フォルダ名を、中のファイル名（品番）に揃えます。中に複数の作品があるフォルダや、品番が決まらないフォルダは「要確認」に回して変更しません。同じ名前のフォルダがすでにあるときは重ならない名前にします。',
    clean: '重複の削除のあとに残ったものを片付けます：空のフォルダをゴミ箱へ（実行直前にも空か確かめます）、「X の中に X だけ」のフォルダの中身を 1 つ上へ、不要になった <code>(1)</code> を外す。このステップで処理できないものは「要確認」に出します。',
  };
  KIT_EX.dup = '同じファイル名（または同じ品番）のファイルをまとめ、サムネイル・サイズで比べて削除するものを選びます。各組の一番大きいファイルは高画質の候補として最初からチェックなし（残す）。組の 2 本を「コマで比べる」で見比べられます。全部にチェックした組は、確認画面で「強制削除」を選ばない限り削除しません。';
  KIT_EX.seller = '作品フォルダの品番から販売者を調べ（fd2ppv.cc → 見つからなければ fc2cmadb.com、FC2 以外は配信元）、ホーム/販売者別/販売者名（販売者ID）/ へ移動します。調べるだけでは何も動かしません。分からないものは外部サイトで確かめて手で入力できます。仕分け済みの中で販売者違い・販売者が判明・入れ子・未調査のものは、いったん My Pack へ戻し、1 から振り分け直します（重複の確認も通ります）。';
  const kitExHtml = (v) => `<details class="pd-explain kit-ex"><summary>このステップでできること</summary><div class="note">${KIT_EX[v]}</div></details>`;
  const KIT_VERB = { junk: '削除', name: '変更', sort: '移動', ren: '変更', clean: '実行' };
  const tg = (t, c) => ({ tag: t, tc: c || '' });
  const sortKey = (g) => g.cid + ':' + g.work;
  function kitItems(v) {
    const all = kitItems0(v);
    return scopeTop && ['name', 'sort', 'ren'].includes(v) ? all.filter((it) => inScope(String(it.grp || '').replace(/^（.*）$/, '/'))) : all;
  }
  function kitItems0(v) {
    const fail = kitFail[v];
    const fx = (it) => (fail.has(it.id) ? { ...it, st: 'fail', err: fail.get(it.id) } : it);
    if (v === 'junk') return jplan.map((p) => fx({ id: p.id, st: 'todo', grp: p.level === 'del' ? '作品と関係ないファイル（ほかのステップの対象から外しています）' : '要確認：作品の可能性があるもの（削除するならチェック）', before: p.name, after: '', note: `${p.path}　${fmt(p.size)}`, thumb: p.thumb || '', open: p.id, ...tg(p.reason, p.level === 'del' ? 'del' : 'warn'), danger: true }));
    if (v === 'name') return nplan.filter((p) => p.status === 'todo').map((p) => fx({ id: p.id, st: 'todo', grp: p.path || '（読み込んだフォルダの直下）', before: p.cur, after: p.target, note: p.note || '', thumb: (fileById(p.id) || {}).thumb || '', open: p.id, ...tg('名前を変更', 'pri') }));
    if (v === 'sort') return [...dropBoxLeftovers(workFiles(), folders).map((f) => ({ id: 'left:' + f.id, st: 'review', grp: '要確認：品番が読めないため、作品フォルダを作れないファイル', before: f.name, after: '', note: `${f.path}　${fmt(f.size)}　ファイル名に品番（5〜8 桁の数字）を入れると仕分けできます`, thumb: f.thumb || '', open: f.parentId, ...tg('品番なし', 'warn') })), ...splan.filter((g) => g.status !== 'done').map((g) => { const ren = g.items.filter((x) => x.to !== x.name); return fx({ id: sortKey(g), st: 'todo', grp: g.cpath || '（読み込んだフォルダの直下）', before: g.items.length === 1 ? g.items[0].name : `${g.items.length} 本（${g.items.map((x) => x.name).join('、')}）`, after: `📁 ${g.work}/`, note: ren.length ? '同じ名前があるため：' + ren.map((x) => `${x.name} → ${x.to}`).join('、') : '', thumb: ((fileById(g.items[0].id) || {}).thumb) || '', open: g.cid, ...(g.folderNew ? tg('新しいフォルダ', 'ok') : tg('既存のフォルダへ', 'pri')) }); })];
    if (v === 'ren') return rplan.map((p) => { const st = p.status === 'rename' || p.status === 'dup' ? 'todo' : p.status === 'skip' ? 'review' : 'same'; const pp = p.path.slice(0, p.path.length - p.cur.length).replace(/\/$/, '') || '（読み込んだフォルダの直下）'; return fx({ id: p.id, st, grp: pp, before: p.cur, after: p.target || '（未定）', note: p.note || '', open: p.id, ...tg(STLABEL[p.status], p.status === 'skip' ? 'warn' : p.status === 'same' ? '' : 'pri'), folder: true }); });
    if (v === 'clean') {
      const GL = { trash: '空のフォルダをゴミ箱へ', flatten: '入れ子のフォルダをまとめる', rename: '(1) を外す' };
      return cplan.filter((p) => p.status === 'todo' || p.status === 'skip').map((p) => fx({ id: p.id, st: p.status === 'todo' ? 'todo' : 'review', grp: p.status === 'skip' ? '要確認（このステップでは処理できません）' : GL[p.op] || p.op, before: p.cur, after: p.op === 'rename' ? p.target : p.op === 'flatten' ? `中身を 1 つ上の ${p.target} へ` : p.op === 'trash' ? 'ゴミ箱へ' : '', note: [p.path, p.note].filter(Boolean).join('　'), open: p.id, ...tg(p.kind === 'folder' ? 'フォルダ' : 'ファイル', p.op === 'trash' ? 'del' : ''), folder: p.kind === 'folder', danger: p.op === 'trash' }));
    }
    return [];
  }
  const kitRaw = (v, id) => (v === 'junk' ? jplan.find((p) => p.id === id) : v === 'name' ? nplan.find((p) => p.id === id) : v === 'sort' ? splan.find((g) => sortKey(g) === id) : v === 'ren' ? rplan.find((p) => p.id === id) : cplan.find((p) => p.id === id));
  // チェックを外したか（2. 不要ファイルは「要確認」が最初からチェックなしなので、専用の記録を使う）
  const kitIsOff = (v, id) => (v === 'junk' ? (() => { const p = jplan.find((x) => x.id === id); return !p || !junkChecked(p); })() : kitOffS[v].has(id));
  const kitSetOff = (v, id, off) => { if (v === 'junk') junkSel.set(id, !off); else if (off) kitOffS[v].add(id); else kitOffS[v].delete(id); };
  const kitOn = (v, it) => (it.st === 'todo' || it.st === 'fail') && !kitIsOff(v, it.id);
  function kitTargets(v) { return kitItems(v).filter((it) => kitOn(v, it)); }
  function kitPlan(v) { if (v === 'junk') jplan = junkEnabled() ? buildJunkPlan(files, folders) : []; if (v === 'name') nplan = buildNamePlan(workFiles(), folders); if (v === 'sort') splan = buildSortPlan(workFiles(), folders); if (v === 'ren') rplan = buildRenamePlan(workFiles(), folders); if (v === 'clean') cplan = buildCleanPlan(files, folders); }
  function renderKit(v) {
    const main = $('[data-r=main]');
    const s = STEPS.find((x) => x.v === v);
    const ex = `<details class="pd-explain kit-ex"${stepOn(v) ? '' : ' open'}><summary>このステップでできること</summary><div class="note">${KIT_EX[v]}</div></details>`;
    if (!stepOn(v)) { main.innerHTML = ex + `<div class="pd-hero"><h2>このステップはオフになっています</h2><div class="note">「${esc(s.t)}」は行いません。使うときは右上の「このステップを使う」にチェックを入れてください。</div><div class="acts" style="margin-top:16px">${nextHtml(undefined, 'pri big')}</div></div>`; if (!busy) status('このステップはオフです。'); return; }
    const all = kitItems(v);
    const n = (st) => all.filter((it) => (st === 'all' ? true : it.st === st)).length;
    if (!n('todo') && !n('fail') && kitTab[v] === 'todo') { main.innerHTML = ex + (n('review') ? `<div class="st-res"><span class="ic">!</span><span class="tx">実行するものはありません。要確認が ${n('review')} 件あります（「要確認」タブで確かめられます）</span></div>` : '') + kitTabsHtml(v, n) + doneCard(); if (!busy) status('このステップで実行するものはありません。'); return; }
    const tab = kitTab[v], q = kitQ[v].trim().toLowerCase();
    const list = all.filter((it) => (tab === 'all' || it.st === tab) && (!q || (it.before + ' ' + it.after + ' ' + it.grp).toLowerCase().includes(q)));
    const groups = new Map(); list.forEach((it) => { if (!groups.has(it.grp)) groups.set(it.grp, []); groups.get(it.grp).push(it); });
    const row = (it) => {
      const can = it.st === 'todo' || it.st === 'fail', on = can && !kitIsOff(v, it.id);
      const th = it.folder ? `<span class="kit-ic">${ICON_DIR}</span>` : it.thumb ? `<img loading="lazy" referrerpolicy="no-referrer" src="${esc(it.thumb)}" alt="">` : `<span class="kit-ic">${ICON_FILE({ name: it.before, ext: extOf(it.before) })}</span>`;
      return `<div class="pd-row kit-row ${on ? (it.danger ? 'del' : 'sel') : ''}${it.st === 'fail' ? ' fail' : ''}" data-id="${esc(it.id)}"><label class="pd-chk"><input type="checkbox" data-kchk="${esc(it.id)}"${on ? ' checked' : ''}${can ? '' : ' disabled'}></label>
        <div class="pd-th kit-th">${th}</div>
        <div class="pd-info"><div class="pd-name">${esc(it.before)}${it.after ? ` <span class="note">→</span> <b class="kit-to">${esc(it.after)}</b>` : ''}</div>${it.note ? `<div class="note">${esc(it.note)}</div>` : ''}${it.st === 'fail' ? `<div class="kit-err">失敗：${esc(it.err)}</div>` : ''}</div>
        <span class="pd-tag kit-tag ${it.tc}">${esc(it.tag)}</span>${it.open ? `<button class="kit-open" data-kopen="${esc(it.open)}" title="フォルダ一覧でこの項目の場所を開く">場所を開く</button>` : ''}</div>`;
    };
    const body = [...groups].map(([g, l]) => { const chk = l.filter((it) => it.st === 'todo' || it.st === 'fail'); const allOn = chk.length && chk.every((it) => !kitIsOff(v, it.id)); return `<div class="pd-g"><div class="pd-gh">${chk.length ? `<input type="checkbox" data-kgrp="${esc(g)}"${allOn ? ' checked' : ''} title="このまとまりをすべてチェック／外す">` : ''}<span>${esc(g)}</span><span class="note">${l.length} ${UNIT_OF[v] || '件'}</span></div>${l.map(row).join('')}</div>`; }).join('') || '<div class="empty">この区分に該当するものはありません</div>';
    main.innerHTML = ex + kitTabsHtml(v, n) + body + nextButton();
    if (!busy) status(n('todo') + n('fail') ? (v === 'junk' ? '削除するものにチェックを入れて、下の「チェックした n 件を削除」を押してください（PikPak のゴミ箱へ移します）。'.replace('n 件', kitTargets(v).length + ' 件') : '内容を確かめて、まずは「先頭1件だけ試す」で動きを確かめてください。') : 'このステップで実行するものはありません。');
  }
  function kitTabsHtml(v, n) {
    const T = [['todo', '実行する'], ['review', '要確認'], ['same', '変更なし'], ['fail', '失敗'], ['all', 'すべて']].filter(([k]) => k === 'todo' || k === 'all' || n(k));
    return `<div class="kit-tabs">${T.map(([k, l]) => `<button class="kit-tab${kitTab[v] === k ? ' on' : ''}${k === 'fail' ? ' bad' : ''}" data-ktab="${k}">${l}<i>${n(k)}</i></button>`).join('')}<span class="sp"></span><input type="search" data-kq placeholder="絞り込み（品番・名前）" value="${esc(kitQ[v])}"></div>`;
  }
  // 実行：止めずに最後まで。失敗は理由を残す（ログインが切れたときだけ止める）
  async function runKit(v, onlyFirst) {
    const targets = kitTargets(v).slice(0, onlyFirst ? 1 : undefined);
    if (!targets.length || !ensureSession(v)) return;
    busy = true; renderNav(); renderActs(); window.__ppdupStop = false;
    let ok = 0, skipped = 0, ng = 0; const t0 = Date.now();
    for (const it of targets) {
      if (window.__ppdupStop) break;
      const d = ok + skipped + ng;
      status(`${KIT_VERB[v]}しています… ${d + 1} / ${targets.length}：${it.before}`, d / targets.length, d ? `あと約 ${fmtDur((Date.now() - t0) / d * (targets.length - d))}` : '残り時間を計算中…');
      const p = kitRaw(v, it.id);
      try {
        if (!p) throw new Error('計画が見つかりません（作り直してください）');
        const r = v === 'sort' ? (await sortApi(p), true) : v === 'ren' ? (await renameApi(p), true) : await cleanOne(p);
        if (r === false) skipped++; else ok++;
        kitFail[v].delete(it.id);
      } catch (err) {
        if (err.session) { if (v === 'ren') persistFolders(); else saveAll(); busy = false; setView(v); handleErr(err, v, `ログインが切れたため止めました（${ok} 件完了）`); return; }
        ng++; kitFail[v].set(it.id, err.message || String(err)); log('warn', `${STEPS.find((x) => x.v === v).t}：失敗：${it.before}：${err.message || err}`);
      }
      if (v === 'ren') persistFolders(); else saveAll();
      await sleep(v === 'sort' ? 100 : 130);
    }
    busy = false;
    kitTab[v] = ng ? 'fail' : 'todo';
    setView(v);
    const unit = UNIT_OF[v] || '件';
    status(`${ok} ${unit}を${KIT_VERB[v]}しました${skipped ? `（${skipped} 件は実行直前の確認で対象外になりました）` : ''}${ng ? `・失敗 ${ng} 件（「失敗」タブに理由があります。チェックしたまま実行すると、もう一度試します）` : ''}${window.__ppdupStop ? '・中断しました' : ''}。`);
    log('info', `${STEPS.find((x) => x.v === v).t}：${ok} 件・対象外 ${skipped}・失敗 ${ng}`);
    refreshView();
  }
  const renderName = () => renderKit('name'), renderSort = () => renderKit('sort'), renderRen = () => renderKit('ren'), renderClean = () => renderKit('clean');
  const runName = (o) => runKit('name', o), runSort = (o) => runKit('sort', o), runRen = (o) => runKit('ren', o), runClean = (o) => runKit('clean', o);
  const STLABEL = { same: '変更なし', rename: 'フォルダ名を変更', dup: '変更（重複を避ける）', skip: '要確認' };
  function persistFolders() { // 変更後の名前をキャッシュへ反映（中のフォルダ・ファイルの場所の表示も更新）
    rplan.forEach((p) => {
      const f = folders.find((x) => x.id === p.id);
      if (!f || f.name === p.cur) return;
      const old = f.path; f.name = p.cur; f.path = old.slice(0, old.length - old.split('/').pop().length) + p.cur;
      folders.forEach((y) => { if (y.path.startsWith(old + '/')) y.path = f.path + y.path.slice(old.length); });
      files.forEach((y) => { if (y.path === old || y.path.startsWith(old + '/')) y.path = f.path + y.path.slice(old.length); });
    });
    saveAll();
  }


