# Plot Twists SwiftUI Native Rewrite — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Plot Twists as a pure SwiftUI app targeting iPhone, iPad, and Apple TV, replacing the Capacitor WebView wrapper.

**Architecture:** Thin native client connecting to the existing Express + Socket.IO backend. Server remains the authority for all game state. SwiftUI observes published properties on ViewModels that are driven by socket events. One Xcode project with shared code (~90%) and platform-specific targets for iOS and tvOS.

**Tech Stack:** SwiftUI, Swift 5.9+, Socket.IO client (`socket.io-client-swift` v16.1.1), StoreKit 2, Combine/async-await, Keychain for persistence.

**Spec:** `docs/superpowers/specs/2026-03-18-swiftui-native-rewrite-design.md`

**Server types reference:** `lib/types.ts` — all Swift Codable types must match this file exactly.

**Review fixes applied (2026-03-18):**
- Socket auth sends both `token` and `playerSessionId` via `handshake.auth`, not `connectParams`
- `rejoin_room` uses `emitWithAck` and hydrates from `RoomRecoverySnapshot`
- `GameError` conforms to both `Codable` and `Error`
- `SocketService.on()` returns actual socket listener UUID
- Sub-ViewModels per phase (not a single god-object GameViewModel)
- Google Sign-In included in AuthService
- Audience features (reactions, plot twists, spectator chat) have dedicated tasks
- Welcome/Onboarding view task added
- QR code scanner for join flow added
- PerformingView split into subtasks
- Instrument Serif font bundling task added
- Integration test task added after Phase 3
- Preview data helpers for SwiftUI Previews

---

## Phase 0: Spike — Socket.IO Connection Validation

Before building anything, validate that `socket.io-client-swift` works with the production server.

### Task 0.1: Socket.IO Spike

**Files:**
- Create: `spike/SocketSpike.swift` (temporary, throwaway)

- [ ] **Step 1: Create a minimal Swift command-line project**

```bash
mkdir -p /Users/jackson/PlotTwists-Spike && cd /Users/jackson/PlotTwists-Spike
swift package init --type executable --name SocketSpike
```

- [ ] **Step 2: Add socket.io-client-swift dependency**

In `Package.swift`:
```swift
dependencies: [
    .package(url: "https://github.com/socketio/socket.io-client-swift", from: "16.1.0"),
],
targets: [
    .executableTarget(name: "SocketSpike", dependencies: [
        .product(name: "SocketIO", package: "socket.io-client-swift"),
    ]),
]
```

- [ ] **Step 3: Write spike code testing connection, events, and acks**

In `Sources/SocketSpike/main.swift`:
```swift
import Foundation
import SocketIO

let manager = SocketManager(
    socketURL: URL(string: "https://plot-twists.com")!,
    config: [
        .log(true),
        .forceWebsockets(true),
        .connectParams(["EIO": "4"]),
    ]
)

let socket = manager.defaultSocket

// Test 1: Connection
socket.on(clientEvent: .connect) { data, ack in
    print("✅ CONNECTED: \(data)")

    // Test 2: Emit with ack (get_room_preview)
    socket.emitWithAck("get_room_preview", "TEST").timingOut(after: 10) { data in
        print("✅ ACK RESPONSE: \(data)")
    }

    // Test 3: Listen for events
    socket.on("error") { data, ack in
        print("📡 ERROR EVENT: \(data)")
    }
}

socket.on(clientEvent: .error) { data, ack in
    print("❌ CONNECTION ERROR: \(data)")
}

socket.on(clientEvent: .disconnect) { data, ack in
    print("⚠️ DISCONNECTED: \(data)")
}

socket.connect()

// Keep alive
RunLoop.main.run()
```

- [ ] **Step 4: Run spike and verify**

```bash
cd /Users/jackson/PlotTwists-Spike && swift run
```

Expected:
- `✅ CONNECTED` prints — confirms EIO=4 WebSocket connection works
- ACK response prints — confirms acknowledgement callbacks work
- No crashes or protocol errors

- [ ] **Step 5: Test ack with real event (create_room requires auth, so test get_room_preview)**

If ack returns `{ success: false, error: "Room not found" }` — that's a **success**. It means the server received the event, processed it, and returned a response through the ack callback.

- [ ] **Step 6: Document spike results**

Write results to `docs/superpowers/plans/spike-results.md`:
- Connection: pass/fail
- Events: pass/fail
- Acks: pass/fail
- Auto-reconnection: pass/fail
- Any issues found

- [ ] **Step 7: Decision gate**

If spike passes → proceed with `socket.io-client-swift`.
If spike fails → implement minimal EIO=4 client on `URLSessionWebSocketTask` (~500-800 lines). The protocol is documented in the spec's risk section.

---

## Phase 1: Xcode Project + Models

### Task 1.1: Create Xcode Project Structure

**Files:**
- Create: Xcode project `PlotTwists.xcodeproj`
- Create: `PlotTwists/Shared/` directory structure
- Create: `PlotTwists/iOS/iOSApp.swift`
- Create: `PlotTwists/tvOS/tvOSApp.swift`

- [ ] **Step 1: Create new Xcode project**

In Xcode: File → New → Project → Multiplatform → App
- Product Name: PlotTwists
- Team: Your Apple Developer team
- Organization Identifier: com.plottwists
- Bundle ID: `com.plottwists.app`
- Interface: SwiftUI
- Language: Swift
- Location: `/Users/jackson/PlotTwists-Native/` (separate repo from web app)

- [ ] **Step 2: Add tvOS target**

In Xcode: File → New → Target → tvOS → App
- Product Name: PlotTwists TV
- Bundle ID: `com.plottwists.tv`

- [ ] **Step 3: Create shared directory structure**

```bash
cd /Users/jackson/PlotTwists-Native/PlotTwists
mkdir -p Shared/{Models,Services,ViewModels,Views/{Components,Game,Navigation,Modals},Theme}
mkdir -p iOS/Views
mkdir -p tvOS/Views
```

- [ ] **Step 4: Add SPM dependencies**

