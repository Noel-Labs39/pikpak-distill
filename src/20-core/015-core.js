  // ---------- 判定の部品（src/core/*.mjs）----------
  // 組み立てのときに esbuild で 1 つにまとめて、下の印の場所に入れる（PPCore）。画面側からは今までと同じ名前で呼ぶ
  /* @core-bundle */
  const { FC2_RE, BRANDS, splitName, parseWork, baseName, titleOf, dupKeyOf, keyOf, addSuffix, buildSortPlan, dropBoxLeftovers, buildNamePlan, SUB_EXT, prepJunk, junkInfo, buildJunkPlan } = PPCore;
  // 画面側の状態（読み込んだフォルダ一覧・販売者のフォルダ・設定）を渡す
  const buildGroups = (fs, mode) => PPCore.buildGroups(fs, mode, folders);
  const buildRenamePlan = (fs, fo) => PPCore.buildRenamePlan(fs, fo, { keep: sellerBoxIds(fo) });
  const buildCleanPlan = (fs, fo) => PPCore.buildCleanPlan(fs, fo, { junk: junkEnabled() });

