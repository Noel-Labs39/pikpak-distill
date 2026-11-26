  // ---------- 共通プレーヤー ----------
  // 再生元の取得・最初の画質選び・video への接続・画質の切り替え・失敗の表示・後片付け・再生の記録を 1 か所にまとめる。
  // 置き場所（プレーヤー画面・フォルダ一覧のプレビュー・左メニューのプレビュー）は見た目と操作だけを受け持つ
  //   o.slot   … PL のどこに置くか（同じ場所の前の再生は止める）
  //   o.pick   … 'pref'＝前回選んだ種類の画質（既定）／'light'＝一番軽い変換画質（見比べの 2 本用。オリジナルは選ばない）
  //   o.qHost  … 画質の選択欄を置く場所（<select> そのものか、先頭に作る親要素）。どの置き場所も同じ画質の選び方になる
  //   o.alive  … まだこの再生を続けてよいか（その間に別のファイルへ移ったら false）
  //   o.qp / o.onMeta(v, x) / o.onEnded / o.onSources(S, k) / o.fail(x, why) / o.msg(text)
  function playerCore(box, id, o = {}) {
    if (o.slot) plStop(o.slot);
    const P = { id, S: null, x: null, k: -1, v: null, hls: null, dead: false };
    P.stop = () => { if (P.v && !P.dead) savePos(P, P.v, true); P.dead = true; killHls(P.hls); P.hls = null; };
    const msg = (t) => { if (o.msg) o.msg(t); else box.innerHTML = `<div class="pl-msg">${esc(t)}</div>`; };
    const fail = (x, why) => { if (o.fail) o.fail(x, why); else if (!box.querySelector('.pl-err')) box.insertAdjacentHTML('beforeend', `<div class="pl-msg pl-err">再生できませんでした${why ? `（${esc(why)}）` : ''}</div>`); };
    P.load = (k, t) => {
      const x = P.S && P.S.src[k]; if (!x || P.dead) return null;
      if (o.pick !== 'light') { lsSet(LS_PLQ, x.origin ? 'orig' : 'trans'); }
      if (P.qsel) P.qsel.value = String(k);
      const cur = t != null ? t : (P.v && P.v.currentTime) || 0;
      killHls(P.hls); P.hls = null;
      if (!P.S.playable(x)) { P.v = null; msg(o.unplayable || 'この画質（HLS）はこのブラウザの中では再生できません。別の画質か外部プレーヤーを選んでください。'); return null; }
      P.x = x; P.k = k;
      const m = mountVideo(box, x, P.S, fail, { armed: o.armed, poster: o.poster, t: cur, qp: { ...(o.qp || {}), media: mediaHooks(id) }, onMeta: (v) => { if (o.onMeta) o.onMeta(v, x); } });
      P.v = m.v;
      trackPos(P, m.v);
      setTimeout(() => { if (P.dead) killHls(m.hls); else P.hls = m.hls; }, 0);
      if (o.onEnded) m.v.addEventListener('ended', () => { if (!P.dead) o.onEnded(); });
      return m;
    };
    P.ready = (async () => {
      const S = await loadSources(id);
      if (P.dead || (o.alive && !o.alive())) return null;
      P.S = S;
      if (!S.src.length) { msg(o.noSource || 'このファイルの再生用リンクを取得できませんでした（PikPak 側で変換中の可能性があります）'); return null; }
      let k = S.first;
      if (o.pick === 'light') {
        const tr = S.src.map((x, i) => [x, i]).filter(([x]) => !x.dl && !x.origin && S.playable(x));
        k = tr.length ? tr[tr.length - 1][1] : S.src.findIndex((q) => !q.dl && S.playable(q));
        if (k < 0) { msg(o.unplayable || 'このブラウザの中では再生できません。外部プレーヤーを使ってください。'); return null; }
      }
      // 画質の選択欄（3 か所とも同じ作り・同じ動き）。o.qHost が <select> ならそれを使い、それ以外の要素なら先頭に作る
      if (o.qHost && S.src.length > 1) {
        let sel = o.qHost.tagName === 'SELECT' ? o.qHost : o.qHost.querySelector('[data-qlq]');
        if (!sel) { sel = document.createElement('select'); sel.setAttribute('data-qlq', ''); sel.title = '画質'; o.qHost.prepend(sel); }
        sel.innerHTML = S.src.map((x, j) => `<option value="${j}">${esc(x.label)}${x.hls ? '・変換' : ''}${S.playable(x) ? '' : '（このブラウザでは再生不可）'}</option>`).join('');
        sel.value = String(k); sel.style.display = '';
        sel.onchange = () => { const m = P.load(+sel.value); if (m) m.v.focus(); };
        P.qsel = sel;
      } else if (o.qHost && o.qHost.tagName === 'SELECT') o.qHost.style.display = 'none';
      if (o.onSources) o.onSources(S, k);
      // 続きから：前回止めた所から始める（最初の数秒・見終わったものは最初から）
      const rec = mediaGet(id); let t0 = o.t || 0, resumed = 0;
      if (!t0 && qpCfg().resume && rec && !rec.done && rec.pos > 10 && (!rec.dur || rec.pos < rec.dur - 15)) { t0 = rec.pos; resumed = rec.pos; }
      const m = P.load(k, t0);
      if (o.armed && m) m.v.addEventListener('play', () => playLogPush(id, o.name), { once: true }); else playLogPush(id, o.name);
      if (m && resumed) m.v.addEventListener('loadedmetadata', () => { const q = m.v._qp; if (q) q.note(`⏵ 前回の続き ${fmtClock(resumed)} から再生しています`, [['最初から', () => { m.v.currentTime = 0; mediaPut(id, { pos: 0 }); }]], 6000); }, { once: true });
      return P;
    })();
    if (o.slot) PL[o.slot] = P;
    return P;
  }
