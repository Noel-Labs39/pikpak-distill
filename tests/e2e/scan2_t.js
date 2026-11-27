const open = require('./h.js');
const A = 'AAAAAAAAAAAAAAAAAAAA', B = 'BBBBBBBBBBBBBBBBBBBB';
const fi = (id, name) => ({ id, name, kind: 'drive#file', size: '200000000', thumbnail_link: 'https://t.test/' + 'x'.repeat(50) });
const tree = { '': [{ id: A, name: '販売者別', kind: 'drive#folder' }, fi('f0', 'FC2-PPV-1000001.mp4')], [A]: [{ id: B, name: 'さんぷる', kind: 'drive#folder' }, fi('f1', 'FC2-PPV-1000002.mp4')], [B]: [fi('f2', 'FC2-PPV-1000003.mp4')] };
let ng = 0; const ok = (c, m) => { console.log((c ? 'OK ' : 'NG ') + m); if (!c) ng++; };
(async () => {
  // 中断：runScan で前回の結果を残す
  { const { b, p } = await open(tree, 'https://mypikpak.com/drive/all', `(() => { const f0 = window.fetch; window.fetch = async (u, o) => { if (window.__slow) await new Promise((r) => setTimeout(r, 500)); return f0(u, o); }; })()`);
    const n0 = await p.evaluate(() => PPDup.files.length);
    await p.evaluate(() => { window.__slow = true; window.__tree[''].push({ id: 'n1', name: 'new.mp4', kind: 'drive#file', size: '1' }); location.hash = 'dd/scan'; });
    await p.waitForTimeout(300);
    await p.evaluate(() => { const x = document.querySelector('[data-a=scan],[data-a=rsgo]'); x && x.click(); });
    await p.waitForTimeout(200);
    await p.evaluate(() => { const x = document.querySelector('[data-a=stop]'); if (x) x.click(); else window.__ppdupStop = true; });
    await p.waitForTimeout(5000);
    const n1 = await p.evaluate(() => PPDup.files.length), saved = await p.evaluate(() => JSON.parse(PPDup.lsGet('ppdup:scan:v1')).length);
    const s = await p.evaluate(() => document.querySelector('[data-r=status]').textContent);
    ok(n1 === n0 && saved === n0 && /中断/.test(s), `中断しても前回の結果のまま（${n0}→${n1}・保存 ${saved}）：${s.slice(0, 50)}`);
    await b.close(); }
  // ログイン切れ：途中までを保存して、続きから読む
  { const { b, p } = await open(tree, 'https://mypikpak.com/drive/all', `(() => { const f0 = window.fetch; window.__k = 0; window.fetch = async (u0, o) => { const u = new URL(String(u0), location.href); if (window.__expire && u.searchParams.get('parent_id') === '${B}') { const body = { error: 'unauthenticated', error_description: 'ログイン切れ' }; return { ok: false, status: 401, json: async () => body }; } return f0(u0, o); }; })()`);
    const r = await p.evaluate(async () => { window.__expire = true; try { await PPDup.scanApi(['root']); return 'no error'; } catch (e) { return { s: !!e.session, q: e.resumeState && e.resumeState.queue.map((x) => x.id), n: e.resumeState && e.resumeState.files.length }; } });
    ok(r.s && r.q && r.q.includes('BBBBBBBBBBBBBBBBBBBB') && r.n === 2, 'ログイン切れ：読めなかったフォルダを残りに入れる ' + JSON.stringify(r));
    const r2 = await p.evaluate(async (st) => { window.__expire = false; const x = await PPDup.scanApi(['root'], { resume: st }); return x.files.length; }, { files: [{ id: 'f0', name: 'a', path: '/' }, { id: 'f1', name: 'b', path: '/販売者別' }], folders: [{ id: 'AAAAAAAAAAAAAAAAAAAA', name: '販売者別', path: '/販売者別', trail: ['root', 'AAAAAAAAAAAAAAAAAAAA'] }], skipped: [], done: 2, queue: [{ id: 'BBBBBBBBBBBBBBBBBBBB', path: '/販売者別/さんぷる', trail: ['root', 'AAAAAAAAAAAAAAAAAAAA', 'BBBBBBBBBBBBBBBBBBBB'] }] });
    ok(r2 === 3, '続きから読んで合計 3 件 → ' + r2);
    await b.close(); }
  // 保存容量あふれ：サムネイルを外して保存
  { const { b, p } = await open(tree, 'https://mypikpak.com/drive/all', `(() => { Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true }); const s0 = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === 'ppdup:scan:v1' && String(v).includes('thumb')) throw new Error('QuotaExceededError'); return s0.call(this, k, v); }; })()`);
    const r = await p.evaluate(() => { const v = JSON.parse(PPDup.lsGet('ppdup:scan:v1') || 'null'); const lg = JSON.parse(PPDup.lsGet('ppdup:log:v1') || '[]'); return { n: v && v.length, thumb: v && v.some((x) => 'thumb' in x), warn: lg.some((x) => /サムネイルのアドレスを外して/.test(x.msg)) }; });
    ok(r.n === 3 && !r.thumb && r.warn, '容量あふれ：サムネイルなしで保存・ログ ' + JSON.stringify(r));
    await b.close(); }
  // 確認画面（場所の選択）
  { const { b, p } = await open(tree, 'https://mypikpak.com/drive/all/' + B);
    await p.evaluate(() => { const x = [...document.querySelectorAll('button,a,[data-a]')].find((e) => /再読み込み|再スキャン/.test(e.textContent) && e.dataset.a !== 'rsgo'); window.__btn = x && (x.dataset.a || x.textContent); x && x.click(); });
    await p.waitForTimeout(600);
    const has = await p.evaluate(() => !!document.querySelector('#pd-dlg input[name=pdscope]'));
    ok(has, '確認画面に場所の選択 （' + await p.evaluate(() => window.__btn) + '）');
    if (has) { await p.click('#pd-dlg input[value=home]'); ok(await p.evaluate(() => localStorage.getItem('ppdup:scanscope:v1')) === 'home', '選んだほうを覚える');
      await p.locator('#pd-dlg .box').screenshot({ path: require('./h.js').OUT + 'scan_dlg.png' }); }
    await b.close(); }
  console.log(ng ? `NG ${ng}` : 'ALL OK');
})();