In Xcode: File → Add Package Dependencies:
- `https://github.com/socketio/socket.io-client-swift` → Up to Next Major 16.x
- `https://github.com/onevcat/Kingfisher` → Up to Next Major 8.x (async image loading, better maintained than SDWebImage)
- `https://github.com/kishikawakatsumi/KeychainAccess` → Up to Next Major 4.x

- [ ] **Step 5: Create minimal app entry points**

`iOS/iOSApp.swift`:
```swift
import SwiftUI

@main
struct PlotTwistsApp: App {
    var body: some Scene {
        WindowGroup {
            Text("Plot Twists")
                .font(.largeTitle)
        }
    }
}
```

`tvOS/tvOSApp.swift`:
```swift
import SwiftUI

@main
struct PlotTwistsTVApp: App {
    var body: some Scene {
        WindowGroup {
            Text("Plot Twists TV")
                .font(.largeTitle)
        }
    }
}
```

- [ ] **Step 6: Build both targets to verify clean compile**

Cmd+B for iOS Simulator, then switch to tvOS Simulator and Cmd+B.

- [ ] **Step 7: Initialize git repo and commit**

```bash
cd /Users/jackson/PlotTwists-Native
git init
echo ".DS_Store\n*.xcuserstate\nDerivedData/\n.build/\n*.swp" > .gitignore
git add -A
git commit -m "Initial Xcode project with iOS and tvOS targets"
```

---

### Task 1.2: Theme Constants

**Files:**
- Create: `Shared/Theme/Colors.swift`
- Create: `Shared/Theme/Typography.swift`
- Create: `Shared/Theme/Animations.swift`

- [ ] **Step 1: Create color palette**

`Shared/Theme/Colors.swift`:
```swift
import SwiftUI

extension Color {
    // Primary palette
    static let ptGold = Color(hex: "EAAA3A")
    static let ptGoldDark = Color(hex: "D4960E")
    static let ptTeal = Color(hex: "4DADAC")

    // Backgrounds
    static let ptVoid = Color(hex: "0A0A0A")
    static let ptInk = Color(hex: "141414")
    static let ptSurface = Color(hex: "1A1A1A")

    // Text
    static let ptTextPrimary = Color(hex: "F0ECE4")
    static let ptTextSecondary = Color(hex: "F0ECE4").opacity(0.6)
    static let ptTextMuted = Color(hex: "F0ECE4").opacity(0.35)

    // Semantic
    static let ptError = Color(hex: "E74C3C")
    static let ptSuccess = Color(hex: "2ECC71")
    static let ptWarning = Color(hex: "F39C12")
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b: UInt64
        (r, g, b) = ((int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)
        self.init(red: Double(r) / 255, green: Double(g) / 255, blue: Double(b) / 255)
    }
}
```

- [ ] **Step 2: Create typography definitions**

`Shared/Theme/Typography.swift`:
```swift
import SwiftUI

extension Font {
    // Display type — Instrument Serif (bundled custom font)
    // Falls back to system serif if not available
    static func ptDisplay(_ size: CGFloat) -> Font {
        .custom("InstrumentSerif-Regular", size: size, relativeTo: .largeTitle)
    }

    static func ptDisplayItalic(_ size: CGFloat) -> Font {
        .custom("InstrumentSerif-Italic", size: size, relativeTo: .largeTitle)
    }

    // UI type — system font (SF Pro)
    static func ptUI(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight, design: .default)
    }

    // Mono type — for codes, IDs, timestamps
    static func ptMono(_ size: CGFloat) -> Font {
        .system(size: size, weight: .medium, design: .monospaced)
    }
}
```

- [ ] **Step 3: Create animation presets**

`Shared/Theme/Animations.swift`:
```swift
import SwiftUI

enum PTAnimation {
    static let spring = Animation.spring(response: 0.4, dampingFraction: 0.8)
    static let gentle = Animation.spring(response: 0.6, dampingFraction: 0.85)
    static let bouncy = Animation.spring(response: 0.35, dampingFraction: 0.6)
    static let quick = Animation.easeOut(duration: 0.2)

    // Phase transitions
    static let phaseTransition = Animation.spring(response: 0.5, dampingFraction: 0.82)

    // Reduced motion alternative
    static let reducedMotion = Animation.easeInOut(duration: 0.3)
}
```

- [ ] **Step 4: Build to verify**

Cmd+B — should compile cleanly.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Add theme constants: colors, typography, animations"
```

---

### Task 1.3: Core Data Models

**Files:**
- Create: `Shared/Models/GameModels.swift`
- Create: `Shared/Models/CardModels.swift`
- Create: `Shared/Models/AudienceModels.swift`
- Create: `Shared/Models/ProgressionModels.swift`
- Create: `Shared/Models/ErrorModels.swift`
- Create: `Shared/Models/SocketEvents.swift`

All models must match `lib/types.ts` exactly. Reference the spec's Section 5 for the complete type definitions.

- [ ] **Step 1: Create GameModels.swift**

Contains: `GameState`, `GameMode`, `PlayerRole`, `ConnectionState`, `Player`, `CardSelection`, `AvailableCards`, `Room`, `RoomSettings`, `ScriptLine`, `ScriptMood`, `Script`, `TeleprompterSyncData`, `ScriptCustomization` and related enums, `VoteResult`, `GameResults`, `GameHighlight`, `DirectorsReview`, `RoomRecoverySnapshot`, `NewGameOptions`, `PublicRoomListing`.

Copy the exact Swift types from Section 5 of the spec.

- [ ] **Step 2: Create CardModels.swift**

Contains: `Card`, `CardPack`, `CardPackMetadata`, `CardCounts`, `CardPackInput`, `CardInput`.

- [ ] **Step 3: Create AudienceModels.swift**

Contains: `AudienceReactionType`, `AudienceReaction`, `PlotTwistOption`, `SpectatorMessage`, `AudienceInteractionState`, `ActivePlotTwist`, `ReactionTimelineEntry`.

- [ ] **Step 4: Create ProgressionModels.swift**

Contains: `PlayerStats`, `GameModeStats`, `ModeRecord`, `Achievement`, `AchievementRarity`, `Progression`, `XPEvent`, `WeeklyChallenge`, `LevelReward`, `LevelInfo`, `LeaderboardEntry`, `CreditBalance`, `FreeCreditBucket`, `SimpleCreditBalance`, `SavedGame`, `SavedGamePlayer`.

- [ ] **Step 5: Create ErrorModels.swift**

Contains: `ErrorCode`, `WarningCode`, `ErrorAction`, `GameError`, `GameWarning`, `SocketResponse`.

- [ ] **Step 6: Create SocketEvents.swift**

Contains: `GenerationProgress`, `TeleprompterSettings`, `TeleprompterVisibilityMode`, `UserPreferences`, `AudioSettings`, `VoiceSettings`, `SoundEffectType`, and any other event-specific payload types.

- [ ] **Step 7: Write model decode tests**

Create `PlotTwistsTests/ModelDecodingTests.swift`:
```swift
import XCTest
@testable import PlotTwists

