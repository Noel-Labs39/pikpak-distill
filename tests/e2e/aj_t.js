const open = require('./h.js');
const T = 'TOPTOPTOPTOPTOPTOPTO';
const tree = { '': [{ id: T, name: 'fc2-ppv-1234567 さんぷる', kind: 'drive#folder' }], [T]: [{ id: 'v', name: 'FC2-PPV-1234567.mp4', kind: 'drive#file', size: '900000000' }, { id: 'g1', name: 'geosite.dat', kind: 'drive#file', size: '10485760' }, { id: 'g2', name: 'geoip.dat', kind: 'drive#file', size: '19818086' }, { id: 'g3', name: 'geoip.dat', kind: 'drive#file', size: '5' }] };
const pre = `(() => { localStorage.setItem('ppdup:addlog:v1', JSON.stringify([{ lid: 'L1', at: Date.now(), mode: 'all', name: 'さんぷる', task: 'TK', fid: '${T}', junk: [{ p: 'geosite.dat', s: 10485760, r: '広告' }, { p: 'geoip.dat', s: 19818086, r: '広告' }] }]));
  const f0 = window.fetch; window.__trash = [];
  window.fetch = async (u0, o = {}) => { const u = new URL(String(u0), location.href); const J = (b) => ({ ok: true, status: 200, json: async () => b });
    if (/\\/tasks$/.test(u.pathname)) return J({ tasks: [{ id: 'TK', phase: window.__ph || 'PHASE_TYPE_RUNNING', file_id: '${T}' }] });
    if (/batchTrash/.test(u.pathname)) { window.__trash.push(...JSON.parse(o.body).ids); return J({}); }
    if (/\\/files\\/${T}$/.test(u.pathname)) return J({ id: '${T}', kind: 'drive#folder', name: 'x' });
    return f0(u0, o); }; })()`;
(async () => { const { b, p } = await open(tree, 'https://mypikpak.com/drive/all', pre);
  await p.evaluate(() => PPDup.addJunkSweep());
  const r1 = await p.evaluate(() => ({ t: window.__trash.slice(), d: JSON.parse(localStorage.getItem('ppdup:addlog:v1'))[0].jdone }));
  console.log((r1.t.length === 0 && !r1.d ? 'OK' : 'NG') + ' ダウンロード中は何もしない', JSON.stringify(r1));
  await p.evaluate(async () => { window.__ph = 'PHASE_TYPE_COMPLETE'; await PPDup.addJunkSweep(); });
  const r2 = await p.evaluate(() => ({ t: window.__trash.slice(), d: JSON.parse(localStorage.getItem('ppdup:addlog:v1'))[0].jdone, lg: JSON.parse(localStorage.getItem('ppdup:log:v1') || '[]').slice(-1)[0].msg }));
  console.log((r2.t.sort().join() === 'g1,g2' && r2.d ? 'OK' : 'NG') + ' 完了後に名前と大きさが合うものだけゴミ箱へ', JSON.stringify(r2));
  await b.close(); })();
