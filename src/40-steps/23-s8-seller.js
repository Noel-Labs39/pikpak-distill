  // ---------- 8. 販売者ごとに仕分け ----------
  // 作品フォルダ（FC2-PPV-品番）の品番から販売者を調べ、ホーム/販売者別/販売者名（販売者ID）/ へ移動する。
  // 販売者は fd2ppv.cc の作品ページで調べ、FC2 で見つからなければ fc2cmadb.com も見る。FC2 以外は fd2ppv.cc の検索 → 作品ページの「配信元」。PikPak の画面からは別サイトを読めないため、小さなウィンドウで作品ページを順に開き、
  // そのページの上で動くこのスクリプト（下の fd2Lookup）が販売者を読み取って、こちらへ知らせる（Cloudflare の確認が出たら、そのウィンドウで済ませてもらう）
  const LS_SELLER = 'ppdup:seller:v1'; // 品番 → { name, sid, src: 'fd2ppv' | 'manual', status: 'ok' | 'notfound' | 'noseller', at }
  const LS_SELLER_CFG = 'ppdup:seller:cfg:v1';
  const LS_OPT_SELLER = 'ppdup:opt:seller:v1';
  const FD2 = 'https://fd2ppv.cc';
  const CMADB = 'https://fc2cmadb.com';
  const FANZA = 'https://video.dmm.co.jp';
  let sellerDb = {};
  sellerDb = lsJson(LS_SELLER, {});
  // 品番の拾い方・販売者の決め方・仕分けの計画は src/core/seller-plan.mjs（試験あり）。ここでは販売者の記録・設定を渡す
  const { workKeys, SRC_LABEL, sellerFolderName, boxSidOf } = PPCore;
  const keyRec = (k) => PPCore.keyRec(k, sellerDb);
  const resolveKeys = (keys) => PPCore.resolveKeys(keys, sellerDb);
  const buildSellerPlan = (ds) => PPCore.buildSellerPlan(ds, { cfg: sellerCfg(), sellerDb, dirLabel });
  const saveSellerDb = () => { lsSetJson(LS_SELLER, sellerDb); };
  // ---- 作品の情報（販売者を調べるときに一緒に読み取る：タイトル・女優・タグ・配信日・収録時間・モザイク）----
  //   品番の鍵 → { title, actresses: [{ name, id, site }], tags, date, dur, mosaic, sellers: { サイト: { name, sid } }, manual: { actresses }, at }
  const LS_WINFO = 'ppdup:winfo:v1';
  let wInfo = lsJson(LS_WINFO, {});
  // 4.18.x の不具合の後始末：fc2cmadb.com の上のメニューの「販売者」リンクを販売者として読んでいた記録を直す（判定は src/core/seller-plan.mjs）
  //   同期でも同じ判定で取り除くので、PikPak 側の古い記録から戻ってくることはない
  (() => {
    const n = PPCore.fixMisreadSellers(sellerDb, wInfo);
    if (!n) return;
    saveSellerDb(); lsSetJson(LS_WINFO, wInfo);
    setTimeout(() => { try { log('info', `販売者名の読み違い（メニューの「販売者」）を ${n} 件直しました。ほかのサイトで分かっているものはその名前に、分からないものは未調査に戻しました（「販売者を調べる」で調べ直せます）`); } catch (e) { /* 無視 */ } }, 0);
  })();
  function saveWorkInfo(k, r) {
    const i = r.info || {}, o = wInfo[k.key] || {}, site = i.site || r.src || '';
    const acts = (o.actresses || []).slice();
    (i.actresses || []).forEach((x) => { if (!acts.some((y) => y.name === x.name)) acts.push({ name: String(x.name).slice(0, 60), id: String(x.id || '').slice(0, 40), site }); else acts.forEach((y) => { if (y.name === x.name && !y.id) { y.id = x.id; y.site = site; } }); });
    wInfo[k.key] = {
      ...o,
      title: i.title || o.title || '', actresses: acts.slice(0, 30),
      tags: [...new Set([...(o.tags || []), ...(i.tags || [])])].slice(0, 40),
      date: i.date || o.date || '', dur: i.dur || o.dur || '', mosaic: i.mosaic || o.mosaic || '', label: i.label || o.label || '',
      sellers: { ...(o.sellers || {}), ...(r.status === 'ok' && r.name ? { [site]: { name: String(r.name).slice(0, 120), sid: String(r.sid || '').slice(0, 64) } } : {}) },
      at: Date.now(),
    };
    lsSetJson(LS_WINFO, wInfo);
  }
  const sellerEnabled = () => { return lsGet(LS_OPT_SELLER) !== '0'; };
  function sellerCfg() {
    let c = {}; c = lsJson(LS_SELLER_CFG, {});
    const nm = (v, d) => (typeof v === 'string' && v.trim() && !/[\/\\]/.test(v) ? v.trim() : d);
    return { root: nm(c.root, '販売者別'), unknown: nm(c.unknown, '販売者不明'), review: nm(c.review, '要確認'), interval: [1, 1.5, 3].includes(+c.interval) ? +c.interval : 1.5 };
  }
  const saveSellerCfg = (c) => { lsSetJson(LS_SELLER_CFG, c); };
  // 「販売者別」とその直下（販売者・不明・要確認のフォルダ）。ほかのステップで名前を変えないように使う
  function sellerBoxIds(ds) {
    const cfg = sellerCfg();
    const R = ds.find((d) => d.isRoot);
    const top = (d) => d.parentId === '' || d.parentId === 'root' || (R && (!R.id || R.id === 'root') && d.parentId === R.id);
    const box = ds.find((d) => !d.isRoot && top(d) && d.name === cfg.root);
    return new Set(box ? [box.id, ...ds.filter((d) => d.parentId === box.id).map((d) => d.id)] : []);
  }
  let selPlan = [];
  const sellerSel = new Map(); // 作品フォルダ → チェック（未記録は seller だけチェックあり）
  // 再調査の対象（入れ子・販売者違い・販売者が判明・仕分け済みの中の未調査）は、いったん My Pack へ戻して 1 から振り分け直す
  const toMyPack = (p) => ['nest', 'wrong', 'found', 'pend'].includes(p.fix);
  const sellerChecked = (p) => ((p.kind === 'pending' && !toMyPack(p)) || (p.kind === 'dupw' && !p.merge) ? false : sellerSel.has(p.id) ? sellerSel.get(p.id) : (p.fix === 'nest' || p.kind === 'dupw' || (p.kind === 'seller' && !p.fix)));
  const SELLER_KIND = { seller: '決まった', unknown: '販売者不明', review: '要確認', pending: '未調査' };
  let sellerFilter = 'all'; // 絞り込みのタブ
  const sellerFail = new Map(); // 移動できなかった作品 → 理由
  let sellerAck = false; // ②「確かめる・入力」を済ませて ③ へ進んだか
  // 外部サイトで確かめる（品番は各サイトの形に直して開く）
  function extSites(k) {
    if (k.kind === 'fc2') {
      const id = 'FC2-PPV-' + k.num;
      return [['FD2PPV', 'FC2・配信元', `${FD2}/articles/${k.num}`], ['FC2CMADB', 'FC2 販売者', `${CMADB}/articles/${k.num}`], ['FC2DB', 'FC2 販売者', `https://fc2db.net/work/${k.num}/`], ['FC2', '公式', `https://adult.contents.fc2.com/article/${k.num}/`],
        ['MissAV', '作品', `https://missav.ws/cn/fc2-ppv-${k.num}`], ['Supjav', '作品', `https://supjav.com/zh/?s=${encodeURIComponent(id)}`], ['JavDB', '作品', `https://javdb.com/search?q=${encodeURIComponent(id)}&f=all`], ['Sukebei', '名前で検索', `https://sukebei.nyaa.si/?f=0&c=0_0&q=${encodeURIComponent(id)}`]];
    }
    const short = k.kind === 'brand' && k.date ? k.sid : '';
    const code = k.date && short ? `${k.date}${short === 'carib' ? '-' : '_'}${k.serial}` : k.kw || k.code || '';
    const jav = short ? `${short.toUpperCase()}-${k.date}-${k.serial}` : k.label;
    const suke = short ? `${code}-${short}` : (k.kw || k.label);
    return [['FD2PPV', '配信元', `${FD2}/articles/?keyword=${encodeURIComponent(k.kw || k.label)}`], ['JavDB', 'メーカー', `https://javdb.com/search?q=${encodeURIComponent(jav)}&f=all`], ['JavBus', 'メーカー', `https://www.javbus.com/${encodeURIComponent(jav)}`],
      ['JavLibrary', 'メーカー', `https://www.javlibrary.com/cn/vl_searchbyid.php?keyword=${encodeURIComponent(jav)}`], ['MissAV', '作品', `https://missav.ws/cn/${encodeURIComponent(jav.toLowerCase())}`], ['Supjav', '作品', `https://supjav.com/zh/?s=${encodeURIComponent(code || jav)}`],
      ['Sukebei', '名前で検索', `https://sukebei.nyaa.si/?f=0&c=0_0&q=${encodeURIComponent(suke)}`], ['DMM', 'FANZA', `https://www.dmm.co.jp/search/=/searchstr=${encodeURIComponent(code || jav)}`]];
  }
  function openExt(btn, id) {
    closeExt();
    const p = selPlan.find((x) => x.id === id); if (!p) return;
    const d = document.createElement('div'); d.id = 'pd-ext';
    d.innerHTML = `<div class="hd"><b>外部サイトで確かめる</b><button data-x title="閉じる（Esc）" aria-label="閉じる">${IC.x}</button></div>` + p.keys.map((k) => `<div class="kw raw">${esc(k.label)}</div><div class="gr">${extSites(k).map(([n, s, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer"><b class="raw">${n}</b><small>${esc(s)}</small></a>`).join('')}</div>`).join('') + '<div class="ft">分かったら、行の入力欄に販売者名と ID を入れて「保存」</div>';
    document.body.appendChild(d);
    const r = btn.getBoundingClientRect(), w = d.offsetWidth, h = d.offsetHeight;
    d.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.right - w)) + 'px';
    d.style.top = (r.bottom + 6 + h > window.innerHeight - 8 ? Math.max(8, r.top - h - 6) : r.bottom + 6) + 'px';
    d.querySelector('[data-x]').onclick = closeExt;
    if (LANG === 'en') d.querySelectorAll('*').forEach(trNode);
  }
  function closeExt() { const d = document.getElementById('pd-ext'); if (d) d.remove(); }
  document.addEventListener('mousedown', (e) => { const d = document.getElementById('pd-ext'); if (d && !d.contains(e.target) && !e.target.closest('[data-sext]')) closeExt(); }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.getElementById('pd-ext')) { e.preventDefault(); e.stopImmediatePropagation(); closeExt(); } }, true);
  // 行の中で販売者を保存
  function saveRowSeller(id) {
    const p = selPlan.find((x) => x.id === id); if (!p) return;
    const row = $(`[data-srow="${CSS.escape(id)}"]`); if (!row) return;
    const name = row.querySelector('[data-sname]').value.trim();
    const sid = row.querySelector('[data-ssid]').value.trim().replace(/^.*\/(users|writers|channels)\//, '').replace(/[\/?#].*$/, '');
    const err = row.querySelector('[data-serr]');
    if (!name || !/^[A-Za-z0-9_.-]{1,64}$/.test(sid)) { err.textContent = tr('販売者名と販売者ID（英数字）を入れてください'); return; }
    p.keys.forEach((k) => { sellerDb[k.key] = { name, sid, src: 'manual', status: 'ok', at: Date.now() }; });
    saveSellerDb(); sellerSel.delete(id); log('info', `販売者を手入力：${p.name} → ${name}（${sid}）`);
    setView('seller');
  }
  // 次にやること（① 調べる → ② 確かめる・入力 → ③ 移動）
  function sellerStage() {
    const n = (k) => selPlan.filter((p) => p.kind === k).length;
    if (n('pending')) return 1;
    if ((n('unknown') || n('review')) && !sellerAck) return 2;
    return 3;
  }
  function sellerGuideHtml() {
    const n = (k) => selPlan.filter((p) => p.kind === k).length;
    const st = sellerStage(), pend = n('pending'), unk = n('unknown') + n('review');
    const auto = selPlan.filter((p) => p.kind === 'seller' && p.seller.src === 'name').length;
    const looked = selPlan.filter((p) => p.kind === 'seller' && p.seller.src !== 'name' && p.seller.src !== 'manual').length;
    const manual = selPlan.filter((p) => p.kind === 'seller' && p.seller.src === 'manual').length;
    const mv = selPlan.filter((p) => (p.kind !== 'pending' || toMyPack(p)) && sellerChecked(p)).length;
    const steps = [['販売者を調べる', pend ? `未調査 ${pend} 件` : '未調査はありません'], ['確かめる・入力', unk ? `分からない ${unk} 件` : '分からないものはありません'], ['移動', `チェック ${mv} 件`]];
    const flow = steps.map(([t, s], i) => `<div class="st ${i + 1 < st ? 'done' : i + 1 === st ? 'now' : ''}"><span class="n">${i + 1 < st ? '✓' : i + 1}</span><span class="t"><b>${t}</b><small>${esc(s)}</small></span></div>`).join('<i class="ln"></i>');
    const parts = [auto ? `品番から判定 ${auto}` : '', looked ? `サイトで確認 ${looked}` : '', manual ? `手入力 ${manual}` : ''].filter(Boolean).join('・');
    let msg = '';
    if (st === 1 && lookupSt.on) {
      const L = lookupSt, pct = Math.floor(L.done / Math.max(1, L.total) * 100);
      msg = `<div class="tx"><b>${L.challenge ? `${esc(L.challenge)} の確認画面が出ています。前に出した小さなウィンドウで確認を済ませてください` : L.paused ? '一時停止しています' : L.info ? '作品の情報を調べています' : '販売者を調べています'}</b><small>${L.cur ? `調べている作品：${esc(L.cur)}（${esc(L.site)}）` : ''}${L.challenge ? '' : '　小さなウィンドウは画面の端に寄せてあります（閉じると止まります）'}</small>
        <div class="sl-prog"><div class="bar"><i class="ok" style="width:${L.ok / Math.max(1, L.total) * 100}%"></i><i class="ng" style="width:${L.miss / Math.max(1, L.total) * 100}%"></i></div>
        <div class="nums"><b>${L.done} / ${L.total}（${pct}%）</b><span>🟩 分かった ${L.ok}</span><span>⬜ 分からない ${L.miss}</span><span>${esc(lookupEta())}（1 件 ${sellerCfg().interval} 秒＋読み込み）</span></div></div></div>
        ${L.challenge ? '<button class="pri" data-a="skick" title="確認を済ませても続きが始まらないときに押す（ウィンドウを開き直して、同じ作品を調べ直します）">確認が済んだら：続きを調べる</button>' : ''}<button data-a="spause">${L.paused ? '再開' : '一時停止'}</button><button data-a="stop">中断</button>`;
    } else if (st === 1) msg = `<div class="tx"><b>未調査が ${pend} 件あります。まず販売者を調べます</b><small>小さなウィンドウで fd2ppv.cc の作品ページを開いて調べます。見つからない・販売者や女優などが足りないときだけ、fc2cmadb.com も開きます。調べるだけでは移動しません。</small></div><button class="pri" data-a="slookup"${busy ? ' disabled' : ''}>販売者を調べる（${pend} 件）</button>`;
    else if (st === 2) msg = `<div class="tx"><b>${unk} 件は販売者が分かりませんでした。外部サイトで確かめて入力してください</b><small>${selPlan.length} 件中 ${selPlan.length - unk} 件は決まりました${parts ? `（${parts}）` : ''}。入力しなくても「${esc(sellerCfg().unknown)}」「${esc(sellerCfg().review)}」へまとめて移動できます。</small></div><button class="pri" data-a="sshowunk">分からない ${unk} 件を確かめる</button><button data-a="sack">このまま ③ 移動へ</button>`;
    else msg = `<div class="tx"><b>${mv ? `チェックした ${mv} 件を移動できます。下のボタンで実行します` : 'チェックの入った作品がありません'}</b><small>${selPlan.length} 件中 ${selPlan.length - unk} 件は販売者が決まりました${parts ? `（${parts}）` : ''}。まずは「先頭1件だけ試す」で動きを確かめてください。削除はしません。</small></div>${unk ? `<button data-a="sunack">② に戻る（分からない ${unk} 件）</button>` : ''}`;
    const ib = infoBarHtml();
    return `<section class="sl-guide" aria-label="次にやること"><div class="fl">${flow}</div><div class="msg">${msg}</div>${ib}</section>`;
  }
  function infoBarHtml() {
    const nMiss = lookupSt.on ? 0 : infoTargets('missing').length, nDiff = sellerDiffs().length;
    return lookupSt.on ? '' : `<div class="sl-ib"><span class="tx"><b>作品の情報（女優・タイトル・サイトごとの販売者名など）</b><small>${nMiss ? `情報がまだない作品が ${nMiss} 件あります` : '情報はそろっています'}</small></span>
      <button data-a="sinfo" data-v="missing"${nMiss ? '' : ' disabled'}>情報がない作品だけ調べる（${nMiss}）</button><button data-a="sinfo" data-v="all" title="調べ終わった作品も含めて、すべて調べ直します（時間がかかります）">すべて調べ直す</button>
      <button data-a="sdiff"${nDiff ? ' class="pri"' : ''} title="記録している販売者名とサイトの名前、またはサイトどうしの名前が違う作品を確かめます">販売者名の違い（${nDiff}）</button></div>`;
  }
  function sellerBarHtml() {
    if (busy) return '';
    const sel = selPlan.filter((p) => (p.kind !== 'pending' || toMyPack(p)) && sellerChecked(p));
    const cfg = sellerCfg();
    const cnt = new Map(); sel.forEach((p) => { const k = toMyPack(p) ? 'My Pack へ（振り分け直し）' : p.kind === 'dupw' ? '同じ品番をまとめる' : p.kind === 'seller' ? p.seller.name : p.kind === 'unknown' ? cfg.unknown : cfg.review; cnt.set(k, (cnt.get(k) || 0) + 1); });
    const brk = [...cnt.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${esc(k)} ${v}`).join('・') + (cnt.size > 6 ? ' …' : '');
    const unk = selPlan.filter((p) => (p.kind === 'unknown' || p.kind === 'review') && !sellerChecked(p)).length;
    return `<span class="n">${sellerStage() === 3 ? '③' : '移動'}</span><span class="tx"><b>${sel.length ? `移動するもの ${sel.length} 作品` : 'チェックの入った作品がありません'}</b><small>${sel.length ? `（${brk}）` : ''}${unk ? `　分からない ${unk} 件はチェックを入れると「${esc(cfg.unknown)}」などへ一緒に移動します` : ''}</small></span>
      <button data-a="seller1"${sel.length ? '' : ' disabled'}>先頭1件だけ試す</button><button class="${sellerStage() === 3 ? 'pri' : 'sec'}" data-a="sellerall"${sel.length ? '' : ' disabled'}>${sel.length} 作品を移動</button>`;
  }
  // 一覧を作り直さずに、上の案内と下の帯だけを更新する（入力中の欄を消さないため）
  function refreshSellerChrome() {
    if (view !== 'seller') return;
    const bar = $('[data-r=slbar]'); if (bar) bar.innerHTML = sellerBarHtml();
    const g = $('[data-r=main] .sl-guide'); if (g && selPlan.length) g.outerHTML = sellerGuideHtml();
    if (LANG === 'en') root.querySelectorAll('[data-r=slbar] *, [data-r=main] .sl-guide *').forEach(trNode);
  }
  function renderSeller() {
    renderSeller0(); const m = $('[data-r=main]'); if (!m) return;
    if (!m.querySelector('.kit-ex')) m.insertAdjacentHTML('afterbegin', kitExHtml('seller'));
    // 仕分けの対象がなくても、作品の情報をまとめて調べる・販売者名の違いは使えるようにする
    if (sellerEnabled() && !m.querySelector('.sl-ib')) { const ex = m.querySelector('.kit-ex'); const h = `<section class="sl-guide" aria-label="作品の情報">${infoBarHtml()}</section>`; if (ex) ex.insertAdjacentHTML('afterend', h); else m.insertAdjacentHTML('afterbegin', h); }
    // 実行結果のカード（ほかのステップと同じく一覧の上に残す）
    const r = lastResult.seller;
    if (r && !m.querySelector('.st-res')) { const bad = /失敗|できません|停止|エラー|止め/.test(r.text); m.insertAdjacentHTML('afterbegin', `<div class="st-res${bad ? ' warn' : ''}" role="status"><span class="ic">${bad ? '!' : '✓'}</span><span class="tx">${esc(r.text)}</span><button data-a="resclose" title="閉じる" aria-label="閉じる">${IC.x}</button></div>`); }
  }
  function renderSeller0() {
    const cfg = sellerCfg();
    if (!sellerEnabled()) { $('[data-r=main]').innerHTML = `<div class="pd-hero"><h2>このステップはオフになっています</h2><div class="note">右上の「このステップを使う」か、設定の「整理」でオンにできます。</div></div>${nextButton()}`; if (!busy) status('販売者ごとの仕分けはオフです。'); return; }
    const by = (k) => selPlan.filter((p) => p.kind === k);
    if (sellerFilter !== 'all' && !(sellerFilter === 'fix' ? selPlan.some((p) => p.fix) : sellerFilter === 'fail' ? selPlan.some((p) => sellerFail.has(p.id)) : by(sellerFilter).length)) sellerFilter = 'all';
    const show = sellerFilter;
    const ix = buildTreeIndex();
    const R = folders.find((d) => d.isRoot);
    const homeScan = !!R && (!R.id || R.id === 'root');
    const sellers = new Map();
    by('seller').filter((p) => !p.fix).forEach((p) => { const k = p.seller.sid; if (!sellers.has(k)) sellers.set(k, { s: p.seller, items: [] }); sellers.get(k).items.push(p); });
    const groups = [];
    const fixes = selPlan.filter((p) => p.fix);
    if (show === 'fail') groups.push({ key: 'k:fail', title: '失敗（移動できなかった作品）', dest: '', items: selPlan.filter((p) => sellerFail.has(p.id)), cls: ' warn', hint: '理由を確かめて、チェックしたまま「移動」を押すともう一度試します' });
    if (show === 'all' || show === 'fix') if (fixes.length) groups.push({ key: 'k:fix', title: '置き場所の修正（入れ子・販売者違いなど）', dest: '', items: fixes, cls: ' warn', hint: '入れ子・販売者違い・販売者が判明・未調査は My Pack へ戻して 1 から振り分け直します（入れ子は初めからチェック）。置き場所違いは正しい販売者フォルダへ' });
    if (show === 'all' || show === 'unknown') if (by('unknown').length) groups.push({ key: 'k:unknown', title: cfg.unknown, dest: `${cfg.root}/${cfg.unknown}/`, items: by('unknown'), cls: ' unk', hint: '入力すると、その販売者の組へ移ります' });
    if (show === 'all' || show === 'review') if (by('review').length) groups.push({ key: 'k:review', title: cfg.review, dest: `${cfg.root}/${cfg.review}/`, items: by('review'), cls: ' warn', hint: '自動では移動しません（初めはチェックなし）' });
    if (show === 'all' || show === 'pending') if (by('pending').filter((p) => !p.fix).length) groups.push({ key: 'k:pending', title: SELLER_KIND.pending, dest: '', items: by('pending').filter((p) => !p.fix), cls: ' pend', hint: '「販売者を調べる」で調べます（調べるだけでは移動しません）' });
    if (show === 'all' || show === 'dupw') if (by('dupw').length) groups.push({ key: 'k:dupw', title: '同じ品番のフォルダが複数', dest: '', items: by('dupw'), cls: ' pend', hint: '中身を 1 つのフォルダにまとめます（初めからチェック）。まとめたあと「6. 重複を比べて削除」で同じファイルを片付けられます' });
    if (show === 'all' || show === 'seller') [...sellers.values()].sort((a, b) => b.items.length - a.items.length || String(a.s.name).localeCompare(String(b.s.name), 'ja')).forEach((g) => groups.push({ key: 's:' + g.s.sid, title: g.s.name, sid: g.s.sid, dest: `${cfg.root}/${sellerFolderName(g.s)}/`, items: g.items, cls: '' }));
    const thumb = (p) => { const f = ix.thumbOf.get(p.id); return f && f.thumb ? `<img loading="lazy" referrerpolicy="no-referrer" src="${esc(f.thumb)}" alt="">` : ''; };
    const sz = (p) => { const a = ix.agg.get(p.id); return a ? fmt(a.size) : ''; };
    const known = new Map(); Object.values(sellerDb).forEach((r) => { if (r && r.status === 'ok' && r.sid && !known.has(r.sid)) known.set(r.sid, r.name); });
    const BADGE = { seller: ['ok', ''], unknown: ['unk', '販売者不明'], review: ['warn', '要確認'], pending: ['pend', '未調査'] };
    const row = (p) => {
      const on = sellerChecked(p);
      const [bc, bt] = p.kind === 'dupw' ? ['warn', '重複'] : p.fix ? ['warn', p.fix === 'nest' ? '入れ子' : p.fix === 'wrong' ? '販売者違い' : p.fix === 'deep' ? '置き場所違い' : p.fix === 'found' ? '販売者が判明' : '未調査'] : p.kind === 'seller' ? (p.seller.src === 'name' ? ['auto', '品番から判定'] : p.seller.src === 'manual' ? ['man', '手入力'] : ['ok', 'サイトで確認']) : BADGE[p.kind];
      const canRedo = p.kind === 'unknown' && p.keys.some((k) => k.kind !== 'brand' && sellerDb[k.key] && sellerDb[k.key].src !== 'manual');
      const input = p.kind === 'unknown' || p.kind === 'review'
        ? `<div class="sl-in"><input type="text" data-sname list="pd-sellers" placeholder="販売者名" value="${esc(p.seller ? p.seller.name : '')}"><input type="text" data-ssid class="raw" placeholder="ID" value="${esc(p.seller ? p.seller.sid : '')}"><button data-ssave="${esc(p.id)}">保存</button><button data-sext="${esc(p.id)}">外部サイト ▾</button>${canRedo ? `<button data-sredo="${esc(p.id)}" title="調べた結果を消して、もう一度調べる対象に戻します">調べ直す</button>` : ''}<span class="err" data-serr></span></div>`
: (p.kind === 'pending' && !toMyPack(p)) || p.kind === 'dupw' ? '' : p.fix ? `<div class="pd-act" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><span class="note">→ ${toMyPack(p) ? 'My Pack/（そのあと 1 から振り分け直し）' : `${esc(sellerCfg().root)}/${esc(sellerFolderName(p.seller))}/`}</span><button data-sext="${esc(p.id)}">外部サイト ▾</button><button data-sedit="${esc(p.id)}">販売者を変更</button></div>` : `<div class="pd-act" style="display:flex;gap:6px;flex-wrap:wrap"><button data-sext="${esc(p.id)}">外部サイト ▾</button><button data-sedit="${esc(p.id)}">販売者を変更</button></div>`;
      return `<div class="pd-row sl-row${on ? ' sel' : ''}" data-srow="${esc(p.id)}"><label class="pd-chk"><input type="checkbox" data-schk="${esc(p.id)}"${on ? ' checked' : ''}${(p.kind === 'pending' && !toMyPack(p)) || (p.kind === 'dupw' && !p.merge) ? ' disabled' : ''}></label>
        <div class="pd-th" style="width:112px;height:63px">${thumb(p)}</div>
        <div class="pd-info"><div class="pd-name">${esc(p.name)}</div><div class="pd-path">今の場所：${esc((p.path || '').replace(/\/[^/]*$/, '') || '/')}/・${sz(p)}</div><div class="sl-why"><span class="sl-b ${bc}">${bt}</span><span class="note">${esc(p.note)}</span></div>${sellerFail.has(p.id) ? `<div class="kit-err">失敗：${esc(sellerFail.get(p.id))}</div>` : ''}</div>
        ${input}</div>`;
    };
    const tagNew = (g) => { if (!g.sid) return ''; const ex = sellerFolderExists(g.sid); return `<span class="pd-tag" style="${ex ? '' : 'background:var(--pri-soft);color:var(--pri)'}">${ex ? '既にあるフォルダ' : '新しく作るフォルダ'}</span>`; };
    const body = groups.map((g) => {
      const all = g.items.filter((p) => p.kind !== 'pending' && (p.kind !== 'dupw' || p.merge)), on = all.filter(sellerChecked);
      return `<div class="pd-g${g.cls}"><div class="pd-gh">${g.key === 'k:pending' || (g.key === 'k:dupw' && !all.length) ? '' : `<input type="checkbox" data-sgrp="${esc(g.key)}"${all.length && on.length === all.length ? ' checked' : ''} title="この組をすべて選ぶ／外す">`}<b>${esc(g.title)}</b>${g.sid ? `<span class="note raw">（${esc(g.sid)}）</span>` : ''}${tagNew(g)}${g.dest ? `<span class="note">→ ${esc(g.dest)}</span>` : ''}<span class="sp" style="flex:1"></span>${g.hint ? `<span class="note">${esc(g.hint)}</span>` : ''}<span class="note">${g.items.length} 作品</span></div>${g.items.map(row).join('')}</div>`;
    }).join('');
    const tab = (k, label, color, n) => `<button role="tab" data-sfilter="${k}" class="${show === k ? 'on' : ''}" aria-selected="${show === k}"${n || k === 'all' ? '' : ' disabled'}><i style="background:${color}"></i>${label}<b>${n}</b></button>`;
    const tabs = selPlan.length ? `<div class="sl-tabs" role="tablist" aria-label="表示">${tab('all', 'すべて', '#c5c9d2', selPlan.length)}${selPlan.some((p) => sellerFail.has(p.id)) ? tab('fail', '失敗', '#d64545', selPlan.filter((p) => sellerFail.has(p.id)).length) : ''}${tab('unknown', '販売者不明', '#8b91a1', by('unknown').length)}${tab('review', '要確認', '#c27a00', by('review').length)}${tab('pending', '未調査', '#dde0e6', by('pending').length)}${fixes.length ? tab('fix', '置き場所の修正', '#c27a00', fixes.length) : ''}${by('dupw').length ? tab('dupw', '同じ品番が複数', '#8b91a1', by('dupw').length) : ''}${tab('seller', `決まった（${sellers.size} 販売者）`, '#306fff', by('seller').length)}</div>` : '';
    $('[data-r=main]').innerHTML = `${selPlan.length ? sellerGuideHtml() : ''}${tabs}
      ${homeScan ? '' : '<div class="pd-explain"><b>ホームから読み込んでいません。</b><div class="note">移動先の「' + esc(cfg.root) + '」はホームの直下に作るため、移動した作品は読み込んだ場所の外に出て、重複チェックなどの対象から外れます。ホームを開いて読み込み直すと、仕分け後もまとめて管理できます。</div></div>'}
      ${body || '<div class="empty">' + (selPlan.length ? '表示する作品はありません' : '✓ 仕分けが必要な作品フォルダはありません（FC2-PPV-品番・HEYZO・カリビアンコムなどの品番の名前のフォルダが対象です）') + '</div>'}
      <datalist id="pd-sellers">${[...known.entries()].map(([sid, nm]) => `<option value="${esc(nm)}" label="${esc(sid)}"></option>`).join('')}</datalist>
      ${selPlan.length ? `<div class="sl-bar" data-r="slbar">${sellerBarHtml()}</div>` : nextButton()}`;
    if (!busy) status(sellerStage() === 1 ? `未調査 ${by('pending').length} 件。上の「販売者を調べる」で調べます（移動はしません）。` : sellerStage() === 2 ? '分からなかった作品は、外部サイトで確かめて販売者を入力できます。' : '内容を確認して、まずは「先頭1件だけ試す」で動きを確かめてください。削除はしません。');
  }
  // 「販売者別」の中に、その販売者ID のフォルダが既にあるか（ホームから読み込んだときだけ分かる）
  function sellerFolderExists(sid) {
    const cfg = sellerCfg();
    const R = folders.find((d) => d.isRoot); if (!R || (R.id && R.id !== 'root')) return false;
    const root = folders.find((d) => !d.isRoot && (d.parentId === R.id || !d.parentId || d.parentId === 'root') && d.name === cfg.root);
    return !!root && folders.some((d) => d.parentId === root.id && d.name.endsWith(`（${sid}）`));
  }
  // 販売者の入力（不明・要確認・変更）
  function askSeller(p) {
    return new Promise((resolve) => {
      const cur = p.seller || {};
      const fc2 = p.keys.some((k) => k.kind === 'fc2');
      const d = mkEl('pd-dlg');
      d.innerHTML = `<div class="box" style="width:min(520px,94vw)"><h3>販売者を入力</h3>
        <div class="note raw" style="margin-bottom:8px">${esc(p.name)}</div>
        <label style="display:block;margin:8px 0 4px">${fc2 ? '販売者名' : '販売者名（配信元。例：カリビアンコム）'}</label><input type="text" data-sn value="${esc(cur.name || '')}" style="width:100%;box-sizing:border-box;font:inherit;padding:6px 10px;border:1px solid #c5c9d2;border-radius:8px">
        <label style="display:block;margin:10px 0 4px">${fc2 ? '販売者ID（FC2 の販売者ページ adult.contents.fc2.com/users/〇〇/ の 〇〇）' : '販売者ID（英数字。例：carib）'}</label><input type="text" data-si value="${esc(cur.sid || '')}" style="width:100%;box-sizing:border-box;font:inherit;padding:6px 10px;border:1px solid #c5c9d2;border-radius:8px">
        <div class="note" style="margin-top:8px">既に同じ ID のフォルダがあれば、そこへ入れます。入力した内容は調べた結果より優先します。</div>
        <div class="acts" style="margin-top:14px">${p.seller ? '<button data-clear>入力を消す</button>' : ''}<span style="flex:1"></span><button data-no>キャンセル</button><button class="danger" data-yes style="background:#306fff;border-color:#306fff">保存</button></div></div>`;
      const done = (v) => { d.remove(); resolve(v); };
      d.querySelector('[data-no]').onclick = () => done(null);
      const c = d.querySelector('[data-clear]'); if (c) c.onclick = () => done({ clear: true });
      d.querySelector('[data-yes]').onclick = () => {
        const name = d.querySelector('[data-sn]').value.trim(), sid = d.querySelector('[data-si]').value.trim().replace(/^.*\/(users|writers|channels)\//, '').replace(/[\/?#].*$/, '');
        if (!name || !sid || !/^[A-Za-z0-9_.-]{1,64}$/.test(sid)) { d.querySelector('.note:last-of-type').textContent = '販売者名と販売者ID（英数字）を入れてください'; return; }
        done({ name, sid });
      };
      d.addEventListener('keydown', (e) => { if (e.key === 'Escape') done(null); });
      d.querySelector('[data-sn]').focus();
    });
  }
  async function editSeller(id) {
    const p = selPlan.find((x) => x.id === id); if (!p) return;
    const v = await askSeller(p); if (!v) return;
    if (v.clear) p.keys.forEach((k) => { if (sellerDb[k.key] && sellerDb[k.key].src === 'manual') delete sellerDb[k.key]; });
    else p.keys.forEach((k) => { sellerDb[k.key] = { name: v.name, sid: v.sid, src: 'manual', status: 'ok', at: Date.now() }; });
    saveSellerDb(); sellerSel.delete(id); log('info', `販売者を手入力：${p.name} → ${v.clear ? '（消去）' : v.name + '（' + v.sid + '）'}`);
    setView('seller');
  }
  // ---- 販売者を調べる（小さなウィンドウでページを順に開き、そのページの上のスクリプトから結果を受け取る） ----
  let lookupSeq = 0;
  function visitAndWait(win, origin, url, onChallenge, num) {
    return new Promise((resolve) => {
      const token = 'p' + Date.now().toString(36) + (++lookupSeq);
      let limit = 30000, timer = null, challenged = false, stage = '';
      let kwq = ''; try { kwq = new URL(url).searchParams.get('keyword') || ''; } catch (e) { /* 無視 */ }
      const off = () => { clearTimeout(timer); clearInterval(watch); window.removeEventListener('message', on); lookupSt.kick = null; };
      const arm = () => { clearTimeout(timer); timer = setTimeout(() => { off(); resolve({ status: challenged ? 'challenge' : 'timeout', stage: stage || 'no-response' }); }, limit); };
      const on = (e) => {
        if (e.origin !== origin || !e.data || e.data.type !== 'ppdup-seller') return;
        // 合言葉で照合する（画面を後から組み立てるサイトで # が消えたときは品番で照合）
        if (e.data.token ? e.data.token !== token : !((num && e.data.num === num) || (kwq && e.data.kw === kwq))) return;
        if (e.data.status === 'alive') { stage = `${e.data.stage}${e.data.path ? ' ' + e.data.path : ''}`; return; } // 動き始めた知らせ（結果ではない）
        if (e.data.status === 'challenge') {
          stage = 'challenge';
          if (!challenged) {
            challenged = true;
            // 最初の 2 回は、確認画面で止まっても人に頼まず、数秒待って開き直す（開き直すと通ることが多い）。それでもだめなら人に確認を頼む
            if (lookupSt.quick && e.data.gate !== 'age') { limit = 8000; arm(); return; }
            limit = 5 * 60 * 1000; arm(); lookupSt.kick = () => { off(); resolve({ status: 'severed' }); }; onChallenge(origin);
          }
          return;
        } // 確認を済ませるとページが切り替わり、もう一度知らせが来る
        off(); resolve(e.data);
      };
      // 確認画面（Cloudflare など）を通ると、サイト側の設定でこちらとのつながりが切れ、ウィンドウが「閉じた」ように見えることがある。
      // 確認画面のあとに閉じたように見えたときは「つながりが切れた」として扱い、呼び出し側で開き直して同じページを調べ直す
      const watch = setInterval(() => { if (win.closed) { off(); resolve({ status: challenged ? 'severed' : 'closed' }); } }, 500);
      window.addEventListener('message', on); arm();
      try { win.location.href = `${url}#ppdup-lookup=${token}`; } catch (err) { off(); resolve({ status: 'closed' }); }
    });
  }
  // 1 つの品番を調べる：FC2 は fd2ppv.cc → 見つからなければ fc2cmadb.com、それ以外は fd2ppv.cc で検索して作品ページの配信元
  async function lookupKey(win, k, onChallenge) {
    const stopped = (r) => r.status === 'closed' || r.status === 'challenge' || r.status === 'severed';
    // FANZA：メーカー品番（SONE-974）から作品ページ（?id=sone00974）を直接開く
    // 作品の情報をまとめて調べるとき、FC2 は fc2cmadb.com も必ず開く（サイトごとの販売者名を両方残すため）
    if (k.site === 'fd') { const a = await visitAndWait(win, FD2, `${FD2}/articles/${encodeURIComponent(k.num)}`, onChallenge, k.num); return { ...a, src: 'fd2ppv' }; }
    if (k.site === 'cm') { const b = await visitAndWait(win, CMADB, `${CMADB}/articles/${encodeURIComponent(k.num)}`, onChallenge, k.num); return { ...b, src: 'fc2cmadb' }; }
    if (k.kind === 'fanza') { const a = await visitAndWait(win, FANZA, `${FANZA}/av/content/?id=${encodeURIComponent(k.cid)}`, onChallenge, k.cid); return { ...a, src: 'fanza' }; }
    if (k.kind === 'fc2') {
      const a = await visitAndWait(win, FD2, `${FD2}/articles/${encodeURIComponent(k.num)}`, onChallenge, k.num);
      if (stopped(a) || a.status === 'ok') return { ...a, src: 'fd2ppv' };
      await sleep(sellerCfg().interval * 1000);
      const b = await visitAndWait(win, CMADB, `${CMADB}/articles/${encodeURIComponent(k.num)}`, onChallenge, k.num);
      if (stopped(b) || b.status === 'ok') return { ...b, src: 'fc2cmadb' };
      return { status: a.status === 'noseller' || b.status === 'noseller' ? 'noseller' : a.status === 'timeout' && b.status === 'timeout' ? 'timeout' : 'notfound', src: 'fd2ppv' };
    }
    const s = await visitAndWait(win, FD2, `${FD2}/articles/?keyword=${encodeURIComponent(k.kw)}`, onChallenge);
    if (stopped(s) || s.status === 'timeout') return { ...s, src: 'fd2ppv' };
    // 検索結果から、品番の数字が一致する作品を選ぶ（例：carib-033118_001 → 033118001）
    const hits = (s.hits || []).map((h) => String(h).split('/').pop()).filter((slug) => { const dg = slug.replace(/^[a-z][a-z0-9]*?-/i, '').replace(/\D/g, ''); return dg === k.digits && (!k.prefix || slug.toLowerCase().startsWith(k.prefix + '-')); });
    if (!hits.length) return { status: 'notfound', src: 'fd2ppv' };
    // 同じ番号が別のサイトにもあって決められないときは「販売者不明」にする（手入力で決める）
    if (new Set(hits.map((h) => h.split('-')[0].toLowerCase())).size > 1) return { status: 'ambiguous', src: 'fd2ppv' };
    const hit = hits[0];
    await sleep(sellerCfg().interval * 1000);
    const slug = String(hit).split('/').pop();
    const a = await visitAndWait(win, FD2, `${FD2}/articles/${encodeURIComponent(slug)}`, onChallenge, slug);
    return { ...a, src: 'fd2ppv' };
  }
  // ---- 小さなウィンドウの開き直し ----
  //   いま開いているウィンドウがあれば、閉じずに中身だけ空にして使い直す（閉じて開き直すと、ブラウザがポップアップを止めて続きが始まらないことがあるため）
  //   本当に閉じられていたときだけ開き直す。ブラウザに止められたら、押せば続く「続きを調べる」ボタンを画面の右下に出す（押した操作の中で開くので止められない）
  function askReopen() {
    return new Promise((res) => {
      const old = document.getElementById('pd-reopen'); if (old) old.remove();
      const el = document.createElement('div'); el.id = 'pd-reopen'; el.setAttribute('role', 'alertdialog'); el.setAttribute('aria-label', '調べる続き');
      el.style.cssText = 'position:fixed;right:24px;bottom:24px;z-index:2147483647;max-width:360px;padding:16px;border-radius:12px;background:#1d212a;color:#e8eaf0;box-shadow:0 12px 36px #0009;font:14px/1.6 system-ui,-apple-system,"Hiragino Sans",sans-serif';
      el.innerHTML = '<b>調べる続きを始めます</b><div style="margin:6px 0 12px;color:#c3c8d2">ブラウザが小さなウィンドウを止めました。下のボタンを押すと、続きから調べます。</div><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" data-no style="height:36px;padding:0 14px;border-radius:8px;border:1px solid #343a46;background:#232833;color:#e8eaf0;cursor:pointer">やめる</button><button type="button" data-go style="height:36px;padding:0 14px;border-radius:8px;border:1px solid #306fff;background:#306fff;color:#fff;font-weight:700;cursor:pointer">続きを調べる</button></div>';
      document.body.appendChild(el);
      el.querySelector('[data-go]').onclick = () => { const w = window.open('about:blank', 'ppdup-lookup' + (++lookupSeq), 'width=560,height=720'); if (w) { el.remove(); res(w); } else el.querySelector('div').textContent = 'まだ止められています。アドレスバーの右のアイコンから、このサイトのポップアップを「常に許可」にしてから、もう一度押してください。'; };
      el.querySelector('[data-no]').onclick = () => { el.remove(); res(null); };
    });
  }
  async function reopenWin(ref) {
    let alive = false; try { alive = !!ref.win && !ref.win.closed; } catch (e) { alive = false; }
    if (alive) { try { ref.win.location.href = 'about:blank'; await sleep(400); ref.parked = false; return true; } catch (e) { /* つながりが切れている：開き直す */ } }
    try { if (ref.win) ref.win.close(); } catch (e) { /* 無視 */ }
    await sleep(300);
    ref.win = window.open('about:blank', 'ppdup-lookup' + (++lookupSeq), 'width=560,height=720');
    if (!ref.win) ref.win = await askReopen();
    ref.parked = false;
    return !!ref.win;
  }
  // 最初の 1 回は捨てる：そのブラウザでまだ fd2ppv.cc を読めていないときは、先にトップを一度開き、数秒たったら空にして、2 回目から自動で調べる
  //   （Cloudflare などの確認で最初の読み込みが止まりやすいため。確認を通った記録が残るので、次からは通りやすい）
  const lookupWarm = new Set();
  async function lookupWarmUp(ref, k) {
    if (k && k.kind === 'fanza') return; // FANZA は確認画面が出ないので、捨てる必要はない
    if (lookupWarm.has(FD2)) return;
    lookupWarm.add(FD2);
    try { ref.win.location.href = FD2 + '/'; } catch (e) { return; }
    await sleep(6000);
    await reopenWin(ref);
  }
  // 1 つの品番を、開き直しも含めて調べる（販売者の一括調査・作品情報の「調べる」で共通）
  async function lookupWithRetry(ref, k, onCh) {
    lookupSt.quick = true;
    let r = await lookupKey(ref.win, k, onCh);
    // 確認画面（Cloudflare など）を挟んだあとや、結果が返らず止まったときは、同じ作品をもう一度調べる（ウィンドウは使い直す）
    //   最初の 2 回は自動で調べ直し、3 回目からは小さなウィンドウを前に出して確認を頼む（年齢確認はすぐ頼む）。確認を通ったあとにつながりが切れたとき（severed）は何度か開き直す
    const siteOf = (x) => (x.site === 'cm' ? 'fc2cmadb.com' : x.kind === 'fanza' ? 'FANZA' : 'fd2ppv.cc');
    const STAGE = { 'no-response': 'ページから応答なし（読み込めていない・別のページへ移った・つながりが切れた）', challenge: '確認画面のまま', article: '作品ページで読み取りが終わらない', other: '作品ページ以外を表示中' };
    const stageTx = (st) => (st ? STAGE[String(st).split(' ')[0]] + (String(st).includes(' ') ? `：${String(st).split(' ').slice(1).join(' ')}` : '') : '');
    let tmo = 0;
    for (let retry = 0, sev = 0; (r.status === 'severed' ? sev++ < 4 : r.status === 'timeout' ? tmo++ < 1 && retry++ < 3 : retry++ < 3) && (r.status === 'timeout' || r.status === 'challenge' || r.status === 'severed' || (r.status === 'closed' && retry === 1 && lookupSt.challenge)) && !window.__ppdupStop;) {
      log('info', `作品の調査：${siteOf(k)} でもう一度調べます（${r.status === 'severed' ? '確認画面のあとでつながりが切れたため' : r.status === 'challenge' ? '確認画面で止まったため' : r.status === 'timeout' ? '時間切れ・' + stageTx(r.stage) : r.status}）`, k.label);
      if (!(await reopenWin(ref))) break;
      lookupSt.challenge = ''; lookupSt.quick = retry < 2;
      r = await lookupKey(ref.win, k, onCh);
    }
    lookupSt.quick = false;
    if (r && r.status === 'timeout') log('warn', `作品の調査：${siteOf(k)} は時間切れのため飛ばしました（${stageTx(r.stage)}）`, k.label);
    if (r && r.info) saveWorkInfo(k, r);
    return r;
  }
  // FC2 はまず fd2ppv.cc だけを調べる（軽くするため）。次のときだけ fc2cmadb.com も調べる：
  //   見つからない・販売者が読めない・返事がない（時間切れなど）・タイトルや女優が空で情報が足りない
  const hardStop = (r) => r.status === 'closed' || r.status === 'challenge' || r.status === 'severed';
  const needMore = (r) => r.status !== 'ok' || !r.info || !r.info.title || !(r.info.actresses || []).length;
  async function lookupAny(ref, k, onCh) {
    if (k.kind !== 'fc2' || k.site) return lookupWithRetry(ref, k, onCh);
    const r1 = await lookupWithRetry(ref, { ...k, site: 'fd' }, onCh);
    if (hardStop(r1) || window.__ppdupStop || !needMore(r1)) return r1;
    await sleep(sellerCfg().interval * 500);
    const r2 = await lookupWithRetry(ref, { ...k, site: 'cm' }, onCh);
    if (hardStop(r2)) return r1.status === 'ok' ? r1 : r2;
    if (r1.status === 'ok') return r1;
    if (r2.status === 'ok') return r2;
    return { status: r1.status === 'noseller' || r2.status === 'noseller' ? 'noseller' : r1.status === 'timeout' && r2.status === 'timeout' ? 'timeout' : 'notfound', src: 'fd2ppv' };
  }
  // 調べている間の進み具合（「販売者を調べる」の枠に出す）
  let lookupSt = { on: false, total: 0, done: 0, ok: 0, miss: 0, cur: '', site: '', paused: false, t0: 0, challenge: '' };
  // 小さなウィンドウ：確認画面が出たら前に出し、済んだら小さくして画面の端に寄せる（ほかのサイトに埋め込めないため、完全には隠せない）
  // 小さく端に寄せると、ブラウザが裏のウィンドウの処理を遅くして読み取りが時間切れになることがあるため、大きさは変えずに PikPak の画面を前に戻すだけにする
  function parkWin(win) { try { window.focus(); } catch (e) { /* 無視 */ } }
  function showWin(win) { try { win.resizeTo(560, 720); win.moveTo(Math.max(0, (screen.availWidth - 560) / 2), Math.max(0, (screen.availHeight - 720) / 2)); win.focus(); } catch (e) { /* 無視 */ } }
  const lookupEta = () => { const d = lookupSt.done, el = Date.now() - lookupSt.t0; if (d < 2) return '残り時間を計算中…'; return `あと約 ${fmtDur((lookupSt.total - d) * el / d)}`; };
  // ---- 販売者名の違い：記録している販売者名とサイトの名前、またはサイトどうしの名前が違う作品 ----
  const SITE_NM = { fd2ppv: 'fd2ppv', fc2cmadb: 'fc2cmadb', fanza: 'FANZA' };
  function sellerDiffs() {
    const out = [];
    Object.entries(wInfo).forEach(([key, o]) => {
      const sites = Object.entries((o && o.sellers) || {}).filter(([st]) => st !== 'fanza'); if (!sites.length) return;
      const rec = sellerDb[key] && sellerDb[key].status === 'ok' ? sellerDb[key] : null;
      const names = new Set(sites.map(([, x]) => x.name)); if (rec) names.add(rec.name);
      if (names.size < 2) return;
      const sig = [...names].sort().join('|'); if (o.ack === sig) return; // 「いまの記録のまま」にしたもの（同じ違いのままなら出さない）
      out.push({ key, rec, sites, sig, sameSid: new Set(sites.map(([, x]) => x.sid).concat(rec ? [rec.sid] : []).filter(Boolean)).size === 1 });
    });
    return out;
  }
  function showSellerDiffs() {
    if (document.getElementById('pd-dlg')) return;
    const where = new Map(); workFiles().forEach((f) => { workKeys(f.name).forEach((k) => { if (!where.has(k.key)) where.set(k.key, { path: f.path || '/', label: k.label }); }); });
    const d = mkEl('pd-dlg');
    const draw = () => {
      const rows = sellerDiffs();
      d.innerHTML = `<div class="box" role="dialog" aria-label="販売者名の違い" style="width:min(1600px,98vw);max-width:98vw"><h3>販売者名の違い（${rows.length} 件）</h3>
        ${rows.length ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin:0 0 10px"><button data-sd-all="keep">全部いまの記録のまま（${rows.filter((x) => x.rec).length}）</button><button data-sd-all="fd2ppv">全部 fd2ppv の名前にする（${rows.filter((x) => x.sites.some(([st]) => st === 'fd2ppv')).length}）</button><button data-sd-all="fc2cmadb">全部 fc2cmadb の名前にする（${rows.filter((x) => x.sites.some(([st]) => st === 'fc2cmadb')).length}）</button></div>` : ''}
        <div class="note" style="margin-bottom:10px">記録している販売者名と、サイトの名前が違う作品です。どの名前にするかを選ぶと、<b>販売者の記録だけ</b>を変えます。<b>フォルダはここでは動かしません。</b>移動は「販売者ごとに仕分け」の一覧で確かめてから行います。</div>
        <div style="max-height:70vh;overflow:auto"><table class="sd-t" style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr><th style="text-align:left;padding:6px">品番</th><th style="text-align:left;padding:6px">いまの記録</th>${['fd2ppv', 'fc2cmadb'].map((st) => `<th style="text-align:left;padding:6px">${SITE_NM[st]}</th>`).join('')}<th style="text-align:left;padding:6px">いまのフォルダ</th><th style="padding:6px">どれにするか</th></tr></thead><tbody>
        ${rows.map((x) => { const w = where.get(x.key) || {}; const sv = Object.fromEntries(x.sites); const cell = (v) => (v ? `${esc(v.name)}<div class="note">${esc(v.sid || '')}</div>` : '<span class="note">—</span>');
          return `<tr style="border-top:1px solid var(--line,#ddd)"><td style="padding:6px;white-space:nowrap">${esc(w.label || x.key)}${x.sameSid ? '<div class="note">販売者 ID は同じ</div>' : ''}</td><td style="padding:6px">${x.rec ? cell(x.rec) + (x.rec.src === 'manual' ? '<div class="note">手入力</div>' : '') : '<span class="note">未記録</span>'}</td>${['fd2ppv', 'fc2cmadb'].map((st) => `<td style="padding:6px">${cell(sv[st])}</td>`).join('')}<td style="padding:6px;max-width:220px;overflow-wrap:anywhere" class="note">${esc(w.path || '（いまの読み込みにはありません）')}</td>
            <td style="padding:6px;white-space:nowrap"><button data-sd-keep="${esc(x.key)}"${x.rec ? '' : ' disabled'}>いまの記録のまま</button>${['fd2ppv', 'fc2cmadb'].map((st) => `<button data-sd-pick="${esc(x.key)}" data-st="${st}"${sv[st] ? '' : ' disabled'}>${SITE_NM[st]} の名前にする</button>`).join('')}</td></tr>`; }).join('') || '<tr><td colspan="6" style="padding:12px">違いのある作品はありません</td></tr>'}
        </tbody></table></div>
        <div class="acts"><button data-close style="background:#306fff;border-color:#306fff;color:#fff;font-weight:700">閉じる</button></div></div>`;
      d.querySelector('[data-close]').onclick = close;
      d.querySelectorAll('[data-sd-keep]').forEach((b) => { b.onclick = () => { const x = rows.find((y) => y.key === b.dataset.sdKeep); if (!x) return; wInfo[x.key] = { ...wInfo[x.key], ack: x.sig }; lsSetJson(LS_WINFO, wInfo); log('info', `販売者名の違い：${x.key} はいまの記録のまま`); draw(); }; });
      // 名前を選んだ作品も「確かめ済み」にして一覧から消す（同じ位置を続けて押していけるように）
      const pick = (x, st) => { const v = Object.fromEntries(x.sites)[st]; if (!v) return false; sellerDb[x.key] = { name: v.name, sid: v.sid, src: 'manual', status: 'ok', at: Date.now(), from: st }; wInfo[x.key] = { ...wInfo[x.key], ack: x.sig }; return true; };
      d.querySelectorAll('[data-sd-all]').forEach((b) => { b.onclick = () => {
        const how = b.dataset.sdAll, list = rows.filter((x) => (how === 'keep' ? x.rec : x.sites.some(([st]) => st === how)));
        if (!list.length || !window.confirm(`${list.length} 件を「${how === 'keep' ? 'いまの記録のまま' : SITE_NM[how] + ' の名前にする'}」にします。\n変わるのは販売者の記録だけで、フォルダは動かしません。よろしいですか？`)) return;
        list.forEach((x) => { if (how === 'keep') wInfo[x.key] = { ...wInfo[x.key], ack: x.sig }; else pick(x, how); });
        lsSetJson(LS_WINFO, wInfo); saveSellerDb(); log('info', `販売者名の違い：${list.length} 件をまとめて「${how === 'keep' ? 'いまの記録のまま' : SITE_NM[how] + ' の名前'}」にした（フォルダはまだ動かしていない）`); draw();
      }; });
      d.querySelectorAll('[data-sd-pick]').forEach((b) => { b.onclick = () => { const x = rows.find((y) => y.key === b.dataset.sdPick); const v = x && Object.fromEntries(x.sites)[b.dataset.st]; if (!v) return; pick(x, b.dataset.st); lsSetJson(LS_WINFO, wInfo); saveSellerDb(); log('info', `販売者名の違い：${x.key} を ${SITE_NM[b.dataset.st]} の「${v.name}」にした（フォルダはまだ動かしていない）`); draw(); }; });
    };
    const close = () => { d.remove(); document.removeEventListener('keydown', onKey, true); if (view === 'seller') { selPlan = buildSellerPlan(folders); renderSeller(); } };
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); } };
    document.addEventListener('keydown', onKey, true);
    d.addEventListener('mousedown', (e) => { if (e.target === d) close(); });
    draw();
  }
  // 作品の情報をまとめて調べる対象（scope：'missing' 情報がまだない作品だけ／'all' すべて）。FC2 と ABC-123 の形（FANZA）
  const hasInfo = (key) => { const o = wInfo[key]; return !!(o && (o.title || (o.sellers && Object.keys(o.sellers).length))); };
  function infoTargets(scope) {
    const out = [], seen = new Set();
    workFiles().forEach((f) => { const { k } = infoKeyOf(f.id, f.name); if (!k || k.noLookup || k.kind === 'brand' || seen.has(k.key)) return; seen.add(k.key); if (scope === 'all' || !hasInfo(k.key)) out.push(k); });
    return out;
  }
  async function runSellerLookup(mode) {
    if (busy) return;
    const info = mode === 'missing' || mode === 'all';
    const keys = []; const seen = new Set();
    if (info) keys.push(...infoTargets(mode));
    else selPlan.filter((p) => p.kind === 'pending').forEach((p) => p.keys.forEach((k) => { if (k.kind !== 'brand' && !sellerDb[k.key] && !seen.has(k.key)) { seen.add(k.key); keys.push(k); } }));
    if (!keys.length) { status(info ? '調べる作品はありません（情報はそろっています）。' : '未調査の作品はありません。'); return; }
    if (info && !window.confirm(`作品の情報（女優・タイトル・タグ・配信日・収録時間・サイトごとの販売者名）を ${keys.length} 作品分調べます。\n\n・FC2 は fd2ppv.cc を開き、足りない情報があるときだけ fc2cmadb.com も開きます。ABC-123 の形は FANZA を開きます\n・目安：約 ${Math.max(1, Math.round(keys.length * (sellerCfg().interval + 6) * 1.6 / 60))} 分（確認画面が出るとさらにかかります）。途中で一時停止・中断できます\n・記録済みの販売者は変えません（違いは「販売者名の違い」で確かめられます）。手入力した女優名も上書きしません\n\n始めますか？`)) return;
    // ポップアップを止められないよう、押した直後に開く
    let win = window.open('about:blank', 'ppdup-lookup', 'width=560,height=720');
    if (!win) { status('小さなウィンドウを開けませんでした。ブラウザのアドレスバーで、このサイトのポップアップを許可してから、もう一度押してください。'); return; }
    const cfg = sellerCfg();
    busy = true; window.__ppdupStop = false; renderNav(); renderToolbar();
    let done = 0, ok = 0, miss = 0, stop = '', parked = false;
    lookupSt = { on: true, total: keys.length, done: 0, ok: 0, miss: 0, cur: '', site: '', paused: false, t0: Date.now(), challenge: '', info };
    refreshSellerChrome();
    for (const k of keys) {
      while (lookupSt.paused && !window.__ppdupStop) await sleep(300);
      if (window.__ppdupStop) { stop = '中断しました'; break; }
      lookupSt.cur = k.label; lookupSt.site = k.kind === 'fanza' ? 'FANZA' : k.kind === 'fc2' ? 'fd2ppv.cc（足りなければ fc2cmadb.com）' : 'fd2ppv.cc'; lookupSt.challenge = '';
      status(`${info ? '作品の情報' : '販売者'}を調べています… ${done + 1}/${keys.length}：${k.label}`, done / keys.length, lookupEta());
      refreshSellerChrome();
      const onCh = (origin) => { lookupSt.challenge = origin.replace('https://', ''); showWin(win); parked = false; refreshSellerChrome(); status(`${origin.replace('https://', '')} の確認画面が出ています。開いた小さなウィンドウで確認を済ませてください（済むと自動で続きます）：${k.label}`, done / keys.length);};
      const ref = { win, parked };
      await lookupWarmUp(ref, k);
      const r = ref.win ? await lookupAny(ref, k, (o) => { win = ref.win; onCh(o); }) : { status: 'closed' };
      win = ref.win; parked = ref.parked;
      if (!win) { stop = '小さなウィンドウを開き直せませんでした（ポップアップを許可してください）'; break; }
      lookupSt.challenge = '';
      if (!parked && r.status !== 'closed' && r.status !== 'challenge') { parkWin(win); parked = true; }
      if (r.status === 'closed') { stop = 'ウィンドウが閉じられたため止めました'; break; }
      if (r.status === 'challenge' || r.status === 'severed') { stop = `確認画面のあと、続きを読み取れなかったため止めました（もう一度「${info ? '情報がない作品だけ調べる' : '販売者を調べる'}」を押すと、続きから調べます）`; break; }
      if (r.status === 'timeout') { log('warn', '販売者の調査が時間切れ', k.label); miss++; }
      else if (info) {
        // 情報を調べるとき：記録済みの販売者は変えない（まだ分かっていない作品だけ埋める）。FANZA のメーカーは作品情報にだけ残す
        if (k.kind !== 'fanza' && r.status === 'ok' && !(sellerDb[k.key] && sellerDb[k.key].status === 'ok')) { sellerDb[k.key] = { name: String(r.name || '').slice(0, 120), sid: String(r.sid || '').slice(0, 64), src: r.src, status: 'ok', studio: !!r.studio, at: Date.now() }; saveSellerDb(); }
        if (hasInfo(k.key)) ok++; else miss++;
      }
      else {
        sellerDb[k.key] = r.status === 'ok' ? { name: String(r.name || '').slice(0, 120), sid: String(r.sid || '').slice(0, 64), src: r.src, status: 'ok', studio: !!r.studio, at: Date.now() } : { status: r.status === 'notfound' || r.status === 'ambiguous' ? r.status : 'noseller', src: r.src, at: Date.now() };
        if (r.status === 'ok') ok++; else miss++;
        saveSellerDb();
      }
      done++;
      Object.assign(lookupSt, { done, ok, miss });
      // 分かった作品から順に一覧へ（3 件ごとに作り直す）
      if (view === 'seller' && (done % 3 === 0 || done === keys.length)) { const sc = $('[data-r=main]').scrollTop; selPlan = buildSellerPlan(folders); renderSeller(); $('[data-r=main]').scrollTop = sc; }
      else refreshSellerChrome();
      await sleep(cfg.interval * 1000);
    }
    try { win.close(); } catch (e) { /* 無視 */ }
    lookupSt.on = false;
    busy = false; sellerAck = false; setView('seller');
    if (info) {
      const nd = sellerDiffs().length;
      status(`${stop ? stop + '。' : ''}${done} 作品の情報を調べました（読めた ${ok}・読めなかった ${miss}）。${nd ? `販売者名がサイトで違う作品が ${nd} 件あります（「販売者名の違い」で確かめられます）。` : ''}`);
      log('info', `作品の情報をまとめて調べた：${done} 件（読めた ${ok}・読めなかった ${miss}）${stop ? '・' + stop : ''}`);
      return;
    }
    status(`${stop ? stop + '。' : ''}${done} 件を調べました（販売者が分かった ${ok} 件・分からなかった ${miss} 件）。調べた結果は保存済みです。`);
    log('info', `販売者を調べた：${done} 件（判明 ${ok}・不明 ${miss}）${stop ? '・' + stop : ''}`);
  }
  // ---- 移動 ----
  async function runSeller(onlyFirst, quiet) {
    // 深いフォルダから先に動かす（入れ子の作品を外へ出してから外側を動かすため）
    const targets = selPlan.filter((p) => (p.kind !== 'pending' || toMyPack(p)) && (p.kind !== 'dupw' || p.merge) && sellerChecked(p)).sort((a, b) => (b.depth || 0) - (a.depth || 0)).slice(0, onlyFirst ? 1 : undefined);
    if (!targets.length) { status('チェックの入った作品がありません'); return; }
    if (!ensureSession('seller')) return;
    const cfg = sellerCfg();
    const R = folders.find((d) => d.isRoot);
    const homeScan = !!R && (!R.id || R.id === 'root');
    busy = true; renderNav(); window.__ppdupStop = false;
    let ok = 0, skip = 0, back = 0, merged = 0; const failed = [];
    const lists = new Map(); // フォルダ → 中身（同名の確認用）
    const listOf = async (pid) => { if (!lists.has(pid)) lists.set(pid, await apiList(pid)); return lists.get(pid); };
    // ホーム直下の「販売者別」と、その中のフォルダを用意（無ければ作る）
    const addCache = (id, name, pid) => {
      if (!homeScan || folders.some((d) => d.id === id)) return;
      const np = folders.find((d) => d.id === pid) || R;
      folders.push({ id, name, parentId: pid, path: ((np && !np.isRoot && np.path) || '') + '/' + name, trail: [...((np && np.trail) || [pid]), id] });
    };
    const ensureDir = async (pid, name, match) => {
      const l = await listOf(pid);
      const ex = l.find((x) => x.kind === 'drive#folder' && (match ? match(x.name) : x.name === name));
      if (ex) { addCache(ex.id, ex.name, homeScan && pid === '' ? R.id : pid); return ex.id; }
      const id = await apiMkdir(pid, name);
      l.push({ id, name, kind: 'drive#folder' }); lists.set(id, []);
      addCache(id, name, homeScan && pid === '' ? R.id : pid);
      return id;
    };
    try {
      const rootId = await ensureDir('', cfg.root);
      let mp = null;
      var myPackId = async () => { if (mp) return mp; const h = await listOf(''); const f = h.find((x) => x.kind === 'drive#folder' && (x.folder_type === 'DOWNLOAD' || x.name === 'My Pack')); mp = f ? f.id : await ensureDir('', 'My Pack'); return mp; };
      for (const p of targets) {
        if (window.__ppdupStop) break;
        status(`移動中… ${ok + skip + 1}/${targets.length}：${p.name}`, (ok + skip) / targets.length);
        if (p.id === rootId) { skip++; continue; }
        try {
        // 同じ品番のフォルダ：ほかのフォルダの中身をまとめ先へ移し、空になったフォルダはゴミ箱へ（同じ名前は (1) を付ける）
        if (p.kind === 'dupw') {
          const into = await apiList(p.keepId), names = new Set(into.map((x) => x.name.toLowerCase()));
          for (const oid of p.mergeIds) {
            const kids = await apiList(oid);
            for (const k of kids) {
              let nm = k.name;
              if (names.has(nm.toLowerCase())) { const m = nm.match(/^(.*?)(\.[A-Za-z0-9]{2,5})?$/); let i = 1; do { nm = `${m[1]}(${i++})${m[2] || ''}`; } while (names.has(nm.toLowerCase())); await apiRename(k.id, nm); }
              names.add(nm.toLowerCase());
            }
            if (kids.length) await apiMove(kids.map((k) => k.id), p.keepId);
            await api('/files:batchTrash', { method: 'POST', body: JSON.stringify({ ids: [oid] }) });
            const it = folders.find((d) => d.id === oid); if (it) dropFromScan(it);
          }
          ok++; merged++; saveAll(); log('info', `同じ品番のフォルダをまとめました：${p.name} → ${p.keepPath}`); await sleep(100); continue;
        }
        let dest = toMyPack(p) ? await myPackId() : p.kind === 'seller' ? await ensureDir(rootId, sellerFolderName(p.seller), (nm) => nm.endsWith(`（${p.seller.sid}）`))
          : await ensureDir(rootId, p.kind === 'unknown' ? cfg.unknown : cfg.review);
        // 移動先に同じ名前があれば「要確認」へ、そこにもあれば移動しない
        const same = (pid) => listOf(pid).then((l) => l.some((x) => x.id !== p.id && x.name.toLowerCase() === p.name.toLowerCase()));
        // 移動先がその作品フォルダ自身・その中になるときは移動しない（「販売者別」の中から読み込んだときなど）
        if (dest === p.id || (folders.find((d) => d.id === dest) || {}).trail?.includes(p.id)) { skip++; log('warn', `移動先が作品フォルダ自身のため移動しませんでした：${p.name}`); continue; }
        if (await same(dest)) {
          const rv = await ensureDir(rootId, cfg.review);
          if (dest === rv || await same(rv)) { skip++; log('warn', `移動先に同じ名前があるため移動しませんでした：${p.name}`); continue; }
          dest = rv;
        }
        // 実行の直前に、移動元にまだあるかを確認
        const src = await apiList(p.parentId);
        if (!src.some((x) => x.id === p.id)) throw new Error('見つかりません（読み込み直してください）: ' + p.name);
        await apiMove([p.id], dest);
        (lists.get(dest) || []).push({ id: p.id, name: p.name, kind: 'drive#folder' });
        const it = folders.find((d) => d.id === p.id);
        if (it) { if (homeScan && folders.some((d) => d.id === dest)) cacheMoveFolder(p.id, dest); else dropFromScan(it); }
        ok++; if (toMyPack(p) && dest === (await myPackId())) back++; sellerFail.delete(p.id); saveAll();
        } catch (err) {
          // ログイン切れ以外は、その作品だけ飛ばして続ける
          if (err.session) throw err;
          skip++; failed.push(p.name); sellerFail.set(p.id, err.message || String(err)); log('error', `移動できませんでした：${p.name}（${err.message}）`, 'seller');
        }
        await sleep(100);
      }
    } catch (err) { saveAll(); busy = false; setView('seller'); handleErr(err, 'seller', `停止：${err.message}（${ok} 作品完了）`); return; }
    if (meta) { meta.nfo = folders.length; meta.nfi = files.length; lsSetJson(LS_META, meta); }
    busy = false; if (failed.length) sellerFilter = 'fail'; setView('seller');
    status(`${ok} 作品を移動しました${back ? `（My Pack へ戻した ${back} 作品は、1 から振り分け直します）` : ''}${skip ? `（移動しなかった ${skip} 件${failed.length ? `・うち失敗 ${failed.length} 件：${failed.slice(0, 3).join('・')}${failed.length > 3 ? ' …' : ''}（ログに詳細）` : '：同じ名前があった・移動先が自分自身など'}）` : ''}。`);
    log('info', `販売者ごとに仕分け ${ok} 作品${back ? `・My Pack へ戻した ${back}` : ''}${merged ? `・同じ品番をまとめた ${merged}` : ''}${skip ? `（移動しなかった ${skip}）` : ''}`); refreshView();
    if ((back || merged) && !quiet) askReflow(back, merged);
    return { back, merged };
  }
  // My Pack へ戻した作品・同じ品番をまとめたフォルダは、1（読み込み）からもう一度流す（名前・仕分け・重複の確認・販売者の仕分けをやり直す）
  function askReflow(back, merged) {
    if (document.getElementById('pd-dlg')) return;
    const d = mkEl('pd-dlg');
    d.innerHTML = `<div class="box" role="dialog" aria-label="1 から処理し直す" style="width:min(560px,94vw)"><h3>1 からもう一度処理しますか？</h3>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px">
        ${back ? `<div>📥 My Pack へ戻した作品：<b>${back}</b></div>` : ''}
        ${merged ? `<div>🗂 同じ品番をまとめたフォルダ：<b>${merged}</b></div>` : ''}
      </div>
      <div class="note" style="margin-bottom:16px">ホーム全体を読み込み直してから、1 のステップから順に進みます。ファイル名・作品ごとの仕分け・<b>重複の確認（「販売者別」の中の同じ品番とも比べます）</b>・販売者ごとの仕分けを、もう一度通します。読み込みは読むだけで、ファイルは変更しません。</div>
      <div class="acts"><button data-no>あとで</button><button data-go style="background:#306fff;border-color:#306fff;color:#fff;font-weight:700">1 から処理する</button></div></div>`;
    const close = () => { d.remove(); document.removeEventListener('keydown', onKey, true); };
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); } };
    document.addEventListener('keydown', onKey, true);
    d.querySelector('[data-no]').onclick = () => { close(); status(`あとで「↻ 再スキャン」から 1 の順に進めば、戻した作品も振り分け直されます。`); };
    d.querySelector('[data-go]').onclick = () => { close(); if (busy) return; afterScan = null; log('info', `1 から処理し直す（My Pack へ戻した ${back}・まとめた ${merged}）`); runScan({ home: true }); };
    d.querySelector('[data-go]').focus();
  }

