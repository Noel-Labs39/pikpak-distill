// PikPak とのやり取り（src/core/pikpak-api.mjs）の試験。本物の PikPak は使わず、模擬の返事で決まりを確かめる
//   実行：npm run test:unit
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPikPakApi } from '../../src/core/pikpak-api.mjs';

// 見本のアクセストークン（JWT の形。exp は秒）
const jwt = (exp, tag = 'a') => 'Bearer x.' + Buffer.from(JSON.stringify({ exp, tag })).toString('base64').replace(/=+$/, '') + '.' + 'y'.repeat(30);
const T0 = 1_800_000_000_000;
// localStorage の代わり
function store(init = {}) {
  const m = new Map(Object.entries(init).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]));
  return { get length() { return m.size; }, key: (i) => [...m.keys()][i] ?? null, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}
const cred = (exp) => ({ access_token: jwt(exp).slice('Bearer '.length), token_type: 'Bearer' });
// 返事を順に返す fetch。呼ばれた内容は calls に残す
function fakeFetch(replies) {
  const calls = [];
  const f = async (url, opt = {}) => {
    calls.push({ url, opt });
    const r = typeof replies === 'function' ? replies(url, opt, calls.length) : replies.shift();
    if (!r) throw new Error('返事が足りません：' + url);
    if (r.throw) throw new Error(r.throw);
    return { ok: r.status < 400, status: r.status, json: async () => r.body || {} };
  };
  f.calls = calls;
  return f;
}
function make(replies, storeInit, extra = {}) {
  let t = T0;
  const logs = [];
  const fetch = fakeFetch(replies);
  const storage = store(storeInit ?? { credentials_x: cred(T0 / 1000 + 3600), deviceid: 'dev1' });
  const pp = createPikPakApi({ fetch, storage, log: (lv, msg, ctx) => logs.push([lv, msg, ctx]), sleep: async (ms) => { t += ms; }, now: () => t, ...extra });
  return { pp, fetch, storage, logs };
}

test('ふつうの通信：ログイン情報と端末の番号を付けて送り、中身を返す', async () => {
  const { pp, fetch } = make([{ status: 200, body: { id: 'f1' } }]);
  assert.deepEqual(await pp.api('/files/f1'), { id: 'f1' });
  assert.equal(fetch.calls[0].url, pp.API + '/files/f1');
  assert.match(fetch.calls[0].opt.headers.Authorization, /^Bearer /);
  assert.equal(fetch.calls[0].opt.headers['x-device-id'], 'dev1');
});

test('混雑（429）：待ってやり直し、回数を数える', async () => {
  const { pp, fetch } = make([{ status: 429 }, { status: 429 }, { status: 200, body: { ok: 1 } }]);
  assert.deepEqual(await pp.api('/about'), { ok: 1 });
  assert.equal(fetch.calls.length, 3);
  assert.equal(pp.busyHits(), 2);
});

test('サーバーの不調（500 番台）が続けば、6 回目であきらめてエラー', async () => {
  const { pp, fetch } = make(() => ({ status: 503, body: { error: 'busy' } }));
  await assert.rejects(pp.api('/about'), (e) => e.status === 503);
  assert.equal(fetch.calls.length, 6);
});

test('ログイン切れ（401）：PikPak の画面が新しいログイン情報で通信したら、それでやり直す', async () => {
  let pp, t = T0;
  const fetch = fakeFetch((url, opt, n) => (n === 1 ? { status: 401, body: { error: 'unauthenticated' } } : { status: 200, body: { ok: 1 } }));
  // 待っている間に、PikPak の画面が新しいログイン情報で通信する
  pp = createPikPakApi({ fetch, storage: store({ credentials_x: cred(T0 / 1000 + 3600) }), sleep: async (ms) => { t += ms; pp.noteHeader('Authorization', jwt(T0 / 1000 + 7200, 'new')); }, now: () => t });
  assert.deepEqual(await pp.api('/about'), { ok: 1 });
  assert.notEqual(fetch.calls[0].opt.headers.Authorization, fetch.calls[1].opt.headers.Authorization);
});

test('ログイン切れ（401）が続けば、ログイン切れのエラー（画面の再読み込みで回復する印）', async () => {
  const { pp, logs } = make(() => ({ status: 401, body: { error: 'unauthenticated' } }));
  await assert.rejects(pp.api('/about'), (e) => e.session === true);
  assert.ok(logs.some(([lv]) => lv === 'warn'));
});

