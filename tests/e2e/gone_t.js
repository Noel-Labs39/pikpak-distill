// 削除済みのファイルを 1 件取りに行ったとき（PikPak は「認証コードが無効です」を返す）
//   ・ログイン切れとして画面を再読み込みしない
//   ・同じ id は 2 回目から取りに行かない
//   ・重複の画面（中身の手がかりを取りに行く）でも再読み込みしない
const open = require('./h.js');
(async () => {
  const t = new Date().toISOString();
  const tree = { '': [
    { id: 'g1', name: 'FC2-PPV-1234567.mp4', kind: 'drive#file', size: '1000000000', created_time: t },
    { id: 'g2', name: 'FC2-PPV-1234567 (1).mp4', kind: 'drive#file', size: '1000000000', created_time: t },
  ] };
  const { b, p, SP } = await open(tree, 'https://mypikpak.com/drive/all');
  // 読み込みのあとで g1 を「削除済み」にする（1 件取りに captcha_invalid を返す）
  await p.evaluate(() => {
    window.__alive = 1; window.__goneHits = 0;
    const f0 = window.fetch;
    window.fetch = async (u0, o) => {
      const u = new URL(String(u0), location.href);
      if (/\/files\/g1$/.test(u.pathname)) {
        window.__goneHits++;
        const body = { error: 'captcha_invalid', error_description: '認証コードが無効です' };
        return { ok: false, status: 400, json: async () => body, text: async () => JSON.stringify(body) };
      }
      return f0(u0, o);
    };
  });
  const r1 = await p.evaluate(() => PPDup.apiGet('g1').then(() => 'ok', (e) => (e.gone ? 'gone' : e.session ? 'session' : 'other:' + e.message)));
  console.log(r1 === 'gone' ? 'OK' : 'NG', '削除済みは「見つかりません」になる（ログイン切れにしない）', r1);
  const hits1 = await p.evaluate(() => window.__goneHits);
  const r2 = await p.evaluate(() => PPDup.apiGet('g1').then(() => 'ok', (e) => (e.gone ? 'gone' : 'other')));
  const hits2 = await p.evaluate(() => window.__goneHits);
  console.log(r2 === 'gone' && hits2 === hits1 ? 'OK' : 'NG', '同じ id は 2 回目から取りに行かない', hits1, hits2);
  const ok = await p.evaluate(() => PPDup.apiGet('g2').then((f) => f.id, (e) => 'err:' + e.message));
  console.log(ok === 'g2' ? 'OK' : 'NG', 'ほかのファイルはふつうに取れる', ok);
  // 重複の画面を開く（中身の手がかりを取りに行く）
  await p.evaluate(() => { location.hash = 'dd/dup'; }); await p.waitForTimeout(2500);
  const alive = await p.evaluate(() => window.__alive === 1 && !sessionStorage.getItem('ppdup:resume:v1'));
  console.log(alive ? 'OK' : 'NG', '重複の画面でも画面の再読み込みが起きない');
  const log = await p.evaluate(() => PPDup.lsGet('ppdup:log:v1') || '');
  console.log(!/ログイン期限切れのため画面を再読み込み/.test(log) && /PikPak にないファイル・フォルダを飛ばしました/.test(log) ? 'OK' : 'NG', 'ログ：再読み込みなし・飛ばした記録が 1 行');
  await p.screenshot({ path: SP + 'gone_dup.png' });
  await b.close();
})();
