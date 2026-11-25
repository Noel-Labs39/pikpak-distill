const open = require('./h.js');
const tree = { '': [{ id: 'f1', name: 'FC2-PPV-1000001.mp4', kind: 'drive#file', size: '9' }] };
const pre = `localStorage.setItem('ppdup:seller:v1', JSON.stringify({ '1': { name: '販売者', sid: 'bookmark-ranking', src: 'fc2cmadb', status: 'ok' }, '2': { name: '販売者', sid: 'ranking', src: 'fc2cmadb', status: 'ok' }, '3': { name: 'ふつう', sid: 'abc', status: 'ok' }, '4': { name: '販売者', sid: 'x', src: 'manual', status: 'ok' } }));
 localStorage.setItem('ppdup:winfo:v1', JSON.stringify({ '2': { sellers: { fd2ppv: { name: '本物', sid: 'real' } }, ack: 1 } }));`;
(async () => { const { b, p } = await open(tree, 'https://mypikpak.com/drive/all', pre);
  const r = await p.evaluate(() => ({ s: JSON.parse(localStorage.getItem('ppdup:seller:v1')), log: JSON.parse(localStorage.getItem('ppdup:log:v1') || '[]').map((x) => x.msg).filter((m) => /読み違い/.test(m)) }));
  const ok = !r.s['1'] && r.s['2'].name === '本物' && r.s['2'].sid === 'real' && r.s['3'].name === 'ふつう' && r.s['4'].name === '販売者';
  console.log((ok ? 'OK' : 'NG') + ' ' + JSON.stringify(r)); await b.close(); })();
