import SpriteKit
#if canImport(UIKit)
import UIKit
#endif

/// The room behind the bars, per venue (PerspectiveBackdrop.jsx). The still
/// parts — walls, wallpaper, the light, the floor, the tent — are painted
/// once into one picture with the web's own geometry (its clip-path
/// polygons and gradients, in percentages of the frame); what moves — the
/// organ, the neon, the spotlights, the marquee — is animated on top.
enum Backdrop {
    static func build(venue: String, in layer: SKNode, size: CGSize, layout L: Layout) {
        let painted = SKSpriteNode(texture: SKTexture(image: paint(venue: venue, size: size, L: L)))
        painted.size = size
        painted.position = CGPoint(x: size.width / 2, y: size.height / 2)
        layer.addChild(painted)

        switch venue {
        case "fountain": fountainLive(layer, size: size, L: L)
        case "circus": circusLive(layer, size: size, L: L)
        default: speakeasyLive(layer, size: size, L: L)
        }

        // the Soda Jerk logo hangs up top in every venue
        let logo = Theme.image("soda-jerk-logo.png", height: 24)
        #if os(tvOS)
        logo.position = CGPoint(x: size.width / 2, y: L.hudY)
        #else
        logo.position = CGPoint(x: size.width / 2, y: size.height - L.safeTop - 44 * Theme.u - 12 * Theme.u)
        #endif
        logo.zPosition = 5
        layer.addChild(logo)
    }

    /// Where a centrepiece sign's top sits: on a phone, the same distance
    /// below the logo as on the web (where the logo spans 44–68px of an
    /// 844px frame and the sign starts `webTopPct` down it) — so a notch,
    /// which pushes the logo down, takes the sign with it; on a TV, behind
    /// the top bar.
    private static func signY(_ webTopPct: CGFloat, size: CGSize, L: Layout) -> CGFloat {
        #if os(tvOS)
        return (L.laneCenters.first ?? size.height * 0.8) + L.laneH * 0.42
        #else
        let logoBottom = size.height - L.safeTop - 68 * Theme.u
        return logoBottom - (webTopPct / 100 * 844 - 68) * Theme.u
        #endif
    }

    // ------------------------------------------------------------ the live parts

    private static func speakeasyLive(_ layer: SKNode, size: CGSize, L: Layout) {
        let u = Theme.u
        // wall sconces: small glowing brass lamps along each wall's slant
        for yPct in [32.0, 66.0] {
            for side in ["left", "right"] {
                let inner = 48 - 48 * (yPct / 100), mid = inner + 6
                let xPct = side == "left" ? mid : 100 - mid
                let lamp = SKShapeNode(circleOfRadius: 3.5 * u)
                lamp.fillColor = SKColor(hex: 0xE8C878)
                lamp.strokeColor = .clear
                lamp.glowWidth = 5 * u
                lamp.position = CGPoint(x: size.width * CGFloat(xPct) / 100, y: size.height * CGFloat(1 - yPct / 100))
                layer.addChild(lamp)
            }
        }
        // the Mighty Wurlitzer, swaying gently as it plays (organ-play),
        // with a few stop tabs catching the light
        let organ = SKSpriteNode(texture: Art.texture("wurlitzer.png"))
        #if os(tvOS)
        organ.size = organ.texture!.size().fitting(height: L.laneH * 1.1)
        organ.position = CGPoint(x: size.width / 2, y: (L.laneCenters.first ?? 0) + L.laneH * 0.35)
        #else
        organ.size = organ.texture!.size().fitting(width: size.width * 0.24)
        organ.position = CGPoint(x: size.width / 2, y: signY(9, size: size, L: L) - organ.size.height / 2)
        #endif
        organ.alpha = 0.95
        organ.run(.repeatForever(.sequence([
            .group([.moveBy(x: 0, y: 1.5 * u, duration: 0.45), .scale(to: 1.008, duration: 0.45)]),
            .group([.moveBy(x: 0, y: -1.5 * u, duration: 0.45), .scale(to: 1, duration: 0.45)]),
        ])))
        layer.addChild(organ)
        for (i, (fx, fy)) in [(0.22, 0.61), (0.58, 0.58), (0.40, 0.64)].enumerated() {
            let g = Glow.node(diameter: organ.size.width * 0.06)
            g.position = CGPoint(x: (CGFloat(fx) + 0.02 - 0.5) * organ.size.width, y: (0.5 - CGFloat(fy) - 0.02) * organ.size.height)
            g.alpha = 0
            g.run(.sequence([.wait(forDuration: Double(i) * 0.5), .repeatForever(.sequence([.fadeAlpha(to: 0.85, duration: 0.8), .fadeAlpha(to: 0, duration: 0.8)]))]))
            organ.addChild(g)
        }
    }

