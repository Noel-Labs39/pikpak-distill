const open = require('./h.js');
(async () => {
  const t = new Date().toISOString();
  const { b, p } = await open({ '': [{ id: 'v1', name: 'sample-A.mp4', kind: 'drive#file', size: '10', created_time: t, modified_time: t }, { id: 'v2', name: 'sample-B.mp4', kind: 'drive#file', size: '9', created_time: t, modified_time: t }] }, 'https://mypikpak.com/drive/all#dd/lib/recent');
  await p.waitForTimeout(1500);
  const st = () => p.evaluate(() => { const v = document.querySelector('#pd-lib .lb-pv video'); return { pv: !!document.querySelector('#pd-lib .lb-pv'), lib: !!document.getElementById('pd-lib'), name: (document.querySelector('#pd-lib .lb-pv .lk-hd b') || {}).textContent, rate: v && v.playbackRate, paused: v && v.paused }; });
  console.log('並び', await p.evaluate(() => [...document.querySelectorAll('[data-lbc]')].map((e) => e.dataset.lbc).join(','))); await p.click('[data-lbc]'); await p.keyboard.press('Space'); await p.waitForTimeout(1500);
  console.log('開いた', JSON.stringify(await st()));
  await p.selectOption('#pd-lib .lb-pv select[data-rate]', '3'); await p.waitForTimeout(200);
  console.log('3倍に変更', JSON.stringify(await st()));
  await p.evaluate(() => { const v = document.querySelector('#pd-lib .lb-pv video'); v.dispatchEvent(new Event('ended')); }); await p.waitForTimeout(2500); console.log(await p.evaluate(() => { const v = document.querySelector('#pd-lib .lb-pv video'); return v && [v.duration, v.currentTime, v.ended, v.loop, v.src.slice(0, 40)]; }));
  console.log('最後まで再生（続けて流す）', JSON.stringify(await st()));
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  console.log('Esc', JSON.stringify(await st()));
  await p.selectOption('#pd-lib select[data-rate], body select[data-rate]', '1').catch(() => {});
  await b.close();
})();
