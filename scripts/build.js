// src/ の部品をつないで、配信用の pikpak-distill.user.js を作る
//   node scripts/build.js          … 作り直す
//   node scripts/build.js --check  … 作り直した結果が、いまのファイルと 1 文字も違わないか確かめる（GitHub の試験で使う）
// つなぐ順番は、フォルダ名・ファイル名の先頭の番号の順（00-header → 10-sites → 20-core → …）。
// 配信先（Tampermonkey の自動更新・Mac アプリ）は main 直下の pikpak-distill.user.js を読むので、組み立てた結果もコミットする。
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'pikpak-distill.user.js');

const parts = [];
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true })
  .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
  .forEach((e) => { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.js')) parts.push(p); });
walk(SRC);
const text = parts.map((p) => fs.readFileSync(p, 'utf8')).join('');

if (process.argv.includes('--check')) {
  const now = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (now === text) { console.log(`一致しています（部品 ${parts.length} 個）`); process.exit(0); }
  const a = now.split('\n'), b = text.split('\n'); let i = 0; while (i < a.length && a[i] === b[i]) i++;
  console.error(`pikpak-distill.user.js が src/ から組み立てた結果と違います（${i + 1} 行目から）。src/ を直して npm run build を実行してください。`);
  console.error('  いまのファイル：' + (a[i] || '（終わり）').slice(0, 120));
  console.error('  組み立てた結果：' + (b[i] || '（終わり）').slice(0, 120));
  process.exit(1);
}
fs.writeFileSync(OUT, text);
console.log(`pikpak-distill.user.js を作りました（部品 ${parts.length} 個・${text.split('\n').length - 1} 行）`);
