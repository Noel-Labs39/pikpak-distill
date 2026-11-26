  // ---------- 画面 ----------
  const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="ppdup-lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22c3a6"/><stop offset=".5" stop-color="#2f6bff"/><stop offset="1" stop-color="#7b5cff"/></linearGradient></defs><rect width="64" height="64" rx="18" fill="#14161c"/><rect x="9" y="14" width="13" height="16" rx="3" fill="none" stroke="url(#ppdup-lg)" stroke-opacity=".5" stroke-width="3"/><rect x="9" y="34" width="13" height="16" rx="3" fill="none" stroke="url(#ppdup-lg)" stroke-opacity=".5" stroke-width="3"/><path d="M22 22h6l5 10M22 42h6l5-10" fill="none" stroke="url(#ppdup-lg)" stroke-opacity=".7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 18h7a14 14 0 0 1 0 28h-7z" fill="none" stroke="url(#ppdup-lg)" stroke-width="5.5" stroke-linejoin="round"/><circle cx="51" cy="45" r="6" fill="#ffb020" stroke="#14161c" stroke-width="2"/><path d="M48.3 45l1.9 1.9 3.1-3.4" stroke="#14161c" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const LS_META = 'ppdup:scanmeta:v1';
  const css = `
  #ppdup-btn{position:fixed;right:20px;bottom:76px;z-index:99998;display:flex;align-items:center;gap:8px;padding:6px 16px 6px 6px;border:1px solid #3a3f4b;border-radius:999px;background:#14161c;color:#fff;font:700 13px system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 14px #0005}
  #ppdup-btn{touch-action:none;user-select:none;-webkit-user-select:none}
  #ppdup-btn .grip{font-style:normal;color:#8b91a1;letter-spacing:-3px;margin-left:2px;cursor:grab}
  #ppdup-btn.drag{cursor:grabbing;opacity:.9;box-shadow:0 10px 30px #0008;transition:none}
  #pd-fabpos{position:fixed;z-index:100006;width:220px;background:#1d2027;color:#e6e8ee;border:1px solid #2c303a;border-radius:12px;box-shadow:0 12px 40px #0008;padding:8px;display:flex;flex-direction:column;gap:2px;font:13px/1.4 system-ui,"Hiragino Sans","Yu Gothic",sans-serif}
  #pd-fabpos b{font-size:11px;color:#8b91a1;padding:4px 8px}
  #pd-fabpos button{border:0;background:none;color:inherit;font:inherit;text-align:left;padding:8px 10px;border-radius:8px;cursor:pointer}
  #pd-fabpos button:hover{background:#2a2f3a}
  #pd-fabpos small{color:#8b91a1;font-size:11px;padding:4px 8px}
  #ppdup-btn svg{width:30px;height:30px;border-radius:9px}
  #ppdup-btn:hover{filter:brightness(1.08)}
  #ppdup-fab{position:fixed;right:20px;bottom:128px;z-index:99998;width:320px;box-sizing:border-box;background:#1d2027;color:#e6e8ee;border:1px solid #2c303a;border-radius:14px;box-shadow:0 12px 40px #0008;padding:8px;font:13px/1.4 system-ui,"Hiragino Sans","Yu Gothic",sans-serif;display:none}
  #ppdup-fab.on{display:block;animation:pdfab .12s ease-out}
  @keyframes pdfab{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  #ppdup-fab .hd{font-size:11px;color:#8b91a1;padding:6px 10px 4px}
  #ppdup-fab button{display:flex;align-items:center;gap:10px;width:100%;border:0;background:none;color:inherit;font:inherit;padding:9px 10px;border-radius:9px;cursor:pointer;text-align:left}
  #ppdup-fab button:hover:not(:disabled){background:#2a2f3a}
  #ppdup-fab button:disabled{opacity:.45;cursor:not-allowed}
  #ppdup-fab button.flow{background:#306fff;color:#fff;font-weight:700;margin-bottom:4px}
  #ppdup-fab button.flow:hover{background:#3d7bff}
  #ppdup-fab .n{width:22px;height:22px;border-radius:50%;background:#2a2f3a;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex:none}
  #ppdup-fab .t{flex:1}
  #ppdup-fab .b{font-size:11px;color:#8b91a1}
  #ppdup-fab .b.todo{color:#8fb0ff;font-weight:700}
  #ppdup-fab .b.ok{color:#3fb96f}
  #ppdup-fab hr{border:0;border-top:1px solid #2c303a;margin:6px 4px}
  #ppdup-fab button.it{gap:14px;padding:12px;border-radius:12px}
  #ppdup-fab button.it.pri{background:#306fff;color:#fff}
  #ppdup-fab button.it.pri:hover{background:#3d7bff}
  #ppdup-fab .ic{width:42px;height:42px;flex:none;border-radius:11px;background:#22325c;color:#8fb0ff;display:flex;align-items:center;justify-content:center}
  #ppdup-fab .it.pri .ic{background:#ffffff2e;color:#fff}
  #ppdup-fab .ic svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
  #ppdup-fab .it b{display:block;font-size:14px}
  #ppdup-fab .it small{display:block;font-size:12px;opacity:.75;margin-top:2px;font-weight:400}
  #ppdup-fab .err{display:flex;align-items:center;gap:8px;margin:6px 4px 2px;padding:7px 10px;border-radius:8px;background:#3a2226;color:#ff9a9a;font-size:12px}
  #ppdup-fab .err span{flex:1}
  #ppdup-fab .err button{width:auto;padding:0;background:none;color:#ffb4b4;font-weight:700}
  #ppdup-fab .err button:hover{background:none;text-decoration:underline}
  #ppdup.single nav,#ppdup.treev nav{display:none}
  #ppdup,#pd-set,#pd-add,#pd-unzip,#pd-lib{--bg:#f5f6f8;--panel:#fff;--panel2:#eef0f4;--line:#dde0e6;--fg:#1c1f26;--mute:#6a7080;--pri:#306fff;--pri-soft:#306fff1f;--ok:#1f9d55;--danger:#d64545;--keep:#f0faf2;--del:#fff5f5;--ctl:#fff;--ctl-line:#c5c9d2}
  #ppdup{position:fixed;inset:0;z-index:99999;background:var(--bg);color:var(--fg);font:13px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Yu Gothic","Meiryo","Noto Sans CJK JP","Noto Sans JP",sans-serif;display:none;flex-direction:column}
  html.pd-dark #ppdup,html.pd-dark #pd-set,html.pd-dark #pd-add,html.pd-dark #pd-unzip,html.pd-dark #pd-lib{--bg:#15171c;--panel:#1d2027;--panel2:#252932;--line:#2c303a;--fg:#e6e8ee;--mute:#8b91a1;--pri-soft:#306fff33;--keep:#17261c;--del:#2a1a1a;--ctl:#252932;--ctl-line:#3a3f4b}
  #ppdup.on{display:flex}
  #ppdup:not(.pop) .wbtn-full,#ppdup:not(.pop) .wbtn-min{display:none !important}
  #ppdup.pop .wbtn-full,#ppdup.pop .wbtn-min{display:inline-flex}
  #ppdup.pop{inset:auto;box-sizing:border-box;border:1px solid var(--line);border-radius:14px;box-shadow:0 18px 60px #0006,0 2px 8px #0003;overflow:hidden;resize:both;min-width:560px;min-height:380px;max-width:100vw;max-height:100vh;padding-left:58px}
  #ppdup.pop .rail{width:58px;padding-top:10px}
  #ppdup.pop .rail button{width:46px;padding:9px 0}
  #ppdup.pop .rail button span{display:none}
  #ppdup.pop header{padding:8px 12px 0}
  #ppdup.pop .brand{cursor:move;user-select:none;gap:8px;padding-bottom:8px}
  #ppdup.pop .brand :is(button,input,select,label,a){cursor:pointer}
  #ppdup.pop .brand input{cursor:text}
  #ppdup.pop .brand > svg{width:30px;height:30px}
  #ppdup.pop .wm small{display:none}
  #ppdup.pop .wm .gw{font-size:19px}
  #ppdup.pop{container-type:inline-size}
  #ppdup.pop .brand{flex-wrap:nowrap}
  #ppdup.pop .brand > *{flex-shrink:0}
  #ppdup.pop .pd-quota{flex:0 1 210px;width:210px;min-width:120px;overflow:hidden}
  #ppdup.pop .pd-quota .qt i{overflow:hidden;text-overflow:ellipsis}
  #ppdup.pop .pd-quota .ql{display:none}
  #ppdup.pop .hbtn{padding:0 10px}
  #ppdup.pop [data-a=lang] > span,#ppdup.pop [data-a=settings] > span,#ppdup.pop .brand [data-a=addlink] > span{display:none}
  #ppdup.pop .hq input{width:110px}
  @container (max-width:880px){#ppdup .wbtn-full > span,#ppdup .brand .ver,#ppdup .pd-quota{display:none}}
  @container (max-width:700px){#ppdup .wm{display:none}}
  #ppdup.pop .tl-top{position:absolute;right:20px;bottom:44px}
  #ppdup.dragging{user-select:none;opacity:.92}
  #ppdup .pd-popban{display:none}
  #ppdup.pop.ban .pd-popban{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px 14px;background:var(--pri-soft);border-bottom:1px solid var(--line);font-size:12.5px}
  #ppdup .pd-popban span{flex:1 1 260px;min-width:0}
  #ppdup .pd-popban button{height:28px;padding:0 12px;border-radius:7px;border:1px solid var(--ctl-line);background:var(--ctl);color:inherit;font:inherit;cursor:pointer}
  #ppdup .pd-popban button.pri{background:var(--pri);border-color:var(--pri);color:#fff;font-weight:700}
  #ppdup{padding-left:78px}
  #ppdup .rail{position:absolute;left:0;top:0;bottom:0;width:78px;display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 0 10px;background:var(--panel2);border-right:1px solid var(--line);z-index:2}
  #ppdup .rail button{position:relative;width:64px;line-height:1.2;text-align:center;word-break:keep-all;display:flex;flex-direction:column;align-items:center;gap:3px;padding:9px 0 7px;border:0;border-radius:10px;background:none;color:var(--mute);font-size:11px;font-weight:600}
  #ppdup .rail button:hover:not(:disabled){background:var(--panel);color:var(--fg)}
  #ppdup .rail button.on{background:var(--pri-soft);color:var(--pri)}
  #ppdup .rail svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
  #ppdup .rail .sp{flex:1}
  #ppdup [data-r=logbadge]:empty{display:none}
  #ppdup [data-r=logbadge]{position:absolute;top:-6px;right:-6px;min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:var(--danger);color:#fff;font:700 10px/16px system-ui,sans-serif;font-style:normal}
  #ppdup header{padding:10px 18px 0;background:var(--panel);border-bottom:1px solid var(--line)}
  #ppdup .brand{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding-bottom:10px}
  #ppdup .brand > svg{width:40px;height:40px;flex:none}
  #ppdup .brand h1{margin:0;font:800 19px/1.1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Yu Gothic","Meiryo","Noto Sans CJK JP","Noto Sans JP",sans-serif}
  #ppdup .brand h1.wm{display:flex;flex-direction:column;gap:2px;font:inherit;line-height:1}
  #ppdup .wm small{font:700 10px/1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.18em;color:var(--mute)}
  #ppdup .wm .gw{position:relative;display:inline-block;font:800 24px/1.05 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:-.02em}
  #ppdup .wm .gw i{position:absolute;left:3px;top:-2px;font-style:normal;color:#7b5cff;opacity:.3}
  #ppdup .wm .gw i + i{left:6px;top:-4px;opacity:.15}
  #ppdup .wm .gw b{position:relative;font-weight:800;background:linear-gradient(90deg,#13a88d,#2f6bff,#7b5cff);-webkit-background-clip:text;background-clip:text;color:transparent}
  html.pd-dark #ppdup .wm .gw b{background-image:linear-gradient(90deg,#4fe0c4,#7fa8ff,#a891ff)}
  html.pd-dark #ppdup .wm .gw i{color:#a891ff}
  #ppdup .brand .chip{font:700 12px system-ui,sans-serif;padding:3px 10px;border-radius:999px;background:var(--pri-soft);color:var(--pri)}
  #ppdup .brand .ver{font:700 12px ui-monospace,Menlo,monospace;color:var(--mute);border:1px solid var(--line);border-radius:6px;padding:1px 7px;align-self:center}
  /* ヘッダー右上：容量・テーマ・言語・設定・閉じる */
  #ppdup .hbtn{position:relative;display:inline-flex;align-items:center;gap:6px;height:36px;box-sizing:border-box;padding:0 12px;border-radius:9px;font-weight:700}
  #ppdup .hbtn svg,#ppdup .thm svg,#ppdup .hx svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;flex:none}
  #ppdup .hx{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;padding:0;border:0;background:none;color:var(--mute);border-radius:9px}
  #ppdup .hx:hover{background:var(--panel2);color:var(--fg)}
  #ppdup .thm{display:inline-flex;height:36px}
  #ppdup .thm button{display:inline-flex;align-items:center;justify-content:center;min-width:38px;height:36px;box-sizing:border-box;padding:0 10px;font-size:12px;font-weight:700}
  #ppdup .hq{display:none;align-items:center;gap:6px;height:36px;box-sizing:border-box;padding:0 10px;border:1px solid var(--ctl-line);border-radius:9px;background:var(--ctl);color:var(--mute)}
  #ppdup.treev .hq{display:inline-flex}
  #ppdup .hqs{display:none}
  #ppdup.treev .hqs{display:inline-flex}
  #ppdup .hqs button{height:36px;padding:0 10px;font-size:12px}
  #ppdup .hqs button.on{background:var(--pri) !important;color:#fff !important;border-color:var(--pri) !important}
  #ppdup.pop .hqs{display:none}
  .sr{display:flex;flex-direction:column}
  .sr-row{display:flex;align-items:center;gap:12px;padding:7px 18px;border-bottom:1px solid var(--line);cursor:pointer}
  .sr-row:hover{background:var(--pri-soft)}
  .sr-th{width:64px;height:36px;flex:none;border-radius:5px;overflow:hidden;background:var(--panel2);display:flex;align-items:center;justify-content:center}
  .sr-th img{width:100%;height:100%;object-fit:cover}
  .sr-th svg{width:22px;height:22px}
  .sr-t{flex:1;min-width:0;display:flex;flex-direction:column}
  .sr-n{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .sr-p{color:var(--mute);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .sr mark{background:#ffe08a;color:#1c1f26;border-radius:2px;padding:0 1px}
  .sr-s{color:var(--mute);font-size:12px;white-space:nowrap}
  #ppdup .hq svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
  #ppdup .hq input{border:0 !important;background:none !important;padding:0 !important;outline:none;width:180px;color:var(--fg)}
  .pd-quota{display:flex;flex-direction:column;gap:4px;width:310px;padding:5px 12px;border:1px solid var(--line);border-radius:9px;background:var(--panel2);box-sizing:border-box;cursor:default}
  .pd-quota:empty{display:none}
  .pd-quota .qt{display:flex;align-items:baseline;gap:6px;font-size:12px;white-space:nowrap}
  .pd-quota .qt i{font-style:normal;color:var(--mute)}
  .pd-quota .qt .sp{flex:1}
  .pd-quota .qb{display:flex;height:6px;border-radius:99px;overflow:hidden;background:var(--line)}
  .pd-quota .qb span{display:block;height:100%}
  .pd-quota .ql{display:flex;gap:10px;font-size:11px;color:var(--mute);white-space:nowrap;overflow:hidden}
  .pd-quota .ql b{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:4px;vertical-align:0}
  .q-cur{background:#1d4fd6}.q-oth{background:#8fb0ff}.q-tr{background:#f2a33a}
  html.pd-dark .q-cur{background:#5b8cff}html.pd-dark .q-oth{background:#3a4b78}
  @media (max-width:1200px){#ppdup .pd-quota,#ppdup header .thm{display:none !important}#ppdup header .hbtn[data-a=lang] span,#ppdup header .hbtn[data-a=addlink] span,#ppdup header .hxl span{display:none}#ppdup .hq input{width:120px}}
  @media (max-height:640px){#ppdup{overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}#ppdup main{flex:none;min-height:calc(100vh - 20px);overflow:visible}#ppdup header{padding-top:6px}#ppdup .wm small{display:none}}
  @media (max-width:1600px){#ppdup.treev header .hbtn[data-a=lang] span,#ppdup.treev header .hbtn[data-a=addlink] span,#ppdup.treev header .hxl span{display:none}#ppdup.treev .pd-quota .ql{display:none}#ppdup.treev .pd-quota{width:210px}}
  @media (max-width:1280px){.pd-quota .ql{display:none}.pd-quota{width:210px}#ppdup .hq input{width:110px}}
  @media (max-width:1200px){#ppdup .brand .chip{display:none}#ppdup [data-r=langname]{display:none}#ppdup .brand{gap:8px}}
  #ppdup .sp{flex:1}
  #ppdup button:where(:not(.pv *)),#ppdup select:where(:not(.pv *)),#ppdup input[type=text]{font:inherit;padding:6px 12px;border:1px solid var(--ctl-line);border-radius:8px;background:var(--ctl);color:inherit;cursor:pointer}
  #ppdup button:disabled:where(:not(.pv *)){opacity:.45;cursor:not-allowed}
  #ppdup button.pri:where(:not(.pv *)){background:var(--pri);color:#fff;border-color:var(--pri);font-weight:700}
  #ppdup button.danger{background:var(--danger);color:#fff;border-color:var(--danger);font-weight:700}
  #ppdup button.big{padding:12px 26px;font-size:15px;border-radius:10px}
  #ppdup .note{color:var(--mute);font-size:12px}
  /* ステップ */
  #ppdup nav{display:flex;gap:0;margin-top:12px;overflow-x:auto}
  #ppdup nav .st{flex:1 1 auto;min-width:0;display:flex;align-items:center;gap:7px;padding:10px 14px 12px 6px;border:0;border-bottom:3px solid transparent;border-radius:0;background:none;text-align:left;position:relative}
  #ppdup nav .st:not(:last-child)::after{content:'›';position:absolute;right:2px;top:50%;transform:translateY(-50%);color:var(--mute);font-size:18px}
  #ppdup nav .st .n{width:24px;height:24px;font-size:12px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;background:var(--panel2);color:var(--mute);flex:none}
  #ppdup nav .st .t{font-weight:700;font-size:12.5px;display:block;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #ppdup nav .st > span:last-child{min-width:0}
  #ppdup nav .st .c{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #ppdup nav .st .c{font-size:11px;color:var(--mute);display:block}
  #ppdup nav .st.active{border-bottom-color:var(--pri)}
  #ppdup nav .st.active .n{background:var(--pri);color:#fff}
  #ppdup nav .st.done .n{background:var(--ok);color:#fff}
  #ppdup nav .st.next .c{color:var(--pri);font-weight:700}
  #ppdup nav .st:disabled{opacity:.4}
  /* ステップごとの操作欄 */
  #ppdup .tb{display:flex;flex-wrap:wrap;gap:8px 10px;align-items:center;padding:12px 18px;background:var(--panel);border-bottom:1px solid var(--line)}
  #ppdup .tb .head{display:flex;flex-direction:column;margin-right:8px}
  #ppdup .tb .head b{font-size:15px}
  #ppdup .tb .sep{width:1px;height:24px;background:var(--line)}
  #ppdup .tb:empty{display:none}
  #ppdup .okbadge{color:var(--ok);font-weight:800;padding:0 6px}
  #ppdup .optsw{display:flex;align-items:center;gap:6px;font-weight:700;cursor:pointer}
  #ppdup .optsw input{width:18px;height:18px;accent-color:var(--pri)}
  .kit-ex summary{cursor:pointer;font-weight:800;font-size:13px}
  .kit-ex[open] summary{margin-bottom:6px}
  .kit-tabs{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:4px 0 12px}
  .kit-tabs .sp{flex:1}
  .kit-tab{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 14px;border-radius:16px;border:1px solid var(--line);background:var(--panel);color:var(--fg);font:inherit;font-weight:700;cursor:pointer}
  .kit-tab i{font-style:normal;font-size:12px;color:var(--mute)}
  .kit-tab.on{background:var(--pri);border-color:var(--pri);color:#fff}.kit-tab.on i{color:#fff}
  .kit-tab.bad:not(.on){color:var(--danger);border-color:var(--danger)}
  .kit-tabs input[type=search]{height:32px;padding:0 12px;border-radius:16px;border:1px solid var(--ctl-line);background:var(--ctl);color:inherit;font:inherit;width:220px}
  .pd-gh input[type=checkbox]{margin:0 4px 0 0;width:16px;height:16px}
  .kit-row .kit-th{width:80px;height:45px;display:flex;align-items:center;justify-content:center;background:var(--panel2);border-radius:8px;overflow:hidden;flex:none}
  .kit-row .kit-th img{width:100%;height:100%;object-fit:cover}
  .kit-row .kit-ic svg{width:26px;height:26px}
  .kit-row .kit-to{color:var(--pri)}
  .kit-row .kit-err{color:var(--danger);font-size:12px;font-weight:700}
  .kit-row.fail{background:var(--del)}
  .kit-row .kit-tag{flex:none;white-space:nowrap}
  .kit-row .kit-tag.pri{background:var(--pri-soft);color:var(--pri)}
  .kit-row .kit-tag.ok{background:#e3f6ec;color:#17703f}
  .kit-row .kit-tag.warn{background:#fff4dc;color:#8a5600}
  .kit-row .kit-tag.del{background:#fde8e8;color:#b42318}
  .kit-row .kit-open{flex:none;height:30px;padding:0 10px;border:1px solid var(--ctl-line);border-radius:8px;background:var(--ctl);color:inherit;font:inherit;font-size:12px;cursor:pointer}
  .pd-explain{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin-bottom:12px}
  .pd-explain h3{margin:0 0 6px;font-size:14px}
  .pd-explain ul{margin:6px 0 0;padding-left:18px}
  .pd-explain code{background:var(--panel2);padding:1px 6px;border-radius:5px}
  /* 進捗 */
  #ppdup .prog{padding:7px 18px;font-size:12px;color:var(--mute);background:var(--panel2);border-top:1px solid var(--line);display:flex;flex-direction:column;gap:6px}
  #ppdup .prog .pr1,#ppdup .prog .pr2{display:flex;align-items:center;gap:12px;min-width:0}
  #ppdup .prog .pr2{display:none}
  #ppdup .prog.busy .pr2{display:flex}
  #ppdup .prog [data-r=status]{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #ppdup .prog .pb{flex:1 1 auto !important}
  #ppdup .prog .ps{white-space:nowrap;color:var(--fg);opacity:.8}
  #ppdup .prog .pstop{height:24px !important;padding:0 10px !important;font-size:12px !important}
  #ppdup .prog [data-r=status]{flex:1;min-width:0}
  #ppdup .prog [data-r=pright]{white-space:nowrap}
  #ppdup .prog .pb{flex:0 0 220px;height:6px;border-radius:3px;background:var(--line);overflow:hidden;display:none}
  #ppdup .prog .pb i{display:block;height:100%;width:0;background:var(--pri);transition:width .2s}
  #ppdup .prog.busy .pb{display:block}
  #ppdup .prog .pp{white-space:nowrap;font:700 12px ui-monospace,Menlo,Consolas,monospace;color:var(--fg);min-width:0}
  #ppdup .prog .pp:empty{display:none}
  #ppdup main{flex:1;overflow:auto;padding:14px 18px;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;touch-action:pan-x pan-y;min-height:0}
  #pd-frames .fr-c.ng::before{content:'このコマは取れませんでした';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--mute,#8b91a1)}
  html.pd-blur #ppdup img,html.pd-blur #pd-hover img,html.pd-blur #pd-ql img,html.pd-blur #pd-frames canvas,html.pd-blur #pd-add img,html.pd-blur .pd-sk canvas,html.pd-blur .pd-sk img{filter:blur(14px) saturate(.6);transition:filter .15s}
  html.pd-blur #ppdup .pd-th,html.pd-blur #pd-frames .fr-c{overflow:hidden}
  html.pd-blurhov #ppdup img:hover,html.pd-blurhov #ppdup :hover > img,html.pd-blurhov #pd-ql img:hover,html.pd-blurhov #pd-frames .fr-c:hover canvas,html.pd-blurhov #pd-frames .fr-c:active canvas,html.pd-blurhov #ppdup img:active{filter:none}
  #ppdup .empty{padding:40px;text-align:center;color:var(--mute)}
  /* スキャン画面 */
  .pd-hero{max-width:760px;margin:24px auto;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:28px;text-align:center}
  .pd-hero h2{margin:0 0 8px;font-size:20px}
  .pd-hero .where{display:inline-block;margin:10px 0 18px;padding:6px 14px;border-radius:999px;background:var(--panel2);font-weight:700}
  .pd-hero .acts{display:flex;gap:10px;justify-content:center}
  .sv{max-width:1080px;margin:8px auto 24px;display:flex;flex-direction:column;gap:14px}
  .sv-hero{display:grid;grid-template-columns:auto 1fr auto;gap:20px;align-items:center;padding:24px 26px;border-radius:16px;background:linear-gradient(135deg,var(--panel) 0%,var(--panel) 55%,var(--pri-soft) 100%);border:1px solid var(--line);box-shadow:0 1px 2px #0000000d}
  .sv-hero.ok{background:linear-gradient(135deg,var(--panel) 0%,var(--panel) 55%,#1f9d5524 100%);border-color:#1f9d5566}
  .sv-badge{width:56px;height:56px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:#fff;background:linear-gradient(135deg,#4b8df8,#306fff);box-shadow:0 6px 16px #306fff55}
  .sv-hero.ok .sv-badge{background:linear-gradient(135deg,#34c472,#1f9d55);box-shadow:0 6px 16px #1f9d5555}
  .sv-main h2{margin:0;font-size:20px;letter-spacing:.01em}
  .sv-main p{margin:6px 0 10px;color:var(--mute);font-size:13px}
  .sv-chips{display:flex;flex-wrap:wrap;gap:6px}
  .chip-i{display:inline-flex;gap:6px;align-items:center;padding:3px 10px;border-radius:999px;background:var(--panel2);font-size:12px;font-weight:600}
  .chip-i i{font-style:normal;color:var(--mute);font-weight:500}
  .sv-act{display:flex;flex-direction:column;gap:8px;align-items:stretch;min-width:220px}
  #ppdup .sv-act button.ghost{background:transparent;border-color:var(--pri);color:var(--pri);font-size:13px;padding:9px 14px}
  .sv-opt{display:flex;gap:12px;align-items:center;padding:12px 16px;border-radius:12px;background:var(--panel);border:1px solid var(--line);cursor:pointer}
  .sv-opt b{display:block;font-size:13px}
  .sv-opt small{color:var(--mute);font-size:12px}
  .sw{position:relative;width:40px;height:24px;flex:none}
  .sw input{position:absolute;opacity:0;width:100%;height:100%;margin:0;cursor:pointer}
  .sw i{position:absolute;inset:0;border-radius:999px;background:var(--ctl-line);transition:background .15s}
  .sw i::after{content:'';position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #0004;transition:transform .15s}
  .sw input:checked + i{background:var(--pri)}
  .sw input:checked + i::after{transform:translateX(16px)}
  .sv-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
  #ppdup .sc{display:grid;grid-template-rows:auto 1fr auto;gap:6px;min-height:118px;padding:12px 14px;border-radius:14px;border:1px solid var(--line);background:var(--panel);text-align:left;transition:transform .12s,box-shadow .12s,border-color .12s}
  #ppdup .sc:hover{transform:translateY(-2px);box-shadow:0 8px 20px #0000001a;border-color:var(--pri)}
  .sc-h{display:flex;gap:8px;align-items:center;min-width:0}
  .sc-n{width:22px;height:22px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;background:var(--panel2);color:var(--mute)}
  .sc-t{font-size:12px;font-weight:700;line-height:1.3;color:var(--fg);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .sc-v{display:flex;align-items:baseline;gap:4px;align-self:end}
  .sc-v b{font-size:28px;line-height:1;font-weight:800;letter-spacing:-.02em}
  .sc-v small{font-size:12px;color:var(--mute);font-weight:600}
  .sc-s{font-size:11px;color:var(--mute);min-height:14px}
  .sc.zero .sc-v b{color:var(--ok)} .sc.zero .sc-n{background:#1f9d5522;color:var(--ok)}
  .sc.todo .sc-v b{color:var(--pri)} .sc.todo .sc-n{background:var(--pri);color:#fff}
  .sc.warn .sc-v b{color:#c27a00} .sc.warn .sc-s{color:#c27a00;font-weight:700}
  .sc.off .sc-v b{color:var(--mute);font-size:20px}
  #ppdup .sc.next{border-color:var(--pri);box-shadow:0 0 0 3px var(--pri-soft)}
  .sc.next .sc-s{color:var(--pri);font-weight:700}
  @media (max-width:760px){.sv-hero{grid-template-columns:1fr}.sv-badge{display:none}}
  .pd-next{display:flex;justify-content:flex-end;margin:16px 0 4px}
  #pd-dlg .sd-t button{margin:2px}
  #pd-dlg .sd-t button:disabled{opacity:.3;cursor:default}
  .sl-ib{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:12px;padding-top:12px;border-top:1px solid var(--line)}
  .sl-guide > .sl-ib:first-child{margin-top:0;padding-top:0;border-top:0}
  .sl-ib .tx{flex:1 1 260px;display:flex;flex-direction:column;gap:2px}
  .sl-ib .tx small{color:var(--mu)}
  .sl-guide{margin:0 0 12px;padding:14px 16px;background:var(--panel);border:1.5px solid var(--pri);border-radius:12px;box-shadow:0 4px 16px #306fff1f;display:flex;flex-direction:column;gap:12px}
  .sl-guide .fl{display:flex;align-items:center;gap:0}
  .sl-guide .st{display:flex;align-items:center;gap:8px;flex:0 1 auto;min-width:0}
  .sl-guide .st .n{width:26px;height:26px;flex:none;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:800;color:#fff;background:#c5c9d2}
  .sl-guide .st.done .n{background:var(--ok)}
  .sl-guide .st.now .n{background:var(--pri);box-shadow:0 0 0 4px var(--pri-soft)}
  .sl-guide .st .t{display:flex;flex-direction:column;min-width:0}
  .sl-guide .st .t b{font-size:13px;white-space:nowrap}
  .sl-guide .st:not(.done):not(.now) .t b{color:var(--mute)}
  .sl-guide .st .t small{font-size:11px;color:var(--mute);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .sl-guide .ln{flex:1 1 24px;height:2px;margin:0 12px;background:var(--line);min-width:16px}
  .sl-guide .msg{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:12px 14px;background:var(--pri-soft);border-radius:9px}
  .sl-guide .msg .tx{flex:1 1 360px;min-width:0;display:flex;flex-direction:column;gap:2px}
  .sl-guide .msg .tx b{font-size:14px}
  .sl-guide .msg .tx small{font-size:12px;color:var(--mute)}
  .sl-guide .msg button{height:36px;padding:0 16px}
  .sl-guide .msg button.pri{font-size:13.5px}
  .sl-prog{display:flex;flex-direction:column;gap:6px;margin-top:8px}
  .sl-prog .bar{height:10px;border-radius:5px;background:var(--line);overflow:hidden;display:flex}
  .sl-prog .bar i{display:block;height:100%;transition:width .3s}
  .sl-prog .bar .ok{background:var(--ok)}
  .sl-prog .bar .ng{background:#8b91a1}
  .sl-prog .nums{display:flex;flex-wrap:wrap;gap:14px;font-size:12px;color:var(--mute)}
  .sl-prog .nums b{color:var(--fg);font-family:ui-monospace,Menlo,monospace}
  .sl-tabs{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}
  .sl-tabs button{display:inline-flex;align-items:center;gap:8px;height:34px;padding:0 14px;border-radius:99px !important;font-weight:600}
  .sl-tabs button i{width:8px;height:8px;border-radius:2px}
  .sl-tabs button b{font-size:14px}
  .sl-tabs button.on{background:var(--fg) !important;color:var(--bg) !important;border-color:var(--fg) !important}
  .sl-tabs button:disabled{opacity:.45}
  .sl-why{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:3px}
  .sl-b{font-size:11px;padding:1px 8px;border-radius:99px;font-weight:700;background:var(--panel2);color:var(--mute)}
  .sl-b:empty{display:none}
  .sl-b.auto{background:#e3f6ec;color:#17703f}
  .sl-b.ok{background:var(--pri-soft);color:var(--pri)}
  .sl-b.man{background:#efe9ff;color:#5b3fd6}
  .sl-b.warn{background:#fff3dc;color:#8a5600}
  html.pd-dark .sl-b.auto{background:#17331f;color:#6fdc9a}
  html.pd-dark .sl-b.man{background:#2a2346;color:#b9a6ff}
  html.pd-dark .sl-b.warn{background:#3a2c12;color:#f0c46c}
  .sl-in{display:flex;flex-wrap:wrap;gap:6px;align-items:center;flex:0 1 auto}
  .sl-in input{height:32px;box-sizing:border-box;padding:0 10px;border:1px solid var(--ctl-line);border-radius:7px;background:var(--ctl);color:inherit;font:inherit}
  .sl-in input[data-sname]{width:180px}
  .sl-in input[data-ssid]{width:96px}
  .sl-in .err{flex-basis:100%;color:var(--danger);font-size:12px}
  .sl-in .err:empty{display:none}
  .pd-g.unk .pd-row{background:var(--panel)}
  .sl-bar{position:sticky;bottom:0;z-index:3;display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin:14px 0 0;padding:10px 14px;background:#1c1f26;color:#fff;border-radius:12px;box-shadow:0 10px 30px #0004}
  html.pd-dark .sl-bar{background:#2b3040}
  .sl-bar:empty{display:none}
  .sl-bar .n{min-width:22px;height:22px;padding:0 4px;box-sizing:border-box;border-radius:11px;background:var(--pri);display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:12px}
  .sl-bar .tx{flex:1 1 280px;min-width:0;display:flex;flex-direction:column}
  .sl-bar .tx small{color:#b6bbc7;font-size:12px}
  .sl-bar button.sec{background:#ffffff1a !important;color:#fff !important;border-color:#5a6070 !important;font-weight:700}
  .sl-bar button:not(.pri):not(.sec){background:transparent !important;color:#fff !important;border-color:#5a6070 !important}
  #pd-ext{position:fixed;z-index:100004;width:400px;max-width:calc(100vw - 16px);box-sizing:border-box;padding:12px 14px 14px;background:#1d2027;color:#e6e8ee;border-radius:14px;box-shadow:0 18px 50px #0006;font:13px/1.5 system-ui,-apple-system,"Segoe UI","Hiragino Sans","Yu Gothic UI","Meiryo",sans-serif}
  #pd-ext .hd{display:flex;align-items:center;gap:8px;margin-bottom:6px}
  #pd-ext .hd b{flex:1}
  #pd-ext .hd button{width:28px;height:28px;border:0;border-radius:7px;background:none;color:#8b91a1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
  #pd-ext .hd svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
  #pd-ext .kw{font:500 12px ui-monospace,Menlo,monospace;color:#8b91a1;margin:6px 0}
  #pd-ext .gr{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
  #pd-ext .gr a{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;height:50px;border:1px solid #3a3f4b;border-radius:10px;background:#252932;color:#e6e8ee;text-decoration:none}
  #pd-ext .gr a:hover{border-color:#7fa8ff;color:#7fa8ff}
  #pd-ext .gr b{font-size:12.5px}
  #pd-ext .gr small{font-size:10px;color:#8b91a1}
  #pd-ext .ft{margin-top:10px;font-size:11px;color:#8b91a1}
  .sl-chips{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:12px}
  #ppdup .pd-rotate{position:absolute;inset:0;z-index:20;background:#0b0d12ee;display:flex;align-items:center;justify-content:center;padding:24px}
  #ppdup .pd-rotate .box{max-width:320px;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:20px;text-align:center;display:flex;flex-direction:column;gap:10px}
  #ppdup .pd-rotate .ic{font-size:40px;line-height:1}
  #ppdup .pd-rotate b{font-size:16px}
  #ppdup .pd-rotate small{color:var(--mute);line-height:1.6}
  #ppdup .pd-rotate button{height:40px;border-radius:9px}
  @media (max-height:520px){
    #ppdup.phone{padding-left:52px}
    #ppdup.phone .rail{width:52px;padding-top:6px}
    #ppdup.phone .rail button{width:42px;padding:7px 0}
    #ppdup.phone .rail button span{display:none}
    #ppdup.phone header{padding:4px 10px 0}
    #ppdup.phone .brand{flex-wrap:nowrap;gap:6px;padding-bottom:4px}
    #ppdup.phone .brand > *{flex-shrink:0}
    #ppdup.phone .brand > svg{width:26px;height:26px}
    #ppdup.phone .wm small,#ppdup.phone .brand .ver,#ppdup.phone .pd-quota,#ppdup.phone .hq,#ppdup.phone .hqs{display:none !important}
    #ppdup.phone .wm .gw{font-size:17px}
    #ppdup.phone .hbtn{height:30px;padding:0 8px}
    #ppdup.phone .hbtn > span{display:none}
    #ppdup.phone .thm{display:none}
    #ppdup.phone .tb{padding:6px 10px}
    #ppdup.phone .tb .head .note{display:none}
    #ppdup.phone .prog{padding:4px 10px}
  }
  .sv-intro{margin:10px 0 0;padding:12px 14px 12px 30px;border-radius:10px;background:var(--panel2);line-height:1.9;color:var(--mute)}
  .sv-intro b{color:var(--fg)}
  .sv-scope{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px}
  .sv-scope label{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border:1px solid var(--line,#dde0e6);border-radius:999px;cursor:pointer;color:var(--fg,inherit)}
  .sv-scope label:has(input:checked){border-color:var(--pri,#306fff);background:var(--pri-soft,#306fff1f)}
  .sv-intro li.sv-scope-li{list-style:none;margin-left:-16px}
  .sv-ask{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--mute);margin-top:4px}
  .sv-stale{margin:8px 0;padding:8px 12px;border-radius:8px;background:#fff3dc;color:#8a5600;font-size:12.5px}
  html.pd-dark .sv-stale{background:#3a2c12;color:#f0c46c}
  .qp-stage{position:relative;overflow:hidden;width:100%;touch-action:pan-x pan-y;cursor:pointer}
  .qp-stage.qp-zoomed{touch-action:none;cursor:grab}
  .qp-zhint{position:absolute;left:12px;bottom:12px;z-index:3;padding:5px 10px;border-radius:8px;background:rgba(0,0,0,.6);color:#fff;font-size:12px;pointer-events:none;opacity:0;transition:opacity .4s}.qp-zhint.on{opacity:.9}
  .qp-stage video{transform-origin:0 0;will-change:transform}
  #pd-lib .lb-pvv .qp-stage{height:100%;display:flex;align-items:center}
  .qp-osd{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);padding:8px 16px;border-radius:10px;background:#000b;color:#fff;font:700 16px system-ui,sans-serif;pointer-events:none;z-index:4;white-space:nowrap}
  .qp-osd[hidden],.qp-mini[hidden]{display:none}
  .qp-mini{position:absolute;right:10px;top:10px;width:96px;aspect-ratio:16/9;border:1px solid #fff9;background:#0007;z-index:4;pointer-events:none}
  .qp-mini i{position:absolute;border:1.5px solid #fff;box-sizing:border-box}
  .qp-hint{display:flex;justify-content:flex-end;padding:4px 12px;background:#14171d}
  .qp-badge{font:700 11px system-ui,sans-serif;padding:2px 8px;border-radius:99px;background:#306fff;color:#fff;opacity:.45;transition:opacity .2s;border:0;cursor:pointer}
  .qp-keys{position:absolute;left:10px;top:10px;z-index:6;max-height:calc(100% - 50px);overflow:auto;padding:10px 14px;border-radius:10px;background:#000d;color:#fff;font:12px/1.7 system-ui,sans-serif;display:grid;grid-template-columns:auto auto;gap:0 14px}
  .qp-keys[hidden]{display:none}.qp-keys kbd{font:700 11px system-ui;padding:0 5px;border-radius:4px;background:#ffffff26}
  @keyframes qpblink{0%,100%{box-shadow:none}50%{box-shadow:0 0 0 3px #7fb0ff}}.qp-blink{animation:qpblink .5s 3;border-radius:6px}
  .qp-on .qp-badge{opacity:.95}
  .qp-on > .qp-stage{box-shadow:inset 0 0 0 2px #306fff}
  .qp-ui{position:relative;background:#000;color:#fff;font:13px/1.4 system-ui,-apple-system,"Hiragino Sans","Yu Gothic UI",sans-serif}
  .qp-ui.qp-on{box-shadow:inset 2px 0 0 #306fff,inset -2px 0 0 #306fff,inset 0 -2px 0 #306fff}
  .qp-ui.qp-auto:not(.qp-on){opacity:.15;transition:opacity .2s}
  .qp-ui .pd-sk{background:transparent}
  .qp-ctl{display:flex;align-items:center;gap:4px;padding:2px 10px 8px;flex-wrap:wrap}
  .qp-ctl button svg{display:block}
  .qp-ctl button{display:inline-flex;align-items:center;justify-content:center;height:30px!important;min-width:30px;padding:0 8px!important;border:0!important;border-radius:6px!important;background:transparent!important;color:#fff!important;font:600 13px system-ui,sans-serif!important;cursor:pointer;line-height:30px}
  .qp-ctl button:hover{background:#ffffff26!important}
  .qp-ctl button[data-qp=gear]{background:#306fff!important}
  .qp-ctl .qp-t{font:12px ui-monospace,monospace;color:#ddd;margin:0 6px;white-space:nowrap}
  .qp-ctl .qp-sp{flex:1}
  .qp-ctl input[type=range]{width:80px;accent-color:#306fff}
  .qp-ctl select{height:28px;border-radius:6px;border:1px solid #ffffff55;background:#000;color:#fff;font:12px system-ui,sans-serif}
  .qp-set{position:absolute;right:10px;bottom:46px;width:300px;max-width:calc(100% - 20px);background:#fff;color:#1c1f26;border-radius:12px;box-shadow:0 12px 30px #0009;padding:12px 14px;z-index:6;display:flex;flex-direction:column;gap:6px;font-size:12px}
  html.pd-dark .qp-set{background:#1d2027;color:#e6e8ee}
  .qp-set[hidden]{display:none}
  .qp-set label{display:flex;align-items:center;gap:8px;justify-content:space-between}
  .qp-set select{width:150px;background:inherit;color:inherit;border:1px solid #c5c9d2}
  .qp-set small{color:#6a7080}
  :fullscreen{background:#000}
  :fullscreen .qp-stage video{max-height:calc(100vh - 140px)!important}
  .qp-grip{display:none}
  [data-qpfs=top]{display:flex;flex-direction:column}
  [data-qpfs=top] .qp-ui{order:-2}
  [data-qpfs=float] .qp-ui{position:absolute;left:50%;bottom:16px;margin-left:calc(min(960px,96vw) / -2);width:min(960px,96vw);background:#000d;border-radius:12px;z-index:30;transition:opacity .25s}
  [data-qpfs=float] .qp-ui.qp-fshide{opacity:0;pointer-events:none}
  [data-qpfs=float] .qp-stage video{max-height:100vh!important}
  [data-qpfs=float] .qp-grip{display:flex;justify-content:space-between;align-items:center;padding:4px 10px;background:#ffffff14;border-radius:12px 12px 0 0;cursor:move;font:11px system-ui,sans-serif;color:#aab;touch-action:none;user-select:none}
  [data-qpfs=float] .qp-grip button{height:22px;padding:0 8px;border-radius:6px;border:1px solid #ffffff33;background:#232833;color:#dfe2ea;font:600 11px system-ui,sans-serif;cursor:pointer}
  #pd-player .pl:fullscreen{width:100vw;border-radius:0}
  .pd-sk{position:relative;height:16px;padding:5px 12px;background:#000;cursor:pointer}
  .pd-sk > .sktr{position:relative;height:6px;border-radius:3px;background:#3a3f4b;overflow:hidden}
  .pd-sk:hover > .tr{height:8px;margin-top:-1px}
  .pd-sk > .sktr i{position:absolute;left:0;top:0;bottom:0;width:0}
  .pd-sk .skb{background:#5a6070}
  .pd-sk .skp{background:#306fff}
  .pd-sk > .sktr i.skz{background:#f5a62499;box-shadow:inset 0 0 0 1px #f5a624;z-index:2}
  .pd-sk > .sktr i.ska{width:3px;background:#f5a624;z-index:3}
  .qp-notes{position:absolute;left:12px;top:36px;display:flex;flex-direction:column;align-items:flex-start;gap:6px;z-index:5;pointer-events:none}
  .qp-note{display:flex;align-items:center;gap:10px;padding:7px 8px 7px 12px;border-radius:10px;background:#000c;color:#fff;font:600 12px system-ui,sans-serif;pointer-events:auto;box-shadow:0 4px 14px #0006}
  .qp-note button{font:inherit;font-weight:700;padding:3px 10px;border-radius:7px;border:0;background:#306fff;color:#fff;cursor:pointer}
  .qp-hold{position:absolute;left:50%;top:16px;transform:translateX(-50%);padding:6px 16px;border-radius:999px;background:#000b;color:#fff;font:700 15px system-ui,sans-serif;pointer-events:none;z-index:5}
  .qp-hold[hidden]{display:none}
  .qp-ctl button[data-qp=ab].on{background:#f5a624!important;color:#111!important}
  .qp-ctl button[data-qp=scene].on,.qp-ctl button[data-qp=skim].on{background:#306fff!important}
  .qp-tri{display:flex;align-items:center;gap:8px;padding:8px 12px;background:#14171d;border-top:1px solid #ffffff14;font:12px system-ui,sans-serif;color:#aab;flex-wrap:wrap}
  .qp-tri[hidden]{display:none}
  .qp-tri b{color:#8b91a1;font-weight:700;margin-right:4px}
  .qp-tri button{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border-radius:8px;border:1px solid #ffffff22;background:#232833;color:#dfe2ea;font:600 12px system-ui,sans-serif;cursor:pointer}
  .qp-tri button kbd{font:700 11px ui-monospace,monospace;padding:1px 5px;border-radius:4px;background:#ffffff1a}
  .qp-tri button.k.on{background:#1f3b2c;border-color:#3fbf7f;color:#7fe0a6}
  .qp-tri button.d.on{background:#3d2224;border-color:#e05a5a;color:#ff9b9b}
  .qp-tri button.s.on{background:#3a3320;border-color:#f5a624;color:#f5c46a}
  .qp-tri .sp{flex:1}
  .qp-skim{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);width:min(520px,80%);padding:8px 12px;border-radius:10px;background:#000c;color:#fff;font:600 12px system-ui,sans-serif;z-index:5;pointer-events:none}
  .qp-skim div{pointer-events:auto}.qp-skim i{cursor:pointer}.qp-skim i:hover{outline:2px solid #fff8}
  .qp-skim[hidden]{display:none}
  .qp-skim div{display:flex;gap:3px;margin-top:6px}
  .qp-skim i{flex:1;height:10px;border-radius:2px;background:#ffffff2a}
  .qp-skim i.p{background:#306fff}
  .qp-skim i.c{background:#7fb0ff}
  .qp-ctl button[data-qp=sklist]{background:#f5a62433!important;color:#f5c46a!important;font-size:12px}
  .qp-ctl button[data-qp=sklist][hidden]{display:none}
  .qp-ctl button svg.ic,.pl-h button svg.ic,.ql-h button svg.ic,.ql-acts button svg.ic,.qp-scn-h button svg.ic{width:20px;height:20px;display:block;flex:none}
  .pl-h button:has(> svg.ic:only-child),.ql-h button:has(> svg.ic:only-child),.ql-acts button:has(> svg.ic:only-child){min-width:34px;display:inline-flex;align-items:center;justify-content:center}
  .pd-sk > .sktr i.skt{width:2px;background:#ffffffb0;z-index:3}
  .qp-scn{position:absolute;right:0;top:0;bottom:0;width:min(210px,40%);display:flex;flex-direction:column;background:#0d0f14e6;border-left:1px solid #ffffff1a;z-index:6;cursor:default;font:12px system-ui,sans-serif;color:#dfe2ea}
  .qp-scn-h{display:flex;align-items:center;gap:8px;padding:8px 10px;flex:none}
  .qp-scn-h small{color:#8b91a1;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .qp-scn-h button{border:0;background:transparent;color:#dfe2ea;cursor:pointer;font-size:13px}
  .qp-scn-l{flex:1;min-height:0;overflow:auto;padding:0 8px 8px;display:flex;flex-direction:column;gap:6px;overscroll-behavior:contain}
  .qp-scn-l button{display:flex;flex-direction:column;gap:3px;height:auto!important;min-height:0;width:100%;padding:4px;border-radius:8px;border:2px solid transparent;background:transparent;color:inherit;cursor:pointer;text-align:left;font:inherit;flex:none}
  .qp-scn-l button:hover{background:#ffffff14}
  .qp-scn-l button.cur{border-color:#306fff}
  .qp-scn-l .im{width:100%;height:auto;flex:none;display:flex;align-items:center;justify-content:center;aspect-ratio:16/9;border-radius:6px;overflow:hidden;background:#1c212b;color:#6a7080}
  .qp-scn-l .im canvas{width:100%;height:100%;object-fit:cover;display:block}
  .pd-sk .tip{position:absolute;bottom:24px;width:210px;padding:4px;box-sizing:border-box;background:#000;border:2px solid #fff;border-radius:8px;box-shadow:0 6px 18px #000a;pointer-events:none;z-index:5;text-align:center}
  .pd-sk .tip[hidden]{display:none}
  .pd-sk .tip canvas{display:block;width:100%;height:auto;border-radius:4px}
  .pd-sk .tip b{display:block;font:600 11px ui-monospace,Menlo,monospace;color:#fff;padding-top:2px}
  #pd-ql .ql-acts select,#pd-player .pl-h select[data-rate]{min-width:64px}
  #pd-frames{position:fixed;inset:0;z-index:100007;background:#0009;display:flex;align-items:center;justify-content:center;font:13px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Meiryo",sans-serif;color:#e6e8ee}
  #pd-frames .fr-box{width:min(1400px,96vw);max-height:94vh;display:flex;flex-direction:column;background:#1d2027;border-radius:14px;box-shadow:0 18px 50px #000a;overflow:hidden}
  #pd-frames .fr-hd{display:flex;align-items:center;gap:10px;padding:12px 18px;border-bottom:1px solid #2c303a}
  #pd-frames .fr-hd b{font-size:16px}
  #pd-frames .sp{flex:1}
  #pd-frames .note{color:#8b91a1;font-size:12px}
  #pd-frames button{height:32px;padding:0 12px;border:1px solid #3a3f4b;border-radius:8px;background:#252932;color:#e6e8ee;font:inherit;cursor:pointer}
  #pd-frames button:disabled{opacity:.45;cursor:default}
  #pd-frames .seg{display:inline-flex}
  #pd-frames .seg button{border-radius:0;margin-left:-1px}
  #pd-frames .seg button:first-child{border-radius:8px 0 0 8px}
  #pd-frames .seg button:last-child{border-radius:0 8px 8px 0}
  #pd-frames .seg button.on{background:#306fff;border-color:#306fff;color:#fff;font-weight:700}
  #pd-frames button.x{width:32px;padding:0;border:0;background:none;display:inline-flex;align-items:center;justify-content:center;color:#8b91a1}
  #pd-frames button.x svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
  #pd-frames .fr-cols{display:grid;overflow:auto;flex:1 1 auto}
  #pd-frames .fr-col{padding:12px 14px;border-right:1px solid #2c303a;min-width:0}
  #pd-frames .fr-col:last-child{border-right:0}
  #pd-frames .fr-meta{display:flex;align-items:center;gap:8px;margin-bottom:8px}
  #pd-frames .fr-meta b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-frames .fr-tag{font-size:11px;padding:1px 8px;border-radius:99px;font-weight:700}
  #pd-frames .fr-tag.keep{background:#17331f;color:#6fdc9a}
  #pd-frames .fr-tag.del{background:#3a1a1a;color:#ff8a80}
  #pd-frames .fr-grid{display:grid;gap:5px}
  #pd-frames .fr-c{position:relative;height:auto;aspect-ratio:16/9;padding:0;border:0;border-radius:6px;background:#2b2f39;overflow:hidden}
  #pd-frames .fr-c canvas{display:block;width:100%;height:100%;object-fit:cover}
  #pd-frames .fr-c.on{outline:3px solid #306fff;outline-offset:-1px}
  #pd-frames .fr-c .t{position:absolute;left:4px;bottom:3px;font:600 10px ui-monospace,Menlo,monospace;color:#fff;text-shadow:0 1px 2px #000}
  #pd-frames .fr-msg{min-height:18px;margin-top:6px}
  #pd-frames .fr-acts{display:flex;gap:8px;margin-top:6px}
  #pd-frames .fr-ft{padding:8px 18px;border-top:1px solid #2c303a}
  #pd-unzip,  #pd-lib{position:fixed;inset:0;z-index:100005;background:#14161b80;display:flex;align-items:center;justify-content:center;font:13px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Meiryo","Noto Sans CJK JP",sans-serif;color:var(--fg)}
  #pd-unzip .lk-hd,#pd-unzip .lk-ft,  #pd-lib .lk-hd,#pd-lib .lk-ft{display:flex;align-items:center;gap:10px}
  #pd-unzip .lk-ft,  #pd-lib .lk-ft{padding:12px 18px;border-top:1px solid var(--line)}
  #pd-unzip .lk-ft .tx,  #pd-lib .lk-ft .tx{flex:1;min-width:0;color:var(--mute)}
  #pd-unzip .lk-ft .tx b,  #pd-lib .lk-ft .tx b{color:var(--fg)}
  html.pd-dark #pd-unzip .lk-tag.ok,  html.pd-dark #pd-lib .lk-tag.ok{background:#17331f;color:#6fdc9a}
  html.pd-dark #pd-unzip .lk-tag.warn,  html.pd-dark #pd-lib .lk-tag.warn{background:#3a2c12;color:#f0c46c}
  html.pd-dark #pd-unzip .lk-tag.del,  html.pd-dark #pd-lib .lk-tag.del{background:#3a1a1a;color:#ff8a80}
  #pd-unzip .uz-row,  #pd-lib .uz-row{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:10px 12px;background:var(--panel);border:1px solid var(--line);border-radius:10px}
  #pd-unzip .uz-ext,  #pd-lib .uz-ext{width:34px;height:34px;flex:none;border-radius:8px;background:#fff3dc;color:#8a5600;font:700 10px ui-monospace,monospace;display:inline-flex;align-items:center;justify-content:center}
  html.pd-dark #pd-unzip .uz-ext,  html.pd-dark #pd-lib .uz-ext{background:#3a2c12;color:#f0c46c}
  #pd-unzip .uz-t,  #pd-lib .uz-t{flex:1 1 260px;min-width:0;display:flex;flex-direction:column}
  #pd-unzip .uz-t b,  #pd-lib .uz-t b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-unzip .uz-t small,  #pd-lib .uz-t small{color:var(--mute);font-size:12px}
  #pd-unzip .uz-pw,  #pd-lib .uz-pw{display:flex;gap:6px}
  #pd-unzip .uz-pw input,  #pd-lib .uz-pw input{width:160px;height:32px;box-sizing:border-box;padding:0 10px;border:1px solid var(--ctl-line);border-radius:7px;background:var(--ctl);color:inherit;font:inherit}
  #pd-unzip .uz-bar,  #pd-lib .uz-bar{flex:0 0 180px;height:6px;border-radius:3px;background:var(--line);overflow:hidden}
  #pd-unzip .uz-bar i,  #pd-lib .uz-bar i{display:block;height:100%;background:var(--pri);transition:width .3s}
  #pd-lib .lb-tabs{display:flex;gap:4px;padding:8px 14px 0;border-bottom:1px solid var(--line);overflow-x:auto}
  #pd-lib .lb-tab{height:auto!important;display:flex;align-items:center;gap:6px;padding:8px 12px!important;border:0!important;border-bottom:2px solid transparent!important;border-radius:0!important;background:none!important;color:var(--mute)!important}
  #pd-lib .lb-tab.on{color:var(--pri)!important;border-bottom-color:var(--pri)!important}
  #pd-lib .lb-tab svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
  #pd-lib .lb-tab i{font-style:normal;font-size:11px;padding:0 6px;border-radius:99px;background:var(--pri-soft);color:var(--pri)}
  #pd-lib .lb-note{padding:8px 18px;color:var(--mute);font-size:12px;border-bottom:1px solid var(--line)}
  #pd-lib .lk-list{gap:6px}
  #pd-lib .lb-row{display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--panel);border:1px solid var(--line);border-radius:10px}
  #pd-lib .lb-t{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
  #pd-lib .lb-t b,#pd-lib .lb-t small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-lib .lb-t small{color:var(--mute);font-size:12px}
  #pd-lib .lb-t .uz-bar{flex:none;width:100%;max-width:320px}
  #pd-lib .lb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(176px,1fr));gap:12px}
  #pd-lib .lb-card{display:flex;flex-direction:column;background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden;cursor:pointer;outline:none;user-select:none}
  #pd-lib .lb-card:hover{border-color:var(--ctl-line)}
  #pd-lib .lb-card.cur,#pd-lib .lb-card:focus-visible{border-color:var(--pri);box-shadow:0 0 0 2px var(--pri-soft)}
  #pd-lib .lb-th{position:relative;aspect-ratio:16/9;background:var(--panel2);display:flex;align-items:center;justify-content:center}
  #pd-lib .lb-th img{width:100%;height:100%;object-fit:cover;display:block}
  #pd-lib .lb-th .ph svg{width:34px;height:42px}
  #pd-lib .lb-prog{position:absolute;left:0;bottom:0;height:4px;background:#306fff;z-index:1}
  #pd-lib .lb-prog.done{background:#8b91a1}
  #pd-lib .lb-tri{position:absolute;right:6px;top:6px;font-size:11px;font-weight:700;padding:2px 7px;border-radius:6px;z-index:1}
  #pd-lib .lb-tri.keep{background:#1f3b2c;color:#7fe0a6}
  #pd-lib .lb-tri.del{background:#3d2224;color:#ff9b9b}
  #pd-lib .lb-li .th .lb-prog{height:3px}
  #pd-lib .lb-th .lb-play{position:absolute;right:6px;bottom:6px;font-size:10px;padding:2px 6px;border-radius:6px;background:#000a;color:#fff}
  #pd-lib .lb-th input{position:absolute;left:6px;top:6px;width:18px;height:18px;margin:0}
  #pd-lib .lb-ct{padding:7px 9px;display:flex;flex-direction:column;gap:2px;min-width:0}
  #pd-lib .lb-ct b{font-size:12px;font-weight:600;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-all}
  #pd-lib .lb-ct small{color:var(--mute);font-size:11px}
  #pd-lib .lk-ft .lb-sel{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-lib button.sub:where(:not(.pv *)){border-color:transparent;background:none;color:var(--mute);font-weight:500}
  #pd-lib .lb-pv{position:fixed;inset:0;z-index:1;background:#000a;display:flex;align-items:center;justify-content:center}
  /* メインの画面に広げているときは、左メニューに隠れないよう一覧の範囲だけに重ねる */
  #pd-lib.emb .lb-pv{position:absolute;z-index:6}
  #pd-lib.emb .lb-pvbox{max-width:calc(100% - 24px);max-height:calc(100% - 24px)}
  #pd-lib.emb .lb-pvv{flex:0 1 auto;min-height:120px;max-height:none}
  #pd-lib.emb .lb-pvbox > *:not(.lb-pvv){flex:none}
  #pd-lib .lb-pvbox{width:min(960px,96vw);max-height:94vh;display:flex;flex-direction:column;background:#14171d;color:#e8eaf0;border-radius:14px;overflow:hidden;box-shadow:0 18px 50px #0008}
  #pd-lib .lb-pvbox .lk-hd b{font-size:14px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-lib .lb-pvv{position:relative;background:#000;aspect-ratio:16/9;max-height:70vh;display:flex;align-items:center;justify-content:center;color:#ccc}
  #pd-lib .lb-pvv video{width:100%;height:100%;background:#000}
  #pd-lib .lb-pvv .pl-msg{position:absolute;inset:0 0 auto;background:#000b;padding:10px 14px;text-align:center}
  #pd-lib .lb-pvft{display:flex;align-items:center;gap:8px;padding:10px 18px;flex-wrap:wrap}
  #pd-lib .lb-pvft select{border:1px solid #8886;background:transparent;color:inherit;border-radius:8px;padding:6px 8px;font:inherit;max-width:200px}
  #pd-lib .lb-pvft select option{color:#1c1f26}
  #pd-lib .lb-pvft .tx{flex:1 1 300px;min-width:0;color:var(--mute);font-size:12px}
  #pd-lib .lb-pvft .tx b{color:var(--fg)}
  #pd-lib .lb-all{display:flex;gap:6px;align-items:center}
  #pd-lib .lk-ft{display:flex;align-items:center;gap:8px;padding:12px 18px;border-top:1px solid var(--line);flex-wrap:wrap}
  #pd-lib .lk-ft .tx{flex:1;min-width:0;color:var(--mute)}
  #pd-lib button.dng{border-color:var(--danger);color:var(--danger)}
  #pd-lib .seg{display:inline-flex;gap:4px}
  #pd-lib .seg button.on{background:var(--pri-soft);border-color:var(--pri);color:var(--pri)}
  html.pd-dark #pd-lib .lk-tag.ok{background:#17331f;color:#6fdc9a}
  html.pd-dark #pd-lib .lk-tag.del{background:#3a1a1a;color:#ff8a80}
  #ppdup .rail{overflow-y:auto;scrollbar-width:none}
  #ppdup .rail .rb{position:absolute;top:3px;right:6px;font-style:normal;font-size:10px;line-height:15px;min-width:15px;padding:0 4px;box-sizing:border-box;border-radius:99px;background:var(--pri);color:#fff}
  #ppdup .rail .rb:empty{display:none}
  #ppdup .pd-rsban{display:flex;align-items:center;gap:12px;padding:10px 18px;background:#fff4dc;color:#5c3d00;border-bottom:1px solid #f0d9a6;font-size:13px}
  #ppdup .pd-rsban[hidden]{display:none}
  #ppdup .pd-rsban .ic{width:28px;height:28px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;flex:none}
  #ppdup .pd-rsban .tx{flex:1;min-width:0;display:flex;flex-direction:column}
  #ppdup .pd-rsban small{opacity:.8}
  #ppdup .pd-rsban button{height:34px;padding:0 14px;border:1px solid #d9b56a;border-radius:17px;background:#fff;color:inherit;font:inherit;font-weight:700;cursor:pointer;white-space:nowrap}
  #ppdup .pd-rsban button.pri{background:#306fff;border-color:#306fff;color:#fff}
  html.pd-dark #ppdup .pd-rsban{background:#3a2c12;color:#f0d9a6;border-color:#5c4518}
  html.pd-dark #ppdup .pd-rsban .ic,html.pd-dark #ppdup .pd-rsban button:not(.pri){background:#252932;border-color:#5c4518}
  #ppdup .pd-upd{display:flex;align-items:center;gap:12px;padding:8px 18px;background:#e8f0ff;color:#1c3d8f;border-bottom:1px solid #c6d6ff;font-size:13px}
  #ppdup .pd-upd[hidden]{display:none}
  #ppdup .pd-upd span{flex:1;min-width:0}
  #ppdup .pd-upd a{color:inherit;font-weight:700}
  #ppdup .pd-upd button{border:0;background:none;color:inherit;cursor:pointer;text-decoration:underline}
  html.pd-dark #ppdup .pd-upd{background:#1f2a44;color:#bcd0ff;border-color:#2f4a8a}
  #pd-add{position:fixed;inset:0;z-index:100005;background:#14161b80;display:flex;align-items:center;justify-content:center;font:13px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Meiryo","Noto Sans CJK JP",sans-serif;color:var(--fg)}
  #pd-add.drop .lk-box{outline:3px dashed var(--pri);outline-offset:-8px}
  #pd-add .lk-box,#pd-unzip .lk-box,#pd-lib .lk-box{width:min(980px,96vw);max-height:92vh;display:flex;flex-direction:column;background:var(--panel);border-radius:14px;box-shadow:0 18px 50px #0006;overflow:hidden}
  #pd-add .lk-hd,#pd-add .lk-ft,#pd-add .lk-row,#pd-add .lk-h{display:flex;align-items:center;gap:10px}
  #pd-add .lk-hd,#pd-unzip .lk-hd,#pd-lib .lk-hd{padding:12px 18px;border-bottom:1px solid var(--line)}
  #pd-add .lk-hd b,#pd-unzip .lk-hd b,#pd-lib .lk-hd b{font-size:16px}
  #pd-add .sp,#pd-unzip .sp,#pd-lib .sp{flex:1}
  #pd-add .note,#pd-unzip .note,#pd-lib .note{color:var(--mute);font-size:12px}
  #pd-add select{max-width:380px;height:32px;border:1px solid var(--ctl-line);border-radius:8px;background:var(--ctl);color:inherit;font:inherit;padding:0 8px}
  #pd-add button,#pd-unzip button,#pd-lib button:where(:not(.pv *)){white-space:nowrap;height:34px;padding:0 14px;border:1px solid var(--ctl-line);border-radius:8px;background:var(--ctl);color:inherit;font:inherit;font-weight:600;cursor:pointer}
  #pd-add button.pri,#pd-unzip button.pri,#pd-lib button.pri:where(:not(.pv *)){background:var(--pri);border-color:var(--pri);color:#fff;font-weight:700}
  #pd-add button:disabled,#pd-unzip button:disabled,#pd-lib button:disabled:where(:not(.pv *)){opacity:.45;cursor:default}
  #pd-add button.x,#pd-unzip button.x,#pd-lib button.x{width:32px;padding:0;border:0;background:none;display:inline-flex;align-items:center;justify-content:center;color:var(--mute)}
  #pd-add button.x svg,#pd-unzip button.x svg,#pd-lib button.x svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
  #pd-add .lk-in{padding:12px 18px;display:flex;flex-direction:column;gap:8px;border-bottom:1px solid var(--line)}
  #pd-add textarea{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid var(--ctl-line);border-radius:9px;background:var(--ctl);color:inherit;font:500 12px/1.6 ui-monospace,Menlo,Consolas,monospace;resize:vertical}
  #pd-add .lk-msg{padding:8px 12px;border-radius:8px;background:var(--pri-soft);font-weight:600}
  #pd-add .lk-list,#pd-unzip .lk-list,#pd-lib .lk-list{flex:1 1 auto;overflow:auto;padding:12px 18px;background:var(--bg);display:flex;flex-direction:column;gap:10px;min-height:120px}
  #pd-add .lk-list .empty,#pd-unzip .lk-list .empty,#pd-lib .lk-list .empty{color:var(--mute);text-align:center;padding:30px 0}
  #pd-add .lk-it{background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden}
  #pd-add .lk-it.ex{border-color:#f0d9a8}
  #pd-add .lk-h,#pd-unzip .lk-h,#pd-lib .lk-h{padding:9px 12px;background:var(--panel2)}
  #pd-add .lk-h b,#pd-unzip .lk-h b,#pd-lib .lk-h b{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:50%}
  #pd-add .lk-h .note,#pd-unzip .lk-h .note,#pd-lib .lk-h .note{text-align:right;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-add .lk-note{padding:6px 12px;font-size:12px;color:#8a5600;background:#fff8e6}
  html.pd-dark #pd-add .lk-note{color:#f0c46c;background:#3a2c12}
  #pd-add .lk-f{display:flex;align-items:center;gap:10px;padding:5px 12px;border-top:1px solid var(--line);cursor:pointer}
  #pd-add .lk-f.dis{opacity:.5;cursor:default}
  #pd-add .lk-f .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-add .lk-f .nm i{font-style:normal;color:var(--mute)}
  #pd-add .lk-f .sz{width:80px;text-align:right;color:var(--mute);font-size:12px}
  #pd-add .lk-prog{margin-top:10px;padding:12px 14px;border-radius:12px;background:var(--pri-soft);display:flex;flex-direction:column;gap:6px}
  #pd-add .lk-prog .hd{display:flex;align-items:center;gap:8px}
  #pd-add .lk-prog .sp{flex:1}
  #pd-add .lk-prog .eta{font-size:12px;color:var(--mute);font-weight:700}
  #pd-add .lk-prog .bar{height:6px;border-radius:3px;background:var(--line);overflow:hidden}
  #pd-add .lk-prog .bar i{display:block;height:100%;background:var(--pri);transition:width .3s}
  #pd-add .lk-prog small{color:var(--mute);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-add .lk-prog .spin{width:14px;height:14px;border:2px solid var(--pri);border-right-color:transparent;border-radius:50%;animation:pdspin .8s linear infinite;flex:none}
  @keyframes pdspin{to{transform:rotate(360deg)}}
  /* 項目が多くても一つ一つが縦に押しつぶされないように（一覧だけをスクロール） */
  #pd-add .lk-list > *,#pd-unzip .lk-list > *,#pd-lib .lk-list > *{flex:none}
  #pd-add .lk-box > :not(.lk-list),#pd-unzip .lk-box > :not(.lk-list){flex:none}
  #pd-add .lk-list,#pd-unzip .lk-list{min-height:0}
  #pd-add .lk-done{margin:auto;max-width:560px;width:100%;display:flex;flex-direction:column;align-items:center;gap:8px;padding:24px;text-align:center}
  #pd-add .lk-done .ic{width:56px;height:56px;border-radius:50%;background:#e3f6ec;color:#17703f;font:800 28px/56px system-ui,sans-serif}
  html.pd-dark #pd-add .lk-done .ic{background:#17331f;color:#6fdc9a}
  #pd-add .lk-done b{font-size:17px}
  #pd-add .lk-done small{color:var(--mute);font-size:12px}
  #pd-add .lk-done ul{margin:6px 0 0;padding:10px 14px;list-style:none;width:100%;box-sizing:border-box;background:var(--panel);border:1px solid var(--line);border-radius:12px;text-align:left;font-size:12px}
  #pd-add .lk-done li{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:3px 0}
  #pd-add .lk-tag,#pd-unzip .lk-tag,#pd-lib .lk-tag{font-size:11px;padding:1px 8px;border-radius:99px;font-weight:700;white-space:nowrap;background:var(--panel2);color:var(--mute)}
  #pd-add .lk-tag.ok,#pd-unzip .lk-tag.ok,#pd-lib .lk-tag.ok{background:#e3f6ec;color:#17703f}
  #pd-add .lk-tag.pri,#pd-unzip .lk-tag.pri,#pd-lib .lk-tag.pri{background:var(--pri-soft);color:var(--pri)}
  #pd-add .lk-tag.warn,#pd-unzip .lk-tag.warn,#pd-lib .lk-tag.warn{background:#fff3dc;color:#8a5600}
  #pd-add .lk-tag.del,#pd-unzip .lk-tag.del,#pd-lib .lk-tag.del{background:#fde8e8;color:#b42318}
  html.pd-dark #pd-add .lk-tag.ok{background:#17331f;color:#6fdc9a}
  html.pd-dark #pd-add .lk-tag.warn{background:#3a2c12;color:#f0c46c}
  html.pd-dark #pd-add .lk-tag.del{background:#3a1a1a;color:#ff8a80}
  #pd-add .lk-ft{padding:12px 18px;border-top:1px solid var(--line)}
  #pd-add .lk-ft .tx{flex:1;min-width:0;color:var(--mute)}
  #pd-add .lk-ft .tx b{color:var(--fg)}
  #pd-add input[type=checkbox],#pd-unzip input[type=checkbox],#pd-lib input[type=checkbox]{width:16px;height:16px;accent-color:var(--pri);flex:none}
  .st-bar{position:sticky;bottom:0;z-index:3;display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin:14px 0 0;padding:10px 14px;background:#1c1f26;color:#fff;border-radius:12px;box-shadow:0 10px 30px #0004}
  html.pd-dark .st-bar{background:#2b3040}
  .st-bar.hide{display:none}
  .st-bar .tx{flex:1 1 280px;min-width:0;display:flex;flex-direction:column}
  .st-bar .tx small{color:#b6bbc7;font-size:12px}
  .st-bar .acts{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  .st-bar button:not(.pri):not(.danger){background:transparent !important;color:#fff !important;border-color:#5a6070 !important}
  .st-bar .okbadge{color:#6fdc9a}
  .st-res{display:flex;align-items:center;gap:10px;margin:0 0 12px;padding:10px 14px;border-radius:10px;background:#e3f6ec;color:#17703f;font-weight:600}
  .st-res.warn{background:#fff3dc;color:#8a5600}
  html.pd-dark .st-res{background:#17331f;color:#6fdc9a}
  html.pd-dark .st-res.warn{background:#3a2c12;color:#f0c46c}
  .st-res .ic{width:22px;height:22px;flex:none;border-radius:50%;background:currentColor;display:inline-flex;align-items:center;justify-content:center}
  .st-res .ic{color:inherit}
  .st-res .tx{flex:1;min-width:0}
  .st-res button{width:28px;height:28px;padding:0 !important;border:0 !important;background:none !important;color:inherit !important;display:inline-flex;align-items:center;justify-content:center}
  .st-res button svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
  .sl-chip{display:flex;flex-direction:column;gap:2px;min-width:150px;padding:8px 14px;border-radius:12px;background:var(--panel);border:1px solid var(--line);border-left:4px solid var(--line)}
  .sl-chip span,.sl-chip small{font-size:12px;color:var(--mute)}
  .sl-chip b{font-size:22px;line-height:1.1}
  .pd-g.warn{border-color:#e9c98a}.pd-g.warn .pd-gh{background:#fff6e3}
  html.pd-dark .pd-g.warn{border-color:#6b5426}html.pd-dark .pd-g.warn .pd-gh{background:#2e2716}
  .pd-g.pend{opacity:.85}
  .pd-th img{width:100%;height:100%;object-fit:cover}
  /* 一覧 */
  .pd-g{background:var(--panel);border:1px solid var(--line);border-radius:10px;margin-bottom:12px;overflow:hidden}
  .pd-gh{padding:8px 12px;background:var(--panel2);font-weight:600;display:flex;gap:10px;align-items:center}
  .pd-tag{font-size:11px;padding:1px 7px;border-radius:999px;background:#ffe7b8;color:#7a4b00;font-weight:600}
  .pd-row{display:flex;gap:12px;padding:10px 12px;border-top:1px solid var(--line);align-items:center}
  .pd-row.keep{background:var(--keep)}.pd-row.del{background:var(--del)}.pd-row.sel{background:var(--pri-soft)}
  .pd-row.sel .pd-chk input{accent-color:var(--pri)}
  .pd-th{width:160px;height:90px;border-radius:6px;background:#d8dbe2;flex:none;position:relative;overflow:hidden}
  .pd-th img{width:100%;height:100%;object-fit:cover;display:block}
  .pd-th:hover img{position:fixed;z-index:100000;left:50%;top:50%;transform:translate(-50%,-50%);width:auto;height:auto;max-width:80vw;max-height:80vh;box-shadow:0 8px 40px #000a;border-radius:8px}
  .pd-info{flex:1;min-width:0}
  .pd-name{font-weight:600;word-break:break-all}
  .pd-path{color:var(--mute);font-size:12px;word-break:break-all}
  .pd-bar{height:6px;border-radius:3px;background:var(--line);margin-top:6px;max-width:320px}
  .pd-bar i{display:block;height:100%;border-radius:3px;background:var(--pri)}
  .pd-sz{width:130px;text-align:right;flex:none}
  .pd-sz b{font-size:15px}
  .pd-act{flex:none}
  .pd-chk{flex:none;display:flex;align-items:center;justify-content:center;width:34px;align-self:stretch;cursor:pointer}
  .pd-chk input{width:20px;height:20px;cursor:pointer;accent-color:var(--danger)}
  #pd-dlg .logs{max-height:55vh;overflow:auto;font:12px/1.5 ui-monospace,Menlo,monospace;border:1px solid #c5c9d288;border-radius:8px;padding:8px;margin:10px 0;white-space:pre-wrap;word-break:break-all}
  #pd-dlg .logs .error{color:#d93025}#pd-dlg .logs .warn{color:#b26a00}
  /* フォルダ一覧（Finder / エクスプローラーのリスト表示風） */
  #ppdup main:has(.tr){padding:0}
  .tr{outline:none;font:13px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Yu Gothic","Meiryo","Noto Sans CJK JP","Noto Sans JP",sans-serif;min-height:100%;background:var(--panel);user-select:none}
  .tr-h,.tr-row{display:grid;grid-template-columns:var(--tcols,minmax(140px,1fr) 100px 110px) 28px;align-items:center}
  .tr-row .nm{flex:1 1 auto;min-width:40px}
  .tr-row .c-date{color:var(--mute);font-size:12px}
  .tr-h span{position:relative}
  .tr-h .cr{position:absolute;left:-4px;top:4px;bottom:4px;width:8px;cursor:col-resize;z-index:2}
  .tr-h .cr:hover,.tr-h .cr.on{background:linear-gradient(90deg,transparent 3px,var(--pri) 3px,var(--pri) 5px,transparent 5px)}
  .tr-h .c-pick{height:22px;width:24px;padding:0!important;border:0!important;background:transparent!important;color:var(--mute);cursor:pointer;font-size:14px}
  .tr-h .c-pick:hover{color:var(--fg)}
  .pd-colmenu{position:fixed;z-index:2147483646;background:var(--panel);color:var(--fg);border:1px solid var(--line);border-radius:10px;box-shadow:0 10px 30px #0005;padding:8px;display:flex;flex-direction:column;gap:2px;font-size:13px;min-width:180px}
  .pd-colmenu label{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;cursor:pointer}
  .pd-colmenu label:hover{background:var(--panel2)}
  .pd-colmenu small{color:var(--mute);padding:4px 8px}
  /* ---- まとめて整理 ---- */
  #ppdup .op{margin:0 0 18px;padding:16px 18px;border-radius:18px;background:var(--panel);border:1px solid var(--line);display:flex;flex-direction:column;gap:12px}
  #ppdup .op-hd{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}
  #ppdup .op-hd b{font-size:17px}
  #ppdup .op-base{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:12px;background:var(--pri-soft);flex-wrap:wrap}
  #ppdup .op-base span{flex:1 1 300px}
  #ppdup .op-auto{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
  #ppdup .op-a{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:10px 12px;border-radius:12px;border:1px solid var(--line);background:var(--panel2);color:var(--fg);font:inherit;text-align:left;cursor:pointer}
  #ppdup .op-a span{font-size:12px;color:var(--mute)}
  #ppdup .op-a b{font-size:20px}
  #ppdup .op-a b small{font-size:12px;font-weight:600}
  #ppdup .op-a em{font-style:normal;font-size:11px;color:var(--mute)}
  #ppdup .op-a.zero{opacity:.55}
  #ppdup .op-q{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  #ppdup .op-q button{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;border:1px solid var(--line);background:var(--panel2);color:var(--fg);font:inherit;cursor:pointer;white-space:nowrap}
  #ppdup .op-q button i{font-style:normal;font-weight:800;color:#c2561a}
  #ppdup .op-rvs{display:flex;flex-direction:column;gap:8px}
  #ppdup .op-rv{border:1px solid var(--line);border-radius:12px;padding:8px 10px;background:var(--panel2)}
  #ppdup .op-rvh{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  #ppdup .op-rvh .sp{flex:1}
  #ppdup .op-rf{display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:10px;padding:4px 2px;font-size:12px}
  #ppdup .op-rf span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #ppdup .op-rf small{grid-column:1;color:var(--mute);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #ppdup .op-rf em{grid-row:1/3;grid-column:2;font-style:normal;color:var(--mute);align-self:center;white-space:nowrap}
  #ppdup .op-run{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;background:var(--panel2);flex-wrap:wrap}
  #ppdup .op-run .sp{flex:1}
  #ppdup .op button.pri{background:var(--pri);border-color:var(--pri);color:#fff;font-weight:800;padding:9px 16px;border-radius:10px;border:1px solid var(--pri);cursor:pointer}
  #ppdup .op button.pri:disabled{opacity:.45;cursor:default}

  /* ---- 見比べ ---- */
  #pd-cmp{position:fixed;inset:0;z-index:100003;background:#000d;display:flex;align-items:center;justify-content:center;font:13px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI",sans-serif;color:#eee}
  #pd-cmp .cm{width:min(1500px,98vw);max-height:96vh;display:flex;flex-direction:column;background:#111;border-radius:12px;overflow:hidden;box-shadow:0 20px 60px #000}
  #pd-cmp .cm-h{display:flex;align-items:center;gap:8px;padding:8px 10px;background:#1d1f24;flex-wrap:wrap}
  #pd-cmp .cm-h .note{color:#8b91a1}
  #pd-cmp .sp{flex:1}
  #pd-cmp button{font:inherit;background:#2b2e35;color:#eee;border:1px solid #3a3f4b;border-radius:8px;padding:5px 12px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
  #pd-cmp button.on{background:#306fff;border-color:#306fff}
  #pd-cmp button[hidden]{display:none}
  #pd-cmp .qp-tri{display:none}
  #pd-cmp button svg.ic{width:18px;height:18px}
  #pd-cmp button.x{padding:5px 8px}
  #pd-cmp .cm-ps{display:flex;gap:6px;padding:6px;min-height:0;flex:1 1 auto}
  #pd-cmp .cm-p{flex:1 1 0;min-width:0;display:flex;flex-direction:column;background:#000;border-radius:8px;overflow:hidden;box-shadow:0 0 0 2px transparent}
  #pd-cmp .cm-p.keep{box-shadow:0 0 0 2px #3fbf7f}
  #pd-cmp .cm-p.del{box-shadow:0 0 0 2px #e05a5a;opacity:.85}
  #pd-cmp .cm-ph{display:flex;align-items:center;gap:8px;padding:6px 10px;background:#16181d}
  #pd-cmp .cm-ph b{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-cmp .cm-tag{flex:none;font-size:11px;font-weight:700;padding:1px 7px;border-radius:6px;background:#2b2e35;color:#aab}
  #pd-cmp .cm-b{position:relative;flex:1 1 auto;min-height:200px;display:flex;flex-direction:column;justify-content:center}
  #pd-cmp .cm-b .qp-stage video{width:100%;max-height:62vh;display:block;background:#000}
  #pd-cmp .cm-pf{display:flex;align-items:center;gap:8px;padding:8px 10px;background:#16181d}
  #pd-cmp .cm-inf{color:#aab;font-size:12px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-cmp .cm-p.keep .cm-keep{background:#1f3b2c;border-color:#3fbf7f;color:#7fe0a6}
  #pd-cmp .pl-msg{padding:10px 14px;text-align:center;color:#ccc}
  #pd-cmp .pl-err{color:#ff9b9b}
  @media (max-width:899px){#pd-cmp .cm{height:96vh}#pd-cmp .cm-ps{flex-direction:column;overflow:auto}#pd-cmp .cm-p{flex:none}#pd-cmp .cm-b{flex:none}#pd-cmp .cm-b .qp-stage video{max-height:32vh}#pd-cmp .cm-h .note{display:none}}

  /* ---- 下の引き出し（スマホ・狭い画面） ---- */
  #ppdup .pd-sheet{display:none}
  #ppdup.narrow .pd-sheet{display:flex;flex-direction:column;position:absolute;left:0;right:0;bottom:0;z-index:8;background:var(--panel);border-radius:22px 22px 0 0;box-shadow:0 -8px 28px #0006;padding:0 12px calc(12px + env(safe-area-inset-bottom));transform:translateY(var(--shdy,0px));transition:max-height .22s ease;max-height:150px}
  #ppdup.narrow.ios-bar .pd-sheet{padding-bottom:calc(76px + env(safe-area-inset-bottom));max-height:226px}
  #ppdup.narrow.ios-bar main,#ppdup.narrow.ios-bar #pd-lib .lk-list{padding-bottom:200px!important}
  #ppdup.narrow .pd-sheet.covered{display:none}
  #ppdup.narrow .pd-sheet[data-st="1"]{max-height:min(460px,72vh)}
  #ppdup.narrow .pd-sheet[data-st="2"]{max-height:88vh}
  #ppdup .pd-sheet .sh-h{flex:none;display:flex;justify-content:center;align-items:center;height:22px;width:100%;border:0;background:none;padding:0;cursor:grab;touch-action:none}
  #ppdup .pd-sheet .sh-h i{width:44px;height:5px;border-radius:3px;background:var(--mute);opacity:.6}
  #ppdup .pd-sheet .sh-b{flex:none;display:flex;gap:8px;padding:2px 0 8px}
  #ppdup .pd-sheet .sh-b button{flex:1 1 0;min-width:0;height:46px;border-radius:14px;border:1px solid var(--line);background:var(--panel2);color:var(--fg);font:inherit;font-weight:800;font-size:14px;display:flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;overflow:hidden}
  #ppdup .pd-sheet .sh-b button span{overflow:hidden;text-overflow:ellipsis}
  #ppdup .pd-sheet .sh-b button.pri{background:var(--pri);border-color:var(--pri);color:#fff;flex-grow:2}
  #ppdup .pd-sheet .sh-b button.sub{flex:0 0 auto;padding:0 14px}
  #ppdup .pd-sheet button:disabled{opacity:.45}
  #ppdup .pd-sheet .sh-in{flex:1 1 auto;min-height:0;overflow:auto;overscroll-behavior:contain;display:none}
  #ppdup .pd-sheet:not([data-st="0"]) .sh-in{display:block}
  #ppdup .pd-sheet .sh-m{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:6px 0 10px}
  #ppdup .pd-sheet .sh-m button{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 2px;border-radius:12px;border:0;background:var(--panel2);color:var(--fg);font:inherit;font-size:11px;font-weight:700;min-width:0}
  #ppdup .pd-sheet .sh-m button span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #ppdup .pd-sheet .sh-m button svg{width:22px;height:22px}
  #ppdup .pd-sheet svg{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
  #ppdup.narrow #pd-lib .lb-note{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  #ppdup .pd-sheet .sh-m button.on{background:var(--pri-soft);color:var(--pri)}
  #ppdup .pd-sheet .sh-x{display:none;padding-bottom:8px}
  #ppdup .pd-sheet[data-st="2"] .sh-x{display:block}
  #ppdup .pd-sheet .sh-x > b{display:block;font-size:12px;color:var(--mute);margin:6px 2px}
  #ppdup .pd-sheet .sh-x > div{display:flex;flex-wrap:wrap;gap:6px}
  #ppdup .pd-sheet .sh-x button{height:40px;padding:0 14px;border-radius:12px;border:1px solid var(--line);background:var(--panel2);color:var(--fg);font:inherit;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
  #ppdup .pd-sheet .sh-x button.on{background:var(--pri);border-color:var(--pri);color:#fff}
  #ppdup .pd-sheet .sh-x button.red{color:#e05a5a}
  #ppdup .pd-sheet .sh-x button svg{width:18px;height:18px}
  /* 引き出しに移したものは、元の場所では出さない */
  #ppdup.narrow [data-a=navtoggle],#ppdup.narrow .sv-dock,#ppdup.narrow [data-r=tsel],#ppdup.narrow [data-r=tb] .seg,#ppdup.narrow #pd-lib .lk-ft,#ppdup.narrow #pd-lib .lk-hd > button:not(.x),#ppdup.narrow #pd-lib .lk-hd > .seg,#ppdup.narrow #pd-lib .lk-hd .seg{display:none!important}
  #ppdup.narrow main,#ppdup.narrow #pd-lib .lk-list{padding-bottom:120px!important}
  #ppdup.narrow .prog{margin-bottom:0}
  @media (max-width:599px){
    #pd-add .lk-hd{flex-wrap:wrap;row-gap:8px}
    #pd-add .lk-hd > b{white-space:nowrap;flex:1 1 calc(100% - 60px)}
    #pd-add .lk-hd > .sp{display:none}
    #pd-add .lk-hd > .x{order:1}
    #pd-add .lk-hd > .note{order:2;white-space:nowrap;flex:none}
    #pd-add .lk-hd > select{order:3;flex:1 1 0;min-width:0;max-width:none}
    #ppdup .wm .gw i{display:none}
  }

  /* 文字が 1 文字ずつ縦に折り返さないように（ロゴ・切り替え・ボタンは 1 行のまま） */
  #ppdup .wm,#ppdup .wm *,#ppdup .seg button,#ppdup .hbtn,#ppdup [data-r=tb] button{white-space:nowrap}
  #ppdup .brand h1.wm{flex:none}
  /* スマホ（〜599px）：上のバーは アイコン＋Dedupe と最小限のボタン。検索は 2 行目に横いっぱい */
  @media (max-width:599px){
    #ppdup header .brand{flex-wrap:wrap!important;row-gap:8px}
    #ppdup header .brand > *{flex-shrink:0}
    #ppdup .wm small{display:none}
    #ppdup .wm .gw{font-size:20px}
    #ppdup header .hq{order:10;flex:1 1 calc(100% - 180px)!important;min-width:0;width:auto!important;max-width:none!important}
    #ppdup header .brand > .sp,#ppdup header .brand > span:empty{display:none}
    #ppdup header .hqs{order:11;flex:none}
    #ppdup header [data-a=edgescroll],#ppdup header [data-a=lang],#ppdup header .brand > [data-a=addlink],#ppdup header [data-a=settings]{display:none!important}
    #ppdup [data-r=tb]{flex-wrap:wrap!important;gap:6px}
    #ppdup [data-r=tb] .tr-path{flex:1 1 100%;min-width:0}
    #ppdup .tr-hint,#ppdup [data-r=tacts] .note{display:none}
  }
  .tr-row .c-pct{display:flex;align-items:center;gap:8px;color:var(--mute);font-size:12px}
  .tr-row .c-pct .pb{flex:1;height:6px;border-radius:99px;background:var(--line);overflow:hidden}
  .tr-row .c-pct .pb i{display:block;height:100%;background:var(--pri);border-radius:99px}
  .tr-row .c-pct em{width:44px;text-align:right;font-style:normal}
  .tr:focus .tr-row.sel .c-pct{color:#fff}.tr:focus .tr-row.sel .c-pct .pb{background:#ffffff55}.tr:focus .tr-row.sel .c-pct .pb i{background:#fff}
  .tr .ot{flex:none;font-size:10px;line-height:15px;padding:0 6px;border-radius:99px;background:var(--panel2);color:var(--mute);margin-left:6px}
  .tr-h{position:sticky;top:0;z-index:1;background:var(--panel);border-bottom:1px solid var(--line);height:28px;color:var(--mute);font-size:12px}
  .tr-h span{padding:0 10px;cursor:pointer;border-left:1px solid var(--line);line-height:28px;white-space:nowrap}
  .tr-h span:first-child{border-left:0;padding-left:34px}
  .tr-h span:hover{color:var(--fg)}
  .tr-row{height:26px;cursor:default}
  .tr-row.odd{background:var(--panel2)}
  .tr-row.sel{background:#d4def5}
  .tr:focus .tr-row.sel{background:#0a64d6;color:#fff}
  .tr:focus .tr-row.sel .c-size,.tr:focus .tr-row.sel .c-kind,.tr:focus .tr-row.sel .c-n,.tr:focus .tr-row.sel .tw{color:#fff}
  .tr-row > span{padding:0 10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .tr-row .c-name{display:flex;align-items:center;gap:5px;padding-right:6px}
  .tr-row .c-size,.tr-h .c-size{text-align:right}
  .tr-row .c-size,.tr-row .c-kind,.tr-row .c-n{color:var(--mute);font-size:12px}
  .tr .tw{width:14px;flex:none;font-size:9px;color:var(--mute);text-align:center;cursor:pointer;transition:transform .12s;display:inline-block}
  .tr .tw.open{transform:rotate(90deg)}
  .tr .tw.blank{cursor:default}
  .tr .ic{width:18px;height:16px;flex:none;display:flex;align-items:center;justify-content:center}
  .tr .ic svg{width:18px;height:16px}
  .tr .nm{overflow:hidden;text-overflow:ellipsis}
  .seg{display:inline-flex}
  #ppdup .seg button{border-radius:0;margin-left:-1px}
  #ppdup .seg button:first-child{border-radius:8px 0 0 8px;margin-left:0}
  #ppdup .seg button:last-child{border-radius:0 8px 8px 0}
  #ppdup .seg button.on{background:var(--pri);border-color:var(--pri);color:#fff}
  .tr.big .tr-row{height:76px}
  .tr.big .tr-h span:first-child{padding-left:34px}
  .tr .th{position:relative;width:112px;height:63px;flex:none;border-radius:6px;overflow:hidden;background:#d8dbe2;display:flex;align-items:center;justify-content:center;margin-right:6px;box-shadow:0 0 0 1px #0000001a}
  .tr .th img{width:100%;height:100%;object-fit:cover;display:block}
  .tr .th .ph svg{width:34px;height:30px}
  .tr .th .badge{position:absolute;right:3px;bottom:3px;width:22px;height:18px;border-radius:4px;background:#000a;display:flex;align-items:center;justify-content:center}
  .tr .th .badge svg{width:16px;height:13px}
  .tr .th.dir{background:#cfe4fb}
  .tr .tx{display:flex;flex-direction:column;gap:4px;min-width:0}
  .tr .tx .nm{font-size:13px}
  .tr .tx .sub{font-size:11px;color:var(--mute)}
  .tr:focus .tr-row.sel .tx .sub{color:#ffffffcc}
  html.pd-dark .tr .th{background:#3a3f4b}html.pd-dark .tr .th.dir{background:#2a3a4f}
  .tr .jk{flex:none;font-size:10px;line-height:14px;padding:0 5px;border-radius:7px;background:#ff6b6b;color:#fff;margin-left:4px}
  .tr-ren{font:inherit;padding:1px 4px !important;border:2px solid #4b8df8 !important;border-radius:3px !important;flex:1;min-width:120px;cursor:text !important}
  html.pd-dark .tr-row.sel{background:#3a3f4b}
  #pd-ql{position:fixed;inset:0;z-index:100002;display:flex;align-items:center;justify-content:center;background:#0004}
  #pd-ql .ql{background:#2b2d31ee;color:#eee;border-radius:12px;box-shadow:0 20px 60px #000a;width:min(820px,90vw);overflow:hidden;font:13px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Yu Gothic","Meiryo","Noto Sans CJK JP","Noto Sans JP",sans-serif;backdrop-filter:blur(20px)}
  #pd-ql .ql-h{display:flex;align-items:center;gap:10px;padding:8px 12px;background:#0003}
  #pd-ql .ql-h b{flex:1;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-ql .ql-h button{border:0;background:#fff2;color:#eee;border-radius:50%;width:22px;height:22px;cursor:pointer}
  #pd-ql .ql-b{display:flex;align-items:center;justify-content:center;min-height:300px;max-height:65vh;background:#000}
  #pd-ql .ql-b img{max-width:100%;max-height:65vh;display:block}
  #pd-ql.ql-vid:not(.playing) .ql-b{aspect-ratio:16/9;min-height:0}
  #pd-ql.ql-vid:not(.playing) .ql-b img{width:100%;height:100%;object-fit:contain}
  #pd-ql.ql-vid:not(.playing) .pv-ft{visibility:hidden}
  /* 簡易プレーヤーの外枠（3 か所共通・暗い色にそろえる） */
  .pv .pv-hd{display:flex;align-items:center;gap:10px;padding:10px 14px;background:#14171d;color:#e8eaf0;border-bottom:1px solid #262b35}
  .pv .pv-hd b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:600 14px system-ui,-apple-system,"Hiragino Sans","Yu Gothic UI",sans-serif;text-align:left}
  .pv .pv-x{width:36px;height:36px;padding:0;border-radius:8px;border:1px solid #343a46;background:#1d212a;color:#e8eaf0;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;flex:none}
  .pv .pv-x svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
  .pv .pv-x:hover{background:#2a303c}
  .pv .pv-ft{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#1a1e26;color:#e8eaf0;border-top:1px solid #262b35;flex-wrap:wrap;font:13px/1.5 system-ui,-apple-system,"Hiragino Sans","Yu Gothic UI",sans-serif}
  .pv .pv-inf{flex:1 1 220px;min-width:0}
  .pv .pv-inf .note{color:#9aa1ad;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .pv .pv-acts{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
  .pv .pv-q{display:contents}
  .pv .pv-acts button,.pv .pv-acts select{height:36px;padding:0 12px;border-radius:8px;border:1px solid #343a46;background:#232833;color:#e8eaf0;font:600 13px system-ui,-apple-system,"Hiragino Sans","Yu Gothic UI",sans-serif;cursor:pointer;max-width:240px}
  .pv .pv-acts button.pri{background:#306fff;border-color:#306fff;color:#fff}
  .pv .pv-acts button:hover{filter:brightness(1.15)}
  .pv .pv-acts select option{color:#1c1f26}
  .pv{position:relative}
  .pv .pv-info{position:absolute;top:58px;right:12px;width:min(400px,calc(100% - 24px));max-height:calc(100% - 72px);overflow:auto;z-index:25;background:#1d212a;color:#e8eaf0;border:1px solid #343a46;border-radius:12px;box-shadow:0 12px 36px #0009;font:13px/1.6 system-ui,-apple-system,"Hiragino Sans","Yu Gothic UI",sans-serif}
  .pv .pv-ih{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #2c323d}
  .pv .pv-ih b{flex:1}
  .pv .pv-info dl{display:grid;grid-template-columns:auto 1fr;gap:6px 12px;margin:0;padding:12px}
  .pv .pv-info dt{color:#9aa1ad;white-space:nowrap}
  .pv .pv-info dd{margin:0;min-width:0;overflow-wrap:anywhere}
  .pv .pv-info .mu{color:#9aa1ad}
  .pv .pv-ied{display:flex;gap:6px;margin-top:6px}
  .pv .pv-ied input{flex:1;min-width:0;height:32px;padding:0 8px;border-radius:6px;border:1px solid #343a46;background:#14171d;color:#e8eaf0;font:inherit}
  .pv .pv-info button{height:32px;padding:0 12px;border-radius:8px;border:1px solid #343a46;background:#232833;color:#e8eaf0;font:600 12px system-ui,sans-serif;cursor:pointer}
  .pv .pv-info button.pri{background:#306fff;border-color:#306fff;color:#fff}
  .pv .pv-info .pv-x{width:32px;padding:0;display:inline-flex;align-items:center;justify-content:center}
  .pv .pv-ia{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:0 12px 12px}
  .pv .pv-il{display:flex;align-items:center;gap:6px 10px;flex-wrap:wrap;padding:10px 12px;border-top:1px solid #2c323d}
  .pv .pv-il a{color:#8fb4ff;text-decoration:none}
  .pv .pv-il a:hover{text-decoration:underline}

  #pd-ql .ql-ic svg{width:160px;height:140px}
  #pd-ql .ql-f{padding:10px 14px}
  #pd-ql .ql-b{position:relative}
  #pd-ql .ql-b video{width:100%;max-height:65vh;display:block;background:#000}
  #pd-ql .pl-msg{position:absolute;left:0;right:0;bottom:12px;text-align:center;color:#ddd;font-size:12px}
  #pd-ql.playing .ql-wait{display:none}
  .qp-bigplay{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:76px;height:76px;border-radius:50%;background:#000a;color:#fff;font-size:34px;display:flex;align-items:center;justify-content:center;padding-left:6px;pointer-events:none;z-index:3}
  #pd-ql .ql-acts{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
  #pd-ql .ql-acts button{border:1px solid #fff3;background:#fff1;color:#eee;border-radius:8px;padding:6px 12px;font:inherit;cursor:pointer}
  #pd-ql .ql-acts select{border:1px solid #fff3;background:#fff1;color:#eee;border-radius:8px;padding:6px 8px;font:inherit}
  #pd-ql .ql-acts select option{color:#1c1f26}
  #pd-ql .ql-acts button.pri{background:#306fff;border-color:#306fff;color:#fff;font-weight:700}
  #pd-ql .ql-acts button:hover{filter:brightness(1.15)}
  #pd-dlg .pset{display:flex;flex-direction:column;gap:6px;margin:12px 0;padding:10px 12px;border:1px solid #c5c9d288;border-radius:8px}
  #pd-dlg .pset label{display:flex;gap:8px;align-items:center;cursor:pointer}
  #pd-ql .note{color:#aaa;font-size:12px;word-break:break-all}
  .tr-path{display:flex;align-items:center;gap:2px;overflow-x:auto;white-space:nowrap;min-width:0;flex:1 1 260px;font-size:14px}
  .tr-path button{border:0 !important;background:none !important;padding:2px 6px !important;border-radius:5px !important;color:var(--mute);font:inherit;cursor:pointer}
  .tr-path button:hover:not(:disabled){background:var(--panel) !important;color:var(--fg)}
  .tr-path button.on{color:var(--fg);font-weight:700}
  .tr-path button.drop{outline:2px solid #4b8df8;background:#4b8df833 !important}
  #ppdup .tr-path [data-tup]{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;padding:0 !important;margin-right:6px;border:1px solid var(--ctl-line) !important;background:var(--ctl) !important;border-radius:8px !important;color:var(--fg);font-weight:800}
  #ppdup .tr-path [data-tup] svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
  .tr-path .csep{color:var(--mute);padding:0 2px}
  .tr.has-path .tr-h{top:0}
  .tr.tl .tr-body{padding:6px 12px 20px}
  .tl-sec{margin-bottom:10px}
  .tl-top{position:fixed;right:28px;bottom:24px;z-index:5;padding:8px 16px !important;border-radius:999px !important;background:var(--pri) !important;color:#fff !important;border:0 !important;font-weight:700;box-shadow:0 6px 18px #0004;opacity:0;pointer-events:none;transition:opacity .15s}
  .tl-top.on{opacity:1;pointer-events:auto}
  @keyframes pdflash{0%,40%{background:#ffd54aaa;box-shadow:0 0 0 3px #ffd54a}20%,60%{background:#ffd54a55;box-shadow:0 0 0 3px #ffd54a88}100%{background:transparent;box-shadow:0 0 0 3px transparent}}
  .flash{animation:pdflash 2.4s ease-out}
  .tl-h{position:sticky;top:0;z-index:1;display:flex;align-items:center;gap:8px;padding:8px 6px;background:var(--panel);border-bottom:1px solid var(--line);font-size:13px}
  .tl-h .ic svg{width:18px;height:16px;display:block}
  .tl-h b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .tl-h .pp{color:var(--mute);font-weight:500}
  .tl-h .sp{flex:1}
  .tl-h button{font-size:12px !important;padding:2px 8px !important}
  .tl-h.drop{outline:2px solid #4b8df8;background:#4b8df833}
  .tl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(176px,1fr));gap:12px;padding:12px 4px}
  .tr .tr-row.tile{display:flex;flex-direction:column;align-items:stretch;height:auto;padding:6px;border-radius:10px;gap:4px;position:relative;background:none}
  .tr .tr-row.tile > span{padding:0}
  .tr .tr-row.tile .th{width:100%;height:auto;aspect-ratio:16/9;margin:0}
  .tr .tr-row.tile .th .ph svg{width:48px;height:42px}
  .tr .tr-row.tile .nm{font-size:12px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;white-space:normal;word-break:break-all;text-align:center;padding:0 2px}
  .tr .tr-row.tile .sub{font-size:11px;color:var(--mute);text-align:center}
  .tr .tr-row.tile .jk{position:absolute;top:10px;left:10px;margin:0}
  .tr .tr-row.tile .tr-ren{min-width:0;width:100%;box-sizing:border-box}
  .tr .tr-row.tile.sel{background:#d4def5}
  .tr:focus .tr-row.tile.sel{background:#0a64d6}
  .tr:focus .tr-row.tile.sel .sub{color:#ffffffcc}
  .tr .tr-row.tile.drop{outline:2px solid #4b8df8}
  html.pd-dark .tr .tr-row.tile.sel{background:#3a3f4b}
  #pd-hover{position:fixed;z-index:100002;width:340px;background:var(--hv-bg,#fff);color:#1c1f26;border-radius:10px;box-shadow:0 10px 32px #0005;padding:8px;pointer-events:none;font:12px/1.4 system-ui,"Segoe UI","Hiragino Sans","Yu Gothic UI","Meiryo","Noto Sans CJK JP",sans-serif;animation:pdhv .12s ease-out}
  @keyframes pdhv{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
  #pd-hover img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:6px;display:block;background:#d8dbe2}
  #pd-hover .hv-n{display:flex;gap:6px;align-items:center;margin-top:6px;font-weight:600;word-break:break-all}
  #pd-hover .hv-n svg{width:16px;height:14px;flex:none}
  #pd-hover .hv-s{color:#6a7080;margin-top:2px;word-break:break-all}
  html.pd-dark #pd-hover{background:#252932;color:#e6e8ee}html.pd-dark #pd-hover .hv-s{color:#8b91a1}
  #ppdup .tsel{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:8px 18px;background:var(--panel);border-bottom:1px solid var(--line);min-height:34px}
  #ppdup .tsel:empty{display:none}
  #ppdup .tsel.on{background:var(--pri-soft);border-bottom-color:#306fff55}
  #ppdup .tsel .cnt{font-weight:700;color:var(--pri);margin-right:6px}
  #ppdup .tsel .hint{color:var(--mute);font-size:12px}
  #ppdup .tsel button.red{color:var(--danger);border-color:#d6454566;font-weight:700}
  .tr-row.drop{outline:2px solid #4b8df8;outline-offset:-2px;background:#4b8df833 !important}
  #pd-drag{position:fixed;z-index:100005;pointer-events:none;background:#306fff;color:#fff;font:600 12px system-ui,sans-serif;padding:4px 10px;border-radius:6px;box-shadow:0 4px 14px #0005;max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-drag.ng{background:#6a7080}
  #pd-lib .pp-wrap{display:flex;gap:16px;align-items:flex-start;min-height:60vh}
  #pd-lib .pp-side{width:260px;flex:0 0 auto;display:flex;flex-direction:column;gap:10px;position:sticky;top:0}
  #pd-lib .pp-mode{display:flex;gap:6px}
  #pd-lib .pp-mode button{flex:1;height:34px;border-radius:17px;border:1px solid var(--line,#dde0e6);background:transparent;color:var(--fg);font-weight:700;cursor:pointer}
  #pd-lib .pp-mode button.on{background:var(--pri,#306fff);border-color:var(--pri,#306fff);color:#fff}
  #pd-lib .pp-q{display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--mute)}
  #pd-lib .pp-q input{height:34px;border:1px solid var(--line,#dde0e6);border-radius:8px;padding:0 10px;font-size:14px;background:var(--bg2,#fff);color:var(--fg)}
  #pd-lib .pp-names{display:flex;flex-direction:column;gap:2px;max-height:60vh;overflow:auto}
  #pd-lib .pp-names button{display:flex;justify-content:space-between;gap:8px;padding:8px 10px;border:0;border-radius:8px;background:none;color:var(--fg);text-align:left;cursor:pointer;font-size:14px}
  #pd-lib .pp-names button:hover{background:var(--hov,#0000000d)}
  #pd-lib .pp-names button.on{background:var(--pri-soft,#306fff1f);font-weight:700}
  #pd-lib .pp-names button.mu{color:var(--mute)}
  #pd-lib .pp-names span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-lib .pp-names i{flex:0 0 auto;font-style:normal;color:var(--mute);font-size:12px;white-space:nowrap}
  #pd-lib .pp-main{flex:1;min-width:0}
  #pd-lib .pp-hd{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 12px;margin:0 0 12px}
  #pd-lib .pp-hd b{font-size:18px}
  #pd-lib .pp-sub{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
  #pd-lib .pp-chip{border:1px solid var(--line,#dde0e6);border-radius:999px;background:var(--bg2,#fff);color:var(--fg);padding:2px 10px;font-size:12px;cursor:pointer}
  @media (max-width:720px){#pd-lib .pp-wrap{flex-direction:column}#pd-lib .pp-side{width:100%;position:static}#pd-lib .pp-names{max-height:30vh}}
  .pv-info .pv-ppl{display:flex;flex-direction:column;gap:4px;margin:0;padding:0 12px 8px}
  .pv-info .pv-ppl a{color:#7aa2ff}
  .pv-info .pv-rel{margin:0;padding:0 12px 8px}
  .pv-info .pv-rels{display:flex;gap:8px;overflow-x:auto;overflow-y:hidden;padding:6px 0 8px;min-height:84px}
  .pv-info .pv-rels button{flex:0 0 104px;min-height:78px;display:flex;flex-direction:column;gap:4px;border:0;background:none;color:inherit;padding:0;cursor:pointer;text-align:left}
  .pv-info .pv-rels .th{display:block;height:58px;border-radius:6px;background:#3a3f4b;overflow:hidden}
  .pv-info .pv-rels img{width:100%;height:100%;object-fit:cover}
  .pv-info .pv-rels .nm{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #pd-ctx{position:fixed;z-index:100004;min-width:220px;background:#f6f6f8f2;color:#1c1f26;border:1px solid #0002;border-radius:8px;box-shadow:0 10px 30px #0004;padding:5px;font:13px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Yu Gothic","Meiryo","Noto Sans CJK JP","Noto Sans JP",sans-serif;backdrop-filter:blur(16px)}
  #pd-ctx button{display:flex;justify-content:space-between;gap:24px;width:100%;border:0;background:none;color:inherit;font:inherit;padding:4px 10px;border-radius:4px;text-align:left;cursor:default}
  #pd-ctx button:hover:not(:disabled){background:#0a64d6;color:#fff}
  #pd-ctx button:disabled{opacity:.4}
  #pd-ctx button.red:not(:hover){color:#d93025}
  #pd-ctx kbd{font:12px system-ui,sans-serif;opacity:.6}
  #pd-ctx hr{border:0;border-top:1px solid #0001;margin:4px 6px}
  html.pd-dark #pd-ctx{background:#2b2d31f2;color:#eee;border-color:#fff2}html.pd-dark #pd-ctx hr{border-color:#fff2}
  #pd-dlg .mv{max-height:50vh;overflow:auto;border:1px solid #c5c9d288;border-radius:8px;margin:10px 0 6px}
  #pd-dlg .mv-r{display:flex;align-items:center;gap:6px;padding:5px 8px;cursor:pointer;font-size:13px}
  #pd-dlg .mv-r svg{width:18px;height:15px;flex:none}
  #pd-dlg .mv-r:hover{background:#306fff1f}
  #pd-dlg .mv-r.on{background:#306fff;color:#fff}
  #pd-dlg .mv-r.ng{opacity:.35;cursor:not-allowed}
  #pd-player{position:fixed;inset:0;z-index:100003;background:#000c;display:flex;align-items:center;justify-content:center}
  #pd-player .pl{width:min(1280px,96vw);background:#111;color:#eee;border-radius:12px;overflow:hidden;box-shadow:0 20px 60px #000;font:13px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Yu Gothic","Meiryo","Noto Sans CJK JP","Noto Sans JP",sans-serif}
  #pd-player .pl-h{display:flex;align-items:center;gap:8px;padding:8px 10px;background:#1d1f24}
  #pd-player .pl-h b{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-player .pl-h button,#pd-player .pl-h select,#pd-player .pl-h a{font:inherit;background:#2b2e35;color:#eee;border:1px solid #3a3f4b;border-radius:6px;padding:4px 10px;text-decoration:none;cursor:pointer}
  #pd-player .pl-h button:disabled{opacity:.35;cursor:default}
  #pd-player .pl-b{position:relative;background:#000;min-height:300px;display:flex;flex-direction:column;align-items:stretch;justify-content:center}
  #pd-player video{width:100%;max-height:calc(100vh - 300px);display:block;background:#000}
  #pd-player .pl-msg{padding:40px;color:#bbb;text-align:center}
  #pd-player .pl-f{padding:6px 12px;color:#999;display:flex;gap:4px}
  #pd-player .pl-err{position:absolute;left:0;right:0;bottom:56px;padding:10px 16px;background:#000c;color:#ffb4b4}
  #pd-set{position:fixed;inset:0;z-index:100006;background:#14161b59;font:13px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Meiryo","Noto Sans CJK JP",sans-serif;color:var(--fg)}
  #pd-set .dr{position:absolute;top:0;right:0;bottom:0;width:min(460px,100vw);background:var(--panel);box-shadow:-12px 0 40px #0004;display:flex;flex-direction:column;animation:pdset .16s ease-out}
  @keyframes pdset{from{transform:translateX(24px);opacity:0}to{transform:none;opacity:1}}
  #pd-set .hd{display:flex;align-items:center;gap:10px;padding:14px 20px;border-bottom:1px solid var(--line)}
  #pd-set .hd h2{margin:0;font-size:17px;flex:1}
  #pd-set svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;flex:none}
  #pd-set button,#pd-set select{font:inherit;color:inherit;padding:6px 12px;border:1px solid var(--ctl-line);border-radius:8px;background:var(--ctl);cursor:pointer}
  #pd-set .x{border:0;background:none;width:34px;height:34px;padding:0;display:inline-flex;align-items:center;justify-content:center;color:var(--mute)}
  #pd-set .tabs{display:flex;gap:2px;padding:6px 16px 0;border-bottom:1px solid var(--line)}
  #pd-set .tabs button{border:0;border-radius:0;background:none;padding:8px 10px;color:var(--mute);border-bottom:2px solid transparent;font-weight:600}
  #pd-set .tabs button.on{color:var(--pri);border-bottom-color:var(--pri)}
  #pd-set .bd{flex:1;overflow:auto;padding:4px 20px 24px}
  #pd-set h3{margin:20px 0 4px;font-size:12px;letter-spacing:.04em;color:var(--mute)}
  #pd-set .row{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--line)}
  #pd-set .row > span:first-child{flex:1;min-width:0}
  #pd-set .row b{display:block;font-weight:600}
  #pd-set .row small{display:block;color:var(--mute);font-size:12px;margin-top:2px}
  #pd-set .row.col{flex-direction:column;align-items:stretch;gap:4px}
  #pd-set .row.col label{display:flex;align-items:center;gap:8px;padding:3px 0;cursor:pointer}
  #pd-set input[type=radio],#pd-set input[type=checkbox]{width:16px;height:16px;accent-color:var(--pri);margin:0}
  #pd-set .seg{display:inline-flex}
  #pd-set .seg button{border-radius:0;margin-left:-1px}
  #pd-set .seg button:first-child{border-radius:8px 0 0 8px;margin-left:0}
  #pd-set .seg button:last-child{border-radius:0 8px 8px 0}
  #pd-set .seg button.on{background:var(--pri);border-color:var(--pri);color:#fff}
  #pd-set .ver{font:600 12px ui-monospace,Menlo,monospace;color:var(--mute)}
  #pd-set .badge{display:inline-block;min-width:16px;padding:0 5px;border-radius:8px;background:var(--danger);color:#fff;font:700 10px/16px system-ui,sans-serif;margin-left:6px}
  #pd-dlg{font:13px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Meiryo","Noto Sans CJK JP",sans-serif}
  #pd-dlg{position:fixed;inset:0;z-index:100001;background:#0007;display:flex;align-items:center;justify-content:center}
  #pd-dlg .box{background:#fff;color:#1c1f26;border-radius:12px;padding:24px;width:min(460px,92vw);box-shadow:0 10px 40px #0006}
  #pd-dlg h3{margin:0 0 12px;font-size:17px}
  #pd-dlg .note{color:#6a7080;font-size:12px}
  #pd-dlg .hard{display:flex;gap:8px;align-items:center;color:#d93025;font-weight:600;margin:16px 0;cursor:pointer}
  #pd-dlg .acts{display:flex;justify-content:flex-end;gap:10px}
  #pd-dlg button{font:inherit;padding:6px 14px;border:1px solid #c5c9d2;border-radius:8px;background:#fff;color:inherit;cursor:pointer}
  #pd-dlg button.danger{background:#d64545;color:#fff;border-color:#d64545;font-weight:700}
  html.pd-dark #pd-dlg .box{background:#1d2027;color:#e6e8ee}html.pd-dark #pd-dlg button{background:#252932;border-color:#3a3f4b}
  /* 追加したもの〜ゴミ箱：メインの画面に広げて表示 */
  #ppdup.libv > main,#ppdup.libv > .tb,#ppdup.libv > .tsel,#ppdup.libv header nav{display:none!important}
  #pd-lib.emb{position:relative;inset:auto;z-index:1;flex:1 1 auto;min-height:0;display:flex;align-items:stretch;justify-content:stretch;background:var(--bg)}
  #pd-lib.emb .lk-box{width:100%;max-height:none;flex:1;border-radius:0;box-shadow:none;background:var(--bg)}
  #pd-lib.emb .lk-hd{background:var(--panel);flex-wrap:wrap;row-gap:8px}
  #pd-lib .lk-hd > b{white-space:nowrap;flex:none}
  #pd-lib.emb .lb-tabs,#pd-lib.emb .lb-note{background:var(--panel)}
  #pd-lib.emb .lk-list{padding:16px 22px;flex:1 1 auto;min-height:0}
  #pd-lib .lk-box > .lk-hd,#pd-lib .lk-box > .lb-tabs,#pd-lib .lk-box > .lb-note,#pd-lib .lk-box > .lk-ft{flex:none}
  #pd-lib.emb .lk-ft{background:var(--panel)}
  #pd-lib .lb-grid.sz-s{grid-template-columns:repeat(auto-fill,minmax(180px,1fr))}
  #pd-lib .lb-grid.sz-m{grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
  #pd-lib .lb-grid.sz-l{grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:18px}
  #pd-lib .lb-grid.sz-l .lb-ct b{font-size:14px}
  #pd-lib .lb-tree{display:flex;flex-direction:column;gap:2px;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:6px}
  #pd-lib .lb-tn{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:8px;cursor:pointer;user-select:none;font-size:13px}
  #pd-lib .lb-tn:hover{background:var(--panel2)}
  #pd-lib .lb-tn .tw{width:12px;color:var(--mute);font-size:11px}
  #pd-lib .lb-tn .fi svg{width:18px;height:16px;display:block}
  #pd-lib .lb-tn b{font-weight:700;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-lib .lb-tn .nn{color:var(--mute);font-size:12px;margin-left:auto}
  #pd-lib .lb-tf .lb-li{border-color:transparent;background:transparent}
  #pd-lib .lb-tf .lb-li:hover{background:var(--panel2)}
  #pd-lib .lb-tf .lb-li.cur{background:var(--pri-soft);border-color:var(--pri)}
  #pd-lib .lb-lst{display:flex;flex-direction:column;gap:4px}
  #pd-lib .lb-grp{display:flex;flex-direction:column;gap:4px;margin-bottom:14px}
  #pd-lib .lb-gh{display:flex;align-items:center;gap:8px;font-weight:800;font-size:13px;padding:4px 2px}
  #pd-lib .lb-gh span{color:var(--mute);font-weight:500;font-size:12px}
  #pd-lib .lb-li{display:flex;align-items:center;gap:12px;padding:6px 10px;background:var(--panel);border:1px solid var(--line);border-radius:10px;cursor:pointer;outline:none;user-select:none}
  #pd-lib .lb-li:hover{border-color:var(--ctl-line)}
  #pd-lib .lb-li.cur,#pd-lib .lb-li:focus-visible{border-color:var(--pri);box-shadow:0 0 0 2px var(--pri-soft)}
  #pd-lib .lb-li .th{position:relative;width:64px;height:36px;flex:none;border-radius:6px;overflow:hidden;background:var(--panel2);display:flex;align-items:center;justify-content:center}
  #pd-lib .lb-li.thumb .th{width:192px;height:108px;border-radius:8px}
  #pd-lib .lb-li .th img{width:100%;height:100%;object-fit:cover}
  #pd-lib .lb-li .th .ph svg{width:22px;height:26px}
  #pd-lib .lb-li .th .lb-play{position:absolute;right:4px;bottom:4px;font-size:9px;padding:1px 5px;border-radius:5px;background:#000a;color:#fff}
  #pd-lib .lb-li .nm{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
  #pd-lib .lb-li .nm b{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-lib .lb-li.thumb .nm b{font-size:14px;white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
  #pd-lib .lb-li .nm small{color:var(--mute);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pd-lib .lb-li .sz{width:80px;text-align:right;color:var(--mute);font-size:12px;flex:none}
  #pd-lib .lb-li .dt{width:110px;text-align:right;color:var(--mute);font-size:12px;flex:none}
  #pd-lib .lb-li input{margin:0}
  #pd-lib [data-lbauto].on{background:var(--pri-soft);border-color:var(--pri);color:var(--pri)}
  #pd-lib .lb-vw button.on,#pd-lib .lb-sz button.on{background:var(--pri);border-color:var(--pri);color:#fff}
  /* 共通の型（StepKit） */
  #ppdup .kit-ex{padding:10px 16px}
  #ppdup .kit-ex summary{cursor:pointer;font-weight:800;font-size:13px;color:var(--pri)}
  #ppdup .kit-ex .note{margin-top:6px}
  #ppdup .kit-tabs{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 12px}
  #ppdup .kit-tab{height:34px;padding:0 14px;border:1px solid var(--line);border-radius:17px;background:var(--panel);color:var(--fg);font:inherit;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:8px}
  #ppdup .kit-tab i{font-style:normal;font-size:12px;color:var(--mute)}
  #ppdup .kit-tab.on{background:var(--pri);border-color:var(--pri);color:#fff}
  #ppdup .kit-tab.on i{color:#fffc}
  #ppdup .kit-tab.bad:not(.on){border-color:var(--danger);color:var(--danger)}
  #ppdup .kit-tabs .sp{flex:1}
  #ppdup .kit-tabs input[type=search]{height:34px;width:220px;max-width:100%;box-sizing:border-box;padding:0 14px;border:1px solid var(--ctl-line);border-radius:17px;background:var(--ctl);color:inherit;font:inherit}
  #ppdup .pd-gh input[type=checkbox]{margin:0 4px 0 0;width:16px;height:16px}
  #ppdup .kit-row{align-items:center}
  #ppdup .kit-th{width:64px!important;height:40px!important;display:flex;align-items:center;justify-content:center;flex:none}
  #ppdup .kit-th .kit-ic svg{width:24px;height:28px}
  #ppdup .kit-to{color:var(--pri)}
  #ppdup .kit-err{color:var(--danger);font-size:12px;font-weight:700;margin-top:2px}
  #ppdup .kit-row.fail{box-shadow:inset 3px 0 0 var(--danger)}
  #ppdup .kit-tag{white-space:nowrap}
  #ppdup .kit-tag.pri{background:var(--pri-soft);color:var(--pri)}
  #ppdup .kit-tag.ok{background:#e3f6ec;color:#17703f}
  #ppdup .kit-tag.warn{background:#fff4dc;color:#8a5600}
  #ppdup .kit-tag.del{background:#fde8e8;color:#b42318}
  html.pd-dark #ppdup .kit-tag.ok{background:#17331f;color:#6fdc9a}
  html.pd-dark #ppdup .kit-tag.warn{background:#3a2c12;color:#f0c46c}
  html.pd-dark #ppdup .kit-tag.del{background:#3a1a1a;color:#ff8a80}
  #ppdup .kit-open{flex:none;height:30px;padding:0 10px;border:1px solid var(--ctl-line);border-radius:8px;background:var(--ctl);color:inherit;font:inherit;font-size:12px;cursor:pointer}
  /* ===== v4.1：デリログ風の見た目（丸み・やわらかい色・左の常設メニュー・ダッシュボード） ===== */
  #ppdup{--rf:"Hiragino Maru Gothic ProN","Hiragino Maru Gothic Pro","M PLUS Rounded 1c","Kosugi Maru","Yu Gothic UI","Hiragino Sans","Meiryo",system-ui,sans-serif;font-family:var(--rf)}
  #ppdup:not(.pop):not(.narrow){padding-left:236px}
  #ppdup:not(.pop):not(.narrow) .rail{box-sizing:border-box;width:236px;align-items:stretch;padding:14px 12px 12px;background:var(--panel);gap:2px}
  #ppdup:not(.pop):not(.narrow) .rail > button:not(.rl-sub):not(.rl-acct){width:auto;flex-direction:row;justify-content:flex-start;gap:12px;padding:10px 12px;border-radius:12px;font-size:14px;font-weight:800;color:var(--fg);text-align:left}
  #ppdup:not(.pop):not(.narrow) .rail > button span{flex:1}
  #ppdup:not(.pop):not(.narrow) .rail svg{width:20px;height:20px;color:var(--mute)}
  #ppdup:not(.pop):not(.narrow) .rail button.on{background:var(--pri-soft);color:var(--pri)}
  #ppdup:not(.pop):not(.narrow) .rail button.on svg{color:var(--pri)}
  #ppdup:not(.pop):not(.narrow) .rail .rb{position:static;font-size:11px;line-height:18px;min-width:18px;padding:0 6px;font-weight:800}
  #ppdup .rail .rl-sep{height:1px;background:var(--line);margin:10px 6px;flex:none}
  #ppdup .rail .rl-sub{width:auto!important;flex-direction:row!important;padding:7px 12px!important;font-size:12px!important;font-weight:700;color:var(--mute)!important;text-align:left;border-radius:10px}
  #ppdup .rail .rl-acct{margin-top:auto;width:auto!important;flex-direction:row!important;align-items:center!important;gap:10px!important;padding:10px 12px!important;border:1px solid var(--line)!important;border-radius:16px!important;text-align:left;color:var(--fg)!important}
  #ppdup .rail .rl-acct i{width:34px;height:34px;flex:none;border-radius:50%;background:var(--panel2);display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px var(--ok)}
  #ppdup .rail .rl-acct.ng i{box-shadow:0 0 0 2px var(--danger)}
  #ppdup .rail .rl-acct svg{width:18px!important;height:18px!important}
  #ppdup .rail .rl-acct span{display:flex!important;flex-direction:column;min-width:0}
  #ppdup .rail .rl-acct b{font-size:12px}
  #ppdup .rail .rl-acct small{font-size:11px;color:var(--ok);font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #ppdup .rail .rl-acct.ng small{color:var(--danger)}
  #ppdup .rail .rl-acct small.t{color:var(--mute);font-weight:500}
  #ppdup.narrow .rail .rl-acct small{white-space:normal}
  /* アイコンだけ（☰ でたたむ）・ポップアップ */
  #ppdup.navmin:not(.pop):not(.narrow){padding-left:78px}
  #ppdup.navmin:not(.pop):not(.narrow) .rail{width:78px;align-items:center;padding:12px 0 10px}
  #ppdup.navmin:not(.pop):not(.narrow) .rail > button:not(.rl-sub):not(.rl-acct){width:56px;flex-direction:column;justify-content:center;padding:10px 0;font-size:0}
  #ppdup.navmin:not(.pop):not(.narrow) .rail > button span{display:none}
  #ppdup.navmin:not(.pop):not(.narrow) .rail .rb{position:absolute;top:3px;right:4px;font-size:10px;line-height:15px;min-width:15px;padding:0 4px}
  #ppdup .rail .rl-sub{gap:10px;align-items:center}
  #ppdup .rail .rl-sub svg{width:18px!important;height:18px!important;flex:none}
  /* アイコンだけの表示でも、ログ・書き出し・更新履歴をアイコンで出す（名前はマウスを乗せると出る） */
  #ppdup.navmin:not(.pop):not(.narrow) .rail .rl-sub{width:56px!important;justify-content:center;padding:9px 0!important}
  #ppdup.navmin:not(.pop):not(.narrow) .rail .rl-sub span{display:none}
  #ppdup.pop .rail .rl-sub,#ppdup.pop .rail .rl-sep{display:none!important}
  /* マウスを乗せたときの説明（アイコンだけのボタン用。すぐ出る） */
  #pd-tip{position:fixed;z-index:2147483647;max-width:280px;padding:6px 10px;border-radius:8px;background:#11141a;color:#fff;font:600 12px/1.45 system-ui,-apple-system,'Hiragino Sans',sans-serif;box-shadow:0 6px 18px #0006;pointer-events:none;white-space:normal}
  #pd-tip[hidden]{display:none}
  #ppdup.navmin .rail .rl-acct,#ppdup.pop .rail .rl-acct{border:0!important;padding:6px!important}
  #ppdup.navmin .rail .rl-acct span,#ppdup.pop .rail .rl-acct span{display:none!important}
  #ppdup.pop [data-a=navtoggle]{display:none}
  /* 隠す */
  #ppdup.navhide:not(.pop):not(.narrow){padding-left:18px}
  #ppdup.navhide:not(.pop):not(.narrow) .rail{display:none}
  /* ドラッグ中は幅を指で追う */
  #ppdup.navdrag:not(.pop):not(.narrow){padding-left:var(--navw)!important}
  #ppdup.navdrag:not(.pop):not(.narrow) .rail{display:flex!important;width:var(--navw)!important;overflow:hidden}
  #ppdup.navdrag{user-select:none;cursor:ew-resize}
  /* つまみ（デリログの引き出しと同じ考え方。縦の短い線） */
  #ppdup .rl-grip{position:absolute;top:50%;left:236px;transform:translate(-50%,-50%);z-index:7;width:18px;height:64px;padding:0;border:1px solid var(--line);border-radius:10px;background:var(--panel);box-shadow:0 2px 8px #0003;cursor:ew-resize;display:flex;align-items:center;justify-content:center;touch-action:none}
  #ppdup .rl-grip i{width:4px;height:34px;border-radius:2px;background:var(--mute);opacity:.7}
  #ppdup .rl-grip:hover i{background:var(--pri);opacity:1}
  #ppdup.navmin .rl-grip{left:78px}
  #ppdup.navhide .rl-grip{left:0;transform:translate(0,-50%);border-left:0;border-radius:0 10px 10px 0;width:16px}
  #ppdup.navdrag .rl-grip{left:var(--navw)}
  #ppdup.pop .rl-grip,#ppdup.narrow .rl-grip{display:none}
  /* PC では引き出しのつまみで出し入れするので ☰ は出さない（スマホ・狭い画面では ☰ でメニューを開く） */
  #ppdup:not(.narrow) [data-a=navtoggle]{display:none}
  #ppdup.pop header .thm,#ppdup.pop header .hbtn[data-a=lang],#ppdup.pop .hbtn.hacct > span,#ppdup.pop header .wbtn-full > span{display:none!important}
  #ppdup.pop .hbtn.hacct{padding:0 5px!important}
  /* 狭い画面・スマホ：左メニューは ☰ で右から出す */
  #ppdup.narrow{padding-left:0!important}
  #ppdup.narrow .rail{display:none}
  #ppdup.narrow.navopen::before{content:"";position:absolute;inset:0;background:#1e243066;z-index:5}
  #ppdup.narrow.navopen .rail{box-sizing:border-box;display:flex;position:absolute;left:auto;right:0;top:0;bottom:0;width:min(300px,86vw);z-index:6;align-items:stretch;padding:16px 14px;background:var(--panel);box-shadow:-10px 0 30px #0003;gap:2px}
  #ppdup.narrow.navopen .rail > button:not(.rl-sub):not(.rl-acct){width:auto;flex-direction:row;justify-content:flex-start;gap:12px;padding:12px;border-radius:12px;font-size:15px;font-weight:800;color:var(--fg)}
  #ppdup.narrow.navopen .rail > button:not(.rl-acct) > span{display:block!important;flex:1;text-align:left}
  #ppdup.narrow.navopen .rail .rb{position:static}
  /* 上のバー */
  #ppdup header{border-bottom:1px solid var(--line)}
  #ppdup .hbtn{border-radius:12px!important;border:1px solid var(--line)!important;background:var(--panel)!important}
  #ppdup header .hbtn[data-a=lang] > span,#ppdup header .brand > .hbtn[data-a=addlink] > span{display:none}
  #ppdup header .hbtn[data-a=lang],#ppdup header .brand > .hbtn[data-a=addlink]{width:38px;padding:0!important;justify-content:center}
  @media (max-width:1500px){#ppdup header .hbtn[data-a=settings] > span,#ppdup header .hxl > span{display:none}#ppdup header .hbtn[data-a=settings],#ppdup header .hxl{width:38px;padding:0!important;justify-content:center}}
  #ppdup.narrow header .thm,#ppdup.narrow header .hbtn[data-a=lang],#ppdup.narrow header .brand > .hbtn[data-a=addlink],#ppdup.narrow header .hbtn[data-a=settings]{display:none!important}
  #ppdup.narrow .hbtn.hacct > span{display:none}
  #ppdup.narrow .brand .ver,#ppdup.narrow .wm small{display:none!important}
  #ppdup.narrow .brand{flex-wrap:nowrap}
  #ppdup.narrow .brand .sp{flex:1}
  #ppdup:not(.pop) header .pd-quota{flex:0 1 210px;width:210px}
  #ppdup:not(.pop) header .pd-quota .ql{display:none}
  @media (max-width:1700px){#ppdup:not(.pop) header .thm,#ppdup:not(.pop) header .hbtn[data-a=lang]{display:none!important}#ppdup:not(.pop) header .hq input{width:150px}}
  @media (max-width:1500px){#ppdup:not(.pop) header .hbtn.hacct > span,#ppdup:not(.pop) header .brand .ver{display:none}#ppdup:not(.pop) header .hbtn.hacct{padding:0 5px!important}}
  #ppdup .hbtn[data-a=edgescroll].on{background:var(--pri-soft)!important;border-color:var(--pri)!important;color:var(--pri)}
  #ppdup .hbtn.hic{width:38px;padding:0!important;justify-content:center}
  #ppdup .hbtn.hacct{border-radius:20px!important;padding:0 12px 0 5px!important;gap:6px}
  #ppdup .hbtn.hacct svg{width:26px!important;height:26px!important;padding:4px;box-sizing:border-box;border-radius:50%;background:var(--panel2);box-shadow:0 0 0 2px var(--ok)}
  #ppdup .hbtn.hacct.ng svg{box-shadow:0 0 0 2px var(--danger)}
  #ppdup .hbtn.hacct.ng{color:var(--danger)}
  #pd-acct{position:fixed;z-index:100006;width:280px;background:var(--panel,#fff);color:var(--fg,#1c1f26);border:1px solid var(--line,#dde0e6);border-radius:16px;box-shadow:0 14px 40px #0003;padding:14px 16px;display:flex;flex-direction:column;gap:6px;font:13px/1.5 system-ui,"Hiragino Sans",sans-serif}
  html.pd-dark #pd-acct{background:#1d2027;color:#e6e8ee;border-color:#2c303a}
  #pd-acct small{color:#6a7080;font-size:12px}
  #pd-acct .ln{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #8881}
  #pd-acct .acts{display:flex;gap:8px;margin-top:6px}
  #pd-acct button{flex:1;height:34px;border:1px solid #c5c9d2;border-radius:17px;background:none;color:inherit;font:inherit;font-weight:700;cursor:pointer}
  #pd-acct button:disabled{opacity:.45}
  /* ダッシュボード */
  #ppdup .db{display:flex;flex-direction:column;gap:16px;max-width:1400px;padding-bottom:10px}
  #ppdup .db-main{margin-bottom:6px}
  #ppdup .db-hd{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  #ppdup .db-hd h2{margin:0 6px 0 0;font-size:21px;font-weight:800}
  #ppdup .db-hd .sp{flex:1}
  #ppdup .db-chip{height:32px;padding:0 14px;border-radius:16px;display:inline-flex;align-items:center;font-weight:800;border:1px solid var(--line);background:var(--panel)}
  #ppdup .db-chip.on{background:var(--pri);border-color:var(--pri);color:#fff}
  #ppdup .db-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
  #ppdup .db-st{background:var(--panel);border-radius:18px;padding:14px 18px;box-shadow:0 2px 10px #0000000d;display:flex;flex-direction:column;gap:2px;min-width:0}
  #ppdup .db-st span{font-size:12px;color:var(--mute)}
  #ppdup .db-st b{font-size:28px;font-weight:800;line-height:1.2}
  #ppdup .db-st b small{font-size:13px}
  #ppdup .db-st.pri b{color:var(--pri)}
  #ppdup .db-st em{font-style:normal;font-size:11px;color:var(--mute);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #ppdup .db-main{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:14px;align-items:start}
  #ppdup .db-tasks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
  #ppdup .db-tk{display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:14px 16px;border:0;border-radius:18px;background:var(--tk-bg);color:#1e2430;font:inherit;text-align:left;cursor:pointer;transition:transform .1s}
  #ppdup .db-tk:hover{transform:translateY(-1px);box-shadow:0 4px 14px #0000001a}
  #ppdup .db-tk .n{width:24px;height:24px;border-radius:50%;background:#fff;color:var(--tk-fg);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800}
  #ppdup .db-tk b{font-size:15px}
  #ppdup .db-tk em{font-style:normal;font-size:12px;color:#4a5160}
  #ppdup .db-tk .go{margin-top:2px;font-size:13px;font-weight:800;color:var(--tk-fg)}
  #ppdup .db-tk.zero{background:var(--panel);box-shadow:inset 0 0 0 1px var(--line);color:var(--fg)}
  #ppdup .db-tk.zero em{color:var(--mute)}
  #ppdup .db-tk.zero .n{background:var(--panel2)}
  #ppdup .db-tk.next{box-shadow:0 0 0 2px var(--tk-fg)}
  html.pd-dark #ppdup .db-tk:not(.zero){filter:brightness(.92)}
  #ppdup .db-card{background:var(--panel);border-radius:18px;padding:14px 18px;box-shadow:0 2px 10px #0000000d;display:flex;flex-direction:column;gap:10px}
  #ppdup .db-ct{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:800}
  #ppdup .db-ct > i{width:8px;height:8px;border-radius:50%;background:var(--ok)}
  #ppdup .db-ct .sp{flex:1}
  #ppdup .db-ct .lnk{border:0;background:none;color:var(--pri);font:inherit;font-size:12px;font-weight:800;cursor:pointer}
  #ppdup .db-ths{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
  #ppdup .db-th{display:flex;flex-direction:column;gap:3px;padding:0;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;min-width:0}
  #ppdup .db-th .im{aspect-ratio:16/10;border-radius:10px;background:var(--panel2);overflow:hidden;display:flex;align-items:center;justify-content:center}
  #ppdup .db-th .im img{width:100%;height:100%;object-fit:cover}
  #ppdup .db-th .im svg{width:28px;height:34px}
  #ppdup .db-th b{font-size:11px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #ppdup .db-th small{font-size:10px;color:var(--mute)}
  /* 右下のボタン群（狭い画面では、下から出るメニュー） */
  #ppdup .sv-dock{position:sticky;bottom:0;align-self:flex-end;display:flex;flex-direction:column;gap:10px;padding:8px;border-radius:30px;background:var(--panel);box-shadow:0 10px 30px #0000002a;z-index:3}
  #ppdup .sv-dock .dk-h,#ppdup .sv-dock .dk-q{display:none}
  #ppdup .sv-dock .dk-b{display:flex;gap:10px}
  #ppdup .sv-dock button{height:44px;padding:0 18px;border:1px solid var(--line);border-radius:22px;background:var(--panel);color:var(--fg);font:inherit;font-size:14px;font-weight:800;cursor:pointer;white-space:nowrap}
  #ppdup .sv-dock button.pri{background:var(--pri);border-color:var(--pri);color:#fff}
  @media (max-width:1100px){#ppdup .db-stats{grid-template-columns:repeat(2,minmax(0,1fr))}#ppdup .db-main{grid-template-columns:1fr}}
  #ppdup.narrow .db-tasks{grid-template-columns:1fr 1fr}
  #ppdup.narrow .db-hd .note{display:none}
  #ppdup.narrow .db{padding-bottom:90px}
  #ppdup.narrow .sv-dock{position:fixed;left:0;right:0;bottom:0;align-self:auto;border-radius:24px 24px 0 0;padding:6px 14px 16px}
  #ppdup.narrow .sv-dock .dk-h{display:flex;justify-content:center;height:18px;border:0;padding:0;background:none}
  #ppdup.narrow .sv-dock .dk-h i{width:44px;height:5px;border-radius:3px;background:var(--ctl-line)}
  #ppdup.narrow .sv-dock .dk-b{flex-wrap:wrap}
  #ppdup.narrow .sv-dock .dk-b button{flex:1 1 40%;height:48px;border-radius:24px}
  #ppdup.narrow .sv-dock .dk-b button.pri{flex-basis:100%;order:-1}
  #ppdup.narrow .sv-dock.open .dk-q{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
  #ppdup .sv-dock .dk-q button{height:auto;padding:12px 8px;border-radius:16px;display:flex;flex-direction:column;align-items:flex-start;gap:2px;background:var(--panel2);border:0}
  #ppdup .sv-dock .dk-q small{font-size:11px;color:var(--mute);font-weight:500}
  `;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  const STEPS = [
    { v: 'scan', t: '読み込む', d: '開いているフォルダ以下のファイルとフォルダを読み込みます。ほかの機能はこのあとで使えます。' },
    { v: 'junk', t: '不要ファイルを削除', d: '広告・宣伝のファイルや 10MB 以下のファイルなど、作品と関係ないものを削除します。ほかのステップでは対象から外します（使うかどうかを選べます）。' },
    { v: 'name', t: 'ファイル名を整える', d: 'ファイル名の先頭を品番（FC2-PPV-1234567・ABC-123 など）にそろえ、元のタイトルは「_」のあとに残します。サイト名や広告などの余計な文字は消します（使うかどうかを選べます）。' },
    { v: 'sort', t: '作品ごとに仕分け', d: '複数の作品が入ったフォルダの中に品番フォルダを作り、ファイルを振り分けます。' },
    { v: 'ren', t: 'フォルダ名を揃える', d: 'フォルダ名を中のファイル名（品番）に揃えます。同名があれば (1) を付けます。' },
    { v: 'dup', t: '重複を比べて削除', d: '同じファイルをサムネイルとサイズで比べ、チェックしたものを削除します。' },
    { v: 'clean', t: '(1)を外す・片付け', d: '重複を削除したあとに残った空フォルダをゴミ箱へ移し、同じ名前で入れ子になったフォルダをまとめ、不要になった (1) を外します。' },
    { v: 'seller', t: '販売者ごとに仕分け', d: '作品フォルダの品番から販売者を調べ、ホーム/販売者別/販売者名（販売者ID）/ へ移動します。調べるだけでは何も動かしません（使うかどうかを選べます）。' },
  ];

  // 線のアイコン（currentColor で色を合わせる）
  // ---- 共通のアイコン部品 ----
  //   決まり：アイコンは文字（⚙ ✕ ⛶ など）ではなくこの IC の絵を使う（端末のフォントで小さく潰れるため）。
  //           アイコンだけのボタンには必ず title（マウスを乗せたときの説明）を付ける。大きさは 20px が基本
  const SVG = (d) => `<svg class="ic" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  // 左メニュー・左メニューの再生のタブで使うアイコン（同じ絵は 1 か所だけに書く）
  const RAIL_IC = {
    flow: '<svg viewBox="0 0 24 24"><path d="M4 6h10M4 12h16M4 18h7" /><circle cx="18" cy="6" r="2"/><circle cx="15" cy="18" r="2"/></svg>',
    tree: '<svg viewBox="0 0 24 24"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h8.5A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/><path d="M7 11h10M7 15h6"/></svg>',
    dl: '<svg viewBox="0 0 24 24"><path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 8.5a4 4 0 0 1-.5 7.97"/><path d="M12 11v9M8.8 17l3.2 3 3.2-3"/></svg>',
    recent: '<svg viewBox="0 0 24 24"><circle cx="11" cy="12" r="7.5"/><path d="M11 8v4.2l2.6 1.6"/><path d="M19.5 3.5v4M17.5 5.5h4"/></svg>',
    cont: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M10 8.5v5l4-2.5z"/><path d="M3 20.5h11" stroke-width="2.4"/></svg>',
    cand: '<svg viewBox="0 0 24 24"><path d="M5 7h14M9.5 7V5h5v2"/><path d="M7 7l.8 12.2A1.5 1.5 0 0 0 9.3 20.6h5.4a1.5 1.5 0 0 0 1.5-1.4L17 7"/><path d="M10 11.5l4 4M14 11.5l-4 4"/></svg>',
    hist: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/><path d="M10.5 9.2v5.6l4.4-2.8z"/></svg>',
    people: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0"/><circle cx="16.8" cy="9.5" r="2.6"/><path d="M15.5 14.6a4.6 4.6 0 0 1 5 4.9"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 3.8l2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8z"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M9.5 7V4.8h5V7"/><path d="M6 7l1 12.2A1.5 1.5 0 0 0 8.5 20.6h7a1.5 1.5 0 0 0 1.5-1.4L18 7"/><path d="M10 11v6M14 11v6"/></svg>',
    add: '<svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2"/></svg>',
    scan: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/></svg>',
    set: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    log: '<svg viewBox="0 0 24 24"><path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20z"/><path d="M14 3.5V8h4M10 12h5M10 15.5h5"/></svg>',
    setinfo: '<svg viewBox="0 0 24 24"><path d="M8 4v12M4.5 12.5L8 16l3.5-3.5"/><path d="M16 20V8M12.5 11.5L16 8l3.5 3.5"/></svg>',
    changelog: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  };
  const IC = {
    gear: SVG('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    sun: SVG('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    moon: SVG('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'),
    globe: SVG('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9M12 3C9.5 5.6 8.2 8.6 8.2 12s1.3 6.4 3.8 9"/>'),
    x: SVG('<path d="M6 6l12 12M18 6L6 18"/>'),
    play: SVG('<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>'),
    pause: SVG('<path d="M7 4.5h3.5v15H7zM13.5 4.5H17v15h-3.5z" fill="currentColor" stroke="none"/>'),
    prev: SVG('<path d="M6 5v14"/><path d="M19 5.5v13L9 12z" fill="currentColor"/>'),
    next: SVG('<path d="M18 5v14"/><path d="M5 5.5v13L15 12z" fill="currentColor"/>'),
    vol: SVG('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>'),
    mute: SVG('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>'),
    full: SVG('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
    search: SVG('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
    up: SVG('<path d="M12 19V5M5 12l7-7 7 7"/>'),
    folder: SVG('<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h8.5A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/>'),
    dedupe: SVG('<rect x="3" y="4" width="11" height="13" rx="2"/><path d="M8 8h11a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H10"/>'),
    alert: SVG('<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/>'),
    expand: SVG('<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>'),
    minus: SVG('<path d="M6 12h12"/>'),
    link: SVG('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2"/>'),
  };
  const btn = document.createElement('button'); btn.id = 'ppdup-btn'; btn.innerHTML = LOGO + '<span>Dedupe</span><i class="grip" aria-hidden="true">⋮⋮</i>'; btn.title = 'PikPak Distill – Dedupe（クリックでメニュー・ドラッグで移動・右クリックで置き場所）'; document.body.appendChild(btn);
  const fab = document.createElement('div'); fab.id = 'ppdup-fab'; document.body.appendChild(fab);
  const root = document.createElement('div'); root.id = 'ppdup';
  root.innerHTML = `
    <aside class="rail" data-r="rail">
      <button data-a="toflow" data-rail="flow" title="整理（1〜7のステップ）">${RAIL_IC.flow}<span>整理</span></button>
      <button data-a="tree" data-rail="tree" title="フォルダ一覧（Finder やエクスプローラーのように、フォルダを開いて中身を見られます）">${RAIL_IC.tree}<span>フォルダ​一覧</span></button>
      <button data-a="lib" data-v="dl" data-rail="lib-dl" title="追加したもの（リンク・マグネットで追加した作品の保存状況とダウンロードの進み具合）">${RAIL_IC.dl}<span>追加したもの</span><i class="rb" data-r="rb-dl"></i></button>
      <button data-a="lib" data-v="recent" data-rail="lib-recent" title="最近追加したもの（追加日の新しい順）">${RAIL_IC.recent}<span>最近の追加</span><i class="rb" data-r="rb-recent"></i></button>
      <button data-a="lib" data-v="cont" data-rail="lib-cont" title="続きを見る（途中で止めた動画）">${RAIL_IC.cont}<span>続きを見る</span></button>
      <button data-a="lib" data-v="people" data-rail="lib-people" title="出演者・販売者（作品の情報から、出演者・販売者ごとに作品を並べます。フォルダは動かしません）">${RAIL_IC.people}<span>出演者・販売者</span></button>
      <button data-a="lib" data-v="cand" data-rail="lib-cand" title="消す候補（見ながら仕分けで D を付けたもの）">${RAIL_IC.cand}<span>消す候補</span><i class="rb" data-r="rb-cand"></i></button>
      <button data-a="lib" data-v="hist" data-rail="lib-hist" title="再生した履歴">${RAIL_IC.hist}<span>再生履歴</span><i class="rb" data-r="rb-hist"></i></button>
      <button data-a="lib" data-v="star" data-rail="lib-star" title="スター付き">${RAIL_IC.star}<span>スター</span><i class="rb" data-r="rb-star"></i></button>
      <button data-a="lib" data-v="trash" data-rail="lib-trash" title="ゴミ箱（中身を見る・元に戻す・完全に削除）">${RAIL_IC.trash}<span>ゴミ箱</span><i class="rb" data-r="rb-trash"></i></button>
      <button data-a="addlink" data-rail="add" title="リンク・マグネットを追加">${RAIL_IC.add}<span>リンク</span></button>
      <button data-a="rescan" data-rail="scan" title="最新の状態を読み込み直す">${RAIL_IC.scan}<span>再読み込み</span></button>
      <button data-a="settings" data-rail="set" title="設定（表示・再生・整理・情報）">${RAIL_IC.set}<span>設定</span></button>
      <div class="rl-sep"></div>
      <button class="rl-sub" data-a="log" title="ログを見る・不具合を報告する">${RAIL_IC.log}<span>ログ・不具合の報告</span></button>
      <button class="rl-sub" data-a="setinfo" title="設定や記録を書き出す・読み込む">${RAIL_IC.setinfo}<span>書き出し／読み込み</span></button>
      <button class="rl-sub" data-a="changelog" title="更新履歴（いまは v${VER}）">${RAIL_IC.changelog}<span>更新履歴（v${VER}）</span></button>
      <button class="rl-acct" data-a="acct" data-r="acct" title="PikPak のログイン状態と同期"></button>
    </aside>
    <header>
      <div class="brand"><button class="hbtn hic" data-a="navtoggle" title="左のメニューの表示を切り替える" aria-label="左のメニューの表示を切り替える"><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>${LOGO}<h1 class="wm" aria-label="PikPak Distill – Dedupe"><small>PIKPAK DISTILL</small><span class="gw"><i aria-hidden="true">Dedupe</i><i aria-hidden="true">Dedupe</i><b>Dedupe</b></span></h1><span class="ver" title="いま動いているバージョン">v${VER}</span><span class="sp"></span>
        <label class="hq" title="名前で絞り込み">${IC.search}<input type="text" data-a="tq" placeholder="名前で絞り込み・検索"></label><span class="seg hqs" data-r="tqs" title="探す範囲"><button data-a="tqs" data-v="here">このフォルダ</button><button data-a="tqs" data-v="all">すべて</button></span>
        <div class="pd-quota" data-r="quota"></div>
        <span class="seg thm" data-r="theme" role="group" aria-label="テーマ"></span>
        <button class="hbtn" data-a="lang" title="表示言語を切り替える">${IC.globe}<span class="raw" data-r="langname"></span></button>
        <button class="hbtn" data-a="addlink" title="リンク・マグネットを追加（追加する前に、もうあるか確かめる）">${IC.link}<span>リンクを追加</span></button>
        <button class="hbtn hic" data-a="edgescroll" data-r="edgebtn" title="端でスクロール：マウスを一覧の下（上）の端へ持っていくと、ゆっくりスクロールします" aria-label="端でスクロール"><svg viewBox="0 0 24 24"><path d="M12 4v16M8 8l4-4 4 4M8 16l4 4 4-4"/></svg></button>
        <button class="hbtn hic" data-a="bell" title="お知らせ（エラー・新しいバージョン）" aria-label="お知らせ"><svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg><i data-r="logbadge"></i></button>
        <button class="hbtn hacct" data-a="acct" data-r="acctbtn" title="PikPak のログイン状態と同期"></button>
        <button class="hbtn" data-a="settings" title="設定（表示・再生・整理・情報）">${IC.gear}<span>設定</span></button>
        <button class="hbtn wbtn-full" data-a="tofull" title="PikPak の画面を Dedupe に切り替えて、広い画面で使う">${IC.expand}<span>全画面で開く</span></button>
        <button class="hbtn hxl wbtn-min" data-a="mini" title="小さくする（右下のボタンに戻す。作業中の内容はそのまま）">${IC.minus}<span>小さくする</span></button>
        <button class="hbtn hxl" data-a="close" title="Dedupe を閉じて、PikPak の画面に戻る（作業中の内容はそのまま）">${IC.x}<span>Dedupe を閉じる</span></button>
      </div>
      <nav data-r="nav"></nav>
    </header>
    <div class="pd-upd" data-r="upd" hidden></div>
    <div class="pd-rsban" data-r="rsban" hidden></div>
    <div class="pd-popban" data-r="popban"><span>PikPak の画面を Dedupe に切り替えて使うこともできます。一覧が広くなり、キー操作やドラッグも使いやすくなります。</span><button class="pri" data-a="tofull">全画面で開く</button><button data-a="fullnext">次から全画面で開く</button><button data-a="banclose">閉じる</button></div>
    <div class="tb" data-r="tb"></div>
    <div class="tsel" data-r="tsel"></div>
    <main data-r="main"></main>
    <div class="prog" data-r="prog"><div class="pr1"><span data-r="status"></span><span data-r="pright"></span></div><div class="pr2"><span class="pb"><i data-r="pbar"></i></span><b class="pp" data-r="ppct"></b><span class="ps" data-r="psub"></span><button class="pstop" data-a="stop" title="中断（そこまでの分は反映されます）">中断</button></div></div>`;
  document.body.appendChild(root);