    private static func fountainLive(_ layer: SKNode, size: CGSize, L: Layout) {
        let u = Theme.u
        let y = signY(13, size: size, L: L)
        let sign = SKNode()
        // the neon: a blurred pink tube glow behind the lettering
        let glow = SKEffectNode()
        glow.filter = CIFilter(name: "CIGaussianBlur", parameters: ["inputRadius": 8 * u])
        let tube = Theme.label("Soda Fountain", .script, 30, color: SKColor(hex: 0xFF2E8A))
        glow.addChild(tube)
        let text = Theme.label("Soda Fountain", .script, 30, color: SKColor(hex: 0xFFE3F1))
        let sub = Theme.label("SODAS · SUNDAES · MALTS", .display, 9, color: SKColor(hex: 0xE6FFF7), weight: 600, tracking: 0.3)
        sub.position = CGPoint(x: 0, y: -text.frame.height / 2 - 12 * u)
        let subGlow = SKEffectNode()
        subGlow.filter = CIFilter(name: "CIGaussianBlur", parameters: ["inputRadius": 4 * u])
        let subTube = Theme.label("SODAS · SUNDAES · MALTS", .display, 9, color: SKColor(hex: 0x22C9A2), weight: 600, tracking: 0.3)
        subTube.position = sub.position
        subGlow.addChild(subTube)
        for n in [glow, text, subGlow, sub] as [SKNode] { sign.addChild(n) }
        sign.position = CGPoint(x: size.width / 2, y: y - text.frame.height / 2)
        // neon-flicker: steady, with the odd stutter (5.5s)
        let stutter = SKAction.sequence([.fadeAlpha(to: 0.55, duration: 0.05), .fadeAlpha(to: 1, duration: 0.05)])
        sign.run(.repeatForever(.sequence([.wait(forDuration: 1.0), stutter, .wait(forDuration: 2.2), stutter, .wait(forDuration: 2.1)])))
        layer.addChild(sign)
    }

