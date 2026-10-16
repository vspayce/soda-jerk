import SpriteKit

/// The five bonus rounds (BonusLevel, PlatesLevel, ShakerLevel, SlideLevel
/// and TempestLevel.jsx), drawn natively from the engine's round state.
/// Every round lays out in "arena" percentages like the web — x across, y
/// down — over a portrait arena: the whole screen on a phone, a centred
/// phone-shaped column on a TV, so the geometry plays the same on both.
class BonusView: SKNode {
    let engine: Engine
    let size: CGSize
    /// The arena, in scene points (origin bottom-left).
    let arena: CGRect
    let safeTop: CGFloat
    var u: CGFloat { Theme.u }
    private var resultNode: SKNode?
    private var shownResult = ""

    init(engine: Engine, size: CGSize, safeTop: CGFloat) {
        self.engine = engine
        self.size = size
        self.safeTop = safeTop
        #if os(tvOS)
        let w = min(size.width, size.height * 0.62)
        arena = CGRect(x: (size.width - w) / 2, y: 0, width: w, height: size.height)
        #else
        arena = CGRect(origin: .zero, size: size)
        #endif
        super.init()
        let bg = SKSpriteNode(color: Theme.ink, size: CGSize(width: size.width * 2, height: size.height * 2))
        bg.position = CGPoint(x: size.width / 2, y: size.height / 2)
        // covers the bar's backdrop (and its logo) entirely, as bg-ink does;
        // z adds up through parents, so it stays at 0 here and the round's
        // own pieces sit above it
        bg.zPosition = 0
        addChild(bg)
    }
    required init?(coder: NSCoder) { fatalError() }

    /// arena % (x across, y down) → scene point
    func pt(_ x: Double, _ y: Double) -> CGPoint {
        CGPoint(x: arena.minX + CGFloat(x) / 100 * arena.width, y: arena.maxY - CGFloat(y) / 100 * arena.height)
    }
    /// scene point → arena %
    func pct(_ p: CGPoint) -> (x: Double, y: Double) {
        (Double((p.x - arena.minX) / arena.width * 100), Double((arena.maxY - p.y) / arena.height * 100))
    }
    /// a width in arena %
    func w(_ pct: Double) -> CGFloat { CGFloat(pct) / 100 * arena.width }

    /// Where the header starts (the web's safe area + 74–78px).
    var headerTop: CGFloat {
        #if os(tvOS)
        return arena.maxY - arena.height * 0.06
        #else
        return arena.maxY - safeTop - 84 * u
        #endif
    }

    /// The round's title and its lines of instructions, stacked from the top.
    @discardableResult
    func header(_ title: String, _ lines: [SKLabelNode]) -> CGFloat {
        let t = Theme.label(title, .display, 18, color: Theme.brass, weight: 700, tracking: 0.2)
        var y = headerTop - t.lineHeight / 2
        t.position = CGPoint(x: arena.midX, y: y)
        t.zPosition = 50
        addChild(t)
        y -= t.lineHeight / 2 + 4 * u
        for l in lines {
            y -= l.lineHeight / 2
            l.position = CGPoint(x: arena.midX, y: y)
            l.zPosition = 50
            addChild(l)
            y -= l.lineHeight / 2 + 4 * u
        }
        return y
    }

    func line(_ text: String, _ px: CGFloat = 11, alpha: CGFloat = 0.6, display: Bool = false) -> SKLabelNode {
        display ? Theme.label(text, .display, px, color: Theme.cream.withAlphaComponent(alpha), weight: 600, tracking: 0.15)
                : Theme.label(text, .body, px, color: Theme.cream.withAlphaComponent(alpha), tracking: 0.2)
    }

    /// The HIT!/MISS/TIME'S UP plate in the middle of the arena.
    func showResult(_ text: String?, sub: String? = nil, good: Bool) {
        let key = "\(text ?? "")|\(sub ?? "")"
        guard key != shownResult else { return }
        shownResult = key
        resultNode?.removeFromParent(); resultNode = nil
        guard let text, !text.isEmpty else { return }
        let n = SKNode()
        let t = Theme.label(text, .body, 20, color: good ? SKColor(hex: 0xF2D58C) : SKColor(hex: 0xF07A8A), weight: 800, tracking: 0.06,
                            width: arena.width * 0.74)
        var h = t.lineHeight
        var wMax = min(t.frame.width, arena.width * 0.74)
        var subL: SKLabelNode?
        if let sub {
            let s = Theme.label(sub, .body, 13, color: Theme.cream.withAlphaComponent(0.9), tracking: 0.06, width: arena.width * 0.7)
            subL = s
            h += s.lineHeight + 6 * u
            wMax = max(wMax, s.frame.width)
        }
        let plate = SKShapeNode(rectOf: CGSize(width: wMax + 40 * u, height: h + 20 * u), cornerRadius: 8 * u)
        plate.fillColor = SKColor(hex: 0x0C0A0D, alpha: 0.85)
        plate.strokeColor = good ? SKColor(hex: 0xE8C878, alpha: 0.55) : SKColor(hex: 0xE0596B, alpha: 0.5)
        plate.lineWidth = u
        n.addChild(plate)
        t.position = CGPoint(x: 0, y: h / 2 - t.lineHeight / 2)
        n.addChild(t)
        if let subL { subL.position = CGPoint(x: 0, y: -h / 2 + subL.lineHeight / 2); n.addChild(subL) }
        n.position = CGPoint(x: arena.midX, y: arena.midY)
        n.zPosition = 1000
        addChild(n)
        resultNode = n
    }

    func update(_ b: Snap, time: TimeInterval, dt: Double) {}
    func control(_ f: Controls.Frame, dt: Double) {}
    func touchBegan(_ p: CGPoint) {}
    func touchMoved(_ p: CGPoint) {}
    func touchEnded(_ p: CGPoint) {}

    static func cupColors(_ C: Snap) -> [(name: String, color: SKColor)] {
        C.list("BONUS_CUP_COLORS").map { ($0.string("name") ?? "", SKColor(hexString: $0.string("color") ?? "#FFFFFF")) }
    }

    /// A cup (or the scoop) tinted its colour, as the web's ColorTint does.
    static func tinted(_ file: String, color: SKColor, factor: CGFloat = 0.7) -> SKSpriteNode {
        let s = SKSpriteNode(texture: Art.texture(file))
        s.color = color
        s.colorBlendFactor = factor
        return s
    }

