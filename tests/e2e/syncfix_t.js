// 販売者名の読み違い（4.18.x）の後始末が、PikPak で同期したときに古い記録で元に戻らないこと
//   ・手元の読み違いは起動時に直す（ログに 1 回）
//   ・PikPak 側の同期ファイルに古い読み違いが残っていても、取り込まない
//   ・PikPak 側へ書き戻す内容からも取り除く
const open = require('./h.js');
const BAD = { status: 'ok', name: '販売者', sid: 'x', src: 'fc2cmadb', at: 1 };
(async () => {
  const t = new Date().toISOString();
  const tree = {
    '': [{ id: 'sd', name: 'Dedupe（設定・同期）', kind: 'drive#folder' }, { id: 'v1', name: 'FC2-PPV-1234567.mp4', kind: 'drive#file', size: '1000', created_time: t }],
    sd: [{ id: 'sf', name: 'dedupe-sync.json', kind: 'drive#file', modified_time: t }],
  };
  const remote = {
    app: 'pikpak-distill',
    keys: {
      'ppdup:seller:v1': { v: JSON.stringify({ 1234567: BAD, 7654321: BAD, 1111111: { status: 'ok', name: '販売Y', sid: 'y', src: 'fd2ppv', at: 1 } }), at: 1, clr: 0 },
      'ppdup:winfo:v1': { v: JSON.stringify({ 1234567: { sellers: { fc2cmadb: { name: '販売者', sid: 'x' }, fd2ppv: { name: '販売X', sid: 'x1' } }, at: 1 } }), at: 1, clr: 0 },
    },
  };
  const pre = new Function(`
    localStorage.setItem('ppdup:sync:v1', JSON.stringify({ asked: true, on: true }));
    localStorage.setItem('ppdup:seller:v1', JSON.stringify({ 1234567: ${JSON.stringify(BAD)} }));
    localStorage.setItem('ppdup:winfo:v1', JSON.stringify({ 1234567: { sellers: { fc2cmadb: { name: '販売者', sid: 'x' }, fd2ppv: { name: '販売X', sid: 'x1' } }, at: 1 } }));
    window.__up = null;
    const f0 = window.fetch, remote = ${JSON.stringify(remote)};
    window.fetch = async (u0, o = {}) => {
      const u = String(u0);
      const ok = (body) => ({ ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) });
      if (u.startsWith('https://media.test/sf.')) return ok(remote); // 同期ファイルの中身（試験台は web_content_link を media.test にする）
      if (u.startsWith('https://sync.test/up')) { window.__up = JSON.parse(await o.body.get('file').text()); return ok({}); }
      if ((o.method || 'GET') === 'POST' && /\\/files$/.test(new URL(u, location.href).pathname)) return ok({ file: { id: 'new' }, form: { url: 'https://sync.test/up', method: 'POST', multi_parts: {} } });
      if ((o.method || 'GET') === 'POST' && /batchDelete|batchTrash/.test(u)) return ok({});
      return f0(u0, o);
    };
  `);
  const { b, p } = await open(tree, 'https://mypikpak.com/drive/all', pre);
  await p.waitForFunction(() => window.__up, null, { timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(500);
  const r = await p.evaluate(() => ({ s: JSON.parse(PPDup.lsGet('ppdup:seller:v1') || '{}'), w: JSON.parse(PPDup.lsGet('ppdup:winfo:v1') || '{}'), log: PPDup.lsGet('ppdup:log:v1') || '', up: window.__up }));
  const bad = (o) => Object.values(o).some((x) => x && x.name === '販売者');
  console.log(r.up ? 'OK' : 'NG', 'PikPak 側へ同期ファイルを書き戻した');
  console.log(!bad(r.s) && r.s[1234567] && r.s[1234567].name === '販売X' ? 'OK' : 'NG', '手元：読み違いはほかのサイトの名前に直り、PikPak 側から戻ってこない', JSON.stringify(r.s));
  console.log(!r.s[7654321] && r.s[1111111] ? 'OK' : 'NG', '手元：PikPak 側だけにある読み違いは取り込まず、正しい記録は取り込む');
  console.log(!r.w[1234567].sellers.fc2cmadb ? 'OK' : 'NG', '手元：作品の情報からも読み違いが消えている');
  const us = r.up ? JSON.parse(r.up.keys['ppdup:seller:v1'].v) : {}; const uw = r.up ? JSON.parse(r.up.keys['ppdup:winfo:v1'].v) : {};
  console.log(r.up && !bad(us) && !(uw[1234567] && uw[1234567].sellers.fc2cmadb) ? 'OK' : 'NG', 'PikPak 側へ書き戻す内容にも読み違いがない');
  console.log((r.log.match(/販売者名の読み違い/g) || []).length === 1 ? 'OK' : 'NG', 'ログ：「読み違いを直しました」は 1 回だけ');
  await b.close();
})();
