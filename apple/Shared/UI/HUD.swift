import SpriteKit

/// The strip across the top (HUD.jsx): score and "LEVEL n · k TO GO" on the
/// left; the lives pill, mute and settings on the right.
final class HUDView: SKNode {
    let muteButton: IconButton
    let settingsButton: IconButton
    private let score: SKLabelNode
    private let level: SKLabelNode
    private let pill = SKShapeNode()
    private let livesLabel: SKLabelNode
    private let head: SKSpriteNode
    private var shown = (score: -1, level: "", lives: -1, muted: false)
    private let iconSize: CGFloat

    init(width: CGFloat, centerY: CGFloat, margin: CGFloat, onMute: @escaping () -> Void, onSettings: @escaping () -> Void) {
        let u = Theme.u
        iconSize = 18 * u
        muteButton = IconButton(path: Icons.speaker(muted: false, size: iconSize), action: onMute)
        settingsButton = IconButton(path: Icons.gear(size: iconSize), action: onSettings)
        score = Theme.label("0000", .display, 18, color: Theme.cream, weight: 700, tracking: 0.03, align: .left)
        level = Theme.label(" ", .body, 10, color: Theme.brass.withAlphaComponent(0.8), tracking: 0.18, align: .left)
        livesLabel = Theme.label("×3", .display, 18, color: Theme.brass, weight: 700, tracking: 0.03, align: .left)
        head = Theme.image("player-head.png", height: 22)
        super.init()
        score.position = CGPoint(x: margin, y: centerY + 6 * u)
        level.position = CGPoint(x: margin, y: centerY - 11 * u)
        addChild(score); addChild(level)

        var x = width - margin
        settingsButton.position = CGPoint(x: x - 9 * u, y: centerY)
        x -= 18 * u + 14 * u
        muteButton.position = CGPoint(x: x - 9 * u, y: centerY)
        x -= 18 * u + 14 * u
        // the lives pill, laid out right to left
        let pillW: CGFloat = 62 * u, pillH: CGFloat = 30 * u
        pill.path = CGPath(roundedRect: CGRect(x: -pillW / 2, y: -pillH / 2, width: pillW, height: pillH), cornerWidth: pillH / 2, cornerHeight: pillH / 2, transform: nil)
        pill.fillColor = Theme.ink.withAlphaComponent(0.55)
        pill.lineWidth = u
        pill.position = CGPoint(x: x - pillW / 2, y: centerY)
        head.position = CGPoint(x: -pillW / 2 + 8 * u + head.size.width / 2, y: 0)
        livesLabel.position = CGPoint(x: head.position.x + head.size.width / 2 + 5 * u, y: 0)
        pill.addChild(head); pill.addChild(livesLabel)
        for n in [pill, muteButton, settingsButton] as [SKNode] { addChild(n) }
        #if os(tvOS)
        // nothing to tap on a TV: the menu button opens settings
        muteButton.isHidden = true
        settingsButton.isHidden = true
        pill.position.x = width - margin - pillW / 2
        #endif
    }
    required init?(coder: NSCoder) { fatalError() }

    var buttons: [ButtonNode] { [muteButton, settingsButton] }

    func update(score s: Int, levelText: String?, lives: Int, muted: Bool) {
        if s != shown.score { score.setText(String(format: "%04d", s)); shown.score = s }
        let lt = levelText ?? " "
        if lt != shown.level { level.setText(lt); shown.level = lt }
        if lives != shown.lives {
            livesLabel.setText("×\(lives)")
            let low = lives <= 2
            livesLabel.attributedText = Theme.label("×\(lives)", .display, 18, color: low ? Theme.danger : Theme.brass, weight: 700, tracking: 0.03, align: .left).attributedText
            pill.strokeColor = low ? SKColor(hex: 0x7A1F2B) : Theme.brass.withAlphaComponent(0.5)
            shown.lives = lives
        }
        if muted != shown.muted {
            muteButton.setPath(Icons.speaker(muted: muted, size: iconSize))
            shown.muted = muted
        }
    }
}

/// The little shows that play over the bar (App.jsx): the dachshund dancing
/// for a grabbed hot dog, the "EXTRA LIFE" banner.
enum Effects {
    /// Celebration.jsx: the dachshund pops up top-centre and dances for the
    /// whole show while the points float up and fade.
    static func celebration(points: Int, showMs: Double, at p: CGPoint) -> SKNode {
        let u = Theme.u
        let n = SKNode()
        n.position = p
        let dog = Theme.image("dachshund.png", height: 48)
        dog.anchorPoint = CGPoint(x: 0.5, y: 0)
        dog.setScale(0.7); dog.alpha = 0
        let bounce = SKAction.sequence([
            .group([.moveBy(x: 0, y: 6 * u, duration: 0.15), .rotate(toAngle: 0.12, duration: 0.15)]),
            .group([.moveBy(x: 0, y: -6 * u, duration: 0.15), .rotate(toAngle: -0.12, duration: 0.15)]),
        ])
        dog.run(.sequence([
            .group([.fadeIn(withDuration: 0.2), .scale(to: 1, duration: 0.2)]),
            .repeat(bounce, count: Int(max(1, (showMs / 1000 - 0.4) / 0.3))),
            .group([.fadeOut(withDuration: 0.2), .scale(to: 0.7, duration: 0.2)]),
        ]))
        let pts = Theme.label("+\(points)", .display, 14, color: Theme.cream, weight: 700)
        pts.position = CGPoint(x: 0, y: -10 * u)
        pts.setScale(0.7); pts.alpha = 0
        pts.run(.sequence([
            .group([.fadeIn(withDuration: 0.16), .scale(to: 1.1, duration: 0.16), .moveBy(x: 0, y: 6 * u, duration: 0.16)]),
            .group([.scale(to: 1, duration: 0.12), .moveBy(x: 0, y: 4 * u, duration: 0.12)]),
            .group([.fadeOut(withDuration: 0.52), .moveBy(x: 0, y: 24 * u, duration: 0.52)]),
        ]))
        n.addChild(dog); n.addChild(pts)
        n.run(.sequence([.wait(forDuration: showMs / 1000 + 0.3), .removeFromParent()]))
        return n
    }

    static func extraLife(at p: CGPoint) -> SKNode {
        let u = Theme.u
        let n = SKNode()
        let l = Theme.label("EXTRA LIFE", .display, 20, color: SKColor(hex: 0xF2D58C), weight: 700, tracking: 0.18)
        let bg = SKShapeNode(rectOf: CGSize(width: l.frame.width + 40 * u, height: l.frame.height + 18 * u), cornerRadius: 8 * u)
        bg.fillColor = Theme.ink.withAlphaComponent(0.85)
        bg.strokeColor = SKColor(hex: 0xE8C878, alpha: 0.6)
        bg.lineWidth = u
        n.addChild(bg); n.addChild(l)
        n.position = p
        n.alpha = 0
        n.run(.sequence([.fadeIn(withDuration: 0.2), .wait(forDuration: 1.8), .fadeOut(withDuration: 0.2), .removeFromParent()]))
        return n
    }
}
