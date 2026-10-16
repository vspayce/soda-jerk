import SpriteKit

/// A CSS @keyframes track: values at percentages through the animation,
/// interpolated linearly between them (the web's timing functions are
/// mostly linear, and the keyframes do the shaping).
struct Track {
    let stops: [(Double, Double)] // (percent 0–100, value)
    init(_ stops: [(Double, Double)]) { self.stops = stops }
    func at(_ pct: Double) -> Double {
        guard let first = stops.first else { return 0 }
        if pct <= first.0 { return first.1 }
        for (a, b) in zip(stops, stops.dropFirst()) where pct <= b.0 {
            let f = b.0 == a.0 ? 1 : (pct - a.0) / (b.0 - a.0)
            return a.1 + (b.1 - a.1) * f
        }
        return stops.last!.1
    }
}

/// One animated layer of a trick: opacity, translation (as fractions of
/// its own box, CSS-style, y down), rotation (degrees, clockwise) and scale.
struct LayerAnim {
    var opacity = Track([(0, 1)])
    var tx = Track([(0, 0)])
    var ty = Track([(0, 0)])
    var rot = Track([(0, 0)])
    var scale = Track([(0, 1)])
    var scaleY = Track([(0, 1)])
    /// Which of tx/ty scale with the toss's reach (the web's --trick-reach).
    var reachX = false, reachY = false
}

/// The jerk's between-level tricks (tricks.js + the trick-* keyframes in
/// index.css), played on the bar where he stands while LEVEL PASSED is up.
final class TrickView: SKNode {
    private struct Layer {
        let sprite: SKSpriteNode
        let anim: LayerAnim
        let base: CGPoint      // its resting centre, from his feet
        let size: CGSize
        let anchorBottom: Bool // transform-origin 50% 100%
        let delay: Double      // seconds (the carry's stacked glasses)
    }
    private var layers: [Layer] = []
    private let duration: Double
    private let reach: Double
    private let throwDelay: Double
    private var started: TimeInterval?

    /// `trick` is the shared TRICKS entry (from the engine); `height` the
    /// jerk's height on screen.
    init?(trick: [String: Any], height H: CGFloat, throwDelayMs: Double) {
        guard let id = trick["id"] as? String, let layerDefs = trick["layers"] as? [[String: Any]] else { return nil }
        duration = (trick["durationMs"] as? Double ?? 2000) / 1000
        reach = trick["maxReach"] as? Double ?? 1 // the level-pass trick is always full power
        throwDelay = throwDelayMs / 1000
        super.init()
        for def in layerDefs {
            guard let file = def["src"] as? String, let cls = def["className"] as? String, let anim = Self.anims[cls] else { continue }
            let aspect = CGFloat(def["aspect"] as? Double ?? 1)
            let count: Int = {
                guard let r = def["repeat"] as? [String: Any] else { return 1 }
                return Int(r["max"] as? Double ?? 1)
            }()
            let overlap = CGFloat((def["repeat"] as? [String: Any])?["overlap"] as? Double ?? 1)
            for n in 0..<count {
                let s = SKSpriteNode(texture: Art.texture(file))
                let size: CGSize, base: CGPoint, bottom: Bool
                if def["kind"] as? String == "pose" {
                    let w = H * aspect
                    let feetX = CGFloat(def["feetX"] as? Double ?? 0.5)
                    size = CGSize(width: w, height: H)
                    base = CGPoint(x: -w * feetX + w / 2, y: H / 2)
                    bottom = true
                } else {
                    let h = H * CGFloat(def["heightRatio"] as? Double ?? 0.3)
                    let w = h * aspect
                    size = CGSize(width: w, height: h)
                    base = CGPoint(x: H * CGFloat(def["x"] as? Double ?? 0), y: H * CGFloat(def["y"] as? Double ?? 0) + CGFloat(n) * h * overlap)
                    bottom = cls == "trick-prop-straw-glass" || cls == "trick-prop-carry-glass"
                }
                s.size = size
                s.anchorPoint = bottom ? CGPoint(x: 0.5, y: 0) : CGPoint(x: 0.5, y: 0.5)
                s.zPosition = CGFloat(10 + n)
                addChild(s)
                layers.append(Layer(sprite: s, anim: anim, base: base, size: size, anchorBottom: bottom, delay: Double(n) * 0.07))
            }
            _ = id
        }
        apply(0)
    }
    required init?(coder: NSCoder) { fatalError() }

    /// Plays from when it's first updated: held on its first frame until he
    /// throws (TRICK_THROW_DELAY_MS), then once through, holding the end.
    func update(time: TimeInterval) {
        let t0 = started ?? time
        started = t0
        let t = time - t0 - throwDelay
        apply(t)
    }