    /// The scoop with its ball tinted to the flavour.
    static func scoop(width: CGFloat, color: SKColor) -> SKSpriteNode {
        let s = SKSpriteNode(texture: Art.texture("bonus-scoop.png"))
        s.size = CGSize(width: width, height: width * 205 / 170)
        let ball = SKSpriteNode(texture: Art.texture("bonus-scoop-ball-mask.png"), size: s.size)
        ball.color = color
        ball.colorBlendFactor = 1
        ball.alpha = 0.72
        ball.zPosition = 1
        s.addChild(ball)
        return s
    }
}

extension SKColor {
    convenience init(hexString: String) {
        var v: UInt64 = 0
        Scanner(string: hexString.trimmingCharacters(in: CharacterSet(charactersIn: "#"))).scanHexInt64(&v)
        self.init(hex: UInt32(v))
    }
}

/// A slingshot throw, shared by the wheel and the shaker rounds: drag the
/// scoop back from the anchor (or hold A and steer with the stick), let go.
final class Slingshot {
    private(set) var aiming = false
    private var dx: Double = 0, dy: Double = 0
    let prefix: String // "bonus" or "shaker" — the engine's action names

    init(prefix: String) { self.prefix = prefix }

    func begin(_ engine: Engine) { aiming = true; dx = 0; dy = 0; engine.call("\(prefix)AimStart") }
    func move(_ engine: Engine, to d: (Double, Double)) { dx = d.0; dy = d.1; engine.call("\(prefix)AimMove", dx, dy) }
    func end(_ engine: Engine) { guard aiming else { return }; aiming = false; engine.call("\(prefix)AimEnd") }

    /// Controller: hold A to take hold of the scoop, steer the pull with the
    /// stick (pulling back is pushing down-left, like a thumb on the screen),
    /// and let go to throw.
    func control(_ engine: Engine, _ f: Controls.Frame, dt: Double, ready: Bool, maxPull: Double) {
        if f.aHeld && !aiming && ready { begin(engine) }
        if aiming {
            if f.aHeld {
                let speed = maxPull * 1.4 // a full pull in about 0.7s
                let nx = dx + Double(f.stickX) * speed * dt, ny = dy - Double(f.stickY) * speed * dt
                let len = (nx * nx + ny * ny).squareRoot()
                let k = len > maxPull ? maxPull / len : 1
                move(engine, to: (nx * k, ny * k))
            } else {
                end(engine)
            }
        }
    }
}

// ------------------------------------------------------------ the wheel

/// ICE CREAM (BonusLevel.jsx): a spinning wheel of four coloured cups; pull
/// the scoop back and launch it into the one that matches the flavour.
final class WheelBonus: BonusView {
    private let C: Snap
    private let square: CGRect
    private let wheel = SKNode()
    private var cups: [SKSpriteNode] = []
    private let scoopNode: SKSpriteNode
    private let aimLine = SKShapeNode()
    private let flavorDot = SKShapeNode(circleOfRadius: 5)
    private let flavorLabel: SKLabelNode
    private let throwsLabel: SKLabelNode
    private let sling = Slingshot(prefix: "bonus")
    private var flavorIndex = -1

    override init(engine: Engine, size: CGSize, safeTop: CGFloat) {
        C = engine.constants
        flavorLabel = Theme.label(" ", .body, 11, color: Theme.cream.withAlphaComponent(0.8), tracking: 0.2)
        throwsLabel = Theme.label(" ", .body, 11, color: Theme.cream.withAlphaComponent(0.6), tracking: 0.25)
        scoopNode = SKSpriteNode()
        // the arena is a square below the header (min(92vw, 58vh))
        let tmpArena: CGRect = {
            #if os(tvOS)
            let w = min(size.width, size.height * 0.62)
            return CGRect(x: (size.width - w) / 2, y: 0, width: w, height: size.height)
            #else
            return CGRect(origin: .zero, size: size)
            #endif
        }()
        let side = min(tmpArena.width * 0.92, size.height * 0.58)
        #if os(tvOS)
        let top = size.height * 0.94 - 70 * Theme.u
        #else
        let top = size.height - safeTop - 76 * Theme.u - 66 * Theme.u
        #endif
        square = CGRect(x: tmpArena.midX - side / 2, y: top - side, width: side, height: side)
        super.init(engine: engine, size: size, safeTop: safeTop)

        let y = header("BONUS ROUND", [flavorLabel, throwsLabel])
        _ = y
        flavorDot.strokeColor = SKColor(white: 1, alpha: 0.5)
        flavorDot.lineWidth = 1
        flavorDot.zPosition = 50
        addChild(flavorDot)
        #if os(tvOS)
        let hint = "HOLD A, PULL BACK WITH THE STICK, THEN LET GO"
        #else
        let hint = "DRAG THE SCOOP BACK, THEN LET GO"
        #endif
        let foot = line(hint, 11, alpha: 0.5)
        foot.position = CGPoint(x: square.midX, y: square.minY - 20 * u)
        addChild(foot)

        // the jerk beside the wheel, his held scoop on the launch anchor
        let anchor = C.object("BONUS_LAUNCH_ANCHOR")!
        let jerkW = 24.0, aspect = 1403.0 / 599.0
        let jerk = SKSpriteNode(texture: Art.texture("bonus-jerk.png"))
        jerk.size = CGSize(width: sq(jerkW), height: sq(jerkW * aspect))
        jerk.anchorPoint = CGPoint(x: 0, y: 1)
        jerk.position = sqPt(anchor.double("x") - 0.142 * jerkW, anchor.double("y") - 0.208 * jerkW * aspect)
        jerk.zPosition = 1
        addChild(jerk)

        // the wheel and its four cups, which turn with it but stay upright
        let center = C.object("BONUS_WHEEL_CENTER")!
        let wheelSize = sq(C.double("BONUS_WHEEL_IMAGE_SIZE"))
        let img = SKSpriteNode(texture: Art.texture("bonus-wheel.png"), size: CGSize(width: wheelSize, height: wheelSize))
        wheel.addChild(img)
        let cupW = wheelSize * CGFloat(C.double("BONUS_CUP_SIZE") / C.double("BONUS_WHEEL_IMAGE_SIZE"))
        for (i, cup) in Self.cupColors(C).enumerated() {
            let rad = Double(i) * .pi / 2
            let s = Self.tinted("bonus-cup.png", color: cup.color)
            s.size = CGSize(width: cupW, height: cupW * 734 / 509)
            s.position = CGPoint(x: CGFloat(C.double("BONUS_WHEEL_HOLE_FRACTION_X") * cos(rad)) * wheelSize,
                                 y: -CGFloat(C.double("BONUS_WHEEL_HOLE_FRACTION_Y") * sin(rad)) * wheelSize)
            s.zPosition = 1
            wheel.addChild(s)
            cups.append(s)
        }
        wheel.position = sqPt(center.double("x"), center.double("y"))
        wheel.zPosition = 2
        addChild(wheel)

        let mark = SKShapeNode(circleOfRadius: sq(1.5))
        mark.fillColor = Theme.brass.withAlphaComponent(0.35)
        mark.strokeColor = .clear
        mark.position = sqPt(anchor.double("x"), anchor.double("y"))
        addChild(mark)
        aimLine.strokeColor = Theme.brass.withAlphaComponent(0.7)
        aimLine.lineWidth = 2 * u
        aimLine.zPosition = 3
        addChild(aimLine)
        scoopNode.zPosition = 4
        addChild(scoopNode)
    }
    required init?(coder: NSCoder) { fatalError() }

