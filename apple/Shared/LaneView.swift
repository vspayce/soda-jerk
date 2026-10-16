import SpriteKit

/// One bar (Lane.jsx, Customer.jsx, Player.jsx): its counter, door, fountain
/// (and Pop's stools), plus whoever and whatever is on it, redrawn from the
/// engine every frame. Positions are the engine's lane percentages. A
/// flipped bar is the same bar mirrored — the whole node, patrons and jerk
/// included — exactly as the web game does it. Sizes are the web's px at a
/// 144px lane, as fractions of this lane's height.
final class LaneView {
    /// Sprite names the touch controls look for (GameScene).
    static let glassName = "glass:"
    static let hotdogName = "hotdog"

    let node = SKNode()
    let index: Int
    private let L: Layout
    private let C: Snap
    private let playerX: Double
    private let doorX: Double
    private let stepEase: Double
    private let showTurnMs: Double
    private let glassFallMs: Double
    private let drinkIcons: [String]
    private let patronArt: [Snap]
    private let engine: Engine

    private let player = SKSpriteNode()
    private let hotdog = SKNode()
    private var patrons: [Int: PatronSprite] = [:]
    private var mugs: [Int: SKSpriteNode] = [:]
    private var glasses: [Int: GlassSprite] = [:]
    private var leaves: [SKSpriteNode] = []
    private var doorSwingStart: TimeInterval?
    private var enteringCount = 0
    private var trick: TrickView?

    init(index: Int, venue: String, reversed: Bool, layout: Layout, engine: Engine) {
        self.index = index
        self.engine = engine
        L = layout
        C = engine.constants
        playerX = C.double("PLAYER_X")
        doorX = C.double("DOOR_X")
        stepEase = C.double("STEP_EASE")
        showTurnMs = C.double("SHOW_TURN_MS") > 0 ? C.double("SHOW_TURN_MS") : 400
        glassFallMs = C.double("GLASS_FALL_HOLD_MS") > 0 ? C.double("GLASS_FALL_HOLD_MS") : 700
        drinkIcons = C.list("DRINK_TYPES").map { $0.string("icon") ?? "drink-orange.png" }
        patronArt = engine.patronArt

        node.position = CGPoint(x: reversed ? L.x0 + L.laneW : L.x0, y: L.laneCenters[index])
        node.xScale = reversed ? -1 : 1
        buildFixtures(venue: venue)

        player.anchorPoint = CGPoint(x: 0.5, y: 0)
        player.zPosition = 20
        node.addChild(player)

        // the hot dog: a steady tap target with the pulse on the picture
        let dog = SKSpriteNode(texture: Art.texture("hotdog.png"))
        dog.size = dog.texture!.size().fitting(height: L.laneH * 13 / 144)
        dog.name = Self.hotdogName
        let glow = Glow.node(diameter: L.laneH * 0.32)
        glow.zPosition = -1
        dog.addChild(glow)
        dog.run(.repeatForever(Self.pulse))
        let hit = SKSpriteNode(color: .clear, size: CGSize(width: dog.size.width + L.laneH * 28 / 144, height: L.laneH * 0.4))
        hit.name = Self.hotdogName
        hotdog.addChild(hit)
        hotdog.addChild(dog)
        hotdog.zPosition = 22
        node.addChild(hotdog)
    }

    /// glass-pulse / glass-return: a slow swell, 0.7s round
    static let pulse = SKAction.sequence([
        .scale(to: 1.12, duration: 0.35), .scale(to: 1, duration: 0.35),
    ])

    // ------------------------------------------------------------ fixtures

    private static let fixtures: [String: (counter: String, door: String, stool: String?)] = [
        "speakeasy": ("bar-counter.png", "saloon-door", nil),
        "fountain": ("counter-fountain.png", "door-fountain", "stool-fountain.png"),
        "circus": ("counter-circus.png", "door-circus", nil),
    ]
    // One fountain machine per bar, as in Lane.jsx.
    private static let fountains: [(file: String, dx: Double, h: CGFloat)] = [
        ("fountain.png", -3, 72), ("fountain2.png", -6, 93.6), ("fountain3.png", -6, 93.6), ("fountain4.png", -6, 93.6),
    ]

