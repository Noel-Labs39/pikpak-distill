import SwiftUI
import WebKit

#if os(macOS)
typealias PlatformViewRepresentable = NSViewRepresentable
#else
typealias PlatformViewRepresentable = UIViewRepresentable
#endif

struct PikPakWebView: PlatformViewRepresentable {
    let model: BrowserModel
    let script: String

    func makeCoordinator() -> WebUI { WebUI(model: model) }

    #if os(macOS)
    func makeNSView(context: Context) -> WKWebView { make(context) }
    func updateNSView(_ v: WKWebView, context: Context) {}
    #else
    func makeUIView(context: Context) -> WKWebView { make(context) }
    func updateUIView(_ v: WKWebView, context: Context) {}
    #endif

    private func make(_ context: Context) -> WKWebView {
        let wv = model.makeWebView(script: script)
        wv.uiDelegate = context.coordinator
        wv.navigationDelegate = context.coordinator
        return wv
    }
}

struct PopupWebView: PlatformViewRepresentable {
    let webView: WKWebView
    #if os(macOS)
    func makeNSView(context: Context) -> WKWebView { webView }
    func updateNSView(_ v: WKWebView, context: Context) {}
    #else
    func makeUIView(context: Context) -> WKWebView { webView }
    func updateUIView(_ v: WKWebView, context: Context) {}
    #endif
}

// alert・confirm・prompt（Dedupe の確認画面）と、新しいウィンドウ（販売者の調査）を扱う
@MainActor
final class WebUI: NSObject, WKUIDelegate, WKNavigationDelegate {
    let model: BrowserModel
    init(model: BrowserModel) { self.model = model }

    // window.open：同じ設定のまま新しい画面を作って返す（window.opener が使える）
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        let pop = WKWebView(frame: .zero, configuration: configuration)
        pop.customUserAgent = webView.customUserAgent
        pop.uiDelegate = self
        model.popup = Popup(webView: pop)
        return pop
    }

    // window.close（調べ終わったときなど）
    func webViewDidClose(_ webView: WKWebView) {
        if model.popup?.webView === webView { model.popup = nil }
    }

    // 「更新する」「変更点」などのリンクは、通常のブラウザで開く
    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if let u = action.request.url, action.targetFrame == nil, let host = u.host(), host.contains("github") {
            openExternal(u); decisionHandler(.cancel); return
        }
        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        ask(message, buttons: ["OK"]) { _ in completionHandler() }
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        ask(message, buttons: ["OK", "キャンセル"]) { i in completionHandler(i == 0) }
    }

    func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String, defaultText: String?, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (String?) -> Void) {
        #if os(macOS)
        let a = NSAlert(); a.messageText = prompt
        let f = NSTextField(frame: NSRect(x: 0, y: 0, width: 320, height: 24)); f.stringValue = defaultText ?? ""
        a.accessoryView = f; a.addButton(withTitle: "OK"); a.addButton(withTitle: "キャンセル")
        completionHandler(a.runModal() == .alertFirstButtonReturn ? f.stringValue : nil)
        #else
        let a = UIAlertController(title: nil, message: prompt, preferredStyle: .alert)
        a.addTextField { $0.text = defaultText }
        a.addAction(UIAlertAction(title: "キャンセル", style: .cancel) { _ in completionHandler(nil) })
        a.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler(a.textFields?.first?.text) })
        topController()?.present(a, animated: true)
        #endif
    }

    private func ask(_ message: String, buttons: [String], done: @escaping (Int) -> Void) {
        #if os(macOS)
        let a = NSAlert(); a.messageText = message
        buttons.forEach { a.addButton(withTitle: $0) }
        let r = a.runModal()
        done(r == .alertFirstButtonReturn ? 0 : 1)
        #else
        let a = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        for (i, b) in buttons.enumerated() {
            a.addAction(UIAlertAction(title: b, style: i == 0 ? .default : .cancel) { _ in done(i) })
        }
        guard let top = topController() else { done(buttons.count > 1 ? 1 : 0); return }
        top.present(a, animated: true)
        #endif
    }

    private func openExternal(_ u: URL) {
        #if os(macOS)
        NSWorkspace.shared.open(u)
        #else
        UIApplication.shared.open(u)
        #endif
    }

    #if os(iOS)
    private func topController() -> UIViewController? {
        let scene = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first
        var c = scene?.keyWindow?.rootViewController
        while let p = c?.presentedViewController { c = p }
        return c
    }
    #endif
}
