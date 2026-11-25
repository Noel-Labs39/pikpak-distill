const open = require('./h.js');
const fs = require('fs');
(async () => {
  const t = new Date().toISOString();
  const { b, p, SP } = await open({ '': [{ id: 'v1', name: 'FC2-PPV-1234567_サンプル題名.mp4', kind: 'drive#file', size: '2000000000', created_time: t }] }, 'https://mypikpak.com/drive/all#dd/tree/');
  const ctx = p.context();
  const SRC = fs.readFileSync('/home/claude/pikpak-distill/pikpak-distill.user.js', 'utf8');
  await ctx.addInitScript({ content: `if (/fd2ppv|fc2cmadb/.test(location.hostname)) addEventListener('DOMContentLoaded', () => { ${SRC} });` });
  let hits = { fd: 0, cm: 0 };
  await ctx.route('https://fd2ppv.cc/**', (r) => { hits.fd++; return r.fulfill({ contentType: 'text/html', body: '<html><head><meta charset="utf-8"><title>404 Not Found</title></head><body>404</body></html>' }); });
  await ctx.route('https://fc2cmadb.com/**', (r) => { hits.cm++; return r.fulfill({ contentType: 'text/html', body: `<html><head><meta charset="utf-8"><title>1234567</title></head><body><h1>サンプルの題名（CMADB）</h1><table>
    <tr><th>販売者：</th><td><a href="https://fc2cmadb.com/writers/sample">サンプル販売者B</a></td></tr>
    <tr><th>女優：</th><td id="act"></td></tr><tr><th>モザイク：</th><td>無</td></tr><tr><th>販売日：</th><td>2026-11-11</td></tr><tr><th>収録時間：</th><td>01:28:09</td></tr>
    <tr><th>タグ：</th><td><a href="/tags/a">サンプルA</a><a href="/tags/b">サンプルB</a></td></tr></table>
    <script>setTimeout(() => { document.getElementById('act').innerHTML = '<a href="https://fc2cmadb.com/actresses/11904">サンプル女優C</a>'; }, 900);</script></body></html>` }); });
  await p.click('[data-tid="v1"]'); await p.keyboard.press('Space'); await p.waitForTimeout(1500);
  await p.click('#pd-ql .qp-stage', { position: { x: 30, y: 30 } }).catch(() => {});
  await p.keyboard.press('i'); await p.waitForTimeout(300);
  const txt = () => p.evaluate(() => { const e = document.querySelector('#pd-ql .pv-info'); return e ? e.innerText.replace(/\s+/g, ' ').slice(0, 400) : '(枠なし)'; });
  console.log('開いた', await txt());
  const t0 = Date.now();
  await p.click('#pd-ql [data-pvi-look]');
  for (let i = 0; i < 60; i++) { await p.waitForTimeout(500); if (/サンプル女優C/.test(await txt())) break; }
  console.log('調べた後', Math.round((Date.now() - t0) / 1000) + '秒', JSON.stringify(hits), await txt());
  console.log('popups open', ctx.pages().length);
  await p.screenshot({ path: SP + 'info_cm.png' });
  await p.fill('#pd-ql [data-pvi-act]', 'サンプルA、サンプルB'); await p.click('#pd-ql [data-pvi-save]'); await p.waitForTimeout(200);
  console.log('手入力', (await txt()).match(/女優.{0,30}/)[0]);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200); console.log('Esc', await txt(), await p.evaluate(() => !!document.getElementById('pd-ql')));
  console.log('log', await p.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('ppdup:winfo:v1')))));
  await b.close();
})();
