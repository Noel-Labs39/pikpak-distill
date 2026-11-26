// 整理の判定（重複・フォルダ名・作品ごとの仕分け・ファイル名・不要ファイル・仕上げ）。画面の変数には頼らない
//   どれも「読み込んだファイル一覧・フォルダ一覧」を受け取り、計画（何をどう変えるか）を返すだけ。PikPak は触らない
//   試験：tests/unit/plan.test.mjs
import { UNIT, NEAR } from './const.mjs';
import { parseWork, hasWorkId, baseName, splitName, dupKeyOf, fc2CleanName } from './work-id.mjs';

// ---------- グルーピング ----------
// 同じファイル名モードでも、重複回避の (1) 等は同名として扱う
export const keyOf = (name, mode, dirName) => (mode === 'id' ? ((parseWork(name, dirName) || {}).key || ((name.match(/(\d{5,8})/) || [])[1]) || name.toLowerCase()) : (dupKeyOf(name, dirName) ? 'w:' + dupKeyOf(name, dirName) + (splitName(name).ext || '').toLowerCase() : name.toLowerCase()).replace(/\s?\(\d+\)(?=\.[a-z0-9]{2,5}$|$)/, ''));
// folders：入っているフォルダの名前で品番を読むため（数字だけのファイル名など）
export function buildGroups(files, mode, folders = []) {
  const m = new Map();
  const dn = new Map(folders.map((d) => [d.id, d.name]));
  files.forEach((f) => { const k = keyOf(f.name, mode, dn.get(f.parentId)); if (!m.has(k)) m.set(k, []); m.get(k).push(f); });
  return [...m.entries()]
    .filter(([, v]) => v.length > 1)
    .map(([k, v]) => {
      v.sort((a, b) => b.size - a.size);
      const max = v[0].size || 1;
      // 隣り合うサイズ同士が1.5%以内なら「サイズが近い組」（最大以外の組も拾う）
      const near = v.some((x, i) => i > 0 && (v[i - 1].size - x.size) / (v[i - 1].size || 1) <= NEAR);
      return { key: k, items: v, near };
    })
    .sort((a, b) => (b.near - a.near) || a.key.localeCompare(b.key));
}


