# CLAUDE.md — PikPak Distill の開発ルール

Claude（Claude Code など）がこのリポジトリで作業するときに、最初に読むファイルです。
人が読んでも分かるように書いています。流れの詳細は [CONTRIBUTING.md](CONTRIBUTING.md) にあります。

## 進め方（必ず守る）

1. **機能を変えるときは、内容を書いて許可をもらってから実装する。** 許可を取らずに進めない。
   - 不具合の調査（コード・ログを読む）は、許可なしで進めてよい。
   - 提案には「何が起きているか（コードやログの根拠）」と「どう直すか」を分けて書く。推測と確認済みを区別する。
2. **画面（UI）を変えるときは、先にデザインボードで案を出す。**
   ボード：https://claude.ai/artifact/GpmsYV8FTPjaji9cn9sM5X（ボードを 1 枚追加し、`title` は「AH. …」のように通し記号を付ける）
3. **テストを必ず実行する。** 新しい動きには新しいテストを足す（下の「テスト」）。
4. **PR を出す前に、変えた画面のスクリーンショットを見せる。**
5. **PR は 1 本ずつ。** 前の PR がマージされてから次の PR を出す（版の番号と CHANGELOG がぶつかるため）。
6. コミット・PR の本文は日本語。

## UI の決まり

- **全画面で共通の UI にする。** 同じ働きの部品（簡易プレーヤー・一覧・確認画面・ステップの型 StepKit）は 1 つを使い回す。場所ごとに作らない。
- **万人に優しい作り。** 専門用語を避け、次に何をすればよいかを画面で示す。
- アイコンだけのボタンには必ずツールチップ（`title`）と `aria-label` を付ける。
- キーボードで操作できるようにする（Esc は「いちばん手前のものだけ閉じる」）。スマホでは長押しを右クリックの代わりにする。
- ライト・ダーク両方で見え方を確かめる。

## ソースの置き場所（直すのは src/）

- **`pikpak-distill.user.js` は直接直さない。** `src/` の部品をつないで作る（`npm run build`）。直したら必ず組み立てて、両方をコミットする。
- 配信先（Tampermonkey の自動更新・Mac アプリ）は main 直下の `pikpak-distill.user.js` を読むので、組み立てた結果もリポジトリに入れておく。
- GitHub の試験が「`src/` から組み立てた結果と一致するか」を確かめる（`npm run check`）。
- 部品は `src/<番号-分類>/<番号-名前>.js`。番号の順につなぐ。これらは「1 つの大きな関数を区切りごとに切ったもの」なので、部品どうしは同じ変数を共有している。
- **判定と通信の部分は本当のモジュール（`src/core/*.mjs`）。** 品番の読み取り（`work-id.mjs`）、整理の判定（`plan.mjs`：重複・フォルダ名・作品ごとの仕分け・ファイル名・不要ファイル・仕上げ）、PikPak とのやり取り（`pikpak-api.mjs`：ログイン情報・確認用トークン・やり直しの決まり。fetch・保存領域・ログ・待ち時間は外から渡す）、左メニューの一覧の中身（`library.mjs`：出演者・販売者の索引・関連作品・続きを見る・消す候補・再生した履歴・最近の追加・ゴミ箱の取りこぼし。描くのは `src/70-lib`）、8. 販売者の判定（`seller-plan.mjs`：品番の拾い方・販売者の決め方・仕分けの計画）。画面の変数には頼らず、必要なものは引数で受け取る。組み立てのときに esbuild で 1 つにまとめて `src/20-core/015-core.js` の印の場所に入れ、画面側からは今までと同じ名前で呼ぶ（画面側の状態を渡す包みもそこにある）。
- 判定を直したら、`tests/unit/` に見本を足して `npm run test:unit` で確かめる。

## 版の番号（3 か所をそろえる）

- `src/00-header/00-meta.js` の `// @version`
- `src/10-sites/01-lookup-pages.js` の `const VER = '…'`
- `CHANGELOG.md` の先頭（`# 変更履歴` の下に `## X.Y.Z`、新しいものが上）

`main` にマージされると自動でリリースされる（`.github/workflows/release.yml`）。

## 公開するものに入れないもの

- 利用者の実際の作品名・販売者名・品番・ログ。テストや例では「さんぷる」「販売X」「FC2-PPV-1234567」のような見本の名前を使う。
- パスワード・ログイン情報。年齢確認や Cloudflare の確認画面は、利用者が自分で押す（ツールが押さない）。

## テスト

```bash
npm install                     # 初回だけ（esbuild・playwright）
npx playwright install chromium # 初回だけ
npm run build                   # src/ から pikpak-distill.user.js を組み立てる
npm test                        # 組み立ての一致＋構文チェック＋判定の単体テスト＋画面の試験すべて
npm run test:unit               # 判定の単体テストだけ（数秒）
node tests/e2e/run.js scan      # 名前に scan を含む試験だけ
```

- `tests/unit/work-id.test.mjs`：品番の読み取りの見本（追加したら件数が増える）。
- `tests/unit/plan.test.mjs`：整理の判定の試験（見本のファイル一覧から計画を確かめる。node:test）。
- `tests/unit/library.test.mjs`：左メニューの一覧の中身の試験（索引・名前の並び・関連作品・続き・候補・履歴・最近・取りこぼし）。
- `tests/unit/seller-plan.test.mjs`：販売者の判定の試験（品番の拾い方・決め方・計画：入れ子・販売者違い・同じ品番の複数フォルダなど）。
- `tests/unit/store.test.mjs`：大きい記録の置き場所の試験（初回の引っ越し・まとめ書き・消す・古い版のあと・使えないとき・失敗）。
- `tests/unit/pikpak-api.test.mjs`：PikPak とのやり取りの試験（模擬の返事で、混雑・ログイン切れ・認証コード・削除済み・通信失敗・複数ページを確かめる）。
- `tests/e2e/*_t.js`：PikPak の画面と API を模した中でスクリプトを動かす試験。共通の試験台は `tests/e2e/h.js`（`open(tree, url, pre)`：`tree` がフォルダの中身、`pre` が読み込み前に動かすコード）。
  - 結果は `OK …` / `NG …` を 1 行ずつ出す。`NG` かページのエラー（`pageerr`）が出たら失敗。
  - スクリーンショットは `tests/e2e/out/`（git に入れない）。
