// 8. 販売者ごとに仕分け の判定（品番の拾い方・販売者の決め方・仕分けの計画）。画面の変数には頼らない
//   試験：tests/unit/seller-plan.test.mjs
import { BRANDS } from './work-id.mjs';

// 名前に入っている品番。FC2 は品番（「FC2 〇〇 collection 1234567 2345678」のような複数作品の名前も拾う）、
// FC2 以外は HEYZO・カリビアンコムなど日付型の品番（例：033118_001 / 102324-001）・h4610 系を拾う
// 名前にサイト名が入っていれば、販売者（配信元）はその場で決まる（調べに行かない）。フォルダ名は既存の「Caribbeancom（carib）」に合わせて英語名
// 名前に入っている品番。FC2 は品番（「FC2 〇〇 collection 1234567 2345678」のような複数作品の名前も拾う）、
// FC2 以外は HEYZO・h4610 系・日付型の品番（例：121815_3315-1pon / 122415-053-carib）を拾う
export function workKeys(name) {
  const n = String(name), out = [], seen = new Set();
  const add = (k) => { if (!seen.has(k.key)) { seen.add(k.key); out.push(k); } };
  if (/FC2/i.test(n)) { [...n.matchAll(/(?:^|[^\d])(\d{6,8})(?!\d)/g)].forEach((m) => add({ key: m[1], kind: 'fc2', num: m[1], label: 'FC2-PPV-' + m[1] })); return out; }
  [...n.matchAll(/heyzo[\s_-]*(\d{4})(?!\d)/gi)].forEach((m) => add({ key: 'x:heyzo-' + m[1], kind: 'brand', sid: 'heyzo', name: 'HEYZO', code: m[1], label: 'HEYZO-' + m[1] }));
  [...n.matchAll(/([hc]\d{4})[\s_-]*([a-z]{2,10})[\s_-]*(\d{3,6})(?!\d)/gi)].forEach((m) => { const b = m[1].toLowerCase(); add({ key: `x:${b}-${m[2]}${m[3]}`.toLowerCase(), kind: 'brand', sid: b, name: b.toUpperCase(), code: `${m[2]}${m[3]}`.toLowerCase(), label: `${b} ${m[2]}${m[3]}`.toLowerCase() }); });
  const br = BRANDS.find(([, , re]) => re.test(n));
  [...n.matchAll(/(?:^|[^\d])(\d{6})([-_])(\d{2,4})(?![\d])/g)].forEach((m) => {
    const code = `${m[1]}${m[2]}${m[3]}`;
    if (br) add({ key: `x:${br[0]}-${code}`, kind: 'brand', sid: br[0], name: br[1], code, date: m[1], serial: m[3], label: `${br[0]} ${code}` });
    else add({ key: `x:${code}`, kind: 'other', kw: code, digits: m[1] + m[3], prefix: '', date: m[1], serial: m[3], label: code });
  });
  return out;
}
export const SRC_LABEL = { fd2ppv: 'fd2ppv.cc', fc2cmadb: 'fc2cmadb.com', manual: '手入力', name: '品番' };
// 品番 1 つの結果（手入力が最優先 → 名前から決まるもの → 調べた結果）
export const keyRec = (k, sellerDb = {}) => { const r = sellerDb[k.key]; if (r && r.src === 'manual') return r; if (k.kind === 'brand') return { status: 'ok', name: k.name, sid: k.sid, src: 'name' }; return r; };
// 販売者フォルダの名前（フォルダ名に使えない / や \ は置き換える）
export const sellerFolderName = (s) => `${String(s.name || s.sid).replace(/[\/\\]/g, '・').replace(/\s+/g, ' ').trim().slice(0, 80)}（${s.sid}）`;
// 仕分けの計画：作品フォルダごとに、移動先の種類（seller / unknown / review / pending）を決める
// 品番の結果から、販売者が決まるか（seller）・分からないか（unknown）・判断できないか（review）・未調査か（pending）を決める
export function resolveKeys(keys, sellerDb = {}) {
  const recs = keys.map((k) => keyRec(k, sellerDb));
  if (recs.some((r) => !r)) return { kind: 'pending', note: '未調査' };
  const ok = recs.filter((r) => r.status === 'ok' && r.sid);
  const sids = [...new Set(ok.map((r) => r.sid))];
  if (keys.length > 1 && (sids.length > 1 || ok.length !== recs.length)) return { kind: 'review', why: 'multi', note: `品番が ${keys.length} つ（${recs.map((r) => (r.status === 'ok' ? r.name : '不明')).join('・')}）` };
  if (sids.length === 1) return { kind: 'seller', seller: ok[0], note: ok[0].src === 'manual' ? '手入力' : ok[0].src === 'name' ? `名前の「${keys[0].sid}」から判定` : `${SRC_LABEL[ok[0].src] || ok[0].src} で確認${ok[0].studio ? '（配信元）' : ''}` };
  return { kind: 'unknown', why: recs[0].status,
    note: recs[0].status === 'ambiguous' ? '同じ番号の作品が複数のサイトにあります'
      : keys[0].kind === 'other' ? '日付型の品番だけで、名前にサイト名がありません（名前に 1pon・carib などがあれば自動で決まります）'
      : recs[0].status === 'notfound' ? (keys[0].kind === 'fc2' ? 'fd2ppv.cc・fc2cmadb.com に見つかりません' : 'fd2ppv.cc に見つかりません') : '販売者の欄がありません' };
}
export const boxSidOf = (name) => (String(name || '').match(/（([^（）]+)）$/) || [])[1] || '';
// 仕分けの計画：作品フォルダごとに、移動先の種類（seller / unknown / review / pending）を決める。
// ホームから読み込んだときは、仕分け済みの「販売者別」の中も見直す（販売者違い・置き場所違い）、同じ品番のフォルダが複数あるものも知らせる
// opts.cfg：販売者の設定（root・unknown・review の名前）／opts.sellerDb：販売者の記録／opts.dirLabel(id)：読み込み結果にないフォルダの名前
export function buildSellerPlan(ds, { cfg, sellerDb = {}, dirLabel = () => '' }) {
  const R = ds.find((d) => d.isRoot);
  const homeScan = !!R && (!R.id || R.id === 'root');
  const byId = new Map(ds.map((d) => [d.id, d]));
  const sortedRoot = homeScan ? ds.find((d) => !d.isRoot && (d.parentId === R.id || !d.parentId || d.parentId === 'root') && d.name === cfg.root) : null;
  // 「販売者別」の中から読み込んだとき（ホーム › 販売者別 › …）は、全部が仕分け済み（見直しはホームから読み込んだときだけ）
  const insideBox = !!R && !homeScan && (R.name === cfg.root || (R.trailNames || []).slice(0, 3).includes(cfg.root) || (R.trail || []).some((id) => dirLabel(id) === cfg.root));
  const inSorted = (d) => insideBox || (!!sortedRoot && (d.id === sortedRoot.id || (d.trail || []).includes(sortedRoot.id)));
  const keysOf = new Map(); ds.forEach((d) => { if (!d.isRoot) { const k = workKeys(d.name); if (k.length) keysOf.set(d.id, k); } });
  const resOf = new Map(); const res = (id) => { if (!resOf.has(id)) resOf.set(id, resolveKeys(keysOf.get(id), sellerDb)); return resOf.get(id); };
  const sidOf = (id) => { const r = res(id); return r.kind === 'seller' ? r.seller.sid : ''; };
  const mk = (d, r, extra) => ({ id: d.id, name: d.name, path: d.path, parentId: d.parentId, keys: keysOf.get(d.id), kind: r.kind, seller: r.seller || null, note: r.note, why: r.why || '', depth: (d.trail || []).length, ...extra });
  const plan = [];
  // 1. まだ仕分けていない作品フォルダ
  const cand = ds.filter((d) => keysOf.has(d.id) && !inSorted(d));
  const candIds = new Set(cand.map((d) => d.id));
  cand.forEach((d) => {
    const anc = (d.trail || []).slice(0, -1).filter((id) => candIds.has(id));
    if (anc.length) {
      // 作品フォルダの中の作品フォルダ：外側と同じ販売者なら一緒に動かす。違うときは、先にこれだけを外へ出す
      // 作品フォルダの中の別の作品フォルダ（入れ子）は、いったん My Pack へ出す
      const outer = anc[anc.length - 1];
      const on = (byId.get(outer) || {}).name || dirLabel(outer) || '';
      plan.push(mk(d, res(d.id), { fix: 'nest', nested: on, note: `「${on}」の中にあります（入れ子）→ いったん My Pack へ出して、仕分け直します` }));
      return;
    }
    const r = res(d.id);
    // 中に別の販売者の作品フォルダがあるときは、自動では動かさない
    const mySid = sidOf(d.id);
    const others = cand.filter((x) => x.id !== d.id && (x.trail || []).includes(d.id));
    if (others.length) { plan.push(mk(d, { kind: 'review', why: 'inner', note: `中に作品フォルダが ${others.length} つあります（入れ子）。中の作品を My Pack へ出すと、このフォルダも仕分けできます` })); return; }
    plan.push(mk(d, r));
  });
  // 2. 仕分け後の確認（ホームから読み込んだときだけ）：「販売者別」の中の作品フォルダが正しい場所にあるか
  if (sortedRoot) {
    ds.filter((d) => keysOf.has(d.id) && (d.trail || []).includes(sortedRoot.id) && d.parentId !== sortedRoot.id).forEach((d) => {
      const tr = d.trail || [], bi = tr.indexOf(sortedRoot.id);
      const box = byId.get(tr[bi + 1]); if (!box || box.id === d.id) return;
      // 外側の作品フォルダと同じ販売者なら、外側に任せる
      const anc = tr.slice(bi + 2, -1).filter((id) => keysOf.has(id));
      const r = res(d.id), sid = sidOf(d.id), bsid = boxSidOf(box.name);
      if (anc.length) { const on = (byId.get(anc[anc.length - 1]) || {}).name || ''; plan.push(mk(d, r, { fix: 'nest', nested: on, note: `「${on}」の中にあります（入れ子・今：${box.name}）→ いったん My Pack へ出して、仕分け直します` })); return; }
      const where = (d.path || '').replace(/\/[^/]*$/, '') || '/';
      if (r.kind === 'seller') {
        if (bsid && sid !== bsid) plan.push(mk(d, r, { fix: 'wrong', note: `販売者が違います（今：${box.name}）・${r.note} → いったん My Pack へ戻して、振り分け直します` }));
        else if (!bsid && (box.name === cfg.unknown || box.name === cfg.review) && !ds.some((x) => x.parentId !== d.parentId && x.name.toLowerCase() === d.name.toLowerCase() && boxSidOf((byId.get(x.parentId) || {}).name) === sid)) plan.push(mk(d, r, { fix: 'found', note: `販売者が分かりました（今：${box.name}）・${r.note} → いったん My Pack へ戻して、振り分け直します` }));
        else if (bsid && d.parentId !== box.id) plan.push(mk(d, r, { fix: 'deep', note: `販売者フォルダの直下にありません（今：${where}/）` }));
      } else if (r.kind === 'pending' && bsid) plan.push(mk(d, r, { fix: 'pend', note: `仕分け済みの中・未調査（今：${box.name}）→ いったん My Pack へ戻して、調べてから振り分け直します` }));
    });
  }
  // 3. 同じ品番のフォルダが複数（確認用。移動はしない）
  if (homeScan) {
    const byKey = new Map();
    ds.forEach((d) => { const ks = keysOf.get(d.id); if (!ks || ks.length !== 1) return; const k = ks[0].key; if (!byKey.has(k)) byKey.set(k, []); byKey.get(k).push(d); });
    byKey.forEach((list) => {
      // 入れ子（外側と内側）は同じ作品なので除く
      const top = list.filter((d) => !list.some((o) => o.id !== d.id && (d.trail || []).includes(o.id)));
      if (top.length < 2) return;
      // まとめ先：販売者フォルダの中にあるもの（販売者が 1 つに決まるとき）。なければ「要確認」「販売者不明」以外の 1 つ
      const segs = (x) => String(x.path || '').split('/').filter(Boolean);
      const sidOf = (x) => { const g = segs(x); return g[0] === cfg.root && g.length > 2 ? boxSidOf(g[1]) : ''; };
      const loose = (x) => { const g = segs(x); return g[0] === cfg.root && (g[1] === cfg.review || g[1] === cfg.unknown); };
      const sids = [...new Set(top.map(sidOf).filter(Boolean))];
      let keep = sids.length === 1 ? top.find((x) => sidOf(x) === sids[0]) : null;
      if (!keep && !sids.length) { const k = top.filter((x) => !loose(x)); if (k.length === 1) keep = k[0]; }
      const d = keep || top[0];
      const others = top.filter((x) => x.id !== d.id);
      const where = (x) => (x.path || '').replace(/^\//, '');
      plan.push({ id: 'dup:' + d.id, name: d.name, path: d.path, parentId: d.parentId, keys: keysOf.get(d.id), kind: 'dupw', seller: null, merge: !!keep, keepId: keep ? keep.id : '', keepPath: keep ? where(keep) : '', mergeIds: keep ? others.map((x) => x.id) : [],
        note: keep ? `同じ品番のフォルダが ${top.length} つ：${others.map(where).join(' ／ ')} の中身を ${where(keep)} にまとめます（空になったフォルダはゴミ箱へ）` : `同じ品番のフォルダが ${top.length} つ（販売者が違うため自動ではまとめません）：${top.map(where).join(' ／ ')}`, why: '', depth: 0, dupIds: top.map((x) => x.id) });
    });
  }
  return plan;
}

// ---- 販売者名の読み違い（4.18.x の不具合）の見分け方と直し方 ----
//   fc2cmadb.com の上のメニューにある「販売者」「ランキング」などのリンクを、販売者として読んでいた記録
//   起動時の後始末と、PikPak で同期するとき（古い記録が戻ってこないように）の両方で使う
export const NAV_SID = /^(bookmark-ranking|ranking|all|new|search|comments?)$/i;
export const BAD_SELLER_NAME = /^(販売者|Sellers?|賣家|卖家)$/i;
export const isMisreadSeller = (x) => !!x && (NAV_SID.test(String(x.sid || '')) || BAD_SELLER_NAME.test(String(x.name || '').trim()));
// sellerDb（品番 → 販売者の記録）と wInfo（品番 → 作品の情報）をその場で直し、直した品番の数を返す
//   ・作品の情報：読み違いのサイトの記録を外し、日時を新しくする（同期で古いものに負けないように）
//   ・販売者の記録：ほかのサイトで分かっていればその名前に、分からなければ消す（未調査に戻す）。手入力は触らない
export function fixMisreadSellers(sellerDb = {}, wInfo = {}, now = Date.now()) {
  const keys = new Set();
  Object.entries(wInfo).forEach(([key, o]) => {
    if (!o || !o.sellers) return;
    let hit = false;
    Object.keys(o.sellers).forEach((st) => { if (isMisreadSeller(o.sellers[st])) { delete o.sellers[st]; hit = true; } });
    if (hit) { delete o.ack; o.at = now; keys.add(key); }
  });
  Object.entries(sellerDb).forEach(([key, rec]) => {
    if (!rec || rec.src === 'manual' || !isMisreadSeller(rec)) return;
    const ss = (wInfo[key] && wInfo[key].sellers) || {};
    const st = Object.keys(ss).find((s) => ss[s] && ss[s].sid && !isMisreadSeller(ss[s]));
    if (st) sellerDb[key] = { name: ss[st].name, sid: ss[st].sid, src: st === 'fd2ppv' ? 'fd2ppv' : 'fc2cmadb', status: 'ok', at: now };
    else delete sellerDb[key];
    keys.add(key);
  });
  return keys.size;
}
