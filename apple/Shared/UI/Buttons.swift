import SpriteKit

/// Something on a screen you can press: by touch, or by moving the
/// controller's focus to it and pressing A (or clicking the Siri Remote).
class ButtonNode: SKNode {
    var action: () -> Void = {}
    /// The area that takes a touch, in this node's coordinates.
    var hitRect = CGRect.zero
    private(set) var focused = false
    private let focusRing = SKShapeNode()

    func setFocused(_ on: Bool, showRing: Bool) {
        focused = on
        removeAction(forKey: "focus")
        run(.scale(to: on && showRing ? 1.07 : 1, duration: 0.12), withKey: "focus")
        focusRing.isHidden = !(on && showRing)
    }

    /// Call once the button's drawn: sizes its touch area and focus ring.
    func finish(size: CGSize, cornerRadius: CGFloat = 4) {
        hitRect = CGRect(x: -size.width / 2, y: -size.height / 2, width: size.width, height: size.height)
        let pad = 5 * Theme.u
        focusRing.path = CGPath(roundedRect: hitRect.insetBy(dx: -pad, dy: -pad), cornerWidth: cornerRadius + pad, cornerHeight: cornerRadius + pad, transform: nil)
        focusRing.strokeColor = Theme.brassLight
        focusRing.lineWidth = 2.5 * Theme.u
        focusRing.glowWidth = 3 * Theme.u
        focusRing.fillColor = .clear
        focusRing.isHidden = true
        focusRing.zPosition = 5
        if focusRing.parent == nil { addChild(focusRing) }
    }

    func contains(scenePoint p: CGPoint) -> Bool {
        guard let scene, !isHiddenInTree else { return false }
        return hitRect.insetBy(dx: -6 * Theme.u, dy: -6 * Theme.u).contains(convert(p, from: scene))
    }

    var isHiddenInTree: Bool {
        var n: SKNode? = self
        while let x = n { if x.isHidden || x.alpha < 0.05 { return true }; n = x.parent }
        return false
    }

    func press() {
        run(.sequence([.scale(to: 0.95, duration: 0.05), .scale(to: focused ? 1.07 : 1, duration: 0.08)]))
        action()
    }
}

/// The cream "SODA JERK" sign button (SignButton.jsx): ink frame, deep red
/// script between two swirls.
final class SignButton: ButtonNode {
    init(_ text: String, action: @escaping () -> Void) {
        super.init()
        self.action = action
        let u = Theme.u
        let label = Theme.label(text, .script, 30, color: Theme.signRed)
        let swirlW: CGFloat = 30 * u
        let w = label.frame.width + swirlW * 2 + 16 * u + 64 * u
        let h = max(label.frame.height, 30 * u) + 24 * u
        let bg = SKShapeNode(rectOf: CGSize(width: w, height: h), cornerRadius: 4 * u)
        bg.fillColor = .white
        bg.fillTexture = SKTexture.verticalGradient(top: SKColor(hex: 0xFCE4C4), bottom: SKColor(hex: 0xEFCE9E))
        bg.strokeColor = Theme.ink
        bg.lineWidth = 3 * u
        let shadow = SKShapeNode(rectOf: CGSize(width: w, height: h), cornerRadius: 4 * u)
        shadow.fillColor = SKColor(white: 0, alpha: 0.45)
        shadow.strokeColor = .clear
        shadow.position = CGPoint(x: 0, y: -4 * u)
        for n in [shadow, bg, label] { addChild(n) }
        for side in [-1.0, 1.0] as [CGFloat] {
            let s = Swirl.node(color: Theme.signRed, flip: side > 0)
            s.position = CGPoint(x: side * (label.frame.width / 2 + 8 * u + swirlW / 2), y: 0)
            addChild(s)
        }
        finish(size: CGSize(width: w, height: h))
    }
    required init?(coder: NSCoder) { fatalError() }
}

/// The dark Art Deco button with the gold title (DecoButton.jsx): ink
/// panel, brass double frame, corner fans, a soft glow that pulses.
final class DecoButton: ButtonNode {
    let subLabel: SKLabelNode?

