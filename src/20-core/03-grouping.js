  // ---------- グルーピング ----------
  // 同じファイル名モードでも、重複回避の (1) 等は同名として扱う
  const keyOf = (name, mode, dirName) => (mode === 'id' ? ((parseWork(name, dirName) || {}).key || ((name.match(/(\d{5,8})/) || [])[1]) || name.toLowerCase()) : (dupKeyOf(name, dirName) ? 'w:' + dupKeyOf(name, dirName) + (splitName(name).ext || '').toLowerCase() : name.toLowerCase()).replace(/\s?\(\d+\)(?=\.[a-z0-9]{2,5}$|$)/, ''));
  function buildGroups(files, mode) {
    const m = new Map();
    const dn = new Map((typeof folders !== 'undefined' ? folders : []).map((d) => [d.id, d.name]));
    files.forEach((f) => { const k = keyOf(f.name, mode, dn.get(f.parentId)); if (!m.has(k)) m.set(k, []); m.get(k).push(f); });
    return [...m.entries()]
      .filter(([, v]) => v.length > 1)
      .map(([k, v]) => {
        v.sort((a, b) => b.size - a.size);
        const max = v[0].size || 1;
        // 隣り合うサイズ同士が1.5%以内なら「サイズが近い組」（最大以外の組も拾う）
        const near = v.some((x, i) => i > 0 && (v[i - 1].size - x.size) / (v[i - 1].size || 1) <= NEAR);
        return { key: k, items: v, near };
      })
      .sort((a, b) => (b.near - a.near) || a.key.localeCompare(b.key));
  }


