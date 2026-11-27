const open = require('./h.js');
const fs = require('fs');
(async () => {
  const mk = (id, name) => ({ id, name, kind: 'drive#file', size: '2000000000' });
  const pre = () => {
    localStorage.setItem('ppdup:seller:v1', JSON.stringify({ 1234567: { name: '古い名前', sid: 'samp', src: 'fd2ppv', status: 'ok', at: 1 }, 1111111: { name: '販売者', sid: 'bookmark-ranking', src: 'manual', status: 'ok', at: 1, from: 'fc2cmadb' } }));
    localStorage.setItem('ppdup:winfo:v1', JSON.stringify({ 1111111: { title: 'x', sellers: { fd2ppv: { name: '正しい名前', sid: 'good' }, fc2cmadb: { name: '販売者', sid: 'bookmark-ranking' } }, at: 1 } }));
  };
  const { b, p, SP } = await open({ '': [{ id: 'F', name: 'サンプル', kind: 'drive#folder' }], F: [mk('a', 'FC2-PPV-1234567.mp4'), mk('b', 'FC2-PPV-7654321.mp4'), mk('c', 'FC2-PPV-1111111.mp4')] }, 'https://mypikpak.com/drive/all', pre);
  console.log('後始末', await p.evaluate(() => [JSON.parse(PPDup.lsGet('ppdup:seller:v1'))['1111111'], JSON.parse(PPDup.lsGet('ppdup:winfo:v1'))['1111111'].sellers]));
  const ctx = p.context();
  const SRC = fs.readFileSync(require('path').join(__dirname, '..', '..', 'pikpak-distill.user.js'), 'utf8');
  await ctx.addInitScript({ content: `if (/fd2ppv|fc2cmadb/.test(location.hostname)) addEventListener('DOMContentLoaded', () => { ${SRC} });` });
  const hits = [];
  await ctx.route('https://fd2ppv.cc/**', (r) => { const u = r.request().url(); hits.push('fd:' + (u.match(/articles\/(\d+)/) || [, 'top'])[1]);
    const act = /1234567/.test(u) ? '<div class="artist-info-card"><a class="artistUrl" href="/actresses/1">サンプル女優</a></div>' : '';
    return r.fulfill({ contentType: 'text/html; charset=utf-8', body: /articles/.test(u) ? `<html><head><title>FC2 PPV</title></head><body><div class="work-brief">サンプル題名</div><div class="work-meta"><div class="work-meta-label">販売者</div><div><a href="/channels/samp">新しい名前</a></div></div>${act}</body></html>` : '<html><body>top</body></html>' }); });
  await ctx.route('https://fc2cmadb.com/**', (r) => { hits.push('cm:' + (r.request().url().match(/articles\/(\d+)/) || [, '?'])[1]);
    return r.fulfill({ contentType: 'text/html; charset=utf-8', body: `<html><head><title>x</title></head><body><nav><ul><li>販売者 <a href="https://fc2cmadb.com/writers/bookmark-ranking">販売者</a></li></ul></nav><h1>サンプル題名</h1><div id="t"></div>
      <script>setTimeout(() => { document.getElementById('t').innerHTML = '<table><tr><th>販売者：</th><td><a href="https://fc2cmadb.com/writers/samp2">別の販売者</a></td></tr><tr><th>女優：</th><td><a href="/actresses/9">別の女優</a></td></tr></table>'; }, 1500);</script></body></html>` }); });
  await p.evaluate(() => { window.confirm = () => true; location.hash = 'dd/step/seller'; }); await p.waitForTimeout(1200);
  await p.click('[data-a=sinfo][data-v=all]');
  for (let i = 0; i < 160; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => /作品の情報を調べました/.test((document.querySelector('[data-r=status]') || {}).textContent || ''))) break; }
  console.log('開いたページ', hits.filter((h) => !/top|\?/.test(h)).join(','));
  console.log('status', await p.evaluate(() => (document.querySelector('[data-r=status]') || {}).textContent));
  console.log('7654321', await p.evaluate(() => JSON.stringify(JSON.parse(PPDup.lsGet('ppdup:winfo:v1'))['7654321'].sellers)));
  await p.click('[data-a=sdiff]'); await p.waitForTimeout(300);
  const btns = () => p.evaluate(() => [...document.querySelectorAll('#pd-dlg tbody tr')].map((tr) => [...tr.querySelectorAll('button')].map((x) => (x.disabled ? '×' : '○') + x.textContent).join('|')));
  console.log('一覧', JSON.stringify(await btns()));
  await p.screenshot({ path: SP + 'diff2.png' });
  await p.click('#pd-dlg tbody tr:first-child [data-sd-keep]'); await p.waitForTimeout(200);
  console.log('1件目を「いまのまま」後', await p.evaluate(() => document.querySelector('#pd-dlg h3').textContent));
  await p.click('[data-sd-all=fc2cmadb]'); await p.waitForTimeout(200);
  console.log('全部 fc2cmadb 後', await p.evaluate(() => document.querySelector('#pd-dlg h3').textContent));
  await b.close();
})();
