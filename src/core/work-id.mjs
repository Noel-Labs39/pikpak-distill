// 品番の読み取り（品番に関わる判定はすべてここを通す）。画面の変数には頼らない
//   試験：tests/unit/work-id.test.mjs（見本を足してから直す）
// <work-id> ---------- 品番の読み取り（品番に関わる判定はすべてここを通す） ----------
//   変えたら tests/work-id.test.js の見本で確かめる（PR ごとに自動で走る）
//   読み取る順番：
//     ① ファイル名に品番がある（FC2-PPV-1234567・FC2PPV1234567・FC2_PPV_1234567・FC2-1234567・サイト名@… など）
//     ② ファイル名が数字で始まり、その数字が入っているフォルダの品番と同じ（フォルダ FC2-PPV-1234567 の 1234567-1.mp4）
//     ③ ABC-123 の形（FC2 以外）。ハイフンなしの ABC123、FANZA の作品番号の形 abc00123・1abc00123・h_1234abc00123 も読む
//       番号の頭の 0 は外して 3 けたにそろえる（abc00123・ABC-0123 → ABC-123）
//     ⑥ ファイル名が連番だけ（1.mp4・part2.mp4・B.mp4）で、入っているフォルダ名に品番がある → フォルダの品番の作品
//   日付などの数字だけ（20260609.mp4）や、フォルダと違う数字は品番とみなさない
export const FC2_RE = /FC2[\s_-]*(?:PPV[\s_-]*)?(\d{5,8})(?!\d)/i;
// ABC-123：英字の前が数字（1pon-1080p の pon）や、数字の後ろが p（1080p・720p＝解像度）のものは品番とみなさない
export const CODE_RE = /(^|[^A-Za-z0-9])([A-Za-z]{2,6})-(\d{3,5})(?![\dpP])/;
export const CODE_NG = /^(FC|MP|AVI|MKV|HD|FHD|UHD|PART|CD|DISC|VOL|EP|PON|CARIB|MURA|PACO|HEVC|AAC|DTS|WEB|JAV|JAVHD|SEXY|NO|NUM|NUMBER|TOP|BEST|DAY|ROOM|LIVE|STEP|FILE|VIDEO|MOVIE|CLIP|SCENE|TAKE|SAMPLE)$/i;
// ハイフンなし（ABC123）・FANZA の作品番号（abc00123／先頭に数字や h_1234 が付くこともある）
export const CODE2_RE = /(^|[^A-Za-z0-9])(?:h_\d{2,4}|\d{1,4})?([A-Za-z]{2,6})(\d{3,5})(?![\dpP])/;
export const codeNum = (n) => { const x = String(+n); return x.length < 3 ? x.padStart(3, '0') : x; };
// ファイル名が連番だけ（1・02・part2・cd1・disc2・B）
export const PART_ONLY = /^(?:(?:part|cd|disc)\s?)?(\d{1,2}|[A-Ea-e])$/i;
// 日付型の品番を使うメーカー（121815_3315-1pon・122415-053-carib など）
export const BRANDS = [
  ['caribpr', 'Caribbeancom Premium', /caribbeancompr|caribpr|カリビアンコム\s*プレミアム/i],
  ['carib', 'Caribbeancom', /caribbean|carib|カリビアン/i],
  ['1pon', '1pondo', /1pondo|1pon(?![a-z])|一本道/i],
  ['10mu', '10musume', /10musume|10mu(?![a-z])|天然むすめ/i],
  ['paco', 'Pacopacomama', /pacopacomama|(?:^|[^a-z])paco(?![a-z])|パコパコママ/i],
  ['mura', 'Muramura', /muramura|(?:^|[^a-z])mura(?![a-z])|ムラムラ/i],
];

