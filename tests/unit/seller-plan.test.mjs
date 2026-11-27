// 8. 販売者ごとに仕分け の判定（src/core/seller-plan.mjs）の試験
//   実行：npm run test:unit
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { workKeys, keyRec, resolveKeys, sellerFolderName, boxSidOf, buildSellerPlan } from '../../src/core/seller-plan.mjs';

const CFG = { root: '販売者別', unknown: '販売者不明', review: '要確認' };
const DB = {
  1000001: { status: 'ok', name: '販売X', sid: 'x', src: 'fd2ppv' },
  1000002: { status: 'ok', name: '販売Y', sid: 'y', src: 'fc2cmadb' },
  1000003: { status: 'notfound' },
  1000004: { status: 'ok', name: '手入力の販売者', sid: 'm', src: 'manual' },
};

test('品番の拾い方：FC2 は名前の中の品番を全部・FC2 以外は HEYZO・日付型（メーカー名があれば販売者が決まる）', () => {
  assert.deepEqual(workKeys('FC2-PPV-1000001').map((k) => k.key), ['1000001']);
  assert.deepEqual(workKeys('FC2 まとめ 1000001 1000002').map((k) => k.key), ['1000001', '1000002']);
  assert.equal(workKeys('HEYZO-1234')[0].key, 'x:heyzo-1234');
  assert.equal(workKeys('121815_3315-1pon')[0].sid, '1pon');
  assert.equal(workKeys('121815_3315')[0].kind, 'other');
  assert.deepEqual(workKeys('なにか'), []);
});

test('品番 1 つの結果：手入力が最優先 → 名前から決まるもの → 調べた結果', () => {
  assert.equal(keyRec({ key: '1000004' }, DB).src, 'manual');
  assert.equal(keyRec({ key: 'x:heyzo-1', kind: 'brand', name: 'HEYZO', sid: 'heyzo' }, DB).src, 'name');
  assert.equal(keyRec({ key: '1000001' }, DB).sid, 'x');
  assert.equal(keyRec({ key: '9999999' }, DB), undefined);
});

test('販売者の決め方：分かった／分からない／未調査／品番が複数で販売者が違う', () => {
  assert.equal(resolveKeys(workKeys('FC2-PPV-1000001'), DB).kind, 'seller');
  assert.equal(resolveKeys(workKeys('FC2-PPV-1000003'), DB).kind, 'unknown');
  assert.equal(resolveKeys(workKeys('FC2-PPV-9999999'), DB).kind, 'pending');
  const r = resolveKeys(workKeys('FC2 1000001 1000002'), DB);
  assert.equal(r.kind, 'review');
  assert.equal(r.why, 'multi');
});

test('販売者フォルダの名前：「名前（ID）」・使えない記号は置き換え、ID は名前から読み戻せる', () => {
  const n = sellerFolderName({ name: 'A/B  販売', sid: 'ab' });
  assert.equal(n, 'A・B 販売（ab）');
  assert.equal(boxSidOf(n), 'ab');
  assert.equal(boxSidOf('ふつうのフォルダ'), '');
});

// 見本：ホームから読み込み。My Pack と 販売者別
const dir = (id, name, parentId, trail, extra = {}) => ({ id, name, parentId, trail, path: extra.path || '', ...extra });
const ROOT = dir('root', 'ホーム', '', ['root'], { isRoot: true });
const MP = dir('mp', 'My Pack', 'root', ['root', 'mp'], { path: '/My Pack' });
const BOX = dir('box', '販売者別', 'root', ['root', 'box'], { path: '/販売者別' });
const BX = dir('bx', '販売X（x）', 'box', ['root', 'box', 'bx'], { path: '/販売者別/販売X（x）' });
const UNK = dir('unk', '販売者不明', 'box', ['root', 'box', 'unk'], { path: '/販売者別/販売者不明' });
const plan = (ds) => Object.fromEntries(buildSellerPlan(ds, { cfg: CFG, sellerDb: DB }).map((p) => [p.id, p]));

