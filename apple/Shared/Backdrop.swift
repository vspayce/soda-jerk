import SpriteKit
#if canImport(UIKit)
import UIKit
#endif

/// The room behind the bars, per venue — a simpler take on the web game's
/// PerspectiveBackdrop.jsx: the venue's colours, its centrepiece (the
/// speakeasy's organ, Pop's neon sign, the Big Top's marquee) and, for the
/// circus, its tent stripes.
enum Backdrop {
    static func build(venue: String, in layer: SKNode, size: CGSize, layout L: Layout) {
        let colors: (top: UInt32, bottom: UInt32)
        switch venue {
        case "fountain": colors = (0x2E5C53, 0x0D1B1A)
        case "circus": colors = (0x6E1218, 0x14060A)
        default: colors = (0x3A2C17, 0x0C0A0D)
        }
        let bg = SKSpriteNode(texture: gradient(size: size, top: colors.top, bottom: colors.bottom))
        bg.size = size
        bg.position = CGPoint(x: size.width / 2, y: size.height / 2)
        layer.addChild(bg)

        if venue == "circus" {
            let stripes = SKSpriteNode(texture: tentStripes(size: size))
            stripes.size = size
            stripes.position = bg.position
            stripes.alpha = 0.55
            layer.addChild(stripes)
        }

        // the centrepiece sits behind the top bar, like the web's
        guard let top = L.laneCenters.first else { return }
        let y = top + L.laneH * 0.42
        switch venue {
        case "fountain":
            for (blur, alpha) in [(true, 0.6), (false, 1.0)] {
                let sign = SKLabelNode(fontNamed: "SnellRoundhand-Black")
                sign.text = "Soda Fountain"
                sign.fontSize = L.laneH * 0.42
                sign.fontColor = blur ? SKColor(hex: 0xFF2E8A) : SKColor(hex: 0xFFE3F1)
                sign.alpha = alpha
                sign.position = CGPoint(x: size.width / 2, y: y)
                if blur {
                    let glow = SKEffectNode()
                    glow.filter = CIFilter(name: "CIGaussianBlur", parameters: ["inputRadius": 10])
                    glow.addChild(sign)
                    layer.addChild(glow)
                } else {
                    layer.addChild(sign)
                }
            }
        case "circus":
            let sign = SKLabelNode(fontNamed: "AvenirNext-Heavy")
            sign.text = "THE BIG TOP"
            sign.fontSize = L.laneH * 0.3
            sign.fontColor = SKColor(hex: 0xFFD447)
            sign.position = CGPoint(x: size.width / 2, y: y)
            let plate = SKShapeNode(rectOf: CGSize(width: sign.frame.width + L.laneH * 0.4, height: L.laneH * 0.48), cornerRadius: 8)
            plate.fillColor = SKColor(hex: 0x5A0A0E, alpha: 0.9)
            plate.strokeColor = SKColor(hex: 0xFFD447)
            plate.lineWidth = 3
            plate.position = CGPoint(x: size.width / 2, y: y + L.laneH * 0.1)
            layer.addChild(plate)
            layer.addChild(sign)
        default:
            let organ = SKSpriteNode(texture: Art.texture("wurlitzer.png"))
            organ.size = organ.texture!.size().fitting(height: L.laneH * 1.1)
            organ.position = CGPoint(x: size.width / 2, y: top + L.laneH * 0.35)
            organ.alpha = 0.95
            layer.addChild(organ)
        }
    }

    private static func gradient(size: CGSize, top: UInt32, bottom: UInt32) -> SKTexture {
        let r = UIGraphicsImageRenderer(size: CGSize(width: 4, height: 256))
        let img = r.image { ctx in
            let cs = CGColorSpaceCreateDeviceRGB()
            let g = CGGradient(colorsSpace: cs, colors: [SKColor(hex: top).cgColor, SKColor(hex: bottom).cgColor] as CFArray, locations: [0, 0.75])!
            ctx.cgContext.drawLinearGradient(g, start: .zero, end: CGPoint(x: 0, y: 256), options: [.drawsAfterEndLocation])
        }
        return SKTexture(image: img)
    }

    /// Red and cream canvas stripes radiating from a tent pole above the
    /// screen, fading toward the floor.
    private static func tentStripes(size: CGSize) -> SKTexture {
        let w: CGFloat = 480, h = w * size.height / max(1, size.width)
        let r = UIGraphicsImageRenderer(size: CGSize(width: w, height: h))
        let img = r.image { ctx in
            let c = ctx.cgContext
            let pole = CGPoint(x: w / 2, y: -h * 0.18)
            let n = 72
            for i in 0..<n where i % 2 == 0 {
                let a0 = CGFloat(i) / CGFloat(n) * .pi, a1 = CGFloat(i + 1) / CGFloat(n) * .pi
                c.move(to: pole)
                c.addLine(to: CGPoint(x: pole.x + cos(a0) * h * 3, y: pole.y + sin(a0) * h * 3))
                c.addLine(to: CGPoint(x: pole.x + cos(a1) * h * 3, y: pole.y + sin(a1) * h * 3))
                c.closePath()
            }
            c.setFillColor(SKColor(hex: 0xF1E3C6).cgColor)
            c.fillPath()
            // fade to nothing by the floor
            let cs = CGColorSpaceCreateDeviceRGB()
            let fade = CGGradient(colorsSpace: cs, colors: [SKColor(white: 0, alpha: 0).cgColor, SKColor(white: 0, alpha: 1).cgColor] as CFArray, locations: [0.2, 0.7])!
            c.setBlendMode(.destinationOut)
            c.drawLinearGradient(fade, start: .zero, end: CGPoint(x: 0, y: h), options: [.drawsAfterEndLocation])
        }
        return SKTexture(image: img)
    }
}
