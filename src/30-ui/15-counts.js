  // ---------- 件数（ステップの案内用） ----------
  function counts() {
    if (!hasScan()) return null;
    const wf = workFiles();
    return {
      junk: junkEnabled() ? buildJunkPlan(files, folders).filter((p) => p.level === 'del').length : 0,
      junkReview: junkEnabled() ? buildJunkPlan(files, folders).filter((p) => p.level === 'review').length : 0,
      name: nameEnabled() ? buildNamePlan(wf, folders).length : 0,
      sort: stepOn('sort') ? buildSortPlan(wf, folders).length : 0,
      ren: stepOn('ren') ? buildRenamePlan(wf, folders).filter((p) => p.status === 'rename' || p.status === 'dup').length : 0,
      dup: buildGroups(wf, 'name').length,
      clean: stepOn('clean') ? buildCleanPlan(files, folders).filter((p) => p.status === 'todo').length : 0,
      seller: sellerEnabled() ? buildSellerPlan(folders).filter((x) => x.kind !== 'dupw' || x.merge).length : 0,
      cleanSkip: stepOn('clean') ? buildCleanPlan(files, folders).filter((p) => p.status === 'skip').length : 0,
    };
  }
  const UNIT_OF = { junk: '件', name: '件', sort: '作品', ren: '件', dup: '組', clean: '件', seller: '作品' };
  const WORK = ['junk', 'name', 'sort', 'ren', 'dup', 'clean', 'seller'];

