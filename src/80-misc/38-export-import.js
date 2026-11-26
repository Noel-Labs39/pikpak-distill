  // ---------- 書き出し／読み込み（設定・販売者の調査結果・重複の判断・解凍パスワード） ----------
  const EXPORT_GROUPS = {
    settings: { label: '設定', keys: ['ppdup:theme:v1', 'ppdup:lang:v1', 'ppdup:open:v1', 'ppdup:popban:v1', 'ppdup:popgeom:v1', 'ppdup:opt:junk:v1', 'ppdup:opt:cleanname:v1', 'ppdup:opt:seller:v1', 'ppdup:player:v1', 'ppdup:player:q:v1', 'ppdup:rate:v1', 'ppdup:frames:v1', 'ppdup:tree:v1', 'ppdup:seller:cfg:v1', 'ppdup:scanstat:v1'] },
    seller: { label: '販売者の調査結果と手入力・作品の情報', keys: ['ppdup:seller:v1', 'ppdup:winfo:v1'], merge: true },
    decision: { label: '重複の判断（残す・削除の記録）', keys: ['ppdup:decision:v1'], merge: true },
    unzip: { label: '解凍パスワード（合言葉で暗号化）', keys: ['ppdup:unzippw:x'], merge: true, enc: true },
    media: { label: '再生の記録（再生した履歴・続きの位置・飛ばす区間）', keys: ['ppdup:media:v1'], merge: true },
  };
  let exportSel = { settings: true, seller: true, decision: true, unzip: true, media: true };
  const groupCount = (g, src) => {
    if (EXPORT_GROUPS[g].enc && !src) return pwCache.length;
    let n = 0;
    EXPORT_GROUPS[g].keys.forEach((k) => { const v = src ? src[k] : lsGet(k); if (v == null) return; if (!EXPORT_GROUPS[g].merge) { n++; return; } try { const o = JSON.parse(v); n += Array.isArray(o) ? o.length : Object.keys(o || {}).length; } catch (e) { n++; } });
    return n;
  };
  async function exportData() {
    const data = {};
    Object.keys(EXPORT_GROUPS).forEach((g) => { if (!exportSel[g] || EXPORT_GROUPS[g].enc) return; EXPORT_GROUPS[g].keys.forEach((k) => { const v = lsGet(k); if (v != null) data[k] = v; }); });
    if (exportSel.unzip) { await pwReady; if (pwCache.length) { const pass = askPass('解凍パスワードを、合言葉で暗号化して書き出します。', true); if (pass) data[LS_PWX] = await pwExportBox(pwCache, pass); else status('解凍パスワードは書き出しませんでした'); } }
    const blob = new Blob([JSON.stringify({ app: 'pikpak-distill', ver: VER, at: new Date().toISOString(), data }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    const d = new Date(); a.download = `pikpak-distill_${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.json`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    status(`書き出しました（${Object.keys(data).length} 項目）。ログイン情報は含まれていません。`); log('info', '設定などを書き出し', Object.keys(data).join(','));
  }
  function importData() {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = async () => {
      const f = inp.files && inp.files[0]; if (!f) return;
      let j = null; try { j = JSON.parse(await f.text()); } catch (e) { j = null; }
      if (!j || j.app !== 'pikpak-distill' || !j.data || typeof j.data !== 'object') { status('このファイルは読み込めません（PikPak Distill で書き出した .json を選んでください）'); return; }
      const allowed = new Set(Object.values(EXPORT_GROUPS).flatMap((g) => g.keys));
      const src = {}; Object.keys(j.data).forEach((k) => { if (allowed.has(k) && typeof j.data[k] === 'string') src[k] = j.data[k]; });
      const gs = Object.keys(EXPORT_GROUPS).filter((g) => EXPORT_GROUPS[g].keys.some((k) => k in src));
      if (!gs.length) { status('読み込める項目がありませんでした'); return; }
      closeSettings();
      const d = mkEl('pd-dlg');
      d.innerHTML = `<div class="box" style="width:min(520px,94vw)"><h3>読み込む内容</h3><div class="note">${esc(f.name)}（v${esc(j.ver || '?')}・${esc(String(j.at || '').slice(0, 10))}）</div>
        <div style="margin:12px 0;display:flex;flex-direction:column;gap:6px">${gs.map((g) => `<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-ig="${g}" checked> <span>${esc(EXPORT_GROUPS[g].label)}：${groupCount(g, src)} 件${EXPORT_GROUPS[g].merge ? `（今は ${groupCount(g)} 件）` : ''}</span></label>`).join('')}</div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px"><label><input type="radio" name="pdim" value="merge" checked> 今のものに足す（同じものは読み込んだ方を優先）</label><label><input type="radio" name="pdim" value="replace"> 置き換える</label></div>
        <div class="note">読み込んだあと、画面を読み込み直して反映します。</div>
        <div class="acts" style="margin-top:14px"><button data-no>キャンセル</button><button class="danger" data-yes style="background:#306fff;border-color:#306fff">読み込む</button></div></div>`;
      if (LANG === 'en') d.querySelectorAll('*').forEach(trNode);
      d.querySelector('[data-no]').onclick = () => d.remove();
      d.querySelector('[data-yes]').onclick = () => {
        const mode = d.querySelector('input[name=pdim]:checked').value;
        let n = 0;
        gs.filter((g) => d.querySelector(`[data-ig="${g}"]`).checked).forEach((g) => EXPORT_GROUPS[g].keys.forEach((k) => {
          if (!(k in src)) return;
          if (k === LS_PWX) { const pass = askPass('書き出したときの合言葉を入れると、解凍パスワードを読み込みます。'); if (pass) pwImportBox(src[k], pass).then((l) => { const n = addPws(l); log('info', `解凍パスワードを ${n} 件読み込みました`); }).catch(() => alert(tr('合言葉が違うため、解凍パスワードは読み込めませんでした'))); return; }
          let v = src[k];
          if (mode === 'merge' && EXPORT_GROUPS[g].merge) { try { const cur = JSON.parse(lsGet(k) || 'null'); const inc = JSON.parse(v); if (Array.isArray(cur) && Array.isArray(inc)) v = JSON.stringify([...new Set([...inc, ...cur])]); else if (cur && typeof cur === 'object' && inc && typeof inc === 'object') v = JSON.stringify({ ...cur, ...inc }); } catch (e) { /* そのまま */ } }
          try { localStorage.setItem(k, v); n++; } catch (e) { /* 無視 */ }
        }));
        d.remove(); log('info', `設定などを読み込み（${mode === 'merge' ? '足す' : '置き換え'}・${n} 項目）`);
        status(`読み込みました（${n} 項目）。画面を読み込み直します…`);
        setTimeout(() => location.reload(), 900);
      };
    };
    inp.click();
  }
