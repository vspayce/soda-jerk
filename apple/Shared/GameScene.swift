import SpriteKit

/// The bar game, drawn natively. Every rule comes from the shared engine
/// (Engine.swift → engine.js, the same code as the web game); this scene
/// steps it once a frame, draws what it says, and passes the controls in.
///
/// Sizes follow the web game's: there a lane is about 144px tall, and the
/// counter, patrons, jerk and props are fixed pixel sizes within it, so
/// here they're the same fractions of the lane's height.
final class GameScene: SKScene {
    let engine = Engine()
    let controls = Controls()
    let music = Music()

    private var lastTime: TimeInterval?
    private var sentRun = 0         // what the engine was last told
    private var controllerRun = 0   // what the controller last asked for
    private var lastLane = -1

    private let backdropLayer = SKNode()
    private let lanesLayer = SKNode()
    private let hudLayer = SKNode()
    private let overlayLayer = SKNode()
    private var lanes: [LaneView] = []
    private var builtKey = ""
    private var shownVenue = -1
    var layout = Layout()

    // ------------------------------------------------------------ setup

    override func didMove(to view: SKView) {
        backgroundColor = SKColor(hex: 0x0C0A0D)
        scaleMode = .resizeFill
        for (layer, z) in [(backdropLayer, 0), (lanesLayer, 10), (hudLayer, 100), (overlayLayer, 200)] as [(SKNode, CGFloat)] {
            layer.zPosition = z
            addChild(layer)
        }
        builtKey = ""

        // For testing without a controller: `-autostart` skips the title
        // screen, `-venue N` jumps ahead N venues.
        let args = ProcessInfo.processInfo.arguments
        if args.contains("-autostart") {
            engine.call("startGame")
            if let i = args.firstIndex(of: "-venue"), i + 1 < args.count, let n = Int(args[i + 1]) {
                for _ in 0..<n { engine.call("skipToNewVenue") }
            }
            engine.refresh()
        }
    }

    override func didChangeSize(_ oldSize: CGSize) { builtKey = "" }

    // ------------------------------------------------------------ frame

    override func update(_ currentTime: TimeInterval) {
        let dt = lastTime.map { min(currentTime - $0, 0.05) } ?? 0
        lastTime = currentTime

        handle(controls.read())
        engine.step(dt)
        engine.refresh()
        draw(time: currentTime)
    }

    // ------------------------------------------------------------ input

    /// What the confirm button (A, a click, a tap) does right now, if the
    /// game's showing a screen rather than the bar. Returns false while
    /// playing.
    @discardableResult
    func confirm() -> Bool {
        let s = engine.state
        if !s.bool("started") { engine.call("startGame"); return true }
        if s.bool("gameOver") { engine.newGame(); return true }
        if s.bool("paused") { engine.call("setPaused", false); return true }
        if s.bool("awaitingContinue") { engine.call("continueAfterDeath"); return true }
        if s.bool("awaitingStageAdvance") { engine.call("advanceStage"); return true }
        if s.string("mode") != "bar" { engine.call("finishBonusRound"); return true }
        return false
    }

    private func handle(_ f: Controls.Frame) {
        let s = engine.state
        let playing = s.bool("started") && !s.bool("gameOver") && !s.bool("paused")
            && s.string("mode") == "bar" && !s.bool("awaitingContinue") && !s.bool("awaitingStageAdvance")
        if !playing {
            if f.pourOrange || f.pourPink { confirm() }
            else if f.pause && s.bool("paused") { engine.call("setPaused", false) }
            sentRun = 0
            return
        }
        if f.pause { engine.call("setPaused", true); return }
        if f.laneStep != 0 { engine.call("changeLane", f.laneStep) }
        // Running: sent only when the controller's own left/right changes
        // (and again after a bar change, which stops him at the new bar's
        // tap). Comparing against what was last sent instead would cancel a
        // run started by touch on the very next frame.
        if f.run != controllerRun || (f.laneStep != 0 && f.run != 0) {
            setRun(f.run)
            controllerRun = f.run
        }
        if f.pourOrange { engine.call("pourDrink", 0) }
        if f.pourPink { engine.call("pourDrink", 1) }
    }

    /// Touch: run along the bar, on screen direction (see TouchControls).
    func setRun(_ dir: Int) {
        guard dir != sentRun else { return }
        if dir == 0 { engine.call("stopRun") } else { engine.call("startRun", dir) }
        sentRun = dir
    }

    // ------------------------------------------------------------ drawing