    private func sq(_ pct: Double) -> CGFloat { CGFloat(pct) / 100 * square.width }
    private func sqPt(_ x: Double, _ y: Double) -> CGPoint {
        CGPoint(x: square.minX + CGFloat(x) / 100 * square.width, y: square.maxY - CGFloat(y) / 100 * square.height)
    }
    private func sqPct(_ p: CGPoint) -> (Double, Double) {
        (Double((p.x - square.minX) / square.width * 100), Double((square.maxY - p.y) / square.height * 100))
    }

    private var state = Snap([:])

    override func update(_ b: Snap, time: TimeInterval, dt: Double) {
        state = b
        let angle = CGFloat(b.double("wheelAngle")) * .pi / 180
        wheel.zRotation = -angle
        for c in cups { c.zRotation = angle }
        let colors = Self.cupColors(C)
        let fi = b.int("iceCreamColor")
        if fi != flavorIndex, colors.indices.contains(fi) {
            flavorIndex = fi
            flavorLabel.setText("MATCH THE \(colors[fi].name.uppercased()) CUP")
            flavorDot.fillColor = colors[fi].color
            flavorDot.position = CGPoint(x: flavorLabel.position.x - flavorLabel.frame.width / 2 - 10 * u, y: flavorLabel.position.y)
            scoopNode.removeAllChildren()
            let s = Self.scoop(width: sq(8), color: colors[fi].color)
            scoopNode.addChild(s)
        }
        let left = b.int("throwsLeft")
        throwsLabel.setText("PULL BACK & LAUNCH — \(left) \(left == 1 ? "THROW" : "THROWS") LEFT")
        let anchor = C.object("BONUS_LAUNCH_ANCHOR")!
        let st = b.string("scoopState") ?? "ready"
        let x = st == "aiming" ? anchor.double("x") + b.double("aimDX") : b.double("scoopX")
        let y = st == "aiming" ? anchor.double("y") + b.double("aimDY") : b.double("scoopY")
        scoopNode.position = sqPt(x, y)
        if st == "aiming" {
            let p = CGMutablePath()
            p.move(to: sqPt(anchor.double("x"), anchor.double("y")))
            p.addLine(to: scoopNode.position)
            aimLine.path = p.copy(dashingWithPhase: 0, lengths: [5 * u, 5 * u])
        } else {
            aimLine.path = nil
        }
        let result = st == "result" ? b.string("resultText") : nil
        showResult(result, good: result?.hasPrefix("HIT") ?? false)
    }

    override func control(_ f: Controls.Frame, dt: Double) {
        sling.control(engine, f, dt: dt, ready: state.string("scoopState") == "ready", maxPull: C.double("BONUS_MAX_PULL"))
    }
    override func touchBegan(_ p: CGPoint) {
        guard state.string("scoopState") == "ready", square.insetBy(dx: -20, dy: -20).contains(p) else { return }
        sling.begin(engine)
        touchMoved(p)
    }
    override func touchMoved(_ p: CGPoint) {
        guard sling.aiming else { return }
        let a = C.object("BONUS_LAUNCH_ANCHOR")!
        let q = sqPct(p)
        sling.move(engine, to: (q.0 - a.double("x"), q.1 - a.double("y")))
    }
    override func touchEnded(_ p: CGPoint) { sling.end(engine) }
}

// ------------------------------------------------------------ plate wash

/// PLATE WASH (PlatesLevel.jsx): plates ride three belts toward you; spray
/// the dirty ones (and the dollar ones), never a clean one.
final class PlatesBonus: BonusView {
    private let C: Snap
    private var plates: [Int: SKSpriteNode] = [:]
    private let secondsLabel: SKLabelNode
    private let jerk = SKSpriteNode(texture: Art.texture("jerk-back.png"))
    private var lanes: [String: (sx: Double, sy: Double, ex: Double, ey: Double)] = [:]
    private var laneOrder = ["left", "center", "right"]
    private var aimLane = 1
    private let reticle = SKShapeNode(circleOfRadius: 1)
    private var state = Snap([:])

