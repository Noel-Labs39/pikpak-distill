import SwiftUI
import WebKit

struct ContentView: View {
    @StateObject private var model = BrowserModel()

    var body: some View {
        ZStack {
            if let script = model.script {
                PikPakWebView(model: model, script: script)
            } else {
                ProgressView("Dedupe を準備しています…")
            }
        }
        .sheet(item: $model.popup) { pop in
            PopupView(popup: pop) { model.popup = nil }
        }
        .task { await model.loadScript() }
        #if os(iOS)
        .ignoresSafeArea(.container, edges: .bottom)
        #endif
    }
}

// 外部サイト（販売者の調査など）を開く小さな画面
struct PopupView: View {
    let popup: Popup
    let close: () -> Void
    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Text(popup.webView.url?.host() ?? "").font(.footnote).foregroundStyle(.secondary)
                Spacer()
                Button("閉じる", action: close)
            }
            .padding(10)
            Divider()
            PopupWebView(webView: popup.webView)
        }
        #if os(macOS)
        .frame(minWidth: 900, minHeight: 640)
        #endif
    }
}
