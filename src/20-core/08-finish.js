  // ---------- 仕上げ：(1) を外す・空フォルダを片付ける ----------
  // 重複を削除したあとに残る「中身が空のフォルダ」をゴミ箱へ移し、
  // 同じ場所に元の名前が無くなったフォルダ・ファイルの (n) を外す
  const PAREN_DIR = /^(.*?)\s?\((\d+)\)$/;
  const PAREN_FILE = /^(.*?)\s?\((\d+)\)(\.[A-Za-z0-9]{2,5})$/;
  // 計画: [{op:'trash'|'rename', kind, id, parentId, ptrail, path, cur, target, status:'todo'|'skip', note}]
  function buildCleanPlan(files, folders) {
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
    const junkDel = (typeof junkEnabled === 'function' && junkEnabled()) ? (prepJunk(files, folders), (f) => { const j = junkInfo(f); return !!j && j.level === 'del'; }) : () => false;
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