    override init(engine: Engine, size: CGSize, safeTop: CGFloat) {
        C = engine.constants
        secondsLabel = Theme.label(" ", .display, 14, color: Theme.cream.withAlphaComponent(0.8), weight: 600, tracking: 0.1)
        super.init(engine: engine, size: size, safeTop: safeTop)
        header("PLATE WASH", [line("SPRAY THE DIRTY ONES — NEVER A CLEAN ONE"), secondsLabel])
        if let paths = C.object("PLATES_LANE_PATHS") {
            for lane in laneOrder {
                if let p = paths.object(lane) { lanes[lane] = (p.double("startX"), p.double("startY"), p.double("endX"), p.double("endY")) }
            }
        }
        // the belts, with a tread that runs toward you, and their mouths
        for lane in laneOrder {
            guard let p = lanes[lane] else { continue }
            let a = pt(p.sx, p.sy), b = pt(p.ex, p.ey)
            let path = CGMutablePath(); path.move(to: a); path.addLine(to: b)
            let belt = SKShapeNode(path: path)
            belt.strokeColor = SKColor(hex: 0x3A3D42); belt.lineWidth = 5 * u; belt.lineCap = .round
            addChild(belt)
            let tread = SKShapeNode()
            tread.strokeColor = SKColor(hex: 0x9AA2AA); tread.lineWidth = 2 * u
            var phase: CGFloat = 0
            tread.run(.repeatForever(.customAction(withDuration: 0.5) { node, t in
                phase = -t / 0.5 * 8 * self.u
                (node as? SKShapeNode)?.path = path.copy(dashingWithPhase: phase, lengths: [3 * self.u, 5 * self.u])
            }))
            addChild(tread)
            let mouth = SKShapeNode(rectOf: CGSize(width: 26 * u, height: 10 * u), cornerRadius: 2 * u)
            mouth.fillColor = Theme.ink; mouth.strokeColor = SKColor(hex: 0x3A3D42); mouth.lineWidth = 2 * u
            mouth.position = a
            addChild(mouth)
            for i in 0..<2 {
                let puff = SKShapeNode(ellipseOf: CGSize(width: 4 * u, height: 11 * u))
                puff.fillColor = SKColor(white: 1, alpha: 0.6); puff.strokeColor = .clear
                puff.position = CGPoint(x: a.x - 3 * u + CGFloat(i) * 10 * u, y: a.y + 10 * u)
                puff.alpha = 0
                let rise = SKAction.group([.moveBy(x: 0, y: 22 * u, duration: 2.6), .scaleX(to: 1.4, duration: 2.6),
                                           .sequence([.fadeAlpha(to: 0.5, duration: 0.5), .fadeAlpha(to: 0, duration: 2.1)])])
                let reset = SKAction.group([.moveBy(x: 0, y: -22 * u, duration: 0), .scaleX(to: 1, duration: 0)])
                puff.run(.sequence([.wait(forDuration: Double(lane.count) * 0.2 + Double(i) * 0.7), .repeatForever(.sequence([rise, reset]))]))
                addChild(puff)
            }
        }
        // the jerk from behind, spray bottle up
        jerk.size = jerk.texture!.size().fitting(height: size.height * 0.34)
        jerk.anchorPoint = CGPoint(x: 0.5, y: 0)
        jerk.position = CGPoint(x: arena.midX, y: 0)
        jerk.zPosition = 900
        addChild(jerk)
        #if os(tvOS)
        reticle.path = CGPath(ellipseIn: CGRect(x: -w(7), y: -w(7), width: w(14), height: w(14)), transform: nil)
        reticle.strokeColor = Theme.brassLight; reticle.lineWidth = 2 * u; reticle.glowWidth = 3 * u
        reticle.zPosition = 950
        addChild(reticle)
        #endif
    }
    required init?(coder: NSCoder) { fatalError() }

    private func layout(_ p: Snap) -> (CGPoint, CGFloat, CGFloat) {
        guard let l = lanes[p.string("lane") ?? "center"] else { return (.zero, 0, 0) }
        let t = min(p.double("progress"), 1)
        let x = l.sx + (l.ex - l.sx) * t, y = l.sy + (l.ey - l.sy) * t
        let scale = C.double("PLATES_START_SCALE") + (C.double("PLATES_END_SCALE") - C.double("PLATES_START_SCALE")) * t
        return (pt(x, y), w(C.double("PLATES_BASE_SIZE_PCT") * scale), CGFloat(t * 1000))
    }

    override func update(_ b: Snap, time: TimeInterval, dt: Double) {
        state = b
        secondsLabel.setText("\(max(0, Int(ceil(b.double("remainingMs") / 1000))))s")
        var seen = Set<Int>()
        for p in b.list("plates") {
            let id = p.int("id")
            seen.insert(id)
            let s = plates[id] ?? {
                let kind = p.string("kind") ?? "dirty"
                let n = SKSpriteNode(texture: Art.texture("\(kind)-plate.png"))
                n.name = "plate:\(id)"
                addChild(n)
                plates[id] = n
                return n
            }()
            let (pos, width, z) = layout(p)
            s.position = pos
            s.size = s.texture!.size().fitting(width: width)
            s.zPosition = z
        }
        for (id, s) in plates where !seen.contains(id) { s.removeFromParent(); plates[id] = nil }
        #if os(tvOS)
        if let l = lanes[laneOrder[aimLane]] {
            reticle.position = pt(l.sx + (l.ex - l.sx) * 0.72, l.sy + (l.ey - l.sy) * 0.72)
        }
        #endif
        let ended = b.bool("ended")
        let result = ended ? b.string("resultText") : nil
        showResult(result, good: result == "TIME'S UP!")
    }

    private func spray(_ plate: Snap) {
        let (pos, _, _) = layout(plate)
        if plate.string("kind") != "clean" {
            let pts = plate.string("kind") == "dollar" ? C.int("PLATES_DOLLAR_POINTS") : C.int("PLATES_DIRTY_POINTS")
            let pop = Theme.label("+\(pts)", .display, 20, color: Theme.brass, weight: 700)
            pop.position = pos; pop.zPosition = 1000; pop.setScale(0.7); pop.alpha = 0
            pop.run(.sequence([.group([.fadeIn(withDuration: 0.16), .scale(to: 1.1, duration: 0.16), .moveBy(x: 0, y: 6 * u, duration: 0.16)]),
                               .group([.fadeOut(withDuration: 0.64), .moveBy(x: 0, y: 28 * u, duration: 0.64)]), .removeFromParent()]))
            addChild(pop)
            let burst = SKSpriteNode(texture: Art.frames("spray-burst.png", count: 8)[0], size: CGSize(width: 108 * u, height: 108 * u))
            burst.position = pos; burst.zPosition = 1000
            burst.run(.sequence([.animate(with: Art.frames("spray-burst.png", count: 8), timePerFrame: 0.06), .removeFromParent()]))
            addChild(burst)
            // jerk-spray-pump (260ms)
            jerk.removeAction(forKey: "pump")
            jerk.run(.sequence([.group([.rotate(toAngle: 3 * .pi / 180, duration: 0.08), .scale(to: 1.05, duration: 0.08)]),
                                .group([.rotate(toAngle: -1.5 * .pi / 180, duration: 0.08), .scale(to: 0.98, duration: 0.08)]),
                                .group([.rotate(toAngle: 0, duration: 0.1), .scale(to: 1, duration: 0.1)])]), withKey: "pump")
        }
        engine.call("plateClick", plate.int("id"))
    }