    private func buildFixtures(venue: String) {
        let f = Self.fixtures[venue] ?? Self.fixtures["speakeasy"]!

        // the aisle under the counter, so each bar reads as its own row
        let aisle = SKSpriteNode(color: .black, size: CGSize(width: L.laneW, height: L.laneH * 36 / 144))
        aisle.alpha = 0.25
        aisle.position = CGPoint(x: L.laneW / 2, y: 0)
        node.addChild(aisle)

        // the counter's drop shadow (box-shadow 0 3px 6px)
        let shadow = SKSpriteNode(color: .black, size: CGSize(width: L.laneW, height: L.counterH))
        shadow.alpha = 0.45
        shadow.position = CGPoint(x: L.laneW / 2, y: -L.laneH * 3 / 144)
        node.addChild(shadow)

        // The counter art is shaped for a phone-width bar (about 8:1). A TV
        // bar is far wider, so it's laid as several counters end to end,
        // each cropped to fill its share the way the web's object-fit does.
        // Where two meet, the end posts are trimmed off so it reads as one
        // long counter rather than several in a row.
        let tex = Art.texture(f.counter)
        let a = tex.size().width / max(1, tex.size().height)
        let n = max(1, Int((L.laneW / L.counterH / 8.1).rounded()))
        let tileW = L.laneW / CGFloat(n)
        let ta = tileW / L.counterH
        let cover = ta > a
            ? CGRect(x: 0, y: (1 - a / ta) / 2, width: 1, height: a / ta)
            : CGRect(x: (1 - ta / a) / 2, y: 0, width: ta / a, height: 1)
        let post: CGFloat = 0.045 // of the art's width, each end
        for i in 0..<n {
            var r = cover
            if i > 0 { r.origin.x += post; r.size.width -= post }
            if i < n - 1 { r.size.width -= post }
            let tile = SKTexture(rect: r, in: tex)
            let s = SKSpriteNode(texture: tile, size: CGSize(width: tileW + 0.5, height: L.counterH))
            s.position = CGPoint(x: tileW * (CGFloat(i) + 0.5), y: 0)
            s.zPosition = 1
            node.addChild(s)
        }

        // Pop's stools, behind whoever walks past them
        if let stool = f.stool {
            for pct in [30.0, 47, 64, 81] {
                let s = SKSpriteNode(texture: Art.texture(stool))
                s.size = s.texture!.size().fitting(height: L.laneH * 30 / 144)
                s.anchorPoint = CGPoint(x: 0.5, y: 0)
                s.position = CGPoint(x: L.x(pct), y: L.feetY)
                s.zPosition = 2
                node.addChild(s)
            }
        }

        // the door patrons come in by: two leaves, each hinged on its own
        // outer post, so they can swing (see swingDoors)
        let doorH = L.laneH * 55 / 144
        let leafW = doorH * 410 / 898
        for (side, hingeX) in [("left", -leafW), ("right", leafW)] {
            let leaf = SKSpriteNode(texture: Art.texture("\(f.door)-\(side).png"), size: CGSize(width: leafW, height: doorH))
            leaf.anchorPoint = CGPoint(x: side == "left" ? 0 : 1, y: 0)
            leaf.position = CGPoint(x: L.x(doorX) + hingeX, y: L.feetY)
            leaf.zPosition = 3
            node.addChild(leaf)
            leaves.append(leaf)
        }

        // the fountain machine behind the jerk's spot
        let ft = Self.fountains[index % Self.fountains.count]
        let fountain = SKSpriteNode(texture: Art.texture(ft.file))
        fountain.size = fountain.texture!.size().fitting(height: L.laneH * ft.h / 144)
        fountain.anchorPoint = CGPoint(x: 0.5, y: 0)
        fountain.position = CGPoint(x: L.x(playerX + ft.dx), y: L.feetY)
        fountain.zPosition = 3
        node.addChild(fountain)
    }

