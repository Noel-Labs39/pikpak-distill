// 大きい記録の置き場所（src/core/store.mjs）の試験。IndexedDB と localStorage は小さな見本で代わりをする
//   実行：npm run test:unit
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBigStore } from '../../src/core/store.mjs';

// localStorage の代わり（fail を true にすると書き込みが失敗する）
function fakeLs(init = {}) {
  const m = new Map(Object.entries(init));
  return { m, fail: false, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem(k, v) { if (this.fail) throw new Error('Quota'); m.set(k, String(v)); }, removeItem: (k) => m.delete(k) };
}
// IndexedDB の代わり（open → objectStore の get/put/delete・transaction の完了だけ）。data は閉じても残る
function fakeIdb(data = new Map(), { failWrite = false } = {}) {
  const later = (f) => setTimeout(f, 0);
  const request = (fn) => { const r = {}; later(() => { try { r.result = fn(); r.onsuccess && r.onsuccess(); } catch (e) { r.error = e; r.onerror && r.onerror(); } }); return r; };
  const db = {
    objectStoreNames: { contains: () => true },
    createObjectStore: () => {},
    transaction(_s, kind) {
      const tx = {}; const ops = [];
      tx.objectStore = () => ({
        get: (k) => request(() => data.get(k)),
        put: (v, k) => { ops.push(() => data.set(k, v)); },
        delete: (k) => { ops.push(() => data.delete(k)); },
      });
      later(() => later(() => { if (kind === 'readwrite' && failWrite) { tx.error = new Error('write failed'); tx.onerror && tx.onerror(); return; } ops.forEach((f) => f()); tx.oncomplete && tx.oncomplete(); }));
      return tx;
    },
  };
  return { data, open: () => { const r = {}; later(() => { r.result = db; r.onupgradeneeded && r.onupgradeneeded(); r.onsuccess && r.onsuccess(); }); return r; } };
}
const KEYS = ['ppdup:scan:v1', 'ppdup:log:v1'];
const now = (f) => f(); // まとめて書くのを待たずにすぐ書く

test('初回：localStorage にある記録を IndexedDB へ写し、写せたら localStorage 側を消す', async () => {
  const ls = fakeLs({ 'ppdup:scan:v1': '[1,2,3]', 'ppdup:theme:v1': 'dark' });
  const idb = fakeIdb(); const logs = [];
  const s = createBigStore({ keys: KEYS, idb, ls, log: (lv, m) => logs.push(m) });
  assert.equal(await s.ready(), 'idb');
  assert.equal(s.get('ppdup:scan:v1'), '[1,2,3]');
  assert.equal(idb.data.get('ppdup:scan:v1'), '[1,2,3]');
  assert.equal(ls.getItem('ppdup:scan:v1'), null);
  assert.equal(ls.getItem('ppdup:theme:v1'), 'dark'); // 小さい設定はそのまま
  assert.ok(logs.some((m) => /IndexedDB へ移しました（1 件/.test(m)));
});

test('2 回目からは IndexedDB から読み、書き込みはまとめて送る', async () => {
  const idb = fakeIdb(new Map([['ppdup:scan:v1', '["a"]']]));
  let fire = null;
  const s = createBigStore({ keys: KEYS, idb, ls: fakeLs(), setTimer: (f) => { fire = f; return 1; } });
  await s.ready();
  assert.equal(s.get('ppdup:scan:v1'), '["a"]');
  s.set('ppdup:scan:v1', '["b"]'); s.set('ppdup:scan:v1', '["c"]');
  assert.equal(s.get('ppdup:scan:v1'), '["c"]'); // すぐに読める
  assert.equal(idb.data.get('ppdup:scan:v1'), '["a"]'); // まだ送っていない
  fire(); await s.flush();
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(idb.data.get('ppdup:scan:v1'), '["c"]');
});

test('消す：IndexedDB からも消える', async () => {
  const idb = fakeIdb(new Map([['ppdup:log:v1', '[1]']]));
  const s = createBigStore({ keys: KEYS, idb, ls: fakeLs(), setTimer: now });
  await s.ready();
  s.del('ppdup:log:v1');
  await s.flush(); await new Promise((r) => setTimeout(r, 10));
  assert.equal(s.get('ppdup:log:v1'), null);
  assert.equal(idb.data.has('ppdup:log:v1'), false);
});

test('古い版で使ったあと：localStorage 側の新しい記録で置き換える', async () => {
  const idb = fakeIdb(new Map([['ppdup:scan:v1', '["古い"]']]));
  const ls = fakeLs({ 'ppdup:scan:v1': '["新しい"]' });
  const s = createBigStore({ keys: KEYS, idb, ls });
  await s.ready();
  assert.equal(s.get('ppdup:scan:v1'), '["新しい"]');
  assert.equal(ls.getItem('ppdup:scan:v1'), null);
});

test('IndexedDB が使えないときは localStorage のまま（has が false なので、呼ぶ側は今までどおり localStorage を使う）', async () => {
  const logs = [];
  const s = createBigStore({ keys: KEYS, idb: undefined, ls: fakeLs({ 'ppdup:scan:v1': '[1]' }), log: (lv, m) => logs.push(lv) });
  assert.equal(await s.ready(), 'ls');
  assert.equal(s.has('ppdup:scan:v1'), false);
  assert.deepEqual(logs, ['warn']);
});

test('写す途中で失敗したら、localStorage 側は消さない（次に開いたときにやり直す）', async () => {
  const ls = fakeLs({ 'ppdup:scan:v1': '[1]' });
  const s = createBigStore({ keys: KEYS, idb: fakeIdb(new Map(), { failWrite: true }), ls, log: () => {} });
  await s.ready();
  assert.equal(ls.getItem('ppdup:scan:v1'), '[1]');
  assert.equal(s.get('ppdup:scan:v1'), '[1]');
});

test('書き込みに失敗したら一度だけ知らせ、次の書き込みでやり直す', async () => {
  const data = new Map();
  const idb = fakeIdb(data, { failWrite: true }); const logs = [];
  const s = createBigStore({ keys: KEYS, idb, ls: fakeLs(), log: (lv) => logs.push(lv), setTimer: () => 1 });
  await s.ready();
  s.set('ppdup:log:v1', '[1]'); await s.flush();
  s.set('ppdup:log:v1', '[2]'); await s.flush();
  assert.equal(logs.filter((x) => x === 'error').length, 1);
  assert.equal(s.get('ppdup:log:v1'), '[2]');
});

test('対象でない記録は扱わない', async () => {
  const s = createBigStore({ keys: KEYS, idb: fakeIdb(), ls: fakeLs() });
  await s.ready();
  assert.equal(s.has('ppdup:theme:v1'), false);
  assert.equal(s.has('ppdup:scan:v1'), true);
});