    override func touchBegan(_ p: CGPoint) {
        guard !state.bool("ended") else { return }
        let hits = state.list("plates").filter { plate in
            let (pos, width, _) = layout(plate)
            return hypot(p.x - pos.x, p.y - pos.y) <= width / 2 + 8 * u
        }
        if let front = hits.max(by: { $0.double("progress") < $1.double("progress") }) { spray(front) }
    }

    override func control(_ f: Controls.Frame, dt: Double) {
        if f.navLeft { aimLane = max(0, aimLane - 1) }
        if f.navRight { aimLane = min(2, aimLane + 1) }
        if f.laneStep != 0 { aimLane = 1 }
        if f.pourOrange && !state.bool("ended") {
            let lane = laneOrder[aimLane]
            if let front = state.list("plates").filter({ $0.string("lane") == lane }).max(by: { $0.double("progress") < $1.double("progress") }) {
                spray(front)
            }
        }
    }
}

// ------------------------------------------------------------ shaker shuffle

/// SHAKER SHUFFLE (ShakerLevel.jsx): three belts of cups scrolling past;
/// throw the scoop into a cup of the flavour's colour — the far row pays most.
final class ShakerBonus: BonusView {
    private let C: Snap
    private var cupNodes: [String: SKSpriteNode] = [:] // the engine's cup ids are strings ("top-0")
    private var rows: [String: Snap] = [:]
    private let scoopNode = SKNode()
    private let aimLine = SKShapeNode()
    private let jerk = SKSpriteNode(texture: Art.texture("jerk-throw.png"))
    private let flavorLabel: SKLabelNode
    private let throwsLabel: SKLabelNode
    private let flavorDot = SKShapeNode(circleOfRadius: 5)
    private let sling = Slingshot(prefix: "shaker")
    private var flavorIndex = -1
    private var lastState = ""
    private var state = Snap([:])

    override init(engine: Engine, size: CGSize, safeTop: CGFloat) {
        C = engine.constants
        flavorLabel = Theme.label(" ", .body, 11, color: Theme.cream.withAlphaComponent(0.8), tracking: 0.2)
        throwsLabel = Theme.label(" ", .display, 14, color: Theme.cream.withAlphaComponent(0.8), weight: 600, tracking: 0.1)
        super.init(engine: engine, size: size, safeTop: safeTop)
        header("SHAKER SHUFFLE", [flavorLabel, line("FAR ROW WORTH MORE — PULL BACK & LAUNCH"), throwsLabel])
        flavorDot.strokeColor = SKColor(white: 1, alpha: 0.5); flavorDot.lineWidth = 1; flavorDot.zPosition = 50
        addChild(flavorDot)
        // the scrolling shelves under each row
        let track = Art.texture("shaker-track.png")
        for row in C.list("SHAKER_ROWS") {
            rows[row.string("lane") ?? ""] = row
            let scale = row.double("scale")
            let tileW = 128 * CGFloat(scale) * u, h = 10 * CGFloat(scale) * u
            let shelf = SKNode()
            let n = Int(arena.width / tileW) + 3
            for i in 0..<n {
                let t = SKSpriteNode(texture: track, size: CGSize(width: tileW, height: h))
                t.position = CGPoint(x: arena.minX + (CGFloat(i) - 1) * tileW + tileW / 2, y: 0)
                shelf.addChild(t)
            }
            shelf.position = CGPoint(x: 0, y: pt(0, row.double("y") + 9 * scale).y - h / 2)
            let dir: CGFloat = row.double("dir") < 0 ? 1 : -1
            let dur = 2 * scale
            shelf.run(.repeatForever(.sequence([.moveBy(x: dir * tileW, y: 0, duration: dur), .moveBy(x: -dir * tileW, y: 0, duration: 0)])))
            let crop = SKCropNode()
            let mask = SKSpriteNode(color: .white, size: CGSize(width: arena.width, height: h * 2))
            mask.position = CGPoint(x: arena.midX, y: shelf.position.y)
            crop.maskNode = mask
            crop.addChild(shelf)
            addChild(crop)
        }
        let anchor = C.object("SHAKER_LAUNCH_ANCHOR")!
        let mark = SKShapeNode(circleOfRadius: w(1.5))
        mark.fillColor = Theme.brass.withAlphaComponent(0.35); mark.strokeColor = .clear
        mark.position = pt(anchor.double("x"), anchor.double("y"))
        addChild(mark)
        // the jerk from behind, his raised hand on the launch anchor
        let jw = w(30)
        jerk.size = CGSize(width: jw, height: jw * jerk.texture!.size().height / max(1, jerk.texture!.size().width))
        jerk.anchorPoint = CGPoint(x: 0.208, y: 1 - 0.197)
        jerk.position = mark.position
        jerk.zPosition = 900
        addChild(jerk)
        aimLine.strokeColor = Theme.brass.withAlphaComponent(0.7); aimLine.lineWidth = 2 * u; aimLine.zPosition = 940
        addChild(aimLine)
        scoopNode.zPosition = 950
        addChild(scoopNode)
    }
    required init?(coder: NSCoder) { fatalError() }

