// 左メニューの一覧の中身（src/core/library.mjs）の試験
//   実行：npm run test:unit
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NO_ACT, NO_SEL, buildPeopleIndex, relatedWorks, pplNames, peopleWorks, mediaList, mergeHistory, recentFiles, markTrashMissed } from '../../src/core/library.mjs';

const MB = 1048576;
const v = (id, name, size = 500 * MB, ct = '2026-11-01T00:00:00Z') => ({ id, name, size, ct, path: '/My Pack', parentId: 'mp' });
// 見本：品番（FC2-PPV-数字）を作品の鍵にする
const opts = (wInfo = {}, sellerDb = {}) => ({
  isVideo: (f) => /\.(mp4|mkv)$/i.test(f.name),
  keyOf: (f) => { const m = f.name.match(/(\d{7})/); return m ? { k: { key: m[1], label: 'FC2-PPV-' + m[1] }, w: null } : {}; },
  wInfo, sellerDb,
});
const WINFO = {
  1000001: { title: 'たいとるA', actresses: [{ name: 'さんぷるA' }] },
  1000002: { actresses: [{ name: 'さんぷるA' }, { name: 'さんぷるB' }] },
  1000003: { actresses: [{ name: 'さんぷるB' }], manual: { actresses: ['さんぷるC'] } },
};
const SELLER = { 1000001: { name: '販売X', status: 'ok' }, 1000002: { name: '販売X', status: 'ok' }, 1000004: { name: '販売X', status: 'ok' }, 1000005: { name: '販売Y', status: 'miss' } };
const FILES = [
  v('a1', 'FC2-PPV-1000001-1.mp4', 300 * MB, '2026-11-01T00:00:00Z'), v('a2', 'FC2-PPV-1000001-2.mp4', 400 * MB, '2026-11-01T00:00:00Z'),
  v('b', 'FC2-PPV-1000002.mp4', 500 * MB, '2026-11-03T00:00:00Z'), v('c', 'FC2-PPV-1000003.mp4', 500 * MB, '2026-11-02T00:00:00Z'),
  v('d', 'FC2-PPV-1000004.mp4'), v('e', 'FC2-PPV-1000005.mp4'), { ...v('j', 'FC2-PPV-1000006.jpg') }, v('n', 'なにか.mp4'),
];
const P = buildPeopleIndex(FILES, opts(WINFO, SELLER));

test('索引：作品ごとに代表の動画（いちばん大きいもの）を 1 本・動画以外と品番なしは入れない', () => {
  assert.deepEqual([...P.works.keys()].sort(), ['1000001', '1000002', '1000003', '1000004', '1000005']);
  assert.equal(P.works.get('1000001').file.id, 'a2');
  assert.equal(P.works.get('1000001').n, 2);
});

test('索引：出演者は手入力を優先・分からない作品は「出演者不明」', () => {
  assert.deepEqual(P.act.get('さんぷるA'), ['1000001', '1000002']);
  assert.deepEqual(P.act.get('さんぷるC'), ['1000003']);
  assert.equal(P.act.get('さんぷるB').includes('1000003'), false);
  assert.deepEqual(P.act.get(NO_ACT).sort(), ['1000004', '1000005']);
});

test('索引：販売者は「分かった」記録だけ・ほかは「販売者不明」', () => {
  assert.deepEqual(P.sel.get('販売X'), ['1000001', '1000002', '1000004']);
  assert.deepEqual(P.sel.get(NO_SEL).sort(), ['1000003', '1000005']);
});

test('名前の一覧：作品数の多い順・「不明」は最後・名前で絞り込む', () => {
  assert.deepEqual(pplNames(P.sel, ''), [['販売X', 3], [NO_SEL, 2]]);
  assert.equal(pplNames(P.act, '').at(-1)[0], NO_ACT);
  assert.deepEqual(pplNames(P.act, 'b'), [['さんぷるB', 1]]);
});

test('関連する作品：同じ出演者 → 同じ販売者の順・自分は除く・数の上限', () => {
  const r = relatedWorks(P, '1000001');
  assert.deepEqual(r.map((x) => x.key), ['1000002', '1000004']);
  assert.equal(r[0].why, 'さんぷるA');
  assert.equal(r[1].why, '販売X');
  assert.equal(relatedWorks(P, '1000001', 1).length, 1);
  assert.deepEqual(relatedWorks(P, 'none'), []);
});

test('ある人の作品：追加日の新しい順', () => {
  assert.deepEqual(peopleWorks(P, 'sel', '販売X').map((x) => x.id), ['b', 'a2', 'd']);
  assert.deepEqual(peopleWorks(P, 'act', 'いない人'), []);
});

const DB = {
  x1: { name: 'x1.mp4', at: '2026-11-05T00:00:00Z', pos: 120 },
  x2: { name: 'x2.mp4', at: '2026-11-06T00:00:00Z', pos: 50, done: true },
  x3: { at: '2026-11-04T00:00:00Z', tri: 'del' },
  x4: { name: 'x4.mp4', at: '2026-11-07T00:00:00Z', pos: 10, tri: 'del' },
};
const byId = (id) => ({ x3: { name: '読み込み結果の名前.mp4', size: 9, thumb: 't3' } })[id] || null;

test('続きを見る：途中で止めたもの（見終わったものは除く）・新しい順', () => {
  assert.deepEqual(mediaList(DB, 'cont', byId).map((x) => x.id), ['x4', 'x1']);
});

test('消す候補：D を付けたもの・名前は読み込み結果から補う', () => {
  const r = mediaList(DB, 'cand', byId);
  assert.deepEqual(r.map((x) => x.id), ['x4', 'x3']);
  assert.equal(r[1].name, '読み込み結果の名前.mp4');
  assert.equal(r[1].thumb, 't3');
});

test('再生した履歴：PikPak の記録とこのブラウザの記録を合わせ、同じファイルは新しい方の日時', () => {
  const ev = [
    { file_id: 'x1', event_time: '2026-11-01T00:00:00Z', reference_resource: { name: 'x1.mp4', size: '5' } },
    { file_id: 'p1', event_time: '2026-11-08T00:00:00Z', reference_resource: { name: 'p1.mp4' } },
    { file_id: 'p1', event_time: '2026-11-02T00:00:00Z' },
    { file_id: 'gone', event_time: '2026-11-09T00:00:00Z', reference_resource: { trashed: true } },
  ];
  const r = mergeHistory(ev, DB, byId);
  assert.deepEqual(r.map((x) => x.id), ['p1', 'x4', 'x2', 'x1', 'x3']);
  assert.equal(r.find((x) => x.id === 'x1').at, '2026-11-05T00:00:00Z');
});

test('最近の追加：指定の時刻より後・新しい順', () => {
  const r = recentFiles(FILES, Date.parse('2026-11-02T00:00:00Z'));
  assert.deepEqual(r.map((x) => x.id), ['b', 'c']);
});

test('ゴミ箱の取りこぼし：数字だけの名前で、入っていたフォルダの品番と同じもの', () => {
  const items = [{ id: 't1', name: 'べつ.mp4', parentId: 'w' }, { id: 't2', name: '1234567.mp4', parentId: 'w' }, { id: 't3', name: '7654321.mp4', parentId: 'w' }];
  const k = markTrashMissed(items, [{ id: 'w', name: 'FC2-PPV-1234567' }]);
  assert.equal(k, 1);
  assert.equal(items[0].id, 't2');
  assert.equal(items[0].miss, 'FC2-PPV-1234567');
});
