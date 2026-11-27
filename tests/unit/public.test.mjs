// 公開するものの決まり（CLAUDE.md「公開するものに入れないもの」）を確かめる
//   実行：npm run test:unit
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL('../../' + p, import.meta.url), 'utf8');
const SCRIPT = read('pikpak-distill.user.js');
const README = read('README.md');
const CHANGELOG = read('CHANGELOG.md');

test('外部サイトに、無断転載の動画サイト・トレントのサイトを入れない', () => {
  for (const s of ['missav', 'supjav', 'sukebei', 'nyaa.si']) assert.equal(SCRIPT.toLowerCase().includes(s), false, s);
});

test('センシティブな項目（モザイク）を画面に出さない', () => {
  assert.equal(SCRIPT.includes("row('モザイク'"), false);
  assert.equal(/mosaic:\s*(i\.mosaic|lv\(|txOf\()/.test(SCRIPT), false);
});

test('README はサイト名を並べず、整理ツールとして書く', () => {
  for (const s of ['fd2ppv', 'fc2cmadb', 'adult.contents', 'JavDB', 'JavBus', 'Sukebei']) assert.equal(README.includes(s), false, s);
  assert.ok(README.includes('ファイル整理・重複整理'));
});

test('CHANGELOG にもセンシティブな言葉・サイト名を書かない（リリースの本文になるため）', () => {
  for (const s of ['モザイク', '女優', 'MissAV', 'Sukebei', 'fd2ppv', 'fc2cmadb', 'FANZA', 'HEYZO']) assert.equal(CHANGELOG.includes(s), false, s);
});
