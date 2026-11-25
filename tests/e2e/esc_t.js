const open = require('./h.js');
(async () => {
  const { b, p } = await open({ '': [{ id: 'v1', name: 'FC2-PPV-1234567_サンプル題名.mp4', kind: 'drive#file', size: '2000000000' }] }, 'https://mypikpak.com/drive/all#dd/tree/');
  await p.click('[data-tid="v1"]'); await p.keyboard.press('Space'); await p.waitForTimeout(1500);
  await p.click('#pd-ql .qp-stage', { position: { x: 30, y: 30 } }).catch(() => {});
  const st = () => p.evaluate(() => [!!document.querySelector('#pd-ql .pv-info'), !!document.getElementById('pd-ql'), document.activeElement && document.activeElement.tagName + '.' + document.activeElement.className]);
  await p.keyboard.press('i'); await p.waitForTimeout(200); console.log('I', await st());
  await p.evaluate(() => { window.__k = []; window.addEventListener('keydown', (e) => window.__k.push('win-cap-late:' + e.key), true); document.addEventListener('keydown', (e) => window.__k.push('doc:' + e.key + ':' + !!document.querySelector('#pd-ql .pv-info'))); });
  await p.keyboard.press('Escape'); await p.waitForTimeout(200); console.log(await p.evaluate(() => window.__k)); console.log('Esc1', await st());
  await p.keyboard.press('i'); await p.waitForTimeout(200); await p.click('#pd-ql [data-pvi-save]'); await p.waitForTimeout(200); console.log('保存後', await st());
  await p.keyboard.press('Escape'); await p.waitForTimeout(200); console.log('Esc2', await st());
  await b.close();
})();