// ---------- フォルダ名を中のファイル名に揃える ----------
// 計画: [{id, parentId, path, cur, target, status, note}]  status: same / rename / dup / skip
// opts.keep：変えないフォルダ（販売者ごとに仕分けのフォルダ）の id の Set
export function buildRenamePlan(files, folders, opts = {}) {
  const direct = new Map();
  files.forEach((f) => { if (!direct.has(f.parentId)) direct.set(f.parentId, []); direct.get(f.parentId).push(f); });
  const kids = new Map();
  folders.forEach((f) => { if (!kids.has(f.parentId)) kids.set(f.parentId, []); kids.get(f.parentId).push(f); });
  const taken = new Map(); // parentId -> Set(小文字の名前) ※「そのまま残るフォルダ」と確定済みの新名
  const add = (pid, n) => { if (!taken.has(pid)) taken.set(pid, new Set()); taken.get(pid).add(n.toLowerCase()); };
  const keep = opts.keep || new Set();
  const plan = folders.map((fo) => {
    // 品番の入ったファイルだけを見る（広告など品番のないファイルの名前をフォルダ名にしない）
    const fs = (direct.get(fo.id) || []).filter((f) => hasWorkId(f.name, fo.name));
    let bases = [...new Set(fs.map((f) => baseName(f.name, fo.name)))];
    let fromSub = false;
    if (!bases.length) { // 直下に作品ファイルがなく、中のフォルダが（広告フォルダを除いて）1作品だけなら、その品番に揃える
      const sub = (kids.get(fo.id) || []).filter((k) => hasWorkId(k.name) || !(AD_WORD.test(k.name) || DOMAIN.test(k.name)));
      if (sub.length && sub.every((k) => hasWorkId(k.name))) { bases = [...new Set(sub.map((k) => baseName(k.name)))]; fromSub = true; }
    }
    const p = { id: fo.id, parentId: fo.parentId, trail: fo.trail, path: fo.path, cur: fo.name, target: '', status: 'skip', note: '' };
    if (fo.isRoot || fo.parentId === 'root' || fo.parentId === '') p.note = '最上位・スキャン起点のフォルダは変更しません';
    else if (keep.has(fo.id)) p.note = '「販売者ごとに仕分け」のフォルダは変更しません';
    else if (!bases.length) p.note = (direct.get(fo.id) || []).length ? '品番の入ったファイルがないため変更しません' : '直下にファイルなし';
    else if (bases.length > 1) { p.note = (fromSub ? '中に品番の異なるフォルダが複数: ' : '直下に名前の異なるファイルが複数: ') + bases.slice(0, 3).join(' / '); p.cands = bases; }
    else { p.target = bases[0]; if (fromSub) p.why = '中のフォルダの品番に揃えます'; }
    return p;
  });
  // すでに一致しているものを先に確定（衝突時にこちらを優先して名前を守る）
  plan.forEach((p) => { if (p.target && p.target === p.cur) { p.status = 'same'; add(p.parentId, p.target); } });
  // 既に「名前(n)」形式で付いているものも、その名前が空いていれば維持（毎回付け替わらないように）
  plan.forEach((p) => {
    if (p.status === 'same' || !p.target) return;
    const esc2 = p.target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp('^' + esc2 + '\\(\\d+\\)$').test(p.cur) && !(taken.get(p.parentId) || new Set()).has(p.cur.toLowerCase())) { p.status = 'same'; add(p.parentId, p.cur); }
  });
  // 目的地のない・要確認のフォルダは現状の名前を占有
  plan.forEach((p) => { if (!p.target) add(p.parentId, p.cur); });
  plan.forEach((p) => {
    if (!p.target || p.status === 'same') return;
    let n = p.target, i = 0;
    while (taken.get(p.parentId) && taken.get(p.parentId).has(n.toLowerCase())) { i++; n = `${p.target}(${i})`; }
    // 自分自身の現名が (n) と一致している場合は変更不要
    if (n === p.cur) { p.status = 'same'; add(p.parentId, n); return; }
    add(p.parentId, n);
    p.finalName = n; p.status = i ? 'dup' : 'rename';
    p.note = [p.why, i ? '同名フォルダがあるため (' + i + ') を付与' : ''].filter(Boolean).join('／');
  });
  plan.forEach((p) => { if (p.finalName) p.target = p.finalName; else if (p.status === 'same') p.target = p.cur; });
  return plan;
}

