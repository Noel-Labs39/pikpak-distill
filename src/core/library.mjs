// 左メニューの一覧の中身（出演者・販売者・関連作品・続きを見る・消す候補・再生した履歴・最近の追加・ゴミ箱の取りこぼし）
//   画面の変数には頼らず、読み込み結果・記録を受け取って「並べる中身」を返すだけ。描くのは画面側（src/70-lib）
//   試験：tests/unit/library.test.mjs
import { parseWork, splitName } from './work-id.mjs';

export const NO_ACT = '出演者不明';
export const NO_SEL = '販売者不明';
const ms = (s) => Date.parse(s || 0) || 0;

// 出演者・販売者の索引
//   作品ごと（品番）に代表の動画 1 本（いちばん大きいもの）を選び、出演者（手入力を優先）と販売者（調べた結果）で引けるようにする
//   opts.isVideo(f) … 動画か／opts.keyOf(f) … { k: { key, label }, w }（作品の鍵。読めなければ k なし）
//   opts.wInfo … 作品の情報／opts.sellerDb … 販売者の記録
export function buildPeopleIndex(files, { isVideo, keyOf, wInfo = {}, sellerDb = {} }) {
  const works = new Map();
  files.forEach((f) => {
    if (!isVideo(f)) return;
    const { k, w } = keyOf(f) || {}; if (!k) return;
    const o = works.get(k.key);
    if (!o) works.set(k.key, { key: k.key, label: k.label, w, file: f, n: 1 });
    else { o.n++; if ((+f.size || 0) > (+o.file.size || 0)) o.file = f; }
  });
  const act = new Map(), sel = new Map();
  const add = (m, n, key) => { if (!m.has(n)) m.set(n, []); m.get(n).push(key); };
  works.forEach((o, key) => {
    const inf = wInfo[key];
    const acts = inf && inf.manual && inf.manual.actresses ? inf.manual.actresses : ((inf && inf.actresses) || []).map((x) => x.name);
    o.actors = acts.filter(Boolean);
    const sd = sellerDb[key]; o.seller = sd && sd.status === 'ok' && sd.name ? sd.name : '';
    o.title = (inf && inf.title) || '';
    if (o.actors.length) o.actors.forEach((n) => add(act, n, key)); else add(act, NO_ACT, key);
    add(sel, o.seller || NO_SEL, key);
  });
  return { works, act, sel };
}

// 関連する作品：同じ出演者 → 同じ販売者の順（自分は除く）
export function relatedWorks(P, key, max = 8) {
  const o = P.works.get(key); if (!o) return [];
  const out = [], seen = new Set([key]);
  const push = (k, why) => { if (seen.has(k) || out.length >= max) return; seen.add(k); const x = P.works.get(k); if (x) out.push({ ...x, why }); };
  o.actors.forEach((n) => (P.act.get(n) || []).forEach((k) => push(k, n)));
  if (o.seller) (P.sel.get(o.seller) || []).forEach((k) => push(k, o.seller));
  return out;
}

// 名前の一覧（作品数の多い順。「不明」は最後）。q で絞り込む → [[名前, 作品数], …]
export const pplNames = (m, q) => [...m.entries()].map(([n, ks]) => [n, ks.length])
  .filter(([n]) => !q || n.toLowerCase().includes(q.toLowerCase()))
  .sort((a, b) => ((a[0] === NO_ACT || a[0] === NO_SEL) - (b[0] === NO_ACT || b[0] === NO_SEL)) || b[1] - a[1] || a[0].localeCompare(b[0], 'ja'));

// ある出演者（mode 'act'）・販売者（'sel'）の作品（追加日の新しい順）
export function peopleWorks(P, mode, name) {
  const m = mode === 'sel' ? P.sel : P.act;
  return (m.get(name) || []).map((k) => P.works.get(k)).filter(Boolean)
    .sort((a, b) => ms(b.file.ct) - ms(a.file.ct))
    .map((o) => ({ id: o.file.id, name: o.file.name, size: o.file.size, at: o.file.ct, path: o.file.path, thumb: o.file.thumb || '', work: o }));
}

// 再生の記録（このブラウザ）から一覧を作る：kind 'cand'＝消す候補（見ながら仕分けで D）／'cont'＝続きを見る（途中で止めたもの・300 件まで）
//   db … { [id]: { name, size, at, thumb, pos, done, tri } }／fileById … 読み込み結果から名前などを補う
export function mediaList(db, kind, fileById = () => null) {
  const keep = kind === 'cand' ? (m) => m.tri === 'del' : (m) => m.pos > 0 && !m.done;
  const ids = Object.keys(db).filter((k) => keep(db[k])).sort((a, b) => ms(db[b].at) - ms(db[a].at));
  return (kind === 'cont' ? ids.slice(0, 300) : ids)
    .map((k) => { const m = db[k], sf = fileById(k); return { id: k, name: m.name || (sf && sf.name) || k, size: m.size || (sf && sf.size) || 0, at: m.at, thumb: m.thumb || (sf && sf.thumb) || '' }; });
}

// 再生した履歴：PikPak の再生の記録と、このブラウザの記録を合わせる（同じファイルは新しい方の日時・新しい順）
export function mergeHistory(events, db, fileById = () => null) {
  const seen = new Set(), out = [];
  (events || []).forEach((e) => {
    const r = e.reference_resource || {}; const id = String(e.file_id || r.id || '');
    if (!id || seen.has(id) || r.trashed) return; seen.add(id);
    const sf = fileById(id);
    out.push({ id, name: r.name || e.file_name || id, size: +(r.size || e.file_size) || 0, at: e.event_time || e.created_time || e.updated_time || '', thumb: r.thumbnail_link || e.thumbnail_link || (sf && sf.thumb) || '' });
  });
  Object.keys(db).filter((k) => db[k].at).forEach((k) => {
    const x = db[k];
    const o = out.find((y) => y.id === k);
    if (o) { if (ms(x.at) > ms(o.at)) o.at = x.at; return; }
    const sf = fileById(k); out.push({ id: k, name: x.name, size: x.size || (sf && sf.size) || 0, at: x.at, thumb: x.thumb || (sf && sf.thumb) || '' });
  });
  return out.sort((a, b) => ms(b.at) - ms(a.at));
}

// 最近の追加：since（時刻）より後に追加したもの（新しい順・500 件まで）
export const recentFiles = (files, since) => files.filter((f) => f.ct && ms(f.ct) >= since).sort((a, b) => ms(b.ct) - ms(a.ct)).slice(0, 500)
  .map((f) => ({ id: f.id, name: f.name, size: f.size, at: f.ct, path: f.path, thumb: f.thumb || '' }));

// ゴミ箱の取りこぼしの候補：数字だけの名前で、その数字が入っていたフォルダの品番と同じもの（印 miss を付けて先頭へ。件数を返す）
export function markTrashMissed(items, folders) {
  const dn = new Map(folders.map((x) => [x.id, x.name]));
  let k = 0;
  items.forEach((it) => { const fd = dn.get(it.parentId); if (it.folder || !fd || !/^\d{5,8}(?!\d)/.test(splitName(it.name).stem)) return; const w = parseWork(it.name, fd); if (w && w.src === 'dir') { it.miss = fd; k++; } });
  if (k) items.sort((a, b) => (b.miss ? 1 : 0) - (a.miss ? 1 : 0));
  return k;
}