- GitHub Actions（`.github/workflows/test.yml`）が PR ごとに全部を実行する。

## 中身の地図（src/）

組み立てると 1 ファイルのユーザースクリプトになる。部品の分け方は `src/` のフォルダ（`20-core` 判定と API、`30-ui` 画面の土台、`40-steps` 1〜8 のステップ、`50-tree` フォルダ一覧、`60-player` プレーヤー、`70-lib` 左メニューの一覧、`80-misc` そのほか）。

| 区切り | 中身 |
| --- | --- |
| 先頭 | 調べる先のサイト（fd2ppv.cc・fc2cmadb.com・FANZA）で動く部分。結果を `postMessage` で PikPak に返す |
| `api()` | PikPak の API（`src/core/pikpak-api.mjs`）。ログイン切れ・認証コード（captcha）・混雑（429）の扱いはここ |
| `scanApi()` / `runScan()` | 1. 読み込み（同時 6 本・読めないフォルダは飛ばす・ログイン切れは続きから） |
| StepKit | 3〜5・7 の共通の型（一覧・タブ・チェック・実行） |
| 6. 重複 | `buildGroups()` |
| 8. 販売者 | `buildSellerPlan()`（`src/core/seller-plan.mjs`）/ `runSeller()`。再調査したものは My Pack に戻して 1 から |
| 作品の情報 | `lookupAny()`（fd2ppv を先に、足りないときだけ fc2cmadb）・`wInfo`・`sellerDb` |
| 簡易プレーヤー | `pvHeadHtml` / `pvFootHtml` / `pvWire`（共通の形）・情報の枠 `pvInfoRender` |
| 左メニューの一覧 | `openLib` / `libFetch` / `renderLib`（最近の追加・出演者・販売者など）・右クリック `workMenu` |

### 共有している状態（多くの部品から読み書きされる変数）

新しい部品から使うときは、ここに書いた置き場所を見る。書き換えたら、関係する画面を描き直す（`refreshView()` など）。

| 変数 | 中身 | 置き場所 |
| --- | --- | --- |
| `files` / `folders` / `meta` | 読み込み結果（ファイル・フォルダ・いつどこを読んだか）。保存は `saveAll()` | `src/30-ui/125-state.js` |
| `decision` | 重複で「残す／消す」を選んだ記録 | 同上 |
| `view` / `mode` | いま開いている画面／1〜8 の流れで見せるか 1 つだけか | 同上 |
| `busy` / `afterScan` | 実行中か（ほかの操作を止める）／読み込みのあとに開く画面 | 同上 |
| `splan` `cplan` `rplan` `nplan` `jplan` | 各ステップの計画 | 同上 |
| `LANG` | 表示の言語 | `src/30-ui/11-i18n.js` |
| `tree` / `treeSel` / `treeCur` など | フォルダ一覧の並び・選択・いまの行 | `src/50-tree/235-tree-state.js` |
| `sellerDb` / `wInfo` | 販売者の記録／作品の情報 | `src/40-steps/23-s8-seller.js` |
| `libSt` | 左メニューの一覧（最近の追加・出演者・販売者など）の状態 | `src/70-lib/35-rail-lists.js` |

保存先（キーは `ppdup:…:v1`）
- **大きい記録は IndexedDB**（`src/core/store.mjs`・用意は `src/20-core/016-store.js`）：読み込み結果 `scan` / `folders`、作品の情報 `winfo`、販売者 `seller`、再生の記録 `media`、ログ `log`。起動のはじめに全部をメモリへ読み、あとは `lsGet` / `lsSet` / `lsJson` / `lsSetJson` / `lsDel` で今までどおり読み書きする（書き込みはまとめて送る）。**`localStorage` を直接さわらず、必ずこの関数を通す。**
- そのほかの小さい設定は localStorage（`scanmeta` など）。IndexedDB が使えないときは全部 localStorage。
- 対象を増やすときは `016-store.js` の `keys` に足す（初回に localStorage から自動で写る）。
保存の形を変えるときは、古い形を読み替える処理（起動時の後始末）を必ず付ける。

## ログの読み方（不具合の報告で送られてくるもの）

- `認証コードが無効です … HTTP 400`：PikPak は**削除済みのファイル・フォルダ**にもこれを返す。ログイン切れとは限らない。
  - 1 件取り（`apiGet` / `apiGetOne`）は `{ gone: true }` で送り、この返事を削除済み（`e.gone`）として扱う。ログイン切れにはしない。削除済みと分かった id は `goneIds` に覚え、読み込み直すまで取りに行かない。
- `ログイン期限切れのため画面を再読み込み` が続く：再読み込みの歯止め（10 分に 2 回）を確認する。
- `読み込み完了：フォルダ 1 ／ ファイル 1`：読む場所（いま開いているフォルダかホーム全体か）を確認する。
- `作品の調査：… 確認画面で止まった`：調べる先のサイトの年齢確認。利用者が押す必要がある。