    /// `maxWidth` (points) shrinks the title until the whole button fits.
    init(_ title: String, subtext: String? = nil, titlePx: CGFloat = 36, maxWidth: CGFloat? = nil, action: @escaping () -> Void) {
        let u = Theme.u
        var px = titlePx
        var t = Theme.label(title, .display, px, color: Theme.brassLight, weight: 700, tracking: 0.15)
        while let maxWidth, px > 12, t.frame.width + (60 + 16 + 80) * u > maxWidth {
            px -= 1
            t = Theme.label(title, .display, px, color: Theme.brassLight, weight: 700, tracking: 0.15)
        }
        subLabel = subtext.map { Theme.label($0, .body, 11, color: Theme.cream.withAlphaComponent(0.7), tracking: 0.25) }
        super.init()
        self.action = action
        let swirlW: CGFloat = 30 * u
        let w = t.frame.width + swirlW * 2 + 16 * u + 80 * u
        let h = t.frame.height + 56 * u + (subLabel != nil ? 22 * u : 0)
        let glow = SKShapeNode(rectOf: CGSize(width: w, height: h))
        glow.strokeColor = Theme.brass.withAlphaComponent(0.6)
        glow.lineWidth = 2 * u
        glow.glowWidth = 10 * u
        glow.run(.repeatForever(.sequence([.fadeAlpha(to: 0.25, duration: 0.9), .fadeAlpha(to: 1, duration: 0.9)])))
        let bg = SKShapeNode(rectOf: CGSize(width: w, height: h))
        bg.fillColor = Theme.ink
        bg.strokeColor = Theme.brass
        bg.lineWidth = 2 * u
        let inner = SKShapeNode(rectOf: CGSize(width: w - 10 * u, height: h - 10 * u))
        inner.strokeColor = Theme.brass.withAlphaComponent(0.45)
        inner.lineWidth = 1 * u
        for n in [glow, bg, inner] { addChild(n) }
        for (cx, cy) in [(-1, 1), (1, 1), (-1, -1), (1, -1)] as [(CGFloat, CGFloat)] {
            let fan = Swirl.cornerFan(size: 34 * u)
            fan.position = CGPoint(x: cx * w / 2, y: cy * h / 2)
            fan.xScale = -cx; fan.yScale = cy
            addChild(fan)
        }
        let titleY = subLabel != nil ? 9 * u : 0
        t.position = CGPoint(x: 0, y: titleY)
        addChild(t)
        for side in [-1.0, 1.0] as [CGFloat] {
            let s = Swirl.node(color: Theme.brass, flip: side > 0)
            s.position = CGPoint(x: side * (t.frame.width / 2 + 8 * u + swirlW / 2), y: titleY)
            addChild(s)
        }
        if let subLabel {
            subLabel.position = CGPoint(x: 0, y: -h / 2 + 20 * u)
            addChild(subLabel)
        }
        finish(size: CGSize(width: w, height: h), cornerRadius: 0)
    }
    required init?(coder: NSCoder) { fatalError() }
}

/// Small underlined capitals (the web's "HIGH SCORES", "BACK" links).
final class LinkButton: ButtonNode {
    init(_ text: String, px: CGFloat = 12, color: SKColor = Theme.cream.withAlphaComponent(0.55), action: @escaping () -> Void) {
        super.init()
        self.action = action
        let l = Theme.label(text, .body, px, color: color, tracking: 0.25)
        addChild(l)
        let line = SKSpriteNode(color: color, size: CGSize(width: l.frame.width, height: max(1, Theme.u)))
        line.position = CGPoint(x: 0, y: -l.frame.height / 2 - 3 * Theme.u)
        addChild(line)
        finish(size: CGSize(width: l.frame.width + 16 * Theme.u, height: l.frame.height + 18 * Theme.u))
    }
    required init?(coder: NSCoder) { fatalError() }
}

/// A brass-outlined button (the settings menu's).
final class OutlineButton: ButtonNode {
    init(_ text: String, action: @escaping () -> Void) {
        super.init()
        self.action = action
        let u = Theme.u
        let l = Theme.label(text, .body, 14, color: Theme.brass, tracking: 0.1)
        let size = CGSize(width: max(l.frame.width + 48 * u, 240 * u), height: l.frame.height + 26 * u)
        let bg = SKShapeNode(rectOf: size, cornerRadius: 2 * u)
        bg.strokeColor = Theme.brass
        bg.lineWidth = 1 * u
        bg.fillColor = .clear
        addChild(bg); addChild(l)
        finish(size: size, cornerRadius: 2 * u)
    }
    required init?(coder: NSCoder) { fatalError() }
}

/// A small icon button (the HUD's mute and settings).
final class IconButton: ButtonNode {
    private let icon = SKShapeNode()
    init(path: CGPath, action: @escaping () -> Void) {
        super.init()
        self.action = action
        setPath(path)
        icon.fillColor = Theme.brass
        icon.strokeColor = Theme.brass
        icon.alpha = 0.85
        addChild(icon)
        finish(size: CGSize(width: 34 * Theme.u, height: 34 * Theme.u), cornerRadius: 17 * Theme.u)
    }
    func setPath(_ path: CGPath) { icon.path = path }
    required init?(coder: NSCoder) { fatalError() }
}

/// The little curl either side of a sign's text, and the Deco corner fan.
enum Swirl {
    static func node(color: SKColor, flip: Bool) -> SKNode {
        let u = Theme.u
        // the web's SVG: M2 8c0-4.5 6.5-6.5 9.5-3 2.5 3 0 5.5-2.5 4-1.5-1-1-2.5.5-2.5  (30x16, y down)
        let p = CGMutablePath()
        func pt(_ x: CGFloat, _ y: CGFloat) -> CGPoint { CGPoint(x: (x - 15) * u, y: (8 - y) * u) }
        p.move(to: pt(2, 8))
        p.addCurve(to: pt(11.5, 5), control1: pt(2, 3.5), control2: pt(8.5, 1.5))
        p.addCurve(to: pt(9, 9), control1: pt(14, 8), control2: pt(11.5, 10.5))
        p.addCurve(to: pt(9.5, 6.5), control1: pt(7.5, 8), control2: pt(8, 6.5))
        let s = SKShapeNode(path: p)
        s.strokeColor = color
        s.lineWidth = 1.3 * u
        s.lineCap = .round
        let dot = SKShapeNode(circleOfRadius: 1.3 * u)
        dot.fillColor = color; dot.strokeColor = .clear
        dot.position = pt(15, 8)
        let n = SKNode()
        n.addChild(s); n.addChild(dot)
        n.xScale = flip ? -1 : 1
        n.alpha = 0.8
        return n
    }