    private func apply(_ t: Double) {
        for l in layers {
            let pct = max(0, min(100, (t - l.delay) / duration * 100))
            let a = l.anim
            let r = reach
            let tx = a.tx.at(pct) * (a.reachX ? r : 1), ty = a.ty.at(pct) * (a.reachY ? r : 1)
            let origin = l.anchorBottom ? CGPoint(x: l.base.x, y: l.base.y - l.size.height / 2) : l.base
            l.sprite.position = CGPoint(x: origin.x + CGFloat(tx) * l.size.width, y: origin.y - CGFloat(ty) * l.size.height)
            l.sprite.zRotation = -CGFloat(a.rot.at(pct)) * .pi / 180
            let sc = CGFloat(a.scale.at(pct))
            l.sprite.xScale = sc
            l.sprite.yScale = sc * CGFloat(a.scaleY.at(pct))
            l.sprite.alpha = CGFloat(a.opacity.at(pct))
        }
    }

    // The trick-* keyframes from index.css (percent, value); translations
    // are fractions of the layer's own box.
    private static let anims: [String: LayerAnim] = {
        var m: [String: LayerAnim] = [:]
        var stand = LayerAnim()
        stand.opacity = Track([(0, 1), (15, 1), (16, 0), (69, 0), (70, 1), (100, 1)])
        stand.ty = Track([(0, 0), (10, 0.02), (15, 0), (70, 0), (76, 0.015), (100, 0)])
        stand.scaleY = Track([(0, 1), (10, 0.965), (15, 1), (70, 1), (76, 0.98), (100, 1)])
        m["trick-pose-stand"] = stand
        var thr = LayerAnim()
        thr.opacity = Track([(0, 0), (15, 0), (16, 1), (69, 1), (70, 0), (100, 0)])
        m["trick-pose-throw"] = thr
        var shaker = LayerAnim()
        shaker.opacity = Track([(0, 0), (15, 0), (17, 1), (69, 1), (70, 0), (100, 0)])
        shaker.tx = Track([(0, 0), (17, 0), (26, 0.07), (42, 0.16), (58, 0.08), (66, 0), (100, 0)])
        shaker.ty = Track([(0, 0), (17, 0), (26, -0.98), (42, -1.58), (58, -0.96), (66, 0), (100, 0)])
        shaker.rot = Track([(0, 0), (17, 0), (26, 200), (42, 380), (58, 560), (66, 720), (100, 720)])
        shaker.reachX = true; shaker.reachY = true
        m["trick-prop-shaker-flip"] = shaker
        var flick = LayerAnim()
        flick.ty = Track([(0, 0), (12, 0.01), (20, 0), (100, 0)])
        flick.rot = Track([(0, 0), (12, -2), (20, 2.5), (32, 0), (100, 0)])
        m["trick-pose-flick"] = flick
        var strawGlass = LayerAnim()
        strawGlass.opacity = Track([(0, 0), (8, 1), (100, 1)])
        strawGlass.tx = Track([(0, 2.6), (8, 2.4), (26, 0), (32, -0.06), (38, 0), (100, 0)])
        strawGlass.ty = Track([(0, 0), (72, 0), (78, 0.02), (86, 0), (100, 0)])
        strawGlass.scaleY = Track([(0, 1), (72, 1), (78, 0.97), (86, 1), (100, 1)])
        m["trick-prop-straw-glass"] = strawGlass
        var straw = LayerAnim()
        straw.opacity = Track([(0, 0), (16, 0), (18, 1), (100, 1)])
        straw.tx = Track([(0, -4.09), (18, -4.09), (34, -3.0), (50, -1.8), (64, -0.6), (72, 0), (100, 0)])
        straw.ty = Track([(0, -0.26), (18, -0.26), (34, -1.9), (50, -2.5), (64, -1.7), (72, -0.4), (80, 0.04), (88, -0.03), (100, 0)])
        straw.rot = Track([(0, -20), (18, -20), (34, 120), (50, 250), (64, 330), (72, 360), (100, 360)])
        straw.reachY = true
        m["trick-prop-straw"] = straw
        var carry = LayerAnim()
        carry.ty = Track([(0, 0), (14, 0.015), (26, 0), (50, -0.005), (74, 0), (100, 0)])
        carry.scaleY = Track([(0, 1), (14, 0.975), (26, 1), (100, 1)])
        carry.rot = Track([(0, 0), (26, 0), (50, 0.8), (74, -0.6), (100, 0)])
        m["trick-pose-carry"] = carry
        var carryGlass = LayerAnim()
        carryGlass.opacity = Track([(0, 0), (18, 1), (100, 1)])
        carryGlass.ty = Track([(0, 0.35), (18, 0), (100, 0)])
        carryGlass.scale = Track([(0, 0.9), (18, 1), (100, 1)])
        carryGlass.rot = Track([(0, 0), (18, 0), (40, -3), (58, 2.4), (76, -1.4), (100, 0)])
        m["trick-prop-carry-glass"] = carryGlass
        return m
    }()
}