// ---------- 作品ごとに仕分け（混在フォルダの中に品番フォルダを作り、そこへ移動） ----------
export const workKey = (n, dirName) => { const b = baseName(n, dirName); return /\d{5,8}/.test(b) ? b : ''; };
export const addSuffix = (name, taken) => {
  const m = name.match(/^(.*?)(\.[A-Za-z0-9]{2,5})?$/); let i = 1, n;
  do { n = `${m[1]}(${i})${m[2] || ''}`; i++; } while (taken.has(n.toLowerCase()));
  return n;
};
// 置き場所のフォルダ：読み込んだ場所（ホーム以外）と、ホームの直下のフォルダ（My Pack など）
export const isDropBox = (c) => (c.isRoot ? c.id !== 'root' && !!c.id : c.parentId === 'root' || c.parentId === '');
// 置き場所のフォルダの直下にあって、品番が読めないため仕分けできないファイル（「要確認」で理由を見せる）
export function dropBoxLeftovers(files, folders) {
  const box = new Map(folders.filter(isDropBox).map((d) => [d.id, d]));
  return files.filter((f) => box.has(f.parentId) && !workKey(f.name, box.get(f.parentId).name));
}
// 計画: [{cid, ctrail, cpath, work, folderId, folderNew, items:[{id,name,to}], status, note}]
export function buildSortPlan(files, folders) {
  const kids = new Map(), direct = new Map();
  folders.forEach((f) => { if (!kids.has(f.parentId)) kids.set(f.parentId, []); kids.get(f.parentId).push(f); });
  files.forEach((f) => { if (!direct.has(f.parentId)) direct.set(f.parentId, []); direct.get(f.parentId).push(f); });
  const plan = [];
  folders.forEach((c) => {
    const fs = direct.get(c.id) || [];
    const groups = new Map();
    fs.forEach((f) => { const k = workKey(f.name); if (!k) return; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(f); });
    // 1作品だけのフォルダは仕分け不要（フォルダ名の整合で対応）。ただし My Pack など置き場所のフォルダ（読み込んだ場所・ホームの直下）は、
    // 1 作品でも作品フォルダを作る（作らないと「販売者ごとに仕分け」の対象にならず、ずっと残るため）
    if (groups.size < (isDropBox(c) ? 1 : 2)) return;
    const own = [...groups.keys()].find((k) => k.toLowerCase() === baseName(c.name).toLowerCase()); // フォルダ名と同じ作品はそのまま残す
    // 上の階層にすでに同じ作品のフォルダがある場合は、さらに下へフォルダを作らない（入れ子になるのを防ぐ）
    const byId = new Map(folders.map((f) => [f.id, f]));
    const upper = new Set((c.trail || []).slice(0, -1).map((id) => byId.get(id)).filter((f) => f && !f.isRoot).map((f) => baseName(f.name).toLowerCase()));
    [...groups.keys()].sort().forEach((k) => {
      if (k === own || upper.has(k.toLowerCase())) return;
      const ex = (kids.get(c.id) || []).find((f) => f.name.toLowerCase() === k.toLowerCase()) || (kids.get(c.id) || []).find((f) => baseName(f.name).toLowerCase() === k.toLowerCase());
      const taken = new Set((ex ? direct.get(ex.id) || [] : []).map((f) => f.name.toLowerCase()));
      const items = groups.get(k).map((f) => {
        let to = f.name;
        if (taken.has(to.toLowerCase())) to = addSuffix(f.name, taken);
        taken.add(to.toLowerCase());
        return { id: f.id, name: f.name, to };
      });
      plan.push({ cid: c.id, ctrail: c.trail, cpath: c.path, work: k, folderId: ex ? ex.id : '', folderNew: !ex, items, status: 'todo', note: '' });
    });
  });
  // 下の階層の混在フォルダから先に（My Pack直下の大量振り分けは最後）
  return plan.sort((a, b) => (b.ctrail.length - a.ctrail.length) || a.cpath.localeCompare(b.cpath));
}

// ---------- FC2 ファイル名を整える ----------
// 計画: [{op:'rename', kind:'file', id, parentId, path, cur, target, status, note}]
export function buildNamePlan(files, folders) {
  const fPath = new Map(folders.map((f) => [f.id, f.path]));
  const fName = new Map(folders.map((f) => [f.id, f.name]));
  const byP = new Map(); files.forEach((f) => { if (!byP.has(f.parentId)) byP.set(f.parentId, []); byP.get(f.parentId).push(f); });
  const plan = [];
  byP.forEach((list, pid) => {
    const taken = new Set(list.map((x) => x.name.toLowerCase()));
    list.forEach((x) => {
      const to0 = fc2CleanName(x.name, fName.get(pid));
      if (!to0 || to0 === x.name) return;
      taken.delete(x.name.toLowerCase());
      let to = to0, note = '';
      if (taken.has(to.toLowerCase())) { to = addSuffix(to0, taken); note = '同じ名前のファイルがあるため (n) を付けます（重複の可能性：「重複を比べて削除」で確認できます）'; }
      taken.add(to.toLowerCase());
      plan.push({ op: 'rename', kind: 'file', id: x.id, parentId: pid, path: fPath.has(pid) ? fPath.get(pid) : (x.path || ''), cur: x.name, target: to, status: 'todo', note });
    });
  });
  return plan;
}

