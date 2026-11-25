const open = require('./h.js');
(async () => {
  const t = new Date().toISOString();
  const { b, p } = await open({ '': [{ id: 'v1', name: 'sample-A.mp4', kind: 'drive#file', size: '10', created_time: t }] }, 'https://mypikpak.com/drive/all#dd/lib/recent');
  await p.click('[data-lbc]'); await p.keyboard.press('Space'); await p.waitForTimeout(1200);
  console.log(await p.evaluate(() => { const el = document.querySelector('#pd-lib .pv-x'); const out = []; for (const ss of document.styleSheets) { let rules; try { rules = ss.cssRules; } catch (e) { continue; } for (const r of rules) { if (r.selectorText && el.matches(r.selectorText) && /background/.test(r.style.cssText)) out.push(r.selectorText.slice(0, 120) + ' => ' + r.style.background.slice(0, 60)); } } return [getComputedStyle(el).backgroundColor, ...out]; }));
  await b.close();
})();