    override func update(_ b: Snap, time: TimeInterval, dt: Double) {
        state = b
        let colors = Self.cupColors(C)
        var seen = Set<String>()
        for cup in b.list("cups") {
            let id = "\(cup.raw["id"] ?? "")"
            seen.insert(id)
            let row = rows[cup.string("lane") ?? ""]
            let s = cupNodes[id] ?? {
                let ci = cup.int("color")
                let n = Self.tinted("bonus-cup.png", color: colors.indices.contains(ci) ? colors[ci].color : .white)
                n.zPosition = CGFloat(row?.double("scale") ?? 1) * 10
                addChild(n)
                cupNodes[id] = n
                return n
            }()
            let width = w(cup.double("size"))
            s.size = CGSize(width: width, height: width * 734 / 509)
            s.position = pt(cup.double("x"), row?.double("y") ?? 50)
        }
        for (id, s) in cupNodes where !seen.contains(id) { s.removeFromParent(); cupNodes[id] = nil }

        let fi = b.int("iceCreamColor")
        if fi != flavorIndex, colors.indices.contains(fi) {
            flavorIndex = fi
            flavorLabel.setText("MATCH THE \(colors[fi].name.uppercased()) CUP")
            flavorDot.fillColor = colors[fi].color
            flavorDot.position = CGPoint(x: flavorLabel.position.x - flavorLabel.frame.width / 2 - 10 * u, y: flavorLabel.position.y)
            scoopNode.removeAllChildren()
            scoopNode.addChild(Self.scoop(width: w(8), color: colors[fi].color))
        }
        let left = b.int("throwsLeft")
        throwsLabel.setText("\(left) \(left == 1 ? "THROW" : "THROWS") LEFT")
        let anchor = C.object("SHAKER_LAUNCH_ANCHOR")!
        let st = b.string("scoopState") ?? "ready"
        let x = st == "aiming" ? anchor.double("x") + b.double("aimDX") : b.double("scoopX")
        let y = st == "aiming" ? anchor.double("y") + b.double("aimDY") : b.double("scoopY")
        scoopNode.position = pt(x, y)
        if st == "aiming" {
            let p = CGMutablePath(); p.move(to: pt(anchor.double("x"), anchor.double("y"))); p.addLine(to: scoopNode.position)
            aimLine.path = p.copy(dashingWithPhase: 0, lengths: [5 * u, 5 * u])
        } else { aimLine.path = nil }
        // jerk-throw-snap as the scoop leaves his hand (480ms)
        if st == "flying" && lastState != "flying" {
            let deg = CGFloat.pi / 180
            let snap: [SKAction] = [
                .rotate(toAngle: -7 * deg, duration: 0.086), .rotate(toAngle: 11 * deg, duration: 0.134),
                .rotate(toAngle: -3 * deg, duration: 0.125), .rotate(toAngle: 0, duration: 0.135),
            ]
            jerk.run(.sequence(snap))
        }
        lastState = st
        let showing = b.double("resultHoldMs") > 0 ? b.string("resultText") : nil
        showResult(showing, sub: b.string("resultSubtext"), good: b.string("resultKind") == "hit")
    }

    override func control(_ f: Controls.Frame, dt: Double) {
        sling.control(engine, f, dt: dt, ready: state.string("scoopState") == "ready", maxPull: C.double("SHAKER_MAX_PULL"))
    }
    override func touchBegan(_ p: CGPoint) {
        guard state.string("scoopState") == "ready" else { return }
        sling.begin(engine)
        touchMoved(p)
    }
    override func touchMoved(_ p: CGPoint) {
        guard sling.aiming else { return }
        let a = C.object("SHAKER_LAUNCH_ANCHOR")!
        let q = pct(p)
        sling.move(engine, to: (q.x - a.double("x"), q.y - a.double("y")))
    }
    override func touchEnded(_ p: CGPoint) { sling.end(engine) }
}

// ------------------------------------------------------------ glass slide

/// GLASS SLIDE (SlideLevel.jsx): three bars running away from you, patrons
/// coming down them; flick a glass up a bar to serve — never up an empty one.
final class SlideBonus: BonusView {
    private let C: Snap
    private var bars: [String: (nx: Double, ny: Double, fx: Double, fy: Double)] = [:]
    private let order = ["top", "middle", "bottom"]
    private var patronNodes: [Int: SKSpriteNode] = [:]
    private var glassNodes: [Int: SKSpriteNode] = [:]
    private let servedLabel: SKLabelNode
    private let aimLine = SKShapeNode()
    private var drag: (lane: String, from: CGPoint)?
    private var aimLane = 1
    private var charge: Double?
    private var state = Snap([:])
    private let drinkIcons: [String]
    private var highlight: [String: SKShapeNode] = [:]

    override init(engine: Engine, size: CGSize, safeTop: CGFloat) {
        C = engine.constants
        drinkIcons = C.list("DRINK_TYPES").map { $0.string("icon") ?? "drink-orange.png" }
        servedLabel = Theme.label(" ", .display, 14, color: Theme.cream.withAlphaComponent(0.8), weight: 600, tracking: 0.1)
        super.init(engine: engine, size: size, safeTop: safeTop)
        #if os(tvOS)
        let how = "PICK A BAR, HOLD A TO WIND UP, LET GO — NEVER AN EMPTY ONE"
        #else
        let how = "SWIPE UP A BAR — NEVER AN EMPTY ONE"
        #endif
        header("GLASS SLIDE", [line(how), servedLabel])
        for bar in C.list("SLIDE_BARS") {
            guard let n = bar.object("near"), let f = bar.object("far") else { continue }
            let lane = bar.string("lane") ?? ""
            bars[lane] = (n.double("x"), n.double("y"), f.double("x"), f.double("y"))
            // tapered counters running away from you
            let a = pt(n.double("x"), n.double("y")), b = pt(f.double("x"), f.double("y"))
            for (w0, w1, color, alpha) in [(11.0, 3.0, 0x6B5334, 1.0), (11 * 0.45, 3 * 0.45, 0x8A6E44, 0.85)] as [(Double, Double, UInt32, Double)] {
                let p = CGMutablePath()
                p.move(to: CGPoint(x: a.x - w(w0) / 2, y: a.y)); p.addLine(to: CGPoint(x: a.x + w(w0) / 2, y: a.y))
                p.addLine(to: CGPoint(x: b.x + w(w1) / 2, y: b.y)); p.addLine(to: CGPoint(x: b.x - w(w1) / 2, y: b.y)); p.closeSubpath()
                let q = SKShapeNode(path: p)
                q.fillColor = SKColor(hex: color); q.strokeColor = .clear; q.alpha = CGFloat(alpha)
                addChild(q)
                if alpha == 1 {
                    let hl = SKShapeNode(path: p)
                    hl.strokeColor = Theme.brassLight; hl.lineWidth = 2 * u; hl.fillColor = .clear; hl.isHidden = true
                    addChild(hl)
                    highlight[lane] = hl
                }
            }
        }
        aimLine.strokeColor = SKColor(hex: 0xE8C878, alpha: 0.85); aimLine.lineWidth = 5 * u; aimLine.lineCap = .round; aimLine.zPosition = 30
        addChild(aimLine)
    }
    required init?(coder: NSCoder) { fatalError() }

    private func at(_ lane: String, _ t: Double) -> CGPoint {
        guard let b = bars[lane] else { return .zero }
        return pt(b.nx + (b.fx - b.nx) * t, b.ny + (b.fy - b.ny) * t)
    }

