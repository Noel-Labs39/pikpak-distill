const open = require('./h.js');
const fs = require('fs');
(async () => {
  const t = new Date().toISOString();
  const { b, p, SP } = await open({ '': [{ id: 'v1', name: 'FC2-PPV-1234567_サンプル題名.mp4', kind: 'drive#file', size: '2000000000', created_time: t }] }, 'https://mypikpak.com/drive/all#dd/tree/');
  const ctx = p.context();
  const SRC = fs.readFileSync(require('path').join(__dirname, '..', '..', 'pikpak-distill.user.js'), 'utf8');
  await ctx.addInitScript({ content: `if (/fd2ppv|fc2cmadb/.test(location.hostname)) addEventListener('DOMContentLoaded', () => { ${SRC} });` });
  let hits = { root: 0, art: 0 };
  await ctx.route('https://fd2ppv.cc/**', (r) => {
    const u = r.request().url();
    if (/\/articles\/1234567/.test(u)) {
      hits.art++;
      if (hits.art === 1) return r.fulfill({ contentType: 'text/html', body: '<html><head><meta charset="utf-8"><title>しばらくお待ちください...</title></head><body><h1>fd2ppv.cc</h1><div class="cf-turnstile"></div></body></html>' });
      return r.fulfill({ contentType: 'text/html', body: `<html><head><meta charset="utf-8"><title>FC2 PPV 1234567</title></head><body>
        <div class="work-brief">サンプルの作品タイトル</div>
        <div class="work-meta"><div class="work-meta-label">配信日</div><div>2026-11-11</div><div class="work-meta-label">収録時間</div><div>01:28:09</div><div class="work-meta-label">モザイク</div><div><span>無</span></div><div class="work-meta-label">販売者</div><div><a href="/channels/sample">サンプル販売者</a></div></div>
        <a href="/tags/x">#サンプルタグ</a><a href="/tags/actresses/y">巨乳</a>
        <div class="artist-info-card"><div class="artist-details"><h3 class="artist-name"><a class="artistUrl" href="/actresses/175">サンプル女優</a></h3></div></div></body></html>` });
    }
    hits.root++; return r.fulfill({ contentType: 'text/html', body: '<html><head><title>top</title></head><body>top</body></html>' });
  });
  await ctx.route('https://fc2cmadb.com/**', (r) => { hits.cm = (hits.cm || 0) + 1; return r.fulfill({ contentType: 'text/html; charset=utf-8', body: '<html><head><title>1234567</title></head><body><h1>サンプル題名（CMADB）</h1><table><tr><th>販売者：</th><td><a href="https://fc2cmadb.com/writers/sample">別の販売者名</a></td></tr><tr><th>女優：</th><td><a href="/actresses/9">別の女優名</a></td></tr></table></body></html>' }); });
  await p.click('[data-tid="v1"]'); await p.keyboard.press('Space'); await p.waitForTimeout(1500);
  await p.click('#pd-ql .qp-stage', { position: { x: 30, y: 30 } }).catch(() => {});
  await p.keyboard.press('i'); await p.waitForTimeout(300);
  const txt = () => p.evaluate(() => { const e = document.querySelector('#pd-ql .pv-info'); return e ? e.innerText.replace(/\s+/g, ' ').slice(0, 400) : '(枠なし)'; });
  console.log('開いた', await txt());
  const t0 = Date.now();
  await p.click('#pd-ql [data-pvi-look]');
  for (let i = 0; i < 60; i++) { await p.waitForTimeout(500); if (/別の女優名/.test(await txt())) break; }
  console.log('調べた後', Math.round((Date.now() - t0) / 1000) + '秒', JSON.stringify(hits), await txt());
  console.log('popups open', ctx.pages().length);
  await p.screenshot({ path: SP + 'info_ql.png' });
  await p.fill('#pd-ql [data-pvi-act]', 'サンプルA、サンプルB'); await p.click('#pd-ql [data-pvi-save]'); await p.waitForTimeout(200);
  console.log('手入力', (await txt()).match(/女優.{0,30}/)[0]);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200); console.log('Esc', await txt(), await p.evaluate(() => !!document.getElementById('pd-ql')));
  console.log('log', await p.evaluate(() => JSON.stringify(JSON.parse(PPDup.lsGet('ppdup:winfo:v1')))));
  await b.close();
})();
