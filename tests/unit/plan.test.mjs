// 整理の判定（src/core/plan.mjs）の試験。PikPak は使わず、見本のファイル一覧・フォルダ一覧から計画だけを確かめる
//   実行：node --test tests/unit/（npm test・PR ごとの GitHub Actions でも走る）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildGroups, keyOf, addSuffix, buildRenamePlan, buildSortPlan, dropBoxLeftovers, buildNamePlan, buildJunkPlan, junkInfo, prepJunk, buildCleanPlan } from '../../src/core/plan.mjs';

const MB = 1048576;
// 見本の置き場所：ホーム / My Pack / …
const dir = (id, name, parentId, trail, extra = {}) => ({ id, name, parentId, path: extra.path || '/' + name, trail, ...extra });
const file = (id, name, parentId, size = 500 * MB, path = '/') => ({ id, name, parentId, size, path });
const ROOT = dir('root', 'ホーム', '', ['root'], { isRoot: true, path: '' });
const MP = dir('mp', 'My Pack', 'root', ['root', 'mp'], { path: '/My Pack' });

test('重複：同じ品番・連番はファイル名の違い（サイト名・(1)）があっても 1 組にまとめる', () => {
  const files = [file('a', 'FC2-PPV-1234567.mp4', 'mp', 500 * MB), file('b', 'sample.com@FC2-PPV-1234567.mp4', 'mp', 498 * MB), file('c', 'FC2-PPV-1234567 (1).mp4', 'mp', 300 * MB), file('d', 'FC2-PPV-7654321.mp4', 'mp')];
  const g = buildGroups(files, 'name', [ROOT, MP]);
  assert.equal(g.length, 1);
  assert.deepEqual(g[0].items.map((f) => f.id), ['a', 'b', 'c']); // 大きい順
  assert.equal(g[0].near, true); // 500MB と 498MB は 1.5% 以内
});

test('重複：-1 と -2 は別の組（同じ作品の分割）', () => {
  const files = [file('a', 'FC2-PPV-1234567-1.mp4', 'mp'), file('b', 'FC2-PPV-1234567-2.mp4', 'mp')];
  assert.equal(buildGroups(files, 'name', [MP]).length, 0);
});

test('重複：品番だけで比べるときは、連番違いも同じ組', () => {
  const files = [file('a', 'FC2-PPV-1234567-1.mp4', 'mp'), file('b', 'FC2-PPV-1234567-2.mp4', 'mp')];
  assert.equal(buildGroups(files, 'id', [MP]).length, 1);
});

test('重複：数字だけのファイル名は、入っているフォルダの品番で読む', () => {
  const W = dir('w', 'FC2-PPV-4567890', 'mp', ['root', 'mp', 'w']);
  const files = [file('a', '4567890.mp4', 'w'), file('b', 'FC2-PPV-4567890.mp4', 'mp')];
  assert.equal(buildGroups(files, 'name', [MP, W]).length, 1);
  assert.equal(keyOf('4567890.mp4', 'name', 'FC2-PPV-4567890'), keyOf('FC2-PPV-4567890.mp4', 'name', ''));
});

test('名前の重なり：(1)・(2) を順に付ける', () => {
  assert.equal(addSuffix('a.mp4', new Set(['a.mp4'])), 'a(1).mp4');
  assert.equal(addSuffix('a.mp4', new Set(['a.mp4', 'a(1).mp4'])), 'a(2).mp4');
});

test('フォルダ名：中のファイルの品番にそろえる・販売者のフォルダとホーム直下は変えない', () => {
  const A = dir('a', 'なにかの名前', 'mp', ['root', 'mp', 'a']);
  const S = dir('s', '販売X（x）', 'mp', ['root', 'mp', 's']);
  const files = [file('f1', 'FC2-PPV-1234567_題名.mp4', 'a'), file('f2', 'FC2-PPV-7654321.mp4', 's')];
  const plan = buildRenamePlan(files, [ROOT, MP, A, S], { keep: new Set(['s']) });
  const by = Object.fromEntries(plan.map((p) => [p.id, p]));
  assert.equal(by.a.status, 'rename');
  assert.equal(by.a.target, 'FC2-PPV-1234567');
  assert.equal(by.s.status, 'skip');
  assert.equal(by.mp.status, 'skip');
});

test('フォルダ名：同じ場所に同じ名前があれば (1) を付ける', () => {
  const A = dir('a', 'FC2-PPV-1234567', 'mp', ['root', 'mp', 'a']);
  const B = dir('b', 'べつの名前', 'mp', ['root', 'mp', 'b']);
  const files = [file('f1', 'FC2-PPV-1234567.mp4', 'a'), file('f2', 'FC2-PPV-1234567-2.mp4', 'b')];
  const by = Object.fromEntries(buildRenamePlan(files, [ROOT, MP, A, B]).map((p) => [p.id, p]));
  assert.equal(by.a.status, 'same');
  assert.equal(by.b.status, 'dup');
  assert.equal(by.b.target, 'FC2-PPV-1234567(1)');
});

test('作品ごとの仕分け：My Pack 直下は 1 作品だけでも作品フォルダを作る', () => {
  const files = [file('f1', 'FC2-PPV-1234567.mp4', 'mp')];
  const plan = buildSortPlan(files, [ROOT, MP]);
  assert.equal(plan.length, 1);
  assert.equal(plan[0].work, 'FC2-PPV-1234567');
  assert.equal(plan[0].folderNew, true);
});

