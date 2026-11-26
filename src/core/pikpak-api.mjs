// PikPak とのやり取り（通信そのもの）。画面の変数には頼らず、使う道具はすべて外から受け取る
//   fetch   … 通信（ブラウザではページ上の fetch。Tampermonkey の通信だと PikPak に拒否されるため）
//   storage … PikPak の画面が保存したログイン情報・確認用トークンの元（ブラウザでは localStorage）
//   log     … ログに残す（level, msg, ctx）
//   sleep   … 待つ（試験では待たない）
//   now     … いまの時刻（試験では決まった時刻）
//   試験：tests/unit/pikpak-api.test.mjs
export function createPikPakApi({ fetch, storage, log = () => {}, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), now = () => Date.now() }) {
  const API = 'https://api-drive.mypikpak.com/drive/v1';
  // ログイン情報（PikPak画面が保存しているもの）。有効期限は約2時間で、PikPak画面が動いている間だけ更新される
  // ---- ログイン情報 ----
  // PikPak の画面が実際に送っている Authorization・x-captcha-token を横から覚えておく（PikPak は新しいログイン情報を
  // ブラウザの保存領域に書き戻さないことがあるため、保存領域の「有効期限」だけを見ると、何度読み込み直しても切れたままに見える）
  const cap = { auth: '', authAt: 0, captcha: '', captchaAt: 0 };
  let ownCall = false; // 自分の通信は覚えない
  const noteHeader = (k, v) => {
    if (ownCall) return;
    k = String(k || '').toLowerCase(); v = String(v || '');
    if (k === 'authorization' && /^Bearer\s+\S{20,}/i.test(v) && v !== cap.auth) { cap.auth = v; cap.authAt = now(); }
    else if (k === 'x-captcha-token' && v.length > 20) { cap.captcha = v; cap.captchaAt = now(); }
  };
  // アクセストークン（JWT）の中の有効期限
  const jwtExp = (tok) => { try { const p = String(tok).replace(/^Bearer\s+/i, '').split('.')[1]; const j = JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/'))); return j && j.exp ? j.exp * 1000 : 0; } catch (e) { return 0; } };
  function readCred() {
    const list = [];
    if (cap.auth) list.push({ auth: cap.auth, expiresAt: jwtExp(cap.auth), at: cap.authAt, from: 'page' });
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (!k || !k.startsWith('credentials')) continue;
      try {
        const v = JSON.parse(storage.getItem(k));
        if (v && v.access_token) { const auth = (v.token_type || 'Bearer') + ' ' + v.access_token; list.push({ auth, expiresAt: jwtExp(auth) || (v.expires_at ? Date.parse(v.expires_at) : 0), at: 0, from: 'storage' }); }
      } catch (e) { /* 次へ */ }
    }
    if (!list.length) return null;
    // 切れていないもの → 画面が最近使ったもの → 期限が先のもの の順に選ぶ
    const t = now(), dead = (x) => (x.expiresAt && x.expiresAt <= t ? 1 : 0);
    list.sort((a, b) => dead(a) - dead(b) || b.at - a.at || (b.expiresAt || 0) - (a.expiresAt || 0));
    return list[0];
  }
  // PikPak画面はログイン情報を「期限が切れてから」更新するため、期限前に切れた扱いにすると再読み込みしても更新されない。
  // そのため余裕は30秒だけにして、期限ぎりぎりまで使う
  const SESSION_MARGIN = 30 * 1000;
  const sessionValid = () => { const c = readCred(); return !!c && (!c.expiresAt || c.expiresAt - now() > SESSION_MARGIN); };
  const sessionError = (msg) => { const e = new Error(msg); e.session = true; return e; };
  function apiHeaders() {
    const c = readCred();
    if (!c) throw sessionError('ログイン情報を取得できません');
    // 期限が切れて見えても送ってみる（PikPak 側で更新済みのことがある。切れていれば 401 が返り、api() が新しいログイン情報を待って再試行する）
    const h = { 'Content-Type': 'application/json', Authorization: c.auth, 'x-device-id': storage.getItem('deviceid') || '' };
    if (cap.captcha) h['x-captcha-token'] = cap.captcha;
    return h;
  }
  // 通信はPikPakの画面と同じ方法（ページ上の fetch）で行う。
  // ※ Tampermonkey の GM_xmlhttpRequest 経由だと、PikPak側で「認証コードが無効です」と拒否されるため使わない
  const http = (url, opt) => { ownCall = true; try { return fetch(url, opt); } finally { ownCall = false; } };
  // 操作ごとの確認用トークン（captcha）。PikPak の画面が保存した meta（署名つき）を使って、その操作用のものをもらう。
  // クラウドダウンロードの追加などは、これがないと拒否される
  const capCache = new Map();
  async function getCaptcha(action, fresh) {
    const c = capCache.get(action);
    if (!fresh && c && c.until > now()) return c.token;
    let key = '', rec = null;
    for (let i = 0; i < storage.length; i++) { const k = storage.key(i); if (k && k.startsWith('captcha_')) { try { const v = JSON.parse(storage.getItem(k)); if (v && v.meta) { key = k; rec = v; break; } } catch (e) { /* 次へ */ } } }
    if (!rec) return cap.captcha || '';
    const dev = storage.getItem('deviceid') || '';
    const body = { client_id: key.slice('captcha_'.length), action, device_id: dev, meta: rec.meta };
    ownCall = true;
    let r; try { r = fetch('https://user.mypikpak.com/v1/shield/captcha/init', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-device-id': dev }, body: JSON.stringify(body) }); } finally { ownCall = false; }
    const res = await r; const d = await res.json().catch(() => ({}));
    if (!res.ok || !d.captcha_token) { log('warn', '確認用トークンを取得できませんでした：' + (d.error_description || d.error || res.status), action); return cap.captcha || ''; }
    capCache.set(action, { token: d.captcha_token, until: now() + Math.max(30, (+d.expires_in || 300) - 30) * 1000 });
    return d.captcha_token;
  }
  let apiBusyHits = 0; // PikPak から「混んでいる（429）」と返された回数（読み込みの同時数を減らす目安）
  async function api(path, opt = {}) {
    for (let tries = 0; ; tries++) {
      let res;
      try {
        const hd = apiHeaders();
        if (opt.captcha) { const ct = await getCaptcha(opt.captcha, tries > 0); if (ct) hd['x-captcha-token'] = ct; }
        if (opt._nocap) delete hd['x-captcha-token'];
        const { captcha: _c, raw: _r, _cap: _k, _nocap: _n, probe: _p, ...o2 } = opt;
        res = await http(/^https?:/.test(path) ? path : API + path, { ...o2, headers: hd });
      }
      catch (e) {
        if (e.session) throw e;
        if (tries < 2) { await sleep(1500); continue; }
        log('warn', e.message + '（ログイン切れとして再読み込みで回復します）', (opt.method || 'GET') + ' ' + path.split('?')[0]);
        // 長時間放置後は通信自体が失敗することがあるため、ログイン切れとして扱い再読み込みで回復させる
        throw sessionError(e.message === 'Failed to fetch' ? 'PikPakのサーバーに接続できませんでした' : e.message);
      }
      if (res.status === 429) apiBusyHits++;
      if ((res.status === 429 || res.status >= 500) && tries < 5) { await sleep(1500 * (tries + 1)); continue; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok && opt.captcha && /captcha/i.test(String(data.error || '')) && tries < 2) continue; // 確認用トークンを取り直してやり直す
      if (!res.ok) {
        const msg = data.error_description || data.error || 'API ' + res.status;
        const where = (opt.method || 'GET') + ' ' + path.split('?')[0] + ' → HTTP ' + res.status;
        // ログイン切れ・認証コードの期限切れは、画面の再読み込みで自動回復するため warn として記録する
        if ((res.status === 401 || /unauthenticated|token/i.test(String(data.error || ''))) && tries < 3) {
          // PikPak の画面が新しいログイン情報で通信するまで少し待って、やり直す
          const used = (readCred() || {}).auth, t0 = now();
          while (now() - t0 < 8000 && (readCred() || {}).auth === used) await sleep(500);
          if ((readCred() || {}).auth !== used) { tries = Math.max(tries, 2); continue; }
        }
        if (opt.raw && res.status !== 401 && !/captcha/i.test(String(data.error || ''))) return { ok: false, status: res.status, data };
        if (res.status === 401 || /unauthenticated|token/i.test(String(data.error || ''))) { log('warn', msg + '（自動で回復します）', where); throw sessionError('ログインの有効期限が切れています'); }
        if (/captcha/i.test(String(data.error || '')) || /認証コード/.test(msg)) {
          // 画面から借りた確認用トークンが古くなっただけのことが多い。まず付けずに、次に取り直して試し、それでもだめなら再読み込み
          if (!opt._cap) { cap.captcha = ''; opt = { ...opt, _cap: 1, _nocap: true }; continue; }
          if (opt._cap === 1 && !opt.captcha) { opt = { ...opt, _cap: 2, _nocap: false, captcha: (opt.method || 'GET') + ':/drive/v1' + path.split('?')[0].replace(/^https?:\/\/[^/]+\/drive\/v1/, '') }; continue; }
          // 存在を確かめるだけの通信（probe）では、削除済みのファイル・フォルダにもこの返事が来るため「見つからない」として返す
          if (opt.probe) { const pe = new Error(msg); pe.captcha = true; pe.status = res.status; pe.where = where; throw pe; }
          log('warn', msg + '（自動で回復します）', where); throw sessionError('認証の確認が必要です（' + msg + '）');
        }
        // 404：ファイル・フォルダがもうない（削除済み）。呼び出し側で「削除済み」と分かるように印を付ける
        if (res.status === 404) { const ge = new Error(msg); ge.status = 404; ge.gone = true; ge.where = where; throw ge; }
        log('error', msg, where);
        const e2 = new Error(msg); e2.status = res.status; throw e2;
      }
      return opt.raw ? { ok: true, status: res.status, data } : data;
    }
  }
  const apiPid = (id) => (!id || id === 'root' ? '' : id);
  // ファイル一覧を最後のページまで読む（pid：'*' で全体、max：読むページ数の上限）
  async function apiListAll(pid, filter, max = Infinity, opt = {}) {
    const out = []; let token = '', n = 0; const fl = encodeURIComponent(JSON.stringify(filter));
    do {
      const d = await api(`/files?thumbnail_size=SIZE_MEDIUM&limit=500&parent_id=${pid}&filters=${fl}${token ? '&page_token=' + encodeURIComponent(token) : ''}`, opt);
      (d.files || []).forEach((f) => out.push(f));
      token = d.next_page_token || '';
    } while (token && ++n < max);
    return out;
  }
  const apiList = (pid) => apiListAll(apiPid(pid), { phase: { eq: 'PHASE_TYPE_COMPLETE' }, trashed: { eq: false } });

  return {
    API, cap, noteHeader, readCred, sessionValid, sessionError, getCaptcha, api, apiPid, apiListAll, apiList,
    busyHits: () => apiBusyHits, // PikPak から「混んでいる（429）」と返された回数
  };
}
