import Foundation
import Combine
import WebKit

struct Popup: Identifiable {
    let id = UUID()
    let webView: WKWebView
}

@MainActor
final class BrowserModel: ObservableObject {
    @Published var script: String?
    @Published var popup: Popup?

    static let startURL = URL(string: "https://mypikpak.com/drive/all")!
    static let scriptURL = URL(string: "https://raw.githubusercontent.com/Noel-Labs39/pikpak-distill/main/pikpak-distill.user.js")!
    // スクリプトの @require（動画再生用の hls.js）。アプリでは自動で読まれないため、ここで先に組み込む
    static let hlsURL = URL(string: "https://cdn.jsdelivr.net/npm/hls.js@1.5.8/dist/hls.min.js")!
    private var hls = ""

    // 保存しておいたスクリプト（アプリを開くたびに GitHub の最新版で上書きする）
    private func cached(_ name: String) -> URL {
        let dir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir.appendingPathComponent(name)
    }
    private var cacheFile: URL { cached("pikpak-distill.user.js") }

    private func fetch(_ url: URL, mustContain: String) async -> Data? {
        var req = URLRequest(url: url)
        req.cachePolicy = .reloadIgnoringLocalCacheData
        req.timeoutInterval = 8
        guard let (data, res) = try? await URLSession.shared.data(for: req),
              (res as? HTTPURLResponse)?.statusCode == 200,
              let s = String(data: data, encoding: .utf8), s.contains(mustContain) else { return nil }
        return data
    }

    // 1. GitHub の最新版 → 2. 前回保存した版 → 3. アプリに同梱した版 の順に使う
    func loadScript() async {
        let hlsFile = cached("hls.min.js")
        if let d = await fetch(Self.hlsURL, mustContain: "Hls") { try? d.write(to: hlsFile) }
        hls = (try? String(contentsOf: hlsFile, encoding: .utf8)) ?? ""
        if let d = await fetch(Self.scriptURL, mustContain: "@version"), let s = String(data: d, encoding: .utf8) {
            try? d.write(to: cacheFile)
            script = s
            return
        }
        if let s = try? String(contentsOf: cacheFile, encoding: .utf8) { script = s; return }
        if let u = Bundle.main.url(forResource: "pikpak-distill.user", withExtension: "js"), let s = try? String(contentsOf: u, encoding: .utf8) { script = s; return }
        script = ""
    }

    // PikPak の画面（ログイン情報はアプリの中に残る）
    func makeWebView(script: String) -> WKWebView {
        let cfg = WKWebViewConfiguration()
        cfg.websiteDataStore = .default()
        cfg.preferences.javaScriptCanOpenWindowsAutomatically = true
        #if os(iOS)
        cfg.allowsInlineMediaPlayback = true
        cfg.mediaTypesRequiringUserActionForPlayback = []
        #endif
        if !hls.isEmpty {
            cfg.userContentController.addUserScript(WKUserScript(source: hls, injectionTime: .atDocumentEnd, forMainFrameOnly: true, in: .page))
        }
        if !script.isEmpty {
            // Dedupe は PikPak の画面の中で動く（@grant none と同じ）
            let us = WKUserScript(source: script, injectionTime: .atDocumentEnd, forMainFrameOnly: true, in: .page)
            cfg.userContentController.addUserScript(us)
        }
        let wv = WKWebView(frame: .zero, configuration: cfg)
        // スマホ向けの画面やアプリへの案内に切り替わらないよう、パソコンの Safari として開く
        wv.customUserAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15"
        wv.allowsBackForwardNavigationGestures = true
        #if DEBUG
        if #available(iOS 16.4, macOS 13.3, *) { wv.isInspectable = true }
        #endif
        wv.load(URLRequest(url: Self.startURL))
        return wv
    }
}