    private func draw(time: TimeInterval) {
        let s = engine.state
        let venueIndex = s.int("venue")
        let venue = engine.venues.indices.contains(venueIndex) ? engine.venues[venueIndex].string("id") ?? "speakeasy" : "speakeasy"
        let reversed = s.bools("laneReversed")
        let key = "\(size.width)x\(size.height)|\(venue)|\(reversed)"
        if key != builtKey {
            layout = Layout(size: size, insets: safeInsets())
            buildBar(venue: venue, reversed: reversed)
            builtKey = key
        }
        if s.bool("started") { music.play(venue: venue) }
        let inBar = s.string("mode") == "bar" && s.bool("started")
        lanesLayer.isHidden = !inBar
        if inBar {
            for lane in lanes { lane.update(state: s, engine: engine, time: time) }
        }
        drawHUD(s)
        drawOverlay(s)
        if inBar && venueIndex != shownVenue {
            shownVenue = venueIndex
            showVenueBanner(venueIndex)
        }
    }

    private func safeInsets() -> (top: CGFloat, bottom: CGFloat) {
        #if os(iOS)
        return (view?.safeAreaInsets.top ?? 0, view?.safeAreaInsets.bottom ?? 0)
        #else
        return (0, 0)
        #endif
    }

    private func buildBar(venue: String, reversed: [Bool]) {
        backdropLayer.removeAllChildren()
        lanesLayer.removeAllChildren()
        Backdrop.build(venue: venue, in: backdropLayer, size: size, layout: layout)
        lanes = (0..<layout.laneCount).map { i in
            let lane = LaneView(index: i, venue: venue, reversed: reversed.indices.contains(i) && reversed[i], layout: layout, engine: engine)
            lanesLayer.addChild(lane.node)
            return lane
        }
        hudBuilt = false
        #if os(iOS)
        buildTouchControls()
        #endif
    }

    // ------------------------------------------------------------ HUD

    private var hudBuilt = false
    private let scoreLabel = SKLabelNode(fontNamed: "AvenirNext-Heavy")
    private let levelLabel = SKLabelNode(fontNamed: "AvenirNext-DemiBold")
    private let livesNode = SKNode()
    private var shownLives = -1

    private func drawHUD(_ s: Snap) {
        let L = layout
        if !hudBuilt {
            hudLayer.removeAllChildren()
            scoreLabel.fontSize = L.hudFont
            scoreLabel.fontColor = SKColor(hex: 0xFCE4C4)
            scoreLabel.horizontalAlignmentMode = .left
            scoreLabel.position = CGPoint(x: L.margin, y: L.hudY)
            levelLabel.fontSize = L.hudFont * 0.5
            levelLabel.fontColor = SKColor(hex: 0xC6A15B)
            levelLabel.horizontalAlignmentMode = .left
            levelLabel.position = CGPoint(x: L.margin, y: L.hudY - L.hudFont * 0.75)
            let logo = SKSpriteNode(texture: Art.texture("soda-jerk-logo.png"))
            logo.size = logo.texture!.size().fitting(height: L.hudFont * 1.1)
            logo.position = CGPoint(x: size.width / 2, y: L.hudY + L.hudFont * 0.3)
            for n in [scoreLabel, levelLabel, livesNode, logo] { n.removeFromParent(); hudLayer.addChild(n) }
            shownLives = -1
            hudBuilt = true
        }
        let started = s.bool("started")
        hudLayer.isHidden = !started
        scoreLabel.text = String(format: "%04d", s.int("score"))
        let toGo = s.ints("roster").reduce(0, +) + s.list("customers").count
        levelLabel.text = s.string("mode") == "bar" ? "LEVEL \(s.int("level")) · \(toGo) TO GO" : "LEVEL \(s.int("level")) · BONUS"
        let lives = s.int("lives")
        if lives != shownLives {
            livesNode.removeAllChildren()
            let head = Art.texture("player-head.png")
            let h = L.hudFont * 0.9
            for i in 0..<max(0, lives) {
                let n = SKSpriteNode(texture: head)
                n.size = head.size().fitting(height: h)
                n.position = CGPoint(x: size.width - L.margin - CGFloat(i) * h * 0.9 - h / 2, y: L.hudY + h * 0.2)
                livesNode.addChild(n)
            }
            shownLives = lives
        }
    }

    // ------------------------------------------------------------ screens

    private var shownOverlay = ""