test('作品ごとの仕分け：ふつうのフォルダは 2 作品以上が混ざったときだけ', () => {
  const A = dir('a', 'まとめ', 'mp', ['root', 'mp', 'a']);
  assert.equal(buildSortPlan([file('f1', 'FC2-PPV-1234567.mp4', 'a')], [ROOT, MP, A]).length, 0);
  const plan = buildSortPlan([file('f1', 'FC2-PPV-1234567.mp4', 'a'), file('f2', 'FC2-PPV-7654321.mp4', 'a')], [ROOT, MP, A]);
  assert.deepEqual(plan.map((p) => p.work).sort(), ['FC2-PPV-1234567', 'FC2-PPV-7654321']);
});

test('作品ごとの仕分け：すでにある同じ品番のフォルダへ入れ、名前が重なれば (1)', () => {
  const W = dir('w', 'FC2-PPV-1234567', 'mp', ['root', 'mp', 'w']);
  const files = [file('f1', 'FC2-PPV-1234567.mp4', 'mp'), file('f0', 'FC2-PPV-1234567.mp4', 'w')];
  const [p] = buildSortPlan(files, [ROOT, MP, W]);
  assert.equal(p.folderId, 'w');
  assert.equal(p.items[0].to, 'FC2-PPV-1234567(1).mp4');
});

test('品番が読めない My Pack 直下のファイルは「残るもの」として出す', () => {
  const files = [file('f1', 'なにか.mp4', 'mp'), file('f2', 'FC2-PPV-1234567.mp4', 'mp')];
  assert.deepEqual(dropBoxLeftovers(files, [ROOT, MP]).map((f) => f.id), ['f1']);
});

test('ファイル名を整える：品番（-連番）_タイトル の形に・同じ名前があれば (1)', () => {
  const files = [file('f1', 'sample.com@FC2-PPV-1234567_1 題名.mp4', 'mp'), file('f2', 'FC2-PPV-1234567-1_題名.mp4', 'mp')];
  const plan = buildNamePlan(files, [MP]);
  assert.equal(plan.length, 1);
  assert.equal(plan[0].id, 'f1');
  assert.equal(plan[0].target, 'FC2-PPV-1234567-1_題名(1).mp4');
});

test('不要ファイル：広告の拡張子・10MB 以下・広告フォルダの中は消す候補、字幕は確認', () => {
  const W = dir('w', 'FC2-PPV-1234567', 'mp', ['root', 'mp', 'w']);
  const AD = dir('ad', '最新アドレス', 'w', ['root', 'mp', 'w', 'ad']);
  const files = [
    file('v', 'FC2-PPV-1234567.mp4', 'w'),
    file('u', 'サンプル.url', 'w', 1000),
    file('s', 'small.mp4', 'w', 5 * MB),
    file('a', 'なにか.mp4', 'ad', 300 * MB),
    file('t', 'FC2-PPV-1234567.srt', 'w', 20 * MB),
  ];
  const by = Object.fromEntries(buildJunkPlan(files, [ROOT, MP, W, AD]).map((p) => [p.id, p.level]));
  assert.equal(by.v, undefined);
  assert.equal(by.u, 'del');
  assert.equal(by.s, 'del');
  assert.equal(by.a, 'del');
  assert.equal(by.t, 'review');
});

test('不要ファイル：作品フォルダの中の品番のない動画は、小さければ消す候補・大きければ確認', () => {
  const W = dir('w', 'FC2-PPV-1234567', 'mp', ['root', 'mp', 'w']);
  const files = [file('v', 'FC2-PPV-1234567.mp4', 'w'), file('x', 'おまけ.mp4', 'w', 30 * MB), file('y', 'べつの本編.mp4', 'w', 800 * MB)];
  prepJunk(files, [ROOT, MP, W]);
  assert.equal(junkInfo(files[1]).level, 'del');
  assert.equal(junkInfo(files[2]).level, 'review');
});

test('仕上げ：空のフォルダを片付け、(1) が外せるなら外す', () => {
  const A = dir('a', 'FC2-PPV-1234567', 'mp', ['root', 'mp', 'a']);
  const A1 = dir('a1', 'FC2-PPV-1234567(1)', 'mp', ['root', 'mp', 'a1']);
  const files = [file('f1', 'FC2-PPV-1234567.mp4', 'a1'), file('f2', 'FC2-PPV-7654321 (1).mp4', 'mp')];
  const plan = buildCleanPlan(files, [ROOT, MP, A, A1]);
  const ops = plan.map((p) => `${p.op}:${p.id}:${p.target || ''}:${p.status}`);
  assert.deepEqual(ops, ['trash:a::todo', 'rename:a1:FC2-PPV-1234567:todo', 'rename:f2:FC2-PPV-7654321.mp4:todo']);
});

test('仕上げ：同じ名前の入れ子は 1 つ上へ出す', () => {
  const P = dir('p', 'FC2-PPV-1234567', 'mp', ['root', 'mp', 'p']);
  const C = dir('c', 'FC2-PPV-1234567', 'p', ['root', 'mp', 'p', 'c']);
  const plan = buildCleanPlan([file('f', 'FC2-PPV-1234567.mp4', 'c')], [ROOT, MP, P, C]);
  assert.ok(plan.some((p) => p.op === 'flatten' && p.id === 'c' && p.parentId === 'p'));
});

test('仕上げ：不要ファイルを消す設定なら、入れ子の判定でそれらを無いものとして扱う', () => {
  const P = dir('p', 'FC2-PPV-1234567', 'mp', ['root', 'mp', 'p']);
  const C = dir('c', 'FC2-PPV-1234567', 'p', ['root', 'mp', 'p', 'c']);
  const files = [file('f', 'FC2-PPV-1234567.mp4', 'c'), file('u', 'サンプル.url', 'p', 1000)];
  assert.ok(!buildCleanPlan(files, [ROOT, MP, P, C]).some((p) => p.op === 'flatten'));
  assert.ok(buildCleanPlan(files, [ROOT, MP, P, C], { junk: true }).some((p) => p.op === 'flatten'));
});
