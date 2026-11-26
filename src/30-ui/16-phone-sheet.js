  // ---------- スマホ・狭い画面：下の引き出し（デリログと同じ考え方） ----------
  //   0＝閉じる（今の画面でよく使う 2 つだけ）／1＝半分（メニュー）／2＝全部（今の画面の詳しい操作）
  //   ボタンは画面にある本物のボタンを押す「代わり」。動きは本物と同じ（作り直さない）
  const sheet = document.createElement('div'); sheet.className = 'pd-sheet'; sheet.dataset.st = '0';
  sheet.innerHTML = '<button class="sh-h" title="引き出す・しまう（上下にドラッグ・押す）" aria-label="引き出す・しまう"><i></i></button><div class="sh-b"></div><div class="sh-in"><div class="sh-m"></div><div class="sh-x"></div></div>';
  root.appendChild(sheet);
  // iPhone・iPad の Safari は画面の下に浮いたツールバーがあり、その近くを押すと最初の 1 回はツールバーが反応して
  // こちらのボタンに届かない。ブラウザで開いているとき（ホーム画面のアプリでないとき）は、その分だけ引き出しを上げる
  const iosSafari = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone;
  if (iosSafari && !standalone) root.classList.add('ios-bar');
  let shRefs = [], shT = null;
  const shOn = () => root.classList.contains('narrow') && root.classList.contains('on');
  // 上に重なる画面（リンク追加・解凍・プレーヤー・確認など）を開いている間は、引き出しを隠す
  const shCover = () => !!document.querySelector('#pd-add,#pd-unzip,#pd-player,#pd-ql,#pd-dlg,#pd-set,#pd-frames,#pd-cmp');
  setInterval(() => { if (shOn()) sheet.classList.toggle('covered', shCover()); }, 400);
  const shSet = (n) => { sheet.dataset.st = String(Math.max(0, Math.min(2, n))); };
  const shBtn = (el, cls) => {
    if (!el) return '';
    const i = shRefs.push(el) - 1;
    const SHORT = { lbpv: '▶ プレビュー', lbext: '↗ 外部プレーヤー' };
    const sk = Object.keys(SHORT).find((k) => el.dataset[k] !== undefined);
    const tx = sk ? SHORT[sk] : (el.querySelector('span:not(.rb)') || el).textContent.replace(/\s+/g, ' ').trim();
    const ic = el.querySelector('svg') ? el.querySelector('svg').outerHTML : '';
    return `<button data-shref="${i}" class="${cls || ''}${el.classList.contains('pri') ? ' pri' : ''}${el.classList.contains('on') ? ' on' : ''}${el.classList.contains('red') || el.classList.contains('dng') ? ' red' : ''}"${el.disabled ? ' disabled' : ''} title="${esc(el.getAttribute('title') || el.dataset.ttl || tx)}">${ic}<span>${esc(tx)}</span></button>`;
  };
  function renderSheet() {
    if (!shOn()) return;
    shRefs = [];
    const lib = document.getElementById('pd-lib');
    const all = (sel, scope) => [...(scope || root).querySelectorAll(sel)].filter((b) => !b.closest('.pd-sheet'));
    let prim = [], ctx = [];
    if (lib && libSt) {
      const ft = all('.lk-ft button', lib);
      prim = lib.querySelector('[data-lbpv]') ? [lib.querySelector('[data-lbpv]'), lib.querySelector('[data-lbext]')] : ft.slice().sort((x, y) => y.classList.contains('pri') - x.classList.contains('pri')).slice(0, 2);
      ctx = [...all('.lk-hd button:not(.x)', lib), ...ft.filter((x) => !prim.includes(x))];
    } else if (view === 'tree') {
      const play = root.querySelector('[data-r=tsel] [data-ta=play]');
      prim = [play || null];
      if (!play) prim = [];
      ctx = [...all('[data-r=tb] button').filter((x) => !x.closest('.tr-path')), ...all('[data-r=tsel] button:not([data-ta=play])')];
    } else {
      const dk = all('.sv-dock .dk-b button').sort((x, y) => (y.classList.contains('pri') - x.classList.contains('pri')) || ((y.dataset.a === 'rescan') - (x.dataset.a === 'rescan')));
      prim = dk.slice(0, 2); ctx = dk.slice(2);
    }
    prim = prim.filter(Boolean);
    const put = (el, html) => { if (el._html !== html) { el._html = html; el.innerHTML = html; } };
    const b = sheet.querySelector('.sh-b');
    const bHtml = (prim.length ? prim.map((x) => shBtn(x, 'p')).join('') : view === 'tree' && !(lib && libSt) ? '<button class="p" disabled title="一覧で動画を選ぶと再生できます"><span>▶ 再生（動画を選ぶ）</span></button>' : '') + (ctx.length ? `<button class="p sub" data-shmore title="今の画面の操作をすべて出す"><span>⋯ 操作</span></button>` : '');
    put(b, bHtml);
    // メニュー：左メニューと同じ項目
    const rail = [...root.querySelectorAll('.rail > button:not(.rl-acct)')];
    put(sheet.querySelector('.sh-m'), rail.map((x) => shBtn(x, 'm')).join(''));
    put(sheet.querySelector('.sh-x'), ctx.length ? `<b>この画面の操作</b><div>${ctx.map((x) => shBtn(x, 'x')).join('')}</div>` : '');
    if (LANG === 'en') sheet.querySelectorAll('*').forEach(trNode);
  }
  let shTouch = false;
  sheet.addEventListener('pointerdown', () => { shTouch = true; }, true);
  addEventListener('pointerup', () => { if (shTouch) { shTouch = false; } }, true);
  addEventListener('pointercancel', () => { shTouch = false; }, true);
  const shQueue = () => { if (shTouch) { clearTimeout(shT); shT = setTimeout(shQueue, 150); return; } clearTimeout(shT); shT = setTimeout(() => { try { renderSheet(); } catch (e) { /* 初期化の途中 */ } }, 60); };
  new MutationObserver((ms) => { if (!shOn()) return; if (ms.every((m) => sheet.contains(m.target))) return; shQueue(); }).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'class'] });
  sheet.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.classList.contains('sh-h')) { if (!sheet._dragged) shSet(sheet.dataset.st === '0' ? 1 : 0); sheet._dragged = false; return; }
    if (b.dataset.shmore !== undefined) { shSet(+sheet.dataset.st === 2 ? 0 : 2); return; }
    const el = shRefs[+b.dataset.shref]; if (!el || !el.isConnected) { renderSheet(); return; }
    el.click();
    if (b.classList.contains('m') || b.classList.contains('x')) shSet(0);
  });
  // つまみを上下にドラッグ：上で引き出す・下でしまう
  sheet.querySelector('.sh-h').addEventListener('pointerdown', (e) => {
    const y0 = e.clientY, st0 = +sheet.dataset.st; sheet._dragged = false;
    const h = sheet.querySelector('.sh-h'); try { h.setPointerCapture(e.pointerId); } catch (er) { /* 無視 */ }
    const mv = (ev) => { const dy = ev.clientY - y0; if (Math.abs(dy) > 8) sheet._dragged = true; sheet.style.setProperty('--shdy', Math.max(-60, Math.min(60, dy)) + 'px'); };
    const up = (ev) => {
      h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', up);
      sheet.style.removeProperty('--shdy');
      const dy = ev.clientY - y0; if (sheet._dragged) shSet(st0 + (dy < -40 ? (dy < -220 ? 2 : 1) : dy > 40 ? (dy > 220 ? -2 : -1) : 0));
    };
    h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up);
  });
  // 引き出しの外（一覧など）を押したら閉じる
  root.addEventListener('pointerdown', (e) => { if (sheet.dataset.st !== '0' && !sheet.contains(e.target)) shSet(0); }, true);
  function renderRail() {
    root.querySelectorAll('.rail [data-rail]').forEach((b) => {
      const k = b.dataset.rail;
      b.classList.toggle('on', libSt ? k === 'lib-' + libSt.tab : k === 'tree' ? view === 'tree' : k === 'flow' ? view !== 'tree' && mode === 'flow' : false);
      if (k === 'tree' || k === 'scan' || k === 'flow') b.disabled = busy;
    });
    renderAcct();
    [['dl', libBadge.dl], ['trash', libBadge.trash], ['cand', (() => { try { const db = mediaAll(); return Object.keys(db).filter((k) => db[k].tri === 'del').length; } catch (e) { return 0; } })()]].forEach(([k, n]) => { const e = root.querySelector(`[data-r=rb-${k}]`); if (e) e.textContent = n ? (n > 99 ? '99+' : n) : ''; });
  }
  // PikPak のログイン状態と同期（左メニューの下・上のバーのアカウントボタン）
  function renderAcct() {
    const ok = sessionValid(), sc = syncCfg();
    const sync = sc.on && sc.asked ? '同期オン' : '同期オフ';
    const syncT = sc.on && sc.asked && sc.last ? '前回 ' + fmtDate(sc.last) : '';
    const card = root.querySelector('[data-r=acct]'), btn = root.querySelector('[data-r=acctbtn]');
    const ic = '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/></svg>';
    if (card) { card.className = 'rl-acct ' + (ok ? 'ok' : 'ng'); card.innerHTML = `<i>${ic}</i><span><b>${ok ? 'PikPak にログイン中' : 'ログインが必要です'}</b><small>● ${esc(ok ? sync : 'PikPak の画面でログインしてください')}</small>${ok && syncT ? `<small class="t">${esc(syncT)}</small>` : ''}</span>`; }
    if (btn) { btn.className = 'hbtn hacct ' + (ok ? 'ok' : 'ng'); btn.innerHTML = `${ic}<span>${ok ? 'ログイン中' : '要ログイン'}</span>`; }
  }
  function openAcct(anchor) {
    let m = document.getElementById('pd-acct'); if (m) { m.remove(); return; }
    const ok = sessionValid(), sc = syncCfg();
    m = document.createElement('div'); m.id = 'pd-acct';
    m.innerHTML = `<b>${ok ? 'PikPak にログイン中' : 'ログインが必要です'}</b><small>${ok ? 'Dedupe は PikPak のログインをそのまま使います（パスワードは扱いません）' : 'PikPak の画面でログインしてから、もう一度開いてください'}</small>
      <div class="ln"><span>PikPak で同期</span><b>${sc.on && sc.asked ? 'オン' : 'オフ'}</b></div>${sc.last ? `<div class="ln"><span>前回の同期</span><b>${fmtDate(sc.last)}</b></div>` : ''}
      ${quota && quota.usage ? `<div class="ln"><span>使用量</span><b>${fmtCap(quota.usage)} / ${quota.limit > 0 ? fmtCap(quota.limit) : '—'}</b></div>` : ''}
      <div class="acts"><button data-ac="sync"${ok && sc.on && sc.asked ? '' : ' disabled'}>今すぐ同期</button><button data-ac="set">同期の設定</button></div>`;
    document.body.appendChild(m);
    const r = anchor.getBoundingClientRect();
    m.style.top = (r.bottom + 8 + m.offsetHeight > innerHeight ? Math.max(8, r.top - m.offsetHeight - 8) : r.bottom + 8) + 'px';
    m.style.left = Math.max(8, Math.min(innerWidth - m.offsetWidth - 8, r.right - m.offsetWidth)) + 'px';
    const off = (ev) => { if (!m.contains(ev.target) && !anchor.contains(ev.target)) { m.remove(); document.removeEventListener('mousedown', off, true); } };
    document.addEventListener('mousedown', off, true);
    m.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-ac]'); if (!b || b.disabled) return;
      m.remove(); document.removeEventListener('mousedown', off, true);
      if (b.dataset.ac === 'sync') syncNow('手動').then((x) => { status(x ? 'PikPak と同期しました' : '同期できませんでした（「ログ」で理由を確認できます）'); renderAcct(); });
      else openSettings('info');
    });
  }
  // 左メニュー：広い表示／アイコンだけ（PC）、右から出す（スマホ・狭い画面）
  const LS_NAVMIN = 'ppdup:navmin:v1';
  const narrowUI = () => innerWidth < 760 || root.classList.contains('phone');
  // 3 段階：wide＝広い表示／min＝アイコンだけ／hide＝隠す（右のふちのつまみで引き出す・しまう）
  const LS_NAV = 'ppdup:nav:v1';
  const NAV_W = { wide: 236, min: 78, hide: 0 };
  function navState() {
    let v = null; try { v = localStorage.getItem(LS_NAV); if (!v) v = localStorage.getItem(LS_NAVMIN) === '1' || innerWidth < 1024 ? 'min' : 'wide'; } catch (e) { v = 'wide'; }
    return NAV_W[v] != null ? v : 'wide';
  }
  function setNav(v) { try { localStorage.setItem(LS_NAV, v); if (v !== 'hide') localStorage.setItem('ppdup:navlast:v1', v); } catch (e) { /* 無視 */ } applyNav(); }
  const navLast = () => { try { const v = localStorage.getItem('ppdup:navlast:v1'); return v === 'min' ? 'min' : 'wide'; } catch (e) { return 'wide'; } };
  function applyNav() {
    const st = navState();
    root.classList.toggle('navmin', st === 'min'); root.classList.toggle('navhide', st === 'hide'); root.classList.toggle('narrow', narrowUI());
    const b = root.querySelector('[data-a=navtoggle]');
    if (b) b.title = narrowUI() ? 'メニューを開く・閉じる' : st === 'hide' ? '左のメニューを出す' : st === 'min' ? '左のメニューを広げる（いまはアイコンだけ）' : '左のメニューをアイコンだけにする（いまは広い表示）';
    const g = root.querySelector('.rl-grip');
    if (g) g.title = st === 'hide' ? '左のメニューを引き出す（右へドラッグ・押す）' : '左のメニューをしまう（左へドラッグ・押す）。右へドラッグで広げる';
  }

  // ---- マウスを乗せたときの説明（アイコンだけのボタン・アイコンだけの左メニュー） ----
  //   ブラウザ標準の title は出るまで時間がかかり気づきにくいため、すぐ出す吹き出しにする
  const tipEl = document.createElement('div'); tipEl.id = 'pd-tip'; tipEl.hidden = true; document.body.appendChild(tipEl);
  let tipBtn = null;
  const tipText = (b) => {
    const t = b.dataset.ttl || b.getAttribute('title') || b.getAttribute('aria-label') || '';
    const lab = [...b.children].find((c) => c.tagName === 'SPAN' && !c.classList.contains('rb') && getComputedStyle(c).display !== 'none');
    const vis = (lab ? lab.textContent : [...b.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('')).trim();
    if (vis && !/^[\s\W]{0,2}$/.test(vis)) return ''; // 文字が見えているボタンは標準の説明のまま
    const nm = b.querySelector('span') ? b.querySelector('span').textContent.trim() : '';
    return nm && t && !t.startsWith(nm) ? `${nm}：${t}` : t || nm;
  };
  // 表示中に説明が書き換わった（状態が変わった）ときは、新しい方を残す
  const tipHide = () => { if (tipBtn && tipBtn.dataset.ttl != null) { if (!tipBtn.hasAttribute('title')) tipBtn.setAttribute('title', tipBtn.dataset.ttl); delete tipBtn.dataset.ttl; } tipBtn = null; tipEl.hidden = true; };
  document.addEventListener('mouseover', (e) => {
    const b = e.target.closest && e.target.closest('button');
    if (b === tipBtn) return; tipHide();
    if (!b || !b.isConnected || b.closest('#pd-tip')) return;
    const t = tipText(b); if (!t) return;
    tipBtn = b; if (b.hasAttribute('title')) { b.dataset.ttl = b.getAttribute('title'); b.removeAttribute('title'); }
    tipEl.textContent = t; tipEl.hidden = false;
    const r = b.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    const side = b.closest('.rail');
    let x = side ? r.right + 8 : r.left + r.width / 2 - w / 2, y = side ? r.top + r.height / 2 - h / 2 : r.bottom + 8;
    if (!side && y + h > innerHeight - 4) y = r.top - h - 8;
    tipEl.style.left = Math.max(4, Math.min(innerWidth - w - 4, x)) + 'px'; tipEl.style.top = Math.max(4, Math.min(innerHeight - h - 4, y)) + 'px';
  }, true);
  document.addEventListener('mousedown', tipHide, true);
  addEventListener('scroll', tipHide, true);
  function toggleNav() {
    if (narrowUI()) { root.classList.toggle('navopen'); return; }
    const st = navState(); setNav(st === 'hide' ? navLast() : st === 'min' ? 'wide' : 'min');
  }
  // ---- つまみ：左メニューの右のふち。ドラッグで引き出す・しまう（離した位置に近い段階にそろえる）。押すと しまう ⇔ 出す ----
  const grip = document.createElement('button'); grip.className = 'rl-grip'; grip.setAttribute('aria-label', '左のメニューを引き出す・しまう'); grip.innerHTML = '<i></i>';
  root.appendChild(grip);
  grip.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return; e.preventDefault();
    const x0 = e.clientX, w0 = NAV_W[navState()]; let moved = false;
    try { grip.setPointerCapture(e.pointerId); } catch (er) { /* 無視 */ }
    root.classList.add('navdrag');
    const mv = (ev) => {
      const dx = ev.clientX - x0; if (Math.abs(dx) > 4) moved = true; if (!moved) return;
      const w = Math.max(0, Math.min(NAV_W.wide, w0 + dx));
      root.style.setProperty('--navw', w + 'px'); root.classList.toggle('navmin', w < 160 && w > 0); root.classList.remove('navhide');
    };
    const up = () => {
      grip.removeEventListener('pointermove', mv); grip.removeEventListener('pointerup', up); grip.removeEventListener('pointercancel', up);
      root.classList.remove('navdrag');
      const cur = parseFloat(root.style.getPropertyValue('--navw')); root.style.removeProperty('--navw');
      if (!moved) { setNav(navState() === 'hide' ? navLast() : 'hide'); return; }
      const near = Object.keys(NAV_W).sort((a, b2) => Math.abs(NAV_W[a] - cur) - Math.abs(NAV_W[b2] - cur))[0];
      setNav(near);
    };
    grip.addEventListener('pointermove', mv); grip.addEventListener('pointerup', up); grip.addEventListener('pointercancel', up);
  });
  addEventListener('resize', () => { applyNav(); if (!narrowUI()) root.classList.remove('navopen'); });
  root.addEventListener('click', (e) => { if (root.classList.contains('navopen') && (e.target === root || e.target.closest('.rail button'))) setTimeout(() => root.classList.remove('navopen'), 0); });
  function renderNav() {
    renderRail();
    const c = counts();
    const next = c ? (WORK.find((k) => c[k] > 0) || null) : 'scan';
    $('[data-r=nav]').innerHTML = STEPS.map((s, i) => {
      let sub, cls = '';
      if (s.v === 'scan') { sub = meta ? `${fmtDate(meta.at)} 読み込み済み` : 'まずはここから'; if (meta) cls = 'done'; }
      else if (!c) sub = '読み込み後に使えます';
      else if (s.v === 'name' && !nameEnabled()) { sub = 'オフ（使わない設定）'; cls = 'done'; }
      else if (s.v === 'junk' && !junkEnabled()) { sub = 'オフ（使わない設定）'; cls = 'done'; }
      else if (s.v === 'seller' && !sellerEnabled()) { sub = 'オフ（使わない設定）'; cls = 'done'; }
      else if (s.v === 'junk' && c.junk === 0 && c.junkReview) sub = `要確認 ${c.junkReview} 件`;
      else if (s.v === 'clean' && c.clean === 0 && c.cleanSkip) sub = `要確認 ${c.cleanSkip} 件`;
      else if (c[s.v] === 0) { sub = '対象なし'; cls = 'done'; }
      else sub = `${c[s.v]} ${UNIT_OF[s.v]}`;
      if (s.v === next) { cls += ' next'; sub += s.v === 'scan' ? '' : '・おすすめ'; }
      if (s.v === view) cls += ' active';
      const locked = s.v !== 'scan' && !c;
      return `<button class="st ${cls}" data-step="${s.v}"${locked || busy ? ' disabled' : ''} title="${esc(s.d)}"><span class="n">${cls.includes('done') ? '✓' : i + 1}</span><span><span class="t">${esc(s.t)}</span><span class="c">${esc(sub)}</span></span></button>`;
    }).join('');
    renderActs();
  }
  // ステップごとの残作業の数（0 なら完了）
  function remaining(v, c) {
    c = c || counts();
    if (!c) return 0;
    if (v === 'clean') return c.clean;
    return c[v] || 0;
  }
  // このステップのあとで、まだ作業が残っている最初のステップ（なければ null＝すべて完了）
  function nextTarget(c) {
    c = c || counts();
    const i = STEPS.findIndex((s) => s.v === view);
    return STEPS.slice(i + 1).find((s) => remaining(s.v, c) > 0) || null;
  }
  const allDone = (c) => !!c && WORK.every((k) => !remaining(k, c)) && !c.cleanSkip;
  function nextHtml(c, cls) {
    if (mode === 'single') return `<button class="${cls || 'pri'}" data-a="close">完了（閉じる）</button><button data-a="toflow">1〜7の流れで続ける</button>`;
    const n = nextTarget(c);
    if (n) return `<button class="${cls || 'pri'}" data-step="${n.v}">次へ：${STEPS.indexOf(n) + 1}. ${esc(n.t)} →</button>`;
    return `<button class="${cls || 'pri'}" data-step="scan">${allDone(c) ? '✓ すべて完了（読み込み画面へ）' : '読み込み画面へ'}</button>`;
  }
  // 一覧の下に置く「次へ」ボタン
  function nextButton() { return `<div class="pd-next">${nextHtml()}</div>`; }
  // 残作業がないときに一覧の代わりに出す表示
  function doneCard(c) {
    c = c || counts();
    return `<div class="pd-hero"><h2>✓ このステップの作業はすべて完了しています</h2>
      <div class="note">${allDone(c) ? 'すべてのステップが完了しました。PikPakで操作したあとは、「1. 読み込む」で読み込み直すと最新の状態を確認できます。' : '次のステップへ進んでください。'}</div>
      <div class="acts" style="margin-top:16px">${nextHtml(c, 'pri big')}</div></div>`;
  }
  // ステップごとの操作欄（見出しと絞り込みは切り替え時に作り、ボタン部分は状態に合わせて都度更新）
  function renderToolbar() {
    if (view === 'tree') { renderTreeToolbar(); return; }
    const s = STEPS.find((x) => x.v === view);
    const single = mode === 'single' ? `<span class="note">読み込み：${meta ? esc(fmtDate(meta.at)) : '未'}</span><button data-a="rescan" title="最新の状態を読み込んでから、この作業を続けます">再読み込み</button><button data-a="toflow" title="1〜7 のステップをすべて表示します（左メニューの「整理」と同じ）">1〜7 をすべて表示</button><span class="sep"></span>` : '';
    const head = `<div class="head"><b>${mode === 'single' ? '' : STEPS.indexOf(s) + 1 + '. '}${esc(s.t)}</b><span class="note">${esc(s.d)}</span></div><span class="sp"></span>${single}`;
    let html = '';
    const kopt = (k) => `<label class="optsw" title="オフにすると、このステップを使わず次へ進みます"><input type="checkbox" data-kopt="${k}"${stepOn(k) ? ' checked' : ''}> このステップを使う</label><button data-a="kreplan" title="PikPak の最新の内容ではなく、読み込んだ内容から計画を作り直します">計画を作り直す</button><span class="sep"></span>`;
    if (view === 'sort' || view === 'clean' || view === 'ren') html = head + kopt(view);
    if (view === 'seller') {
      html = head + `<label class="optsw" title="オフにすると、このステップを使わず次へ進みます"><input type="checkbox" data-a="selleropt"${sellerEnabled() ? ' checked' : ''}> このステップを使う</label>`;
    }
    if (view === 'junk') html = head + kopt('junk');
    if (view === 'name') html = head + kopt('name');
    if (view === 'dup') html = head + `
      <select data-a="mode" title="まとめ方"><option value="name">同じファイル名でまとめる</option><option value="id">同じ品番でまとめる（-1/-2違いも含む）</option></select>
      <label><input type="checkbox" data-a="nearonly"> サイズが近い組だけ</label>
      <input type="text" data-a="q" placeholder="絞り込み（品番・名前）" size="16">
      <button data-a="visual" title="長さが近くて品番が違う動画を、画面の見た目（5か所）で比べて、同じ動画かもしれない組を探します。自動では削除しません">見た目で探す</button>
      <span class="sep"></span>`;
    $('[data-r=tb]').innerHTML = html ? html + (STEPV.includes(view) ? '' : '<span data-r="acts" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"></span>') : '';
    renderActs();
  }
  function renderActs() {
    const el = $('[data-r=acts]'); if (!el) return;
    const bar = $('[data-r=stbar]'), btx = $('[data-r=stbartx]');
    if (bar) bar.classList.remove('done');
    if (busy) { el.innerHTML = '<button data-a="stop">中断</button>'; if (btx) btx.innerHTML = scanning ? '<b>読み込み中…</b><small>中断すると、前回の読み込み結果をそのまま使います</small>' : '<b>実行中…</b><small>中断すると、そこまでの分は反映されます</small>'; return; }
    const c = counts();
    if (bar) {
      // 帯の左：何件を実行するか／押せない理由
      const main = $('[data-r=main]');
      const hasNext = !!(main && main.querySelector('.pd-next, .pd-hero .acts'));
      let tx = '';
      if (view === 'dup') { const g = visibleGroups(), n = delList(g).length; tx = g.length ? (n ? `<b>チェックした ${n} 件を削除します</b><small>表示中 ${g.length} 組。各組の一番大きいファイルは最初からチェックなし（残す）。確認画面のあと、PikPak のゴミ箱へ移します</small>` : '<b>チェックの入ったファイルがありません</b><small>削除するファイルにチェックを入れてください</small>') : ''; }
      else if (KIT_VERB[view]) { const all = kitItems(view), n = kitTargets(view).length, un = UNIT_OF[view] || '件'; const off = all.filter((it) => (it.st === 'todo' || it.st === 'fail') && kitIsOff(view, it.id)).length, rv = all.filter((it) => it.st === 'review').length; tx = !stepOn(view) || !all.some((it) => it.st === 'todo' || it.st === 'fail') ? '' : n ? `<b>チェックした ${n} ${un}を${KIT_VERB[view]}します</b><small>${[off ? `チェックなし ${off}` : '', rv ? `要確認 ${rv}` : ''].filter(Boolean).join('・')}${off || rv ? ' は対象外。' : ''}${view === 'junk' ? '確認画面のあと、PikPak のゴミ箱へ移します' : 'まずは「先頭1件だけ試す」で動きを確かめてください'}</small>` : '<b>チェックの入ったものがありません</b><small>実行するものにチェックを入れてください</small>'; }
      else { const n = remaining(view, c); tx = n > 0 ? `<b>対象 ${n} ${UNIT_OF[view] || '件'}</b><small>まずは「先頭1件だけ試す」で動きを確かめてください</small>` : ''; }
      if (btx) btx.innerHTML = tx;
      if (!tx) { bar.classList.add('done'); if (hasNext) { el.innerHTML = ''; bar.classList.add('hide'); return; } }
      bar.classList.remove('hide');
      // 青い大きなボタンは 1 つだけ：実行が残っている間は「次へ」を控えめにする
      if (main) main.querySelectorAll('.pd-next .pri').forEach((b) => b.classList.remove('pri'));
    }
    const label = { name: 'チェックしたものを変更', sort: 'すべて仕分け', ren: 'すべて変更', clean: 'チェックしたものを実行' };
    if (view === 'seller') {
      // 実行ボタンは一覧の下の帯（.sl-bar）に置く
      el.innerHTML = sellerEnabled() && selPlan.length ? '' : `<span class="okbadge">✓ 完了</span>${nextHtml(c)}`;
      refreshSellerChrome();
      return;
    }
    if (view === 'dup') {
      el.innerHTML = visibleGroups().length ? (() => { const n = delList(visibleGroups()).length; return `<button data-a="csv">CSV保存</button><button class="danger" data-a="delall"${n ? '' : ' disabled'}>チェックした ${n} 件を削除</button>`; })() : `<span class="okbadge">✓ 完了</span>${nextHtml(c)}`;
      return;
    }
    if (KIT_VERB[view]) { const n = kitTargets(view).length, un = UNIT_OF[view] || '件'; el.innerHTML = stepOn(view) && kitItems(view).some((it) => it.st === 'todo' || it.st === 'fail') ? (view === 'junk' ? `<button class="danger" data-a="junkdel"${n ? '' : ' disabled'}>チェックした ${n} ${un}を削除</button>` : `<button data-a="${view}1"${n ? '' : ' disabled'}>先頭1件だけ試す</button><button class="pri" data-a="${view}all"${n ? '' : ' disabled'}>チェックした ${n} ${un}を${KIT_VERB[view]}</button>`) : `<span class="okbadge">✓ 完了${view === 'clean' && c && c.cleanSkip ? `（要確認 ${c.cleanSkip} 件）` : ''}</span>${nextHtml(c)}`; return; }
    el.innerHTML = remaining(view, c) > 0
      ? `<button data-a="${view}1">先頭1件だけ試す</button><button class="pri" data-a="${view}all">${label[view]}</button>`
      : `<span class="okbadge">✓ 完了${view === 'clean' && c && c.cleanSkip ? `（要確認 ${c.cleanSkip} 件）` : ''}</span>${nextHtml(c)}`;
  }
  function setView(v) {
    if (libSt && !ddApplying) closeLib();
    if (v !== 'scan' && !hasScan()) v = 'scan';
    view = v;
    if (v === 'clean') cplan = stepOn('clean') ? buildCleanPlan(files, folders) : [];
    if (v === 'junk') jplan = junkEnabled() ? buildJunkPlan(files, folders) : [];
    if (v === 'name') nplan = buildNamePlan(workFiles(), folders);
    if (v === 'ren') rplan = stepOn('ren') ? buildRenamePlan(workFiles(), folders) : [];
    if (v === 'sort') splan = stepOn('sort') ? buildSortPlan(workFiles(), folders) : [];
    if (v === 'seller') selPlan = sellerEnabled() ? buildSellerPlan(folders) : [];
    if (v !== 'tree') { closeQL(); closeCtx(); closePlayer(); hideHover(); }
    root.classList.toggle('treev', v === 'tree'); // フォルダ一覧ではステップの表示を隠す
    if (v !== 'tree') { renderTreeActs(); $('[data-r=pright]').textContent = ''; }
    renderToolbar(); render(); renderNav();
    $('[data-r=main]').scrollTop = 0;
    renderQuota(); refreshQuota();
    if (v === 'tree') prefetchUp();
    ddKick();
  }
  // 案M：ステップ 2〜7 は、実行ボタンを一覧の下の帯に固定し、終わった結果を一覧の上に出す
  const STEPV = ['junk', 'name', 'sort', 'ren', 'dup', 'clean'];
  const lastResult = {}; // ステップ → { text, at }
  function ensureStepChrome() {
    if (!STEPV.includes(view)) return;
    const main = $('[data-r=main]'); if (!main) return;
    if (!main.querySelector('.st-bar')) main.insertAdjacentHTML('beforeend', '<div class="st-bar" data-r="stbar"><span class="tx" data-r="stbartx"></span><span class="acts" data-r="acts"></span></div>');
    const r = lastResult[view];
    if (r && !main.querySelector('.st-res')) main.insertAdjacentHTML('afterbegin', `<div class="st-res${/失敗|できません|停止|エラー/.test(r.text) ? ' warn' : ''}" role="status"><span class="ic">${/失敗|できません|停止|エラー/.test(r.text) ? '!' : '✓'}</span><span class="tx">${esc(r.text)}</span><button data-a="resclose" title="閉じる" aria-label="閉じる">${IC.x}</button></div>`);
  }
  // 実行が終わったら、下の帯の文を「結果」として一覧の上に残す
  function captureResult(v) {
    const t = ($('[data-r=status]') || {}).textContent || '';
    if (!t || busy) return;
    lastResult[v] = { text: t, at: Date.now() };
    if (view === v && v === 'seller') { const old = $('[data-r=main] .st-res'); if (old) old.remove(); renderSeller(); return; }
    if (view === v) { const old = $('[data-r=main] .st-res'); if (old) old.remove(); ensureStepChrome(); if (LANG === 'en') root.querySelectorAll('[data-r=main] .st-res *').forEach(trNode); }
  }
  function render() {
    const out = renderBody();
    if (STEPV.includes(view)) { ensureStepChrome(); renderActs(); }
    if (scopeTop) { const m = $('[data-r=main]'); if (m && ['dup', 'name', 'sort', 'ren'].includes(view) && !m.querySelector('.nt-scope')) m.insertAdjacentHTML('afterbegin', scopeBannerHtml()); }
    return out;
  }
  function renderBody() {
    if (view === 'scan') return renderScan();
    if (view === 'ren') return renderRen();
    if (view === 'sort') return renderSort();
    if (view === 'clean') return renderClean();
    if (view === 'seller') return renderSeller();
    if (view === 'name') return renderName();
    if (view === 'junk') return renderJunk();
    if (view === 'tree') return renderTree();
    return renderDup();
  }