    /// The faint brass rays behind a drink tap (SunburstRing.jsx).
    static func sunburst(diameter: CGFloat) -> SKNode {
        let p = CGMutablePath()
        let r = diameter / 2
        var a: CGFloat = 0
        while a < 360 {
            let r0 = a * .pi / 180, r1 = (a + 2) * .pi / 180
            p.move(to: .zero)
            p.addLine(to: CGPoint(x: cos(r0) * r, y: sin(r0) * r))
            p.addLine(to: CGPoint(x: cos(r1) * r, y: sin(r1) * r))
            p.closeSubpath()
            a += 10
        }
        let s = SKShapeNode(path: p)
        s.fillColor = Theme.brass
        s.strokeColor = .clear
        s.alpha = 0.3
        return s
    }

    /// Fine brass rays fanning from a corner (DecoButton's CornerFan).
    static func cornerFan(size: CGFloat) -> SKNode {
        let p = CGMutablePath()
        var a: CGFloat = 0
        while a < 90 {
            let r0 = a * .pi / 180, r1 = (a + 3) * .pi / 180
            p.move(to: .zero)
            p.addLine(to: CGPoint(x: cos(r0) * size, y: -sin(r0) * size))
            p.addLine(to: CGPoint(x: cos(r1) * size, y: -sin(r1) * size))
            p.closeSubpath()
            a += 9
        }
        let s = SKShapeNode(path: p)
        s.fillColor = Theme.brass
        s.strokeColor = .clear
        s.alpha = 0.4
        let crop = SKCropNode()
        let mask = SKSpriteNode(color: .white, size: CGSize(width: size, height: size))
        mask.anchorPoint = CGPoint(x: 0, y: 1)
        crop.maskNode = mask
        crop.addChild(s)
        return crop
    }
}

extension SKTexture {
    static func verticalGradient(top: SKColor, bottom: SKColor) -> SKTexture {
        let r = UIGraphicsImageRenderer(size: CGSize(width: 2, height: 64))
        let img = r.image { ctx in
            let g = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: [top.cgColor, bottom.cgColor] as CFArray, locations: [0, 1])!
            ctx.cgContext.drawLinearGradient(g, start: .zero, end: CGPoint(x: 0, y: 64), options: [])
        }
        return SKTexture(image: img)
    }
}

/// The HUD's speaker and gear icons, from the web's SVGs (24-unit boxes).
enum Icons {
    static func speaker(muted: Bool, size: CGFloat) -> CGPath {
        let k = size / 24
        func pt(_ x: CGFloat, _ y: CGFloat) -> CGPoint { CGPoint(x: (x - 12) * k, y: (12 - y) * k) }
        let p = CGMutablePath()
        p.move(to: pt(3, 9)); p.addLine(to: pt(3, 15)); p.addLine(to: pt(7, 15)); p.addLine(to: pt(12, 19))
        p.addLine(to: pt(12, 5)); p.addLine(to: pt(7, 9)); p.closeSubpath()
        if muted {
            for (a, b) in [((16, 8), (21, 16)), ((21, 8), (16, 16))] as [((CGFloat, CGFloat), (CGFloat, CGFloat))] {
                p.addPath(CGPath(rect: .zero, transform: nil))
                let line = CGMutablePath(); line.move(to: pt(a.0, a.1)); line.addLine(to: pt(b.0, b.1))
                p.addPath(line.copy(strokingWithWidth: 1.8 * k, lineCap: .round, lineJoin: .round, miterLimit: 1))
            }
        } else {
            for r: CGFloat in [3.5, 6.5] {
                let arc = CGMutablePath()
                arc.addArc(center: pt(12.5, 12), radius: r * k, startAngle: -.pi / 3, endAngle: .pi / 3, clockwise: false)
                p.addPath(arc.copy(strokingWithWidth: 1.6 * k, lineCap: .round, lineJoin: .round, miterLimit: 1))
            }
        }
        return p
    }

    static func gear(size: CGFloat) -> CGPath {
        let k = size / 24
        let p = CGMutablePath()
        let teeth = 8
        for i in 0..<(teeth * 2) {
            let a = CGFloat(i) / CGFloat(teeth * 2) * 2 * .pi
            let r: CGFloat = (i % 2 == 0 ? 9.8 : 7.6) * k
            let q = CGPoint(x: cos(a) * r, y: sin(a) * r)
            i == 0 ? p.move(to: q) : p.addLine(to: q)
        }
        p.closeSubpath()
        p.addEllipse(in: CGRect(x: -3.6 * k, y: -3.6 * k, width: 7.2 * k, height: 7.2 * k))
        return p
    }
}
