import WebKit
import StoreKit

/// Bridge between WKWebView JavaScript and StoreKit 2.
///
/// Listens for "storeKit" message handler calls from the web layer,
/// presents the native purchase sheet, and returns the signed transaction
/// back to JavaScript via `window.__storeKitCallback`.
@available(iOS 15.0, *)
class StoreKitBridge: NSObject, WKScriptMessageHandler {

    weak var webView: WKWebView?

    init(webView: WKWebView) {
        self.webView = webView
        super.init()
    }

    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard let body = message.body as? [String: Any],
              let action = body["action"] as? String else {
            callbackError("Invalid message format")
            return
        }

        switch action {
        case "purchase":
            guard let productId = body["productId"] as? String else {
                callbackError("Missing productId")
                return
            }
            Task { await handlePurchase(productId: productId) }

        case "restore":
            Task { await handleRestore() }

        default:
            callbackError("Unknown action: \(action)")
        }
    }

    private func handlePurchase(productId: String) async {
        do {
            // Fetch the product from the App Store
            let products = try await Product.products(for: [productId])
            guard let product = products.first else {
                callbackError("Product not found: \(productId)")
                return
            }

            // Present the purchase sheet
            let result = try await product.purchase()

            switch result {
            case .success(let verification):
                switch verification {
                case .verified(let transaction):
                    // Finish the transaction
                    await transaction.finish()

                    // Return the signed transaction (JWS) to the web layer
                    if let jwsRepresentation = verification.jwsRepresentation as? String {
                        callbackSuccess(signedTransaction: jwsRepresentation)
                    } else {
                        // Fallback: use the payloadValue string
                        callbackSuccess(signedTransaction: String(describing: verification.jwsRepresentation))
                    }

                case .unverified(_, let error):
                    callbackError("Verification failed: \(error.localizedDescription)")
                }

            case .userCancelled:
                callbackError("Purchase cancelled")

            case .pending:
                callbackError("Purchase pending approval")

            @unknown default:
                callbackError("Unknown purchase result")
            }
        } catch {
            callbackError(error.localizedDescription)
        }
    }

    private func handleRestore() async {
        do {
            // Sync transactions with the App Store to restore any unfinished ones
            try await AppStore.sync()
            callbackSuccess(signedTransaction: "restored")
        } catch {
            callbackError("Restore failed: \(error.localizedDescription)")
        }
    }

    private func callbackSuccess(signedTransaction: String) {
        let escaped = signedTransaction
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "'", with: "\\'")
        let js = """
        if (window.__storeKitCallback) {
            window.__storeKitCallback({
                success: true,
                signedTransaction: '\(escaped)'
            });
        }
        """
        DispatchQueue.main.async { [weak self] in
            self?.webView?.evaluateJavaScript(js, completionHandler: nil)
        }
    }

    private func callbackError(_ message: String) {
        let escaped = message
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "'", with: "\\'")
        let js = """
        if (window.__storeKitCallback) {
            window.__storeKitCallback({
                success: false,
                error: '\(escaped)'
            });
        }
        """
        DispatchQueue.main.async { [weak self] in
            self?.webView?.evaluateJavaScript(js, completionHandler: nil)
        }
    }
}
