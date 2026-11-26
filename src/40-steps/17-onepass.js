  // ---------- まとめて整理（基準を決める → 判定 → 確認 → まとめて実行） ----------
  // 判定はいまの各ステップと同じ部品を使い、人が見るのは「迷うもの」だけにする。
  // 実行の順番は固定：不要ファイル → 重複 → 作品ごとに仕分け → 販売者ごとに仕分け → ファイル名 → フォルダ名 → 片付け
  //   先に消すので、名前をそろえるときに同じ名前がぶつかって (1) が付くことがほとんどなくなる

  // 重複（作品・連番まで同じ組）：中身の手がかりで自動か確認かを決める
  //   ① ハッシュ値が同じ ＝ 中身がまったく同じ → 1 つを残して自動で消す
  //   ② 解像度と長さが同じ（容量は違ってよい）、または容量・解像度・長さがほぼ同じ → 大きい方を残して自動で消す
  //   ※ 動画どうしだけを比べる（zip などと動画は比べない）
  //   ③ それ以外（長さ・解像度・容量が違う）→ 確認に回す（見比べで目で見て決める）
  const SD_NEAR = 0.02;
  function smartDup() {
    const dn = new Map(folders.map((d) => [d.id, d.name]));
    const g = new Map();
    workFiles().forEach((f) => { if (!VIDEO_EXT.has(extOf(f.name))) return; const k = dupKeyOf(f.name, dn.get(f.parentId)); if (!k) return; if (!g.has(k)) g.set(k, []); g.get(k).push(f); });
    const auto = [], review = [];
    // 正しい置き場所（フォルダ名に品番が入っている）にあるものを優先して残す
    const placed = (f, k) => (dn.get(f.parentId) || '').toUpperCase().includes(k.split('#')[0].toUpperCase());
    const better = (a, b, k) => (placed(b, k) - placed(a, k)) || (b.size - a.size);
    g.forEach((list, k) => {
      if (list.length < 2) return;
      const m = list.map((f) => ({ f, ...metaGet(f) }));
      const byH = new Map(); const reps = [];
      m.forEach((x) => { if (!x.hash) { reps.push(x); return; } if (!byH.has(x.hash)) byH.set(x.hash, []); byH.get(x.hash).push(x); });
      byH.forEach((xs) => { xs.sort((a, b) => better(a.f, b.f, k)); reps.push(xs[0]); xs.slice(1).forEach((x) => auto.push({ key: k, keep: xs[0].f, del: x.f, why: '中身が同じ（ハッシュ値が一致）' })); });
      if (reps.length < 2) return;
      reps.sort((a, b) => b.f.size - a.f.size);
      const top = reps[0];
      // 解像度と長さが同じ（分かっている）なら、容量が違っても同じ作品の別のコピー（変換・再圧縮）とみなし、大きい方を残す
      const sameMedia = (x) => top.res && x.res && top.res === x.res && top.dur && x.dur && Math.abs(top.dur - x.dur) <= Math.max(5, top.dur * SD_NEAR);
      const near = (x) => sameMedia(x) || (Math.abs(top.f.size - x.f.size) / (top.f.size || 1) <= SD_NEAR && (!top.res || !x.res || top.res === x.res) && (!top.dur || !x.dur || Math.abs(top.dur - x.dur) <= Math.max(5, top.dur * SD_NEAR)));
      if (reps.slice(1).every(near)) { const keep = reps.slice().sort((a, b) => better(a.f, b.f, k))[0]; reps.filter((x) => x !== keep).forEach((x) => auto.push({ key: k, keep: keep.f, del: x.f, why: '容量・解像度・長さがほぼ同じ（大きい方を残す）' })); return; }
      const why = [];
      if (reps.some((x) => x.dur && top.dur && Math.abs(x.dur - top.dur) > Math.max(5, top.dur * SD_NEAR))) why.push('長さが違う');
      if (reps.some((x) => x.res && top.res && x.res !== top.res)) why.push('解像度が違う');
      if (!why.length) why.push('容量が違う');
      // 名前を整えるステップでも、決めるまでは名前を変えない
      review.push({ key: k, items: reps.map((x) => x.f), why: why.join('・') });
    });
    return { auto, review };
  }
  // 確認に回すもの・自動で決まる分の件数
  function onePlan() {
    const c = counts() || {};
    const sd = smartDup();
    const jp = junkEnabled() ? buildJunkPlan(files, folders) : [];
    const sp = sellerEnabled() ? buildSellerPlan(folders) : [];
    const pend = sp.filter((x) => x.kind === 'pending').length, unknown = sp.filter((x) => x.kind === 'unknown' || x.kind === 'review').length;
    return {
      auto: [
        ['junk', '不要ファイル', jp.filter((x) => x.level === 'del').length, '件', '広告・10MB 以下など'],
        ['dup', '重複（自動で決まったもの）', sd.auto.length, '件', '中身が同じ・ほぼ同じ'],
        ['sort', '作品ごとに仕分け', c.sort || 0, '作品', '品番のフォルダへ'],
        ['seller', '販売者ごとに仕分け', sp.filter((x) => (x.kind !== 'pending' || toMyPack(x)) && (x.kind !== 'dupw' || x.merge) && sellerChecked(x)).length, '作品', '販売者が分かった作品だけ'],
        ['name', 'ファイル名を整える', c.name || 0, '件', 'FC2-PPV-品番[-連番]'],
        ['ren', 'フォルダ名を揃える', c.ren || 0, '件', '中のファイルの品番に'],
        ['clean', '片付け', c.clean || 0, '件', '空のフォルダ・(1) など'],
      ],
      sd, pend, unknown,
      junkReview: jp.filter((x) => x.level === 'review').length,
    };
  }
  function onePanelHtml() {
    if (!hasScan()) return '';
    const P = onePlan();
    const total = P.auto.reduce((a, x) => a + x[2], 0);
    const rv = P.sd.review;
    const rvRow = (g) => `<div class="op-rv"><div class="op-rvh"><b>${esc(g.key.replace('#', ' -'))}</b><span class="pd-tag">${esc(g.why)}</span><span class="sp"></span><button data-opcmp="${esc(g.key)}" title="2 本を並べて見比べる">▶ 見比べ</button></div>${g.items.map((f) => { const m = metaGet(f); return `<div class="op-rf"><span>${esc(f.name)}</span><small>${esc(f.path || '')}</small><em>${fmt(f.size)}${m.res ? ' ・ ' + m.res : ''}${m.dur ? ' ・ ' + fmtClock(m.dur) : ''}</em></div>`; }).join('')}</div>`;
    const tabs = [
      ['dup', '違う可能性がある重複', rv.length],
      ['junk', '不要ファイル（要確認）', P.junkReview],
      ['seller', '販売者が分からない', P.unknown],
    ].filter((x) => x[2]);
    return `<section class="op">
      <div class="op-hd"><b>まとめて整理</b><span class="note">判定した結果です。自動で決まった分は件数だけ、人が決めるものだけを下に並べています</span></div>
      ${P.pend ? `<div class="op-base"><span>販売者が<b>未調査の作品が ${P.pend} 件</b>あります。調べると、販売者ごとの仕分けに入ります（調べた結果は記録されるので次からは待ちません）</span><button class="pri" data-a="oplookup">販売者を調べる</button></div>` : ''}
      <div class="op-auto">${P.auto.map(([k, t, n, u, d]) => `<button class="op-a${n ? '' : ' zero'}" data-step="${k}" title="開くと中身を見られます"><span>${t}</span><b>${n.toLocaleString()}<small> ${u}</small></b><em>${d}</em></button>`).join('')}</div>
      ${tabs.length ? `<div class="op-q"><b>人が決めるもの</b>${tabs.map(([k, t, n]) => `<button data-step="${k}">${t} <i>${n}</i></button>`).join('')}</div>` : '<div class="op-q"><b>人が決めるものはありません</b></div>'}
      ${rv.length ? `<div class="op-rvs">${rv.slice(0, 5).map(rvRow).join('')}${rv.length > 5 ? `<button class="lnk" data-step="dup">ほか ${rv.length - 5} 組を見る →</button>` : ''}</div>` : ''}
      <div class="op-run"><div><b>${total ? `まとめて実行すると：${P.auto.filter((x) => x[2]).map(([, t, n, u]) => `${t} ${n} ${u}`).join(' ・ ')}` : '実行するものはありません'}</b><div class="note">不要ファイル → 重複 → 作品ごと → 販売者ごと → ファイル名 → フォルダ名 → 片付け の順。消すものは PikPak のゴミ箱へ（戻せます）。人が決めるもの（違う可能性がある重複）は、消さず名前も変えません</div></div><span class="sp"></span><button class="pri" data-a="onepass"${total && !busy ? '' : ' disabled'}>まとめて実行</button></div>
    </section>`;
  }
  let oneRunning = false;
  async function runOnePass() {
    if (busy || oneRunning || !ensureSession(view)) return;
    const P = onePlan();
    const sum = P.auto.filter((x) => x[2]).map(([, t, n, u]) => `・${t}：${n} ${u}`).join('\n');
    if (!sum) { status('実行するものはありません'); return; }
    if (!confirm(tr('次の順番でまとめて実行します。消すものは PikPak のゴミ箱へ移します（戻せます）。\n\n') + sum + tr('\n\nよろしいですか？'))) return;
    oneRunning = true; window.__ppdupStop = false;
    const done = []; const t0 = Date.now(); const reflow = { back: 0, merged: 0 };
    const step = (t) => status(`まとめて実行：${t}`);
    try {
      // 1. 不要ファイル
      if (junkEnabled()) {
        jplan = buildJunkPlan(files, folders);
        const list = jplan.filter((x) => x.level === 'del' && junkChecked(x)).map((x) => files.find((f) => f.id === x.id)).filter(Boolean);
        if (list.length) { step('不要ファイルをゴミ箱へ'); busy = true; renderNav(); const r = await deleteEach(list, false, (d, t, e) => status(`まとめて実行：不要ファイル ${d} / ${t}`, d / t, e)); busy = false; done.push(`不要ファイル ${r.n} 件`); }
      }
      // 2. 重複（自動で決まったものだけ）
      if (!window.__ppdupStop) {
        const sd = smartDup(); const list = sd.auto.map((x) => x.del).filter((f) => files.some((y) => y.id === f.id));
        if (list.length) {
          step('重複をゴミ箱へ'); busy = true; renderNav();
          sd.auto.forEach((x) => { decision[x.keep.id] = 'keep'; decision[x.del.id] = 'del'; }); saveDecision();
          const r = await deleteEach(list, false, (d, t, e) => status(`まとめて実行：重複 ${d} / ${t}`, d / t, e)); busy = false; done.push(`重複 ${r.n} 件`);
          log('info', 'まとめて実行：重複の内訳', sd.auto.map((x) => `${x.del.name}（${x.why}）`).slice(0, 50).join(' ／ '));
        }
      }
      // 人が決める重複は、名前を変えない（決めてから整える。(1) を付けて紛らわしくしないため）
      const hold = smartDup().review.flatMap((g) => g.items.map((f) => f.id));
      // 3〜7. 仕分け・販売者・名前・フォルダ名・片付け（各ステップの実行をそのまま使う）
      for (const v of ['sort', 'seller', 'name', 'ren', 'clean']) {
        if (window.__ppdupStop) break;
        if (v === 'seller') { if (!sellerEnabled()) continue; selPlan = buildSellerPlan(folders); const n = selPlan.filter((x) => (x.kind !== 'pending' || toMyPack(x)) && (x.kind !== 'dupw' || x.merge) && sellerChecked(x)).length; if (!n) continue; step('販売者ごとに仕分け'); const rr = await runSeller(false, true); if (rr) { reflow.back += rr.back; reflow.merged += rr.merged; } done.push(`販売者ごとに仕分け ${n} 作品`); continue; }
        if (!stepOn(v)) continue;
        kitPlan(v); if (v === 'name') hold.forEach((id) => kitSetOff('name', id, true));
        const n = kitTargets(v).length; if (!n) continue;
        step(STEPS.find((x) => x.v === v).t); await runKit(v, false); done.push(`${STEPS.find((x) => x.v === v).t} ${n} ${UNIT_OF[v] || '件'}`);
      }
    } catch (err) { busy = false; oneRunning = false; handleErr(err, view, 'まとめて実行を止めました：' + (err.message || err)); return; }
    busy = false; oneRunning = false;
    const msg = `${window.__ppdupStop ? '途中で止めました' : 'まとめて実行しました'}（${fmtDur(Date.now() - t0)}）：${done.join(' ・ ') || '実行したものはありません'}`;
    log('info', msg);
    view = 'scan'; mode = 'flow'; setView('scan'); renderNav(); status(msg + '。失敗があれば各ステップの「失敗」タブに理由があります');
    if (reflow.back || reflow.merged) askReflow(reflow.back, reflow.merged);
  }
