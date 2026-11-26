  // ---------- 作品と関係ないファイル（広告・宣伝／10MB以下 など）の判定 ----------
  // 読み込んだファイルのうち作品と関係ないものを見分け、ほかのステップの対象から外す
  //   del    … 作品と関係ないと判断（最初からチェックあり）
  //   review … 作品の可能性があるので確認してほしいもの（最初はチェックなし）
  const JUNK_MAX = 10 * UNIT.MB;
  const AD_VIDEO_MAX = 50 * UNIT.MB; // 作品フォルダに紛れた品番のない動画は、これより小さければ広告とみなす
  const SPREAD_MAX = 200 * UNIT.MB;
  const AD_EXT = new Set(['url', 'lnk', 'webloc', 'txt', 'htm', 'html', 'mht', 'mhtml', 'chm', 'exe', 'apk', 'bat', 'cmd', 'scr', 'vbs', 'torrent']);
  const SUB_EXT = new Set(['srt', 'ass', 'ssa', 'vtt', 'sub', 'idx', 'smi']);
  const AD_WORD = /广告|廣告|広告|宣传|宣傳|宣伝|推广|推廣|地址|網址|网址|发布|發布|获取|獲取|下载|下載|防屏蔽|永久|澳门|澳門|葡京|赌场|賭場|博彩|娱乐|娛樂|直播|约炮|約炮|社区|社區|论坛|論壇|福利|扫码|掃碼|客服|微信|QQ群|电报|電報|telegram|公告|必看|招募|关注|關注|聯繫|联系|最新アドレス|promo|advert/i;
  const DOMAIN = /(^|[^a-z0-9])[a-z0-9-]{2,}\.(com|net|org|la|xyz|cc|me|tv|top|vip|club|info|app|io|co|link|site|online|live|fun|win|life)($|[^a-z0-9])/i;
  const KANA = /[぀-ヿ]/;
  // 中国語にしかない字（簡体字・繁体字）。日本語の漢字だけのタイトルを中国語と誤判定しないよう、日本語と共通の字は入れない
  const ZH_ONLY = /[们这个资视频获发址网载为无码对时说请关联报电级备实购买么吗该进过还从让给见门问间开头东车马书读写语话认识记广场论坛专业产单经现选择变态爱亲热线红际欢边领导员样传统观众极简习盘约骚妇鸡伦强调們這發實從讓讀寫專產單廣碼說聯對麼嗎]/;
  // 品番＝FC2-PPV-数字、または ABC-123 の形。日付などの数字だけ（例：发布器20260609）は品番とみなさない
  // 判定に使う周りの情報
  //   spreadNames … 品番のない同じ名前のファイルが、別々のフォルダに入っている（作品に付いてきた広告）
  //   workDirs    … 作品のフォルダ（フォルダ名か、中のファイル・フォルダに品番がある）
  //   adDirs      … 名前が広告・宣伝のフォルダ（その中身も含む）
  let spreadNames = new Set(), workDirs = new Set(), adDirs = new Set(), dirNames = new Map();
  function prepJunk(files, folders) {
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
  function junkInfo(f) {
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
  function buildJunkPlan(files, folders) {
    prepJunk(files, folders);
    return files.map((f) => { const j = junkInfo(f); return j ? { ...f, level: j.level, reason: j.reason } : null; }).filter(Boolean)
      .sort((a, b) => (a.level === b.level ? 0 : a.level === 'del' ? -1 : 1) || a.path.localeCompare(b.path) || a.name.localeCompare(b.name));
  }