final class ModelDecodingTests: XCTestCase {
    func testPlayerDecoding() throws {
        let json = """
        {"id":"p1","nickname":"Test","role":"PLAYER","isHost":false,"socketId":"s1","connected":true}
        """.data(using: .utf8)!
        let player = try JSONDecoder().decode(Player.self, from: json)
        XCTAssertEqual(player.id, "p1")
        XCTAssertEqual(player.role, .PLAYER)
    }

    func testScriptLineDecoding() throws {
        let json = """
        {"speaker":"Bob","text":"Hello world","mood":"happy"}
        """.data(using: .utf8)!
        let line = try JSONDecoder().decode(ScriptLine.self, from: json)
        XCTAssertEqual(line.speaker, "Bob")
        XCTAssertEqual(line.mood, .happy)
    }

    func testGameResultsDecoding() throws {
        let json = """
        {"winner":{"playerId":"p1","playerName":"Alice","votes":3},"allResults":[{"playerId":"p1","playerName":"Alice","votes":3}]}
        """.data(using: .utf8)!
        let results = try JSONDecoder().decode(GameResults.self, from: json)
        XCTAssertEqual(results.winner?.playerName, "Alice")
    }

    func testRoomRecoverySnapshotDecoding() throws {
        let json = """
        {"gameState":"PERFORMING","players":[],"script":null,"currentLineIndex":5,"scriptImageUrl":null,"isPaused":false,"hostDisconnected":false,"myPlayerId":"p1","roomCode":"ABCD"}
        """.data(using: .utf8)!
        let snapshot = try JSONDecoder().decode(RoomRecoverySnapshot.self, from: json)
        XCTAssertEqual(snapshot.gameState, .PERFORMING)
        XCTAssertEqual(snapshot.currentLineIndex, 5)
    }
}
```

- [ ] **Step 8: Run tests**

Cmd+U — all 4 tests should pass.

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "Add all Codable data models matching lib/types.ts"
```

---

## Phase 2: Services

### Task 2.1: PersistenceService

**Files:**
- Create: `Shared/Services/PersistenceService.swift`

- [ ] **Step 1: Implement PersistenceService**

```swift
import Foundation
import KeychainAccess

final class PersistenceService {
    private let keychain = Keychain(service: "com.plottwists.app")
    private let defaults = UserDefaults.standard

    // MARK: - Keychain (sensitive data)

    var clerkSessionToken: String? {
        get { try? keychain.get("clerkSessionToken") }
        set {
            if let value = newValue {
                try? keychain.set(value, key: "clerkSessionToken")
            } else {
                try? keychain.remove("clerkSessionToken")
            }
        }
    }

    var playerSessionId: String {
        get {
            if let existing = try? keychain.get("playerSessionId") {
                return existing
            }
            let newId = UUID().uuidString
            try? keychain.set(newId, key: "playerSessionId")
            return newId
        }
    }

    var currentRoomCode: String? {
        get { try? keychain.get("currentRoomCode") }
        set {
            if let value = newValue {
                try? keychain.set(value, key: "currentRoomCode")
            } else {
                try? keychain.remove("currentRoomCode")
            }
        }
    }

    // MARK: - UserDefaults (preferences)

    var defaultNickname: String? {
        get { defaults.string(forKey: "defaultNickname") }
        set { defaults.set(newValue, forKey: "defaultNickname") }
    }

    var hasSeenOnboarding: Bool {
        get { defaults.bool(forKey: "hasSeenOnboarding") }
        set { defaults.set(newValue, forKey: "hasSeenOnboarding") }
    }

    var soundEffectsEnabled: Bool {
        get { defaults.object(forKey: "soundEffectsEnabled") as? Bool ?? true }
        set { defaults.set(newValue, forKey: "soundEffectsEnabled") }
    }
}
```

- [ ] **Step 2: Build and commit**

```bash
git add -A && git commit -m "Add PersistenceService for Keychain and UserDefaults"
```

---

### Task 2.2: SocketService

**Files:**
- Create: `Shared/Services/SocketService.swift`

This is the most critical service. It wraps `socket.io-client-swift` with typed event streams and ack support.

- [ ] **Step 1: Implement SocketService**

