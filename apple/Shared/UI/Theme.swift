import SpriteKit
import CoreText
#if canImport(UIKit)
import UIKit
#endif

/// The web game's look, for the native screens: its palette (tailwind.config
/// and index.css), its three fonts (bundled in Fonts/, SIL Open Font License)
/// and its sizes. Web sizes are CSS pixels on a ~390px-wide phone; `u`
/// scales them to this screen, so a screen laid out "like the web" comes out
/// the same proportions on a phone and on a TV.
enum Theme {
    static let ink = SKColor(hex: 0x151014)
    static let cream = SKColor(hex: 0xEDE3D0)
    static let creamLight = SKColor(hex: 0xFCE4C4)
    static let brass = SKColor(hex: 0xC6A15B)
    static let brassLight = SKColor(hex: 0xF0D998)
    static let signRed = SKColor(hex: 0x9B2E1A)
    static let danger = SKColor(hex: 0xE0596B)

    /// Web px → points on this screen.
    static var u: CGFloat = 1

    static func configure(for size: CGSize) {
        #if os(tvOS)
        u = size.height / 640
        #else
        u = min(size.width, size.height * 0.6) / 390
        #endif
    }

    // ------------------------------------------------------------ fonts

    enum Face { case display, script, body }

    private static var registered = false
    static func registerFonts() {
        guard !registered else { return }
        registered = true
        for name in ["PlayfairDisplay", "BerkshireSwash-Regular", "Inter"] {
            if let url = Bundle.main.url(forResource: name, withExtension: "ttf") {
                CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
            }
        }
    }

    /// The face at a web px size and CSS weight. Playfair and Inter are
    /// variable fonts, so the weight is set on their `wght` axis.
    static func font(_ face: Face, _ px: CGFloat, weight: CGFloat = 400) -> UIFont {
        registerFonts()
        let size = px * u
        let family: String
        switch face {
        case .display: family = "Playfair Display"
        case .script: return UIFont(name: "BerkshireSwash-Regular", size: size) ?? .systemFont(ofSize: size)
        case .body: family = "Inter"
        }
        let wght = 2003265652 // 'wght'
        let desc = UIFontDescriptor(fontAttributes: [
            .family: family,
            UIFontDescriptor.AttributeName(rawValue: kCTFontVariationAttribute as String): [wght: weight],
        ])
        return UIFont(descriptor: desc, size: size)
    }

    // ------------------------------------------------------------ text

    /// A label in the web's style. `tracking` is letter-spacing in em, as
    /// tailwind's tracking-[…] classes give it; `width` wraps it.
    static func label(_ text: String, _ face: Face, _ px: CGFloat, color: SKColor = cream, weight: CGFloat = 400,
                      tracking: CGFloat = 0, width: CGFloat? = nil, align: NSTextAlignment = .center,
                      lineHeight: CGFloat = 1.35) -> SKLabelNode {
        let font = font(face, px, weight: weight)
        let para = NSMutableParagraphStyle()
        para.alignment = align
        para.lineHeightMultiple = lineHeight
        let l = SKLabelNode()
        l.attributedText = NSAttributedString(string: text, attributes: [
            .font: font, .foregroundColor: color, .kern: tracking * font.pointSize, .paragraphStyle: para,
        ])
        if let width {
            l.numberOfLines = 0
            l.preferredMaxLayoutWidth = width
            l.lineBreakMode = .byWordWrapping
        }
        l.horizontalAlignmentMode = align == .left ? .left : align == .right ? .right : .center
        l.verticalAlignmentMode = .center
        return l
    }

    /// A picture from art/, at a web px height.
    static func image(_ file: String, height px: CGFloat) -> SKSpriteNode {
        let s = SKSpriteNode(texture: Art.texture(file))
        s.size = s.texture!.size().fitting(height: px * u)
        return s
    }

    /// The translucent ink a web overlay sits on (bg-ink/90 etc).
    static func backdrop(_ size: CGSize, alpha: CGFloat) -> SKSpriteNode {
        // (a colour sprite ignores its colour's alpha — fade the node instead)
        let s = SKSpriteNode(color: ink, size: CGSize(width: size.width * 2, height: size.height * 2))
        s.alpha = alpha
        s.position = CGPoint(x: size.width / 2, y: size.height / 2)
        return s
    }
}

extension SKLabelNode {
    /// Re-sets an attributed label's text, keeping its attributes.
    func setText(_ text: String) {
        guard let a = attributedText, a.length > 0 else { self.text = text; return }
        attributedText = NSAttributedString(string: text, attributes: a.attributes(at: 0, effectiveRange: nil))
    }
}
