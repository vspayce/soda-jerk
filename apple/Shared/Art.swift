import SpriteKit
#if canImport(UIKit)
import UIKit
#endif

/// Textures from the web game's art folder (copied into the app bundle as
/// `art/`), loaded once each and cached.
enum Art {
    private static var cache: [String: SKTexture] = [:]
    private static var sheets: [String: [SKTexture]] = [:]

    static func texture(_ name: String) -> SKTexture {
        if let t = cache[name] { return t }
        let t: SKTexture
        if let path = Bundle.main.path(forResource: name, ofType: nil, inDirectory: "art"),
           let image = UIImage(contentsOfFile: path) {
            t = SKTexture(image: image)
        } else {
            print("missing art:", name)
            t = SKTexture()
        }
        t.filteringMode = .linear
        cache[name] = t
        return t
    }

    /// The frames of a horizontal sprite sheet, left to right.
    static func frames(_ name: String, count: Int) -> [SKTexture] {
        let key = "\(name)#\(count)"
        if let f = sheets[key] { return f }
        let sheet = texture(name)
        let w = 1.0 / CGFloat(count)
        let f = (0..<count).map { SKTexture(rect: CGRect(x: CGFloat($0) * w, y: 0, width: w, height: 1), in: sheet) }
        sheets[key] = f
        return f
    }

    // Patron files: patron.png, patron2.png… and the drink picks the colour
    // (the same rule as patronArt.js).
    static func patronBase(_ type: Int) -> String { type == 0 ? "patron" : "patron\(type + 1)" }
    static func drinkSuffix(_ drink: Int) -> String { drink == 0 ? "orange" : "pink" }
    static func patronPortrait(_ type: Int, _ drink: Int) -> String { "\(patronBase(type))-\(drinkSuffix(drink)).png" }
    static func patronWalk(_ type: Int, _ drink: Int) -> String { "\(patronBase(type))-\(drinkSuffix(drink))-walk.png" }
    static func patronHeld(_ type: Int, _ drink: Int) -> String { "\(patronBase(type))-\(drinkSuffix(drink))-held.png" }
}

/// Colours given as the web game's hex strings.
extension SKColor {
    convenience init(hex: UInt32, alpha: CGFloat = 1) {
        self.init(red: CGFloat((hex >> 16) & 0xFF) / 255,
                  green: CGFloat((hex >> 8) & 0xFF) / 255,
                  blue: CGFloat(hex & 0xFF) / 255,
                  alpha: alpha)
    }
}