    // ------------------------------------------------------------ per frame

    func update(state s: Snap, engine: Engine, time: TimeInterval, spraying: Bool = false) {
        let frozen = s.bool("paused") || s.bool("awaitingContinue") || s.bool("awaitingStageAdvance") || s.bool("gameOver")
        let customers = s.list("customers").filter { $0.int("lane") == index }
        drawTrick(s, time: time)
        drawPlayer(s, time: time)
        drawSpray(s, time: time, on: spraying && s.int("playerLane") == index)
        drawPatrons(customers, time: time, frozen: frozen)
        swingDoors(customers, time: time)
        sync(&mugs, items: s.list("mugs").filter { $0.int("lane") == index }) { m, sprite in
            let icon = drinkIcons.indices.contains(m.int("drinkType")) ? drinkIcons[m.int("drinkType")] : "drink-orange.png"
            if sprite.texture == nil || sprite.name != icon {
                sprite.texture = Art.texture(icon); sprite.name = icon
                sprite.size = sprite.texture!.size().fitting(height: L.laneH * 27 / 144)
                sprite.zPosition = 15
            }
            sprite.position = CGPoint(x: L.x(m.double("x")), y: L.surfaceY)
        }
        var seenGlasses = Set<Int>()
        for g in s.list("glasses") where g.int("lane") == index {
            let id = g.int("id")
            seenGlasses.insert(id)
            let sprite = glasses[id] ?? {
                let gs = GlassSprite(height: L.laneH * 44 / 144, hit: L.laneH * 24 / 144, name: Self.glassName + "\(id)")
                gs.zPosition = 21
                node.addChild(gs)
                glasses[id] = gs
                return gs
            }()
            sprite.position = CGPoint(x: L.x(g.double("x")), y: L.surfaceY)
            if g.bool("_missed") {
                sprite.fall(progress: 1 - g.double("fallMs") / glassFallMs, laneH: L.laneH)
            }
        }
        for (id, sprite) in glasses where !seenGlasses.contains(id) { sprite.removeFromParent(); glasses[id] = nil }
        if let b = s.object("bonus"), b.int("lane") == index {
            hotdog.isHidden = false
            hotdog.position = CGPoint(x: L.x(b.double("x")), y: L.surfaceY)
        } else {
            hotdog.isHidden = true
        }
    }

    // LEVEL PASSED: he does his trick where he stands (LevelPassTrick.jsx)
    private func drawTrick(_ s: Snap, time: TimeInterval) {
        let on = s.bool("awaitingStageAdvance") && s.int("playerLane") == index
        if !on {
            trick?.removeFromParent(); trick = nil
            return
        }
        if trick == nil, let def = engine.value("trickForClear", s.int("clearCount")) as? [String: Any],
           let t = TrickView(trick: def, height: L.jerkH, throwDelayMs: C.double("TRICK_THROW_DELAY_MS")) {
            t.position = CGPoint(x: L.x(s.double("playerX")), y: L.feetY)
            t.zPosition = 30
            node.addChild(t)
            trick = t
        }
        trick?.update(time: time)
    }

    private var throwStarted: TimeInterval?

