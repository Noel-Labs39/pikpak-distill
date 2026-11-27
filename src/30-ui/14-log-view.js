  // ---------- ログ表示 ----------
  function updateLogBadge() {
    const seen = +(localStorage.getItem(LS_LOGSEEN) || 0);
    const n = readLog().filter((x) => x.level === 'error' && x.t > seen).length;
    $('[data-r=logbadge]').textContent = n ? String(n) : '';
  }
  function showLog() {
    const logs = readLog().slice().reverse();
    const text = () => `PikPak Distill ${VER} / ${navigator.userAgent}\n` + readLog().map((x) => `${fmtDate(x.t, 'full')} [${x.level}] ${x.msg}${x.ctx ? ' | ' + x.ctx : ''}${x.v ? ' (v' + x.v + ')' : ''}`).join('\n');
    const d = mkEl('pd-dlg');
    d.innerHTML = `<div class="box" style="width:min(820px,94vw)"><h3>ログ（新しい順・最新300件）</h3>
      <div class="note">エラーや主な処理の記録です。このブラウザの中にだけ保存されます（ログイン情報は記録しません）。不具合の報告にはコピーして貼り付けてください。</div>
      <div class="logs">${logs.map((x) => `<div class="${x.level}">${esc(fmtDate(x.t, 'full'))} [${esc(x.level)}] ${esc(x.msg)}${x.ctx ? ' <span style="opacity:.7">| ' + esc(x.ctx) + '</span>' : ''}</div>`).join('') || '記録はありません'}</div>
      <div class="acts"><button data-clear>消去</button><button data-save>テキスト保存</button><button data-copy>コピー</button><button data-close class="danger" style="background:#306fff;border-color:#306fff">閉じる</button></div></div>`;
    lsSet(LS_LOGSEEN, String(Date.now()));
    updateLogBadge();
    d.querySelector('[data-close]').onclick = () => d.remove();
    d.querySelector('[data-copy]').onclick = async () => { try { await navigator.clipboard.writeText(text()); d.querySelector('[data-copy]').textContent = 'コピーしました'; } catch (e) { d.querySelector('[data-copy]').textContent = 'コピー失敗'; } };
    d.querySelector('[data-save]').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text()], { type: 'text/plain' })); a.download = 'pikpak-distill-log.txt'; a.click(); };
    d.querySelector('[data-clear]').onclick = () => { if (confirm(tr('ログを消去しますか？'))) { lsDel(LS_LOG); d.remove(); updateLogBadge(); } };
  }

  // 左メニューの「再読み込み」：いきなり始めず、確認してから（読み込み中はファイルの操作ができないため）
  function askRescan() {
    if (document.getElementById('pd-dlg')) return;
    const back = view;
    const where = scanWhereLabel();
    let st = null; try { st = (JSON.parse(localStorage.getItem(LS_SCANSTAT) || '{}') || {})[scopeHome() ? 'root' : hereId()]; } catch (e) { st = null; }
    const when = meta ? fmtDate(meta.at) : '';
    const d = mkEl('pd-dlg');
    d.innerHTML = `<div class="box" role="dialog" aria-label="再読み込み"><h3>PikPak の中身を読み込み直しますか？</h3>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px">
        ${scopeHtml() || `<div>📁 読み込む場所：<b>${esc(where)}</b></div>`}
        ${meta ? `<div>🕘 前回（${esc(meta.where || 'ホーム')}）：<b>${esc(when)}</b>（フォルダ ${meta.nfo.toLocaleString()} ／ ファイル ${meta.nfi.toLocaleString()}）</div>` : ''}
        <div>⏱ かかる時間：<b>${st ? `前回は ${fmtDur(st.ms)}` : '数十秒〜数分'}</b></div>
      </div>
      <div class="note" style="margin-bottom:16px">PikPak で追加・削除・移動したものを反映します。<b>読み込み中は、移動・削除・名前の変更などの操作ができません</b>（途中で「中断」できます）。ファイルは何も変更しません。</div>
      <div class="acts"><button data-no>やめる</button><button data-go style="background:#306fff;border-color:#306fff;color:#fff;font-weight:700">読み込みを始める</button></div></div>`;
    const close = () => { d.remove(); document.removeEventListener('keydown', onKey, true); };
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); } };
    document.addEventListener('keydown', onKey, true);
    d.addEventListener('mousedown', (e) => { if (e.target === d) close(); });
    wireScope(d);
    d.querySelector('[data-no]').onclick = close;
    d.querySelector('[data-go]').onclick = () => { close(); if (busy) return; afterScan = back; runScan(); };
    d.querySelector('[data-go]').focus();
  }

