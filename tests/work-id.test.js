// 品番の読み取りの見本。pikpak-distill.user.js の <work-id> 〜 </work-id> を取り出して確かめる
//   実行：node tests/work-id.test.js（PR ごとに GitHub Actions でも走る）
//   取りこぼし・読み違いを見つけたら、まずここに見本を足してから直す
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'pikpak-distill.user.js'), 'utf8');
const a = src.indexOf('// <work-id>'), b = src.indexOf('// </work-id>');
if (a < 0 || b < 0) throw new Error('<work-id> の区切りが見つかりません');
const W = new Function(src.slice(a, b) + '\nreturn { parseWork, fc2CleanName, baseName, hasWorkId, dupKeyOf };')();

// [ファイル名, 入っているフォルダ名, 整えた名前（null＝変えない）, 品番（null＝品番なし）, 重複の鍵]
const CASES = [
  // ① ファイル名に品番がある
  ['FC2-PPV-1234567.mp4', 'x', 'FC2-PPV-1234567.mp4', 'FC2-PPV-1234567', 'FC2-PPV-1234567'],
  ['FC2PPV-1234567_2.mp4', 'x', 'FC2-PPV-1234567-2.mp4', 'FC2-PPV-1234567', 'FC2-PPV-1234567#2'],
  ['fc2_ppv_1234567 part1.mkv', 'x', 'FC2-PPV-1234567-1.mkv', 'FC2-PPV-1234567', 'FC2-PPV-1234567#1'],
  ['hhd800.com@FC2-PPV-4988183_1.mp4', 'x', 'FC2-PPV-4988183-1.mp4', 'FC2-PPV-4988183', 'FC2-PPV-4988183#1'],
  ['4k688.com@FC2-PPV-4988183-A.mp4', 'x', 'FC2-PPV-4988183-A.mp4', 'FC2-PPV-4988183', 'FC2-PPV-4988183#A'],
  ['FC2-PPV-1234567 (1).mp4', 'x', 'FC2-PPV-1234567(1).mp4', 'FC2-PPV-1234567', 'FC2-PPV-1234567'],
  ['FC2-PPV-1234567 サンプル作品 前編-3.mp4', 'x', 'FC2-PPV-1234567-3.mp4', 'FC2-PPV-1234567', 'FC2-PPV-1234567#3'],
  ['FC2-PPV-1234567 第2話.mp4', 'x', 'FC2-PPV-1234567-2.mp4', 'FC2-PPV-1234567', 'FC2-PPV-1234567#2'],
  // PPV が抜けている
  ['FC2-4927660.mp4', 'FC2-PPV-4927660', 'FC2-PPV-4927660.mp4', 'FC2-PPV-4927660', 'FC2-PPV-4927660'],
  ['FC2_4927660_2.mp4', 'x', 'FC2-PPV-4927660-2.mp4', 'FC2-PPV-4927660', 'FC2-PPV-4927660#2'],
  // ② 数字だけで、フォルダの品番と同じ
  ['3189316-1.mp4', 'FC2-PPV-3189316', 'FC2-PPV-3189316-1.mp4', 'FC2-PPV-3189316', 'FC2-PPV-3189316#1'],
  ['3189316-2.mp4', 'FC2-PPV-3189316', 'FC2-PPV-3189316-2.mp4', 'FC2-PPV-3189316', 'FC2-PPV-3189316#2'],
  ['3576378.mp4', 'FC2-PPV-3576378', 'FC2-PPV-3576378.mp4', 'FC2-PPV-3576378', 'FC2-PPV-3576378'],
  ['sample.com@3576378.mp4', 'FC2-PPV-3576378', 'FC2-PPV-3576378.mp4', 'FC2-PPV-3576378', 'FC2-PPV-3576378'],
  // 数字だけでも、フォルダと違う・フォルダが作品でない → 品番とみなさない
  ['3576378.mp4', 'FC2-PPV-9999999', null, null, ''],
  ['3576378.mp4', 'sample-folder', null, null, ''],
  ['20260609.mp4', 'FC2-PPV-1234567', null, null, ''],
  // ③ FC2 以外（名前は変えない）
  ['ABC-123.mp4', 'x', null, 'ABC-123', 'ABC-123'],
  ['sample.net@ABCD-0456_2.mp4', 'x', null, 'ABCD-0456', 'ABCD-0456'],
  // 日付型（一本道・カリビアンなど）：メーカーと番号で 1 つの作品。1080p などの解像度を品番と読み違えない
  ['121815_3315-1pon-1080p.mp4', '121815_3315-1pon-1080p', null, '1pon-121815_3315', '1pon-121815_3315'],
  ['121515_3309-1pon-1080p.mp4', '121515_3309-1pon-1080p', null, '1pon-121515_3309', '1pon-121515_3309'],
  ['122415-053-carib-720p.mp4', 'x', null, 'carib-122415_053', 'carib-122415_053'],
  ['090123_001.mp4', 'x', null, '090123_001', '090123_001'],
  ['HEYZO-1234.mp4', 'x', null, 'HEYZO-1234', 'HEYZO-1234'],
  ['sample-1080p.mp4', 'x', null, null, ''],
  // 品番なし（広告など）
  ['最新アドレス.txt', 'FC2-PPV-1234567', null, null, ''],
  ['promo_video.mp4', 'FC2-PPV-1234567', null, null, ''],
];
let ng = 0;
for (const [name, dir, clean, id, dk] of CASES) {
  const w = W.parseWork(name, dir);
  const got = [W.fc2CleanName(name, dir), w ? w.label : null, W.dupKeyOf(name, dir)];
  const want = [clean, id, dk];
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { ng++; console.log('NG', JSON.stringify(name), 'in', JSON.stringify(dir), '\n   want', JSON.stringify(want), '\n   got ', JSON.stringify(got)); }
  if (W.hasWorkId(name, dir) !== !!id) { ng++; console.log('NG hasWorkId', name, dir); }
}
// フォルダ名にそろえる品番（baseName）
[['FC2-PPV-1234567_2.mp4', '', 'FC2-PPV-1234567'], ['3189316-1.mp4', 'FC2-PPV-3189316', 'FC2-PPV-3189316'], ['hhd800.com@FC2-1234567.mp4', '', 'FC2-PPV-1234567']]
  .forEach(([n, d, want]) => { const got = W.baseName(n, d); if (got !== want) { ng++; console.log('NG baseName', n, d, 'want', want, 'got', got); } });
console.log(ng ? `${ng} 件 NG` : `OK（${CASES.length} 件の見本）`);
process.exit(ng ? 1 : 0);
