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
final class WebUI: NSObject, WKUIDelegate, WKNavigationDelegate, WKDownloadDelegate {
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

    // 画面（WebKit の処理）が落ちたときは、自動で読み込み直す
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { webView.reload() }

    // window.close（調べ終わったときなど）
    func webViewDidClose(_ webView: WKWebView) {
        if model.popup?.webView === webView { model.popup = nil }
    }

    // 「更新する」「変更点」などのリンクは、通常のブラウザで開く
    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        // 書き出し（.json）・CSV・コマ一覧などの保存は、画面に表示せずファイルとして保存する
        if action.shouldPerformDownload || action.request.url?.scheme == "blob" && action.targetFrame?.isMainFrame == true {
            decisionHandler(.download); return
        }
        if let u = action.request.url, action.targetFrame == nil, let host = u.host(), host.contains("github") {
            openExternal(u); decisionHandler(.cancel); return
        }
        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, navigationAction: WKNavigationAction, didBecome download: WKDownload) { download.delegate = self }
    func webView(_ webView: WKWebView, navigationResponse: WKNavigationResponse, didBecome download: WKDownload) { download.delegate = self }

    // 保存先を決める（Mac は保存ダイアログ、iPhone・iPad はいったん一時フォルダに置いてから「ファイル」へ書き出す）
    func download(_ download: WKDownload, decideDestinationUsing response: URLResponse, suggestedFilename: String, completionHandler: @escaping (URL?) -> Void) {
        #if os(macOS)
        let panel = NSSavePanel()
        panel.nameFieldStringValue = suggestedFilename
        panel.directoryURL = FileManager.default.urls(for: .downloadsDirectory, in: .userDomainMask).first
        completionHandler(panel.runModal() == .OK ? panel.url : nil)
        #else
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(suggestedFilename)
        try? FileManager.default.removeItem(at: url)
        pending[ObjectIdentifier(download)] = url
        completionHandler(url)
        #endif
    }

    func downloadDidFinish(_ download: WKDownload) {
        #if os(iOS)
        guard let url = pending.removeValue(forKey: ObjectIdentifier(download)) else { return }
        let picker = UIDocumentPickerViewController(forExporting: [url], asCopy: true)
        topController()?.present(picker, animated: true)
        #endif
    }

    func download(_ download: WKDownload, didFailWithError error: Error, resumeData: Data?) {
        ask("保存できませんでした：\(error.localizedDescription)", buttons: ["OK"]) { _ in }
    }

    #if os(iOS)
    private var pending: [ObjectIdentifier: URL] = [:]
    #endif

    // 読み込む…（ファイルを選ぶ）。iPhone・iPad は WebKit が自動で選択画面を出す
    #if os(macOS)
    func webView(_ webView: WKWebView, runOpenPanelWith parameters: WKOpenPanelParameters, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping ([URL]?) -> Void) {
        let panel = NSOpenPanel()
        panel.allowsMultipleSelection = parameters.allowsMultipleSelection
        panel.canChooseDirectories = parameters.allowsDirectories
        panel.canChooseFiles = true
        completionHandler(panel.runModal() == .OK ? panel.urls : nil)
    }
    #endif

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