```swift
import Foundation
import SocketIO
import Combine

enum ConnectionState: Equatable {
    case disconnected
    case connecting
    case connected
    case reconnecting
}

@MainActor
final class SocketService: ObservableObject {
    @Published private(set) var connectionState: ConnectionState = .disconnected

    private var manager: SocketManager?
    private var socket: SocketIOClient?
    private var reconnectRoomCode: String?
    private var reconnectSessionId: String?

    private let serverURL: URL

    // Callback for reconnection snapshot — set by GameViewModel
    var onReconnectSnapshot: ((RoomRecoverySnapshot) -> Void)?

    init(serverURL: URL = URL(string: "https://plot-twists.com")!) {
        self.serverURL = serverURL
    }

    // MARK: - Connection

    func connect(token: String) {
        connectionState = .connecting

        let sessionId = PersistenceService().playerSessionId
        manager = SocketManager(socketURL: serverURL, config: [
            .forceWebsockets(true),
            .reconnects(true),
            .reconnectAttempts(-1),     // infinite
            .reconnectWait(1),
            .reconnectWaitMax(30),
            // Auth goes in connectParams which maps to handshake.auth on server
            // Server reads: socket.handshake.auth.token and socket.handshake.auth.playerSessionId
            .connectParams(["token": token, "playerSessionId": sessionId]),
        ])

        socket = manager?.defaultSocket

        setupConnectionHandlers()
        socket?.connect()
    }

    func disconnect() {
        socket?.disconnect()
        connectionState = .disconnected
    }

    func setReconnectionInfo(roomCode: String, sessionId: String) {
        reconnectRoomCode = roomCode
        reconnectSessionId = sessionId
    }

    // MARK: - Event Emission

    func emit(_ event: String, _ items: SocketData...) {
        socket?.emit(event, items)
    }

    func emitWithAck(_ event: String, _ items: SocketData...) async throws -> [Any] {
        guard let socket = socket else {
            throw SocketError.notConnected
        }

        return try await withCheckedThrowingContinuation { continuation in
            socket.emitWithAck(event, items).timingOut(after: 10) { data in
                if let noAck = data.first as? String, noAck == "NO ACK" {
                    continuation.resume(throwing: SocketError.ackTimeout)
                } else {
                    continuation.resume(returning: data)
                }
            }
        }
    }

    // MARK: - Event Listening

    func on(_ event: String, callback: @escaping ([Any]) -> Void) -> UUID {
        // socket.io-client-swift's on() returns a UUID listener handle
        guard let handle = socket?.on(event, callback: { data, _ in
            callback(data)
        }) else {
            return UUID()
        }
        return handle
    }

    func onEvent<T: Decodable>(_ event: String) -> AsyncStream<T> {
        AsyncStream { continuation in
            socket?.on(event) { data, _ in
                guard let first = data.first else { return }

                do {
                    let jsonData: Data
                    if let dict = first as? [String: Any] {
                        jsonData = try JSONSerialization.data(withJSONObject: dict)
                    } else if let str = first as? String {
                        jsonData = Data(str.utf8)
                    } else if let array = first as? [[String: Any]] {
                        jsonData = try JSONSerialization.data(withJSONObject: array)
                    } else {
                        return
                    }

                    let decoded = try JSONDecoder().decode(T.self, from: jsonData)
                    continuation.yield(decoded)
                } catch {
                    print("⚠️ Failed to decode \(event): \(error)")
                }
            }

            continuation.onTermination = { _ in
                // Cleanup handled by socket disconnect
            }
        }
    }

    // MARK: - Private

    private func setupConnectionHandlers() {
        socket?.on(clientEvent: .connect) { [weak self] _, _ in
            Task { @MainActor in
                self?.connectionState = .connected
            }
        }

        socket?.on(clientEvent: .disconnect) { [weak self] _, _ in
            Task { @MainActor in
                self?.connectionState = .disconnected
            }
        }

        socket?.on(clientEvent: .reconnect) { [weak self] _, _ in
            Task { @MainActor in
                self?.connectionState = .connected
                // Auto-rejoin room on reconnection using ack to get state snapshot
                if let code = self?.reconnectRoomCode,
                   let sessionId = self?.reconnectSessionId {
                    do {
                        let response = try await self?.emitWithAck("rejoin_room", code, sessionId)
                        // GameViewModel will handle the snapshot via a callback
                        if let dict = response?.first as? [String: Any],
                           let success = dict["success"] as? Bool, success,
                           let snapshotData = dict["snapshot"] {
                            let jsonData = try JSONSerialization.data(withJSONObject: snapshotData)
                            let snapshot = try JSONDecoder().decode(RoomRecoverySnapshot.self, from: jsonData)
                            self?.onReconnectSnapshot?(snapshot)
                        }
                    } catch {
                        print("⚠️ Rejoin failed: \(error)")
                    }
                }
            }
        }

        socket?.on(clientEvent: .reconnectAttempt) { [weak self] _, _ in
            Task { @MainActor in
                self?.connectionState = .reconnecting
            }
        }
    }
}

enum SocketError: Error {
    case notConnected
    case ackTimeout
    case decodingFailed
}
```

- [ ] **Step 2: Build to verify compilation**

Cmd+B — should compile. Can't unit test socket connections easily, will integration test with the spike.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "Add SocketService with typed events, ack support, auto-reconnection"
```

---

### Task 2.3: HapticsService

**Files:**
- Create: `Shared/Services/HapticsService.swift`

- [ ] **Step 1: Implement HapticsService**

```swift
import Foundation
#if canImport(UIKit) && !os(tvOS)
import UIKit
#endif

final class HapticsService {
    #if canImport(UIKit) && !os(tvOS)
    private let impactLight = UIImpactFeedbackGenerator(style: .light)
    private let impactMedium = UIImpactFeedbackGenerator(style: .medium)
    private let impactHeavy = UIImpactFeedbackGenerator(style: .heavy)
    private let notification = UINotificationFeedbackGenerator()
    private let selection = UISelectionFeedbackGenerator()
    #endif

    func impact(_ style: HapticStyle) {
        #if canImport(UIKit) && !os(tvOS)
        switch style {
        case .light: impactLight.impactOccurred()
        case .medium: impactMedium.impactOccurred()
        case .heavy: impactHeavy.impactOccurred()
        }
        #endif
    }

    func notify(_ type: HapticNotification) {
        #if canImport(UIKit) && !os(tvOS)
        switch type {
        case .success: notification.notificationOccurred(.success)
        case .warning: notification.notificationOccurred(.warning)
        case .error: notification.notificationOccurred(.error)
        }
        #endif
    }

    func selectionTick() {
        #if canImport(UIKit) && !os(tvOS)
        selection.selectionChanged()
        #endif
    }
}

enum HapticStyle {
    case light, medium, heavy
}

