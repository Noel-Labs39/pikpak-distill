const open = require('./h.js');
(async () => {
  const t = new Date().toISOString();
  const { b, p } = await open({ '': [{ id: 'v1', name: 'sample-A.mp4', kind: 'drive#file', size: '10', created_time: t }, { id: 'v2', name: 'sample-B.mp4', kind: 'drive#file', size: '9', created_time: t }] }, 'https://mypikpak.com/drive/all#dd/tree/');
  await p.evaluate(() => localStorage.setItem('ppdup:player:v1', JSON.stringify({ mode: 'full' })));
  await p.click('[data-tid="v1"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(1500);
  await p.evaluate(() => document.fullscreenElement && document.exitFullscreen()); await p.waitForTimeout(400);
  const nm = () => p.evaluate(() => { const d = document.getElementById('pd-player'); return d ? d.querySelector('.pv-hd b').textContent : '閉じている'; });
  console.log('開いた', await nm());
  await p.keyboard.press('PageDown'); await p.waitForTimeout(1200); console.log('PageDown', await nm());
  await p.evaluate(() => document.fullscreenElement && document.exitFullscreen()); await p.waitForTimeout(300);
  await p.click('#pd-player [data-pvloc]'); await p.waitForTimeout(500); console.log('場所を開く', await nm(), await p.evaluate(() => (document.querySelector('.tr-row.cur') || {}).dataset));
  await p.keyboard.press('Enter'); await p.waitForTimeout(1200); await p.evaluate(() => document.fullscreenElement && document.exitFullscreen()); await p.waitForTimeout(300);
  await p.mouse.click(700, 300); await p.keyboard.press('Escape'); await p.waitForTimeout(400); console.log('Esc', await nm());
  await b.close();
})();
