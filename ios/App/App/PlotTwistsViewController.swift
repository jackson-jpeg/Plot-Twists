import UIKit
import Capacitor

/// Custom Capacitor bridge view controller that registers the StoreKit
/// message handler with the WKWebView for in-app purchases.
class PlotTwistsViewController: CAPBridgeViewController {

    private var storeKitBridge: StoreKitBridge?

    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .darkContent
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        // Register StoreKit bridge with the WKWebView
        if #available(iOS 15.0, *), let webView = self.webView {
            let bridge = StoreKitBridge(webView: webView)
            webView.configuration.userContentController.add(bridge, name: "storeKit")
            self.storeKitBridge = bridge
        }
    }
}