// 拡張子・重複回避の (1) を分ける
export function splitName(name) {
  const m = String(name || '').match(/^(.*?)(\.[A-Za-z0-9]{2,5})?$/);
  let stem = m[1]; const ext = m[2] || '';
  const dup = stem.match(/\s?\((\d+)\)$/); if (dup) stem = stem.slice(0, dup.index);
  return { stem, ext, dup: dup ? dup[1] : '' };
}
// 品番の後ろの文字から連番を取る（すぐ後ろの _2・-2・part2・cd2・_A／タイトル末尾の「…編-3」／第3話）
export function partOf(rest) {
  const pm = rest.match(/^[\s_\-－]*(?:(?:part|cd)\s?)?(\d{1,2}|[A-Ea-e])(?=$|[\s_\-－.[(（【])/i)
    || rest.match(/[\s_\-－](?:(?:part|cd)\s?)?(\d{1,2}|[A-Ea-e])$/i)
    || rest.match(/第\s?(\d{1,2})\s?[話部巻章]/);
  return pm ? pm[1].toUpperCase() : '';
}
export const dirFc2 = (dirName) => (String(dirName || '').match(FC2_RE) || [])[1] || '';
// 返り値：{ kind: 'fc2'|'code', num, key（作品の鍵）, label（そろえた品番）, part（連番）, src: 'name'|'dir', ext, dup } または null
export function parseWork(name, dirName) {
  const { stem, ext, dup } = splitName(name);
  const fc2 = (num, rest, src, pre) => ({ kind: 'fc2', num, key: 'FC2-PPV-' + num, label: 'FC2-PPV-' + num, part: partOf(rest), src, ext, dup, pre: pre || '', rest });
  const m = stem.match(FC2_RE);
  if (m) return fc2(m[1], stem.slice(m.index + m[0].length), 'name', stem.slice(0, m.index));
  const d = dirFc2(dirName);
  if (d) { const b = stem.match(/^(?:[^@]*@)?\s*(\d{5,8})(?!\d)/); if (b && b[1] === d) return fc2(d, stem.slice(b.index + b[0].length), 'dir', ''); }
  // ④ HEYZO-1234
  const hz = stem.match(/heyzo[\s_-]*(\d{4})(?!\d)/i);
  if (hz) return { kind: 'brand', num: hz[1], key: 'HEYZO-' + hz[1], label: 'HEYZO-' + hz[1], part: '', src: 'name', ext, dup };
  // ⑤ 日付型（121815_3315-1pon など）。メーカー名が分かればメーカーごとに分ける
  const dt = stem.match(/(?:^|[^\d])(\d{6})([-_])(\d{2,4})(?![\d])/);
  if (dt) { const br = BRANDS.find(([, , re]) => re.test(stem)); const code = dt[1] + '_' + dt[3]; const key = (br ? br[0] + '-' : '') + code; return { kind: br ? 'brand' : 'date', num: code, key, label: key, part: '', src: 'name', ext, dup }; }
  let c = stem.match(CODE_RE); if (c && CODE_NG.test(c[2])) c = null;
  if (!c) { c = stem.match(CODE2_RE); if (c && CODE_NG.test(c[2])) c = null; }
  if (c) { const num = codeNum(c[3]), label = c[2].toUpperCase() + '-' + num, at = c.index + c[1].length; return { kind: 'code', num, key: label, label, part: partOf(stem.slice(c.index + c[0].length)), src: 'name', ext, dup, pre: stem.slice(0, at), rest: stem.slice(c.index + c[0].length) }; }
  // ⑥ ファイル名が連番だけで、フォルダ名に品番がある（FC2 以外も）
  if (dirName) {
    const pm = stem.replace(/^[^@]*@/, '').trim().match(PART_ONLY);
    if (pm) { const dw = parseWork(String(dirName), ''); if (dw && (dw.kind === 'fc2' || dw.kind === 'code')) return { ...dw, part: pm[1].toUpperCase(), src: 'dir', ext, dup, pre: '', rest: '' }; }
  }
  return null;
}
export const hasWorkId = (name, dirName) => !!parseWork(name, dirName);
// 作品の品番（作品ID）。次の違いは同じ作品として扱う（フォルダ名を揃える・作品ごとに仕分けで使う）
//   ・拡張子、重複回避の (1)
//   ・分割・シーン違いの連番：-1 / -2、_1 / _2、part1、cd1、-A など
//   ・配布元サイト名などの接頭辞：hhd800.com@FC2-PPV-1234567_1.mp4 → FC2-PPV-1234567
//   ・FC2の表記ゆれ：FC2PPV-1234567 / FC2_PPV_1234567 / FC2-1234567 → FC2-PPV-1234567
export function baseName(n, dirName) {
  const w = parseWork(n, dirName); if (w && (w.kind === 'fc2' || w.kind === 'code')) return w.label; // フォルダ名は品番だけ（タイトルはファイル名に残す）
  let b = splitName(n).stem;
  b = b.replace(/^[^@]*@/, '').replace(/^\[[^\]]*\]\s*/, '').trim();
  return b.replace(/^(.*\d{4,})(?:[\s_-]+(?:\d{1,2}|[A-Ea-e])|[\s_-]*(?:part|cd)\s?\d{1,2})$/i, '$1');
}
// ファイル名を整えた形：品番（-連番）_タイトル.拡張子（例：4k688.com@FC2-PPV-4988183_1 夏の思い出【高画質】.mp4 → FC2-PPV-4988183-1_夏の思い出.mp4）
//   ・品番は FC2-PPV-数字／ABC-123 にそろえる。連番は「-1」「-A」の形
//   ・品番以外の文字はタイトルとして「_」のあとに残す。サイト名・URL・宣伝の【】・画質の表記は外す
//   ・空白や Windows で使えない記号は「_」にする。タイトルは 40 文字まで
//   ・重複回避の (1) と拡張子はそのまま。FC2・ABC-123 の形以外は変えない（null）
export const TITLE_AD = /高画質|高清|無碼|无码|無修正|无修正|字幕|最新|地址|永久|发布|發佈|广告|廣告|宣伝|宣传|宣傳|推荐|推薦|FHD|UHD|4K|1080|720|HD/i;
export function titleOf(w) {
  let t = ((w.pre || '').replace(/^[^@]*@/, '') + ' ' + (w.rest || '')).trim();
  if (w.part) t = t.replace(/^[\s_\-－]*(?:(?:part|cd)\s?)?(\d{1,2}|[A-Ea-e])(?=$|[\s_\-－.[(（【])/i, ' ').replace(/[\s_\-－](?:(?:part|cd)\s?)?(\d{1,2}|[A-Ea-e])$/i, ' ').replace(/第\s?\d{1,2}\s?[話部巻章]/, ' ');
  t = t.replace(/(^|[^a-z0-9])[a-z0-9-]{2,}\.(com|net|org|la|xyz|cc|me|tv|top|info|vip|club|io|co|jp|cn|tw|hk|life|site|online|live|fun|app|link)(\/\S*)?/gi, ' ')
    .replace(/[【\[]([^】\]]*)[】\]]/g, (x, y) => (TITLE_AD.test(y) ? ' ' : x))
    .replace(/(^|[^A-Za-z0-9])(?:2160|1080|720|480)[pP](?![A-Za-z0-9])|(^|[^A-Za-z0-9])(?:4K|FHD|UHD|HD|x26[45]|h\.?26[45]|HEVC|AAC)(?![A-Za-z0-9])/gi, ' ')
    .replace(/[\\/:*?"<>|\s　]+/g, '_').replace(/_+/g, '_').replace(/^[_\-.・]+|[_\-.・]+$/g, '');
  t = [...t].slice(0, 40).join('').replace(/[_\-.・]+$/, '');
  if (/^(\d{1,2}|[A-Ea-e])$/.test(t)) return ''; // 連番と読み違えるだけの文字は残さない
  // 読み直したときに連番と読み違えない形にする（先頭・末尾の「_2」などはつなげる）
  t = t.replace(/^(\d{1,2}|[A-Ea-e])[_\-](?=.)/, '$1').replace(/[_\-](\d{1,2}|[A-Ea-e])$/, '$1');
  return t;
}
export function workCleanName(name, dirName) {
  const w = parseWork(name, dirName); if (!w || (w.kind !== 'fc2' && w.kind !== 'code')) return null;
  const t = titleOf(w);
  return w.label + (w.part ? '-' + w.part : '') + (t ? '_' + t : '') + (w.dup ? '(' + w.dup + ')' : '') + w.ext;
}
export const fc2CleanName = workCleanName; // 以前の名前（呼び出し側の互換）
// 連番まで同じものの鍵（-1 と -2 を別に扱う）。いまの「同じ品番でまとめる」は -1/-2 違いも 1 組にする仕様なので、そちらは key を使う
export const dupKeyOf = (name, dirName) => { const w = parseWork(name, dirName); return w ? w.key + (w.part ? '#' + w.part : '') : ''; };
// </work-id>
