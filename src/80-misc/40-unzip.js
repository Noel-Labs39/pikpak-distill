  // ---------- 一括解凍（PikPak のサーバー側で解凍する。成功したパスワードを記録して次から自動で試す） ----------
  const LS_UNZIPPW = 'ppdup:unzippw:v1';
  const DEC = 'https://api-drive.mypikpak.com/decompress/v1';
  const isArchive = (name) => { const n = String(name || '').toLowerCase(); if (/\.part0*([2-9]|\d{2,})\.rar$/.test(n)) return false; return /\.(zip|rar|7z)$/.test(n) || /\.(7z|zip)\.0*1$/.test(n); };