    private func drawPlayer(_ s: Snap, time: TimeInterval) {
        guard s.int("playerLane") == index, trick == nil else { player.isHidden = true; return }
        player.isHidden = false
        let moveDir = s.int("moveDir")
        let throwing = s.double("throwingMs") > 0
        let tex: SKTexture
        var aspect: CGFloat
        if moveDir != 0 && !throwing {
            // the 8-frame run, as fast as the web's jerk-run-cycle (360ms)
            let frames = Art.frames("player-run-cycle.png", count: 8)
            tex = frames[Int(time / 0.045) % 8]
            aspect = 249 / 358
        } else {
            tex = Art.texture(throwing ? "player-throw.png" : "player-stand.png")
            aspect = tex.size().width / max(1, tex.size().height)
        }
        player.texture = tex
        player.size = CGSize(width: L.jerkH * aspect, height: L.jerkH)
        // his art faces right; running left is the same art mirrored
        player.xScale = moveDir == -1 ? -1 : 1
        player.position = CGPoint(x: L.x(s.double("playerX")), y: L.feetY)
        // player-throw-pop: a quick lean into the throw and back (500ms)
        if throwing {
            let t0 = throwStarted ?? time
            throwStarted = t0
            let p = (time - t0) / 0.5 * 100
            player.zRotation = -CGFloat(Track([(0, 0), (30, -6), (100, 0)]).at(p)) * .pi / 180
            player.yScale = CGFloat(Track([(0, 1), (30, 1.04), (100, 1)]).at(p))
        } else {
            throwStarted = nil
            if sprayStarted == nil { player.zRotation = 0 }
            player.yScale = 1
        }
    }

    // The seltzer in the face (Player.jsx): the patron who reached the end
    // of the bar sprays him, an 8-frame jet beside him, while he flinches.
    private let spray = SKSpriteNode()
    private var sprayStarted: TimeInterval?

    private func drawSpray(_ s: Snap, time: TimeInterval, on: Bool) {
        if !on {
            sprayStarted = nil
            spray.isHidden = true
            return
        }
        let t0 = sprayStarted ?? time
        sprayStarted = t0
        let t = time - t0
        if spray.parent == nil {
            spray.anchorPoint = CGPoint(x: 0, y: 0)
            spray.zPosition = 21
            node.addChild(spray)
        }
        let type = s.int("lastSpillPatronType"), drink = s.int("lastSpillDrinkType")
        let file = type == 0 ? "spray-\(Art.drinkSuffix(drink)).png" : "spray-patron\(type + 1)-\(Art.drinkSuffix(drink)).png"
        let frames = Art.frames(file, count: 8)
        spray.texture = frames[Int(t / 0.055) % 8]
        let h = L.laneH * 97 / 144
        spray.size = CGSize(width: h * 390 / 279, height: h)
        spray.position = CGPoint(x: player.position.x + player.size.width / 2 - L.laneH * 10 / 144, y: L.feetY)
        spray.isHidden = false
        spray.alpha = CGFloat(Track([(0, 0), (12, 1), (85, 1), (100, 0)]).at(t / 1.1 * 100))
        // player-flinch (1100ms)
        let p = t / 1.1 * 100
        player.zRotation = -CGFloat(Track([(0, 0), (15, -7), (35, 5), (55, -4), (75, 2), (100, 0)]).at(p)) * .pi / 180
    }

    // ------------------------------------------------------------ patrons

