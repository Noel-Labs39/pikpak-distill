  // ---------- 作品ごとに仕分け（混在フォルダの中に品番フォルダを作り、そこへ移動） ----------
  const workKey = (n, dirName) => { const b = baseName(n, dirName); return /\d{5,8}/.test(b) ? b : ''; };
  const addSuffix = (name, taken) => {
    const m = name.match(/^(.*?)(\.[A-Za-z0-9]{2,5})?$/); let i = 1, n;
    do { n = `${m[1]}(${i})${m[2] || ''}`; i++; } while (taken.has(n.toLowerCase()));
    return n;
  };
  // 置き場所のフォルダ：読み込んだ場所（ホーム以外）と、ホームの直下のフォルダ（My Pack など）
  const isDropBox = (c) => (c.isRoot ? c.id !== 'root' && !!c.id : c.parentId === 'root' || c.parentId === '');
  // 置き場所のフォルダの直下にあって、品番が読めないため仕分けできないファイル（「要確認」で理由を見せる）
  function dropBoxLeftovers(files, folders) {
    const box = new Map(folders.filter(isDropBox).map((d) => [d.id, d]));
    return files.filter((f) => box.has(f.parentId) && !workKey(f.name, box.get(f.parentId).name));
  }
  // 計画: [{cid, ctrail, cpath, work, folderId, folderNew, items:[{id,name,to}], status, note}]
  function buildSortPlan(files, folders) {
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

