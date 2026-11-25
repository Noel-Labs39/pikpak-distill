// 共通の試験台：PikPak の画面とAPIを模して、ユーザースクリプトを読み込む
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
// スクリーンショットなどの出力先（git には入れない）
const SP = path.join(__dirname, 'out') + '/';
fs.mkdirSync(SP, { recursive: true });
const MEDIA = path.join(__dirname, 'fixtures', 'v.mp4'); // 自作の 20 秒の試験用動画
const SRC = fs.readFileSync(path.join(__dirname, '..', '..', 'pikpak-distill.user.js'), 'utf8');
const open = async function open(tree, url = 'https://mypikpak.com/drive/all', pre) {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 900 }, locale: 'ja-JP' });
  p.on('pageerror', (e) => console.log('pageerr', e.message));
  await p.route('https://media.test/**', (r) => r.fulfill({ path: MEDIA, contentType: 'video/mp4' }));
  await p.route('https://mypikpak.com/**', (r) => r.fulfill({ contentType: 'text/html', body: '<html><head></head><body style="margin:0;background:#202020"><div id="app"></div></body></html>' }));
  const hash = (url.split('#')[1] || ''); await p.goto(url.split('#')[0]);
  await p.evaluate((tree) => {
    localStorage.setItem('credentials_x', JSON.stringify({ access_token: 'T' }));
    localStorage.setItem('ppdup:sync:v1', JSON.stringify({ asked: true, on: false }));
    window.__tree = tree;
    const all = () => Object.values(window.__tree).flat();
    window.fetch = async (u0) => {
      const u = new URL(String(u0), location.href);
      const m = u.pathname.match(/\/files\/([^/]+)$/);
      let body;
      if (m) { const f = all().find((x) => x.id === m[1]) || { id: m[1], name: m[1], kind: 'drive#file' }; body = { ...f, medias: [{ is_origin: true, media_name: '原画', link: { url: 'https://media.test/' + f.id + '.mp4' }, video: { width: 320, height: 180 } }], web_content_link: 'https://media.test/' + f.id + '.mp4' }; }
      else body = { files: window.__tree[u.searchParams.get('parent_id') || ''] || [] };
      return { ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) };
    };
  }, tree);
  if (pre) await p.evaluate(pre);
  await p.addScriptTag({ content: SRC });
  await p.waitForTimeout(800);
  await p.evaluate(() => { location.hash = 'dd/scan'; }); await p.waitForTimeout(800);
  await p.waitForSelector('[data-a=scan]', { state: 'visible', timeout: 6000 }).then((sc) => sc.click()).catch(() => console.log('（読み込みボタンなし）')); await p.waitForTimeout(1500);
  if (hash) { await p.evaluate((h) => { location.hash = h; }, hash); await p.waitForTimeout(1500); }
  return { b, p, SP };
};

open.OUT = SP;
module.exports = open;