enum HapticNotification {
    case success, warning, error
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "Add HapticsService with tvOS no-op"
```

---

### Task 2.4: AuthService

**Files:**
- Create: `Shared/Services/AuthService.swift`

- [ ] **Step 1: Implement AuthService**

```swift
import Foundation
import AuthenticationServices

struct AppUser: Identifiable {
    let id: String          // Clerk user ID or anonymous session ID
    var displayName: String?
    var isAnonymous: Bool
}

@MainActor
final class AuthService: ObservableObject {
    @Published private(set) var currentUser: AppUser?
    @Published private(set) var isAuthenticated: Bool = false

    private let persistence: PersistenceService

    init(persistence: PersistenceService) {
        self.persistence = persistence
        restoreSession()
    }

    // MARK: - Anonymous (Guest) Play

    func signInAnonymously() {
        let sessionId = persistence.playerSessionId
        currentUser = AppUser(id: sessionId, displayName: nil, isAnonymous: true)
        isAuthenticated = false // Anonymous users aren't "authenticated" in the Clerk sense
    }

    // MARK: - Sign in with Apple

    func handleAppleSignIn(result: ASAuthorization) async throws {
        guard let credential = result.credential as? ASAuthorizationAppleIDCredential,
              let identityToken = credential.identityToken,
              let tokenString = String(data: identityToken, encoding: .utf8) else {
            throw AuthError.invalidCredential
        }

        // Exchange Apple ID token for Clerk session
        let clerkSession = try await exchangeAppleTokenWithClerk(tokenString)
        persistence.clerkSessionToken = clerkSession.token

        currentUser = AppUser(
            id: clerkSession.userId,
            displayName: credential.fullName?.givenName,
            isAnonymous: false
        )
        isAuthenticated = true
    }

    // MARK: - Token for Socket Connection

    func getToken() -> String {
        if let clerkToken = persistence.clerkSessionToken {
            return clerkToken
        }
        return persistence.playerSessionId
    }

    // MARK: - Sign Out

    func signOut() {
        persistence.clerkSessionToken = nil
        currentUser = nil
        isAuthenticated = false
    }

    // MARK: - Private

    private func restoreSession() {
        if let token = persistence.clerkSessionToken {
            // TODO: Validate token with Clerk API, refresh if needed
            currentUser = AppUser(id: "restored", displayName: nil, isAnonymous: false)
            isAuthenticated = true
        }
    }

    private func exchangeAppleTokenWithClerk(_ appleToken: String) async throws -> ClerkSession {
        // POST to Clerk Frontend API to create session from Apple ID token
        // Endpoint: https://api.clerk.dev/v1/client/sign_ins
        // Body: { strategy: "oauth_apple", token: appleToken }
        // Returns: session token + user ID

        // TODO: Implement actual Clerk API call
        // For now, placeholder that will be implemented when testing with real Clerk
        throw AuthError.notImplemented
    }
}

struct ClerkSession {
    let token: String
    let userId: String
}

enum AuthError: Error {
    case invalidCredential
    case clerkExchangeFailed
    case notImplemented
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "Add AuthService with Apple Sign-In and anonymous play"
```

---

## Phase 3: GameViewModel — The State Machine

### Task 3.1: GameViewModel Core

**Files:**
- Create: `Shared/ViewModels/GameViewModel.swift`

- [ ] **Step 1: Implement GameViewModel**

This is the largest single file. It subscribes to all game-related socket events and publishes state for views to observe.

```swift
import Foundation
import Combine

@MainActor
final class GameViewModel: ObservableObject {
    // MARK: - Published State

    @Published var gamePhase: GameState = .LOBBY
    @Published var players: [Player] = []
    @Published var script: Script?
    @Published var currentLineIndex: Int = 0
    @Published var isPaused: Bool = false
    @Published var results: GameResults?
    @Published var directorsReview: DirectorsReview?
    @Published var generationProgress: GenerationProgress?
    @Published var creditBalance: SimpleCreditBalance?
    @Published var roomSettings: RoomSettings?
    @Published var availableCards: AvailableCards?
    @Published var error: GameError?
    @Published var warning: GameWarning?

    // MARK: - Game Context

    var roomCode: String = ""
    var myPlayerId: String = ""
    var role: PlayerRole = .PLAYER
    var gameMode: GameMode = .ENSEMBLE

    // MARK: - Dependencies

    private let socketService: SocketService
    private let authService: AuthService
    private let haptics: HapticsService
    private let persistence: PersistenceService

    private var eventTasks: [Task<Void, Never>] = []

    init(socketService: SocketService, authService: AuthService,
         haptics: HapticsService, persistence: PersistenceService) {
        self.socketService = socketService
        self.authService = authService
        self.haptics = haptics
        self.persistence = persistence
    }

    // MARK: - Connection

    func connect() {
        let token = authService.getToken()
        socketService.connect(token: token)
        subscribeToEvents()
    }

    func disconnect() {
        cancelEventSubscriptions()
        socketService.disconnect()
    }

    // MARK: - Host Actions

    func createRoom(settings: RoomSettings) async throws -> String {
        let response = try await socketService.emitWithAck("create_room", settings.asDictionary())
        guard let dict = response.first as? [String: Any],
              let success = dict["success"] as? Bool, success,
              let code = dict["code"] as? String else {
            throw GameError(code: .UNKNOWN, message: "Failed to create room", recoverable: true)
        }
        roomCode = code
        role = .HOST
        persistence.currentRoomCode = code
        socketService.setReconnectionInfo(roomCode: code, sessionId: persistence.playerSessionId)
        return code
    }

    func startGame() {
        socketService.emit("start_game", roomCode)
    }

    func advanceLine() {
        socketService.emit("advance_script_line", roomCode)
    }

    func pauseScript() {
        socketService.emit("pause_script", roomCode)
    }

    func resumeScript() {
        socketService.emit("resume_script", roomCode)
    }

    func endPerformance() {
        socketService.emit("end_performance", roomCode)
    }

    // MARK: - Player Actions