// ---------- 作品と関係ないファイル（広告・宣伝／10MB以下 など）の判定 ----------
// 読み込んだファイルのうち作品と関係ないものを見分け、ほかのステップの対象から外す
//   del    … 作品と関係ないと判断（最初からチェックあり）
//   review … 作品の可能性があるので確認してほしいもの（最初はチェックなし）
export const JUNK_MAX = 10 * UNIT.MB;
export const AD_VIDEO_MAX = 50 * UNIT.MB; // 作品フォルダに紛れた品番のない動画は、これより小さければ広告とみなす
export const SPREAD_MAX = 200 * UNIT.MB;
export const AD_EXT = new Set(['url', 'lnk', 'webloc', 'txt', 'htm', 'html', 'mht', 'mhtml', 'chm', 'exe', 'apk', 'bat', 'cmd', 'scr', 'vbs', 'torrent']);
export const SUB_EXT = new Set(['srt', 'ass', 'ssa', 'vtt', 'sub', 'idx', 'smi']);
export const AD_WORD = /广告|廣告|広告|宣传|宣傳|宣伝|推广|推廣|地址|網址|网址|发布|發布|获取|獲取|下载|下載|防屏蔽|永久|澳门|澳門|葡京|赌场|賭場|博彩|娱乐|娛樂|直播|约炮|約炮|社区|社區|论坛|論壇|福利|扫码|掃碼|客服|微信|QQ群|电报|電報|telegram|公告|必看|招募|关注|關注|聯繫|联系|最新アドレス|promo|advert/i;
export const DOMAIN = /(^|[^a-z0-9])[a-z0-9-]{2,}\.(com|net|org|la|xyz|cc|me|tv|top|vip|club|info|app|io|co|link|site|online|live|fun|win|life)($|[^a-z0-9])/i;
export const KANA = /[぀-ヿ]/;
// 中国語にしかない字（簡体字・繁体字）。日本語の漢字だけのタイトルを中国語と誤判定しないよう、日本語と共通の字は入れない
export const ZH_ONLY = /[们这个资视频获发址网载为无码对时说请关联报电级备实购买么吗该进过还从让给见门问间开头东车马书读写语话认识记广场论坛专业产单经现选择变态爱亲热线红际欢边领导员样传统观众极简习盘约骚妇鸡伦强调們這發實從讓讀寫專產單廣碼說聯對麼嗎]/;
// 品番＝FC2-PPV-数字、または ABC-123 の形。日付などの数字だけ（例：发布器20260609）は品番とみなさない
// 判定に使う周りの情報
//   spreadNames … 品番のない同じ名前のファイルが、別々のフォルダに入っている（作品に付いてきた広告）
//   workDirs    … 作品のフォルダ（フォルダ名か、中のファイル・フォルダに品番がある）
//   adDirs      … 名前が広告・宣伝のフォルダ（その中身も含む）
let spreadNames = new Set(), workDirs = new Set(), adDirs = new Set(), dirNames = new Map();
export function prepJunk(files, folders) {
  dirNames = new Map(folders.map((d) => [d.id, d.name]));
  const where = new Map();
  files.forEach((f) => { if (hasWorkId(f.name, dirNames.get(f.parentId))) return; const k = f.name.toLowerCase(); if (!where.has(k)) where.set(k, new Set()); where.get(k).add(f.parentId); });
  spreadNames = new Set([...where].filter(([, s]) => s.size >= 2).map(([k]) => k));
  workDirs = new Set();
  const top = new Set(folders.filter((d) => d.isRoot || d.parentId === 'root' || d.parentId === '').map((d) => d.id)); // 起点・ホーム直下（My Pack 等）は除く
  folders.forEach((d) => { if (hasWorkId(d.name)) { workDirs.add(d.id); if (!top.has(d.parentId)) workDirs.add(d.parentId); } });
  files.forEach((f) => { if (hasWorkId(f.name, dirNames.get(f.parentId)) && !top.has(f.parentId)) workDirs.add(f.parentId); });
  const ad = folders.filter((d) => !d.isRoot && !hasWorkId(d.name) && (AD_WORD.test(d.name) || DOMAIN.test(d.name))).map((d) => d.id);
  adDirs = new Set(folders.filter((d) => (d.trail || []).some((id) => ad.includes(id))).map((d) => d.id));
}
export function junkInfo(f) {
  const name = String(f.name || '');
  const m = name.match(/^(.*?)(?:\.([A-Za-z0-9]{2,7}))?$/);
  const stem = m[1], ext = (m[2] || '').toLowerCase();
  const id = hasWorkId(name, dirNames.get(f.parentId));
  const zh = !KANA.test(stem) && ZH_ONLY.test(stem);
  if (AD_EXT.has(ext)) return { level: 'del', reason: '広告・宣伝（' + ext + ' ファイル）' };
  if (!id && adDirs.has(f.parentId)) return { level: 'del', reason: '広告・宣伝（広告フォルダの中）' };
  if (!id && (AD_WORD.test(stem) || DOMAIN.test(stem))) return { level: 'del', reason: '広告・宣伝（品番なし）' };
  if (SUB_EXT.has(ext)) return { level: 'review', reason: '字幕ファイル' };
  if (f.size <= JUNK_MAX) return { level: 'del', reason: '10MB以下' };
  // 海外の宣伝ファイルによくある名前（品番なし）。大きいものは本編の可能性もあるため「要確認」に回す
  if (zh && !id) return f.size < AD_VIDEO_MAX ? { level: 'del', reason: '広告・宣伝（品番のない宣伝向けの名前）' } : { level: 'review', reason: '品番のないファイル（作品の可能性）' };
  if (!id && f.size < SPREAD_MAX && spreadNames.has(name.toLowerCase())) return { level: 'del', reason: '広告・宣伝（品番がなく、複数のフォルダに同じ名前）' };
  if (!id && workDirs.has(f.parentId)) return f.size < AD_VIDEO_MAX ? { level: 'del', reason: '広告・宣伝（作品フォルダの中の、品番のない小さなファイル）' } : { level: 'review', reason: '作品フォルダの中の、品番のないファイル' };
  if (zh) return { level: 'review', reason: '品番あり・作品の可能性（念のため確認）' };
  return null;
}
// 計画: [{id, name, path, parentId, size, thumb, level, reason}]
export function buildJunkPlan(files, folders) {
  prepJunk(files, folders);
  return files.map((f) => { const j = junkInfo(f); return j ? { ...f, level: j.level, reason: j.reason } : null; }).filter(Boolean)
    .sort((a, b) => (a.level === b.level ? 0 : a.level === 'del' ? -1 : 1) || a.path.localeCompare(b.path) || a.name.localeCompare(b.name));
}

