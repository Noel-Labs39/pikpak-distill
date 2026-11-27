// 大きい記録の引っ越し：古い版の保存（localStorage）が、新しい版で起動しても全部残っているか
const open = require('./h.js');
const A = 'AAAAAAAAAAAAAAAAAAAA';
const tree = { '': [{ id: A, name: 'My Pack', kind: 'drive#folder' }], [A]: [{ id: 'v1', name: 'FC2-PPV-1234567.mp4', kind: 'drive#file', size: '300000000' }] };
// 古い版が保存していた形（見本）
const OLD = {
  'ppdup:scan:v1': [{ id: 'v1', name: 'FC2-PPV-1234567.mp4', size: 300000000, parentId: A, path: '/My Pack' }],
  'ppdup:folders:v1': [{ id: 'root', name: 'ホーム', path: '', trail: ['root'], isRoot: true }, { id: A, name: 'My Pack', parentId: 'root', path: '/My Pack', trail: ['root', A] }],
  'ppdup:winfo:v1': { 1234567: { title: 'さんぷる', actresses: [{ name: 'さんぷるA' }] } },
  'ppdup:seller:v1': { 1234567: { name: '販売X', sid: 'x', status: 'ok', src: 'manual' } },
  'ppdup:media:v1': { v1: { name: 'FC2-PPV-1234567.mp4', pos: 120, at: '2026-11-01T00:00:00Z' } },
  'ppdup:log:v1': [{ t: 1, level: 'info', msg: '古い版のログ', ctx: '', v: 'old' }],
  'ppdup:scanmeta:v1': { at: 1, where: 'ホーム', nfo: 2, nfi: 1 },
};
const pre = `(() => { const o = ${JSON.stringify(OLD)}; Object.entries(o).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v))); })()`;
let ng = 0; const ok = (c, m) => { console.log((c ? 'OK ' : 'NG ') + m); if (!c) ng++; };
(async () => {
  const { b, p } = await open(tree, 'https://mypikpak.com/drive/all', pre);
  const r = await p.evaluate(async () => {
    const keys = ['ppdup:scan:v1', 'ppdup:folders:v1', 'ppdup:winfo:v1', 'ppdup:seller:v1', 'ppdup:media:v1', 'ppdup:log:v1'];
    await PPDup.bigKV.flush();
    const db = await new Promise((res, rej) => { const q = indexedDB.open('ppdup-store', 1); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
    const idb = await Promise.all(keys.map((k) => new Promise((res) => { const q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); })));
    return {
      mode: PPDup.bigKV.mode(),
      leftInLs: keys.filter((k) => localStorage.getItem(k) != null),
      inIdb: keys.filter((k, i) => typeof idb[i] === 'string'),
      winfo: JSON.parse(PPDup.lsGet('ppdup:winfo:v1'))['1234567'].title,
      seller: JSON.parse(PPDup.lsGet('ppdup:seller:v1'))['1234567'].name,
      media: JSON.parse(PPDup.lsGet('ppdup:media:v1')).v1.pos,
      oldLog: JSON.parse(PPDup.lsGet('ppdup:log:v1')).some((x) => x.msg === '古い版のログ'),
      moved: JSON.parse(PPDup.lsGet('ppdup:log:v1')).some((x) => /IndexedDB へ移しました/.test(x.msg)),
      meta: localStorage.getItem('ppdup:scanmeta:v1') != null,
    };
  });
  ok(r.mode === 'idb', '置き場所：IndexedDB');
  ok(r.leftInLs.length === 0, 'localStorage から大きい記録が消えた（枠が空いた）：残り ' + JSON.stringify(r.leftInLs));
  ok(r.inIdb.length === 6, 'IndexedDB に 6 つとも入った：' + JSON.stringify(r.inIdb));
  ok(r.winfo === 'さんぷる' && r.seller === '販売X' && r.media === 120, '作品の情報・販売者・再生の記録がそのまま読める');
  ok(r.oldLog && r.moved, 'ログ：古い版の分が残り、引っ越しの記録が足された');
  ok(r.meta, '小さい記録（scanmeta）は localStorage のまま');
  await b.close(); console.log(ng ? 'NG ' + ng : 'ALL OK');
})();