    func joinRoom(code: String, nickname: String) async throws {
        let response = try await socketService.emitWithAck("join_room", code, nickname)
        guard let dict = response.first as? [String: Any],
              let success = dict["success"] as? Bool, success else {
            let errorMsg = (response.first as? [String: Any])?["error"] as? String ?? "Failed to join"
            throw GameError(code: .ROOM_NOT_FOUND, message: errorMsg, recoverable: true)
        }

        roomCode = code
        myPlayerId = dict["playerId"] as? String ?? ""
        role = PlayerRole(rawValue: dict["role"] as? String ?? "PLAYER") ?? .PLAYER
        persistence.currentRoomCode = code
        socketService.setReconnectionInfo(roomCode: code, sessionId: persistence.playerSessionId)
    }

    func submitCards(_ selection: CardSelection) async throws {
        let response = try await socketService.emitWithAck("submit_cards", roomCode, selection.asDictionary())
        guard let dict = response.first as? [String: Any],
              let success = dict["success"] as? Bool, success else {
            throw GameError(code: .VALIDATION_ERROR, message: "Failed to submit cards", recoverable: true)
        }
        haptics.notify(.success)
    }

    func submitVote(targetPlayerId: String) {
        socketService.emit("submit_vote", roomCode, targetPlayerId)
        haptics.impact(.light)
    }

    func requestNewGame(keepSelections: Bool = false) {
        socketService.emit("request_new_game", roomCode, ["keepSelections": keepSelections])
    }

    // MARK: - Event Subscriptions

    private func subscribeToEvents() {
        let gameStateTask = Task {
            for await newState: GameState in socketService.onEvent("game_state_change") {
                self.gamePhase = newState
                self.haptics.impact(.medium)
            }
        }
        eventTasks.append(gameStateTask)

        let playersTask = Task {
            for await updatedPlayers: [Player] in socketService.onEvent("players_update") {
                self.players = updatedPlayers
            }
        }
        eventTasks.append(playersTask)

        let scriptTask = Task {
            for await readyScript: Script in socketService.onEvent("script_ready") {
                self.script = readyScript
                self.haptics.notify(.success)
            }
        }
        eventTasks.append(scriptTask)

        let teleprompterTask = Task {
            for await sync: TeleprompterSyncData in socketService.onEvent("sync_teleprompter") {
                self.currentLineIndex = sync.lineIndex
            }
        }
        eventTasks.append(teleprompterTask)

        let resultsTask = Task {
            for await gameResults: GameResults in socketService.onEvent("game_over") {
                self.results = gameResults
                self.haptics.notify(.success)
            }
        }
        eventTasks.append(resultsTask)

        let reviewTask = Task {
            for await review: DirectorsReview in socketService.onEvent("directors_review") {
                self.directorsReview = review
            }
        }
        eventTasks.append(reviewTask)

        let errorTask = Task {
            for await gameError: GameError in socketService.onEvent("game_error") {
                self.error = gameError
                self.haptics.notify(.error)
            }
        }
        eventTasks.append(errorTask)

        let creditTask = Task {
            for await balance: SimpleCreditBalance in socketService.onEvent("credit_balance") {
                self.creditBalance = balance
            }
        }
        eventTasks.append(creditTask)

        let settingsTask = Task {
            for await settings: RoomSettings in socketService.onEvent("room_settings_update") {
                self.roomSettings = settings
            }
        }
        eventTasks.append(settingsTask)

        let cardsTask = Task {
            for await cards: AvailableCards in socketService.onEvent("available_cards") {
                self.availableCards = cards
            }
        }
        eventTasks.append(cardsTask)

        // Subscribe to more events as views are built...
    }