test('「認証コードが無効です」：まず確認用トークンを付けずに、次に取り直してやり直す', async () => {
  const { pp, fetch } = make((url, opt, n) => {
    if (url.includes('/shield/captcha/init')) return { status: 200, body: { captcha_token: 'fresh-token-0123456789', expires_in: 300 } };
    if (n === 1) return { status: 400, body: { error: 'captcha_invalid', error_description: '認証コードが無効です' } };
    if (n === 2) return { status: 400, body: { error: 'captcha_invalid', error_description: '認証コードが無効です' } };
    return { status: 200, body: { ok: 1 } };
  }, { credentials_x: cred(T0 / 1000 + 3600), deviceid: 'dev1', captcha_client1: { meta: { m: 1 } } });
  pp.noteHeader('x-captcha-token', 'page-token-0123456789-abc');
  assert.deepEqual(await pp.api('/files/f1'), { ok: 1 });
  const sent = fetch.calls.filter((c) => !c.url.includes('/shield/')).map((c) => c.opt.headers['x-captcha-token'] || '');
  assert.deepEqual(sent, ['page-token-0123456789-abc', '', 'fresh-token-0123456789']);
});

test('「認証コードが無効です」が続けば、ログイン切れのエラー', async () => {
  const { pp } = make(() => ({ status: 400, body: { error: 'captcha_invalid', error_description: '認証コードが無効です' } }));
  await assert.rejects(pp.api('/files/f1'), (e) => e.session === true);
});

test('存在の確認（probe）では、「認証コードが無効です」を「見つからない」として返す（削除済みのフォルダ）', async () => {
  const { pp } = make(() => ({ status: 400, body: { error: 'captcha_invalid', error_description: '認証コードが無効です' } }));
  await assert.rejects(pp.api('/files/gone', { raw: true, probe: true }), (e) => e.captcha === true && !e.session);
});

test('1 件取り（gone）では、「認証コードが無効です」を削除済みとして返す（ログイン切れにしない）', async () => {
  const { pp } = make(() => ({ status: 400, body: { error: 'captcha_invalid', error_description: '認証コードが無効です' } }));
  await assert.rejects(pp.api('/files/gone', { gone: true }), (e) => e.gone === true && e.captcha === true && !e.session);
});

test('削除済み（404）：削除済みの印を付けたエラー', async () => {
  const { pp } = make([{ status: 404, body: { error: 'file_not_found' } }]);
  await assert.rejects(pp.api('/files/f1'), (e) => e.gone === true && e.status === 404);
});

test('raw：403 などは投げずに中身を返す', async () => {
  const { pp } = make([{ status: 403, body: { error: 'forbidden' } }]);
  assert.deepEqual(await pp.api('/files/f1', { raw: true }), { ok: false, status: 403, data: { error: 'forbidden' } });
});

test('通信そのものの失敗：2 回までやり直し、だめならログイン切れとして回復させる', async () => {
  const { pp, fetch } = make(() => ({ throw: 'Failed to fetch' }));
  await assert.rejects(pp.api('/about'), (e) => e.session === true && /接続できません/.test(e.message));
  assert.equal(fetch.calls.length, 3);
});

test('ログイン情報がなければ、通信せずにログイン切れのエラー', async () => {
  const { pp, fetch } = make([], {});
  assert.equal(pp.sessionValid(), false);
  await assert.rejects(pp.api('/about'), (e) => e.session === true);
  assert.equal(fetch.calls.length, 0);
});

test('ログイン情報の選び方：切れていないもの → 画面が最近使ったもの', () => {
  const { pp } = make([], { credentials_old: cred(T0 / 1000 - 10), credentials_new: cred(T0 / 1000 + 3600) });
  assert.equal(pp.readCred().from, 'storage');
  assert.ok(pp.readCred().expiresAt > T0);
  pp.noteHeader('Authorization', jwt(T0 / 1000 + 600, 'page'));
  assert.equal(pp.readCred().from, 'page');
  assert.equal(pp.sessionValid(), true);
});

test('自分の通信のヘッダーは覚えない（PikPak の画面の通信だけを覚える）', async () => {
  let pp;
  const { pp: p } = make(() => { pp.noteHeader('Authorization', jwt(T0 / 1000 + 9999, 'mine')); return { status: 200, body: {} }; });
  pp = p;
  await pp.api('/about');
  assert.equal(pp.cap.auth, '');
});

test('一覧：ページの終わりまで読む・ホームは parent_id を空にする', async () => {
  const { pp, fetch } = make([{ status: 200, body: { files: [{ id: 'a' }], next_page_token: 'p2' } }, { status: 200, body: { files: [{ id: 'b' }] } }]);
  const list = await pp.apiList('root');
  assert.deepEqual(list.map((f) => f.id), ['a', 'b']);
  assert.match(fetch.calls[0].url, /parent_id=&/);
  assert.match(fetch.calls[1].url, /page_token=p2/);
});
