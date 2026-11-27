// 読み込み（スキャン）の見直しの確認
const open = require('./h.js');
const A = 'AAAAAAAAAAAAAAAAAAAA', B = 'BBBBBBBBBBBBBBBBBBBB', C = 'CCCCCCCCCCCCCCCCCCCC', GONE = 'GGGGGGGGGGGGGGGGGGGG';
const fi = (id, name) => ({ id, name, kind: 'drive#file', size: '200000000', thumbnail_link: 'https://t.test/' + 'x'.repeat(50) });
const tree = {
  '': [{ id: A, name: '販売者別', kind: 'drive#folder' }, { id: C, name: '壊れ', kind: 'drive#folder' }, fi('f0', 'FC2-PPV-1000001.mp4')],
  [A]: [{ id: B, name: 'さんぷる', kind: 'drive#folder', parent_id: A }, fi('f1', 'FC2-PPV-1000002.mp4')],
  [B]: [fi('f2', 'FC2-PPV-1000003.mp4'), fi('f3', 'FC2-PPV-1000004.mp4')],
  [C]: [fi('f9', 'x.mp4')],
};
// 指定の場所だけエラーを返す（PikPak の「認証コードが無効です」）
const pre = (bad) => `(() => { const f0 = window.fetch; window.__bad = ${JSON.stringify(bad)};
  window.fetch = async (u0, o) => { const u = new URL(String(u0), location.href); const m = u.pathname.match(/\\/files\\/([^/]+)$/);
    const key = m ? 'get:' + m[1] : 'list:' + (u.searchParams.get('parent_id') || '');
    if (window.__bad.includes(key)) { const body = { error: 'captcha_invalid', error_description: '認証コードが無効です' }; return { ok: false, status: 400, json: async () => body }; }
    if (m && m[1] === '${B}') { const body = { id: '${B}', name: 'さんぷる', kind: 'drive#folder', parent_id: '${A}' }; return { ok: true, status: 200, json: async () => body }; }
    if (m && m[1] === '${A}') { const body = { id: '${A}', name: '販売者別', kind: 'drive#folder', parent_id: '' }; return { ok: true, status: 200, json: async () => body }; }
    if (window.__slow) await new Promise((r) => setTimeout(r, 400));
    return f0(u0, o); }; })()`;
const lastLog = (p) => p.evaluate(() => JSON.parse(PPDup.lsGet('ppdup:log:v1') || '[]').slice(-6).map((x) => x.level + ' ' + x.msg + (x.ctx ? ' | ' + x.ctx : '')));
const st = (p) => p.evaluate(() => (document.querySelector('[data-r=status]') || {}).textContent || '');
let ng = 0; const ok = (c, m) => { console.log((c ? 'OK ' : 'NG ') + m); if (!c) ng++; };
(async () => {
  // 1. ホーム全体：壊れたフォルダ（一覧が「認証コードが無効です」）は飛ばして最後まで
  { const { b, p } = await open(tree, 'https://mypikpak.com/drive/all', pre(['list:' + C]));
    const n = await p.evaluate(() => PPDup.files.length);
    ok(n === 4, 'ホーム：読めないフォルダを飛ばして 4 件 → ' + n);
    const s = await st(p); ok(/読めなかったフォルダ 1/.test(s), '完了表示に読めなかった数：' + s.slice(0, 80));
    ok(!(await p.evaluate(() => sessionStorage.getItem('ppdup:resume:v1'))), '再読み込みしていない');
    // 2. 中断：前回の結果を残す
    await p.evaluate(() => { window.__slow = true; }); await p.evaluate(() => document.querySelector('[data-a=rsgo],[data-a=scan]') ? 0 : 0);
    await p.evaluate(() => { window.__ppdupStopTest = 1; });
    const started = await p.evaluate(async () => { const r = PPDup.scanApi(['root']); setTimeout(() => { window.__ppdupStop = true; }, 200); const x = await r; return { stopped: x.stopped, n: x.files.length }; });
    ok(started.stopped, 'scanApi は中断を返す（stopped）');
    await b.close(); }
  // 3. 標準画面でサブフォルダを開いている：本当の場所を表示・このフォルダだけ読む
  { const { b, p } = await open(tree, 'https://mypikpak.com/drive/all/' + B, pre([]));
    const s = await st(p); const n = await p.evaluate(() => PPDup.files.length);
    ok(n === 2 && /ホーム › 販売者別 › さんぷる/.test(s), 'サブフォルダ：場所の表示 → ' + s.slice(0, 60) + ' / ' + n + ' 件');
    await p.screenshot({ path: require('./h.js').OUT + 'scan_done.png' });
    // 4. ホーム全体を選ぶ
    await p.evaluate(() => localStorage.setItem('ppdup:scanscope:v1', 'home'));
    await p.evaluate(() => { document.querySelector('[data-a=rsgo]') ? document.querySelector('[data-a=rsgo]').click() : null; });
    await p.waitForTimeout(300);
    await b.close(); }
  // 5. 削除済みフォルダを開いたまま：ログイン切れ扱いにせず、ホームを読む
  { const { b, p } = await open(tree, 'https://mypikpak.com/drive/all/' + GONE, pre(['get:' + GONE]));
    const n = await p.evaluate(() => PPDup.files.length);
    const lg = await lastLog(p);
    ok(n === 5, '削除済みフォルダ → ホームを読む：' + n + ' 件');
    ok(!lg.some((x) => /再読み込み/.test(x)) && lg.some((x) => /見つからないため/.test(x)), 'ログ：' + lg.filter((x) => /見つから|再読み込み/.test(x)).join(' / '));
    await b.close(); }
  // 6. 確認画面：場所の選択と、選んだほうを覚える
  { const { b, p } = await open(tree, 'https://mypikpak.com/drive/all/' + B + '#dd/scan', `(${pre([])}, localStorage.setItem('ppdup:scanask:v1','1'))`);
    await p.evaluate(() => { localStorage.removeItem('ppdup:scanmeta:v1'); });
    await b.close(); }
  console.log(ng ? `NG ${ng}` : 'ALL OK');
})();