// ---------- 仕上げ：(1) を外す・空フォルダを片付ける ----------
// 重複を削除したあとに残る「中身が空のフォルダ」をゴミ箱へ移し、
// 同じ場所に元の名前が無くなったフォルダ・ファイルの (n) を外す
export const PAREN_DIR = /^(.*?)\s?\((\d+)\)$/;
export const PAREN_FILE = /^(.*?)\s?\((\d+)\)(\.[A-Za-z0-9]{2,5})$/;
// 計画: [{op:'trash'|'rename', kind, id, parentId, ptrail, path, cur, target, status:'todo'|'skip', note}]
// opts.junk：「作品と関係ないファイル」を消す設定が有効か（入れ子の判定で、それらを無いものとして扱う）
export function buildCleanPlan(files, folders, opts = {}) {
  const plan = [];
  const fTrail = new Map(folders.map((f) => [f.id, f.trail]));
  const fPath = new Map(folders.map((f) => [f.id, f.path]));
  const nChild = new Map();
  files.forEach((f) => nChild.set(f.parentId, (nChild.get(f.parentId) || 0) + 1));
  folders.forEach((f) => nChild.set(f.parentId, (nChild.get(f.parentId) || 0) + 1));
  const isEmpty = (f) => !nChild.get(f.id);
  const protectedDir = (f) => f.isRoot || f.parentId === 'root' || f.parentId === ''; // 読み込み起点とホーム直下（My Pack 等）は触らない
  const item = (op, kind, x, pid, target, status, note) => ({ op, kind, id: x.id, parentId: pid, ptrail: fTrail.get(pid), path: fPath.has(pid) ? fPath.get(pid) : (x.path || ''), cur: x.name, target, status: fTrail.get(pid) ? status : 'skip', note: fTrail.get(pid) ? note : '場所の情報がありません（ホームから読み込み直してください）' });
  const sib = (arr) => { const m = new Map(); arr.forEach((x) => { if (!m.has(x.parentId)) m.set(x.parentId, []); m.get(x.parentId).push(x); }); return m; };
  // フォルダ：同じ場所の「X」「X(1)」「X(2)」…をまとめて判断
  sib(folders.filter((f) => !protectedDir(f))).forEach((list, pid) => {
    const groups = new Map();
    list.forEach((f) => { const m = f.name.match(PAREN_DIR); const b = m ? m[1] : f.name; const k = b.toLowerCase(); if (!groups.has(k)) groups.set(k, { base: b, items: [] }); groups.get(k).items.push({ f, n: m ? +m[2] : 0 }); });
    groups.forEach(({ base, items }) => {
      items.sort((a, b) => a.n - b.n);
      const empties = items.filter((o) => isEmpty(o.f)), full = items.filter((o) => !isEmpty(o.f));
      empties.forEach((o) => plan.push(item('trash', 'folder', o.f, pid, '', 'todo', items.length > 1 ? '中身が空の同名フォルダ' : '中身が空のフォルダ')));
      if (full.length === 1) {
        const o = full[0];
        if (o.f.name !== base) plan.push(item('rename', 'folder', o.f, pid, base, 'todo', empties.length ? '空の同名フォルダを片付けたあとに外します' : ''));
      } else if (full.length > 1) {
        full.filter((o) => o.n > 0).forEach((o) => plan.push(item('rename', 'folder', o.f, pid, base, 'skip', '中身のある同名フォルダが複数あります（「重複を比べて削除」で整理してください）')));
      }
    });
  });
  // 入れ子：X の中身が「X と同じ名前のフォルダ 1 つだけ」なら、中身を 1 つ上へ出して入れ子をなくす
  //   例：FC2-PPV-123/FC2-PPV-123/FC2-PPV-123.mp4 → FC2-PPV-123/FC2-PPV-123.mp4
  //   複数の作品が入ったフォルダ（オムニバスなど）は対象外
  const junkDel = opts.junk ? (prepJunk(files, folders), (f) => { const j = junkInfo(f); return !!j && j.level === 'del'; }) : () => false;
  const dKids = sib(folders.filter((f) => !f.isRoot)), fKids = sib(files);
  folders.forEach((P) => {
    if (P.isRoot || P.parentId === 'root' || P.parentId === '') return;
    const cd = dKids.get(P.id) || [], cf = (fKids.get(P.id) || []).filter((f) => !junkDel(f));
    if (cd.length !== 1 || cf.length) return;
    const C = cd[0];
    if (baseName(C.name).toLowerCase() !== baseName(P.name).toLowerCase()) return;
    plan.push(item('flatten', 'folder', C, P.id, P.name, 'todo', '同じ名前のフォルダが入れ子になっているため、中身を 1 つ上の「' + P.name + '」へ出して、空になったフォルダを片付けます'));
  });
  // ファイル：同じ場所に元の名前が無ければ (n) を外す
  sib(files).forEach((list, pid) => {
    const taken = new Set(list.map((x) => x.name.toLowerCase()));
    list.map((x) => ({ x, m: x.name.match(PAREN_FILE) })).filter((o) => o.m)
      .sort((a, b) => (+a.m[2] - +b.m[2]) || a.x.name.localeCompare(b.x.name))
      .forEach(({ x, m }) => {
        const to = m[1] + m[3];
        if (taken.has(to.toLowerCase())) { plan.push(item('rename', 'file', x, pid, to, 'skip', '同じ場所に「' + to + '」が残っています（「重複を比べて削除」で整理してください）')); return; }
        taken.delete(x.name.toLowerCase()); taken.add(to.toLowerCase());
        plan.push(item('rename', 'file', x, pid, to, 'todo', ''));
      });
  });
  // 空フォルダの片付け → 入れ子の解消（深い階層から） → 名前の変更 の順に実行する
  const ORDER = { trash: 0, flatten: 1, rename: 2 };
  return plan.sort((a, b) => (ORDER[a.op] - ORDER[b.op]) || (a.op === 'flatten' ? (b.ptrail || []).length - (a.ptrail || []).length : 0));
}
