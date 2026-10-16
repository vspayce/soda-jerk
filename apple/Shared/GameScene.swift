import SpriteKit

/// The whole game, drawn natively — the same screens and flow as the web
/// game's App.jsx. Every rule comes from the shared engine (Engine.swift →
/// engine.js); this scene steps it once a frame, draws what it says, plays
/// the sounds its counters call for, and passes the controls in.
///
/// Sizes follow the web game's: a lane there is about 144px tall, and the
/// counter, patrons, jerk and props are fixed sizes within it, so here
/// they're the same fractions of the lane's height; screens use web px
/// scaled by Theme.u.
final class GameScene: SKScene {
    let engine = Engine()
    let controls = Controls()
    let music = Music()
    let sfx = Sfx()

    private var lastTime: TimeInterval?
    private var sentRun = 0         // what the engine was last told
    private var controllerRun = 0   // what the controller last asked for

    private let backdropLayer = SKNode()
    private let lanesLayer = SKNode()
    private let effectsLayer = SKNode()
    private let controlsLayer = SKNode()
    private let hudLayer = SKNode()
    private let screenLayer = SKNode()
    private var lanes: [LaneView] = []
    private var hud: HUDView?
    private var builtKey = ""
    private var shownVenue = -1
    var layout = Layout()

    // screens: one driven by the game's state (splash, a life lost, level
    // passed, game over), and a stack of menus opened over it
    private var stateScreen: Overlay?
    private var stateScreenKey = ""
    private var menus: [Overlay] = []
    private var showInstructions = false
    private var top: Overlay? { menus.last ?? stateScreen }

    // the engine's event counters, last seen (App.jsx's useOnCounter)
    private var seen: [String: Int] = [:]
    private var sprayUntil: TimeInterval = 0
    private var now: TimeInterval = 0

    // ------------------------------------------------------------ setup