    private func drawOverlay(_ s: Snap) {
        var title = "", subtitle = "", showLogo = false
        let go = Layout.confirmWord
        if !s.bool("started") {
            showLogo = true; subtitle = "\(go) to start"
        } else if s.bool("gameOver") {
            title = "GAME OVER"; subtitle = "Score \(s.int("score")) · \(go) to play again"
        } else if s.bool("paused") {
            title = "PAUSED"; subtitle = "\(go) to carry on"
        } else if s.bool("awaitingContinue") {
            title = Self.missTitle(s.string("missReason"))
            let lives = s.int("lives")
            subtitle = "\(lives) \(lives == 1 ? "life" : "lives") left · \(go) to continue"
        } else if s.bool("awaitingStageAdvance") {
            title = "LEVEL PASSED!"; subtitle = "\(go) for the next round"
        } else if s.string("mode") != "bar" {
            title = "BONUS ROUND"; subtitle = "Coming to this version soon · \(go) to skip"
        }
        let key = "\(title)|\(subtitle)|\(showLogo)|\(size)"
        guard key != shownOverlay else { return }
        shownOverlay = key
        overlayLayer.removeAllChildren()
        guard !title.isEmpty || showLogo else { return }

        let L = layout
        let shade = SKSpriteNode(color: SKColor(white: 0, alpha: showLogo ? 0.55 : 0.6), size: size)
        shade.position = CGPoint(x: size.width / 2, y: size.height / 2)
        overlayLayer.addChild(shade)
        var y = size.height / 2
        if showLogo {
            let logo = SKSpriteNode(texture: Art.texture("soda-jerk-logo.png"))
            logo.size = logo.texture!.size().fitting(width: min(size.width * 0.8, L.laneH * 5))
            logo.position = CGPoint(x: size.width / 2, y: y + logo.size.height * 0.4)
            overlayLayer.addChild(logo)
            y -= logo.size.height * 0.5
        }
        if !title.isEmpty {
            let t = SKLabelNode(fontNamed: "AvenirNext-Heavy")
            t.text = title
            t.fontSize = L.hudFont * 1.1
            t.fontColor = SKColor(hex: 0xC6A15B)
            t.position = CGPoint(x: size.width / 2, y: y + L.hudFont * 0.3)
            overlayLayer.addChild(t)
            y -= L.hudFont * 0.8
        }
        let sub = SKLabelNode(fontNamed: "AvenirNext-DemiBold")
        sub.text = subtitle
        sub.fontSize = L.hudFont * 0.55
        sub.fontColor = SKColor(hex: 0xFCE4C4)
        sub.position = CGPoint(x: size.width / 2, y: y - L.hudFont * 0.2)
        overlayLayer.addChild(sub)
    }

    static func missTitle(_ reason: String?) -> String {
        switch reason {
        case "glass": return "YOU MISSED A GLASS!"
        case "mug": return "WRONG DRINK!"
        case "no-patron": return "NO PATRON!"
        case "drinking": return "STILL DRINKING!"
        case "watching": return "THEY'RE WATCHING THE SHOW!"
        case "spray": return "YOU GOT SPRAYED!"
        default: return "YOU MISSED!"
        }
    }

    #if os(iOS)
    private var dragStart: CGPoint?

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let t = touches.first else { return }
        if confirm() { return }
        let p = t.location(in: self)
        let names = nodes(at: p).compactMap(\.name)
        if let name = names.first(where: { $0.hasPrefix(Self.drinkButtonName) }),
           let i = Int(name.dropFirst(Self.drinkButtonName.count)) {
            engine.call("pourDrink", i)
            return
        }
        // As on the web: tap a returning glass to catch it, or the hot dog
        // to send him running for it.
        if let name = names.first(where: { $0.hasPrefix(LaneView.glassName) }),
           let id = Int(name.dropFirst(LaneView.glassName.count)) {
            engine.call("grabGlass", id)
            return
        }
        if names.contains(LaneView.hotdogName) {
            engine.call("grabBonus")
            return
        }
        if let lane = layout.laneCenters.firstIndex(where: { abs($0 - p.y) <= layout.laneH / 2 }) {
            engine.call("goToLane", lane)
            dragStart = p
        }
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let start = dragStart, let t = touches.first else { return }
        let dx = t.location(in: self).x - start.x
        setRun(abs(dx) > 14 ? (dx > 0 ? 1 : -1) : 0)
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        dragStart = nil
        setRun(0)
    }

    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        touchesEnded(touches, with: event)
    }
    #endif

    private func showVenueBanner(_ index: Int) {
        guard engine.venues.indices.contains(index) else { return }
        let v = engine.venues[index]
        let banner = SKNode()
        let name = SKLabelNode(fontNamed: "AvenirNext-Heavy")
        name.text = v.string("name")
        name.fontSize = layout.hudFont
        name.fontColor = SKColor(hex: 0xFCE4C4)
        let tag = SKLabelNode(fontNamed: "AvenirNext-DemiBold")
        tag.text = v.string("tagline")?.uppercased()
        tag.fontSize = layout.hudFont * 0.42
        tag.fontColor = SKColor(hex: 0xC6A15B)
        tag.position = CGPoint(x: 0, y: -layout.hudFont * 0.7)
        let w = max(name.frame.width, tag.frame.width) + layout.hudFont * 1.2
        let panel = SKShapeNode(rectOf: CGSize(width: w, height: layout.hudFont * 2.2), cornerRadius: 8)
        panel.fillColor = SKColor(hex: 0x0C0A0D, alpha: 0.85)
        panel.strokeColor = SKColor(hex: 0xC6A15B)
        panel.lineWidth = 2
        panel.position = CGPoint(x: 0, y: layout.hudFont * 0.15)
        for n in [panel, name, tag] { banner.addChild(n) }
        banner.position = CGPoint(x: size.width / 2, y: size.height / 2)
        banner.zPosition = 150
        banner.alpha = 0
        addChild(banner)
        banner.run(.sequence([.fadeIn(withDuration: 0.3), .wait(forDuration: 1.8), .fadeOut(withDuration: 0.5), .removeFromParent()]))
    }
}