    private func drawPatrons(_ list: [Snap], time: TimeInterval, frozen: Bool) {
        var seen = Set<Int>()
        for c in list {
            let status = c.string("status") ?? "walking"
            let x = c.double("x")
            // walking in from off-screen: hidden until they reach the door
            if status == "walking" && x > doorX { continue }
            let id = c.int("id")
            seen.insert(id)
            let p = patrons[id] ?? {
                let ps = PatronSprite(born: time)
                ps.zPosition = 10
                node.addChild(ps)
                patrons[id] = ps
                return ps
            }()
            p.note(status: status, time: time)
            let type = c.int("patronType"), drink = c.int("drinkType")
            let h = L.patronH
            let art = patronArt.indices.contains(type) ? patronArt[type] : Snap(["width": 200, "ground": 0.4])
            var rot: Double = 0      // degrees, CSS (clockwise)
            var dy: CGFloat = 0      // web px, CSS (down)
            var sx: CGFloat = 1, sy: CGFloat = 1
            let since = (time - p.statusSince) * 1000
            let turn = showTurnMs

            switch status {
            case "toasting", "leaving-happy", "drinking":
                p.set(Art.texture(Art.patronHeld(type, drink)), height: h)
                if status == "toasting" {
                    // patron-toast-lift: up with the glass and settle (620ms)
                    let q = since / 620 * 100
                    dy = CGFloat(Track([(0, 2), (35, -3), (100, 0)]).at(q))
                    let k = CGFloat(Track([(0, 0.99), (35, 1.02), (100, 1)]).at(q)); sx = k; sy = k
                }
                if status == "leaving-happy" { rot = 4 }  // rocked back on their heels
                if status == "drinking" {
                    // patron-sip: tipped back for a swallow, again and again (700ms)
                    let q = (time.truncatingRemainder(dividingBy: 0.7)) / 0.7 * 100
                    rot = Track([(0, 0), (35, 5), (60, 5), (100, 0)]).at(q)
                }
            case "watching":
                // turned round to watch the dachshund: a quick swing through
                // edge-on with a little hop, then bobbing along (patron-watch)
                p.set(Art.texture(Art.patronPortrait(type, drink)), height: h)
                let q = min(100, since / turn * 100)
                sx = CGFloat(Track([(0, 1), (50, 0.07), (100, -1)]).at(q))
                dy = CGFloat(Track([(0, 0), (50, -5), (100, 0)]).at(q))
                if q >= 100 { dy = -2 * CGFloat(0.5 - 0.5 * cos(time * 2 * .pi / 0.6)) }
            default:
                if p.turningBack(at: time, turnMs: turn) {
                    // coming out of the show: the same swing the other way
                    p.set(Art.texture(Art.patronPortrait(type, drink)), height: h)
                    let q = since / turn * 100
                    sx = CGFloat(Track([(0, -1), (50, 0.07), (100, 1)]).at(q))
                    dy = CGFloat(Track([(0, 0), (50, -5), (100, 0)]).at(q))
                    break
                }
                // Walking: the frame follows the ground covered, so the
                // planted foot stays put however the pace changes (as in
                // Customer.jsx's strideOf).
                let ground = max(0.05, art.double("ground"))
                let walkedPts = c.double("walked") / 100 * Double(L.laneW)
                let cycles = walkedPts / (ground * Double(h))
                let stride = cycles - floor(cycles)
                let frames = Art.frames(Art.patronWalk(type, drink), count: 8)
                p.set(frames[Int(stride * 8) % 8], height: h, width: h * CGFloat(art.double("width") / 279))
                // lean into the bar and rock with each step, by pace
                let speed = c.double("speed")
                let vel = frozen ? 0 : c.double("vel")
                let pace = speed > 0 ? min(1, vel / (speed / (1 - stepEase))) : 0
                rot = -3 * pace + 1.6 * sin(stride * 4 * .pi) * pace
                // stood between steps: one impatient rock toward the bar
                let pause = c.double("pauseMs"), total = c.double("pauseTotalMs")
                if !frozen && pause > 0 && total > 0 {
                    rot += Track([(0, 0), (45, -4), (70, -3), (100, 0)]).at((1 - pause / total) * 100)
                }
            }
            // customer-emerge: a quick pop as they first appear (260ms)
            let born = min(1, (time - p.born) / 0.26)
            p.alpha = CGFloat(born)
            let pop = CGFloat(0.7 + 0.3 * born)

            p.sprite.zRotation = -CGFloat(rot) * .pi / 180
            p.sprite.xScale = sx * pop
            p.sprite.yScale = sy * pop
            p.position = CGPoint(x: L.x(x), y: L.feetY - dy * L.laneH / 144)
            // the warning glow once a still-walking patron gets close
            p.setDanger(status == "walking" && x <= playerX + 22)
        }
        for (id, p) in patrons where !seen.contains(id) {
            p.removeFromParent()
            patrons[id] = nil
        }
    }

    // The door swings whenever a patron comes in through it (door-swing,
    // 700ms of damped swings, each leaf on its own hinge).
    private func swingDoors(_ list: [Snap], time: TimeInterval) {
        let entering = list.filter { $0.string("status") == "walking" && $0.double("x") <= doorX }.count
        if entering > enteringCount { doorSwingStart = time }
        enteringCount = entering
        guard let t0 = doorSwingStart else { return }
        let p = (time - t0) / 0.7 * 100
        let angle = Track([(0, 0), (20, 58), (45, -22), (65, 10), (85, -4), (100, 0)]).at(p)
        // a leaf turning about its hinge, seen face on, narrows as cos(angle)
        let k = CGFloat(max(0.08, abs(cos(angle * .pi / 180))))
        for leaf in leaves { leaf.xScale = k }
        if p >= 100 { doorSwingStart = nil; for leaf in leaves { leaf.xScale = 1 } }
    }