    private static func circusLive(_ layer: SKNode, size: CGSize, L: Layout) {
        let u = Theme.u
        // spotlights sweeping from the top corners
        for (i, side) in [-1.0, 1.0].enumerated() {
            let beam = SKSpriteNode(texture: spotlightTexture(), size: CGSize(width: size.width * 0.7, height: size.height * 1.2))
            beam.anchorPoint = CGPoint(x: 0.5, y: 1)
            beam.blendMode = .screen
            beam.position = CGPoint(x: size.width * (side < 0 ? 0.17 : 0.83), y: size.height * 1.1)
            let a0 = (side < 0 ? 24.0 : -18.0) * .pi / 180, a1 = (side < 0 ? -18.0 : 24.0) * .pi / 180
            beam.zRotation = a0
            let sweep = SKAction.sequence([.rotate(toAngle: a1, duration: i == 0 ? 7 : 8), .rotate(toAngle: a0, duration: i == 0 ? 7 : 8)])
            sweep.timingMode = .easeInEaseOut
            beam.run(.sequence([.wait(forDuration: Double(i) * 3), .repeatForever(sweep)]))
            layer.addChild(beam)
        }
        // THE BIG TOP in marquee bulbs, chasing
        let y = signY(12.5, size: size, L: L)
        let title = Theme.label("THE BIG TOP", .display, 22, color: SKColor(hex: 0xFFD447), weight: 800, tracking: 0.12)
        let w = title.frame.width + 24 * u, h = title.frame.height + 14 * u
        let plate = SKShapeNode(rectOf: CGSize(width: w, height: h), cornerRadius: 6 * u)
        plate.fillColor = SKColor(hex: 0x5A0A0E, alpha: 0.85)
        plate.strokeColor = SKColor(hex: 0xFFD447)
        plate.lineWidth = 2 * u
        let sign = SKNode()
        sign.addChild(plate)
        let shadow = Theme.label("THE BIG TOP", .display, 22, color: SKColor(hex: 0x7A1010), weight: 800, tracking: 0.12)
        shadow.position = CGPoint(x: 0, y: -2 * u)
        sign.addChild(shadow)
        sign.addChild(title)
        // bulbs every 10px round the frame, alternate ones lit in turn
        var bulbs: [[SKShapeNode]] = [[], []]
        let perim = 2 * (w + h) + 10 * u
        let step = 10 * u
        var d: CGFloat = 0, k = 0
        while d < perim - step / 2 {
            let p = pointOnRect(w: w + 10 * u, h: h + 10 * u, distance: d)
            let b = SKShapeNode(circleOfRadius: 2 * u)
            b.fillColor = SKColor(hex: 0xFFF2B0)
            b.strokeColor = .clear
            b.position = p
            sign.addChild(b)
            bulbs[k % 2].append(b)
            d += step; k += 1
        }
        let flip = SKAction.run { for (i, set) in bulbs.enumerated() { for b in set { b.alpha = b.alpha > 0.5 ? 0.2 : 1 }; _ = i } }
        for b in bulbs[1] { b.alpha = 0.2 }
        sign.run(.repeatForever(.sequence([.wait(forDuration: 0.4), flip])))
        sign.position = CGPoint(x: size.width / 2, y: y - h / 2)
        layer.addChild(sign)
    }

    private static func pointOnRect(w: CGFloat, h: CGFloat, distance d0: CGFloat) -> CGPoint {
        var d = d0
        if d < w { return CGPoint(x: -w / 2 + d, y: h / 2) }; d -= w
        if d < h { return CGPoint(x: w / 2, y: h / 2 - d) }; d -= h
        if d < w { return CGPoint(x: w / 2 - d, y: -h / 2) }; d -= w
        return CGPoint(x: -w / 2, y: -h / 2 + min(d, h))
    }

