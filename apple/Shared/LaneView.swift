import SpriteKit

/// One bar: its counter, door, fountain (and Pop's stools), plus whoever and
/// whatever is on it, redrawn from the engine every frame. Positions are the
/// engine's lane percentages. A flipped bar is the same bar mirrored — the
/// whole node, patrons and jerk included — exactly as the web game does it.
final class LaneView {
    let node = SKNode()
    let index: Int
    private let L: Layout
    private let playerX: Double
    private let doorX: Double
    private let stepEase: Double
    private let drinkIcons: [String]
    private let patronArt: [Snap]

    private let player = SKSpriteNode()
    private let hotdog = SKSpriteNode(texture: Art.texture("hotdog.png"))
    private var patrons: [Int: SKSpriteNode] = [:]
    private var mugs: [Int: SKSpriteNode] = [:]
    private var glasses: [Int: SKSpriteNode] = [:]

    init(index: Int, venue: String, reversed: Bool, layout: Layout, engine: Engine) {
        self.index = index
        L = layout
        let C = engine.constants
        playerX = C.double("PLAYER_X")
        doorX = C.double("DOOR_X")
        stepEase = C.double("STEP_EASE")
        drinkIcons = C.list("DRINK_TYPES").map { $0.string("icon") ?? "drink-orange.png" }
        patronArt = engine.patronArt

        node.position = CGPoint(x: reversed ? L.x0 + L.laneW : L.x0, y: L.laneCenters[index])
        node.xScale = reversed ? -1 : 1
        buildFixtures(venue: venue)

        player.anchorPoint = CGPoint(x: 0.5, y: 0)
        player.zPosition = 20
        node.addChild(player)
        hotdog.size = hotdog.texture!.size().fitting(height: L.laneH * 0.16)
        hotdog.zPosition = 15
        node.addChild(hotdog)
    }

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
        let aisle = SKSpriteNode(color: SKColor(white: 0, alpha: 0.25), size: CGSize(width: L.laneW, height: L.laneH * 36 / 144))
        aisle.position = CGPoint(x: L.laneW / 2, y: 0)
        node.addChild(aisle)

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

        // the door patrons come in by: two leaves, the saloon door's shape
        let doorH = L.laneH * 55 / 144
        let leafW = doorH * 410 / 898
        for (side, dx) in [("left", -leafW / 2), ("right", leafW / 2)] {
            let leaf = SKSpriteNode(texture: Art.texture("\(f.door)-\(side).png"), size: CGSize(width: leafW, height: doorH))
            leaf.anchorPoint = CGPoint(x: 0.5, y: 0)
            leaf.position = CGPoint(x: L.x(doorX) + dx, y: L.feetY)
            leaf.zPosition = 3
            node.addChild(leaf)
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

    func update(state s: Snap, engine: Engine, time: TimeInterval) {
        drawPlayer(s, time: time)
        drawPatrons(s.list("customers").filter { $0.int("lane") == index }, time: time)
        sync(&mugs, items: s.list("mugs").filter { $0.int("lane") == index }) { m, sprite in
            let icon = drinkIcons.indices.contains(m.int("drinkType")) ? drinkIcons[m.int("drinkType")] : "drink-orange.png"
            if sprite.texture == nil || sprite.name != icon {
                sprite.texture = Art.texture(icon); sprite.name = icon
                sprite.size = sprite.texture!.size().fitting(height: L.laneH * 27 / 144)
            }
            sprite.position = CGPoint(x: L.x(m.double("x")), y: L.surfaceY)
            sprite.zPosition = 15
        }
        sync(&glasses, items: s.list("glasses").filter { $0.int("lane") == index }) { g, sprite in
            if sprite.texture == nil {
                sprite.texture = Art.texture("glass-empty.png")
                sprite.size = sprite.texture!.size().fitting(height: L.laneH * 30 / 144)
            }
            sprite.position = CGPoint(x: L.x(g.double("x")), y: L.surfaceY)
            sprite.zRotation = g.bool("_missed") ? -0.9 : 0
            sprite.zPosition = 15
        }
        if let b = s.object("bonus"), b.int("lane") == index {
            hotdog.isHidden = false
            hotdog.position = CGPoint(x: L.x(b.double("x")), y: L.surfaceY)
        } else {
            hotdog.isHidden = true
        }
    }

    private func drawPlayer(_ s: Snap, time: TimeInterval) {
        guard s.int("playerLane") == index else { player.isHidden = true; return }
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
    }

    private func drawPatrons(_ list: [Snap], time: TimeInterval) {
        var seen = Set<Int>()
        for c in list {
            let status = c.string("status") ?? "walking"
            let x = c.double("x")
            // walking in from off-screen: hidden until they reach the door
            if status == "walking" && x > doorX { continue }
            let id = c.int("id")
            seen.insert(id)
            let sprite = patrons[id] ?? {
                let s = SKSpriteNode()
                s.anchorPoint = CGPoint(x: 0.5, y: 0)
                s.zPosition = 10
                node.addChild(s)
                patrons[id] = s
                return s
            }()
            let type = c.int("patronType"), drink = c.int("drinkType")
            let h = L.patronH
            var rotation: CGFloat = 0
            sprite.xScale = 1
            switch status {
            case "toasting", "leaving-happy", "drinking":
                let tex = Art.texture(Art.patronHeld(type, drink))
                sprite.texture = tex
                sprite.size = tex.size().fitting(height: h)
                if status == "leaving-happy" { rotation = -4 }  // rocked back by the shove
                if status == "drinking" { rotation = -5 * pow(sin(time * .pi / 0.7), 2) }  // a swallow
            case "watching":
                let tex = Art.texture(Art.patronPortrait(type, drink))
                sprite.texture = tex
                sprite.size = tex.size().fitting(height: h)
                sprite.xScale = -1  // turned round to watch the show
            default:
                // Walking: the frame follows the ground covered, so the
                // planted foot stays put however the pace changes (as in
                // Customer.jsx's strideOf).
                let art = patronArt.indices.contains(type) ? patronArt[type] : Snap(["width": 200, "ground": 0.4])
                let ground = max(0.05, art.double("ground"))
                let walkedPts = c.double("walked") / 100 * Double(L.laneW)
                let cycles = walkedPts / (ground * Double(h))
                let stride = cycles - floor(cycles)
                let frames = Art.frames(Art.patronWalk(type, drink), count: 8)
                sprite.texture = frames[Int(stride * 8) % 8]
                sprite.size = CGSize(width: h * CGFloat(art.double("width") / 279), height: h)
                // lean into the bar and rock with each step, by pace
                let speed = c.double("speed")
                let pace = speed > 0 ? min(1, c.double("vel") / (speed / (1 - stepEase))) : 0
                rotation = -(-3 * pace + 1.6 * sin(stride * 4 * .pi) * pace)
                // stood between steps: one impatient rock toward the bar
                let pause = c.double("pauseMs"), total = c.double("pauseTotalMs")
                if pause > 0 && total > 0 { rotation += 4 * sin(.pi * (1 - pause / total)) }
            }
            sprite.zRotation = rotation * .pi / 180
            sprite.position = CGPoint(x: L.x(x), y: L.feetY)
        }
        for (id, sprite) in patrons where !seen.contains(id) {
            sprite.removeFromParent()
            patrons[id] = nil
        }
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