    /// Keeps one sprite per engine item (by id), adding and dropping them
    /// as items come and go.
    private func sync(_ pool: inout [Int: SKSpriteNode], items: [Snap], configure: (Snap, SKSpriteNode) -> Void) {
        var seen = Set<Int>()
        for item in items {
            let id = item.int("id")
            seen.insert(id)
            let sprite = pool[id] ?? {
                let s = SKSpriteNode()
                node.addChild(s)
                pool[id] = s
                return s
            }()
            configure(item, sprite)
        }
        for (id, sprite) in pool where !seen.contains(id) {
            sprite.removeFromParent()
            pool[id] = nil
        }
    }
}

/// A patron on the bar: their picture (anchored at the feet), a red halo
/// for the warning glow, and when their state last changed.
final class PatronSprite: SKNode {
    let sprite = SKSpriteNode()
    private let halo = SKSpriteNode()
    let born: TimeInterval
    private(set) var status = ""
    private(set) var statusSince: TimeInterval = 0
    private var previous = ""

    init(born: TimeInterval) {
        self.born = born
        super.init()
        sprite.anchorPoint = CGPoint(x: 0.5, y: 0)
        halo.anchorPoint = CGPoint(x: 0.5, y: 0)
        halo.color = SKColor(hex: 0x7A1F2B)
        halo.colorBlendFactor = 1
        halo.alpha = 0
        halo.zPosition = -1
        halo.setScale(1.08)
        sprite.addChild(halo)
        addChild(sprite)
    }
    required init?(coder: NSCoder) { fatalError() }

    func note(status s: String, time: TimeInterval) {
        guard s != status else { return }
        previous = status
        status = s
        statusSince = time
    }

    func turningBack(at time: TimeInterval, turnMs: Double) -> Bool {
        previous == "watching" && status == "walking" && (time - statusSince) * 1000 < turnMs
    }

    func set(_ tex: SKTexture, height h: CGFloat, width w: CGFloat? = nil) {
        if sprite.texture !== tex { sprite.texture = tex; halo.texture = tex }
        let size = w.map { CGSize(width: $0, height: h) } ?? tex.size().fitting(height: h)
        sprite.size = size
        halo.size = size
    }

    func setDanger(_ on: Bool) {
        let target: CGFloat = on ? 0.75 : 0
        if abs(halo.alpha - target) > 0.01 { halo.alpha += (target - halo.alpha) * 0.2 }
    }
}

/// A returning empty (Lane.jsx): the glass with a warm glow, swelling and
/// settling, two glints twinkling out of step on it — and when it's
/// missed, tipping off the counter.
final class GlassSprite: SKNode {
    private let glass = SKSpriteNode(texture: Art.texture("glass-empty.png"))
    private var glints: [SKNode] = []