test('計画：My Pack の作品フォルダは、販売者が分かれば seller・分からなければ unknown・未調査は pending', () => {
  const ds = [ROOT, MP, BOX,
    dir('w1', 'FC2-PPV-1000001', 'mp', ['root', 'mp', 'w1'], { path: '/My Pack/FC2-PPV-1000001' }),
    dir('w3', 'FC2-PPV-1000003', 'mp', ['root', 'mp', 'w3']),
    dir('w9', 'FC2-PPV-9999999', 'mp', ['root', 'mp', 'w9'])];
  const p = plan(ds);
  assert.equal(p.w1.kind, 'seller');
  assert.equal(p.w1.seller.sid, 'x');
  assert.equal(p.w3.kind, 'unknown');
  assert.equal(p.w9.kind, 'pending');
});

test('計画：作品フォルダの中の作品フォルダ（入れ子）は My Pack へ出す・外側は要確認', () => {
  const ds = [ROOT, MP, BOX,
    dir('o', 'FC2-PPV-1000001', 'mp', ['root', 'mp', 'o']),
    dir('i', 'FC2-PPV-1000002', 'o', ['root', 'mp', 'o', 'i'])];
  const p = plan(ds);
  assert.equal(p.i.fix, 'nest');
  assert.equal(p.o.kind, 'review');
  assert.equal(p.o.why, 'inner');
});

test('計画：販売者別の中の見直し（販売者違い・販売者が分かった・未調査・直下にない）', () => {
  const ds = [ROOT, MP, BOX, BX, UNK,
    dir('wrong', 'FC2-PPV-1000002', 'bx', ['root', 'box', 'bx', 'wrong']),
    dir('found', 'FC2-PPV-1000001', 'unk', ['root', 'box', 'unk', 'found']),
    dir('pend', 'FC2-PPV-9999999', 'bx', ['root', 'box', 'bx', 'pend']),
    dir('sub', 'まとめ', 'bx', ['root', 'box', 'bx', 'sub']),
    dir('deep', 'FC2-PPV-1000001', 'sub', ['root', 'box', 'bx', 'sub', 'deep'])];
  const p = plan(ds);
  assert.equal(p.wrong.fix, 'wrong');
  assert.equal(p.found.fix, 'found');
  assert.equal(p.pend.fix, 'pend');
  assert.equal(p.deep.fix, 'deep');
});

test('計画：同じ品番のフォルダが複数あれば、販売者フォルダの中の 1 つへまとめる案を出す', () => {
  const ds = [ROOT, MP, BOX, BX,
    dir('a', 'FC2-PPV-1000001', 'bx', ['root', 'box', 'bx', 'a'], { path: '/販売者別/販売X（x）/FC2-PPV-1000001' }),
    dir('b', 'FC2-PPV-1000001', 'mp', ['root', 'mp', 'b'], { path: '/My Pack/FC2-PPV-1000001' })];
  const d = buildSellerPlan(ds, { cfg: CFG, sellerDb: DB }).find((x) => x.kind === 'dupw');
  assert.ok(d);
  assert.equal(d.merge, true);
  assert.equal(d.keepId, 'a');
  assert.deepEqual(d.mergeIds, ['b']);
});

test('計画：販売者別の中から読み込んだときは、全部を仕分け済みとして扱う（見直しもしない）', () => {
  const R = dir('bx', '販売X（x）', 'box', ['root', 'box', 'bx'], { isRoot: true, trailNames: ['ホーム', '販売者別', '販売X（x）'] });
  const ds = [R, dir('w', 'FC2-PPV-1000002', 'bx', ['root', 'box', 'bx', 'w'])];
  assert.equal(buildSellerPlan(ds, { cfg: CFG, sellerDb: DB }).length, 0);
});