    override func update(_ b: Snap, time: TimeInterval, dt: Double) {
        state = b
        servedLabel.setText("\(b.int("served")) SERVED")
        var seen = Set<Int>()
        for p in b.list("patrons") {
            let id = p.int("id"); seen.insert(id)
            let s = patronNodes[id] ?? {
                let n = SKSpriteNode(texture: Art.texture(Art.patronPortrait(p.int("patronType"), p.int("drinkType"))))
                n.anchorPoint = CGPoint(x: 0.5, y: 0.12)
                n.xScale = -1
                addChild(n)
                patronNodes[id] = n
                return n
            }()
            let t = max(0, p.double("t"))
            let h = arena.height * CGFloat(13 - 6 * t) / 100
            s.size = CGSize(width: -abs(s.texture!.size().fitting(height: h).width), height: h)
            s.position = at(p.string("lane") ?? "", t)
            s.zPosition = 10 + CGFloat(1 - t) * 5
        }
        for (id, s) in patronNodes where !seen.contains(id) { s.removeFromParent(); patronNodes[id] = nil }
        seen = []
        for g in b.list("glasses") {
            let id = g.int("id"); seen.insert(id)
            let s = glassNodes[id] ?? {
                let i = g.int("drinkType")
                let n = SKSpriteNode(texture: Art.texture(drinkIcons.indices.contains(i) ? drinkIcons[i] : "drink-orange.png"))
                n.anchorPoint = CGPoint(x: 0.5, y: 0.28)
                n.zPosition = 20
                addChild(n)
                glassNodes[id] = n
                return n
            }()
            let t = g.double("t")
            let width = w(C.double("SLIDE_GLASS_NEAR_PCT") + (C.double("SLIDE_GLASS_FAR_PCT") - C.double("SLIDE_GLASS_NEAR_PCT")) * min(t, 1))
            s.size = s.texture!.size().fitting(width: width)
            s.position = at(g.string("lane") ?? "", min(t, 1.06))
        }
        for (id, s) in glassNodes where !seen.contains(id) { s.removeFromParent(); glassNodes[id] = nil }

        // how hard the current flick is, drawn up the bar
        var amount: Double? = nil, lane = ""
        if let d = drag { lane = d.lane; amount = lastDragAmount }
        if let c = charge { lane = order[aimLane]; amount = c }
        if let amount, amount > 0 {
            let lo = C.double("SLIDE_MIN_FLICK"), hi = C.double("SLIDE_MAX_FLICK")
            let n = min(1, max(0, (amount - lo) / (hi - lo)))
            let path = CGMutablePath(); path.move(to: at(lane, 0)); path.addLine(to: at(lane, n))
            aimLine.path = path
        } else { aimLine.path = nil }
        #if os(tvOS)
        for (l, hl) in highlight { hl.isHidden = l != order[aimLane] }
        #endif
        let result = b.bool("ended") ? b.string("resultText") : nil
        showResult(result, good: false)
    }

    private var lastDragAmount: Double = 0

    private func flickAlong(_ lane: String, from: CGPoint, to: CGPoint) -> Double {
        guard let b = bars[lane] else { return 0 }
        let f = pct(from), t = pct(to)
        let bx = b.fx - b.nx, by = b.fy - b.ny
        let len = (bx * bx + by * by).squareRoot()
        return (((t.x - f.x) * bx + (t.y - f.y) * by) / len) / 100
    }

    override func touchBegan(_ p: CGPoint) {
        guard !state.bool("ended") else { return }
        // the near end of each bar is the grab handle (34% x 17%)
        for lane in order {
            let h = at(lane, 0.1)
            if abs(p.x - h.x) <= w(17) && abs(p.y - h.y) <= arena.height * 0.085 { drag = (lane, p); lastDragAmount = 0; return }
        }
    }
    override func touchMoved(_ p: CGPoint) {
        guard let d = drag else { return }
        lastDragAmount = max(0, flickAlong(d.lane, from: d.from, to: p))
    }
    override func touchEnded(_ p: CGPoint) {
        guard let d = drag else { return }
        drag = nil
        let amount = flickAlong(d.lane, from: d.from, to: p)
        lastDragAmount = 0
        if amount > 0 { engine.call("slideFlick", d.lane, amount) }
    }

    override func control(_ f: Controls.Frame, dt: Double) {
        if f.laneStep < 0 { aimLane = max(0, aimLane - 1) }
        if f.laneStep > 0 { aimLane = min(2, aimLane + 1) }
        guard !state.bool("ended") else { charge = nil; return }
        let lo = C.double("SLIDE_MIN_FLICK"), hi = C.double("SLIDE_MAX_FLICK")
        if f.aHeld {
            // winding up: from the gentlest real flick to the hardest in 0.7s
            charge = min(hi, (charge ?? lo) + (hi - lo) / 0.7 * dt)
        } else if let c = charge {
            charge = nil
            engine.call("slideFlick", order[aimLane], c)
        }
    }
}

// ------------------------------------------------------------ the rounds

/// THE ROUNDS (TempestLevel.jsx): eight spokes from a hub, patrons climbing
/// out toward the rim; run round the rim and he serves down whichever spoke
/// he's on.
final class TempestBonus: BonusView {
    private let C: Snap
    private let spokes: Int
    private let center: (x: Double, y: Double)
    private let rx: Double, ry: Double
    private var spokeNodes: [(outer: SKShapeNode, inner: SKShapeNode)] = []
    private var patronNodes: [Int: SKSpriteNode] = [:]
    private var glassNodes: [Int: SKSpriteNode] = [:]
    private let jerk = SKSpriteNode(texture: Art.texture("player-stand.png"))
    private let servedLabel: SKLabelNode
    private var dragging = false
    private var state = Snap([:])
    private let drinkIcons: [String]