    private func cancelEventSubscriptions() {
        eventTasks.forEach { $0.cancel() }
        eventTasks.removeAll()
    }
}

// MARK: - Helpers

struct GenerationProgress: Codable {
    let phase: String
    let percent: Int
    var title: String?
}

extension Encodable {
    func asDictionary() -> [String: Any] {
        guard let data = try? JSONEncoder().encode(self),
              let dict = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return [:]
        }
        return dict
    }
}
```

- [ ] **Step 2: Build to verify**

Cmd+B — should compile with no errors.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "Add GameViewModel state machine with socket event subscriptions"
```

---

## Phase 4: Game Phase Views

Each phase gets its own view. Start with the simplest (Lobby) and work toward the hardest (Performing).

### Task 4.1: Lobby View

**Files:**
- Create: `Shared/Views/Game/LobbyView.swift`

The lobby shows: room code, QR code, player list, game settings, and a Start button (host only).

- [ ] **Step 1: Implement LobbyView**

Build the view with:
- Room code display (large, monospaced)
- QR code generated from `plot-twists.com/join/invite/{code}` using CoreImage CIQRCodeGenerator
- Player list with connection status indicators
- Start button (visible only when `role == .HOST`)
- Settings panel for game mode, comedy style, etc.

- [ ] **Step 2: Build and visually verify on iPhone simulator**
- [ ] **Step 3: Commit**

### Task 4.2: Selection View

**Files:**
- Create: `Shared/Views/Game/SelectionView.swift`

Card picker — player picks character, setting, and circumstance from available cards.

- [ ] **Step 1: Implement SelectionView**

Build with:
- Three card category sections (character, setting, circumstance)
- Scrollable card list per category
- Selected state highlighting
- Submit button (disabled until all 3 selected)
- "Waiting for others" state after submission

- [ ] **Step 2: Build and verify**
- [ ] **Step 3: Commit**

### Task 4.3: Loading View

**Files:**
- Create: `Shared/Views/Game/LoadingView.swift`

Shows AI script generation progress.

- [ ] **Step 1: Implement LoadingView**

Build with:
- Progress bar driven by `generationProgress.percent`
- Phase label ("Crafting characters...", "Writing dialogue...", etc.)
- Title reveal when generation completes
- Green room prompt (fun question to discuss while waiting)

- [ ] **Step 2: Build and verify**
- [ ] **Step 3: Commit**

### Task 4.4: Performing View (Teleprompter)

**Files:**
- Create: `Shared/Views/Game/PerformingView.swift`
- Create: `Shared/Views/Components/TeleprompterLine.swift`

**This is the most important and complex view.** The teleprompter must:
- Show script lines scrolling as the server advances `currentLineIndex`
- Highlight the current speaker's line
- Show mood indicators
- Color-code character names
- Host has advance/pause/resume controls
- Player sees their lines emphasized
- Auto-scroll to current line

- [ ] **Step 1: Implement TeleprompterLine component**

Individual line with speaker name, dialogue text, mood badge, highlight state.

- [ ] **Step 2: Implement PerformingView**

ScrollViewReader + scrollTo for auto-scroll. Host controls at bottom. Spectator reaction bar.

- [ ] **Step 3: Build and verify on iPhone — test with mock script data**
- [ ] **Step 4: Commit**

### Task 4.5: Voting View

**Files:**
- Create: `Shared/Views/Game/VotingView.swift`

MVP voting — player selects who performed best.

- [ ] **Step 1: Implement VotingView**

Build with:
- Player cards (everyone except yourself)
- Tap to vote
- Confirmation state after voting
- Timer countdown (30s voting window)

- [ ] **Step 2: Build and verify**
- [ ] **Step 3: Commit**

### Task 4.6: Results View

**Files:**
- Create: `Shared/Views/Game/ResultsView.swift`

Shows winner, director's review, and play-again options.

- [ ] **Step 1: Implement ResultsView**

Build with:
- MVP winner announcement with animation
- Vote breakdown
- Director's Review card (rating, headline, review text, best moment)
- "Play Again" and "New Game" buttons (host only)
- Share button (generates share link)

- [ ] **Step 2: Build and verify**
- [ ] **Step 3: Commit**

---

## Phase 5: Navigation Shell

### Task 5.1: App Root + Tab Navigation

**Files:**
- Create: `Shared/Views/Navigation/AppRootView.swift`
- Create: `Shared/Views/Navigation/HomeTab.swift`
- Create: `Shared/Views/Navigation/ExploreTab.swift`
- Create: `Shared/Views/Navigation/ProfileTab.swift`
- Modify: `iOS/iOSApp.swift`

- [ ] **Step 1: Implement AppRootView with tab navigation**

TabView with Home, Explore, Profile tabs. Conditionally show Welcome view if not authenticated.

- [ ] **Step 2: Implement HomeTab**

Quick actions: Host Game, Join Game (enter code), recent games list.

- [ ] **Step 3: Implement ExploreTab (basic)**

Card pack browser — list view with search. Uses `list_card_packs` socket event.

- [ ] **Step 4: Implement ProfileTab (basic)**

Stats display, credit balance, settings. Uses `get_player_stats` socket event.

- [ ] **Step 5: Wire up iOSApp.swift with dependency injection**

Create services in the app entry point, pass via environment.

- [ ] **Step 6: Build full app and verify navigation flow**
- [ ] **Step 7: Commit**

---

## Phase 6: StoreKit + Deep Links

### Task 6.1: StoreKitService

**Files:**
- Create: `Shared/Services/StoreKitService.swift`

- [ ] **Step 1: Implement StoreKitService with StoreKit 2**

Product loading, purchase flow, transaction verification via server endpoint.

- [ ] **Step 2: Commit**

### Task 6.2: Deep Link Handling

**Files:**
- Create: `Shared/Services/DeepLinkService.swift`

- [ ] **Step 1: Implement DeepLinkService**

Handle `plot-twists.com/join/*` Universal Links. Parse URL, navigate to join flow.

- [ ] **Step 2: Add AASA file to web app**

Create `public/.well-known/apple-app-site-association` on the Next.js server.

- [ ] **Step 3: Commit**

---

## Phase 7: Apple TV Target

### Task 7.1: tvOS Host Views

**Files:**
- Create: `tvOS/Views/TVLobbyView.swift`
- Create: `tvOS/Views/TVPerformingView.swift`
- Create: `tvOS/Views/TVResultsView.swift`
- Modify: `tvOS/tvOSApp.swift`

- [ ] **Step 1: Implement TV-optimized lobby**

Full-screen QR code, large room code, player list along bottom. Focus-based navigation.

- [ ] **Step 2: Implement TV teleprompter**

Large text, auto-scroll, character color coding. Remote click for manual advance.

- [ ] **Step 3: Implement TV results**

Winner announcement, director's review, large text for readability across the room.

- [ ] **Step 4: Wire up tvOSApp.swift**
- [ ] **Step 5: Build on tvOS simulator and verify**
- [ ] **Step 6: Commit**

---

## Phase 8: Push Notifications

### Task 8.1: Client Push Registration

**Files:**
- Create: `Shared/Services/PushService.swift`

- [ ] **Step 1: Implement push notification registration**

Request permission, get device token, send to server.

- [ ] **Step 2: Commit**

### Task 8.2: Server Push Sending

**Files:**
- Modify: `server/services/push.service.ts` (new)
- Modify: `server/handlers/game.handler.ts`
- Add: `apns2` npm package

- [ ] **Step 1: Install apns2 package**

```bash
cd /Users/jackson/Plot-Twists && npm install apns2
```

- [ ] **Step 2: Implement push service**

New service that sends APNs notifications when game phases change.

- [ ] **Step 3: Add push triggers to game handler**

On `start_game`, `script_ready`, `game_over` — send push to registered devices in the room.

- [ ] **Step 4: Commit**

---

## Phase 9: Polish

### Task 9.1: Animations

- [ ] Add phase transition animations (blur + scale + opacity, matching web's VARIANTS.pageTransition)
- [ ] Add card selection animations
- [ ] Add teleprompter line scroll animations
- [ ] Add results reveal animations
- [ ] Respect `UIAccessibility.isReduceMotionEnabled`
- [ ] Commit

### Task 9.2: Accessibility

- [ ] Add VoiceOver labels to all interactive elements
- [ ] Support Dynamic Type throughout
- [ ] Test with VoiceOver enabled on simulator
- [ ] Commit

### Task 9.3: Error States

- [ ] Network disconnected overlay
- [ ] Room not found state
- [ ] Insufficient credits modal
- [ ] Script generation failure with retry
- [ ] Commit

### Task 9.4: Web App Cleanup

- [ ] Remove Capacitor dependencies from web app
- [ ] Remove `ios/` and `android/` directories
- [ ] Remove `lib/platform.ts`
- [ ] Simplify web join flow (remove host UI from web)
- [ ] Add App Store badge + link to landing page
- [ ] Commit

---

---

## Additional Tasks (from review)

### Task A.1: Instrument Serif Font Bundling (Phase 1)

- [ ] Download Instrument Serif font files (Regular + Italic) from Google Fonts
- [ ] Verify license allows app binary bundling (Google Fonts = OFL, yes)
- [ ] Add `.ttf` files to Xcode project, ensure "Target Membership" includes both iOS and tvOS
- [ ] Add `UIAppFonts` array to both Info.plist files listing the font filenames
- [ ] Verify `Font.custom("InstrumentSerif-Regular", size:)` renders correctly in a preview
- [ ] Commit

### Task A.2: Welcome / Onboarding View (Phase 5)

**Files:**
- Create: `Shared/Views/Navigation/WelcomeView.swift`

- [ ] Implement WelcomeView with: app logo, "Sign in with Apple" button, "Continue as Guest" button, brief game explanation
- [ ] Wire into AppRootView — show when `!authService.isAuthenticated && authService.currentUser == nil`
- [ ] Commit

### Task A.3: Google Sign-In via ASWebAuthenticationSession (Phase 2)

- [ ] Add `signInWithGoogle()` to AuthService using `ASWebAuthenticationSession`
- [ ] URL: Clerk's Google OAuth endpoint with callback
- [ ] Parse callback URL for session token
- [ ] Store in Keychain
- [ ] Commit

### Task A.4: QR Code Scanner for Join Flow (Phase 5)

**Files:**
- Create: `Shared/Views/Components/QRScannerView.swift`

- [ ] Implement camera-based QR scanner using `AVCaptureSession` wrapped in `UIViewControllerRepresentable`
- [ ] Parse scanned URL for room code (`plot-twists.com/join/invite/ABCD` → extract `ABCD`)
- [ ] Add scanner button to JoinGameSheet alongside manual code entry
- [ ] Request camera permission with usage description in Info.plist
- [ ] Commit

### Task A.5: Audience Features (Phase 4.5)

**Files:**
- Create: `Shared/ViewModels/AudienceViewModel.swift`
- Create: `Shared/Views/Components/ReactionBar.swift`
- Create: `Shared/Views/Components/PlotTwistOverlay.swift`
- Create: `Shared/Views/Components/SpectatorChat.swift`

- [ ] Implement AudienceViewModel subscribing to all audience socket events
- [ ] Implement ReactionBar — row of emoji buttons, sends `send_audience_reaction`
- [ ] Implement PlotTwistOverlay — shows options when `plot_twist_started`, allows voting
- [ ] Implement SpectatorChat — message list + preset message buttons
- [ ] Wire into PerformingView for spectator role
- [ ] Commit

### Task A.6: Sub-ViewModels per Phase (Phase 3)

Instead of one monolithic GameViewModel, create focused ViewModels per phase. GameViewModel remains the coordinator but delegates phase-specific logic:

- [ ] Create `LobbyViewModel` — room creation, settings, player management
- [ ] Create `SelectionViewModel` — card selection, submission
- [ ] Create `LoadingViewModel` — generation progress tracking
- [ ] Create `PerformingViewModel` — teleprompter state, line advancement, pause/resume
- [ ] Create `VotingViewModel` — vote submission, results tracking
- [ ] Create `ResultsViewModel` — results display, share, new game
- [ ] GameViewModel creates and owns sub-VMs, passes socket events to appropriate sub-VM
- [ ] Commit

### Task A.7: Integration Test — Full Game Flow (after Phase 3)

- [ ] Write an integration test that connects to the dev/staging server
- [ ] Create a room via socket
- [ ] Verify `room_created` ack returns a room code
- [ ] Join the room from a second socket connection
- [ ] Verify `players_update` fires with both players
- [ ] Disconnect and verify reconnection works
- [ ] Document results

### Task A.8: SwiftUI Preview Data Helpers (Phase 4, before views)

**Files:**
- Create: `Shared/Views/PreviewData.swift`

- [ ] Create static mock data: `PreviewData.players`, `PreviewData.script`, `PreviewData.results`, `PreviewData.directorsReview`, `PreviewData.cardPacks`
- [ ] Use in `#Preview` blocks for all game phase views
- [ ] Commit

### Task A.9: GameError Error Conformance Fix

- [ ] Add `Error` conformance to `GameError` struct:

```swift
struct GameError: Codable, Error, LocalizedError {
    let code: ErrorCode
    let message: String
    var phase: GameState?
    let recoverable: Bool
    var action: ErrorAction?

    var errorDescription: String? { message }
}
```

- [ ] Commit

---

## Verification Checklist

Before submitting to App Store:

- [ ] All 6 game phases work on iPhone
- [ ] All 6 game phases work on iPad
- [ ] Host view works on Apple TV
- [ ] QR code join flow works
- [ ] Room code manual entry works
- [ ] Reconnection after network drop works
- [ ] Reconnection after app kill works
- [ ] StoreKit purchases complete and credits appear
- [ ] Push notifications arrive
- [ ] VoiceOver navigation works
- [ ] Dynamic Type doesn't break layouts
- [ ] Universal Links open the app
- [ ] Anonymous play works (no sign-in required to join)
- [ ] Sign in with Apple works
- [ ] All 3 game modes work (Solo, Head-to-Head, Ensemble)
- [ ] Audience reactions work for spectators
- [ ] Plot twists work
- [ ] Director's review appears at end of game
- [ ] Play again / new game flow works
- [ ] No crashes on iOS 17+
- [ ] No crashes on tvOS 17+
