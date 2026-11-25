const open = require('./h.js');
const A = 'AAAAAAAAAAAAAAAAAAAA';
const v = (id, name) => ({ id, name, kind: 'drive#file', size: '300000000', created_time: '2026-11-0' + id.slice(-1) + 'T00:00:00Z', thumbnail_link: '' });
const tree = { '': [{ id: A, name: 'My Pack', kind: 'drive#folder' }], [A]: [v('v1', 'FC2-PPV-1000001.mp4'), v('v2', 'FC2-PPV-1000002.mp4'), v('v3', 'FC2-PPV-1000003.mp4'), v('v4', 'FC2-PPV-1000004.mp4')] };
const pre = `(() => {
  localStorage.setItem('ppdup:winfo:v1', JSON.stringify({ '1000001': { title: 'たいとるA', actresses: [{ name: 'さんぷるA' }], at: 1 }, '1000002': { actresses: [{ name: 'さんぷるA' }, { name: 'さんぷるB' }], at: 1 }, '1000003': { actresses: [{ name: 'さんぷるB' }], at: 1 } }));
  localStorage.setItem('ppdup:seller:v1', JSON.stringify({ '1000001': { name: '販売X', sid: 'x', status: 'ok', at: 1 }, '1000002': { name: '販売X', sid: 'x', status: 'ok', at: 1 }, '1000004': { name: '販売X', sid: 'x', status: 'ok', at: 1 } }));
})()`;
let ng = 0; const ok = (c, m) => { console.log((c ? 'OK ' : 'NG ') + m); if (!c) ng++; };
(async () => {
  const { b, p, SP } = await open(tree, 'https://mypikpak.com/drive/all', pre);
  p.on('pageerror', (e) => console.log('pageerr', e.message));
  await p.click('[data-rail=lib-people]'); await p.waitForTimeout(800);
  const names = await p.evaluate(() => [...document.querySelectorAll('.pp-names button')].map((b) => b.textContent));
  ok(JSON.stringify(names) === JSON.stringify(['さんぷるA2 作品', 'さんぷるB2 作品', '出演者不明1 作品']), '出演者の一覧 ' + JSON.stringify(names));
  const cards = await p.evaluate(() => document.querySelectorAll('#pd-lib [data-lbc]').length);
  ok(cards === 2, 'さんぷるA の作品 2 件 → ' + cards);
  await p.screenshot({ path: SP + 'pp_list.png' });
  await p.click('[data-lbpm=sel]'); await p.waitForTimeout(500);
  const sn = await p.evaluate(() => [...document.querySelectorAll('.pp-names button')].map((b) => b.textContent));
  ok(sn[0] === '販売X3 作品', '販売者の一覧 ' + JSON.stringify(sn));
  await p.click('.pp-chip >> nth=0'); await p.waitForTimeout(500);
  ok(await p.evaluate(() => document.querySelector('.pp-mode .on').dataset.lbpm === 'act'), '内訳から出演者へ切り替え');
  await p.fill('[data-lbpq]', 'B'); await p.waitForTimeout(200);
  ok((await p.evaluate(() => document.querySelectorAll('.pp-names button').length)) === 1 && await p.evaluate(() => document.activeElement.dataset.lbpq !== undefined), '絞り込み（入力欄にフォーカスのまま）');
  // 右クリック
  await p.click('[data-lbpm=act]'); await p.waitForTimeout(500);
  await p.click('#pd-lib [data-lbc] >> nth=0', { button: 'right' }); await p.waitForTimeout(300);
  const menu = await p.evaluate(() => [...document.querySelectorAll('#pd-ctx button')].map((b) => b.textContent));
  ok(menu.some((x) => /簡易プレーヤー/.test(x)) && menu.some((x) => /格納/.test(x)) && menu.some((x) => /同じ販売者の作品（販売X）/.test(x)), 'メニュー ' + JSON.stringify(menu));
  await p.screenshot({ path: SP + 'pp_menu.png' });
  // 作品の情報 → 関連作品
  await p.click('#pd-ctx [data-wm=info]'); await p.waitForTimeout(2500);
  const rel = await p.evaluate(() => ({ ppl: (document.querySelector('.pv-ppl') || {}).textContent, rel: [...document.querySelectorAll('[data-pvi-rel]')].map((b) => b.textContent) }));
  ok(rel.ppl && /販売X/.test(rel.ppl) && rel.rel.length >= 1, '情報の枠：リンクと関連 ' + JSON.stringify(rel));
  await p.screenshot({ path: SP + 'pp_info.png' });
  // リンクで一覧へ
  await p.click('[data-pvi-ppl=sel]'); await p.waitForTimeout(800);
  ok(await p.evaluate(() => document.querySelector('.pp-hd b').textContent) === '販売X', '販売者リンクで一覧へ');
  // Shift+F10
  await p.focus('#pd-lib [data-lbc] >> nth=0'); await p.keyboard.press('Shift+F10'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => !!document.querySelector('#pd-ctx') && document.activeElement.closest('#pd-ctx') !== null), 'Shift+F10 でメニュー・先頭にフォーカス');
  await p.keyboard.press('Escape');
  ok(await p.evaluate(() => !document.querySelector('#pd-ctx') && !!document.getElementById('pd-lib')), 'Esc でメニューだけ閉じる');
  await b.close(); console.log(ng ? 'NG ' + ng : 'ALL OK');
})();