    private static var spot: SKTexture?
    /// A soft cone of light, narrow at the top (the .spotlight class).
    private static func spotlightTexture() -> SKTexture {
        if let spot { return spot }
        let r = UIGraphicsImageRenderer(size: CGSize(width: 200, height: 300))
        let img = r.image { ctx in
            let c = ctx.cgContext
            c.move(to: CGPoint(x: 92, y: 0)); c.addLine(to: CGPoint(x: 108, y: 0))
            c.addLine(to: CGPoint(x: 200, y: 300)); c.addLine(to: CGPoint(x: 0, y: 300)); c.closePath()
            c.clip()
            let g = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                               colors: [SKColor(red: 1, green: 0.96, blue: 0.84, alpha: 0.38).cgColor,
                                        SKColor(red: 1, green: 0.96, blue: 0.84, alpha: 0.08).cgColor,
                                        SKColor(red: 1, green: 0.96, blue: 0.84, alpha: 0).cgColor] as CFArray,
                               locations: [0, 0.7, 1])!
            c.drawLinearGradient(g, start: .zero, end: CGPoint(x: 0, y: 300), options: [])
        }
        spot = SKTexture(image: img)
        return spot!
    }

    // ------------------------------------------------------------ the still parts

    private static func paint(venue: String, size: CGSize, L: Layout) -> UIImage {
        let fmt = UIGraphicsImageRendererFormat()
        fmt.scale = 1
        return UIGraphicsImageRenderer(size: size, format: fmt).image { ctx in
            let c = ctx.cgContext
            let W = size.width, H = size.height
            switch venue {
            case "fountain": paintFountain(c, W, H, L)
            case "circus": paintCircus(c, W, H, L)
            default: paintSpeakeasy(c, W, H)
            }
        }
    }

    // CSS helpers: a polygon in % of the frame, gradients, the 115° light
    private static func poly(_ c: CGContext, _ W: CGFloat, _ H: CGFloat, _ pts: [(CGFloat, CGFloat)]) -> CGPath {
        let p = CGMutablePath()
        p.addLines(between: pts.map { CGPoint(x: $0.0 / 100 * W, y: $0.1 / 100 * H) })
        p.closeSubpath()
        return p
    }
    private static func gradient(_ stops: [(UInt32, CGFloat, CGFloat)]) -> CGGradient {
        CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                   colors: stops.map { SKColor(hex: $0.0, alpha: $0.1).cgColor } as CFArray,
                   locations: stops.map { $0.2 })!
    }
    private static func vertical(_ c: CGContext, _ H: CGFloat, _ g: CGGradient, from y0: CGFloat = 0, to y1: CGFloat? = nil) {
        c.drawLinearGradient(g, start: CGPoint(x: 0, y: y0), end: CGPoint(x: 0, y: y1 ?? H), options: [.drawsBeforeStartLocation, .drawsAfterEndLocation])
    }
    private static func clipped(_ c: CGContext, _ path: CGPath, _ draw: () -> Void) {
        c.saveGState(); c.addPath(path); c.clip(); draw(); c.restoreGState()
    }
    private static func ellipseGlow(_ c: CGContext, center: CGPoint, rx: CGFloat, ry: CGFloat, color: UInt32, alpha: CGFloat) {
        c.saveGState()
        c.translateBy(x: center.x, y: center.y)
        c.scaleBy(x: rx, y: ry)
        c.drawRadialGradient(gradient([(color, alpha, 0), (color, 0, 0.7)]), startCenter: .zero, startRadius: 0, endCenter: .zero, endRadius: 1, options: [])
        c.restoreGState()
    }
    /// linear-gradient(115deg, transparent 35%, colour 48%, transparent 62%), screened
    private static func lightWedge(_ c: CGContext, _ W: CGFloat, _ H: CGFloat, color: UInt32, alpha: CGFloat) {
        let a = 115 * CGFloat.pi / 180
        let dir = CGPoint(x: sin(a), y: -cos(a))
        let len = abs(W * sin(a)) + abs(H * cos(a))
        let mid = CGPoint(x: W / 2, y: H / 2)
        let start = CGPoint(x: mid.x - dir.x * len / 2, y: mid.y - dir.y * len / 2)
        let end = CGPoint(x: mid.x + dir.x * len / 2, y: mid.y + dir.y * len / 2)
        c.saveGState()
        c.setBlendMode(.screen)
        c.drawLinearGradient(gradient([(color, 0, 0.35), (color, alpha, 0.48), (color, 0, 0.62)]), start: start, end: end, options: [])
        c.restoreGState()
    }

    static let leftWall: [(CGFloat, CGFloat)] = [(46, 0), (50, 0), (6, 100), (-6, 100)]
    static let rightWall: [(CGFloat, CGFloat)] = [(50, 0), (54, 0), (106, 100), (94, 100)]

    private static func paintSpeakeasy(_ c: CGContext, _ W: CGFloat, _ H: CGFloat) {
        let u = Theme.u
        c.setFillColor(SKColor(hex: 0x0C0A0D).cgColor); c.fill(CGRect(x: 0, y: 0, width: W, height: H))
        ellipseGlow(c, center: CGPoint(x: W / 2, y: 0), rx: W * 0.35 / 0.7, ry: H * 0.4 / 0.7, color: 0xE8C878, alpha: 0.28)
        let wallGrad = gradient([(0x8A6E37, 1, 0), (0x151014, 1, 0.7)])
        for wall in [leftWall, rightWall] {
            let p = poly(c, W, H, wall)
            clipped(c, p) {
                vertical(c, H, wallGrad)
                // the swirl damask (60px tile), faint
                c.setStrokeColor(SKColor(hex: 0xEDE3D0, alpha: 0.6 * 0.14).cgColor)
                c.setLineWidth(1 * u)
                let t = 60 * u
                var y: CGFloat = 0
                while y < H {
                    var x: CGFloat = 0
                    while x < W { damask(c, at: CGPoint(x: x, y: y), tile: t); x += t }
                    y += t
                }
            }
        }
        lightWedge(c, W, H, color: 0xC6A15B, alpha: 0.22)
        // corner swirl flourishes
        for (cx, cy) in [(false, false), (true, false), (false, true), (true, true)] {
            c.saveGState()
            c.translateBy(x: cx ? W : 0, y: cy ? H : 0)
            c.scaleBy(x: (cx ? -1 : 1) * u, y: (cy ? -1 : 1) * u)
            c.setStrokeColor(SKColor(hex: 0xC6A15B, alpha: 0.16).cgColor)
            c.setLineWidth(1.6); c.setLineCap(.round)
            let p = CGMutablePath()
            p.move(to: CGPoint(x: 2, y: 2)); p.addCurve(to: CGPoint(x: 14, y: 50), control1: CGPoint(x: 2, y: 26), control2: CGPoint(x: 6, y: 42))
            p.move(to: CGPoint(x: 2, y: 2)); p.addCurve(to: CGPoint(x: 50, y: 14), control1: CGPoint(x: 26, y: 2), control2: CGPoint(x: 42, y: 6))
            p.move(to: CGPoint(x: 14, y: 14)); p.addCurve(to: CGPoint(x: 22, y: 34), control1: CGPoint(x: 22, y: 19), control2: CGPoint(x: 25, y: 27))
            p.addCurve(to: CGPoint(x: 10, y: 38), control1: CGPoint(x: 20, y: 39), control2: CGPoint(x: 14, y: 41))
            p.addCurve(to: CGPoint(x: 9, y: 30), control1: CGPoint(x: 7, y: 36), control2: CGPoint(x: 6, y: 32))
            c.addPath(p); c.strokePath()
            c.setFillColor(SKColor(hex: 0xC6A15B, alpha: 0.16).cgColor)
            c.fillEllipse(in: CGRect(x: -0.2, y: -0.2, width: 4.4, height: 4.4))
            c.restoreGState()
        }
        // stepped cove molding at the vanishing point
        for (i, w) in [46.0, 34, 22].enumerated() {
            c.setFillColor(SKColor(hex: 0xC6A15B, alpha: 0.5 - CGFloat(i) * 0.1).cgColor)
            c.fill(CGRect(x: W / 2 - CGFloat(w) * u / 2, y: CGFloat(i) * 4 * u, width: CGFloat(w) * u, height: 3 * u))
        }
    }

    /// One tile of the speakeasy's ogee damask (the web's inline SVG).
    private static func damask(_ c: CGContext, at o: CGPoint, tile t: CGFloat) {
        let k = t / 60
        func p(_ x: CGFloat, _ y: CGFloat) -> CGPoint { CGPoint(x: o.x + x * k, y: o.y + y * k) }
        let path = CGMutablePath()
        path.move(to: p(15, 30))
        path.addCurve(to: p(30, 14), control1: p(15, 20), control2: p(23, 14))
        path.addCurve(to: p(45, 30), control1: p(37, 14), control2: p(45, 20))
        path.addCurve(to: p(30, 46), control1: p(45, 40), control2: p(37, 46))
        path.addCurve(to: p(15, 30), control1: p(23, 46), control2: p(15, 40))
        path.move(to: p(0, 0)); path.addCurve(to: p(30, 15), control1: p(15, 0), control2: p(15, 15))
        path.addCurve(to: p(60, 0), control1: p(45, 15), control2: p(45, 0))
        path.move(to: p(0, 60)); path.addCurve(to: p(30, 45), control1: p(15, 60), control2: p(15, 45))
        path.addCurve(to: p(60, 60), control1: p(45, 45), control2: p(45, 60))
        c.addPath(path); c.strokePath()
    }

    /// A floor running back to a vanishing point at the top of its region,
    /// in squares (`checker`) or as sawdust. `top` is the horizon (% of H).
    private static func floor(_ c: CGContext, _ W: CGFloat, _ H: CGFloat, top: CGFloat, checker: (UInt32, UInt32)?, sawdust: Bool) {
        let u = Theme.u
        let y0 = H * top / 100
        let res: CGFloat = 3 // paint at a third of the resolution
        let w = Int(W / res), h = Int((H - y0) / res)
        guard w > 0, h > 0 else { return }
        let depth = H - y0
        let kx = depth / (56 * u), kz = depth * depth / (40 * u)
        var seed: UInt32 = 7
        func rnd() -> CGFloat { seed = seed &* 1664525 &+ 1013904223; return CGFloat(seed >> 8) / CGFloat(1 << 24) }
        if let (a, b) = checker {
            for j in 0..<h {
                let d = max(1, CGFloat(j) * res + res / 2)
                let z = kz / d
                for i in 0..<w {
                    let x = (CGFloat(i) * res + res / 2 - W / 2) * kx / d
                    let on = (Int(x.rounded(.down)) + Int(z.rounded(.down))) & 1 == 0
                    c.setFillColor(SKColor(hex: on ? a : b).cgColor)
                    c.fill(CGRect(x: CGFloat(i) * res, y: y0 + CGFloat(j) * res, width: res, height: res))
                }
            }
        }
        if sawdust {
            c.setFillColor(SKColor(hex: 0x8E6332).cgColor)
            c.fill(CGRect(x: 0, y: y0, width: W, height: depth))
            for _ in 0..<Int(W * depth / (60 * u * u)) {
                let d = rnd() * depth
                let s = max(0.6, d / depth * 2.4) * u
                c.setFillColor(rnd() > 0.5 ? SKColor(red: 0.47, green: 0.28, blue: 0.12, alpha: 0.35).cgColor
                                            : SKColor(red: 1, green: 0.9, blue: 0.67, alpha: 0.25).cgColor)
                c.fillEllipse(in: CGRect(x: rnd() * W, y: y0 + d, width: s, height: s))
            }
        }
    }

    private static func paintFountain(_ c: CGContext, _ W: CGFloat, _ H: CGFloat, _ L: Layout) {
        let u = Theme.u
        c.setFillColor(SKColor(hex: 0x0D1B1A).cgColor); c.fill(CGRect(x: 0, y: 0, width: W, height: H))
        floor(c, W, H, top: 18, checker: (0xCFC8BC, 0x1E2624), sawdust: false)
        vertical(c, H, gradient([(0x0D1B1A, 1, 0), (0x0D1B1A, 0.85, 0.3), (0x0D1B1A, 0.55, 1)]), from: H * 0.18)
        ellipseGlow(c, center: CGPoint(x: W / 2, y: 0), rx: W * 0.4 / 0.7, ry: H * 0.45 / 0.7, color: 0xFFAACD, alpha: 0.35)
        let wallGrad = gradient([(0xA9E0CF, 1, 0), (0x5FA898, 1, 0.45), (0x10201E, 1, 0.85)])
        for wall in [leftWall, rightWall] {
            let p = poly(c, W, H, wall)
            clipped(c, p) {
                vertical(c, H, wallGrad)
                // white subway tile below the rail (24x12px)
                c.setStrokeColor(SKColor(white: 1, alpha: 0.22).cgColor)
                c.setLineWidth(1 * u)
                let tw = 24 * u, th = 12 * u
                var y = H * 0.44, row = 0
                while y < H {
                    c.move(to: CGPoint(x: 0, y: y)); c.addLine(to: CGPoint(x: W, y: y))
                    var x: CGFloat = row % 2 == 0 ? 0 : tw / 2
                    while x < W { c.move(to: CGPoint(x: x, y: y)); c.addLine(to: CGPoint(x: x, y: y + th)); x += tw }
                    y += th; row += 1
                }
                c.strokePath()
            }
        }
        // the chrome rail along each wall
        c.setFillColor(SKColor(hex: 0xE6EEF0).cgColor)
        c.addPath(poly(c, W, H, [(28.6, 40), (29.4, 40), (27.4, 46), (26.4, 46)])); c.fillPath()
        c.addPath(poly(c, W, H, [(70.6, 40), (71.4, 40), (73.6, 46), (72.6, 46)])); c.fillPath()
    }

    private static func paintCircus(_ c: CGContext, _ W: CGFloat, _ H: CGFloat, _ L: Layout) {
        // the canvas: red and cream stripes from the pole above the frame
        c.setFillColor(SKColor(hex: 0xB3141B).cgColor); c.fill(CGRect(x: 0, y: 0, width: W, height: H))
        let pole = CGPoint(x: W / 2, y: -H * 0.18)
        let R = (W + H) * 2
        c.setFillColor(SKColor(hex: 0xF1E3C6).cgColor)
        var a: CGFloat = 0
        while a < 360 {
            let a0 = (a + 5) * .pi / 180, a1 = (a + 10) * .pi / 180
            c.move(to: pole)
            c.addLine(to: CGPoint(x: pole.x + sin(a0) * R, y: pole.y - cos(a0) * R))
            c.addLine(to: CGPoint(x: pole.x + sin(a1) * R, y: pole.y - cos(a1) * R))
            c.closePath()
            a += 10
        }
        c.fillPath()
        // shaded up top for the scoreboard, and falling into shadow below
        vertical(c, H, gradient([(0x14060A, 0.7, 0), (0x14060A, 0.55, 0.11), (0x14060A, 0.2, 0.16), (0x14060A, 0.55, 0.35), (0x0C0408, 0.92, 0.7)]))
        floor(c, W, H, top: 18, checker: nil, sawdust: true)
        vertical(c, H, gradient([(0x14060A, 1, 0), (0x14060A, 0.7, 0.3), (0x14060A, 0.4, 1)]), from: H * 0.18)
        // bunting swagged across the top
        let u = Theme.u
        let bh: CGFloat = 30 * u
        c.setStrokeColor(SKColor(hex: 0x3B2A1A).cgColor)
        c.setLineWidth(0.5 * u)
        c.move(to: CGPoint(x: 0, y: bh * 2 / 34))
        c.addQuadCurve(to: CGPoint(x: W, y: bh * 2 / 34), control: CGPoint(x: W / 2, y: bh * 18 / 34))
        c.strokePath()
        let colors: [UInt32] = [0xF2B705, 0x1E5AA8, 0xD7263D, 0x2E9E5B]
        for i in 0..<13 {
            let x = 3 + CGFloat(i) * 7.7
            let y = 2 + 16 * (1 - pow((x - 50) / 50, 2)) * 0.95
            let px = W / 100, py = bh / 34
            c.setFillColor(SKColor(hex: colors[i % 4]).cgColor)
            c.move(to: CGPoint(x: (x - 2.6) * px, y: y * py))
            c.addLine(to: CGPoint(x: (x + 2.6) * px, y: y * py))
            c.addLine(to: CGPoint(x: x * px, y: (y + 9) * py))
            c.closePath(); c.fillPath()
        }
    }
}