    override func didMove(to view: SKView) {
        backgroundColor = SKColor(hex: 0x151014)
        scaleMode = .resizeFill
        for (layer, z) in [(backdropLayer, 0), (lanesLayer, 10), (effectsLayer, 60), (controlsLayer, 90),
                           (hudLayer, 100), (screenLayer, 200)] as [(SKNode, CGFloat)] {
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
        // `-js "<code>"` runs code on the sim at launch (for testing), e.g.
        // `-js "sim.awaitingStageAdvance = true; sim.clearCount = 2"`
        if let i = args.firstIndex(of: "-js"), i + 1 < args.count { engine.debugRun(args[i + 1]) }
        // `-show <screen>` opens a screen at launch, to look at it
        if let i = args.firstIndex(of: "-show"), i + 1 < args.count { debugShow = args[i + 1] }
    }

    private var debugShow: String?

    /// For `-show`: once the scene has its size, opens the named screen.
    private func openDebugScreen(_ name: String) {
        switch name {
        case "instructions": showInstructions = true
        case "settings": openSettings()
        case "lingo": openLingo()
        case "scores": pushMenu(LeaderboardScreen(size: size) { [weak self] in self?.popMenu() })
        case "lost":
            stateScreenKey = "debug"
            stateScreen = LifeLostScreen(size: size, score: 1250, lives: 2, reason: "spray") {}
            screenLayer.addChild(stateScreen!)
        case "passed":
            stateScreenKey = "debug"
            stateScreen = StagePassedScreen(size: size, clearCount: 3, trickName: "THE STRAW TOSS", trickBonus: 300, throwDelayMs: 450, onContinue: {}, onTrickBonus: { _ in })
            screenLayer.addChild(stateScreen!)
        case "over":
            stateScreenKey = "debug"
            stateScreen = GameOverScreen(size: size, score: 4200, onRestart: {}, onLingo: {})
            screenLayer.addChild(stateScreen!)
        case "celebrate":
            effectsLayer.addChild(Effects.celebration(points: 500, showMs: 9800, at: CGPoint(x: size.width / 2, y: size.height * 0.88 - layout.safeTop)))
        default: break
        }
    }

    override func didChangeSize(_ oldSize: CGSize) { builtKey = "" }

    // ------------------------------------------------------------ frame

    override func update(_ currentTime: TimeInterval) {
        let dt = lastTime.map { min(currentTime - $0, 0.05) } ?? 0
        lastTime = currentTime
        now = currentTime

        handle(controls.read())
        engine.step(dt)
        engine.refresh()
        let s = engine.state
        rebuildIfNeeded(s)
        playEvents(s)
        draw(s, time: currentTime)
        if let name = debugShow, size.width > 0, hud != nil {
            debugShow = nil
            openDebugScreen(name)
        }
        if stateScreenKey != "debug" { syncScreens(s) }
        for o in menus { o.tick(dt) }
        stateScreen?.tick(dt)
    }

    // ------------------------------------------------------------ screens

    /// The screen the game's state calls for (App.jsx's conditionals).
    private func syncScreens(_ s: Snap) {
        var key = ""
        if !s.bool("started") { key = showInstructions ? "" : "splash" }
        else if s.bool("gameOver") { key = "over" }
        else if s.string("mode") != "bar" { key = "bonus-\(s.string("mode") ?? "")" }
        else if s.bool("awaitingContinue") { key = "lost-\(s.int("lives"))-\(s.string("missReason") ?? "")" }
        else if s.bool("awaitingStageAdvance") { key = "passed-\(s.int("clearCount"))" }
        if showInstructions && !s.bool("started") && menus.isEmpty { pushMenu(makeInstructions()) }
        guard key != stateScreenKey else { return }
        stateScreenKey = key
        stateScreen?.removeFromParent()
        stateScreen = nil
        guard !key.isEmpty else { return }
        let screen: Overlay
        switch key {
        case "splash":
            screen = SplashScreen(size: size, onStart: { [weak self] in
                guard let self else { return }
                self.music.play(venue: "speakeasy")
                self.showInstructions = true
            }, onHighScores: { [weak self] in
                guard let self else { return }
                self.pushMenu(LeaderboardScreen(size: self.size) { [weak self] in self?.popMenu() })
            })
        case "over":
            screen = GameOverScreen(size: size, score: s.int("score"), onRestart: { [weak self] in
                self?.engine.newGame()
                self?.seen = [:]
            }, onLingo: { [weak self] in self?.openLingo() })
        case _ where key.hasPrefix("lost"):
            screen = LifeLostScreen(size: size, score: s.int("score"), lives: s.int("lives"), reason: s.string("missReason")) { [weak self] in
                self?.engine.call("continueAfterDeath")
            }
        case _ where key.hasPrefix("passed"):
            let clear = s.int("clearCount")
            let trick = engine.value("trickForClear", clear) as? [String: Any]
            let C = engine.constants
            screen = StagePassedScreen(size: size, clearCount: clear, trickName: trick?["name"] as? String,
                                       trickBonus: C.int("TRICK_BONUS"), throwDelayMs: C.double("TRICK_THROW_DELAY_MS"),
                                       onContinue: { [weak self] in self?.engine.call("advanceStage") },
                                       onTrickBonus: { [weak self] in self?.engine.call("addTrickBonus", $0) })
        default:
            screen = BonusComingSoon(size: size) { [weak self] in self?.engine.call("finishBonusRound") }
        }
        stateScreen = screen
        screenLayer.addChild(screen)
    }

    private func makeInstructions() -> Overlay {
        InstructionsScreen(size: size, engine: engine, onContinue: { [weak self] in
            guard let self else { return }
            self.popMenu()
            self.showInstructions = false
            self.engine.call("startGame")
        }, onLingo: { [weak self] in self?.openLingo() })
    }

    func pushMenu(_ o: Overlay) {
        o.zPosition = CGFloat(10 + menus.count)
        menus.append(o)
        screenLayer.addChild(o)
    }

    func popMenu() {
        menus.popLast()?.removeFromParent()
    }

    private func openLingo() {
        pushMenu(LingoScreen(size: size, engine: engine) { [weak self] in self?.popMenu() })
    }

    func openSettings() {
        guard !menus.contains(where: { $0 is SettingsScreen }) else { return }
        let s = engine.state
        if s.bool("started") { engine.call("setPaused", true) }
        let canSkip = s.bool("started") && !s.bool("gameOver") && s.string("mode") == "bar"
        pushMenu(SettingsScreen(size: size, music: music, onClose: { [weak self] in
            self?.popMenu()
            self?.engine.call("setPaused", false)
        }, onLingo: { [weak self] in self?.openLingo() },
        onSkipToNewVenue: canSkip ? { [weak self] in
            self?.popMenu()
            self?.engine.call("setPaused", false)
            self?.engine.call("skipToNewVenue")
        } : nil))
    }

    // ------------------------------------------------------------ sounds and effects

    /// App.jsx's useOnCounter hooks: each engine counter that ticks up
    /// plays its sound or effect.
    private func playEvents(_ s: Snap) {
        func ticked(_ key: String, _ value: Int) -> Bool {
            defer { seen[key] = value }
            guard let old = seen[key] else { return false }
            return value > old
        }
        if ticked("missedGlassCount", s.int("missedGlassCount")) { sfx.glassShatter() }
        if ticked("mugCrashCount", s.int("mugCrashCount")) { sfx.glassShatter() }
        if ticked("spillCount", s.int("spillCount")) {
            sfx.seltzerSpray()
            sprayUntil = now + 1.1
        }
        if ticked("celebrateCount", s.int("celebrateCount")) {
            sfx.celebrate()
            let C = engine.constants
            effectsLayer.addChild(Effects.celebration(points: C.int("POINTS_PER_BONUS"), showMs: C.double("SHOW_MS"),
                                                      at: CGPoint(x: size.width / 2, y: size.height * 0.88 - layout.safeTop)))
        }
        if ticked("extraLifeCount", s.int("extraLifeCount")) {
            sfx.celebrate()
            effectsLayer.addChild(Effects.extraLife(at: CGPoint(x: size.width / 2, y: size.height * 0.68)))
        }
        let over = s.bool("gameOver") ? 1 : 0
        if ticked("gameOver", over) {
            music.stop()
            sfx.crash()
        }
        if s.bool("started") && !s.bool("gameOver") {
            let i = s.int("venue")
            if engine.venues.indices.contains(i) { music.play(venue: engine.venues[i].string("id") ?? "speakeasy") }
        }
    }

    // ------------------------------------------------------------ input

    private func handle(_ f: Controls.Frame) {
        if let screen = top {
            if f.laneStep < 0 { screen.handle(.up) }
            if f.laneStep > 0 { screen.handle(.down) }
            if f.navLeft { screen.handle(.left) }
            if f.navRight { screen.handle(.right) }
            if f.pourOrange { screen.handle(.select) }
            if f.pourPink || f.pause {
                // Back closes a menu; on the game's own screens Menu opens settings
                if menus.isEmpty && f.pause && engine.state.bool("started") { openSettings() } else { screen.handle(.back) }
            }
            if sentRun != 0 { setRun(0) }
            controllerRun = 0
            return
        }
        let s = engine.state
        guard s.bool("started"), s.string("mode") == "bar" else { return }
        if f.pause { openSettings(); return }
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

    func setRun(_ dir: Int) {
        guard dir != sentRun else { return }
        if dir == 0 { engine.call("stopRun") } else { engine.call("startRun", dir) }
        sentRun = dir
    }

    // ------------------------------------------------------------ drawing

    private func rebuildIfNeeded(_ s: Snap) {
        let venue = venueId(s)
        let reversed = s.bools("laneReversed")
        let key = "\(size.width)x\(size.height)|\(venue)|\(reversed)"
        guard key != builtKey else { return }
        let sizeChanged = !builtKey.hasPrefix("\(size.width)x\(size.height)|")
        builtKey = key
        Theme.configure(for: size)
        layout = Layout(size: size, insets: safeInsets())
        backdropLayer.removeAllChildren()
        lanesLayer.removeAllChildren()
        Backdrop.build(venue: venue, in: backdropLayer, size: size, layout: layout)
        lanes = (0..<layout.laneCount).map { i in
            let lane = LaneView(index: i, venue: venue, reversed: reversed.indices.contains(i) && reversed[i], layout: layout, engine: engine)
            lanesLayer.addChild(lane.node)
            return lane
        }
        if sizeChanged || hud == nil {
            hud?.removeFromParent()
            let h = HUDView(width: size.width, centerY: layout.hudY, margin: layout.margin,
                            onMute: { [weak self] in self?.music.isMuted.toggle() },
                            onSettings: { [weak self] in self?.openSettings() })
            hudLayer.addChild(h)
            hud = h
            buildDrinkButtons()
            // screens are laid out for a size: start them again
            for m in menus { m.removeFromParent() }
            menus = []
            stateScreen?.removeFromParent(); stateScreen = nil; stateScreenKey = ""
        }
    }

    private func venueId(_ s: Snap) -> String {
        let i = s.int("venue")
        return engine.venues.indices.contains(i) ? engine.venues[i].string("id") ?? "speakeasy" : "speakeasy"
    }

    private func draw(_ s: Snap, time: TimeInterval) {
        let started = s.bool("started")
        let inBar = s.string("mode") == "bar" && started
        lanesLayer.isHidden = !inBar
        let spraying = time < sprayUntil
        if inBar {
            for lane in lanes { lane.update(state: s, engine: engine, time: time, spraying: spraying) }
        }
        hudLayer.isHidden = !started
        let toGo = s.ints("roster").reduce(0, +) + s.list("customers").count
        hud?.update(score: s.int("score"),
                    levelText: inBar ? "LEVEL \(s.int("level")) · \(toGo) TO GO" : nil,
                    lives: s.int("lives"), muted: music.isMuted)
        controlsLayer.isHidden = !(inBar && !s.bool("gameOver") && !s.bool("awaitingContinue") && !s.bool("awaitingStageAdvance"))
        updateDrinkButtons(selected: s.int("selectedDrink"))
        if inBar && s.int("venue") != shownVenue {
            shownVenue = s.int("venue")
            showVenueBanner(shownVenue)
        }
    }

    private func safeInsets() -> (top: CGFloat, bottom: CGFloat) {
        #if os(iOS)
        return (view?.safeAreaInsets.top ?? 0, view?.safeAreaInsets.bottom ?? 0)
        #else
        return (0, 0)
        #endif
    }

    // ------------------------------------------------------------ drink buttons

    static let drinkButtonName = "drink-button-"
    private var drinkRings: [SKShapeNode] = []

    /// The two drink taps at the bottom (DrinkSelector.jsx): an ink disc in a
    /// faint brass sunburst, the tap handle inside; the last poured is ringed.
    /// Touch only — a TV plays with a controller.
    private func buildDrinkButtons() {
        controlsLayer.removeAllChildren()
        drinkRings = []
        #if os(iOS)
        let u = Theme.u
        let d: CGFloat = 76 * u
        let y = layout.safeBottom + 40 * u + d / 2
        for (i, file) in ["tap-orange.png", "tap-pink.png"].enumerated() {
            let x = i == 0 ? 56 * u + d / 2 : size.width - 56 * u - d / 2
            let burst = Swirl.sunburst(diameter: 100 * u)
            burst.position = CGPoint(x: x, y: y)
            let disc = SKShapeNode(circleOfRadius: d / 2)
            disc.fillColor = Theme.ink
            disc.lineWidth = 2.5 * u
            disc.position = CGPoint(x: x, y: y)
            disc.name = Self.drinkButtonName + "\(i)"
            let tap = SKSpriteNode(texture: Art.texture(file))
            tap.size = tap.texture!.size().fitting(height: d - 8 * u)
            tap.name = disc.name
            disc.addChild(tap)
            controlsLayer.addChild(burst)
            controlsLayer.addChild(disc)
            drinkRings.append(disc)
        }
        #endif
    }

    private func updateDrinkButtons(selected: Int) {
        for (i, ring) in drinkRings.enumerated() {
            let on = i == selected
            ring.strokeColor = on ? Theme.cream : Theme.ink.withAlphaComponent(0.6)
            ring.glowWidth = on ? 4 * Theme.u : 0
        }
    }

    // ------------------------------------------------------------ banners

    static func missTitle(_ reason: String?) -> String {
        switch reason {
        case "glass": return "YOU MISSED A GLASS!"
        case "mug": return "WRONG DRINK!"
        case "no-patron": return "NO PATRON!"
        case "drinking": return "STILL DRINKING!"
        case "watching": return "THEY'RE WATCHING THE SHOW!"
        case "spray": return "YOU GOT SPRAYED!"
        default: return "YOU MISSED"
        }
    }

    /// The venue's name card as you arrive (App.jsx's venue-banner).
    private func showVenueBanner(_ index: Int) {
        guard engine.venues.indices.contains(index) else { return }
        let v = engine.venues[index]
        let u = Theme.u
        let banner = SKNode()
        let name = Theme.label(v.string("name") ?? "", .script, 30, color: Theme.creamLight)
        let tag = Theme.label((v.string("tagline") ?? "").uppercased(), .display, 12, color: Theme.brass, weight: 600, tracking: 0.25)
        name.position = CGPoint(x: 0, y: 10 * u)
        tag.position = CGPoint(x: 0, y: -18 * u)
        let w = max(name.frame.width, tag.frame.width) + 48 * u
        let panel = SKShapeNode(rectOf: CGSize(width: w, height: name.frame.height + tag.frame.height + 34 * u), cornerRadius: 6 * u)
        panel.fillColor = SKColor(hex: 0x0C0A0D, alpha: 0.82)
        panel.strokeColor = Theme.brass
        panel.lineWidth = 2 * u
        for n in [panel, name, tag] { banner.addChild(n) }
        banner.position = CGPoint(x: size.width / 2, y: size.height / 2)
        banner.alpha = 0
        banner.setScale(0.9)
        effectsLayer.addChild(banner)
        banner.run(.sequence([.group([.fadeIn(withDuration: 0.3), .scale(to: 1, duration: 0.3)]), .wait(forDuration: 1.8),
                              .group([.fadeOut(withDuration: 0.5), .scale(to: 1.04, duration: 0.5)]), .removeFromParent()]))
    }

    // ------------------------------------------------------------ touch

    #if os(iOS)
    private var dragStart: CGPoint?
    private var laneLatched = false

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let t = touches.first else { return }
        let p = t.location(in: self)
        if let screen = top { screen.touchBegan(p); return }
        if let b = hud?.buttons.first(where: { $0.contains(scenePoint: p) }) { b.press(); return }
        let names = nodes(at: p).compactMap(\.name)
        if !controlsLayer.isHidden, let name = names.first(where: { $0.hasPrefix(Self.drinkButtonName) }),
           let i = Int(name.dropFirst(Self.drinkButtonName.count)) {
            engine.call("pourDrink", i)
            return
        }
        guard engine.state.string("mode") == "bar", engine.state.bool("started") else { return }
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
        dragStart = p
        laneLatched = false
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let t = touches.first else { return }
        let p = t.location(in: self)
        if let screen = top { screen.touchMoved(p); return }
        guard let start = dragStart else { return }
        let u = Theme.u
        let dx = p.x - start.x, dy = p.y - start.y
        // App.jsx's gesture: a vertical swipe moves one bar, a sideways drag runs
        if !laneLatched && abs(dy) > 40 * u && abs(dy) > abs(dx) {
            laneLatched = true
            engine.call("changeLane", dy > 0 ? -1 : 1)
        }
        setRun(abs(dx) > 20 * u ? (dx > 0 ? 1 : -1) : 0)
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let t = touches.first else { return }
        let p = t.location(in: self)
        if let screen = top { screen.touchEnded(p); return }
        defer { dragStart = nil }
        guard dragStart != nil else { return }
        if sentRun != 0 { setRun(0) }
        else if !laneLatched, let lane = layout.laneCenters.firstIndex(where: { abs($0 - p.y) <= layout.laneH / 2 }) {
            // a plain tap on a bar jumps straight to it
            engine.call("goToLane", lane)
        }
    }

    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        dragStart = nil
        setRun(0)
    }
    #endif
}

