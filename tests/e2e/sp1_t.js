const open = require('./h.js');
(async () => {
  const { b, p } = await open({ '': [{ id: 'v1', name: 'sample-A.mp4', kind: 'drive#file', size: '10' }, { id: 'v2', name: 'sample-B.mp4', kind: 'drive#file', size: '9' }] }, 'https://mypikpak.com/drive/all#dd/tree/');
  // PikPak の画面のように、ページ本体に focus があるときのスペースを横取りする処理を模す
  await p.evaluate(() => { document.addEventListener('keydown', (e) => { if (e.key === ' ' && (e.target === document.body || e.target === document.documentElement)) { e.preventDefault(); e.stopPropagation(); } }, true); });
  await p.click('[data-tid="v1"]'); await p.waitForTimeout(300); await p.evaluate(() => document.activeElement.blur());
  console.log('focus', await p.evaluate(() => document.activeElement.tagName + '.' + document.activeElement.className));
  await p.keyboard.press('Space'); await p.waitForTimeout(1200);
  console.log('スペースで開いた', await p.evaluate(() => !!document.getElementById('pd-ql')));
  await p.keyboard.press('Space'); await p.waitForTimeout(800); console.log('もう一度スペース（再生）', await p.evaluate(() => { const v = document.querySelector('#pd-ql video'); return v && !v.paused; }));
  await p.keyboard.press('Escape'); await p.waitForTimeout(300); console.log('Esc で閉じた', await p.evaluate(() => !document.getElementById('pd-ql')));
  await b.close();
})();
