// PikPak Distill – Dedupe（Mac・iPhone・iPad 用アプリ）
// PikPak の Web 画面をアプリの中に表示し、Dedupe のスクリプトを組み込む。
import SwiftUI

@main
struct DedupeApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        #if os(macOS)
        .defaultSize(width: 1400, height: 900)
        #endif
    }
}
