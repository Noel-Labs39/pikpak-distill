// ==UserScript==
// @name         PikPak Distill – Dedupe
// @namespace    local.pikpak.dupcompare
// @author       Noel Labs
// @license      MIT
// @homepage     https://github.com/Noel-Labs39/pikpak-distill
// @supportURL   https://github.com/Noel-Labs39/pikpak-distill/issues
// @updateURL    https://raw.githubusercontent.com/Noel-Labs39/pikpak-distill/main/pikpak-distill.user.js
// @downloadURL  https://raw.githubusercontent.com/Noel-Labs39/pikpak-distill/main/pikpak-distill.user.js
// @version      4.23.1
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJwcGR1cC1sZyIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgeTI9IjEiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iIzIyYzNhNiIvPjxzdG9wIG9mZnNldD0iLjUiIHN0b3AtY29sb3I9IiMyZjZiZmYiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM3YjVjZmYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSIxOCIgZmlsbD0iIzE0MTYxYyIvPjxyZWN0IHg9IjkiIHk9IjE0IiB3aWR0aD0iMTMiIGhlaWdodD0iMTYiIHJ4PSIzIiBmaWxsPSJub25lIiBzdHJva2U9InVybCgjcHBkdXAtbGcpIiBzdHJva2Utb3BhY2l0eT0iLjUiIHN0cm9rZS13aWR0aD0iMyIvPjxyZWN0IHg9IjkiIHk9IjM0IiB3aWR0aD0iMTMiIGhlaWdodD0iMTYiIHJ4PSIzIiBmaWxsPSJub25lIiBzdHJva2U9InVybCgjcHBkdXAtbGcpIiBzdHJva2Utb3BhY2l0eT0iLjUiIHN0cm9rZS13aWR0aD0iMyIvPjxwYXRoIGQ9Ik0yMiAyMmg2bDUgMTBNMjIgNDJoNmw1LTEwIiBmaWxsPSJub25lIiBzdHJva2U9InVybCgjcHBkdXAtbGcpIiBzdHJva2Utb3BhY2l0eT0iLjciIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTM2IDE4aDdhMTQgMTQgMCAwIDEgMCAyOGgtN3oiIGZpbGw9Im5vbmUiIHN0cm9rZT0idXJsKCNwcGR1cC1sZykiIHN0cm9rZS13aWR0aD0iNS41IiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PGNpcmNsZSBjeD0iNTEiIGN5PSI0NSIgcj0iNiIgZmlsbD0iI2ZmYjAyMCIgc3Ryb2tlPSIjMTQxNjFjIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNNDguMyA0NWwxLjkgMS45IDMuMS0zLjQiIHN0cm9rZT0iIzE0MTYxYyIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=
// @description  PikPakの重複ファイルを、サムネイルとサイズで比べて整理するツール。広告・宣伝などの不要ファイルの削除、作品ごとの仕分け、フォルダ名の整合、(1)の除去、チェックしたファイルの削除（ゴミ箱／完全削除）に対応。
// @match        https://mypikpak.com/*
// @match        https://fd2ppv.cc/articles/*
// @match        https://fc2cmadb.com/articles/*
// @match        https://video.dmm.co.jp/av/content/*
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/hls.js@1.6.15/dist/hls.min.js#sha256=413a83e2bb0c77ed0bf0be105d539d17ef45dfd984a0b13ecd3b14a901383938
// @run-at       document-idle
// ==/UserScript==
