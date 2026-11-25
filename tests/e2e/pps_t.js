const open = require('./h.js');
const A = 'AAAAAAAAAAAAAAAAAAAA';
const vids = [], wi = {}, sd = {};
for (let i = 0; i < 60; i++) { const n = String(1000100 + i); vids.push({ id: 'v' + i, name: `FC2-PPV-${n}.mp4`, kind: 'drive#file', size: '300000000' }); sd[n] = { name: '販売者さんぷる' + i + (i === 50 ? ' とても長い名前のサンプル販売者 AROMA CLUB' : ''), sid: 's' + i, status: 'ok', at: 1 }; }
const tree = { '': [{ id: A, name: 'My Pack', kind: 'drive#folder' }], [A]: vids };
const pre = `localStorage.setItem('ppdup:seller:v1', ${JSON.stringify(JSON.stringify(sd))}); localStorage.setItem('ppdup:pplmode:v1','sel'); localStorage.setItem('ppdup:theme:v1','dark');`;
(async () => { const { b, p, SP } = await open(tree, 'https://mypikpak.com/drive/all', pre);
  await p.click('[data-rail=lib-people]'); await p.waitForTimeout(800);
  await p.evaluate(() => { document.querySelector('.pp-names').scrollTop = 800; }); await p.waitForTimeout(100);
  const before = await p.evaluate(() => document.querySelector('.pp-names').scrollTop);
  await p.evaluate(() => { const bs = [...document.querySelectorAll('.pp-names button')]; const r = document.querySelector('.pp-names').getBoundingClientRect(); bs.find((x) => { const q = x.getBoundingClientRect(); return q.top > r.top + 100; }).click(); });
  await p.waitForTimeout(800);
  const after = await p.evaluate(() => ({ st: document.querySelector('.pp-names').scrollTop, on: document.querySelector('.pp-names .on').textContent }));
  console.log((before > 0 && Math.abs(after.st - before) < 2 ? 'OK' : 'NG') + ' 選んだ位置のまま', before, JSON.stringify(after));
  await p.evaluate(() => { const l = document.querySelector('.pp-names'); l.scrollTop = l.scrollHeight; });
  await p.locator('.pp-side').screenshot({ path: SP + 'pps.png' });
  await b.close(); })();
