  // ---------- スマホ（案 A）：縦向きのときは横向きをすすめる。横向きは左のメニューを文字なしにして詰める ----------
  const SS_ROTATE = 'ppdup:rotate-ok';
  const isPhone = () => { try { return matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 600; } catch (e) { return false; } };
  function checkRotate() {
    const old = root.querySelector('.pd-rotate');
    let ok = false; try { ok = sessionStorage.getItem(SS_ROTATE) === '1'; } catch (e) { /* 無視 */ }
    const portrait = isPhone() && innerHeight > innerWidth;
    root.classList.toggle('phone', isPhone());
    if (!portrait || ok || !root.classList.contains('on')) { if (old) old.remove(); return; }
    if (old) return;
    root.insertAdjacentHTML('beforeend', '<div class="pd-rotate"><div class="box"><div class="ic">⟲</div><b>横向きにすると見やすくなります</b><small>Dedupe は一覧や比べる画面が横に広いので、スマホは横向きがおすすめです</small><button data-a="rotateok">このまま使う</button></div></div>');
    if (LANG === 'en') root.querySelectorAll('.pd-rotate *').forEach(trNode);
  }
  window.addEventListener('resize', checkRotate);
  window.addEventListener('orientationchange', () => setTimeout(checkRotate, 300));
  root.addEventListener('click', (e) => { if (e.target.closest('[data-a=rotateok]')) { try { sessionStorage.setItem(SS_ROTATE, '1'); } catch (err) { /* 無視 */ } checkRotate(); } });
