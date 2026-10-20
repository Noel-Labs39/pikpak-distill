# Dedupe アプリ（Mac・iPhone・iPad）

PikPak の Web 画面をアプリの中に全画面で表示し、Dedupe（`pikpak-distill.user.js`）を組み込みます。

- ログインは PikPak の画面で行います（ログイン情報はアプリの中に残ります）
- スクリプトは起動のたびに GitHub の最新版を読み込みます（通信できないときは前回の版、それもなければアプリに同梱した版）
- 販売者の調査などで開く外部サイトは、アプリの中の小さな画面で開きます

## 作り方（初回だけ）

1. Xcode →「File」→「New」→「Project…」→「Multiplatform」→「App」
   - Product Name：`DedupeApp`
   - Interface：SwiftUI ／ Language：Swift ／ Storage：None
2. 作られた `ContentView.swift` と `DedupeAppApp.swift`（名前は Xcode が付けたもの）を削除する
3. このフォルダの `DedupeApp/` にある 4 つのファイル（`DedupeApp.swift`・`ContentView.swift`・`BrowserModel.swift`・`PikPakWebView.swift`）を、Xcode の左の一覧の `DedupeApp` フォルダへドラッグする（「Copy items if needed」にチェック）
4. リポジトリ直下の `pikpak-distill.user.js` も同じようにドラッグする（通信できないとき用の同梱版）
5. 左の一覧で一番上のプロジェクト → TARGETS の `DedupeApp` →「Signing & Capabilities」
   - 「Team」で自分の Apple ID を選ぶ
   - 「App Sandbox」の「Outgoing Connections (Client)」にチェック（Mac で通信するために必要）
   - 同じ「App Sandbox」の「File Access」→「User Selected File」を「Read/Write」にする（書き出し・読み込みに必要）

## 動かす

- Mac：上の実行先で「My Mac」を選んで ▶
- iPhone・iPad：ケーブルでつなぎ、実行先でその端末を選んで ▶
  - 初回は端末の「設定」→「一般」→「VPN とデバイス管理」で、自分の Apple ID を「信頼」する
  - 無料の Apple ID では、7 日ごとに Xcode から入れ直しが必要です
