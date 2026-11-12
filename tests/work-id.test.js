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
  ['FC2-PPV-1234567 サンプル作品 前編-3.mp4', 'x', 'FC2-PPV-1234567-3_サンプル作品_前編.mp4', 'FC2-PPV-1234567', 'FC2-PPV-1234567#3'],
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
  // ③ FC2 以外：ABC-123 の形にそろえる（番号の頭の 0 は外して 3 けた）。連番も読む
  ['ABC-123.mp4', 'x', 'ABC-123.mp4', 'ABC-123', 'ABC-123'],
  ['sample.net@ABCD-0456_2.mp4', 'x', 'ABCD-456-2.mp4', 'ABCD-456', 'ABCD-456#2'],
  // ハイフンなし・FANZA の作品番号の形
  ['ABC123.mp4', 'x', 'ABC-123.mp4', 'ABC-123', 'ABC-123'],
  ['ssis00123.mp4', 'x', 'SSIS-123.mp4', 'SSIS-123', 'SSIS-123'],
  ['h_1234abc00012.mp4', 'x', 'ABC-012.mp4', 'ABC-012', 'ABC-012'],
  ['1abcd00045.mp4', 'x', 'ABCD-045.mp4', 'ABCD-045', 'ABCD-045'],
  ['ABC123 サンプルの題名.mp4', 'x', 'ABC-123_サンプルの題名.mp4', 'ABC-123', 'ABC-123'],
  // 品番と読み違えない
  ['x264.mp4', 'x', null, null, ''],
  ['video_AAC20.mp4', 'x', null, null, ''],
  // ⑥ 連番だけのファイル名で、フォルダ名に品番がある（FC2 以外も）
  ['1.mp4', 'SSIS-123', 'SSIS-123-1.mp4', 'SSIS-123', 'SSIS-123#1'],
  ['part2.mp4', 'ABC-123 サンプルの題名', 'ABC-123-2.mp4', 'ABC-123', 'ABC-123#2'],
  ['B.mkv', 'abc00123', 'ABC-123-B.mkv', 'ABC-123', 'ABC-123#B'],
  ['promo_video.mp4', 'ABC-123', null, null, ''],
  // タイトルを残す：品番（-連番）_タイトル。サイト名・URL・宣伝の【】・画質の表記は外し、空白と使えない記号は「_」
  ['FC2-PPV-1234567 夏の思い出【高画質】 1080p.mp4', 'x', 'FC2-PPV-1234567_夏の思い出.mp4', 'FC2-PPV-1234567', 'FC2-PPV-1234567'],
  ['hhd800.com@FC2-PPV-1234567_1 サンプル 題名.mp4', 'x', 'FC2-PPV-1234567-1_サンプル_題名.mp4', 'FC2-PPV-1234567', 'FC2-PPV-1234567#1'],
  ['サンプル題名 FC2PPV-1234567.mp4', 'x', 'FC2-PPV-1234567_サンプル題名.mp4', 'FC2-PPV-1234567', 'FC2-PPV-1234567'],
  ['FC2-PPV-1234567 x:y?z*w.mp4', 'x', 'FC2-PPV-1234567_x_y_z_w.mp4', 'FC2-PPV-1234567', 'FC2-PPV-1234567'],
  ['FC2-PPV-1234567 【サンプル】題名 (1).mp4', 'x', 'FC2-PPV-1234567_【サンプル】題名(1).mp4', 'FC2-PPV-1234567', 'FC2-PPV-1234567'],
  ['FC2-PPV-1234567 ' + 'あ'.repeat(50) + '.mp4', 'x', 'FC2-PPV-1234567_' + 'あ'.repeat(40) + '.mp4', 'FC2-PPV-1234567', 'FC2-PPV-1234567'],
  // 整えた名前は、読み直しても同じ（品番・連番・タイトルが崩れない）
  ['FC2-PPV-1234567-1_サンプル_題名.mp4', 'x', 'FC2-PPV-1234567-1_サンプル_題名.mp4', 'FC2-PPV-1234567', 'FC2-PPV-1234567#1'],
  ['FC2-PPV-1234567_2人で旅行.mp4', 'x', 'FC2-PPV-1234567_2人で旅行.mp4', 'FC2-PPV-1234567', 'FC2-PPV-1234567'],
  ['FC2-PPV-1234567 題名 vol 2 本編.mp4', 'x', 'FC2-PPV-1234567_題名_vol_2_本編.mp4', 'FC2-PPV-1234567', 'FC2-PPV-1234567'],
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
// 整えた名前をもう一度整えても変わらない（何度実行しても名前が動かない）
CASES.forEach(([name, dir, clean]) => { if (!clean) return; const again = W.fc2CleanName(clean, dir); if (again !== clean) { ng++; console.log('NG 読み直し', clean, '→', again); } if (W.dupKeyOf(clean, dir) !== W.dupKeyOf(name, dir)) { ng++; console.log('NG 読み直しで鍵が変わる', name, '→', clean); } });
// タイトルが違っても、品番と連番が同じなら同じ鍵（重複として見比べる）
[['FC2-PPV-1234567_題名A.mp4', 'FC2-PPV-1234567.mp4'], ['FC2-PPV-1234567-2_題名A.mp4', 'FC2PPV-1234567_2.mp4'], ['SSIS-123_題名.mp4', 'ssis00123.mp4']]
  .forEach(([a, b]) => { if (W.dupKeyOf(a, 'x') !== W.dupKeyOf(b, 'x')) { ng++; console.log('NG 同じ鍵にならない', a, b); } });
if (W.dupKeyOf('FC2-PPV-1234567-1_題名.mp4', 'x') === W.dupKeyOf('FC2-PPV-1234567-2_題名.mp4', 'x')) { ng++; console.log('NG -1 と -2 が同じ鍵'); }
// フォルダ名にそろえる品番（baseName）
[['FC2-PPV-1234567_2.mp4', '', 'FC2-PPV-1234567'], ['3189316-1.mp4', 'FC2-PPV-3189316', 'FC2-PPV-3189316'], ['hhd800.com@FC2-1234567.mp4', '', 'FC2-PPV-1234567']]
  .forEach(([n, d, want]) => { const got = W.baseName(n, d); if (got !== want) { ng++; console.log('NG baseName', n, d, 'want', want, 'got', got); } });
console.log(ng ? `${ng} 件 NG` : `OK（${CASES.length} 件の見本）`);
process.exit(ng ? 1 : 0);
