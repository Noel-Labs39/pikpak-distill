// 画面の試験をまとめて実行する：node tests/e2e/run.js [名前の一部…]
//   1 本ずつ動かし、終了コードが 0 以外・「NG」で始まる行・ページのエラー（pageerr）・時間切れのどれかがあれば失敗にする
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const want = process.argv.slice(2);
const list = fs.readdirSync(__dirname).filter((f) => /_t\.js$/.test(f) && (!want.length || want.some((w) => f.includes(w)))).sort();
let bad = 0; const t0 = Date.now();
for (const f of list) {
  const t = Date.now();
  const r = spawnSync(process.execPath, [path.join(__dirname, f)], { encoding: 'utf8', timeout: 240e3 });
  const out = (r.stdout || '') + (r.stderr || '');
  const why = r.error ? '時間切れ' : r.status !== 0 ? '終了コード ' + r.status : /^(NG\b|pageerr)/m.test(out) ? out.split('\n').filter((l) => /^(NG\b|pageerr)/.test(l)).slice(0, 5).join(' / ') : '';
  console.log(`${why ? '✗' : '✓'} ${f}（${((Date.now() - t) / 1000).toFixed(0)} 秒）${why ? '：' + why : ''}`);
  if (why) { bad++; console.log(out.split('\n').slice(-25).map((l) => '    ' + l).join('\n')); }
}
console.log(`\n${list.length - bad} / ${list.length} 本 成功（${((Date.now() - t0) / 1000).toFixed(0)} 秒）`);
process.exit(bad ? 1 : 0);