/// Shown in place of a bonus round until the round's been brought over.
final class BonusComingSoon: Overlay {
    init(size: CGSize, onSkip: @escaping () -> Void) {
        super.init(size: size, backdropAlpha: 0.95)
        add(Theme.label("BONUS ROUND", .display, 28, color: Theme.brass, weight: 700, tracking: 0.1))
        add(Theme.label("Coming to this version soon", .body, 14, color: Theme.cream.withAlphaComponent(0.7)), gap: 12)
        add(DecoButton("ON TO THE NEXT LEVEL", titlePx: 18, maxWidth: size.width - 32 * Theme.u, action: onSkip), gap: 28)
        finishLayout()
    }
    required init?(coder: NSCoder) { fatalError() }
}

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
    var margin: CGFloat = 16
    var safeTop: CGFloat = 0
    var safeBottom: CGFloat = 0

    init() {}

    init(size: CGSize, insets: (top: CGFloat, bottom: CGFloat)) {
        self.size = size
        safeTop = insets.top
        safeBottom = insets.bottom
        let W = size.width, H = size.height
        #if os(tvOS)
        let top = H * 0.16, bottom = H * 0.05
        laneW = min(W * 0.9, (H - top - bottom) * 2.1)
        margin = (W - laneW) / 2
        hudY = H - H * 0.075
        let gap: CGFloat = 0
        #else
        // App.jsx: the bars fill the frame below the HUD (safe area + 140px)
        // and above the drink taps (128px), with 16px either side and 4px
        // between them.
        let u = Theme.u
        let top = insets.top + 140 * u, bottom = 128 * u
        margin = 16 * u
        laneW = W - 32 * u
        hudY = H - insets.top - 44 * u - 18 * u
        let gap: CGFloat = 4 * u
        #endif
        x0 = (W - laneW) / 2
        laneH = (H - top - bottom - gap * CGFloat(laneCount - 1)) / CGFloat(laneCount)
        laneCenters = (0..<laneCount).map { H - top - (laneH + gap) * CGFloat($0) - laneH / 2 }
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
