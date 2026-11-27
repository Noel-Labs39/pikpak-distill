// 全体の骨組み（4.24）：左メニューのまとまり・上のバーの名前付きボタン・どの画面からでも検索
const open = require('./h.js');
(async () => {
  const t = new Date().toISOString();
  const tree = { '': [{ id: 'mp', name: 'My Pack', kind: 'drive#folder' }], mp: [{ id: 'a1', name: 'FC2-PPV-1234567.mp4', kind: 'drive#file', size: '1000', created_time: t }, { id: 'a2', name: 'FC2-PPV-2345678.mp4', kind: 'drive#file', size: '2000', created_time: t }] };
  const { b, p, SP } = await open(tree, 'https://mypikpak.com/drive/all#dd/scan');
  const r = await p.evaluate(() => {
    const vis = (el) => !!el && el.offsetParent !== null;
    const rail = document.querySelector('#ppdup .rail');
    return {
      grps: [...rail.querySelectorAll('.rl-grp')].filter(vis).map((x) => x.textContent),
      railAdd: !!rail.querySelector('[data-a=addlink],[data-a=rescan],[data-a=setinfo],[data-a=changelog]'),
      order: [...rail.querySelectorAll('[data-rail]')].map((x) => x.dataset.rail).join(','),
      scan: vis(document.querySelector('#ppdup header [data-a=rescan]')) && /読み込み直す/.test(document.querySelector('#ppdup header [data-a=rescan]').textContent),
      q: vis(document.querySelector('#ppdup header [data-a=tq]')),
      dupSet: vis(document.querySelector('#ppdup header .hbtn[data-a=settings]')) || vis(document.querySelector('#ppdup header .hacct')),
      edge: !!document.querySelector('#ppdup header [data-a=edgescroll]'),
    };
  });
  console.log(r.grps.join('/') === '整理する/見る/片付ける' ? 'OK' : 'NG', '左メニュー：3 つのまとまり', r.grps.join('/'));
  console.log(!r.railAdd ? 'OK' : 'NG', '左メニュー：リンク・再読み込み・書き出し・更新履歴は置かない');
  console.log(r.order === 'flow,tree,lib-recent,lib-cont,lib-people,lib-star,lib-hist,lib-dl,lib-cand,lib-trash,set' ? 'OK' : 'NG', '左メニュー：並び', r.order);
  console.log(r.scan ? 'OK' : 'NG', '上のバー：「読み込み直す」が名前付きで出る');
  console.log(r.q ? 'OK' : 'NG', '上のバー：整理の画面でも検索が出る');
  console.log(!r.dupSet && !r.edge ? 'OK' : 'NG', '上のバー：設定・ログイン状態・端でスクロールは出さない（左メニューと設定にある）');
  await p.click('[data-rail=lib-people]'); await p.waitForTimeout(800);
  console.log(!(await p.$('#pd-lib .lb-tabs')) ? 'OK' : 'NG', '一覧：上のタブ（左メニューと同じもの）は出さない');
  await p.fill('[data-a=tq]', '2345678'); await p.waitForTimeout(800);
  const s = await p.evaluate(() => [document.getElementById('ppdup').classList.contains('treev'), document.querySelectorAll('.sr-row').length]);
  console.log(s[0] && s[1] === 1 ? 'OK' : 'NG', '検索：ほかの画面で入力するとフォルダ一覧で全体から探す', JSON.stringify(s));
  await p.screenshot({ path: SP + 'frame.png' });
  await b.close();
})();
