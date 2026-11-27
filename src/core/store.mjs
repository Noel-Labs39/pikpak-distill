// 大きい記録の置き場所（IndexedDB）。読み込み結果・作品の情報・販売者の記録・再生の記録・ログなど
//   localStorage は約 5MB までで PikPak 自身の保存分と共有のため、大きくなる記録だけをこちらへ移す
//   ・起動時に全部をメモリへ読み、あとはすぐに読み書きできる（get / set は待たない）
//   ・書き込みは少しまとめてから IndexedDB へ送る（続けて変わったときに何度も書かない）
//   ・初回は localStorage にある記録を写し、写せたのを確かめてから localStorage 側を消す
//   ・IndexedDB が使えないとき（プライベートウィンドウなど）は、今までどおり localStorage を使う
//   値はすべて文字列（JSON）で扱う。localStorage と同じ形
//   試験：tests/unit/store.test.mjs
const DB = 'ppdup-store', ST = 'kv';

export function createBigStore({ keys, idb = globalThis.indexedDB, ls = globalThis.localStorage, log = () => {}, delay = 300, setTimer = (f, ms) => setTimeout(f, ms) }) {
  const BIG = new Set(keys);
  const cache = new Map(), dirty = new Set();
  let db = null, mode = 'ls', timer = 0, warned = false, flushing = Promise.resolve();
  const lsGet = (k) => { try { return ls.getItem(k); } catch (e) { return null; } };
  const lsDel = (k) => { try { ls.removeItem(k); } catch (e) { /* 無視 */ } };
  const req = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const done = (tx) => new Promise((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error || new Error('abort')); });

  async function ready() {
    try {
      if (!idb) throw new Error('IndexedDB がありません');
      db = await new Promise((res, rej) => {
        const r = idb.open(DB, 1);
        r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(ST)) r.result.createObjectStore(ST); };
        r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); r.onblocked = () => rej(new Error('blocked'));
      });
      const tx = db.transaction(ST, 'readonly'), os = tx.objectStore(ST);
      await Promise.all([...BIG].map(async (k) => { const v = await req(os.get(k)); if (typeof v === 'string') cache.set(k, v); }));
      mode = 'idb';
    } catch (e) {
      db = null; mode = 'ls';
      log('warn', `大きい記録の置き場所（IndexedDB）が使えないため、今までどおりブラウザの保存領域を使います（${(e && e.message) || e}）`);
      return mode;
    }
    // 初回（と、古い版で使ったあと）：localStorage にあるものを写す（localStorage 側が新しい）
    const move = [...BIG].filter((k) => lsGet(k) != null);
    if (move.length) {
      move.forEach((k) => cache.set(k, lsGet(k)));
      try {
        const tx = db.transaction(ST, 'readwrite'), os = tx.objectStore(ST);
        move.forEach((k) => os.put(cache.get(k), k));
        await done(tx);
        // 写せたのを確かめてから消す
        const tx2 = db.transaction(ST, 'readonly'), os2 = tx2.objectStore(ST);
        const back = await Promise.all(move.map((k) => req(os2.get(k))));
        let n = 0; move.forEach((k, i) => { if (back[i] === cache.get(k)) { lsDel(k); n++; } });
        log('info', `大きい記録を IndexedDB へ移しました（${n} 件・ブラウザの保存領域を空けました）`);
      } catch (e) { log('warn', `大きい記録を IndexedDB へ移せませんでした（次に開いたときにやり直します）：${(e && e.message) || e}`); }
    }
    return mode;
  }

  async function flush() {
    if (mode !== 'idb' || !dirty.size) return;
    clearTimeout(timer); timer = 0;
    const ks = [...dirty]; dirty.clear();
    flushing = flushing.then(async () => {
      try {
        const tx = db.transaction(ST, 'readwrite'), os = tx.objectStore(ST);
        ks.forEach((k) => (cache.has(k) ? os.put(cache.get(k), k) : os.delete(k)));
        await done(tx);
      } catch (e) {
        ks.forEach((k) => dirty.add(k)); // 次の書き込みでやり直す
        if (!warned) { warned = true; log('error', `記録を保存できませんでした（IndexedDB）：${(e && e.message) || e}`); }
      }
    });
    return flushing;
  }
  const later = () => { if (!timer) timer = setTimer(() => { timer = 0; flush(); }, delay); };

  return {
    keys: BIG,
    ready,
    flush,
    mode: () => mode,
    has: (k) => BIG.has(k) && mode === 'idb',
    get: (k) => (cache.has(k) ? cache.get(k) : null),
    set: (k, v) => { cache.set(k, String(v)); dirty.add(k); later(); return true; },
    del: (k) => { cache.delete(k); dirty.add(k); later(); },
  };
}
