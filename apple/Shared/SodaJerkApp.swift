import SwiftUI
import SpriteKit

@main
struct SodaJerkApp: App {
    var body: some Scene {
        WindowGroup {
            GameView()
        }
    }
}

struct GameView: View {
    @State private var scene: GameScene = {
        let s = GameScene(size: CGSize(width: 1920, height: 1080))
        s.scaleMode = .resizeFill
        return s
    }()

    var body: some View {
        SpriteView(scene: scene, preferredFramesPerSecond: 60)
            .ignoresSafeArea()
            #if os(iOS)
            .statusBarHidden()
            .persistentSystemOverlays(.hidden)
            #endif
    }
}
