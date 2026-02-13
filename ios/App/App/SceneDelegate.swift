import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        guard let windowScene = scene as? UIWindowScene else { return }

        let window = UIWindow(windowScene: windowScene)
        let vc = PlotTwistsViewController()
        window.rootViewController = vc
        self.window = window
        window.makeKeyAndVisible()

        // Handle any universal link that launched the app
        if let userActivity = connectionOptions.userActivities.first,
           userActivity.activityType == NSUserActivityTypeBrowsingWeb,
           let url = userActivity.webpageURL {
            NotificationCenter.default.post(
                name: .capacitorOpenUniversalLink,
                object: ["url": url]
            )
        }
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        // Handle universal links when the app is already running
        guard userActivity.activityType == NSUserActivityTypeBrowsingWeb,
              let url = userActivity.webpageURL else { return }
        NotificationCenter.default.post(
            name: .capacitorOpenUniversalLink,
            object: ["url": url]
        )
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        // Handle custom URL schemes
        for context in URLContexts {
            ApplicationDelegateProxy.shared.application(
                UIApplication.shared,
                open: context.url,
                options: [:]
            )
        }
    }
}