    init(height h: CGFloat, hit: CGFloat, name: String) {
        super.init()
        self.name = name
        glass.size = glass.texture!.size().fitting(height: h)
        glass.name = name
        let glow = Glow.node(diameter: h * 1.1)
        glow.zPosition = -1
        glass.addChild(glow)
        glass.run(.repeatForever(LaneView.pulse), withKey: "pulse")
        addChild(glass)
        for (i, (fx, fy, d)) in [(0.32, 0.28, 9.0), (0.64, 0.62, 6.0)].enumerated() {
            let g = Glow.glint(size: h * CGFloat(d) / 44)
            g.position = CGPoint(x: (CGFloat(fx) - 0.5) * glass.size.width, y: (0.5 - CGFloat(fy)) * h)
            g.alpha = 0
            g.setScale(0.3)
            let twinkle = SKAction.sequence([
                .group([.fadeIn(withDuration: 0.65), .scale(to: 1, duration: 0.65), .rotate(byAngle: -25 * .pi / 180, duration: 0.65)]),
                .group([.fadeOut(withDuration: 0.65), .scale(to: 0.3, duration: 0.65), .rotate(byAngle: 25 * .pi / 180, duration: 0.65)]),
            ])
            g.run(.sequence([.wait(forDuration: Double(i) * 0.4), .repeatForever(twinkle)]))
            g.zPosition = 1
            addChild(g)
            glints.append(g)
        }
        let target = SKSpriteNode(color: .clear, size: CGSize(width: glass.size.width + hit, height: h + hit))
        target.name = name
        addChild(target)
    }
    required init?(coder: NSCoder) { fatalError() }

    /// glass-fall: tips over the edge and drops away (progress 0–1)
    func fall(progress: Double, laneH: CGFloat) {
        glass.removeAction(forKey: "pulse")
        glints.forEach { $0.removeFromParent() }
        glints = []
        let p = max(0, min(1, progress)) * 100
        glass.position.y = -CGFloat(Track([(0, 0), (30, 4), (100, 70)]).at(p)) * laneH / 144
        glass.zRotation = -CGFloat(Track([(0, 0), (30, 35), (100, 100)]).at(p)) * .pi / 180
        glass.alpha = CGFloat(Track([(0, 1), (30, 1), (100, 0)]).at(p))
        name = nil
        children.forEach { $0.name = nil }
    }
}

/// Soft lights: the warm halo behind a glass or hot dog, and the little
/// eight-pointed glint.
enum Glow {
    private static var halo: SKTexture?
    private static var star: SKTexture?

    static func node(diameter: CGFloat) -> SKSpriteNode {
        if halo == nil {
            let r = UIGraphicsImageRenderer(size: CGSize(width: 64, height: 64))
            halo = SKTexture(image: r.image { ctx in
                let g = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                                   colors: [SKColor(red: 1, green: 0.87, blue: 0.55, alpha: 0.85).cgColor,
                                            SKColor(red: 1, green: 0.87, blue: 0.55, alpha: 0).cgColor] as CFArray,
                                   locations: [0, 1])!
                ctx.cgContext.drawRadialGradient(g, startCenter: CGPoint(x: 32, y: 32), startRadius: 0,
                                                 endCenter: CGPoint(x: 32, y: 32), endRadius: 32, options: [])
            })
        }
        let s = SKSpriteNode(texture: halo, size: CGSize(width: diameter, height: diameter))
        s.blendMode = .add
        return s
    }

    static func glint(size: CGFloat) -> SKSpriteNode {
        if star == nil {
            let r = UIGraphicsImageRenderer(size: CGSize(width: 36, height: 36))
            star = SKTexture(image: r.image { ctx in
                let c = ctx.cgContext
                // the clip-path star: 8 points
                let pts: [(CGFloat, CGFloat)] = [(0.5, 0), (0.61, 0.39), (1, 0.5), (0.61, 0.61), (0.5, 1), (0.39, 0.61), (0, 0.5), (0.39, 0.39)]
                c.move(to: CGPoint(x: pts[0].0 * 36, y: pts[0].1 * 36))
                for p in pts.dropFirst() { c.addLine(to: CGPoint(x: p.0 * 36, y: p.1 * 36)) }
                c.closePath()
                c.clip()
                let g = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                                   colors: [SKColor.white.cgColor, SKColor(white: 1, alpha: 0.6).cgColor, SKColor(white: 1, alpha: 0).cgColor] as CFArray,
                                   locations: [0, 0.45, 0.75])!
                c.drawRadialGradient(g, startCenter: CGPoint(x: 18, y: 18), startRadius: 0, endCenter: CGPoint(x: 18, y: 18), endRadius: 18, options: [])
            })
        }
        return SKSpriteNode(texture: star, size: CGSize(width: size, height: size))
    }
}
