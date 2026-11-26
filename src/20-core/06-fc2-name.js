  // ---------- FC2 ファイル名を整える ----------
  // 計画: [{op:'rename', kind:'file', id, parentId, path, cur, target, status, note}]
  function buildNamePlan(files, folders) {
    const fPath = new Map(folders.map((f) => [f.id, f.path]));
    const fName = new Map(folders.map((f) => [f.id, f.name]));
    const byP = new Map(); files.forEach((f) => { if (!byP.has(f.parentId)) byP.set(f.parentId, []); byP.get(f.parentId).push(f); });
    const plan = [];
    byP.forEach((list, pid) => {
      const taken = new Set(list.map((x) => x.name.toLowerCase()));
      list.forEach((x) => {
        const to0 = fc2CleanName(x.name, fName.get(pid));
        if (!to0 || to0 === x.name) return;
        taken.delete(x.name.toLowerCase());
        let to = to0, note = '';
        if (taken.has(to.toLowerCase())) { to = addSuffix(to0, taken); note = '同じ名前のファイルがあるため (n) を付けます（重複の可能性：「重複を比べて削除」で確認できます）'; }
        taken.add(to.toLowerCase());
        plan.push({ op: 'rename', kind: 'file', id: x.id, parentId: pid, path: fPath.has(pid) ? fPath.get(pid) : (x.path || ''), cur: x.name, target: to, status: 'todo', note });
      });
    });
    return plan;
  }

