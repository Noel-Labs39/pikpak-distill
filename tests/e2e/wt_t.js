const open = require('./h.js');
(async () => {
  const mk = (id, name, size) => ({ id, name, kind: 'drive#file', size: String(size) });
  const { b, p, SP } = await open({
    '': [{ id: 'A', name: 'フォルダA', kind: 'drive#folder' }, { id: 'B', name: 'フォルダB', kind: 'drive#folder' }, { id: 'C', name: 'SSIS-456', kind: 'drive#folder' }],
    A: [mk('a1', 'FC2-PPV-1234567 夏の思い出【高画質】 1080p.mp4', 2e9), mk('a2', 'ssis00123.mp4', 1.5e9)],
    B: [mk('b1', 'FC2-PPV-1234567.mp4', 1.9e9), mk('b2', 'SSIS-123_別の題名.mp4', 1.4e9)],
    C: [mk('c1', '1.mp4', 1e9), mk('c2', '2.mp4', 1e9)],
  }, 'https://mypikpak.com/drive/all#dd/step/name');
  await p.waitForTimeout(800);
  console.log('名前を整える', JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('.kit-row')].map((r) => r.innerText.replace(/\s+/g, ' ').slice(0, 120)))));
  await p.screenshot({ path: SP + 'wt_name.png' });
  await p.evaluate(() => { location.hash = 'dd/step/dup'; }); await p.waitForTimeout(1200);
  console.log('重複', JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('.pd-g')].map((g) => [...g.querySelectorAll('.pd-row')].map((r) => r.dataset.id).join('+')))));
  await p.screenshot({ path: SP + 'wt_dup.png' });
  await p.evaluate(() => { location.hash = 'dd/step/junk'; }); await p.waitForTimeout(800);
  console.log('不要', JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('.kit-row')].map((r) => r.dataset.id))));
  await p.evaluate(() => { location.hash = 'dd/step/sort'; }); await p.waitForTimeout(800);
  console.log((await p.evaluate(() => document.querySelector('[data-r=main]').innerText)).slice(0, 300).replace(/\n/g, ' '));
  console.log('仕分け', JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('.kit-row')].map((r) => r.innerText.replace(/\s+/g, ' ').slice(0, 110)))));
  await p.evaluate(() => { location.hash = 'dd/step/ren'; }); await p.waitForTimeout(800);
  console.log('フォルダ名', JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('.kit-row')].map((r) => r.innerText.replace(/\s+/g, ' ').slice(0, 110)))));
  await b.close();
})();
