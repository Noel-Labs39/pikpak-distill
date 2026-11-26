  // ---------- フォルダ一覧の状態（OS ごとのキー表示・開いているフォルダ・選択・並び） ----------
  //   tree      … 並び・表示の仕方・開いているフォルダ（ppdup:tree に保存。保存は saveTree）
  //   treeSel / treeCur / treeAnchor … 選んでいる行・いまの行・範囲選択の起点
  //   treeRowsCache / treeIdx        … 描いた行の一覧と、その中の位置（キー操作用）
  //   qlOpen / renaming              … クイックルックが開いているか／名前を変えている行
  const OS = (() => {
    const p = String((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent || '');
    return /mac|iphone|ipad/i.test(p) ? 'mac' : /win/i.test(p) ? 'win' : 'linux';
  })();
  const IS_MAC = OS === 'mac';
  const OS_NAME = { mac: 'macOS', win: 'Windows', linux: 'Linux' }[OS];
  const modKey = (e) => (IS_MAC ? e.metaKey : e.ctrlKey); // ⌘（mac）／Ctrl（Windows・Linux）
  const KEY = IS_MAC
    ? { mod: '⌘', multi: '⌘', deep: '⌥', open: '⌘↓', up: '⌘↑', rename: 'Enter', trash: '⌘⌫', mkdir: '⌥⌘N', expand: '⇧⌘→', collapse: '⇧⌘←', copy: '⌘C', all: '⌘A', back: '⌫（delete）', next: '⌘↓', prev: '⌘↑' }
    : { mod: 'Ctrl', multi: 'Ctrl', deep: 'Alt', open: 'Enter', up: 'Alt+↑', rename: 'F2', trash: 'Delete', mkdir: 'Alt+N', expand: 'Ctrl+Shift+→', collapse: 'Ctrl+Shift+←', copy: 'Ctrl+C', all: 'Ctrl+A', back: 'Backspace', next: 'Ctrl+↓', prev: 'Ctrl+↑' };
  const LS_TREE = 'ppdup:tree:v1';
  let tree = { open: [], sort: 'name', dir: 1, q: '', thumb: false };
  try { tree = { ...tree, ...JSON.parse(localStorage.getItem(LS_TREE) || '{}') }; } catch (e) { /* 無視 */ }
  if (!tree.view) tree.view = tree.thumb ? 'thumb' : 'list'; // 表示：list（リスト）／thumb（サムネイル付きリスト）／tile（タイル）
  const treeOpen = new Set(tree.open || []);
  const saveTree = () => { try { localStorage.setItem(LS_TREE, JSON.stringify({ qs: tree.qs, open: [...treeOpen].slice(-2000), sort: tree.sort, dir: tree.dir, base: tree.base || '', view: tree.view, hover: tree.hover !== false })); } catch (e) { /* 無視 */ } };
  const treeSel = new Set();
  let treeCur = '', treeAnchor = '', treeRowsCache = [], treeIdx = null, qlOpen = false, renaming = '';
  const VIDEO_EXT = new Set(['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'ts', 'm4v', 'webm', 'rmvb', 'mpg', 'mpeg', '3gp', '3g2', 'm2ts', 'mts', 'vob', 'asf', 'f4v', 'ogv', 'divx']);
  const IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic']);
  const extOf = (n) => ((String(n).match(/\.([A-Za-z0-9]{2,7})$/) || [])[1] || '').toLowerCase();
  const kindOf = (r) => (r.kind === 'folder' ? 'フォルダ' : VIDEO_EXT.has(r.ext) ? 'ビデオ' : IMAGE_EXT.has(r.ext) ? 'イメージ' : SUB_EXT.has(r.ext) ? '字幕' : r.ext ? r.ext.toUpperCase() + ' 書類' : '書類');
  const ICON_DIR = '<svg viewBox="0 0 20 16"><path d="M1 3.2C1 2 2 1 3.2 1h4.3l1.8 2h7.5C18 3 19 4 19 5.2v7.6c0 1.2-1 2.2-2.2 2.2H3.2C2 15 1 14 1 12.8z" fill="#5aa9f6"/><path d="M1 5.5h18v7.3c0 1.2-1 2.2-2.2 2.2H3.2C2 15 1 14 1 12.8z" fill="#7cc0fb"/></svg>';
  const ICON_FILE = (r) => `<svg viewBox="0 0 16 20"><path d="M2 1h8l4 4v13a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z" fill="#f4f5f7" stroke="#b9bec8"/><path d="M10 1v4h4" fill="none" stroke="#b9bec8"/>${VIDEO_EXT.has(r.ext) ? '<path d="M6 9.5v5l4-2.5z" fill="#6b7280"/>' : ''}</svg>`;

