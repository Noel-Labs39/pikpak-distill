// My Pack に残るファイル・再調査したものを My Pack へ戻す・1 から処理し直す
const open = require('./h.js');
const MP = 'MPMPMPMPMPMPMPMPMPMP', BOX = 'BXBXBXBXBXBXBXBXBXBX', OLD = 'OLOLOLOLOLOLOLOLOLOL', W = 'WWWWWWWWWWWWWWWWWWWW', W2 = 'W2W2W2W2W2W2W2W2W2W2';
const fi = (id, name, mb = 300) => ({ id, name, kind: 'drive#file', size: String(mb * 1048576), phase: 'PHASE_TYPE_COMPLETE' });
const tree = {
  '': [{ id: MP, name: 'My Pack', kind: 'drive#folder', folder_type: 'DOWNLOAD' }, { id: BOX, name: '販売者別', kind: 'drive#folder' }],
  [MP]: [fi('a1', 'FC2-PPV-1234567.mp4'), fi('n1', 'なにか.mp4')],
  [BOX]: [{ id: OLD, name: '旧（old）', kind: 'drive#folder' }],
  [OLD]: [{ id: W, name: 'FC2-PPV-7654321', kind: 'drive#folder' }, { id: W2, name: 'FC2-PPV-2222222', kind: 'drive#folder' }],
  [W]: [fi('b1', 'FC2-PPV-7654321.mp4')], [W2]: [fi('b2', 'FC2-PPV-2222222.mp4')],
};
const pre = `(() => {
  localStorage.setItem('ppdup:seller:v1', JSON.stringify({ '7654321': { name: '新', sid: 'new', src: 'manual', status: 'ok', at: 1 }, '1234567': { name: '新', sid: 'new', src: 'manual', status: 'ok', at: 1 }, '2222222': { name: '旧', sid: 'old', src: 'manual', status: 'ok', at: 1 } }));
  window.confirm = () => true; window.__moves = [];
  const f0 = window.fetch;
  window.fetch = async (u0, o = {}) => { const u = new URL(String(u0), location.href); const T = window.__tree;
    const J = (b) => ({ ok: true, status: 200, json: async () => b });
    if (/:batchMove$/.test(u.pathname)) { const b = JSON.parse(o.body); const to = b.to.parent_id || ''; window.__moves.push({ ids: b.ids, to });
      Object.keys(T).forEach((k) => { T[k] = T[k].filter((x) => { if (b.ids.includes(x.id)) { (T[to] = T[to] || []).push(x); return false; } return true; }); }); return J({}); }
    if (o.method === 'POST' && /\\/files$/.test(u.pathname)) { const b = JSON.parse(o.body); const id = 'NEW' + Math.random().toString(36).slice(2, 19).padEnd(17, 'x'); (T[b.parent_id || ''] = T[b.parent_id || ''] || []).push({ id, name: b.name, kind: 'drive#folder' }); T[id] = []; return J({ file: { id } }); }
    return f0(u0, o); };
})()`;
let ng = 0; const ok = (c, m) => { console.log((c ? 'OK ' : 'NG ') + m); if (!c) ng++; };
(async () => {
  const { b, p, SP } = await open(tree, 'https://mypikpak.com/drive/all', pre);
  // A. My Pack の 1 作品だけのファイルも仕分け対象・品番なしは要確認
  const sp = await p.evaluate(() => PPDup.buildSortPlan(PPDup.files, PPDup.folders).map((g) => g.cpath + ':' + g.work));
  ok(sp.includes('/My Pack:FC2-PPV-1234567'), '仕分けの計画に My Pack の 1 作品 → ' + JSON.stringify(sp));
  await p.evaluate(() => { location.hash = 'dd/step/sort'; }); await p.waitForTimeout(800);
  await p.evaluate(() => { const t = document.querySelector('[data-ktab=review]'); t && t.click(); }); await p.waitForTimeout(300);
  const rv = await p.evaluate(() => [...document.querySelectorAll('.kit-row .pd-name')].map((e) => e.textContent));
  ok(rv.some((x) => /なにか\.mp4/.test(x)), '要確認に品番なしのファイル → ' + JSON.stringify(rv));
  await p.screenshot({ path: SP + 'rf_sort.png' });
  // B. 販売者違いは My Pack へ戻す
  await p.evaluate(() => { location.hash = 'dd/step/seller'; }); await p.waitForTimeout(1000);
  const row = await p.evaluate(() => { const r = [...document.querySelectorAll('.sl-row')].find((e) => /7654321/.test(e.textContent)); return r ? r.textContent.replace(/\s+/g, ' ').slice(0, 200) : null; });
  ok(row && /My Pack/.test(row), '販売者違いの行 → ' + row);
  await p.evaluate(() => { const r = [...document.querySelectorAll('.sl-row')].find((e) => /7654321/.test(e.textContent)); const c = r.querySelector('input[data-schk]'); if (!c.checked) c.click(); });
  await p.screenshot({ path: SP + 'rf_seller.png' });
  await p.evaluate(() => { const x = document.querySelector('[data-a=sellerall]'); x && x.click(); }); await p.waitForTimeout(3500);
  const mv = await p.evaluate(() => window.__moves);
  ok(mv.some((m) => m.ids.includes('WWWWWWWWWWWWWWWWWWWW') && m.to === 'MPMPMPMPMPMPMPMPMPMP'), '販売者違いを My Pack へ移動 → ' + JSON.stringify(mv));
  // C. 1 から処理し直すか聞く
  const dlg = await p.evaluate(() => { const d = document.querySelector('#pd-dlg'); return d ? d.textContent.replace(/\s+/g, ' ') : null; });
  ok(dlg && /1 からもう一度処理/.test(dlg) && /My Pack へ戻した作品：1/.test(dlg), 'ダイアログ → ' + (dlg || '').slice(0, 80));
  if (dlg) { await p.locator('#pd-dlg .box').screenshot({ path: SP + 'rf_dlg.png' });
    await p.click('#pd-dlg [data-go]'); await p.waitForTimeout(2500);
    const st = await p.evaluate(() => document.querySelector('[data-r=status]').textContent);
    ok(/読み込み完了（ホーム）/.test(st), '1 から：ホーム全体を読み込み直し → ' + st.slice(0, 60));
    const sp2 = await p.evaluate(() => PPDup.buildSortPlan(PPDup.files, PPDup.folders).length);
    console.log('再読み込み後の仕分け計画', sp2); }
  await b.close();
  console.log(ng ? `NG ${ng}` : 'ALL OK');
})();