#if os(iOS)
// ------------------------------------------------------------ touch
// The phone plays like the web game: tap a bar to jump to it, drag left or
// right to run along it, and the two drink taps at the bottom pour.
extension GameScene {
    static let drinkButtonName = "drink-button-"

    func buildTouchControls() {
        childNode(withName: "touch-controls")?.removeFromParent()
        let group = SKNode()
        group.name = "touch-controls"
        group.zPosition = 90
        let size = min(self.size.width * 0.28, layout.controlsTop * 0.75)
        for (i, file) in ["tap-orange.png", "tap-pink.png"].enumerated() {
            let ring = SKShapeNode(circleOfRadius: size / 2)
            ring.fillColor = SKColor(hex: 0x151014)
            ring.strokeColor = SKColor(hex: 0xC6A15B)
            ring.lineWidth = 2
            ring.position = CGPoint(x: self.size.width * (i == 0 ? 0.25 : 0.75), y: layout.controlsTop * 0.5)
            ring.name = Self.drinkButtonName + "\(i)"
            let tap = SKSpriteNode(texture: Art.texture(file))
            tap.size = tap.texture!.size().fitting(height: size * 0.8)
            tap.name = ring.name
            ring.addChild(tap)
            group.addChild(ring)
        }
        addChild(group)
    }
}
#endif

/// Where everything goes for the current screen. Phones are portrait like
/// the web game; the TV is landscape, so the bar is a wide band across it.
struct Layout {
    var size = CGSize(width: 390, height: 844)
    var laneCount = 4
    var laneW: CGFloat = 358
    var laneH: CGFloat = 144
    var x0: CGFloat = 16
    var laneCenters: [CGFloat] = []
    var hudY: CGFloat = 780
    var hudFont: CGFloat = 26
    var margin: CGFloat = 16
    var controlsTop: CGFloat = 0 // iOS: top of the drink buttons

    #if os(tvOS)
    static let confirmWord = "Press A"
    #else
    static let confirmWord = "Tap"
    #endif

    init() {}

    init(size: CGSize, insets: (top: CGFloat, bottom: CGFloat)) {
        self.size = size
        let W = size.width, H = size.height
        #if os(tvOS)
        let top = H * 0.16, bottom = H * 0.05
        laneW = min(W * 0.9, (H - top - bottom) * 2.1)
        margin = (W - laneW) / 2
        hudFont = H * 0.045
        hudY = H - H * 0.075
        #else
        let top = insets.top + H * 0.15, bottom = insets.bottom + H * 0.15
        margin = 16
        laneW = W - 32
        hudFont = min(30, W * 0.07)
        hudY = H - insets.top - hudFont * 1.4
        controlsTop = bottom
        #endif
        x0 = (W - laneW) / 2
        laneH = (H - top - bottom) / CGFloat(laneCount)
        laneCenters = (0..<laneCount).map { H - top - laneH * (CGFloat($0) + 0.5) }
    }

    // Web sizes (px at a ~144px lane) as fractions of this lane's height.
    var counterH: CGFloat { laneH * 44 / 144 }
    var feetY: CGFloat { -counterH / 2 }
    var surfaceY: CGFloat { counterH / 2 + laneH * 6 / 144 }
    var patronH: CGFloat { laneH * 89 / 144 }
    var jerkH: CGFloat { laneH * 94 / 144 }
    func x(_ pct: Double) -> CGFloat { CGFloat(pct) / 100 * laneW }
}

extension CGSize {
    func fitting(height h: CGFloat) -> CGSize { CGSize(width: self.height > 0 ? width / self.height * h : h, height: h) }
    func fitting(width w: CGFloat) -> CGSize { CGSize(width: w, height: self.width > 0 ? height / self.width * w : w) }
}