    override init(engine: Engine, size: CGSize, safeTop: CGFloat) {
        C = engine.constants
        spokes = max(1, C.int("TEMPEST_SPOKES"))
        let c = C.object("TEMPEST_CENTER")
        center = (c?.double("x") ?? 50, c?.double("y") ?? 58)
        rx = C.double("TEMPEST_RADIUS_X"); ry = C.double("TEMPEST_RADIUS_Y")
        drinkIcons = C.list("DRINK_TYPES").map { $0.string("icon") ?? "drink-orange.png" }
        servedLabel = Theme.label(" ", .display, 14, color: Theme.cream.withAlphaComponent(0.8), weight: 600, tracking: 0.1)
        super.init(engine: engine, size: size, safeTop: safeTop)
        #if os(tvOS)
        let how = "LEFT AND RIGHT RUN ROUND THE RIM — KEEP THEM OFF IT"
        #else
        let how = "DRAG AROUND THE RIM — KEEP THEM OFF IT"
        #endif
        header("THE ROUNDS", [line(how), servedLabel])
        // the rim he runs round
        let rim = SKShapeNode(ellipseOf: CGSize(width: w(rx * 2), height: arena.height * CGFloat(ry * 2) / 100))
        rim.position = pt(center.x, center.y)
        rim.strokeColor = SKColor(hex: 0x3A2E23); rim.lineWidth = 6 * u; rim.fillColor = .clear
        addChild(rim)
        for i in 0..<spokes {
            let hub = point(Double(i), 0), r = point(Double(i), 1)
            let nx = -(r.y - hub.y), ny = r.x - hub.x
            let len = max(1, hypot(nx, ny))
            let ux = nx / len, uy = ny / len
            func quad(_ a: CGFloat, _ b: CGFloat) -> CGPath {
                let p = CGMutablePath()
                p.move(to: CGPoint(x: hub.x - ux * a, y: hub.y - uy * a)); p.addLine(to: CGPoint(x: hub.x + ux * a, y: hub.y + uy * a))
                p.addLine(to: CGPoint(x: r.x + ux * b, y: r.y + uy * b)); p.addLine(to: CGPoint(x: r.x - ux * b, y: r.y - uy * b)); p.closeSubpath()
                return p
            }
            let outer = SKShapeNode(path: quad(w(0.9), w(3.4))), inner = SKShapeNode(path: quad(w(0.36), w(1.36)))
            outer.strokeColor = .clear; inner.strokeColor = .clear; inner.alpha = 0.9
            addChild(outer); addChild(inner)
            spokeNodes.append((outer, inner))
        }
        jerk.size = jerk.texture!.size().fitting(height: arena.height * 0.13)
        jerk.anchorPoint = CGPoint(x: 0.5, y: 0.3)
        jerk.zPosition = 30
        addChild(jerk)
    }
    required init?(coder: NSCoder) { fatalError() }

    private func point(_ spoke: Double, _ t: Double) -> CGPoint {
        let a = spoke / Double(spokes) * 2 * .pi - .pi / 2
        return pt(center.x + cos(a) * rx * t, center.y + sin(a) * ry * t)
    }

    override func update(_ b: Snap, time: TimeInterval, dt: Double) {
        state = b
        servedLabel.setText("\(b.int("served")) SERVED")
        let live = Int(b.double("spoke").rounded()) % spokes
        for (i, n) in spokeNodes.enumerated() {
            n.outer.fillColor = SKColor(hex: i == live ? 0x8A6E44 : 0x5A472F)
            n.inner.fillColor = SKColor(hex: i == live ? 0xC6A15B : 0x6B5334)
        }
        var seen = Set<Int>()
        for p in b.list("patrons") {
            let id = p.int("id"); seen.insert(id)
            let s = patronNodes[id] ?? {
                let n = SKSpriteNode(texture: Art.texture(Art.patronPortrait(p.int("patronType"), p.int("drinkType"))))
                n.anchorPoint = CGPoint(x: 0.5, y: 0.3)
                n.zPosition = 10
                addChild(n)
                patronNodes[id] = n
                return n
            }()
            let t = p.double("t")
            s.size = s.texture!.size().fitting(height: arena.height * CGFloat(5 + 7 * t) / 100)
            s.position = point(p.double("spoke"), t)
        }
        for (id, s) in patronNodes where !seen.contains(id) { s.removeFromParent(); patronNodes[id] = nil }
        seen = []
        for g in b.list("glasses") {
            let id = g.int("id"); seen.insert(id)
            let s = glassNodes[id] ?? {
                let i = g.int("drinkType")
                let n = SKSpriteNode(texture: Art.texture(drinkIcons.indices.contains(i) ? drinkIcons[i] : "drink-orange.png"))
                n.anchorPoint = CGPoint(x: 0.5, y: 0.4)
                n.zPosition = 20
                addChild(n)
                glassNodes[id] = n
                return n
            }()
            let t = g.double("t")
            s.size = s.texture!.size().fitting(width: w(3 + 4 * t))
            s.position = point(g.double("spoke"), t)
        }
        for (id, s) in glassNodes where !seen.contains(id) { s.removeFromParent(); glassNodes[id] = nil }
        jerk.position = point(b.double("spoke"), 1.12)
        let result = b.bool("ended") ? b.string("resultText") : nil
        showResult(result, good: b.string("resultKind") != "breach")
    }

    private func spoke(at p: CGPoint) -> Int? {
        let q = pct(p)
        let nx = (q.x - center.x) / rx, ny = (q.y - center.y) / ry
        if (nx * nx + ny * ny).squareRoot() < 0.12 { return nil }
        let a = atan2(ny, nx) + .pi / 2
        let s = a / (2 * .pi) * Double(spokes)
        return ((Int(s.rounded()) % spokes) + spokes) % spokes
    }

    override func touchBegan(_ p: CGPoint) {
        guard !state.bool("ended") else { return }
        dragging = true
        if let s = spoke(at: p) { engine.call("tempestMoveTo", s) }
    }
    override func touchMoved(_ p: CGPoint) {
        guard dragging, !state.bool("ended"), let s = spoke(at: p) else { return }
        engine.call("tempestMoveTo", s)
    }
    override func touchEnded(_ p: CGPoint) { dragging = false }

    override func control(_ f: Controls.Frame, dt: Double) {
        guard !state.bool("ended") else { return }
        let target = state.isNull("targetSpoke") ? Int(state.double("spoke").rounded()) : state.int("targetSpoke")
        // the stick points straight at a spoke; left/right step round the rim
        if abs(f.stickX) > 0.6 || abs(f.stickY) > 0.6 {
            let a = atan2(Double(-f.stickY) * ry / rx, Double(f.stickX)) + .pi / 2
            let s = Int((a / (2 * .pi) * Double(spokes)).rounded())
            engine.call("tempestMoveTo", ((s % spokes) + spokes) % spokes)
        } else if f.navLeft {
            engine.call("tempestMoveTo", target - 1)
        } else if f.navRight {
            engine.call("tempestMoveTo", target + 1)
        }
    }
}
