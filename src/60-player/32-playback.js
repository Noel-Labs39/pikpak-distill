  // ---------- 再生の強化（倍速・シークバーのサムネイル）とコマ一覧 ----------
  const LS_RATE = 'ppdup:rate:v1', LS_FRAMES = 'ppdup:frames:v1';
  const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
  const getRate = () => { let r = +lsGet(LS_RATE) || 1; return r >= 0.25 && r <= 3 ? r : 1; };
  function setRate(r) {
    r = Math.round(Math.max(0.25, Math.min(3, r)) * 100) / 100;
    lsSet(LS_RATE, String(r));
    document.querySelectorAll('.qp-stage video, #pd-ql video, #pd-player video').forEach((v) => { v.defaultPlaybackRate = r; v.playbackRate = r; }); // 開いているすべての簡易プレーヤーに、その場で効かせる
    document.querySelectorAll('[data-rate]').forEach((s) => { if (![...s.options].some((o) => +o.value === r)) s.insertAdjacentHTML('beforeend', `<option value="${r}">${r}×</option>`); s.value = String(r); });
    return r;
  }
  const rateSelect = () => `<select data-rate title="再生速度（[ ] で 0.25 ずつ、\\ で 1 倍）">${[...new Set([...RATES, getRate()])].sort((a, b) => a - b).map((r) => `<option value="${r}"${r === getRate() ? ' selected' : ''}>${r}×</option>`).join('')}</select>`;
  document.addEventListener('change', (e) => { if (e.target.matches && e.target.matches('select[data-rate]')) setRate(+e.target.value); }, true);
  // 影の video：見えないところでシークして、その位置の画面をキャンバスに描く（コマ一覧・シークバーのサムネイル）
  function makeGrabber(x, S) {
    const v = document.createElement('video');
    v.muted = true; v.crossOrigin = 'anonymous'; v.preload = 'auto'; v.playsInline = true;
    v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
    // Safari（特に iPhone・iPad）は画面に置いていない動画を読み込まないことがあるため、見えない場所に置く
    v.style.cssText = 'position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0;pointer-events:none';
    document.body.appendChild(v);
    let hls = null, closed = false;
    const ready = new Promise((res, rej) => {
      const to = setTimeout(() => rej(new Error('動画の読み込みが時間切れになりました')), 25000);
      v.addEventListener('loadedmetadata', () => { clearTimeout(to); res(); }, { once: true });
      v.addEventListener('error', () => { clearTimeout(to); rej(new Error('動画を読み込めませんでした')); }, { once: true });
      if (x.hls && S.H && S.H.isSupported()) {
        hls = new S.H({ maxBufferLength: 4, maxMaxBufferLength: 8, enableWorker: true, startLevel: 0, capLevelToPlayerSize: false });
        hls.on(S.H.Events.ERROR, (ev, d) => { if (d && d.fatal) { clearTimeout(to); rej(new Error(d.details || 'HLS の読み込みに失敗しました')); } });
        (async () => {
          let u = x.url;
          if (x.tsdl) { try { const r = await fetch(x.url, { cache: 'no-store', credentials: 'omit' }); if (r.ok) { const txt = fixTsM3u8(await r.text()); if (txt.includes('#EXTM3U')) u = URL.createObjectURL(new Blob([txt], { type: 'application/vnd.apple.mpegurl' })); } } catch (e) { /* そのまま読む */ } }
          if (!closed) { hls.loadSource(u); hls.attachMedia(v); }
        })();
      } else { v.src = x.url; try { v.load(); } catch (e) { /* 無視 */ } }
    });
    ready.catch(() => {});
    let q = Promise.resolve();
    const grab = (t, w = 320) => {
      const p = q.catch(() => {}).then(() => ready).then(() => new Promise((res, rej) => {
        if (closed) { rej(new Error('closed')); return; }
        const to = setTimeout(() => { v.removeEventListener('seeked', done); rej(new Error('コマの取得が時間切れになりました')); }, 10000);
        // Safari（拡張機能・アプリ版）は、移動した直後だとまだ絵が出ておらず真っ黒に描かれることがあるため、
        // 次のコマが表示されるのを待ち、真っ黒なら少し再生してから描き直す（3 回まで）
        const draw = () => {
          const h = Math.round(w * (v.videoHeight || 9) / (v.videoWidth || 16));
          const c = document.createElement('canvas'); c.width = w; c.height = h;
          const g = c.getContext('2d'); g.drawImage(v, 0, 0, w, h);
          const px = g.getImageData(0, 0, w, h).data; // 別のサイトの動画で描けないときはここで止まる
          let sum = 0, n = 0; for (let i = 0; i < px.length; i += 4 * 97) { sum += px[i] + px[i + 1] + px[i + 2]; n++; }
          return { c, dark: n > 0 && sum / n < 6 };
        };
        const nextFrame = (ms) => new Promise((r) => { const t2 = setTimeout(r, ms); if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(() => { clearTimeout(t2); r(); }); });
        async function done() {
          try {
            await nextFrame(400);
            let out = draw();
            for (let k = 0; out.dark && k < 3 && !closed; k++) {
              try { await Promise.race([v.play(), sleep(1200)]); } catch (e) { /* 無視 */ } // iPhone では play() が返ってこないことがある
              await nextFrame(600); await sleep(120);
              try { v.pause(); } catch (e) { /* 無視 */ }
              out = draw();
            }
            clearTimeout(to); res(out.c);
          } catch (e) { clearTimeout(to); rej(new Error('この動画はブラウザの制限でコマを作れません')); }
        }
        v.addEventListener('seeked', done, { once: true });
        v.currentTime = Math.max(0, Math.min(t, (v.duration || t + 1) - 0.2));
      }));
      q = p; return p;
    };
    return { ready, grab, v, get duration() { return v.duration || 0; }, close() { closed = true; killHls(hls); try { v.removeAttribute('src'); v.load(); } catch (e) { /* 無視 */ } v.remove(); } };
  }
  // コマを作るときは軽い画質（変換画質の低いもの）を使う
  // iPhone など hls.js が使えない環境では、HLS の動画を絵として取り出せない（真っ黒・止まる）ため、オリジナル画質（MP4）を使う
  const lightSrc = (S) => { if (!(S.H && S.H.isSupported && S.H.isSupported())) { const o = S.src.find((x) => !x.hls && !x.dl) || S.src.find((x) => !x.hls); if (o) return o; } const c = S.src.filter((x) => !x.dl && S.playable(x)); return c.filter((x) => !x.origin && x.h).sort((a, b) => a.h - b.h)[0] || c[c.length - 1] || S.src[S.first]; };
